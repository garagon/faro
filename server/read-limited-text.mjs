/** Bound decoded upstream bytes before constructing a full source document. */
export async function readLimitedText(response, limit = 2_000_000) {
  if (!response.ok) throw new Error(`Source HTTP ${response.status}`);
  if (Number(response.headers.get('content-length')) > limit) {
    await response.body?.cancel();
    throw new Error('Source exceeds size limit');
  }
  if (!response.body) throw new Error('Source has no body');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error('Source exceeds size limit');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, size).toString('utf8');
}
