# Solid Rock staging and rollout

## Repository status
Branch `feat/solid-rock-expo-mvp` contains an Expo mobile app, a separate Next.js staff admin and Supabase SQL migrations. The mobile application does not require a backend to display its public offline content. Authenticated features require a new Solid Rock-owned Supabase environment.

## Mobile setup
1. Install Node.js 22 and run `npm install` at the repo root.
2. Copy `.env.example` to `.env`. Set only `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from the isolated Solid Rock project.
3. Run `npm run typecheck` and `npx expo start`.
4. Test on physical Android and iOS devices. Never claim store readiness based only on a TypeScript check.

## Supabase staging
1. Create a dedicated Supabase project, separate from Liberty-TV and all other Reveta products.
2. Review and apply the SQL migrations in `supabase/migrations/` sequentially.
3. Configure email OTP sign-in with a six-digit `{{ .Token }}` email template.
4. Provision staff identities via authenticated email verification. Add staff roles using a separate trusted administrative procedure only after verification.
5. Review row-level security with guest, member, group leader, pastor, finance, content administrator and super administrator test identities.
6. Verify registration capacity and appointment slot locking under concurrent requests.
7. Populate only real, church-approved announcements, event details and sermon sources.

## Administration
1. Run `cd admin && npm install`.
2. Copy `admin/.env.example` to `admin/.env.local`; add only the project URL and anon key.
3. Run `npm run typecheck && npm run dev`.
4. Test each staff role's create/read authorisation; the interface currently has no full moderation or deletion workflow.
5. Avoid confidential information in publicly published fields.

## Payments and safeguarding
- Do not use client-originated amount, recipient or 'success' values as verified ledger transactions.
- Before enabling online giving, contract with a regulated payment processor; configure signed webhook verification, idempotency, destination whitelisting and reconciliation.
- Establish a confidential pastoral request handling policy, retention rules and child safeguarding requirements.
- Only process actual member/household data following privacy review and authorised ChMeetings migration.

## Deployment
Do not merge or deploy to production until CI, mobile-device QA, data protection, content verification, store publisher and integration reviews pass. CI typecheck does **not** validate SQL migrations, device runtime or production operations.
