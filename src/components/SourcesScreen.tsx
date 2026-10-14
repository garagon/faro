import { ExternalLink } from './Ui.tsx';
import { checkedLabel } from '../lib/time.ts';
import type { SourceState } from '../lib/sourceStatus.ts';
import '../styles/sources.css';
import { pick, type Lang } from '../lib/i18n.ts';

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
};

/**
 * Sources and updates: the state of every official source for the place being viewed (did it
 * answer, when, how often), then what each one publishes and how to read dates and coverage.
 */
export default function SourcesScreen({ lang, now, countryName, rows }: Props) {
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
  return (
    <div className="fw-sources">
      <section aria-labelledby="fw-sources-now">
        <h2 id="fw-sources-now">
          {t(
            `Estado de las fuentes para ${countryName}`,
            `Source status for ${countryName}`,
            `Status das fontes: ${countryName}`,
          )}
        </h2>
        <p className="fw-sources-intro">
          {t(
            'Faro consulta cada fuente solo mientras la página está abierta. Si una no responde, sus datos se muestran como no confirmados, nunca como “sin alertas”.',
            'Faro checks each source only while the page is open. If one does not respond, its data is shown as not confirmed, never as “no alerts”.',
            'O Faro consulta cada fonte só enquanto a página está aberta. Se uma não responde, seus dados aparecem como não confirmados, nunca como “sem alertas”.',
          )}
        </p>
        <ul className="fw-sources-board">
          {rows.map((r) => (
            <li key={r.id} data-state={r.state}>
              <span className="fw-sources-dot" aria-hidden="true" />
              <p className="fw-sources-name">
                <strong>{r.name}</strong>
                <span>{r.covers}</span>
              </p>
              <p className="fw-sources-state">
                <strong>{label[r.state]}</strong>
                <span>{[when(r), r.every].filter(Boolean).join(' · ')}</span>
              </p>
              <ExternalLink href={r.url}>
                {t('Sitio oficial', 'Official site', 'Site oficial')}
              </ExternalLink>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="fw-sources-what">
        <h2 id="fw-sources-what">
          {t('Qué publica cada fuente', 'What each source publishes', 'O que cada fonte publica')}
        </h2>
        <dl className="fw-sources-notes">
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
                'Euro-Mediterranean Seismological Centre. Worldwide M2.5+ catalogue for the last 7 days that gathers solutions from national networks and credits each agency. Useful when the national source does not respond. Data from EMSC-CSEM SeismicPortal under CC BY 4.0, adapted to Faro’s format.',
                'Centro Sismológico Euro-Mediterrâneo. Catálogo mundial M2.5+ dos últimos 7 dias que reúne soluções de redes nacionais e indica qual agência publicou cada uma. Útil se a fonte nacional não responde. Dados do EMSC-CSEM SeismicPortal sob licença CC BY 4.0, adaptados ao formato do Faro.',
              )}
            </dd>
          </div>
          <div>
            <dt>USGS</dt>
            <dd>
              {t(
                'Catálogo mundial. Puede tardar varios minutos en publicar y no incluye todos los sismos pequeños fuera de sus redes. En sismos relevantes añade la alerta PAGER, la intensidad estimada y los reportes «¿Lo sentiste?».',
                'Worldwide catalogue. It can take several minutes to publish and does not include every small earthquake outside its networks. For significant events it adds PAGER alerts, estimated intensity and "Did You Feel It?" reports.',
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
      </section>

      <section aria-labelledby="fw-sources-read">
        <h2 id="fw-sources-read">
          {t(
            'Cómo leer las fechas y la cobertura',
            'Reading dates and coverage',
            'Como ler as datas e a cobertura',
          )}
        </h2>
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
            'A country region includes an area around it and may cover neighbouring countries. There are no background notifications: data updates while the page is open.',
            'A região de um país inclui uma área ao seu redor e pode abranger países vizinhos. Não há notificações em segundo plano: os dados são atualizados com a página aberta.',
          )}
        </p>
      </section>

      <section aria-labelledby="fw-sources-privacy">
        <h2 id="fw-sources-privacy">
          {t('Ubicación y privacidad', 'Location and privacy', 'Localização e privacidade')}
        </h2>
        <p>
          {t(
            'La ubicación requiere tu permiso y no se guarda automáticamente. El mapa carga sus imágenes al abrirse: OpenStreetMap recibe tu IP y el área que miras. Tus datos del viaje se guardan solo en este navegador.',
            'Location requires your permission and is not saved automatically. The map loads its images when shown: OpenStreetMap receives your IP and the area you view. Your trip data is stored only in this browser.',
            'A localização requer sua permissão e não é salva automaticamente. O mapa carrega suas imagens ao ser exibido: o OpenStreetMap recebe seu IP e a área que você vê. Os dados da sua viagem ficam salvos só neste navegador.',
          )}
        </p>
      </section>

      <section aria-labelledby="fw-sources-maps">
        <h2 id="fw-sources-maps">
          {t('Datos del mapa y licencias', 'Map data and licences', 'Dados do mapa e licenças')}
        </h2>
        <p>
          {t(
            'Países: datos derivados de world-countries, bajo ODbL-1.0. Costa: Natural Earth, dominio público. Mapa base: © colaboradores de OpenStreetMap.',
            'Countries: data derived from world-countries, under ODbL-1.0. Coastline: Natural Earth, public domain. Base map: © OpenStreetMap contributors.',
            'Países: dados derivados de world-countries, sob ODbL-1.0. Costa: Natural Earth, domínio público. Mapa base: © colaboradores do OpenStreetMap.',
          )}
        </p>
        <p className="fw-sources-links">
          <ExternalLink href="https://github.com/mledoze/countries">world-countries</ExternalLink>
          <ExternalLink href="https://opendatacommons.org/licenses/odbl/1-0/">
            ODbL-1.0
          </ExternalLink>
          <ExternalLink href="/about.html">
            {t('Acerca de Faro', 'About Faro', 'Sobre o Faro')}
          </ExternalLink>
        </p>
      </section>
    </div>
  );
}
