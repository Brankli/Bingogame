import {
  BINGO_COLUMN_RANGES,
  generateBingoCard,
  maxConsecutiveRun,
  validateBingoGrid,
  MAX_CONSECUTIVE_IN_COLUMN,
} from './bingo-grid.util';
import { STATIC_LIBRARY_SEED_BASE } from './card-number.util';

describe('bingo-grid.util', () => {
  it('generates a 5x5 grid', () => {
    const grid = generateBingoCard(42);
    expect(grid).toHaveLength(5);
    grid.forEach((row) => expect(row).toHaveLength(5));
  });

  it('places FREE at center', () => {
    const grid = generateBingoCard(99);
    expect(grid[2][2]).toBe(0);
  });

  it('validates generated cards', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const grid = generateBingoCard(seed * 1000);
      const result = validateBingoGrid(grid);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    }
  });

  it('keeps column values in range', () => {
    const grid = generateBingoCard(5000);
    for (let col = 0; col < 5; col++) {
      const [min, max] = BINGO_COLUMN_RANGES[col];
      for (let row = 0; row < 5; row++) {
        if (row === 2 && col === 2) continue;
        expect(grid[row][col]).toBeGreaterThanOrEqual(min);
        expect(grid[row][col]).toBeLessThanOrEqual(max);
      }
    }
  });

  it('is reproducible for the same seed', () => {
    const a = generateBingoCard(12345);
    const b = generateBingoCard(12345);
    expect(a).toEqual(b);
  });

  it('rejects invalid center', () => {
    const grid = generateBingoCard(1);
    grid[2][2] = 31;
    const result = validateBingoGrid(grid);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('FREE'))).toBe(true);
  });

  it('detects consecutive runs', () => {
    expect(maxConsecutiveRun([56, 57, 58, 59, 60])).toBe(5);
    expect(maxConsecutiveRun([56, 58, 60, 62, 64])).toBe(1);
  });

  it('avoids long consecutive runs in each column', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const grid = generateBingoCard(STATIC_LIBRARY_SEED_BASE + seed * 1000);
      for (let col = 0; col < 5; col++) {
        const colNumbers = grid
          .map((row, rowIndex) => row[col])
          .filter((_, rowIndex) => !(rowIndex === 2 && col === 2));
        const sorted = [...colNumbers].sort((a, b) => a - b);
        expect(maxConsecutiveRun(sorted)).toBeLessThanOrEqual(
          MAX_CONSECUTIVE_IN_COLUMN,
        );
      }
    }
  });
});
