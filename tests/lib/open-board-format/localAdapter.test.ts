import JSZip from 'jszip';
import { localOpenBoardAdapter } from '@/lib/open-board-format/localAdapter';
import type { BoardSummary } from '@/app/components/phrases/types';

const validBoard = {
  format: 'open-board-0.1',
  id: 'root',
  locale: 'en',
  name: 'Adapter Board',
  buttons: [
    { id: 'b1', label: 'First' },
    { id: 'b2', label: 'Second' },
  ],
  images: [],
  sounds: [],
  grid: {
    rows: 1,
    columns: 2,
    order: [['b2', 'b1']],
  },
};

const exportBoard: BoardSummary = {
  id: 'board-1',
  name: 'Needs',
  phrases: [
    { id: 'phrase-1', text: 'Help' },
    { id: 'phrase-2', text: 'Water' },
  ],
};

const blobToArrayBuffer = (blob: Blob) => new Promise<ArrayBuffer>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as ArrayBuffer);
  reader.onerror = () => reject(reader.error);
  reader.readAsArrayBuffer(blob);
});

const makeUploadFile = (name: string, text: string): File => ({
  name,
  size: text.length,
  text: async () => text,
} as File);

describe('localOpenBoardAdapter', () => {
  it('parses .obf uploads', async () => {
    const file = makeUploadFile('adapter.obf', JSON.stringify(validBoard));

    const parsed = await localOpenBoardAdapter.parseUpload(file);

    expect(parsed.boards).toHaveLength(1);
    expect(parsed.boards[0].name).toBe('Adapter Board');
  });

  it('normalizes parsed boards in grid order', async () => {
    const file = makeUploadFile('adapter.obf', JSON.stringify(validBoard));
    const parsed = await localOpenBoardAdapter.parseUpload(file);
    const normalized = localOpenBoardAdapter.normalize(parsed);

    expect(normalized.boards[0].phrases.map((phrase) => phrase.text)).toEqual([
      'Second',
      'First',
    ]);
  });

  it('exports boards as open-board-0.1', () => {
    const exported = localOpenBoardAdapter.exportBoard(exportBoard);

    expect(exported.format).toBe('open-board-0.1');
    expect(exported.name).toBe('Needs');
  });

  it('exports board sets as .obz packages with a manifest', async () => {
    const blob = await localOpenBoardAdapter.exportBoards([exportBoard]);
    const zip = await JSZip.loadAsync(await blobToArrayBuffer(blob));
    const manifest = JSON.parse(await zip.file('manifest.json')!.async('text'));

    expect(manifest.root).toBe('boards/sayit_board-1.obf');
    expect(zip.file('boards/sayit_board-1.obf')).not.toBeNull();
  });
});
