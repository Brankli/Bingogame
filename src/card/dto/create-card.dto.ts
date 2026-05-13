import { IsOptional, IsNumber } from 'class-validator';

export class CreateCardDto {
  @IsOptional()
  @IsNumber()
  roomId?: number;

  @IsOptional()
  @IsNumber()
  quantity?: number;
}
