import type { InputHTMLAttributes, ReactNode } from 'react';

/** A pressed/unpressed choice, e.g. a hazard. */
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
    <button type="button" className="f-chip f-pressable" aria-pressed={pressed} onClick={onClick}>
      {icon}
      {children}
    </button>
  );
}

export function Chips({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div className="f-chips" role="group" aria-label={label}>
      {children}
    </div>
  );
}

/** Two to four mutually exclusive views, e.g. "Lista | Mapa". */
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
  /** Full width, equal segments. */
  block?: boolean;
}) {
  return (
    <div className="f-segmented" role="group" aria-label={label} data-block={block || undefined}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A labelled field; text is 16 px so phones do not zoom in. */
export function Field({
  label,
  hint,
  id,
  ...input
}: { label: ReactNode; hint?: ReactNode; id: string } & InputHTMLAttributes<HTMLInputElement>) {
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
      <input
        className="f-input"
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...input}
      />
    </div>
  );
}
