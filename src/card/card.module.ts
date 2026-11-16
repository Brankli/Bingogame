import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { Card } from './entities/card.entity';
import { AuthModule } from '../auth/auth.module';
import { RoomManager } from '../room/entities/room-manager.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Card, RoomManager]), AuthModule],
  controllers: [CardController],
  providers: [CardService],
  exports: [CardService],
})
export class CardModule {}
