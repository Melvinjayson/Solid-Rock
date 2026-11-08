# Solid Rock feature coverage — 8 November 2026

**Source implemented** means UI, client service, SQL schema or admin code exists. It does not imply production deployment or independently verified end-to-end operation.

| Feature | Phase | Current status | Remaining dependency |
| --- | --- | --- | --- |
| Five-tab public app | P0 | Implemented, mobile typecheck pending | Device/accessibility QA |
| Church announcements | P0 | Admin create + mobile read | Staging database, approved content |
| Sermons and study guides | P0 | Catalogue, links, bookmarks, search | Approved sermon URLs, player QA |
| Livestream player | P0 | Official-site link only | Native media player and livestream source |
| Bible access | P0 | Reading resources and guide | Approved digital Bible corpus/licence |
| Member account, profile | P0 | Supabase email OTP and profile UI | Auth configuration and migration |
| Church events | P0 | Admin create, public listing | Staging content |
| Member event registration | P0 | Atomic database RPC and mobile action | Integration and concurrency tests |
| Prayer requests | P0 | Private RLS table and submission UI | Care-team response workflow |
| Giving instructions | P0 | Verified-site link only | Church finance verification |
| Staff publishing | P0 | Role-gated Next.js admin create/read | Staging and content QA |
| Fellowships | P1 | Admin listing + mobile join | Groups approval and moderation |
| Volunteering | P1 | Admin listings + mobile interest | Volunteer onboarding |
| Reading plans | P1 | Local persistence, optional cloud sync | Approved Scripture content |
| Pastoral booking | P1 | Atomic database RPC and mobile form | Staging slots and safeguarding |
| Giving history | P1 | Read-only verified ledger UI | Provider reconciliation pipeline |
| Households | P1 | Not implemented | Member linking and child safeguards |
| Event tickets and QR check-in | P1 | Not implemented | Staff attendance controls |
| Paid events, online payments | P1 | Not implemented | Approved processor and signed webhooks |
| Statements and recurring giving | P1/P2 | Not implemented | Finance controls, ledger review |
| Push alerts | P1 | Not implemented | Opt-in controls, APNs/FCM sender |
| Captions and transcripts | P1 | Schema fields only | Media processing and rights |
| Offline video downloads | P2 | Not implemented | Distribution rights and storage |
| Groups chat and watch parties | P2 | Not implemented | Moderation, privacy and real-time service |
| AI sermon/Scripture discovery | P2 | Deferred | Content provenance and safety evaluation |
| Waitlists, advanced analytics | P2 | Not implemented | Capacity engine and privacy review |

## Critical safety boundaries
- No bank account numbers or financial transactions are embedded in the mobile application.
- Only a trusted verified server may write to the giving ledger.
- Pastoral care data is private and assigned to permitted roles.
- No automatic Liberty-TV AI ingestion of private church records.
- Sample content from the prototype is not production church data.
- No Supabase migrations have been applied; no staging or production database is connected.
- Staff identities must be verified and role-assigned through a trusted operational process.

## Delivery gates
1. Verify ownership of app listings, church content, consent, safeguarding and ChMeetings export.
2. Set up dedicated Solid Rock Supabase staging; inspect and apply reviewed migrations.
3. Configure six-digit email OTP, approved staff roles and public church content.
4. Exercise RLS with guest/member/pastor/finance/admin test accounts.
5. Exercise event/booking concurrency, failure paths and recovery.
6. Complete Android and iOS build, device, accessibility and app-store tests.
7. Integrate regulated giving only after processor and finance approval.
8. Keep production untouched until release sign-off.

See `docs/IMPLEMENTATION_ROADMAP.md` for the broader P0–P2 product roadmap.
