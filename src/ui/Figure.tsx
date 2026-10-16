import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * An illustration that accompanies written steps, never replaces them: on the card surface with
 * a fine border, no wider than a phone so its labels keep caption size, and a caption line
 * (credit, how to read it) under it.
 */
export function Figure({
  children,
  caption,
  inset,
}: {
  children: ReactNode;
  caption?: ReactNode;
  /** Space around artwork that brings its own frame, so it does not touch the border. */
  inset?: boolean;
}) {
  return (
    <figure className="grid max-w-[26rem] gap-2">
      <div
        className={cn(
          'overflow-hidden rounded-xl border bg-card shadow-xs',
          '[&_:is(a,img,svg)]:block [&_:is(a,img,svg)]:h-auto [&_:is(a,img,svg)]:w-full',
          // An enlargeable image: the ring sits in the inset, clear of the artwork's own frame.
          '[&_a:focus-visible]:outline-3 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-ring',
          inset && 'p-3',
        )}
        data-inset={inset || undefined}
      >
        {children}
      </div>
      {caption && <figcaption className="text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}
