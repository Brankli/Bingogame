import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncDevice } from './entities/sync-device.entity';

@Injectable()
export class SyncServerGuard implements CanActivate {
  constructor(
    @InjectRepository(SyncDevice)
    private readonly deviceRepository: Repository<SyncDevice>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const deviceId = String(request.headers['x-sync-device-id'] || '');
    const token = String(request.headers['x-sync-device-token'] || '');
    if (!deviceId || !token) {
      throw new UnauthorizedException('Device authentication is required');
    }

    const device = await this.deviceRepository.findOne({ where: { deviceId } });
    const verifier = `${token}${process.env.SYNC_SERVER_SECRET || ''}`;
    if (
      !device ||
      !device.isActive ||
      !(await bcrypt.compare(verifier, device.secretHash))
    ) {
      throw new UnauthorizedException('Device authentication failed');
    }

    request.syncDevice = device;
    await this.deviceRepository.update(
      { id: device.id },
      { lastHeartbeatAt: new Date() },
    );
    return true;
  }
}
