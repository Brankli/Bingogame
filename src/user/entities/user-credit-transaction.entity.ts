import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum CreditTransactionType {
  TOP_UP = 'top_up',
  GAME_DEDUCTION = 'game_deduction',
  ADMIN_ADD = 'admin_add',
  ADMIN_SUBTRACT = 'admin_subtract',
  COUNTER_RESET = 'counter_reset',
}

@Entity({ name: 'user_credit_transactions' })
export class UserCreditTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @Column({ type: 'int' })
  amount!: number;

  @Column({ type: 'int' })
  balanceBefore!: number;

  @Column({ type: 'int' })
  balanceAfter!: number;

  @Column({ type: 'varchar', length: 32 })
  type!: CreditTransactionType;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'int', nullable: true })
  adminId?: number;

  @Column({ type: 'int', nullable: true })
  roomId?: number;

  @CreateDateColumn()
  createdAt!: Date;
}
