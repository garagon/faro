import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultKitPlan,
  itemCaption,
  kitItems,
  kitText,
  shopCaption,
  shoppingList,
} from '../src/data/emergencyKit.ts';
import { LANGS, langIndex } from '../src/lib/i18n.ts';

// About one caption line on a 390 px phone; the screens are checked against real widths too.
const LINE = 40;

test('every checklist caption fits one line and keeps the plan amounts', () => {
  for (const lang of LANGS)
    for (const item of kitItems) {
      const text = itemCaption(item, lang, { people: 12, days: 7, hazards: [] });
      assert.ok(text.length <= LINE, `${lang} ${item.id}: ${text}`);
    }
  assert.equal(itemCaption(kitItems[0], 'es', defaultKitPlan), '6 L para beber; con calor, más');
  assert.ok(itemCaption(kitItems[0], 'en', defaultKitPlan).startsWith('1.6 gal'));
  assert.ok(itemCaption(kitItems[1], 'pt', { ...defaultKitPlan, days: 5 }).includes('5\u00a0dias'));
});

test('the downloaded list keeps the full advice that the screen shortens', () => {
  const text = kitText('es', [], defaultKitPlan);
  assert.ok(text.includes('abrelatas'));
  assert.ok(text.includes('higiene menstrual'));
});

test('each shop lists short names in one line, water with its amount', () => {
  for (const item of kitItems) if (item.store) assert.ok(item.short, item.id);
  for (const lang of LANGS)
    for (const { items } of shoppingList([], { hazards: ['earthquake', 'flood'] })) {
      const text = shopCaption(items, lang, { people: 12, days: 7, hazards: [] });
      assert.ok(text.length <= LINE, `${lang}: ${text}`);
      assert.equal(text.charAt(0), text.charAt(0).toUpperCase());
    }
  const supermarket = shoppingList([], { hazards: [] }).find((s) => s.store === 'supermarket')!;
  assert.equal(shopCaption(supermarket.items, 'es', defaultKitPlan), 'Agua (6 L), comida, higiene');
  assert.equal(
    shopCaption(supermarket.items, 'en', defaultKitPlan),
    'Water (1.6 gal), food, hygiene',
  );
  assert.ok(kitItems.every((item) => item.caption[langIndex('pt')].trim()));
});
