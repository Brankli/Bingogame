import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Body,
  Req,
  UseGuards,
  SetMetadata,
  Inject,
  forwardRef,
} from '@nestjs/common';

import { RoomCreditService } from './room-credit.service';
import { TopUpRoomCreditDto } from './dto/top-up-room-credit.dto';

// Adjust these import paths to match your existing project.
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../user/entities/user.entity';
import { SocketsGateway } from '../sockets/sockets.gateway';

@Controller('admin/rooms/:roomId/credits')
@UseGuards(JwtAuthGuard, RolesGuard)
@SetMetadata('roles', [UserRole.ADMIN])
export class RoomCreditController {
  constructor(
    private readonly roomCreditService: RoomCreditService,
    @Inject(forwardRef(() => SocketsGateway))
    private readonly socketsGateway: SocketsGateway,
  ) {}

  @Get()
  async getBalance(@Param('roomId', ParseIntPipe) roomId: number) {
    const balance = await this.roomCreditService.getBalance(roomId);

    return { roomId, balance };
  }

  @Get('transactions')
  async getHistory(@Param('roomId', ParseIntPipe) roomId: number) {
    return this.roomCreditService.getHistory(roomId);
  }

  @Post('top-up')
  async topUp(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Body() dto: TopUpRoomCreditDto,
    @Req() request: any,
  ) {
    // The authenticated JWT strategy should set request.user.
    const adminUserId = Number(request.user?.id ?? request.user?.userId);

    if (!Number.isSafeInteger(adminUserId) || adminUserId <= 0) {
      throw new Error('Could not identify the authenticated administrator');
    }

    const result = await this.roomCreditService.topUp(
      roomId,
      dto.amount,
      adminUserId,
      dto.note,
    );

    this.socketsGateway.notifyRoomCredits(result);

    return {
      message: 'Room credits added successfully',
      ...result,
    };
  }
}
