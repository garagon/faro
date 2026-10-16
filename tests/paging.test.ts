import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pageItems, paging } from '../src/lib/paging.ts';

test('pages cover the list and the current page stays in range when the list shrinks', () => {
  assert.deepEqual(paging(78, 1), { pages: 4, current: 1, start: 0, end: 20 });
  assert.deepEqual(paging(78, 4), { pages: 4, current: 4, start: 60, end: 78 });
  // New data with fewer events: page 4 of a 30-event list becomes its last page.
  assert.deepEqual(paging(30, 4), { pages: 2, current: 2, start: 20, end: 30 });
  assert.deepEqual(paging(0, 3), { pages: 1, current: 1, start: 0, end: 0 });
  assert.equal(paging(40, Number.NaN).current, 1);
});

test('page buttons show every page when few, otherwise the ends and the neighbours', () => {
  assert.deepEqual(pageItems(2, 4), [1, 2, 3, 4]);
  assert.deepEqual(pageItems(1, 12), [1, 2, 3, 4, 'gap', 12]);
  assert.deepEqual(pageItems(6, 12), [1, 'gap', 5, 6, 7, 'gap', 12]);
  assert.deepEqual(pageItems(12, 12), [1, 'gap', 9, 10, 11, 12]);
});
