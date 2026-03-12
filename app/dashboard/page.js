"use client";
import { useState, useEffect } from "react";

function MeetingCard({ meeting }) {
  const start = new Date(meeting.startTime);
  const now   = new Date();
  const minsUntil = Math.round((start - now) / 1000 / 60);
  const isUpcoming = minsUntil > 0;

  return (
    <div style={{
      padding: "1.25rem 1.5rem",
      background: "white",
      border: "1px solid var(--border)",
      borderLeft: `4px solid ${minsUntil <= 15 && minsUntil > 0 ? "var(--accent)" : "var(--ink)"}`,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "1rem",
    }}>
      <div>
        <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>
          {meeting.title}
        </div>
        <div style={{ fontSize: "0.85rem", color: "var(--muted)", fontFamily: "DM Mono, monospace" }}>
          {start.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
          {" · "}
          {start.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          {meeting.attendees > 1 && ` · ${meeting.attendees} attendees`}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        {isUpcoming && (
          <span style={{
            padding: "0.3rem 0.75rem",
            background: minsUntil <= 15 ? "var(--accent)" : "var(--surface)",
            color: minsUntil <= 15 ? "white" : "var(--ink)",
            borderRadius: 20,
            fontSize: "0.78rem",
            fontWeight: 600,
            fontFamily: "DM Mono, monospace",
          }}>
            {minsUntil <= 60 ? `in ${minsUntil}m` : `in ${Math.round(minsUntil / 60)}h`}
          </span>
        )}
        {meeting.meetLink && (
          <a
            href={meeting.meetLink}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "block",
              marginTop: "0.4rem",
              fontSize: "0.75rem",
              color: "var(--accent)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Join Meet →
          </a>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [meetings, setMeetings] = useState([]);
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      const [meetRes, userRes] = await Promise.all([
        fetch("/api/meetings"),
        fetch("/api/users"),
      ]);
      const meetData = await meetRes.json();
      const userData = await userRes.json();
      setMeetings(meetData.meetings || []);
      setUser(userData);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "var(--paper)" }}>
      {/* Top bar */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "1.25rem 2.5rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "white",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{
            background: "var(--accent)", color: "#fff",
            width: 28, height: 28, borderRadius: "50%",
            display: "grid", placeItems: "center", fontSize: 15,
          }}>📞</span>
          <span style={{ fontWeight: 800, fontSize: "1rem" }}>CallerBot</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {user && (
            <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
              Calling <span style={{ fontFamily: "DM Mono, monospace", color: "var(--ink)", fontWeight: 600 }}>{user.phone_number}</span>
              {" · "}
              <span style={{
                display: "inline-block",
                width: 8, height: 8,
                background: "#22c55e",
                borderRadius: "50%",
                marginRight: 4,
              }} />
              Active
            </div>
          )}
          <a href="/api/auth/logout" style={{
            fontSize: "0.85rem", color: "var(--muted)",
            textDecoration: "none", fontWeight: 500,
          }}>Sign out</a>
        </div>
      </header>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 2rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.25rem" }}>
            Upcoming meetings
          </h1>
          <p style={{ color: "var(--muted)" }}>
            You'll get a call {user?.reminder_minutes || 10} minutes before each of these.
          </p>
        </div>

        {/* Meeting list */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[1,2,3].map(i => (
              <div key={i} style={{
                height: 80, borderRadius: 12,
                background: "linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
              }} />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "4rem 2rem",
            border: "1.5px dashed var(--border)",
            borderRadius: 16,
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🗓️</div>
            <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>No meetings in the next 24 hours</p>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>When you accept meetings, they'll appear here.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {meetings.map(m => <MeetingCard key={m.id} meeting={m} />)}
          </div>
        )}

        {/* Settings card */}
        {user && (
          <div style={{
            marginTop: "3rem",
            padding: "1.5rem",
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: 12,
          }}>
            <h2 style={{ fontWeight: 700, marginBottom: "1rem", fontSize: "0.95rem" }}>Your settings</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              {[
                ["Calendar", user.email],
                ["Call number", user.phone_number],
                ["Reminder", `${user.reminder_minutes} min before`],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.25rem" }}>{label}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.85rem", fontWeight: 500 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </main>
  );
}
