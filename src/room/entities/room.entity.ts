import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Match } from '../../match/entities/match.entity';
import { RoomPrize } from './room-prize.entity';
import { RoomManager } from './room-manager.entity';
import { RoomCardMode } from '../consts/room-card-mode.const';

@Entity({ name: 'rooms' })
export class Room {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  name!: string;

  /** static = copy shared master deck; automatic = unique per-room generation */
  @Column({
    type: 'varchar',
    length: 16,
    default: RoomCardMode.AUTOMATIC,
  })
  cardMode!: RoomCardMode;

  @ManyToOne(() => User, (user) => user.rooms, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  owner!: User;

  @OneToMany(() => RoomManager, (manager) => manager.room, {
    cascade: true,
  })
  managers?: RoomManager[];

  @Column({ type: 'datetime', nullable: true })
  createdAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  startedAt!: Date;

  @BeforeInsert()
  setCreatedAt() {
    if (!this.createdAt) {
      this.createdAt = new Date();
    }
  }

  @OneToMany(() => Match, (match) => match.room, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  matches?: Match[];

  @ManyToMany(() => User)
  @JoinTable()
  currentUsers!: User[];

  @OneToOne(() => Match, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  currentMatch?: Match | null;

  @Column({ default: 0.5, type: 'float', scale: 2 })
  ticketPrice!: number;

  @OneToOne(() => RoomPrize, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  roomPrize!: RoomPrize;
}
