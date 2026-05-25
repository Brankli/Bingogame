export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface User {
  id: number;
  username: string;
  role: UserRole;
  houseFee?: number;
  totalEarnings?: number;
  createdAt?: string | Date | null;
  lastActive?: string | Date | null;
}
