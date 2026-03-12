export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "4rem 2rem", fontFamily: "Syne, sans-serif" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>Privacy Policy</h1>
      <p style={{ color: "#8a8070", marginBottom: "3rem" }}>Last updated: March 2026</p>

      {[
        ["What We Collect", "When you sign in with Google, CallerBot collects your email address and read-only access to your Google Calendar. We also collect your mobile phone number which you provide during setup."],
        ["How We Use Your Data", "We use your calendar data solely to identify meetings you have accepted and to call your mobile phone before those meetings. We do not read, store, or share the content of your calendar events beyond what is necessary to identify meeting times."],
        ["Data Storage", "Your Google OAuth tokens and phone number are stored securely in our database. We never store the content of your calendar events. Your data is never sold or shared with third parties."],
        ["Google Calendar Access", "CallerBot requests read-only access to your Google Calendar. We cannot create, edit, or delete any of your calendar events."],
        ["Phone Calls", "Your phone number is used exclusively to call you before meetings. It is never shared with third parties or used for marketing purposes."],
        ["Data Deletion", "You can delete your account and all associated data at any time by contacting us. Upon deletion, all your data including tokens and phone number will be permanently removed."],
        ["Contact", "If you have any questions about this privacy policy, please contact us at the email address associated with this app."],
      ].map(([title, content]) => (
        <section key={title} style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>{title}</h2>
          <p style={{ lineHeight: 1.7, color: "#444" }}>{content}</p>
        </section>
      ))}
    </main>
  );
}
