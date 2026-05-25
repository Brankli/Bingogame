/**
 * Canonical room card format: ROOM{id}-CAR{0001-0400}
 * Legacy CARD suffix is accepted for lookup only.
 */

const ROOM_CAR_REGEX = /^ROOM(\d+)-CAR(\d+)$/i;
const ROOM_CARD_LEGACY_REGEX = /^ROOM(\d+)-CARD(\d+)$/i;
const STATIC_CAR_REGEX = /^STATIC-CAR(\d+)$/i;

/** Global seed base for the shared static card library (same grids for every static room). */
export const STATIC_LIBRARY_SEED_BASE = 7777;

export function buildRoomCardNumber(roomId: number, index: number): string {
  return `ROOM${roomId}-CAR${String(index).padStart(4, '0')}`;
}

export function buildStaticTemplateCardNumber(index: number): string {
  return `STATIC-CAR${String(index).padStart(4, '0')}`;
}

export function parseStaticTemplateIndex(cardNumber: string): number | null {
  const value = String(cardNumber || '')
    .trim()
    .toUpperCase();
  const match = value.match(STATIC_CAR_REGEX);
  if (!match) {
    return null;
  }
  const index = parseInt(match[1], 10);
  return Number.isFinite(index) ? index : null;
}

export function parseRoomCardIndex(cardNumber: string): number | null {
  const value = String(cardNumber || '')
    .trim()
    .toUpperCase();
  const match =
    value.match(ROOM_CAR_REGEX) || value.match(ROOM_CARD_LEGACY_REGEX);
  if (!match) {
    return null;
  }
  const index = parseInt(match[2], 10);
  return Number.isFinite(index) ? index : null;
}

export function parseRoomIdFromCardNumber(cardNumber: string): number | null {
  const value = String(cardNumber || '')
    .trim()
    .toUpperCase();
  const match =
    value.match(ROOM_CAR_REGEX) || value.match(ROOM_CARD_LEGACY_REGEX);
  if (!match) {
    return null;
  }
  const roomId = parseInt(match[1], 10);
  return Number.isFinite(roomId) ? roomId : null;
}

/** Normalize user input to canonical ROOM{n}-CAR{####} when roomId is known. */
export function normalizeRoomCardNumber(raw: string, roomId: number): string {
  const value = String(raw || '')
    .trim()
    .toUpperCase();
  if (!value) {
    return '';
  }

  if (ROOM_CAR_REGEX.test(value)) {
    return value.replace(/-CAR/i, '-CAR');
  }

  if (ROOM_CARD_LEGACY_REGEX.test(value)) {
    const index = parseRoomCardIndex(value);
    return index != null ? buildRoomCardNumber(roomId, index) : value;
  }

  if (/^\d+$/.test(value)) {
    return buildRoomCardNumber(roomId, parseInt(value, 10));
  }

  if (value.startsWith('CARD-')) {
    const suffix = value.slice(5);
    if (/^\d+$/.test(suffix)) {
      return buildRoomCardNumber(roomId, parseInt(suffix, 10));
    }
  }

  const digits = value.match(/(\d+)/);
  if (digits) {
    return buildRoomCardNumber(roomId, parseInt(digits[1], 10));
  }

  return value;
}

/** All DB keys to try when resolving a card (canonical + legacy typo). */
export function cardNumberLookupVariants(
  identifier: string,
  roomId?: number,
): string[] {
  const value = String(identifier || '')
    .trim()
    .toUpperCase();
  const variants = new Set<string>();
  if (!value) {
    return [];
  }

  variants.add(value);

  const index = parseRoomCardIndex(value);
  const parsedRoomId = parseRoomIdFromCardNumber(value) ?? roomId;

  if (index != null && parsedRoomId != null) {
    variants.add(buildRoomCardNumber(parsedRoomId, index));
    variants.add(`ROOM${parsedRoomId}-CARD${String(index).padStart(4, '0')}`);
  } else if (roomId != null && /^\d+$/.test(value)) {
    const num = parseInt(value, 10);
    variants.add(buildRoomCardNumber(roomId, num));
    variants.add(`ROOM${roomId}-CARD${String(num).padStart(4, '0')}`);
  }

  return [...variants];
}
