import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  quickMessages,
  applyQuickMessage,
  translateQuickMessage,
  type QuickFields,
} from '../src/lib/messageTemplates.ts';
import { checkInMessage, type CheckIn } from '../src/lib/traveler.ts';

const at = Date.parse('2026-10-12T14:00:00Z');
const empty: QuickFields = {
  status: '',
  context: 'earthquake',
  connection: '',
  note: '',
  needs: '',
  companions: '',
};
const preset = (id: string) => quickMessages.find((m) => m.id === id)!;

test('ready messages have unique ids, bilingual labels and help text when needed', () => {
  assert.equal(new Set(quickMessages.map((m) => m.id)).size, quickMessages.length);
  for (const m of quickMessages) {
    assert.ok(m.label[0].length > 3 && m.label[1].length > 3, m.id);
    if (m.status === 'help') assert.ok(m.needs, `${m.id} needs a help request`);
    else assert.equal(m.needs, undefined, `${m.id} must not ask for help`);
  }
});

test('a ready message never overwrites text the person wrote', () => {
  const typed = { ...empty, note: 'Tercer piso, escalera bloqueada', companions: 'Ana' };
  const result = applyQuickMessage(typed, preset('medical'), null, 'es');
  assert.equal(result.status, 'help');
  assert.equal(result.note, typed.note);
  assert.equal(result.companions, 'Ana');
  assert.equal(result.needs, 'Necesito atención médica.');
});

test('switching ready messages replaces only the previous ready text', () => {
  const first = applyQuickMessage(empty, preset('signal'), null, 'es');
  assert.equal(first.connection, 'limited');
  const second = applyQuickMessage(first, preset('team'), preset('signal'), 'es');
  assert.equal(second.note, '');
  assert.equal(second.connection, '');
  assert.equal(second.companions, 'mi equipo de trabajo');
  const third = applyQuickMessage(second, preset('safe'), preset('team'), 'es');
  assert.equal(third.companions, '');
  assert.equal(third.note, 'No tengo heridas.');
});

test('help text is cleared when moving from a help message to a non-help one', () => {
  const help = applyQuickMessage(empty, preset('stranded'), null, 'en');
  const ok = applyQuickMessage(help, preset('safe'), preset('stranded'), 'en');
  assert.equal(ok.status, 'ok');
  assert.equal(ok.needs, '');
});

test('ready text follows the message language, edited text does not', () => {
  const es = applyQuickMessage(empty, preset('signal'), null, 'es');
  assert.equal(
    translateQuickMessage(es, preset('signal'), 'es', 'en').note,
    'I may be slow to reply.',
  );
  const edited = { ...es, note: 'Escribo desde el hotel.' };
  assert.equal(translateQuickMessage(edited, preset('signal'), 'es', 'en').note, edited.note);
});

test('every ready message produces a complete message in both languages', () => {
  for (const lang of ['es', 'en'] as const) {
    for (const m of quickMessages) {
      const fields = applyQuickMessage(empty, m, null, lang);
      const record: CheckIn = {
        id: 'x',
        name: 'Persona de prueba',
        place: 'Hotel de prueba',
        contact: '',
        at,
        nextAt: null,
        ...fields,
        status: m.status,
      };
      const text = checkInMessage(record, lang, 'UTC');
      assert.match(text, /Persona de prueba/);
      if (fields.note) assert.ok(text.includes(fields.note), `${m.id} ${lang}`);
      if (fields.needs) assert.ok(text.includes(fields.needs), `${m.id} ${lang}`);
      assert.doesNotMatch(text, /undefined|\.\./);
    }
  }
});
