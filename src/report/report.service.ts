import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { UserRole } from '../user/entities/user.entity';
import { Match } from '../match/entities/match.entity';
import { RoomManager } from '../room/entities/room-manager.entity';

type ReportUser = { id: number; role: string };

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(RoomManager)
    private readonly roomManagerRepository: Repository<RoomManager>,
  ) {}

  async getDailyReport(startDate: string, endDate: string, user: ReportUser) {
    const { start, end } = this.parseDateRange(startDate, endDate);
    const roomIds = await this.getVisibleRoomIds(user);

    const matches = await this.matchRepository.find({
      where: roomIds
        ? { createdAt: Between(start, end), room: { id: In(roomIds) } }
        : { createdAt: Between(start, end) },
      relations: {
        room: true,
        matchNumbers: true,
      },
      order: { createdAt: 'DESC' },
    });

    const rows = matches.map((match) => {
      const betAmount =
        Number(match.betAmount ?? match.room.ticketPrice ?? 0) *
        Number(match.soldCards || 0);
      const houseFee =
        match.houseFeePercent !== null && match.houseFeePercent !== undefined
          ? betAmount * (Number(match.houseFeePercent) / 100)
          : Math.max(0, betAmount - Number(match.payoutAmount || 0));
      const payout = betAmount - houseFee;

      return {
        date: match.createdAt,
        matchId: match.id,
        roomId: match.room.id,
        roomName: match.room.name,
        betAmount,
        payout,
        profitLoss: houseFee,
        numbers: (match.matchNumbers || [])
          .map((matchNumber) => matchNumber.number)
          .sort((a, b) => a - b),
      };
    });

    return {
      startDate,
      endDate,
      currency: 'ETB',
      totals: {
        bets: rows.reduce((total, row) => total + row.betAmount, 0),
        payouts: rows.reduce((total, row) => total + row.payout, 0),
        profit: rows.reduce((total, row) => total + row.profitLoss, 0),
      },
      rows,
    };
  }

  private async getVisibleRoomIds(user: ReportUser): Promise<number[] | null> {
    if (String(user.role).toLowerCase() === UserRole.ADMIN) {
      return null;
    }

    const managers = await this.roomManagerRepository.find({
      where: { user: { id: user.id } },
      relations: { room: true },
    });
    return managers.map((manager) => manager.room.id);
  }

  private parseDateRange(
    startDate: string,
    endDate: string,
  ): {
    start: Date;
    end: Date;
  } {
    if (
      !this.isDateOnly(startDate) ||
      !this.isDateOnly(endDate) ||
      startDate > endDate
    ) {
      throw new BadRequestException(
        'startDate and endDate must use YYYY-MM-DD, with startDate before or equal to endDate',
      );
    }

    return {
      start: new Date(`${startDate}T00:00:00.000Z`),
      end: new Date(`${this.addOneDay(endDate)}T00:00:00.000Z`),
    };
  }

  private isDateOnly(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
      return false;
    }
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
    );
  }

  private addOneDay(value: string): string {
    const date = new Date(`${value}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
  }
}
