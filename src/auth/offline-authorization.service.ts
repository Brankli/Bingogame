import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncState } from '../sync/entities/sync-state.entity';

@Injectable()
export class OfflineAuthorizationService {
  constructor(
    @InjectRepository(SyncState)
    private readonly stateRepository: Repository<SyncState>,
  ) {}

  async assertAllowed(): Promise<void> {
    if (!process.env.SYNC_SERVER_URL?.trim()) {
      return;
    }

    const state = await this.stateRepository.findOne({ where: { id: 1 } });
    if (
      !state ||
      state.revoked ||
      !state.offlineAuthorizedUntil ||
      state.offlineAuthorizedUntil < new Date()
    ) {
      throw new ServiceUnavailableException(
        state?.revoked
          ? 'This device has been revoked. Contact an administrator.'
          : 'Offline authorization has expired. Connect to the internet and synchronize first.',
      );
    }
  }
}
