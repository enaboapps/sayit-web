# Release Checklist

## Pre-Release

- Run `npm test`
- Run `npm run lint`
- Run `npm run build`
- Confirm the working tree is clean
- Confirm milestone issues are closed or explicitly deferred

## PWA Validation

- Confirm `/sw.js` is served in production
- Confirm the production home route loads successfully under `next start`
- Confirm the manifest is served correctly in production
- Confirm icon assets return `200`
- Run Lighthouse against the production build and save the results in `docs/pwa-validation.md`
- Record supported Lighthouse category scores and installability notes
- Verify install on Android Chrome
- Verify Add to Home Screen on iOS Safari
- Verify cold offline launch with no cached boards
- Verify cold offline launch with cached boards
- Verify text entry, tab restore, and browser TTS while offline
- Verify cached boards render read-only offline after prior sync
- Verify cloud-only features show explicit offline states
- Verify sign-out clears or isolates offline board cache
- Verify reconnect behavior refreshes live data and offline cache

## Release

- Run `npx eslint . --ext .js,.jsx,.ts,.tsx --fix` if needed
- Commit any release-only fixes
- Bump version with `npm version patch|minor|major`
- Push commits and tags
- Confirm the GitHub release workflow succeeds
- Close the milestone

## Post-Release Notes

- Link the final Lighthouse report
- Link Android/iOS/manual validation notes
- Record any validation gaps that remain for the next milestone
