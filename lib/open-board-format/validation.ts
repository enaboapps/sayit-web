import {
  MAX_IMPORT_BOARDS,
  MAX_IMPORT_PHRASES,
  OpenBoardFile,
  OpenBoardGrid,
  OpenBoardImage,
  OpenBoardManifest,
} from './types';

export class OpenBoardFormatError extends Error {
  constructor(message: string, public readonly warnings: string[] = []) {
    super(message);
    this.name = 'OpenBoardFormatError';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const isPositiveInteger = (value: unknown): value is number => (
  Number.isInteger(value) && Number(value) > 0
);

const requireString = (value: unknown, field: string) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new OpenBoardFormatError(`${field} is required`);
  }
  return value;
};

export function validateOpenBoardManifest(value: unknown): OpenBoardManifest {
  if (!isRecord(value)) {
    throw new OpenBoardFormatError('manifest.json must contain a JSON object');
  }

  const format = requireString(value.format, 'manifest.format');
  if (!format.startsWith('open-board-')) {
    throw new OpenBoardFormatError('manifest.format must start with open-board-');
  }

  const root = requireString(value.root, 'manifest.root');
  if (!isRecord(value.paths)) {
    throw new OpenBoardFormatError('manifest.paths is required');
  }

  const paths = value.paths;
  if (!isRecord(paths.boards)) {
    throw new OpenBoardFormatError('manifest.paths.boards is required');
  }

  return {
    format,
    root,
    paths: {
      boards: Object.fromEntries(
        Object.entries(paths.boards).map(([id, path]) => [id, requireString(path, `manifest.paths.boards.${id}`)])
      ),
      images: isRecord(paths.images)
        ? Object.fromEntries(
          Object.entries(paths.images).map(([id, path]) => [id, requireString(path, `manifest.paths.images.${id}`)])
        )
        : undefined,
      sounds: isRecord(paths.sounds)
        ? Object.fromEntries(
          Object.entries(paths.sounds).map(([id, path]) => [id, requireString(path, `manifest.paths.sounds.${id}`)])
        )
        : undefined,
    },
  };
}

export function validateOpenBoardFile(value: unknown, filename = 'board.obf'): { board: OpenBoardFile; warnings: string[] } {
  const warnings: string[] = [];

  if (!isRecord(value)) {
    throw new OpenBoardFormatError(`${filename} must contain a JSON object`);
  }

  const format = requireString(value.format, 'format');
  if (!format.startsWith('open-board-')) {
    throw new OpenBoardFormatError('format must start with open-board-');
  }

  const id = requireString(value.id, 'id');
  const locale = requireString(value.locale, 'locale');

  if (!Array.isArray(value.buttons)) {
    throw new OpenBoardFormatError('buttons is required and must be an array');
  }
  if (!Array.isArray(value.images)) {
    throw new OpenBoardFormatError('images is required and must be an array');
  }
  if (!Array.isArray(value.sounds)) {
    throw new OpenBoardFormatError('sounds is required and must be an array');
  }

  const grid = validateGrid(value.grid);
  const buttons = value.buttons.map((button, index) => {
    if (!isRecord(button)) {
      throw new OpenBoardFormatError(`buttons[${index}] must be an object`);
    }
    const buttonId = requireString(button.id, `buttons[${index}].id`);
    const label = requireString(button.label, `buttons[${index}].label`);
    return {
      ...button,
      id: buttonId,
      label,
    };
  }) as OpenBoardFile['buttons'];

  const buttonIds = new Set(buttons.map((button) => button.id));
  const usedButtonIds = new Set<string>();
  for (const row of grid.order) {
    for (const buttonId of row) {
      if (!buttonId) continue;
      usedButtonIds.add(buttonId);
      if (!buttonIds.has(buttonId)) {
        throw new OpenBoardFormatError(`grid.order references unknown button id ${buttonId}`);
      }
    }
  }

  const unusedButtons = buttons.filter((button) => !usedButtonIds.has(button.id));
  if (unusedButtons.length > 0) {
    warnings.push(`Ignored ${unusedButtons.length} button(s) not present in grid.order.`);
  }

  const images = value.images.map((image, index) => validateImage(image, index));

  return {
    board: {
      ...value,
      format,
      id,
      locale,
      name: typeof value.name === 'string' ? value.name : undefined,
      description_html: typeof value.description_html === 'string' ? value.description_html : undefined,
      default_layout: typeof value.default_layout === 'string' ? value.default_layout : undefined,
      buttons,
      images,
      sounds: value.sounds as OpenBoardFile['sounds'],
      grid,
    },
    warnings,
  };
}

export function validateImportLimits(boardCount: number, phraseCount: number) {
  if (boardCount > MAX_IMPORT_BOARDS) {
    throw new OpenBoardFormatError(`Import contains ${boardCount} boards; the limit is ${MAX_IMPORT_BOARDS}.`);
  }

  if (phraseCount > MAX_IMPORT_PHRASES) {
    throw new OpenBoardFormatError(`Import contains ${phraseCount} phrases; the limit is ${MAX_IMPORT_PHRASES}.`);
  }
}

function validateGrid(value: unknown): OpenBoardGrid {
  if (!isRecord(value)) {
    throw new OpenBoardFormatError('grid is required and must be an object');
  }

  if (!isPositiveInteger(value.rows)) {
    throw new OpenBoardFormatError('grid.rows must be a positive integer');
  }
  if (!isPositiveInteger(value.columns)) {
    throw new OpenBoardFormatError('grid.columns must be a positive integer');
  }
  if (!Array.isArray(value.order)) {
    throw new OpenBoardFormatError('grid.order must be an array');
  }
  if (value.order.length !== value.rows) {
    throw new OpenBoardFormatError('grid.order length must match grid.rows');
  }

  const order = value.order.map((row, rowIndex) => {
    if (!Array.isArray(row) || row.length !== value.columns) {
      throw new OpenBoardFormatError(`grid.order[${rowIndex}] must contain ${value.columns} cells`);
    }
    return row.map((cell) => {
      if (cell === null || cell === undefined || cell === '') return null;
      if (typeof cell !== 'string') {
        throw new OpenBoardFormatError(`grid.order[${rowIndex}] contains a non-string button id`);
      }
      return cell;
    });
  });

  return {
    rows: value.rows,
    columns: value.columns,
    order,
  };
}

function validateImage(value: unknown, index: number): OpenBoardImage {
  if (!isRecord(value)) {
    throw new OpenBoardFormatError(`images[${index}] must be an object`);
  }

  const id = requireString(value.id, `images[${index}].id`);
  if (value.data && (typeof value.data !== 'string' || !value.data.startsWith('data:image/'))) {
    throw new OpenBoardFormatError(`images[${index}].data must be an image data URI`);
  }

  return {
    ...value,
    id,
    width: typeof value.width === 'number' ? value.width : undefined,
    height: typeof value.height === 'number' ? value.height : undefined,
    content_type: typeof value.content_type === 'string' ? value.content_type : undefined,
    data: typeof value.data === 'string' ? value.data : undefined,
    url: typeof value.url === 'string' ? value.url : undefined,
    path: typeof value.path === 'string' ? value.path : undefined,
    symbol: isRecord(value.symbol) ? value.symbol : undefined,
  };
}
