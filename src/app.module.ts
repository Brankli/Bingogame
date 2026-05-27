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

const getStaticFilesPath = () => {
  if (isElectron) {
    const path = require('path');
    const resourcesPath =
      (process as any).resourcesPath || path.join(__dirname, '..', '..');

    return path.join(
      resourcesPath,
      'app.asar.unpacked',
      'client',
      'dist',
    );
  }

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

    // Cache configuration
    ...(isElectron
      ? []
      : process.env.REDIS_HOST
        ? [
            CacheModule.register<ClientOpts>({
              isGlobal: true,
              store: redisStore,
              host: process.env.REDIS_HOST,
              port: Number(process.env.REDIS_PORT),
            }),
          ]
        : [
            CacheModule.register({
              isGlobal: true,
              ttl: 300,
              max: 100,
            }),
          ]),

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
