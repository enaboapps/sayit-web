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

Verified locally against `next start` on `http://127.0.0.1:3100`:

- `/sw.js`: `200`
- `/`: `500`
- `/offline`: `500`
- `/manifest.json`: `500`

Interpretation:

- The service worker asset is being served in production mode.
- App routes did not complete successfully under local `next start`, so runtime install/offline validation is still blocked until that production-route failure is understood.

## Lighthouse

Attempted locally with:

```bash
npx lighthouse http://127.0.0.1:3100/ --chrome-path "C:\Program Files\Google\Chrome\Application\chrome.exe"
```

Current result:

- Audit could not be completed because the production app route was failing locally.
- The local Windows Lighthouse run also hit a Chrome launcher temp-directory cleanup error (`EPERM`) after the failed attempt.

Required follow-up:

1. Re-run Lighthouse after the production route failure is resolved or reproduce in a cleaner browser environment.
2. Record installability, offline-start, accessibility, and performance findings from the successful run.

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

- successful production-route validation under `next start`
- completed Lighthouse audit
- completed real-device install/offline notes
