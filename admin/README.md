# Solid Rock staff dashboard

Minimal staff-only Next.js administration backed by the separate Solid Rock Supabase project.

## Setup

1. Run `cd admin && npm install`.
2. Copy `.env.example` to `.env.local` and fill only Supabase URL and anon key.
3. Run `npm run dev`.
4. Configure Supabase email template to display six-digit `{{ .Token }}` for email OTP.

## Features

Role-gated email OTP access; announcements, events, sermons, fellowships, volunteer opportunities and pastoral availability. The browser does not assign roles or mutate financial ledgers. No `service_role` key belongs in client environments. Apply and review Supabase migrations first. Production and content approval are pending.
