import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

const template = readFileSync(new URL('../public/sw.template.js', import.meta.url), 'utf8');
const output = template.replace('__SW_CACHE_VERSION__', version);

writeFileSync(new URL('../public/sw.js', import.meta.url), output);

console.log(`SW cache key: sayit-shell-v${version}`);
