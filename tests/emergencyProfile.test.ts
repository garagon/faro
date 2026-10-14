import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyEmergencyInfo,
  fichaText,
  parseEmergencyInfo,
  type EmergencyInfo,
} from '../src/lib/emergencyProfile.ts';
import { shareLink } from '../src/lib/share.ts';

const filled = (): EmergencyInfo => ({
  ...emptyEmergencyInfo(),
  contact: { name: 'Marta Ejemplo', relation: 'madre', phone: '+54 9 11 5555 0000' },
  health: {
    allergies: 'penicilina',
    conditions: '',
    medications: '',
    bloodType: 'O+',
    share: false,
  },
  insurance: { company: 'Seguro Demo', policy: 'AB-123', phone: '+1 555 0100' },
  stay: { address: 'Calle Ficticia 1', arrival: '2026-10-10', departure: '2026-10-20' },
  savedAt: 1,
});

test('stored emergency details accept only the expected shape', () => {
  assert.equal(parseEmergencyInfo(null), null);
  assert.equal(parseEmergencyInfo('{bad'), null);
  assert.deepEqual(parseEmergencyInfo(JSON.stringify(filled())), filled());
  const bad = (patch: (v: EmergencyInfo) => void) => {
    const v = filled();
    patch(v);
    return parseEmergencyInfo(JSON.stringify(v));
  };
  assert.equal(
    bad((v) => (v.contact.phone = 'call me')),
    null,
  );
  assert.equal(
    bad((v) => (v.health.bloodType = 'Z')),
    null,
  );
  assert.equal(
    bad((v) => (v.stay.arrival = '10/10/2026')),
    null,
  );
  assert.equal(
    bad((v) => (v.health.allergies = 'x'.repeat(301))),
    null,
  );
  assert.equal(parseEmergencyInfo(JSON.stringify({ ...filled(), version: 2 })), null);
  // Shaped like a date but not a real day: rejected so it never reaches formatting.
  for (const impossible of ['2026-13-45', '2026-02-30', '0000-00-00'])
    assert.equal(
      bad((v) => (v.stay.departure = impossible)),
      null,
    );
});

test('an unreadable stay date is left out of the card instead of breaking the screen', () => {
  const info = filled();
  info.stay.arrival = '2026-13-45';
  const card = fichaText('es', { country: 'PA', profile: null, info, plan: null });
  assert.match(card, /Alojamiento: Calle Ficticia 1, hasta el 20 oct\./);
  assert.doesNotMatch(card, /2026-13-45|Invalid/);
});

test('the card lists only filled details and leaves health out unless chosen', () => {
  const profile = { name: 'Ana Ejemplo', nationality: 'AR', phone: '', email: '' };
  const plan = { name: 'Hotel Demo', meeting: 'Plaza de enfrente' };
  const card = fichaText('es', { country: 'PA', profile, info: filled(), plan });
  assert.match(card, /^Ficha de emergencia de Ana Ejemplo/);
  assert.match(card, /Contacto de emergencia: Marta Ejemplo \(madre\), \+54 9 11 5555 0000\./);
  assert.match(card, /Seguro de viaje: Seguro Demo, póliza AB-123, asistencia \+1 555 0100\./);
  assert.match(card, /Alojamiento: Hotel Demo, Calle Ficticia 1, del 10 oct al 20 oct\./);
  assert.match(card, /Punto de encuentro: Plaza de enfrente\./);
  assert.match(card, /Emergencias en Panamá: 911\./);
  assert.doesNotMatch(card, /penicilina|O\+/);
  assert.doesNotMatch(card, /Teléfono/);
  const shared = filled();
  shared.health.share = true;
  const withHealth = fichaText('en', { country: 'PA', profile, info: shared, plan });
  assert.match(withHealth, /Health: allergies: penicilina, blood type O\+\./);
});

test('an empty card has only its title and the local number', () => {
  const card = fichaText('en', {
    country: 'PA',
    profile: null,
    info: emptyEmergencyInfo(),
    plan: null,
  });
  assert.equal(card, 'Emergency card\nTraveling in Panama.\nEmergency number in Panama: 911.');
});

test('share links put the text in the parameter each app reads and encode it', () => {
  const text = 'Estoy bien & a salvo?\nHotel #1';
  const wa = new URL(shareLink('whatsapp', text));
  assert.equal(wa.origin, 'https://wa.me');
  assert.equal(wa.searchParams.get('text'), text);
  const tg = new URL(shareLink('telegram', text));
  assert.equal(tg.origin, 'https://t.me');
  assert.equal(tg.searchParams.get('url'), text);
  assert.ok(shareLink('sms', text).startsWith('sms:?&body='));
  assert.equal(decodeURIComponent(shareLink('sms', text).slice('sms:?&body='.length)), text);
  const mail = shareLink('email', text, 'Mi ficha');
  assert.ok(mail.startsWith('mailto:?subject=Mi%20ficha&body='));
  assert.ok(!mail.includes('&a salvo'));
});
