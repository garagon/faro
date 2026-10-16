import test from 'node:test';
import assert from 'node:assert/strict';
import { quakeAge, quakeRegion, quakeTime, withPlace } from '../src/lib/quakeText.ts';
import { countryBounds } from '../src/lib/countryScope.ts';

const emsc = (place: string) => ({ place, source: 'EMSC' as const });
const text = (place: string, lang: 'es' | 'en' | 'pt', home?: string, source = 'EMSC') =>
  quakeRegion({ place, source }, lang, home)?.text;

test('known countries read in the interface language, whatever the catalogue case', () => {
  for (const place of ['Panama', 'PANAMA', 'panama']) {
    assert.deepEqual(quakeRegion(emsc(place), 'es'), { text: 'Panamá', lang: 'es' });
    assert.deepEqual(quakeRegion(emsc(place), 'pt'), { text: 'Panamá', lang: 'pt' });
    assert.deepEqual(quakeRegion(emsc(place), 'en'), { text: 'Panama', lang: 'en' });
  }
  assert.equal(text('Costa Rica', 'es'), 'Costa Rica');
  assert.equal(text('Dominican Republic', 'pt'), 'República Dominicana');
});

test('the regions around the launch countries are translated, with Portuguese articles', () => {
  assert.equal(text('South Of Panama', 'es'), 'Al sur de Panamá');
  assert.equal(text('South Of Panama', 'pt'), 'Ao sul do Panamá');
  assert.equal(text('South Of Panama', 'en'), 'South of Panama');
  assert.equal(text('Panama-Costa Rica Border Region', 'es'), 'Frontera Panamá–Costa Rica');
  assert.equal(text('Panama-Costa Rica Border Region', 'pt'), 'Fronteira Panamá–Costa Rica');
  assert.equal(text('Off Coast Of Costa Rica', 'pt'), 'Ao largo da costa da Costa Rica');
  assert.equal(text('Near Coast Of Nicaragua', 'es'), 'Cerca de la costa de Nicaragua');
  assert.equal(text('Near West Coast Of Colombia', 'pt'), 'Perto da costa oeste da Colômbia');
  assert.equal(text('Offshore El Salvador', 'es'), 'Frente a la costa de El Salvador');
  assert.equal(text('Offshore Chiapas, Mexico', 'es'), 'Frente a la costa de Chiapas, México');
  assert.equal(text('Northern Colombia', 'es'), 'Norte de Colombia');
  assert.equal(text('Dominican Republic Region', 'es'), 'Región de la República Dominicana');
  assert.equal(text('Off Coast Of Central America', 'es'), 'Frente a la costa de Centroamérica');
  assert.equal(text('Oaxaca, Mexico', 'es'), 'Oaxaca, México');
});

test('inside the country on screen, the country is left to the list title', () => {
  assert.equal(quakeRegion(emsc('Panama'), 'es', 'PA'), null);
  assert.equal(text('Panama', 'es', 'CR'), 'Panamá');
  assert.equal(text('Antofagasta, Chile', 'es', 'CL'), 'Antofagasta');
  assert.equal(text('Panama-Costa Rica Border Region', 'es', 'PA'), 'Frontera con Costa Rica');
  assert.equal(text('Panama-Costa Rica Border Region', 'pt', 'PA'), 'Fronteira com a Costa Rica');
  assert.equal(text('Panama-Costa Rica Border Region', 'en', 'CR'), 'Panama border');
  // Offshore is not the country itself: still said.
  assert.equal(text('South Of Panama', 'es', 'PA'), 'Al sur de Panamá');
});

test('USGS places keep the agency distance and unit; nothing is computed from a gazetteer', () => {
  const usgs = (place: string, lang: 'es' | 'en' | 'pt', home?: string) =>
    text(place, lang, home, 'USGS');
  assert.equal(usgs('42 km SSW of David, Panama', 'es'), '42\u00a0km al SSO de David, Panamá');
  assert.equal(usgs('42 km SSW of David, Panama', 'pt'), '42\u00a0km a SSO de David, Panamá');
  assert.equal(usgs('42 km SSW of David, Panama', 'en'), '42\u00a0km SSW of David, Panama');
  assert.equal(usgs('42 km SSW of David, Panama', 'es', 'PA'), '42\u00a0km al SSO de David');
  assert.equal(usgs('5 km NE of Ridgecrest, CA', 'es'), '5\u00a0km al NE de Ridgecrest, CA');
});

test('unknown patterns keep the published text and its language', () => {
  for (const place of [
    'Sumbawa Region, Indonesia',
    'Central Alaska',
    'Off E. Coast Of N. Island, N.Z.',
  ])
    assert.deepEqual(quakeRegion(emsc(place), 'es'), { text: place, lang: 'en' });
  // IGC publishes in Spanish.
  assert.deepEqual(
    quakeRegion(
      { place: 'Localizado en 31km al Sur de Punta Burica, Chiriquí', source: 'IGC' },
      'en',
    ),
    { text: '31 km al Sur de Punta Burica, Chiriquí', lang: 'es' },
  );
});

test('one time format: clock and how long ago within a day, date and clock after', () => {
  const now = Date.parse('2026-10-16T12:30:00Z');
  const min = 60000;
  assert.equal(quakeAge(now - 30000, now, 'es'), 'hace menos de 1 min');
  assert.equal(quakeAge(now - 26 * min, now, 'en'), '26\u00a0min ago');
  assert.equal(quakeAge(now - 3 * 60 * min, now, 'pt'), 'há 3\u00a0h');
  assert.equal(quakeAge(now - 2 * 1440 * min, now, 'es'), 'hace 2\u00a0días');
  assert.equal(quakeAge(now - 1440 * min, now, 'en'), '1\u00a0day ago');
  const recent = quakeTime(now - 26 * min, now, 'es', 'utc');
  assert.equal(recent, '12:04\u00a0UTC · hace 26\u00a0min');
  assert.match(quakeTime(now - 26 * min, now, 'es'), /^\d\d:\d\d\u00a0· hace 26\u00a0min$/);
  // Older than a day: the date, never "hace 2 días" alone.
  assert.match(quakeTime(now - 2 * 1440 * min, now, 'es', 'utc'), /^14\u00a0oct, 12:30\u00a0UTC$/);
  // A record from the future (clock skew) never reads as negative.
  assert.match(quakeTime(now + 5 * min, now, 'en', 'utc'), /under 1\u00a0min ago$/);
});

test('list titles name the place once, with Portuguese contractions', () => {
  assert.equal(withPlace('51 sismos', 'PA', 'Panamá', 'es'), '51 sismos en Panamá');
  assert.equal(withPlace('51 earthquakes', 'PA', 'Panama', 'en'), '51 earthquakes in Panama');
  assert.equal(withPlace('51 terremotos', 'PA', 'Panamá', 'pt'), '51 terremotos no Panamá');
  assert.equal(withPlace('3 terremotos', 'CO', 'Colômbia', 'pt'), '3 terremotos na Colômbia');
  assert.equal(withPlace('3 terremotos', 'HN', 'Honduras', 'pt'), '3 terremotos em Honduras');
  // A country without a known article keeps a neutral form.
  assert.equal(withPlace('3 terremotos', 'KE', 'Quênia', 'pt'), '3 terremotos · Quênia');
});

test('the map frames a country on its mainland and main islands', () => {
  const pa = countryBounds('PA')!;
  assert.ok(pa.west > -84 && pa.east < -77 && pa.south > 7 && pa.north < 10);
  // Easter Island and the Galápagos do not stretch the frame over the Pacific.
  assert.ok(countryBounds('CL')!.west > -80);
  assert.ok(countryBounds('EC')!.west > -82);
  // The United States is framed on its largest part, not across the date line.
  const us = countryBounds('US')!;
  assert.ok(us.east - us.west < 70 && us.west > -130);
  assert.equal(countryBounds('ZZ'), null);
});
