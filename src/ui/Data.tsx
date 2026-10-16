import type { ReactNode } from 'react';
import { ArrowUpRightIcon } from '@phosphor-icons/react';
import { magnitudeBand } from '../lib/magnitude.ts';

/**
 * Who said it and when, in one grammar everywhere: "IMHPA · publicado 10:15 · hace 2 h".
 * A source's state uses the closed vocabulary of `sourceLine` (src/lib/sourceStatus.ts):
 * "consultado 07:30", "sin respuesta · intento 07:30", "sin conexión · último dato 07:27".
 * `state` stale or error colours it amber; the words must still say what happened. Checking is
 * never amber.
 */
export function SourceStamp({
  issuer,
  children,
  state,
}: {
  issuer?: ReactNode;
  children?: ReactNode;
  state?: 'ok' | 'stale' | 'error';
}) {
  return (
    <span className="f-stamp" data-state={state}>
      {issuer && <span>{issuer}</span>}
      {issuer && children && <span aria-hidden="true">·</span>}
      {/* Wrapped, so the stamp's spacing reaches text as well as elements. */}
      {children && <span>{children}</span>}
    </span>
  );
}

const bands: Record<string, string> = { under4: '1', '4': '2', '5': '3', '6': '4', '7plus': '5' };

/** A magnitude as published: the figure carries the meaning; colour only darkens with size. */
export function Magnitude({
  value,
  size,
  label,
}: {
  value: number | null;
  size?: 'lg';
  /** Small word under a large figure, e.g. "magnitud". */
  label?: ReactNode;
}) {
  return (
    <span className="f-mag" data-band={bands[magnitudeBand(value)]} data-size={size}>
      {value === null ? '—' : value.toFixed(1)}
      {label && <small>{label}</small>}
    </span>
  );
}

/** Placeholder while the first answer arrives, instead of any failure wording. */
export function Skeleton({ width }: { width?: string }) {
  return (
    <span
      className="f-skeleton"
      style={width ? ({ '--f-skeleton-width': width } as React.CSSProperties) : undefined}
      aria-hidden="true"
    />
  );
}

/** A link to another site: opens in a new tab and says so with the arrow. */
export function OutLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="f-out" href={href} target="_blank" rel="noreferrer">
      {children}
      <ArrowUpRightIcon size={14} aria-hidden="true" />
    </a>
  );
}

/** A row of small actions under a text: links and text buttons, wrapping as needed. */
export function Actions({ children }: { children: ReactNode }) {
  return <div className="f-actions">{children}</div>;
}
