// app/api/meetings/route.js
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";
import { getCalendarService, getUpcomingAcceptedMeetings } from "@/lib/google";

function getUserId() {
  const cookieStore = cookies();
  return cookieStore.get("callerbot_user_id")?.value || null;
}

export async function GET() {
  const userId = getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("google_access_token, google_refresh_token, calendar_id")
    .eq("id", userId)
    .single();

  if (!userData?.google_access_token) {
    return NextResponse.json({ error: "Google Calendar not connected" }, { status: 400 });
  }

  const calService = getCalendarService(
    userData.google_access_token,
    userData.google_refresh_token
  );

  const meetings = await getUpcomingAcceptedMeetings(calService, userData.calendar_id);

  const formatted = meetings.map((e) => ({
    id:        e.id,
    title:     e.summary || "Untitled Meeting",
    startTime: e.start?.dateTime || e.start?.date,
    endTime:   e.end?.dateTime || e.end?.date,
    meetLink:  e.hangoutLink || null,
    attendees: (e.attendees || []).length,
  }));

  return NextResponse.json({ meetings: formatted });
}
