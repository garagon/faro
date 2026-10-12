import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validIGCEvent } from '../src/catalogs/igc.ts';

const row = {
  id: 'igc-1-7.6--80.6',
  source: 'IGC',
  lat: 7.6,
  lng: -80.6,
  depth: 10,
  mag: 4.1,
  place: 'Localizado en Panamá a 20km al norte de Tonosí',
  time: Date.parse('2026-10-12T13:00:00Z'),
  updated: 0,
  url: 'https://sismosgeociencias.up.ac.pa/',
  reviewed: false,
  magType: '',
};

test('IGC rows need every field the interface reads', () => {
  assert.equal(validIGCEvent(row), true);
  assert.equal(validIGCEvent({ ...row, mag: null }), true);
  for (const broken of [
    { ...row, depth: undefined },
    { ...row, depth: Number.NaN },
    { ...row, place: 5 },
    { ...row, source: 'USGS' },
    { ...row, lat: 120 },
    { ...row, mag: '4.1' },
    null,
    'row',
  ])
    assert.equal(validIGCEvent(broken), false, JSON.stringify(broken));
});
