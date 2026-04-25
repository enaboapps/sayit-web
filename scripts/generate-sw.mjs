import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

/**
 * Resolve a short commit SHA. We prefer Vercel's build-env SHA so previews
 * and prod deploys stay consistent with the underlying commit; fall back to
 * a local `git rev-parse` for local builds (and non-Vercel CI); finally
 * fall back to a base-36 timestamp so the script never throws if it ends up
 * running outside of a git checkout.
 */
function resolveShortSha() {
  const vercelSha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (vercelSha) {
    return vercelSha.slice(0, 7);
  }

  try {
    const sha = execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    if (sha) return sha;
  } catch {
    // git not available or not a repository — fall through.
  }

  return Date.now().toString(36);
}

/**
 * Detect uncommitted changes against HEAD. When the working tree is dirty
 * we append a timestamp suffix to the cache key so every dev restart and
 * every locally-built artifact (even on the same commit) gets a fresh
 * service-worker cache, avoiding stale-asset surprises.
 */
function isWorkingTreeDirty() {
  try {
    execSync('git diff-index --quiet HEAD --', { stdio: 'ignore' });
    return false;
  } catch {
    return true;
  }
}

const shortSha = resolveShortSha();
const baseKey = `${version}-${shortSha}`;
const cacheKey = isWorkingTreeDirty()
  ? `${baseKey}-${Date.now().toString(36)}`
  : baseKey;

const template = readFileSync(
  new URL('../public/sw.template.js', import.meta.url),
  'utf8'
);
const output = template.replace('__SW_CACHE_VERSION__', cacheKey);

writeFileSync(new URL('../public/sw.js', import.meta.url), output);

console.log(`SW cache key: sayit-shell-v${cacheKey}`);
