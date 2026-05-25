import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRole } from './entities/user.entity';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AdminBootstrapService.name);

  constructor(private readonly userService: UserService) {}

  async onModuleInit(): Promise<void> {
    const username = (process.env.ADMIN_USERNAME || 'admin').trim();
    const isProduction = process.env.NODE_ENV === 'production';
    const password = process.env.ADMIN_PASSWORD;

    if (isProduction && !password) {
      this.logger.error(
        'ADMIN_PASSWORD is required in production. Set ADMIN_PASSWORD before starting the server.',
      );
      throw new Error('ADMIN_PASSWORD is required in production');
    }

    const resolvedPassword = password || 'admin123';

    try {
      // Always ensure the configured username is an admin (useful for dev/seed scenarios).
      const configured = await this.userService.findByUsername(username);
      if (configured && configured.role !== UserRole.ADMIN) {
        await this.userService.update(configured.id, { role: UserRole.ADMIN });
        this.logger.warn(
          `Promoted existing user "${username}" to admin (bootstrap).`,
        );
        return;
      }

      const adminCount = await this.userService.countByRole(UserRole.ADMIN);
      if (adminCount > 0) {
        return;
      }

      const existing = await this.userService.findByUsername(username);
      if (existing) {
        await this.userService.update(existing.id, { role: UserRole.ADMIN });
        this.logger.warn(
          `Promoted existing user "${username}" to admin (bootstrap).`,
        );
        return;
      }

      const created = await this.userService.create({
        username,
        password: resolvedPassword,
      });
      await this.userService.update(created.id, { role: UserRole.ADMIN });

      this.logger.warn(
        `Bootstrapped admin user "${username}". Set ADMIN_PASSWORD env to change the default password.`,
      );
    } catch (error) {
      this.logger.error('Failed to bootstrap admin user', error as any);
    }
  }
}
