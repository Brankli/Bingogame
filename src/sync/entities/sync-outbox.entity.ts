import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'sync_outbox' })
@Index('UQ_sync_outbox_user', ['userId'], { unique: true })
export class SyncOutbox {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'varchar', length: 32, default: 'UPSERT' })
  operation!: string;

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status!: string;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lastError!: string | null;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
