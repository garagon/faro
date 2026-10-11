import { load } from 'cheerio';
import { readLimitedText } from './read-limited-text.mjs';
export const IGC_URL = 'https://sismosgeociencias.up.ac.pa/';
const PRODUCTS = ['WEPA40', 'WEPA42', 'WECA41', 'WECA43'];
const cache = new Map(),
  pending = new Map();
async function cached(key, fn) {
  const c = cache.get(key);
  if (c && Date.now() - c.fetched < 55000) return c;
  if (pending.has(key)) return pending.get(key);
  const p = fn()
    .then((data) => {
      const value = { ...data, fetched: Date.now() };
      cache.set(key, value);
      return value;
    })
    .finally(() => pending.delete(key));
  pending.set(key, p);
  return p;
}
async function getText(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    redirect: 'error',
    headers: { 'User-Agent': 'Faro/0.1 official source reader', 'Cache-Control': 'no-cache' },
  });
  return readLimitedText(response);
}
export function parseIGC(html) {
  const $ = load(html);
  const found = new Map();
  $('table')
    .first()
    .find('tr')
    .each((_, tr) => {
      const c = $(tr)
        .find('td')
        .map((_, td) => $(td).text().trim())
        .get();
      if (c.length < 9) return;
      const tm = c[2].match(/^(\d{1,2}):(\d{2}):(\d{2})(AM|PM)$/i);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(c[1]) ||
        !tm ||
        Number(tm[1]) < 1 ||
        Number(tm[1]) > 12 ||
        Number(tm[2]) > 59 ||
        Number(tm[3]) > 59
      )
        return;
      const h = (Number(tm[1]) % 12) + (tm[4].toUpperCase() === 'PM' ? 12 : 0);
      const time = Date.parse(`${c[1]}T${String(h).padStart(2, '0')}:${tm[2]}:${tm[3]}-05:00`);
      const lat = Number(c[3]),
        lng = Number(c[4]),
        depth = Number(c[5].replace(/km$/i, '')),
        mag = Number(c[6]);
      if (
        ![time, lat, lng, depth, mag].every(Number.isFinite) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180
      )
        return;
      let url = IGC_URL;
      try {
        const u = new URL($(tr).find('a').attr('href'), IGC_URL);
        if (u.origin === new URL(IGC_URL).origin) url = u.href;
      } catch {}
      const id = `igc-${time}-${lat}-${lng}`;
      found.set(id, {
        id,
        source: 'IGC',
        lat,
        lng,
        depth,
        mag,
        place: c[7],
        time,
        updated: 0,
        url,
        reviewed: c[0].toUpperCase() === 'REVISADO',
        magType: 'M',
      });
    });
  const events = [...found.values()].sort((a, b) => b.time - a.time);
  if (!events.length) throw Error('IGC structure changed or no valid records');
  return { events, latestEvent: events[0].time, source: IGC_URL };
}
export function parseProduct(js, product) {
  const m = js.match(new RegExp(`var PHEB${product}\\s*=\\s*([\\s\\S]*?);\\s*$`));
  if (!m) throw Error('NOAA format changed');
  const d = JSON.parse(m[1]);
  const issued = Date.parse(d.bulletinIssueTime);
  if (
    d.WMOID !== product ||
    !Number.isFinite(issued) ||
    !/^\/events\/PHEB\/\d{4}\/\d{2}\/\d{2}\/\d+\/\d+\/[A-Z0-9]+\/$/.test(d.eventDir)
  )
    throw Error('Invalid NOAA product');
  return {
    product,
    issued,
    eventId: String(d.twcEventID),
    place: String(d.quakeLocation),
    url: `https://www.tsunami.gov${d.eventDir}${product}.txt`,
  };
}
export function summarizeBulletin(meta, text) {
  const normalized = text.replace(/\s+/g, ' ');
  const ended = /THREAT.*?(?:HAS NOW PASSED|HAS PASSED)|NO LONGER A TSUNAMI THREAT/.test(
    normalized,
  );
  const info = meta.product.endsWith('42') || meta.product.endsWith('43');
  const section = text.match(/\nEVALUATION\s*\n-+\s*\n([\s\S]*?)(?=\n[A-Z][A-Z .-]{5,}\n|$)/);
  return {
    ...meta,
    basin: meta.product.startsWith('WEPA') ? 'Pacific' : 'Caribbean',
    kind: ended ? 'ended' : info ? 'information' : 'threat',
    evaluation: (section?.[1] || '').trim().slice(0, 3000),
  };
}
export async function officialData(path) {
  if (path === '/api/igc') return cached('igc', async () => parseIGC(await getText(IGC_URL)));
  if (path === '/api/tsunami')
    return cached('tsunami', async () => {
      const results = await Promise.allSettled(
        PRODUCTS.map(async (code) => {
          const meta = parseProduct(
            await getText(`https://www.tsunami.gov/events/js/PHEB${code}.js`),
            code,
          );
          return summarizeBulletin(meta, await getText(meta.url));
        }),
      );
      const bulletins = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => r.value)
        .sort((a, b) => b.issued - a.issued);
      if (!bulletins.length) throw Error('NOAA unavailable');
      return {
        bulletins,
        partial: bulletins.length !== PRODUCTS.length,
        products: PRODUCTS,
        scope: 'International Pacific and Caribbean products; not a complete local alert service',
      };
    });
  return null;
}
export async function officialMiddleware(req, res, next) {
  const path = (req.url || '').split('?')[0];
  if (!['/api/igc', '/api/tsunami'].includes(path)) return next();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  try {
    res.end(JSON.stringify(await officialData(path)));
  } catch {
    res.statusCode = 502;
    res.end(
      JSON.stringify({ error: 'Official source could not be refreshed', checkedAt: Date.now() }),
    );
  }
}
