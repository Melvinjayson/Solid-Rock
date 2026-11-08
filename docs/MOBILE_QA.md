# Mobile MVP validation plan

## Status
This checklist is for the Expo implementation on `feat/solid-rock-expo-mvp`. Automated compilation, installation and device tests were **not executed** by the authoring agent. Do not merge or release until validation passes.

## Engineering gates
- [ ] `npm install` succeeds under a supported Node.js version.
- [ ] `npm run typecheck` passes.
- [ ] `npx expo-doctor` reports no critical compatibility issues.
- [ ] Development build starts on Android emulator/physical device.
- [ ] Development build starts on iOS simulator/physical device.
- [ ] No critical runtime errors on either platform.
- [ ] Assess SDK 54 dependency alignment and pin a reviewed lockfile.

## Functional smoke tests
- [ ] Home, Watch, Events, Give, More tabs render and navigate correctly.
- [ ] Home quick actions navigate to the right screen.
- [ ] Search study guides filters results without keyboard-focus loss.
- [ ] Save a reading guide; restart app; verify bookmark persists.
- [ ] Save event interest; restart app; verify it persists.
- [ ] Remove items in My saved items and confirm persistence.
- [ ] Prayer draft remains on-screen only and is not transmitted.
- [ ] Official external links open the correct church website.
- [ ] Guest access works without sign-in.
- [ ] Layout and font scaling work on narrow screens and tablets.
- [ ] Screen reader can identify tab controls and actions.

## Security and content gates
- [ ] No private keys, member data, real donations or fictitious bank accounts exist in the shipped bundle.
- [ ] All church times, locations, ministries and media destinations are verified by church leadership.
- [ ] Privacy notice and safeguarding review approved before submissions begin.
- [ ] No demo text misrepresented as a church sermon or public event.
- [ ] App-store identifiers, signing ownership and migration path confirmed.

## Production blockers
No live backend for registration, membership, giving, pastoral care, video feeds or Scripture licensing. Those actions must remain informational until supported by approved backend services and tested end-to-end.
