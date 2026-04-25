import {
  NormalizedOpenBoardBoard,
  NormalizedOpenBoardImport,
  NormalizedOpenBoardPhrase,
  OpenBoardFile,
  ParsedOpenBoardPackage,
} from './types';
import { dataUriToBlob } from './files';
import { OpenBoardFormatError, validateImportLimits } from './validation';

export function normalizeOpenBoardPackage(pkg: ParsedOpenBoardPackage): NormalizedOpenBoardImport {
  const warnings = [...pkg.warnings];
  const boards = pkg.boards.map((board) => normalizeBoard(board, pkg.imageBlobs, warnings));
  const phraseCount = boards.reduce((total, board) => total + board.phrases.length, 0);

  validateImportLimits(boards.length, phraseCount);

  return {
    boards,
    warnings,
  };
}

function normalizeBoard(
  board: OpenBoardFile,
  packageImageBlobs: Map<string, Blob>,
  warnings: string[]
): NormalizedOpenBoardBoard {
  const buttonById = new Map(board.buttons.map((button) => [button.id, button]));
  const imageById = new Map(board.images.map((image) => [image.id, image]));
  const seenText = new Set<string>();
  const phrases: NormalizedOpenBoardPhrase[] = [];

  for (const row of board.grid.order) {
    for (const buttonId of row) {
      if (!buttonId) continue;
      const button = buttonById.get(buttonId);
      if (!button) continue;

      if (button.hidden) {
        warnings.push(`${board.name || board.id}: skipped hidden button "${button.label}".`);
        continue;
      }

      if (button.sound_id) {
        warnings.push(`${board.name || board.id}: ignored sound for "${button.label}".`);
      }

      if (button.load_board) {
        warnings.push(`${board.name || board.id}: imported linked-board button "${button.label}" as a phrase only.`);
      }

      const text = (button.vocalization?.trim() || button.label.trim());
      if (!text) continue;

      const duplicateKey = text.toLocaleLowerCase();
      if (seenText.has(duplicateKey)) {
        warnings.push(`${board.name || board.id}: skipped duplicate phrase "${text}".`);
        continue;
      }
      seenText.add(duplicateKey);

      const symbolBlob = getButtonImageBlob(button.image_id, imageById, packageImageBlobs, warnings, board.name || board.id, text);
      phrases.push({
        text,
        position: phrases.length,
        symbolBlob,
        sourceButtonId: button.id,
      });
    }
  }

  return {
    sourceId: board.id,
    name: board.name?.trim() || 'Imported Board',
    phrases,
  };
}

function getButtonImageBlob(
  imageId: string | undefined,
  imageById: Map<string, OpenBoardFile['images'][number]>,
  packageImageBlobs: Map<string, Blob>,
  warnings: string[],
  boardName: string,
  phraseText: string
) {
  if (!imageId) return undefined;

  const packagedBlob = packageImageBlobs.get(imageId);
  if (packagedBlob) return packagedBlob;

  const image = imageById.get(imageId);
  if (!image) {
    warnings.push(`${boardName}: image ${imageId} for "${phraseText}" was not found.`);
    return undefined;
  }

  if (image.data) {
    try {
      return dataUriToBlob(image.data);
    } catch (error) {
      if (error instanceof OpenBoardFormatError) {
        warnings.push(`${boardName}: ${error.message}`);
      } else {
        warnings.push(`${boardName}: could not decode image for "${phraseText}".`);
      }
      return undefined;
    }
  }

  if (image.path) {
    warnings.push(`${boardName}: image path ${image.path} for "${phraseText}" was not found in the package.`);
    return undefined;
  }

  if (image.url) {
    warnings.push(`${boardName}: skipped remote image for "${phraseText}".`);
  }

  return undefined;
}
