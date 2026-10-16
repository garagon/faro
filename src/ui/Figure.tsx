import type { ReactNode } from 'react';

/**
 * An illustration that accompanies written steps, never replaces them: drawn on the surface
 * with a fine border, no wider than a phone so its labels keep caption size, and a caption
 * line (credit, how to read it) under it.
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
    <figure className="f-figure">
      <div className="f-figure-media" data-inset={inset || undefined}>
        {children}
      </div>
      {caption && <figcaption className="f-figure-caption">{caption}</figcaption>}
    </figure>
  );
}
