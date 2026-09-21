# September 2026 dependency update

Issue: #773; release versions stay at 5.0.5 until the separate release process.

## Runtime and compatibility

- Node 22.19+ within Node 22: the new Undici 8 dependency requires 22.19 (pnpm 12 installation itself requires 22.13). Node typings remain on 22.
- pnpm 12.5.1 is pinned in packageManager and both workflows. Use `npm install --global pnpm@12.5.1` if an older Corepack cannot find its new entrypoint.
- TypeScript 7 runs explicit `pnpm typecheck` via the `@typescript/native` alias. The `typescript` alias targets Microsoft’s TypeScript 6 compatibility package for Next, Astro and ESLint compiler-API consumers. Build-time and lint diagnostics remain enabled. See [Microsoft’s migration guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
- Svix 2 verifies signatures without returning the event. Verify the unchanged raw request body, then parse JSON. Tests use real signatures and reject tampering, expired signatures and malformed JSON.
- Removed unused `eslint-config-next`; the existing flat config already uses `@next/eslint-plugin-next` directly. This avoids unused legacy ESLint plugin peer conflicts with ESLint 10.
- AAC processors 0.3.4 still needs the existing browser-only aliases for optional Node modules. Rechecked their call sites; Dot, OPML and OBF/OBZ remain supported. Tests exercise real imports, compressed archives, corruption rejection and export round trips.
- pnpm lifecycle scripts explicitly allow the required watcher, esbuild and resolver. SQLite native compilation stays disabled: SQLite-based board formats are not exposed by SayIt.

## Direct package versions

| Workspace | Package | Before | After |
| --- | --- | --- | --- |
| web | `@ai-sdk/openai` | `^4.0.11` | `^4.0.71` |
| web | `@clerk/nextjs` | `^7.5.16` | `^7.9.4` |
| web | `@radix-ui/react-slot` | `^1.3.0` | `^1.3.3` |
| web | `@willwade/aac-processors` | `^0.2.20` | `^0.3.4` |
| web | `ai` | `^7.0.19` | `^7.0.107` |
| web | `convex` | `^1.42.1` | `^1.46.0` |
| web | `framer-motion` | `^12.42.2` | `^13.4.0` |
| web | `jszip` | `^3.10.1` | `^3.10.2` |
| web | `nanoid` | `^5.1.16` | `^6.0.1` |
| web | `next` | `^16.2.10` | `^16.3.5` |
| web | `react` | `^19.2.7` | `^19.3.0` |
| web | `react-dom` | `^19.2.7` | `^19.3.0` |
| web | `svix` | `^1.96.1` | `^2.5.0` |
| web | `tailwind-merge` | `^3.6.0` | `^3.7.0` |
| web | `zustand` | `^5.0.14` | `^5.0.15` |
| web | `@eslint/eslintrc` | `^3.3.5` | `^3.3.7` |
| web | `@next/eslint-plugin-next` | `^16.2.10` | `^16.3.5` |
| web | `@tailwindcss/postcss` | `^4.3.2` | `^4.3.3` |
| web | `@testing-library/dom` | `^10.4.1` | `^10.4.2` |
| web | `@testing-library/jest-dom` | `^6.9.1` | `^7.0.1` |
| web | `@testing-library/react` | `^16.3.2` | `^16.3.3` |
| web | `@testing-library/user-event` | `^14.6.1` | `^14.6.7` |
| web | `@types/node` | `^26.1.1` | `^22.20.4` |
| web | `@types/react` | `^19.2.17` | `^19.3.0` |
| web | `@types/react-dom` | `^19.2.3` | `^19.3.0` |
| web | `@typescript-eslint/eslint-plugin` | `^8.63.0` | `^8.70.0` |
| web | `@typescript-eslint/parser` | `^8.63.0` | `^8.70.0` |
| web | `@typescript/native` | `—` | `npm:typescript@^7.0.2` |
| web | `convex-test` | `^0.0.54` | `^0.0.59` |
| web | `eslint` | `^10.6.0` | `^10.11.0` |
| web | `eslint-config-next` | `^16.2.10` | `removed` |
| web | `globals` | `^17.7.0` | `^17.12.0` |
| web | `jest` | `^30.4.2` | `^30.5.2` |
| web | `jest-environment-jsdom` | `^30.4.1` | `^30.5.2` |
| web | `lucide-react` | `^1.24.0` | `^1.47.0` |
| web | `tailwindcss` | `^4.3.2` | `^4.3.3` |
| web | `typescript` | `^6.0.3` | `npm:@typescript/typescript6@^6.0.2` |
| web | `typescript-eslint` | `^8.63.0` | `^8.70.0` |
| web | `vercel` | `^55.0.0` | `^59.23.2` |
| landing | `@fontsource-variable/inter` | `^5.2.8` | `^5.3.0` |
| landing | `@astrojs/check` | `0.9.9` | `0.9.10` |
| landing | `@tailwindcss/vite` | `^4.3.2` | `^4.3.3` |
| landing | `@typescript/native` | `—` | `npm:typescript@^7.0.2` |
| landing | `astro` | `7.1.0` | `7.3.3` |
| landing | `tailwindcss` | `^4.3.2` | `^4.3.3` |
| landing | `typescript` | `^6.0.3` | `npm:@typescript/typescript6@^6.0.2` |

## Security audit

Audited the shared lockfile with `pnpm audit --json` and `pnpm audit --prod --json` on 2026-09-21. Counts are registry advisory findings, not a claim about exploitability in every app route.

| Scope | Before (critical / high / moderate / low) | After |
| --- | --- | --- |
| All dependencies | 4 / 70 / 49 / 6 | 0 / 3 / 8 / 2 |
| Production dependencies | 2 / 30 / 12 / 0 | 0 / 0 / 1 / 0 |

Updated parents and refreshed transitive versions first. Narrow overrides in `pnpm-workspace.yaml` patch compatible package families (Undici 5, path-to-regexp 6 and 8, tar 7, minimatch 10, smol-toml 1, once 2), selected Vercel parents (AJV and js-yaml), and tsx (bringing its patched esbuild). AAC’s adm-zip override crosses 0.5→0.6; the ZIP read APIs it uses are unchanged and real compressed OBZ import/corruption tests cover that path. Both production builds and the current Vercel CLI are checked. Remove overrides as parents adopt the patched ranges.

### Remaining upstream blockers

- **Production:** `@willwade/aac-processors → exceljs → uuid@8.3.2`. The fix requires uuid 11.1.1 or newer, a breaking major change for the parent. SayIt does not expose Excel imports, but the production dependency remains and is counted.
- **Development tooling:** `vercel → @vercel/node` (also through its framework adapters) still requires Undici 5.29.0. Its remaining fixes require Undici 6.28+; no forced major override is applied to Vercel’s HTTP stack. Do not treat development tooling findings as harmless.

| Package | Severity | Advisory |
| --- | --- | --- |
| undici | moderate | [Undici has an unbounded decompression chain in HTTP responses on Node.js Fetch API via Content-Encoding leads to resource exhaustion](https://github.com/advisories/GHSA-g9mf-h72j-4rw9) |
| undici | moderate | [Undici has an HTTP Request/Response Smuggling issue](https://github.com/advisories/GHSA-2mjp-6q6p-2qxm) |
| undici | high | [Undici has Unbounded Memory Consumption in WebSocket permessage-deflate Decompression](https://github.com/advisories/GHSA-vrm6-8vpv-qv8q) |
| undici | high | [Undici has Unhandled Exception in WebSocket Client Due to Invalid server_max_window_bits Validation](https://github.com/advisories/GHSA-v9p9-hfj2-hcw8) |
| undici | moderate | [Undici has CRLF Injection in undici via `upgrade` option](https://github.com/advisories/GHSA-4992-7rv2-5pvq) |
| uuid | moderate | [uuid: Missing buffer bounds check in v3/v5/v6 when buf is provided](https://github.com/advisories/GHSA-w5hq-g745-h8pq) |
| undici | moderate | [undici vulnerable to HTTP header injection via Set-Cookie percent-decoding](https://github.com/advisories/GHSA-p88m-4jfj-68fv) |
| undici | high | [undici WebSocket client vulnerable to denial of service via fragment count bypass](https://github.com/advisories/GHSA-vxpw-j846-p89q) |
| undici | low | [undici vulnerable to Set-Cookie SameSite attribute downgrade via permissive substring matching](https://github.com/advisories/GHSA-g8m3-5g58-fq7m) |
| undici | moderate | [undici vulnerable to downstream response desynchronization via retry interceptor](https://github.com/advisories/GHSA-8xcm-r25x-g524) |
| undici | moderate | [undici vulnerable to CRLF Injection via blob-like body 'type' property](https://github.com/advisories/GHSA-m8rv-5g2x-5cg5) |
| undici | moderate | [undici vulnerable to cookie attribute injection via unsanitized domain and unparsed setCookie fields](https://github.com/advisories/GHSA-v3r7-h72x-cjcm) |
| undici | low | [undici vulnerable to HTTP response queue poisoning via keep-alive socket reuse](https://github.com/advisories/GHSA-35p6-xmwp-9g52) |

## Validation

- Clean temporary workspace: `pnpm install --frozen-lockfile`, using Node 22.20.0 and pnpm 12.5.1; no local environment files copied.
- `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` for both workspaces.
- Existing security, custom-provider request/playback, typing and offline tests retained. New real-package tests cover Svix signatures, AAC imports/export/ZIP handling and Motion animation target/exit lifecycle.
- Local builds use public placeholder service configuration. Real account sign-in and live provider synthesis require configured service accounts and are not implied by mocked component tests.
- GitHub checks and Vercel preview status are recorded in the PR; production configuration and deployment are unchanged.
