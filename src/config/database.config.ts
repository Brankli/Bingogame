import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

import { Room } from '../room/entities/room.entity';
import { RoomPrize } from '../room/entities/room-prize.entity';
import { RoomManager } from '../room/entities/room-manager.entity';
import { User } from '../user/entities/user.entity';
import { Match } from '../match/entities/match.entity';
import { MatchNumber } from '../match/entities/match-number.entity';
import { Card } from '../card/entities/card.entity';
import { EarningsTransaction } from '../user/entities/earnings-transaction.entity';
import { UserCreditTransaction } from '../user/entities/user-credit-transaction.entity';
import { RoomCredit } from '../room-credit/entities/room-credit.entity';
import { RoomCreditTransaction } from '../room-credit/entities/room-credit-transaction.entity';
import { SyncState } from '../sync/entities/sync-state.entity';
import { SyncOutbox } from '../sync/entities/sync-outbox.entity';

const ENTITIES = [
  Room,
  RoomPrize,
  RoomManager,
  User,
  Match,
  MatchNumber,
  Card,
  EarningsTransaction,
  UserCreditTransaction,
  RoomCredit,
  RoomCreditTransaction,
  SyncState,
  SyncOutbox,
];

export function buildTypeOrmConfig(
  configService: ConfigService,
  isElectron: boolean,
): TypeOrmModuleOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const synchronize = !isProduction;
  const localMigrations = [
    __dirname + '/../database/migrations/*.js',
    __dirname + '/../database/migrations/*.ts',
  ];

  if (process.env.SYNC_SERVER_MODE === 'true') {
    return {
      type: 'mysql',
      host: configService.getOrThrow<string>('SYNC_DB_HOST'),
      port: Number(configService.get<string>('SYNC_DB_PORT', '3306')),
      username: configService.getOrThrow<string>('SYNC_DB_USER'),
      password: configService.get<string>('SYNC_DB_PASS', ''),
      database: configService.getOrThrow<string>('SYNC_DB_NAME'),
      entities: [
        require('../sync-server/entities/sync-user.entity').SyncUser,
        require('../sync-server/entities/sync-device.entity').SyncDevice,
        require('../sync-server/entities/sync-log.entity').SyncLog,
        require('../sync-server/entities/sync-device-user.entity')
          .SyncDeviceUser,
      ],
      synchronize: false,
      migrations: [
        __dirname + '/../sync-server/migrations/*.js',
        __dirname + '/../sync-server/migrations/*.ts',
      ],
      migrationsRun: true,
    };
  }

  /**
   * =========================
   * ELECTRON (LOCAL DESKTOP)
   * =========================
   */
  if (isElectron) {
    const os = require('os');
    const path = require('path');
    const fs = require('fs');

    const dbPath = path.join(os.homedir(), '.bingo', 'bingo.db');
    const dbDir = path.dirname(dbPath);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    return {
      type: 'better-sqlite3',
      database: dbPath,
      entities: ENTITIES,
      synchronize,
      migrations: localMigrations,
      migrationsRun: true,
    };
  }

  /** Production PostgreSQL configuration. */
  // if (isProduction) {
  //   const dbUrl = configService.get<string>('DATABASE_URL');

  //   if (!dbUrl) {
  //     throw new Error('❌ DATABASE_URL is missing in production environment');
  //   }

  //   return {
  //     type: 'postgres',
  //     url: dbUrl,
  //     entities: ENTITIES,
  //     synchronize: false,
  //     ssl: {
  //       rejectUnauthorized: false,
  //     },
  //   };
  // }
  if (process.env.NODE_ENV === 'production') {
    return {
      type: 'postgres',
      url: configService.get<string>('DATABASE_URL'),
      entities: ENTITIES,

      // IMPORTANT
      synchronize: false,
      migrations: localMigrations,
      migrationsRun: true,

      ssl: {
        rejectUnauthorized: false,
      },
    };
  }
  /**
   * =========================
   * LOCAL DEVELOPMENT
   * =========================
   */
  const dbType = configService.get<string>('DB_TYPE', 'mysql');

  // SQLite
  if (dbType === 'sqlite') {
    const path = require('path');
    const dbPath = path.join(process.cwd(), 'bingo.db');

    return {
      type: 'better-sqlite3',
      database: dbPath,
      entities: ENTITIES,
      synchronize,
      migrations: localMigrations,
      migrationsRun: true,
    };
  }

  // MySQL or PostgreSQL
  const host = configService.get<string>('DB_HOST');
  const port = Number(configService.get<string>('DB_PORT'));
  const username = configService.get<string>('DB_USER');
  const password = configService.get<string>('DB_PASS', ''); // Default to empty string
  const database = configService.get<string>('DB_NAME');

  if (!host || !port || !username || !database) {
    throw new Error(
      `❌ ${dbType} configuration is incomplete in .env (missing host, port, username, or database name)`,
    );
  }

  return {
    type: dbType as 'mysql' | 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities: ENTITIES,
    synchronize,
    migrations: localMigrations,
    migrationsRun: true,
    ...(dbType === 'mysql' && {
      driver: require('mysql2'),
    }),
  };
}
