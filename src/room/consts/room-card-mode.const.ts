export enum RoomCardMode {
  STATIC = 'static',
  AUTOMATIC = 'automatic',
}

export const ROOM_CARD_MODES = [
  RoomCardMode.STATIC,
  RoomCardMode.AUTOMATIC,
] as const;
