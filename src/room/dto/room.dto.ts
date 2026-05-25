import { Room } from '../entities/room.entity';
import { mapToMatchDto, MatchDto } from '../../match/dto/match.dto';
import { mapToRoomPrizeDto, RoomPrizeDto } from './room-prize.dto';
import { mapToUserDto, UserDto } from '../../user/dto/user.dto';
import { RoomManager } from '../entities/room-manager.entity';
import { RoomCardMode } from '../consts/room-card-mode.const';

export class RoomManagerDto {
  id: number;
  user?: UserDto;
  assignedAt: Date;
}

export class RoomDto {
  id: number;
  name: string;
  cardMode: RoomCardMode;
  createdAt: Date;
  ticketPrice: number;
  currentMatch: MatchDto;
  roomPrize: RoomPrizeDto;
  currentUsers: UserDto[];
  owner: UserDto;
  managers: RoomManagerDto[];

  matches: MatchDto[];
}

function mapToRoomManagerDto(manager: RoomManager): RoomManagerDto {
  return {
    id: manager.id,
    user: manager.user ? mapToUserDto(manager.user) : undefined,
    assignedAt: manager.assignedAt,
  };
}

export function mapToRoomDto(room: Room): RoomDto {
  return {
    id: room.id,
    name: room.name,
    cardMode: room.cardMode || RoomCardMode.AUTOMATIC,
    createdAt: room.createdAt,
    ticketPrice: room.ticketPrice,
    currentMatch: room.currentMatch ? mapToMatchDto(room.currentMatch) : null,
    roomPrize: mapToRoomPrizeDto(room.roomPrize),
    currentUsers: room.currentUsers?.map(mapToUserDto) || [],
    owner: room.owner ? mapToUserDto(room.owner) : undefined,
    managers: room.managers?.map(mapToRoomManagerDto) || [],
    matches: room.matches ? room.matches.map(mapToMatchDto) : undefined,
  };
}
