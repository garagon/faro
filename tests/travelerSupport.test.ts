import assert from 'node:assert/strict';
import test from 'node:test';
import { supportFor, travelerSupport } from '../src/data/travelerSupport.ts';
import { missionsFor } from '../src/data/consularMissions.ts';

test('abroad assistance follows nationality, not destination or language', () => {
  assert.equal(supportFor('US', 'US'), undefined);
  assert.equal(supportFor('AR', 'PA'), undefined);
  assert.equal(supportFor('', 'PA'), undefined);
  assert.equal(supportFor('US', 'PA'), travelerSupport.US);
  assert.equal(supportFor('US', 'WORLD'), travelerSupport.US);
});

test('country advisory selection never falls back to Panama', () => {
  const support = supportFor('US', 'CO')!;
  assert.match(support.advisories.destinations.CO, /\/colombia\.html$/);
  assert.equal(support.advisories.destinations.JP, undefined);
  assert.equal(
    new URL(support.advisories.index).pathname,
    '/en/international-travel/travel-advisories.html',
  );
});

test('assistance records retain attribution, translations and caller scope', () => {
  for (const pack of Object.values(travelerSupport)) {
    assert.match(pack.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new URL(pack.contactSource).protocol, 'https:');
    assert.equal(new Set(pack.resources.map((r) => r.id)).size, pack.resources.length);
    for (const contact of pack.contacts) {
      assert.match(contact.number, /^\+\d{7,15}$/);
      assert.ok(contact.scope.every(Boolean));
    }
    for (const resource of pack.resources) {
      assert.ok(
        [resource.title, resource.description, resource.action].every(
          (pair) => pair.length === 2 && pair.every(Boolean),
        ),
      );
      assert.equal(new URL(resource.url).hostname, 'travel.state.gov');
    }
  }
});

test('U.S. Panama emergency contact does not inherit Argentine-only wording', () => {
  const embassy = missionsFor('PA', 'US')[0];
  assert.equal(embassy.emergency, '+5073175000');
  assert.match(embassy.emergencyNote![1], /U\.S\. citizens/);
  assert.doesNotMatch(embassy.emergencyNote![1], /Argentin/);
});
