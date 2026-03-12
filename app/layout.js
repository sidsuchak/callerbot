import { google } from "googleapis";
import "./globals.css";

export const metadata = {
  title: "CallerBot — Never Miss a Meeting",
  description: "Get a phone call 10 minutes before every meeting you've accepted.",
  verification: {
    google: 'Tn-C8-9LlHFNR8Lss2rV_3PITDlzWj1-zdlNlo_HPlY'
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
