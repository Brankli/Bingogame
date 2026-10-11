import { IsIn, IsInt } from 'class-validator';

export class CardDisplayLimitDto {
  @IsInt()
  @IsIn([100, 150, 200, 250, 300, 350, 400])
  cardDisplayLimit: number;
}
