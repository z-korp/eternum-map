import { create } from 'zustand';

export interface Tile {
  col: number;
  row: number;
}

// Define the shape of our global tiles state.
interface TilesState {
  tiles: Tile[];
  setTiles: (tiles: Tile[]) => void;
  addOrUpdateTile: (tile: Tile) => void;
  clearTiles: () => void;
}

// Create the Zustand store.
export const useTilesStore = create<TilesState>((set) => ({
  tiles: [],

  // Replace the entire tile array.
  setTiles: (tiles) => set({ tiles }),

  // Add a new tile or update an existing one.
  addOrUpdateTile: (tile) =>
    set((state) => {
      const index = state.tiles.findIndex(
        (t) => t.col === tile.col && t.row === tile.row
      );
      if (index === -1) {
        return { tiles: [...state.tiles, tile] };
      } else {
        const updatedTiles = [...state.tiles];
        updatedTiles[index] = tile;
        return { tiles: updatedTiles };
      }
    }),

  // Clear all stored tiles.
  clearTiles: () => set({ tiles: [] }),
}));
