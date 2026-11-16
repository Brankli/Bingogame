import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { User } from '../user/entities/user.entity';
import { SyncState } from './entities/sync-state.entity';
import { SyncOutbox } from './entities/sync-outbox.entity';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, SyncState, SyncOutbox]),
    AuthModule,
    UserModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
