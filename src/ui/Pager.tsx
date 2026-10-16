import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';
import { Button as UIButton } from '@/components/ui/button';
import { Button } from './Button.tsx';

/**
 * Pages of a long list, in shadcn's pagination look: previous and next as outline buttons, the
 * page numbers (the current one outlined) when there is room and "Página 2 de 4" when there is
 * not. `items` are the pages to show, with gaps. Below 36 rem the numbers give way to the count,
 * on its own line above the two buttons.
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
    <nav className="@container" aria-label={label}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <Button
          variant="secondary"
          disabled={current === 1}
          onClick={() => onPage(current - 1)}
          icon={<ChevronLeftIcon aria-hidden="true" />}
        >
          {text.previous}
        </Button>
        <ol className="m-0 hidden list-none items-center gap-1 p-0 @min-[36rem]:flex">
          {items.map((n, i) =>
            n === 'gap' ? (
              <li
                key={`gap-${i}`}
                className="flex size-10 items-center justify-center text-muted-foreground"
                aria-hidden="true"
              >
                <MoreHorizontalIcon className="size-4" />
              </li>
            ) : (
              <li key={n}>
                <UIButton
                  type="button"
                  variant={n === current ? 'outline' : 'ghost'}
                  size="icon-lg"
                  className="f-pressable tabular-nums motion-reduce:transition-none"
                  aria-current={n === current ? 'page' : undefined}
                  aria-label={text.page(n)}
                  onClick={() => onPage(n)}
                >
                  {n}
                </UIButton>
              </li>
            ),
          )}
        </ol>
        <span className="order-first basis-full text-center text-sm whitespace-nowrap text-muted-foreground tabular-nums @min-[36rem]:hidden">
          {text.count}
        </span>
        <Button
          variant="secondary"
          disabled={current === pages}
          onClick={() => onPage(current + 1)}
        >
          {text.next}
          <ChevronRightIcon aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
