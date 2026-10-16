import type { Localized } from './i18n.ts';

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
export type ClassifiedBulletin = ReturnType<typeof classifyBulletins>[number];

/**
 * How Faro names an open NOAA message: NOAA's own message type and Faro's level for it, the same
 * on the banner, the Situación row and the Tsunami tab. It never says whether the message applies
 * to a coast; the person reads the bulletin for that.
 */
export type TsunamiNotice = { level: 1 | 3; label: Localized };
export const noticeLabels = {
  /** A recent threat message (WEPA40/WECA41 "Tsunami Threat Message") with nothing closing it. */
  threat: ['Mensaje de amenaza', 'Threat message', 'Mensagem de ameaça'],
  /** A recent message Faro cannot read as a threat or a closure. */
  review: ['Mensaje por revisar', 'Message to review', 'Mensagem para revisar'],
  /** An open message older than the display window: it cannot be confirmed as over. */
  unclosed: ['Sin mensaje de cierre', 'No closing message', 'Sem mensagem de encerramento'],
} satisfies Record<string, Localized>;

export function bulletinNotice(row: ClassifiedBulletin): TsunamiNotice | null {
  if (row.needsReview)
    return row.bulletin.kind === 'threat'
      ? { level: 3, label: noticeLabels.threat }
      : { level: 1, label: noticeLabels.review };
  if (row.unresolved) return { level: 1, label: noticeLabels.unclosed };
  return null;
}

/**
 * The one open message the home and the emergency screen lead with: the highest level first,
 * then the newest. Every place that names it reads this result, so it never changes its words or
 * level between screens.
 */
export function leadingNotice(data: TsunamiData | null, now: number, failed = false) {
  if (!data) return undefined;
  const open = classifyBulletins(data, now, failed)
    .map((row) => ({ row, notice: bulletinNotice(row) }))
    .filter((x): x is { row: ClassifiedBulletin; notice: TsunamiNotice } => !!x.notice);
  // Rows are newest first; a stable sort keeps that order within one level.
  return open.sort((a, b) => b.notice.level - a.notice.level)[0];
}

// Words NOAA uses for position and direction; everything else in a place name is a name.
const PLACE_WORDS = new Set(
  'off the of near coast coasts east west north south northeast northwest southeast southwest northern southern eastern western central region and in at to from border area offshore km'.split(
    ' ',
  ),
);
const COMPASS = /^(n|s|e|w|ne|nw|se|sw|nne|ene|ese|sse|ssw|wsw|wnw|nnw)$/;
/**
 * NOAA writes places in capitals ("OFF THE COAST OF PANAMA"). For reading they are set in
 * sentence case with names capitalised ("Off the coast of Panama"); the words are not changed.
 * Text that is not all capitals is returned as published.
 */
export function readablePlace(place: string) {
  const letters = place.replace(/[^\p{L}]/gu, '');
  if (!letters || letters !== letters.toUpperCase()) return place;
  return place.toLowerCase().replace(/\p{L}+/gu, (word, at: number) => {
    // Only the first word of the text starts with a capital ("100 km SW of Lima").
    const start = !place.slice(0, at).trim();
    if (COMPASS.test(word)) return word.toUpperCase();
    if (!start && PLACE_WORDS.has(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  });
}
