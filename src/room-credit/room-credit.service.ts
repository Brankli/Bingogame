import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { RoomCredit } from './entities/room-credit.entity';
import {
  RoomCreditTransaction,
  RoomCreditTransactionStatus,
  RoomCreditTransactionType,
} from './entities/room-credit-transaction.entity';

export interface CreditReservation {
  idempotencyKey: string;
  roomId: number;
  replayed: boolean;
}

@Injectable()
export class RoomCreditService {
  constructor(private readonly dataSource: DataSource) {}

  private async ensureBalanceRow(
    manager: EntityManager,
    roomId: number,
  ): Promise<void> {
    // INSERT IGNORE is supported by MySQL/MariaDB.
    await manager.query(
      `INSERT IGNORE INTO room_credits (roomId, balance)
       SELECT id, 0 FROM rooms WHERE id = ?`,
      [roomId],
    );

    const row = await manager.findOne(RoomCredit, {
      where: { roomId },
    });

    if (!row) {
      throw new NotFoundException(`Room ${roomId} was not found`);
    }
  }

  async getBalance(roomId: number): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      await this.ensureBalanceRow(manager, roomId);

      const credit = await manager.findOne(RoomCredit, {
        where: { roomId },
      });

      return credit!.balance;
    });
  }

  /**
   * Reserve one credit before closing any existing match.
   * The client must supply a stable UUID per new-game action.
   */
  async reserveForNewMatch(
    roomId: number,
    idempotencyKey: string,
    userId: number,
  ): Promise<CreditReservation> {
    if (
      !idempotencyKey ||
      idempotencyKey.length > 128
    ) {
      throw new ConflictException(
        'A valid game request idempotency key is required',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(
        RoomCreditTransaction,
        {
          where: { idempotencyKey },
        },
      );

      if (existing) {
        if (existing.roomId !== roomId) {
          throw new ConflictException(
            'The idempotency key was already used for another room',
          );
        }

        if (
          existing.type ===
            RoomCreditTransactionType.GAME_DEDUCTION &&
          existing.status ===
            RoomCreditTransactionStatus.COMMITTED
        ) {
          // A successful retry must not create another match.
          return {
            idempotencyKey,
            roomId,
            replayed: true,
          };
        }

        throw new ConflictException(
          'This game request has already been processed or is still pending',
        );
      }

      await this.ensureBalanceRow(manager, roomId);

      const credit = await manager.findOne(RoomCredit, {
        where: { roomId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!credit) {
        throw new NotFoundException(
          `Credit balance for room ${roomId} was not found`,
        );
      }

      if (credit.balance < 1) {
        throw new ConflictException(
          'Insufficient room credits. Ask an administrator to top up this room.',
        );
      }

      credit.balance -= 1;
      await manager.save(RoomCredit, credit);

      const transaction = manager.create(
        RoomCreditTransaction,
        {
          roomId,
          type: RoomCreditTransactionType.GAME_DEDUCTION,
          amount: 1,
          balanceAfter: credit.balance,
          idempotencyKey,
          matchId: null,
          status: RoomCreditTransactionStatus.RESERVED,
          performedByUserId: userId,
          note: 'Reserved for new Bingo match',
        },
      );

      await manager.save(RoomCreditTransaction, transaction);

      return {
        idempotencyKey,
        roomId,
        replayed: false,
      };
    });
  }

  async commitReservation(
    idempotencyKey: string,
    matchId: number,
  ): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const transaction = await manager.findOne(
        RoomCreditTransaction,
        {
          where: { idempotencyKey },
          lock: { mode: 'pessimistic_write' },
        },
      );

      if (!transaction) {
        throw new NotFoundException(
          'Credit reservation was not found',
        );
      }

      if (
        transaction.status ===
        RoomCreditTransactionStatus.COMMITTED
      ) {
        return transaction.balanceAfter;
      }

      if (
        transaction.status !==
        RoomCreditTransactionStatus.RESERVED
      ) {
        throw new ConflictException(
          'Credit reservation cannot be committed',
        );
      }

      transaction.status =
        RoomCreditTransactionStatus.COMMITTED;
      transaction.matchId = matchId;

      await manager.save(RoomCreditTransaction, transaction);

      const credit = await manager.findOne(RoomCredit, {
        where: { roomId: transaction.roomId },
      });

      if (!credit) {
        throw new NotFoundException(
          'Room credit balance was not found',
        );
      }

      return credit.balance;
    });
  }

  /**
   * Restore a reserved credit when match creation fails.
   * This operation is safe to retry.
   */
  async refundReservation(
    idempotencyKey: string,
  ): Promise<number> {
    return this.dataSource.transaction(async (manager) => {
      const transaction = await manager.findOne(
        RoomCreditTransaction,
        {
          where: { idempotencyKey },
          lock: { mode: 'pessimistic_write' },
        },
      );

      if (!transaction) {
        throw new NotFoundException(
          'Credit reservation was not found',
        );
      }

      if (
        transaction.status ===
        RoomCreditTransactionStatus.REFUNDED
      ) {
        const existingCredit = await manager.findOne(
          RoomCredit,
          { where: { roomId: transaction.roomId } },
        );

        return existingCredit?.balance ?? 0;
      }

      if (
        transaction.status !==
        RoomCreditTransactionStatus.RESERVED
      ) {
        throw new ConflictException(
          'A committed game cannot be refunded by this operation',
        );
      }

      const credit = await manager.findOne(RoomCredit, {
        where: { roomId: transaction.roomId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!credit) {
        throw new NotFoundException(
          'Room credit balance was not found',
        );
      }

      credit.balance += transaction.amount;
      await manager.save(RoomCredit, credit);

      transaction.status =
        RoomCreditTransactionStatus.REFUNDED;
      await manager.save(RoomCreditTransaction, transaction);

      await manager.save(
        RoomCreditTransaction,
        manager.create(RoomCreditTransaction, {
          roomId: transaction.roomId,
          type: RoomCreditTransactionType.REFUND,
          amount: transaction.amount,
          balanceAfter: credit.balance,
          idempotencyKey: null,
          matchId: null,
          status: RoomCreditTransactionStatus.COMMITTED,
          performedByUserId: transaction.performedByUserId,
          note: `Refund for failed game request ${idempotencyKey}`,
        }),
      );

      return credit.balance;
    });
  }

  async topUp(
    roomId: number,
    amount: number,
    adminUserId: number,
    note?: string,
  ): Promise<{ roomId: number; balance: number }> {
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      throw new ConflictException(
        'Top-up amount must be a positive whole number',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      await this.ensureBalanceRow(manager, roomId);

      const credit = await manager.findOne(RoomCredit, {
        where: { roomId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!credit) {
        throw new NotFoundException(
          `Credit balance for room ${roomId} was not found`,
        );
      }

      credit.balance += amount;
      await manager.save(RoomCredit, credit);

      await manager.save(
        RoomCreditTransaction,
        manager.create(RoomCreditTransaction, {
          roomId,
          type: RoomCreditTransactionType.TOP_UP,
          amount,
          balanceAfter: credit.balance,
          idempotencyKey: null,
          matchId: null,
          status: RoomCreditTransactionStatus.COMMITTED,
          performedByUserId: adminUserId,
          note: note ?? 'Administrator top-up',
        }),
      );

      return {
        roomId,
        balance: credit.balance,
      };
    });
  }

  async getHistory(roomId: number): Promise<RoomCreditTransaction[]> {
    await this.getBalance(roomId);

    return this.dataSource.getRepository(RoomCreditTransaction)
      .find({
        where: { roomId },
        order: { createdAt: 'DESC', id: 'DESC' },
      });
  }
}
