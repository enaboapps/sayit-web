# PWA Validation

Last updated: 2026-03-29

## Scope

This release validates the narrowed `v2.7.0` goal: reliable offline text communication, not offline board sync.

## Automated Checks

Verified locally on 2026-03-29:

- `npm.cmd test -- --runInBand`: passed
- `npm.cmd run lint`: passed
- `npm.cmd run build`: passed

Covered by automated tests:

- local draft restore
- typing tab restore
- mobile typing restore
- local message history persistence
- offline typing UI behavior

## Production Runtime Check

Verified locally against `next start` after scoping Clerk proxy execution to API routes in `proxy.ts`.

Initial failing state:

- `/sw.js`: `200`
- `/`: failed
- `/offline`: failed
- `/manifest.json`: failed

Resolved state on 2026-03-29:

- `/sw.js`: `200`
- `/`: `200`
- `/offline`: `200`
- `/manifest.json`: `200`

Interpretation:

- The service worker asset is served correctly in production mode.
- App routes and manifest routing were being impacted by Clerk proxy execution on page/static requests.
- Limiting proxy execution to `/(api|trpc)(.*)` removed the runtime failure in local production validation.

## Lighthouse

Ran locally with:

```bash
npx lighthouse http://127.0.0.1:3500/ --chrome-path "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

Headline scores:

- Performance: `76`
- Accessibility: `100`
- Best Practices: `54`
- SEO: `100`

Notable findings surfaced by Lighthouse:

- browser console errors
- deprecated APIs
- third-party cookies
- Chrome DevTools issues
- back/forward cache prevention

Tooling note:

- Lighthouse 13 no longer exposes the legacy `pwa` category.
- Installability-specific checks should be supplemented with manual install/offline verification on Android and iOS.

Required follow-up:

1. Review the Lighthouse JSON in a stable reporting workflow and turn the Best Practices failures into concrete issues if they matter for release.
2. Complete manual installability/offline checks on real devices.

## Manual Validation Matrix

Still required before release:

- Android Chrome install
- iOS Safari Add to Home Screen
- airplane mode reopen flow
- offline type, speak, reload, and reopen flow
- reconnect flow for cloud-only features

Recommended test script:

1. Open the production build.
2. Install the app.
3. Type text and speak it with browser TTS.
4. Reload and confirm draft and tabs persist.
5. Put the device in airplane mode.
6. Reopen the installed app.
7. Confirm text communication still works.
8. Confirm cloud-only features show explicit offline states.
9. Reconnect and confirm online features recover cleanly.

## Release Status

Current status: partially validated.

Blocking items:

- completed real-device install/offline notes
- explicit Android/iOS install confirmation
