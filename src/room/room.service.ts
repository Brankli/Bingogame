import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { MatchService } from '../match/match.service';
import { SocketsGateway } from '../sockets/sockets.gateway';
import {
  NEW_MATCH_STARTED_EVENT,
  NEW_ROOM_AVAILABLE_EVENT,
} from '../sockets/consts/sockets.const';
import { Match } from '../match/entities/match.entity';
import { RoomPrize } from './entities/room-prize.entity';
import { mapToRoomDto } from './dto/room.dto';
import {
  buildRoomCardNumber,
  buildStaticTemplateCardNumber,
  parseRoomCardIndex,
  parseStaticTemplateIndex,
  STATIC_LIBRARY_SEED_BASE,
} from '../card/card-number.util';
import { RoomCardMode } from './consts/room-card-mode.const';
import {
  StaticCardLibraryGenerateResult,
  StaticCardLibraryStatusDto,
} from './dto/room-cards.dto';
import { RoomManager } from './entities/room-manager.entity';
import { CardService } from '../card/card.service';
import { Card } from '../card/entities/card.entity';
import { CreateMatchDto } from '../match/dto/create-match.dto';
import {
  RoomCardGenerationResult,
  RoomCardPreviewDto,
  RoomCardStatusDto,
} from './dto/room-cards.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(RoomPrize)
    private readonly roomPrizeRepository: Repository<RoomPrize>,

    @InjectRepository(RoomManager)
    private readonly roomManagerRepository: Repository<RoomManager>,

    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,

    @Inject(forwardRef(() => MatchService))
    private readonly matchService: MatchService,

    @Inject(forwardRef(() => CardService))
    private readonly cardService: CardService,

    private readonly socketsGateway: SocketsGateway,
  ) {}

  async create(
    user: User,
    createRoomDto: CreateRoomDto,
  ): Promise<{ room: Room; cardGeneration: RoomCardGenerationResult }> {
    const cardMode = createRoomDto.cardMode ?? RoomCardMode.AUTOMATIC;

    const room = await this.roomRepository.save({
      name: createRoomDto.name,
      cardMode,
      owner: user,
      roomPrize: new RoomPrize(),
    });

    console.log(
      `[RoomService] Room ${room.id} created (${cardMode} cards), building deck...`,
    );

    let cardGeneration: RoomCardGenerationResult;
    try {
      if (cardMode === RoomCardMode.STATIC) {
        cardGeneration = await this.applyStaticCardsToRoom(room.id);
      } else {
        cardGeneration = await this.generateMissingCardsForRoom(room.id);
      }
    } catch (error) {
      console.error(
        `[RoomService] Error generating cards for room ${room.id}:`,
        error,
      );
      cardGeneration = {
        status: 'failed',
        generated: 0,
        total: 0,
        message:
          error instanceof Error ? error.message : 'Card generation failed',
      };
    }

    this.socketsGateway.server.emit(NEW_ROOM_AVAILABLE_EVENT);

    return {
      room: await this.findOne(room.id),
      cardGeneration,
    };
  }

  private async countAssignedRoomCards(roomId: number): Promise<number> {
    return this.cardRepository
      .createQueryBuilder('card')
      .innerJoin('card.room', 'room')
      .where('room.id = :roomId', { roomId })
      .andWhere('card.assignedUserId IS NOT NULL')
      .getCount();
  }

  private async countLockedRoomCards(roomId: number): Promise<number> {
    return this.cardRepository.count({
      where: { room: { id: roomId }, isLocked: true },
    });
  }

  private async assertRoomCardsNotInUse(
    roomId: number,
    action: string,
  ): Promise<void> {
    const assigned = await this.countAssignedRoomCards(roomId);
    const locked = await this.countLockedRoomCards(roomId);

    if (assigned > 0 || locked > 0) {
      throw new BadRequestException(
        `Cannot ${action}: ${assigned} card(s) assigned to players and ${locked} locked in a match. Unassign or finish the game first.`,
      );
    }
  }

  private async getExistingCardIndices(roomId: number): Promise<Set<number>> {
    const existing = await this.cardRepository.find({
      where: { room: { id: roomId } },
      select: ['cardNumber'],
    });
    const indices = new Set<number>();
    for (const card of existing) {
      const index = parseRoomCardIndex(card.cardNumber);
      if (index != null) {
        indices.add(index);
      }
    }
    return indices;
  }

  private async saveCardsInChunks(cards: Card[]): Promise<void> {
    const chunkSize = 50;
    for (let i = 0; i < cards.length; i += chunkSize) {
      await this.cardRepository.save(cards.slice(i, i + chunkSize));
    }
  }

  async getStaticCardLibraryStatus(): Promise<StaticCardLibraryStatusDto> {
    const total = await this.cardRepository.count({
      where: { isStaticTemplate: true },
    });
    const complete = total >= 400;

    return {
      total,
      complete,
      message: complete
        ? 'Static card library is ready (400/400).'
        : `Static library incomplete (${total}/400). Generate the master deck in Admin.`,
    };
  }

  /**
   * Build or refresh the global 400-card static library (same patterns for all static rooms).
   */
  async generateStaticCardLibrary(
    reset = false,
  ): Promise<StaticCardLibraryGenerateResult> {
    if (reset) {
      await this.cardRepository.delete({ isStaticTemplate: true });
    }

    const existingIndices = new Set<number>();
    const existing = await this.cardRepository.find({
      where: { isStaticTemplate: true },
      select: ['cardNumber', 'templateIndex'],
    });
    for (const card of existing) {
      const idx =
        card.templateIndex ??
        parseStaticTemplateIndex(card.cardNumber) ??
        null;
      if (idx != null) {
        existingIndices.add(idx);
      }
    }

    const cards: Card[] = [];
    for (let i = 1; i <= 400; i++) {
      if (existingIndices.has(i)) {
        continue;
      }

      const seed = STATIC_LIBRARY_SEED_BASE + i * 1000;
      const grid = this.cardService.generateCard(seed);

      cards.push(
        this.cardRepository.create({
          cardNumber: buildStaticTemplateCardNumber(i),
          grid: JSON.stringify(grid),
          isActive: true,
          isStaticTemplate: true,
          templateIndex: i,
          room: null,
        }),
      );
    }

    if (cards.length > 0) {
      await this.saveCardsInChunks(cards);
    }

    const total = await this.cardRepository.count({
      where: { isStaticTemplate: true },
    });

    return {
      generated: cards.length,
      total,
      complete: total >= 400,
      message:
        total >= 400
          ? `Static library ready (${total}/400). All static rooms will share these patterns.`
          : `Added ${cards.length} static card(s). Library now at ${total}/400.`,
    };
  }

  private async assertStaticLibraryReady(): Promise<void> {
    const status = await this.getStaticCardLibraryStatus();
    if (!status.complete) {
      throw new BadRequestException(status.message);
    }
  }

  /**
   * Copy the shared static library into a room (unique ROOM{n}-CAR#### IDs, same grids).
   */
  async applyStaticCardsToRoom(
    roomId: number,
  ): Promise<RoomCardGenerationResult> {
    await this.ensureRoomExists(roomId);
    await this.assertStaticLibraryReady();

    const templates = await this.cardRepository.find({
      where: { isStaticTemplate: true },
      select: ['templateIndex', 'cardNumber', 'grid'],
    });

    const templateByIndex = new Map<number, { grid: string }>();
    for (const template of templates) {
      const index =
        template.templateIndex ??
        parseStaticTemplateIndex(template.cardNumber) ??
        null;
      if (index != null) {
        templateByIndex.set(index, { grid: template.grid });
      }
    }

    const existingIndices = await this.getExistingCardIndices(roomId);
    const newCards: Card[] = [];

    for (let i = 1; i <= 400; i++) {
      if (existingIndices.has(i)) {
        continue;
      }

      const template = templateByIndex.get(i);
      if (!template) {
        continue;
      }

      newCards.push(
        this.cardRepository.create({
          cardNumber: buildRoomCardNumber(roomId, i),
          grid: template.grid,
          isActive: true,
          isStaticTemplate: false,
          room: { id: roomId } as Room,
        }),
      );
    }

    if (newCards.length > 0) {
      await this.saveCardsInChunks(newCards);
    }

    const total = await this.cardRepository.count({
      where: { room: { id: roomId } },
    });

    if (total >= 400) {
      return {
        status: 'complete',
        generated: newCards.length,
        total,
        message: `Applied static deck to room (${total}/400). Same patterns as other static rooms.`,
      };
    }

    return {
      status: 'incomplete',
      generated: newCards.length,
      total,
      message: `Applied ${newCards.length} static card(s). Room now has ${total}/400.`,
    };
  }

  /**
   * Generate only missing cards (slots 1–400) for a room — unique per-room seeds.
   */
  async generateMissingCardsForRoom(
    roomId: number,
  ): Promise<RoomCardGenerationResult> {
    await this.ensureRoomExists(roomId);

    const existingIndices = await this.getExistingCardIndices(roomId);
    const cards: Card[] = [];

    for (let i = 1; i <= 400; i++) {
      if (existingIndices.has(i)) {
        continue;
      }

      const cardNumber = buildRoomCardNumber(roomId, i);
      const seed = roomId * 10000 + i * 1000;
      const grid = this.cardService.generateCard(seed);

      cards.push(
        this.cardRepository.create({
          cardNumber,
          grid: JSON.stringify(grid),
          isActive: true,
          room: { id: roomId } as Room,
        }),
      );
    }

    if (cards.length > 0) {
      await this.saveCardsInChunks(cards);
      console.log(
        `[RoomService] Saved ${cards.length} new cards for room ${roomId}`,
      );
    }

    const total = await this.cardRepository.count({
      where: { room: { id: roomId } },
    });

    if (total >= 400) {
      return {
        status: 'complete',
        generated: cards.length,
        total,
        message: `Room has a complete deck (${total}/400 cards).`,
      };
    }

    return {
      status: 'incomplete',
      generated: cards.length,
      total,
      message:
        cards.length > 0
          ? `Generated ${cards.length} cards (${total}/400 total).`
          : `Deck incomplete (${total}/400). No new cards were needed.`,
    };
  }

  async resetRoomCards(roomId: number): Promise<RoomCardGenerationResult> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    await this.assertRoomCardsNotInUse(roomId, 'reset room cards');

    await this.cardRepository.delete({ room: { id: roomId } });

    if (room.cardMode === RoomCardMode.STATIC) {
      return this.applyStaticCardsToRoom(roomId);
    }

    return this.generateMissingCardsForRoom(roomId);
  }

  /**
   * Generate missing cards, or reset entire deck when reset=true.
   */
  async generateCardsForExistingRoom(
    roomId: number,
    options: { reset?: boolean } = {},
  ): Promise<RoomCardGenerationResult> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    if (options.reset) {
      return this.resetRoomCards(roomId);
    }

    const totalBefore = await this.cardRepository.count({
      where: { room: { id: roomId } },
    });

    if (totalBefore >= 400) {
      return {
        status: 'already_complete',
        generated: 0,
        total: totalBefore,
        message: 'Room already has a complete deck (400/400).',
      };
    }

    await this.assertRoomCardsNotInUse(
      roomId,
      'regenerate cards while players are using them',
    );

    if (room.cardMode === RoomCardMode.STATIC) {
      return this.applyStaticCardsToRoom(roomId);
    }

    return this.generateMissingCardsForRoom(roomId);
  }

  async getRoomCardStatus(roomId: number): Promise<RoomCardStatusDto> {
    await this.ensureRoomExists(roomId);

    const total = await this.cardRepository.count({
      where: { room: { id: roomId } },
    });
    const assigned = await this.countAssignedRoomCards(roomId);
    const locked = await this.countLockedRoomCards(roomId);
    const available = Math.max(0, total - assigned);
    const inUse = assigned > 0 || locked > 0;
    const missing = Math.max(0, 400 - total);

    let deckStatus: RoomCardStatusDto['deckStatus'] = 'empty';
    if (total > 400) {
      deckStatus = 'over_limit';
    } else if (total >= 400) {
      deckStatus = 'complete';
    } else if (total > 0) {
      deckStatus = 'incomplete';
    }

    return {
      roomId,
      total,
      available,
      assigned,
      locked,
      deckStatus,
      inUse,
      canGenerate: !inUse && total < 400,
      canCopy: !inUse && total < 400,
      canReset: !inUse,
      missing,
    };
  }

  async previewRoomCard(roomId: number, index = 1): Promise<RoomCardPreviewDto> {
    const safeIndex = Math.min(400, Math.max(1, Math.floor(index)));
    const room = await this.roomRepository.findOne({ where: { id: roomId } });

    if (room?.cardMode === RoomCardMode.STATIC) {
      const template = await this.cardRepository.findOne({
        where: { isStaticTemplate: true, templateIndex: safeIndex },
      });
      if (template) {
        const grid =
          typeof template.grid === 'string'
            ? JSON.parse(template.grid)
            : template.grid;
        return {
          roomId,
          index: safeIndex,
          cardNumber: buildRoomCardNumber(roomId, safeIndex),
          grid,
        };
      }
    }

    const seed = roomId * 10000 + safeIndex * 1000;
    const grid = this.cardService.generateCard(seed);

    return {
      roomId,
      index: safeIndex,
      cardNumber: buildRoomCardNumber(roomId, safeIndex),
      grid,
    };
  }

  async exportRoomCardsCsv(roomId: number): Promise<string> {
    await this.ensureRoomExists(roomId);

    const cards = await this.cardRepository.find({
      where: { room: { id: roomId } },
      select: ['cardNumber', 'grid'],
      order: { cardNumber: 'ASC' },
    });

    const header = 'cardNumber,assigned,gridJson';
    const rows = cards.map((card) => {
      const grid =
        typeof card.grid === 'string' ? card.grid : JSON.stringify(card.grid);
      const escaped = `"${grid.replace(/"/g, '""')}"`;
      return `${card.cardNumber},,${escaped}`;
    });

    return [header, ...rows].join('\n');
  }

  /**
   * Copy missing card slots from source room to target (by card index).
   */
  async copyCardsFromRoom(
    sourceRoomId: number,
    targetRoomId: number,
  ): Promise<{ copied: number; total: number; message: string }> {
    const sourceRoom = await this.findOne(sourceRoomId);
    const targetRoom = await this.findOne(targetRoomId);

    if (!sourceRoom) {
      throw new NotFoundException('Source room not found');
    }
    if (!targetRoom) {
      throw new NotFoundException('Target room not found');
    }

    await this.assertRoomCardsNotInUse(
      targetRoomId,
      'copy cards while target room cards are in use',
    );

    const sourceCards = await this.cardRepository.find({
      where: { room: { id: sourceRoomId } },
      select: ['cardNumber', 'grid'],
      order: { cardNumber: 'ASC' },
    });

    if (sourceCards.length === 0) {
      throw new NotFoundException('Source room has no cards to copy');
    }

    const sourceByIndex = new Map<number, { grid: string }>();
    for (const sourceCard of sourceCards) {
      const index = parseRoomCardIndex(sourceCard.cardNumber);
      if (index != null) {
        sourceByIndex.set(index, { grid: sourceCard.grid });
      }
    }

    const existingIndices = await this.getExistingCardIndices(targetRoomId);
    const newCards: Card[] = [];

    for (let i = 1; i <= 400; i++) {
      if (existingIndices.has(i)) {
        continue;
      }

      const source = sourceByIndex.get(i);
      if (!source) {
        continue;
      }

      let grid: number[][];
      try {
        grid =
          typeof source.grid === 'string'
            ? JSON.parse(source.grid)
            : source.grid;
      } catch {
        grid = this.cardService.generateCard(Date.now() + i);
      }

      newCards.push(
        this.cardRepository.create({
          cardNumber: buildRoomCardNumber(targetRoomId, i),
          grid: JSON.stringify(grid),
          isActive: true,
          room: { id: targetRoomId } as Room,
        }),
      );
    }

    if (newCards.length === 0) {
      const total = await this.cardRepository.count({
        where: { room: { id: targetRoomId } },
      });
      return {
        copied: 0,
        total,
        message:
          total >= 400
            ? 'Target room already has a complete deck.'
            : 'No matching card slots to copy from source room.',
      };
    }

    await this.saveCardsInChunks(newCards);

    const total = await this.cardRepository.count({
      where: { room: { id: targetRoomId } },
    });

    return {
      copied: newCards.length,
      total,
      message: `Copied ${newCards.length} card(s). Target room now has ${total}/400 cards.`,
    };
  }

  private async ensureRoomExists(roomId: number): Promise<void> {
    const roomExists = await this.roomRepository.count({
      where: { id: roomId },
    });
    if (roomExists === 0) {
      throw new NotFoundException('Room not found');
    }
  }

  async findAll(): Promise<Room[]> {
    return await this.roomRepository.find({
      relations: {
        owner: true,
        currentUsers: true,
        roomPrize: true,
        currentMatch: true,
        managers: {
          user: true,
        },
      },
    });
  }

  async findOne(id: number, options?: any): Promise<Room> {
    return this.roomRepository.findOne({
      where: { id },
      relations: {
        currentUsers: true,
        currentMatch: {
          matchNumbers: true,
        },
        roomPrize: true,
        managers: {
          user: true,
        },
        ...(options?.relations || {}),
      },
    });
  }

  async update(id: number, room: Partial<Room>): Promise<Room> {
    if (room.roomPrize) {
      await this.roomPrizeRepository.update(
        { id: room.roomPrize.id },
        room.roomPrize,
      );
    }

    await this.roomRepository.update({ id }, room);
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    const room = await this.roomRepository.findOne({ where: { id } });
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    const result = await this.roomRepository.delete({ id });
    if (!result.affected) {
      throw new NotFoundException('Room not found');
    }
    this.socketsGateway.server.emit(NEW_ROOM_AVAILABLE_EVENT);
    return { success: true };
  }

  async join(roomId: number, user: User): Promise<void> {
    const room = await this.findOne(roomId);
    const alreadyJoined = room.currentUsers.some(
      (currentUser) => currentUser.id === user.id,
    );
    if (!alreadyJoined) {
      room.currentUsers.push(user);
    }

    await this.roomRepository.save(room);
  }

  async leave(roomId: number, user: User): Promise<void> {
    const room = await this.findOne(roomId);
    room.currentUsers = room.currentUsers.filter(
      (currentUser) => currentUser.id !== user.id,
    );

    await this.roomRepository.save(room);
  }

  async startMatch(room: Room, createMatchDto: CreateMatchDto): Promise<Match> {
    const match = await this.matchService.create(room, createMatchDto);
    room = await this.findOne(room.id);

    this.socketsGateway.server
      .to(room.id.toString())
      .emit(NEW_MATCH_STARTED_EVENT, {
        matchId: match.id,
        room: mapToRoomDto(room),
      });

    return match;
  }

  async closeMatches(roomId: number): Promise<Room> {
    await this.findOne(roomId);
    const openMatches = await this.matchService.findOpenByRoom(roomId);

    for (const match of openMatches) {
      await this.cardService.unlockCardsForMatch(match.id);
      await this.matchService.close(match);
    }

    return this.findOne(roomId);
  }

  async assignManager(userId: number, roomId: number): Promise<RoomManager> {
    // Check if already assigned
    const existing = await this.roomManagerRepository.findOne({
      where: {
        user: { id: userId },
        room: { id: roomId },
      },
    });

    if (existing) {
      return existing;
    }

    const manager = this.roomManagerRepository.create({
      user: { id: userId } as User,
      room: { id: roomId } as Room,
    });

    return this.roomManagerRepository.save(manager);
  }

  async removeManager(userId: number, roomId: number): Promise<void> {
    await this.roomManagerRepository.delete({
      user: { id: userId },
      room: { id: roomId },
    });
  }

  async getUserManagedRooms(userId: number): Promise<Room[]> {
    const managers = await this.roomManagerRepository.find({
      where: { user: { id: userId } },
      relations: ['room'],
    });
    const rooms = await Promise.all(
      managers.map(async (m) => {
        if (!m.room?.id) {
          return null;
        }
        return this.findOne(m.room.id);
      }),
    );

    return rooms.filter((room): room is Room => !!room);
  }

  async canManageRoom(
    userId: number,
    roomId: number,
    userRole: string,
  ): Promise<boolean> {
    // Admins can manage any room
    if (userRole === 'admin') {
      return true;
    }

    // Check if user is assigned as manager
    const manager = await this.roomManagerRepository.findOne({
      where: {
        user: { id: userId },
        room: { id: roomId },
      },
    });

    return !!manager;
  }

  async cleanupInvalidManagers(): Promise<number> {
    // Find all room managers
    const allManagers = await this.roomManagerRepository.find({
      relations: ['user', 'room'],
    });

    // Filter out managers with deleted users
    const invalidManagers = allManagers.filter((m) => !m.user);

    // Delete invalid assignments
    if (invalidManagers.length > 0) {
      await this.roomManagerRepository.remove(invalidManagers);
    }

    return invalidManagers.length;
  }
}
