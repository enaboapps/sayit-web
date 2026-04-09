# PWA Validation

Last updated: 2026-04-09

## Scope

This validation covers the current offline architecture:

- installed app boot reliability
- offline boot fallback above auth and Convex startup
- text communication and browser TTS offline
- cached read-only board browsing offline after prior sync

## Automated Checks

Run before release:

- `npm test`
- `npm run lint`
- `npm run build`

Core automated coverage should include:

- offline bootstrap parsing and mode derivation
- local draft and tab restore
- local message history persistence
- home startup rendering
- explicit offline UI behavior for cloud-only features

## Production Runtime Check

Validate against `next start`, not only dev mode.

Required routes and assets:

- `/sw.js`: `200`
- `/`: `200`
- `/offline`: `200`
- `/manifest.json`: `200`
- `/icons/icon-192x192.png`: `200`
- `/icons/icon-512x512.png`: `200`

Expected behavior:

- installed app launches without browser chrome when installability is correct
- cold offline launch resolves to the offline shell instead of hanging behind auth startup
- `/?source=pwa` reopens through the same cached shell path as `/`

## Manual Validation Matrix

Still required before release:

- Android Chrome install from home screen
- iOS Safari Add to Home Screen
- cold offline launch with no cached boards
- cold offline launch with cached boards
- same-session online to offline transition
- force-close and reopen offline
- sign-out cache clearing
- reconnect and cache refresh

Recommended script:

1. Open the production build online.
2. Sign in with a user who has boards.
3. Wait for offline sync to complete.
4. Install the app.
5. Open a board and type/speak text.
6. Force-close the installed app.
7. Enable airplane mode.
8. Launch from the home-screen icon.
9. Confirm the offline shell opens immediately.
10. Confirm cached boards render read-only when previously synced.
11. Confirm browser TTS still works for typed text and cached phrases.
12. Reconnect and confirm live data resumes and the offline cache refreshes.

## Release Status

Current status: pending revalidation after the offline boot and cached-board changes.

Blocking items:

- updated Android installed-app notes
- updated iOS Add to Home Screen notes
- explicit confirmation of cold offline launch behavior
- explicit confirmation of sign-out cache clearing
