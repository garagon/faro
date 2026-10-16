import { isValidElement, type ReactNode } from 'react';
import { ArrowUpRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton as UiSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { magnitudeBand } from '../lib/magnitude.ts';
import { flatChildren } from './children.ts';

/**
 * Who said it and when, in one grammar everywhere: "IMHPA · publicado 10:15 · hace 2 h".
 * A source's state uses the closed vocabulary of `sourceLine` (src/lib/sourceStatus.ts):
 * "consultado 07:30", "sin respuesta · intento 07:30", "sin conexión · último dato 07:27".
 * `state` stale or error colours it amber, after a dot; the words must still say what happened.
 * Checking is never amber.
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
  const warn = state === 'stale' || state === 'error';
  return (
    <span
      className={cn('text-sm text-muted-foreground', warn && 'text-amber-800')}
      data-state={state}
    >
      {warn && (
        <span
          className="me-1.5 inline-block size-2 rounded-full bg-amber-500 align-[0.05em]"
          aria-hidden="true"
        />
      )}
      {issuer && <span>{issuer}</span>}
      {issuer && children && (
        <span className="mx-1" aria-hidden="true">
          ·
        </span>
      )}
      {/* Wrapped, so the stamp's spacing reaches text as well as elements. */}
      {children && <span>{children}</span>}
    </span>
  );
}

const bands: Record<string, string> = { under4: '1', '4': '2', '5': '3', '6': '4', '7plus': '5' };

/**
 * A magnitude as published: the figure carries the meaning; colour only darkens with size (the
 * ramp tokens, through the `f-mag` helper that the magnitude legend shares).
 */
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
    <span
      className={cn(
        'f-mag inline-grid min-w-9 justify-items-center text-base leading-tight',
        size === 'lg' && 'text-3xl',
      )}
      data-band={bands[magnitudeBand(value)]}
      data-size={size}
    >
      {value === null ? '—' : value.toFixed(1)}
      {label && <small className="text-sm font-normal text-muted-foreground">{label}</small>}
    </span>
  );
}

/** Placeholder while the first answer arrives, instead of any failure wording. */
export function Skeleton({ width }: { width?: string }) {
  return (
    <UiSkeleton
      className="inline-block h-[0.9em] w-32 align-middle motion-reduce:animate-none"
      style={width ? { width } : undefined}
      aria-hidden="true"
    />
  );
}

/** A link to another site: opens in a new tab and says so with the arrow. */
export function OutLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <ArrowUpRightIcon className="size-4 shrink-0" aria-hidden="true" />
    </a>
  );
}

/**
 * A row of small actions under a text: links and text buttons, wrapping as needed. Text buttons
 * become shadcn link buttons; every action keeps a 40 px target.
 */
export function Actions({ children }: { children: ReactNode }) {
  return (
    <div className="f-actions *:min-h-10">
      {flatChildren(children).map((child) =>
        isValidElement(child) && child.type === 'button' ? (
          <Button
            key={child.key}
            asChild
            variant="link"
            className="h-auto px-0 py-0 text-start whitespace-normal"
          >
            {child}
          </Button>
        ) : (
          child
        ),
      )}
    </div>
  );
}
