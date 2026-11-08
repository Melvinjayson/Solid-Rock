# Solid Rock Centre — Church Pilot Release & Acceptance Pack

**Version:** 2026-11-08 · **Status:** Proposed, not signed off · **Environment:** separate Preview → signed native internal builds → controlled pilot
**Working branch:** `feat/solid-rock-expo-mvp`; [draft PR #2](https://github.com/Melvinjayson/Solid-Rock/pull/2)  
**Source of truth:** [ROADMAP_DELIVERY_AUDIT.md](ROADMAP_DELIVERY_AUDIT.md) for P0–P2 scope/status. This pack governs pilot acceptance, not feature prioritisation.

## Decision required from Solid Rock Centre

The church has requested an app. That establishes sponsorship for a build, **not yet** permission to collect member/special-category data, charge payment methods, migrate ChMeetings accounts, publish to church-owned stores, or operate a youth/community messaging service. These require domain-specific acceptance by the corresponding church owners.

**Recommended first release:** a guest-first native church companion with official worship, Scripture, weekly journeys, approved events/visiting information, published giving destinations and Talk To Us. Controlled member/community UAT is a separate release.

### Acceptance owners

| Domain | Accountable role to identify | Decision/evidence |
| --- | --- | --- |
| Product and content | Church product sponsor/lead | Validated audience, brand/imagery, weekly service details, editorial review, UAT acceptance |
| Safeguarding and pastoral | Named church safeguarding & pastoral leads | Age policy, reporting and triage rota, escalation, safeguarding refusal/closure workflow |
| Privacy and data protection | Church data controller/DPO or adviser | Processing purposes/bases, special-category handling, deletion, retention, subject-rights, vendor agreements |
| Payments and finance | Church treasurer/finance approver | Bank recipient re-verification, merchant ownership, finance reconciliation, donation confirmation/receipt policy |
| Technology and app stores | Named technical owner/publisher | Dedicated staging, signing ownership, secrets, backups, observability, store accounts and rollback |
| Content/community moderation | Editors and scheduled human moderators | Authorisation per channel, publishing cadence, incident response, appeal handling and moderator coverage |

Record names, decision date, written approval and the approved build SHA in the UAT tracker. **No approval is inferred from this document.**

## Gate A — public pilot (no member account required)

All **mandatory** conditions must be demonstrated:

| ID | Gate | Evidence / acceptance |
| --- | --- | --- |
| PUB-01 | Stable signed Android and iOS *internal* builds | Android and iOS device screenshots/video and version/build identifiers; no web-only substitution |
| PUB-02 | Accurate church identity and licensed imagery | Church approval of logo, attribution, food bank/youth media, visiting information and content owner |
| PUB-03 | Home/Watch/Events/More/Community preview | First-run guide, accessible tab navigation, contrast, font scaling and links pass on small/large phones |
| PUB-04 | YouTube videos and playlists | Actual approved video starts/stops on physical devices; live status shown only when verified |
| PUB-05 | Scripture | WEB book/chapter reader renders correct text, notes/highlights persist, no wrong chapter flash, offline cached chapter works |
| PUB-06 | Bible source reliability | Production-owned approved WEB data/CDN or documented failover, load testing and rights review; hobby API alone is not accepted |
| PUB-07 | Verified giving only | Church finance officer rechecks IBAN/PayPal recipient with the official owner; external hosted payment opens, no app card capture/false receipts |
| PUB-08 | Talk To Us and visitor pathways | Recipient email, two listed phone numbers, directions and inclusive enquiry topics reverified by church; email draft never sends automatically |
| PUB-09 | Guest privacy | App-owned local erase clears all `@solidrock:` keys including journals/journeys; welcome returns; no hidden member collection |
| PUB-10 | Accessible to ages/backgrounds | TalkBack/VoiceOver, font sizes, captions availability, readable no-jargon instructions, screen reader + keyboard journeys |
| PUB-11 | Offline and failure handling | Poor connection, Bible provider outage, YouTube embed denial, missing images and website changes produce honest fallbacks |
| PUB-12 | Support and incident readiness | Working support email and issue owner, runbook, monitoring, crash reporting/privacy policy, rollback decision maker |
| PUB-13 | Store identity and legal basics | Existing publisher/signing keys or written transfer path, accurate data-safety answers, privacy policy, content rights |

**Stop condition:** any unowned or failed public-content privacy/safety, payment-recipient, native crash, store-signing or safeguarding gate. A green CI run alone is insufficient.

## Gate B — authenticated member and community pilot

Gate A must be satisfied first, plus:

- **AUTH-01:** Dedicated church-operated staging Supabase with real email OTP smoke tests: valid six-digit code works; invalid, expired, reused and cross-account codes fail. `EXPO_PUBLIC_MEMBER_SIGNUP_ENABLED` stays false unless self-service deletion and staff support workflow are accepted.
- **AUTH-02:** Church approved, actually working **in-app deletion of created accounts** (including remote data, lawful retention exceptions and user confirmation); identity verification and deletion audit; separately publish web deletion instructions where store rules require them.
- **AUTH-03:** Real database RLS and Supabase Realtime tests for a guest, two members, pastoral lead and super-admin. Isolated PostgreSQL fixture is **not** a substitute.
- **SAFE-01:** Human moderation rota, escalation and privacy-preserving prayer protocol; report/block/mute/hide/appeal tested. No youth or private direct messages until independently approved.
- **EVENT-01:** Test authorised staff publishing, attendance role separation, an event reaching capacity, waitlist promotion, cancellation and idempotent check-in on staging.
- **PAST-01:** Pastoral requests handled in confidential, bounded channels with specific consent; no safeguarding-sensitive contents in public notifications.
- **FIN-01:** No client-originated payment success or giving ledger writes; any future provider integration requires signed events, deduplication, reconciliation and finance acceptance.
- **OPS-01:** Staff publishing/deletion roles, RTO/RPO, backup restoration, incident logging, member subject-rights and approved data retention.
- **SEC-01:** Independent security review for account enumeration, rate limits, permission escalation, unsafe URLs, content injection, token leakage, storage extraction and dependency advisories.

**Stop condition:** no named/available moderator, untested account deletion, any cross-tenant/member data exposure, or unapproved youth participation.

## Gate C — store rollout

- Church verifies Apple Developer and Google Play Console ownership of current Solid Rock listings, signing continuity and whether ChMeetings/Jios must transfer the listing. A new package ID creates a **different app**.
- Confirm native notification permissions, EAS release profile, store icons/splash assets, device compatibility, app age rating, screenshots captured from actual binaries, release notes and support contact.
- Complete Google Play internal testing and iOS TestFlight signoff; independently install and open the final signed builds.
- Prepare app review access, accurate data deletion details, user-generated content policy and route to human support.
- Freeze content and bundle IDs at the accepted SHA, confirm monitored staged rollout, define 15-minute and 24-hour post-release owners and rollback process.
- Promote only after explicit church sign-off and CI/native UAT evidence. A successful compilation or cloud deployment is not release acceptance.

## Representative UAT (proposal, not conducted)

Aim for 10–15 consented participants including first-time visitors, young adults, families, older congregants, people who rely on accessibility settings, and different cultural/language backgrounds. Never solicit confidential pastoral, medical, financial or children's data during testing.

**Five measured journeys**: find Sunday service/contact; start an official message; read/save/resume a Scripture passage; identify giving recipient and choose safe external checkout; and navigate community safety/reporting without publishing a real sensitive message.

**Proposed thresholds:** ≥90% unassisted task completion on the first four journeys; 100% success for critical security/safeguarding test cases; zero unresolved P0 defects and zero false claims of payment/event success. Track times, task failures, assistance, accessibility issues, unexpected network requests and perceived belonging. Thresholds are targets, **not existing results**.

## Operations after launch

**Content ownership:** website remains authoritative for ministry facts, but the app should own personal flows, local state and interaction. Assign publishing responsibility for livestream, weekly events, welcoming new attendees, ministry imagery and pastoral notices. Invalidate stale cached data after source changes.

**Observability:** collect privacy-minimal client crash counts, playback failures, loading failures and anonymised task completion. Avoid third-party analytics tracking of religious beliefs, prayer text or youth participation. Logs must never contain credentials, notes or sensitive messages.

**Community health:** track response time to member reports, moderation queue coverage, unanswered Talk To Us requests and content freshness. These are operational indicators, not rankings of religious participation.

**Incident response:** classify lost data, account takeover, financial redirection, leaked religious/safeguarding information, and broken media. Assign a technical responder and a church decision-maker; activate kill switches for membership, messaging, payment deep links and social feed providers when safety is uncertain.

**Backups and reversibility:** exercise restoring church-owned staging data with fake accounts. Keep `main` and existing store listings untouched until release gates are met.

## Pilot sign-off record (blank until church accepts)

| Item | Approval | Evidence link / SHA | Date | Decision-maker |
| --- | --- | --- | --- | --- |
| Brand/content | Pending | — | — | Church product owner |
| Pastoral safeguarding | Pending | — | — | Church safeguarding lead |
| Privacy and account lifecycle | Pending | — | — | Church data owner |
| Giving recipient and finance | Pending | — | — | Church treasurer |
| Signed native app QA | Pending | — | — | Church technical owner |
| Real-user accessibility/UAT | Pending | — | — | Pilot QA owner |
| Store rollout | Pending | — | — | Approved store publisher |

**Current disposition:** Draft PR, independent UAT work; no live member/financial activation and no public app-store publication. Follow [UAT_PLAN.md](UAT_PLAN.md), [COMMUNITY_UAT_AND_GOVERNANCE.md](COMMUNITY_UAT_AND_GOVERNANCE.md) and [SOCIAL_MEDIA_AND_STORES.md](SOCIAL_MEDIA_AND_STORES.md) for detailed scripts and integrations.
