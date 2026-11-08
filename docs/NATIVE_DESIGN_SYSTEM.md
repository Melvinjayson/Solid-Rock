# Solid Rock mobile design system — v0.2

## Intent

Solid Rock's app is a **native weekly companion**, not a smaller church website. Visitors should get useful content without signing in; members can opt into real community participation when the church has approved authentication and moderation.

The public website remains the source of institutional facts and approved imagery. The app owns behaviour, local state, navigation and interpersonal interaction.

## Visual foundation

- **Dark by default:** near-black charcoal `#100F0D`, elevated surface `#1D1915`, ivory text `#F8F4E9` and warm gold `#C9A24A`.
- **Light alternative:** parchment `#FAF8F4`, ink `#20160F`, restrained brown `#5B3F16` and gold accents. Theme preference persists on device.
- **Typography:** Poppins 700 for titles and key moments; Mulish 400/700 for labels, body, controls and practical reading. Avoid extra font families.
- **Iconography:** one Ionicons outline/filled system wrapped by `src/AppIcon.tsx`. Filled active states, outlined inactive states, matching size and stroke weight. No ad hoc emoji navigation symbols.
- **Spacing:** 4-point rhythm. Main mobile content max 620px in Expo Web while native uses device width. Cards use 19–23px radii; controls 48–54px minimum hit height.
- **Components:** cards with readable hierarchy, contextual icons, concise content, primary/outline CTAs and trustworthy disabled/error states. Do not mimic site mega-menus or long-scroll page templates.
- **Media:** approved YouTube player, official ministry imagery and safe fallback states; never claim livestream when only an uploaded video is verified.

## Five-tab information architecture

| Tab | Owns | Does not own |
| --- | --- | --- |
| Home | Personal weekly value, worship timing, community shortcuts | Full website landing sections |
| Watch | Messages, verified live sessions, clips, playlists | Unlicensed video downloads |
| Community | Channels, prayer encouragement, chat, replies, reports | Private messaging, minors without safeguarding |
| Events | Verified gatherings and saved interest, approved RSVP once connected | Fake calendar confirmations |
| More | Account, Giving, Bible/reading, privacy, onboarding replay, preferences | Infrequent top-level destinations |

## Onboarding

The three-step first-run flow:
1. Welcome and the principle of belonging.
2. Discover the app's unique weekly capabilities.
3. Privacy and community boundaries, plus optional interest (faith, community, media, events).

Skipping is always available. Selection is a local navigation preference, not a church profile or marketing consent. The completion flag is stored on-device and onboarding can be replayed through **More → Welcome guide**. No signup wall blocks guest content.

## Community UX and trust

The community page presents five **proposed** spaces with distinct purposes, not populated mock transcripts. Only authenticated and consented channel members may read and write; the public preview clearly states messaging is disabled. Prayer circles are *shared conversations*, not confidential pastoral intake.

Messaging affordances are deliberately bounded: 2,000-character messages, 20-second per-channel rate limit, threads, prayer acknowledgements, report/block actions, member opt-out and human moderation. Add media uploads, direct messages, notifications and youth-specific communities only after separate security/safeguarding decisions.

## Acceptance checks

- Consistent outline icon family on Home, tab bar, More, profile and Community.
- Dark and light modes render headings, cards, labels and inputs with acceptable contrast.
- 320px small-phone navigation remains accessible without clipping; larger devices preserve readable line lengths.
- VoiceOver/TalkBack recognise tab selected state, channel selection, agreement checkbox, send/report actions and welcome-guide skip.
- Browser tests cover first-run guide, navigation, theme persistence, community preview, local data deletion, media and guest fallbacks.
- PostgreSQL integration tests confirm RLS, blocks, moderation, posting rules, replies and prayer counts.
- No claim of native production readiness until actual Android/iOS QA, permissions, image licences and operational checks are complete.
