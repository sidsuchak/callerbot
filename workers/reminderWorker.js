#!/usr/bin/env node
/**
 * CallerBot Reminder Worker
 * =========================
 * Runs as a separate long-lived process (not a Next.js route).
 * Polls all active users from Supabase every 60s and places
 * Twilio calls 10 minutes before their accepted meetings.
 *
 * Deploy this separately on Railway or Render as a background worker.
 *
 * Run locally:
 *   node workers/reminderWorker.js
 *
 * Required env vars (same .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 */

require("dotenv").config({ path: ".env.local" });

const { createClient }              = require("@supabase/supabase-js");
const { google }                    = require("googleapis");
const twilio                        = require("twilio");

// ── Clients ──────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ── Config ───────────────────────────────────────────────
const CHECK_INTERVAL_MS = 60 * 1000; // 60 seconds
const WINDOW_SECONDS    = 60;        // ±60s trigger window

// ── Logging ──────────────────────────────────────────────
function log(level, msg) {
  console.log(`${new Date().toISOString()} [${level}] ${msg}`);
}

// ── Google Calendar ──────────────────────────────────────
function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

async function refreshTokenIfNeeded(user) {
  const expiry = new Date(user.google_token_expiry);
  if (expiry > new Date(Date.now() + 5 * 60 * 1000)) {
    return user.google_access_token; // Still valid
  }

  const oauthClient = getOAuthClient();
  oauthClient.setCredentials({ refresh_token: user.google_refresh_token });
  const { credentials } = await oauthClient.refreshAccessToken();

  // Save new token to DB
  await supabase
    .from("users")
    .update({
      google_access_token: credentials.access_token,
      google_token_expiry: new Date(credentials.expiry_date).toISOString(),
    })
    .eq("id", user.id);

  return credentials.access_token;
}

async function getAcceptedMeetings(user, accessToken) {
  const oauthClient = getOAuthClient();
  oauthClient.setCredentials({
    access_token:  accessToken,
    refresh_token: user.google_refresh_token,
  });
  const calendar = google.calendar({ version: "v3", auth: oauthClient });

  const now     = new Date();
  const in24hrs = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const res = await calendar.events.list({
    calendarId:   user.calendar_id,
    timeMin:      now.toISOString(),
    timeMax:      in24hrs.toISOString(),
    singleEvents: true,
    orderBy:      "startTime",
  });

  return (res.data.items || []).filter((event) => {
    const organizer = event.organizer || {};
    const attendees = event.attendees || [];
    if (organizer.email === user.calendar_id) return true;
    const self = attendees.find((a) => a.email === user.calendar_id);
    return self?.responseStatus === "accepted";
  });
}

// ── Twilio Call ──────────────────────────────────────────
async function placeCall(user, event, startTime) {
  const timeStr = startTime.toLocaleTimeString("en-IN", {
    hour:     "2-digit",
    minute:   "2-digit",
    timeZone: "Asia/Kolkata",
  });

  const title   = event.summary || "Untitled Meeting";
  const minutes = user.reminder_minutes || 10;

  const message =
    `Hello! This is your CallerBot reminder. ` +
    `You have a meeting titled ${title} ` +
    `starting in ${minutes} minutes at ${timeStr}. ` +
    `Please get ready. Goodbye!`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">${message}</Say>
  <Pause length="1"/>
  <Say voice="alice" language="en-IN">${message}</Say>
</Response>`;

  const call = await twilioClient.calls.create({
    twiml,
    to:   user.phone_number,
    from: process.env.TWILIO_FROM_NUMBER,
  });

  return call.sid;
}

// ── Mark event as called ─────────────────────────────────
async function markEventCalled(userId, eventId) {
  await supabase
    .from("called_events")
    .upsert({ user_id: userId, event_id: eventId }, { onConflict: "user_id,event_id" });
}

async function wasEventCalled(userId, eventId) {
  const { data } = await supabase
    .from("called_events")
    .select("id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .maybeSingle();
  return !!data;
}

// ── Main check loop ──────────────────────────────────────
async function checkAllUsers() {
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .eq("is_active", true)
    .not("phone_number", "is", null)
    .not("google_access_token", "is", null);

  if (error) {
    log("ERROR", `Failed to fetch users: ${error.message}`);
    return;
  }

  log("INFO", `Checking ${users.length} active user(s)...`);

  for (const user of users) {
    try {
      const accessToken = await refreshTokenIfNeeded(user);
      const meetings    = await getAcceptedMeetings(user, accessToken);
      const now         = new Date();
      const minutes     = user.reminder_minutes || 10;
      const window      = WINDOW_SECONDS / 60;

      for (const event of meetings) {
        const startTime = event.start?.dateTime ? new Date(event.start.dateTime) : null;
        if (!startTime) continue;

        const minutesUntil = (startTime - now) / 1000 / 60;

        if (minutesUntil >= minutes - window && minutesUntil <= minutes + window) {
          const alreadyCalled = await wasEventCalled(user.id, event.id);
          if (!alreadyCalled) {
            const sid = await placeCall(user, event, startTime);
            await markEventCalled(user.id, event.id);
            log("INFO", `📞 Called ${user.phone_number} for "${event.summary}" | SID: ${sid}`);
          }
        }
      }
    } catch (err) {
      log("ERROR", `Error processing user ${user.email}: ${err.message}`);
    }
  }
}

// ── Start ─────────────────────────────────────────────────
log("INFO", "🤖 CallerBot Worker started");
log("INFO", `   Checking every ${CHECK_INTERVAL_MS / 1000}s`);

checkAllUsers();
setInterval(checkAllUsers, CHECK_INTERVAL_MS);
