# Solid Rock Dublin

Development implementation of the event registration workflow. Independent of the archived Liberty prototype. No production deployment or store update has been performed.

## Implemented

- Expo / React Native: guest-first Home, Events and account sign-in; event registration, persisted reference and cancellation. Watch and Give currently link to the official church website.
- Next.js church office: staff sign-in, create draft/published events, publish, cancel and inspect registration account IDs/status. Names and ChMeetings member linking are deferred.
- Supabase PostgreSQL: RLS, protected staff records, transactional capacity checks, idempotent registration, cancellation and audit events. Confirmation is an in-app database record; email and push delivery are not implemented.
- SQL integration tests execute the migration in PGlite (embedded PostgreSQL) with separate guest/member/staff roles. This does not replace hosted Supabase or concurrent multi-connection testing.

## Local setup

Node 24 and npm. From the repository root:

```sh
npm ci
npm test
npm run typecheck
npm run dev:admin
npm run dev:mobile
```

Copy `apps/admin/.env.example` to `apps/admin/.env.local` and `apps/mobile/.env.example` to `apps/mobile/.env`. Fill only the URL and publishable key for an **approved development Supabase project**. Never put service-role keys in either application. Rebuild/restart after changing public variables.

Review and apply `supabase/migrations/*_event_registration.sql` through the approved database migration process in that development project. Do not apply it to ChMeetings or an existing production database. Only `public` should be exposed through the Data API; **do not expose `private`**. Explicit grants and RLS are included.

Create confirmed test email/password users through Supabase Auth. There is no public sign-up or password-recovery UI in this increment. Test identities are not automatically ChMeetings members. Disable anonymous sign-in. Configure Auth rate limits and email verification before a pilot.

A database administrator grants one initial staff account using its actual Auth UUID:

```sql
insert into public.staff_roles(user_id, role)
values ('REPLACE_WITH_CONFIRMED_AUTH_USER_UUID', 'events');
```

This is an access change requiring the church owner's approval. Clients cannot grant roles. Remove that record to revoke event-office privileges immediately.

## Exercise the complete workflow

1. Staff signs into the office and saves a future event as draft. A guest cannot see it.
2. Staff publishes it. Refresh Events on mobile to see it.
3. A confirmed test account signs in under More, returns to Events and reserves a place.
4. The app displays the stored registration reference. Refresh or relaunch to retrieve it again.
5. Staff opens registrations to see the account ID and confirmation status.
6. Retry registration: the same reference is returned. Fill capacity: the next user is rejected.
7. Cancel a place: its confirmation is removed and capacity becomes available.

Dates are stored as UTC and displayed in Europe/Dublin. Office datetime inputs use the browser's local timezone, labelled in the form. Event cancellation stops new registrations; contacting existing attendees is currently a manual office task.

## Checks

```sh
npm run format:check
npm test
npm run typecheck
npm run build:admin
npm run test:ui
cd apps/mobile
npx expo export --platform all
```

For browser tests, first install Chromium with `npx playwright install chromium`. Browser tests use mocked Supabase HTTP responses for the staff workflow and the exported mobile web shell for guest navigation; they do not contact a hosted project. Run the mobile export before browser tests. Database tests exercise actual SQL/RLS with a minimal Auth fixture; hosted Auth/PostgREST and native device journeys remain release gates.

## Boundaries

- No payment collection, sample bank details, email/push sending, external account writes, production migration or app-store submission.
- No ChMeetings connector, member import, member verification, family management, pastoral care or AI services.
- Development bundle identifiers deliberately differ from existing store listings. Confirm publisher authority and signing/transfer arrangements before release configuration changes.
- Auth session persistence uses the standard Supabase browser / React Native AsyncStorage approach; native secure storage and staff MFA need a pilot security review.
- No real church event data is seeded. Church address, service time and links are based on the public website, reviewed 1 November 2026; obtain church approval before launch.

See [implementation status](docs/EVENT_FOUNDATION.md) and the existing [roadmap](docs/IMPLEMENTATION_ROADMAP.md).
