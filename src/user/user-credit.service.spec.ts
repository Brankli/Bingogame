import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { UserCreditTransaction } from './entities/user-credit-transaction.entity';
import { EarningsTransaction } from './entities/earnings-transaction.entity';

describe('UserService - Credit Management', () => {
  let service: UserService;
  let userRepository: Repository<User>;
  let creditTransactionRepository: Repository<UserCreditTransaction>;

  const mockUserRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockCreditTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockEarningsTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(UserCreditTransaction),
          useValue: mockCreditTransactionRepository,
        },
        {
          provide: getRepositoryToken(EarningsTransaction),
          useValue: mockEarningsTransactionRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    creditTransactionRepository = module.get<Repository<UserCreditTransaction>>(
      getRepositoryToken(UserCreditTransaction),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addCredits', () => {
    it('should add credits to user account', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        credits: 50,
        gamesPlayed: 10,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        credits: 150,
      });
      mockCreditTransactionRepository.create.mockReturnValue({});
      mockCreditTransactionRepository.save.mockResolvedValue({});

      const result = await service.addCredits(1, 100, 2, 'Top-up');

      expect(result.credits).toBe(150);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        credits: 150,
      });
      expect(mockCreditTransactionRepository.save).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.addCredits(999, 100, 2, 'Top-up')).rejects.toThrow(
        'User not found',
      );
    });
  });

  describe('deductCredit', () => {
    it('should deduct 1 credit and increment gamesPlayed', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        credits: 50,
        gamesPlayed: 10,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        credits: 49,
        gamesPlayed: 11,
      });
      mockCreditTransactionRepository.create.mockReturnValue({});
      mockCreditTransactionRepository.save.mockResolvedValue({});

      const result = await service.deductCredit(1, 5);

      expect(result.credits).toBe(49);
      expect(result.gamesPlayed).toBe(11);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...mockUser,
        credits: 49,
        gamesPlayed: 11,
      });
    });

    it('should throw error if user has no credits', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        credits: 0,
        gamesPlayed: 100,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.deductCredit(1, 5)).rejects.toThrow(
        'No credits remaining',
      );
    });
  });

  describe('resetGamesPlayed', () => {
    it('should reset gamesPlayed counter to 0', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        credits: 50,
        gamesPlayed: 100,
      } as User;

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        gamesPlayed: 0,
      });
      mockCreditTransactionRepository.create.mockReturnValue({});
      mockCreditTransactionRepository.save.mockResolvedValue({});

      const result = await service.resetGamesPlayed(1, 2);

      expect(result.gamesPlayed).toBe(0);
      expect(result.credits).toBe(50); // Credits unchanged
      expect(mockCreditTransactionRepository.save).toHaveBeenCalled();
    });
  });

  describe('getUserCreditTransactions', () => {
    it('should return user credit transaction history', async () => {
      const mockTransactions = [
        {
          id: 1,
          amount: 100,
          type: 'top_up',
          balanceBefore: 0,
          balanceAfter: 100,
        },
        {
          id: 2,
          amount: -1,
          type: 'game_deduction',
          balanceBefore: 100,
          balanceAfter: 99,
        },
      ];

      mockCreditTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.getUserCreditTransactions(1);

      expect(result).toEqual(mockTransactions);
      expect(mockCreditTransactionRepository.find).toHaveBeenCalledWith({
        where: { user: { id: 1 } },
        order: { createdAt: 'DESC' },
      });
    });
  });
});
