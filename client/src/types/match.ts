export interface MatchNumber {
  number: number;
}

export interface Match {
  id: number;
  closed?: boolean;
  soldCards?: number;
  pattern?: string;
  matchNumbers?: MatchNumber[];
}
