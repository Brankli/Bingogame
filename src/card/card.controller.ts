import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { VerifyCardDto } from './dto/verify-card.dto';
import { AssignCardDto } from './dto/assign-card.dto';
import { LockCardDto } from './dto/lock-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { RoomManagerGuard } from '../auth/guards/room-manager.guard';

@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createCardDto: CreateCardDto) {
    return this.cardService.create(createCardDto);
  }

  /** @deprecated Use POST /rooms/:roomId/generate-cards */
  @Post('bulk-generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async generateBulk(@Body() body: { roomId?: number }) {
    if (body?.roomId) {
      throw new BadRequestException(
        `Use POST /rooms/${body.roomId}/generate-cards instead of bulk-generate.`,
      );
    }
    throw new BadRequestException(
      'Global bulk card generation is deprecated. Create or select a room and use POST /rooms/:roomId/generate-cards.',
    );
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verify(@Body() verifyDto: VerifyCardDto) {
    return this.cardService.verify(verifyDto);
  }

  @Post('assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async assignCard(@Body() assignDto: AssignCardDto) {
    return this.cardService.assignCardToUser(
      assignDto.cardNumber,
      assignDto.userId,
      assignDto.roomId,
    );
  }

  @Post('unassign/:cardNumber')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async unassignCard(@Param('cardNumber') cardNumber: string) {
    return this.cardService.unassignCard(cardNumber);
  }

  @Post('lock')
  @UseGuards(JwtAuthGuard, RoomManagerGuard)
  async lockCard(@Body() lockDto: LockCardDto) {
    return this.cardService.lockCard(lockDto.cardNumber, lockDto.matchId);
  }

  @Post('unlock-match/:matchId')
  @UseGuards(JwtAuthGuard, RoomManagerGuard)
  async unlockMatch(@Param('matchId', ParseIntPipe) matchId: number) {
    await this.cardService.unlockCardsForMatch(matchId);
    return { message: 'Cards unlocked' };
  }

  @Get('room/:roomId')
  @UseGuards(JwtAuthGuard)
  async findByRoom(@Param('roomId', ParseIntPipe) roomId: number) {
    return this.cardService.findByRoom(roomId);
  }

  @Get('user/:userId/room/:roomId')
  @UseGuards(JwtAuthGuard)
  async getUserCardsInRoom(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
  ) {
    return this.cardService.getUserCardsInRoom(userId, roomId);
  }

  @Get('available')
  @UseGuards(JwtAuthGuard)
  async getAvailable() {
    return this.cardService.getAvailableCards();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll() {
    return this.cardService.findAll();
  }

  @Get(':identifier')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('identifier') identifier: string) {
    return this.cardService.findOne(identifier);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.cardService.remove(id);
  }
}
