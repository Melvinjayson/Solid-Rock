# Solid Rock Centre — Social Media, Independent App and Store Distribution

**Date:** 8 November 2026  
**Status:** Implemented and automated browser validation in progress. Not released in Google Play or Apple App Store.

## Official and verified channels

- Website: https://solidrockdublin.org/
- YouTube: https://www.youtube.com/@solidrockcentre
- YouTube channel ID: `UCM6SGgWXyUDlCaZ8iYnIuKQ` (confirmed from the official YouTube RSS link).
- Instagram: https://www.instagram.com/solidrockcentre/
- Official playlists found on the YouTube channel:
  - The Year of Greater Glory: `PLY36ho3KNKuhilzkq9THo_5xTBoAFsvPL`
  - #SHORT: `PLY36ho3KNKuhwVO3TPdXS1CTcvDAWUPMp`
  - Guest Minister: `PLY36ho3KNKugZVNY1FlVT02tXn04QzzFi`
  - Kids Zone: `PLY36ho3KNKugJDFGFkYNc0MoSLNv4Cuey`

## Implemented public media experience

- In-app YouTube iframe on web, with `react-native-webview` on Android/iOS.
- Live state only from an official YouTube Data API response identifying a currently live video.
- Public YouTube channel RSS automatically provides recent uploaded videos when no API key is configured.
- In-app official short-clip and other channel playlist playback works without API credentials.
- Videos are served by YouTube (subject to viewer connectivity, regional availability and creator embed settings), not redistributed or downloaded.
- Public Instagram post/reel cards render only after a church-authorised Meta token has been configured server-side.
- Public church devotional cards are retrieved from the live homepage using only same-domain `/devotional/` links, and can optionally use a church-owned RSS feed.
- The app retains local faith guides, Sunday service information, bookmarks, theme and reading progress even if all social services are offline.

The aggregator is implemented in `api/content.js` and deployed as the read-only `/api/content` endpoint within the separate Vercel preview project. It caches responses and returns validated public JSON without private member data. It currently uses public YouTube RSS, official homepage content, and a curated church playlist catalogue.

## Integration credentials and how to connect

Configure the following **only in Vercel server environment settings** (never mobile files, `EXPO_PUBLIC_*`, GitHub source or API logs):

| Variable | Required? | Purpose |
| --- | --- | --- |
| `YOUTUBE_DATA_API_KEY` | Optional for uploads; needed to confirm active livestream automatically | Google Cloud YouTube Data API v3, limited API key |
| `INSTAGRAM_ACCESS_TOKEN` | Yes for Instagram posts | Long-lived, church-authorised Instagram professional-account token |
| `INSTAGRAM_USER_ID` | Yes for Instagram posts | Numeric ID of the authorised Instagram account |
| `INSTAGRAM_GRAPH_HOST` | Optional | `instagram` (default) for Instagram Login or `facebook` for Facebook Login |
| `CHURCH_NEWS_RSS_URL` | Optional | Approved `https://solidrockdublin.org/...` RSS endpoint, if the website later publishes one |

For YouTube, enable YouTube Data API v3 in a church-controlled Google Cloud project, restrict the key to the API, set quota limits and billing alerts, and configure `YOUTUBE_DATA_API_KEY` only on the server. Without it, uploaded videos continue to sync through YouTube RSS but the app will **not** assert that a live broadcast is active. The app offers a clear external live-channel fallback. The public API response is cached for 30 minutes, so confirmed live status is not instant.

For Instagram, church personnel must connect the correct professional account through Meta and grant only the required `instagram_business_basic` permission under an approved use case. Store the resulting token in Vercel environment settings and arrange token rotation, revocation and monitoring. The app will never scrape Instagram HTML or guess current posts. Media display respects the original post permalink and handles removed posts gracefully.

The website is presently a Next.js site and its typical `/feed/` path returns 404. The MVP therefore reads only publicly accessible homepage devotional links, with a strict exact-domain allowlist. Broader structured website event sync will require an official JSON/RSS or CMS contract from the church website's maintainer, or publication through the church administration portal.

### Native app media URL

- Expo Web on the Vercel project fetches its own `/api/content` automatically.
- Android/iOS builds need `EXPO_PUBLIC_CONTENT_API_URL=https://<public-church-owned-media-host>/api/content`.
- The endpoint must be permanently reachable over HTTPS without temporary Vercel Authentication share tokens. Never ship a share token, API secret or privileged database key with a client binary.
- For controlled internal tests, a reachable public read-only endpoint with no sensitive data is acceptable; member data stays in a separate authenticated database.

## App store publication — required to update existing apps

**The previous public Android listing was identified by the church as package `com.jiosdev.chmeetings.solidrockdublin`. Its rights and signing must be verified.** A new Expo build with a different Android package is a *new app*, not an update to that listing.

1. Church leadership identifies the legal publisher, Apple Developer team and Google Play Console account that own the existing listings. Verify whether ChMeetings/Jios Apps must transfer app ownership and release/signing permissions.
2. Confirm the canonical existing Android application ID and iOS bundle ID using the actual store consoles, not chat descriptions.
3. Confirm access to Google Play app-signing/upload keys and Apple distribution certificate/profiles, or an authorised key migration process.
4. Complete church approval of logo, photography, video embedding rights, legal name, privacy notice, data-safety declarations, support contact, age rating and rights to all resources.
5. Complete real Android and iOS WebView playback tests, including fullscreen, rotation, live start/end transitions, screen readers and no-network fallback.
6. Verify UAT against staging with real volunteer testers but synthetic membership records and no confidential prayer/financial disclosures.
7. To produce actual store builds, configure `SOLID_ROCK_ANDROID_PACKAGE`, `SOLID_ROCK_IOS_BUNDLE_ID` and `SOLID_ROCK_STORE_RELEASE_APPROVED=true` in the approved Expo release build environment. `app.config.js` rejects a production profile without these safeguards.
8. Create signed binaries through Expo: `eas build --platform android --profile production` and `eas build --platform ios --profile production`.
9. Distribute to Google Play **internal testing** and Apple **TestFlight**, monitor failures and accept church UAT signoff before review for a public release.
10. The authorised store publisher then submits the final release for store review. Store acceptance, rollout and user installs are not guaranteed until the stores confirm them.

### Required store assets

- Church-owned application icon and adaptive Android icon at store-specified dimensions, with permission to reuse the church mark.
- iOS/Android native splash treatment, brand colours, store screenshots of actual native app UAT builds (not Expo Web browser captures).
- Listing title, short and long descriptions, keywords, support URL, privacy policy URL, age rating, content and social data declarations.
- Signed AAB/IPA, release notes, incident/support owners, version number, rollback strategy and monitoring.
- Approval for the church YouTube channel's integration, children's media considerations and Instagram post display.

### Current release boundaries

- Existing Google Play and Apple App Store listings: **not updated**.
- Public browser preview: changes auto-build on feature branch; Vercel READY + runtime and CI must be checked for latest commit.
- Native APK/AAB/IPA builds: **not generated**; Expo accounts and signing credentials are not connected.
- YouTube RSS: **integrated, live endpoint checked**.
- YouTube livestream auto-detection: **implemented but unconfigured until Data API key**.
- Instagram feed: **implemented but unconfigured until church authorises Meta account**.
- Website devotional sync: **implemented against verified public homepage links**.
- Live church member account, payment, pastoral and ChMeetings migration: **not production authorised**.

## Release sign-off owners

Church product owner accepts content, imagery and experience. Technical owner approves secrets, app identities and rollout. Pastoral/safeguarding owner approves care and youth content. Finance owner approves giving. Store owner approves signing, metadata and submission. Reveta implements and verifies the approved build; it does not self-authorise changes to church accounts or contracts.
