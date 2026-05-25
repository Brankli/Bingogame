import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum TransactionType {
  GAME_WIN = 'game_win',
  HOUSE_FEE = 'house_fee',
  MANUAL_ADD = 'manual_add',
  MANUAL_SUBTRACT = 'manual_subtract',
  PAYOUT = 'payout',
  RESET = 'reset',
}

@Entity({ name: 'earnings_transactions' })
export class EarningsTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ type: 'float' })
  amount!: number;

  @Column({ type: 'float' })
  balanceBefore!: number;

  @Column({ type: 'float' })
  balanceAfter!: number;

  @Column({ type: 'varchar', length: 32 })
  type!: TransactionType;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'varchar', nullable: true })
  performedBy?: string; // Admin username who performed the action

  @CreateDateColumn()
  createdAt!: Date;
}
