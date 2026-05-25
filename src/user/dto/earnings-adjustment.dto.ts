import { IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';

export enum AdjustmentType {
  ADD = 'add',
  SUBTRACT = 'subtract',
  PAYOUT = 'payout',
  RESET = 'reset',
}

export class EarningsAdjustmentDto {
  @IsNumber()
  userId!: number;

  @IsNumber()
  amount!: number;

  @IsEnum(AdjustmentType)
  type!: AdjustmentType;

  @IsString()
  @IsOptional()
  reason?: string;
}
