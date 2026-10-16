import type { ReactNode } from 'react';
import { Progress as UiProgress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

/**
 * The exact text that will be sent, on one muted card and with its line breaks: what the person
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
      className={cn(
        'rounded-xl border bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]',
        !text && 'text-muted-foreground',
      )}
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
    <div className="grid gap-2">
      <span
        className="flex items-center gap-2 text-sm leading-snug font-medium"
        role="status"
        data-done={done || undefined}
      >
        {children}
      </span>
      {/* shadcn Progress reads a percentage; its label and value reach assistive technology. */}
      <UiProgress value={max > 0 ? Math.min(100, (value / max) * 100) : 0} aria-label={label} />
    </div>
  );
}
