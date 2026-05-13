import {
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Room } from './room.entity';

@Entity({ name: 'room_managers' })
export class RoomManager {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => Room, (room) => room.managers, { onDelete: 'CASCADE' })
  room!: Room;

  @CreateDateColumn()
  assignedAt!: Date;
}
