/** @jest-environment node */
import { ObfProcessor, DotProcessor, OpmlProcessor } from '@willwade/aac-processors';
import JSZip from 'jszip';
import { normalizeAacProcessorsTree } from '@/lib/open-board-format/aacProcessors';
import { boardToOpenBoardFile } from '@/lib/open-board-format/export';

// Exercise the installed library, including its patched adm-zip dependency.
// The browser bundle is separately checked by the Next production build.
const board = {
  format: 'open-board-0.1', id: 'home', name: 'Home', locale: 'en',
  buttons: [{ id: 'hello', label: 'Hello', vocalization: 'Hello there' }],
  images: [], sounds: [], grid: { rows: 1, columns: 2, order: [['hello', null]] },
};
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

test('imports real OBF data and exports the fixed grid without moving phrases', async () => {
  const tree = await new ObfProcessor().loadIntoTree(Buffer.from(JSON.stringify(board)));
  const normalized = normalizeAacProcessorsTree(tree);
  expect(normalized.boards[0]).toMatchObject({ name: 'Home', gridRows: 1, gridColumns: 2,
    tiles: [{ kind: 'phrase', text: 'Hello there', cellRow: 0, cellColumn: 0 }] });
  const exported = boardToOpenBoardFile({ id: 'home', name: 'Home', phrases: [], layoutMode: 'fixedGrid',
    gridRows: 1, gridColumns: 2, tiles: [{ id: 'hello', kind: 'phrase', position: 0, cellRow: 0, cellColumn: 0,
      phrase: { id: 'hello', text: 'Hello there' } }] });
  const roundTrip = normalizeAacProcessorsTree(await new ObfProcessor().loadIntoTree(Buffer.from(JSON.stringify(exported))));
  expect(roundTrip.boards[0].tiles[0]).toMatchObject({ text: 'Hello there', position: 0 });
  expect(roundTrip.boards[0].gridColumns).toBe(2);
});

test('imports a compressed OBZ through the patched ZIP reader and rejects corrupt archives', async () => {
  const zip = new JSZip();
  zip.file('manifest.json', JSON.stringify({ format: 'open-board-0.1', root: 'boards/home.obf',
    paths: { boards: { home: 'boards/home.obf' }, images: {}, sounds: {} } }));
  zip.file('boards/home.obf', JSON.stringify(board));
  const archive = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const result = normalizeAacProcessorsTree(await new ObfProcessor().loadIntoTree(archive));
  expect(result.boards[0].tiles[0]).toMatchObject({ text: 'Hello there' });
  await expect(new ObfProcessor().loadIntoTree(Buffer.from('PK\x03\x04broken'))).rejects.toThrow();
});

test('retains DOT and OPML import support', async () => {
  const dot = await new DotProcessor().loadIntoTree(Buffer.from('digraph G { hello [label="Hello"]; }'));
  expect(Object.keys(dot.pages).length).toBeGreaterThan(0);
  const opml = await new OpmlProcessor().loadIntoTree(Buffer.from('<opml version="2.0"><head><title>Home</title></head><body><outline text="Hello"/></body></opml>'));
  expect(Object.keys(opml.pages).length).toBeGreaterThan(0);
});
