import {
  BeforeInsert,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Room } from '../../room/entities/room.entity';
import { Match } from '../../match/entities/match.entity';

@Entity({ name: 'cards' })
export class Card {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  cardNumber!: string;

  @Column({ type: 'text' })
  grid!: string; // Store as JSON string

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  assignedUser?: User;

  @ManyToOne(() => Room, { nullable: true, onDelete: 'CASCADE' })
  room?: Room;

  @ManyToOne(() => Match, { nullable: true, onDelete: 'SET NULL' })
  lockedInMatch?: Match;

  @Column({ type: 'datetime', nullable: true })
  createdAt!: Date;

  @BeforeInsert()
  setCreatedAt() {
    if (!this.createdAt) {
      this.createdAt = new Date();
    }
  }

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: false })
  isLocked!: boolean;
}
