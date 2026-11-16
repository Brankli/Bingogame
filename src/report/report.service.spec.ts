import { ReportService } from './report.service';

describe('ReportService', () => {
  const createService = (matches: any[], managers: any[] = []) => {
    const matchRepository = {
      find: jest.fn().mockResolvedValue(matches),
    };
    const roomManagerRepository = {
      find: jest.fn().mockResolvedValue(managers),
    };

    return {
      service: new ReportService(
        matchRepository as any,
        roomManagerRepository as any,
      ),
      matchRepository,
      roomManagerRepository,
    };
  };

  it('calculates totals and preserves called numbers for an administrator', async () => {
    const { service, matchRepository, roomManagerRepository } = createService([
      {
        id: 7,
        createdAt: new Date('2026-10-23T12:00:00.000Z'),
        soldCards: 4,
        betAmount: 60,
        houseFeePercent: 20,
        payoutAmount: 192,
        room: { id: 2, name: 'Main Room', ticketPrice: 60 },
        matchNumbers: [{ number: 44 }, { number: 1 }],
      },
    ]);

    const result = await service.getDailyReport('2026-10-23', '2026-10-23', {
      id: 1,
      role: 'admin',
    });

    expect(matchRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: { room: true, matchNumbers: true },
      }),
    );
    expect(roomManagerRepository.find).not.toHaveBeenCalled();
    expect(result.totals).toEqual({
      bets: 240,
      payouts: 192,
      profit: 48,
    });
    expect(result.rows[0].numbers).toEqual([1, 44]);
  });

  it('limits ordinary users to their managed rooms', async () => {
    const { service, matchRepository, roomManagerRepository } = createService(
      [],
      [{ room: { id: 9 } }],
    );

    await service.getDailyReport('2026-10-23', '2026-10-24', {
      id: 5,
      role: 'user',
    });

    expect(roomManagerRepository.find).toHaveBeenCalledWith({
      where: { user: { id: 5 } },
      relations: { room: true },
    });
    expect(matchRepository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          room: { id: expect.anything() },
        }),
      }),
    );
  });

  it('rejects invalid date ranges', async () => {
    const { service } = createService([]);

    await expect(
      service.getDailyReport('2026-10-25', '2026-10-24', {
        id: 1,
        role: 'admin',
      }),
    ).rejects.toThrow('startDate and endDate must use YYYY-MM-DD');
  });
});
