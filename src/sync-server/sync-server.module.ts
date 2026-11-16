import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncDevice } from './entities/sync-device.entity';
import { SyncUser } from './entities/sync-user.entity';
import { SyncLog } from './entities/sync-log.entity';
import { SyncDeviceUser } from './entities/sync-device-user.entity';
import { SyncServerController } from './sync-server.controller';
import { SyncServerGuard } from './sync-server.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([SyncDevice, SyncUser, SyncLog, SyncDeviceUser]),
  ],
  controllers: [SyncServerController],
  providers: [SyncServerGuard],
})
export class SyncServerModule {}
