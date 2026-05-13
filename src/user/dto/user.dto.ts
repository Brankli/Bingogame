import { User, UserRole } from '../entities/user.entity';

export class UserDto {
  id: number;

  username: string;

  role: UserRole;

  houseFee: number;

  totalEarnings: number;

  createdAt: Date;

  lastActive: Date;
}

export function mapToUserDto(user: User): UserDto {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    houseFee: user.houseFee ?? 0,
    totalEarnings: user.totalEarnings ?? 0,
    createdAt: user.createdAt,
    lastActive: user.lastActive,
  };
}
