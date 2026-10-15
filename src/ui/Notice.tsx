import type { ReactNode } from 'react';
import { InfoIcon, WarningCircleIcon } from '@phosphor-icons/react';

/**
 * Three tiers for everything that is not data, so a caveat never outweighs an instruction:
 * - SafetyNotice changes what you do (bold, next to the action);
 * - Note says how to read a figure (one line, links to the full explanation);
 * - ScopeNote says what Faro does not do, once per screen, at the end.
 * Official warnings in force are list rows with a Badge naming the agency's level.
 */
export function SafetyNotice({ children }: { children: ReactNode }) {
  return (
    <p className="f-safety">
      <span className="f-safety-icon">
        <WarningCircleIcon size={24} weight="fill" aria-hidden="true" />
      </span>
      <span>{children}</span>
    </p>
  );
}

export function Note({ children, more }: { children: ReactNode; more?: ReactNode }) {
  return (
    <p className="f-note">
      <InfoIcon size={16} aria-hidden="true" />
      <span>
        {children} {more}
      </span>
    </p>
  );
}

export function ScopeNote({ children }: { children: ReactNode }) {
  return <p className="f-scope">{children}</p>;
}

/** Compact connection or freshness state, kept in the header while it applies. */
export function StatusChip({ children }: { children: ReactNode }) {
  return (
    <span className="f-chip-status" role="status">
      {children}
    </span>
  );
}
