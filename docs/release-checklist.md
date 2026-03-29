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
- Run Lighthouse against the production build and save the results in `docs/pwa-validation.md`
- Record supported Lighthouse category scores and any installability-related notes
- Verify install on Android Chrome
- Verify Add to Home Screen on iOS Safari
- Verify offline reopen behavior
- Verify text entry, tab restore, and browser TTS while offline
- Verify cloud-only features show explicit offline states
- Verify reconnect behavior after coming back online

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
