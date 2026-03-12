"use client";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    // In production, fetch the URL from the server
    // For now, redirect to Google OAuth
    window.location.href = "/api/auth/google";
  };

  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      background: "var(--paper)",
    }}>
      {/* Left — Hero */}
      <section style={{
        padding: "4rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRight: "1px solid var(--border)",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "6rem" }}>
            <span style={{
              background: "var(--accent)",
              color: "#fff",
              width: 32, height: 32,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              fontSize: 18,
            }}>📞</span>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>CallerBot</span>
          </div>

          <h1 style={{
            fontSize: "clamp(3rem, 5vw, 5rem)",
            fontWeight: 800,
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
            marginBottom: "2rem",
          }}>
            Never miss<br />
            <span style={{ color: "var(--accent)" }}>a meeting</span><br />
            again.
          </h1>

          <p style={{
            fontSize: "1.1rem",
            color: "var(--muted)",
            maxWidth: 380,
            lineHeight: 1.6,
          }}>
            CallerBot watches your Google Calendar and <strong style={{ color: "var(--ink)" }}>calls your mobile phone</strong> exactly 10 minutes before every meeting you've accepted.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: "3rem" }}>
          {[["10 min", "before every meeting"], ["0 missed", "calls reported"], ["free", "to get started"]].map(([val, label]) => (
            <div key={val}>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.03em" }}>{val}</div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.2rem" }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Right — Sign in */}
      <section style={{
        padding: "4rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "2rem",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "3rem",
          boxShadow: "0 4px 40px rgba(0,0,0,0.06)",
        }}>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, marginBottom: "0.5rem" }}>Get started</h2>
          <p style={{ color: "var(--muted)", marginBottom: "2.5rem", fontSize: "0.9rem" }}>
            Connect your Google Calendar in one click. No credit card required.
          </p>

          <button
            onClick={handleGoogleLogin}
            style={{
              width: "100%",
              padding: "1rem 1.5rem",
              background: "var(--ink)",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: "1rem",
              fontFamily: "inherit",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.15)"; }}
            onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div style={{
            marginTop: "1.5rem",
            padding: "1rem",
            background: "var(--surface)",
            borderRadius: 8,
            fontSize: "0.8rem",
            color: "var(--muted)",
            lineHeight: 1.5,
          }}>
            🔒 We only request <strong>read-only</strong> calendar access. We never read your email or edit your events.
          </div>
        </div>

        <p style={{ fontSize: "0.8rem", color: "var(--muted)", textAlign: "center" }}>
  By signing in you agree to our{" "}
  <a href="/privacy" style={{ color: "var(--ink)", fontWeight: 600 }}>
    Privacy Policy
  </a>
</p>
      </section>
    </main>
  );
}
