import {
  CACHE_MANAGER,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Repository } from 'typeorm';
import { Room } from '../room/entities/room.entity';
import { RoomService } from '../room/room.service';
import { Cache } from 'cache-manager';
import { EXTRACTED_NUMBERS_CACHE_PREFIX, MATCH_NUMBER_EXTRACTION_DELAY } from './consts/match.const';
import { MatchNumber } from './entities/match-number.entity';
import { SocketsGateway } from '../sockets/sockets.gateway';
import {
  BINGO_ONE_STARTED_EVENT,
  EXTRACTED_NUMBERS_EVENT,
  MATCH_PAUSED_EVENT,
  MATCH_RESET_EVENT,
} from '../sockets/consts/sockets.const';
import {
  BINGO_BRONZE_PRIZE_EURO,
  BINGO_BRONZE_START_BALLS,
  BINGO_ONE_MIN_MATCHES,
  BINGO_ONE_PRIZE_EURO,
  BINGO_ONE_START_BALLS,
  BINGO_SUPER_PRIZE_EURO,
  BINGO_SUPER_START_BALLS,
} from '../room/consts/room.consts';
import { CreateMatchDto } from './dto/create-match.dto';

@Injectable()
export class MatchService {
  private readonly logger: Logger = new Logger('MatchService');
  private matchTimers: Map<number, NodeJS.Timeout> = new Map();
  private readonly matchNumbersCachePrefix = EXTRACTED_NUMBERS_CACHE_PREFIX;

  constructor(
    @InjectQueue('matches')
    private readonly matchesQueue: Queue,

    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,

    @InjectRepository(MatchNumber)
    private readonly matchNumberRepository: Repository<MatchNumber>,

    @Inject(forwardRef(() => RoomService))
    private readonly roomService: RoomService,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,

    private readonly socketsGateway: SocketsGateway,
  ) {
    //
  }

  startTimer(match: Match, roomId: number): void {
    // Clear any existing timer for this match
    if (this.matchTimers.has(match.id)) {
      clearInterval(this.matchTimers.get(match.id));
      this.logger.log(`Cleared existing timer for match #${match.id}`);
    }

    this.logger.log(`Starting timer for match #${match.id} in room #${roomId}`);

    const timer = setInterval(async () => {
      const extractedNumber = await this.extractNumber(match);

      if (extractedNumber === 0) {
        return;
      }

      if (extractedNumber === null && this.matchTimers.has(match.id)) {
        clearInterval(this.matchTimers.get(match.id));
        this.matchTimers.delete(match.id);
        this.logger.log(`Timer completed for match #${match.id}`);
      }
    }, MATCH_NUMBER_EXTRACTION_DELAY);

    this.matchTimers.set(match.id, timer);
  }

  stopTimer(matchId: number): void {
    if (this.matchTimers.has(matchId)) {
      clearInterval(this.matchTimers.get(matchId));
      this.matchTimers.delete(matchId);
      this.logger.log(`Timer stopped for match #${matchId}`);
    }
  }

  async addRoomToQueue(
    match: Match,
    roomId: number,
    options?: { delay?: number },
  ): Promise<void> {
    if (options?.delay) {
      const delayPromise = new Promise<void>((resolve, reject) => {
        setTimeout(async () => {
          try {
            await this.matchesQueue.add({ match, roomId });
          } catch (e) {
            reject(e);
          }

          resolve();
        }, options.delay);
      });

      await delayPromise;
      return;
    }

    await this.matchesQueue.add({ match, roomId });
  }

  async extractNumber(match: Match): Promise<number | null> {
    match = await this.findOne(match.id);
    if (match.closed) {
      return null;
    }

    const cacheKey = this.getMatchNumbersCacheKey(match.id);
    const cachedNumbers = await this.cacheManager.get<number[]>(cacheKey);
    const extractedNumbers = Array.isArray(cachedNumbers)
      ? cachedNumbers
      : match.matchNumbers.map((number) => number.number) || [];

    if (!Array.isArray(cachedNumbers)) {
      await this.cacheManager.set(cacheKey, extractedNumbers);
    }

    // Changed from 90 to 75 for 75-ball bingo
    if (extractedNumbers.length >= 75) {
      return null;
    }

    let extractedNumber = null;
    do {
      // Changed from 91 to 76 for 75-ball bingo (1-75)
      extractedNumber = Math.floor(Math.random() * 75) + 1;
    } while (extractedNumbers.includes(extractedNumber));

    await this.matchNumberRepository.save({
      match,
      number: extractedNumber,
    });

    await this.cacheManager.set(cacheKey, [...extractedNumbers, extractedNumber]);

    this.socketsGateway.server
      .to(match.room.id.toString())
      .emit(EXTRACTED_NUMBERS_EVENT, {
        matchId: match.id,
        number: extractedNumber,
      });

    return extractedNumber;
  }

  async create(room: Room, createMatchDto: CreateMatchDto): Promise<Match> {
    const match = await this.matchRepository.save({
      room,
      soldCards: createMatchDto.soldCards,
    });
    await this.clearMatchNumbersCache(match.id);

    const roomPrize = room.roomPrize;
    roomPrize.oneBalls =
      roomPrize.oneBalls === 0 || roomPrize.oneBalls >= 90
        ? BINGO_ONE_START_BALLS
        : roomPrize.oneBalls + 1;
    roomPrize.onePrice +=
      BINGO_ONE_PRIZE_EURO /*+ room.ticketPrice * createMatchDto.soldCards*/;

    roomPrize.superBalls =
      roomPrize.superBalls === 0 || roomPrize.superBalls >= 90
        ? BINGO_SUPER_START_BALLS
        : roomPrize.superBalls + 1;
    roomPrize.superPrice +=
      BINGO_SUPER_PRIZE_EURO /*+ room.ticketPrice * createMatchDto.soldCards*/;

    roomPrize.bronzeBalls =
      roomPrize.bronzeBalls === 0 || roomPrize.bronzeBalls >= 90
        ? BINGO_BRONZE_START_BALLS
        : roomPrize.bronzeBalls + 1;
    roomPrize.bronzePrice +=
      BINGO_BRONZE_PRIZE_EURO /*+ room.ticketPrice * createMatchDto.soldCards*/;

    room = await this.roomService.update(room.id, {
      currentMatch: match,
      roomPrize,
    });

    if (room.matches.length === BINGO_ONE_MIN_MATCHES) {
      this.socketsGateway.server
        .to(room.id.toString())
        .emit(BINGO_ONE_STARTED_EVENT);
    }

    await this.addRoomToQueue(match, room.id, { delay: 5000 });

    return this.findOne(match.id);
  }

  async close(match: Match | number, roomId?: number): Promise<void> {
    const matchId = match instanceof Match ? match.id : match;
    
    // Stop the timer first
    this.stopTimer(matchId);
    
    await this.matchRepository.update(
      { id: matchId },
      { closed: true },
    );
    await this.clearMatchNumbersCache(matchId);

    // Notify clients that match is paused
    if (roomId) {
      this.socketsGateway.server
        .to(roomId.toString())
        .emit(MATCH_PAUSED_EVENT, { matchId });
    }
    
    this.logger.log(`Match #${matchId} closed and timer stopped`);
  }

  async reset(matchId: number, roomId: number): Promise<void> {
    // Stop the timer
    this.stopTimer(matchId);

    // Close the match
    await this.matchRepository.update({ id: matchId }, { closed: true });
    await this.clearMatchNumbersCache(matchId);

    // Notify clients that match is reset
    this.socketsGateway.server
      .to(roomId.toString())
      .emit(MATCH_RESET_EVENT, { matchId });
      
    this.logger.log(`Match #${matchId} reset and timer stopped`);
  }

  async start(match: Match | number, room?: number): Promise<void> {
    const matchId = match instanceof Match ? match.id : match;
    this.logger.log(`Match #${matchId} is starting/resuming`);

    await this.matchRepository.update(
      { id: matchId },
      { closed: false },
    );
    await this.clearMatchNumbersCache(matchId);

    // Get the match instance and restart the timer
    const matchInstance = await this.findOne(matchId);
    
    // Restart the timer for resumed matches
    if (room) {
      this.startTimer(matchInstance, room);
    } else if (matchInstance.room) {
      this.startTimer(matchInstance, matchInstance.room.id);
    }
  }

  private async findOne(id: number): Promise<Match> {
    return this.matchRepository.findOne({
      where: { id },
      relations: {
        room: true,
        matchNumbers: true,
      },
    });
  }

  private getMatchNumbersCacheKey(matchId: number): string {
    return `${this.matchNumbersCachePrefix}${matchId}`;
  }

  private async clearMatchNumbersCache(matchId: number): Promise<void> {
    await this.cacheManager.del(this.getMatchNumbersCacheKey(matchId));
  }
}
