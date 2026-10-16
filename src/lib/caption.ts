/**
 * A row caption is one line: state, source and time joined by " · ". The space before the dot
 * does not break, so when a caption wraps (large text, a narrow phone) no line starts with "·".
 */
export const SEPARATOR = '\u00a0· ';

/** Keeps every " · " already inside a text (a catalog name, a category) on the line before. */
export const keepSeparators = (text: string) => text.replace(/ · /g, SEPARATOR);

/** Joins the parts that have text, in order, with the non-breaking separator. */
export function caption(...parts: (string | false | null | undefined)[]): string {
  return parts
    .filter((p): p is string => !!p && !!p.trim())
    .map(keepSeparators)
    .join(SEPARATOR);
}
