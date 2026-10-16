import type { ReactNode } from 'react';

/**
 * The exact text that will be sent, on one surface and with its line breaks: what the person
 * reads here is what the app they choose receives. Without text, a muted line says what will
 * appear. `live` announces changes politely, for a preview that follows a form.
 */
export function MessagePreview({
  text,
  empty,
  live,
}: {
  text: string;
  empty: ReactNode;
  live?: boolean;
}) {
  return (
    <div
      className="f-message"
      data-empty={!text || undefined}
      aria-live={live ? 'polite' : undefined}
    >
      {text || empty}
    </div>
  );
}

/** How much of a checklist is done: one label line with the count, and a bar under it. */
export function Progress({
  value,
  max,
  label,
  children,
}: {
  value: number;
  max: number;
  /** Names the bar for assistive technology, e.g. "Items checked". */
  label: string;
  children: ReactNode;
}) {
  const done = max > 0 && value >= max;
  return (
    <div className="f-progress">
      <span className="f-progress-text" role="status" data-done={done || undefined}>
        {children}
      </span>
      <progress className="f-progress-bar" value={value} max={max} aria-label={label} />
    </div>
  );
}
