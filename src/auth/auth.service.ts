import { Injectable, Logger } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { User } from '../user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { OfflineAuthorizationService } from './offline-authorization.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly offlineAuthorizationService: OfflineAuthorizationService,
  ) {}

  async login(loginDto: LoginDto): Promise<{ user; accessToken }> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (user === null) {
      return null;
    }

    // Activity tracking must not prevent a valid user from signing in.
    try {
      await this.userService.update(user.id, { lastActive: new Date() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Login succeeded, but last-active tracking failed for user ${user.id}: ${message}`,
      );
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
    return { user, accessToken };
  }

  async register(loginDto: LoginDto): Promise<{ user; accessToken }> {
    let user = await this.userService.findByUsername(loginDto.username);
    if (user !== null) {
      return null;
    }

    user = await this.userService.create(loginDto);

    const accessToken = this.jwtService.sign({
      sub: user.id,
      username: user.username,
      role: user.role,
    });
    return { user, accessToken };
  }

  async me(id: number): Promise<User> {
    const me = await this.userService.findOne(id);
    return me;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    await this.offlineAuthorizationService.assertAllowed();
    const user = await this.userService.findByUsername(username);
    if (user === null || user.isActive === false) {
      return null;
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return null;
    }

    return user;
  }
}
