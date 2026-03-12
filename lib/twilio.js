import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function makeReminderCall({ toNumber, eventTitle, startTime, minutesBefore = 10 }) {
  const timeStr = new Date(startTime).toLocaleTimeString("en-IN", {
    hour:     "2-digit",
    minute:   "2-digit",
    timeZone: "Asia/Kolkata",
  });

  const message =
    `Hello! This is your CallerBot meeting reminder. ` +
    `You have a meeting titled ${eventTitle} ` +
    `starting in ${minutesBefore} minutes at ${timeStr}. ` +
    `Please get ready. Goodbye!`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">${message}</Say>
  <Pause length="1"/>
  <Say voice="alice" language="en-IN">${message}</Say>
</Response>`;

  const call = await client.calls.create({
    twiml,
    to:   toNumber,
    from: process.env.TWILIO_FROM_NUMBER,
  });

  return call.sid;
}
