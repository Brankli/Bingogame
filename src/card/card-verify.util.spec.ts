import {
  buildMarkedCells,
  countMarkedNonFreeCells,
  evaluatePatternWins,
  normalizeCalledNumbers,
  normalizeVerifyPattern,
} from './card-verify.util';

const cornersGrid: number[][] = [
  [1, 16, 31, 46, 61],
  [2, 17, 32, 47, 62],
  [3, 18, 0, 48, 63],
  [4, 19, 34, 49, 64],
  [5, 20, 35, 50, 65],
];

describe('card-verify.util', () => {
  it('normalizes pattern aliases', () => {
    expect(normalizeVerifyPattern('Four Corners')).toBe('corners');
    expect(normalizeVerifyPattern('any-line')).toBe('anyline');
  });

  it('dedupes and filters called numbers', () => {
    expect(normalizeCalledNumbers([8, 8, 72, 0, 200, 45])).toEqual([8, 72, 45]);
  });

  it('accepts corners win on last called number', () => {
    const called = [1, 61, 5, 72, 65];
    const marked = buildMarkedCells(cornersGrid, called);
    const options = [
      [
        [0, 0],
        [0, 4],
        [4, 0],
        [4, 4],
      ],
    ];
    const result = evaluatePatternWins(
      cornersGrid,
      marked,
      options,
      65,
      () => 'Four Corners',
    );
    expect(result.validNow).toHaveLength(1);
    expect(result.lateOnly).toHaveLength(0);
  });

  it('flags late claim when pattern was complete before last call', () => {
    const called = [1, 61, 5, 65, 72, 8];
    const marked = buildMarkedCells(cornersGrid, called);
    const options = [
      [
        [0, 0],
        [0, 4],
        [4, 0],
        [4, 4],
      ],
    ];
    const result = evaluatePatternWins(
      cornersGrid,
      marked,
      options,
      8,
      () => 'Four Corners',
    );
    expect(result.validNow).toHaveLength(0);
    expect(result.lateOnly).toHaveLength(1);
  });

  it('counts marked non-free cells for special win', () => {
    expect(countMarkedNonFreeCells(cornersGrid, [16, 17])).toBe(2);
    expect(countMarkedNonFreeCells(cornersGrid, [])).toBe(0);
  });
});
