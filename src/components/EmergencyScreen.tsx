import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIcon,
  ChevronDownIcon,
  DropletIcon,
  FlagIcon,
  MapPinIcon,
  MessageCircleIcon,
  WindIcon,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import CountrySearch from './CountrySearch.tsx';
import { feedLine } from './OfficialNow.tsx';
import {
  Actions,
  AlertCard,
  Button,
  CallButton,
  HazardPicker,
  List,
  ListRow,
  Magnitude,
  Note,
  NumberTile,
  NumberTiles,
  OutLink,
  PhoneRow,
  RowIcon,
  ScopeNote,
  ScreenHead,
  Section,
  SourceStamp,
  Steps,
  Text,
} from '../ui/index.ts';
import { lineStamp } from '../lib/sourceStatus.ts';
import {
  readableEvent,
  severityLabels,
  severityLevel,
  type NationalWarning,
} from '../lib/national.ts';
import { emergencyFor } from '../lib/emergency.ts';
import { reviewDate } from '../lib/links.ts';
import {
  emergencyKinds,
  generalSteps,
  hazardSteps,
  type EmergencyKind,
  type FirstMinutesAction,
  type FirstMinutesStep,
} from '../data/firstMinutes.ts';
import { missionKinds, missionsFor } from '../data/consularMissions.ts';
import { supportFor } from '../data/travelerSupport.ts';
import type { Quake } from '../lib/domain.ts';
import { checkedLabel } from '../lib/time.ts';
import { quakeRegion, quakeTime } from '../lib/quakeText.ts';
import { scrollMotion } from '../lib/motion.ts';
import { displayPhone, whatsappHref } from '../lib/phone.ts';
import type { HotelPlan } from '../lib/resources.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
type Props = {
  country: string;
  lang: Lang;
  nationality: string;
  plan: HotelPlan | null;
  latest?: Quake;
  /** The earthquake data is old or failing: when it was last received. */
  latestStaleSince?: number;
  /** An urgent official message (a recent tsunami threat), shown right under the call button. */
  alert?: ReactNode;
  /**
   * The national warnings in force that lead Situación (level 2–3 and the flood warning), with
   * the state of their source, shown under the call button in the agency's words.
   */
  warnings?: {
    agency: string;
    items: NationalWarning[];
    checked: number | null;
    failed: boolean;
    failedAt?: number | null;
    stale: boolean;
    online: boolean;
  };
  provider: string;
  now: number;
  onCountry: (code: string) => void;
  /** Sets the nationality for this session so the embassy can be shown. */
  onNationality: (code: string) => void;
  /** The hazard chosen for the first steps; kept by the app so it survives leaving the screen. */
  kind: EmergencyKind;
  onKind: (kind: EmergencyKind) => void;
  /** Where the screen opens: the call button, or the first steps ("What to do now"). */
  start: 'call' | 'steps';
  /** Opens the full guide on the chosen hazard. */
  onGuide: (kind: EmergencyKind) => void;
  onStatus: () => void;
  onHelp: () => void;
  /** Ayuda, at the embassy section. */
  onEmbassy: () => void;
  onTrip: () => void;
  onActivity: (section?: 'tsunami') => void;
  /** Opens one earthquake's sheet. */
  onQuake: (q: Quake) => void;
};

/** The hazards of the picker, each with an icon the person can tell apart in a hurry. */
const hazardIcon: Record<EmergencyKind, ReactNode> = {
  earthquake: <ActivityIcon aria-hidden="true" />,
  hurricane: <WindIcon aria-hidden="true" />,
  flood: <DropletIcon aria-hidden="true" />,
};
/** How many of the chosen hazard's steps are shown before "See all N steps". */
const FIRST_STEPS = 4;
/**
 * A number listed with its country code ("+507 520-4426") is shown in a tile as it is dialled
 * in the country ("520-4426"), so it fits on one line; the link keeps the full number.
 */
const localPart = (number: string) => number.replace(/^\+\d+\s+/, '');

/**
 * The emergency screen: the call action first and largest, the other numbers as large tiles,
 * then what is happening and the first steps, with the rest one tap away in place; beside it
 * (under it on a phone) consular help, the meeting point, the latest earthquake and what comes
 * next. A screen rather than a sheet, so it can be scrolled, linked from anywhere and kept open
 * while calling.
 */
export default function EmergencyScreen(p: Props) {
  const { kind, onKind: setKind } = p;
  const country = p.country === 'WORLD' ? '' : p.country;
  const [editing, setEditing] = useState(false);
  // The remaining steps of the hazard and the general ones, opened in place under the first four.
  const [more, setMore] = useState(false);
  const choosing = editing || !country;
  const root = useRef<HTMLDivElement>(null);
  const t = (es: string, en: string, pt: string) => pick(p.lang, es, en, pt),
    idx = langIndex(p.lang);
  const names = new Intl.DisplayNames([p.lang], { type: 'region' });
  // Only verified, current listings with a phone; historical references never get a call action.
  const missions = p.nationality
    ? missionsFor(country, p.nationality).filter((m) => !m.historical && (m.phone || m.emergency))
    : [];
  // Only lines the traveler can call from abroad; lines for relatives at home stay in Local help.
  const supportFound = supportFor(p.nationality, country);
  const abroadLines = supportFound?.contacts.filter((c) => c.abroad) ?? [];
  const support = abroadLines.length ? { ...supportFound!, contacts: abroadLines } : undefined;
  const local = country ? emergencyFor(country) : undefined;
  const plan = p.plan && p.plan.country === country ? p.plan : null;
  const latest = p.latest && p.country === country ? p.latest : undefined;
  const latestRegion = latest ? quakeRegion(latest, p.lang, country) : null;

  // Arriving here, focus starts on the call button. Without a country it starts on the question,
  // not the search box, so the list and the phone keyboard do not open by themselves.
  // From "What to do now" it starts on the first steps, scrolled into view.
  useEffect(() => {
    if (p.start === 'steps' && country) {
      // After the frame: the app's own "new screen starts at the top" runs after this effect.
      const frame = requestAnimationFrame(() => reveal('#fw-first-minutes-title', 'auto'));
      return () => cancelAnimationFrame(frame);
    }
    root.current
      ?.querySelector<HTMLElement>('.f-call a, #fw-emergency-where')
      ?.focus({ preventScroll: true });
    // Only on arrival: later changes are handled below.
  }, []);
  // Changing country, focus follows: to the question, then to the new call button, so a screen
  // reader announces the new number instead of falling back to the page.
  const seen = useRef({ choosing, country });
  useEffect(() => {
    // Compares with what was on screen, so a repeated effect run changes nothing.
    if (seen.current.choosing === choosing && seen.current.country === country) return;
    seen.current = { choosing, country };
    requestAnimationFrame(() =>
      root.current
        ?.querySelector<HTMLElement>(
          choosing ? '#fw-emergency-where' : '.f-call a, [data-emergency-start]',
        )
        ?.focus(),
    );
  }, [choosing, country]);

  /**
   * Scrolls only the app to a heading, below its top bar, and focuses it. scrollIntoView would
   * also move the window and hide the bar with the emergency button.
   */
  function reveal(selector: string, behavior: ScrollBehavior = scrollMotion()) {
    const target = root.current?.querySelector<HTMLElement>(selector);
    const app = root.current?.closest<HTMLElement>('.f-content');
    if (!target) return;
    target.focus({ preventScroll: true });
    if (app)
      app.scrollTo({
        top:
          target.getBoundingClientRect().top -
          app.getBoundingClientRect().top +
          app.scrollTop -
          (parseFloat(getComputedStyle(app).scrollPaddingTop) || 0),
        behavior,
      });
  }

  const act = (action: FirstMinutesAction) => {
    if (action === 'tsunami') p.onActivity('tsunami');
    else if (action === 'status') p.onStatus();
    else {
      const call = root.current?.querySelector<HTMLElement>('.f-call a');
      call?.focus({ preventScroll: true });
      call?.scrollIntoView({ block: 'center', behavior: scrollMotion() });
    }
  };
  const actionLabel: Record<FirstMinutesAction, string> = {
    call: t('Ir a los números', 'Go to numbers', 'Ir aos números'),
    tsunami: t(
      'Boletines de tsunami (cuando estés a salvo)',
      'Tsunami bulletins (once you are safe)',
      'Boletins de tsunami (quando estiver em segurança)',
    ),
    status: t('Avisar cómo estoy', 'Check in', 'Avisar como estou'),
  };
  const steps = [...hazardSteps[kind], ...generalSteps];
  // One link per publisher, so the line stays short.
  const sources = steps
    .map((s) => s.source)
    .filter((s, i, all) => all.findIndex((x) => x.name === s.name) === i);
  const step = (s: FirstMinutesStep) => ({
    id: s.id,
    text: (
      <>
        {s.text[idx]}
        {/* The numbers are the first thing on this screen: no "go to the numbers" link here. */}
        {s.action && s.action !== 'call' && (
          <>
            {' '}
            <button
              type="button"
              className="f-inline-link inline cursor-pointer rounded-sm border-0 bg-transparent p-0 font-medium text-foreground underline underline-offset-4 outline-none hover:decoration-2 focus-visible:ring-[3px] focus-visible:ring-ring/50"
              onClick={() => act(s.action!)}
            >
              {actionLabel[s.action]}
            </button>
          </>
        )}
      </>
    ),
  });
  const [main, ...others] = local?.numbers ?? [];
  const first = hazardSteps[kind].slice(0, FIRST_STEPS);
  const rest = hazardSteps[kind].slice(FIRST_STEPS);
  // The warnings in force, as cards in the agency's level: the screen changes on a bad day.
  const warned = p.warnings && p.warnings.items.length > 0 ? p.warnings : null;
  const warnedLine = warned ? feedLine(warned, warned.online, p.now, p.lang) : null;
  const warnings = warned && (
    <Section
      id="fw-emergency-warnings"
      title={t('Avisos vigentes', 'Warnings in force', 'Avisos em vigor')}
      aside={
        warnedLine && (
          <SourceStamp issuer={warned.agency} state={lineStamp(warnedLine.state)}>
            {warnedLine.text}
          </SourceStamp>
        )
      }
    >
      <div className="grid gap-2" role="list" aria-label={warned.agency}>
        {warned.items.map((w) => (
          <div key={w.id} role="listitem">
            <AlertCard
              compact
              // The agency's severity on Faro's levels; one it does not state is drawn as the lowest.
              level={severityLevel[w.severity] ?? 1}
              // The agency publishes in Spanish: said once, for English and Portuguese.
              kicker={t(
                `Aviso del ${warned.agency}`,
                `${warned.agency} warning, in Spanish`,
                `Aviso do ${warned.agency}, em espanhol`,
              )}
              pill={severityLabels[w.severity][idx]}
              title={<span lang="es">{readableEvent(w.event)}</span>}
              // Opens the agency's own page for the warning, when it gives one.
              onClick={
                w.url ? () => window.open(w.url, '_blank', 'noopener,noreferrer') : undefined
              }
            />
          </div>
        ))}
      </div>
    </Section>
  );
  const consularLabel = (m: { emergency?: string; phone?: string }) =>
    m.emergency === m.phone
      ? t('Oficina y urgencias', 'Office and emergencies', 'Escritório e emergências')
      : t('Urgencias consulares', 'Consular emergencies', 'Emergências consulares');
  return (
    <div className="f-column f-two" ref={root} lang={p.lang}>
      <ScreenHead title={t('Emergencia', 'Emergency', 'Emergência')} />
      {/* Wide screens: calling and what to do, and beside it the rest (helpers.css, f-two). */}
      <div className="f-stack" data-gap="lg">
        {choosing ? (
          <section className="f-section @container grid gap-3" aria-labelledby="fw-emergency-where">
            <h2
              id="fw-emergency-where"
              className="f-section-title m-0 text-base leading-snug font-semibold"
              tabIndex={-1}
            >
              {t('¿En qué país estás?', 'Which country are you in?', 'Em que país você está?')}
            </h2>
            <p>
              {t(
                'Elige el país para ver sus teléfonos de emergencia.',
                'Choose the country to see its emergency numbers.',
                'Escolha o país para ver os números de emergência de lá.',
              )}
            </p>
            <CountrySearch
              label={t(
                'País donde necesitas ayuda',
                'Country where you need help',
                'País onde você precisa de ajuda',
              )}
              lang={p.lang}
              value={country}
              onChange={(code) => {
                if (!code) return;
                p.onCountry(code);
                setEditing(false);
              }}
            />
            {editing && country && (
              <Actions>
                <button type="button" onClick={() => setEditing(false)}>
                  {t(
                    `Seguir en ${names.of(country)}`,
                    `Stay in ${names.of(country)}`,
                    `Manter ${names.of(country)}`,
                  )}
                </button>
              </Actions>
            )}
          </section>
        ) : (
          <>
            {/* The numbers as one block: the main line, the other lines as tiles, the caveat. */}
            <div className="grid gap-3">
              {main ? (
                <CallButton
                  size="xl"
                  number={main.number}
                  label={t(
                    `Llamar al ${main.number}`,
                    `Call ${main.number}`,
                    `Ligar para ${main.number}`,
                  )}
                  note={main.label[idx]}
                />
              ) : (
                <Text tabIndex={-1} data-emergency-start="">
                  {t(
                    'No tenemos teléfonos verificados para este país. Pregunta en tu alojamiento o a la autoridad local.',
                    'We have no verified numbers for this country. Ask where you are staying or local authorities.',
                    'Não temos números verificados para este país. Pergunte na sua hospedagem ou às autoridades locais.',
                  )}
                </Text>
              )}
              {local && (others.length > 0 || local.whatsapp) && (
                <div id="fw-emergency-other">
                  <NumberTiles label={t('Otros números', 'Other numbers', 'Outros números')}>
                    {others.map((n) => (
                      <NumberTile
                        key={n.number}
                        number={localPart(n.number)}
                        dial={n.number}
                        name={n.label[idx]}
                      />
                    ))}
                    {/* A text line for when calls do not go through but data does. */}
                    {local.whatsapp && (
                      <NumberTile
                        number={localPart(local.whatsapp.number)}
                        name={local.whatsapp.label[idx]}
                        href={whatsappHref(local.whatsapp.number)}
                        icon={<MessageCircleIcon aria-hidden="true" />}
                      />
                    )}
                  </NumberTiles>
                </div>
              )}
              {/* The country's own caveat (what to dial if 911 does not answer), the scope of the
                numbers and their source: one muted line. */}
              {local && (
                <Note
                  more={
                    <OutLink href={local.source}>
                      {t('Fuente oficial', 'Official source', 'Fonte oficial')}
                    </OutLink>
                  }
                >
                  {local.note && <>{local.note[idx]} </>}
                  {t(
                    'Para llamar dentro del país',
                    'For calls within the country',
                    'Para ligações dentro do país',
                  )}
                  {' · '}
                  {t('revisada el', 'reviewed', 'revisada em')}{' '}
                  {reviewDate(local.reviewedAt, p.lang)}.
                </Note>
              )}
            </div>
            {/* On a bad day the screen changes under the numbers: the tsunami message, then the
              warnings in force. */}
            {p.alert}
            {warnings}
          </>
        )}

        {choosing && p.alert}
        {choosing && warnings}

        <section
          className="f-section @container grid gap-3"
          aria-labelledby="fw-first-minutes-title"
        >
          <h2
            id="fw-first-minutes-title"
            className="f-section-title m-0 text-base leading-snug font-semibold"
            tabIndex={-1}
          >
            {t('¿Qué está pasando?', 'What is happening?', 'O que está acontecendo?')}
          </h2>
          <HazardPicker
            label={t('Qué está pasando', 'What is happening', 'O que está acontecendo')}
            value={kind}
            onChange={setKind}
            options={emergencyKinds.map((k) => ({
              value: k.id,
              label: k.short[idx],
              icon: hazardIcon[k.id],
            }))}
          />
          <div className="grid gap-4">
            <Steps size="lg" items={first.map(step)} />
            {/* The rest of the hazard's steps, numbered on from the first four, then the steps
              for any emergency: one tap away, in place. The button at the end says how many
              steps the hazard has in all, and closes the list again. */}
            <Collapsible open={more} onOpenChange={setMore} className="grid gap-4">
              <CollapsibleContent
                id="fw-first-minutes-more"
                className="grid gap-8 motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0"
              >
                {rest.length > 0 && (
                  <Steps size="lg" start={FIRST_STEPS + 1} items={rest.map(step)} />
                )}
                <section
                  className="f-section @container grid gap-3"
                  aria-labelledby="fw-any-emergency-title"
                >
                  <h2
                    id="fw-any-emergency-title"
                    className="f-section-title m-0 text-base leading-snug font-semibold"
                  >
                    {t('En cualquier emergencia', 'In any emergency', 'Em qualquer emergência')}
                  </h2>
                  <Steps size="lg" items={generalSteps.map(step)} />
                  <Note>
                    {t('Fuentes', 'Sources', 'Fontes')}:{' '}
                    {sources.map((s, i) => (
                      <span key={s.url}>
                        {i > 0 && ', '}
                        <a href={s.url} target="_blank" rel="noreferrer">
                          {s.name}
                        </a>
                      </span>
                    ))}
                    .{' '}
                    {t(
                      'Sigue siempre las instrucciones de las autoridades locales.',
                      'Always follow instructions from local authorities.',
                      'Siga sempre as instruções das autoridades locais.',
                    )}
                  </Note>
                </section>
              </CollapsibleContent>
              {/* Lined up with the text of the steps (the number and its gap are 2.5 rem). */}
              <div className="ps-10">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" aria-controls="fw-first-minutes-more">
                    {more
                      ? t('Ver menos', 'Show less', 'Ver menos')
                      : t(
                          `Ver los ${hazardSteps[kind].length} pasos`,
                          `See all ${hazardSteps[kind].length} steps`,
                          `Ver os ${hazardSteps[kind].length} passos`,
                        )}
                    <ChevronDownIcon
                      className={cn(
                        'transition-transform motion-reduce:transition-none',
                        more && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </Collapsible>
          </div>
        </section>
      </div>

      <div className="f-stack" data-gap="lg" data-side="">
        {!choosing && (
          <section
            className="f-section @container grid gap-3"
            aria-labelledby="fw-emergency-embassy"
          >
            <h2
              id="fw-emergency-embassy"
              className="f-section-title m-0 text-base leading-snug font-semibold"
              tabIndex={-1}
            >
              {p.nationality
                ? t(
                    `Tu embajada (${names.of(p.nationality)})`,
                    `Your embassy (${names.of(p.nationality)})`,
                    `Sua embaixada (${names.of(p.nationality)})`,
                  )
                : t('Tu embajada', 'Your embassy', 'Sua embaixada')}
            </h2>
            {!p.nationality ? (
              // No search field on the screen used in a hurry: the nationality is chosen in Ayuda,
              // next to the embassy directory, and kept for the next visit.
              <List>
                <ListRow
                  lead={<RowIcon icon={<FlagIcon className="size-4" />} />}
                  title={t(
                    'Elige tu nacionalidad',
                    'Choose your nationality',
                    'Escolha sua nacionalidade',
                  )}
                  meta={t(
                    'En Ayuda, para ver tu embajada',
                    'In Help, to see your embassy',
                    'Em Ajuda, para ver sua embaixada',
                  )}
                  onClick={p.onEmbassy}
                />
              </List>
            ) : missions.length > 0 || support ? (
              <>
                <List>
                  {missions
                    .slice(0, 2)
                    .flatMap((m) => [
                      ...(m.emergency
                        ? [
                            <PhoneRow
                              key={`${m.id}-e`}
                              number={displayPhone(m.emergency)}
                              dial={m.emergency}
                              name={`${m.name[idx]} · ${consularLabel(m)}`}
                            />,
                          ]
                        : []),
                      ...(m.phone && m.phone !== m.emergency
                        ? [
                            <PhoneRow
                              key={`${m.id}-o`}
                              number={displayPhone(m.phone)}
                              dial={m.phone}
                              name={`${m.name[idx]} · ${t('Oficina', 'Office', 'Escritório')} · ${missionKinds[m.kind][idx]}`}
                            />,
                          ]
                        : []),
                    ])}
                  {support?.contacts.map((c) => (
                    <PhoneRow
                      key={c.number}
                      number={c.display}
                      dial={c.number}
                      name={`${support.agency} · ${c.scope[idx]}`}
                    />
                  ))}
                </List>
                <Note>
                  {t(
                    'Tu embajada ayuda a sus ciudadanos en el extranjero. Para un peligro inmediato, llama primero al número local.',
                    'Your embassy helps its citizens abroad. For immediate danger, call the local number first.',
                    'Sua embaixada ajuda os cidadãos do seu país no exterior. Em caso de perigo imediato, ligue primeiro para o número local.',
                  )}
                </Note>
              </>
            ) : (
              // A nationality without a verified phone here: said plainly, never a silent gap.
              <>
                <p>
                  {t(
                    `Faro no tiene un teléfono verificado de la embajada de ${names.of(p.nationality)} en ${names.of(country)}. En Ayuda están su dirección y su sitio oficial, si los tenemos. Para un peligro inmediato, llama primero al número local.`,
                    `Faro has no verified phone for the embassy of ${names.of(p.nationality)} in ${names.of(country)}. Help shows its address and official website, if we have them. For immediate danger, call the local number first.`,
                    `O Faro não tem um telefone verificado da embaixada do seu país (${names.of(p.nationality)}) neste país. Em Ajuda estão o endereço e o site oficial, se os tivermos. Em caso de perigo imediato, ligue primeiro para o número local.`,
                  )}
                </p>
                <Button variant="secondary" onClick={p.onEmbassy}>
                  {t('Ver en Ayuda', 'See in Help', 'Ver em Ajuda')}
                </Button>
              </>
            )}
          </section>
        )}

        {plan && (
          <Section
            id="fw-emergency-plan"
            title={t('Tu punto de encuentro', 'Your meeting point', 'Seu ponto de encontro')}
          >
            <List>
              <ListRow
                lead={<RowIcon icon={<MapPinIcon className="size-4" />} />}
                title={plan.meeting}
                meta={`${t(
                  'Tu punto de encuentro, nota personal sin verificar',
                  'Your meeting point, personal note not verified',
                  'Seu ponto de encontro, nota pessoal não verificada',
                )} · ${plan.name}`}
                onClick={p.onTrip}
              />
            </List>
          </Section>
        )}
        {latest && (
          <Section
            id="fw-emergency-latest"
            title={t('Último sismo', 'Latest earthquake', 'Último terremoto')}
          >
            <List>
              <ListRow
                lead={<Magnitude value={latest.mag} />}
                // Written as everywhere else (src/lib/quakeText.ts): when as the title, then where.
                title={quakeTime(latest.time, p.now, p.lang)}
                meta={
                  <>
                    {latestRegion && (
                      <>
                        <span lang={latestRegion.lang === p.lang ? undefined : latestRegion.lang}>
                          {latestRegion.text}
                        </span>
                        {' · '}
                      </>
                    )}
                    {p.provider}
                    {p.latestStaleSince &&
                      ` · ${t('último dato', 'last data', 'último dado')} ${checkedLabel(p.latestStaleSince, p.now, p.lang)}`}
                  </>
                }
                onClick={() => p.onQuake(latest)}
              />
            </List>
            {/* Right after a felt quake the list still shows an older one: said plainly. */}
            <Note>
              {t(
                '¿Acabas de sentir un sismo? Puede tardar varios minutos en aparecer.',
                'Just felt one? It can take several minutes to appear.',
                'Acabou de sentir um tremor? Pode levar vários minutos para aparecer.',
              )}
            </Note>
          </Section>
        )}

        {/* Simple rows, without icon squares: the names say what they open. */}
        <Section id="fw-emergency-next" title={t('Después', 'Next', 'Depois')}>
          <List>
            <ListRow
              title={t('Avisar cómo estoy', 'Check in', 'Avisar como estou')}
              meta={t(
                'Prepara un mensaje y envíalo tú',
                'Prepare a message, send it yourself',
                'Prepare uma mensagem e envie',
              )}
              onClick={p.onStatus}
            />
            <ListRow
              title={t(
                'Hospitales y farmacias',
                'Hospitals and pharmacies',
                'Hospitais e farmácias',
              )}
              meta={t('En Ayuda', 'In Help', 'Em Ajuda')}
              onClick={p.onHelp}
            />
            <ListRow
              title={t('Boletines de tsunami', 'Tsunami bulletins', 'Boletins de tsunami')}
              meta="NOAA/PTWC"
              onClick={() => p.onActivity('tsunami')}
            />
            <ListRow
              title={t('Guía completa', 'Full guide', 'Guia completo')}
              meta={t(
                'Sismo, tsunami, huracán y más',
                'Earthquake, tsunami, hurricane and more',
                'Terremoto, tsunami, furacão e mais',
              )}
              onClick={() => p.onGuide(kind)}
            />
          </List>
        </Section>
      </div>
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
