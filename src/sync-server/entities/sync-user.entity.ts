import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'central_users' })
export class SyncUser {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  centralId!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 32 })
  role!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'datetime', nullable: true })
  sourceUpdatedAt!: Date | null;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
