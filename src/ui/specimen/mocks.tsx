/**
 * Screen mockups for approval, built only from the design-system components. Emergency numbers
 * and first steps come from Faro's own data; feed values are illustrative and fixed.
 */
import { useMemo, useState } from 'react';
import {
  BackpackIcon,
  BookOpenTextIcon,
  BuildingsIcon,
  CaretRightIcon,
  ChatCircleTextIcon,
  CheckIcon,
  CrosshairIcon,
  DatabaseIcon,
  DropIcon,
  FileTextIcon,
  FirstAidIcon,
  FlagIcon,
  HouseLineIcon,
  HurricaneIcon,
  MapTrifoldIcon,
  MegaphoneSimpleIcon,
  MountainsIcon,
  PhoneIcon,
  PulseIcon,
  ShieldCheckIcon,
  SuitcaseRollingIcon,
  UsersThreeIcon,
  WavesIcon,
  WifiSlashIcon,
} from '@phosphor-icons/react';
import WebMap from '../../components/WebMap.tsx';
import type { Quake } from '../../lib/domain.ts';
import { emergencyFor } from '../../lib/emergency.ts';
import { emergencyKinds, hazardSteps, type EmergencyKind } from '../../data/firstMinutes.ts';
import { langIndex, pick, type Lang } from '../../lib/i18n.ts';
import {
  AppFrame,
  BackLink,
  Badge,
  Button,
  CallButton,
  Content,
  Field,
  Header,
  List,
  ListRow,
  Magnitude,
  MapFrame,
  Note,
  PhoneRow,
  RowIcon,
  SafetyNotice,
  ScopeNote,
  ScreenHead,
  Section,
  Segmented,
  Sidebar,
  SourceStamp,
  StatusBar,
  StatusIcon,
  Steps,
  TabBar,
  type Tab,
} from '../index.ts';

export type TabId = 'activity' | 'help' | 'status' | 'kit' | 'trip' | 'guide';
export type MockScreen = 'activity' | 'event' | 'emergency' | 'country' | 'quakes' | 'help';

/** Words that must not break across lines: "24 h", "10 min", "13 oct". */
const nb = (text: string) => text.replace(/(\d) (h|min|oct|km)\b/g, '$1 $2');

export function tabsFor(lang: Lang): readonly Tab<TabId>[] {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  return [
    { id: 'activity', label: t('Situación', 'Situation', 'Situação'), Icon: PulseIcon },
    { id: 'help', label: t('Ayuda', 'Help', 'Ajuda'), Icon: UsersThreeIcon },
    { id: 'status', label: t('Avisar', 'Check in', 'Avisar'), Icon: ChatCircleTextIcon },
    { id: 'kit', label: t('Mochila', 'Go bag', 'Mochila'), Icon: BackpackIcon },
    { id: 'trip', label: t('Viaje', 'Trip', 'Viagem'), Icon: SuitcaseRollingIcon },
    { id: 'guide', label: t('Guía', 'Guide', 'Guia'), Icon: BookOpenTextIcon },
  ];
}

type Frame = {
  lang: Lang;
  onLang: (l: Lang) => void;
  screen: MockScreen;
  onScreen: (s: MockScreen) => void;
};

/** Synthetic earthquakes around Panama for the mockups (fixed values, not a feed). */
const NOW = Date.UTC(2026, 9, 15, 19, 46);
const MIN = 60000;
const sample: Quake[] = (
  [
    [3.7, 7.47, -80.5, 15, 10, 'Sur de Panamá'],
    [4.7, 7.2, -82.3, 10, 64, 'Frontera Panamá-Costa Rica'],
    [3.1, 8.4, -83.0, 22, 131, 'Costa Rica'],
    [2.9, 6.95, -80.9, 18, 190, 'Sur de Panamá'],
    [4.2, 5.9, -82.7, 10, 260, 'Sur de Panamá, en el mar'],
    [3.4, 7.8, -81.2, 33, 300, 'Veraguas, Panamá'],
  ] as const
).map(([mag, lat, lng, depth, ago, place], i) => ({
  id: `sample-${i}`,
  source: 'EMSC' as const,
  lat,
  lng,
  depth,
  mag,
  place,
  time: NOW - ago * MIN,
  updated: NOW - ago * MIN,
  url: 'https://www.emsc-csem.org/',
  reviewed: false,
  magType: 'M',
}));

function MockMap({ lang }: { lang: Lang }) {
  const view = useMemo(() => ({ lat: 7.6, lng: -80.8, zoom: 6, key: 1 }), []);
  return (
    <WebMap
      lang={lang}
      events={sample}
      view={view}
      geo={null}
      point={null}
      selected={undefined}
      onSelect={() => {}}
      onBounds={() => {}}
      embassies={[]}
    />
  );
}

const ago = (lang: Lang, minutes: number) =>
  nb(
    minutes < 60
      ? pick(lang, `hace ${minutes} min`, `${minutes} min ago`, `há ${minutes} min`)
      : pick(
          lang,
          `hace ${Math.round(minutes / 60)} h`,
          `${Math.round(minutes / 60)} h ago`,
          `há ${Math.round(minutes / 60)} h`,
        ),
  );

function shellText(lang: Lang) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  return {
    home: t('Faro, inicio', 'Faro, home', 'Faro, início'),
    place: t('Cambiar de país: Panamá', 'Change country: Panama', 'Mudar de país: Panamá'),
    language: t('Idioma', 'Language', 'Idioma'),
    emergency: t('Emergencia', 'Emergency', 'Emergência'),
    menu: t('Menú principal', 'Main menu', 'Menu principal'),
  };
}

/** The frame with real header, sidebar and tabs around a mock screen. */
export function MockApp({ lang, onLang, screen, onScreen }: Frame) {
  const text = shellText(lang);
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const placeName = new Intl.DisplayNames([lang], { type: 'region' }).of('PA') ?? 'Panamá';
  const common = {
    text,
    placeName,
    lang,
    onHome: () => onScreen('activity'),
    onPlace: () => onScreen('country'),
    onLanguage: onLang,
    onEmergency: () => onScreen('emergency'),
    emergencyCurrent: screen === 'emergency',
  };
  // Situación and Ayuda are mocked; the other tabs keep the current screen.
  const nav = {
    tabs: tabsFor(lang),
    current:
      screen === 'activity' || screen === 'event' || screen === 'quakes'
        ? ('activity' as const)
        : screen === 'help'
          ? ('help' as const)
          : null,
    onSelect: (id: TabId) => {
      if (id === 'activity' || id === 'help') onScreen(id);
    },
    label: text.menu,
  };
  return (
    <AppFrame>
      <Sidebar
        {...nav}
        {...common}
        foot={
          <>
            <button type="button" className="f-side-link">
              <DatabaseIcon size={20} aria-hidden="true" />
              {t('Fuentes', 'Sources', 'Fontes')}
            </button>
            <button type="button" className="f-side-link">
              <ShieldCheckIcon size={20} aria-hidden="true" />
              {t('Privacidad', 'Privacy', 'Privacidade')}
            </button>
          </>
        }
      />
      <Header {...common} />
      {screen === 'event' && (
        <StatusBar>
          <WifiSlashIcon size={16} aria-hidden="true" />
          {t(
            'Sin conexión · datos de las 14:52',
            'Offline · data from 14:52',
            'Sem conexão · dados das 14:52',
          )}
        </StatusBar>
      )}
      <Content>
        {screen === 'activity' && <MockSituation lang={lang} onScreen={onScreen} />}
        {screen === 'event' && <MockSituation lang={lang} onScreen={onScreen} event />}
        {screen === 'quakes' && <MockQuakes lang={lang} onBack={() => onScreen('activity')} />}
        {screen === 'help' && <MockHelp lang={lang} onScreen={onScreen} />}
        {screen === 'emergency' && <MockEmergency lang={lang} />}
        {screen === 'country' && (
          <MockCountry lang={lang} onLang={onLang} onBack={() => onScreen('activity')} />
        )}
      </Content>
      <TabBar {...nav} />
    </AppFrame>
  );
}

/**
 * Situación. On a normal day the actions come first; when a warning of level 2 or more is in
 * force (`event`), "Qué está pasando" moves up under the call button so it is on the first screen.
 */
export function MockSituation({
  lang,
  onScreen,
  event,
}: {
  lang: Lang;
  onScreen: (s: MockScreen) => void;
  event?: boolean;
}) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const main = emergencyFor('PA')?.numbers[0];
  const call = main && (
    <CallButton
      number={main.number}
      label={t(`Llamar al ${main.number}`, `Call ${main.number}`, `Ligar para ${main.number}`)}
      note={t(
        'Policía, bomberos y ambulancia',
        'Police, fire and ambulance',
        'Polícia, bombeiros e ambulância',
      )}
    />
  );
  const actions = (
    <List>
      <ListRow
        lead={<RowIcon icon={<ChatCircleTextIcon size={20} />} />}
        title={t('Avisar cómo estoy', 'Tell people how I am', 'Avisar como estou')}
        meta={t(
          'Prepara un mensaje y envíalo tú',
          'Prepare a message, send it yourself',
          'Prepare uma mensagem e envie',
        )}
        onClick={() => {}}
      />
      <ListRow
        lead={<RowIcon icon={<FirstAidIcon size={20} />} />}
        title={t('Qué hacer ahora', 'What to do now', 'O que fazer agora')}
        meta={t(
          'Primeros pasos y otros números',
          'First steps and other numbers',
          'Primeiros passos e outros números',
        )}
        onClick={() => onScreen('emergency')}
      />
      <ListRow
        lead={<RowIcon icon={<FlagIcon size={20} />} />}
        title={t('Tu embajada', 'Your embassy', 'Sua embaixada')}
        meta={t('Elige tu nacionalidad', 'Choose your nationality', 'Escolha sua nacionalidade')}
        onClick={() => {}}
      />
    </List>
  );
  const safety = (
    <SafetyNotice>
      {t(
        'En la costa, si el sismo fue fuerte o largo: ve a pie a lo alto ya. No esperes una alerta.',
        'On the coast, if the shaking was strong or long: go on foot to high ground now. Do not wait for an alert.',
        'No litoral, se o tremor foi forte ou longo: vá a pé para um lugar alto já. Não espere um alerta.',
      )}
    </SafetyNotice>
  );
  const happening = (
    <Section
      id="spec-happening"
      title={t('Qué está pasando', 'What is happening', 'O que está acontecendo')}
      aside={
        event
          ? t('2 avisos vigentes', '2 warnings in force', '2 avisos em vigor')
          : t('1 aviso vigente', '1 warning in force', '1 aviso em vigor')
      }
    >
      {/* Warnings in force first. Every row: a label and one caption line. */}
      <List>
        {event && (
          <ListRow
            lead={
              <StatusIcon state="listed" level={3} icon={<WavesIcon size={20} weight="bold" />} />
            }
            title="Tsunami"
            badge={
              <Badge level={3}>
                {t('Mensaje de amenaza', 'Threat message', 'Mensagem de ameaça')}
              </Badge>
            }
            meta={nb(
              t(
                'PTWC · emitido 14:46 · hace 6 min',
                'PTWC · issued 14:46 · 6 min ago',
                'PTWC · emitido 14:46 · há 6 min',
              ),
            )}
            onClick={() => {}}
          />
        )}
        <ListRow
          lead={<StatusIcon state="listed" level={1} icon={<DropIcon size={20} weight="fill" />} />}
          title={t('Inundaciones', 'Floods', 'Inundações')}
          badge={<Badge level={1}>{t('Aviso', 'Warning', 'Aviso')}</Badge>}
          meta={t(
            'Hasta el jueves 23:59 · IMHPA',
            'Until Thursday 23:59 · IMHPA',
            'Até quinta 23:59 · IMHPA',
          )}
          onClick={() => {}}
        />
        <ListRow
          lead={<StatusIcon state="listed" icon={<PulseIcon size={20} weight="bold" />} />}
          title={t('Sismos', 'Earthquakes', 'Terremotos')}
          meta={nb(
            t(
              'M3.7 hace 10 min · 53 en 24 h',
              'M3.7 10 min ago · 53 in 24 h',
              'M3.7 há 10 min · 53 em 24 h',
            ),
          )}
          onClick={() => onScreen('quakes')}
        />
        {!event && (
          <ListRow
            lead={<StatusIcon state="none" icon={<WavesIcon size={20} weight="bold" />} />}
            title="Tsunami"
            meta={t(
              'Sin mensajes de amenaza · 14:52',
              'No threat messages · 14:52',
              'Sem mensagens de ameaça · 14:52',
            )}
            onClick={() => {}}
          />
        )}
        <ListRow
          lead={<StatusIcon state="none" icon={<HurricaneIcon size={20} weight="bold" />} />}
          title={t('Ciclones', 'Cyclones', 'Ciclones')}
          meta={t(
            'Ninguno con alerta para Panamá',
            'None with an alert for Panama',
            'Nenhum com alerta para o Panamá',
          )}
          onClick={() => {}}
        />
        <ListRow
          lead={
            <StatusIcon
              state={event ? 'unknown' : 'none'}
              icon={<MountainsIcon size={20} weight="bold" />}
            />
          }
          title={t('Volcanes', 'Volcanoes', 'Vulcões')}
          meta={
            event ? (
              <SourceStamp state="stale">
                {t(
                  'Sin respuesta de GDACS desde 13:10',
                  'No answer from GDACS since 13:10',
                  'Sem resposta do GDACS desde 13:10',
                )}
              </SourceStamp>
            ) : (
              t('Sin alertas', 'No alerts', 'Sem alertas')
            )
          }
          onClick={() => {}}
        />
      </List>
      <div className="f-when-single">
        <MapFrame
          more={
            <Button
              variant="ghost"
              icon={<MapTrifoldIcon size={18} aria-hidden="true" />}
              onClick={() => onScreen('quakes')}
            >
              {t(
                'Ver mapa y lista de sismos',
                'See map and earthquake list',
                'Ver mapa e lista de terremotos',
              )}
            </Button>
          }
        >
          <MockMap lang={lang} />
        </MapFrame>
      </div>
      <Note
        more={<a href="#fuentes">{t('Cómo leer esto', 'How to read this', 'Como ler isto')}</a>}
      >
        {t(
          'Fuentes: IMHPA, EMSC, PTWC y GDACS. Faro no es un sistema de alerta temprana.',
          'Sources: IMHPA, EMSC, PTWC and GDACS. Faro is not an early warning system.',
          'Fontes: IMHPA, EMSC, PTWC e GDACS. O Faro não é um sistema de alerta antecipado.',
        )}
      </Note>
    </Section>
  );
  const response = (
    <Section
      id="spec-response"
      title={t('Respuesta oficial', 'Official response', 'Resposta oficial')}
    >
      <List>
        <ListRow
          lead={<RowIcon icon={<MegaphoneSimpleIcon size={20} />} />}
          title={t(
            'Sismo M7.7 del 9 de octubre',
            'M7.7 earthquake, 9 October',
            'Terremoto M7.7, 9 de outubro',
          )}
          meta={nb(
            t(
              'Balance de SINAPROC, 13 oct',
              'SINAPROC update, 13 Oct',
              'Balanço do SINAPROC, 13 out',
            ),
          )}
          onClick={() => {}}
        />
        <ListRow
          lead={<RowIcon icon={<FileTextIcon size={20} />} />}
          title={t('Comunicados de SINAPROC', 'SINAPROC statements', 'Comunicados do SINAPROC')}
          meta={t('3 esta semana', '3 this week', '3 nesta semana')}
          onClick={() => {}}
        />
      </List>
    </Section>
  );
  return (
    <div className="f-split">
      <div className="f-column">
        <ScreenHead
          title={t('Situación', 'Situation', 'Situação')}
          aside={
            event ? (
              <span className="f-section-aside" data-state="stale">
                {t('Datos de las 14:52', 'Data from 14:52', 'Dados das 14:52')}
              </span>
            ) : (
              t('Comprobado hace 1 min', 'Checked 1 min ago', 'Verificado há 1 min')
            )
          }
        />
        {event ? (
          <>
            {call}
            {happening}
            <div className="f-stack">
              {safety}
              {actions}
            </div>
          </>
        ) : (
          <>
            <div className="f-stack">
              {call}
              {actions}
              {safety}
            </div>
            {happening}
          </>
        )}
        {response}
        <ScopeNote>
          {t(
            'Faro no llama ni avisa por ti. Tus datos quedan en este navegador.',
            'Faro does not call or alert anyone for you. Your data stays in this browser.',
            'O Faro não liga nem avisa ninguém por você. Seus dados ficam neste navegador.',
          )}
        </ScopeNote>
      </div>
      <aside className="f-when-split f-stack" data-gap="lg">
        <MapFrame size="tall">
          <MockMap lang={lang} />
        </MapFrame>
        <Section
          id="spec-latest"
          title={t('Últimos sismos', 'Latest earthquakes', 'Últimos terremotos')}
          aside="EMSC"
        >
          <QuakeList lang={lang} items={sample.slice(0, 4)} />
        </Section>
      </aside>
    </div>
  );
}

function QuakeList({ lang, items }: { lang: Lang; items: readonly Quake[] }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  return (
    <List>
      {items.map((q) => (
        <ListRow
          key={q.id}
          lead={<Magnitude value={q.mag} />}
          title={q.place}
          meta={`${ago(lang, Math.round((NOW - q.time) / MIN))} · ${nb(
            t(
              `${q.depth} km de prof.`,
              `${Math.round(q.depth / 1.609344)} mi deep`,
              `${q.depth} km de prof.`,
            ),
          )}`}
          onClick={() => {}}
        />
      ))}
    </List>
  );
}

export function MockQuakes({ lang, onBack }: { lang: Lang; onBack: () => void }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const [view, setView] = useState<'list' | 'map'>('list');
  return (
    <div className="f-column">
      <div className="f-stack" data-gap="sm">
        <BackLink onClick={onBack}>{t('Situación', 'Situation', 'Situação')}</BackLink>
        <ScreenHead
          title={t('Sismos', 'Earthquakes', 'Terremotos')}
          aside={t('Comprobado hace 1 min', 'Checked 1 min ago', 'Verificado há 1 min')}
          lead={nb(
            t(
              '53 en 24 h · mayor M4.7 · EMSC',
              '53 in 24 h · largest M4.7 · EMSC',
              '53 em 24 h · maior M4.7 · EMSC',
            ),
          )}
        />
      </div>
      <div className="f-stack">
        <div className="f-section-head">
          <Segmented
            label={t('Vista', 'View', 'Visualização')}
            value={view}
            onChange={setView}
            options={[
              { value: 'list', label: t('Lista', 'List', 'Lista') },
              { value: 'map', label: t('Mapa', 'Map', 'Mapa') },
            ]}
          />
          <Button variant="secondary">{t('Filtros', 'Filters', 'Filtros')}</Button>
        </div>
        {view === 'list' ? (
          <QuakeList lang={lang} items={sample} />
        ) : (
          <MapFrame size="tall">
            <MockMap lang={lang} />
          </MapFrame>
        )}
        <Note
          more={<a href="#fuentes">{t('Cómo leer esto', 'How to read this', 'Como ler isto')}</a>}
        >
          {t(
            'Magnitud según EMSC; cada agencia la calcula a su manera. No indica el riesgo donde estás.',
            'Magnitude per EMSC; each agency calculates it its own way. It does not indicate the risk where you are.',
            'Magnitude segundo o EMSC; cada agência a calcula à sua maneira. Não indica o risco onde você está.',
          )}
        </Note>
      </div>
    </div>
  );
}

export function MockHelp({ lang, onScreen }: { lang: Lang; onScreen: (s: MockScreen) => void }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const numbers = emergencyFor('PA')
    ?.numbers.slice(0, 3)
    .map((n) => n.number)
    .join(' · ');
  return (
    <div className="f-column">
      <ScreenHead title={t('Ayuda', 'Help', 'Ajuda')} />
      <List>
        <ListRow
          lead={<RowIcon icon={<PhoneIcon size={20} />} />}
          title={t('Números de emergencia', 'Emergency numbers', 'Números de emergência')}
          meta={numbers}
          onClick={() => onScreen('emergency')}
        />
        <ListRow
          lead={<RowIcon icon={<FlagIcon size={20} />} />}
          title={t('Tu embajada', 'Your embassy', 'Sua embaixada')}
          meta={t('Elige tu nacionalidad', 'Choose your nationality', 'Escolha sua nacionalidade')}
          onClick={() => {}}
        />
        <ListRow
          lead={<RowIcon icon={<FirstAidIcon size={20} />} />}
          title={t('Farmacias y hospitales', 'Pharmacies and hospitals', 'Farmácias e hospitais')}
          meta={t(
            'Cerca de ti, en Google Maps',
            'Near you, in Google Maps',
            'Perto de você, no Google Maps',
          )}
          onClick={() => {}}
        />
        <ListRow
          lead={<RowIcon icon={<UsersThreeIcon size={20} />} />}
          title={t('Para tu familia', 'For your family', 'Para sua família')}
          meta={t(
            'Líneas consulares desde casa',
            'Consular lines from home',
            'Linhas consulares de casa',
          )}
          onClick={() => {}}
        />
        <ListRow
          lead={<RowIcon icon={<HouseLineIcon size={20} />} />}
          title={t('Albergues', 'Shelters', 'Abrigos')}
          meta={t(
            'Los que publica SINAPROC',
            'As published by SINAPROC',
            'Os publicados pelo SINAPROC',
          )}
          onClick={() => {}}
        />
        <ListRow
          lead={<RowIcon icon={<MapTrifoldIcon size={20} />} />}
          title={t('Mapa sin conexión', 'Offline map', 'Mapa off-line')}
          meta={t('En la app de Google Maps', 'In the Google Maps app', 'No app do Google Maps')}
          onClick={() => {}}
        />
        <ListRow
          lead={<RowIcon icon={<BuildingsIcon size={20} />} />}
          title={t('Organismos oficiales', 'Official agencies', 'Órgãos oficiais')}
          meta="SINAPROC · IMHPA · IGC · SUME"
          onClick={() => {}}
        />
      </List>
      <ScopeNote>
        {t(
          'Faro enlaza a cada servicio; solo comparte tu ubicación cuando tocas una búsqueda.',
          'Faro links to each service; it shares your location only when you tap a search.',
          'O Faro leva a cada serviço; só compartilha sua localização quando você toca em uma busca.',
        )}
      </ScopeNote>
    </div>
  );
}

export function MockEmergency({ lang }: { lang: Lang }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const i = langIndex(lang);
  const directory = emergencyFor('PA');
  const [main, ...others] = directory?.numbers ?? [];
  const [kind, setKind] = useState<EmergencyKind>('earthquake');
  const steps = hazardSteps[kind];
  return (
    <div className="f-column">
      <ScreenHead title={t('Emergencia', 'Emergency', 'Emergência')} />
      {main && (
        <CallButton
          number={main.number}
          label={t(`Llamar al ${main.number}`, `Call ${main.number}`, `Ligar para ${main.number}`)}
          note={t(
            'Policía, bomberos y ambulancia',
            'Police, fire and ambulance',
            'Polícia, bombeiros e ambulância',
          )}
        />
      )}
      <Section
        id="spec-other"
        title={t('Si el 911 no entra', 'If 911 does not answer', 'Se o 911 não atender')}
      >
        <List>
          {others.map((n) => (
            <PhoneRow key={n.number} number={n.number} name={n.label[i]} />
          ))}
        </List>
        <SourceStamp issuer={directory?.agency}>
          {nb(
            t(
              'fuente oficial, revisada el 14 oct',
              'official source, checked 14 Oct',
              'fonte oficial, revisada em 14 out',
            ),
          )}
        </SourceStamp>
      </Section>
      <Section id="spec-first" title={t('Primeros minutos', 'First minutes', 'Primeiros minutos')}>
        <Segmented
          block
          label={t('Qué está pasando', 'What is happening', 'O que está acontecendo')}
          value={kind}
          onChange={setKind}
          options={emergencyKinds.map((k) => ({ value: k.id, label: k.short[i] }))}
        />
        <Steps items={steps.slice(0, 3).map((s) => ({ id: s.id, text: s.text[i] }))} />
        <Button variant="secondary">
          {t(
            `Ver los ${steps.length} pasos`,
            `See all ${steps.length} steps`,
            `Ver os ${steps.length} passos`,
          )}
          <CaretRightIcon size={18} aria-hidden="true" />
        </Button>
      </Section>
      <Section id="spec-more" title={t('Después', 'Next', 'Depois')}>
        <List>
          <ListRow
            lead={<RowIcon icon={<ChatCircleTextIcon size={20} />} />}
            title={t('Avisar cómo estoy', 'Tell people how I am', 'Avisar como estou')}
            meta={t(
              'Prepara un mensaje y envíalo tú',
              'Prepare a message, send it yourself',
              'Prepare uma mensagem e envie',
            )}
            onClick={() => {}}
          />
          <ListRow
            lead={<RowIcon icon={<FlagIcon size={20} />} />}
            title={t('Tu embajada', 'Your embassy', 'Sua embaixada')}
            meta={t(
              'Elige tu nacionalidad',
              'Choose your nationality',
              'Escolha sua nacionalidade',
            )}
            onClick={() => {}}
          />
          <ListRow
            lead={<RowIcon icon={<BookOpenTextIcon size={20} />} />}
            title={t('Guía completa', 'Full guide', 'Guia completo')}
            meta={t(
              'Sismo, tsunami, huracán y más',
              'Earthquake, tsunami, hurricane and more',
              'Terremoto, tsunami, furacão e mais',
            )}
            onClick={() => {}}
          />
        </List>
      </Section>
      <ScopeNote>
        {t(
          'Al tocar un número se abre tu teléfono. Faro no llama ni pide ayuda por ti.',
          'Tapping a number opens your phone. Faro does not call or request help for you.',
          'Tocar em um número abre o seu telefone. O Faro não liga nem pede ajuda por você.',
        )}
      </ScopeNote>
    </div>
  );
}

export function MockCountry({
  lang,
  onLang,
  onBack,
}: {
  lang: Lang;
  onLang: (l: Lang) => void;
  onBack: () => void;
}) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const names = new Intl.DisplayNames([lang], { type: 'region' });
  const meta = (code: string) => {
    const n = emergencyFor(code)?.numbers[0]?.number;
    return n ? t(`Emergencias ${n}`, `Emergencies ${n}`, `Emergências ${n}`) : undefined;
  };
  return (
    <div className="f-column">
      <div className="f-stack" data-gap="sm">
        <BackLink onClick={onBack}>{t('Situación', 'Situation', 'Situação')}</BackLink>
        <ScreenHead title={t('País', 'Country', 'País')} />
      </div>
      <div className="f-stack">
        <Field
          id="spec-country"
          label={t('Buscar un país', 'Search for a country', 'Buscar um país')}
          type="search"
          autoComplete="off"
        />
        <Button variant="secondary" icon={<CrosshairIcon size={20} aria-hidden="true" />}>
          {t('Usar mi ubicación', 'Use my location', 'Usar minha localização')}
        </Button>
      </div>
      <Section id="spec-saved" title={t('Guardados', 'Saved', 'Salvos')}>
        <List>
          <ListRow
            title={names.of('PA')}
            meta={meta('PA')}
            trail={<CheckIcon size={18} aria-hidden="true" />}
            onClick={() => {}}
          />
          <ListRow title={names.of('CR')} meta={meta('CR')} onClick={() => {}} />
        </List>
      </Section>
      <Section id="spec-language" title={t('Idioma', 'Language', 'Idioma')}>
        <Segmented
          block
          label={t('Idioma', 'Language', 'Idioma')}
          value={lang}
          onChange={onLang}
          options={[
            { value: 'es', label: 'Español' },
            { value: 'en', label: 'English' },
            { value: 'pt', label: 'Português' },
          ]}
        />
      </Section>
      <Section id="spec-all" title={t('Todos los países', 'All countries', 'Todos os países')}>
        <List>
          {['AR', 'CL', 'CO', 'MX'].map((c) => (
            <ListRow key={c} title={names.of(c)} meta={meta(c)} onClick={() => {}} />
          ))}
        </List>
      </Section>
    </div>
  );
}
