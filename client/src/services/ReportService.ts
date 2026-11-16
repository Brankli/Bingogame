import Api from '@/services/Api';
import type { DailyReport } from '@/types/report';
import { AxiosPromise } from 'axios';

export class ReportService extends Api {
  public getDaily(startDate: string, endDate: string): AxiosPromise<DailyReport> {
    return this.httpClient.get<DailyReport>('/reports/daily', {
      params: { startDate, endDate },
    });
  }
}
