import { ArrowUpRightIcon } from '@phosphor-icons/react';
import { destinationFor } from '../data/destinations/index.ts';
import { missionsFor } from '../data/consularMissions.ts';
import { hostOf } from '../lib/links.ts';
import type { Lang } from '../lib/resources.ts';
import { pick } from '../lib/i18n.ts';

export default function DestinationInfo({ country, lang }: { country: string; lang: Lang }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const data = destinationFor(country);
  const name =
    country === 'WORLD' ? '' : new Intl.DisplayNames([lang], { type: 'region' }).of(country);
  const missions = missionsFor(country).filter((m) => !m.historical).length;
  if (!data)
    return (
      <section className="fw-destination-info fw-destination-missing">
        <h2>
          {country === 'WORLD'
            ? t(
                'Elige el país donde necesitas ayuda',
                'Choose the country where you need help',
                'Escolha o país onde você precisa de ajuda',
              )
            : t(
                `Faltan datos locales para ${name}`,
                `Local information for ${name} is not yet available`,
                `Ainda não há dados locais: ${name}`,
              )}
        </h2>
        <p>
          {t(
            'Puedes consultar sismos de USGS y guardar tu plan. Para teléfonos, evacuación y asistencia, consulta a la autoridad local o a recepción.',
            'You can view USGS earthquakes and save your plan. For phone numbers, evacuation and assistance, check with local authorities or reception.',
            'Você pode consultar os terremotos do USGS e salvar seu plano. Para telefones, evacuação e assistência, consulte a autoridade local ou a recepção.',
          )}
        </p>
      </section>
    );
  const links = [
    {
      source: data.civilProtection,
      label: t('Avisos y recomendaciones', 'Notices and guidance', 'Avisos e recomendações'),
    },
    {
      source: data.weatherAgency,
      label: t(
        'Avisos meteorológicos e hidrológicos',
        'Weather and flood warnings',
        'Avisos meteorológicos e hidrológicos',
      ),
    },
    {
      source: data.seismicAgency,
      label: t(
        'Reportes de la red sísmica nacional',
        'National earthquake reports',
        'Relatórios da rede sísmica nacional',
      ),
    },
    {
      source: data.evacuation,
      label: t('Planos de evacuación', 'Evacuation maps', 'Mapas de evacuação'),
    },
  ];
  return (
    <section className="fw-destination-info" aria-labelledby="fw-sources-title">
      <h2 id="fw-sources-title">
        {t(
          `Fuentes oficiales en ${name}`,
          `Official sources in ${name}`,
          `Fontes oficiais · ${name}`,
        )}
      </h2>
      <p>
        {t(
          'Cada enlace abre el sitio del organismo. Sus publicaciones más recientes están allí.',
          'Each link opens the agency’s website, where its latest publications are.',
          'Cada link abre o site do órgão. As publicações mais recentes estão lá.',
        )}
      </p>
      <ul className="fw-link-rows">
        {links.map(
          ({ source, label }) =>
            source && (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noreferrer">
                  <span>
                    <strong>{source.name}</strong>
                    <span>{label}</span>
                  </span>
                  <small>
                    {hostOf(source.url)}
                    <ArrowUpRightIcon size={14} aria-hidden="true" />
                  </small>
                </a>
              </li>
            ),
        )}
      </ul>
      <details>
        <summary>
          {t(
            'Qué información ofrece Faro aquí',
            'What Faro covers here',
            'O que o Faro oferece aqui',
          )}
        </summary>
        <dl>
          <div>
            <dt>{t('Sismos en el mapa', 'Earthquakes on the map', 'Terremotos no mapa')}</dt>
            <dd>
              {country === 'PA'
                ? t(
                    'EMSC mientras el IGC de la Universidad de Panamá no publique registros nuevos; IGC y USGS como alternativas. La red nacional puede publicar más eventos.',
                    'EMSC while the University of Panama IGC is not publishing new records; IGC and USGS as alternatives. The national network may report more events.',
                    'EMSC enquanto o IGC da Universidade do Panamá não publicar registros novos; IGC e USGS como alternativas. A rede nacional pode publicar mais eventos.',
                  )
                : country === 'US'
                  ? t(
                      'USGS, con EMSC como alternativa.',
                      'USGS, with EMSC as an alternative.',
                      'USGS, com EMSC como alternativa.',
                    )
                  : t(
                      'EMSC, con USGS como alternativa. La red nacional puede publicar más eventos.',
                      'EMSC, with USGS as an alternative. The national network may report more events.',
                      'EMSC, com USGS como alternativa. A rede nacional pode publicar mais eventos.',
                    )}
            </dd>
          </div>
          <div>
            <dt>{t('Asistencia consular', 'Consular assistance', 'Assistência consular')}</dt>
            <dd>
              {missions
                ? t(
                    `${missions} representaciones con ficha. Selecciona tu nacionalidad abajo.`,
                    `${missions} missions with contact details. Select your nationality below.`,
                    `${missions} representações com ficha. Selecione sua nacionalidade abaixo.`,
                  )
                : t(
                    'Sin direcciones locales verificadas en Faro. Usa el directorio oficial cuando esté disponible.',
                    'No local addresses verified in Faro. Use the official directory where available.',
                    'Sem endereços locais verificados no Faro. Use o diretório oficial quando estiver disponível.',
                  )}
            </dd>
          </div>
          <div>
            <dt>
              {t('Refugios y voluntariado', 'Shelters and volunteering', 'Abrigos e voluntariado')}
            </dt>
            <dd>
              {t(
                'Sin disponibilidad confirmada. Consulta a la autoridad antes de trasladarte.',
                'No confirmed availability. Check with the authority before traveling.',
                'Sem disponibilidade confirmada. Consulte a autoridade antes de se deslocar.',
              )}
            </dd>
          </div>
        </dl>
      </details>
    </section>
  );
}
