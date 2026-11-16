import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import { User } from '../user/entities/user.entity';
import { SyncState } from './entities/sync-state.entity';
import { SyncOutbox } from './entities/sync-outbox.entity';

type CentralUser = {
  centralId: string;
  username: string;
  passwordHash: string;
  role: User['role'];
  isActive: boolean;
  updatedAt: string;
};

@Injectable()
export class SyncService implements OnModuleInit {
  private readonly logger = new Logger(SyncService.name);
  private readonly http: AxiosInstance | null;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(SyncState)
    private readonly stateRepository: Repository<SyncState>,
    @InjectRepository(SyncOutbox)
    private readonly outboxRepository: Repository<SyncOutbox>,
  ) {
    const baseURL = process.env.SYNC_SERVER_URL?.trim();
    if (
      baseURL &&
      !baseURL.startsWith('https://') &&
      !baseURL.startsWith('http://127.0.0.1') &&
      !baseURL.startsWith('http://localhost')
    ) {
      throw new Error(
        'SYNC_SERVER_URL must use HTTPS outside local development.',
      );
    }
    this.http = baseURL
      ? axios.create({
          baseURL: baseURL.replace(/\/+$/, ''),
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' },
        })
      : null;
  }

  onModuleInit(): void {
    if (this.http) {
      setTimeout(() => {
        this.synchronize().catch((error) => {
          this.logger.warn(
            `Initial account synchronization failed: ${error.message}`,
          );
        });
      }, 1000);
      setInterval(() => {
        this.synchronize().catch((error) => {
          this.logger.warn(
            `Scheduled account synchronization failed: ${error.message}`,
          );
        });
      }, 5 * 60 * 1000);
    }
  }

  async getStatus(): Promise<{
    configured: boolean;
    deviceId: string | null;
    lastSuccessfulAt: Date | null;
    offlineAuthorizedUntil: Date | null;
    pendingCount: number;
    lastError: string | null;
  }> {
    const state = await this.getOrCreateState();
    return {
      configured: Boolean(this.http && process.env.SYNC_DEVICE_SECRET),
      deviceId: state.deviceId || null,
      lastSuccessfulAt: state.lastSuccessfulAt,
      offlineAuthorizedUntil: state.offlineAuthorizedUntil,
      pendingCount: state.pendingCount,
      lastError: state.lastError,
    };
  }

  async assertOfflineAuthorization(): Promise<void> {
    const state = await this.stateRepository.findOne({ where: { id: 1 } });
    if (
      state?.offlineAuthorizedUntil &&
      state.offlineAuthorizedUntil < new Date()
    ) {
      throw new ServiceUnavailableException(
        'Offline authorization has expired. Connect to the internet and synchronize first.',
      );
    }
  }

  async synchronize(): Promise<void> {
    if (!this.http) {
      return;
    }

    const state = await this.getOrCreateState();
    const deviceId = process.env.SYNC_DEVICE_ID?.trim();
    const deviceSecret = process.env.SYNC_DEVICE_SECRET?.trim();
    const role = process.env.SYNC_DEVICE_ROLE || 'reader';
    const enrollmentToken = (
      role === 'publisher'
        ? process.env.SYNC_PUBLISH_ENROLLMENT_TOKEN
        : process.env.SYNC_ENROLLMENT_TOKEN
    )?.trim();
    if (!deviceId || !deviceSecret) {
      throw new Error('SYNC_DEVICE_ID and SYNC_DEVICE_SECRET are required.');
    }

    try {
      if (!enrollmentToken) {
        throw new Error(
          'SYNC_ENROLLMENT_TOKEN is required for device activation.',
        );
      }
      await this.http.post('/api/sync/devices/activate', {
        deviceId,
        deviceSecret,
        enrollmentToken,
        role,
      });

      const users = await this.userRepository.find();
      await this.outboxRepository.upsert(
        users.map((user) => ({
          userId: user.id,
          operation: 'UPSERT',
          status: 'PENDING',
        })),
        ['userId'],
      );
      await this.stateRepository.update(
        { id: state.id },
        { pendingCount: users.length },
      );
      await this.outboxRepository.increment(
        { status: 'PENDING' },
        'attempts',
        1,
      );

      const headers = this.headers();
      const upload = await this.http.post<{
        users: Array<{ username: string; centralId: string }>;
      }>(
        '/api/sync/users',
        {
          users: users.map((user) => ({
            centralId: user.centralId,
            username: user.username,
            passwordHash: user.password,
            role: user.role,
            isActive: user.isActive !== false,
            updatedAt: user.updatedAt,
          })),
        },
        { headers },
      );
      for (const remote of upload.data.users) {
        await this.userRepository.update(
          { username: remote.username },
          { centralId: remote.centralId },
        );
      }

      const response = await this.http.get<{ users: CentralUser[] }>(
        '/api/sync/users',
        { headers },
      );
      for (const remote of response.data.users) {
        const local = await this.userRepository.findOne({
          where: { username: remote.username },
        });
        if (local) {
          await this.userRepository.update(local.id, {
            centralId: remote.centralId,
            password: remote.passwordHash,
            role: remote.role,
            isActive: remote.isActive,
          });
        } else {
          await this.userRepository.save({
            centralId: remote.centralId,
            username: remote.username,
            password: remote.passwordHash,
            role: remote.role,
            isActive: remote.isActive,
          });
        }
      }

      const until = new Date();
      until.setDate(
        until.getDate() + Number(process.env.OFFLINE_AUTH_DAYS || 30),
      );
      await this.stateRepository.update(
        { id: state.id },
        {
          lastSuccessfulAt: new Date(),
          offlineAuthorizedUntil: until,
          pendingCount: 0,
          lastError: null,
          revoked: false,
        },
      );
      await this.outboxRepository.update(
        { status: 'PENDING' },
        { status: 'SYNCED', lastError: null },
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Synchronization failed';
      await this.stateRepository.update(
        { id: state.id },
        {
          lastError: message,
          revoked:
            state.revoked ||
            (axios.isAxiosError(error) &&
              (error.response?.status === 401 ||
                error.response?.status === 403)),
        },
      );
      throw error;
    }
  }

  private headers(): Record<string, string> {
    return {
      'x-sync-device-id': process.env.SYNC_DEVICE_ID || '',
      'x-sync-device-token': process.env.SYNC_DEVICE_SECRET || '',
    };
  }

  private async getOrCreateState(): Promise<SyncState> {
    const deviceId =
      process.env.SYNC_DEVICE_ID?.trim() || 'unconfigured-device';
    let state = await this.stateRepository.findOne({ where: { id: 1 } });
    if (!state) {
      state = await this.stateRepository.save({
        id: 1,
        deviceId,
        pendingCount: 0,
      });
    } else if (state.deviceId !== deviceId) {
      await this.stateRepository.update({ id: 1 }, { deviceId });
      state.deviceId = deviceId;
    }
    return state;
  }
}
