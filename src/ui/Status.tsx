import type { ReactNode } from 'react';
import { ChevronRightIcon, PhoneIcon } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { telHref } from '../lib/phone.ts';

/*
 * The parts of a screen read by someone in a hurry: a status that answers "is anything going on
 * here?" before anything else, official warnings as cards that cannot be missed, actions as
 * large buttons, numbers as large buttons, and a short board of what each source lists.
 */

/**
 * The status headline: a small line with the place, the answer in one short sentence, and one
 * or two lines under it (the latest earthquake, when the sources were checked). The sentence is
 * the screen's heading: what a screen reader hears first.
 */
export function StatusHead({
  place,
  title,
  lines,
  titleId,
}: {
  /** "Panamá · ahora" */
  place?: ReactNode;
  title: ReactNode;
  lines?: ReactNode;
  titleId?: string;
}) {
  return (
    <header className="grid gap-2">
      {place && <p className="text-sm font-medium text-muted-foreground">{place}</p>}
      <h1
        id={titleId}
        tabIndex={-1}
        className="text-3xl font-semibold tracking-tight text-balance @min-[900px]/app:text-4xl"
      >
        {title}
      </h1>
      {lines && <div className="grid gap-1 text-base text-muted-foreground">{lines}</div>}
    </header>
  );
}

const cardTone = cva('grid gap-2 rounded-xl p-4 text-start', {
  variants: {
    level: {
      1: 'bg-amber-100 text-amber-950',
      2: 'bg-orange-700 text-white',
      3: 'bg-red-700 text-white',
    },
  },
});

/**
 * An official warning in force, as a card in the colour of its level (amber, orange, red): the
 * agency and the level as published, the warning's own name as the title, when it applies, and
 * what to do next. `compact` is one line with a chevron, for the second and later warnings.
 */
export function AlertCard({
  level,
  kicker,
  pill,
  title,
  lines,
  actions,
  compact,
  onClick,
  id,
  role,
  lang,
}: {
  level: 1 | 2 | 3;
  /** Who issued it: "Aviso del IMHPA", "NOAA/PTWC · Tsunami". */
  kicker: ReactNode;
  /** The level in the agency's words: "Extrema", "Mensaje de amenaza". */
  pill?: ReactNode;
  title: ReactNode;
  lines?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
  /** A compact card is one button that opens the warning. */
  onClick?: () => void;
  id?: string;
  role?: 'alert';
  lang?: string;
}) {
  const head = (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold tracking-wide uppercase opacity-90">
      <span>{kicker}</span>
      {pill && (
        <span className="rounded-full bg-current/15 px-2 py-0.5 normal-case tracking-normal">
          {pill}
        </span>
      )}
    </p>
  );
  if (compact)
    return (
      <button
        type="button"
        id={id}
        role={role}
        lang={lang}
        onClick={onClick}
        className={cn(
          cardTone({ level }),
          'f-pressable w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 outline-none hover:brightness-95 focus-visible:ring-[3px] focus-visible:ring-ring motion-reduce:transition-none',
        )}
      >
        <span className="grid gap-1">
          {head}
          <span className="text-lg leading-snug font-semibold text-balance">{title}</span>
        </span>
        <ChevronRightIcon className="size-5 opacity-80" aria-hidden="true" />
      </button>
    );
  return (
    <div id={id} role={role} lang={lang} className={cardTone({ level })}>
      {head}
      <p className="text-xl leading-snug font-semibold text-balance">{title}</p>
      {lines && <div className="grid gap-1 text-base leading-normal">{lines}</div>}
      {actions && <div className="mt-1 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** A button on an AlertCard: white on the dark levels, outlined on amber. */
export function AlertCardButton({
  onClick,
  href,
  children,
  icon,
}: {
  onClick?: () => void;
  /** A link to another site, opened in a new tab. */
  href?: string;
  children: ReactNode;
  icon?: ReactNode;
}) {
  const className =
    'f-pressable h-10 border border-current/30 bg-white/90 text-foreground hover:bg-white motion-reduce:transition-none';
  if (href)
    return (
      <Button asChild variant="secondary" className={className}>
        <a href={href} target="_blank" rel="noreferrer">
          {icon}
          {children}
        </a>
      </Button>
    );
  return (
    <Button type="button" variant="secondary" className={className} onClick={onClick}>
      {icon}
      {children}
    </Button>
  );
}

/** Two or three large actions side by side; each is a tile with an icon and a short label. */
export function ActionTiles({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-2 gap-3">
      {children}
    </div>
  );
}

export function ActionTile({
  icon,
  onClick,
  children,
}: {
  icon?: ReactNode;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="f-pressable h-auto min-h-18 flex-col items-start justify-between gap-2 p-3 text-start whitespace-normal shadow-xs motion-reduce:transition-none"
    >
      <span className="flex w-full items-center justify-between text-muted-foreground [&_svg:not([class*='size-'])]:size-5">
        {icon}
        <ChevronRightIcon className="size-4" aria-hidden="true" />
      </span>
      <span className="text-base leading-snug font-medium">{children}</span>
    </Button>
  );
}

/** Phone numbers as large buttons in two columns: the number first, who answers under it. */
export function NumberTiles({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-2 gap-3">
      {children}
    </div>
  );
}

export function NumberTile({
  number,
  name,
  dial,
  href,
  icon,
}: {
  /** As shown. */
  number: string;
  name: ReactNode;
  /** As dialled, when it differs from what is shown. */
  dial?: string;
  /** Another kind of line (WhatsApp) instead of a call. */
  href?: string;
  icon?: ReactNode;
}) {
  return (
    <Button
      asChild
      variant="outline"
      className="f-pressable h-auto min-h-18 items-center justify-between gap-3 px-4 py-3 text-start whitespace-normal shadow-xs motion-reduce:transition-none"
    >
      <a
        href={href ?? telHref(dial ?? number)}
        {...(href ? { target: '_blank', rel: 'noreferrer' } : {})}
      >
        <span className="grid min-w-0 gap-0.5">
          <span className="text-lg leading-tight font-semibold tabular-nums">{number}</span>
          <span className="text-sm leading-snug font-normal text-muted-foreground">{name}</span>
        </span>
        <span className="shrink-0 text-destructive [&_svg:not([class*='size-'])]:size-5">
          {icon ?? <PhoneIcon aria-hidden="true" />}
        </span>
      </a>
    </Button>
  );
}

/** What each source lists, one short line per hazard: a dot in the level's colour, the name, the state. */
export function Board({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div
      role="list"
      aria-label={label}
      className="f-list divide-y overflow-hidden rounded-xl border bg-card shadow-xs"
    >
      {children}
    </div>
  );
}

export type BoardTone = 'none' | 'listed' | 'pending' | 'unknown' | 1 | 2 | 3;

const dot = cva('size-2.5 shrink-0 rounded-full', {
  variants: {
    tone: {
      none: 'bg-muted-foreground/30',
      listed: 'bg-foreground',
      pending: 'bg-muted-foreground/50 motion-safe:animate-pulse',
      unknown: 'bg-transparent ring-1 ring-muted-foreground ring-inset',
      1: 'bg-amber-400',
      2: 'bg-orange-600',
      3: 'bg-red-600',
    },
  },
});

/**
 * One line of the board: the dot says the state at a glance (grey: nothing listed; black: something
 * listed; hollow: no usable answer; a level colour: an official level), the words say it exactly.
 */
export function BoardRow({
  tone,
  name,
  status,
  badge,
  onClick,
}: {
  tone: BoardTone;
  name: ReactNode;
  status: ReactNode;
  badge?: ReactNode;
  onClick: () => void;
}) {
  return (
    <div role="listitem">
      <button
        type="button"
        onClick={onClick}
        className="f-row f-pressable flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-start outline-none hover:bg-accent/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-accent/70 motion-reduce:transition-none"
      >
        <span className={dot({ tone })} data-tone={tone} aria-hidden="true" />
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-base font-medium">{name}</span>
          {badge}
          <span className="text-base text-muted-foreground">{status}</span>
        </span>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * "What is happening?": two to four large tiles, one pressed. A named group of pressed/unpressed
 * buttons, each a tab stop, like Segmented, but as tall as a finger needs in a hurry.
 */
export function HazardPicker<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: ReactNode; icon?: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <ToggleGroup
      type="single"
      rovingFocus={false}
      value={value}
      onValueChange={(next) => next && onChange(next as T)}
      role="group"
      aria-label={label}
      className="grid w-full gap-2"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          role={undefined}
          aria-checked={undefined}
          aria-pressed={o.value === value}
          className={cn(
            'f-pressable h-auto min-h-14 flex-col gap-1 rounded-lg border bg-card px-2 py-2 text-sm font-medium whitespace-normal shadow-xs motion-reduce:transition-none data-[spacing=0]:rounded-lg',
            'hover:bg-accent/50 hover:text-foreground',
            'data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90',
            "[&_svg:not([class*='size-'])]:size-5",
          )}
        >
          {o.icon}
          <span className="f-segmented-label leading-tight">{o.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
