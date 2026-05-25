import { forwardRef, Module } from '@nestjs/common';
import { MatchService } from './match.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { MatchNumber } from './entities/match-number.entity';
import { RoomModule } from '../room/room.module';
import { SocketsModule } from '../sockets/sockets.module';
import { CardModule } from '../card/card.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, MatchNumber]),
    forwardRef(() => RoomModule),
    SocketsModule,
    forwardRef(() => CardModule),
  ],
  providers: [MatchService],
  exports: [MatchService],
})
export class MatchModule {}
