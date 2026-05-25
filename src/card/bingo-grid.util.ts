/** B-I-N-G-O column ranges for standard 75-ball bingo */
export const BINGO_COLUMN_RANGES: ReadonlyArray<readonly [number, number]> = [
  [1, 15],
  [16, 30],
  [31, 45],
  [46, 60],
  [61, 75],
] as const;

export const BINGO_FREE_ROW = 2;
export const BINGO_FREE_COL = 2;

/** Reject column picks with this many or more consecutive integers (e.g. 56–60). */
export const MAX_CONSECUTIVE_IN_COLUMN = 3;

type SeededRng = {
  next: () => number;
};

function createSeededRng(seed: number): SeededRng {
  let state = seed;
  return {
    next: () => {
      state += 1;
      const x = Math.sin(state) * 10000;
      return x - Math.floor(x);
    },
  };
}

function shuffleInPlace<T>(items: T[], rng: SeededRng): void {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

/** Longest run of consecutive integers in a sorted list. */
export function maxConsecutiveRun(sorted: number[]): number {
  if (sorted.length <= 1) {
    return sorted.length;
  }

  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

/**
 * Pick `count` distinct values from [min, max] without long consecutive runs.
 * Returned order is shuffled (not sorted) so the card has no obvious vertical pattern.
 */
export function pickColumnValues(
  min: number,
  max: number,
  count: number,
  rng: SeededRng,
  maxAttempts = 80,
): number[] {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const working = [...pool];
    shuffleInPlace(working, rng);
    const picked = working.slice(0, count);
    const sorted = [...picked].sort((a, b) => a - b);

    if (maxConsecutiveRun(sorted) <= MAX_CONSECUTIVE_IN_COLUMN) {
      shuffleInPlace(picked, rng);
      return picked;
    }
  }

  // Fallback: spread picks across the range (still non-consecutive when possible)
  const step = Math.max(1, Math.floor(pool.length / count));
  const spread: number[] = [];
  let start = Math.floor(rng.next() * Math.max(1, pool.length - step * count));
  for (let i = 0; i < count; i++) {
    spread.push(pool[Math.min(pool.length - 1, start + i * step)]);
  }
  shuffleInPlace(spread, rng);
  return spread;
}

/**
 * Generate a valid 5x5 bingo grid (center cell = 0 FREE).
 * Column values are random, non-consecutive, and shuffled in display order.
 */
export function generateBingoCard(seed?: number): number[][] {
  const grid: number[][] = [];
  const rng = createSeededRng(seed ?? Date.now());

  for (let col = 0; col < 5; col++) {
    const [min, max] = BINGO_COLUMN_RANGES[col];
    const columnNumbers = pickColumnValues(min, max, 5, rng);

    for (let row = 0; row < 5; row++) {
      if (!grid[row]) grid[row] = [];
      if (row === BINGO_FREE_ROW && col === BINGO_FREE_COL) {
        grid[row][col] = 0;
      } else {
        grid[row][col] = columnNumbers[row];
      }
    }
  }

  return grid;
}

export interface BingoGridValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a 5x5 bingo grid follows column rules and free space.
 */
export function validateBingoGrid(grid: number[][]): BingoGridValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(grid) || grid.length !== 5) {
    return { valid: false, errors: ['Grid must be 5 rows'] };
  }

  for (let row = 0; row < 5; row++) {
    if (!Array.isArray(grid[row]) || grid[row].length !== 5) {
      errors.push(`Row ${row} must have 5 columns`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const value = grid[row][col];

      if (row === BINGO_FREE_ROW && col === BINGO_FREE_COL) {
        if (value !== 0) {
          errors.push('Center cell must be 0 (FREE)');
        }
        continue;
      }

      if (!Number.isInteger(value)) {
        errors.push(`Cell [${row}][${col}] must be an integer`);
        continue;
      }

      const [min, max] = BINGO_COLUMN_RANGES[col];
      if (value < min || value > max) {
        errors.push(
          `Cell [${row}][${col}] value ${value} outside column ${col} range ${min}-${max}`,
        );
      }
    }
  }

  for (let col = 0; col < 5; col++) {
    const colNumbers = grid
      .map((row, rowIndex) => row[col])
      .filter(
        (_, rowIndex) =>
          !(rowIndex === BINGO_FREE_ROW && col === BINGO_FREE_COL),
      );
    const unique = new Set(colNumbers);
    if (unique.size !== colNumbers.length) {
      errors.push(`Column ${col} contains duplicate numbers`);
    }

    const sorted = [...colNumbers].sort((a, b) => a - b);
    if (maxConsecutiveRun(sorted) > MAX_CONSECUTIVE_IN_COLUMN) {
      errors.push(
        `Column ${col} has too many consecutive numbers (${sorted.join(',')})`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
