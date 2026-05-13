import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../../user/user.service';
import { Socket } from 'socket.io';

@Injectable()
export class WsGuard implements CanActivate {
  private readonly logger: Logger = new Logger('SocketsGateway');

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | any | Promise<boolean | any> | Observable<boolean | any> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const authPayload = client.handshake?.auth || {};
    const bearerToken =
      authPayload.Bearer ||
      authPayload.bearer ||
      client.handshake?.headers?.authorization?.replace(/^Bearer\s+/i, '');

    if (!bearerToken) {
      this.logger.warn(`WS auth missing token for socket ${client.id}`);
      return false;
    }

    try {
      const decoded = this.jwtService.verify(bearerToken);
      return new Promise(async (resolve) => {
        const user = await this.userService.findOne(decoded.sub);
        if (user) {
          // Keep both locations for backward compatibility with existing handlers.
          client.data.user = user;
          context.switchToWs().getData().user = user;
          return resolve(true);
        }

        this.logger.warn(`WS auth failed: user not found for socket ${client.id}`);
        return resolve(false);
      });
    } catch (error) {
      this.logger.warn(`WS auth token verification failed for socket ${client.id}`);
      return false;
    }
  }
}
