import { writeLocal } from './browserStorage.ts';
import { validCheckIn, type CheckIn } from './traveler.ts';
// A failed save must not prevent preparing a message, or overwrite saved history.
export function prepareCheckIn(
  row: CheckIn,
  history: CheckIn[],
  storage?: Pick<Storage, 'setItem' | 'getItem'>,
) {
  if (!validCheckIn(row)) throw Error('Invalid check-in');
  const rows = [row, ...history].slice(0, 10);
  try {
    writeLocal('faro-checkins-v1', JSON.stringify(rows), storage);
    return { persisted: true, rows, message: row };
  } catch {
    return { persisted: false, rows: history, message: row };
  }
}
