import { IsNumber } from 'class-validator';

export class AssignManagerDto {
  @IsNumber()
  userId!: number;

  @IsNumber()
  roomId!: number;
}
