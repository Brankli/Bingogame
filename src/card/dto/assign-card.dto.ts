import { IsNumber, IsString } from 'class-validator';

export class AssignCardDto {
  @IsString()
  cardNumber!: string;

  @IsNumber()
  userId!: number;

  @IsNumber()
  roomId!: number;
}
