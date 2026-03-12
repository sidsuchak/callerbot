import { google } from "googleapis";

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl() {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
}

export async function exchangeCodeForTokens(code) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export function getCalendarService(accessToken, refreshToken) {
  const client = getOAuthClient();
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return google.calendar({ version: "v3", auth: client });
}

export async function getUpcomingAcceptedMeetings(calendarService, calendarId) {
  const now     = new Date();
  const in24hrs = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const response = await calendarService.events.list({
    calendarId,
    timeMin:      now.toISOString(),
    timeMax:      in24hrs.toISOString(),
    singleEvents: true,
    orderBy:      "startTime",
  });

  const events   = response.data.items || [];
  const accepted = [];

  for (const event of events) {
    const organizer = event.organizer || {};
    const attendees = event.attendees || [];

    if (organizer.email === calendarId) {
      accepted.push(event);
      continue;
    }
    const self = attendees.find((a) => a.email === calendarId);
    if (self?.responseStatus === "accepted") {
      accepted.push(event);
    }
  }
  return accepted;
}
