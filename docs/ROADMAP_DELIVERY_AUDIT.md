# Solid Rock Centre — Roadmap Delivery Reconciliation (8 November 2026)

**Status:** Source implemented / automated-tested where stated. **Not production accepted.**
**Canonical implementation branch:** `feat/solid-rock-expo-mvp` — draft PR #2.
**Owner of public acceptance:** authorised Solid Rock Centre representative, still to be nominated.
**Mission:** A church-owned weekly faith and community companion, not a duplicate of solidrockdublin.org.
**Product constraints:** inclusive across cultures, ages and Christian traditions; user consent and church leadership determine actual doctrine, approved group governance, service content and safeguarding rules.

This file reconciles the older planning baseline and feature-status matrix with concrete source commits. The categories are intentionally precise:

- **Implemented** — source code exists. Does not imply native-device or backend acceptance.
- **Automated-tested** — exact candidate CI job demonstrated behaviour (see run and SHA).
- **Integrated-public** — read-only public third-party data successfully used by app/Vercel preview.
- **Gated** — interface or schema exists but remains off until church-owned integration or approval.
- **Not implemented** — requires additional code, rights, operations, vendor decision or funding.
- **Deferred** — excluded from bounded MVP for safety/product reasons.
- **Accepted** — explicitly approved by accountable church owner (none yet).

## What now differentiates the app from the website

**Home** focuses on a weekly welcome, lightweight discipleship paths and fast routes to Watch, Community and Talk To Us. Long institutional ministry descriptions are accessible when requested rather than repeated throughout Home.

**Watch** is a usable media destination: YouTube Sunday uploads, verified Shorts, in-app playlists, live player only on confirmed active broadcast, public website devotional feed and offline-sensible cached content.

**Community** is organised into five *proposed* channels, with explicit consent, membership permissions, threads, prayer support, reporting, blocking, moderator hide/lock controls and separate private pastoral care. No public accounts of children, anonymous discussions, fabricated participants or unmoderated messaging.

**Events** supports verified local schedules and local interest; staging schema supports role-controlled events and atomic registrations. Do not present a local saved interest as a confirmed event ticket.

**More / Preferences** provides true-black dark mode, light option, reading font sizes, opt-in native Sunday reminder, an in-app updates inbox, full WEB Bible reading (66 books) with highlights, journal and Scripture-group discussion cue, ministry routes, personal faith journeys, verified giving and a structured Talk To Us flow.

## Implementation evidence and release dependencies

| Area | Phase | Source or capability | Current evidence | Remaining release gate |
| --- | --- | --- | --- | --- |
| Guest navigation and theme | P0 | `App.tsx`, `src/theme.ts`, `src/AppIcon.tsx`, `src/localData.ts` | Implemented; scoped local erase, app sign-out and web regression tests | Native device + contrast/dynamic text review; cloud deletion separate |
| Onboarding | P0 | `src/Onboarding.tsx`, locally persisted skip and interest | Implemented; browser UAT | Screen reader/low literacy and cultural UAT |
| Church identity/content | P0 | `src/content.ts`, `src/churchFacts.ts` | Official site values verified 8 Nov 2026 | Church logo/photo licences and approval |
| Livestream and sermons | P0 | `src/YouTubePlayer.*`, `api/content.js` | Official videos via RSS, short clips, embedded player | Native WebView playback and YouTube live-status API key |
| Multiple social accounts | P1 | `src/SocialConnectScreen.tsx` | Official YouTube/Instagram; verified Linktree fallback for Facebook/TikTok/X; podcasts | Confirm exact account links, platform API permissions; Meta token for Instagram posts |
| Church website sync | P1 | Public read-only aggregator and verified devotional fallback | Live source and fallback exist | Approved structured CMS/news feed for complete events/content |
| Bible reader | P0/P1 | `src/BibleReader.tsx`, `api/bible.js` | 66-book public-domain WEB, validated/cached public endpoint, external fallback, offline recent chapters, notes/highlights and sharing reference | Church-owned authoritative corpus/SLA, native reading accessibility, translation choice review |
| Shared Bible study | P1/P2 | `src/CommunityScreen.tsx`, `src/community.ts` | Reference handoff; member-only Scripture group and thread RPCs | Church Supabase staging and moderator policies |
| Faith journeys | P1 | `src/JourneyScreen.tsx` | Four opt-in seven-day journeys; private local progress | Church content review, youth/intercultural participant UAT |
| Community channels | P2 | SQL `006`–`008`, community UI, moderator dashboard | Isolated DB security and browser tests | Operational moderation, safeguarding, private data retention and real Supabase UAT |
| Church contacts/Talk To Us | P0/P1 | `src/TalkToUsScreen.tsx` | Eight enquiry categories, user-approved email draft, call/maps | Approved secure in-app intake, service-level response owners and private-care workflow |
| Giving details | P0 | `src/GivingScreen.tsx` | Church IBAN + PayPal URL cross-checked with official giving page | Finance officer re-verification before launch |
| Hosted online giving | P1 | PayPal redirect through user's browser | Link implemented; no card collection or payment confirmation | Approved merchant provider, receipt/reconciliation and payment webhook |
| Native card checkout | P1/P2 | **Not implemented** | No card collection or provider keys (correct security state) | Church contract, processor choice, approved hosted or SDK checkout, VAT/PSD2/PCI review |
| Giving receipts / statements | P1/P2 | Read-only `giving_ledger` schema in backend | Gated, no client-created transactions | Authoritative processor verification and reconciliation, legal/finance approval |
| Personal profile / identity | P0 | `src/MemberHub.tsx`, Supabase OTP service, `src/authValidation.js` | OTP format defect corrected and unit-tested; new signup defaults disabled | Real church staging OTP/device tests, approved account creation and working remote deletion |
| Member event registration | P0 | Atomic registration, opt-in waitlist and member status UI | Isolated SQL migration+RLS tests; waitlist promotion and staff check-in fixture | Real event and cross-role staging UAT |
| Ministry/fellowship joining | P1 | Member Hub + scoped SQL RLS | Source implemented | Church-run volunteer and groups operations |
| Pastoral booking/prayer intake | P1 | Private schema, safe mobile service | Gated | Care roster, confidential response procedures, pastoral consent |
| In-app update inbox | P1 | `src/NotificationsScreen.tsx` | New read/unread filtering, verified public content | Operational notice approval and device QA |
| Native scheduled Sunday reminder | P1 | `src/Reminder.native.ts` | Opt-in source; web is transparently unsupported | EAS signed device testing, permissions + timezone scheduling |
| Targeted push / subscriptions | P1/P2 | **Not implemented** | Preferences local-only, no sender | APNs/FCM, sender, opt-in ledger, content permissions and moderation |
| Households / parent-managed children | P1 | **Not implemented** | No child's data collected or displayed | Guardianship policy, identity verification, safeguarding and minors' data consent |
| QR event check-in | P1 | **Staff-only idempotent check-in backend implemented; QR scanner not implemented** | Migration 009 records manual check-in reference with staff assignment controls | Real device scanning UI, event role and GDPR retention UAT |
| Event waitlist / paid tickets | P2 | **Waitlist implemented in migration 009, paid tickets not implemented** | Transactional waitlist promotion and member confirmation statuses | Real Supabase / paid entitlement integration & church approval |
| Volunteer rosters / staff scheduling | P1/P2 | **Not implemented** | Volunteer interest records only | Ministry owner and availability scheduling workflow |
| Event forms / surveys | P1/P2 | **Not implemented** | Talk To Us provides user-controlled email draft, not DB intake | Data-minimisation, staff workflow, retention and anti-spam |
| Bible translation/audio/multilingual UI | P1/P2 | English WEB only; other languages **not implemented** | No false translated content | Translation/content licensing, accessibility and intercultural usability test |
| Media captions and transcripts | P1 | Sermon schema fields only | YouTube playback may provide creator captions | Approved transcript source, privacy and licensing |
| Offline media / downloads | P2 | **Deferred** | Offline cached short Bible chapters and reading preferences only | Media distribution rights and encrypted device storage |
| AI assisted discovery / moderation | P2 | **Deferred** | No automated pastoral or doctrinal advice | Bias/hallucination evaluation, human accountability, traceability and consent |
| Advanced analytics | P2 | **Not implemented** | No invasive tracking | Event schemas, GDPR purpose limitation, privacy preserving metrics |
| Apple/Google app release | P0 release | `eas.json`, `app.config.js` | Internal and gated store build profiles | Publisher ownership, bundle IDs, signing, church approval, real iOS/Android tests |
| Administration portal | P0/P1 | `admin/`, `admin/app/moderation/` | Role-gated source, TS tests | Dedicated staging deployment, security UAT and backup/restore |

## Research-informed product decisions

**Edvantis / Study Aloud case study** ([source](https://www.edvantis.com/case-studies/application-re-engineering-of-an-adaptive-learning-platform/)): its documented work emphasises a stable core Bible reading journey, highlights, bookmarks, journalling, multilingual experience and careful profiles/notifications. **Adopted:** a complete public-domain WEB reader with local notes, highlights, offline last-read chapters and adjustable font. **Not copied:** any proprietary Bible catalogue, adaptive model, interface design or licensed text.

**Planning Center / Church Center** ([source](https://www.planningcenter.com/church-center)): member self-service, giving, group communication, signups, family check-in, volunteer rostering. **Adopted:** member self-service architecture, group roles and a roadmap that treats financial/children's records as governed workflows. **Not adopted or integrated:** their backend, payments, family check-in and recurring giving; those are still separate product/permission decisions.

**Subsplash Groups** ([source](https://support.subsplash.com/en/articles/8500894-subsplash-groups-messaging)): managed groups, audience roles, visibility, controlled invitations and member conversations. **Adopted:** scoped group messaging, moderator controls and clear public-vs-member channels. **Not adopted:** direct vendor connection or their proprietary backend.

**Product choice:** A smaller, independent app that lets people access public church media and Scripture immediately, then join trusted, staffed conversations when ready, is preferable to an overloaded app that advertises incomplete payments, push, family check-in and pastoral tools.

## Intercultural and multigenerational acceptance

The application must welcome visitors irrespective of nationality or Christian tradition; avoid stereotyping, assuming a young audience, excluding people who are not members, or requiring payment/sign-in for faith content. The following need actual participant UAT rather than marketing claims:

1. Cross-generational testing with elders, parents, younger adults and first-time visitors.
2. Faith language that is welcoming and respectful; church leadership retains doctrine and pastoral policy authority.
3. Accessibility: VoiceOver/TalkBack, large type, high contrast in true-black and ivory themes, reduced motion, captioned video and clear touch targets.
4. Sensitive families/youth queries route through Talk To Us, never open a public unmoderated youth chat or expose minors.
5. Inclusive non-gamified optional weekly reflections; no streak pressure or public ranking for participation/prayer.
6. Additional languages only after reviewed translations and authentic localisation by multilingual community members.

## Release status, approvals and controls

**Current release state: UAT preview, NOT ACCEPTED / NOT VERIFIED LIVE IN STORES.**
Native binaries, social-platform access tokens, the current ChMeetings publisher rights, church-approved bank beneficiary name, integrated processor, cloud identity, finance reconciliation, pastoral staffing, moderation policies and GDPR decisions are not supplied/verified. None may be represented as delivered merely because an interface/schema exists.

**Minimum first public pilot:** Church signs off branding, verified giving details and online recipient, public content licences, support/privacy notice, native device checks, basic accessibility, browser API quota, incident response and owner. Keep community account and payments feature gates off.
**Member community pilot:** Add real isolated Supabase staging, role/realtime RLS tests, reporting escalation and consent, two synthetic members, signed native UAT builds and real-world moderated pilot. Owner sign-off required.
**Full operational release:** Add registered processor, financial reconciliation, chmeetings migration, incident/rollback, store publisher signing, family safeguards, monitoring, security review and independent acceptance.

## Verification standard

- The repository GitHub Actions workflow runs 6 checks: mobile TS, admin TS, Vercel public-content API contract, SQL syntax, isolated PostgreSQL migrations+RLS+waitlist/check-in integration, mobile/desktop Playwright browser UAT with captures.
- Always verify these six jobs against the **latest head SHA**; previously passing runs are superseded after a push.
- Browser tests verify UI and boundary contract, **not** real Android/iOS playback, payment, Supabase Auth/Realtime or church ops sign-off.
- PR #2 remains **draft**; preview runs in a separate Vercel project, no changes to the real church website or existing store listings.

## Handover artifacts

- `docs/PILOT_RELEASE_ACCEPTANCE.md`: church-owned guest pilot, member pilot, store release conditions and explicit signoff record.

- `docs/NATIVE_DESIGN_SYSTEM.md`: visual and accessibility foundation.
- `docs/SOCIAL_MEDIA_AND_STORES.md`: public sources, credentials and store release gates.
- `docs/COMMUNITY_UAT_AND_GOVERNANCE.md`: moderation and membership policies.
- `docs/UAT_PLAN.md`: detailed personas and acceptance journeys.
- `docs/MVP_RELEASE_CANDIDATE.md`: bounded deployment and staged rollback.

**Decision needed:** Church product owner to identify whether the goal is (A) public content MVP, (B) authenticated community UAT, or (C) full church operational migration; authorise the appropriate church-owned accounts and scope. Until then, ship only the browser-tested public preview.
