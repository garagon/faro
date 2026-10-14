import { useEffect, useState } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react';
import { ExternalLink } from './Ui.tsx';
import { checkedLabel } from '../lib/time.ts';
import { ageLabel } from '../lib/feedUpdates.ts';
import {
  instructionLines,
  nationalSignal,
  readableEvent,
  severityLabels,
  type NationalWarning,
} from '../lib/national.ts';
import {
  SINAPROC_HOME,
  lastPost,
  postTitle,
  postUpdate,
  recentPosts,
  type CivilPost,
} from '../lib/civil.ts';
import type { Destination, OfficialLink } from '../data/destinations/types.ts';
import {
  deviceTranslator,
  googlePageTranslation,
  googleTextTranslation,
} from '../lib/translate.ts';
import { langIndex, langTag, pick, type Lang } from '../lib/i18n.ts';

/** Spanish text of one message, as shown: its title, paragraphs and listed instructions. */
type Copy = { title: string; paragraphs: string[]; items: string[] };
type DeviceTranslator = NonNullable<Awaited<ReturnType<typeof deviceTranslator>>>;
/** A translation keeps the language it was made into, so a language change never shows it. */
type Translated = Copy & { to: Lang };

export type NationalFeed = {
  agency: string;
  warnings: NationalWarning[] | null;
  failed: boolean;
  partial: boolean;
  checked: number | null;
  stale: boolean;
};
export type CivilFeed = {
  agency: string;
  posts: CivilPost[] | null;
  failed: boolean;
  stale: boolean;
  checked: number | null;
  offline?: boolean;
};

/** DOM id of one row, from its source and identifier. */
export const officialRowId = (kind: 'w' | 'p', id: string | number) =>
  `fw-official-${kind}-${String(id).replace(/[^\w-]/g, '_')}`;

type Props = {
  lang: Lang;
  now: number;
  national?: NationalFeed;
  civil?: CivilFeed;
  /** The weather service's page when it has no feed Faro can read. */
  weather?: OfficialLink;
  /** Who reports water, power, roads and health, which Faro does not read. */
  services?: Destination['services'];
  /** Rows opened from elsewhere (the flood row), by DOM id. */
  open: Set<string>;
  onToggle: (rowId: string) => void;
};

/**
 * What the authorities are saying now, one line per message: warnings in force from the
 * national weather service first, then civil-protection posts. Each line opens in place.
 */
export default function OfficialNow({
  lang,
  now,
  national,
  civil,
  weather,
  services,
  open,
  onToggle,
}: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    idx = langIndex(lang);
  // Translation help is only shown to English and Portuguese readers.
  const help = (en: string, pt: string) => (lang === 'pt' ? pt : en);
  const [allPosts, setAllPosts] = useState(false);
  // Translation for people reading in English or Portuguese, into their language: on this device
  // when the browser can do it, otherwise through a Google Translate link. Always started by the
  // person, never automatic.
  const [device, setDevice] = useState<{ to: Lang; translator: DeviceTranslator } | null>(null);
  const [translated, setTranslated] = useState<Record<string, Translated>>({});
  const [translating, setTranslating] = useState<string | null>(null);
  const [translateFailed, setTranslateFailed] = useState<string | null>(null);
  useEffect(() => {
    if (lang === 'es') return;
    let current = true;
    void deviceTranslator('es', lang).then(
      (found) => current && setDevice(found && { to: lang, translator: found }),
    );
    return () => {
      current = false;
    };
  }, [lang]);
  const here = device?.to === lang ? device.translator : null;
  const translateHere = async (id: string, copy: Copy) => {
    if (!here) return;
    const to = lang;
    setTranslating(id);
    setTranslateFailed(null);
    try {
      const tr = (text: string) => here.translate(text);
      const result = {
        title: await tr(copy.title),
        paragraphs: await Promise.all(copy.paragraphs.map(tr)),
        items: await Promise.all(copy.items.map(tr)),
        to,
      };
      setTranslated((prev) => ({ ...prev, [id]: result }));
    } catch {
      setTranslateFailed(id);
    } finally {
      setTranslating(null);
    }
  };
  const showOriginal = (id: string) =>
    setTranslated((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  // The body of a message: the Spanish original or its translation, then one row of actions.
  const body = (id: string, copy: Copy, read: { url: string; label: string }) => {
    const tr = translated[id]?.to === lang ? translated[id] : undefined;
    const shown = tr ?? copy;
    const page = read.url && lang !== 'es' ? googlePageTranslation(read.url, 'es', lang) : '';
    return (
      <>
        {tr && <strong className="fw-translated-title">{tr.title}</strong>}
        {shown.paragraphs.map((text) => (
          <p key={text} lang={tr ? langTag(lang) : 'es'}>
            {text}
          </p>
        ))}
        {shown.items.length > 0 && (
          <ul lang={tr ? langTag(lang) : 'es'}>
            {shown.items.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        )}
        {tr && (
          <p className="fw-translate-note">
            {help(
              'Automatic translation made on this device. The Spanish original is the official text.',
              'Tradução automática feita neste dispositivo. O original em espanhol é o texto oficial.',
            )}
          </p>
        )}
        {translateFailed === id && (
          <p className="fw-translate-note" role="status">
            {help(
              'This device could not translate it. Use Google Translate instead.',
              'Este dispositivo não conseguiu traduzir. Use o Google Tradutor.',
            )}
          </p>
        )}
        <div className="fw-official-actions">
          {read.url && <ExternalLink href={read.url}>{read.label}</ExternalLink>}
          {lang !== 'es' &&
            (tr ? (
              <button className="fw-link-button" onClick={() => showOriginal(id)}>
                {help('Show original', 'Mostrar original')}
              </button>
            ) : (
              <>
                {here && (
                  <button
                    className="fw-link-button"
                    disabled={translating === id}
                    onClick={() => void translateHere(id, copy)}
                  >
                    {translating === id
                      ? help('Translating…', 'Traduzindo…')
                      : help('Translate here', 'Traduzir aqui')}
                  </button>
                )}
                <ExternalLink
                  href={googleTextTranslation(
                    [copy.title, ...copy.paragraphs, ...copy.items].join('\n\n'),
                    'es',
                    lang,
                  )}
                >
                  {help('Translate with Google', 'Traduzir com o Google')}
                </ExternalLink>
                {page && (
                  <ExternalLink href={page}>
                    {help('Full page in English', 'Página completa em português')}
                  </ExternalLink>
                )}
              </>
            ))}
        </div>
      </>
    );
  };
  const warnings = national?.warnings ?? [];
  const posts = civil?.posts ? recentPosts(civil.posts, now) : [];
  // A post opened from elsewhere is always listed, even past the first three.
  const showAll = allPosts || posts.slice(3).some((p) => open.has(officialRowId('p', p.id)));
  const shownPosts = showAll ? posts : posts.slice(0, 3);
  if (!national && !civil && !weather) return null;

  // Expiry with its time zone: a phone still on another country's time must not misread it.
  const until = (n: number) =>
    new Intl.DateTimeFormat(lang, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(n);
  const at = (n: number) =>
    new Intl.DateTimeFormat(lang, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(n);
  // When each source answered, or why it cannot be confirmed: shown beside its heading.
  const checked = (when: number | null, old: boolean) =>
    when
      ? old
        ? t(
            `Último dato ${checkedLabel(when, now, lang)}`,
            `Last data ${checkedLabel(when, now, lang)}`,
            `Último dado ${checkedLabel(when, now, lang)}`,
          )
        : t(
            `Consultado ${checkedLabel(when, now, lang)}`,
            `Checked ${checkedLabel(when, now, lang)}`,
            `Consultado ${checkedLabel(when, now, lang)}`,
          )
      : '';
  const signal = national ? nationalSignal(national) : null;
  const nationalState = !national
    ? ''
    : signal === 'failed'
      ? t('No responde', 'Not responding', 'Não responde')
      : signal === 'offline'
        ? t('Sin conexión', 'Offline', 'Sem conexão')
        : signal === 'checking'
          ? t('Consultando…', 'Checking…', 'Consultando…')
          : checked(national.checked, national.stale || signal === 'unconfirmed');
  const nationalEmpty =
    signal === 'off'
      ? t('No hay avisos vigentes.', 'No warnings in force.', 'Não há avisos em vigor.')
      : signal === 'unconfirmed'
        ? t(
            'No se pudo confirmar si hay avisos vigentes.',
            'Could not confirm whether warnings are in force.',
            'Não foi possível confirmar se há avisos em vigor.',
          )
        : signal === 'failed'
          ? t(
              'No se pudo consultar. Revisa su sitio oficial.',
              'Could not be checked. See its official site.',
              'Não foi possível consultar. Veja o site oficial.',
            )
          : '';
  const civilState = !civil
    ? ''
    : !civil.posts
      ? civil.failed
        ? t('No responde', 'Not responding', 'Não responde')
        : civil.offline
          ? t('Sin conexión', 'Offline', 'Sem conexão')
          : t('Consultando…', 'Checking…', 'Consultando…')
      : checked(civil.checked, civil.stale || civil.failed);
  // A quiet week still says when the agency last published, so silence is not read as news.
  const last = civil?.posts && posts.length === 0 ? lastPost(civil.posts, now) : null;
  const day = (n: number) =>
    new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long' }).format(n);
  const civilEmpty =
    civil?.posts && posts.length === 0
      ? last
        ? t(
            `No hay publicaciones nuevas desde el ${day(last.published)}.`,
            `Nothing new since ${day(last.published)}.`,
            `Nenhuma publicação nova desde ${day(last.published)}.`,
          )
        : t(
            'Sin publicaciones en los últimos 7 días.',
            'Nothing published in the last 7 days.',
            'Nenhuma publicação nos últimos 7 dias.',
          )
      : civil && !civil.posts && civil.failed
        ? t(
            'No se pudo consultar. Revisa su sitio oficial.',
            'Could not be checked. See its official site.',
            'Não foi possível consultar. Veja o site oficial.',
          )
        : '';
  // English and Portuguese readers are told once per source, not on every line.
  const spanishNote = lang !== 'es' && (
    <p className="fw-official-note">
      {help(
        'Published in Spanish. Open a message to translate it.',
        'Publicado em espanhol. Abra uma mensagem para traduzi-la.',
      )}
    </p>
  );

  return (
    <section className="fw-official" aria-labelledby="fw-official-title">
      <header className="fw-block-head">
        <h2 id="fw-official-title">
          {t('Lo oficial ahora', 'Official now', 'Informação oficial agora')}
        </h2>
      </header>

      {national && (
        <div className="fw-official-group" aria-labelledby="fw-official-national">
          <div className="fw-official-group-head">
            <h3 id="fw-official-national">
              {t(
                `Avisos vigentes del ${national.agency}`,
                `${national.agency} warnings in force`,
                `Avisos em vigor: ${national.agency}`,
              )}
            </h3>
            <span>{nationalState}</span>
          </div>
          {warnings.length > 0 ? (
            <>
              {spanishNote}
              <ul className="fw-official-list">
                {warnings.map((w) => {
                  const id = officialRowId('w', w.id);
                  const steps = instructionLines(w.instruction);
                  return (
                    <li key={id} id={id} data-kind="warning">
                      <button
                        aria-expanded={open.has(id)}
                        aria-controls={`${id}-body`}
                        onClick={() => onToggle(id)}
                      >
                        <span className="fw-official-dot" aria-hidden="true" />
                        <span className="fw-official-text">
                          <strong lang="es">{readableEvent(w.event)}</strong>
                          <span className="fw-official-facts">
                            <b>{severityLabels[w.severity][idx]}</b>
                            <span>
                              {t('Hasta el', 'Until', 'Até')} {until(w.expires)}
                            </span>
                          </span>
                        </span>
                        <CaretDownIcon className="fw-official-caret" size={16} aria-hidden="true" />
                      </button>
                      <div id={`${id}-body`} className="fw-official-body" hidden={!open.has(id)}>
                        {body(
                          id,
                          {
                            title: readableEvent(w.event),
                            paragraphs: w.areas ? [`${w.areas}.`] : [],
                            items: steps,
                          },
                          {
                            url: w.url || weather?.url || '',
                            label: t(
                              'Leer el aviso completo',
                              'Read the full warning',
                              'Ler o aviso completo',
                            ),
                          },
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            nationalEmpty && <p className="fw-official-empty">{nationalEmpty}</p>
          )}
        </div>
      )}

      {civil && (
        <div className="fw-official-group" aria-labelledby="fw-official-civil">
          <div className="fw-official-group-head">
            <h3 id="fw-official-civil">
              {t(
                `Comunicados de ${civil.agency}`,
                `${civil.agency} communiqués`,
                `Comunicados: ${civil.agency}`,
              )}
            </h3>
            <span>{civilState}</span>
          </div>
          {shownPosts.length > 0 ? (
            <>
              {spanishNote}
              <ul className="fw-official-list">
                {shownPosts.map((post) => {
                  const id = officialRowId('p', post.id);
                  const update = postUpdate(post);
                  return (
                    <li key={id} id={id} data-kind="post">
                      <button
                        aria-expanded={open.has(id)}
                        aria-controls={`${id}-body`}
                        onClick={() => onToggle(id)}
                      >
                        <span className="fw-official-dot" aria-hidden="true" />
                        <span className="fw-official-text">
                          <strong lang="es">{postTitle(post.title)}</strong>
                          <span className="fw-official-facts">
                            <span>{at(post.published)}</span>
                            <span>{ageLabel(post.published, now, lang)}</span>
                          </span>
                          {/* "Comunicado oficial #8" says nothing on its own: its opening line does. */}
                          {post.kind === 'communique' && post.summary && !open.has(id) && (
                            <span className="fw-official-snippet" lang="es">
                              {post.summary}
                            </span>
                          )}
                        </span>
                        <CaretDownIcon className="fw-official-caret" size={16} aria-hidden="true" />
                      </button>
                      <div id={`${id}-body`} className="fw-official-body" hidden={!open.has(id)}>
                        {body(
                          id,
                          {
                            title: postTitle(post.title),
                            paragraphs: post.summary ? [post.summary] : [],
                            items: [],
                          },
                          {
                            url: post.url,
                            label: t('Leer completo', 'Read in full', 'Ler completo'),
                          },
                        )}
                        {/* The site records any later save, not what changed: stated, not interpreted. */}
                        {update && (
                          <p className="fw-official-edited">
                            {t(
                              `Última edición en su sitio: ${at(update)}.`,
                              `Last edited on its site: ${at(update)}.`,
                              `Última edição no site: ${at(update)}.`,
                            )}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            civilEmpty && <p className="fw-official-empty">{civilEmpty}</p>
          )}
          <div className="fw-official-more">
            {posts.length > 3 && (
              <button className="fw-link-button" onClick={() => setAllPosts(!showAll)}>
                {showAll
                  ? t('Mostrar menos', 'Show fewer', 'Mostrar menos')
                  : t(
                      `Ver las ${posts.length} de esta semana`,
                      `See all ${posts.length} this week`,
                      `Ver as ${posts.length} desta semana`,
                    )}
              </button>
            )}
            <ExternalLink href={SINAPROC_HOME}>sinaproc.gob.pa</ExternalLink>
          </div>
        </div>
      )}

      {!national && weather && (
        <div className="fw-official-group">
          <div className="fw-official-group-head">
            <h3>
              {t(
                `Avisos de ${weather.name}`,
                `${weather.name} warnings`,
                `Avisos: ${weather.name}`,
              )}
            </h3>
          </div>
          <p className="fw-official-empty">
            {t(
              'No publica sus avisos en un formato que Faro pueda leer.',
              'It does not publish its warnings in a format Faro can read.',
              'Não publica seus avisos em um formato que o Faro consiga ler.',
            )}{' '}
            <ExternalLink href={weather.url}>
              {t('Ver sus avisos', 'See its warnings', 'Ver seus avisos')}
            </ExternalLink>
          </p>
        </div>
      )}

      <p className="fw-official-foot">
        {civil
          ? t(
              'Las órdenes de evacuación y los albergues activos los informa SINAPROC; Faro no los verifica.',
              'Evacuation orders and open shelters are announced by SINAPROC; Faro does not verify them.',
              'As ordens de evacuação e os abrigos ativos são informados pelo SINAPROC; o Faro não os verifica.',
            )
          : t(
              'Las órdenes de evacuación las dan las autoridades locales.',
              'Evacuation orders come from local authorities.',
              'As ordens de evacuação são dadas pelas autoridades locais.',
            )}
      </p>
      {services && services.length > 0 && (
        <div className="fw-official-services">
          <p>
            {t(
              `Faro no tiene datos oficiales de ${new Intl.ListFormat(lang, { type: 'disjunction' }).format(services.map((s) => s.topic[idx]))}. Infórmate con:`,
              `Faro has no official data on ${new Intl.ListFormat(lang, { type: 'disjunction' }).format(services.map((s) => s.topic[idx]))}. Check with:`,
              `O Faro não tem dados oficiais sobre ${new Intl.ListFormat(lang, { type: 'disjunction' }).format(services.map((s) => s.topic[idx]))}. Consulte:`,
            )}
          </p>
          <ul>
            {services.map((s) => (
              <li key={s.topic[1]}>
                <span>{s.topic[idx].charAt(0).toUpperCase() + s.topic[idx].slice(1)}</span>
                <span>
                  {s.agencies.map((a, j) => (
                    <span key={a.name}>
                      {j > 0 && t(' o ', ' or ', ' ou ')}
                      {a.url ? <ExternalLink href={a.url}>{a.name}</ExternalLink> : a.name}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
