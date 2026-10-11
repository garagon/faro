import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyBulletins,
  parseTsunamiData,
  RECENT_BULLETIN_WINDOW,
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
test('future issued messages are not promoted to recent warnings', () => {
  const [r] = classify([bulletin({ issued: now + 60000 })]);
  assert.equal(r.recent, false);
  assert.equal(r.state, 'unconfirmed');
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
