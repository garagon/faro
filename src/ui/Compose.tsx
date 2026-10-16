import { Fragment, type MouseEvent, type ReactNode } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

/**
 * Pieces for writing a message and sending it yourself: a large single choice, the main action
 * kept in view, the exact text to send, and the rows that hand it to another app.
 */

/**
 * A few mutually exclusive choices as large rows with a radio, e.g. how you are: a shadcn
 * RadioGroup in a card of Item rows. Arrow keys move between the rows and the whole row is the
 * target; the chosen row is tinted.
 */
export function RadioList<T extends string>({
  name,
  legend,
  value,
  onChange,
  options,
  required,
}: {
  name: string;
  /** Names the group for screen readers; the section title above is the visible label. */
  legend: string;
  value: T | '';
  onChange: (value: T) => void;
  options: readonly { value: T; title: ReactNode; meta?: ReactNode; icon?: ReactNode }[];
  required?: boolean;
}) {
  return (
    <FieldSet className="min-w-0 gap-0">
      <FieldLegend className="sr-only">{legend}</FieldLegend>
      <RadioGroup
        name={name}
        required={required}
        value={value}
        onValueChange={(next) => onChange(next as T)}
        className="f-list gap-0 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs"
      >
        {options.map((o, i) => (
          <Fragment key={o.value}>
            {i > 0 && <ItemSeparator />}
            <Item
              asChild
              size="sm"
              className="f-row cursor-pointer rounded-none hover:bg-accent/50 has-data-[state=checked]:bg-accent motion-reduce:transition-none"
            >
              <label>
                {o.icon && (
                  <ItemMedia variant="icon" aria-hidden="true">
                    {o.icon}
                  </ItemMedia>
                )}
                <ItemContent className="min-w-0">
                  <ItemTitle>{o.title}</ItemTitle>
                  {o.meta && (
                    <ItemDescription className="line-clamp-none">{o.meta}</ItemDescription>
                  )}
                </ItemContent>
                <ItemActions>
                  <RadioGroupItem value={o.value} className="size-5" />
                </ItemActions>
              </label>
            </Item>
          </Fragment>
        ))}
      </RadioGroup>
    </FieldSet>
  );
}

/**
 * A row inside a List that hands something to another app or does it in place (share, copy):
 * a shadcn Item. Unlike ListRow it can be unavailable, staying visible and readable (muted text
 * keeps 4.5:1, so no fading), and a link can check again on click.
 */
export function ActionRow({
  icon,
  title,
  meta,
  href,
  external,
  onClick,
  disabled,
}: {
  icon?: ReactNode;
  title: ReactNode;
  /** One caption line. */
  meta?: ReactNode;
  href?: string;
  /** Opens in a new tab. */
  external?: boolean;
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  /** Shown but inert; say why next to the list. */
  disabled?: boolean;
}) {
  const content = (
    <>
      {icon && (
        <ItemMedia variant="icon" aria-hidden="true">
          {icon}
        </ItemMedia>
      )}
      <ItemContent className="min-w-0">
        <ItemTitle>{title}</ItemTitle>
        {meta && <ItemDescription className="line-clamp-none">{meta}</ItemDescription>}
      </ItemContent>
      {!disabled && (
        <ItemActions>
          <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
        </ItemActions>
      )}
    </>
  );
  const row = cn(
    'f-row w-full text-left motion-reduce:transition-none',
    disabled
      ? 'cursor-not-allowed text-muted-foreground [&_[data-slot=item-media]]:text-muted-foreground'
      : 'cursor-pointer hover:bg-accent/50',
  );
  if (href && disabled)
    return (
      <li>
        <Item size="sm" className={row} aria-disabled="true">
          {content}
        </Item>
      </li>
    );
  if (href)
    return (
      <li>
        <Item asChild size="sm" className={cn('f-pressable', row)}>
          <a
            href={href}
            target={external ? '_blank' : undefined}
            rel="noreferrer"
            onClick={onClick}
          >
            {content}
          </a>
        </Item>
      </li>
    );
  return (
    <li>
      <Item asChild size="sm" className={cn('f-pressable', row, 'disabled:pointer-events-none')}>
        <button type="button" disabled={disabled} onClick={onClick}>
          {content}
        </button>
      </Item>
    </li>
  );
}

/**
 * The screen's one main action, kept in view at the bottom (above the tabs on a phone) on a
 * translucent bar while the form that holds it is on screen. On a wide screen a full-width
 * button there takes its label's width. The form keeps focused fields clear of the bar with a
 * bottom scroll margin (see the Avisar form).
 */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="grid gap-2 py-3 @min-[900px]/app:justify-items-start @min-[900px]/app:[&>[data-block]]:w-auto @min-[900px]/app:[&>[data-block]]:min-w-64 @min-[900px]/app:[&>[data-block]]:justify-self-start">
        {children}
      </div>
    </div>
  );
}

/**
 * The exact text a person is about to send, as one block to read and select, drawn like a
 * shadcn Textarea. Paragraphs are children; the first reads as a label, a final `<small>` (when
 * it was written) as a caption.
 */
export function MessageText({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      className="grid gap-3 rounded-md border border-input bg-transparent px-3 py-2.5 text-base whitespace-pre-wrap shadow-xs select-text wrap-anywhere md:text-sm [&>*]:m-0 [&>:first-child]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground"
      role="region"
      aria-label={label}
    >
      {children}
    </div>
  );
}
