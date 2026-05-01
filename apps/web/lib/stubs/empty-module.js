// Stub for Node-only modules (e.g. adm-zip) that are referenced inside
// runtime-conditional branches of browser bundles. The branches that import
// these modules never execute in the browser (they're guarded by
// `isNodeRuntime()` checks), but Turbopack still tries to resolve the
// dynamic-import target at build time. Aliasing those modules to this stub
// keeps the client bundle free of `node:fs`/`node:path` references.

const stub = new Proxy(function () {}, {
  get() {
    throw new Error('Node-only module accessed in the browser. This stub should never run.');
  },
  apply() {
    throw new Error('Node-only module accessed in the browser. This stub should never run.');
  },
  construct() {
    throw new Error('Node-only module accessed in the browser. This stub should never run.');
  },
});

export default stub;
export { stub };
