// Stub for Node-only modules (e.g. adm-zip) that are referenced inside
// runtime-conditional branches of browser bundles. The branches that actually
// invoke these modules never execute in the browser (they're guarded by
// `isNodeRuntime()` checks), but Turbopack still tries to resolve the
// dynamic-import target at build time. Aliasing those modules to this stub
// keeps the client bundle free of `node:fs`/`node:path` references.
//
// Property reads return another stub so consumers like
// `(await import('adm-zip')).default` can chain `.SomeMethod` without
// throwing during module-shape probes (Turbopack's static analysis may
// touch `.default` even on dynamic imports). Only *calling* or *constructing*
// the stub throws — that's an actual runtime invocation, which by definition
// can't happen in the browser if the guards are doing their job.

const message = 'Node-only module accessed in the browser. The runtime guard upstream of this stub did not fire — verify isNodeRuntime() in @willwade/aac-processors and the next.config.js alias list.';

function makeStub() {
  return new Proxy(function () {}, {
    get(target, prop) {
      // Default export is the most common access; return another stub so
      // chained property access like `(await import('x')).default.Foo` works.
      if (prop === '__esModule') return true;
      if (prop === Symbol.toPrimitive) return () => '[adm-zip stub]';
      if (prop === 'then') return undefined; // not a thenable
      return makeStub();
    },
    apply() {
      throw new Error(message);
    },
    construct() {
      throw new Error(message);
    },
  });
}

const stub = makeStub();
export default stub;
export { stub };
