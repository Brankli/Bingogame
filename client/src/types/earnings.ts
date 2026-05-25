export interface EarningsTransaction {
  id: number;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  type: string;
  reason?: string;
  performedBy?: string;
  createdAt: string;
}
