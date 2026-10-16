import type { MouseEvent, ReactNode } from 'react';
import { CaretRightIcon } from '@phosphor-icons/react';
import { RowIcon } from './List.tsx';

/**
 * Pieces for writing a message and sending it yourself: a large single choice, the main action
 * kept in view, the exact text to send, and the rows that hand it to another app.
 */

/**
 * A few mutually exclusive choices as large list rows with a radio, e.g. how you are. A real
 * radio group: arrow keys move between the rows and the whole row is the target.
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
    <fieldset className="f-fieldset">
      <legend className="f-visually-hidden">{legend}</legend>
      <ul className="f-list">
        {options.map((o) => (
          <li key={o.value}>
            <label className="f-row f-option">
              <span className="f-row-lead">{o.icon && <RowIcon icon={o.icon} />}</span>
              <span className="f-row-body">
                <span className="f-row-title">{o.title}</span>
                {o.meta && <span className="f-row-meta">{o.meta}</span>}
              </span>
              <span className="f-row-trail">
                <input
                  type="radio"
                  className="f-radio"
                  name={name}
                  value={o.value}
                  required={required}
                  checked={value === o.value}
                  onChange={() => onChange(o.value)}
                />
              </span>
            </label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

/**
 * A row inside a List that hands something to another app or does it in place (share, copy).
 * Unlike ListRow it can be unavailable, staying visible, and a link can check again on click.
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
      <span className="f-row-lead">{icon && <RowIcon icon={icon} />}</span>
      <span className="f-row-body">
        <span className="f-row-title">{title}</span>
        {meta && <span className="f-row-meta">{meta}</span>}
      </span>
      <span className="f-row-trail">
        {!disabled && <CaretRightIcon size={16} aria-hidden="true" />}
      </span>
    </>
  );
  if (href && disabled)
    return (
      <li>
        <div className="f-row f-action-row" aria-disabled="true">
          {content}
        </div>
      </li>
    );
  if (href)
    return (
      <li>
        <a
          className="f-row f-pressable f-action-row"
          href={href}
          target={external ? '_blank' : undefined}
          rel="noreferrer"
          onClick={onClick}
        >
          {content}
        </a>
      </li>
    );
  return (
    <li>
      <button
        type="button"
        className="f-row f-pressable f-action-row"
        disabled={disabled}
        onClick={onClick}
      >
        {content}
      </button>
    </li>
  );
}

/**
 * The screen's one main action, kept in view at the bottom (above the tabs on a phone) while
 * the form that holds it is on screen. Put `f-action-scope` on that form so a focused field
 * never hides behind the bar.
 */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="f-action-bar">
      <div className="f-action-bar-inner">{children}</div>
    </div>
  );
}

/**
 * The exact text a person is about to send, as one block to read and select. Paragraphs are
 * children; the first reads as a label, a final `<small>` (when it was written) as a caption.
 */
export function MessageText({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="f-message" role="region" aria-label={label}>
      {children}
    </div>
  );
}
