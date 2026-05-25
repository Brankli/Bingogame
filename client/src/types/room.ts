import type { User } from './user';
import type { Match } from './match';

export interface RoomPrize {
  id?: number;
  onePrice?: number;
  oneBalls?: number;
  superPrice?: number;
  superBalls?: number;
  bronzePrice?: number;
  bronzeBalls?: number;
}

export interface RoomManager {
  id?: number;
  user?: User;
}

export type RoomCardMode = 'static' | 'automatic';

export interface Room {
  id: number;
  name: string;
  cardMode?: RoomCardMode;
  owner?: User;
  ticketPrice?: number;
  managers?: RoomManager[];
  roomPrize?: RoomPrize;
  currentMatch?: Match | null;
  matches?: Match[];
  currentUsers?: User[];
}
