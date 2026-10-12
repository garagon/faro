import { ArrowUpRightIcon } from '@phosphor-icons/react';
import { destinationFor } from '../data/destinations/index.ts';
import { embassies } from '../lib/embassies.ts';
import type { Lang } from '../lib/resources.ts';

export default function DestinationInfo({ country, lang }: { country: string; lang: Lang }) {
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const data = destinationFor(country);
  const name =
    country === 'WORLD' ? '' : new Intl.DisplayNames([lang], { type: 'region' }).of(country);
  const missions = embassies.filter((e) => e.country === country).length;
  if (!data)
    return (
      <section className="fw-destination-info fw-destination-missing">
        <h2>
          {country === 'WORLD'
            ? t('Elige el país donde necesitas ayuda', 'Choose the country where you need help')
            : t(
                `Faltan datos locales para ${name}`,
                `Local information for ${name} is not yet available`,
              )}
        </h2>
        <p>
          {t(
            'Puedes consultar sismos de USGS y guardar tu plan. Para teléfonos, evacuación y asistencia, consulta a la autoridad local o a recepción.',
            'You can view USGS earthquakes and save your plan. For phone numbers, evacuation and assistance, check with local authorities or reception.',
          )}
        </p>
      </section>
    );
  const links = [
    { source: data.civilProtection, label: t('Avisos y recomendaciones', 'Notices and guidance') },
    {
      source: data.seismicAgency,
      label: t('Reportes de la red nacional', 'National earthquake reports'),
    },
    { source: data.evacuation, label: t('Planos de evacuación', 'Evacuation maps') },
  ];
  return (
    <section className="fw-destination-info" aria-label={t('Fuentes del país', 'Country sources')}>
      <h2>{t(`Información oficial · ${name}`, `Official information · ${name}`)}</h2>
      <div className="fw-destination-links">
        {links.map(
          ({ source, label }) =>
            source && (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                <span>
                  {label}
                  <strong>{source.name}</strong>
                </span>
                <ArrowUpRightIcon size={19} aria-hidden="true" />
              </a>
            ),
        )}
      </div>
      <p>
        {t(
          'Los enlaces abren el sitio de cada organismo. Consulta allí sus últimas publicaciones.',
          'Links open each agency’s website. Check its latest publications there.',
        )}
      </p>
      <details>
        <summary>{t('Qué información ofrece Faro aquí', 'What Faro covers here')}</summary>
        <dl>
          <div>
            <dt>{t('Sismos en el mapa', 'Earthquakes on the map')}</dt>
            <dd>
              {country === 'PA' ? 'IGC / USGS' : 'USGS'} ·{' '}
              {t(
                'La red nacional puede publicar más eventos.',
                'The national network may report more events.',
              )}
            </dd>
          </div>
          <div>
            <dt>{t('Asistencia consular', 'Consular assistance')}</dt>
            <dd>
              {missions
                ? t(
                    `${missions} representaciones con ficha. Selecciona tu nacionalidad abajo.`,
                    `${missions} missions with contact details. Select your nationality below.`,
                  )
                : t(
                    'Sin direcciones locales verificadas en Faro. Usa el directorio oficial cuando esté disponible.',
                    'No local addresses verified in Faro. Use the official directory where available.',
                  )}
            </dd>
          </div>
          <div>
            <dt>{t('Refugios y voluntariado', 'Shelters and volunteering')}</dt>
            <dd>
              {t(
                'Sin disponibilidad confirmada. Consulta a la autoridad antes de trasladarte.',
                'No confirmed availability. Check with the authority before travelling.',
              )}
            </dd>
          </div>
        </dl>
      </details>
    </section>
  );
}
