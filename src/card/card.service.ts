import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { VerifyCardDto } from './dto/verify-card.dto';

@Injectable()
export class CardService {
  private readonly logger = new Logger(CardService.name);

  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  /**
   * Generate a valid 5x5 Bingo card following B-I-N-G-O column rules
   * B: 1-15, I: 16-30, N: 31-45, G: 46-60, O: 61-75
   * Center cell [2][2] is FREE space (0)
   * Uses seed for reproducible cards
   */
  generateCard(seed?: number): number[][] {
    const grid: number[][] = [];
    const columnRanges = [
      [1, 15],   // B
      [16, 30],  // I
      [31, 45],  // N
      [46, 60],  // G
      [61, 75],  // O
    ];

    // Simple seeded random function for reproducible results
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    let currentSeed = seed || Date.now();

    for (let col = 0; col < 5; col++) {
      const [min, max] = columnRanges[col];
      const availableNumbers = Array.from(
        { length: max - min + 1 },
        (_, i) => min + i,
      );

      // Shuffle using seeded random
      for (let i = availableNumbers.length - 1; i > 0; i--) {
        const j = Math.floor(seededRandom(currentSeed++) * (i + 1));
        [availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]];
      }

      const columnNumbers = availableNumbers.slice(0, 5).sort((a, b) => a - b);

      for (let row = 0; row < 5; row++) {
        if (!grid[row]) grid[row] = [];
        // Center cell is FREE space
        if (row === 2 && col === 2) {
          grid[row][col] = 0; // 0 represents FREE
        } else {
          grid[row][col] = columnNumbers[row];
        }
      }
    }

    return grid;
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
  async generateBulkCards(roomId?: number): Promise<Card[]> {
    const cards: Card[] = [];
    
    for (let i = 1; i <= 400; i++) {
      const cardNumber = roomId 
        ? this.generateCardNumber(i, roomId)
        : this.generateCardNumber(i);
      
      const existingCard = await this.cardRepository.findOne({
        where: { cardNumber },
      });

      if (!existingCard) {
        // Use card index as seed for reproducible cards
        const grid = this.generateCard(i * 1000);
        
        const card = this.cardRepository.create({
          cardNumber,
          grid: JSON.stringify(grid), // Convert to JSON string
          isActive: true,
        });
        cards.push(await this.cardRepository.save(card));
      }
    }

    this.logger.log(`Generated ${cards.length} new cards${roomId ? ` for room ${roomId}` : ''}`);
    return cards;
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
      (row) => Array.isArray(row) && row.length === 5 && row.every((n) => Number.isFinite(n)),
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

    const fallbackGrid = this.generateCard(this.parseCardSeedFromNumber(card.cardNumber));
    await this.cardRepository.update(card.id, { grid: JSON.stringify(fallbackGrid) });
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
      const card = await this.findOne(cardNumber);
      if (!card) {
        throw new NotFoundException(`Card ${cardNumber} not found`);
      }

      await this.cardRepository.update(card.id, {
        isLocked: true,
        lockedInMatch: { id: matchId } as any,
      });

      return this.findOne(cardNumber);
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
        [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], // Row 0
        [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]], // Row 1
        [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]], // Row 2
        [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4]], // Row 3
        [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4]], // Row 4
      ],
      vertical: [
        [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], // Col 0
        [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]], // Col 1
        [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]], // Col 2
        [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3]], // Col 3
        [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4]], // Col 4
      ],
      diagonal: [
        [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]], // Top-left to bottom-right
        [[0, 4], [1, 3], [2, 2], [3, 1], [4, 0]], // Top-right to bottom-left
      ],
      anyline: [
        // Any horizontal line
        [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], // Row 0
        [[1, 0], [1, 1], [1, 2], [1, 3], [1, 4]], // Row 1
        [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]], // Row 2
        [[3, 0], [3, 1], [3, 2], [3, 3], [3, 4]], // Row 3
        [[4, 0], [4, 1], [4, 2], [4, 3], [4, 4]], // Row 4
        // Any vertical line
        [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], // Col 0
        [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]], // Col 1
        [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]], // Col 2
        [[0, 3], [1, 3], [2, 3], [3, 3], [4, 3]], // Col 3
        [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4]], // Col 4
        // Any diagonal line
        [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]], // Top-left to bottom-right
        [[0, 4], [1, 3], [2, 2], [3, 1], [4, 0]], // Top-right to bottom-left
      ],
      corners: [
        [[0, 0], [0, 4], [4, 0], [4, 4]], // Four corners
      ],
      x: [
        [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [0, 4], [1, 3], [3, 1], [4, 0]], // X shape
      ],
      t: [
        [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 2], [3, 2], [4, 2]], // T shape
      ],
      l: [
        [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4]], // L shape
      ],
      fullhouse: [
        // All 25 cells
        Array.from({ length: 25 }, (_, i) => [Math.floor(i / 5), i % 5]),
      ],
    };

    return patterns[pattern.toLowerCase()] || [];
  }

  /**
   * Verify if a card wins with given pattern
   * NOW INCLUDES: Verification that the winning pattern was completed on the LAST called number
   * AND: Verification that the card is registered for the current match
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
    const card = await this.findOne(verifyDto.cardNumber);

    if (!card) {
      this.logger.warn(`Verification failed: Card ${verifyDto.cardNumber} not found`);
      return {
        isValid: false,
        message: 'Card not found',
      };
    }

    // Check if card is registered for the current match
    try {
      const room = card.room;
      if (room?.currentMatch) {
        const registeredCards = room.currentMatch.registeredCards || [];
        const isRegistered = registeredCards.includes(verifyDto.cardNumber);
        
        if (!isRegistered) {
          this.logger.warn(`Verification BLOCKED: Card ${verifyDto.cardNumber} is NOT registered for this match`);
          this.logger.warn(`Registered cards: ${registeredCards.join(', ')}`);
          return {
            isValid: false,
            message: `Card ${verifyDto.cardNumber} was not registered for this game. Only registered cards can win.`,
            unregistered: true,
          };
        }
        
        this.logger.log(`✅ Card ${verifyDto.cardNumber} is registered for this match`);
      } else {
        this.logger.warn(`⚠️ No current match found for room, skipping registration check`);
      }
    } catch (error) {
      this.logger.error(`Error checking card registration:`, error);
      // Continue with verification if registration check fails
    }

    if (card.isLocked) {
      this.logger.warn(`Verification failed: Card ${verifyDto.cardNumber} is locked`);
      return {
        isValid: false,
        message: 'Card is locked due to previous wrong claim',
        cardLocked: true,
      };
    }

    const grid = (Array.isArray(card.grid)
      ? card.grid
      : await this.normalizeCardGrid(card)) as number[][];
    const calledNumbers = Array.isArray(verifyDto.calledNumbers)
      ? verifyDto.calledNumbers.filter((n) => Number.isFinite(n))
      : [];
    const pattern = String(verifyDto.pattern || '').toLowerCase();

    this.logger.log(`Verifying card ${verifyDto.cardNumber} with pattern: ${pattern}`);
    this.logger.log(`Called numbers (${calledNumbers.length}): ${calledNumbers.join(', ')}`);
    this.logger.log(`Card grid: ${JSON.stringify(grid)}`);

    // Get the last called number
    const lastCalledNumber = calledNumbers.length > 0 ? calledNumbers[calledNumbers.length - 1] : null;
    this.logger.log(`Last called number: ${lastCalledNumber}`);

    // Create marked cells matrix
    const markedCells: boolean[][] = grid.map((row) =>
      row.map((num) => num === 0 || calledNumbers.includes(num)),
    );

    this.logger.log(`Marked cells: ${JSON.stringify(markedCells)}`);

    // Special Rule: If 12 or more numbers have been called and card has ZERO marked numbers (excluding FREE space)
    // then the card automatically wins regardless of pattern
    if (calledNumbers.length >= 12) {
      // Count marked cells (excluding FREE space at [2,2])
      let markedCount = 0;
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          // Skip FREE space
          if (row === 2 && col === 2) continue;
          
          const cellValue = grid[row][col];
          if (cellValue !== 0 && calledNumbers.includes(cellValue)) {
            markedCount++;
          }
        }
      }

      // If zero numbers are marked (unlucky card), it wins!
      if (markedCount === 0) {
        this.logger.log(`Special win! Card ${verifyDto.cardNumber} has zero marked numbers`);
        return {
          isValid: true,
          winningPattern: [[2, 2]], // Just highlight the FREE space
          winningPatterns: [[[2, 2]]],
          patternNames: ['Special Win'],
          markedCells,
          message: 'Special win! No numbers marked after 12 calls - Unlucky Winner!',
          specialWin: true,
          lastCalledNumber: lastCalledNumber || 0,
        };
      }
    }

    // Get pattern coordinates
    const patternOptions = this.getPatternCoordinates(pattern);
    if (!patternOptions.length) {
      this.logger.warn(`Unsupported pattern: ${pattern}`);
      return {
        isValid: false,
        markedCells,
        message: `Unsupported pattern: ${verifyDto.pattern || 'unknown'}`,
      };
    }

    this.logger.log(`Pattern options for ${pattern}: ${JSON.stringify(patternOptions)}`);

    // NEW: Collect ALL matching patterns and check if they were completed on the last called number
    const allMatchingPatterns: number[][][] = [];
    const allPatternNames: string[] = [];
    let winCompletedOnLastNumber = false;

    // Check if any pattern option matches
    for (let i = 0; i < patternOptions.length; i++) {
      const patternCoords = patternOptions[i];
      const allMarked = patternCoords.every(([row, col]) => {
        if (
          !Number.isInteger(row) ||
          !Number.isInteger(col) ||
          row < 0 ||
          row >= 5 ||
          col < 0 ||
          col >= 5
        ) {
          return false;
        }
        const isMarked = Boolean(markedCells[row]?.[col]);
        this.logger.debug(`Checking cell [${row},${col}] (value: ${grid[row][col]}): ${isMarked ? 'MARKED' : 'NOT MARKED'}`);
        return isMarked;
      });

      if (allMarked) {
        // Check if this pattern was completed by the last called number
        const patternContainsLastNumber = patternCoords.some(([row, col]) => {
          const cellValue = grid[row][col];
          return cellValue === lastCalledNumber;
        });

        if (patternContainsLastNumber) {
          winCompletedOnLastNumber = true;
        }

        allMatchingPatterns.push(patternCoords);
        // Generate pattern name based on type
        const patternName = this.getPatternName(pattern, i, patternOptions.length);
        allPatternNames.push(patternName);
        this.logger.log(`✅ Found matching pattern: ${patternName} (completed on last number: ${patternContainsLastNumber})`);
      }
    }

    // If we found at least one matching pattern
    if (allMatchingPatterns.length > 0) {
      // NEW: Check if the win was completed on the last called number
      if (!winCompletedOnLastNumber && lastCalledNumber !== null) {
        this.logger.warn(`❌ Card ${verifyDto.cardNumber} has winning pattern(s) but they were NOT completed on the last called number (${lastCalledNumber})`);
        return {
          isValid: false,
          winningPattern: allMatchingPatterns[0], // Include pattern for display
          winningPatterns: allMatchingPatterns, // Include all patterns for display
          patternNames: allPatternNames, // Include pattern names for display
          markedCells,
          message: `Pattern was completed earlier, not on the current number (${lastCalledNumber}). You must call BINGO immediately when you win!`,
          lateClaim: true, // Flag to indicate this is a late claim
        };
      }

      this.logger.log(`✅ Valid ${pattern} win for card ${verifyDto.cardNumber}! Found ${allMatchingPatterns.length} matching pattern(s) completed on number ${lastCalledNumber}`);
      return {
        isValid: true,
        winningPattern: allMatchingPatterns[0], // Keep first pattern for backward compatibility
        winningPatterns: allMatchingPatterns, // NEW: All matching patterns
        patternNames: allPatternNames, // NEW: Names of all patterns
        markedCells,
        message: `Valid ${pattern} win! (${allMatchingPatterns.length} pattern${allMatchingPatterns.length > 1 ? 's' : ''} matched on number ${lastCalledNumber})`,
        lastCalledNumber: lastCalledNumber || 0,
      };
    }

    this.logger.warn(`❌ No valid ${pattern} pattern found for card ${verifyDto.cardNumber}`);
    return {
      isValid: false,
      markedCells,
      message: `No valid ${pattern} pattern found`,
    };
  }

  /**
   * Get human-readable pattern name
   */
  private getPatternName(pattern: string, index: number, total: number): string {
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
