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
    // @willwade/aac-processors references `adm-zip` from three places in the
    // browser bundle:
    //   - dist/browser/utils/zip.js: dynamic import inside `getZipAdapter`,
    //     guarded by `isNodeRuntime()` — never runs in the browser.
    //   - dist/browser/processors/obfProcessor.js (saveModifiedTree): dynamic
    //     import on the export path — only reachable for OBF export, which
    //     we don't use through this library.
    //   - dist/browser/utilities/analytics/morphology/grid3VerbsParser.js:
    //     a TOP-LEVEL static `import AdmZip from 'adm-zip'`. Currently dead
    //     code (not re-exported through index.browser.js), but tree-shaking
    //     can't drop it after Turbopack has already requested module
    //     resolution.
    // Aliasing `adm-zip` to a no-op stub keeps client bundles free of
    // node:fs/node:path. Re-verify this list after each willwade upgrade —
    // a new transitive `adm-zip` reference would silently throw at runtime.
    resolveAlias: {
      'adm-zip': path.resolve(__dirname, 'lib/stubs/empty-module.js').replace(/\\/g, '/'),
    },
  },
};

export default nextConfig;
