import test from 'node:test';
import assert from 'node:assert/strict';
import { magnitudeBand, magnitudeRanges } from '../src/lib/magnitude.ts';
test('magnitude colors distinguish 3.5 and 6.0, preserve boundaries and unknowns', () => {
  for (const [value, band] of [
    [-1, 'under4'],
    [3.5, 'under4'],
    [3.9, 'under4'],
    [4, '4'],
    [4.9, '4'],
    [5, '5'],
    [5.9, '5'],
    [6, '6'],
    [6.9, '6'],
    [7, '7plus'],
    [9.5, '7plus'],
    [null, 'unknown'],
    [NaN, 'unknown'],
    [Infinity, 'unknown'],
  ] as const)
    assert.equal(magnitudeBand(value), band);
  assert.equal(magnitudeBand(4.96), magnitudeBand(Number((4.96).toFixed(1))));
  assert.equal(magnitudeRanges.length, 5);
});
