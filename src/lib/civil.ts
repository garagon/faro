/**
 * Posts from Panama's civil protection agency (SINAPROC) through the same-origin adapter:
 * communiqués, prevention notices and incident reports, shown as published. A post has no
 * expiry, so Faro only says when it was published and never treats it as a warning in force.
 */
export type CivilPost = {
  id: number;
  title: string;
  summary: string;
  published: number;
  /** Last edit by the agency, only when later than publication. */
  modified?: number;
  url: string;
  kind: 'communique' | 'prevention' | 'news';
};
export type CivilSnapshot = {
  agency: string;
  posts: CivilPost[];
  fetched: number;
  /** The adapter could not refresh and served its previous copy. */
  stale: boolean;
};

export const SINAPROC_HOME = 'https://www.sinaproc.gob.pa/';
const KINDS = ['communique', 'prevention', 'news'];
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const short = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;

function validPost(value: unknown): CivilPost | null {
  const p = value as Partial<CivilPost> | null;
  if (!p || !Number.isInteger(p.id) || !short(p.title, 200) || !p.title.trim()) return null;
  if (!short(p.summary, 400) || !finite(p.published) || p.published <= 0) return null;
  if (!KINDS.includes(p.kind as string)) return null;
  let url = '';
  try {
    const u = new URL(String(p.url));
    if (u.protocol === 'https:' && /(^|\.)sinaproc\.gob\.pa$/.test(u.hostname)) url = u.href;
  } catch {
    // No link is better than a link off the agency's site.
  }
  const { modified, ...post } = p as CivilPost;
  return {
    ...post,
    url,
    ...(finite(modified) && modified > post.published ? { modified } : {}),
  };
}

/**
 * The edit time worth showing: at least 30 minutes after publication, so a typo fixed right
 * away does not read as an update.
 */
export function postUpdate(post: CivilPost) {
  return post.modified && post.modified - post.published >= 30 * 60000 ? post.modified : null;
}

/** The newest post not dated in the future, for "no new posts since …" when none is recent. */
export function lastPost(posts: readonly CivilPost[], now: number) {
  return (
    posts
      .filter((p) => p.published <= now + 5 * 60000)
      .sort((a, b) => b.published - a.published)[0] ?? null
  );
}

/** Validates the adapter response; a list where nothing is readable is a format change. */
export function parseCivil(value: unknown, received = Date.now()): CivilSnapshot {
  const d = value as { agency?: unknown; posts?: unknown; age?: unknown; stale?: unknown } | null;
  if (!d || d.agency !== 'SINAPROC' || !Array.isArray(d.posts))
    throw Error('Invalid SINAPROC response');
  const posts = d.posts.map(validPost).filter((p): p is CivilPost => !!p);
  if (d.posts.length > 0 && posts.length === 0) throw Error('Invalid SINAPROC response');
  const age = finite(d.age) && d.age >= 0 && d.age <= 24 * 3600000 ? d.age : 0;
  return { agency: 'SINAPROC', posts, fetched: received - age, stale: d.stale === true };
}

/** Posts from the last few days, newest first; a post dated in the future is left out. */
export function recentPosts(posts: readonly CivilPost[], now: number, days = 7) {
  return posts
    .filter((p) => p.published <= now + 5 * 60000 && now - p.published <= days * 86400000)
    .sort((a, b) => b.published - a.published);
}

const RAIN_OR_FLOOD = /inundaci|crecida|desbord|lluvia|deslizamiento|deslave|flood/i;
/** Recent posts whose title or opening lines mention rain or flooding, as written. */
export function floodPosts(posts: readonly CivilPost[], now: number, hours = 48) {
  return recentPosts(posts, now, hours / 24).filter((p) =>
    RAIN_OR_FLOOD.test(`${p.title} ${p.summary}`),
  );
}

/** "COMUNICADO OFICIAL #8" reads as "Comunicado oficial #8"; other titles stay as published. */
export function postTitle(title: string) {
  return title.replace(/^COMUNICADO OFICIAL\b/, 'Comunicado oficial');
}

/** A stored snapshot from an earlier visit, validated like a live answer, with its own time. */
export function reviveCivil(value: unknown, now = Date.now()): CivilSnapshot | null {
  const v = value as { fetched?: unknown } | null;
  if (!v || !finite(v.fetched) || v.fetched > now || now - v.fetched > 7 * 86400000) return null;
  try {
    return parseCivil({ ...v, age: 0 }, v.fetched);
  } catch {
    return null;
  }
}
