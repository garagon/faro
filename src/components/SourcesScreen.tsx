import type { ReactNode } from 'react';
import {
  ArrowUpRightIcon,
  CloudLightningIcon,
  GlobeHemisphereWestIcon,
  HurricaneIcon,
  MegaphoneIcon,
  PulseIcon,
  WavesIcon,
} from '@phosphor-icons/react';
import { checkedLabel } from '../lib/time.ts';
import type { SourceState } from '../lib/sourceStatus.ts';
import type { FeedUpdate } from '../lib/feedUpdates.ts';
import { displayPlace, placeLang, type Quake } from '../lib/domain.ts';
import { pick, type Lang } from '../lib/i18n.ts';
import { MagnitudeScale } from './MagnitudeLegend.tsx';
import {
  Actions,
  Badge,
  List,
  ListRow,
  Magnitude,
  Note,
  OutLink,
  SourceStamp,
  StatusIcon,
  type Signal,
} from '../ui/index.ts';

export type SourceRow = {
  id: string;
  name: string;
  /** What it gives Faro for the place being viewed, in the interface language. */
  covers: string;
  url: string;
  state: SourceState;
  checked: number | null;
  /** How often Faro asks while the page is open. */
  every: string;
};

type Props = {
  lang: Lang;
  now: number;
  countryName: string;
  rows: SourceRow[];
  /** When Faro asks the selected earthquake catalogue again (its row id), while it is polling. */
  next?: { id: string; at: number };
  /** Earthquakes received since Faro was opened that match the earthquake filters. */
  updates?: {
    items: FeedUpdate[];
    provider: string;
    /** When the catalogue's data was retrieved; 0 if never. */
    fetched: number;
    onDetails: (q: Quake) => void;
  };
};

const icons: Record<string, ReactNode> = {
  IGC: <PulseIcon size={20} weight="bold" />,
  EMSC: <PulseIcon size={20} weight="bold" />,
  USGS: <PulseIcon size={20} weight="bold" />,
  national: <CloudLightningIcon size={20} weight="bold" />,
  sinaproc: <MegaphoneIcon size={20} weight="bold" />,
  nws: <CloudLightningIcon size={20} weight="bold" />,
  tsunami: <WavesIcon size={20} weight="bold" />,
  nhc: <HurricaneIcon size={20} weight="bold" />,
  gdacs: <GlobeHemisphereWestIcon size={20} weight="bold" />,
};
// A source that cannot confirm its data is shown with the stale-data level, never as calm.
const signals: Record<SourceState, Signal> = {
  ok: 'none',
  partial: 'unknown',
  stale: 'unknown',
  failed: 'unknown',
  offline: 'unknown',
  checking: 'pending',
  // Not polled now (another catalogue is selected): a static neutral icon, not a pending one.
  idle: 'none',
};
const problem = (s: SourceState) =>
  s === 'partial' || s === 'stale' || s === 'failed' || s === 'offline';

/**
 * Sources and updates: the state of every official source for the place being viewed (did it
 * answer, when, how often), the earthquakes received meanwhile, then what each one publishes and
 * how to read dates, coverage and magnitude. Other screens link to its sections by id.
 */
export default function SourcesScreen({ lang, now, countryName, rows, next, updates }: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const label: Record<SourceState, string> = {
    ok: t('Respondió', 'Responding', 'Respondeu'),
    partial: t('Respuesta parcial', 'Partial answer', 'Resposta parcial'),
    stale: t('Dato viejo', 'Old data', 'Dado antigo'),
    failed: t('No responde', 'Not responding', 'Não responde'),
    checking: t('Consultando…', 'Checking…', 'Consultando…'),
    offline: t('Sin conexión', 'Offline', 'Sem conexão'),
    idle: t('Se consulta al elegirla', 'Checked when selected', 'Consultada ao selecionar'),
  };
  const when = (r: SourceRow) =>
    r.checked
      ? r.state === 'ok' || r.state === 'partial'
        ? t(
            `Consultado ${checkedLabel(r.checked, now, lang)}`,
            `Checked ${checkedLabel(r.checked, now, lang)}`,
            `Consultado ${checkedLabel(r.checked, now, lang)}`,
          )
        : t(
            `Último dato ${checkedLabel(r.checked, now, lang)}`,
            `Last data ${checkedLabel(r.checked, now, lang)}`,
            `Último dado ${checkedLabel(r.checked, now, lang)}`,
          )
      : '';
  const countdown = (r: SourceRow) =>
    next?.id === r.id
      ? `${t('Próxima consulta', 'Next check', 'Próxima consulta')}: ${Math.max(0, Math.ceil((next.at - now) / 1000))}\u00a0s`
      : '';
  return (
    <div className="f-column">
      <section className="f-section" id="fw-sources-now" aria-labelledby="fw-sources-now-title">
        <h2 className="f-section-title" id="fw-sources-now-title">
          {t(
            `Estado de las fuentes para ${countryName}`,
            `Source status for ${countryName}`,
            `Status das fontes: ${countryName}`,
          )}
        </h2>
        <List label={t('Fuentes', 'Sources', 'Fontes')}>
          {rows.map((r) => {
            const row = {
              lead: (
                <StatusIcon
                  state={signals[r.state]}
                  level={problem(r.state) ? 1 : undefined}
                  icon={icons[r.id] ?? <GlobeHemisphereWestIcon size={20} weight="bold" />}
                />
              ),
              title: r.name,
              badge: <Badge level={problem(r.state) ? 1 : undefined}>{label[r.state]}</Badge>,
              meta: [r.covers, when(r), r.every, countdown(r)].filter(Boolean).join(' · '),
            };
            // The row leaves to the agency's own site, when there is one.
            return r.url ? (
              <ListRow
                key={r.id}
                {...row}
                href={r.url}
                external
                trail={<ArrowUpRightIcon size={16} aria-hidden="true" />}
              />
            ) : (
              <ListRow key={r.id} {...row} />
            );
          })}
        </List>
        <Note>
          {t(
            'Faro consulta cada fuente solo mientras la página está abierta. Si una no responde, sus datos se muestran como no confirmados, nunca como “sin alertas”.',
            'Faro checks each source only while the page is open. If one does not respond, its data is shown as not confirmed, never as “no alerts”.',
            'O Faro consulta cada fonte só enquanto a página está aberta. Se uma não responde, seus dados aparecem como não confirmados, nunca como “sem alertas”.',
          )}
        </Note>
      </section>

      {updates && (
        <section
          className="f-section"
          id="fw-sources-updates"
          aria-labelledby="fw-sources-updates-title"
        >
          <div className="f-section-head">
            <h2 className="f-section-title" id="fw-sources-updates-title">
              {t('Cambios recibidos', 'Updates received', 'Mudanças recebidas')}
            </h2>
            <span className="f-section-aside">{updates.provider}</span>
          </div>
          <Note>
            {t(
              'Cada sismo aparece cuando la fuente lo publica.',
              'Each earthquake appears once the source publishes it.',
              'Cada terremoto aparece quando a fonte o publica.',
            )}{' '}
            {t(
              'Recibidas desde que abriste Faro y que coinciden con tus filtros. La primera carga no cuenta como novedad. Hasta 50 por fuente.',
              'Received since opening Faro and matching your filters. The initial load is not an update. Up to 50 per source.',
              'Recebidas desde que você abriu o Faro e que coincidem com seus filtros. O primeiro carregamento não conta como novidade. Até 50 por fonte.',
            )}
          </Note>
          {updates.items.length ? (
            <List label={t('Cambios recibidos', 'Updates received', 'Mudanças recebidas')}>
              {updates.items.map((u) => (
                <ListRow
                  key={u.event.id}
                  lead={
                    <>
                      <Magnitude value={u.event.mag} />
                      <span className="f-visually-hidden">
                        {t('Magnitud', 'Magnitude', 'Magnitude')}
                      </span>
                    </>
                  }
                  title={<span lang={placeLang(u.event)}>{displayPlace(u.event.place)}</span>}
                  meta={`${t('Sismo', 'Earthquake', 'Terremoto')}: ${checkedLabel(u.event.time, now, lang)} · ${t('Recibido', 'Received', 'Recebido')}: ${checkedLabel(u.receivedAt, now, lang)}`}
                  onClick={() => updates.onDetails(u.event)}
                />
              ))}
            </List>
          ) : (
            <div className="f-prose">
              <p>
                {t(
                  'Todavía no se recibieron otros eventos para esta vista.',
                  'No additional events received for this view yet.',
                  'Ainda não foram recebidos outros eventos para esta tela.',
                )}
              </p>
            </div>
          )}
          {updates.fetched > 0 && (
            <div>
              <SourceStamp issuer={updates.provider}>
                <span>
                  {t(
                    'Datos obtenidos de la fuente',
                    'Data retrieved from source',
                    'Dados obtidos da fonte',
                  )}
                  : {checkedLabel(updates.fetched, now, lang)}
                </span>
              </SourceStamp>
            </div>
          )}
        </section>
      )}

      <section className="f-section" id="fw-sources-what" aria-labelledby="fw-sources-what-title">
        <h2 className="f-section-title" id="fw-sources-what-title">
          {t('Qué publica cada fuente', 'What each source publishes', 'O que cada fonte publica')}
        </h2>
        <div className="f-prose">
          <dl>
            <div>
              <dt>IGC · Universidad de Panamá</dt>
              <dd>
                {t(
                  'Listado oficial de sismos de Panamá. Las horas corresponden a Panamá (UTC−5). No publica fecha de generación ni identifica réplicas.',
                  'Official earthquake listing for Panama. Times use Panama time (UTC−5). It does not publish a generation time or identify aftershocks.',
                  'Lista oficial de terremotos do Panamá. Os horários são do Panamá (UTC−5). Não publica a hora de geração nem identifica réplicas.',
                )}
              </dd>
            </div>
            <div>
              <dt>EMSC</dt>
              <dd>
                {t(
                  'Centro Sismológico Euromediterráneo. Catálogo mundial M2.5+ de los últimos 7 días que reúne soluciones de redes nacionales e indica qué agencia publicó cada una. Útil si la fuente nacional no responde. Datos de EMSC-CSEM SeismicPortal bajo licencia CC BY 4.0, adaptados al formato de Faro.',
                  'Euro-Mediterranean Seismological Centre. Worldwide M2.5+ catalog for the last 7 days that gathers solutions from national networks and credits each agency. Useful when the national source does not respond. Data from EMSC-CSEM SeismicPortal under CC BY 4.0, adapted to Faro’s format.',
                  'Centro Sismológico Euro-Mediterrâneo. Catálogo mundial M2.5+ dos últimos 7 dias que reúne soluções de redes nacionais e indica qual agência publicou cada uma. Útil se a fonte nacional não responde. Dados do EMSC-CSEM SeismicPortal sob licença CC BY 4.0, adaptados ao formato do Faro.',
                )}
              </dd>
            </div>
            <div>
              <dt>USGS</dt>
              <dd>
                {t(
                  'Catálogo mundial. Puede tardar varios minutos en publicar y no incluye todos los sismos pequeños fuera de sus redes. En sismos relevantes añade la alerta PAGER, la intensidad estimada y los reportes «¿Lo sentiste?».',
                  'Worldwide catalog. It can take several minutes to publish and does not include every small earthquake outside its networks. For significant events it adds PAGER alerts, estimated intensity and "Did You Feel It?" reports.',
                  'Catálogo mundial. Pode levar vários minutos para publicar e não inclui todos os terremotos pequenos fora de suas redes. Em terremotos relevantes, acrescenta o alerta PAGER, a intensidade estimada e os relatos “Você sentiu?”.',
                )}
              </dd>
            </div>
            <div>
              <dt>
                {t(
                  'Servicios meteorológicos nacionales',
                  'National weather services',
                  'Serviços meteorológicos nacionais',
                )}
              </dt>
              <dd>
                {t(
                  'Avisos vigentes de los servicios con canal de alertas (IMHPA, IMN, INDOMET, INAMHI, SMN), con sus indicaciones y el área que cubren, tal como se publican.',
                  'Warnings in force from services with an alert feed (IMHPA, IMN, INDOMET, INAMHI, SMN), with their instructions and the area they cover, as published.',
                  'Avisos em vigor dos serviços com canal de alertas (IMHPA, IMN, INDOMET, INAMHI, SMN), com suas orientações e a área que cobrem, como foram publicados.',
                )}
              </dd>
            </div>
            <div>
              <dt>SINAPROC</dt>
              <dd>
                {t(
                  'Protección Civil de Panamá: comunicados, avisos de prevención y reportes, con su hora de publicación. No tienen vencimiento; los simulacros no se muestran.',
                  "Panama's civil protection agency: communiqués, prevention notices and reports, with their publication time. They have no expiry; drills are not shown.",
                  'Proteção Civil do Panamá: comunicados, avisos de prevenção e relatórios, com o horário de publicação. Não têm vencimento; os simulados não são mostrados.',
                )}
              </dd>
            </div>
            <div>
              <dt>{t('NOAA, GDACS y NWS', 'NOAA, GDACS and NWS', 'NOAA, GDACS e NWS')}</dt>
              <dd>
                {t(
                  'Boletines de tsunami de NOAA/PTWC, ciclones activos del Centro Nacional de Huracanes, alertas de GDACS (ONU y Comisión Europea) y, para EE. UU., alertas del Servicio Meteorológico Nacional. Cada uno conserva su fecha y su fuente; ninguno se combina con otro.',
                  'NOAA/PTWC tsunami bulletins, active cyclones from the National Hurricane Center, GDACS alerts (UN and European Commission) and, for U.S. areas, National Weather Service alerts. Each keeps its own date and source; none is merged with another.',
                  'Boletins de tsunami da NOAA/PTWC, ciclones ativos do Centro Nacional de Furacões, alertas do GDACS (ONU e Comissão Europeia) e, para os EUA, alertas do Serviço Meteorológico Nacional. Cada um mantém sua data e sua fonte; nenhum é combinado com outro.',
                )}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="f-section" id="fw-sources-read" aria-labelledby="fw-sources-read-title">
        <h2 className="f-section-title" id="fw-sources-read-title" tabIndex={-1}>
          {t(
            'Cómo leer las fechas y la cobertura',
            'Reading dates and coverage',
            'Como ler as datas e a cobertura',
          )}
        </h2>
        <div className="f-prose">
          <p>
            {t(
              'La hora de un sismo es cuando ocurrió; «consultado» es cuando Faro recibió los datos. IGC, EMSC y USGS se muestran por separado para no contar dos veces el mismo sismo.',
              'An earthquake time is when it happened; “checked” is when Faro received the data. IGC, EMSC and USGS are shown separately so the same earthquake is not counted twice.',
              'O horário de um terremoto é quando ele ocorreu; “consultado” é quando o Faro recebeu os dados. IGC, EMSC e USGS aparecem separados para não contar duas vezes o mesmo terremoto.',
            )}
          </p>
          <p>
            {t(
              'La región de un país incluye un área a su alrededor y puede abarcar países vecinos. No hay notificaciones en segundo plano: los datos se actualizan con la página abierta.',
              'A country region includes an area around it and may cover neighboring countries. There are no background notifications: data updates while the page is open.',
              'A região de um país inclui uma área ao seu redor e pode abranger países vizinhos. Não há notificações em segundo plano: os dados são atualizados com a página aberta.',
            )}
          </p>
        </div>
        <MagnitudeScale lang={lang} />
      </section>

      <section
        className="f-section"
        id="fw-sources-privacy"
        aria-labelledby="fw-sources-privacy-title"
      >
        <h2 className="f-section-title" id="fw-sources-privacy-title">
          {t('Ubicación y privacidad', 'Location and privacy', 'Localização e privacidade')}
        </h2>
        <div className="f-prose">
          <p>
            {t(
              'La ubicación requiere tu permiso y no se guarda automáticamente. El mapa carga sus imágenes al abrirse: OpenFreeMap recibe tu IP y el área que miras. Tus datos del viaje se guardan solo en este navegador.',
              'Location requires your permission and is not saved automatically. The map loads its images when shown: OpenFreeMap receives your IP and the area you view. Your trip data is stored only in this browser.',
              'A localização requer sua permissão e não é salva automaticamente. O mapa carrega suas imagens ao ser exibido: o OpenFreeMap recebe seu IP e a área que você vê. Os dados da sua viagem ficam salvos só neste navegador.',
            )}
          </p>
        </div>
      </section>

      <section className="f-section" id="fw-sources-maps" aria-labelledby="fw-sources-maps-title">
        <h2 className="f-section-title" id="fw-sources-maps-title">
          {t('Datos del mapa y licencias', 'Map data and licenses', 'Dados do mapa e licenças')}
        </h2>
        <div className="f-prose">
          <p>
            {t(
              'Países: datos derivados de world-countries, bajo ODbL-1.0. Costa: Natural Earth, dominio público. Mapa base: OpenFreeMap © OpenMapTiles, datos de los colaboradores de OpenStreetMap. Límites de placas: PB2002 (Bird, 2003), versión de Hugo Ahlenius (Nordpil), bajo ODC-By 1.0.',
              'Countries: data derived from world-countries, under ODbL-1.0. Coastline: Natural Earth, public domain. Base map: OpenFreeMap © OpenMapTiles, data from OpenStreetMap contributors. Plate boundaries: PB2002 (Bird, 2003), as converted by Hugo Ahlenius (Nordpil), under ODC-By 1.0.',
              'Países: dados derivados de world-countries, sob ODbL-1.0. Costa: Natural Earth, domínio público. Mapa base: OpenFreeMap © OpenMapTiles, dados dos colaboradores do OpenStreetMap. Limites de placas: PB2002 (Bird, 2003), versão de Hugo Ahlenius (Nordpil), sob ODC-By 1.0.',
            )}
          </p>
        </div>
        <Actions>
          <OutLink href="https://github.com/mledoze/countries">world-countries</OutLink>
          <OutLink href="https://opendatacommons.org/licenses/odbl/1-0/">ODbL-1.0</OutLink>
          <OutLink href="/about.html">{t('Acerca de Faro', 'About Faro', 'Sobre o Faro')}</OutLink>
        </Actions>
      </section>
    </div>
  );
}
