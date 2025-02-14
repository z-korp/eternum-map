export type BiomeType =
  | 'DeepOcean'
  | 'Ocean'
  | 'Beach'
  | 'Scorched'
  | 'Bare'
  | 'Tundra'
  | 'Snow'
  | 'TemperateDesert'
  | 'Shrubland'
  | 'Taiga'
  | 'Grassland'
  | 'TemperateDeciduousForest'
  | 'TemperateRainForest'
  | 'SubtropicalDesert'
  | 'TropicalSeasonalForest'
  | 'TropicalRainForest';

export const BIOME_COLORS: Record<BiomeType, string> = {
  DeepOcean: '#4a6b63',
  Ocean: '#657d71',
  Beach: '#d7b485',
  Scorched: '#393131',
  Bare: '#d1ae7f',
  Tundra: '#cfd4d4',
  Snow: '#cfd4d4',
  TemperateDesert: '#ad6c44',
  Shrubland: '#c1aa7f',
  Taiga: '#292d23',
  Grassland: '#6f7338',
  TemperateDeciduousForest: '#6f7338',
  TemperateRainForest: '#6f573e',
  SubtropicalDesert: '#926338',
  TropicalSeasonalForest: '#897049',
  TropicalRainForest: '#8a714a',
};

const LEVEL = {
  DEEP_OCEAN: 0.25,
  OCEAN: 0.5,
  SAND: 0.53,
  FOREST: 0.6,
  DESERT: 0.72,
  MOUNTAIN: 0.8,
};
