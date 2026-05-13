import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
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
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ type: 'float', default: 0 })
  houseFee!: number;

  @Column({ type: 'float', default: 0 })
  totalEarnings!: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  lastActive!: Date;

  @OneToMany(() => Room, (room) => room.owner)
  rooms?: Room[];
}
