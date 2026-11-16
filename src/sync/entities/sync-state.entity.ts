import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'sync_state' })
export class SyncState {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 128, unique: true })
  deviceId!: string;

  @Column({ type: 'datetime', nullable: true })
  lastSuccessfulAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  offlineAuthorizedUntil!: Date | null;

  @Column({ type: 'int', default: 0 })
  pendingCount!: number;

  @Column({ type: 'boolean', default: false })
  revoked!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lastError!: string | null;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
