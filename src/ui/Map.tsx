import type { ReactNode } from 'react';

/**
 * The frame for the map: compact in the reading column, tall in the side column. The map inside
 * keeps its own attribution; a link under it can open the full view.
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
    <div className="f-map-block">
      <div className="f-map" data-size={size}>
        {children}
      </div>
      {more}
    </div>
  );
}
