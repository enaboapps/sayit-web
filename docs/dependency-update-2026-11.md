# November 2026 dependency update

Tracked in #788. Package versions remain 5.2.2 until the separate 5.3.0 release branch.

## Updated packages

All direct dependencies with newer registry releases were updated except `@types/node`, which stays on Node 22 to match the supported runtime. The pinned pnpm version and TypeScript compatibility aliases remain unchanged.

The update includes Next.js 16.4.5, React and React DOM 19.3.1, Convex 1.49.0, Motion 14.9.1, AAC Processors 0.4.1, Astro 7.4.5, Vercel CLI 65.11.0, Clerk 7.9.24, AI SDK 7.0.162 and its OpenAI provider 4.0.108, and Tailwind 4.3.4. Test and lint tooling also receive available updates.

## Compatibility checks

- Validation uses Node 22.23.4 and pinned pnpm 12.5.1. On this Windows machine the existing pnpm shim fails, so its `bin/pnpm.mjs` entry point runs the same pinned version.
- [Motion's upgrade guide](https://motion.dev/docs/upgrade-guide) lists no breaking changes for version 14. Existing animation imports and tests remain in place.
- [Next.js 16.4](https://nextjs.org/blog/next-16-4) supports the existing app structure. Cache Components remain opt-in for this app.
- AAC Processors' browser implementation now routes optional Node access through runtime adapters. Existing browser aliases remain in place, and the production build checks bundling. Integration tests exercise real OBF, compressed OBZ, DOT and OPML inputs, including corrupt archives and export round trips.
- Vercel CLI 65 introduces Koffi through its authentication helpers. Its native install script is explicitly allowed in `pnpm-workspace.yaml`. The installed CLI starts and accepts the release workflow's deployment command and options.

## Security audit

The November 5 registry audit reports no critical or high production findings. One moderate production finding remains in `@willwade/aac-processors > exceljs > uuid@8.3.2`, [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq). Its fix requires a major uuid upgrade by the parent; SayIt does not expose Excel imports.

Compatible overrides patch Undici within majors 6, 7 and 8, smol-toml 1, source-map-js 1, follow-redirects 1, fast-uri 3, Zod 4, Glob 14 and Fastify Busboy 3. Existing constrained overrides remain in place.

The full tooling audit still reports 8 high, 12 moderate and 4 low findings. Remaining affected packages are Undici 5, Fastify Busboy 2, Sharp 0.35.4, Zod 3, Deepmerge 4, Glob 10/13 and Minimatch 9/10, alongside the production uuid finding. These remain visible in the audit. They are not blanket-suppressed or replaced with untested major overrides.

## Validation

Run the workspace lint and type checks, all Jest suites, and both production builds. The web build uses the same placeholder Convex URL as CI. Validate a frozen-lockfile installation and Vercel CLI startup before merging. Manual installed Android/iOS and live production checks are separate from this dependency validation.
