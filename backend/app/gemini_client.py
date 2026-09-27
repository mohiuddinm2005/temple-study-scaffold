import asyncio
import logging
import time
from collections.abc import AsyncIterator

from google import genai
from google.genai import types as genai_types

from app.config import get_settings

logger = logging.getLogger("nemo.gemini")

# Per docs/AI_AND_HABITS.md: one short next study task, an active-recall or
# practice step, a time box, and a way to check the answer. No PII, no full
# Canvas feed, no grade talk in the prompt or the output -- the model has no
# way to know a student's actual grades, so asking it to predict an
# "achievable grade" produces confident-sounding guesses with no basis. Keep
# this guardrail; it protects students from misleading academic-standing
# claims, not just legal exposure.

_SYSTEM_PROMPT = (
    "You are a study coach. Given an assignment title and a topic a student finds "
    "difficult, write ONE short, concrete next study task: one active-recall or "
    "practice step, a time box, and how to check the answer. Two to four sentences. "
    "No grade talk, no moralizing, no guarantees, no academic-standing claims."
)


def _template_task(difficult_topic: str, minutes: int) -> str:
    return (
        f"For the next {minutes} minutes, do one active-recall pass on \"{difficult_topic}\": "
        "close your notes, write down everything you remember without looking, then check it "
        "against the source and circle exactly what you missed."
    )


async def _stream_producer(
    client: genai.Client, model: str, prompt: str, max_tokens: int, queue: asyncio.Queue
) -> None:
    try:
        stream = await client.aio.models.generate_content_stream(
            model=model,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                max_output_tokens=max_tokens,
                system_instruction=_SYSTEM_PROMPT,
            ),
        )
        async for chunk in stream:
            if chunk.text:
                await queue.put(("chunk", chunk.text))
        await queue.put(("done", None))
    except Exception as exc:  # noqa: BLE001 - any provider failure falls back to the template
        # THIS is the line that was missing: log the real error so failures can be traced back
        logger.exception("Gemini streaming request failed, falling back to template")
        await queue.put(("error", str(exc)))


async def generate_study_task(
    assignment_title: str, difficult_topic: str, minutes: int
) -> AsyncIterator[tuple[str, str]]:
    """Yields ("chunk", text) pairs as they stream in, then a final ("done", source) pair
    where source is "model" or "template". Falls back to a deterministic template if the
    API key is missing, the request errors, or it exceeds the configured timeout -- unless
    the model had already started streaming, in which case the partial model output stands."""
    settings = get_settings()
    minutes = max(5, min(int(minutes), 30))

    if not settings.gemini_api_key:
        logger.warning("GEMINI_API_KEY is not set; using template fallback")
        yield ("chunk", _template_task(difficult_topic, minutes))
        yield ("done", "template")
        return

    prompt = (
        f"Assignment: {assignment_title[:500]}\n"
        f"Difficult topic: {difficult_topic[:500]}\n"
        f"Minutes available: {minutes}"
    )
    client = genai.Client(api_key=settings.gemini_api_key)
    queue: asyncio.Queue = asyncio.Queue()
    producer = asyncio.create_task(
        _stream_producer(client, settings.gemini_model, prompt, settings.gemini_max_output_tokens, queue)
    )

    deadline = time.monotonic() + settings.gemini_timeout_seconds
    got_any_text = False
    finished_cleanly = False
    try:
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                logger.warning("Gemini request timed out after %ss", settings.gemini_timeout_seconds)
                raise TimeoutError
            kind, payload = await asyncio.wait_for(queue.get(), timeout=remaining)
            if kind == "chunk":
                got_any_text = True
                yield ("chunk", payload)
            elif kind == "done":
                finished_cleanly = True
                break
            else:  # "error" -- already logged in _stream_producer above
                break
    except (TimeoutError, asyncio.TimeoutError):
        pass
    finally:
        producer.cancel()

    if got_any_text:
        yield ("done", "model")
    else:
        yield ("chunk", _template_task(difficult_topic, minutes))
        yield ("done", "template")