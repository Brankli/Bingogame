import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { VerifyCardDto } from './dto/verify-card.dto';
import { AssignCardDto } from './dto/assign-card.dto';
import { LockCardDto } from './dto/lock-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cards')
@UseGuards(JwtAuthGuard)
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Post()
  async create(@Body() createCardDto: CreateCardDto) {
    return this.cardService.create(createCardDto);
  }

  @Post('bulk-generate')
  async generateBulk(@Body() body: { roomId?: number }) {
    return this.cardService.generateBulkCards(body.roomId);
  }

  @Post('verify')
  async verify(@Body() verifyDto: VerifyCardDto) {
    return this.cardService.verify(verifyDto);
  }

  @Post('assign')
  async assignCard(@Body() assignDto: AssignCardDto) {
    return this.cardService.assignCardToUser(
      assignDto.cardNumber,
      assignDto.userId,
      assignDto.roomId,
    );
  }

  @Post('unassign/:cardNumber')
  async unassignCard(@Param('cardNumber') cardNumber: string) {
    return this.cardService.unassignCard(cardNumber);
  }

  @Post('lock')
  async lockCard(@Body() lockDto: LockCardDto) {
    return this.cardService.lockCard(lockDto.cardNumber, lockDto.matchId);
  }

  @Post('unlock-match/:matchId')
  async unlockMatch(@Param('matchId', ParseIntPipe) matchId: number) {
    await this.cardService.unlockCardsForMatch(matchId);
    return { message: 'Cards unlocked' };
  }

  @Get('room/:roomId')
  async findByRoom(
    @Param('roomId', ParseIntPipe) roomId: number,
    @Query('summary') summary?: string,
  ) {
    return this.cardService.findByRoom(roomId, summary === 'true');
  }

  @Get('user/:userId/room/:roomId')
  async getUserCardsInRoom(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('roomId', ParseIntPipe) roomId: number,
  ) {
    return this.cardService.getUserCardsInRoom(userId, roomId);
  }

  @Get('available')
  async getAvailable() {
    return this.cardService.getAvailableCards();
  }

  @Get()
  async findAll() {
    return this.cardService.findAll();
  }

  @Get(':identifier')
  async findOne(@Param('identifier') identifier: string) {
    return this.cardService.findOne(identifier);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.cardService.remove(id);
  }
}
