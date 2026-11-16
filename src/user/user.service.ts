import { Injectable, Optional } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import {
  EarningsTransaction,
  TransactionType,
} from './entities/earnings-transaction.entity';
import {
  UserCreditTransaction,
  CreditTransactionType,
} from './entities/user-credit-transaction.entity';
import { SyncOutbox } from '../sync/entities/sync-outbox.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EarningsTransaction)
    private readonly earningsRepository: Repository<EarningsTransaction>,
    @InjectRepository(UserCreditTransaction)
    private readonly creditTransactionRepository: Repository<UserCreditTransaction>,
    @Optional()
    @InjectRepository(SyncOutbox)
    private readonly syncOutboxRepository?: Repository<SyncOutbox>,
  ) {}

  private async queueSync(userId: number, operation = 'UPSERT'): Promise<void> {
    if (!this.syncOutboxRepository) {
      return;
    }
    await this.syncOutboxRepository.upsert(
      { userId, operation, status: 'PENDING', lastError: null },
      ['userId'],
    );
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = await this.userRepository.save({
      ...createUserDto,
      password: await bcrypt.hash(createUserDto.password, 10),
    });
    await this.queueSync(user.id);
    return user;
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find({
      select: [
        'id',
        'username',
        'role',
        'houseFee',
        'totalEarnings',
        'credits',
        'gamesPlayed',
        'createdAt',
        'lastActive',
      ],
    });

    const missingDates = users.filter((u) => !u.createdAt);
    if (missingDates.length > 0) {
      const now = new Date();
      await Promise.all(
        missingDates.map((u) =>
          this.userRepository.update(
            { id: u.id },
            {
              createdAt: u.lastActive || now,
              lastActive: u.lastActive || now,
            },
          ),
        ),
      );
      return this.userRepository.find({
        select: [
          'id',
          'username',
          'role',
          'houseFee',
          'totalEarnings',
          'credits',
          'gamesPlayed',
          'createdAt',
          'lastActive',
        ],
      });
    }

    return users;
  }

  async findOne(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async update(id: number, user: Partial<User>) {
    const payload: Partial<User> = { ...user };
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }
    const result = await this.userRepository.update({ id }, payload);
    if (result.affected) {
      await this.queueSync(id);
    }
    return result;
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete({ id });
    await this.queueSync(id, 'DELETE');
  }

  async findByUsername(username: string) {
    return this.userRepository.findOneBy({ username });
  }

  async countByRole(role: UserRole): Promise<number> {
    return this.userRepository.count({ where: { role } });
  }

  async validatePassword(userId: number, password: string): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      return false;
    }
    return bcrypt.compare(password, user.password);
  }

  async changePassword(userId: number, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(
      { id: userId },
      { password: hashedPassword },
    );
  }

  async addEarnings(userId: number, amount: number): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (user) {
      await this.userRepository.update(
        { id: userId },
        {
          totalEarnings: (user.totalEarnings || 0) + amount,
          houseFee: (user.houseFee || 0) + amount,
        },
      );
    }
  }

  async adjustEarnings(
    userId: number,
    amount: number,
    type: 'add' | 'subtract' | 'payout' | 'reset',
    reason?: string,
    performedBy?: string,
  ): Promise<{ success: boolean; newBalance: number }> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    const balanceBefore = user.totalEarnings || 0;
    let balanceAfter = balanceBefore;

    switch (type) {
      case 'add':
        balanceAfter = balanceBefore + amount;
        break;
      case 'subtract':
        balanceAfter = Math.max(0, balanceBefore - amount);
        break;
      case 'payout':
        balanceAfter = Math.max(0, balanceBefore - amount);
        break;
      case 'reset':
        balanceAfter = 0;
        break;
    }

    await this.userRepository.update(
      { id: userId },
      {
        totalEarnings: balanceAfter,
        houseFee:
          type === 'add' ? (user.houseFee || 0) + amount : user.houseFee,
      },
    );

    const transactionType = this.mapAdjustmentToTransactionType(type);
    await this.earningsRepository.save({
      user: { id: userId } as User,
      amount: balanceAfter - balanceBefore,
      balanceBefore,
      balanceAfter,
      type: transactionType,
      reason: reason?.trim() || undefined,
      performedBy,
    });

    return { success: true, newBalance: balanceAfter };
  }

  private mapAdjustmentToTransactionType(
    type: 'add' | 'subtract' | 'payout' | 'reset',
  ): TransactionType {
    switch (type) {
      case 'add':
        return TransactionType.MANUAL_ADD;
      case 'subtract':
        return TransactionType.MANUAL_SUBTRACT;
      case 'payout':
        return TransactionType.PAYOUT;
      case 'reset':
        return TransactionType.RESET;
      default:
        return TransactionType.MANUAL_ADD;
    }
  }

  async getEarningsHistory(userId: number): Promise<EarningsTransaction[]> {
    return this.earningsRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async resetDailyHouseFee(userId: number): Promise<void> {
    await this.userRepository.update({ id: userId }, { houseFee: 0 });
  }

  /**
   * Add credits to a user's account.
   */
  async addCredits(
    userId: number,
    amount: number,
    adminId: number,
    notes?: string,
  ): Promise<{ success: boolean; newBalance: number }> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    const balanceBefore = user.credits || 0;
    const balanceAfter = balanceBefore + amount;

    await this.userRepository.update({ id: userId }, { credits: balanceAfter });

    await this.creditTransactionRepository.save({
      user: { id: userId } as User,
      amount,
      balanceBefore,
      balanceAfter,
      type: CreditTransactionType.ADMIN_ADD,
      notes: notes?.trim() || undefined,
      adminId,
    });

    return { success: true, newBalance: balanceAfter };
  }

  /**
   * Deduct 1 credit from user and increment gamesPlayed counter.
   * Called when a game starts.
   */
  async deductCredit(
    userId: number,
    roomId: number,
  ): Promise<{ success: boolean; credits: number; gamesPlayed: number }> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    const balanceBefore = user.credits || 0;
    if (balanceBefore <= 0) {
      throw new Error('Insufficient credits');
    }

    const balanceAfter = balanceBefore - 1;
    const newGamesPlayed = (user.gamesPlayed || 0) + 1;

    await this.userRepository.update(
      { id: userId },
      { credits: balanceAfter, gamesPlayed: newGamesPlayed },
    );

    await this.creditTransactionRepository.save({
      user: { id: userId } as User,
      amount: -1,
      balanceBefore,
      balanceAfter,
      type: CreditTransactionType.GAME_DEDUCTION,
      notes: `Game started in room ${roomId}`,
      roomId,
    });

    return {
      success: true,
      credits: balanceAfter,
      gamesPlayed: newGamesPlayed,
    };
  }

  /**
   * Reset gamesPlayed counter to 0.
   */
  async resetGamesPlayed(
    userId: number,
    adminId: number,
  ): Promise<{ success: boolean }> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    await this.userRepository.update({ id: userId }, { gamesPlayed: 0 });

    await this.creditTransactionRepository.save({
      user: { id: userId } as User,
      amount: 0,
      balanceBefore: user.credits || 0,
      balanceAfter: user.credits || 0,
      type: CreditTransactionType.COUNTER_RESET,
      notes: 'Games played counter reset to 0',
      adminId,
    });

    return { success: true };
  }

  /**
   * Get credit transaction history for a specific user.
   */
  async getUserCreditTransactions(
    userId: number,
  ): Promise<UserCreditTransaction[]> {
    return this.creditTransactionRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  /**
   * Get credits summary for all users.
   */
  async getAllUsersCredits(): Promise<
    Array<{
      id: number;
      username: string;
      role: UserRole;
      credits: number;
      gamesPlayed: number;
    }>
  > {
    const users = await this.userRepository.find({
      select: ['id', 'username', 'role', 'credits', 'gamesPlayed'],
    });

    return users.map((u) => ({
      id: u.id,
      username: u.username,
      role: u.role,
      credits: u.credits || 0,
      gamesPlayed: u.gamesPlayed || 0,
    }));
  }
}
