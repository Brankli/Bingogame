/** Canonical format: ROOM{id}-CAR{0001} — keep in sync with src/card/card-number.util.ts */

const ROOM_CAR = /^ROOM(\d+)-CAR(\d+)$/i;
const ROOM_CARD_LEGACY = /^ROOM(\d+)-CARD(\d+)$/i;

export function buildRoomCardNumber(roomId: number, index: number): string {
  return `ROOM${roomId}-CAR${String(index).padStart(4, '0')}`;
}

export function normalizeCardNumber(raw: string, roomId: number): string {
  const value = String(raw || '').trim().toUpperCase();
  if (!value) return '';

  if (ROOM_CAR.test(value)) {
    return value;
  }

  if (ROOM_CARD_LEGACY.test(value)) {
    const match = value.match(ROOM_CARD_LEGACY);
    const index = match ? parseInt(match[2], 10) : 1;
    return buildRoomCardNumber(roomId, index);
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
