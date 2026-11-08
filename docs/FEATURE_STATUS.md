# Solid Rock — Feature Status

**Latest snapshot:** 8 November 2026  
**Canonical evidence-based implementation status:** [ROADMAP_DELIVERY_AUDIT.md](ROADMAP_DELIVERY_AUDIT.md)  
**Original planning baseline:** [IMPLEMENTATION_ROADMAP.md](IMPLEMENTATION_ROADMAP.md)

Do not reuse the older static P0/P1/P2 feature rows without checking the latest source and CI. This file is a small stable signpost; the linked audit is the one source of truth for each module's phase, implementation, verification and blocker.

## Current build composition

- Public Expo guest app: Home · Watch · Community · Events · More; first-run onboarding; dark/light mode; local preferences and journeys.
- Watch: official YouTube videos, Shorts and playlists, livestream playback only when an active stream is confirmed by a trusted provider.
- Bible: World English Bible reader and chapter navigation, highlights, private notes, limited offline chapter cache and community-reference handoff.
- Giving: published church IBAN with copy function and church PayPal-hosted redirect (no raw card data, no in-app payment capture/receipt).
- Talk To Us: categorized email drafts, church contacts and directions; user chooses whether to send.
- Profile and church membership: source exists behind explicit Supabase enablement and release gate.
- Community: channel UI, consent, moderated posting, replies, prayer support, reports, blocks and staff moderation source; stays disabled for general users.
- Updates: feed-derived in-app inbox, read/unread, local notification preferences, opt-in Sunday native reminder code.
- Social: verified direct YouTube/Instagram, trusted church directory for Facebook/TikTok/X, podcast link and credential-gated Meta posts.
- Staff operations: source and migration-backed role protections; staging and native acceptance still required.

## Risk-based blockers

Bank recipient re-verification, actual card processor approval, Stripe/PayPal merchant credentials, ChMeetings transfer/store ownership and signing, the live staging database, real native-device and accessibility UAT, privacy/safeguarding procedures, staff moderation ownership, targeted push and household/child protocols are **not completed** by the source implementation.

No production bank transfers, payment confirmations, member-data migrations, card transactions, app-store submissions or direct church social posts have been executed.

**All six CI jobs must pass on the latest PR SHA before acceptance.** Browser builds prove neither production native playback nor security on an actual church Supabase deployment.
