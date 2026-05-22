import { BeforeInsert, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Room } from '../../room/entities/room.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: false })
  username!: string;

  @Column({ nullable: false })
  password!: string;

  @Column({
    type: 'varchar',
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ type: 'float', default: 0 })
  houseFee!: number;

  @Column({ type: 'float', default: 0 })
  totalEarnings!: number;

  @Column({ type: 'datetime', nullable: true })
  createdAt!: Date;

  @Column({ type: 'datetime', nullable: true })
  lastActive!: Date;

  @BeforeInsert()
  setDates() {
    const now = new Date();
    if (!this.createdAt) {
      this.createdAt = now;
    }
    if (!this.lastActive) {
      this.lastActive = now;
    }
  }

  @OneToMany(() => Room, (room) => room.owner)
  rooms?: Room[];
}
