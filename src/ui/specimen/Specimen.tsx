/**
 * Design-system specimen (development only, /?muestra): the screens to approve, then the
 * foundations and every component, in ES/EN/PT. It renders the same components the app uses.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ChatCircleTextIcon,
  DropIcon,
  HurricaneIcon,
  MountainsIcon,
  PhoneIcon,
  WavesIcon,
  WifiSlashIcon,
} from '@phosphor-icons/react';
import { isLang, pick, type Lang } from '../../lib/i18n.ts';
import {
  Badge,
  Button,
  CallButton,
  Field,
  List,
  ListRow,
  Magnitude,
  Note,
  PhoneRow,
  SafetyNotice,
  ScopeNote,
  Section,
  Segmented,
  Skeleton,
  SourceStamp,
  StatusChip,
  StatusIcon,
} from '../index.ts';
import { MockApp, type MockScreen } from './mocks.tsx';

type Screen = MockScreen;

function Phone({
  lang,
  onLang,
  start,
  caption,
}: {
  lang: Lang;
  onLang: (l: Lang) => void;
  start: Screen;
  caption: string;
}) {
  const [screen, setScreen] = useState<Screen>(start);
  return (
    <figure className="spec-device-wrap">
      <div className="spec-device">
        <MockApp lang={lang} onLang={onLang} screen={screen} onScreen={setScreen} />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

function Desktop({ lang, onLang }: { lang: Lang; onLang: (l: Lang) => void }) {
  const [screen, setScreen] = useState<Screen>('activity');
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setScale(Math.min(1, el.clientWidth / 1440)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={box} className="spec-desktop-box" style={{ height: 900 * scale }}>
      <div className="spec-desktop" style={{ transform: `scale(${scale})` }}>
        <MockApp lang={lang} onLang={onLang} screen={screen} onScreen={setScreen} />
      </div>
    </div>
  );
}

const colours: [string, string][] = [
  ['--f-color-text', 'Texto'],
  ['--f-color-text-muted', 'Texto secundario'],
  ['--f-color-page', 'Fondo'],
  ['--f-color-surface', 'Superficie'],
  ['--f-color-border', 'Borde'],
  ['--f-color-action', 'Acción y marca'],
  ['--f-color-ok', 'Respondió / al día'],
  ['--f-color-call', 'Llamar (único rojo)'],
  ['--f-color-level-1', 'Nivel oficial 1 · dato viejo'],
  ['--f-color-level-2', 'Nivel oficial 2'],
  ['--f-color-level-3', 'Nivel oficial 3'],
  ['--f-color-focus', 'Foco'],
];
/** The only type roles; each sample uses the role's exact size and weight. */
const roles: [string, string, string, string][] = [
  ['Título de pantalla', '28 / 700', 'var(--f-text-2xl)', 'var(--f-weight-bold)'],
  ['Título de sección · cifra', '18 / 700', 'var(--f-text-lg)', 'var(--f-weight-bold)'],
  ['Etiqueta: filas, botones, campos', '16 / 600', 'var(--f-text-md)', 'var(--f-weight-medium)'],
  ['Texto', '16 / 400', 'var(--f-text-md)', 'var(--f-weight-regular)'],
  ['Descripción, fuente, notas', '14 / 400', 'var(--f-text-sm)', 'var(--f-weight-regular)'],
];

function Block({ title, children, note }: { title: string; children: ReactNode; note?: string }) {
  return (
    <section className="spec-block">
      <h3>{title}</h3>
      {note && <p className="spec-block-note">{note}</p>}
      <div className="spec-block-body">{children}</div>
    </section>
  );
}

const screens: Record<string, Screen> = {
  situacion: 'activity',
  emergencia: 'emergency',
  pais: 'country',
  sismos: 'quakes',
  ayuda: 'help',
  evento: 'event',
};

/** One mockup filling the window (/?muestra&pantalla=situacion), to try it on a real phone. */
function FullScreen({ start }: { start: Screen }) {
  const asked = new URLSearchParams(location.search).get('idioma');
  const [lang, setLang] = useState<Lang>(isLang(asked) ? asked : 'es');
  const [screen, setScreen] = useState<Screen>(start);
  return <MockApp lang={lang} onLang={setLang} screen={screen} onScreen={setScreen} />;
}

export default function Specimen() {
  const only = screens[new URLSearchParams(location.search).get('pantalla') ?? ''];
  return only ? <FullScreen start={only} /> : <Catalogue />;
}

function Catalogue() {
  const [lang, setLang] = useState<Lang>('es');
  const [chip, setChip] = useState<'earthquake' | 'hurricane' | 'flood'>('earthquake');
  const [view, setView] = useState<'list' | 'map'>('list');
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  return (
    <div className="spec f-root">
      <header className="spec-top">
        <div>
          <p className="spec-kicker">Faro · sistema de diseño</p>
          <h1>Muestra para aprobar</h1>
        </div>
        <Segmented
          label="Idioma de las maquetas"
          value={lang}
          onChange={setLang}
          options={[
            { value: 'es', label: 'ES' },
            { value: 'en', label: 'EN' },
            { value: 'pt', label: 'PT' },
          ]}
        />
      </header>

      <section className="spec-section">
        <h2>1. Pantallas en el teléfono</h2>
        <p className="spec-lead">
          Encabezado de una línea, seis pestañas de una palabra, inicio con el tablero de peligros y
          Emergencia. Son interactivas: «Panamá ▾» abre la pantalla de país, «Emergencia» y «Qué
          hacer ahora» abren Emergencia.
        </p>
        <div className="spec-devices">
          <Phone lang={lang} onLang={setLang} start="activity" caption="Situación, día normal" />
          <Phone
            lang={lang}
            onLang={setLang}
            start="event"
            caption="Situación, día con aviso y sin conexión"
          />
          <Phone lang={lang} onLang={setLang} start="emergency" caption="Emergencia" />
          <Phone
            lang={lang}
            onLang={setLang}
            start="quakes"
            caption="Sismos (desde la fila Sismos)"
          />
          <Phone lang={lang} onLang={setLang} start="help" caption="Ayuda (índice)" />
          <Phone lang={lang} onLang={setLang} start="country" caption="País (desde «Panamá ▾»)" />
        </div>
      </section>

      <section className="spec-section">
        <h2>2. Escritorio (1440 px)</h2>
        <p className="spec-lead">
          Barra lateral con la marca, Emergencia y el menú; barra superior con el país, la frescura
          de los datos y el idioma; columna de lectura con el mapa al lado.
        </p>
        <Desktop lang={lang} onLang={setLang} />
      </section>

      <section className="spec-section">
        <h2>3. Fundamentos</h2>
        <Block
          title="Color: un significado por color"
          note="El rojo solo llama. Ámbar, naranja y rojo de aviso solo para niveles oficiales."
        >
          <div className="spec-swatches">
            {colours.map(([token, name]) => (
              <div key={token} className="spec-swatch">
                <span style={{ background: `var(${token})` }} />
                <strong>{name}</strong>
                <code>{token}</code>
              </div>
            ))}
          </div>
        </Block>
        <Block
          title="Tipografía: cinco roles, nada más"
          note="Public Sans. Cada texto de la app usa uno de estos roles; 13 px solo para atribución legal y 12 px solo para las pestañas."
        >
          <div className="spec-type">
            {roles.map(([use, spec, size, weight]) => (
              <div key={use}>
                <span style={{ fontSize: size, fontWeight: weight, lineHeight: 1.25 }}>
                  {t(
                    'Qué está pasando en Panamá',
                    'What is happening in Panama',
                    'O que está acontecendo no Panamá',
                  )}
                </span>
                <small>
                  {spec} · {use}
                </small>
              </div>
            ))}
          </div>
        </Block>
        <Block
          title="Espacio y forma"
          note="Retícula de 4 px; radios de 8, 12 y redondo; una sola sombra para lo que flota."
        >
          <div className="spec-space">
            {[1, 2, 3, 4, 6, 8, 12].map((n) => (
              <span key={n} style={{ width: `var(--f-space-${n})` }} title={`--f-space-${n}`} />
            ))}
          </div>
        </Block>
      </section>

      <section className="spec-section">
        <h2>4. Componentes</h2>
        <div className="spec-grid">
          <Block
            title="Llamar y otros números"
            note="La llamada es el botón grande en rojo, nunca más ancho que un teléfono. Los demás números van en una lista igual para todos."
          >
            <CallButton
              number="911"
              label={t('Llamar al 911', 'Call 911', 'Ligar para 911')}
              note={t(
                'Policía, bomberos y ambulancia',
                'Police, fire and ambulance',
                'Polícia, bombeiros e ambulância',
              )}
            />
            <List>
              <PhoneRow
                number="104"
                name={t('Policía Nacional', 'National Police', 'Polícia Nacional')}
              />
              <PhoneRow
                number="+507 520-4426"
                name={t(
                  'SINAPROC · Protección Civil',
                  'SINAPROC · Civil Protection',
                  'SINAPROC · Proteção civil',
                )}
              />
            </List>
          </Block>
          <Block
            title="Botones: una familia, dos tamaños"
            note="44 px y 56 px. Principal, secundario y texto; el rojo solo para llamar."
          >
            <Button>{t('Revisar mensaje', 'Review message', 'Revisar mensagem')}</Button>
            <Button variant="secondary" icon={<ChatCircleTextIcon size={20} aria-hidden="true" />}>
              {t('Avisar cómo estoy', 'Tell people how I am', 'Avisar como estou')}
            </Button>
            <Button variant="ghost">
              {t('Ver todos los pasos', 'See all steps', 'Ver todos os passos')}
            </Button>
            <Button disabled>
              {t('Elige una opción', 'Choose an option', 'Escolha uma opção')}
            </Button>
          </Block>
          <Block
            title="Filas: título y una línea, siempre"
            note="Título 16 semibold; debajo, una línea de 14 con estado y hora. El círculo lleva el ícono del peligro: con el color del nivel oficial si hay algo vigente, neutro si no hay nada, apagado sin respuesta útil y pulsando mientras consulta. Las filas de acción usan el mismo círculo, neutro, para que todo el texto empiece en el mismo borde."
          >
            <List>
              <ListRow
                lead={
                  <StatusIcon
                    state="listed"
                    level={2}
                    icon={<HurricaneIcon size={20} weight="bold" />}
                  />
                }
                title={t('Ciclones', 'Cyclones', 'Ciclones')}
                badge={
                  <Badge level={2}>{t('Alerta naranja', 'Orange alert', 'Alerta laranja')}</Badge>
                }
                meta={t(
                  'Tormenta tropical · 09:00',
                  'Tropical storm · 09:00',
                  'Tempestade tropical · 09:00',
                )}
                onClick={() => {}}
              />
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
              <ListRow
                lead={
                  <StatusIcon state="pending" icon={<MountainsIcon size={20} weight="bold" />} />
                }
                title={t('Volcanes', 'Volcanoes', 'Vulcões')}
                meta={
                  <>
                    {t('Consultando GDACS…', 'Checking GDACS…', 'Consultando GDACS…')}{' '}
                    <Skeleton width="3rem" />
                  </>
                }
                onClick={() => {}}
              />
              <ListRow
                lead={<StatusIcon state="unknown" icon={<DropIcon size={20} weight="fill" />} />}
                title={t('Inundaciones', 'Floods', 'Inundações')}
                meta={
                  <SourceStamp state="stale">
                    {t(
                      'Sin respuesta desde 13:10',
                      'No answer since 13:10',
                      'Sem resposta desde 13:10',
                    )}
                  </SourceStamp>
                }
                onClick={() => {}}
              />
            </List>
          </Block>
          <Block
            title="Niveles oficiales"
            note="El nivel siempre escrito con las palabras de la agencia; el color solo lo acompaña."
          >
            <div className="spec-row">
              <Badge level={1}>{t('Aviso', 'Warning', 'Aviso')}</Badge>
              <Badge level={2}>{t('Alerta naranja', 'Orange alert', 'Alerta laranja')}</Badge>
              <Badge level={3}>{t('Alerta roja', 'Red alert', 'Alerta vermelho')}</Badge>
            </div>
          </Block>
          <Block
            title="Tres niveles de nota"
            note="Seguridad cambia lo que haces; Nota explica cómo leer; Alcance dice qué no hace Faro, una vez por pantalla."
          >
            <SafetyNotice>
              {t(
                'En la costa, si el sismo fue fuerte o largo: ve a pie a lo alto ya.',
                'On the coast, after strong or long shaking: go on foot to high ground now.',
                'No litoral, após tremor forte ou longo: vá a pé para um lugar alto já.',
              )}
            </SafetyNotice>
            <Note
              more={
                <a href="#fuentes">{t('Cómo leer esto', 'How to read this', 'Como ler isto')}</a>
              }
            >
              {t(
                'Cada agencia calcula la magnitud a su manera.',
                'Each agency calculates magnitude its own way.',
                'Cada agência calcula a magnitude à sua maneira.',
              )}
            </Note>
            <ScopeNote>
              {t(
                'Faro no llama ni avisa por ti. Tus datos quedan en este navegador.',
                'Faro does not call or alert anyone for you. Your data stays in this browser.',
                'O Faro não liga nem avisa ninguém por você. Seus dados ficam neste navegador.',
              )}
            </ScopeNote>
          </Block>
          <Block title="Fuente y hora, una sola gramática">
            <SourceStamp issuer="EMSC">
              {t(
                'publicado 12:36 · hace 10 min',
                'issued 12:36 · 10 min ago',
                'publicado 12:36 · há 10 min',
              )}
            </SourceStamp>
            <SourceStamp issuer="NOAA/PTWC" state="stale">
              {t(
                'sin actualizar desde 12:46',
                'not updated since 12:46',
                'sem atualizar desde 12:46',
              )}
            </SourceStamp>
            <StatusChip>
              <WifiSlashIcon size={16} aria-hidden="true" />
              {t(
                'Sin conexión · datos de 12:54',
                'Offline · data from 12:54',
                'Sem conexão · dados de 12:54',
              )}
            </StatusChip>
          </Block>
          <Block title="Magnitud: la cifra manda, el color solo oscurece">
            <div className="spec-row">
              {[3.4, 4.6, 5.2, 6.1, 7.7].map((m) => (
                <Magnitude key={m} value={m} />
              ))}
              <Magnitude value={7.7} size="lg" label={t('magnitud', 'magnitude', 'magnitude')} />
            </div>
          </Block>
          <Block title="Elegir y filtrar">
            <Segmented
              block
              label="Peligro"
              value={chip}
              onChange={setChip}
              options={[
                { value: 'earthquake', label: t('Sismo', 'Earthquake', 'Terremoto') },
                { value: 'hurricane', label: t('Huracán', 'Hurricane', 'Furacão') },
                { value: 'flood', label: t('Inundación', 'Flood', 'Inundação') },
              ]}
            />
            <Segmented
              label="Vista"
              value={view}
              onChange={setView}
              options={[
                { value: 'list', label: t('Lista', 'List', 'Lista') },
                { value: 'map', label: t('Mapa', 'Map', 'Mapa') },
              ]}
            />
          </Block>
          <Block title="Campo">
            <Field
              id="spec-name"
              label={t('Tu nombre', 'Your name', 'Seu nome')}
              hint={t(
                'Solo se usa en tu mensaje.',
                'Only used in your message.',
                'Usado só na sua mensagem.',
              )}
              autoComplete="off"
            />
          </Block>
          <Block title="Secciones y filas de navegación">
            <Section
              title={t('Ayuda', 'Help', 'Ajuda')}
              aside={t('Revisado jun 2026', 'Reviewed Jun 2026', 'Revisado jun 2026')}
            >
              <List>
                <ListRow
                  lead={<PhoneIcon size={20} aria-hidden="true" />}
                  title={t('Números', 'Numbers', 'Números')}
                  meta="911 · 104 · 103"
                  onClick={() => {}}
                />
                <ListRow
                  title={t(
                    'Farmacias y hospitales',
                    'Pharmacies and hospitals',
                    'Farmácias e hospitais',
                  )}
                  meta={t(
                    'Cerca de ti, en Google Maps',
                    'Near you, in Google Maps',
                    'Perto de você, no Google Maps',
                  )}
                  href="#"
                  external
                />
              </List>
            </Section>
          </Block>
        </div>
      </section>
    </div>
  );
}
