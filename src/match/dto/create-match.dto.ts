import { IsNumber, IsArray, IsOptional, IsString } from 'class-validator';

export class CreateMatchDto {
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 0 })
  soldCards: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  registeredCards?: string[];
}
