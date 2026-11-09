# Solid Rock Centre — Native Mobile Church Companion

> **Church engineering team:** Start with the [Engineering hand-off guide](docs/ENGINEERING_TEAM_HANDOFF.md) and [editable build backlog](docs/handoff_engineering_backlog.csv). Clone branch `handoff/church-engineering-2026-11-09` for the church design-aligned implementation. This is a review baseline, not a production release.


**Status:** Implemented source + browser/UAT preview on draft feature branch. **Not released to the App Store, Google Play or general church membership.**
**Repository:** `Melvinjayson/Solid-Rock` · **Branch:** `feat/solid-rock-expo-mvp` · **Review:** [PR #2](https://github.com/Melvinjayson/Solid-Rock/pull/2).
**Church source of truth:** [solidrockdublin.org](https://solidrockdublin.org/) · [Giving](https://solidrockdublin.org/give).

## Product intent

A distinctive, church-owned, **native-first faith and community experience** that brings people together during the week rather than reproducing a church website. No account is required to watch official public videos, read Scripture, explore church information or save personal preferences.

The main navigation is **Home · Watch · Community · Events · More**.

- **Home:** weekly worship, curated study, personal faith journeys, connection and welcome.
- **Watch:** official YouTube messages, Shorts, playlists and livestream only when a trusted YouTube response confirms a broadcast is active.
- **Community:** five proposed group channels, prayer acknowledgements, threaded discussions and report/block controls. Real member posting is **disabled** in public preview until protected staging, moderation and safeguarding UAT are accepted.
- **Events:** approved public listings, locally saved interest and code for registration, opt-in waitlists, cancellation, automatic promotion and event-staff check-in.
- **More:** World English Bible reader, reading highlights, journal, preferences, church giving, notifications, Talk To Us, social profiles, account, privacy and replayable onboarding.

## Implemented public experience

- Expo SDK 54 / React Native / TypeScript. Dark mode uses a **true-black** background with ivory text, warm gold accents and an optional light theme.
- First-run welcome/skip, responsive five-tab navigation, Poppins/Mulish typography, one Ionicons family and comfortable card/button touch targets.
- **Bible:** 66-book public-domain World English Bible with a bounded, CDN-cacheable `api/bible.js` gateway (external source fallback), device-only recent-chapter cache, highlights, notes and optional group-study handoff. A church-hosted authoritative data corpus is still a release gate; no unlicensed translations are included.
- **Faith journeys:** four voluntary seven-day learning paths, suited to new visitors, adults, family reflection and community engagement. No streaks or participation rankings.
- **Giving:** bank account IBAN `IE23 BOFI 9033 6590 5850 99`, verified against the official church giving page, with copy action; hosted `https://www.paypal.com/paypalme/solidrockcentre` redirect for online payment. **No card data entered or stored in this app.** Card checkout is PayPal-controlled and may vary by region.
- **Talk to Us:** eight topics including prayer, new visitors, youth/families, accessibility, outreach and giving; user-controlled email drafts and verified church phone/email/directions.
- **Notifications:** in-app read/unread updates from public church announcements, devotionals and videos. Opt-in native *local* Sunday reminders; remote push or marketing notifications are not active.
- **Social:** confirmed direct YouTube and Instagram profiles, verified church Linktree directory for Facebook/TikTok/X until exact destinations are confirmed, optional Meta-authorised post feed, Apple Podcasts entry.
- **Church content sync:** Vercel read-only cached `api/content.js`, official YouTube RSS videos and curated Shorts, confirmed website devotional links; no fabricated events, social posts, donations or attendees.
- **Guest privacy:** a scoped device erase clears all app-owned `@solidrock:` storage (including private notes, Bible caches and faith journey progress) and signs out locally when configured. This does **not** delete an associated church account; cloud deletion requires a separate accepted service. The public preview has no member database.

## Member and staff foundations — gated

- `src/backend.ts`, `src/MemberHub.tsx`, `src/community.ts`, `src/CommunityScreen.tsx` contain Supabase OTP/member profiles, church events, group joining, secure community posting, pastoral booking and giving-history reads. Six-digit OTP validation is unit-tested; **new member signup defaults to off** until remote deletion, privacy and safeguarding gates are accepted.
- PostgreSQL migrations under `supabase/migrations` define member-scoped RLS, moderation, prayer acknowledgements, event waitlists and staff-only check-in. They are **not deployed to a church production or staging project**.
- `admin/` contains a Next.js staff dashboard and pastor/super-admin moderation controls.
- Every privileged workflow needs approval, authenticated staging, operational owners and real Android/iOS UAT. Enabling a client configuration flag alone does not establish release readiness.

## Development

Install Node.js 22 and npm, then:

```bash
npm install
npm run typecheck
npx expo start
```

Browser preview: `npm run build:web`, then `npm run test:e2e`. The E2E suite uses Playwright Chromium on mobile and desktop viewports.

Public API tests: `npm run test:content`. GitHub Actions additionally checks OTP validation, safe store configurations, public-domain Scripture gateway, Expo SDK dependency compatibility and applies SQL migrations to **isolated PostgreSQL** and checks role isolation, moderation, event waitlist and check-in behaviour.

### Environment

Start from `.env.example`. `EXPO_PUBLIC_CHURCH_BACKEND_ENABLED=false` is intentional. The public web preview reads its read-only content API from same-origin `/api/content`; native binaries need a persistent HTTPS public media endpoint configured through `EXPO_PUBLIC_CONTENT_API_URL`. Never expose service-role, payment, YouTube or Meta tokens in `EXPO_PUBLIC_*`.

See `docs/DEPLOYMENT_GUIDE.md` and [church pilot acceptance pack](docs/PILOT_RELEASE_ACCEPTANCE.md) before configuring a separate Solid Rock staging database or native internal EAS builds.

## Repository structure

```text
App.tsx                    Native screens, navigation and public experience
src/                      Theme, onboarding, media, Bible, contact, giving, social and preferences
api/content.js             Cached read-only media/website content service
supabase/migrations/       Staging-only relational schema and security
admin/                     Church-operated Next.js staff workspace
tests/e2e/                 Browser interaction and visual smoke tests
tests/db/                  Isolated PostgreSQL security and event tests
docs/                      Canonical roadmap, research, safety, UAT and handover
eas.json, app.config.js    Gated internal/native store build configuration
```

## Canonical documentation

- [Evidence-based P0–P2 delivery audit and unresolved gaps](docs/ROADMAP_DELIVERY_AUDIT.md)
- [Original implementation roadmap (historical)](docs/IMPLEMENTATION_ROADMAP.md)
- [Current feature status](docs/FEATURE_STATUS.md)
- [Native design system and accessibility](docs/NATIVE_DESIGN_SYSTEM.md)
- [Community safety and UAT](docs/COMMUNITY_UAT_AND_GOVERNANCE.md)
- [Social provider and app-store integration](docs/SOCIAL_MEDIA_AND_STORES.md)
- [MVP release and handover](docs/MVP_RELEASE_CANDIDATE.md)
- [General UAT plan](docs/UAT_PLAN.md)
- [Church pilot release and acceptance pack](docs/PILOT_RELEASE_ACCEPTANCE.md)

## Release and verification boundaries

**No existing ChMeetings Android or iOS app store listing has been modified.** Neither the church website nor payment/accounts have been changed. Browser builds/CI are not native Android/iOS device acceptance. Required church approvals include branding/media rights, GDPR/retention, child safeguarding, social account and finance credentials, moderator staffing, ChMeetings publisher signing/ownership, monitoring/rollback and independent user testing.

Do not label the app **production-ready**, **PCI compliant**, **verified live**, or **fully integrated** until these separate release gates pass. The repo is a reviewed source implementation with a protected preview and draft pull request.
