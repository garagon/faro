import { destinationFor } from '../data/destinations/index.ts';
export default function EvacuationPlan({ country, lang }: { country: string; lang: 'es' | 'en' }) {
  const t = (es: string, en: string) => (lang === 'es' ? es : en),
    destination = destinationFor(country);
  return (
    <section className="fw-evacuation" aria-labelledby="evacuation-title">
      <header>
        <h3 id="evacuation-title">{t('Antes de seguir una ruta', 'Before following a route')}</h3>
        <p>
          {t(
            'Faro no verifica el estado de calles, salidas ni puntos de encuentro. Una ruta de Google Maps no es una ruta de evacuación.',
            'Faro does not verify roads, exits or meeting points. Google Maps directions are not an evacuation route.',
          )}
        </p>
      </header>
      <ol className="fw-evacuation-steps">
        <li>
          <h4>{t('Confirma la salida', 'Confirm the exit')}</h4>
          <p>
            {t(
              'Pide en recepción la ruta desde tu habitación, una alternativa y apoyo si tienes movilidad reducida. No uses ascensores durante el sismo.',
              'Ask reception for the route from your room, an alternative and support if you have limited mobility. Do not use elevators during shaking.',
            )}
          </p>
        </li>
        <li>
          <h4>{t('Ten en cuenta el tsunami', 'Consider tsunami risk')}</h4>
          <p>
            {t(
              'El punto del hotel puede estar en zona inundable. En la costa, confirma con la autoridad local la ruta a terreno alto o tierra adentro.',
              'The hotel meeting point may be in a flood zone. On the coast, confirm the route to higher ground or inland with local authorities.',
            )}
          </p>
        </li>
        <li>
          <h4>{t('Sigue las indicaciones actuales', 'Follow current instructions')}</h4>
          <p>
            {t(
              'Los daños pueden bloquear una ruta prevista. No regreses a una zona evacuada hasta que la autoridad lo permita.',
              'Damage can block a planned route. Do not return to an evacuated area until authorities allow it.',
            )}
          </p>
        </li>
      </ol>
      {destination?.evacuation ? (
        <a
          className="fw-secondary"
          href={destination.evacuation.url}
          target="_blank"
          rel="noreferrer"
        >
          {t('Consultar planos oficiales', 'View official evacuation maps')} ·{' '}
          {destination.evacuation.name} ↗
        </a>
      ) : (
        <p className="fw-preparation-note">
          {t(
            'Faro no tiene un plano oficial de evacuación integrado para este país. Confirma la ruta exacta con recepción y protección civil.',
            'Faro has no integrated official evacuation map for this country. Confirm the exact route with reception and civil protection.',
          )}
        </p>
      )}
      {destination?.civilProtection && (
        <a href={destination.civilProtection.url} target="_blank" rel="noreferrer">
          {destination.civilProtection.name} · {t('Indicaciones locales', 'Local guidance')} ↗
        </a>
      )}
      <small>
        {t(
          'Orientación general: SENAPRED y NOAA. Los planos de Chile solo corresponden a Chile.',
          'General guidance: SENAPRED and NOAA. Chilean maps apply only to Chile.',
        )}
      </small>
    </section>
  );
}
