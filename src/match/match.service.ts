import {
  CACHE_MANAGER,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { Repository } from 'typeorm';
import { Room } from '../room/entities/room.entity';
import { RoomService } from '../room/room.service';
import { Cache } from 'cache-manager';
import { EXTRACTED_NUMBERS_CACHE_PREFIX, MATCH_NUMBER_EXTRACTION_DELAY } from './consts/match.const';
import { MatchNumber } from './entities/match-number.entity';
import { SocketsGateway } from '../sockets/sockets.gateway';
import { CardService } from '../card/card.service';
import {
  BINGO_ONE_STARTED_EVENT,
  EXTRACTED_NUMBERS_EVENT,
  MATCH_ENDED_EVENT,
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
  private matchSpeeds: Map<number, number> = new Map(); // Store speed per match
  private matchRoomIds: Map<number, number> = new Map();
  private readonly matchNumbersCachePrefix = EXTRACTED_NUMBERS_CACHE_PREFIX;

  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,

    @InjectRepository(MatchNumber)
    private readonly matchNumberRepository: Repository<MatchNumber>,

    @Inject(forwardRef(() => RoomService))
    private readonly roomService: RoomService,

    @Inject(forwardRef(() => CardService))
    private readonly cardService: CardService,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,

    private readonly socketsGateway: SocketsGateway,
  ) {
    //
  }

  startTimer(match: Match, roomId: number, speed?: number): void {
    // Clear any existing timer for this match
    if (this.matchTimers.has(match.id)) {
      clearInterval(this.matchTimers.get(match.id));
      this.logger.log(`Cleared existing timer for match #${match.id}`);
    }

    // Use provided speed or get stored speed or use default
    const callingSpeed = speed || this.matchSpeeds.get(match.id) || MATCH_NUMBER_EXTRACTION_DELAY;
    this.matchSpeeds.set(match.id, callingSpeed);
    this.matchRoomIds.set(match.id, roomId);

    this.logger.log(`Starting timer for match #${match.id} in room #${roomId} with speed ${callingSpeed}ms`);

    const timer = setInterval(async () => {
      const extractedNumber = await this.extractNumber(match.id);

      if (extractedNumber === null && this.matchTimers.has(match.id)) {
        clearInterval(this.matchTimers.get(match.id));
        this.matchTimers.delete(match.id);
        this.matchSpeeds.delete(match.id);
        this.matchRoomIds.delete(match.id);
        this.logger.log(`Timer completed for match #${match.id}`);
      }
    }, callingSpeed);

    this.matchTimers.set(match.id, timer);
  }

  stopTimer(matchId: number): void {
    this.logger.log(`[STOP TIMER] Attempting to stop timer for match #${matchId}`);
    this.logger.log(`[STOP TIMER] Timer exists: ${this.matchTimers.has(matchId)}`);
    
    if (this.matchTimers.has(matchId)) {
      const timer = this.matchTimers.get(matchId);
      clearInterval(timer);
      this.matchTimers.delete(matchId);
      this.matchRoomIds.delete(matchId);
      this.logger.log(`[STOP TIMER] ✅ Timer stopped and deleted for match #${matchId}`);
    } else {
      this.logger.warn(`[STOP TIMER] ⚠️ No timer found for match #${matchId}`);
    }
    
    this.logger.log(`[STOP TIMER] Active timers count: ${this.matchTimers.size}`);
  }

  /**
   * Change the calling speed for an active match
   */
  changeSpeed(matchId: number, roomId: number, newSpeed: number): void {
    this.logger.log(`Changing speed for match #${matchId} to ${newSpeed}ms`);
    this.matchSpeeds.set(matchId, newSpeed);
    
    // Restart timer with new speed if match is active
    if (this.matchTimers.has(matchId)) {
      const match = { id: matchId } as Match;
      this.startTimer(match, roomId, newSpeed);
    }
  }

  async addRoomToQueue(
    match: Match,
    roomId: number,
    options?: { delay?: number },
  ): Promise<void> {
    if (options?.delay) {
      setTimeout(() => {
        this.startTimer(match, roomId);
      }, options.delay);
      return;
    }
    this.startTimer(match, roomId);
  }

  async extractNumber(matchId: number): Promise<number | null> {
    const row = await this.matchRepository.findOne({
      where: { id: matchId },
      select: { id: true, closed: true },
    });
    if (!row || row.closed) {
      return null;
    }

    const cacheKey = this.getMatchNumbersCacheKey(matchId);
    let extractedNumbers = await this.cacheManager.get<number[]>(cacheKey);

    if (!Array.isArray(extractedNumbers)) {
      const rows = await this.matchNumberRepository.find({
        where: { match: { id: matchId } },
        select: { number: true },
      });
      extractedNumbers = rows.map((entry) => entry.number);
      await this.cacheManager.set(cacheKey, extractedNumbers);
    }

    if (extractedNumbers.length >= 75) {
      return null;
    }

    const drawn = new Set(extractedNumbers);
    const remaining: number[] = [];
    for (let n = 1; n <= 75; n++) {
      if (!drawn.has(n)) {
        remaining.push(n);
      }
    }
    if (remaining.length === 0) {
      return null;
    }

    const extractedNumber =
      remaining[Math.floor(Math.random() * remaining.length)];

    await this.matchNumberRepository.save({
      match: { id: matchId },
      number: extractedNumber,
    });

    await this.cacheManager.set(cacheKey, [...extractedNumbers, extractedNumber]);

    const roomId = this.matchRoomIds.get(matchId);
    if (roomId !== undefined) {
      this.socketsGateway.server
        .to(roomId.toString())
        .emit(EXTRACTED_NUMBERS_EVENT, {
          matchId,
          number: extractedNumber,
        });
    }

    return extractedNumber;
  }

  async create(room: Room, createMatchDto: CreateMatchDto): Promise<Match> {
    const match = await this.matchRepository.save({
      room,
      soldCards: createMatchDto.soldCards,
      registeredCards: createMatchDto.registeredCards || [],
    });
    await this.clearMatchNumbersCache(match.id);

    this.logger.log(`Match created with ${createMatchDto.registeredCards?.length || 0} registered cards`);

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

    const matchCount = await this.matchRepository.count({
      where: { room: { id: room.id } },
    });
    if (matchCount === BINGO_ONE_MIN_MATCHES) {
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

  async endMatch(
    matchId: number,
    roomId: number,
    winners?: Array<{ cardNumber?: string; username?: string }>,
  ): Promise<void> {
    this.stopTimer(matchId);
    await this.cardService.unlockCardsForMatch(matchId);
    await this.matchRepository.update({ id: matchId }, { closed: true });
    await this.clearMatchNumbersCache(matchId);

    const room = await this.roomService.findOne(roomId);
    if (room) {
      await this.roomService.update(roomId, { currentMatch: null });
    }

    this.socketsGateway.server.to(roomId.toString()).emit(MATCH_ENDED_EVENT, {
      matchId,
      winners: winners || [],
    });

    this.logger.log(`Match #${matchId} ended in room #${roomId}`);
  }

  async reset(matchId: number, roomId: number): Promise<void> {
    // Stop the timer
    this.stopTimer(matchId);

    // Delete all called numbers for this match
    await this.matchNumberRepository.delete({ match: { id: matchId } });

    // Unlock all cards that were locked for this match
    await this.cardService.unlockCardsForMatch(matchId);

    // Close the match
    await this.matchRepository.update({ id: matchId }, { closed: true });
    await this.clearMatchNumbersCache(matchId);

    // Notify clients that match is reset
    this.socketsGateway.server
      .to(roomId.toString())
      .emit(MATCH_RESET_EVENT, { matchId });
      
    this.logger.log(`Match #${matchId} reset - numbers cleared, cards unlocked, timer stopped`);
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

  async findOpenByRoom(roomId: number): Promise<Match[]> {
    return this.matchRepository.find({
      where: { room: { id: roomId }, closed: false },
    });
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
