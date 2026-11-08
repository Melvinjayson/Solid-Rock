# Solid Rock Dublin — UAT and release acceptance plan

**Status: Proposed UAT pack.** This is a test protocol, not church leadership approval or evidence that a user session was completed.
**Scope:** Android and iOS native build, Expo Web preview, staff dashboard, and the dedicated church staging environment.

## Environment rules

- Use a dedicated Solid Rock staging Supabase project with synthetic test accounts. Never use real ChMeetings members, giving transactions, prayer disclosures or children's information in test environments.
- Staging access restricted to approved testers. Staff dashboard is not a public product preview.
- Test emails are controlled. Neither service-role keys nor payment credentials belong in client applications.
- Use consented church-owned imagery and reviewed copy. The official website remains the source for service details until formal content ownership is approved.
- No actual giving payment, ministry registration or private prayer request should be represented as live without approved backend integrations and operational response teams.

## UAT roles

| Role | Test journeys | Test identity |
|---|---|---|
| Visitor | App discovery, visit information, worship media, Bible resources, themes, external links | Guest, no login |
| Member | OTP sign-in, profile, RSVP, group joining, reading progress, cancellations | Synthetic member |
| Group leader | Read approved group memberships, group content permissions | Synthetic leader |
| Ministry leader | Publish opportunity, see approved volunteer interest | Synthetic ministry account |
| Pastor | Set available appointment slots and respond to test requests under authorised access | Synthetic pastoral staff |
| Content editor | Publish announcement, sermon and event, verify mobile visibility | Synthetic editor |
| Finance staff | Verify ledger read permissions and prohibition of arbitrary writes | Synthetic finance account |
| Admin | Role checks and confidential domain separation | Synthetic privileged account |
| Accessibility tester | Screen reader, keyboard focus, dynamic type, contrast, reduced motion | Test device |

## Functional scripts and success criteria

| ID | Scenario | Success condition |
|---|---|---|
| UAT-01 | First visit on mobile and web | Launch without an account, no crash, Home renders accurately |
| UAT-02 | Brand and theme | Official church logo/photography load; dark is initial theme; light toggle changes all surfaces and persists restart |
| UAT-03 | Church information | Sunday worship is 11:00 am; address is Goldenbridge Industrial Estate, 6B, Inchicore, Dublin 8; verified links open |
| UAT-04 | Watch and search | Approved video destination plays; typed search filters study guides; missing media produces a controlled fallback |
| UAT-05 | Local personalisation | Bookmark and save event interest; restart app; saved state persists; remove item |
| UAT-06 | Mobile navigation | Five tabs, back actions and Church Hub remain navigable on 320px+, tablet and landscape |
| UAT-07 | Member authentication | Send six-digit code, verify identity, persist session, sign out; expired/wrong code rejected |
| UAT-08 | Event management | Staff publishes one test event; member sees it and registers; confirmation exists in database; cancellation works |
| UAT-09 | Capacity and concurrency | Two registrations for one remaining place; exactly one succeeds |
| UAT-10 | Fellowship | Member requests eligible membership; cannot read another group's private records |
| UAT-11 | Volunteer interest | Member records an interest; ministry lead views only approved information |
| UAT-12 | Prayer privacy | Member submits synthetic request; another member is denied access; correct pastoral role can read |
| UAT-13 | Pastoral appointment | Staff publishes slot; member books; second member cannot double-book; cancellation releases future slot |
| UAT-14 | Giving | Guest receives verified guidance only; finance reads staging ledger; client cannot forge a verified payment |
| UAT-15 | Staff security | Non-staff cannot open publishing modules or edit content; staff roles are not self-assignable |
| UAT-16 | Data rights | Access/export/deletion request can reach approved privacy workflow; retention is documented |
| UAT-17 | Accessibility | Screen reader labels, keyboard focus, contrast and scalable text pass WCAG 2.2 AA-oriented checklist |
| UAT-18 | Performance | Reasonable first content render on representative low/mid-tier Android and current iOS, under slow network |
| UAT-19 | Resilience | App handles offline state, invalid URLs, backend outage, session expiry and image failures without incorrect confirmations |
| UAT-20 | App-store readiness | Ownership, bundle identifiers, signing, privacy answers, media licences and staged rollout approved |
| UAT-21 | Safeguarding | Youth and household workflows cannot expose minors' data without approved permissions |
| UAT-22 | Notifications | Opt-in/out and role-targeting verified; no sensitive care information appears in device push preview |
| UAT-23 | Financial integration | Signed processor webhook, duplicate-webhook replay, reconciliation and refund cases pass **before** enabling real payments |

## Suggested UAT sessions

- Session 1 — 4–6 visitors/members across varied ages and device experience: navigation, welcome, Watch, Events, theme, accessibility.
- Session 2 — 3–5 synthetic church staff: publishing, events, role separation, pastoral operations.
- Session 3 — 2–3 accessibility/low-connectivity participants and an independent privacy reviewer.
- Session 4 — finance and safeguarding representatives reviewing their own workflows in a controlled environment.

These are suggested participant counts, not completed research. Participation is voluntary and feedback must not include medical, financial or pastoral disclosures.

## Test record template

| Field | Capture |
|---|---|
| Session ID and test case | UAT-XX |
| Tester pseudonym / role | Non-identifying code |
| Device and OS | Android/iOS/Web version |
| Build SHA and deployment URL | Exact verified artifact |
| Task expected and actual | Direct observation |
| Result | Pass / Fail / Blocked / Not tested |
| Severity | P0 Critical / P1 Major / P2 Minor |
| Evidence | Sanitised screenshot, recording or bug link |
| Owner and resolution | Named project role and fixed SHA |
| Retest | Independent reviewer, time, result |

## Exit criteria (all mandatory)

1. No unresolved P0 defects, critical security findings or material safeguarding/privacy blockers.
2. Every mandatory public and approved member workflow has a passing end-to-end test against staging and an accountable church owner.
3. Authenticated, role-controlled backend and migration rehearsals pass with synthetic members.
4. Android and iOS native release candidates have device test evidence (web-only screenshots do not count).
5. Critical content and financial destination information have church approval.
6. All consent, retention, account deletion and support escalation processes have owners and published notices.
7. Launch monitoring, incident response, backups and rollback have been exercised.
8. Sponsor, product owner, safeguarding, data protection and finance owners sign off their relevant domains.

**Current status:** Automated browser smoke tests and mobile/admin typechecking are configured; live data integration, native-device UAT, payments, push, household, Scripture licensing and production operational approval remain open. Do not mark release-ready until the gates above are met.
