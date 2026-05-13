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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client/dist'),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [Room, RoomPrize, RoomManager, User, Match, MatchNumber, Card],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
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
