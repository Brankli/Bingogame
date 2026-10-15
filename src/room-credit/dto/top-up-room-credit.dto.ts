import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class TopUpRoomCreditDto {
  @IsInt()
  @Min(1)
  @Max(1000000)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
