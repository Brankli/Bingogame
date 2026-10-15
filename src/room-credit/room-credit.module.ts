import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RoomCredit } from './entities/room-credit.entity';
import { RoomCreditTransaction } from './entities/room-credit-transaction.entity';
import { RoomCreditService } from './room-credit.service';
import { RoomCreditController } from './room-credit.controller';

import { AuthModule } from '../auth/auth.module';
import { SocketsModule } from '../sockets/sockets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RoomCredit,
      RoomCreditTransaction,
    ]),
    AuthModule,
    forwardRef(() => SocketsModule),
  ],
  controllers: [RoomCreditController],
  providers: [RoomCreditService],
  exports: [RoomCreditService, TypeOrmModule],
})
export class RoomCreditModule {}
