import { ArrowUpRightIcon } from '@phosphor-icons/react';
import { atLabel } from '../lib/time.ts';
import {
  ADVISORY_STALE,
  advisoryUrl,
  basinLabels,
  basinOf,
  graphicsUrl,
  issuerOf,
  position,
  stormClassLabels,
  windKmh,
  type StormsSnapshot,
} from '../lib/storms.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';

type Props = {
  lang: Lang;
  data: StormsSnapshot | null;
  failed: boolean;
  online: boolean;
  now: number;
  weather?: { name: string; url: string };
};

/** Active tropical cyclones as published by NHC/CPHC. Faro does not judge local impact. */
export default function StormsPanel(p: Props) {
  const t = (es: string, en: string, pt: string) => pick(p.lang, es, en, pt),
    idx = langIndex(p.lang);
  const time = (n: number) =>
    new Intl.DateTimeFormat(p.lang, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(n);
  return (
    <section className="fw-feed fw-storms" aria-labelledby="fw-storms-title">
      <div className="fw-feed-head">
        <h2 id="fw-storms-title">
          {t(
            'Ciclones tropicales activos',
            'Active tropical cyclones',
            'Ciclones tropicais ativos',
          )}
        </h2>
        <p>
          {t(
            'Centro Nacional de Huracanes de NOAA: Atlántico, Caribe y Pacífico.',
            'NOAA National Hurricane Center: Atlantic, Caribbean and Pacific.',
            'Centro Nacional de Furacões da NOAA: Atlântico, Caribe e Pacífico.',
          )}
        </p>
      </div>
      {p.failed && (
        <p className="fw-feed-problem" role="status">
          {p.data
            ? t(
                'No se pudo actualizar el NHC. Se muestran los últimos datos recibidos.',
                'NHC could not be refreshed. Showing the last data received.',
                'Não foi possível atualizar o NHC. Mostrando os últimos dados recebidos.',
              )
            : t(
                'No se pudo consultar el NHC. Esto no significa que no haya ciclones.',
                'NHC could not be reached. This does not mean there are no cyclones.',
                'Não foi possível consultar o NHC. Isso não significa que não haja ciclones.',
              )}
        </p>
      )}
      {!p.data && !p.failed && (
        <p className="fw-feed-empty">
          {p.online
            ? t('Consultando el NHC…', 'Checking NHC…', 'Consultando o NHC…')
            : t('Sin conexión.', 'Offline.', 'Sem conexão.')}
        </p>
      )}
      {p.data && p.data.storms.length === 0 && (
        <p className="fw-feed-empty">
          {t(
            'El NHC no tiene ciclones activos: no emitió pronósticos en las últimas 12 horas.',
            'NHC has no active cyclones: it has issued no forecasts in the last 12 hours.',
            'O NHC não tem ciclones ativos: não emitiu previsões nas últimas 12 horas.',
          )}
        </p>
      )}
      {p.data && p.data.storms.length > 0 && (
        <ul className="fw-feed-list">
          {p.data.storms.map((s) => {
            const old = !!s.issued && p.now - s.issued > ADVISORY_STALE;
            return (
              <li key={s.id}>
                <div className="fw-feed-main">
                  <strong>
                    {stormClassLabels[s.classification][idx]} {s.name}
                  </strong>
                  <span className="fw-level" data-level="info">
                    {basinLabels[basinOf(s)][idx]}
                  </span>
                </div>
                <p>
                  {s.intensityKt !== null &&
                    `${t('Viento máximo', 'Maximum wind', 'Vento máximo')} ${windKmh(s.intensityKt)} km/h. `}
                  {s.pressureMb !== null && `${s.pressureMb} hPa. `}
                  {t('Centro en', 'Centre at', 'Centro em')} {position(s)}.
                </p>
                <p className={old ? 'fw-feed-old' : ''}>
                  {t('Boletín', 'Advisory', 'Boletim')} {s.advisory.toUpperCase()}{' '}
                  {t('del', 'from', 'do')} {issuerOf(s)}
                  {s.issued > 0 && `, ${time(s.issued)}`}.
                  {old &&
                    ` ${t(
                      'Puede haber uno más reciente.',
                      'A newer one may exist.',
                      'Pode haver um mais recente.',
                    )}`}
                </p>
                <div className="fw-feed-links">
                  <a href={advisoryUrl(s, p.lang)} target="_blank" rel="noreferrer">
                    {p.lang === 'es' && s.spanish
                      ? 'Boletín en español'
                      : t(
                          'Boletín oficial (en inglés)',
                          'Official advisory',
                          'Boletim oficial (em inglês)',
                        )}
                    <ArrowUpRightIcon size={13} aria-hidden="true" />
                  </a>
                  <a href={graphicsUrl(s)} target="_blank" rel="noreferrer">
                    {t('Trayectoria y cono', 'Track and cone', 'Trajetória e cone')}
                    <ArrowUpRightIcon size={13} aria-hidden="true" />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="fw-feed-note">
        {t(
          'El cono muestra la trayectoria probable del centro, no el tamaño del ciclón: viento, lluvia, marejada e inundaciones pueden ocurrir fuera de él. Faro no determina si un ciclón afectará tu ubicación; las vigilancias y avisos de cada país los emite su servicio meteorológico',
          'The cone shows the probable path of the centre, not the size of the storm: wind, rain, surge and flooding can occur outside it. Faro does not determine whether a cyclone will affect your location; each country’s watches and warnings come from its meteorological service',
          'O cone mostra a trajetória provável do centro, não o tamanho do ciclone: vento, chuva, maré de tempestade e inundações podem ocorrer fora dele. O Faro não determina se um ciclone afetará sua localização; as vigilâncias e os avisos de cada país são emitidos pelo seu serviço meteorológico',
        )}
        {p.weather ? (
          <>
            {' '}
            (
            <a href={p.weather.url} target="_blank" rel="noreferrer">
              {p.weather.name}
            </a>
            ).{' '}
          </>
        ) : (
          '. '
        )}
        {p.lang === 'es' &&
          p.data?.storms.some((s) => s.spanish) &&
          'El texto en español del NHC es una traducción automática; ante dudas, el inglés es la versión oficial. '}
        {t('Fuente', 'Source', 'Fonte')}:{' '}
        <a href="https://www.nhc.noaa.gov/" target="_blank" rel="noreferrer">
          {t(
            'Centro Nacional de Huracanes de NOAA',
            'NOAA National Hurricane Center',
            'Centro Nacional de Furacões da NOAA',
          )}
        </a>
        {p.data &&
          `, ${t('consultado a', 'checked at', 'última consulta:')} ${atLabel(p.data.fetched, p.now, p.lang)}`}
        .
      </p>
    </section>
  );
}
