import { CacheModule, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RoomModule } from './room/room.module';
import { Room } from './room/entities/room.entity';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { SocketsModule } from './sockets/sockets.module';
import { BullModule } from '@nestjs/bull';
import { MatchModule } from './match/match.module';
import { Match } from './match/entities/match.entity';
import { MatchNumber } from './match/entities/match-number.entity';
import * as redisStore from 'cache-manager-redis-store';
import type { ClientOpts } from 'redis';
import { RoomPrize } from './room/entities/room-prize.entity';
import { CardModule } from './card/card.module';
import { Card } from './card/entities/card.entity';
import { RoomManager } from './room/entities/room-manager.entity';

const isElectron = process.env.ELECTRON_MODE === 'true' || process.versions.hasOwnProperty('electron');

// Determine the correct path for serving static files
const getStaticFilesPath = () => {
  if (isElectron) {
    // In Electron, client files are in app.asar.unpacked/client/dist
    const path = require('path');
    const resourcesPath = (process as any).resourcesPath || path.join(__dirname, '..', '..');
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
    // Use SQLite for Electron, MySQL for server
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        if (isElectron) {
          // Use user's home directory for database in Electron
          const os = require('os');
          const dbPath = require('path').join(os.homedir(), '.bingo', 'bingo.db');
          
          // Ensure directory exists
          const fs = require('fs');
          const dbDir = require('path').dirname(dbPath);
          if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
          }
          
          return {
            type: 'better-sqlite3',
            database: dbPath,
            entities: [Room, RoomPrize, RoomManager, User, Match, MatchNumber, Card],
            synchronize: true,
          };
        }
        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          username: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASS'),
          database: configService.get<string>('DB_NAME'),
          entities: [Room, RoomPrize, RoomManager, User, Match, MatchNumber, Card],
          synchronize: true,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [ConfigService],
    }),
    // Only use Bull/Redis in server mode
    ...(isElectron ? [] : [
      BullModule.forRoot({
        redis: {
          host: 'localhost',
          port: 6379,
        },
      }),
      CacheModule.register<ClientOpts>({
        isGlobal: true,
        store: redisStore,
        host: 'localhost',
        port: 6379,
      }),
    ]),
    // Use in-memory cache for Electron
    ...(isElectron ? [
      CacheModule.register({
        isGlobal: true,
        ttl: 300,
        max: 100,
      }),
    ] : []),
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
