import { ArrowUpRightIcon } from '@phosphor-icons/react';
import { destinationFor } from '../data/destinations/index.ts';
import { pick, type Lang } from '../lib/i18n.ts';
export default function EvacuationPlan({ country, lang }: { country: string; lang: Lang }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    destination = destinationFor(country);
  return (
    <section className="fw-evacuation" aria-labelledby="evacuation-title">
      <header>
        <h3 id="evacuation-title">
          {t('Antes de seguir una ruta', 'Before following a route', 'Antes de seguir uma rota')}
        </h3>
        <p>
          {t(
            'Faro no verifica el estado de calles, salidas ni puntos de encuentro. Una ruta de Google Maps no es una ruta de evacuación.',
            'Faro does not verify roads, exits or meeting points. Google Maps directions are not an evacuation route.',
            'O Faro não verifica ruas, saídas nem pontos de encontro. Uma rota do Google Maps não é uma rota de evacuação.',
          )}
        </p>
      </header>
      <ol className="fw-evacuation-steps">
        <li>
          <h4>{t('Confirma la salida', 'Confirm the exit', 'Confirme a saída')}</h4>
          <p>
            {t(
              'Pide en recepción la ruta desde tu habitación, una alternativa y apoyo si tienes movilidad reducida. No uses ascensores durante el sismo.',
              'Ask reception for the route from your room, an alternative and support if you have limited mobility. Do not use elevators during shaking.',
              'Peça à recepção a rota a partir do seu quarto, uma alternativa e apoio se você tiver mobilidade reduzida. Não use elevadores durante o tremor.',
            )}
          </p>
        </li>
        <li>
          <h4>
            {t('Ten en cuenta el tsunami', 'Consider tsunami risk', 'Considere o risco de tsunami')}
          </h4>
          <p>
            {t(
              'El punto del hotel puede estar en zona inundable. En la costa, confirma con la autoridad local la ruta a terreno alto o tierra adentro.',
              'The hotel meeting point may be in a flood zone. On the coast, confirm the route to higher ground or inland with local authorities.',
              'O ponto de encontro do hotel pode ficar em área inundável. No litoral, confirme com a autoridade local a rota para terreno alto ou para longe da costa.',
            )}
          </p>
        </li>
        <li>
          <h4>
            {t(
              'Sigue las indicaciones actuales',
              'Follow current instructions',
              'Siga as orientações atuais',
            )}
          </h4>
          <p>
            {t(
              'Los daños pueden bloquear una ruta prevista. No regreses a una zona evacuada hasta que la autoridad lo permita.',
              'Damage can block a planned route. Do not return to an evacuated area until authorities allow it.',
              'Danos podem bloquear uma rota prevista. Não volte a uma área evacuada até que a autoridade permita.',
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
          {t(
            'Consultar planos oficiales',
            'View official evacuation maps',
            'Ver mapas oficiais de evacuação',
          )}{' '}
          · {destination.evacuation.name}
          <ArrowUpRightIcon size={13} aria-hidden="true" />
        </a>
      ) : (
        <p className="fw-preparation-note">
          {t(
            'Faro no tiene un plano oficial de evacuación integrado para este país. Confirma la ruta exacta con recepción y protección civil.',
            'Faro has no integrated official evacuation map for this country. Confirm the exact route with reception and civil protection.',
            'O Faro não tem um mapa oficial de evacuação integrado para este país. Confirme a rota exata com a recepção e a defesa civil.',
          )}
        </p>
      )}
      {destination?.civilProtection && (
        <a href={destination.civilProtection.url} target="_blank" rel="noreferrer">
          {t('Indicaciones locales de', 'Local guidance from', 'Orientações locais:')}{' '}
          {destination.civilProtection.name}
          <ArrowUpRightIcon size={13} aria-hidden="true" />
        </a>
      )}
      <small>
        {t(
          'Orientación general: SENAPRED y NOAA. Los planos de Chile solo corresponden a Chile.',
          'General guidance: SENAPRED and NOAA. Chilean maps apply only to Chile.',
          'Orientação geral: SENAPRED e NOAA. Os mapas do Chile valem só para o Chile.',
        )}
      </small>
    </section>
  );
}
