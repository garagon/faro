import type { ReactNode } from 'react';
import { CaretDownIcon, CaretRightIcon } from '@phosphor-icons/react';

/** Rows in one container with fine dividers (an inset grouped list). */
export function List({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <ul className="f-list" aria-label={label}>
      {children}
    </ul>
  );
}

export type Signal = 'listed' | 'none' | 'pending' | 'unknown';

/**
 * A hazard's icon in a circle, tinted by the official level when the source lists something.
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
    <span className="f-status-icon" data-state={state} data-level={level} aria-hidden="true">
      {icon}
    </span>
  );
}

/** A neutral icon circle at the start of an action row, so every row shares one text edge. */
export function RowIcon({ icon }: { icon: ReactNode }) {
  return (
    <span className="f-status-icon" aria-hidden="true">
      {icon}
    </span>
  );
}

/** The agency's level in its own words ("Aviso", "Alerta naranja"), coloured by the scale. */
export function Badge({ level, children }: { level?: 1 | 2 | 3; children: ReactNode }) {
  return (
    <span className="f-badge" data-level={level}>
      {children}
    </span>
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

function Inner({ lead, title, badge, meta, trail, figure }: RowContent) {
  return (
    <>
      <span className="f-row-lead">{lead}</span>
      <span className="f-row-body">
        <span className="f-row-title" data-figure={figure || undefined}>
          {title}
          {badge}
        </span>
        {meta && <span className="f-row-meta">{meta}</span>}
      </span>
      <span className="f-row-trail">{trail}</span>
    </>
  );
}

/**
 * A list row: a button when it opens something, a link when it leaves or calls, plain otherwise.
 * Every row is a title and one caption line; nothing else changes size or weight.
 */
export function ListRow(
  p: RowContent & ({ onClick: () => void } | { href: string; external?: boolean } | object),
) {
  const chevron = 'onClick' in p || ('href' in p && !p.href.startsWith('tel:'));
  const trail = p.trail ?? (chevron ? <CaretRightIcon size={16} aria-hidden="true" /> : null);
  const content = <Inner {...p} trail={trail} />;
  if ('onClick' in p)
    return (
      <li>
        <button type="button" className="f-row f-pressable" data-tone={p.tone} onClick={p.onClick}>
          {content}
        </button>
      </li>
    );
  if ('href' in p)
    return (
      <li>
        <a
          className="f-row f-pressable"
          data-tone={p.tone}
          href={p.href}
          {...(p.external ? { target: '_blank', rel: 'noreferrer' } : {})}
        >
          {content}
        </a>
      </li>
    );
  return (
    <li>
      <div className="f-row" data-tone={p.tone}>
        {content}
      </div>
    </li>
  );
}

/** Numbered instructions, one short imperative each. */
export function Steps({ items }: { items: readonly { id: string; text: ReactNode }[] }) {
  return (
    <ol className="f-steps">
      {items.map((s) => (
        <li key={s.id}>
          <span>{s.text}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * A row that opens in place to show more: the official text of a warning, a post, a summary.
 * The one disclosure pattern of the design system. Controlled, so other parts of the screen can
 * open a row and bring it into view.
 */
export function ExpandRow({
  id,
  open,
  onToggle,
  children,
  ...row
}: RowContent & { id: string; open: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <li id={id}>
      <button
        type="button"
        className="f-row f-pressable"
        aria-expanded={open}
        aria-controls={`${id}-body`}
        onClick={onToggle}
      >
        <Inner
          {...row}
          trail={<CaretDownIcon className="f-expand-caret" size={16} aria-hidden="true" />}
        />
      </button>
      <div id={`${id}-body`} className="f-expand-body f-prose" hidden={!open}>
        {children}
      </div>
    </li>
  );
}
