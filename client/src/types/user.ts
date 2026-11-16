export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface User {
  id: number;
  username: string;
  isActive?: boolean;
  role: UserRole;
  houseFee?: number;
  totalEarnings?: number;
  credits?: number;
  gamesPlayed?: number;
  createdAt?: string | Date | null;
  lastActive?: string | Date | null;
}
