import { ACTIVE_WINDOW, type AlertLevel, type AlertType, type HazardAlert } from './alerts.ts';
import type { Quake } from './domain.ts';
import { classifyBulletins, type TsunamiData } from './tsunami.ts';

/** Hazards summarized on the situation screen, in display order. */
export type HazardKey = 'earthquake' | 'tsunami' | 'cyclone' | 'flood' | 'volcano';
/**
 * listed: the source lists at least one item for the place (a fact, not a risk level).
 * none: the source answered and lists nothing. pending: the first answer has not arrived yet.
 * unknown: there is no usable answer (it failed, is incomplete, too old or the device is offline).
 */
export type HazardStatus = {
  key: HazardKey;
  state: 'listed' | 'none' | 'pending' | 'unknown';
  level: AlertLevel | 'review' | null;
  count: number;
  /** Events from the last 14 days that are no longer updated. */
  recent?: number;
  top?: HazardAlert;
  /** When the source last answered, for display next to the status. */
  checked?: number;
  /** When the last failed request to its source was made, while that source is failing. */
  failedAt?: number;
  /** Issue time of a NOAA threat message older than the display window that nothing closed. */
  unclosed?: number;
};

const gdacsType: Partial<Record<HazardKey, AlertType>> = {
  cyclone: 'TC',
  flood: 'FL',
  volcano: 'VO',
};
const rank: Record<AlertLevel, number> = { green: 1, orange: 2, red: 3 };

/**
 * GDACS-backed hazards for already filtered country alerts (see alertsFor). Only events
 * updated in the last 72 hours count as listed; older ones are reported as `recent`.
 */
export function gdacsStatus(
  key: 'cyclone' | 'flood' | 'volcano',
  alerts: readonly HazardAlert[] | null,
  failed: boolean,
  now: number,
): HazardStatus {
  if (!alerts)
    return { key, state: failed ? 'unknown' : 'pending', level: null, count: 0, recent: 0 };
  const rows = alerts.filter((a) => a.type === gdacsType[key]);
  const active = rows.filter((a) => now - a.to <= ACTIVE_WINDOW);
  const recent = rows.length - active.length;
  if (!active.length)
    return { key, state: failed ? 'unknown' : 'none', level: null, count: 0, recent };
  const top = active.reduce((a, b) => (rank[b.level] > rank[a.level] ? b : a));
  return { key, state: 'listed', level: top.level, count: active.length, recent, top };
}

/**
 * NOAA/PTWC status. A recent threat message that has not been closed needs review; anything
 * else is "none" only when the check is complete and recent.
 */
export function tsunamiStatus(data: TsunamiData | null, failed: boolean, now: number) {
  const key = 'tsunami' as const;
  if (!data)
    return {
      key,
      state: failed ? 'unknown' : 'pending',
      level: null,
      count: 0,
    } satisfies HazardStatus;
  const rows = classifyBulletins(data, now, failed);
  const review = rows.filter((r) => r.needsReview);
  if (review.length)
    return { key, state: 'listed', level: 'review', count: review.length } satisfies HazardStatus;
  // An open threat outside the display window, or dated ahead, is never "no threat"; the row
  // names it with its time instead of a bare "not confirmed". Rows are newest first.
  const unresolved = rows.find((r) => r.unresolved);
  const reliable = rows.every((r) => r.reliable) && !data.partial && !failed && !unresolved;
  return {
    key,
    state: reliable ? 'none' : 'unknown',
    level: null,
    count: 0,
    ...(unresolved ? { unclosed: unresolved.bulletin.issued } : {}),
  } satisfies HazardStatus;
}

/** Earthquakes in the current query: count and the largest event, as published. */
export function earthquakeSummary(events: readonly Quake[]) {
  const largest = events.reduce<Quake | undefined>(
    (a, q) => (q.mag !== null && (!a || q.mag > (a.mag ?? -Infinity)) ? q : a),
    undefined,
  );
  return { count: events.length, largest };
}

/**
 * "None" is only shown while the answer is recent and the device is online. Otherwise the
 * status becomes unknown, keeping the time of the last answer; listed items stay listed. A first
 * answer that cannot arrive because the device is offline is unknown, not pending.
 */
export function confirmFresh(
  status: HazardStatus,
  checked: number | null | undefined,
  now: number,
  online: boolean,
  maxAge: number,
): HazardStatus {
  const withTime = checked ? { ...status, checked } : status;
  if (status.state === 'pending') return online ? withTime : { ...withTime, state: 'unknown' };
  if (status.state !== 'none') return withTime;
  return !online || !checked || now - checked > maxAge
    ? { ...withTime, state: 'unknown' }
    : withTime;
}
