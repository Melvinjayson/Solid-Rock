# Solid Rock Centre — Mobile App MVP

> **Implementation status:** Runnable Expo/React Native source implementation on feature branch. This is an interactive prototype and not a released app. No church membership, payment, sermon-hosting or appointment backend has been connected.

## Run locally

Requires Node.js and npm. Install dependencies with an internet connection.

```bash
npm install
npx expo start
```

Open the Expo development server using Android Emulator, iOS Simulator (macOS), or a compatible Expo Go client. The package currently targets Expo SDK 54. To check TypeScript after installation:

```bash
npm run typecheck
```

## What works in this implementation

- Native iOS/Android five-tab navigation: **Home, Watch, Events, Give, More**.
- Home cards and visitor-first navigation with no mandatory account.
- Study-guide catalogue with searchable titles and local bookmarks.
- Weekly activity cards with interest toggles stored locally through AsyncStorage.
- My saved items: remove bookmarked study guides and saved event interests.
- Bible resources and ministry links to the official church website.
- A privacy-conscious draft prayer field that is not transmitted or saved.
- Giving guidance that points to the official church site, without fictional accounts or transactions.
- Responsive mobile layout, screen labels, safe-area support, loading and storage error states.

### Not implemented / not connected

- Actual church event calendar, registration and attendance records
- Member authentication, ChMeetings data sync and household accounts
- Livestream/sermon feeds and digital Bible text distribution
- Payment processing, statements and financial reconciliation
- Pastoral appointments, live prayer submissions and push notification delivery
- Admin console, backend APIs and app-store builds

**Never treat sample study guides or weekly gathering cards as official church schedules or sermon recordings.** Validate service details before publication.

## Repo structure

```text
App.tsx              Interactive mobile screens and state
src/content.ts       Clearly labelled starter content and official church URL
src/theme.ts         Reusable visual tokens
app.json             Expo mobile configuration
package.json         Expo and React Native dependencies
docs/                Architecture, scope and delivery roadmap
```

## Reveta OS design relationship

The palette uses the Reveta OS brand reference colours (RV-DEC-2026-042) as *design inspiration*. Solid Rock retains an independent identity; no Reveta logo, private design files, employer assets or restricted templates have been copied. A church-approved logo and complete brand asset pack can be integrated once approved and available.

## Validation still required

Because no dependency installation or simulator build was executed in this authoring environment, this branch needs CI/typecheck and device smoke testing before it can be considered verified. See [mobile QA checklist](docs/MOBILE_QA.md).

---

## Original product brief

> **Project status: Planning and architecture definition.** This repository currently contains implementation documentation, not a released mobile application or a verified working backend.

Solid Rock is a proposed modernisation of the existing Solid Rock Centre church mobile application for **Android and iOS**, bringing worship, discipleship, community engagement, events, giving, pastoral support and church administration into one accessible digital experience.

The goal is to provide a welcoming public experience for visitors and a trusted, personalised service for church members, ministry leaders, pastors and administrators. The initiative is intended to evolve the existing app, not to disrupt active church operations or abandon existing member records.

- Church website: https://solidrockdublin.org/
- Existing Android listing: https://play.google.com/store/apps/details?id=com.jiosdev.chmeetings.solidrockdublin
- Related architecture reference: [Liberty-TV](https://github.com/Melvinjayson/liberty-tv) (private, archived)
- [Implementation roadmap](docs/IMPLEMENTATION_ROADMAP.md)

## Vision

**One connected digital home for worship, community and service.**

The app should help people discover Solid Rock, follow live services and sermons, engage with Scripture, register for events, join fellowships, request prayer or pastoral support, participate in ministries and give securely. Church staff should have a separate administration portal for content, membership, events, communications, finance reconciliation and access governance.

### Product principles

1. **Public-first:** Visitors can discover services, sermons, public events and Scripture without mandatory registration.
2. **Member-centred:** Authenticated experiences make participation easier without exposing private church records.
3. **Accessible and inclusive:** Design for varied ages, abilities, devices and connectivity.
4. **Privacy and safeguarding by design:** Protect religious-affiliation data, minors' information, pastoral records and giving history.
5. **Operational continuity:** Validate ChMeetings data and publisher migration before replacing existing workflows.
6. **Church-controlled:** The church governs content, permissions, financial destinations and member data.
7. **Modular delivery:** Ship useful journeys before advanced personalisation or AI.

## Who the platform serves

| Audience | Needs |
| --- | --- |
| Visitor | Find the church, service details, livestreams, sermons, public events and contact information |
| Member | Manage profile, follow sermons, register for events, join groups, access giving history and receive announcements |
| Ministry volunteer | Discover opportunities, register interest, view approved ministry assignments |
| Group leader | Coordinate fellowship membership and approved group activities |
| Pastor / care team | Manage confidential appointments and prayer or care requests within explicit permissions |
| Finance team | Verify giving destinations, reconcile payments, issue statements and review audit records |
| Church administrator | Publish content, manage events, notifications, roles and operational settings |

## Proposed mobile navigation

**Home · Watch · Events · Give · More**

- **Home:** Service information, personalised welcome, announcements, upcoming events, quick actions and recent sermons.
- **Watch:** Livestreams, sermon archive, series, search, playback and Scripture references.
- **Events:** Church calendar, event details, registration, reminders and later QR check-in.
- **Give:** Verified giving funds, donation guidance and later secure online giving, receipts and statements.
- **More:** Bible, fellowships, ministries, prayer requests, pastoral appointments, profile, family and preferences.

A separate **Next.js administration portal** is planned for church staff. Financial and pastoral permissions must be narrower than a general administrator role.

## Feature delivery priorities

### Launch baseline (P0)
- Guest browsing and accessible navigation
- Sign-in, account recovery, member linking and role-based access
- Home content, service details, announcements and notifications
- Livestream and searchable sermon archive
- Bible reading with verified content rights
- Events calendar and free registration
- Prayer request submission with confidential handling
- Verified giving instructions and categories
- Administrative publishing, event management, access controls and audit trails

### First expansion (P1)
- Household profiles and fellowship groups
- Sermon notes, audio, captions and bookmarks
- Devotionals and reading plans
- Volunteering and ministry interest
- Paid events, check-in and reminders
- Pastoral appointment scheduling
- Secure payments, reconciliation, giving history and statements
- Administrative forms, volunteer rosters and care workflows

### Future exploration (P2)
- Offline media and advanced search
- Group communication and waitlists
- Recurring donations
- Carefully governed AI-assisted sermon and Scripture discovery
- Advanced analytics and content recommendations

Features are **proposed**, not represented as implemented.

## Technical architecture

The recommended architecture selectively adapts reusable components from Liberty-TV while keeping Solid Rock operationally and legally independent.

| Layer | Proposed technology | Purpose |
| --- | --- | --- |
| Mobile | Expo, React Native, TypeScript | Shared Android and iOS application |
| Admin | Next.js, TypeScript | Staff and ministry operations |
| Identity | Supabase Auth | Authentication, member linking and roles |
| Data | PostgreSQL with row-level security | Church domain data |
| API | Validated server-side domain services | Permissions and business logic |
| Media | Existing church streaming provider first; Liberty components after audit | Livestreams, sermon catalogue and optional transcription |
| Scripture | Adapted Liberty Scripture module after rights/quality checks | Bible reading and references |
| Notifications | Expo Notifications / APNs / FCM | Announcements and reminders |
| Payments | Approved regulated provider and verified webhooks | Giving and reconciliation |
| Integrations | ChMeetings, church website, approved content sources | Migration and content synchronisation |
| Operations | CI/CD, monitoring, audit and backup processes | Reliable releases |

### Liberty-TV reuse strategy

Liberty-TV declares a pnpm/Turborepo workspace with an Expo mobile app, Next.js web app, shared TypeScript packages, Scripture and content-pipeline packages, FastAPI AI services, real-time services and AWS infrastructure. Its mobile authentication gate currently directs unauthenticated users to login; Solid Rock requires public-first routing.

**Reuse after inspection:** mobile conventions, Supabase integration patterns, shared sermon/Scripture types and verified content utilities.

**Adapt:** navigation, design system, onboarding, media ingestion and administration.

**Build specifically for Solid Rock:** membership domain, church events, fellowship workflows, pastoral care, giving ledger, payment reconciliation, permissions and ChMeetings integration.

**Defer:** Neo4j Soul Graph, autonomous spiritual guidance, watch parties and large-scale multi-agent infrastructure. Do not feed confidential pastoral or giving records into public-content AI pipelines.

Existing manifests declare Expo 52 and Next.js 14; upgrade compatibility and security must be assessed before production adoption. Declared dependencies and documentation are not proof of working production capabilities.

## Conceptual data domains

- **Identity:** users, profiles, households, roles, consents
- **Church:** campuses, service schedules, ministries, announcements
- **Media:** sermons, series, assets, notes, playback progress
- **Community:** fellowships, memberships, volunteer opportunities
- **Events:** events, registrations, tickets, check-ins
- **Pastoral care:** appointments, prayer requests, confidential cases
- **Finance:** funds, destinations, transactions, allocations, reconciliation, statements
- **Operations:** notifications, integration jobs, audit events

Sensitive records require least-privilege authorisation, encryption, appropriate retention policies and audited administrative access.

## Implementation roadmap

| Period | Workstream | Deliverable |
| --- | --- | --- |
| Weeks 1–2 | Discovery and governance | App publisher ownership, ChMeetings integration, Liberty audit, confirmed church content |
| Weeks 3–5 | Foundation | Expo scaffold, design system, Supabase, domain contracts, CI/CD |
| Weeks 6–10 | Member experience | Home, Watch, Bible, Events, guest-first navigation |
| Weeks 9–13 | Administration | Content publishing, event operations, notifications, roles |
| Weeks 12–17 | Integrated services | Giving, pastoral care, forms, fellowships |
| Weeks 18–21 | Validation | Migration rehearsal, security, accessibility, device QA and beta |
| Weeks 22–24 | Release | Store submissions, staged rollout, monitoring and support |

This is an **indicative 24-week plan**, dependent on staffing, integration access and app-store ownership. Scope and dates must be re-estimated after discovery.

### Release gates

- **G0:** Ownership and migration feasibility approved.
- **G1:** Architecture and design foundation accepted.
- **G2:** Core user journeys work with verified church content.
- **G3:** Operational workflows pass end-to-end tests.
- **G4:** Privacy, safeguarding, security, accessibility and beta sign-off.
- **G5:** Production rollout and monitoring are operational.

## Critical dependencies and decisions

1. **Existing app:** Confirm Android/iOS publisher accounts, signing credentials, app identifiers and ChMeetings contractual/data-export options.
2. **Church content:** Confirm service address, times, ministries and contact details against authorised church sources. Prototype sample data must never be published as fact.
3. **Payments:** Independently verify all recipient accounts, fund routing and financial approval before accepting payments.
4. **Data protection:** Address GDPR special-category religious data, consent, access, deletion and retention.
5. **Safeguarding:** Design permissions for minors, families, pastoral requests and sensitive submissions.
6. **Content rights:** Verify Bible translation, sermon, music, image and streaming permissions.
7. **Technical readiness:** Audit actual Liberty source, tests, vulnerabilities and deployment dependencies.
8. **Operational ownership:** Assign church product, pastoral, finance, content and incident-response owners.

## Initial engineering backlog

| ID | Work item |
| --- | --- |
| SR-001 | File-by-file Liberty architecture and test audit |
| SR-002 | ChMeetings, app-store and member-data migration assessment |
| SR-003 | Church domain contracts, permissions and data model |
| SR-004 | Mobile/admin scaffolding and development environments |
| SR-005 | Public-first routing and five-tab navigation |
| SR-006 | Official content and sermon media integration |
| SR-007 | End-to-end event registration vertical slice |
| SR-008 | Secure member identity linking and profile |
| SR-009 | Admin publishing and notifications |
| SR-010 | Giving/payment ledger and reconciliation design |
| SR-011 | Confidential pastoral scheduling workflow |
| SR-012 | Automated tests, security/privacy reviews and release pipeline |

## Quality targets (proposed)

- 99.5% API availability
- At least 99% crash-free beta sessions
- Zero unresolved critical security findings at launch
- 100% independent verification of published payment destinations
- Accessible navigation, readable typography and screen-reader support

These are **targets**, not observed performance.

## Project status and next action

**Current state:** Architecture and product planning documented. No mobile or backend implementation has been committed to this repository as part of the planning work.

**Next step:** Complete a code-level Liberty audit, confirm existing app ownership and build the first vertical slice: **discover an event → register → receive confirmation → view registration in admin**.

For full implementation scope, risks and milestones, see [docs/IMPLEMENTATION_ROADMAP.md](docs/IMPLEMENTATION_ROADMAP.md).
