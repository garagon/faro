import test from 'node:test';
import assert from 'node:assert/strict';
import { readLimitedText } from '../server/read-limited-text.mjs';

test('upstream limits reject declared and streamed oversize bodies', async () => {
  await assert.rejects(
    readLimitedText(new Response('small', { headers: { 'content-length': '50' } }), 10),
    /size limit/,
  );
  let cancelled = false;
  const body = new ReadableStream({
    pull(controller) {
      controller.enqueue(new Uint8Array(8));
    },
    cancel() {
      cancelled = true;
    },
  });
  await assert.rejects(readLimitedText(new Response(body), 10), /size limit/);
  assert.equal(cancelled, true);
});
test('upstream decoding preserves UTF-8 across chunks and rejects HTTP failures', async () => {
  const bytes = new TextEncoder().encode('Panamá');
  const body = new ReadableStream({
    start(c) {
      c.enqueue(bytes.slice(0, 6));
      c.enqueue(bytes.slice(6));
      c.close();
    },
  });
  assert.equal(await readLimitedText(new Response(body), 10), 'Panamá');
  await assert.rejects(readLimitedText(new Response('failure', { status: 503 })), /HTTP 503/);
});
