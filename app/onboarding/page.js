"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("+91");
  const [minutes, setMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setError("Enter a valid phone number in international format e.g. +918698316883");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/users", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ phone_number: phone, reminder_minutes: minutes }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    router.push("/dashboard");
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Progress */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "3rem" }}>
          {["Google Connected", "Phone Setup", "All Done"].map((s, i) => (
            <div key={s} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <div style={{ height: 3, background: i === 0 ? "var(--ink)" : i === 1 ? "var(--accent)" : "var(--border)", borderRadius: 2 }} />
              <span style={{ fontSize: "0.7rem", color: i === 1 ? "var(--ink)" : "var(--muted)", fontWeight: i === 1 ? 600 : 400 }}>{s}</span>
            </div>
          ))}
        </div>

        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "0.5rem" }}>
          One last thing
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: "2.5rem" }}>
          Where should CallerBot call you?
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Phone */}
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              Mobile number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+918698316883"
              style={{
                width: "100%",
                padding: "0.9rem 1rem",
                border: "1.5px solid var(--border)",
                borderRadius: 10,
                fontSize: "1.1rem",
                fontFamily: "DM Mono, monospace",
                background: "white",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = "var(--ink)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
            <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.4rem" }}>
              International format with country code. India: +91...
            </p>
          </div>

          {/* Reminder timing */}
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
              Call me <strong style={{ color: "var(--accent)" }}>{minutes} minutes</strong> before meetings
            </label>
            <input
              type="range"
              min={5} max={30} step={5}
              value={minutes}
              onChange={e => setMinutes(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--accent)" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.3rem" }}>
              <span>5 min</span><span>30 min</span>
            </div>
          </div>

          {error && (
            <p style={{ color: "var(--accent)", fontSize: "0.9rem" }}>{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "1rem",
              background: loading ? "var(--muted)" : "var(--ink)",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: "1rem",
              fontFamily: "inherit",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.15s",
            }}
          >
            {loading ? "Saving..." : "Start CallerBot →"}
          </button>
        </div>
      </div>
    </main>
  );
}
