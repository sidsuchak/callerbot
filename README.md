# CallerBot 📞

> Never miss a meeting — get a phone call 10 minutes before every accepted Google Calendar event.

## Tech Stack
- **Frontend + API**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel (web) + Railway (worker)
- **Calling**: Twilio
- **Auth**: Google OAuth 2.0

---

## Project Structure

```
callerbot/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── google/route.js       # Initiates Google OAuth
│   │   │   └── callback/route.js     # Handles OAuth redirect
│   │   ├── users/route.js            # GET/POST user settings
│   │   └── meetings/route.js         # GET upcoming accepted meetings
│   ├── login/page.js                 # Landing + sign-in page
│   ├── onboarding/page.js            # Phone number setup
│   ├── dashboard/page.js             # Meeting list + status
│   ├── layout.js
│   └── globals.css
├── lib/
│   ├── supabase.js                   # Supabase clients
│   ├── google.js                     # Calendar helpers
│   └── twilio.js                     # Call helper
├── workers/
│   └── reminderWorker.js             # Background polling worker
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql    # DB schema
├── .env.local.example
└── package.json
```

---

## Setup Guide

### 1. Clone & Install
```bash
git clone <your-repo>
cd callerbot
npm install
cp .env.local.example .env.local
```

### 2. Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase/migrations/001_initial_schema.sql`
3. Copy **Project URL** and **anon key** from Settings → API into `.env.local`
4. Copy **service_role key** (secret) into `.env.local`

### 3. Google Cloud Console
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable **Google Calendar API** + **Google OAuth2 API**
3. **APIs & Services → Credentials → Create OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback` (development)
     - `https://yourdomain.vercel.app/api/auth/callback` (production)
4. Copy **Client ID** and **Client Secret** into `.env.local`

### 4. Twilio
Already configured with your credentials in `.env.local`.

### 5. Run Locally
```bash
# Terminal 1 — Next.js web app
npm run dev

# Terminal 2 — Background worker
npm run worker
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Deployment

### Web App → Vercel
```bash
npm i -g vercel
vercel
```
Add all `.env.local` variables in Vercel dashboard → Settings → Environment Variables.

### Worker → Railway
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Set **Start Command**: `node workers/reminderWorker.js`
3. Add all environment variables in Railway dashboard

---

## How It Works

1. User signs in with Google (OAuth) → grants read-only calendar access
2. User enters their phone number + reminder timing preference
3. Worker polls **all active users** every 60 seconds
4. For each user, fetches meetings they've **accepted** in the next 24 hours
5. When a meeting is 10 minutes away → Twilio places a phone call
6. Called events are tracked in Supabase to prevent duplicate calls

---

## Adding Payments (Future)
Integrate [Stripe](https://stripe.com) for subscription billing:
- Free tier: 1 calendar, basic reminders
- Pro: multiple calendars, custom reminder times, SMS fallback
