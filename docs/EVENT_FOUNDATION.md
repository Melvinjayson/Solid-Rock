# Event foundation — implementation and verification

Date: 1 November 2026. Status: Implemented and locally tested; not accepted, deployed or verified live.

## Delivered scope

Guest-first Expo app with Home / Watch / Events / Give / More navigation; invited confirmed-account sign-in; event registration, stored confirmation reference and cancellation. Church-office Next.js app supports draft/published event creation, publishing, cancellation and registration account/status inspection. Supabase schema implements protected staff roles, read policies, transactional registration and audit. Shared requests have a 15-second timeout.

No archived Liberty code was copied: its guest-access, data and AI assumptions were unnecessary for this scoped implementation. No production service was changed.

## Local evidence

| Check                                 | Result                                                                                     | Limits                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| PostgreSQL SQL/RLS integration        | 16 lifecycle/security scenarios pass, plus parent test (17 reported)                       | PGlite with a minimal Auth fixture, not a hosted Supabase project             |
| TypeScript                            | Admin and mobile pass                                                                      | Does not verify device behaviour                                              |
| Next.js production build              | Pass                                                                                       | No production configuration or deployment                                     |
| Expo bundle export                    | Android, iOS and web pass                                                                  | No native signed build or physical-device test                                |
| Browser tests                         | 3 pass: guest office restriction; staff login/publish/attendee flow; mobile web navigation | Staff HTTP transport mocked, mobile runs exported web bundle                  |
| npm audit, production dependency tree | 0 high / 0 critical; 11 moderate findings                                                  | Expo toolchain transitives: glob/minimatch advisory chains; not a clean audit |

Audit sources: GHSA-3g3m-2fjr-6pw4 (glob cancellation traversal), GHSA-g3hv-75wg-m249 (minimatch amplification). No major-version override or SDK downgrade was forced to suppress these findings. Resolve through a compatible reviewed toolchain update and re-run checks before release.

SQL scenarios cover published/draft visibility, blocked guest writes, staff escalation attempts, unconfirmed accounts, private registrations/confirmations, idempotent retry, capacity, ownership-aware cancellation, capacity release, event closure and immediate staff revocation.

## Required next environment checks

1. Church owner selects an approved development Supabase project; designated administrator reviews and applies the migration and provisions test accounts/initial staff role. No production data needed.
2. Verify Auth + PostgREST + RPC access through that project, including negative role tests. Run Supabase advisors. Keep `private` outside exposed schemas.
3. Run concurrent independent PostgreSQL connections against a one-place event; assert exactly one user confirms, the other gets EVENT_FULL, and a retry returns the original reference. Local tests have **not** demonstrated this concurrency scenario.
4. Test registration/relaunch/cancellation on physical iOS and Android devices. Review token storage, staff MFA, accessibility, retention, deletion and rate limiting.
5. Confirm existing store publisher rights and ChMeetings member-linking/integration contract before operational data migration or store configuration changes.

## Explicitly deferred

ChMeetings integration and verified membership linking; household/profile features; attendee names/contact details; email/push delivery; payments/receipts; ministry, fellowship and care workflows; content CMS and embedded media/Bible. Watch/Give link to approved church URLs. Event cancellation requires manual contact with attendees. There is no live sync worker, no production metrics, and no availability or crash-free claim.

## Source-of-truth decision

This database is a development workflow implementation, not a replacement for ChMeetings operational records. Do not begin dual operational event or member management until record ownership and sync behaviour are approved. The existing 24-week roadmap remains indicative.
