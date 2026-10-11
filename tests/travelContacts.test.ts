import test from 'node:test';
import assert from 'node:assert/strict';
import { phoneHref, validContact, travelCard, type TravelContact } from '../src/lib/tripData.ts';
import { emergencyFor } from '../src/lib/emergency.ts';
const c: TravelContact = {
  id: '1',
  kind: 'work',
  name: 'Equipo de prueba',
  phone: '+57 (300) 123-4567',
  note: 'Horario de oficina',
  country: 'PA',
};
test('personal phone links accept dialing formats and reject URL injection or extensions', () => {
  assert.equal(phoneHref(c.phone), 'tel:+573001234567');
  for (const v of [
    'javascript:alert(1)',
    '+5071234?body=private',
    '12',
    '1234#56',
    '+1+2345',
    '12345 ext 9',
    '1'.repeat(16),
  ])
    assert.equal(phoneHref(v), null);
});
test('stored contact records reject missing names, unsafe phones and unknown types', () => {
  assert.ok(validContact(c));
  for (const v of [
    null,
    {},
    { ...c, kind: 'admin' },
    { ...c, name: '' },
    { ...c, phone: 'https://evil.test' },
    { ...c, country: 'WORLD' },
  ])
    assert.equal(validContact(v), false);
});
test('travel export isolates destinations and includes only matching hotel plan', () => {
  const other = { ...c, id: '2', country: 'CL', name: 'PRIVATE OTHER TRIP' };
  const plan = {
    name: 'PRIVATE OTHER HOTEL',
    meeting: 'meeting',
    notes: 'private',
    country: 'CL',
    lat: '',
    lng: '',
    savedAt: 1,
  };
  const text = travelCard('PA', 'en', [c, other], plan);
  assert.ok(text.includes(c.name));
  assert.ok(text.includes('911'));
  assert.ok(!text.includes('PRIVATE OTHER'));
  assert.ok(text.includes('not from abroad'));
});
test('emergency directory does not invent a worldwide default or national SAME coverage', () => {
  assert.equal(emergencyFor('WORLD'), undefined);
  assert.equal(emergencyFor('BR'), undefined);
  assert.deepEqual(
    emergencyFor('CL')?.numbers.map((n) => n.number),
    ['131', '132', '133'],
  );
  assert.deepEqual(
    emergencyFor('CO')?.numbers.map((n) => n.number),
    ['123'],
  );
  assert.ok(!emergencyFor('AR')?.numbers.some((n) => n.number === '107'));
});
