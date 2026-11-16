import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SyncDevice } from './entities/sync-device.entity';
import { SyncUser } from './entities/sync-user.entity';
import { SyncLog } from './entities/sync-log.entity';
import { SyncDeviceUser } from './entities/sync-device-user.entity';
import { SyncServerGuard } from './sync-server.guard';

type UserPayload = {
  centralId?: string | null;
  username: string;
  passwordHash: string;
  role: string;
  isActive: boolean;
  updatedAt?: string;
};

@Controller('sync')
export class SyncServerController {
  constructor(
    @InjectRepository(SyncDevice)
    private readonly deviceRepository: Repository<SyncDevice>,
    @InjectRepository(SyncUser)
    private readonly userRepository: Repository<SyncUser>,
    @InjectRepository(SyncLog)
    private readonly logRepository: Repository<SyncLog>,
    @InjectRepository(SyncDeviceUser)
    private readonly deviceUserRepository: Repository<SyncDeviceUser>,
    private readonly dataSource: DataSource,
  ) {}

  @Post('devices/activate')
  async activate(
    @Body()
    body: {
      deviceId: string;
      deviceSecret: string;
      enrollmentToken: string;
      role?: 'reader' | 'publisher';
    },
  ) {
    const expectedToken =
      body.role === 'publisher'
        ? process.env.SYNC_PUBLISH_ENROLLMENT_TOKEN
        : process.env.SYNC_ENROLLMENT_TOKEN;
    if (!expectedToken || body.enrollmentToken !== expectedToken) {
      throw new UnauthorizedException('Invalid enrollment token');
    }
    if (!body.deviceId || body.deviceId.length > 128 || !body.deviceSecret) {
      throw new UnauthorizedException('Invalid device credentials');
    }

    let device = await this.deviceRepository.findOne({
      where: { deviceId: body.deviceId },
    });
    if (device) {
      if (
        !(await bcrypt.compare(
          `${body.deviceSecret}${process.env.SYNC_SERVER_SECRET || ''}`,
          device.secretHash,
        ))
      ) {
        throw new UnauthorizedException('Device identity conflict');
      }
      if (!device.isActive) {
        throw new UnauthorizedException('Device has been revoked');
      }
      if (body.role === 'publisher' && !device.canUpload) {
        device.canUpload = true;
        await this.deviceRepository.save(device);
      }
    } else {
      device = await this.deviceRepository.save({
        deviceId: body.deviceId,
        secretHash: await bcrypt.hash(
          `${body.deviceSecret}${process.env.SYNC_SERVER_SECRET || ''}`,
          12,
        ),
        isActive: true,
        canUpload: body.role === 'publisher',
      });
    }

    return { deviceId: device.deviceId, canUpload: device.canUpload };
  }

  @UseGuards(SyncServerGuard)
  @Post('users')
  async uploadUsers(
    @Headers('x-sync-device-id') deviceId: string,
    @Req() request: { syncDevice?: SyncDevice },
    @Body() body: { users: UserPayload[] },
  ) {
    if (!request.syncDevice?.canUpload) {
      throw new UnauthorizedException(
        'Publishing device authorization is required',
      );
    }
    if (!Array.isArray(body.users) || body.users.length > 10000) {
      throw new UnauthorizedException('Invalid synchronization payload');
    }

    const synchronizedUsers = await this.dataSource.transaction(
      async (manager) => {
        const users: Array<{ username: string; centralId: string }> = [];
        for (const payload of body.users) {
          if (
            !/^[\w.@+-]{1,255}$/.test(payload.username) ||
            !/^\$2[aby]\$\d{2}\$/.test(payload.passwordHash) ||
            !/^(admin|user)$/.test(payload.role)
          ) {
            throw new UnauthorizedException('Invalid synchronized account');
          }
          let user = await manager.findOne(SyncUser, {
            where: payload.centralId
              ? [
                  { centralId: payload.centralId },
                  { username: payload.username },
                ]
              : { username: payload.username },
          });
          if (!user) {
            user = manager.create(SyncUser, {
              centralId: payload.centralId || randomUUID(),
              username: payload.username,
              passwordHash: payload.passwordHash,
              role: payload.role,
              isActive: payload.isActive !== false,
              sourceUpdatedAt: payload.updatedAt
                ? new Date(payload.updatedAt)
                : null,
            });
          } else if (
            !user.sourceUpdatedAt ||
            !payload.updatedAt ||
            new Date(payload.updatedAt) >= user.sourceUpdatedAt
          ) {
            user.passwordHash = payload.passwordHash;
            user.role = payload.role;
            user.isActive = payload.isActive !== false;
            user.sourceUpdatedAt = payload.updatedAt
              ? new Date(payload.updatedAt)
              : null;
          }
          await manager.save(SyncUser, user);
          await manager.upsert(
            SyncDeviceUser,
            { deviceId: deviceId, centralId: user.centralId },
            ['deviceId', 'centralId'],
          );
          users.push({ username: user.username, centralId: user.centralId });
        }
        await manager.save(SyncLog, {
          deviceId: deviceId || 'unknown',
          operation: 'UPLOAD_USERS',
          success: true,
          message: `Synchronized ${body.users.length} users`,
        });
        return users;
      },
    );
    return { synchronized: body.users.length, users: synchronizedUsers };
  }

  @UseGuards(SyncServerGuard)
  @Get('users')
  async downloadUsers(@Req() request: { syncDevice?: SyncDevice }) {
    const deviceId = request.syncDevice?.deviceId;
    if (!deviceId) {
      throw new UnauthorizedException('Device authorization is required');
    }
    const assignments = await this.deviceUserRepository.find({
      where: { deviceId },
    });
    const centralIds = assignments.map((assignment) => assignment.centralId);
    const users = centralIds.length
      ? await this.userRepository
          .createQueryBuilder('user')
          .where('user.centralId IN (:...centralIds)', { centralIds })
          .orderBy('user.username', 'ASC')
          .getMany()
      : [];
    return {
      users: users.map((user) => ({
        centralId: user.centralId,
        username: user.username,
        passwordHash: user.passwordHash,
        role: user.role,
        isActive: user.isActive,
        updatedAt: user.updatedAt,
      })),
    };
  }

  @UseGuards(SyncServerGuard)
  @Patch('devices/heartbeat')
  heartbeat() {
    return { ok: true, timestamp: new Date().toISOString() };
  }

  @Post('devices/heartbeat')
  @UseGuards(SyncServerGuard)
  heartbeatPost() {
    return { ok: true, timestamp: new Date().toISOString() };
  }

  @Patch('users/:centralId')
  async updateUser(
    @Headers('x-sync-admin-token') adminToken: string,
    @Param('centralId') centralId: string,
    @Body() body: { isActive?: boolean; role?: string },
  ) {
    this.assertAdminToken(adminToken);
    const user = await this.userRepository.findOne({ where: { centralId } });
    if (!user) {
      throw new UnauthorizedException('Central account not found');
    }
    if (typeof body.isActive === 'boolean') user.isActive = body.isActive;
    if (body.role) user.role = body.role;
    await this.userRepository.save(user);
    return {
      centralId: user.centralId,
      isActive: user.isActive,
      role: user.role,
    };
  }

  @Patch('devices/:deviceId/revoke')
  async revokeDevice(
    @Headers('x-sync-admin-token') adminToken: string,
    @Param('deviceId') deviceId: string,
  ) {
    this.assertAdminToken(adminToken);
    const result = await this.deviceRepository.update(
      { deviceId },
      { isActive: false },
    );
    if (!result.affected) {
      throw new UnauthorizedException('Device not found');
    }
    return { deviceId, revoked: true };
  }

  @Post('devices/:deviceId/users/:centralId')
  async assignUserToDevice(
    @Headers('x-sync-admin-token') adminToken: string,
    @Param('deviceId') deviceId: string,
    @Param('centralId') centralId: string,
  ) {
    this.assertAdminToken(adminToken);
    const device = await this.deviceRepository.findOne({ where: { deviceId } });
    const user = await this.userRepository.findOne({ where: { centralId } });
    if (!device || !user) {
      throw new UnauthorizedException('Device or central account not found');
    }
    await this.deviceUserRepository.upsert({ deviceId, centralId }, [
      'deviceId',
      'centralId',
    ]);
    return { deviceId, centralId, assigned: true };
  }

  @Patch('devices/:deviceId/users/:centralId/revoke')
  async revokeUserFromDevice(
    @Headers('x-sync-admin-token') adminToken: string,
    @Param('deviceId') deviceId: string,
    @Param('centralId') centralId: string,
  ) {
    this.assertAdminToken(adminToken);
    const result = await this.deviceUserRepository.delete({
      deviceId,
      centralId,
    });
    if (!result.affected) {
      throw new UnauthorizedException('Device account assignment not found');
    }
    return { deviceId, centralId, revoked: true };
  }

  private assertAdminToken(token: string): void {
    if (!token || token !== process.env.SYNC_ADMIN_TOKEN) {
      throw new UnauthorizedException(
        'Synchronization administrator authorization is required',
      );
    }
  }
}
