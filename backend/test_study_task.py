import asyncio
import json
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.gemini_client import generate_study_task, _stream_producer


class StudyTaskTests(unittest.IsolatedAsyncioTestCase):
    async def test_stream_supports_both_sdk_return_types(self):
        async def stream(**kwargs):
            yield SimpleNamespace(text='A specific study task.')

        async def awaitable_stream(**kwargs):
            return stream(**kwargs)

        for method in (stream, awaitable_stream):
            with self.subTest(method=method.__name__):
                client = SimpleNamespace(aio=SimpleNamespace(models=SimpleNamespace(generate_content_stream=method)))
                queue = asyncio.Queue()
                await _stream_producer(client, 'test', 'test', 300, queue)
                self.assertEqual(await queue.get(), ('chunk', 'A specific study task.'))
                self.assertEqual(await queue.get(), ('done', None))

    async def test_missing_key_uses_assignment_specific_fallback(self):
        with patch('app.gemini_client.get_settings', return_value=SimpleNamespace(gemini_api_key='')):
            coding = [event async for event in generate_study_task('Unix Commands', '', 15, 'CIS-2107')]
            writing = [event async for event in generate_study_task('Argument essay', '', 15, 'ENG-0802')]
            math = [event async for event in generate_study_task('Derivatives', '', 15, 'Calculus')]
        self.assertIn('expected output', coding[0][1])
        self.assertIn('CIS-2107', coding[0][1])
        self.assertIn('Unix Commands', coding[0][1])
        self.assertIn('evidence', writing[0][1])
        self.assertIn('solve', math[0][1])
        self.assertEqual(coding[-1], ('done', 'template'))

    async def test_model_receives_course_and_assignment_without_difficulty(self):
        settings = SimpleNamespace(gemini_api_key='test', gemini_model='test',
                                   gemini_max_output_tokens=300, gemini_timeout_seconds=2)
        captured = {}

        async def producer(client, model, prompt, max_tokens, queue):
            captured.update(json.loads(prompt))
            await queue.put(('chunk', 'Practice one Unix command.'))
            await queue.put(('done', None))

        with patch('app.gemini_client.get_settings', return_value=settings), \
             patch('app.gemini_client.genai.Client'), \
             patch('app.gemini_client._stream_producer', side_effect=producer):
            events = [event async for event in generate_study_task('Unix Commands', '', 15, 'CIS-2107')]
        self.assertEqual(captured['assignment'], 'Unix Commands')
        self.assertEqual(captured['course'], 'CIS-2107')
        self.assertEqual(captured['difficult_topic'], '')
        self.assertEqual(events[-1], ('done', 'model'))


if __name__ == '__main__':
    unittest.main()
