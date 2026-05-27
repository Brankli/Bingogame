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
      type: 'sqljs',
      location: dbPath,
      autoSave: true,
      entities: ENTITIES,
      synchronize,
    };
  }

  /**
   * =========================
   * PRODUCTION (RENDER)
   * =========================
   */
  if (isProduction) {
    const dbUrl = configService.get<string>('DATABASE_URL');

    if (!dbUrl) {
      throw new Error('❌ DATABASE_URL is missing in production environment');
    }

    return {
      type: 'postgres',
      url: dbUrl,
      entities: ENTITIES,
      synchronize: false,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }

  /**
   * =========================
   * LOCAL DEVELOPMENT (MYSQL)
   * =========================
   */
  const host = configService.get<string>('DB_HOST');
  const port = Number(configService.get<string>('DB_PORT'));
  const username = configService.get<string>('DB_USER');
  const password = configService.get<string>('DB_PASS');
  const database = configService.get<string>('DB_NAME');

  if (!host || !port || !username || !password || !database) {
    throw new Error('❌ MySQL configuration is incomplete in .env');
  }

  return {
    type: 'mysql',
    host,
    port,
    username,
    password,
    database,
    entities: ENTITIES,
    synchronize,
  };
}
