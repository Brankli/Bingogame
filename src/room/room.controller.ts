import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ForbiddenException,
  UseGuards,
  ParseIntPipe,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { mapToRoomDto, RoomDto } from './dto/room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { TicketPriceDto } from './dto/ticket-price.dto';
import { ResetPrizeDto } from './dto/reset-prize.dto';
import {
  BINGO_BRONZE_START_BALLS,
  BINGO_ONE_START_BALLS,
  BINGO_SUPER_START_BALLS,
} from './consts/room.consts';
import { AssignManagerDto } from './dto/assign-manager.dto';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoomManagerGuard } from '../auth/guards/room-manager.guard';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  async create(@User() user, @Body() createRoomDto: CreateRoomDto) {
    const { room, cardGeneration } = await this.roomService.create(
      user,
      createRoomDto,
    );
    return {
      ...mapToRoomDto(room),
      cardGeneration,
    };
  }

  @Get()
  async findAll(): Promise<RoomDto[]> {
    return this.roomService.findAll().then((rooms) => rooms.map(mapToRoomDto));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('static-card-library/status')
  getStaticCardLibraryStatus() {
    return this.roomService.getStaticCardLibraryStatus();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('static-card-library/generate')
  generateStaticCardLibrary(@Body() body: { reset?: boolean } = {}) {
    return this.roomService.generateStaticCardLibrary(Boolean(body.reset));
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<RoomDto> {
    const room = await this.roomService.findOne(id, {
      relations: { owner: true },
    });
    return mapToRoomDto(room);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomService.remove(+id);
  }

  @UseGuards(JwtAuthGuard, RoomManagerGuard)
  @Post(':id/ticket-price')
  async ticketPrice(
    @Param('id') id: number,
    @Body() ticketPriceDto: TicketPriceDto,
  ): Promise<RoomDto> {
    const room = await this.roomService.update(id, {
      ticketPrice: +ticketPriceDto.ticketPrice,
    });
    return mapToRoomDto(room);
  }

  @UseGuards(JwtAuthGuard, RoomManagerGuard)
  @Post(':id/reset-prize')
  async resetPrize(
    @Param('id') id: number,
    @Body() resetPrizeDto: ResetPrizeDto,
  ): Promise<RoomDto> {
    await this.roomService.closeMatches(id);
    let room = await this.roomService.findOne(id);

    const roomPrize = room.roomPrize;
    switch (resetPrizeDto.prizeToReset) {
      case 'bingo-one':
        roomPrize.onePrice = 0;
        roomPrize.oneBalls = BINGO_ONE_START_BALLS;
        break;
      case 'super-bingo':
        roomPrize.superPrice = 0;
        roomPrize.superBalls = BINGO_SUPER_START_BALLS;
        break;
      case 'bingo-bronze':
        roomPrize.bronzePrice = 0;
        roomPrize.bronzeBalls = BINGO_BRONZE_START_BALLS;
        break;
    }

    room = await this.roomService.update(id, { roomPrize });
    return mapToRoomDto(room);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('assign-manager')
  async assignManager(@Body() assignManagerDto: AssignManagerDto) {
    return this.roomService.assignManager(
      assignManagerDto.userId,
      assignManagerDto.roomId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('remove-manager')
  async removeManager(@Body() assignManagerDto: AssignManagerDto) {
    await this.roomService.removeManager(
      assignManagerDto.userId,
      assignManagerDto.roomId,
    );
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId/managed')
  async getUserManagedRooms(@Param('userId') userId: number, @User() user) {
    const requestedUserId = Number(userId);
    const requesterIsAdmin = user?.role === UserRole.ADMIN;
    if (!requesterIsAdmin && user?.id !== requestedUserId) {
      throw new ForbiddenException(
        'You can only access your own managed rooms',
      );
    }

    const rooms = await this.roomService.getUserManagedRooms(requestedUserId);
    return rooms.map(mapToRoomDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/can-manage')
  async canManageRoom(@Param('id') roomId: number, @User() user) {
    const canManage = await this.roomService.canManageRoom(
      user.id,
      roomId,
      user.role,
    );
    return { canManage };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('cleanup-invalid-managers')
  async cleanupInvalidManagers() {
    const count = await this.roomService.cleanupInvalidManagers();
    return {
      success: true,
      message: `Cleaned up ${count} invalid manager assignment(s)`,
      count,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id/card-status')
  async getRoomCardStatus(@Param('id', ParseIntPipe) id: number) {
    return this.roomService.getRoomCardStatus(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id/cards/preview')
  async previewRoomCard(
    @Param('id', ParseIntPipe) id: number,
    @Query('index') index?: string,
  ) {
    const cardIndex = index ? parseInt(index, 10) : 1;
    return this.roomService.previewRoomCard(id, cardIndex);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get(':id/cards/export')
  async exportRoomCards(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const csv = await this.roomService.exportRoomCardsCsv(id);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="room-${id}-cards.csv"`,
    );
    res.send(csv);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/generate-cards')
  async generateCardsForRoom(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reset?: boolean } = {},
  ) {
    const result = await this.roomService.generateCardsForExistingRoom(id, body);
    return {
      success: result.status !== 'failed',
      ...result,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/copy-cards')
  async copyCardsFromRoom(
    @Param('id', ParseIntPipe) targetRoomId: number,
    @Body() body: { sourceRoomId: number },
  ) {
    const result = await this.roomService.copyCardsFromRoom(
      body.sourceRoomId,
      targetRoomId,
    );
    return {
      success: true,
      ...result,
    };
  }
}
