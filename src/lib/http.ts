/**
 * When an adapter answer left the origin, on this device's clock: now minus the time it spent
 * in a shared cache (the HTTP Age header, in seconds). The body's own `age` is added on top by
 * each parser, so a cached copy is never shown as fresher than it is.
 */
export function receivedAt(response: Pick<Response, 'headers'>, now = Date.now()) {
  const age = Number(response.headers.get('age'));
  return Number.isFinite(age) && age > 0 && age < 86400 ? now - age * 1000 : now;
}
