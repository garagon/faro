import { pageItems } from '../lib/paging.ts';
import { pick, type Lang } from '../lib/i18n.ts';
import { Pager } from '../ui/index.ts';

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
  return (
    <Pager
      label={label}
      current={current}
      pages={pages}
      items={pageItems(current, pages)}
      onPage={onPage}
      text={{
        previous: t('Anterior', 'Previous', 'Anterior'),
        next: t('Siguiente', 'Next', 'Próxima'),
        count: t(
          `Página ${current} de ${pages}`,
          `Page ${current} of ${pages}`,
          `Página ${current} de ${pages}`,
        ),
        page: (n) => t(`Página ${n}`, `Page ${n}`, `Página ${n}`),
      }}
    />
  );
}
