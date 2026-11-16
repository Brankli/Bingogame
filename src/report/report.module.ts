import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Match } from '../match/entities/match.entity';
import { RoomManager } from '../room/entities/room-manager.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';

@Module({
  imports: [TypeOrmModule.forFeature([Match, RoomManager]), AuthModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
