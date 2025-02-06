export const CHUNK_SIZE = 50; // Number of hexes per chunk along one axis

export interface ChunkCoord {
  x: number;
  y: number;
}

/**
 * Converts tile coordinates to their corresponding chunk coordinates.
 * @param col - The column of the tile.
 * @param row - The row of the tile.
 * @returns The chunk coordinates.
 */
export const getChunkCoord = (col: number, row: number): ChunkCoord => {
  return {
    x: Math.floor(col / CHUNK_SIZE),
    y: Math.floor(row / CHUNK_SIZE),
  };
};

/**
 * Generates a unique key for a chunk based on its coordinates.
 * @param chunk - The chunk coordinates.
 * @returns A string key representing the chunk.
 */
export const getRegionKey = (chunk: ChunkCoord): string => {
  return `${chunk.x},${chunk.y}`;
};
