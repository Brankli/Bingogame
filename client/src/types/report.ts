export interface DailyReportRow {
  date: string;
  matchId: number;
  roomId: number;
  roomName: string;
  betAmount: number;
  payout: number;
  profitLoss: number;
  numbers: number[];
}

export interface DailyReport {
  startDate: string;
  endDate: string;
  currency: string;
  totals: {
    bets: number;
    payouts: number;
    profit: number;
  };
  rows: DailyReportRow[];
}
