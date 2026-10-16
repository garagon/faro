import { useEffect, useState } from 'react';
import { FileTextIcon, TriangleAlertIcon } from 'lucide-react';
import {
  Actions,
  Badge,
  ExpandRow,
  List,
  ListRow,
  Note,
  OutLink,
  Section,
  SourceStamp,
  StatusIcon,
} from '../ui/index.ts';
import { capitalize, lineStamp, sourceLine } from '../lib/sourceStatus.ts';
import { ageLabel } from '../lib/feedUpdates.ts';
import {
  floodWarnings,
  instructionLines,
  nationalSignal,
  readableEvent,
  severityLabels,
  severityLevel,
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
  /** When the last failed attempt was made. */
  failedAt?: number | null;
  partial: boolean;
  /** Only the adapter's limit was reached: how many recent messages were read. */
  recent?: number | null;
  checked: number | null;
  stale: boolean;
};
export type CivilFeed = {
  agency: string;
  posts: CivilPost[] | null;
  failed: boolean;
  failedAt?: number | null;
  stale: boolean;
  checked: number | null;
  offline?: boolean;
};

/** DOM id of one row, from its source and identifier. */
export const officialRowId = (kind: 'w' | 'p', id: string | number) =>
  `fw-official-${kind}-${String(id).replace(/[^\w-]/g, '_')}`;

/**
 * A national source's state in the one vocabulary (`sourceLine`), or nothing while it is current:
 * the screen says once when Faro checked. Before a first answer it is "checking", in grey.
 */
export function feedLine(
  feed: { checked: number | null; failed: boolean; failedAt?: number | null; stale: boolean },
  online: boolean,
  now: number,
  lang: Lang,
) {
  const line = sourceLine({
    checked: feed.checked,
    failed: feed.failed,
    failedAt: feed.failedAt,
    online,
    old: feed.stale,
    now,
    lang,
  });
  return line.state === 'checked' ? null : line;
}

/**
 * One national warning in force, in the agency's words: its event as the title, its severity as
 * the badge, and who issued it. The same row on Situación and Emergencia.
 */
export function NationalWarningRow({
  warning: w,
  agency,
  lang,
  extra,
  onOpen,
  href,
}: {
  warning: NationalWarning;
  agency: string;
  lang: Lang;
  /** Added to the caption: the source's state when it is not current, or the expiry. */
  extra?: string;
  onOpen?: () => void;
  href?: string;
}) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const level = severityLevel[w.severity];
  const row = {
    lead: (
      <StatusIcon state="listed" level={level} icon={<TriangleAlertIcon className="size-4" />} />
    ),
    title: <span lang="es">{readableEvent(w.event)}</span>,
    badge: <Badge level={level}>{severityLabels[w.severity][langIndex(lang)]}</Badge>,
    // The agency publishes in Spanish: said once in the caption, for English and Portuguese.
    meta: [
      t(`Aviso del ${agency}`, `${agency} warning, in Spanish`, `Aviso do ${agency}, em espanhol`),
      extra,
    ]
      .filter(Boolean)
      .join(' · '),
  };
  return onOpen ? (
    <ListRow {...row} onClick={onOpen} />
  ) : href ? (
    <ListRow {...row} href={href} external />
  ) : (
    <ListRow {...row} />
  );
}

type Props = {
  lang: Lang;
  now: number;
  /** Offline, a source's state says so with the time of its last data. */
  online: boolean;
  national?: NationalFeed;
  civil?: CivilFeed;
  /** The weather service's page when it has no feed Faro can read. */
  weather?: OfficialLink;
  /** Who reports water, power, roads and health, which Faro does not read. */
  services?: Destination['services'];
  /** Rows opened from elsewhere (the flood row), by DOM id. */
  open: Set<string>;
  onToggle: (rowId: string) => void;
  /** Opens Faro's own flood steps, readable offline in the person's language. */
  onFloodGuide?: () => void;
};

/**
 * What the authorities are saying now, one line per message: warnings in force from the
 * national weather service first, then civil-protection posts. Each line opens in place.
 */
export default function OfficialNow({
  lang,
  now,
  online,
  national,
  civil,
  weather,
  services,
  open,
  onToggle,
  onFloodGuide,
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
        {tr && <h3>{tr.title}</h3>}
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
          <p className="f-caption m-0 text-sm text-muted-foreground">
            {help(
              'Automatic translation made on this device. The Spanish original is the official text.',
              'Tradução automática feita neste dispositivo. O original em espanhol é o texto oficial.',
            )}
          </p>
        )}
        {translateFailed === id && (
          <p className="f-caption m-0 text-sm text-muted-foreground" role="status">
            {help(
              'This device could not translate it. Use Google Translate instead.',
              'Este dispositivo não conseguiu traduzir. Use o Google Tradutor.',
            )}
          </p>
        )}
        <Actions>
          {read.url && <OutLink href={read.url}>{read.label}</OutLink>}
          {lang !== 'es' &&
            (tr ? (
              <button type="button" onClick={() => showOriginal(id)}>
                {help('Show original', 'Mostrar original')}
              </button>
            ) : (
              <>
                {here && (
                  <button
                    type="button"
                    disabled={translating === id}
                    onClick={() => void translateHere(id, copy)}
                  >
                    {translating === id
                      ? help('Translating…', 'Traduzindo…')
                      : help('Translate here', 'Traduzir aqui')}
                  </button>
                )}
                <OutLink
                  href={googleTextTranslation(
                    [copy.title, ...copy.paragraphs, ...copy.items].join('\n\n'),
                    'es',
                    lang,
                  )}
                >
                  {help('Translate with Google', 'Traduzir com o Google')}
                </OutLink>
                {page && (
                  <OutLink href={page}>
                    {help('Full page in English', 'Página completa em português')}
                  </OutLink>
                )}
              </>
            ))}
        </Actions>
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
  const signal = national ? nationalSignal(national) : null;
  // Each source's state beside its heading, in the one vocabulary, only when it is not current:
  // failing ("Sin respuesta · intento 07:30", even while its last warnings are still listed: they
  // may have been lifted or raised since), offline, or checking (grey). Current, nothing: the
  // screen head says once when Faro checked.
  const nationalLine = national ? feedLine(national, online, now, lang) : null;
  const nationalEmpty =
    signal === 'off'
      ? t('No hay avisos vigentes.', 'No warnings in force.', 'Não há avisos em vigor.')
      : signal === 'recent' && national?.recent
        ? // What was checked, exactly: the most recent messages. Older ones were not read.
          t(
            `Ningún aviso vigente entre los ${national.recent} mensajes más recientes del ${national.agency}.`,
            `No warnings in force among ${national.agency}'s ${national.recent} most recent messages.`,
            `Nenhum aviso em vigor entre as ${national.recent} mensagens mais recentes do ${national.agency}.`,
          )
        : signal === 'unconfirmed'
          ? t(
              'No se pudo confirmar si hay avisos vigentes.',
              'Could not confirm whether warnings are in force.',
              'Não foi possível confirmar se há avisos em vigor.',
            )
          : signal === 'failed' || signal === 'offline'
            ? // The state is beside the heading; this says what it means and where to look.
              t(
                'Faro no puede saber si hay avisos vigentes: consulta su sitio oficial.',
                'Faro cannot tell whether warnings are in force: check its official site.',
                'O Faro não consegue saber se há avisos em vigor: consulte o site oficial.',
              )
            : '';
  const civilLine = civil ? feedLine(civil, online && !civil.offline, now, lang) : null;
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
      : '';
  const spanishNote = lang !== 'es' && (
    <Note>
      {help(
        'Published in Spanish. Open a message to translate it.',
        'Publicado em espanhol. Abra uma mensagem para traduzi-la.',
      )}
    </Note>
  );

  return (
    <Section
      id="fw-official"
      title={t('Lo oficial ahora', 'Official now', 'Informação oficial agora')}
    >
      {/* English and Portuguese readers are told once, not under every source. */}
      {(warnings.length > 0 || shownPosts.length > 0) && spanishNote}
      {national && (
        <div className="f-stack grid gap-2" data-gap="sm">
          <div className="f-section-head flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3
              className="f-subhead m-0 text-sm leading-snug font-medium"
              id="fw-official-national"
            >
              {t(
                `Avisos vigentes del ${national.agency}`,
                `${national.agency} warnings in force`,
                `Avisos em vigor: ${national.agency}`,
              )}
            </h3>
            {nationalLine && (
              <span className="f-section-aside text-sm text-muted-foreground data-[state=stale]:text-amber-900">
                <SourceStamp state={lineStamp(nationalLine.state)}>
                  {capitalize(nationalLine.text)}
                </SourceStamp>
              </span>
            )}
          </div>
          {warnings.length > 0 ? (
            <>
              <List label={national.agency}>
                {warnings.map((w) => {
                  const id = officialRowId('w', w.id);
                  const level = severityLevel[w.severity];
                  return (
                    <ExpandRow
                      key={id}
                      id={id}
                      open={open.has(id)}
                      onToggle={() => onToggle(id)}
                      lead={
                        <StatusIcon
                          state="listed"
                          level={level}
                          icon={<TriangleAlertIcon className="size-4" />}
                        />
                      }
                      title={<span lang="es">{readableEvent(w.event)}</span>}
                      badge={<Badge level={level}>{severityLabels[w.severity][idx]}</Badge>}
                      // Several warnings of one kind differ by area: it shows in the row.
                      meta={
                        <>
                          {t('Hasta el', 'Until', 'Até')} {until(w.expires)}
                          {w.areas && (
                            <span lang="es">
                              {' · '}
                              {w.areas.length > 70 ? `${w.areas.slice(0, 68).trimEnd()}…` : w.areas}
                            </span>
                          )}
                        </>
                      }
                    >
                      {body(
                        id,
                        {
                          title: readableEvent(w.event),
                          paragraphs: w.areas ? [`${w.areas}.`] : [],
                          items: instructionLines(w.instruction),
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
                      {/* The agency's steps are in Spanish; Faro's flood steps are not, and work
                          without a connection. */}
                      {lang !== 'es' && onFloodGuide && floodWarnings([w]).length > 0 && (
                        <Actions>
                          <button type="button" onClick={onFloodGuide}>
                            {t(
                              '',
                              'Faro’s flood steps in English',
                              'Passos do Faro para inundações',
                            )}
                          </button>
                        </Actions>
                      )}
                    </ExpandRow>
                  );
                })}
              </List>
            </>
          ) : (
            nationalEmpty && (
              <Note
                more={
                  (signal === 'failed' || signal === 'offline' || signal === 'recent') &&
                  weather && (
                    <OutLink href={weather.url}>
                      {new URL(weather.url).hostname.replace(/^www\./, '')}
                    </OutLink>
                  )
                }
              >
                {nationalEmpty}
              </Note>
            )
          )}
        </div>
      )}

      {civil && (
        <div className="f-stack grid gap-2" data-gap="sm">
          <div className="f-section-head flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="f-subhead m-0 text-sm leading-snug font-medium" id="fw-official-civil">
              {t(
                `Comunicados de ${civil.agency}`,
                `${civil.agency} communiqués`,
                `Comunicados: ${civil.agency}`,
              )}
            </h3>
            {civilLine && (
              <span className="f-section-aside text-sm text-muted-foreground data-[state=stale]:text-amber-900">
                <SourceStamp state={lineStamp(civilLine.state)}>
                  {capitalize(civilLine.text)}
                </SourceStamp>
              </span>
            )}
          </div>
          {shownPosts.length > 0 ? (
            <>
              <List label={civil.agency}>
                {shownPosts.map((post) => {
                  const id = officialRowId('p', post.id);
                  const update = postUpdate(post);
                  return (
                    <ExpandRow
                      key={id}
                      id={id}
                      open={open.has(id)}
                      onToggle={() => onToggle(id)}
                      lead={
                        <StatusIcon state="listed" icon={<FileTextIcon className="size-4" />} />
                      }
                      title={<span lang="es">{postTitle(post.title)}</span>}
                      meta={`${at(post.published)} · ${ageLabel(post.published, now, lang)}`}
                    >
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
                        <p className="f-caption m-0 text-sm text-muted-foreground">
                          {t(
                            `Última edición en su sitio: ${at(update)}.`,
                            `Last edited on its site: ${at(update)}.`,
                            `Última edição no site: ${at(update)}.`,
                          )}
                        </p>
                      )}
                    </ExpandRow>
                  );
                })}
              </List>
            </>
          ) : (
            civilEmpty && <Note>{civilEmpty}</Note>
          )}
          <Actions>
            {posts.length > 3 && (
              <button type="button" onClick={() => setAllPosts(!showAll)}>
                {showAll
                  ? t('Mostrar menos', 'Show fewer', 'Mostrar menos')
                  : t(
                      `Ver las ${posts.length} de esta semana`,
                      `See all ${posts.length} this week`,
                      `Ver as ${posts.length} desta semana`,
                    )}
              </button>
            )}
            <OutLink href={SINAPROC_HOME}>sinaproc.gob.pa</OutLink>
          </Actions>
        </div>
      )}

      {!national && weather && (
        <div className="f-stack grid gap-2" data-gap="sm">
          <h3 className="f-subhead m-0 text-sm leading-snug font-medium">
            {t(`Avisos de ${weather.name}`, `${weather.name} warnings`, `Avisos: ${weather.name}`)}
          </h3>
          <Note
            more={
              <OutLink href={weather.url}>
                {t('Ver sus avisos', 'See its warnings', 'Ver seus avisos')}
              </OutLink>
            }
          >
            {t(
              'No publica sus avisos en un formato que Faro pueda leer.',
              'It does not publish its warnings in a format Faro can read.',
              'Não publica seus avisos em um formato que o Faro consiga ler.',
            )}
          </Note>
        </div>
      )}

      {services && services.length > 0 && (
        <div className="f-stack grid gap-2" data-gap="sm">
          <h3 className="f-subhead m-0 text-sm leading-snug font-medium">
            {t(
              `Faro no tiene datos oficiales de ${new Intl.ListFormat(lang, { type: 'disjunction' }).format(services.map((s) => s.topic[idx]))}`,
              `Faro has no official data on ${new Intl.ListFormat(lang, { type: 'disjunction' }).format(services.map((s) => s.topic[idx]))}`,
              `O Faro não tem dados oficiais sobre ${new Intl.ListFormat(lang, { type: 'disjunction' }).format(services.map((s) => s.topic[idx]))}`,
            )}
          </h3>
          <List>
            {services.map((s) => (
              <ListRow
                key={s.topic[1]}
                title={s.topic[idx].charAt(0).toUpperCase() + s.topic[idx].slice(1)}
                meta={s.agencies.map((a, j) => (
                  <span key={a.name}>
                    {j > 0 && t(' o ', ' or ', ' ou ')}
                    {a.url ? (
                      <a href={a.url} target="_blank" rel="noreferrer">
                        {a.name}
                      </a>
                    ) : (
                      a.name
                    )}
                  </span>
                ))}
              />
            ))}
          </List>
        </div>
      )}
      <Note>
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
      </Note>
    </Section>
  );
}
