import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomManager } from '../../room/entities/room-manager.entity';
import { UserRole } from '../../user/entities/user.entity';

@Injectable()
export class RoomManagerGuard implements CanActivate {
  constructor(
    @InjectRepository(RoomManager)
    private roomManagerRepository: Repository<RoomManager>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const roomId = +request.params.id || +request.body.roomId;

    if (!user || !roomId) {
      throw new ForbiddenException('User or room not found');
    }

    // Admins can manage any room
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Check if user is assigned as manager for this room
    const manager = await this.roomManagerRepository.findOne({
      where: {
        user: { id: user.id },
        room: { id: roomId },
      },
    });

    if (!manager) {
      throw new ForbiddenException('You are not authorized to manage this room');
    }

    return true;
  }
}
