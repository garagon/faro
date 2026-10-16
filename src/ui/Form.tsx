import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react';

/** A labelled choice from a list, on the device's own picker. */
export function SelectField({
  label,
  hint,
  id,
  children,
  ...select
}: {
  label: ReactNode;
  hint?: ReactNode;
  id: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="f-field">
      <label className="f-field-label" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <span className="f-field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      <span className="f-select">
        <select
          className="f-input"
          id={id}
          aria-describedby={hint ? `${id}-hint` : undefined}
          {...select}
        >
          {children}
        </select>
        <CaretDownIcon size={16} aria-hidden="true" />
      </span>
    </div>
  );
}

/** A labelled multi-line text. */
export function TextArea({
  label,
  hint,
  id,
  ...area
}: {
  label: ReactNode;
  hint?: ReactNode;
  id: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="f-field">
      <label className="f-field-label" htmlFor={id}>
        {label}
      </label>
      {hint && (
        <span className="f-field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      <textarea
        className="f-input f-textarea"
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...area}
      />
    </div>
  );
}

/** A checklist row inside a List: the box first, then a label and one caption line. */
export function CheckRow({
  id,
  checked,
  onChange,
  title,
  meta,
  trail,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: ReactNode;
  meta?: ReactNode;
  trail?: ReactNode;
}) {
  return (
    <li>
      <label className="f-row f-check" htmlFor={id}>
        <span className="f-row-lead">
          <input
            id={id}
            type="checkbox"
            className="f-checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
          />
        </span>
        <span className="f-row-body">
          <span className="f-row-title">{title}</span>
          {meta && <span className="f-row-meta">{meta}</span>}
        </span>
        <span className="f-row-trail">{trail}</span>
      </label>
    </li>
  );
}

/**
 * Tabs that switch the panel below in place (the detail pages of one hazard family). Each tab
 * is a button with aria-selected; arrow keys move between them.
 */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: readonly { id: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div className="f-tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          id={`f-tab-${tab.id}`}
          aria-selected={tab.id === value}
          tabIndex={tab.id === value ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(e) => {
            const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
            if (!step) return;
            e.preventDefault();
            const next = tabs[(i + step + tabs.length) % tabs.length];
            onChange(next.id);
            e.currentTarget.parentElement?.querySelector<HTMLElement>(`#f-tab-${next.id}`)?.focus();
          }}
        >
          {tab.label}
          {tab.count !== undefined && <span className="f-tabs-count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

/**
 * A part of a long form or page that opens in place: a title, one caption line, and the content.
 * For whole sections; rows inside a list use ExpandRow.
 */
export function Disclosure({
  title,
  meta,
  lead,
  open,
  onToggle,
  children,
}: {
  title: ReactNode;
  meta?: ReactNode;
  lead?: ReactNode;
  open?: boolean;
  onToggle?: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <details
      className="f-disclosure"
      open={open}
      onToggle={(e) => onToggle?.((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="f-row">
        <span className="f-row-lead">{lead}</span>
        <span className="f-row-body">
          <span className="f-row-title">{title}</span>
          {meta && <span className="f-row-meta">{meta}</span>}
        </span>
        <span className="f-row-trail">
          <CaretDownIcon className="f-expand-caret" size={16} aria-hidden="true" />
        </span>
      </summary>
      <div className="f-disclosure-body">{children}</div>
    </details>
  );
}
