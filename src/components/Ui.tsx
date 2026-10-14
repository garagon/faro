import type { ReactNode } from 'react';
import { ArrowUpRightIcon, PhoneIcon } from '@phosphor-icons/react';
import '../styles/ui.css';

/**
 * Shared building blocks so the same thing looks the same everywhere: every phone number is a
 * call button, every link to another site carries the same external-link mark.
 */
export function PhoneButton({
  href,
  number,
  label,
  tone = 'call',
  icon,
}: {
  href: string;
  number: string;
  label?: string;
  /** `call` for emergency lines, `neutral` for offices and other contacts. */
  tone?: 'call' | 'neutral';
  /** Replaces the phone icon, e.g. for a WhatsApp line; such links open in a new tab. */
  icon?: ReactNode;
}) {
  return (
    <a
      className="fw-phone"
      data-tone={tone}
      href={href}
      {...(icon ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {icon ?? <PhoneIcon size={18} weight="fill" aria-hidden="true" />}
      <span>
        {label && <small>{label} </small>}
        <strong>{number}</strong>
      </span>
    </a>
  );
}

export function PhoneRow({ children }: { children: ReactNode }) {
  return <div className="fw-phones">{children}</div>;
}

export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a className={`fw-ext ${className ?? ''}`} href={href} target="_blank" rel="noreferrer">
      <span>{children}</span>
      <ArrowUpRightIcon size={13} aria-hidden="true" />
    </a>
  );
}

export function LinkRow({ children }: { children: ReactNode }) {
  return <div className="fw-link-row">{children}</div>;
}
