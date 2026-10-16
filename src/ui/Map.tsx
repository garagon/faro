import type { ReactNode } from 'react';

/**
 * The frame for the map: a card, compact in the reading column, tall in the side column (from
 * 1200 px, beside the hazards) or when asked. The map inside keeps its own attribution; a link
 * under it can open the full view.
 */
export function MapFrame({
  size = 'compact',
  children,
  more,
}: {
  size?: 'compact' | 'tall';
  children: ReactNode;
  more?: ReactNode;
}) {
  return (
    <div className="f-map-block grid gap-2">
      <div
        className="f-map overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs data-[size=tall]:h-(--f-map-tall) @min-[1200px]/app:in-[[data-side]]:h-(--f-map-tall)"
        data-size={size}
      >
        {children}
      </div>
      {more}
    </div>
  );
}
