import assert from 'node:assert/strict';
import test from 'node:test';
import { supportFor, travelerSupport } from '../src/data/travelerSupport.ts';
import { missionsFor } from '../src/data/consularMissions.ts';

// Every pack must link only to its own government. A leading dot allows subdomains.
const officialHosts: Record<string, string[]> = {
  US: ['travel.state.gov'],
  AR: ['cancilleria.gob.ar', '.cancilleria.gob.ar', 'argentina.gob.ar', '.mrecic.gov.ar'],
  BR: ['www.gov.br', '.itamaraty.gov.br'],
};
const official = (nation: string, value: string) => {
  const url = new URL(value);
  assert.equal(url.protocol, 'https:', value);
  assert.equal(url.username + url.password, '', value);
  assert.ok(
    officialHosts[nation].some((host) =>
      host.startsWith('.') ? url.hostname.endsWith(host) : url.hostname === host,
    ),
    `${nation}: ${url.hostname} is not an allowed official host`,
  );
};

test('abroad assistance follows nationality, not destination or language', () => {
  assert.equal(supportFor('US', 'US'), undefined);
  assert.equal(supportFor('AR', 'AR'), undefined);
  assert.equal(supportFor('BR', 'BR'), undefined);
  assert.equal(supportFor('JP', 'PA'), undefined);
  assert.equal(supportFor('', 'PA'), undefined);
  assert.equal(supportFor('US', 'PA'), travelerSupport.US);
  assert.equal(supportFor('US', 'WORLD'), travelerSupport.US);
  assert.equal(supportFor('AR', 'PA'), travelerSupport.AR);
  assert.equal(supportFor('BR', 'PA'), travelerSupport.BR);
});

test('country advisory selection never falls back to Panama', () => {
  const advisories = supportFor('US', 'CO')!.advisories!;
  assert.match(advisories.destinations.CO, /\/colombia\.html$/);
  assert.equal(advisories.destinations.JP, undefined);
  assert.equal(
    new URL(advisories.index).pathname,
    '/en/international-travel/travel-advisories.html',
  );
  assert.equal(advisories.publisher, 'Travel.State.gov');
  // Authorities without per-destination advisories get no advisory link at all.
  assert.equal(travelerSupport.AR.advisories, undefined);
  assert.equal(travelerSupport.BR.advisories, undefined);
});

test('assistance records retain attribution, translations, caller scope and official hosts', () => {
  for (const [nation, pack] of Object.entries(travelerSupport)) {
    assert.ok(officialHosts[nation], `${nation} needs an official host allowlist`);
    assert.match(pack.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(pack.agency.trim());
    official(nation, pack.contactSource);
    for (const pair of [pack.title, pack.contactTitle, pack.contactNote])
      assert.ok(pair.length === 3 && pair.every((text) => text.trim()));
    assert.equal(new Set(pack.resources.map((r) => r.id)).size, pack.resources.length);
    assert.ok(pack.resources.length >= 4);
    assert.ok(pack.contacts.length > 0);
    assert.equal(new Set(pack.contacts.map((c) => c.number)).size, pack.contacts.length);
    for (const contact of pack.contacts) {
      assert.match(contact.number, /^\+\d{7,15}$/);
      assert.ok(contact.display.trim());
      assert.ok(contact.scope.length === 3 && contact.scope.every((text) => text.trim()));
    }
    for (const resource of pack.resources) {
      assert.ok(
        [resource.title, resource.description, resource.action].every(
          (pair) => pair.length === 3 && pair.every((text) => text.trim()),
        ),
      );
      official(nation, resource.url);
    }
    if (pack.advisories) {
      official(nation, pack.advisories.index);
      for (const url of Object.values(pack.advisories.destinations)) official(nation, url);
    }
  }
});

test('home-country lines state that they are for callers in that country', () => {
  const [ar] = travelerSupport.AR.contacts;
  assert.equal(ar.number, '+5491150407243');
  assert.match(ar.scope[0], /Desde Argentina/);
  assert.match(ar.scope[1], /From Argentina/);
  assert.match(travelerSupport.AR.contactTitle[1], /in Argentina/);
  const [br] = travelerSupport.BR.contacts;
  assert.equal(br.number, '+5561982600610');
  assert.match(br.scope[0], /Desde Brasil/);
  assert.match(br.scope[1], /From Brazil · outside business hours/);
  assert.match(travelerSupport.BR.contactTitle[1], /in Brazil/);
  // Packs point people abroad to the local post, never only to the home-country line.
  for (const nation of ['AR', 'BR']) {
    assert.match(travelerSupport[nation].contactNote[0], /embajada o consulado/);
    assert.match(travelerSupport[nation].contactNote[1], /embassy or consulate/);
  }
});

test('packs do not promise evacuation, payment or tracking', () => {
  for (const pack of Object.values(travelerSupport)) {
    const text = JSON.stringify(pack.resources);
    assert.doesNotMatch(
      text,
      /\b(will evacuate|guaranteed|free evacuation|evacuación gratuita)\b/i,
    );
  }
  for (const nation of ['AR', 'BR']) {
    const limits = travelerSupport[nation].resources.find((r) => r.id === 'limits')!;
    assert.match(limits.description[1], /Do not assume an evacuation/);
    const missing = travelerSupport[nation].resources.find((r) => r.id === 'missing')!;
    assert.match(missing.description[1], /Faro does not locate people/);
  }
});

test('U.S. Panama emergency contact does not inherit Argentine-only wording', () => {
  const embassy = missionsFor('PA', 'US')[0];
  assert.equal(embassy.emergency, '+5073175000');
  assert.equal(embassy.phone, '+5073175000');
  assert.equal(new URL(embassy.source).hostname, 'pa.usembassy.gov');
  assert.match(embassy.emergencyNote![1], /U\.S\. citizens/);
  assert.doesNotMatch(embassy.emergencyNote![1], /Argentin/);
});
