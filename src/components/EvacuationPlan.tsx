import { destinationFor } from '../data/destinations/index.ts';
import SafetyIllustration from './SafetyIllustration.tsx';
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
            'Faro does not verify roads, exits or assembly points. Google Maps directions are not an evacuation route.',
          )}
        </p>
      </header>
      <div className="fw-evacuation-steps">
        <article>
          <SafetyIllustration scene="stairs" />
          <h4>{t('1. Confirma la salida', '1. Confirm the exit')}</h4>
          <p>
            {t(
              'Pide a recepción el plano desde tu habitación, una alternativa y apoyo si tienes movilidad reducida. No uses ascensores durante el sismo.',
              'Ask reception for the route from your room, an alternative and assistance if you have limited mobility. Do not use elevators during shaking.',
            )}
          </p>
        </article>
        <article>
          <SafetyIllustration scene="coast" />
          <h4>{t('2. Distingue sismo de tsunami', '2. Distinguish earthquake from tsunami')}</h4>
          <p>
            {t(
              'El punto del hotel puede estar en zona inundable. En la costa, confirma la ruta a terreno alto o tierra adentro con la autoridad local.',
              'The hotel meeting point may be in an inundation zone. On the coast, confirm the route to higher ground or inland with local authorities.',
            )}
          </p>
        </article>
      </div>
      <p>
        {t(
          '3. Sigue las indicaciones actuales. Los daños pueden bloquear una ruta prevista. No regreses a una zona evacuada hasta que la autoridad lo permita.',
          '3. Follow current instructions. Damage can block a planned route. Do not return to an evacuated area until authorities allow it.',
        )}
      </p>
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
