import { ArrowUpRightIcon } from '@phosphor-icons/react';
import { magnitudeRanges } from '../lib/magnitude.ts';
import { pick, type Lang } from '../lib/i18n.ts';
export default function MagnitudeLegend({ lang }: { lang: Lang }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  return (
    <section
      className="fw-magnitude-legend"
      aria-label={t('Colores por magnitud', 'Magnitude colors', 'Cores por magnitude')}
    >
      <strong>{t('Magnitud', 'Magnitude', 'Magnitude')}</strong>
      <ul>
        {magnitudeRanges.map((range) => (
          <li key={range.id} className={`fw-mag-band-${range.id}`}>
            <i aria-hidden="true" />
            {range.label}
          </li>
        ))}
        <li className="fw-mag-band-unknown">
          <i aria-hidden="true" />
          {t('Sin dato', 'Not reported', 'Sem dados')}
        </li>
      </ul>
      <details>
        <summary>
          {t(
            'El color no indica el riesgo local',
            'Color does not indicate local risk',
            'A cor não indica o risco local',
          )}
        </summary>
        <p>
          {t(
            'Estos rangos de color son de Faro. La magnitud expresa el tamaño del sismo; no cuánto se siente en tu ubicación. USGS usa ShakeMap para intensidad local y PAGER para estimaciones de impacto. Faro no convierte la magnitud en esos niveles.',
            'These color ranges are defined by Faro. Magnitude describes earthquake size, not shaking at your location. USGS uses ShakeMap for local intensity and PAGER for impact estimates. Faro does not convert magnitude into those levels.',
            'Estas faixas de cor são do Faro. A magnitude expressa o tamanho do terremoto, não quanto ele é sentido na sua localização. O USGS usa o ShakeMap para a intensidade local e o PAGER para estimativas de impacto. O Faro não converte a magnitude nesses níveis.',
          )}
        </p>
        <a
          href="https://www.usgs.gov/programs/earthquake-hazards/earthquake-magnitude-energy-release-and-shaking-intensity"
          target="_blank"
          rel="noreferrer"
        >
          {t(
            'Magnitud e intensidad (USGS)',
            'Magnitude and intensity (USGS)',
            'Magnitude e intensidade (USGS)',
          )}
          <ArrowUpRightIcon size={13} aria-hidden="true" />
        </a>
      </details>
    </section>
  );
}
