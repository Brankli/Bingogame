export type RoomCardDeckStatus =
  | 'empty'
  | 'incomplete'
  | 'complete'
  | 'over_limit';

export interface RoomCardGenerationResult {
  status: 'complete' | 'incomplete' | 'already_complete' | 'failed';
  generated: number;
  total: number;
  message: string;
}

export interface RoomCardStatusDto {
  roomId: number;
  total: number;
  available: number;
  assigned: number;
  locked: number;
  deckStatus: RoomCardDeckStatus;
  inUse: boolean;
  canGenerate: boolean;
  canCopy: boolean;
  canReset: boolean;
  missing: number;
}

export interface RoomCardPreviewDto {
  roomId: number;
  index: number;
  cardNumber: string;
  grid: number[][];
}

export interface StaticCardLibraryStatusDto {
  total: number;
  complete: boolean;
  message: string;
}

export interface StaticCardLibraryGenerateResult {
  generated: number;
  total: number;
  complete: boolean;
  message: string;
}
