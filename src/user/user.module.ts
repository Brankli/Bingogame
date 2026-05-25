import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EarningsTransaction } from './entities/earnings-transaction.entity';
import { AdminBootstrapService } from './admin-bootstrap.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, EarningsTransaction])],
  controllers: [UserController],
  providers: [UserService, AdminBootstrapService],
  exports: [UserService],
})
export class UserModule {}
