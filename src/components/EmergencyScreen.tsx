import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BookOpenTextIcon,
  ChatCircleTextIcon,
  FirstAidKitIcon,
  MapPinIcon,
  WhatsappLogoIcon,
  WavesIcon,
} from '@phosphor-icons/react';
import CountrySearch from './CountrySearch.tsx';
import { NationalWarningRow, feedLine } from './OfficialNow.tsx';
import {
  Actions,
  Button,
  CallButton,
  List,
  ListRow,
  Magnitude,
  Note,
  OutLink,
  PhoneRow,
  RowIcon,
  SafetyNotice,
  ScopeNote,
  ScreenHead,
  Section,
  Segmented,
  SourceStamp,
  Steps,
  Text,
} from '../ui/index.ts';
import { lineStamp } from '../lib/sourceStatus.ts';
import type { NationalWarning } from '../lib/national.ts';
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
import { displayPlace, placeLang, type Quake } from '../lib/domain.ts';
import { ageLabel } from '../lib/feedUpdates.ts';
import { atLabel } from '../lib/time.ts';
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
  onTrip: () => void;
  onActivity: (section?: 'tsunami') => void;
  /** Opens one earthquake's sheet. */
  onQuake: (q: Quake) => void;
};

/**
 * The emergency screen: the call action first and largest, then the first steps, consular
 * help, the meeting point and the latest earthquake. A screen rather than a sheet, so it can be
 * scrolled, linked from anywhere and kept open while calling.
 */
export default function EmergencyScreen(p: Props) {
  const { kind, onKind: setKind } = p;
  const country = p.country === 'WORLD' ? '' : p.country;
  const [editing, setEditing] = useState(false);
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
      'Boletines de tsunami (ya en lo alto)',
      'Tsunami bulletins (once on high ground)',
      'Boletins de tsunami (já em lugar alto)',
    ),
    status: t('Avisar cómo estoy', 'Tell people how I am', 'Avisar como estou'),
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
        {s.action && (s.action !== 'call' || local) && (
          <>
            {' '}
            <button type="button" className="f-inline-link" onClick={() => act(s.action!)}>
              {actionLabel[s.action]}
            </button>
          </>
        )}
      </>
    ),
  });
  const [main, ...others] = local?.numbers ?? [];
  // The warnings in force, as rows with the agency's level: the screen changes on a bad day.
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
      <List label={warned.agency}>
        {warned.items.map((w) => (
          <NationalWarningRow
            key={w.id}
            warning={w}
            agency={warned.agency}
            lang={p.lang}
            href={w.url || undefined}
          />
        ))}
      </List>
    </Section>
  );
  const consularLabel = (m: { emergency?: string; phone?: string }) =>
    m.emergency === m.phone
      ? t('Oficina y urgencias', 'Office and emergencies', 'Escritório e emergências')
      : t('Urgencias consulares', 'Consular emergencies', 'Emergências consulares');
  return (
    <div className="f-column" ref={root} lang={p.lang}>
      <ScreenHead title={t('Emergencia', 'Emergency', 'Emergência')} />
      {choosing ? (
        <section className="f-section" aria-labelledby="fw-emergency-where">
          <h2 id="fw-emergency-where" className="f-section-title" tabIndex={-1}>
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
          {main ? (
            <CallButton
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
          {/* On a bad day the screen changes under the call: the tsunami message, then the
              warnings in force. */}
          {p.alert}
          {warnings}
          {local && (others.length > 0 || local.whatsapp) && (
            <Section
              id="fw-emergency-other"
              title={t('Otros números', 'Other numbers', 'Outros números')}
            >
              <List>
                {others.map((n) => (
                  <PhoneRow key={n.number} number={n.number} name={n.label[idx]} />
                ))}
                {/* A text line for when calls do not go through but data does. */}
                {local.whatsapp && (
                  <ListRow
                    href={whatsappHref(local.whatsapp.number)}
                    external
                    figure
                    title={local.whatsapp.number}
                    meta={local.whatsapp.label[idx]}
                    trail={<WhatsappLogoIcon size={20} weight="fill" aria-hidden="true" />}
                  />
                )}
              </List>
            </Section>
          )}
          {/* The country's own caveat, e.g. what to dial if 911 does not answer. */}
          {local?.note && <SafetyNotice>{local.note[idx]}</SafetyNotice>}
          {local && (
            <Note
              more={
                <OutLink href={local.source}>
                  {t('Fuente oficial', 'Official source', 'Fonte oficial')}
                </OutLink>
              }
            >
              {t(
                'Para llamar dentro del país',
                'For calls within the country',
                'Para ligações dentro do país',
              )}
              {' · '}
              {t('revisada el', 'reviewed', 'revisada em')} {reviewDate(local.reviewedAt, p.lang)}.
            </Note>
          )}
        </>
      )}

      {choosing && p.alert}
      {choosing && warnings}

      <section className="f-section" aria-labelledby="fw-first-minutes-title">
        <h2 id="fw-first-minutes-title" className="f-section-title" tabIndex={-1}>
          {t('Primeros minutos', 'First minutes', 'Primeiros minutos')}
        </h2>
        <Segmented
          block
          label={t('Qué está pasando', 'What is happening', 'O que está acontecendo')}
          value={kind}
          onChange={setKind}
          options={emergencyKinds.map((k) => ({ value: k.id, label: k.short[idx] }))}
        />
        <Steps items={hazardSteps[kind].map(step)} />
      </section>

      <section className="f-section" aria-labelledby="fw-any-emergency-title">
        <h2 id="fw-any-emergency-title" className="f-section-title">
          {t('En cualquier emergencia', 'In any emergency', 'Em qualquer emergência')}
        </h2>
        <Steps items={generalSteps.map(step)} />
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

      {!choosing && (
        <section className="f-section" aria-labelledby="fw-emergency-embassy">
          <h2 id="fw-emergency-embassy" className="f-section-title" tabIndex={-1}>
            {p.nationality
              ? t(
                  `Tu embajada (${names.of(p.nationality)})`,
                  `Your embassy (${names.of(p.nationality)})`,
                  `Sua embaixada (${names.of(p.nationality)})`,
                )
              : t('Tu embajada', 'Your embassy', 'Sua embaixada')}
          </h2>
          {!p.nationality ? (
            <CountrySearch
              label={t(
                '¿De qué país eres? Para mostrarte tu embajada',
                'Where are you from? To show your embassy',
                'De que país você é? Para mostrar sua embaixada',
              )}
              lang={p.lang}
              value=""
              onChange={(code) => code && p.onNationality(code)}
            />
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
              <Button variant="secondary" onClick={p.onHelp}>
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
              lead={<RowIcon icon={<MapPinIcon size={20} />} />}
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
              title={<span lang={placeLang(latest)}>{displayPlace(latest.place)}</span>}
              meta={`${p.provider} · ${ageLabel(latest.time, p.now, p.lang)}${
                p.latestStaleSince
                  ? t(
                      ` · sin actualizar desde ${atLabel(p.latestStaleSince, p.now, p.lang)}`,
                      ` · not updated since ${atLabel(p.latestStaleSince, p.now, p.lang)}`,
                      ` · sem atualização desde ${atLabel(p.latestStaleSince, p.now, p.lang)}`,
                    )
                  : ''
              }`}
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

      <Section id="fw-emergency-next" title={t('Después', 'Next', 'Depois')}>
        <List>
          <ListRow
            lead={<RowIcon icon={<ChatCircleTextIcon size={20} />} />}
            title={t('Avisar cómo estoy', 'Tell people how I am', 'Avisar como estou')}
            meta={t(
              'Prepara un mensaje y envíalo tú',
              'Prepare a message, send it yourself',
              'Prepare uma mensagem e envie',
            )}
            onClick={p.onStatus}
          />
          <ListRow
            lead={<RowIcon icon={<FirstAidKitIcon size={20} />} />}
            title={t('Hospitales y farmacias', 'Hospitals and pharmacies', 'Hospitais e farmácias')}
            meta={t('En Ayuda', 'In Help', 'Em Ajuda')}
            onClick={p.onHelp}
          />
          <ListRow
            lead={<RowIcon icon={<WavesIcon size={20} />} />}
            title={t('Boletines de tsunami', 'Tsunami bulletins', 'Boletins de tsunami')}
            meta="NOAA/PTWC"
            onClick={() => p.onActivity('tsunami')}
          />
          <ListRow
            lead={<RowIcon icon={<BookOpenTextIcon size={20} />} />}
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
