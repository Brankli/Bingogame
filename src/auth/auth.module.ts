import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './jwt.strategy';
import { WsGuard } from './guards/ws.guard';
import { LocalStrategy } from './local.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { RoomManagerGuard } from './guards/room-manager.guard';
import { RoomModule } from '../room/room.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncState } from '../sync/entities/sync-state.entity';
import { OfflineAuthorizationService } from './offline-authorization.service';

@Module({
  imports: [
    UserModule,
    TypeOrmModule.forFeature([SyncState]),
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('SECRET_KEY'),
        signOptions: { expiresIn: '8h' },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    forwardRef(() => RoomModule),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    WsGuard,
    JwtAuthGuard,
    RolesGuard,
    RoomManagerGuard,
    OfflineAuthorizationService,
  ],
  exports: [JwtAuthGuard, WsGuard, RolesGuard, RoomManagerGuard],
})
export class AuthModule {}
