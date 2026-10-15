import type { ReactNode } from 'react';
import { CaretLeftIcon } from '@phosphor-icons/react';

/** A part of a screen: a title and space, not a box. */
export function Section({
  title,
  aside,
  id,
  children,
}: {
  title?: ReactNode;
  /** Short text at the end of the title line, e.g. "En vivo · hace 1 min". */
  aside?: ReactNode;
  id?: string;
  children: ReactNode;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section className="f-section" aria-labelledby={title ? headingId : undefined}>
      {title && (
        <div className="f-section-head">
          <h2 className="f-section-title" id={headingId}>
            {title}
          </h2>
          {aside && <span className="f-section-aside">{aside}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

/** The screen title: the same words as its menu entry, and a lead only when it helps. */
export function ScreenHead({
  title,
  lead,
  aside,
  titleId,
}: {
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
  titleId?: string;
}) {
  return (
    <header className="f-screen-head">
      <div className="f-section-head">
        <h1 className="f-screen-title" id={titleId} tabIndex={-1}>
          {title}
        </h1>
        {aside && <span className="f-section-aside">{aside}</span>}
      </div>
      {lead && <p className="f-screen-lead">{lead}</p>}
    </header>
  );
}

/** Back to the parent screen, named: "‹ Situación". */
export function BackLink({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="f-back" onClick={onClick}>
      <CaretLeftIcon size={18} aria-hidden="true" />
      {children}
    </button>
  );
}
