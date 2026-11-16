import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Room } from '../../room/entities/room.entity';
import { MatchNumber } from './match-number.entity';

@Entity()
export class Match {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: false })
  closed!: boolean;

  @Column({ default: 1 })
  soldCards!: number;

  @Column({ type: 'float', nullable: true })
  betAmount?: number;

  @Column({ type: 'float', nullable: true })
  houseFeePercent?: number;

  @Column('simple-array', { nullable: true })
  registeredCards?: string[];

  @Column({ default: 'twoline', nullable: true })
  pattern?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'float', default: 0 })
  payoutAmount!: number;

  @ManyToOne(() => Room, (room) => room.matches, { onDelete: 'CASCADE' })
  room!: Room;

  @OneToMany(() => MatchNumber, (matchNumber) => matchNumber.match, {
    onDelete: 'CASCADE',
    cascade: true,
  })
  matchNumbers?: MatchNumber[];
}
