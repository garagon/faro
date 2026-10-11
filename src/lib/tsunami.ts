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
export function parseTsunamiData(value: unknown): TsunamiData {
  const d = value as TsunamiData | null;
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
  return { bulletins, partial: d.partial, fetched: d.fetched };
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
      const recent = now >= bulletin.issued && now - bulletin.issued <= RECENT_BULLETIN_WINDOW;
      // Preserve unresolved threats when the feed fails; never imply a safe/closed state.
      const needsReview =
        !newer && recent && (bulletin.kind === 'threat' || bulletin.kind === 'unknown');
      return { bulletin, state, recent, needsReview, reliable, replacedAt: newer?.issued };
    });
}
