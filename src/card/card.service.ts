import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { VerifyCardDto } from './dto/verify-card.dto';

@Injectable()
export class CardService {
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
   */
  generateCardNumber(index?: number): string {
    if (index !== undefined) {
      // Format: CARD-001, CARD-002, etc.
      return `CARD-${String(index).padStart(3, '0')}`;
    }
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `CARD-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate 400 pre-registered cards with static grids
   */
  async generateBulkCards(): Promise<Card[]> {
    const cards: Card[] = [];
    
    for (let i = 1; i <= 400; i++) {
      const cardNumber = this.generateCardNumber(i);
      
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
        relations: ['assignedUser', 'room'],
      });
    } else {
      card = await this.cardRepository.findOne({
        where: { cardNumber: identifier },
        relations: ['assignedUser', 'room'],
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
    const card = await this.findOne(cardNumber);
    if (!card) {
      throw new Error('Card not found');
    }

    await this.cardRepository.update(card.id, {
      isLocked: true,
      lockedInMatch: { id: matchId } as any,
    });

    return this.findOne(cardNumber);
  }

  /**
   * Unlock all cards for a match (when match ends)
   */
  async unlockCardsForMatch(matchId: number): Promise<void> {
    await this.cardRepository.update(
      { lockedInMatch: { id: matchId } as any },
      { isLocked: false, lockedInMatch: null },
    );
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
   */
  async verify(verifyDto: VerifyCardDto): Promise<{
    isValid: boolean;
    winningPattern?: number[][];
    markedCells?: boolean[][];
    message: string;
    cardLocked?: boolean;
    specialWin?: boolean;
  }> {
    const card = await this.findOne(verifyDto.cardNumber);

    if (!card) {
      return {
        isValid: false,
        message: 'Card not found',
      };
    }

    if (card.isLocked) {
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

    // Create marked cells matrix
    const markedCells: boolean[][] = grid.map((row) =>
      row.map((num) => num === 0 || calledNumbers.includes(num)),
    );

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
        return {
          isValid: true,
          winningPattern: [[2, 2]], // Just highlight the FREE space
          markedCells,
          message: 'Special win! No numbers marked after 12 calls - Unlucky Winner!',
          specialWin: true,
        };
      }
    }

    // Get pattern coordinates
    const patternOptions = this.getPatternCoordinates(pattern);
    if (!patternOptions.length) {
      return {
        isValid: false,
        markedCells,
        message: `Unsupported pattern: ${verifyDto.pattern || 'unknown'}`,
      };
    }

    // Check if any pattern option matches
    for (const patternCoords of patternOptions) {
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
        return Boolean(markedCells[row]?.[col]);
      });

      if (allMarked) {
        return {
          isValid: true,
          winningPattern: patternCoords,
          markedCells,
          message: `Valid ${pattern} win!`,
        };
      }
    }

    return {
      isValid: false,
      markedCells,
      message: `No valid ${pattern} pattern found`,
    };
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
