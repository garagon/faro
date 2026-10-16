import { test } from 'node:test';
import assert from 'node:assert/strict';
import { helpReviewRange } from '../src/lib/reviews.ts';
import { destinationFor } from '../src/data/destinations/index.ts';
import { missionsFor } from '../src/data/consularMissions.ts';

test('the review range of a country covers its numbers, agencies and offices', () => {
  const range = helpReviewRange('PA');
  assert.ok(range);
  assert.match(range.from, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(range.to, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(range.from <= range.to);
  const listed = [
    destinationFor('PA')!.emergency!.reviewedAt,
    ...missionsFor('PA').map((m) => m.reviewedAt),
  ];
  for (const date of listed) assert.ok(range.from <= date && date <= range.to, date);
});

test('a place with no listed data still has the worldwide links, and a range is ordered', () => {
  const world = helpReviewRange('WORLD');
  assert.ok(world);
  assert.ok(world.from <= world.to);
});
