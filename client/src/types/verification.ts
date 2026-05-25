export interface VerificationResult {
  isValid: boolean;
  message: string;
  lateClaim?: boolean;
  unregistered?: boolean;
  cardLocked?: boolean;
  specialWin?: boolean;
  lastCalledNumber?: number;
  patternNames?: string[];
  markedCells?: boolean[][];
  /** Grid coordinates [row, col] for one winning pattern */
  winningPattern?: number[][];
  /** All winning patterns (e.g. multiple lines on one card) */
  winningPatterns?: number[][][];
}
