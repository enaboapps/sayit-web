import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');
const buildId = process.env.VERCEL_GIT_COMMIT_SHA
  || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
  || getLocalGitSha()
  || version;
const cacheVersion = `${version}-${buildId.slice(0, 12)}`;

const template = readFileSync(new URL('../public/sw.template.js', import.meta.url), 'utf8');
const output = template.replace('__SW_CACHE_VERSION__', cacheVersion);

writeFileSync(new URL('../public/sw.js', import.meta.url), output);

console.log(`SW cache key: sayit-shell-v${cacheVersion}`);

function getLocalGitSha() {
  try {
    return execSync('git rev-parse --short=12 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}
