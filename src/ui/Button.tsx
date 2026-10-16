import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Button as UIButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Look = {
  /** primary: the one main action; secondary: outlined; ghost: text-like. */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** md is 40 px tall, lg 48 px: both keep a touch target. */
  size?: 'md' | 'lg';
  /** Full width. */
  block?: boolean;
  icon?: ReactNode;
};

/** Faro's variants on shadcn/ui's. */
const variants = { primary: 'default', secondary: 'outline', ghost: 'ghost' } as const;

/**
 * Unavailable stays readable: shadcn fades a disabled button to half opacity, below 4.5:1, so a
 * disabled or aria-disabled button is drawn on the muted surface with dark grey text instead.
 * aria-disabled keeps the button focusable and clickable (the screen says why).
 */
const readable = cn(
  'disabled:border-transparent disabled:bg-muted disabled:text-neutral-600 disabled:opacity-100 disabled:shadow-none',
  'aria-disabled:cursor-not-allowed aria-disabled:border-transparent aria-disabled:bg-muted aria-disabled:text-neutral-600 aria-disabled:shadow-none',
  'aria-disabled:hover:bg-muted aria-disabled:hover:text-neutral-600',
);

/**
 * The shadcn props for a Faro look. Labels wrap rather than overflow a narrow phone, so the
 * height is a minimum. A ghost button that removes the person's data (`data-tone="error"`) takes
 * the caution colour, never the call red.
 */
const look = ({ variant = 'primary', size = 'md', block }: Look, className?: string) => ({
  variant: variants[variant],
  size: size === 'lg' ? ('lg' as const) : ('default' as const),
  'data-block': block || undefined,
  className: cn(
    'f-pressable h-auto whitespace-normal',
    size === 'lg' ? 'min-h-12 px-6 text-base' : 'min-h-10 py-2',
    block ? 'w-full justify-self-stretch' : 'justify-self-start',
    'data-[tone=error]:text-amber-800 data-[tone=error]:hover:text-amber-900',
    'motion-reduce:transition-none',
    readable,
    className,
  ),
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
    <UIButton type={type} {...look({ variant, size, block }, className)} {...rest}>
      {icon}
      {children}
    </UIButton>
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
    <UIButton asChild {...look({ variant, size, block }, className)}>
      <a {...(external ? { target: '_blank', rel: 'noreferrer' } : {})} {...rest}>
        {icon}
        {children}
      </a>
    </UIButton>
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
    <UIButton
      type={type}
      variant="ghost"
      size="icon-lg"
      className={cn(
        'f-pressable motion-reduce:transition-none',
        // Unavailable (e.g. while checking): grey, still readable, no fading.
        'disabled:text-muted-foreground disabled:opacity-100',
        className,
      )}
      aria-label={label}
      {...rest}
    >
      {children}
    </UIButton>
  );
}
