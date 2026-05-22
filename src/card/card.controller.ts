import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { VerifyCardDto } from './dto/verify-card.dto';
import { AssignCardDto } from './dto/assign-card.dto';
import { LockCardDto } from './dto/lock-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createCardDto: CreateCardDto) {
    return this.cardService.create(createCardDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk-generate')
  async generateBulk(@Body() body: { roomId?: number }) {
    return this.cardService.generateBulkCards(body.roomId);
  }

  @Get()
  async findAll() {
    return this.cardService.findAll();
  }

  @Get('available')
  async getAvailable() {
    return this.cardService.getAvailableCards();
  }

  @Get(':identifier')
  async findOne(@Param('identifier') identifier: string) {
    return this.cardService.findOne(identifier);
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verify(@Body() verifyDto: VerifyCardDto) {
    return this.cardService.verify(verifyDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('assign')
  async assignCard(@Body() assignDto: AssignCardDto) {
    return this.cardService.assignCardToUser(
      assignDto.cardNumber,
      assignDto.userId,
      assignDto.roomId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('unassign/:cardNumber')
  async unassignCard(@Param('cardNumber') cardNumber: string) {
    return this.cardService.unassignCard(cardNumber);
  }

  @UseGuards(JwtAuthGuard)
  @Post('lock')
  async lockCard(@Body() lockDto: LockCardDto) {
    return this.cardService.lockCard(lockDto.cardNumber, lockDto.matchId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('unlock-match/:matchId')
  async unlockMatch(@Param('matchId') matchId: number) {
    await this.cardService.unlockCardsForMatch(matchId);
    return { message: 'Cards unlocked' };
  }

  @Get('room/:roomId')
  async findByRoom(@Param('roomId') roomId: number) {
    return this.cardService.findByRoom(roomId);
  }

  @Get('user/:userId/room/:roomId')
  async getUserCardsInRoom(
    @Param('userId') userId: number,
    @Param('roomId') roomId: number,
  ) {
    return this.cardService.getUserCardsInRoom(userId, roomId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.cardService.remove(id);
  }
}
