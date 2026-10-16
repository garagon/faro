import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A paragraph in one of the two reading roles: text (UI body, text-sm) or caption (text-sm,
 * muted). It sets its own colour and size, so nothing around it changes how it reads.
 */
export function Text({
  caption,
  children,
  className,
  ...rest
}: {
  /** Caption role: a description, a source or a time under something else. */
  caption?: boolean;
  children: ReactNode;
} & HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-sm leading-relaxed text-pretty text-foreground',
        caption && 'leading-normal text-muted-foreground',
        className,
      )}
      data-role={caption ? 'caption' : undefined}
      {...rest}
    >
      {children}
    </p>
  );
}
