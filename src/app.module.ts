import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RoomModule } from './room/room.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { SocketsModule } from './sockets/sockets.module';
import { MatchModule } from './match/match.module';
import * as redisStore from 'cache-manager-redis-store';
import type { ClientOpts } from 'redis';
import { CardModule } from './card/card.module';
import { buildTypeOrmConfig } from './config/database.config';

const isElectron =
  process.env.ELECTRON_MODE === 'true' ||
  process.versions.hasOwnProperty('electron');

// Determine the correct path for serving static files
const getStaticFilesPath = () => {
  if (isElectron) {
    // In Electron, client files are in app.asar.unpacked/client/dist
    const path = require('path');
    const resourcesPath =
      (process as any).resourcesPath || path.join(__dirname, '..', '..');
    return path.join(resourcesPath, 'app.asar.unpacked', 'client', 'dist');
  }
  // In server mode, use relative path
  return join(__dirname, '..', 'client/dist');
};

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: getStaticFilesPath(),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        buildTypeOrmConfig(configService, isElectron),
      inject: [ConfigService],
    }),
    // Redis cache in server mode (Socket.IO adapter uses Redis separately)
    ...(isElectron
      ? []
      : [
          CacheModule.register<ClientOpts>({
            isGlobal: true,
            store: redisStore,
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379,
          }),
        ]),
    // Use in-memory cache for Electron
    ...(isElectron
      ? [
          CacheModule.register({
            isGlobal: true,
            ttl: 300,
            max: 100,
          }),
        ]
      : []),
    RoomModule,
    AuthModule,
    UserModule,
    SocketsModule,
    MatchModule,
    CardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
