import { IsString, IsArray } from 'class-validator';

export class VerifyCardDto {
  @IsString()
  cardNumber!: string;

  @IsArray()
  calledNumbers!: number[];

  @IsString()
  pattern!: string; // 'horizontal', 'vertical', 'diagonal', 'corners', 'fullhouse', 'x', 't', 'l', etc.
}
