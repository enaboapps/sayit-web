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
    // @willwade/aac-processors' browser bundle has runtime-conditional dynamic
    // imports for Node-only modules (adm-zip) that never execute in the
    // browser (guarded by `isNodeRuntime()`). Turbopack still tries to resolve
    // these statically; alias them to a no-op stub.
    resolveAlias: {
      'adm-zip': path.resolve(__dirname, 'lib/stubs/empty-module.js').replace(/\\/g, '/'),
    },
  },
};

export default nextConfig;
