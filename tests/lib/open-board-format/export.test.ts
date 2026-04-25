import JSZip from 'jszip';
import { boardToOpenBoardFile, createOpenBoardZipBlob } from '@/lib/open-board-format/export';
import type { BoardSummary } from '@/app/components/phrases/types';

const board: BoardSummary = {
  id: 'board-1',
  name: 'Needs',
  phrases: [
    { id: 'phrase-1', text: 'Help', symbolUrl: 'https://example.convex.cloud/help.png' },
    { id: 'phrase-2', text: 'Water' },
    { id: 'phrase-3', text: 'Stop' },
    { id: 'phrase-4', text: 'More' },
    { id: 'phrase-5', text: 'Done' },
  ],
};

const blobToArrayBuffer = (blob: Blob) => new Promise<ArrayBuffer>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as ArrayBuffer);
  reader.onerror = () => reject(reader.error);
  reader.readAsArrayBuffer(blob);
});

describe('Open Board export', () => {
  it('exports a board as open-board-0.1', () => {
    const exported = boardToOpenBoardFile(board);

    expect(exported.format).toBe('open-board-0.1');
    expect(exported.locale).toBe('en');
    expect(exported.name).toBe('Needs');
    expect(exported.buttons[0]).toMatchObject({
      label: 'Help',
      vocalization: 'Help',
      image_id: 'image_phrase-1',
    });
    expect(exported.images[0]).toMatchObject({
      id: 'image_phrase-1',
      url: 'https://example.convex.cloud/help.png',
    });
  });

  it('builds a deterministic 4-column grid', () => {
    const exported = boardToOpenBoardFile(board);

    expect(exported.grid.rows).toBe(2);
    expect(exported.grid.columns).toBe(4);
    expect(exported.grid.order).toEqual([
      ['button_phrase-1', 'button_phrase-2', 'button_phrase-3', 'button_phrase-4'],
      ['button_phrase-5', null, null, null],
    ]);
  });

  it('exports empty boards with a valid 1x1 null grid', () => {
    const exported = boardToOpenBoardFile({ id: 'empty', name: 'Empty', phrases: [] });

    expect(exported.buttons).toEqual([]);
    expect(exported.images).toEqual([]);
    expect(exported.sounds).toEqual([]);
    expect(exported.grid).toEqual({
      rows: 1,
      columns: 1,
      order: [[null]],
    });
  });

  it('creates an .obz manifest and board files', async () => {
    const blob = await createOpenBoardZipBlob([board]);
    const zip = await JSZip.loadAsync(await blobToArrayBuffer(blob));
    const manifest = JSON.parse(await zip.file('manifest.json')!.async('text'));

    expect(manifest.root).toBe('boards/sayit_board-1.obf');
    expect(manifest.paths.boards['sayit_board-1']).toBe('boards/sayit_board-1.obf');
    expect(zip.file('boards/sayit_board-1.obf')).not.toBeNull();
  });
});
