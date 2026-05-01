// Drift detector for the two AAC preset definitions:
//
//   apps/web/convex/aacLayout.ts  - canonical (server-side validation)
//   apps/web/lib/aacLayout.ts     - UI-facing (adds label + description)
//
// They MUST agree on rows/columns and on the set of preset keys, otherwise
// the UI grid hint will diverge from what server-side import / starter-board
// code actually places. Adding a preset to one but not the other should
// fail the build, not silently ship a broken layout.
import { AAC_PRESETS as SERVER_PRESETS } from '@/convex/aacLayout';
import { AAC_PRESETS as UI_PRESETS } from '@/lib/aacLayout';

describe('AAC preset map drift', () => {
  it('exposes the same preset keys server-side and UI-side', () => {
    const serverKeys = Object.keys(SERVER_PRESETS).sort();
    const uiKeys = Object.keys(UI_PRESETS).sort();
    expect(uiKeys).toEqual(serverKeys);
  });

  it('agrees on rows and columns for every preset', () => {
    for (const key of Object.keys(SERVER_PRESETS) as Array<keyof typeof SERVER_PRESETS>) {
      const server = SERVER_PRESETS[key];
      const ui = UI_PRESETS[key];
      expect({ rows: ui.rows, columns: ui.columns }).toEqual({
        rows: server.rows,
        columns: server.columns,
      });
    }
  });
});
