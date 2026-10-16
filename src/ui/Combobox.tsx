import type { InputHTMLAttributes, ReactNode, Ref } from 'react';
import { CheckIcon, MagnifyingGlassIcon, WarningCircleIcon } from '@phosphor-icons/react';

export type ComboOption = {
  key: string;
  label: ReactNode;
  /** Short text at the end of the row, e.g. a country code. */
  meta?: ReactNode;
  selected: boolean;
};

/**
 * A field that suggests options while you type (a country, a nationality): the look of Field,
 * with the options as rows in a panel under it. The caller owns the value, the matching and the
 * keyboard; this draws them with the combobox roles, so the active option is announced while
 * focus stays in the field. Options are not tab stops.
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
    <div className="f-field f-combo">
      <label className="f-field-label" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <span className="f-field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      <span className="f-combo-box">
        <MagnifyingGlassIcon className="f-combo-lead" size={18} aria-hidden="true" />
        <input
          ref={inputRef}
          className="f-input f-combo-input"
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
        {done && <CheckIcon className="f-combo-done" size={18} aria-hidden="true" />}
      </span>
      {open && (
        <div className="f-combo-menu">
          {/* Not a tab stop: Chrome would otherwise focus the scrolling list, which closes on blur
              and leaves focus on the page instead of the next control. */}
          <div
            id={`${id}-results`}
            className="f-combo-list"
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
                className="f-combo-option"
                data-active={i === active || undefined}
                tabIndex={-1}
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => onChoose(i)}
              >
                <span>{o.label}</span>
                {o.meta && <span className="f-combo-meta">{o.meta}</span>}
              </button>
            ))}
          </div>
          {status && (
            <p className="f-combo-status" role="status">
              {status}
            </p>
          )}
        </div>
      )}
      {error && (
        <p className="f-combo-error" id={`${id}-error`}>
          <WarningCircleIcon size={18} weight="fill" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
