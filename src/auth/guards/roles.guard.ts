import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../user/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const userRole = String(user.role ?? '').toLowerCase();
    const allowed = requiredRoles.some(
      (role) => userRole === String(role).toLowerCase(),
    );

    if (!allowed) {
      throw new ForbiddenException(
        `Admin access required. Your account role is "${user.role ?? 'unknown'}". Log in as an admin user.`,
      );
    }

    return true;
  }
}
