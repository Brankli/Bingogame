import Api from '@/services/Api';
import { AxiosPromise } from 'axios';

export interface SyncStatus {
  configured: boolean;
  deviceId: string | null;
  lastSuccessfulAt: string | null;
  offlineAuthorizedUntil: string | null;
  pendingCount: number;
  lastError: string | null;
}

export class SyncService extends Api {
  status(): AxiosPromise<SyncStatus> {
    return this.httpClient.get<SyncStatus>('/sync/status');
  }

  run(): AxiosPromise<SyncStatus> {
    return this.httpClient.post<SyncStatus>('/sync/run');
  }
}
