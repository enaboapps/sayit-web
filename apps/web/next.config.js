import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../..');

const nextConfig = {
  serverExternalPackages: ['sherpa-onnx-node', 'js-tts-wrapper'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'globalsymbols.com',
      },
      {
        protocol: 'https',
        hostname: '*.convex.cloud',
      },
    ],
  },
  outputFileTracingRoot: workspaceRoot,
  turbopack: {
    root: workspaceRoot,
    // @willwade/aac-processors 0.2.20 references Node-only modules from the
    // browser bundle:
    //   - dist/browser/utils/zip.js: dynamic import inside `getZipAdapter`,
    //     guarded by `isNodeRuntime()` and never runs in the browser.
    //   - dist/browser/utilities/analytics/morphology/grid3VerbsParser.js:
    //     top-level and method-local imports of adm-zip, fs, and path.
    //   - dist/browser/utilities/analytics/morphology/tdsnapLexiconParser.js:
    //     reaches better-sqlite3 via Snap metrics exports.
    // These paths are not used by SayIt's Dot/OPML/OBF importer, but
    // Turbopack resolves them before tree-shaking can remove them.
    // Re-verify this list after each willwade upgrade: a newly reachable
    // aliased module would throw at runtime.
    resolveAlias: {
      'adm-zip': { browser: './lib/stubs/empty-module.js' },
      'better-sqlite3': { browser: './lib/stubs/empty-module.js' },
      'bindings': { browser: './lib/stubs/empty-module.js' },
      'fs': { browser: './lib/stubs/empty-module.js' },
      'path': { browser: './lib/stubs/path-module.js' },
    },
  },
};

export default nextConfig;
