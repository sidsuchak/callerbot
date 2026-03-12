// app/api/users/route.js
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { cookies } from "next/headers";

async function getUserId() {
  const cookieStore = await cookies();
  const id = cookieStore.get("callerbot_user_id")?.value;
  console.log("callerbot_user_id cookie:", id);
  return id || null;
}

export async function POST(request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { phone_number, reminder_minutes } = body;

  if (phone_number && !/^\+[1-9]\d{7,14}$/.test(phone_number)) {
    return NextResponse.json(
      { error: "Invalid phone number. Use E.164 format e.g. +918698316883" },
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({
      phone_number:     phone_number || undefined,
      reminder_minutes: reminder_minutes || undefined,
      is_active:        true,
      updated_at:       new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Supabase update error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("email, phone_number, reminder_minutes, is_active, calendar_id")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Supabase select error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
