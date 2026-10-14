import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  BookOpenTextIcon,
  CaretRightIcon,
  ChatCircleTextIcon,
  FirstAidKitIcon,
  MapPinIcon,
  PhoneIcon,
  WhatsappLogoIcon,
  WavesIcon,
} from '@phosphor-icons/react';
import CountrySearch from './CountrySearch.tsx';
import { PhoneButton, PhoneRow } from './Ui.tsx';
import { emergencyFor } from '../lib/emergency.ts';
import { reviewDate } from '../lib/links.ts';
import '../styles/emergency.css';
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
import { magnitudeBand } from '../lib/magnitude.ts';
import { displayPlace, placeLang, type Quake } from '../lib/domain.ts';
import { ageLabel } from '../lib/feedUpdates.ts';
import { atLabel } from '../lib/time.ts';
import { scrollMotion } from '../lib/motion.ts';
import { displayPhone, telHref, whatsappHref } from '../lib/phone.ts';
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
  /** An urgent official message (a recent tsunami threat), shown right after the numbers. */
  alert?: ReactNode;
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
      const steps = root.current?.querySelector<HTMLElement>('#fw-first-minutes-title');
      steps?.focus({ preventScroll: true });
      // Scroll only the app, below its top bar; scrollIntoView would also move the window and
      // hide the bar with the emergency button.
      const app = root.current?.closest<HTMLElement>('.fw-app');
      if (steps && app)
        app.scrollTo({
          top:
            steps.getBoundingClientRect().top -
            app.getBoundingClientRect().top +
            app.scrollTop -
            (parseFloat(getComputedStyle(app).scrollPaddingTop) || 0),
        });
      return;
    }
    root.current
      ?.querySelector<HTMLElement>('.fw-emergency-lines a, #fw-emergency-where')
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
          choosing ? '#fw-emergency-where' : '.fw-emergency-lines a, .fw-emergency-prompt',
        )
        ?.focus(),
    );
  }, [choosing, country]);

  const act = (action: FirstMinutesAction) => {
    if (action === 'tsunami') p.onActivity('tsunami');
    else if (action === 'status') p.onStatus();
    else {
      const call = root.current?.querySelector<HTMLElement>('.fw-emergency-lines a');
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
  const renderStep = (step: FirstMinutesStep) => (
    <li key={step.id}>
      <span>{step.text[idx]}</span>
      {step.action && (step.action !== 'call' || local) && (
        <button className="fw-text" onClick={() => act(step.action!)}>
          {actionLabel[step.action]}
        </button>
      )}
    </li>
  );
  return (
    <div className="fw-emergency-screen" ref={root} lang={p.lang}>
      {choosing ? (
        <section className="fw-emergency-country" aria-labelledby="fw-emergency-where">
          <h2 id="fw-emergency-where" tabIndex={-1}>
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
            <button className="fw-text" onClick={() => setEditing(false)}>
              {t(
                `Seguir en ${names.of(country)}`,
                `Stay in ${names.of(country)}`,
                `Manter ${names.of(country)}`,
              )}
            </button>
          )}
        </section>
      ) : (
        <section className="fw-emergency-call" aria-label={t('Llamar', 'Call', 'Ligar')}>
          {local ? (
            <div className="fw-emergency-lines">
              {local.numbers.map((n, i) => (
                <a key={n.number} className={i === 0 ? 'is-primary' : ''} href={telHref(n.number)}>
                  <PhoneIcon size={i === 0 ? 26 : 18} weight="fill" aria-hidden="true" />
                  <span>
                    <strong>
                      {i === 0 && `${t('Llamar al', 'Call', 'Ligar para o')} `}
                      <span className="fw-number">{n.number}</span>
                    </strong>{' '}
                    <small>{n.label[idx]}</small>
                  </span>
                </a>
              ))}
              {/* A text line for when calls do not go through but data does. */}
              {local.whatsapp && (
                <a href={whatsappHref(local.whatsapp.number)} target="_blank" rel="noreferrer">
                  <WhatsappLogoIcon size={18} weight="fill" aria-hidden="true" />
                  <span>
                    <strong>
                      <span className="fw-number">{local.whatsapp.number}</span>
                    </strong>{' '}
                    <small>{local.whatsapp.label[idx]}</small>
                  </span>
                </a>
              )}
            </div>
          ) : (
            <p className="fw-emergency-prompt" tabIndex={-1}>
              {t(
                'No tenemos teléfonos verificados para este país. Pregunta en tu alojamiento o a la autoridad local.',
                'We have no verified numbers for this country. Ask where you are staying or local authorities.',
                'Não temos números verificados para este país. Pergunte na sua hospedagem ou às autoridades locais.',
              )}
            </p>
          )}
          {/* The country's own caveat, e.g. what to dial if 911 does not answer. */}
          {local?.note && <p className="fw-emergency-note">{local.note[idx]}</p>}
          <p className="fw-emergency-meta">
            {local && (
              <>
                {t(
                  'Para llamar dentro del país.',
                  'For calls within the country.',
                  'Para ligações dentro do país.',
                )}{' '}
                <a href={local.source} target="_blank" rel="noreferrer">
                  {t('Fuente oficial', 'Official source', 'Fonte oficial')}
                </a>
                , {t('revisada el', 'reviewed', 'revisada em')}{' '}
                {reviewDate(local.reviewedAt, p.lang)}.
              </>
            )}
          </p>
          <div className="fw-emergency-jumps">
            {/* On a phone the embassy is below the first steps: one tap brings it up. */}
            {(!p.nationality || missions.length > 0 || support) && (
              <button
                className="fw-text"
                onClick={() => {
                  const embassy = root.current?.querySelector<HTMLElement>('#fw-emergency-embassy');
                  embassy?.scrollIntoView({ block: 'start', behavior: scrollMotion() });
                  embassy?.focus({ preventScroll: true });
                }}
              >
                {t('Ir a tu embajada', 'Go to your embassy', 'Ir para sua embaixada')}
              </button>
            )}
            <button className="fw-text" onClick={() => setEditing(true)}>
              {t(
                '¿Estás en otro país? Cámbialo',
                'In another country? Change it',
                'Em outro país? Altere',
              )}
            </button>
          </div>
        </section>
      )}

      {p.alert}

      <section className="fw-first-minutes" aria-labelledby="fw-first-minutes-title">
        <h2 id="fw-first-minutes-title" tabIndex={-1}>
          {t('Primeros minutos', 'First minutes', 'Primeiros minutos')}
        </h2>
        <div
          className="fw-emergency-kinds"
          role="radiogroup"
          aria-label={t('Qué está pasando', 'What is happening', 'O que está acontecendo')}
        >
          {emergencyKinds.map((k, i) => (
            <button
              key={k.id}
              role="radio"
              aria-checked={kind === k.id}
              // One tab stop for the group; arrow keys move between options, as radios do.
              tabIndex={kind === k.id ? 0 : -1}
              onClick={() => setKind(k.id)}
              onKeyDown={(e) => {
                const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
                if (!step) return;
                e.preventDefault();
                const n = (i + step + emergencyKinds.length) % emergencyKinds.length;
                setKind(emergencyKinds[n].id);
                const options =
                  e.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="radio"]');
                options?.[n]?.focus();
              }}
            >
              {k.label[idx]}
            </button>
          ))}
        </div>
        <ol>{hazardSteps[kind].map(renderStep)}</ol>
        <h3>{t('En cualquier emergencia', 'In any emergency', 'Em qualquer emergência')}</h3>
        <ul>{generalSteps.map(renderStep)}</ul>
        <p className="fw-emergency-sources">
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
        </p>
      </section>

      {!choosing && !p.nationality && (
        <section className="fw-emergency-consular" aria-labelledby="fw-emergency-embassy">
          <h2 id="fw-emergency-embassy" tabIndex={-1}>
            {t('Tu embajada', 'Your embassy', 'Sua embaixada')}
          </h2>
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
        </section>
      )}
      {!choosing && (missions.length > 0 || support) && (
        <section className="fw-emergency-consular" aria-labelledby="fw-emergency-embassy">
          <h2 id="fw-emergency-embassy" tabIndex={-1}>
            {t(
              `Tu embajada y la ayuda de ${names.of(p.nationality)}`,
              `Your embassy and help from ${names.of(p.nationality)}`,
              `Sua embaixada e ajuda do seu país (${names.of(p.nationality)})`,
            )}
          </h2>
          {missions.slice(0, 2).map((m) => (
            <div key={m.id} className="fw-emergency-consular-row">
              <p>
                <strong>{m.name[idx]}</strong>
                <small>{missionKinds[m.kind][idx]}</small>
              </p>
              <PhoneRow>
                {m.emergency && (
                  <PhoneButton
                    href={`tel:${m.emergency}`}
                    number={displayPhone(m.emergency)}
                    label={
                      m.emergency === m.phone
                        ? t(
                            'Oficina y urgencias',
                            'Office and emergencies',
                            'Escritório e emergências',
                          )
                        : t(
                            'Urgencias consulares',
                            'Consular emergencies',
                            'Emergências consulares',
                          )
                    }
                    tone="neutral"
                  />
                )}
                {m.phone && m.phone !== m.emergency && (
                  <PhoneButton
                    href={`tel:${m.phone}`}
                    number={displayPhone(m.phone)}
                    label={t('Oficina', 'Office', 'Escritório')}
                    tone="neutral"
                  />
                )}
              </PhoneRow>
            </div>
          ))}
          {support?.contacts.map((c) => (
            <div key={c.number} className="fw-emergency-consular-row">
              <p>
                <strong>{support.agency}</strong>
                <small>{c.scope[idx]}</small>
              </p>
              <PhoneRow>
                <PhoneButton href={`tel:${c.number}`} number={c.display} tone="neutral" />
              </PhoneRow>
            </div>
          ))}
          <p className="fw-emergency-note">
            {t(
              'Tu embajada ayuda a sus ciudadanos en el extranjero. Para un peligro inmediato, llama primero al número local.',
              'Your embassy helps its citizens abroad. For immediate danger, call the local number first.',
              'Sua embaixada ajuda os cidadãos do seu país no exterior. Em caso de perigo imediato, ligue primeiro para o número local.',
            )}
          </p>
        </section>
      )}
      {plan && (
        <section
          className="fw-emergency-plan"
          aria-label={t('Tu punto de encuentro', 'Your meeting point', 'Seu ponto de encontro')}
        >
          <MapPinIcon size={20} aria-hidden="true" />
          <p>
            <small>
              {t(
                'Tu punto de encuentro (nota personal, sin verificar)',
                'Your meeting point (personal note, not verified)',
                'Seu ponto de encontro (nota pessoal, não verificada)',
              )}
            </small>
            <strong>{plan.meeting}</strong>
            <span>{plan.name}</span>
          </p>
          <button className="fw-text" onClick={p.onTrip}>
            {t('Ver mi plan', 'See my plan', 'Ver meu plano')}
          </button>
        </section>
      )}
      {latest && (
        <button className="fw-emergency-latest" onClick={() => p.onActivity()}>
          <strong className={`fw-mag fw-mag-band-${magnitudeBand(latest.mag)}`}>
            <span className="fw-visually-hidden">{t('Magnitud', 'Magnitude', 'Magnitude')} </span>
            {latest.mag?.toFixed(1) ?? (
              <>
                <span aria-hidden="true">—</span>
                <span className="fw-visually-hidden">
                  {t('no informada', 'not reported', 'não informada')}
                </span>
              </>
            )}
          </strong>
          <span>
            <small>
              {t(
                'Último sismo publicado por',
                'Latest earthquake published by',
                'Último terremoto publicado por',
              )}{' '}
              {p.provider}
            </small>
            <b lang={placeLang(latest)}>{displayPlace(latest.place)}</b>
            <small>
              {ageLabel(latest.time, p.now, p.lang)}
              {p.latestStaleSince
                ? t(
                    ` · datos sin actualizar desde ${atLabel(p.latestStaleSince, p.now, p.lang)}`,
                    ` · data not updated since ${atLabel(p.latestStaleSince, p.now, p.lang)}`,
                    ` · dados sem atualização desde ${atLabel(p.latestStaleSince, p.now, p.lang)}`,
                  )
                : ''}
            </small>
          </span>
          <CaretRightIcon size={16} aria-hidden="true" />
        </button>
      )}

      <nav className="fw-emergency-next" aria-label={t('Más ayuda', 'More help', 'Mais ajuda')}>
        <button onClick={p.onStatus}>
          <ChatCircleTextIcon size={20} aria-hidden="true" />
          {t('Avisar cómo estoy', 'Tell people how I am', 'Avisar como estou')}
        </button>
        <button onClick={p.onHelp}>
          <FirstAidKitIcon size={20} aria-hidden="true" />
          {t('Hospitales y embajadas', 'Hospitals and embassies', 'Hospitais e embaixadas')}
        </button>
        <button onClick={() => p.onActivity('tsunami')}>
          <WavesIcon size={20} aria-hidden="true" />
          {t('Boletines de tsunami', 'Tsunami bulletins', 'Boletins de tsunami')}
        </button>
        <button onClick={() => p.onGuide(kind)}>
          <BookOpenTextIcon size={20} aria-hidden="true" />
          {t('Guía completa', 'Full guide', 'Guia completo')}
        </button>
      </nav>
    </div>
  );
}
