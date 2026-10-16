import type { ReactNode } from 'react';

export type Fact = {
  id: string;
  /** What the value is, as a caption: "Hora UTC". */
  term: ReactNode;
  /** A second caption line under the term, e.g. who measures it ("ShakeMap"). */
  hint?: ReactNode;
  value: ReactNode;
};

/**
 * Facts about one record as term and value pairs, divided by hairlines: the term as a caption,
 * the value as a label. Side by side when there is room, stacked on narrow screens.
 */
export function Facts({ items, label }: { items: readonly Fact[]; label?: string }) {
  return (
    <dl className="f-facts" aria-label={label}>
      {items.map((f) => (
        <div key={f.id}>
          <dt>
            {f.term}
            {f.hint && <span>{f.hint}</span>}
          </dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
