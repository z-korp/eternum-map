import { type ClientComponents } from '@/dojo/createClientComponents';
import { ClientConfigManager } from '@/dojo/modelManager/ConfigManager';
import { type HexPosition, ResourceMiningTypes } from '@/types';
import {
  BuildingType,
  ContractAddress,
  EternumGlobalConfig,
  type ID,
  type Position,
  type Resource,
  ResourceCost,
  ResourcesIds,
  TickIds,
} from '@bibliothecadao/eternum';
import { type ComponentValue } from '@dojoengine/recs';
import { getEntityIdFromKeys } from '@dojoengine/utils';
export const HEX_SIZE = 1;

export { getEntityIdFromKeys };

export const toInteger = (value: number): number => Math.floor(value);

export const toHexString = (num: bigint) => {
  return `0x${num.toString(16)}`;
};

export const formatStringNumber = (str: string): string => {
  return Number(str).toLocaleString();
};

export const formatNumber = (num: number, decimals: number): string => {
  // Convert to string with max decimals
  let str = num.toFixed(decimals);

  // Remove trailing zeros after decimal point
  if (str.includes('.')) {
    str = str.replace(/\.?0+$/, '');
  }

  return str;
};

export const currencyFormat = (num: number, decimals: number): string => {
  const formattedDecimals = formatNumber(divideByPrecision(num), decimals);
  return Number(formattedDecimals).toLocaleString();
};

export function currencyIntlFormat(num: number, decimals: number = 2): string {
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: decimals,
  }).format(num || 0);
}

export function displayAddress(string: string) {
  if (string === undefined) return 'unknown';
  return string.substring(0, 6) + '...' + string.substring(string.length - 4);
}

export function multiplyByPrecision(value: number): number {
  return Math.floor(value * EternumGlobalConfig.resources.resourcePrecision);
}

export function divideByPrecision(value: number): number {
  return value / EternumGlobalConfig.resources.resourcePrecision;
}

export function divideByPrecisionFormatted(value: number): string {
  return divideByPrecision(value).toLocaleString('en-US');
}

export function roundDownToPrecision(value: bigint, precision: number) {
  return BigInt(Number(value) - (Number(value) % Number(precision)));
}

export function roundUpToPrecision(value: bigint, precision: number) {
  return BigInt(
    Number(value) + (Number(precision) - (Number(value) % Number(precision)))
  );
}

export function addressToNumber(address: string) {
  // Convert the address to a big integer
  let numericValue = ContractAddress(address);

  // Sum the digits of the numeric value
  let sum = 0;
  while (numericValue > 0) {
    sum += Number(numericValue % 5n);
    numericValue /= 5n;
  }

  // Map the sum to a number between 1 and 10
  const result = (sum % 5) + 1;

  // Pad with a 0 if the result is less than 10
  return result < 10 ? `0${result}` : result.toString();
}

export function calculateDistance(
  start: Position,
  destination: Position
): number | undefined {
  // d = √((x2-x1)² + (y2-y1)²)

  if (start && destination) {
    // Calculate the difference in x and y coordinates
    const deltaX = Math.abs(start.x - destination.x);
    const deltaY = Math.abs(start.y - destination.y);

    // Calculate the distance using the Pythagorean theorem
    // Each tile is 1 km, so we don't need to divide by 10000 here
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    return distance;
  }
}

export const getHexForWorldPosition = (worldPosition: {
  x: number;
  y: number;
  z: number;
}): HexPosition => {
  const hexRadius = HEX_SIZE;
  const hexHeight = hexRadius * 2;
  const hexWidth = Math.sqrt(3) * hexRadius;
  const vertDist = hexHeight * 0.75;
  const horizDist = hexWidth;

  const row = Math.round(worldPosition.z / vertDist);
  // hexception offsets hack
  const rowOffset = ((row % 2) * Math.sign(row) * horizDist) / 2;
  const col = Math.round((worldPosition.x + rowOffset) / horizDist);

  return {
    col,
    row,
  };
};

export const calculateDistanceInHexes = (
  start: Position,
  destination: Position
): number | undefined => {
  const distance = calculateDistance(start, destination);
  if (distance) {
    return Math.round(distance / HEX_SIZE / 2);
  }
  return undefined;
};

export const calculateOffset = (
  index: number,
  total: number,
  radius: number
) => {
  if (total === 1) return { x: 0, y: 0 };

  const angleIncrement = (2 * Math.PI) / 6; // Maximum 6 points on the circumference for the first layer
  let angle = angleIncrement * (index % 6);
  let offsetRadius = radius;

  if (index >= 6) {
    // Adjustments for more than 6 armies, placing them in another layer
    offsetRadius += 0.5; // Increase radius for each new layer
    angle += angleIncrement / 2; // Offset angle to interleave with previous layer
  }

  return {
    x: offsetRadius * Math.cos(angle),
    z: offsetRadius * Math.sin(angle),
  };
};

const pseudoRandom = (x: number, y: number) => {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return n - Math.floor(n);
};

export const ResourceIdToMiningType: Partial<
  Record<ResourcesIds, ResourceMiningTypes>
> = {
  [ResourcesIds.Copper]: ResourceMiningTypes.Forge,
  [ResourcesIds.ColdIron]: ResourceMiningTypes.Forge,
  [ResourcesIds.Ignium]: ResourceMiningTypes.Forge,
  [ResourcesIds.Gold]: ResourceMiningTypes.Forge,
  [ResourcesIds.Silver]: ResourceMiningTypes.Forge,
  [ResourcesIds.Diamonds]: ResourceMiningTypes.Mine,
  [ResourcesIds.Sapphire]: ResourceMiningTypes.Mine,
  [ResourcesIds.Ruby]: ResourceMiningTypes.Mine,
  [ResourcesIds.DeepCrystal]: ResourceMiningTypes.Mine,
  [ResourcesIds.TwilightQuartz]: ResourceMiningTypes.Mine,
  [ResourcesIds.EtherealSilica]: ResourceMiningTypes.Mine,
  [ResourcesIds.Stone]: ResourceMiningTypes.Mine,
  [ResourcesIds.Coal]: ResourceMiningTypes.Mine,
  [ResourcesIds.Obsidian]: ResourceMiningTypes.Mine,
  [ResourcesIds.TrueIce]: ResourceMiningTypes.Mine,
  [ResourcesIds.Wood]: ResourceMiningTypes.LumberMill,
  [ResourcesIds.Hartwood]: ResourceMiningTypes.LumberMill,
  [ResourcesIds.Ironwood]: ResourceMiningTypes.LumberMill,
  [ResourcesIds.Mithral]: ResourceMiningTypes.Forge,
  [ResourcesIds.Dragonhide]: ResourceMiningTypes.Dragonhide,
  [ResourcesIds.AlchemicalSilver]: ResourceMiningTypes.Forge,
  [ResourcesIds.Adamantine]: ResourceMiningTypes.Forge,
  [ResourcesIds.AncientFragment]: ResourceMiningTypes.Mine,
};

export enum TimeFormat {
  D = 1,
  H = 2,
  M = 4,
  S = 8,
}

export const formatTime = (
  seconds: number,
  format: TimeFormat = TimeFormat.D |
    TimeFormat.H |
    TimeFormat.M |
    TimeFormat.S,
  abbreviate: boolean = true,
  clock: boolean = false
): string => {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];

  if (days > 0 && format & TimeFormat.D)
    parts.push(`${days}${abbreviate ? 'd' : ' day(s)'}`);

  if (clock) {
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
    parts.push(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
  } else {
    if (hours > 0 && format & TimeFormat.H)
      parts.push(`${hours}${abbreviate ? 'h' : ' hour(s)'}`);
    if (minutes > 0 && format & TimeFormat.M)
      parts.push(`${minutes}${abbreviate ? 'm' : ' minute(s)'}`);
    if (remainingSeconds > 0 && format & TimeFormat.S)
      parts.push(`${remainingSeconds}${abbreviate ? 's' : ' second(s)'}`);
  }

  return parts.join(' ');
};

export const copyPlayerAddressToClipboard = (
  address: ContractAddress,
  name: string
) => {
  navigator.clipboard
    .writeText(address.toString())
    .then(() => {
      alert(`Address of ${name} copied to clipboard`);
    })
    .catch((err) => {
      console.error('Failed to copy: ', err);
    });
};

const isRealmSelected = (structureEntityId: ID, structures: any) => {
  const selectedStructure = structures?.find(
    (structure: any) => structure?.entity_id === structureEntityId
  );
  return selectedStructure?.category === 'Realm';
};

export const getTotalResourceWeight = (
  resources: Array<Resource | undefined>
) => {
  const configManager = ClientConfigManager.instance();

  return resources.reduce(
    (total, resource) =>
      total +
      (resource
        ? resource.amount *
            configManager.getResourceWeight(resource.resourceId) || 0
        : 0),
    0
  );
};

export const isResourceProductionBuilding = (buildingId: BuildingType) => {
  return (
    buildingId === BuildingType.Resource ||
    buildingId === BuildingType.Farm ||
    buildingId === BuildingType.FishingVillage ||
    buildingId === BuildingType.Barracks ||
    buildingId === BuildingType.ArcheryRange ||
    buildingId === BuildingType.Stable
  );
};

export const currentTickCount = (time: number) => {
  const configManager = ClientConfigManager.instance();
  const tickIntervalInSeconds = configManager.getTick(TickIds.Armies) || 1;
  return Number(time / tickIntervalInSeconds);
};

export function gramToKg(grams: number): number {
  return Number(grams) / 1000;
}

export function kgToGram(kg: number): number {
  return Number(kg) * 1000;
}

export const formatResources = (resources: any[]): Resource[] => {
  return resources
    .map((resource) => ({
      resourceId: Number(resource[0].value),
      amount: Number(resource[1].value),
    }))
    .filter((resource) => resource.amount > 0);
};

const accentsToAscii = (str: string) => {
  // Character map for transliteration to ASCII
  const charMap: Record<string, string> = {
    á: 'a',
    ú: 'u',
    é: 'e',
    ä: 'a',
    Š: 'S',
    Ï: 'I',
    š: 's',
    Í: 'I',
    í: 'i',
    ó: 'o',
    ï: 'i',
    ë: 'e',
    ê: 'e',
    â: 'a',
    Ó: 'O',
    ü: 'u',
    Á: 'A',
    Ü: 'U',
    ô: 'o',
    ž: 'z',
    Ê: 'E',
    ö: 'o',
    č: 'c',
    Â: 'A',
    Ä: 'A',
    Ë: 'E',
    É: 'E',
    Č: 'C',
    Ž: 'Z',
    Ö: 'O',
    Ú: 'U',
    Ô: 'O',
    '‘': "'",
  };
  const transliterate = (str: string) => {
    return str
      .split('')
      .map((char) => charMap[char] || char)
      .join('');
  };
  return transliterate(str);
};

export const toValidAscii = (str: string) => {
  const intermediateString = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return accentsToAscii(intermediateString);
};

export const computeTravelFoodCosts = (
  troops:
    | ComponentValue<ClientComponents['Army']['schema']['troops']>
    | undefined
) => {
  const configManager = ClientConfigManager.instance();

  const paladinFoodConsumption = configManager.getTravelFoodCostConfig(
    ResourcesIds.Paladin
  );
  const knightFoodConsumption = configManager.getTravelFoodCostConfig(
    ResourcesIds.Knight
  );
  const crossbowmanFoodConsumption = configManager.getTravelFoodCostConfig(
    ResourcesIds.Crossbowman
  );

  const paladinCount = divideByPrecision(Number(troops?.paladin_count));
  const knightCount = divideByPrecision(Number(troops?.knight_count));
  const crossbowmanCount = divideByPrecision(Number(troops?.crossbowman_count));

  const paladinWheatConsumption =
    paladinFoodConsumption.travelWheatBurnAmount * paladinCount;
  const knightWheatConsumption =
    knightFoodConsumption.travelWheatBurnAmount * knightCount;
  const crossbowmanWheatConsumption =
    crossbowmanFoodConsumption.travelWheatBurnAmount * crossbowmanCount;

  const paladinFishConsumption =
    paladinFoodConsumption.travelFishBurnAmount * paladinCount;
  const knightFishConsumption =
    knightFoodConsumption.travelFishBurnAmount * knightCount;
  const crossbowmanFishConsumption =
    crossbowmanFoodConsumption.travelFishBurnAmount * crossbowmanCount;

  const wheatPayAmount =
    paladinWheatConsumption +
    knightWheatConsumption +
    crossbowmanWheatConsumption;
  const fishPayAmount =
    paladinFishConsumption + knightFishConsumption + crossbowmanFishConsumption;

  return {
    wheatPayAmount,
    fishPayAmount,
  };
};

export const computeExploreFoodCosts = (
  troops:
    | ComponentValue<ClientComponents['Army']['schema']['troops']>
    | undefined
) => {
  const configManager = ClientConfigManager.instance();

  const paladinFoodConsumption = configManager.getTravelFoodCostConfig(
    ResourcesIds.Paladin
  );
  const knightFoodConsumption = configManager.getTravelFoodCostConfig(
    ResourcesIds.Knight
  );
  const crossbowmanFoodConsumption = configManager.getTravelFoodCostConfig(
    ResourcesIds.Crossbowman
  );

  const paladinCount = divideByPrecision(Number(troops?.paladin_count));
  const knightCount = divideByPrecision(Number(troops?.knight_count));
  const crossbowmanCount = divideByPrecision(Number(troops?.crossbowman_count));

  const paladinWheatConsumption =
    paladinFoodConsumption.exploreWheatBurnAmount * paladinCount;
  const knightWheatConsumption =
    knightFoodConsumption.exploreWheatBurnAmount * knightCount;
  const crossbowmanWheatConsumption =
    crossbowmanFoodConsumption.exploreWheatBurnAmount * crossbowmanCount;

  const paladinFishConsumption =
    paladinFoodConsumption.exploreFishBurnAmount * paladinCount;
  const knightFishConsumption =
    knightFoodConsumption.exploreFishBurnAmount * knightCount;
  const crossbowmanFishConsumption =
    crossbowmanFoodConsumption.exploreFishBurnAmount * crossbowmanCount;

  const wheatPayAmount =
    paladinWheatConsumption +
    knightWheatConsumption +
    crossbowmanWheatConsumption;
  const fishPayAmount =
    paladinFishConsumption + knightFishConsumption + crossbowmanFishConsumption;

  return {
    wheatPayAmount,
    fishPayAmount,
  };
};

export const separateCamelCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const getRandomBackgroundImage = () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const imageNumber = (timestamp % 7) + 1;
  const paddedNumber = imageNumber.toString().padStart(2, '0');
  return paddedNumber;
};

export const adjustWonderLordsCost = (cost: ResourceCost[]): ResourceCost[] => {
  return cost.map((item) =>
    item.resource === ResourcesIds.Lords
      ? { ...item, amount: item.amount * 0.1 }
      : item
  );
};
