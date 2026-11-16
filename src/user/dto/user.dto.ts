import { User, UserRole } from '../entities/user.entity';

export class UserDto {
  id: number;

  username: string;

  isActive: boolean;

  role: UserRole;

  houseFee: number;

  totalEarnings: number;

  credits: number;

  gamesPlayed: number;

  createdAt: Date;

  lastActive: Date;
}

export function mapToUserDto(user: User): UserDto {
  return {
    id: user.id,
    username: user.username,
    isActive: user.isActive !== false,
    role: user.role,
    houseFee: user.houseFee ?? 0,
    totalEarnings: user.totalEarnings ?? 0,
    credits: user.credits ?? 0,
    gamesPlayed: user.gamesPlayed ?? 0,
    createdAt: user.createdAt,
    lastActive: user.lastActive,
  };
}
