import { promisify } from 'node:util';
import { gzip } from 'node:zlib';
import { load } from 'cheerio';
import { readLimitedText } from './read-limited-text.mjs';
export const IGC_URL = 'https://sismosgeociencias.up.ac.pa/';
const PRODUCTS = ['WEPA40', 'WEPA42', 'WECA41', 'WECA43'];
const cache = new Map(),
  pending = new Map(),
  failures = new Map();
// How long a previous successful response may be served, marked stale, when a refresh fails.
export const STALE_LIMIT = 30 * 60 * 1000;
// After a failed refresh the source is not asked again for 15–30 s (jittered), so an outage is
// not multiplied by every visitor. Meanwhile the last good copy, marked stale, is served.
export const BACKOFF = 15000;
// A slow source (IGC can take 18 s) must not hold every visitor: past its lifetime, a copy this
// much older is still served at once while one refresh runs in the background.
export const REVALIDATE = 2 * 60 * 1000;
async function cached(key, fn, staleIfError = false, ttl = 55000) {
  const c = cache.get(key);
  const age = c ? Date.now() - c.fetched : Infinity;
  if (age < ttl) return c;
  // Keep the original retrieval time so clients show the data as older, never as fresh.
  const staleCopy = () => (staleIfError && c && age < STALE_LIMIT ? { ...c, stale: true } : null);
  const failed = failures.get(key);
  if (failed && Date.now() < failed.until) {
    const copy = staleCopy();
    if (copy) return copy;
    throw failed.error;
  }
  const refresh = pending.get(key) ?? start(key, fn, staleCopy);
  // Tsunami bulletins are never served late on purpose (staleIfError is off for them).
  if (staleIfError && age < ttl + REVALIDATE) {
    refresh.catch(() => {});
    // After a failed refresh the copy is no longer current: it says so.
    return failed ? staleCopy() : c;
  }
  return refresh;
}
function start(key, fn, staleCopy) {
  const p = fn()
    .then((data) => {
      failures.delete(key);
      const value = { ...data, fetched: Date.now() };
      cache.set(key, value);
      return value;
    })
    .catch((error) => {
      failures.set(key, { until: Date.now() + BACKOFF + Math.random() * BACKOFF, error });
      const copy = staleCopy();
      if (copy) return copy;
      throw error;
    })
    .finally(() => pending.delete(key));
  pending.set(key, p);
  return p;
}
async function getText(url, { timeout = 15000, stopAfter = null, limit = 2_000_000 } = {}) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeout),
    redirect: 'error',
    headers: {
      'User-Agent': 'Faro/0.1 official source reader (+https://oktsec.com)',
      'Cache-Control': 'no-cache',
    },
  });
  return readLimitedText(response, limit, stopAfter);
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
export const EMSC_URL = 'https://www.seismicportal.eu/fdsnws/event/1/query';
/** Seven days of M2.5+ events. The start is aligned to the hour so repeated URLs match. */
export function emscQuery(now = Date.now()) {
  const start = new Date(Math.floor((now - 7 * 86400000) / 3600000) * 3600000);
  const params = new URLSearchParams({
    format: 'json',
    start: start.toISOString().slice(0, 19),
    minmag: '2.5',
    limit: '3000',
    orderby: 'time',
  });
  return `${EMSC_URL}?${params}`;
}
const regionName = (s) =>
  s
    .trim()
    .toLowerCase()
    .replace(/(^|[\s.\-(/])(\p{L})/gu, (_, sep, letter) => sep + letter.toUpperCase());
export function parseEMSC(text) {
  const d = JSON.parse(text);
  if (d?.type !== 'FeatureCollection' || !Array.isArray(d.features))
    throw Error('EMSC format changed');
  const found = new Map();
  for (const feature of d.features) {
    const p = feature?.properties;
    if (!p || typeof p !== 'object') continue;
    // Known and suspected earthquakes only; explosions and other event types are left out.
    if (!['ke', 'se'].includes(p.evtype)) continue;
    const time = Date.parse(p.time),
      updated = Date.parse(p.lastupdate),
      lat = Number(p.lat),
      lng = Number(p.lon),
      depth = Number(p.depth),
      mag = p.mag === null || p.mag === undefined || p.mag === '' ? null : Number(p.mag);
    if (
      typeof p.unid !== 'string' ||
      !/^[\w-]{1,40}$/.test(p.unid) ||
      ![time, lat, lng, depth].every(Number.isFinite) ||
      (mag !== null && !Number.isFinite(mag)) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    )
      continue;
    const sourceId = String(p.source_id ?? '');
    const url = /^\d{1,12}$/.test(sourceId)
      ? `https://www.emsc-csem.org/Earthquake_information/earthquake.php?id=${sourceId}`
      : `https://www.seismicportal.eu/eventdetails.html?unid=${encodeURIComponent(p.unid)}`;
    const id = `emsc-${p.unid}`;
    found.set(id, {
      id,
      source: 'EMSC',
      lat,
      lng,
      depth,
      mag,
      place: typeof p.flynn_region === 'string' ? regionName(p.flynn_region) : '',
      time,
      updated: Number.isFinite(updated) ? updated : 0,
      url,
      reviewed: false,
      magType: typeof p.magtype === 'string' ? p.magtype.slice(0, 8) : '',
      authority:
        typeof p.auth === 'string' && /^[\w-]{1,16}$/.test(p.auth.trim()) ? p.auth.trim() : '',
    });
  }
  const events = [...found.values()].sort((a, b) => b.time - a.time);
  return { events, latestEvent: events[0]?.time ?? 0, source: 'https://www.seismicportal.eu/' };
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
  const section = text.match(/\nEVALUATION\s*\n-+\s*\n([\s\S]*?)(?=\n[A-Z][A-Z .-]{5,}\n|$)/);
  const evaluation = (section?.[1] || '').trim().slice(0, 3000);
  const normalized = evaluation.replace(/\s+/g, ' ').toUpperCase();
  // Only an explicit, event-wide conclusion closes a threat. Regional or
  // conditional cancellation language must not close a broader bulletin.
  const ended =
    /(?:^|\*|\.\.\.)\s*(?:THE TSUNAMI THREAT (?:FROM THIS EARTHQUAKE )?HAS (?:NOW )?PASSED(?: AND THERE IS NO FURTHER THREAT)?|THERE IS NO LONGER A TSUNAMI THREAT FROM THIS EARTHQUAKE)\s*(?:\.|$)/.test(
      normalized,
    );
  const cancelled =
    /(?:^|\*|\.\.\.)\s*(?:THE|ALL) TSUNAMI (?:WARNING|WARNINGS|ADVISORIES|WATCHES)(?:,? (?:ADVISORIES|AND WATCHES))* (?:IS|ARE|HAS BEEN|HAVE BEEN) CANCELLED\s*(?:\.|$)/.test(
      normalized,
    );
  const info = meta.product.endsWith('42') || meta.product.endsWith('43');
  return {
    ...meta,
    basin: meta.product.startsWith('WEPA') ? 'Pacific' : 'Caribbean',
    kind: cancelled ? 'cancelled' : ended ? 'ended' : info ? 'information' : 'threat',
    evaluation,
  };
}
const GDACS_API = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist';
const GDACS_TYPES = ['EQ', 'TC', 'FL', 'VO', 'DR', 'WF'];
/** Current events (latest 100) plus every Orange or Red event of the last 14 days. */
export function gdacsQueries(now = Date.now()) {
  const day = (t) => new Date(t).toISOString().slice(0, 10);
  const params = new URLSearchParams({
    eventlist: GDACS_TYPES.join(';'),
    alertlevel: 'Orange;Red',
    fromDate: day(now - 14 * 86400000),
    toDate: day(now + 86400000),
    pageSize: '100',
    pageNumber: '1',
  });
  return [`${GDACS_API}/EVENTS4APP`, `${GDACS_API}/SEARCH?${params}`];
}
// GDACS dates are UTC without a zone suffix.
const gdacsTime = (s) =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)
    ? Date.parse(`${s}Z`)
    : NaN;
const text = (s, max) => (typeof s === 'string' ? s.replace(/\s+/g, ' ').trim().slice(0, max) : '');
export function parseGDACS(body) {
  // SEARCH answers 204 with no body when nothing matches.
  if (!body.trim()) return [];
  const d = JSON.parse(body);
  if (d?.type !== 'FeatureCollection' || !Array.isArray(d.features))
    throw Error('GDACS format changed');
  const events = [];
  for (const feature of d.features) {
    const p = feature?.properties;
    if (!p || typeof p !== 'object') continue;
    const level = String(p.alertlevel).toLowerCase();
    const eventid = Number(p.eventid),
      episodeid = Number(p.episodeid);
    const from = gdacsTime(p.fromdate),
      to = gdacsTime(p.todate),
      modified = gdacsTime(p.datemodified);
    if (
      !GDACS_TYPES.includes(p.eventtype) ||
      !['green', 'orange', 'red'].includes(level) ||
      !Number.isSafeInteger(eventid) ||
      !Number.isSafeInteger(episodeid) ||
      !Number.isFinite(from) ||
      !Number.isFinite(to)
    )
      continue;
    const countries = Array.isArray(p.affectedcountries)
      ? p.affectedcountries
          .map((c) => (typeof c?.iso2 === 'string' ? c.iso2.toUpperCase() : ''))
          .filter((c) => /^[A-Z]{2}$/.test(c))
      : [];
    const [lng, lat] = Array.isArray(feature.geometry?.coordinates)
      ? feature.geometry.coordinates.map(Number)
      : [];
    events.push({
      id: `${p.eventtype}-${eventid}`,
      type: p.eventtype,
      level,
      name: text(p.name, 160),
      region: text(p.country, 120),
      countries: [...new Set(countries)],
      from,
      to,
      modified: Number.isFinite(modified) ? modified : to,
      current: p.iscurrent !== 'false' && p.iscurrent !== false,
      // Floods carry a placeholder "Magnitude 0"; it says nothing, so it is dropped.
      severity: text(p.severitydata?.severitytext, 160).replace(/^Magnitude 0\s*$/i, ''),
      lat: Number.isFinite(lat) && Math.abs(lat) <= 90 ? lat : null,
      lng: Number.isFinite(lng) && Math.abs(lng) <= 180 ? lng : null,
      // Built from validated numbers, never copied from the response.
      url: `https://www.gdacs.org/report.aspx?eventid=${eventid}&episodeid=${episodeid}&eventtype=${p.eventtype}`,
    });
  }
  return events;
}
/** One record per event, keeping its most recently modified episode. */
export function mergeGDACS(lists) {
  const byId = new Map();
  for (const e of lists.flat())
    if (!byId.has(e.id) || e.modified > byId.get(e.id).modified) byId.set(e.id, e);
  return [...byId.values()].sort((a, b) => b.to - a.to);
}
export const NHC_URL = 'https://www.nhc.noaa.gov/CurrentStorms.json';
const NHC_CLASSES = ['TD', 'STD', 'TS', 'STS', 'HU', 'TY', 'PTC', 'PC'];
const number = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
const finiteOrNull = (v) => (Number.isFinite(number(v)) ? number(v) : null);
/**
 * Active tropical cyclones from NOAA's National Hurricane Center (Atlantic, eastern and central
 * Pacific). Links are rebuilt by the browser from the validated id and bin, never copied.
 */
export function parseNHC(body) {
  const d = JSON.parse(body);
  if (!Array.isArray(d?.activeStorms)) throw Error('NHC format changed');
  return d.activeStorms.flatMap((s) => {
    const id = String(s?.id ?? '').toLowerCase(),
      bin = String(s?.binNumber ?? '').toUpperCase(),
      classification = String(s?.classification ?? '').toUpperCase();
    // Live files use latitudeNumeric; the 2019 reference documents latitude_numeric.
    const lat = finiteOrNull(s?.latitudeNumeric ?? s?.latitude_numeric),
      lng = finiteOrNull(s?.longitudeNumeric ?? s?.longitude_numeric);
    if (
      !/^(al|ep|cp)\d{6}$/.test(id) ||
      !/^(AT|EP|CP)[1-5]$/.test(bin) ||
      !NHC_CLASSES.includes(classification) ||
      lat === null ||
      lng === null ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    )
      return [];
    const advisory = String(s.publicAdvisory?.advNum ?? '');
    const issued = Date.parse(s.publicAdvisory?.issuance),
      updated = Date.parse(s.lastUpdate);
    return [
      {
        id,
        bin,
        name: text(s.name, 40),
        classification,
        intensityKt: finiteOrNull(s.intensity),
        pressureMb: finiteOrNull(s.pressure),
        lat,
        lng,
        advisory: /^\d{1,3}[a-z]?$/i.test(advisory) ? advisory : '',
        issued: Number.isFinite(issued) ? issued : 0,
        updated: Number.isFinite(updated) ? updated : 0,
        spanish: false,
      },
    ];
  });
}
/**
 * NHC's Spanish advisory slots keep an earlier storm's text after it ends. A Spanish link is
 * offered only when the slot's feed names this storm.
 */
async function withSpanishCheck(storms) {
  return Promise.all(
    storms.map(async (storm) => {
      if (storm.bin.startsWith('CP')) return storm;
      try {
        const feed = await getText(`https://www.nhc.noaa.gov/xml/TAS${storm.bin}.xml`, {
          timeout: 6000,
          limit: 100_000,
        });
        return { ...storm, spanish: feed.includes(storm.id.toUpperCase()) };
      } catch {
        return storm;
      }
    }),
  );
}
/**
 * National meteorological warnings published as CAP (Common Alerting Protocol) feeds. Only
 * agencies with an active feed verified on 2026-10-13. Each feed may link only to its own host,
 * and an alert's web page only to the agency's domain.
 */
export const NATIONAL_FEEDS = {
  PA: {
    agency: 'IMHPA',
    rss: 'https://cap-sources.s3.amazonaws.com/pa-imhpa-es/rss.xml',
    web: ['imhpa.gob.pa'],
  },
  CR: {
    agency: 'IMN',
    rss: 'https://cap-sources.s3.amazonaws.com/cr-imn-es/rss.xml',
    web: ['imn.ac.cr'],
  },
  DO: {
    agency: 'INDOMET',
    rss: 'https://cap-sources.s3.amazonaws.com/do-indomet-es/rss.xml',
    web: ['indomet.gob.do', 'indomet.gov.do'],
  },
  EC: {
    agency: 'INAMHI',
    rss: 'https://cap-sources.s3.amazonaws.com/ec-inamhi-es/rss.xml',
    // www.inamhi.gob.ec carried injected spam links when reviewed; only the services host.
    web: ['servicios.inamhi.gob.ec'],
  },
  AR: { agency: 'SMN Argentina', rss: 'https://ssl.smn.gob.ar/CAP/AR.php', web: ['smn.gob.ar'] },
};
const onDomain = (url, domains) => {
  try {
    const u = new URL(url);
    return (
      u.protocol === 'https:' &&
      domains.some((d) => u.hostname === d || u.hostname.endsWith(`.${d}`))
    );
  } catch {
    return false;
  }
};
/** Message links from an RSS feed, restricted to the feed's own host. */
export function parseCapFeed(xml, feedUrl) {
  const $ = load(xml, { xmlMode: true });
  // A maintenance page or error HTML answered with 200 is not an empty feed.
  if (!$('rss > channel, feed').length) throw Error('CAP feed format changed');
  const host = new URL(feedUrl).hostname;
  return $('item')
    .map((_, item) => $(item).find('link').first().text().trim())
    .get()
    .filter((link) => {
      try {
        const u = new URL(link);
        return u.protocol === 'https:' && u.hostname === host && link !== feedUrl;
      } catch {
        return false;
      }
    });
}
/**
 * One CAP message. Sender addresses are personal and never kept. Returns null for tests,
 * exercises, cancellations and expired messages.
 */
export function parseCapMessage(xml, feed, now = Date.now()) {
  // Feeds differ only in the namespace prefix (<cap:alert> or <alert>); drop element prefixes.
  const $ = load(xml.replace(/<(\/?)[A-Za-z][\w.-]*:/g, '<$1'), { xmlMode: true });
  const field = (scope, tag) => scope.find(tag).first().text().replace(/\s+/g, ' ').trim();
  const alert = $('alert').first();
  if (!alert.length) throw Error('CAP format changed');
  const status = field(alert, 'status'),
    msgType = field(alert, 'msgType');
  if (status !== 'Actual' || !['Alert', 'Update'].includes(msgType)) return null;
  const infos = alert.children('info');
  const spanish = infos.filter((_, i) => /^es/i.test(field($(i), 'language'))).first();
  const info = spanish.length ? spanish : infos.first();
  if (!info.length) return null;
  const sent = Date.parse(field(alert, 'sent')),
    expires = Date.parse(field(info, 'expires')),
    onset = Date.parse(field(info, 'onset') || field(info, 'effective'));
  if (!Number.isFinite(sent) || !Number.isFinite(expires) || expires <= now) return null;
  const severity = field(info, 'severity');
  const web = field(info, 'web');
  const areas = info
    .find('area > areaDesc')
    .map((_, a) => $(a).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter(Boolean);
  // Free text keeps its line breaks (agencies list risks and instructions one per line).
  const block = (tag, max) =>
    info
      .find(tag)
      .first()
      .text()
      .split(/\r?\n/)
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
      .slice(0, max);
  // Warning areas as published: "lat,lon lat,lon …" rings, bounded in count and size.
  const polygons = info
    .find('area > polygon')
    .map((_, a) => $(a).text())
    .get()
    .slice(0, 4)
    .map((ring) =>
      ring
        .trim()
        .split(/\s+/)
        .map((pair) => pair.split(',').map(Number))
        .filter(
          ([lat, lng]) =>
            Number.isFinite(lat) &&
            Number.isFinite(lng) &&
            Math.abs(lat) <= 90 &&
            Math.abs(lng) <= 180,
        )
        .slice(0, 400),
    )
    .filter((ring) => ring.length >= 4);
  return {
    id: text(field(alert, 'identifier'), 120),
    event: text(field(info, 'event'), 160),
    headline: text(field(info, 'headline'), 200),
    severity: ['Extreme', 'Severe', 'Moderate', 'Minor'].includes(severity) ? severity : 'Unknown',
    areas: [...new Set(areas)].join('; ').slice(0, 400),
    sent,
    onset: Number.isFinite(onset) ? onset : null,
    expires,
    url: onDomain(web, feed.web) ? web : '',
    description: block('description', 1200),
    instruction: block('instruction', 600),
    polygons,
  };
}
// Most recent messages read per feed; more than this marks the answer as partial.
const NATIONAL_LIMIT = 20;
async function nationalWarnings(code) {
  const feed = NATIONAL_FEEDS[code];
  const all = parseCapFeed(await getText(feed.rss, { timeout: 8000, limit: 1_000_000 }), feed.rss);
  const links = all.slice(0, NATIONAL_LIMIT);
  const results = await Promise.allSettled(
    links.map(async (link) =>
      parseCapMessage(await getText(link, { timeout: 7000, limit: 300_000 }), feed),
    ),
  );
  const seen = new Set();
  const warnings = results
    .flatMap((r) => (r.status === 'fulfilled' && r.value ? [r.value] : []))
    .sort((a, b) => b.sent - a.sent)
    // An update repeats the same event and area; keep the most recent one.
    .filter((w) => {
      const key = `${w.event}|${w.areas}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  const missed = results.filter((r) => r.status === 'rejected').length;
  return {
    country: code,
    agency: feed.agency,
    warnings,
    // Messages left unread (failed or beyond the limit) mean the list may be incomplete.
    partial: missed > 0 || all.length > links.length,
    // How many of the most recent messages were read, and how many of those failed: with none
    // failed, the app can say exactly what it checked ("the 20 most recent").
    read: links.length,
    missed,
  };
}
// Panama's civil protection agency publishes communiqués, prevention notices and incident
// reports as WordPress posts. A fixed query: nothing from the client reaches the URL.
export const SINAPROC_POSTS =
  'https://www.sinaproc.gob.pa/wp-json/wp/v2/posts?per_page=12&_fields=id,date_gmt,modified_gmt,link,title,excerpt,categories';
// "Simulacro" and "Simulacro 2": drill material, never shown as a real event.
const SINAPROC_DRILLS = [13, 25];
/** Plain text from a rendered WordPress field: no markup, entities decoded, bounded. */
function plainText(html, max) {
  if (typeof html !== 'string') return '';
  return load(`<div>${html}</div>`)
    .root()
    .text()
    .replace(/[\u200b-\u200f\u2060\ufeff]/g, '')
    .replace(/\[(?:…|&hellip;|\.\.\.)\]\s*$/, '…')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}
/** Recent SINAPROC posts as published: title, opening lines, time and link. */
export function parseSinaprocPosts(value) {
  if (!Array.isArray(value)) throw Error('SINAPROC format changed');
  const posts = value
    .map((p) => {
      if (!p || !Number.isInteger(p.id) || typeof p.date_gmt !== 'string') return null;
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(p.date_gmt)) return null;
      const published = Date.parse(`${p.date_gmt}Z`);
      const title = plainText(p.title?.rendered, 200);
      if (!Number.isFinite(published) || !title) return null;
      if (Array.isArray(p.categories) && p.categories.some((c) => SINAPROC_DRILLS.includes(c)))
        return { drill: true };
      // The excerpt opens with a dateline ("Panamá, 12 de octubre de 2026.-"); the date is
      // already shown, so the summary starts with what the agency reports.
      const summary = plainText(p.excerpt?.rendered, 600)
        .replace(/^.{0,60}?\b\d{4}\s*\.?\s*[-–—]+\s*/, '')
        .slice(0, 400);
      // A later edit (a communiqué with corrected figures) keeps its first date; the edit
      // time is kept apart so the reader can see the text changed.
      const edited =
        typeof p.modified_gmt === 'string' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(p.modified_gmt)
          ? Date.parse(`${p.modified_gmt}Z`)
          : NaN;
      return {
        id: p.id,
        title,
        summary,
        published,
        ...(Number.isFinite(edited) && edited > published ? { modified: edited } : {}),
        url: onDomain(p.link, ['sinaproc.gob.pa']) ? p.link : '',
        kind: /^aviso de prevenci[oó]n/i.test(title)
          ? 'prevention'
          : /^comunicado/i.test(title)
            ? 'communique'
            : 'news',
      };
    })
    .filter(Boolean);
  if (value.length > 0 && posts.length === 0) throw Error('SINAPROC format changed');
  return posts.filter((p) => !p.drill).sort((a, b) => b.published - a.published);
}
export async function officialData(path, params = new URLSearchParams()) {
  if (path === '/api/sinaproc')
    return cached(
      'sinaproc',
      async () => ({
        agency: 'SINAPROC',
        posts: parseSinaprocPosts(
          JSON.parse(await getText(SINAPROC_POSTS, { timeout: 12000, limit: 500_000 })),
        ),
      }),
      true,
      10 * 60000,
    );
  if (path === '/api/national') {
    const code = params.get('country') ?? '';
    // Only listed agencies; the country never becomes part of an upstream URL.
    if (!Object.hasOwn(NATIONAL_FEEDS, code)) throw new RangeError('Unsupported country');
    return cached(`national-${code}`, () => nationalWarnings(code), true, 10 * 60000);
  }
  if (path === '/api/igc')
    return cached(
      'igc',
      // The page lists about a week of events in its first table, followed by other large
      // tables. Only the first table is parsed, so the download stops there.
      async () => parseIGC(await getText(IGC_URL, { timeout: 18000, stopAfter: '</table>' })),
      true,
    );
  if (path === '/api/emsc')
    return cached(
      'emsc',
      async () => parseEMSC(await getText(emscQuery(), { timeout: 18000, limit: 4_000_000 })),
      true,
    );
  if (path === '/api/alerts')
    return cached(
      'gdacs',
      async () => {
        const results = await Promise.allSettled(
          gdacsQueries().map(async (url) => parseGDACS(await getText(url))),
        );
        const lists = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
        if (!lists.length) throw Error('GDACS unavailable');
        return {
          events: mergeGDACS(lists),
          partial: lists.length !== results.length,
          source: 'Global Disaster Alert and Coordination System, GDACS',
        };
      },
      true,
    );
  if (path === '/api/storms')
    return cached(
      'nhc',
      async () => ({
        storms: await withSpanishCheck(
          parseNHC(await getText(NHC_URL, { timeout: 8000, limit: 500_000 })),
        ),
        source: 'NOAA National Hurricane Center',
      }),
      true,
    );
  if (path === '/api/tsunami')
    return cached('tsunami', async () => {
      const results = await Promise.allSettled(
        PRODUCTS.map(async (code) => {
          const meta = parseProduct(
            await getText(`https://www.tsunami.gov/events/js/PHEB${code}.js`, { timeout: 7000 }),
            code,
          );
          return summarizeBulletin(meta, await getText(meta.url, { timeout: 7000 }));
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
export const OFFICIAL_PATHS = [
  '/api/igc',
  '/api/emsc',
  '/api/tsunami',
  '/api/alerts',
  '/api/storms',
  '/api/national',
  '/api/sinaproc',
];
// Only /api/national takes a parameter. Anything else would only bypass the shared cache.
const ALLOWED_PARAMS = { '/api/national': ['country'] };
const gzipAsync = promisify(gzip);
/** Whether Accept-Encoding allows gzip, honouring "gzip;q=0" as a refusal. */
const acceptsGzip = (header) =>
  header.split(',').some((part) => {
    const [name, ...params] = part
      .toLowerCase()
      .split(';')
      .map((x) => x.trim());
    const q = params.find((x) => x.startsWith('q='));
    return name === 'gzip' && (q === undefined || Number(q.slice(2)) > 0);
  });
/** Gzip for answers over 1 KB when the client accepts it; otherwise the text as it is. */
export async function encodeBody(body, acceptEncoding = '') {
  if (body.length <= 1024 || !acceptsGzip(acceptEncoding)) return { body };
  return { body: await gzipAsync(body), encoding: 'gzip' };
}
export async function officialMiddleware(req, res, next) {
  const [path, query = ''] = (req.url || '').split('?');
  if (!OFFICIAL_PATHS.includes(path)) return next();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  // Browsers always ask again; a shared cache (CDN) may hold an answer for 30 s and keep serving
  // it if the origin fails. The browser adds the HTTP Age header to the body's age, so a cached
  // copy is never shown as fresher than it is. Errors are never cached.
  res.setHeader('Cache-Control', 'no-store');
  // HEAD is answered like GET without a body, so uptime monitors can check each route.
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  const params = new URLSearchParams(query);
  if ([...params.keys()].some((k) => !(ALLOWED_PARAMS[path] ?? []).includes(k))) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Unsupported request' }));
    return;
  }
  try {
    const data = await officialData(path, params);
    res.setHeader(
      'Cache-Control',
      'public, max-age=0, s-maxage=30, stale-while-revalidate=30, stale-if-error=600',
    );
    // Age lets the browser place the retrieval on its own clock, avoiding server clock skew.
    const body = JSON.stringify({ ...data, age: Math.max(0, Date.now() - data.fetched) });
    // The earthquake table is a few hundred kilobytes every minute: compressed, it costs a
    // fraction of that on a phone's data plan. Hosts that compress again see the header and skip.
    res.setHeader('Vary', 'Accept-Encoding');
    const encoded = await encodeBody(body, String(req.headers?.['accept-encoding'] ?? ''));
    if (encoded.encoding) {
      res.setHeader('Content-Encoding', encoded.encoding);
      res.setHeader('Content-Length', encoded.body.length);
    }
    res.end(req.method === 'HEAD' ? undefined : encoded.body);
  } catch (error) {
    if (error instanceof RangeError) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'Unsupported request' }));
      return;
    }
    res.statusCode = 502;
    res.end(
      JSON.stringify({ error: 'Official source could not be refreshed', checkedAt: Date.now() }),
    );
  }
}
