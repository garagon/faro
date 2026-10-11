// Personal data stays in this origin's browser storage. No network fallback.
export function writeLocal(
  key: string,
  value: string,
  storage: Pick<Storage, 'setItem' | 'getItem'> = localStorage,
) {
  storage.setItem(key, value);
  if (storage.getItem(key) !== value) throw Error('Browser did not retain the saved data');
}
export function removeLocal(
  key: string,
  storage: Pick<Storage, 'removeItem' | 'getItem'> = localStorage,
) {
  storage.removeItem(key);
  if (storage.getItem(key) !== null) throw Error('Browser did not remove the saved data');
}
