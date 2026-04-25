import type { AACTree, AACPage, AACButton } from '@willwade/aac-processors';
import { ObfProcessor } from '@willwade/aac-processors/obf';
import { boardToOpenBoardFile, createOpenBoardZipBlob } from './export';
import { normalizeOpenBoardPackage } from './import';
import {
  MAX_OPEN_BOARD_FILE_BYTES,
  OpenBoardFile,
  OpenBoardImage,
  OpenBoardProcessorAdapter,
  ParsedOpenBoardPackage,
} from './types';
import { OpenBoardFormatError } from './validation';

export const aacProcessorsOpenBoardAdapter: OpenBoardProcessorAdapter = {
  parseUpload: parseUploadWithAACProcessors,
  normalize: normalizeOpenBoardPackage,
  exportBoard: boardToOpenBoardFile,
  exportBoards: createOpenBoardZipBlob,
};

async function parseUploadWithAACProcessors(file: File): Promise<ParsedOpenBoardPackage> {
  if (file.size > MAX_OPEN_BOARD_FILE_BYTES) {
    throw new OpenBoardFormatError('Open Board file is larger than the 25 MB import limit.');
  }

  const lowerName = file.name.toLowerCase();
  if (!lowerName.endsWith('.obf') && !lowerName.endsWith('.obz')) {
    throw new OpenBoardFormatError('Choose a .obf or .obz file.');
  }

  const input = await readFileInput(file);
  const processor = new ObfProcessor();
  const tree = await processor.loadIntoTree(input);
  return treeToParsedPackage(tree);
}

async function readFileInput(file: File): Promise<ArrayBuffer | Uint8Array> {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }

  if (typeof file.text === 'function') {
    const text = await file.text();
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(text);
    }
    return Buffer.from(text, 'utf8');
  }

  throw new OpenBoardFormatError('Could not read Open Board file.');
}

function treeToParsedPackage(tree: AACTree): ParsedOpenBoardPackage {
  const orderedPages = getOrderedPages(tree);
  if (orderedPages.length === 0) {
    throw new OpenBoardFormatError('Open Board file did not contain any boards.');
  }

  return {
    boards: orderedPages.map((page) => pageToOpenBoardFile(page, tree)),
    imageBlobs: new Map(),
    warnings: [],
  };
}

function getOrderedPages(tree: AACTree) {
  const pages = Object.values(tree.pages);
  if (!tree.rootId) return pages;

  const rootPage = tree.getPage(tree.rootId);
  if (!rootPage) return pages;

  return [
    rootPage,
    ...pages.filter((page) => page.id !== rootPage.id),
  ];
}

function pageToOpenBoardFile(page: AACPage, tree: AACTree): OpenBoardFile {
  const buttonIdsInGrid = new Set<string>();
  const rows = page.grid.length || 1;
  const columns = page.grid.reduce((max, row) => Math.max(max, row.length), 0) || Math.max(page.buttons.length, 1);
  const order = Array.from({ length: rows }, (_, rowIndex) => (
    Array.from({ length: columns }, (_, columnIndex) => {
      const button = page.grid[rowIndex]?.[columnIndex] ?? null;
      if (!button) return null;
      buttonIdsInGrid.add(button.id);
      return button.id;
    })
  ));

  const buttons = page.buttons.map((button) => buttonToOpenBoardButton(button));
  const gridlessButtons = buttons.filter((button) => !buttonIdsInGrid.has(button.id));
  if (gridlessButtons.length > 0 && page.grid.length === 0) {
    order[0] = buttons.map((button) => button.id);
  }

  return {
    format: 'open-board-0.1',
    id: page.id,
    locale: page.locale || tree.metadata.locale || 'en',
    name: page.name || tree.metadata.name || 'Imported Board',
    description_html: page.descriptionHtml || tree.metadata.description,
    buttons,
    images: pageToOpenBoardImages(page),
    sounds: Array.isArray(page.sounds) ? page.sounds : [],
    grid: {
      rows: order.length,
      columns: order[0]?.length || 1,
      order,
    },
  };
}

function buttonToOpenBoardButton(button: AACButton): OpenBoardFile['buttons'][number] {
  const imageId = getButtonImageId(button);
  const isNavigation = button.semanticAction?.intent === 'NAVIGATE_TO' || !!button.targetPageId;

  return {
    id: button.id,
    label: button.label,
    vocalization: button.message || button.label,
    hidden: button.visibility === 'Hidden',
    background_color: button.style?.backgroundColor,
    border_color: button.style?.borderColor,
    ...(imageId ? { image_id: imageId } : {}),
    ...(isNavigation && button.targetPageId
      ? { load_board: { path: button.targetPageId } }
      : {}),
  };
}

function pageToOpenBoardImages(page: AACPage): OpenBoardImage[] {
  const imagesById = new Map<string, OpenBoardImage>();

  if (Array.isArray(page.images)) {
    for (const image of page.images) {
      if (image && typeof image.id === 'string') {
        imagesById.set(image.id, image);
      }
    }
  }

  for (const button of page.buttons) {
    const imageId = getButtonImageId(button);
    if (!imageId || !button.image) continue;

    imagesById.set(imageId, {
      ...imagesById.get(imageId),
      id: imageId,
      ...(button.image.startsWith('data:image/')
        ? { data: button.image }
        : { url: button.image }),
    });
  }

  return [...imagesById.values()];
}

function getButtonImageId(button: AACButton) {
  const value = button.parameters?.image_id || button.parameters?.imageId;
  return typeof value === 'string' && value.trim() ? value : undefined;
}
