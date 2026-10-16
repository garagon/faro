import { Fragment, isValidElement, type ReactNode } from 'react';
import { ArrowUpRightIcon, ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { Badge as UiBadge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item';
import { cn } from '@/lib/utils';
import { flatChildren } from './children.ts';

/** Rows in one card (shadcn ItemGroup), separated by fine lines. */
export function List({ children, label }: { children: ReactNode; label?: string }) {
  const rows = flatChildren(children);
  return (
    <ItemGroup
      aria-label={label}
      className="f-list overflow-hidden rounded-xl border bg-card shadow-xs [&>li]:list-none"
    >
      {rows.map((row, i) => (
        <Fragment key={isValidElement(row) && row.key !== null ? row.key : i}>
          {i > 0 && <ItemSeparator />}
          {row}
        </Fragment>
      ))}
    </ItemGroup>
  );
}

export type Signal = 'listed' | 'none' | 'pending' | 'unknown';

/** The icon square at the start of a row (ItemMedia's icon look), tinted by an official level. */
const iconSquare = cva(
  "flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground/70 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      state: {
        listed: 'text-foreground',
        none: '',
        pending: 'text-muted-foreground motion-safe:animate-pulse',
        unknown: 'text-muted-foreground/70',
      },
      level: {
        1: 'bg-amber-100 text-amber-900',
        2: 'bg-orange-100 text-orange-900',
        3: 'bg-red-100 text-red-900',
      },
    },
  },
);

/**
 * A hazard's icon in a square, tinted by the official level when the source lists something.
 * Neutral when nothing is listed, faded without a usable answer, pulsing while checking.
 */
export function StatusIcon({
  icon,
  state,
  level,
}: {
  icon: ReactNode;
  state: Signal;
  level?: 1 | 2 | 3;
}) {
  return (
    <span
      className={iconSquare({ state, level })}
      data-state={state}
      data-level={level}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}

/** A neutral icon square at the start of an action row, so every row shares one text edge. */
export function RowIcon({ icon }: { icon: ReactNode }) {
  return (
    <span className={iconSquare()} aria-hidden="true">
      {icon}
    </span>
  );
}

/** shadcn Badge tones: the official levels (soft amber, orange, red), secondary and outline. */
const badgeTone = cva('', {
  variants: {
    tone: {
      secondary: '',
      outline: '',
      level1: 'border-transparent bg-amber-100 text-amber-900',
      level2: 'border-transparent bg-orange-100 text-orange-900',
      level3: 'border-transparent bg-red-100 text-red-900',
    },
  },
});

/** The agency's level in its own words ("Aviso", "Alerta naranja"), coloured by the scale. */
export function Badge({
  level,
  variant = 'secondary',
  children,
}: {
  level?: 1 | 2 | 3;
  /** Without a level: secondary (filled) or outline. */
  variant?: 'secondary' | 'outline';
  children: ReactNode;
}) {
  const tone = level ? (`level${level}` as const) : variant;
  return (
    <UiBadge variant={variant} className={badgeTone({ tone })} data-level={level}>
      {children}
    </UiBadge>
  );
}

type RowContent = {
  lead?: ReactNode;
  /** Label weight. A level badge can follow it. */
  title: ReactNode;
  badge?: ReactNode;
  /** One caption line: state, source and time. */
  meta?: ReactNode;
  trail?: ReactNode;
  /** The title is a figure to read at a glance (a phone number). */
  figure?: boolean;
  /** Trailing icon in call red (phone rows). */
  tone?: 'call';
};

/** Row parts as shadcn Item slots: media, title and description, actions. */
function Inner({ lead, title, badge, meta, trail, figure, tone }: RowContent) {
  return (
    <>
      {lead && <ItemMedia>{lead}</ItemMedia>}
      <ItemContent className="min-w-0">
        <ItemTitle className={cn('flex-wrap', figure && 'text-base font-semibold tabular-nums')}>
          {title}
          {badge}
        </ItemTitle>
        {meta && (
          <ItemDescription className="line-clamp-none text-pretty [&_a]:underline [&_a]:underline-offset-4">
            {meta}
          </ItemDescription>
        )}
      </ItemContent>
      {trail && (
        <ItemActions
          className={cn(
            "text-muted-foreground [&_svg:not([class*='size-'])]:size-4",
            tone === 'call' && 'text-destructive',
          )}
        >
          {trail}
        </ItemActions>
      )}
    </>
  );
}

/** A row inside the List card: square corners, hover tint, the focus ring kept inside. */
const rowClass = 'f-row w-full gap-3 rounded-none text-start focus-visible:ring-inset';
const pressable = 'f-pressable cursor-pointer hover:bg-accent/50 active:bg-accent/70';

/**
 * A list row: a button when it opens something, a link when it leaves or calls, plain otherwise.
 * Every row is a title and one caption line; nothing else changes size or weight.
 */
export function ListRow(
  p: RowContent & ({ onClick: () => void } | { href: string; external?: boolean } | object),
) {
  const href = 'href' in p ? p.href : undefined;
  const external = 'external' in p && p.external;
  const trail =
    p.trail ??
    (external ? (
      <ArrowUpRightIcon aria-hidden="true" />
    ) : 'onClick' in p || (href !== undefined && !href.startsWith('tel:')) ? (
      <ChevronRightIcon aria-hidden="true" />
    ) : null);
  const content = <Inner {...p} trail={trail} />;
  return (
    <div role="listitem">
      {'onClick' in p ? (
        <Item asChild size="sm" className={cn(rowClass, pressable)} data-tone={p.tone}>
          <button type="button" onClick={p.onClick}>
            {content}
          </button>
        </Item>
      ) : href !== undefined ? (
        <Item asChild size="sm" className={cn(rowClass, pressable)} data-tone={p.tone}>
          <a href={href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
            {content}
          </a>
        </Item>
      ) : (
        <Item size="sm" className={rowClass} data-tone={p.tone}>
          {content}
        </Item>
      )}
    </div>
  );
}

/**
 * Numbered instructions, one short imperative each, read in a hurry. `lg` is the size for the
 * emergency screen; `start` continues the numbering of a list shown in two parts.
 */
export function Steps({
  items,
  size = 'md',
  start = 1,
}: {
  items: readonly { id: string; text: ReactNode }[];
  size?: 'md' | 'lg';
  start?: number;
}) {
  return (
    <ol className="grid gap-4" start={start}>
      {items.map((s, i) => (
        <li
          key={s.id}
          className={cn(
            'flex gap-3',
            size === 'lg' ? 'text-lg leading-snug' : 'text-base leading-normal',
          )}
        >
          <span
            className={cn(
              'flex shrink-0 items-center justify-center rounded-full bg-muted font-medium tabular-nums',
              size === 'lg' ? 'size-7 text-sm' : 'size-6 text-xs',
            )}
          >
            {start + i}
          </span>
          <div className="min-w-0 flex-1 text-pretty [&_.f-inline-link]:text-start [&_.f-inline-link]:font-medium [&_.f-inline-link]:underline-offset-4 [&_.f-subhead]:mb-1 [&_.f-subhead]:text-base">
            {s.text}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * A row that opens in place to show more: the official text of a warning, a post, a summary.
 * The one disclosure pattern of the design system (shadcn Collapsible). Controlled, so other
 * parts of the screen can open a row and bring it into view.
 */
export function ExpandRow({
  id,
  open,
  onToggle,
  children,
  ...row
}: RowContent & { id: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <Collapsible id={id} role="listitem" open={open} onOpenChange={() => onToggle()}>
      <CollapsibleTrigger asChild aria-controls={`${id}-body`}>
        <Item asChild size="sm" className={cn(rowClass, pressable)}>
          <button type="button">
            <Inner
              {...row}
              trail={
                <ChevronDownIcon
                  aria-hidden="true"
                  className="size-4 transition-transform duration-200 group-aria-expanded/item:rotate-180 motion-reduce:transition-none"
                />
              }
            />
          </button>
        </Item>
      </CollapsibleTrigger>
      <CollapsibleContent
        id={`${id}-body`}
        className={cn(
          'f-prose px-4 pb-4 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:slide-in-from-top-1',
          row.lead && 'ps-15',
        )}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
