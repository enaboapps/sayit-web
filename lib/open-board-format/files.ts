import JSZip from 'jszip';
import { MAX_OPEN_BOARD_FILE_BYTES, ParsedOpenBoardPackage } from './types';
import { OpenBoardFormatError, validateOpenBoardFile, validateOpenBoardManifest } from './validation';

export async function parseOpenBoardUpload(file: File): Promise<ParsedOpenBoardPackage> {
  if (file.size > MAX_OPEN_BOARD_FILE_BYTES) {
    throw new OpenBoardFormatError('Open Board file is larger than the 25 MB import limit.');
  }

  const lowerName = file.name.toLowerCase();
  if (lowerName.endsWith('.obf')) {
    return parseOpenBoardJson(file.name, await file.text());
  }
  if (lowerName.endsWith('.obz')) {
    return parseOpenBoardZip(await file.arrayBuffer());
  }

  throw new OpenBoardFormatError('Choose a .obf or .obz file.');
}

export function parseOpenBoardJson(filename: string, text: string): ParsedOpenBoardPackage {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new OpenBoardFormatError('Could not parse .obf as JSON.');
  }

  const { board, warnings } = validateOpenBoardFile(json, filename);
  return {
    boards: [board],
    imageBlobs: new Map(),
    warnings,
  };
}

export async function parseOpenBoardZip(buffer: ArrayBuffer): Promise<ParsedOpenBoardPackage> {
  const zip = await JSZip.loadAsync(buffer);
  const manifestEntry = zip.file('manifest.json');
  if (!manifestEntry) {
    throw new OpenBoardFormatError('.obz package is missing manifest.json.');
  }

  let manifestJson: unknown;
  try {
    manifestJson = JSON.parse(await manifestEntry.async('text'));
  } catch {
    throw new OpenBoardFormatError('manifest.json must contain valid JSON.');
  }

  const manifest = validateOpenBoardManifest(manifestJson);
  if (!zip.file(manifest.root)) {
    throw new OpenBoardFormatError('manifest.root does not reference a file in the package.');
  }

  const warnings: string[] = [];
  const imageBlobs = new Map<string, Blob>();
  const boards = [];

  for (const [boardId, path] of Object.entries(manifest.paths.boards)) {
    const boardEntry = zip.file(path);
    if (!boardEntry) {
      throw new OpenBoardFormatError(`Board path ${path} is missing from the package.`);
    }

    let boardJson: unknown;
    try {
      boardJson = JSON.parse(await boardEntry.async('text'));
    } catch {
      throw new OpenBoardFormatError(`${path} must contain valid JSON.`);
    }

    const { board, warnings: boardWarnings } = validateOpenBoardFile(boardJson, path);
    if (board.id !== boardId) {
      throw new OpenBoardFormatError(`Board at ${path} has id ${board.id}, but manifest lists it as ${boardId}.`);
    }

    boards.push(board);
    warnings.push(...boardWarnings.map((warning) => `${board.name || board.id}: ${warning}`));
  }

  const imagePaths = manifest.paths.images ?? {};
  for (const [imageId, imagePath] of Object.entries(imagePaths)) {
    const imageEntry = zip.file(imagePath);
    if (!imageEntry) {
      warnings.push(`Image path ${imagePath} is missing from the package.`);
      continue;
    }

    const blob = await imageEntry.async('blob');
    imageBlobs.set(imageId, blob);
  }

  return {
    boards,
    manifest,
    imageBlobs,
    warnings,
  };
}

export function dataUriToBlob(dataUri: string): Blob {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new OpenBoardFormatError('Image data URI is malformed.');
  }

  const contentType = match[1];
  const base64 = match[2];
  const binary = typeof atob === 'function'
    ? atob(base64)
    : Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: contentType });
}
