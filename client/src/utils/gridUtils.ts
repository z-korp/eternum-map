import * as PIXI from 'pixi.js';
import { ChunkCoord, getChunkCoord, getRegionKey, CHUNK_SIZE } from './chunk';

/**
 * Calculate visible chunks in the current viewport
 */
export function calculateVisibleChunks(
  app: PIXI.Application,
  hexContainer: PIXI.Container,
  HEX_SIZE: number
): ChunkCoord[] {
  if (!app || !hexContainer) return [];

  const topLeft = hexContainer.toLocal({ x: 0, y: 0 });
  const bottomRight = hexContainer.toLocal({
    x: app.screen.width,
    y: app.screen.height,
  });

  const bufferChunks = 2; // Number of chunks to preload around the viewport

  // Approximate hex to pixel calculations for chunk determination
  const approxHexWidth = HEX_SIZE * 1.5; // Width of a hex in pixels
  const approxHexHeight = HEX_SIZE * Math.sqrt(3); // Height of a hex in pixels

  // Calculate the range of columns and rows visible
  const minCol =
    Math.floor(topLeft.x / (CHUNK_SIZE * approxHexWidth)) - bufferChunks;
  const maxCol =
    Math.floor(bottomRight.x / (CHUNK_SIZE * approxHexWidth)) + bufferChunks;
  const minRow =
    Math.floor(topLeft.y / (CHUNK_SIZE * approxHexHeight)) - bufferChunks;
  const maxRow =
    Math.floor(bottomRight.y / (CHUNK_SIZE * approxHexHeight)) + bufferChunks;

  const chunks = new Set<string>();
  for (let col = minCol; col <= maxCol; col++) {
    for (let row = minRow; row <= maxRow; row++) {
      const chunk = getChunkCoord(col, row);
      const key = getRegionKey(chunk);
      chunks.add(key);
    }
  }

  return Array.from(chunks).map((key) => {
    const [x, y] = key.split(',').map(Number);
    return { x, y };
  });
}

/**
 * Check if a tile is within the visible chunks
 */
export function isTileWithinChunks(
  col: number,
  row: number,
  chunks: ChunkCoord[]
): boolean {
  return chunks.some((chunk) => {
    return (
      col >= chunk.x * CHUNK_SIZE &&
      col < (chunk.x + 1) * CHUNK_SIZE &&
      row >= chunk.y * CHUNK_SIZE &&
      row < (chunk.y + 1) * CHUNK_SIZE
    );
  });
}
