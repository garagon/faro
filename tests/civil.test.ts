import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  floodPosts,
  lastPost,
  parseCivil,
  postTitle,
  postUpdate,
  recentPosts,
  type CivilPost,
} from '../src/lib/civil.ts';

const now = Date.parse('2026-10-13T21:00:00Z');
const hour = 3_600_000;
// Synthetic posts; titles follow the agency's own patterns.
const post = (over: Partial<CivilPost> = {}): CivilPost => ({
  id: 1,
  title: 'COMUNICADO OFICIAL #9',
  summary: 'El SINAPROC informa el balance de afectaciones en la provincia de Ejemplo.',
  published: now - 2 * hour,
  url: 'https://www.sinaproc.gob.pa/comunicado-oficial-ejemplo/',
  kind: 'communique',
  ...over,
});

test('the adapter answer is validated and placed on this device clock', () => {
  const data = parseCivil(
    {
      agency: 'SINAPROC',
      posts: [post(), post({ id: 2, url: 'https://evil.example/' })],
      age: 60_000,
    },
    now,
  );
  assert.equal(data.fetched, now - 60_000);
  assert.equal(data.posts.length, 2);
  // A link off the agency's site is dropped, the post is kept.
  assert.equal(data.posts[1].url, '');
  assert.equal(data.stale, false);
  assert.equal(parseCivil({ agency: 'SINAPROC', posts: [], stale: true }, now).stale, true);
  assert.throws(() => parseCivil({ agency: 'OTHER', posts: [] }, now));
  assert.throws(() => parseCivil({ agency: 'SINAPROC', posts: [{ id: 'x' }] }, now));
  assert.throws(() =>
    parseCivil({ agency: 'SINAPROC', posts: [post({ kind: 'drill' as never })] }, now),
  );
});

test('only posts from the last week are listed, newest first, never ones dated ahead', () => {
  const list = recentPosts(
    [
      post({ id: 1, published: now - 3 * hour }),
      post({ id: 2, published: now - hour }),
      post({ id: 3, published: now - 8 * 24 * hour }),
      post({ id: 4, published: now + 2 * hour }),
    ],
    now,
  );
  assert.deepEqual(
    list.map((p) => p.id),
    [2, 1],
  );
});

test('rain or flood posts are picked from the last 48 hours by their own words', () => {
  const rain = post({
    id: 5,
    title: 'Aviso de prevención Lluvias y tormentas',
    kind: 'prevention',
  });
  const river = post({ id: 6, title: 'Noticia', summary: 'Crecida del río Ejemplo.' });
  const old = post({ id: 7, title: 'Aviso de prevención Lluvias', published: now - 50 * hour });
  const quake = post({ id: 8 });
  assert.deepEqual(
    floodPosts([rain, river, old, quake], now).map((p) => p.id),
    [5, 6],
  );
  assert.deepEqual(floodPosts([quake], now), []);
});

test('all-caps communiqué titles read normally and other titles stay as published', () => {
  assert.equal(postTitle('COMUNICADO OFICIAL # 7'), 'Comunicado oficial # 7');
  assert.equal(postTitle('Aviso de prevención Lluvias'), 'Aviso de prevención Lluvias');
});

test('a later edit is shown only when well after publication, never as the publication time', () => {
  const data = parseCivil(
    {
      agency: 'SINAPROC',
      posts: [
        post({ id: 1, modified: now - hour }),
        post({ id: 2, modified: now - 2 * hour + 5 * 60000 }),
        post({ id: 3, modified: now - 3 * hour }),
        post({ id: 4, modified: 'later' as never }),
      ],
    },
    now,
  );
  const [edited, typo, earlier, invalid] = data.posts;
  assert.equal(edited.published, now - 2 * hour);
  assert.equal(postUpdate(edited), now - hour);
  // Fixed within minutes: not an update worth showing.
  assert.equal(postUpdate(typo), null);
  assert.equal('modified' in earlier, false);
  assert.equal('modified' in invalid, false);
});

test('a quiet week still names the last post, ignoring posts dated ahead', () => {
  const older = post({ id: 7, published: now - 10 * 24 * hour });
  const ahead = post({ id: 8, published: now + 2 * hour });
  assert.deepEqual(recentPosts([older, ahead], now), []);
  assert.equal(lastPost([older, ahead], now)?.id, 7);
  assert.equal(lastPost([], now), null);
});
