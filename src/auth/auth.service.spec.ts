import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { OfflineAuthorizationService } from './offline-authorization.service';

describe('AuthService', () => {
  let service: AuthService;
  const userService = {
    findByUsername: jest.fn(),
    update: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn(() => 'signed-token'),
  };
  const offlineAuthorizationService = {
    assertAllowed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: OfflineAuthorizationService,
          useValue: offlineAuthorizationService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('login returns access token for valid credentials', async () => {
    const user = {
      id: 1,
      username: 'admin',
      role: 'admin',
      password: await require('bcrypt').hash('secret', 4),
    };
    userService.findByUsername.mockResolvedValue(user);

    const result = await service.login({
      username: 'admin',
      password: 'secret',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(jwtService.sign).toHaveBeenCalled();
  });
});
