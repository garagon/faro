import { useLayoutEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';

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
 * Two to four mutually exclusive views, e.g. "Lista | Mapa". Both variants have 44 px segments.
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
  return (
    <div
      ref={group}
      className="f-segmented"
      role="group"
      aria-label={label}
      data-block={block || undefined}
      data-fit={block && fit !== 'equal' ? fit : undefined}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
        >
          <span className="f-segmented-label">{o.label}</span>
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
