import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { pageItems } from '../lib/paging.ts';
import { pick, type Lang } from '../lib/i18n.ts';

type Props = {
  lang: Lang;
  /** What the pages are of, for screen readers: "Páginas de sismos". */
  label: string;
  current: number;
  pages: number;
  onPage: (page: number) => void;
};

/** Previous, page numbers and next. On phones the numbers give way to "Page 2 of 4". */
export default function Pagination({ lang, label, current, pages, onPage }: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  if (pages <= 1) return null;
  return (
    <nav className="fw-pagination" aria-label={label}>
      <button
        className="fw-pagination-step"
        disabled={current === 1}
        onClick={() => onPage(current - 1)}
      >
        <CaretLeftIcon size={16} aria-hidden="true" />
        {t('Anterior', 'Previous', 'Anterior')}
      </button>
      <ol className="fw-pagination-pages">
        {pageItems(current, pages).map((n, i) =>
          n === 'gap' ? (
            <li key={`gap-${i}`} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={n}>
              <button
                aria-current={n === current ? 'page' : undefined}
                aria-label={t(`Página ${n}`, `Page ${n}`, `Página ${n}`)}
                onClick={() => onPage(n)}
              >
                {n}
              </button>
            </li>
          ),
        )}
      </ol>
      <span className="fw-pagination-count">
        {t(
          `Página ${current} de ${pages}`,
          `Page ${current} of ${pages}`,
          `Página ${current} de ${pages}`,
        )}
      </span>
      <button
        className="fw-pagination-step"
        disabled={current === pages}
        onClick={() => onPage(current + 1)}
      >
        {t('Siguiente', 'Next', 'Próxima')}
        <CaretRightIcon size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}
