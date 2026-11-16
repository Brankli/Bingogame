import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'sync_device_users' })
@Index('UQ_sync_device_users_device_user', ['deviceId', 'centralId'], {
  unique: true,
})
export class SyncDeviceUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 128 })
  deviceId!: string;

  @Column({ type: 'varchar', length: 36 })
  centralId!: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  assignedAt!: Date;
}
