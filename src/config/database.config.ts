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

const ENTITIES = [
  Room,
  RoomPrize,
  RoomManager,
  User,
  Match,
  MatchNumber,
  Card,
  EarningsTransaction,
];

export function buildTypeOrmConfig(
  configService: ConfigService,
  isElectron: boolean,
): TypeOrmModuleOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  const synchronize = !isProduction;

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
      synchronize: true,

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
    ...(dbType === 'mysql' && {
      driver: require('mysql2'),
    }),
  };
}
