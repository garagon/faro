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
 * Facts about one record as a description list: muted terms beside their values, in two columns
 * that every pair shares, divided by fine lines.
 */
export function Facts({ items, label }: { items: readonly Fact[]; label?: string }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] text-sm" aria-label={label}>
      {items.map((f) => (
        <div
          key={f.id}
          className="col-span-2 grid grid-cols-subgrid items-baseline gap-x-4 border-b py-2.5 first:pt-0 last:border-b-0 last:pb-0"
        >
          <dt className="grid text-muted-foreground">
            {f.term}
            {f.hint && <span className="text-xs">{f.hint}</span>}
          </dt>
          <dd className="font-medium tabular-nums [overflow-wrap:anywhere]">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}
