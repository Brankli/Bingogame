import {
  buildRoomCardNumber,
  buildStaticTemplateCardNumber,
  cardNumberLookupVariants,
  normalizeRoomCardNumber,
  parseRoomCardIndex,
  parseStaticTemplateIndex,
} from './card-number.util';

describe('card-number.util', () => {
  it('builds canonical CAR format', () => {
    expect(buildRoomCardNumber(9, 1)).toBe('ROOM9-CAR0001');
  });

  it('builds and parses static template numbers', () => {
    expect(buildStaticTemplateCardNumber(1)).toBe('STATIC-CAR0001');
    expect(parseStaticTemplateIndex('STATIC-CAR0042')).toBe(42);
  });

  it('parses CAR and legacy CARD suffix', () => {
    expect(parseRoomCardIndex('ROOM9-CAR0001')).toBe(1);
    expect(parseRoomCardIndex('ROOM9-CARD0042')).toBe(42);
  });

  it('normalizes numeric and legacy input', () => {
    expect(normalizeRoomCardNumber('1', 9)).toBe('ROOM9-CAR0001');
    expect(normalizeRoomCardNumber('ROOM9-CARD0003', 9)).toBe('ROOM9-CAR0003');
    expect(normalizeRoomCardNumber('CARD-5', 9)).toBe('ROOM9-CAR0005');
  });

  it('expands lookup variants for legacy CARD rows', () => {
    const variants = cardNumberLookupVariants('ROOM9-CARD0001', 9);
    expect(variants).toContain('ROOM9-CARD0001');
    expect(variants).toContain('ROOM9-CAR0001');
  });
});
