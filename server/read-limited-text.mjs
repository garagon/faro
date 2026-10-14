/** Bound decoded upstream bytes before constructing a full source document. */
export async function readLimitedText(response, limit = 2_000_000, stopAfter = null) {
  if (!response.ok) throw new Error(`Source HTTP ${response.status}`);
  // 204 No Content is an explicit empty answer; parsers decide what an empty body means.
  if (response.status === 204) return '';
  // A page that ends at `stopAfter` may declare a larger total length; the stream check applies.
  if (!stopAfter && Number(response.headers.get('content-length')) > limit) {
    await response.body?.cancel();
    throw new Error('Source exceeds size limit');
  }
  if (!response.body) throw new Error('Source has no body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '',
    size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new Error('Source exceeds size limit');
      }
      // Search only the new tail plus enough overlap for a marker split across chunks.
      const from = Math.max(0, text.length - (stopAfter?.length ?? 0));
      text += decoder.decode(value, { stream: true });
      const end = stopAfter ? text.indexOf(stopAfter, from) : -1;
      if (end >= 0) {
        // The rest of the page is not needed; stop downloading it.
        await reader.cancel();
        return text.slice(0, end + stopAfter.length);
      }
    }
  } finally {
    reader.releaseLock();
  }
  return text + decoder.decode();
}
