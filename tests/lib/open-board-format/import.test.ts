import JSZip from 'jszip';
import { parseOpenBoardJson, parseOpenBoardZip } from '@/lib/open-board-format/files';
import { normalizeOpenBoardPackage } from '@/lib/open-board-format/import';

const validBoard = {
  format: 'open-board-0.1',
  id: 'root',
  locale: 'en',
  name: 'Food',
  buttons: [
    { id: 'b1', label: 'Apple' },
    { id: 'b2', label: 'Water', vocalization: 'I want water' },
  ],
  images: [],
  sounds: [],
  grid: {
    rows: 1,
    columns: 2,
    order: [['b2', 'b1']],
  },
};

describe('Open Board import normalization', () => {
  it('imports valid .obf files in grid order', () => {
    const parsed = parseOpenBoardJson('food.obf', JSON.stringify(validBoard));
    const normalized = normalizeOpenBoardPackage(parsed);

    expect(normalized.boards).toHaveLength(1);
    expect(normalized.boards[0].name).toBe('Food');
    expect(normalized.boards[0].phrases.map((phrase) => phrase.text)).toEqual([
      'I want water',
      'Apple',
    ]);
  });

  it('skips hidden and duplicate buttons with warnings', () => {
    const parsed = parseOpenBoardJson('food.obf', JSON.stringify({
      ...validBoard,
      buttons: [
        { id: 'b1', label: 'Apple' },
        { id: 'b2', label: 'Apple' },
        { id: 'b3', label: 'Secret', hidden: true },
      ],
      grid: {
        rows: 1,
        columns: 3,
        order: [['b1', 'b2', 'b3']],
      },
    }));

    const normalized = normalizeOpenBoardPackage(parsed);

    expect(normalized.boards[0].phrases.map((phrase) => phrase.text)).toEqual(['Apple']);
    expect(normalized.warnings.join('\n')).toContain('skipped duplicate phrase');
    expect(normalized.warnings.join('\n')).toContain('skipped hidden button');
  });

  it('rejects unknown button ids in grid.order', () => {
    expect(() => parseOpenBoardJson('bad.obf', JSON.stringify({
      ...validBoard,
      grid: {
        rows: 1,
        columns: 1,
        order: [['missing']],
      },
    }))).toThrow(/unknown button id/);
  });

  it('converts image data URIs to symbol blobs', () => {
    const parsed = parseOpenBoardJson('image.obf', JSON.stringify({
      ...validBoard,
      buttons: [{ id: 'b1', label: 'Apple', image_id: 'i1' }],
      images: [{
        id: 'i1',
        width: 1,
        height: 1,
        content_type: 'image/png',
        data: 'data:image/png;base64,aGVsbG8=',
      }],
      grid: {
        rows: 1,
        columns: 1,
        order: [['b1']],
      },
    }));

    const normalized = normalizeOpenBoardPackage(parsed);

    expect(normalized.boards[0].phrases[0].symbolBlob).toBeInstanceOf(Blob);
    expect(normalized.boards[0].phrases[0].symbolBlob?.type).toBe('image/png');
  });

  it('imports multi-board .obz packages', async () => {
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify({
      format: 'open-board-0.1',
      root: 'boards/root.obf',
      paths: {
        boards: {
          root: 'boards/root.obf',
          second: 'boards/second.obf',
        },
      },
    }));
    zip.file('boards/root.obf', JSON.stringify(validBoard));
    zip.file('boards/second.obf', JSON.stringify({ ...validBoard, id: 'second', name: 'Places' }));

    const parsed = await parseOpenBoardZip(await zip.generateAsync({ type: 'arraybuffer' }));
    const normalized = normalizeOpenBoardPackage(parsed);

    expect(normalized.boards.map((board) => board.name)).toEqual(['Food', 'Places']);
  });

  it('rejects .obz packages without a manifest', async () => {
    const zip = new JSZip();
    zip.file('boards/root.obf', JSON.stringify(validBoard));

    await expect(parseOpenBoardZip(await zip.generateAsync({ type: 'arraybuffer' })))
      .rejects
      .toThrow(/manifest/);
  });
});
