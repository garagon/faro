import type { HTMLAttributes, ReactNode } from 'react';

/**
 * A paragraph in one of the two reading roles: text (16/400, ink) or caption (14/400, muted).
 * It sets its own colour, size and margin, so nothing around it changes how it reads.
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
      className={`f-text ${className ?? ''}`}
      data-role={caption ? 'caption' : undefined}
      {...rest}
    >
      {children}
    </p>
  );
}
