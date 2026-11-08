# Solid Rock Dublin — MVP Release Candidate and Handover

**Release candidate:** 0.1.0 UAT Preview  
**Branch:** `feat/solid-rock-expo-mvp`  
**Target:** Isolated Vercel browser preview and optional Expo native internal builds; existing church app stores and website remain untouched.  
**Owner of church acceptance:** Solid Rock Dublin's authorised product representative (not yet recorded).  
**Status:** **Implemented and browser-tested; not accepted for live membership operations.**

## MVP definition

The bounded initial MVP is a useful, church-branded **public visitor and discipleship experience** that works without an account:

1. Home with official worship time, address, directions, visit link and ministry information.
2. Watch with official church welcome audio, published devotionals and original study guides.
3. Events with verified weekly worship information and saved local interest (NOT a registration confirmation).
4. Give with church-approved informational link; NO payment collection or fake financial data.
5. More with church details, ministry links, privacy information and locally saved items.
6. Dark-first and persistently switchable light mode; Poppins/Mulish type and church website colours.
7. Search, bookmarks and personal reading progress stored locally; user-controlled deletion.
8. Responsive layout, labelled controls, and graceful handling of an unconfigured backend.

The optional Church Hub contains **code for** authenticated member services, but is deliberately off in preview until all staging and privacy approvals have passed. No publicly available backend configuration is implied.

## Verified checks

Automated checks executed in GitHub Actions include:
- Expo/React Native TypeScript validation.
- Next.js administration TypeScript validation.
- Playwright chromium mobile/desktop browser flows: Home, Watch, Events, Give, More, Church Hub, dark/light theme, local persistence, Watch hero contrast and local deletion confirmation.
- PostgreSQL SQL migration **syntax parsing only**, not database execution.
- Browser screenshot artifacts uploaded by Actions; they are not evidence of Android/iOS native usability.
- Separate Vercel project deployment builds the Expo Web output from this branch.

**Important:** Check the latest head SHA's CI status rather than assuming a prior passing run applies after a code change. Run the complete suite again before any merge or release.

## Critical remaining release gates

| Gate | Evidence required | Owner |
| --- | --- | --- |
| Branding/content approval | Church confirms logos, imagery rights, ministry copy, service times and contact information | Church product/content owner |
| Member data readiness | Dedicated Solid Rock Supabase staging provisioned; reviewed migrations applied; staff role grants verified | Church technical/security owner |
| Auth integration | OTP delivery, session expiry/recovery, cross-user access and account closure tested | Technical/security owner |
| RLS & transactions | Member/pastor/finance/group leader isolation and event/appointment concurrency verified against database | Security/QA reviewer |
| ChMeetings continuity | Member migration, consent, store signing/publisher ownership and cutover procedure approved | Church operations owner |
| Care & safeguarding | Prayer workflows, minors/household policy, response SLAs, retention and escalation accepted | Pastoral/safeguarding owner |
| Giving | Verified payment recipient, processor, webhook signatures, reconciliation, refunds and finance approval | Church finance owner |
| Accessibility | Native screen readers, dynamic text, keyboard, contrast and low-connectivity review | QA/accessibility owner |
| Android/iOS UAT | Signed internal preview builds installed and tested on representative devices | QA/release owner |
| Operations | Privacy notice, support, monitoring, incident response, backup/restore and rollback rehearsed | Church product/technical owner |

The authenticated and payment workflows MUST NOT be represented as ready for real users until their gates pass. No live member records, financial actions, real prayer requests or store submissions were executed as part of this implementation.

## Internal UAT launch protocol

- Run tests on the exact candidate SHA and retain artifacts.
- Invite consented test participants with **synthetic** member accounts and no sensitive personal data.
- Record task completion, navigation errors, accessibility issues and unexpected states using `docs/UAT_PLAN.md`.
- Assign each blocker an owner, severity, reproducible steps and retest evidence.
- Obtain formal church acceptance before wider member onboarding.
- For a guest-only pilot, obtain at least branding/content, privacy, accessibility, support and controlled link-sharing approval. Do not conflate that pilot with production member-services readiness.

## Technical setup

- Public app: `npm install && npm run typecheck && npx expo start`.
- Browser build: `npm run build:web`.
- Browser UAT: `npm run test:e2e`.
- Native internal build configuration: `eas.json`. Preview-only bundle identifiers are configured in `app.json`; do **not** overwrite the existing app-store identifiers.
- Backend: `EXPO_PUBLIC_CHURCH_BACKEND_ENABLED=false` by default. Set true only for the approved **isolated staging** Supabase project, with publishable credentials.
- Staff portal: `cd admin && npm install && npm run typecheck && npm run dev`; role-gated source, not yet a deployed/staging-verified operational system.

## Rollback

- Vercel: select a known-good previous deployment of the dedicated `solid-rock-mobile-preview` project.
- Expo app stores: no production rollout was performed; no rollback required.
- Database: no migrations were applied. Before future staging/production migrations, take reviewed backups and test forward fixes and restoration.
- Feature shutdown: keep `EXPO_PUBLIC_CHURCH_BACKEND_ENABLED=false` in the public preview.

## Acceptance record

- Sponsor approval: **Pending**
- Technical security approval: **Pending**
- Pastoral/safeguarding approval: **Pending**
- Finance approval: **Pending**
- Native iOS/Android UAT: **Not run**
- Public web UAT automation: **Implemented and executed**
- Production release: **Not authorised / not performed**

This document is intentionally a truthful candidate handover rather than a declaration of production completion.
