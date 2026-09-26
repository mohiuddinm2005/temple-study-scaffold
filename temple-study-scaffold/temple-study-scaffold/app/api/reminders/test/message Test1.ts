import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_API_KEY!,
  process.env.TWILIO_API_SECRET!,
  {
    accountSid: process.env.TWILIO_ACCOUNT_SID!,
  }
);

export async function sendSms(
  to: string,
  body: string
) {
  const message = await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
    body,
  });

  return {
    id: message.sid,
    status: message.status,
  };
}