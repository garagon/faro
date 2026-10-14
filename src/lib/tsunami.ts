export type Bulletin = {
  product: string;
  issued: number;
  eventId: string;
  place: string;
  url: string;
  basin: string;
  kind: 'ended' | 'cancelled' | 'information' | 'threat' | 'unknown';
  evaluation: string;
};
export type TsunamiData = { bulletins: Bulletin[]; partial: boolean; fetched: number };
export type BulletinState = 'ended' | 'cancelled' | 'information' | 'superseded' | 'unconfirmed';
// A display window, never an official expiry or cancellation time.
export const RECENT_BULLETIN_WINDOW = 6 * 60 * 60 * 1000;
// An unclosed threat older than the display window still blocks "no threat" for this long.
export const UNRESOLVED_WINDOW = 24 * 60 * 60 * 1000;
// A phone clock can run a few minutes slow: a message this far "ahead" still counts as recent.
const CLOCK_TOLERANCE = 10 * 60 * 1000;
/** `age` from the adapter places the retrieval on this device's clock, like the other feeds. */
export function parseTsunamiData(value: unknown, received = Date.now()): TsunamiData {
  const d = value as (TsunamiData & { age?: unknown }) | null;
  if (
    !d ||
    !Array.isArray(d.bulletins) ||
    !Number.isFinite(d.fetched) ||
    d.fetched <= 0 ||
    d.fetched > 8640000000000000 ||
    typeof d.partial !== 'boolean'
  )
    throw Error('Invalid NOAA response');
  const bulletins = d.bulletins.map((b) => {
    if (
      !b ||
      !['WEPA40', 'WEPA42', 'WECA41', 'WECA43'].includes(b.product) ||
      !Number.isFinite(b.issued) ||
      b.issued <= 0 ||
      b.issued > 8640000000000000 ||
      typeof b.eventId !== 'string' ||
      !/^\d+$/.test(b.eventId) ||
      !['Pacific', 'Caribbean'].includes(b.basin) ||
      typeof b.place !== 'string' ||
      typeof b.evaluation !== 'string'
    )
      throw Error('Invalid NOAA bulletin');
    const url = new URL(b.url);
    if (
      url.origin !== 'https://www.tsunami.gov' ||
      !url.pathname.startsWith('/events/PHEB/') ||
      url.username ||
      url.password
    )
      throw Error('Invalid NOAA link');
    const kind = ['ended', 'cancelled', 'information', 'threat'].includes(b.kind)
      ? b.kind
      : 'unknown';
    return { ...b, kind } as Bulletin;
  });
  const age =
    typeof d.age === 'number' && Number.isFinite(d.age) && d.age >= 0 && d.age <= 24 * 3600000
      ? d.age
      : null;
  if (age === null) return { bulletins, partial: d.partial, fetched: d.fetched };
  // Issue times are absolute; shift them by this device's clock error, measured against the
  // adapter, so a slow or fast phone places each message at the right distance from "now".
  const offset = received - age - d.fetched;
  return {
    bulletins: bulletins.map((b) => ({ ...b, issued: b.issued + offset })),
    partial: d.partial,
    fetched: received - age,
  };
}
/**
 * The last answer kept on this device, for an offline reload: an open threat must not vanish
 * because the page reloaded without network. It is validated like a live answer and keeps its
 * retrieval time, so it is never reliable enough to read as "no threat".
 */
export function reviveTsunami(value: unknown, now = Date.now()): TsunamiData | null {
  const v = value as { fetched?: unknown } | null;
  if (!v || typeof v.fetched !== 'number' || v.fetched > now || now - v.fetched > UNRESOLVED_WINDOW)
    return null;
  try {
    // Without `age` the stored times are used as they are: already on this device's clock.
    return parseTsunamiData({ ...v, age: undefined });
  } catch {
    return null;
  }
}
export function classifyBulletins(data: TsunamiData, now: number, failed = false) {
  const reliable = !failed && !data.partial && now >= data.fetched && now - data.fetched <= 120000;
  return [...data.bulletins]
    .sort((a, b) => b.issued - a.issued)
    .map((bulletin) => {
      const newer = data.bulletins.find(
        (b) =>
          b.eventId === bulletin.eventId &&
          b.basin === bulletin.basin &&
          b.issued > bulletin.issued,
      );
      const state: BulletinState = newer
        ? 'superseded'
        : ['ended', 'cancelled', 'information'].includes(bulletin.kind)
          ? (bulletin.kind as BulletinState)
          : 'unconfirmed';
      const age = now - bulletin.issued;
      const recent = age >= -CLOCK_TOLERANCE && age <= RECENT_BULLETIN_WINDOW;
      // A threat (or unreadable message) with no later message for its event is still open.
      const open = !newer && (bulletin.kind === 'threat' || bulletin.kind === 'unknown');
      // Preserve unresolved threats when the feed fails; never imply a safe/closed state.
      const needsReview = open && recent;
      // Open but outside the window (older, or dated well ahead): it cannot be confirmed as over.
      const unresolved = open && !recent && age <= UNRESOLVED_WINDOW;
      return {
        bulletin,
        state,
        recent,
        needsReview,
        unresolved,
        reliable,
        replacedAt: newer?.issued,
      };
    });
}
