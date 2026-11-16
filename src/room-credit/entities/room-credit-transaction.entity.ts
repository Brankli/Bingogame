import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum RoomCreditTransactionType {
  TOP_UP = 'TOP_UP',
  GAME_DEDUCTION = 'GAME_DEDUCTION',
  REFUND = 'REFUND',
}

export enum RoomCreditTransactionStatus {
  RESERVED = 'RESERVED',
  COMMITTED = 'COMMITTED',
  REFUNDED = 'REFUNDED',
}

@Entity({ name: 'room_credit_transactions' })
@Index('UQ_room_credit_tx_idempotency_key', ['idempotencyKey'], {
  unique: true,
})
export class RoomCreditTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  roomId!: number;

  @Column({
    type: 'varchar',
    length: 32,
  })
  type!: RoomCreditTransactionType;

  // Positive credit quantity; the transaction type indicates its meaning.
  @Column({ type: 'int' })
  amount!: number;

  @Column({ type: 'int' })
  balanceAfter!: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  idempotencyKey!: string | null;

  @Column({ type: 'int', nullable: true })
  matchId!: number | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: RoomCreditTransactionStatus.COMMITTED,
  })
  status!: RoomCreditTransactionStatus;

  @Column({ type: 'int', nullable: true })
  performedByUserId!: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  note!: string | null;

  @CreateDateColumn({
    type: process.env.ELECTRON_MODE === 'true' ? 'datetime' : 'timestamp',
  })
  createdAt!: Date;
}
