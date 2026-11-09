# Solid Rock Centre — church-team design feedback and prototype alignment

**Date:** 9 November 2026  
**Status:** **Implemented for design review**, not church accepted and not deployed to stores.  
**Design source:** church-supplied `Solid Rock App Prototype (Copy).html` (clickable prototype) and church-team voice feedback received 9 November.  
**Implementation:** `feat/church-approved-prototype-alignment` branched from `feat/solid-rock-expo-mvp`. Review this branch in a separate draft PR before integrating the changes.

## Decision to inform

Should the current functional Expo implementation be scrapped, or should its presentation be reconciled with the original church-authorised prototype?

**Decision proposed:** **Reconcile the existing implementation; do not restart.** Functioning services, security controls, Bible, media sync, events, donation safeguards and guest privacy remain intact. Align screen order, home hierarchy and secondary navigation with the original source.

### Actual feedback, faithfully condensed

- Church team considers the app useful and practical, but its information architecture and visual arrangement depart from the initial prototype and an earlier January concept.
- Restore the original prototype's layout and familiar church-app conventions. Modest visual refinement is acceptable; material reordering requires design-owner review.
- Home carries too much content and should give **important messages, live worship, giving and recent announcements** priority.
- The church app **is not primarily a social network**. Other experiences belong in their own pages.
- Bring the original prototype author and other developers into a shared review early; avoid ownership by one contributor.
- If alignment requires significant changes, jointly evaluate a rebuild — but **do not restart without a demonstrated technical need**.

The church voice note is stakeholder feedback, not evidence that every element, payment account or sample content in the prototype is approved for production.

## Original design and code mapping

| Original clickable prototype | Earlier implementation | Proposed prototype-aligned version |
| --- | --- | --- |
| Primary: Home, Watch, Events, Give, More | Home, Watch, Community, Events, More | **Home, Watch, Events, Give, More** |
| Compact welcome and live-service callout | Large photographic home hero | Compact welcome, reliable live-status card |
| Quick actions: Give, Events, Watch, Book | Watch, Community, Prayer | **Give, Events, Watch, Bible** |
| Church message priority | Home mixes journeys, Instagram, group discovery and news | **Church notices → worship/live → quick actions → latest announcements → latest message → weekly gathering** |
| Giving is a top-level task | Giving in More | **Give is primary tab plus home quick action** |
| Groups, care, accounts in More | Community is top-level tab | **Community conversations, fellowship, prayer, services in grouped More** |
| Church-approved publishing | Existing verified website/YouTube adapters | **Retain real sources; never fabricate event, announcement or broadcast** |
| Light cream/teal/gold with dark option | Website-derived Poppins/Mulish and gold, true-black default | Preserve website logo/assets and accessible themes; adapt green accent/order without copying mock data |

### Navigation acceptance

1. Exactly five top-level tabs: **Home / Watch / Events / Give / More**, in that order.
2. Home must show a church announcement before lower-priority content when an announcement exists; never invent a notice if one does not.
3. Only an authenticated fresh media feed can display the **LIVE NOW** badge; otherwise show the church's verified weekly worship time.
4. Four top home quick actions: **Give, Events, Watch, Bible**.
5. **Giving** opens the existing verified bank/hosted-checkout journey; do not replace it with the prototype's fictitious AIB beneficiary or sample giving amounts.
6. **Watch** retains real in-app YouTube playback and official clips/playlists; no fabricated pastors or audience numbers.
7. **Community** remains accessible through More and optional onboarding, and its sensitive messaging remains disabled until safeguarding/moderation approval.
8. **Social channels, personal faith journeys, ministry photography, pastoral services** are reachable in appropriate pages but do not flood the Home scroll.
9. No breakage to account sign-in, user privacy controls, theme persistence, Bible notes, saved event interest or offline behaviour.
10. Material layout/brand changes are reviewed using the same source screenshot and accepted commit SHA on both web and signed iOS/Android test builds.

## Source-of-truth and safety

**Authoritative for layout:** supplied church clickable prototype.  
**Authoritative for operational facts:** verified official church website, approved staff-managed content, church-confirmed accounts.  
**Authoritative for live playback:** verified official YouTube channel/media provider.  
**Authoritative for privacy/security:** approved church governance and secure backend, not illustrative UI content.

**Do not import from the prototype:** Blanchardstown address or 10am Sunday time, invented names/pastors, sample sermons, sample event attendance, example `IE29 AIBK...` IBAN, made-up giving statements/totals or protected Bible translation labels. The current site-backed church location, 11am worship, approved giving beneficiary and public-domain Bible remain until corrected by an authorised source.

**Design system:** preserve church identity and registered logo, dark default with a working light toggle per earlier product brief, comfortable tap areas and accessible type/contrast. A final visual alignment pass needs prototype-author agreement; arranging components now is not a licence to claim exact-pixel parity.

## Team working agreement

| Role | Responsibility before acceptance |
| --- | --- |
| Church design/prototype owner | Validate screen order, home priority, typography, imagery and visual fidelity |
| Church product sponsor | Approve MVP scope, public church messaging, overall user experience |
| Lead mobile developer | Preserve existing Expo functionality, review navigation/data correctness |
| Second developer/reviewer | Independent review of changes, device navigation and regressions |
| Church content and media owner | Approve church notices, actual livestream behaviour and imagery |
| Finance + safeguarding representatives | Validate Give accuracy, private data and community access boundaries |
| UAT coordinator | Collect feedback by screen with severity, screenshots, device and build SHA |

**Collaboration principle:** one canonical branch/PR and one approved visual reference; all changes reviewed by the relevant owner. No simultaneous independent rebuilds, duplicate sources of truth or unreviewed visual overrides.

## Proposed review session

Open the original HTML clickable prototype and the new review build side-by-side. Walk through: first-time welcome, Home, live worship, Give, Events, More → Community, More → Bible, theme switch, no-connection fallback.

Record feedback as one of:
- **Must match prototype** — structure/priority material to church identity
- **Safe improvement** — accessibility, responsive polish, clearer writing, trust/error handling
- **Future release** — finances, community chat, member backend, social feeds requiring approval
- **Disputed** — decision delegated to designated design owner and church product sponsor

No action is considered accepted from informal comments alone. Capture the agreed screenshot, acceptance criteria and reviewer for each issue.

### UAT exit criteria

- Browser interaction regression suite and TypeScript pass on exact reviewed SHA.
- Prototype navigation order and Home priorities pass explicit automated assertions.
- Repeated theme changes, Scripture, verified giving, Watch and event interest pass.
- Church design owner validates visual layout on at least 320px mobile, larger Android and iPhone screenshots.
- Public church facts remain accurate and fictional prototype records remain absent.
- Separate staff/security/native/store release gates in [PILOT_RELEASE_ACCEPTANCE.md](PILOT_RELEASE_ACCEPTANCE.md) remain in force.

**Release gate:** no merge, production deployment, finance enablement, real-member messaging or store submission on the basis of design alignment alone.
