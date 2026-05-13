import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}
  async create(createUserDto: CreateUserDto): Promise<User> {
    return await this.userRepository.save({
      ...createUserDto,
      password: await bcrypt.hash(createUserDto.password, 10),
    });
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'username', 'role', 'houseFee', 'totalEarnings', 'createdAt', 'lastActive'],
    });
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
    await this.userRepository.update({ id: userId }, { password: hashedPassword });
  }

  async addEarnings(userId: number, amount: number): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (user) {
      await this.userRepository.update(
        { id: userId },
        {
          totalEarnings: (user.totalEarnings || 0) + amount,
          houseFee: (user.houseFee || 0) + amount,
        }
      );
    }
  }

  async resetDailyHouseFee(userId: number): Promise<void> {
    await this.userRepository.update({ id: userId }, { houseFee: 0 });
  }
}
