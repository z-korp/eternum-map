import { create } from 'zustand';

export interface FiltersState {
  resources: number[];
  alliance: string | null;
  player: string | null;
  showTiles: boolean;

  setResourceFilters: (resources: number[]) => void;
  setAllianceFilter: (alliance: string | null) => void;
  setPlayerFilter: (player: string | null) => void;
  setShowTiles: (show: boolean) => void;
  clearFilters: () => void;
  applyCurrentFilters: () => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
  resources: [],
  alliance: null,
  player: null,
  showTiles: true,

  setResourceFilters: (resources) => {
    set({ resources });
  },

  setAllianceFilter: (alliance) => {
    set({ alliance });
  },

  setPlayerFilter: (player) => {
    set({ player });
  },

  setShowTiles: (showTiles) => {
    set({ showTiles });
  },

  clearFilters: () => {
    set({
      resources: [],
      alliance: null,
      player: null,
    });
  },

  applyCurrentFilters: () => {
    // This function doesn't need to do anything specific
    // It's just a trigger for components to re-apply filters
    // The actual filtering happens in the components that use the filter state
  },
}));
