import { magnitudeRanges } from '../lib/magnitude.ts';
export default function MagnitudeLegend({ lang }: { lang: 'es' | 'en' }) {
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  return (
    <section
      className="fw-magnitude-legend"
      aria-label={t('Colores por magnitud', 'Magnitude colors')}
    >
      <strong>{t('Magnitud', 'Magnitude')}</strong>
      <ul>
        {magnitudeRanges.map((range) => (
          <li key={range.id} className={`fw-mag-band-${range.id}`}>
            <i aria-hidden="true" />
            {range.label}
          </li>
        ))}
        <li className="fw-mag-band-unknown">
          <i aria-hidden="true" />
          {t('Sin dato', 'Not reported')}
        </li>
      </ul>
      <details>
        <summary>
          {t('El color no indica el riesgo local', 'Color does not indicate local risk')}
        </summary>
        <p>
          {t(
            'Estos rangos de color son de Faro. La magnitud expresa el tamaño del sismo; no cuánto se siente en tu ubicación. USGS usa ShakeMap para intensidad local y PAGER para estimaciones de impacto. Faro no convierte la magnitud en esos niveles.',
            'These color ranges are defined by Faro. Magnitude describes earthquake size, not shaking at your location. USGS uses ShakeMap for local intensity and PAGER for impact estimates. Faro does not convert magnitude into those levels.',
          )}
        </p>
        <a
          href="https://www.usgs.gov/programs/earthquake-hazards/earthquake-magnitude-energy-release-and-shaking-intensity"
          target="_blank"
          rel="noreferrer"
        >
          {t('Magnitud e intensidad · USGS', 'Magnitude and intensity · USGS')} ↗
        </a>
      </details>
    </section>
  );
}
