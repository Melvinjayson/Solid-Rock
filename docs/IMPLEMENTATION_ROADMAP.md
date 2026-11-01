# Solid Rock Mobile Platform

Implementation planning baseline — 1 November 2026.

## Objective
Modernise the existing Solid Rock church application for iOS and Android, retaining operational continuity with ChMeetings while introducing a church-owned mobile experience and administration portal.

## Product navigation
Home · Watch · Events · Give · More

Public access: service details, sermons, Bible, public events, announcements.
Authenticated access: member profile, registrations, giving history, fellowship membership, pastoral appointments.

## Architecture decision
Build Solid Rock as an independent application, selectively extracting verified code from the archived private `Melvinjayson/liberty-tv` repository. Do not deploy the complete Liberty spiritual-intelligence stack.

- Mobile: Expo / React Native / TypeScript
- Administration: Next.js
- Identity and relational data: Supabase Auth / PostgreSQL with row-level security
- Media: integrate current church streaming provider first; assess Liberty content ingestion for reuse
- Scripture: validate Liberty Bible datasets, licensing and search implementations
- Integrations: existing ChMeetings, official church website, payment provider, notifications
- AI: defer until consent, content provenance, governance and operational need are established

### Verified Liberty repository evidence
- `apps/mobile/package.json`: Expo 52, React Native 0.76, Expo Router, Supabase, SQLite, notifications.
- `apps/mobile/src/app/_layout.tsx`: authenticated-only routing to Liberty discovery/onboarding. Solid Rock needs public-first navigation.
- `apps/web/package.json`: Next.js 14, Supabase.
- `apps/api-ai/pyproject.toml`: FastAPI, LangGraph, Pinecone, Neo4j and AWS libraries.
- `packages/shared/src/index.ts`: exports user, Scripture and sermon types among Liberty-specific types.
- `packages/scripture-db/package.json`: Scripture package declares Python lint and test scripts.
- `packages/content-pipeline/package.json`: content ingestion package declares Python lint and test scripts.
- `infrastructure/aws/package.json`: AWS CDK infrastructure scripts.
These are code/configuration observations, not production-readiness verification.

## Feature priorities

| Domain | Launch (P0) | Next (P1) | Later (P2) |
| --- | --- | --- | --- |
| Identity | Guest access, login, profile, member linking, roles | Households | Advanced preferences |
| Worship | Live player, sermons, search, notes | Audio, captions, bookmarks | Offline downloads |
| Discipleship | Bible reader, prayer requests, ministry information | Reading plans, fellowships, volunteering | Group communication |
| Events | Calendar, registration, administration | Paid tickets, QR check-in, pastoral appointments | Waitlists |
| Giving | Verified fund and recipient information | Secure online giving, receipts, reconciliation, statements | Recurring gifts |
| Operations | Content publishing, event management, roles, notifications, audit | Care queues, forms, volunteer rosters | Advanced reporting |

## Domain model
Identity: users, member_profiles, households, roles, consents.
Church: campuses, schedules, ministries, announcements, pages.
Media: sermons, series, media_assets, notes, progress.
Community: fellowships, memberships, volunteer_opportunities.
Events: events, registrations, tickets, check_ins.
Care: appointments, prayer_requests, care_cases, forms.
Finance: giving_funds, payment_destinations, transactions, allocations, reconciliations, statements.
Operations: notifications, preferences, sync_jobs, audit_events.

## Delivery roadmap (indicative 24 weeks)
1. Weeks 1–2: Ownership, ChMeetings integration/export, Liberty code audit, content validation.
2. Weeks 3–5: Expo scaffold, design system, identity and data foundation, CI/CD.
3. Weeks 6–10: Public-first navigation, Home, Watch, Bible, Events.
4. Weeks 9–13: Admin portal, content publishing, notifications and member management.
5. Weeks 12–17: Giving, pastoral care, forms, fellowships, integrations.
6. Weeks 18–21: Security, accessibility, migration rehearsal, device QA, pilot.
7. Weeks 22–24: App-store releases, staged rollout, monitoring, support.

## Delivery gates
- G0: Publisher/store ownership and migration feasibility confirmed.
- G1: Foundation and design approved.
- G2: Core journeys backed by real content.
- G3: Operational integrations pass end-to-end tests.
- G4: Privacy, security, accessibility and pilot sign-off.
- G5: Monitored production release.

## Critical decisions and risks
1. Existing Android/iOS app publisher, signing keys, bundle identifiers, listing transfer and ChMeetings contractual rights.
2. Reconcile official church service address/times with prototype sample content; never publish sample banking details.
3. Separate Solid Rock personal data from Liberty AI datasets and infrastructure.
4. Enforce server-side permissions and confidential pastoral data boundaries.
5. Verify payment destinations, webhooks, idempotency and financial reconciliation.
6. Audit dependency vulnerabilities and upgrade Expo/Next.js before production.
7. Validate Scripture redistribution rights and media content permissions.
8. Assess safeguarding, GDPR special-category data and accessibility.
9. Verify actual Liberty implementation and tests before extracting modules.

## Initial backlog
- SR-001: Audit Liberty files, runtime and test coverage.
- SR-002: Confirm ChMeetings migration/API and publisher ownership.
- SR-003: Define Solid Rock domain contracts and role permissions.
- SR-004: Scaffold mobile and admin applications.
- SR-005: Implement guest-first route groups and five tabs.
- SR-006: Connect official church content and sermon media.
- SR-007: Build event registration vertical slice.
- SR-008: Add secure member linking and profile.
- SR-009: Implement admin content and notification workflows.
- SR-010: Design giving ledger, payment provider and reconciliation.
- SR-011: Implement private pastoral appointment workflow.
- SR-012: Complete automated tests, privacy/security reviews and release plan.

## Acceptance targets (proposed, not measured)
99.5% API availability; at least 99% crash-free beta sessions; zero unresolved critical security findings; all published payment destinations independently verified.

## Source repositories
- https://github.com/Melvinjayson/Solid-Rock
- https://github.com/Melvinjayson/liberty-tv

No production application implementation is claimed in this document.
