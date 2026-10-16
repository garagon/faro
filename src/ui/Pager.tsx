import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { Button } from './Button.tsx';

/**
 * Pages of a long list: previous and next, the page numbers when there is room and
 * "Página 2 de 4" when there is not. `items` are the pages to show, with gaps.
 */
export function Pager({
  label,
  current,
  pages,
  items,
  onPage,
  text,
}: {
  /** What the pages are of, for screen readers: "Páginas de sismos". */
  label: string;
  current: number;
  pages: number;
  items: readonly (number | 'gap')[];
  onPage: (page: number) => void;
  text: { previous: string; next: string; count: string; page: (n: number) => string };
}) {
  if (pages <= 1) return null;
  return (
    <nav className="f-pager" aria-label={label}>
      <Button
        variant="secondary"
        disabled={current === 1}
        onClick={() => onPage(current - 1)}
        icon={<CaretLeftIcon size={16} aria-hidden="true" />}
      >
        {text.previous}
      </Button>
      <ol className="f-pager-pages">
        {items.map((n, i) =>
          n === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                className="f-pager-page f-pressable"
                aria-current={n === current ? 'page' : undefined}
                aria-label={text.page(n)}
                onClick={() => onPage(n)}
              >
                {n}
              </button>
            </li>
          ),
        )}
      </ol>
      <span className="f-pager-count">{text.count}</span>
      <Button variant="secondary" disabled={current === pages} onClick={() => onPage(current + 1)}>
        {text.next}
        <CaretRightIcon size={16} aria-hidden="true" />
      </Button>
    </nav>
  );
}
