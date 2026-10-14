export const PAGE_SIZE = 20;

/** Pages for a list, with the current page kept in range when the list shrinks. */
export function paging(total: number, page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const start = (current - 1) * size;
  return { pages, current, start, end: Math.min(total, start + size) };
}

/**
 * Page buttons to show: every page when there are few, otherwise the first, the last and the
 * neighbours of the current one, with gaps in between ("1 … 4 5 6 … 12").
 */
export function pageItems(current: number, pages: number): (number | 'gap')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const keep = new Set([1, pages, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((n) => keep.add(n));
  if (current >= pages - 2) [pages - 3, pages - 2, pages - 1].forEach((n) => keep.add(n));
  const shown = [...keep].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  return shown.flatMap((n, i) => (i > 0 && n - shown[i - 1] > 1 ? ['gap' as const, n] : [n]));
}
