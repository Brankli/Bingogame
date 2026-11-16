import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { WsException } from '@nestjs/websockets';
import { forwardRef, Inject, Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomService } from '../room/room.service';
import { WsGuard } from '../auth/guards/ws.guard';
import { User } from '../user/entities/user.entity';
import {
  NEW_MATCH_EVENT,
  ON_ENTER_ROOM_EVENT,
  ON_EXIT_ROOM_EVENT,
  PAUSE_MATCH_EVENT,
  PLAY_MATCH_EVENT,
  PLAYER_JOINED_EVENT,
  PLAYER_WON_EVENT,
  RESET_MATCH_EVENT,
  END_MATCH_EVENT,
} from './consts/sockets.const';
import { MatchService } from '../match/match.service';
import { UserService } from '../user/user.service';
import { getCorsOrigins } from '../config/startup.validation';

function socketCorsOrigin(): string | string[] | boolean {
  const origins = getCorsOrigins();
  if (origins === true) {
    return true;
  }
  if (Array.isArray(origins) && origins.length > 0) {
    return origins;
  }
  return process.env.NODE_ENV === 'production' ? false : true;
}

@WebSocketGateway({ cors: { origin: socketCorsOrigin(), credentials: true } })
export class SocketsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;
  private readonly logger: Logger = new Logger('SocketsGateway');

  constructor(
    @Inject(forwardRef(() => RoomService))
    private readonly roomService: RoomService,

    @Inject(forwardRef(() => MatchService))
    private readonly matchService: MatchService,

    private readonly userService: UserService,
  ) {
    //
  }

  private getAuthenticatedUser(client: Socket): User {
    const user = client?.data?.user as User | undefined;
    if (!user) {
      throw new WsException('Unauthorized socket user');
    }
    return user;
  }

  private async ensureCanManageRoom(user: User, roomId: number): Promise<void> {
    const canManage = await this.roomService.canManageRoom(
      user.id,
      roomId,
      user.role,
    );
    if (!canManage) {
      throw new WsException('Forbidden: insufficient room permissions');
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage(ON_ENTER_ROOM_EVENT)
  async handleOnEnteredRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: number,
  ): Promise<void> {
    const user = this.getAuthenticatedUser(client);
    await this.roomService.join(roomId, user);

    await client.join(roomId.toString());

    this.server
      .to(roomId.toString())
      .emit(PLAYER_JOINED_EVENT, { username: user.username });

    client.on('disconnect', () => {
      this.roomService.leave(roomId, user).catch(() => undefined);
    });
  }

  @UseGuards(WsGuard)
  @SubscribeMessage(ON_EXIT_ROOM_EVENT)
  async handleOnExitRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: number,
  ): Promise<void> {
    const user = this.getAuthenticatedUser(client);
    //await client.leave(roomId.toString());
    await this.roomService.leave(roomId, user);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage(NEW_MATCH_EVENT)
  async handleNewMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: number,
    @MessageBody('soldCards') soldCards: number,
    @MessageBody('houseFeePerCard') houseFeePerCard?: number,
    @MessageBody('betAmount') betAmount?: number,
    @MessageBody('registeredCards') registeredCards?: string[],
    @MessageBody('pattern') pattern?: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `[SocketGateway] ========== NEW MATCH REQUEST ==========`,
      );
      this.logger.log(`[SocketGateway] Room ID: ${roomId}`);
      this.logger.log(`[SocketGateway] Sold Cards: ${soldCards}`);
      this.logger.log(`[SocketGateway] House Fee: ${houseFeePerCard}`);
      this.logger.log(`[SocketGateway] Pattern: ${pattern || 'twoline'}`);
      this.logger.log(`[SocketGateway] Registered Cards:`, registeredCards);

      const user = this.getAuthenticatedUser(client);
      this.logger.log(
        `[SocketGateway] User: ${user.username} (ID: ${user.id})`,
      );

      await this.ensureCanManageRoom(user, roomId);
      this.logger.log(`[SocketGateway] ✅ User authorized to manage room`);

      // Check and deduct credits
      this.logger.log(`[SocketGateway] Checking user credits...`);
      const userWithCredits = await this.userService.findOne(user.id);
      if (!userWithCredits) {
        throw new WsException('User not found');
      }

      const currentCredits = userWithCredits.credits || 0;
      this.logger.log(`[SocketGateway] User has ${currentCredits} credits`);

      if (currentCredits <= 0) {
        this.logger.warn(
          `[SocketGateway] ❌ No credits remaining for user ${user.id}`,
        );
        client.emit('credit-exhausted', {
          message: 'No credits remaining. Contact admin to top up.',
          credits: 0,
        });
        throw new WsException('No credits remaining. Contact admin to top up.');
      }

      // Deduct credit and increment games played
      this.logger.log(`[SocketGateway] Deducting 1 credit...`);
      const creditResult = await this.userService.deductCredit(user.id, roomId);
      this.logger.log(
        `[SocketGateway] ✅ Credit deducted. New balance: ${creditResult.credits}, Games played: ${creditResult.gamesPlayed}`,
      );

      this.logger.log(`[SocketGateway] Closing existing matches...`);
      const room = await this.roomService.closeMatches(roomId);
      this.logger.log(`[SocketGateway] ✅ Existing matches closed`);

      // Calculate commission as a percentage of each card's bet.
      const commissionPercent = Math.min(
        100,
        Math.max(20, Number(houseFeePerCard) || 20),
      );
      const amountPerCard = Math.max(
        0,
        Number(betAmount) || Number(room.ticketPrice) || 0,
      );

      this.logger.log(`[SocketGateway] Starting new match...`);
      await this.roomService.startMatch(room, {
        soldCards,
        betAmount: amountPerCard,
        houseFeePercent: commissionPercent,
        registeredCards: registeredCards || [],
        pattern: pattern || 'twoline',
      });
      this.logger.log(`[SocketGateway] ✅ Match started successfully`);

      const totalHouseFee =
        soldCards * amountPerCard * (commissionPercent / 100);

      // Add earnings to room owner (or the user who started the game)
      const roomOwnerId = room.owner?.id || user.id;
      await this.userService.addEarnings(roomOwnerId, totalHouseFee);

      this.logger.log(
        `[SocketGateway] ✅ Added ${totalHouseFee} Birr house fee to user ${roomOwnerId}`,
      );

      // Emit updated credit info to the client
      client.emit('game-started', {
        success: true,
        credits: creditResult.credits,
        gamesPlayed: creditResult.gamesPlayed,
      });

      this.logger.log(
        `[SocketGateway] ========== NEW MATCH COMPLETE ==========`,
      );
    } catch (error) {
      this.logger.error(`[SocketGateway] ❌ ERROR in handleNewMatch:`, error);
      throw error;
    }
  }

  @UseGuards(WsGuard)
  @SubscribeMessage(PLAY_MATCH_EVENT)
  async handlePlayMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody('matchId') matchId: number,
    @MessageBody('roomId') roomId: number,
  ): Promise<void> {
    const user = this.getAuthenticatedUser(client);
    await this.ensureCanManageRoom(user, roomId);
    this.logger.log(`Match ${matchId} is resuming in room ${roomId}`);
    await this.matchService.start(matchId, roomId);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage(PAUSE_MATCH_EVENT)
  async handlePauseMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody('matchId') matchId: number,
    @MessageBody('roomId') roomId: number,
  ): Promise<void> {
    const user = this.getAuthenticatedUser(client);
    await this.ensureCanManageRoom(user, roomId);
    this.logger.log(`[PAUSE] ========== PAUSE MATCH REQUEST ==========`);
    this.logger.log(`[PAUSE] Match ID: ${matchId}`);
    this.logger.log(`[PAUSE] Room ID: ${roomId}`);
    this.logger.log(`[PAUSE] User: ${user.username}`);
    this.logger.log(`[PAUSE] Calling matchService.close()...`);
    await this.matchService.close(matchId, roomId);
    this.logger.log(`[PAUSE] ✅ Match ${matchId} paused successfully`);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage('change-speed')
  async handleChangeSpeed(
    @ConnectedSocket() client: Socket,
    @MessageBody('matchId') matchId: number,
    @MessageBody('roomId') roomId: number,
    @MessageBody('speed') speed: number,
  ): Promise<void> {
    const user = this.getAuthenticatedUser(client);
    await this.ensureCanManageRoom(user, roomId);
    this.logger.log(`Changing speed for match ${matchId} to ${speed}ms`);
    this.matchService.changeSpeed(matchId, roomId, speed);

    // Notify all clients in the room about speed change
    this.server.to(roomId.toString()).emit('speed-changed', {
      matchId,
      speed,
    });
  }

  @UseGuards(WsGuard)
  @SubscribeMessage(END_MATCH_EVENT)
  async handleEndMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody('matchId') matchId: number,
    @MessageBody('roomId') roomId: number,
    @MessageBody('winners')
    winners?: Array<{ cardNumber?: string; username?: string }>,
  ): Promise<void> {
    const user = this.getAuthenticatedUser(client);
    await this.ensureCanManageRoom(user, roomId);
    this.logger.log(`Match ${matchId} is ending in room ${roomId}`);
    await this.matchService.endMatch(matchId, roomId, winners);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage(RESET_MATCH_EVENT)
  async handleResetMatch(
    @ConnectedSocket() client: Socket,
    @MessageBody('matchId') matchId: number,
    @MessageBody('roomId') roomId: number,
  ): Promise<void> {
    const user = this.getAuthenticatedUser(client);
    await this.ensureCanManageRoom(user, roomId);
    this.logger.log(`Match ${matchId} is being reset`);
    await this.matchService.reset(matchId, roomId);
  }

  @UseGuards(WsGuard)
  @SubscribeMessage(PLAYER_WON_EVENT)
  async handlePlayerWon(
    @ConnectedSocket() client: Socket,
    @MessageBody('roomId') roomId: number,
    @MessageBody('cardNumber') cardNumber: string,
    @MessageBody('pattern') pattern: string,
  ): Promise<void> {
    const user = this.getAuthenticatedUser(client);
    this.logger.log(
      `Player ${user.username} claims BINGO with card ${cardNumber} in room ${roomId}`,
    );

    // Broadcast to all clients in the room that someone claimed BINGO
    this.server.to(roomId.toString()).emit(PLAYER_WON_EVENT, {
      username: user.username,
      cardNumber,
      pattern,
    });
  }

  handleConnection(@ConnectedSocket() client: Socket): any {
    this.logger.log(`Client is connected! ${client.id}`);

    // Debug: Log all incoming events
    client.onAny((eventName, ...args) => {
      this.logger.log(`[Socket Event Received] ${eventName}`, args);
    });
  }

  handleDisconnect(@ConnectedSocket() client: Socket): any {
    this.logger.log(`Client is disconnected! ${client.id}`);
  }

  /**
   * Notify all clients in a room that the credit balance has changed.
   * Called after an admin tops up credits.
   */
  notifyRoomCredits(data: { roomId: number; balance: number }): void {
    this.logger.log(
      `[RoomCredits] Broadcasting credit update to room ${data.roomId}: ${data.balance} credits`,
    );
    this.server.to(data.roomId.toString()).emit('room-credits-updated', data);
  }
}
