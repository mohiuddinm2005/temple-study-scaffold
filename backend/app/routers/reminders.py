import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.twilio_client import send_sms

router = APIRouter(prefix="/api/reminders", tags=["reminders"])
logger = logging.getLogger("nemo.reminders")

class TestReminderRequest(BaseModel):
    phone_number: str = Field(pattern=r"^\+[1-9]\d{7,14}$")

@router.post("/test")
def send_test_reminder(payload: TestReminderRequest):
    try:
        # Twilio trial accounts accept predefined template identifiers only.
        message_sid = send_sms(payload.phone_number, "sms_appointment_reminders")
    except Exception as exc:
        logger.exception("Twilio reminder send failed")
        raise HTTPException(status_code=502, detail="Twilio failed to send the reminder") from exc

    return {"status": "sent", "message_sid": message_sid}
