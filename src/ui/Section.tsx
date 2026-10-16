import type { ReactNode } from 'react';
import { ChevronLeftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** A part of a screen: a title and space, not a box. */
export function Section({
  title,
  aside,
  id,
  children,
}: {
  title?: ReactNode;
  /** Short text at the end of the title line, e.g. "En vivo · hace 1 min"; never the country. */
  aside?: ReactNode;
  id?: string;
  children: ReactNode;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    // The id makes the section a target for links that open a screen at one of its parts.
    <section
      id={id}
      className="grid gap-3 @container"
      aria-labelledby={title ? headingId : undefined}
    >
      {title && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h2 className="text-base leading-snug font-semibold" id={headingId}>
            {title}
          </h2>
          {aside && <span className="text-sm text-muted-foreground">{aside}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * The one screen head: the title (the same words as its menu entry), a short status at the end
 * of its line when the screen has one, and at most one line of lead. The frame already names
 * the country, so neither the title nor the status repeats it.
 */
export function ScreenHead({
  title,
  lead,
  aside,
  titleId,
}: {
  title: ReactNode;
  /** One line at 390 px in Spanish, saying what the content does not; or nothing. */
  lead?: ReactNode;
  /** A short status, e.g. Situación's "Comprobado hace 1 min". */
  aside?: ReactNode;
  titleId?: string;
}) {
  return (
    <header className="grid gap-1">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight" id={titleId} tabIndex={-1}>
          {title}
        </h1>
        {aside && <span className="text-sm text-muted-foreground">{aside}</span>}
      </div>
      {lead && <p className="max-w-[42rem] text-sm text-muted-foreground">{lead}</p>}
    </header>
  );
}

/** Back to the parent screen, named: "‹ Situación". */
export function BackLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ms-2.5 h-10 justify-self-start md:h-8"
      onClick={onClick}
    >
      <ChevronLeftIcon aria-hidden="true" />
      {children}
    </Button>
  );
}
