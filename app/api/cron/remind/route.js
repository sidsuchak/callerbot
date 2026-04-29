// app/api/cron/remind/route.js
// Vercel Cron Job — runs every minute
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { google } from "googleapis";
import twilio from "twilio";

const WINDOW_SECONDS = 120;
const twilioClient   = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

async function refreshTokenIfNeeded(user) {
  if (!user.google_refresh_token) throw new Error("No refresh token for " + user.email);
  const expiry = user.google_token_expiry ? new Date(user.google_token_expiry) : null;
  if (expiry && expiry > new Date(Date.now() + 5 * 60 * 1000)) return user.google_access_token;

  const oauthClient = getOAuthClient();
  oauthClient.setCredentials({ refresh_token: user.google_refresh_token });
  const { credentials } = await oauthClient.refreshAccessToken();

  await supabaseAdmin.from("users").update({
    google_access_token: credentials.access_token,
    google_token_expiry: new Date(credentials.expiry_date).toISOString(),
  }).eq("id", user.id);

  return credentials.access_token;
}

async function getAcceptedMeetings(user, accessToken) {
  const oauthClient = getOAuthClient();
  oauthClient.setCredentials({ access_token: accessToken, refresh_token: user.google_refresh_token });
  const calendar = google.calendar({ version: "v3", auth: oauthClient });

  const now     = new Date();
  const in24hrs = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const res = await calendar.events.list({
    calendarId: user.calendar_id,
    timeMin:    now.toISOString(),
    timeMax:    in24hrs.toISOString(),
    singleEvents: true,
    orderBy:    "startTime",
  });

  return (res.data.items || []).filter((event) => {
    const organizer = event.organizer || {};
    const attendees = event.attendees || [];
    if (organizer.email === user.calendar_id) return true;
    const self = attendees.find((a) => a.email === user.calendar_id);
    return self?.responseStatus === "accepted";
  });
}

async function wasEventCalled(userId, eventId) {
  const { data } = await supabaseAdmin
    .from("called_events").select("id")
    .eq("user_id", userId).eq("event_id", eventId).maybeSingle();
  return !!data;
}

async function markEventCalled(userId, eventId) {
  await supabaseAdmin.from("called_events")
    .upsert({ user_id: userId, event_id: eventId }, { onConflict: "user_id,event_id" });
}

async function placeCall(user, event, startTime) {
  const timeStr = startTime.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata",
  });
  const title   = event.summary || "Untitled Meeting";
  const minutes = user.reminder_minutes || 10;
  const message = `Hello! This is your CallerBot reminder. You have a meeting titled ${title} starting in ${minutes} minutes at ${timeStr}. Please get ready. Goodbye!`;
  const twiml   = `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice" language="en-IN">${message}</Say><Pause length="1"/><Say voice="alice" language="en-IN">${message}</Say></Response>`;

  const call = await twilioClient.calls.create({
    twiml, to: user.phone_number, from: process.env.TWILIO_FROM_NUMBER,
  });
  return call.sid;
}

export async function GET(request) {
  // Verify request is from Vercel cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: users, error } = await supabaseAdmin
    .from("users").select("*")
    .eq("is_active", true)
    .not("phone_number", "is", null)
    .not("google_access_token", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = [];

  for (const user of users) {
    try {
      const accessToken = await refreshTokenIfNeeded(user);
      const meetings    = await getAcceptedMeetings(user, accessToken);
      const now         = new Date();
      const minutes     = user.reminder_minutes || 10;
      const windowMins  = WINDOW_SECONDS / 60;

      for (const event of meetings) {
        const startTime = event.start?.dateTime ? new Date(event.start.dateTime) : null;
        if (!startTime) continue;

        const minutesUntil = (startTime - now) / 1000 / 60;
        console.log(`[${user.email}] "${event.summary}" in ${minutesUntil.toFixed(1)} mins`);

        if (minutesUntil >= minutes - windowMins && minutesUntil <= minutes + windowMins) {
          const alreadyCalled = await wasEventCalled(user.id, event.id);
          if (!alreadyCalled) {
            const sid = await placeCall(user, event, startTime);
            await markEventCalled(user.id, event.id);
            results.push({ user: user.email, event: event.summary, sid });
            console.log(`📞 Called ${user.phone_number} for "${event.summary}" | SID: ${sid}`);
          }
        }
      }
    } catch (err) {
      console.error(`Error processing ${user.email}: ${err.message}`);
      results.push({ user: user.email, error: err.message });
    }
  }

  return NextResponse.json({ ok: true, processed: users.length, results });
}
