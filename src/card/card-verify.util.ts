/**
 * Pure helpers for bingo win verification (used by CardService.verify).
 */

export function normalizeVerifyPattern(pattern: string): string {
  const compact = String(pattern || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

  const aliases: Record<string, string> = {
    fourcorners: 'corners',
    corner: 'corners',
    anyline: 'anyline',
    fullhouse: 'fullhouse',
    full: 'fullhouse',
    xpattern: 'x',
    line: 'anyline',
  };

  return aliases[compact] || compact;
}

export function normalizeCalledNumbers(calledNumbers: unknown): number[] {
  if (!Array.isArray(calledNumbers)) {
    return [];
  }
  const seen = new Set<number>();
  const result: number[] = [];
  for (const raw of calledNumbers) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1 || n > 75 || seen.has(n)) {
      continue;
    }
    seen.add(n);
    result.push(n);
  }
  return result;
}

export function buildMarkedCells(
  grid: number[][],
  calledNumbers: number[],
): boolean[][] {
  const calledSet = new Set(calledNumbers);
  return grid.map((row) =>
    row.map((num) => num === 0 || calledSet.has(num)),
  );
}

export function countMarkedNonFreeCells(
  grid: number[][],
  calledNumbers: number[],
): number {
  const calledSet = new Set(calledNumbers);
  let count = 0;
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (row === 2 && col === 2) continue;
      const cellValue = grid[row][col];
      if (cellValue !== 0 && calledSet.has(cellValue)) {
        count++;
      }
    }
  }
  return count;
}

export type PatternWinEvaluation = {
  validNow: number[][][];
  validNowNames: string[];
  lateOnly: number[][][];
  lateOnlyNames: string[];
};

export function evaluatePatternWins(
  grid: number[][],
  markedCells: boolean[][],
  patternOptions: number[][][],
  lastCalledNumber: number | null,
  nameForIndex: (index: number) => string,
): PatternWinEvaluation {
  const validNow: number[][][] = [];
  const validNowNames: string[] = [];
  const lateOnly: number[][][] = [];
  const lateOnlyNames: string[] = [];

  for (let i = 0; i < patternOptions.length; i++) {
    const patternCoords = patternOptions[i];
    const allMarked = patternCoords.every(([row, col]) => {
      if (
        !Number.isInteger(row) ||
        !Number.isInteger(col) ||
        row < 0 ||
        row >= 5 ||
        col < 0 ||
        col >= 5
      ) {
        return false;
      }
      return Boolean(markedCells[row]?.[col]);
    });

    if (!allMarked) {
      continue;
    }

    const patternName = nameForIndex(i);
    const completedOnLastCall =
      lastCalledNumber === null
        ? false
        : patternCoords.some(([row, col]) => grid[row][col] === lastCalledNumber);

    if (completedOnLastCall) {
      validNow.push(patternCoords);
      validNowNames.push(patternName);
    } else {
      lateOnly.push(patternCoords);
      lateOnlyNames.push(patternName);
    }
  }

  return { validNow, validNowNames, lateOnly, lateOnlyNames };
}
