import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { ReportService } from './report.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('daily')
  getDailyReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @User() user: { id: number; role: string },
  ) {
    return this.reportService.getDailyReport(startDate, endDate, user);
  }
}
