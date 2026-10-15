import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardLines } from '../src/lib/travelCardImage.ts';
import type { Preferences } from '../src/lib/preferences.ts';
import type { TravelContact } from '../src/lib/tripData.ts';
const profile: Preferences = {
  version: 1,
  language: 'es',
  destination: 'PA',
  nationality: 'AR',
  savedAt: 1,
  name: 'Alex Demo',
  phone: '+1 202 555 0123',
  email: 'alex@example.com',
};
const contact: TravelContact = {
  id: 'demo',
  country: 'PA',
  kind: 'hotel',
  name: 'Hotel de ejemplo',
  phone: '+1 202 555 0147',
  note: 'Solo datos de demostración',
};
test('travel image includes the selected destination and profile without coordinates or unrelated contacts', () => {
  const plan = {
    name: 'Hotel de ejemplo',
    meeting: 'Punto acordado',
    notes: 'Consultar recepción',
    lat: '8.9824',
    lng: '-79.5199',
    savedAt: 1,
    country: 'PA',
  };
  const rows = cardLines(
    'PA',
    'es',
    [contact, { ...contact, country: 'CL', name: 'Otro viaje' }],
    plan,
    profile,
  );
  const text = JSON.stringify(rows);
  assert.match(text, /Alex Demo/);
  assert.match(text, /alex@example.com/);
  assert.match(text, /Punto acordado/);
  assert.match(text, /911/);
  assert.doesNotMatch(text, /8\.9824|79\.5199|Otro viaje/);
  assert.doesNotMatch(
    JSON.stringify(cardLines('CL', 'en', [contact], plan, profile)),
    /Hotel de ejemplo|Punto acordado/,
  );
});
test('unknown emergency coverage is explicit and no personal status is fabricated', () => {
  const rows = cardLines('FR', 'en', [], null, null);
  assert.match(JSON.stringify(rows), /No verified numbers/);
  assert.doesNotMatch(JSON.stringify(rows), /911|safe|Estoy bien/);
});

test('the saved image carries the same facts as the text card, without repeating the main number', () => {
  const ficha = [
    'Ficha de emergencia',
    'Soy Ana Prueba, de Argentina.',
    'Contacto de emergencia: Marta, +54 9 11 5555 0000.',
    'Seguro de viaje: Aseguradora Ejemplo, póliza 123.',
    'Emergencias en Panamá: 911 (desde un teléfono en Panamá).',
  ].join('\n');
  const lines = cardLines('PA', 'es', [], null, null, ficha);
  const text = JSON.stringify(lines);
  assert.match(text, /Contacto de emergencia/);
  assert.match(text, /póliza 123/);
  assert.match(text, /Soy Ana Prueba/);
  assert.doesNotMatch(text, /Emergencias en Panamá: 911/);
  assert.ok(lines.some((l) => l.value === '911'));
});
