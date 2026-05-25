import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { VerifyCardDto } from './dto/verify-card.dto';
import { generateBingoCard } from './bingo-grid.util';
import {
  cardNumberLookupVariants,
  normalizeRoomCardNumber,
  parseRoomIdFromCardNumber,
} from './card-number.util';
import {
  buildMarkedCells,
  countMarkedNonFreeCells,
  evaluatePatternWins,
  normalizeCalledNumbers,
  normalizeVerifyPattern,
} from './card-verify.util';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  /** @see generateBingoCard */
  generateCard(seed?: number): number[][] {
    return generateBingoCard(seed);
  }

  /**
   * Generate unique card number with specific format
   * @param index - Card index (1-400)
   * @param roomId - Optional room ID for room-specific format
   */
  generateCardNumber(index?: number, roomId?: number): string {
    if (index !== undefined && roomId !== undefined) {
      // Format: ROOM{id}-CAR{number} (e.g., ROOM9-CAR0001)
      return `ROOM${roomId}-CAR${String(index).padStart(4, '0')}`;
    }
    if (index !== undefined) {
      // Format: CARD-001, CARD-002, etc. (legacy format)
      return `CARD-${String(index).padStart(3, '0')}`;
    }
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `CARD-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate 400 pre-registered cards with static grids
   * @param roomId - Room ID for generating room-specific cards
   */
  /**
   * @deprecated Use RoomService.generateCardsForExistingRoom(roomId) instead.
   */
  async generateBulkCards(roomId?: number): Promise<Card[]> {
    if (!roomId) {
      this.logger.warn(
        'generateBulkCards called without roomId — global bulk is deprecated',
      );
      return [];
    }

    this.logger.warn(
      `generateBulkCards(roomId) is deprecated — use room card generation API`,
    );
    return [];
  }

  /**
   * Create one or multiple cards
   */
  async create(createCardDto: CreateCardDto): Promise<Card[]> {
    const quantity = createCardDto.quantity || 1;
    const cards: Card[] = [];

    for (let i = 0; i < quantity; i++) {
      // Use timestamp + index as seed for unique but reproducible cards
      const seed = Date.now() + i * 1000;
      const grid = this.generateCard(seed);

      const card = this.cardRepository.create({
        cardNumber: this.generateCardNumber(),
        grid: JSON.stringify(grid), // Convert to JSON string
        isActive: true,
      });
      cards.push(await this.cardRepository.save(card));
    }

    return cards;
  }

  /**
   * Get all cards
   */
  async findAll(): Promise<Card[]> {
    const cards = await this.cardRepository.find({
      relations: ['assignedUser', 'room'],
    });

    // Parse grid JSON strings back to arrays safely
    return (await Promise.all(
      cards.map(async (card) => ({
        ...card,
        grid: await this.normalizeCardGrid(card),
      })),
    )) as unknown as Card[];
  }

  /**
   * Get card by ID or card number
   */
  async findOne(identifier: string | number): Promise<Card | null> {
    let card: Card | null;

    if (typeof identifier === 'number') {
      card = await this.cardRepository.findOne({
        where: { id: identifier },
        relations: ['assignedUser', 'room', 'room.currentMatch'],
      });
    } else {
      card = await this.cardRepository.findOne({
        where: { cardNumber: identifier },
        relations: ['assignedUser', 'room', 'room.currentMatch'],
      });
    }

    if (card) {
      return {
        ...card,
        grid: await this.normalizeCardGrid(card),
      } as unknown as Card;
    }

    return null;
  }

  private parseCardSeedFromNumber(cardNumber?: string): number {
    const raw = String(cardNumber || '');
    const match = raw.match(/(\d+)/);
    const seedBase = match ? Number(match[1]) : Date.now();
    return Math.max(1, seedBase) * 1000;
  }

  private isValidGrid(grid: unknown): grid is number[][] {
    if (!Array.isArray(grid) || grid.length !== 5) return false;
    return grid.every(
      (row) =>
        Array.isArray(row) &&
        row.length === 5 &&
        row.every((n) => Number.isFinite(n)),
    );
  }

  private async normalizeCardGrid(card: Card): Promise<number[][]> {
    try {
      if (Array.isArray(card.grid) && this.isValidGrid(card.grid)) {
        return card.grid;
      }

      if (typeof card.grid === 'string' && card.grid.trim().length > 0) {
        const parsed = JSON.parse(card.grid);
        if (this.isValidGrid(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      // Fallback below repairs corrupted grid payloads.
    }

    const fallbackGrid = this.generateCard(
      this.parseCardSeedFromNumber(card.cardNumber),
    );
    await this.cardRepository.update(card.id, {
      grid: JSON.stringify(fallbackGrid),
    });
    return fallbackGrid;
  }

  /**
   * Assign card to user in a room
   */
  async assignCardToUser(
    cardNumber: string,
    userId: number,
    roomId: number,
  ): Promise<Card> {
    const card = await this.findOne(cardNumber);
    if (!card) {
      throw new Error('Card not found');
    }

    if (card.assignedUser && card.room) {
      throw new Error('Card already assigned');
    }

    await this.cardRepository.update(card.id, {
      assignedUser: { id: userId } as any,
      room: { id: roomId } as any,
    });

    return this.findOne(cardNumber);
  }

  /**
   * Unassign card from user
   */
  async unassignCard(cardNumber: string): Promise<Card> {
    const card = await this.findOne(cardNumber);
    if (!card) {
      throw new Error('Card not found');
    }

    await this.cardRepository.update(card.id, {
      assignedUser: null,
      room: null,
      isLocked: false,
      lockedInMatch: null,
    });

    return this.findOne(cardNumber);
  }

  /**
   * Lock card after wrong BINGO claim
   */
  async lockCard(cardNumber: string, matchId: number): Promise<Card> {
    try {
      const card = await this.resolveCardForVerify(cardNumber);
      if (!card) {
        throw new NotFoundException(`Card ${cardNumber} not found`);
      }

      await this.cardRepository.update(card.id, {
        isLocked: true,
        lockedInMatch: { id: matchId } as any,
      });

      return this.findOne(card.cardNumber);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error locking card ${cardNumber}:`, error);
      throw new BadRequestException(`Failed to lock card: ${error.message}`);
    }
  }

  /**
   * Unlock all cards for a match (when match ends)
   */
  async unlockCardsForMatch(matchId: number): Promise<void> {
    try {
      await this.cardRepository.update(
        { lockedInMatch: { id: matchId } as any },
        { isLocked: false, lockedInMatch: null },
      );
      this.logger.log(`Unlocked all cards for match ${matchId}`);
    } catch (error) {
      this.logger.error(`Error unlocking cards for match ${matchId}:`, error);
      throw new BadRequestException(`Failed to unlock cards: ${error.message}`);
    }
  }

  /**
   * Get available (unassigned) cards
   */
  async getAvailableCards(): Promise<Card[]> {
    const cards = await this.cardRepository.find({
      where: { assignedUser: null as any },
      order: { cardNumber: 'ASC' },
    });
    return (await Promise.all(
      cards.map(async (card) => ({
        ...card,
        grid: await this.normalizeCardGrid(card),
      })),
    )) as unknown as Card[];
  }

  /**
   * Get cards assigned to a user in a room
   */
  async getUserCardsInRoom(userId: number, roomId: number): Promise<Card[]> {
    const cards = await this.cardRepository.find({
      where: {
        assignedUser: { id: userId },
        room: { id: roomId },
      },
      relations: ['assignedUser', 'room'],
    });
    return (await Promise.all(
      cards.map(async (card) => ({
        ...card,
        grid: await this.normalizeCardGrid(card),
      })),
    )) as unknown as Card[];
  }

  /**
   * Pattern definitions as coordinate arrays
   */
  private getPatternCoordinates(pattern: string): number[][][] {
    const patterns: { [key: string]: number[][][] } = {
      horizontal: [
        [
          [0, 0],
          [0, 1],
          [0, 2],
          [0, 3],
          [0, 4],
        ], // Row 0
        [
          [1, 0],
          [1, 1],
          [1, 2],
          [1, 3],
          [1, 4],
        ], // Row 1
        [
          [2, 0],
          [2, 1],
          [2, 2],
          [2, 3],
          [2, 4],
        ], // Row 2
        [
          [3, 0],
          [3, 1],
          [3, 2],
          [3, 3],
          [3, 4],
        ], // Row 3
        [
          [4, 0],
          [4, 1],
          [4, 2],
          [4, 3],
          [4, 4],
        ], // Row 4
      ],
      vertical: [
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 0],
          [4, 0],
        ], // Col 0
        [
          [0, 1],
          [1, 1],
          [2, 1],
          [3, 1],
          [4, 1],
        ], // Col 1
        [
          [0, 2],
          [1, 2],
          [2, 2],
          [3, 2],
          [4, 2],
        ], // Col 2
        [
          [0, 3],
          [1, 3],
          [2, 3],
          [3, 3],
          [4, 3],
        ], // Col 3
        [
          [0, 4],
          [1, 4],
          [2, 4],
          [3, 4],
          [4, 4],
        ], // Col 4
      ],
      diagonal: [
        [
          [0, 0],
          [1, 1],
          [2, 2],
          [3, 3],
          [4, 4],
        ], // Top-left to bottom-right
        [
          [0, 4],
          [1, 3],
          [2, 2],
          [3, 1],
          [4, 0],
        ], // Top-right to bottom-left
      ],
      anyline: [
        // Any horizontal line
        [
          [0, 0],
          [0, 1],
          [0, 2],
          [0, 3],
          [0, 4],
        ], // Row 0
        [
          [1, 0],
          [1, 1],
          [1, 2],
          [1, 3],
          [1, 4],
        ], // Row 1
        [
          [2, 0],
          [2, 1],
          [2, 2],
          [2, 3],
          [2, 4],
        ], // Row 2
        [
          [3, 0],
          [3, 1],
          [3, 2],
          [3, 3],
          [3, 4],
        ], // Row 3
        [
          [4, 0],
          [4, 1],
          [4, 2],
          [4, 3],
          [4, 4],
        ], // Row 4
        // Any vertical line
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 0],
          [4, 0],
        ], // Col 0
        [
          [0, 1],
          [1, 1],
          [2, 1],
          [3, 1],
          [4, 1],
        ], // Col 1
        [
          [0, 2],
          [1, 2],
          [2, 2],
          [3, 2],
          [4, 2],
        ], // Col 2
        [
          [0, 3],
          [1, 3],
          [2, 3],
          [3, 3],
          [4, 3],
        ], // Col 3
        [
          [0, 4],
          [1, 4],
          [2, 4],
          [3, 4],
          [4, 4],
        ], // Col 4
        // Any diagonal line
        [
          [0, 0],
          [1, 1],
          [2, 2],
          [3, 3],
          [4, 4],
        ], // Top-left to bottom-right
        [
          [0, 4],
          [1, 3],
          [2, 2],
          [3, 1],
          [4, 0],
        ], // Top-right to bottom-left
      ],
      corners: [
        [
          [0, 0],
          [0, 4],
          [4, 0],
          [4, 4],
        ], // Four corners
      ],
      x: [
        [
          [0, 0],
          [1, 1],
          [2, 2],
          [3, 3],
          [4, 4],
          [0, 4],
          [1, 3],
          [3, 1],
          [4, 0],
        ], // X shape
      ],
      t: [
        [
          [0, 0],
          [0, 1],
          [0, 2],
          [0, 3],
          [0, 4],
          [1, 2],
          [2, 2],
          [3, 2],
          [4, 2],
        ], // T shape
      ],
      l: [
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 0],
          [4, 0],
          [4, 1],
          [4, 2],
          [4, 3],
          [4, 4],
        ], // L shape
      ],
      fullhouse: [
        // All 25 cells
        Array.from({ length: 25 }, (_, i) => [Math.floor(i / 5), i % 5]),
      ],
    };

    return patterns[normalizeVerifyPattern(pattern)] || [];
  }

  private async resolveCardForVerify(rawCardNumber: string): Promise<Card | null> {
    const trimmed = String(rawCardNumber || '').trim();
    if (!trimmed) {
      return null;
    }

    const roomId = parseRoomIdFromCardNumber(trimmed);
    const variants = cardNumberLookupVariants(trimmed, roomId ?? undefined);

    for (const key of variants) {
      const card = await this.findOne(key);
      if (card) {
        return card;
      }
    }

    return null;
  }

  private isCardRegisteredForMatch(
    card: Card,
    inputCardNumber: string,
    registeredCards: string[],
  ): boolean {
    if (!registeredCards?.length || !card.room?.id) {
      return false;
    }

    const registeredSet = new Set(
      registeredCards.map((c) => String(c || '').trim().toUpperCase()),
    );

    const candidates = new Set<string>();
    candidates.add(String(card.cardNumber || '').trim().toUpperCase());

    const normalized = normalizeRoomCardNumber(inputCardNumber, card.room.id);
    if (normalized) {
      candidates.add(normalized.toUpperCase());
    }

    for (const variant of cardNumberLookupVariants(
      inputCardNumber,
      card.room.id,
    )) {
      candidates.add(variant.toUpperCase());
    }

    for (const candidate of candidates) {
      if (registeredSet.has(candidate)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verify if a card wins with given pattern
   * Includes: last-called-number rule, match registration, normalized card lookup
   */
  async verify(verifyDto: VerifyCardDto): Promise<{
    isValid: boolean;
    winningPattern?: number[][];
    winningPatterns?: number[][][]; // NEW: Array of all matching patterns
    patternNames?: string[]; // NEW: Names of all matching patterns
    markedCells?: boolean[][];
    message: string;
    cardLocked?: boolean;
    specialWin?: boolean;
    lastCalledNumber?: number; // NEW: The number that completed the win
    unregistered?: boolean; // NEW: Flag for unregistered cards
    lateClaim?: boolean; // NEW: Flag for late claims (pattern completed earlier)
  }> {
    const card = await this.resolveCardForVerify(verifyDto.cardNumber);
    const canonicalCardNumber = card?.cardNumber ?? verifyDto.cardNumber;

    if (!card) {
      this.logger.warn(
        `Verification failed: Card ${verifyDto.cardNumber} not found`,
      );
      return {
        isValid: false,
        message: 'Card not found',
      };
    }

    const room = card.room;
    if (room?.currentMatch) {
      const registeredCards = room.currentMatch.registeredCards || [];
      const isRegistered = this.isCardRegisteredForMatch(
        card,
        verifyDto.cardNumber,
        registeredCards,
      );

      if (!isRegistered) {
        this.logger.warn(
          `Verification BLOCKED: Card ${canonicalCardNumber} is NOT registered for this match`,
        );
        this.logger.warn(`Registered cards: ${registeredCards.join(', ')}`);
        return {
          isValid: false,
          message: `Card ${canonicalCardNumber} was not registered for this game. Only registered cards can win.`,
          unregistered: true,
        };
      }

      this.logger.log(
        `✅ Card ${canonicalCardNumber} is registered for this match`,
      );
    } else {
      this.logger.warn(
        `Verification BLOCKED: No active match in room for card ${canonicalCardNumber}`,
      );
      return {
        isValid: false,
        message:
          'No active game in this room. Start a match before verifying cards.',
      };
    }

    if (card.isLocked) {
      this.logger.warn(
        `Verification failed: Card ${verifyDto.cardNumber} is locked`,
      );
      return {
        isValid: false,
        message: 'Card is locked due to previous wrong claim',
        cardLocked: true,
      };
    }

    const grid = (
      Array.isArray(card.grid) ? card.grid : await this.normalizeCardGrid(card)
    ) as number[][];
    const calledNumbers = normalizeCalledNumbers(verifyDto.calledNumbers);
    const pattern = normalizeVerifyPattern(verifyDto.pattern);

    this.logger.log(
      `Verifying card ${canonicalCardNumber} with pattern: ${pattern}`,
    );
    this.logger.log(
      `Called numbers (${calledNumbers.length}): ${calledNumbers.join(', ')}`,
    );

    const lastCalledNumber =
      calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null;
    this.logger.log(`Last called number: ${lastCalledNumber}`);

    const markedCells = buildMarkedCells(grid, calledNumbers);

    if (calledNumbers.length === 0) {
      return {
        isValid: false,
        markedCells,
        message: 'No numbers have been called yet',
      };
    }

    // Special Rule: 12+ calls and zero marked non-free cells = unlucky winner
    if (calledNumbers.length >= 12) {
      const markedCount = countMarkedNonFreeCells(grid, calledNumbers);
      if (markedCount === 0) {
        this.logger.log(
          `Special win! Card ${canonicalCardNumber} has zero marked numbers`,
        );
        return {
          isValid: true,
          winningPattern: [[2, 2]],
          winningPatterns: [[[2, 2]]],
          patternNames: ['Special Win'],
          markedCells,
          message:
            'Special win! No numbers marked after 12 calls - Unlucky Winner!',
          specialWin: true,
          lastCalledNumber: lastCalledNumber || 0,
        };
      }
    }

    const patternOptions = this.getPatternCoordinates(pattern);
    if (!patternOptions.length) {
      this.logger.warn(`Unsupported pattern: ${verifyDto.pattern}`);
      return {
        isValid: false,
        markedCells,
        message: `Unsupported pattern: ${verifyDto.pattern || 'unknown'}`,
      };
    }

    const { validNow, validNowNames, lateOnly, lateOnlyNames } =
      evaluatePatternWins(
        grid,
        markedCells,
        patternOptions,
        lastCalledNumber,
        (index) => this.getPatternName(pattern, index),
      );

    if (validNow.length > 0) {
      this.logger.log(
        `✅ Valid ${pattern} win for card ${canonicalCardNumber} on number ${lastCalledNumber}`,
      );
      return {
        isValid: true,
        winningPattern: validNow[0],
        winningPatterns: validNow,
        patternNames: validNowNames,
        markedCells,
        message: `Valid ${pattern} win! (${validNow.length} pattern${
          validNow.length > 1 ? 's' : ''
        } matched on number ${lastCalledNumber})`,
        lastCalledNumber: lastCalledNumber || 0,
      };
    }

    if (lateOnly.length > 0) {
      this.logger.warn(
        `❌ Card ${canonicalCardNumber} completed pattern before last call (${lastCalledNumber})`,
      );
      return {
        isValid: false,
        winningPattern: lateOnly[0],
        winningPatterns: lateOnly,
        patternNames: lateOnlyNames,
        markedCells,
        message: `Pattern was completed earlier, not on the current number (${lastCalledNumber}). You must call BINGO immediately when you win!`,
        lateClaim: true,
      };
    }

    this.logger.warn(
      `❌ No valid ${pattern} pattern found for card ${canonicalCardNumber}`,
    );
    return {
      isValid: false,
      markedCells,
      message: `No valid ${pattern} pattern found`,
    };
  }

  /**
   * Get human-readable pattern name
   */
  private getPatternName(pattern: string, index: number): string {
    switch (pattern) {
      case 'horizontal':
        return `Horizontal Row ${index + 1}`;
      case 'vertical':
        return `Vertical Column ${index + 1}`;
      case 'diagonal':
        return index === 0 ? 'Diagonal (\\)' : 'Diagonal (/)';
      case 'anyline':
        if (index < 5) return `Horizontal Row ${index + 1}`;
        if (index < 10) return `Vertical Column ${index - 4}`;
        return index === 10 ? 'Diagonal (\\)' : 'Diagonal (/)';
      case 'corners':
        return 'Four Corners';
      case 'x':
        return 'X Pattern';
      case 't':
        return 'T Pattern';
      case 'l':
        return 'L Pattern';
      case 'fullhouse':
        return 'Full House';
      default:
        return `Pattern ${index + 1}`;
    }
  }

  /**
   * Get cards by room
   */
  async findByRoom(roomId: number): Promise<Card[]> {
    const cards = await this.cardRepository.find({
      where: { room: { id: roomId } },
      relations: ['assignedUser'],
    });
    return (await Promise.all(
      cards.map(async (card) => ({
        ...card,
        grid: await this.normalizeCardGrid(card),
      })),
    )) as unknown as Card[];
  }

  /**
   * Delete card
   */
  async remove(id: number): Promise<void> {
    await this.cardRepository.delete(id);
  }
}
