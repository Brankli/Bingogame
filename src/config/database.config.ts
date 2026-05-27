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
  const synchronize = process.env.NODE_ENV !== 'production';

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

  // Production (Render)
  if (process.env.NODE_ENV === 'production') {
    return {
      type: 'postgres',
      url: configService.get<string>('DATABASE_URL'),
      entities: ENTITIES,
      synchronize: false,
      ssl: {
        rejectUnauthorized: false,
      },
    };
  }

  // Local development
  return {
    type: 'mysql',
    host: configService.get<string>('DB_HOST'),
    port: Number(configService.get('DB_PORT')),
    username: configService.get<string>('DB_USER'),
    password: configService.get<string>('DB_PASS'),
    database: configService.get<string>('DB_NAME'),
    entities: ENTITIES,
    synchronize,
  };
}
