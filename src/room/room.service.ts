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

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,

    @InjectRepository(RoomPrize)
    private readonly roomPrizeRepository: Repository<RoomPrize>,

    @InjectRepository(RoomManager)
    private readonly roomManagerRepository: Repository<RoomManager>,

    @Inject(forwardRef(() => MatchService))
    private readonly matchService: MatchService,

    private readonly socketsGateway: SocketsGateway,
  ) {}

  async create(user: User, createRoomDto: CreateRoomDto): Promise<Room> {
    const room = await this.roomRepository.save({
      ...createRoomDto,
      owner: user,
      roomPrize: new RoomPrize(),
    });

    this.socketsGateway.server.emit(NEW_ROOM_AVAILABLE_EVENT);
    // await this.startMatch(room, createRoomDto.soldCards);

    return this.findOne(room.id);
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

  async startMatch(room: Room, soldCards: number): Promise<Match> {
    const match = await this.matchService.create(room, { soldCards });
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
