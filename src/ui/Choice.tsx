import { useLayoutEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Field as UIField, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

/**
 * A field the person marked invalid: the caution amber, never the call red (shadcn's
 * destructive is Faro's call colour). Shared by every field of the design system.
 */
export const invalidField =
  'aria-invalid:border-amber-700 aria-invalid:ring-amber-700/20 dark:aria-invalid:ring-amber-700/40';

/**
 * A field's hint: an icon in it stays on the text line. When the hint says what to fix (the field
 * is marked invalid), it takes the same caution amber.
 */
export const fieldHint =
  '[&>svg]:inline [&>svg]:size-4 [&>svg]:align-[-0.2em] group-has-[[aria-invalid=true]]/field:text-amber-800';

/** A pressed/unpressed choice, e.g. a hazard: a shadcn outline Toggle, filled when pressed. */
export function ChoiceChip({
  pressed,
  onClick,
  icon,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Toggle
      variant="outline"
      size="lg"
      pressed={pressed}
      onClick={onClick}
      className={cn(
        'f-pressable px-4 motion-reduce:transition-none',
        'data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
        'data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground',
      )}
    >
      {icon}
      {children}
    </Toggle>
  );
}

export function Chips({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {children}
    </div>
  );
}

/** How a full-width row of segments fits its labels: see `fitOf`. */
type Fit = 'equal' | 'content' | 'stack';

/**
 * Equal segments when the longest label, with its minimum padding, fits an equal share of the
 * row; segments as wide as their labels when only the labels together fit; stacked otherwise.
 * Measured on the labels at their natural width, so it holds for any language and text size.
 */
function fitOf(group: HTMLElement): Fit {
  const buttons = [...group.querySelectorAll<HTMLElement>(':scope > button')];
  if (!buttons.length) return 'equal';
  const track = getComputedStyle(group);
  const row = group.clientWidth - parseFloat(track.paddingLeft) - parseFloat(track.paddingRight);
  const needs = buttons.map((button) => {
    const label = button.querySelector<HTMLElement>('.f-segmented-label');
    const pad = getComputedStyle(button);
    return (
      (label?.getBoundingClientRect().width ?? 0) +
      parseFloat(pad.paddingLeft) +
      parseFloat(pad.paddingRight)
    );
  });
  // Half a pixel of tolerance for sub-pixel text widths.
  if (Math.max(...needs) <= row / buttons.length + 0.5) return 'equal';
  if (needs.reduce((sum, need) => sum + need, 0) <= row + 0.5) return 'content';
  return 'stack';
}

/**
 * Two to four mutually exclusive views, e.g. "Lista | Mapa": a shadcn ToggleGroup (single), drawn
 * as shadcn's segmented track (the TabsList look). Every segment is a pressed/unpressed button
 * and its own tab stop, as before.
 * Use one variant per screen: `block` (full width) when a screen has more than one.
 * A block keeps its segments on one row while the labels fit (equal widths first, then as wide
 * as each label) and stacks them only when they do not.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  block,
}: {
  options: readonly { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  /** Full width: equal segments while the labels fit. */
  block?: boolean;
}) {
  const group = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit>('equal');
  const values = options.map((o) => o.value).join('\n');
  // Measured before paint, then again whenever the row or a label changes size (a narrower
  // window, larger text, another language, the font arriving).
  useLayoutEffect(() => {
    const node = group.current;
    if (!block || !node) return;
    const measure = () => setFit(fitOf(node));
    measure();
    if (typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    node.querySelectorAll('.f-segmented-label').forEach((l) => observer.observe(l));
    return () => observer.disconnect();
  }, [block, values]);
  const stack = block && fit === 'stack';
  return (
    <ToggleGroup
      ref={group}
      type="single"
      rovingFocus={false}
      value={value}
      // A pressed segment stays pressed: one view is always chosen.
      onValueChange={(next) => next && onChange(next as T)}
      // Faro's semantics, unchanged: a named group of pressed/unpressed buttons, each a tab stop
      // (Radix would make it a radio group without arrow keys here).
      role="group"
      aria-label={label}
      data-block={block || undefined}
      data-fit={block && fit !== 'equal' ? fit : undefined}
      className={cn(
        'max-w-full justify-self-start rounded-lg bg-muted p-[3px]',
        block && 'flex w-full justify-self-stretch',
        stack && 'flex-col items-stretch',
      )}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          role={undefined}
          aria-checked={undefined}
          aria-pressed={o.value === value}
          className={cn(
            'h-9 px-4 text-foreground/60 data-[spacing=0]:rounded-md motion-reduce:transition-none',
            'hover:bg-transparent hover:text-foreground',
            'data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm',
            block && 'min-w-0 flex-1 basis-0 px-1',
            block && fit === 'content' && 'basis-auto',
            stack && 'w-full basis-auto',
          )}
        >
          <span className="f-segmented-label inline-block whitespace-nowrap">{o.label}</span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** A labelled field (shadcn Field, Label and Input); text is 16 px on phones so they do not zoom. */
export function Field({
  label,
  hint,
  id,
  className,
  ...input
}: { label: ReactNode; hint?: ReactNode; id: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <UIField>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {hint && (
        <FieldDescription id={`${id}-hint`} className={fieldHint}>
          {hint}
        </FieldDescription>
      )}
      <Input
        className={cn(invalidField, className)}
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...input}
      />
    </UIField>
  );
}
