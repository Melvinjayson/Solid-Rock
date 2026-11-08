# Solid Rock Community — Product, Safety and UAT

**Delivery:** Implemented source and isolated Postgres security checks. **Status:** Controlled UAT candidate, not live to church members.  
**Scope:** Member channels, prayer circles, discussions, Scripture exchange, pastoral announcements, replies and community moderation.  
**Explicit exclusions:** User-to-user private messages, minors' accounts, anonymous posting, media uploads, voice rooms, automatic AI moderation, and any workflow presenting confidential pastoral care as a public discussion.

## Product intent — distinct from the church website

The public church website provides institutional information, ministries and contact details.
The app provides a **personal weekly companion**: live services, saved content, joining a moderated conversation, praying with members, reading together, and tracking preferences.

Navigation:
- Home: today's most useful actions and a curated weekly moment.
- Watch: official YouTube videos and livestream when verified active.
- Community: five moderated church spaces, with explicit member consent.
- Events: verified gatherings, reminders and locally saved interests.
- More: profile, Giving, Bible resources, privacy, support, theme and onboarding replay.

First run shows a three-step guide explaining benefits, privacy and the optional choice to explore as a guest. No account is required for the public preview.

## Community data and enforcement

Migration `202611080006_community_channels.sql` creates channels, memberships, messages, reports, blocks and mutes; `007` introduces mutual blocks and role-gated moderation; `008` adds replies and anonymised prayer acknowledgement counts. All new tables have RLS. Client writes occur only through SECURITY DEFINER functions with `auth.uid()` validation.

Channel catalogue (proposed structure—not a claim about existing physical church groups):
- Church updates — editorially controlled; member read-only.
- Prayer circle — group prayer, encouragement and prayer acknowledgements; **not** for confidential personal prayer disclosures.
- Faith & life — faith questions and respectful discussion.
- Scripture together — Bible reflections and group discussion.
- Serve together — ministry and volunteering conversation.

UI exposes no member email or raw UUID. Other writers are labelled `Community member` until an approved display-name policy is designed. No public unread personal chat is enabled.

Rules enforced in SQL:
- Only authenticated people joined to a channel can read or post.
- Rate limit: one new message/reply per person per channel within 20 seconds.
- Messages limited to 2,000 characters; no attachments or clickable arbitrary external content rendered as rich HTML.
- No general member can publish church announcements.
- Members can leave channels, report content and block accounts.
- Muted members cannot post; authorised pastors/super-admins can hide posts and pause channels.
- Moderation reports are visible only to the reporter and approved moderators.
- Prayer acknowledgement identities are never exposed; only counts are returned to channel members.
- Messages from mutually blocked users are hidden in both directions.
- Realtime message changes require a joined channel, Postgres RLS and configured Supabase publication.

## Staging activation gates

1. Church product owner approves channel taxonomy, naming and content rules.
2. Safeguarding lead signs off age restrictions, pastoral escalation, crisis support, reporting/appeals and moderation hours. **Do not enable youth messaging without a distinct reviewed control model.**
3. Privacy lead approves lawful basis, retention/deletion for user-generated messages, audit, disclosures, anti-abuse and account closure.
4. Provision separate Solid Rock Supabase staging; apply and test migrations in order. Reuse neither Liberty-TV nor production church membership records.
5. Verify staff identities and grant pastor/super_admin roles only via authorised procedure; never allow member self-assignment.
6. Configure Supabase email OTP, restricted channels and Realtime publication; load two controlled test-member accounts.
7. Set `EXPO_PUBLIC_CHURCH_BACKEND_ENABLED=true` **only in protected staging** and test real chat against the project.
8. Run mobile UAT on iOS/Android with privacy-sensitive data kept synthetic, not real prayer requests.
9. Confirm staff moderation queue, notification and incident response staffing before inviting general users.
10. Public preview keeps `EXPO_PUBLIC_CHURCH_BACKEND_ENABLED=false`; it must show channels as previews and never imply participants or existing conversations.

## Staging UAT scripts

| ID | Persona | Scenario | Pass requirement |
| --- | --- | --- | --- |
| COM-01 | Guest | Discover Community | Five channel descriptions; no real message or composer |
| COM-02 | First-time visitor | Welcome guide | Can skip, choose interest, enter, and not see repeated onboarding on restart |
| COM-03 | Member A | Join Prayer circle | Must accept guidelines; membership created server-side |
| COM-04 | Member A | Send message | Visible to members; server confirmation; error shown on failure |
| COM-05 | Member A | Reply and pray | Reply linked to parent; prayer count changes without exposing supporter IDs |
| COM-06 | Member B | Read without joining | No channel messages returned |
| COM-07 | Members A/B | Block | Both directions hide the blocked conversation |
| COM-08 | Member B | Flag a message | Private report record received by permitted pastor |
| COM-09 | Moderator | Hide post | Removed from ordinary views; reason captured, reporter identity not exposed in the member app |
| COM-10 | Moderator | Pause channel | All new posts fail while locked; permissions rechecked |
| COM-11 | Member | Spam/invalid content | Rapid repeat, blank content, and overlength rejected server-side |
| COM-12 | Guest/ordinary member | Announcement posting | Denied by server, even through a crafted API call |
| COM-13 | Member | Leave and rejoin | Cannot see messages while out; can rejoin if permitted |
| COM-14 | Low-connectivity user | Drop network mid-send | No false confirmation, user can retry without losing context |
| COM-15 | Accessible mobile user | Keyboard, TalkBack, VoiceOver | Channel choices and controls correctly labelled and operable |
| COM-16 | Church data owner | Rights request | Approved data export, deletion and retention process rehearsed |
| COM-17 | Safeguarding team | Report escalation | Named rota, urgent response and incident review evidence |

## Automated evidence

- `tests/db/community_rls.sql` runs against isolated PostgreSQL after migrations. It checks outsider posting, channel isolation, role-scoped moderation, blocking, threaded replies and prayer counts.
- Playwright browser tests check onboarding, guest channel previews and safe no-account behaviour.
- Automated SQL and browser success **does not** substitute for testing real Supabase Auth, Realtime, data retention or church response procedures.

## Release ownership

- Product and channel content — approved Solid Rock representative: **pending**
- Moderation, safeguarding and appeals — church pastoral/safeguarding owner: **pending**
- Security/RLS and hosting — technical owner: **pending**
- GDPR/privacy notices and deletion — church data controller: **pending**
- Native device and accessibility UAT — QA owner: **pending**

**Public messaging remains disabled until those accountable owners accept these gates.** No production member records or public conversations have been created.
