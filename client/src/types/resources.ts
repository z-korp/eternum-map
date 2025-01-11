export type ResourceType = {
  id: number;
  name: string;
  imagePath: string;
};

export const RESOURCES = {
  // Basic Resources
  STONE: { id: 1, name: 'Stone', imagePath: '/assets/rcs/1.png' },
  COAL: { id: 2, name: 'Coal', imagePath: '/assets/rcs/2.png' },
  WOOD: { id: 3, name: 'Wood', imagePath: '/assets/rcs/3.png' },
  COPPER: { id: 4, name: 'Copper', imagePath: '/assets/rcs/4.png' },
  IRONWOOD: { id: 5, name: 'Ironwood', imagePath: '/assets/rcs/5.png' },
  OBSIDIAN: { id: 6, name: 'Obsidian', imagePath: '/assets/rcs/6.png' },
  GOLD: { id: 7, name: 'Gold', imagePath: '/assets/rcs/7.png' },
  SILVER: { id: 8, name: 'Silver', imagePath: '/assets/rcs/8.png' },
  MITHRAL: { id: 9, name: 'Mithral', imagePath: '/assets/rcs/9.png' },
  ALCHEMICAL_SILVER: {
    id: 10,
    name: 'Alchemical Silver',
    imagePath: '/assets/rcs/10.png',
  },
  COLD_IRON: { id: 11, name: 'Cold Iron', imagePath: '/assets/rcs/11.png' },
  DEEP_CRYSTAL: {
    id: 12,
    name: 'Deep Crystal',
    imagePath: '/assets/rcs/12.png',
  },
  RUBY: { id: 13, name: 'Ruby', imagePath: '/assets/rcs/13.png' },
  DIAMONDS: { id: 14, name: 'Diamonds', imagePath: '/assets/rcs/14.png' },
  HARTWOOD: { id: 15, name: 'Hartwood', imagePath: '/assets/rcs/15.png' },
  IGNIUM: { id: 16, name: 'Ignium', imagePath: '/assets/rcs/16.png' },
  TWILIGHT_QUARTZ: {
    id: 17,
    name: 'Twilight Quartz',
    imagePath: '/assets/rcs/17.png',
  },
  TRUE_ICE: { id: 18, name: 'True Ice', imagePath: '/assets/rcs/18.png' },
  ADAMANTINE: { id: 19, name: 'Adamantine', imagePath: '/assets/rcs/19.png' },
  SAPPHIRE: { id: 20, name: 'Sapphire', imagePath: '/assets/rcs/20.png' },
  ETHEREAL_SILICA: {
    id: 21,
    name: 'Ethereal Silica',
    imagePath: '/assets/rcs/21.png',
  },
  DRAGONHIDE: { id: 22, name: 'Dragonhide', imagePath: '/assets/rcs/22.png' },

  // Special Resources
  DEMONHIDE: { id: 28, name: 'Demonhide', imagePath: '/assets/rcs/28.png' },
  EARTHEN_SHARD: {
    id: 29,
    name: 'Earthen Shard',
    imagePath: '/assets/rcs/29.png',
  },

  // Transport
  DONKEY: { id: 249, name: 'Donkey', imagePath: '/assets/rcs/249.png' },

  // Troops
  KNIGHT: { id: 250, name: 'Knight', imagePath: '/assets/rcs/250.png' },
  CROSSBOWMAN: {
    id: 251,
    name: 'Crossbowman',
    imagePath: '/assets/rcs/251.png',
  },
  PALADIN: { id: 252, name: 'Paladin', imagePath: '/assets/rcs/252.png' },

  // Other
  LORDS: { id: 253, name: 'Lords', imagePath: '/assets/rcs/253.png' },
  WHEAT: { id: 254, name: 'Wheat', imagePath: '/assets/rcs/254.png' },
  FISH: { id: 255, name: 'Fish', imagePath: '/assets/rcs/255.png' },
} as const;

export const getResourceById = (id: number): ResourceType | undefined => {
  return Object.values(RESOURCES).find((resource) => resource.id === id);
};
