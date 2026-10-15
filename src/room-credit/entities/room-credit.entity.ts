import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'room_credits' })
export class RoomCredit {
  @PrimaryGeneratedColumn()
  id!: number;

  // One balance record per room.
  @Column({ type: 'int', unique: true })
  roomId!: number;

  @Column({ type: 'int', default: 0 })
  balance!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
