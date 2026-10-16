import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { CheckIcon, CircleAlertIcon, SearchIcon } from 'lucide-react';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { invalidField } from './Choice.tsx';

export type ComboOption = {
  key: string;
  label: ReactNode;
  /** Short text at the end of the row, e.g. a country code. */
  meta?: ReactNode;
  selected: boolean;
};

/**
 * A field that suggests options while you type (a country, a nationality): a shadcn Field and
 * Input with a search icon, the options in a popover panel under it, drawn as shadcn's Command
 * list. The caller owns the value, the matching and the keyboard; this draws them with the
 * combobox roles, so the active option is announced while focus stays in the field. Options are
 * not tab stops.
 */
export function Combobox({
  id,
  label,
  hint,
  error,
  open,
  options,
  active,
  onChoose,
  status,
  done,
  inputRef,
  className,
  ...input
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  /** Shown under the field, and marks it invalid, while the typed text is not an option. */
  error?: ReactNode;
  open: boolean;
  options: readonly ComboOption[];
  /** Index of the option the arrow keys are on. */
  active: number;
  onChoose: (index: number) => void;
  /** One caption under the options: how many there are or what to type. */
  status?: ReactNode;
  /** A choice is made: a check at the end of the field. */
  done?: boolean;
  inputRef?: Ref<HTMLInputElement>;
} & InputHTMLAttributes<HTMLInputElement>) {
  const describedBy =
    [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined;
  return (
    <Field className="relative min-w-0">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {hint && (
        <FieldDescription
          id={`${id}-hint`}
          className="[&>svg]:inline [&>svg]:size-4 [&>svg]:align-[-0.2em]"
        >
          {hint}
        </FieldDescription>
      )}
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          ref={inputRef}
          className={cn('pr-9 pl-9', invalidField, className)}
          id={id}
          role="combobox"
          aria-label={label}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-results`}
          aria-activedescendant={open && options[active] ? `${id}-option-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          {...input}
        />
        {done && (
          <CheckIcon
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-foreground"
            aria-hidden="true"
          />
        )}
        {open && (
          <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95">
            {/* Not a tab stop: Chrome would otherwise focus the scrolling list, which closes on blur
                and leaves focus on the page instead of the next control. */}
            <div
              id={`${id}-results`}
              className="max-h-64 overflow-x-hidden overflow-y-auto overscroll-contain p-1 empty:hidden"
              role="listbox"
              aria-label={label}
              tabIndex={-1}
            >
              {options.map((o, i) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={o.selected}
                  id={`${id}-option-${i}`}
                  key={o.key}
                  className="relative flex min-h-10 w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground data-[active]:bg-accent data-[active]:text-accent-foreground aria-selected:font-medium"
                  data-active={i === active || undefined}
                  tabIndex={-1}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => onChoose(i)}
                >
                  <CheckIcon
                    className={cn('size-4 shrink-0', !o.selected && 'opacity-0')}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">{o.label}</span>
                  {o.meta && (
                    <span className="ml-auto text-xs tracking-widest text-muted-foreground">
                      {o.meta}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {status && (
              <p className="m-0 border-t px-3 py-2 text-sm text-muted-foreground" role="status">
                {status}
              </p>
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="m-0 flex items-center gap-2 text-sm font-medium" id={`${id}-error`}>
          <CircleAlertIcon className="size-4 shrink-0 text-amber-800" aria-hidden="true" />
          {error}
        </p>
      )}
    </Field>
  );
}
