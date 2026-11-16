import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EarningsTransaction } from './entities/earnings-transaction.entity';
import { UserCreditTransaction } from './entities/user-credit-transaction.entity';
import { AdminBootstrapService } from './admin-bootstrap.service';
import { SyncOutbox } from '../sync/entities/sync-outbox.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      EarningsTransaction,
      UserCreditTransaction,
      SyncOutbox,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, AdminBootstrapService],
  exports: [UserService],
})
export class UserModule {}
