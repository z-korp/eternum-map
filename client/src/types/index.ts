import { ID, StructureType } from '@bibliothecadao/eternum';
import { Position } from './Position';
export type HexPosition = { col: number; row: number };

export interface Realm {
  id: string;
  realmId: string;
  realmName: string;
  resources: number[];
  hasWonder: boolean;
  coordinates: { x: number; y: number };
  position: { q: number; r: number } | null;
}

export enum SceneName {
  WorldMap = 'map',
  Hexception = 'hex',
}
export interface Health {
  current: bigint;
  lifetime: bigint;
}

export enum ResourceMiningTypes {
  Forge = 'forge',
  Mine = 'mine',
  LumberMill = 'lumber_mill',
  Dragonhide = 'dragonhide',
}

export enum HyperstructureTypesNames {
  STAGE_1 = 'hyperstructure_stage0',
  STAGE_2 = 'hyperstructure_stage1',
  STAGE_3 = 'hyperstructure_stage2',
}

export interface StructureInfo {
  entityId: ID;
  hexCoords: { col: number; row: number };
  stage: number;
  level: number;
  isMine: boolean;
  owner: { address: bigint };
  structureType: StructureType;
  hasWonder: boolean;
}

export interface ArmyData {
  entityId: ID;
  matrixIndex: number;
  hexCoords: Position;
  isMine: boolean;
  owner: { address: bigint; ownerName: string; guildName: string };
  order: string;
  color: string;
}

export interface MovingArmyData {
  startPos: number; //THREE.Vector3;
  endPos: number; //THREE.Vector3;
  progress: number;
  matrixIndex: number;
  currentPathIndex: number;
}

export interface MovingLabelData {
  startPos: number; //THREE.Vector3;
  endPos: number; //THREE.Vector3;
  progress: number;
}

export interface RenderChunkSize {
  width: number;
  height: number;
}
