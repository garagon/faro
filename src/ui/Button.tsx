import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';

type Look = {
  /** primary: the one main action; secondary: outlined; ghost: text-like. */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** md is 44 px tall, lg 56 px. */
  size?: 'md' | 'lg';
  /** Full width. */
  block?: boolean;
  icon?: ReactNode;
};

const look = ({ variant = 'primary', size = 'md', block }: Look) => ({
  'data-variant': variant,
  'data-size': size,
  'data-block': block || undefined,
});

export function Button({
  variant,
  size,
  block,
  icon,
  className,
  children,
  type = 'button',
  ...rest
}: Look & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`f-button f-pressable ${className ?? ''}`}
      {...look({ variant, size, block })}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
}

/** A link that looks like a button; links to other sites open in a new tab. */
export function LinkButton({
  variant,
  size,
  block,
  icon,
  className,
  children,
  external,
  ...rest
}: Look & AnchorHTMLAttributes<HTMLAnchorElement> & { external?: boolean }) {
  return (
    <a
      className={`f-button f-pressable ${className ?? ''}`}
      {...look({ variant, size, block })}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      {...rest}
    >
      {icon}
      {children}
    </a>
  );
}

/** An icon-only button; `label` is its accessible name. */
export function IconButton({
  label,
  children,
  className,
  type = 'button',
  ...rest
}: { label: string } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={`f-icon-button f-pressable ${className ?? ''}`}
      aria-label={label}
      {...rest}
    >
      {children}
    </button>
  );
}
