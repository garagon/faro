import { magnitudeRanges } from '../lib/magnitude.ts';
import { pick, type Lang } from '../lib/i18n.ts';
import { Note, OutLink } from '../ui/index.ts';

// Faro's ranges on the design system's one-hue scale (src/ui/Data.tsx): darker is larger.
const bands: Record<(typeof magnitudeRanges)[number]['id'], string> = {
  under4: '1',
  '4': '2',
  '5': '3',
  '6': '4',
  '7plus': '5',
};

/**
 * How to read the magnitude figures, under the earthquake list: one reading note with a link to
 * the explanation on the Sources screen.
 */
export default function MagnitudeLegend({
  lang,
  onExplain,
}: {
  lang: Lang;
  /** Opens the explanation (the Sources screen, "Reading dates and coverage"). */
  onExplain: () => void;
}) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  return (
    <Note
      more={
        <button
          type="button"
          className="f-inline-link inline cursor-pointer rounded-sm border-0 bg-transparent p-0 font-medium text-foreground underline underline-offset-4 outline-none hover:decoration-2 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          onClick={onExplain}
        >
          {t('Cómo leer esto', 'How to read this', 'Como ler isto')}
        </button>
      }
    >
      {t(
        'El color no indica el riesgo local',
        'Color does not indicate local risk',
        'A cor não indica o risco local',
      )}
      .
    </Note>
  );
}

/**
 * The magnitude scale Faro draws, one hue from light to dark, and what magnitude does not say.
 * Shown on the Sources screen.
 */
export function MagnitudeScale({ lang }: { lang: Lang }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  return (
    <div
      className="f-stack grid gap-2"
      data-gap="sm"
      role="group"
      aria-label={t('Colores por magnitud', 'Magnitude colors', 'Cores por magnitude')}
    >
      <h3 className="f-subhead m-0 text-sm leading-snug font-medium">
        {t('Magnitud', 'Magnitude', 'Magnitude')}
      </h3>
      <div className="f-actions" role="list">
        {magnitudeRanges.map((range) => (
          <span key={range.id} role="listitem" className="f-mag" data-band={bands[range.id]}>
            {range.label}
          </span>
        ))}
        <span role="listitem">
          <span className="f-mag">—</span> {t('Sin dato', 'Not reported', 'Sem dados')}
        </span>
      </div>
      <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
        <p>
          {t(
            'El color no indica el riesgo local',
            'Color does not indicate local risk',
            'A cor não indica o risco local',
          )}
          .{' '}
          {t(
            'Estos rangos de color son de Faro. La magnitud expresa el tamaño del sismo; no cuánto se siente en tu ubicación. USGS usa ShakeMap para intensidad local y PAGER para estimaciones de impacto. Faro no convierte la magnitud en esos niveles.',
            'These color ranges are defined by Faro. Magnitude describes earthquake size, not shaking at your location. USGS uses ShakeMap for local intensity and PAGER for impact estimates. Faro does not convert magnitude into those levels.',
            'Estas faixas de cor são do Faro. A magnitude expressa o tamanho do terremoto, não quanto ele é sentido na sua localização. O USGS usa o ShakeMap para a intensidade local e o PAGER para estimativas de impacto. O Faro não converte a magnitude nesses níveis.',
          )}
        </p>
        <OutLink href="https://www.usgs.gov/programs/earthquake-hazards/earthquake-magnitude-energy-release-and-shaking-intensity">
          {t(
            'Magnitud e intensidad (USGS)',
            'Magnitude and intensity (USGS)',
            'Magnitude e intensidade (USGS)',
          )}
        </OutLink>
      </div>
    </div>
  );
}
