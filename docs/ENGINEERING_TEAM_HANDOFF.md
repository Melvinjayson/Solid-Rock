# Solid Rock Centre — engineering hand-off (9 November 2026)

**Status: Source ready for engineering review; not approved for production or app stores.**

This branch is a cloneable engineering baseline built on the church-aligned MVP in [PR #3](https://github.com/Melvinjayson/Solid-Rock/pull/3), itself based on the functional MVP in [PR #2](https://github.com/Melvinjayson/Solid-Rock/pull/2).

## Clone and run

```bash
git clone https://github.com/Melvinjayson/Solid-Rock.git
cd Solid-Rock
git fetch origin handoff/church-engineering-2026-11-09
git checkout handoff/church-engineering-2026-11-09
npm install
npm run typecheck
node --test tests/*.test.cjs
npx expo-doctor
npm run web
# To exercise browser UAT in a configured environment: npm run test:e2e
# In a second terminal: cd admin && npm install && npm run typecheck && npm run dev
```

Use the repository's `.env.example` and `admin/.env.example` for local configuration. **Never commit secrets.** The public Expo variables are not secret storage. Do not enable member signup or apply database migrations as part of cloning.

## Canonical source and evidence

- **Mobile:** Expo SDK 54 / React Native / TypeScript, root `App.tsx`, `src/`.
- **Navigation:** Home · Watch · Events · Give · More. Home prioritises approved church announcements, verified livestream, giving, teaching and church gatherings.
- **Media:** `src/mediaFeed.ts`, `src/YouTubePlayer.*`, `api/content.js` — official YouTube content; no fabricated LIVE status.
- **Bible:** `src/BibleReader.tsx`, `api/bible.js` — public-domain WEB, local highlights/journals and cache; source-hosted SLA still needed.
- **Giving:** `src/GivingScreen.tsx` — published giving information/hosted destination only; no direct card handling.
- **Member/community:** `src/MemberHub.tsx`, `src/CommunityScreen.tsx`, `src/backend.ts` — foundations only; new member signup disabled until deletion, privacy and safeguarding gates pass.
- **Staff:** `admin/` Next.js starter, partial editor/moderation/check-in workflows; the church PDF's ten admin modules are not all implemented.
- **Database:** `supabase/migrations/202611080001…009`, RLS and transactional RPCs; **not approved to run on an existing church database**.
- **Quality:** `tests/`, `.github/workflows/mobile-validate.yml`; `app.config.js` and `eas.json` gate native release configuration.
- **Documentation:** `docs/ROADMAP_DELIVERY_AUDIT.md`, `docs/PILOT_RELEASE_ACCEPTANCE.md`, `docs/CHURCH_DESIGN_ALIGNMENT_2026-11-09.md`, `docs/COMMUNITY_UAT_AND_GOVERNANCE.md`, `docs/DEPLOYMENT_GUIDE.md`.

The previous exact baseline commit `2528acbec4d5f220d960c16ac6d11112a83eb18d` passed [six CI jobs and 42 browser scenarios](https://github.com/Melvinjayson/Solid-Rock/actions/runs/42593455005). **Those checks are not automatically evidence for newer commits or native devices.** Browser design preview for that baseline: https://solid-rock-mobile-preview-7pn8ifw0z-revetacorp-ecosystem.vercel.app/.

## Church-team source and design materials

The church supplied a separate **28 October Expo Router project ZIP**, a **24-page app/admin design PDF** and an original clickable prototype. These are distinct from this repo's Expo shell. Their **source code is not silently merged** here. The church's original ZIP contains its own authentication, capability-grid role model, Supabase schema, navigation, assets and demo content; its 25 database tests were not independently executed. The PDF is a proposed admin design, not a deployed console.

The full separately delivered engineering hand-off archive contains the church ZIP snapshot, design reference, visual montages, architecture comparison, 44-row feature register, 36-item backlog, 36 UAT cases, release gates and source hashes. **That binary archive is not checked into this GitHub branch**; the project coordinator should provide it privately to authorised church engineers. Do not upload sample personal records or illustrative bank details into production.

## Architecture decision: do not restart or merge schemas blindly

**Recommended:** keep this working Expo SDK 54 application as the pilot's executable baseline. Use the church's design PDF as the visual and IA reference. Port church team's components and Sanctuary green/cream/gold tokens selectively after the original design author reviews them; preserve the dark-default/light-toggle experience until church approval changes it.

The two projects use different Expo/router generations and different authentication and role structures. Before integration:
1. Assign one church technical lead and decide canonical auth identity/profile IDs.
2. Compare the church capability grid to `staff_roles`, group membership, pastoral and moderation RLS.
3. Compare both SQL migration sets in an **isolated scratch database with synthetic identities**.
4. Write a migration ADR and verify role escalation denial, cross-user isolation, audit, booking concurrency and restore.
5. Require explicit privacy, safeguarding and church technical approval before using real membership data.

## Engineering checklist

### P0 — public app and design
- [ ] Confirm church product sponsor, original prototype author/design owner, mobile lead and QA owner.
- [ ] Reproduce this branch and run mobile, admin, API, Expo doctor and browser checks on exact SHA.
- [ ] Review original PDF pages 3–14 against Home, Watch, Events, Give, More on Android and iOS.
- [ ] Verify actual logo, photography rights, accessible typography, colours, responsive cards and true-black/light toggle.
- [ ] Remove invented prototype names, giving figures, bank accounts, dates, service times and sample events.
- [ ] Test live vs non-live YouTube, video playback, Shorts, playlists, network fallback and offline.
- [ ] Have church treasurer independently reconfirm beneficiary and hosted giving destination.
- [ ] Test public Bible reading, saved highlights, journal and full local privacy erase.
- [ ] Test real devices: small iPhone, Android, VoiceOver/TalkBack, large text and navigation.
- [ ] Get written design/product acceptance for exact internal build SHA.

### P1 — staging, staff and identity
- [ ] Church-owned isolated staging Supabase with synthetic users and backups.
- [ ] Approve canonical roles/data ADR before applying SQL.
- [ ] Test staff content publishing, rollback, moderation, event registration, waitlist and check-in.
- [ ] Implement and verify **remote account deletion** before enabling new member signup.
- [ ] Confirm retention, data-subject rights, privacy notice, support and incident procedures.
- [ ] Verify native notifications permission, opt-out and delivery.

### P2 — protected member community
- [ ] Church safeguarding lead approves adult/youth boundaries, reporting and human moderator rota.
- [ ] Test message visibility, abuse reporting, block, rate limiting and audit with synthetic accounts.
- [ ] Protect confidential pastoral requests and prayer content with authorised access and deletion.
- [ ] Run bounded member UAT only after real identity, privacy and safety gates pass.

### Store release
- [ ] Church confirms Apple/Google/EAS ownership, bundle IDs, package name and signing.
- [ ] Signed internal TestFlight/Play builds pass device and accessibility UAT.
- [ ] Church approves finance, privacy, safeguarding, content, support, rollback and store declarations.
- [ ] Product owner signs off exact source SHA and build before production submission.

## UAT matrix (minimum)

| ID | Priority | Test |
|---|---|---|
| U01 | P0 | First-run welcome, skip, relaunch |
| U02 | P0 | Tab order and back navigation |
| U03 | P0 | Official announcements and truthful live state |
| U04 | P0 | In-app YouTube prerecorded/live/Shorts/playlists |
| U05 | P0 | Give recipient and secure hosted link |
| U06 | P0 | Real events and visiting information |
| U07 | P0 | Bible, journal, offline fallback and privacy erase |
| U08 | P0 | Theme persistence, accessibility, screen readers |
| U09 | P0 | Signed Android device smoke |
| U10 | P0 | Signed iOS device smoke |
| U11 | P1 | OTP, forbidden account creation, remote deletion |
| U12 | P1 | Role escalation denial and event concurrency |
| U13 | P1 | Staff publishing, audit and rollback |
| U14 | P2 | Community moderation and youth safeguards |
| U15 | P2 | Pastoral privacy and deletion |

For every test record **tester, device, OS, environment, SHA, expected, actual, evidence, issue and retest**. No UAT result is assumed from source inspection.

## Decisions and accountability

| Decision | Proposed | Owner | Status |
|---|---|---|---|
| One repo and branch strategy | This repo and code review PR | Church technical lead | Proposed |
| Design source | Original church PDF/prototype | Design author + sponsor | Review |
| Mobile runtime | Existing Expo 54 | Mobile lead | Proposed |
| Identity and schema | One canonical spine, no dual migrations | Backend/security lead | Blocked |
| New member signup | OFF until functional deletion | Privacy lead | Blocked |
| Community messaging | Human-moderated separate pilot | Safeguarding lead | Blocked |
| Giving | Verified bank/hosted destination only | Treasurer | Pending |
| Native release | Internal UAT then approved stores | Product + QA + engineering | Not approved |

**Release stop:** unverified giving, role/privacy failures, unmoderated sensitive messaging, failed native critical paths, missing store ownership or missing church sign-off. No production changes are authorised by this hand-off.
