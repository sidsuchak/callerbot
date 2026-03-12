// app/api/auth/callback/route.js
import { NextResponse } from "next/server";
import { exchangeCodeForTokens, getOAuthClient } from "@/lib/google";
import { supabaseAdmin } from "@/lib/supabase";
import { google } from "googleapis";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/login?error=access_denied", request.url));
  }

  try {
    // Exchange code for Google tokens
    const tokens = await exchangeCodeForTokens(code);

    // Get user's Google profile
    const oauthClient = getOAuthClient();
    oauthClient.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauthClient });
    const { data: profile } = await oauth2.userinfo.get();
    const email = profile.email;

    console.log("OAuth callback for:", email);

    // Find or create Supabase user
    const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers();
    let supabaseUser = existingUsers?.find(u => u.email === email);

    if (!supabaseUser) {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (createError) throw createError;
      supabaseUser = newUser.user;
    }

    console.log("Supabase user ID:", supabaseUser.id);

    // Upsert user row with Google tokens
    const { error: upsertError } = await supabaseAdmin
      .from("users")
      .upsert({
        id:                   supabaseUser.id,
        email,
        google_access_token:  tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry:  tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        calendar_id: email,
        updated_at:  new Date().toISOString(),
      }, { onConflict: "id" });

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      throw upsertError;
    }

    // Set user id in a cookie
    const response = NextResponse.redirect(new URL("/onboarding", request.url));
    response.cookies.set("callerbot_user_id", supabaseUser.id, {
      httpOnly: true,
      path:     "/",
      maxAge:   60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
      secure:   true, // required for https in production
    });

    console.log("Cookie set, redirecting to onboarding");
    return response;
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(err.message)}`, request.url)
    );
  }
}
