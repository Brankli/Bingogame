import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import {
  EarningsTransaction,
  TransactionType,
} from './entities/earnings-transaction.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EarningsTransaction)
    private readonly earningsRepository: Repository<EarningsTransaction>,
  ) {}
  async create(createUserDto: CreateUserDto): Promise<User> {
    return await this.userRepository.save({
      ...createUserDto,
      password: await bcrypt.hash(createUserDto.password, 10),
    });
  }

  async findAll(): Promise<User[]> {
    const users = await this.userRepository.find({
      select: [
        'id',
        'username',
        'role',
        'houseFee',
        'totalEarnings',
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
    return this.userRepository.update({ id }, payload);
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete({ id });
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
        houseFee: type === 'add' ? (user.houseFee || 0) + amount : user.houseFee,
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
}
