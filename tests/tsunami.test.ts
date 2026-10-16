import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bulletinNotice,
  classifyBulletins,
  leadingNotice,
  noticeLabels,
  parseTsunamiData,
  readablePlace,
  RECENT_BULLETIN_WINDOW,
  reviveTsunami,
  type Bulletin,
} from '../src/lib/tsunami.ts';
const now = Date.UTC(2026, 9, 11, 18);
const bulletin = (overrides: Partial<Bulletin> = {}): Bulletin => ({
  product: 'WEPA40',
  issued: now - 60000,
  eventId: '12345',
  place: 'Test event',
  url: 'https://www.tsunami.gov/events/PHEB/2026/10/11/12345/1/WEPA40/WEPA40.txt',
  basin: 'Pacific',
  kind: 'threat',
  evaluation: 'Synthetic evaluation',
  ...overrides,
});
const classify = (bulletins: Bulletin[], extra = {}) =>
  classifyBulletins({ bulletins, fetched: now, partial: false, ...extra }, now);
test('newer closure supersedes only the same event and basin', () => {
  const r = classify([
    bulletin({ issued: now - 120000 }),
    bulletin({ issued: now - 30000, kind: 'ended' }),
    bulletin({ eventId: '999' }),
    bulletin({ basin: 'Caribbean', product: 'WECA41' }),
  ]);
  assert.equal(r.filter((v) => v.state === 'superseded').length, 1);
  assert.equal(r.filter((v) => v.state === 'ended').length, 1);
  assert.equal(r.filter((v) => v.needsReview).length, 2);
});
test('age archives a threat without inventing cancellation or expiry', () => {
  const [r] = classify([bulletin({ issued: now - RECENT_BULLETIN_WINDOW - 1 })]);
  assert.equal(r.state, 'unconfirmed');
  assert.equal(r.recent, false);
  assert.equal(r.needsReview, false);
});
test('recent cancelled and informational messages never become active threats', () => {
  const r = classify([
    bulletin({ kind: 'cancelled' }),
    bulletin({ eventId: '2', kind: 'information' }),
  ]);
  assert.deepEqual(
    r.map((x) => x.state),
    ['cancelled', 'information'],
  );
  assert(r.every((x) => !x.needsReview));
});
test('partial, failed and stale fetches cannot confirm an alert state', () => {
  for (const extra of [{ partial: true }, { fetched: now - 120001 }]) {
    const [r] = classify([bulletin()], extra);
    assert.equal(r.reliable, false);
    assert.equal(r.state, 'unconfirmed');
    assert.equal(r.needsReview, true);
  }
  assert.equal(
    classifyBulletins({ bulletins: [bulletin()], fetched: now, partial: false }, now, true)[0]
      .reliable,
    false,
  );
});
test('a slow phone clock never hides a threat, and far-future or old open threats are unresolved', () => {
  // One minute "ahead": a phone running slow. Still a recent threat to review.
  const [slow] = classify([bulletin({ issued: now + 60000 })]);
  assert.equal(slow.recent, true);
  assert.equal(slow.needsReview, true);
  // Far ahead or older than the window, and never closed: not reviewable, but not over either.
  for (const issued of [now + 3 * 3600000, now - 8 * 3600000]) {
    const [r] = classify([bulletin({ issued })]);
    assert.equal(r.needsReview, false);
    assert.equal(r.unresolved, true);
  }
  // A threat closed by a later message, or a day old, is neither.
  const closed = classify([
    bulletin({ issued: now - 8 * 3600000 }),
    bulletin({ issued: now - 7 * 3600000, kind: 'ended' }),
  ]);
  assert(closed.every((r) => !r.unresolved));
  assert.equal(classify([bulletin({ issued: now - 25 * 3600000 })])[0].unresolved, false);
});
test('the tsunami row is never "none" while an open threat is unresolved', async () => {
  const { tsunamiStatus } = await import('../src/lib/hazards.ts');
  const data = (issued: number) => ({
    bulletins: [bulletin({ issued })],
    fetched: now,
    partial: false,
  });
  assert.equal(tsunamiStatus(data(now - 60000), false, now).state, 'listed');
  assert.equal(tsunamiStatus(data(now - 8 * 3600000), false, now).state, 'unknown');
  // Named with its issue time, so the row is not a bare "not confirmed".
  assert.equal(tsunamiStatus(data(now - 8 * 3600000), false, now).unclosed, now - 8 * 3600000);
  assert.equal(tsunamiStatus(data(now - 60000), false, now).unclosed, undefined);
  assert.equal(tsunamiStatus(data(now + 3 * 3600000), false, now).state, 'unknown');
  assert.equal(
    tsunamiStatus({ bulletins: [], fetched: now, partial: false }, false, now).state,
    'none',
  );
});
test('bulletin times are moved onto this device clock using the adapter clock', () => {
  // The adapter fetched at T (its clock); this phone is 10 minutes slow.
  const T = now;
  const parsed = parseTsunamiData(
    { bulletins: [bulletin({ issued: T - 60000 })], fetched: T, partial: false, age: 0 },
    T - 600000,
  );
  assert.equal(parsed.bulletins[0].issued, T - 60000 - 600000);
});
test('invalid NOAA payloads and unsafe links fail closed', () => {
  const good = { bulletins: [bulletin()], fetched: now, partial: false };
  assert.equal(parseTsunamiData(good).bulletins.length, 1);
  for (const change of [
    { issued: NaN },
    { url: 'https://evil.example/notice' },
    { product: 'BAD' },
    { place: null },
    { eventId: '' },
  ])
    assert.throws(() =>
      parseTsunamiData({ ...good, bulletins: [bulletin(change as Partial<Bulletin>)] }),
    );
  assert.throws(() => parseTsunamiData({ ...good, partial: undefined }));
});
test('retrieval time follows this device clock, not the adapter clock', () => {
  const skewed = { bulletins: [], fetched: now + 600000, partial: false, age: 5000 };
  assert.equal(parseTsunamiData(skewed, now).fetched, now - 5000);
  assert.equal(parseTsunamiData({ ...skewed, age: -1 }, now).fetched, now + 600000);
});

test('a kept copy brings an open threat back after an offline reload, never as confirmed', () => {
  // As stored by the poller: times already on this device clock.
  const stored = JSON.parse(
    JSON.stringify({
      bulletins: [bulletin({ issued: now - 20 * 60000 })],
      partial: false,
      fetched: now - 10 * 60000,
    }),
  );
  const kept = reviveTsunami(stored, now);
  assert.ok(kept);
  assert.equal(kept.fetched, now - 10 * 60000);
  assert.equal(kept.bulletins[0].issued, now - 20 * 60000);
  const [row] = classifyBulletins(kept, now);
  assert.equal(row.needsReview, true);
  assert.equal(row.reliable, false);
  // A future copy, one older than the unresolved window or a tampered link is not shown.
  assert.equal(reviveTsunami({ ...stored, fetched: now + 60000 }, now), null);
  assert.equal(reviveTsunami({ ...stored, fetched: now - 25 * 3600000 }, now), null);
  const bad = { ...stored, bulletins: [{ ...stored.bulletins[0], url: 'https://evil.example/x' }] };
  assert.equal(reviveTsunami(bad, now), null);
  assert.equal(reviveTsunami('garbage', now), null);
});

test('one open message has one name and one level on every screen', async () => {
  const { tsunamiStatus } = await import('../src/lib/hazards.ts');
  const data = (bulletins: Bulletin[]) => ({ bulletins, fetched: now, partial: false });
  // A recent threat: NOAA's message type at level 3, read by the banner, the row and the tab.
  const threat = data([bulletin({ place: 'OFF THE COAST OF PANAMA' })]);
  const lead = leadingNotice(threat, now)!;
  assert.equal(lead.notice.level, 3);
  assert.deepEqual(lead.notice.label, noticeLabels.threat);
  const status = tsunamiStatus(threat, false, now);
  assert.deepEqual(status.notice, lead.notice);
  assert.equal(status.bulletin, lead.row.bulletin);
  const [row] = classifyBulletins(threat, now);
  assert.deepEqual(bulletinNotice(row), lead.notice);
  // An unreadable message is one to review, at level 1; a threat leads over it.
  const both = data([
    bulletin({ eventId: '2', kind: 'unknown', issued: now - 1000 }),
    bulletin({ issued: now - 5000 }),
  ]);
  assert.equal(leadingNotice(both, now)!.notice.level, 3);
  assert.equal(leadingNotice(data([bulletin({ kind: 'unknown' })]), now)!.notice.level, 1);
  // Older than the window and never closed: still named, as not closed, at level 1.
  const unclosed = data([bulletin({ issued: now - 8 * 3600000 })]);
  assert.deepEqual(leadingNotice(unclosed, now)!.notice.label, noticeLabels.unclosed);
  assert.deepEqual(
    tsunamiStatus(unclosed, false, now).notice,
    leadingNotice(unclosed, now)!.notice,
  );
  // Closed, cancelled or informational: nothing to lead with.
  assert.equal(leadingNotice(data([bulletin({ kind: 'cancelled' })]), now), undefined);
  assert.equal(leadingNotice(null, now), undefined);
  // A failing feed keeps the open message: it is never dropped.
  assert.equal(leadingNotice(threat, now, true)!.notice.level, 3);
});

test('NOAA place names in capitals read in sentence case, with names kept', () => {
  assert.equal(readablePlace('OFF THE COAST OF PANAMA'), 'Off the coast of Panama');
  assert.equal(readablePlace('NEAR COAST OF CENTRAL PERU'), 'Near coast of central Peru');
  assert.equal(readablePlace('SOUTH OF THE FIJI ISLANDS'), 'South of the Fiji Islands');
  assert.equal(readablePlace('100 KM SW OF LIMA'), '100 km SW of Lima');
  assert.equal(readablePlace('CENTRAL MID-ATLANTIC RIDGE'), 'Central Mid-Atlantic Ridge');
  // Anything not in capitals is shown as published.
  assert.equal(readablePlace('Off the coast of Panama'), 'Off the coast of Panama');
  assert.equal(readablePlace(''), '');
});
