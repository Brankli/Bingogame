import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'sync_logs' })
export class SyncLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 128 })
  deviceId!: string;

  @Column({ type: 'varchar', length: 32 })
  operation!: string;

  @Column({ type: 'boolean', default: true })
  success!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  message!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
