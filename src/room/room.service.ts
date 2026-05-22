import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import { RoomManager } from './entities/room-manager.entity';
import { CardService } from '../card/card.service';
import { Card } from '../card/entities/card.entity';
import { CreateMatchDto } from '../match/dto/create-match.dto';

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

  async create(user: User, createRoomDto: CreateRoomDto): Promise<Room> {
    const room = await this.roomRepository.save({
      ...createRoomDto,
      owner: user,
      roomPrize: new RoomPrize(),
    });

    console.log(`[RoomService] Room created with ID: ${room.id}, generating cards...`);
    
    // Automatically generate 400 cards for this room
    try {
      await this.generateCardsForRoom(room.id);
      console.log(`[RoomService] Successfully generated cards for room ${room.id}`);
    } catch (error) {
      console.error(`[RoomService] Error generating cards for room ${room.id}:`, error);
    }

    this.socketsGateway.server.emit(NEW_ROOM_AVAILABLE_EVENT);
    // await this.startMatch(room, createRoomDto.soldCards);

    return this.findOne(room.id);
  }

  /**
   * Generate 400 unique cards for a specific room
   */
  private async generateCardsForRoom(roomId: number): Promise<void> {
    console.log(`[RoomService] Starting card generation for room ${roomId}...`);
    const cards: Card[] = [];
    
    for (let i = 1; i <= 400; i++) {
      // Generate unique card number for this room (matching frontend format)
      const cardNumber = `ROOM${roomId}-CAR${String(i).padStart(4, '0')}`;
      
      // Check if card already exists
      const existingCard = await this.cardRepository.findOne({
        where: { cardNumber },
      });

      if (!existingCard) {
        // Use room ID and card index as seed for reproducible cards
        const seed = roomId * 10000 + i * 1000;
        const grid = this.cardService.generateCard(seed);
        
        const card = this.cardRepository.create({
          cardNumber,
          grid: JSON.stringify(grid),
          isActive: true,
          room: { id: roomId } as Room,
        });
        cards.push(card);
      }
    }

    console.log(`[RoomService] Created ${cards.length} card entities, saving to database...`);
    
    if (cards.length > 0) {
      await this.cardRepository.save(cards);
      console.log(`[RoomService] Successfully saved ${cards.length} cards to database`);
    } else {
      console.log(`[RoomService] No new cards to save (all already exist)`);
    }
  }

  /**
   * Public method to generate cards for existing rooms
   */
  async generateCardsForExistingRoom(roomId: number): Promise<{ generated: number }> {
    const room = await this.findOne(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Count existing cards for this room
    const existingCount = await this.cardRepository.count({
      where: { room: { id: roomId } },
    });

    if (existingCount >= 400) {
      return { generated: 0 };
    }

    await this.generateCardsForRoom(roomId);

    // Count cards after generation
    const newCount = await this.cardRepository.count({
      where: { room: { id: roomId } },
    });

    return { generated: newCount - existingCount };
  }

  /**
   * Copy cards from one room to another
   */
  async copyCardsFromRoom(sourceRoomId: number, targetRoomId: number): Promise<{ copied: number }> {
    const sourceRoom = await this.findOne(sourceRoomId);
    const targetRoom = await this.findOne(targetRoomId);
    
    if (!sourceRoom) {
      throw new NotFoundException('Source room not found');
    }
    if (!targetRoom) {
      throw new NotFoundException('Target room not found');
    }

    // Get all cards from source room
    const sourceCards = await this.cardRepository.find({
      where: { room: { id: sourceRoomId } },
      order: { cardNumber: 'ASC' },
    });

    if (sourceCards.length === 0) {
      throw new NotFoundException('Source room has no cards to copy');
    }

    // Check if target room already has cards
    const existingCount = await this.cardRepository.count({
      where: { room: { id: targetRoomId } },
    });

    if (existingCount > 0) {
      throw new Error('Target room already has cards. Delete them first or choose a different room.');
    }

    // Copy cards to target room
    const newCards: Card[] = [];
    for (const sourceCard of sourceCards) {
      // Parse the grid
      let grid: number[][];
      try {
        grid = typeof sourceCard.grid === 'string' 
          ? JSON.parse(sourceCard.grid) 
          : sourceCard.grid;
      } catch {
        grid = this.cardService.generateCard(Date.now());
      }

      // Create new card number for target room
      const cardIndex = sourceCard.cardNumber.match(/CARD(\d+)/)?.[1] || '001';
      const newCardNumber = `ROOM${targetRoomId}-CARD${cardIndex}`;

      const newCard = this.cardRepository.create({
        cardNumber: newCardNumber,
        grid: JSON.stringify(grid),
        isActive: true,
        room: { id: targetRoomId } as Room,
      });
      newCards.push(newCard);
    }

    await this.cardRepository.save(newCards);

    return { copied: newCards.length };
  }

  async findAll(): Promise<Room[]> {
    return await this.roomRepository.find({
      relations: {
        owner: true,
        currentUsers: true,
        roomPrize: true,
        currentMatch: {
          matchNumbers: true,
        },
        matches: true,
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
        matches: true,
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
    const room = await this.findOne(roomId);
    for await (const match of room.matches) {
      // Unlock all cards for this match before closing
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

  async canManageRoom(userId: number, roomId: number, userRole: string): Promise<boolean> {
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
    const invalidManagers = allManagers.filter(m => !m.user);
    
    // Delete invalid assignments
    if (invalidManagers.length > 0) {
      await this.roomManagerRepository.remove(invalidManagers);
    }

    return invalidManagers.length;
  }
}
