import { IsString, IsNumber } from 'class-validator';

export class LockCardDto {
  @IsString()
  cardNumber!: string;

  @IsNumber()
  matchId!: number;
}
