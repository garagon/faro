import { ArrowUpRightIcon } from '@phosphor-icons/react';
import { nwsEventLabels, type NwsAlert } from '../lib/nws.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';

type Props = {
  lang: Lang;
  country: string;
  data: NwsAlert[] | null;
  failed: boolean;
};

/** NWS hurricane, tropical storm and flood products for U.S. areas, listed as published. */
export default function NwsPanel({ lang, country, data, failed }: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    idx = langIndex(lang);
  const rows = data?.filter((a) => a.kind !== 'tsunami') ?? null;
  const date = (n: number) =>
    new Intl.DateTimeFormat(lang, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(n);
  const mainland = country === 'US';
  return (
    <section className="fw-feed fw-nws-weather" aria-labelledby="fw-nws-weather-title">
      <div className="fw-feed-head">
        <h2 id="fw-nws-weather-title">
          {t(
            'Avisos de huracán e inundación',
            'Hurricane and flood alerts',
            'Avisos de furacão e inundação',
          )}
        </h2>
        <p>
          {t(
            'Servicio Meteorológico Nacional de EE. UU. (NWS), para estados y territorios de EE. UU.',
            'U.S. National Weather Service (NWS), for U.S. states and territories.',
            'Serviço Meteorológico Nacional dos EUA (NWS), para estados e territórios dos EUA.',
          )}
        </p>
      </div>
      {failed && (
        <p className="fw-feed-problem" role="status">
          {t(
            'No se pudo consultar el NWS. No podemos confirmar si hay avisos.',
            'The NWS could not be reached. We cannot confirm whether alerts exist.',
            'Não foi possível consultar o NWS. Não podemos confirmar se há avisos.',
          )}
        </p>
      )}
      {!rows && !failed && (
        <p className="fw-feed-empty">
          {t('Consultando el NWS…', 'Checking NWS…', 'Consultando o NWS…')}
        </p>
      )}
      {rows && rows.length === 0 && !failed && (
        <p className="fw-feed-empty">
          {t(
            'El NWS no lista avisos de este tipo activos.',
            'The NWS lists no active alerts of this kind.',
            'O NWS não lista avisos ativos deste tipo.',
          )}
        </p>
      )}
      {rows && rows.length > 0 && (
        <ul className="fw-feed-list">
          {rows.slice(0, 8).map((a) => (
            <li key={a.id}>
              <div className="fw-feed-main">
                <strong>{nwsEventLabels[a.event][idx]}</strong>
                {a.emergency && (
                  <span className="fw-level" data-level="red">
                    {t(
                      'Emergencia por inundación repentina',
                      'Flash flood emergency',
                      'Emergência por inundação repentina',
                    )}
                  </span>
                )}
              </div>
              <p>{a.area}</p>
              <p>
                {a.sender}, {date(a.sent)}
                {a.expires && `. ${t('Hasta', 'Until', 'Até')} ${date(a.expires)}`}.
              </p>
              <a
                href={
                  a.kind === 'tropical'
                    ? 'https://www.nhc.noaa.gov/'
                    : 'https://www.weather.gov/alerts'
                }
                target="_blank"
                rel="noreferrer"
              >
                {t('Ver en la fuente', 'View at source', 'Ver na fonte')}
                <ArrowUpRightIcon size={13} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="fw-feed-note">
        {mainland
          ? t(
              'En EE. UU. continental se muestran avisos tropicales y de inundación repentina; los avisos locales de inundación están en weather.gov. Que no aparezca un aviso no significa que no haya riesgo. ',
              'For the U.S. mainland, tropical and flash flood warnings are shown; local flood products are on weather.gov. No alert listed does not mean there is no risk. ',
              'Nos EUA continentais, aparecem avisos tropicais e de inundação repentina; os avisos locais de inundação estão em weather.gov. Nenhum aviso na lista não significa que não haja risco. ',
            )
          : t(
              'Avisos del NWS para este territorio; revisa las zonas indicadas en cada uno. ',
              'NWS alerts for this territory; check the areas listed in each one. ',
              'Avisos do NWS para este território; confira as áreas indicadas em cada um. ',
            )}
        {t('Fuente', 'Source', 'Fonte')}:{' '}
        <a href="https://www.weather.gov/alerts" target="_blank" rel="noreferrer">
          NOAA, National Weather Service
        </a>
        .
      </p>
    </section>
  );
}
