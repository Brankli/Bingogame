import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { RoomCardMode, ROOM_CARD_MODES } from '../consts/room-card-mode.const';

export class CreateRoomDto {
  @IsString()
  @Length(1, 20)
  name: string;

  @IsOptional()
  @IsIn(ROOM_CARD_MODES)
  cardMode?: RoomCardMode;
}
