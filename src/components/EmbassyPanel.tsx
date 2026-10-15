import { useMemo, useState } from 'react';
import { displayPhone } from '../lib/phone.ts';
import { ArrowUpRightIcon, MapPinIcon } from '@phosphor-icons/react';
import { consularFallback, type Embassy } from '../lib/embassies.ts';
import {
  missionsFor,
  missionDirections,
  missionKinds,
  destinationConsularDirectories,
  type Mission,
} from '../data/consularMissions.ts';
import CountrySearch from './CountrySearch.tsx';
import { hostOf, reviewDate, splitName } from '../lib/links.ts';
import TravelerSupport from './TravelerSupport.tsx';
import { ExternalLink, LinkRow, PhoneButton, PhoneRow } from './Ui.tsx';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
type Props = {
  savedNationality: string | null;
  onProfile: () => void;
  lang: Lang;
  country: string;
  nationality: string;
  onNationalityChange: (value: string) => void;
  onMap: (e: Embassy) => void;
};
export default function EmbassyPanel({
  savedNationality,
  onProfile,
  lang,
  country,
  nationality,
  onNationalityChange,
  onMap,
}: Props) {
  const [all, setAll] = useState(false),
    [query, setQuery] = useState(''),
    [kind, setKind] = useState('all');
  const [mode, setMode] = useState<'walking' | 'driving'>('walking');
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    i = langIndex(lang);
  const names = useMemo(() => new Intl.DisplayNames([lang], { type: 'region' }), [lang]);
  const normal = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  const entries = missionsFor(country, all ? undefined : nationality || 'NONE');
  const filtered = entries.filter(
    (m) =>
      (kind === 'all' || m.kind === kind) &&
      normal(`${names.of(m.nation)} ${m.name[i]} ${m.city || ''}`).includes(normal(query)),
  );
  const current = filtered.filter((m) => !m.historical),
    archived = filtered.filter((m) => m.historical);
  const fallback = consularFallback(country, nationality);
  function card(m: Mission) {
    const route = missionDirections(m, mode);
    const sameLine = !!m.phone && m.phone === m.emergency;
    return (
      <article className="fw-consular-card" key={m.id}>
        <div className="fw-consular-card-main">
          <div>
            {all && (
              <span>
                {names.of(m.nation)}, {missionKinds[m.kind][i].toLowerCase()}
              </span>
            )}
            <h3>{m.historical ? `${m.name[i]}, ${m.city}` : m.name[i]}</h3>
          </div>
          {m.address && <address>{m.address}</address>}
          {m.note && <p>{m.note[i]}</p>}
        </div>
        {!m.historical && (m.phone || m.emergency) && (
          <PhoneRow>
            {m.emergency && !sameLine && (
              <PhoneButton
                href={`tel:${m.emergency}`}
                number={displayPhone(m.emergency)}
                label={t('Emergencia consular', 'Consular emergency', 'Emergência consular')}
                tone="neutral"
              />
            )}
            {m.phone && (
              <PhoneButton
                href={`tel:${m.phone}`}
                number={displayPhone(m.phone)}
                label={
                  sameLine
                    ? t(
                        'Oficina y emergencia consular',
                        'Office and consular emergency',
                        'Atendimento e emergência consular',
                      )
                    : t('Oficina', 'Office', 'Atendimento')
                }
                tone="neutral"
              />
            )}
          </PhoneRow>
        )}
        {!m.historical && m.emergency && (
          <p className="fw-consular-emergency-note">
            {m.emergencyNote?.[i] ||
              t(
                `Para emergencias de ciudadanos de ${names.of(m.nation)}. No sustituye al servicio local de emergencias.`,
                `For citizens of ${names.of(m.nation)} in an emergency. Does not replace local emergency services.`,
                `Para emergências de cidadãos (${names.of(m.nation)}). Não substitui o serviço de emergência local.`,
              )}
          </p>
        )}
        <LinkRow>
          <ExternalLink href={m.source}>
            {m.historical
              ? t('Ver referencia oficial', 'Official reference', 'Ver referência oficial')
              : t('Contacto oficial', 'Official contact', 'Contato oficial')}
          </ExternalLink>
          {route && (
            <ExternalLink href={route}>
              {t(
                'Cómo llegar (Google Maps)',
                'Directions (Google Maps)',
                'Como chegar (Google Maps)',
              )}
            </ExternalLink>
          )}
          {!m.historical && !m.locationUnconfirmed && m.map && (
            <button className="fw-text fw-map-link" onClick={() => onMap(m.map!)}>
              <MapPinIcon size={16} aria-hidden="true" />
              {t('Ver en el mapa', 'Show on the map', 'Ver no mapa')}
            </button>
          )}
        </LinkRow>
        <small>
          {t('Fuente revisada el', 'Source reviewed', 'Fonte revisada em')}{' '}
          {reviewDate(m.reviewedAt, lang)}
          {m.sourceDate
            ? `. ${t('Fecha de publicación', 'Publication date', 'Data de publicação')}: ${reviewDate(m.sourceDate, lang)}`
            : ''}
          .
        </small>
      </article>
    );
  }
  return (
    <section className="fw-consular-directory" aria-labelledby="consular-title">
      <header>
        <div>
          <h2 id="consular-title">
            {t('Embajadas y consulados', 'Embassies and consulates', 'Embaixadas e consulados')}
          </h2>
          <p>
            {t(
              'Encuentra tu representación y consulta cómo contactar o llegar.',
              'Find your representation, contact details and directions.',
              'Encontre sua representação e veja como entrar em contato ou chegar.',
            )}
          </p>
        </div>
        <button className="fw-text" onClick={onProfile}>
          {t(
            'Editar mis datos en Mi viaje',
            'Edit my details in My trip',
            'Editar meus dados em Minha viagem',
          )}
        </button>
      </header>
      <div className="fw-consular-filters">
        <CountrySearch
          label={t('Nacionalidad', 'Nationality', 'Nacionalidade')}
          lang={lang}
          value={nationality}
          onChange={(value) => {
            onNationalityChange(value);
            setAll(false);
            setQuery('');
            setKind('all');
          }}
        />
        <button
          className="fw-secondary"
          aria-pressed={all}
          onClick={() => {
            setAll(!all);
            setQuery('');
            setKind('all');
          }}
        >
          {all
            ? t('Filtrar por nacionalidad', 'Filter by nationality', 'Filtrar por nacionalidade')
            : t('Explorar el directorio', 'Browse directory', 'Explorar o diretório')}
        </button>
      </div>
      {!all && savedNationality === nationality && nationality && (
        <small>
          {t(
            'Nacionalidad guardada en tu perfil.',
            'Nationality saved in your profile.',
            'Nacionalidade salva no seu perfil.',
          )}
        </small>
      )}
      {all && (
        <div className="fw-consular-filters">
          <label>
            {t('Buscar país u oficina', 'Search country or office', 'Buscar país ou representação')}
            <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" />
          </label>
          <label>
            {t('Tipo de oficina', 'Office type', 'Tipo de representação')}
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="all">{t('Todas', 'All', 'Todas')}</option>
              {Object.entries(missionKinds).map(([id, name]) => (
                <option value={id} key={id}>
                  {name[i]}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <p className="fw-consular-scope">
        {country === 'WORLD'
          ? t(
              'Selecciona el país donde necesitas ayuda.',
              'Choose the country where you need help.',
              'Selecione o país onde você precisa de ajuda.',
            )
          : t(
              `Oficinas en ${names.of(country)}. Cobertura parcial; usa también los directorios oficiales.`,
              `Offices in ${names.of(country)}. Partial coverage; also check the official directories.`,
              `Representações · ${names.of(country)}. Cobertura parcial; consulte também os diretórios oficiais.`,
            )}
      </p>
      {!!current.length && (
        <>
          {current.some((m) => missionDirections(m, mode)) && (
            <div className="fw-consular-route-mode">
              <span>
                {t('Rutas en Google Maps', 'Google Maps directions', 'Rotas no Google Maps')}
              </span>
              <button aria-pressed={mode === 'walking'} onClick={() => setMode('walking')}>
                {t('A pie', 'Walking', 'A pé')}
              </button>
              <button aria-pressed={mode === 'driving'} onClick={() => setMode('driving')}>
                {t('En vehículo', 'Driving', 'De carro')}
              </button>
            </div>
          )}
          <p className="fw-preparation-note">
            {t(
              'Confirma atención antes de ir. Las oficinas no son refugios y las rutas no están verificadas tras un desastre.',
              'Confirm services before traveling. Offices are not shelters and routes have not been verified after a disaster.',
              'Confirme o atendimento antes de ir. As representações não são abrigos e as rotas não foram verificadas após um desastre.',
            )}
          </p>
          <div className="fw-consular-cards">{current.map(card)}</div>
        </>
      )}
      {!current.length && (
        <p role="status">
          {!nationality && !all
            ? t(
                'Selecciona tu nacionalidad o explora las oficinas registradas.',
                'Select your nationality or browse the listed offices.',
                'Selecione sua nacionalidade ou explore as representações registradas.',
              )
            : nationality === country && !all
              ? t(
                  'Estás consultando tu propio país. Usa las autoridades y servicios locales.',
                  'You are viewing your own country. Use local authorities and services.',
                  'Você está consultando seu próprio país. Use as autoridades e os serviços locais.',
                )
              : t(
                  'No hay fichas actuales para esta selección. Revisa las referencias y directorios oficiales.',
                  'No current contact cards for this selection. Check the references and official directories.',
                  'Não há fichas atuais para esta seleção. Consulte as referências e os diretórios oficiais.',
                )}
        </p>
      )}
      <TravelerSupport nationality={nationality} country={country} lang={lang} />
      {!!archived.length && (
        <details className="fw-consular-archive">
          <summary>
            {t(
              'Referencias históricas · vigencia sin confirmar',
              'Historical references · current status unconfirmed',
              'Referências históricas · vigência não confirmada',
            )}{' '}
            ({archived.length})
          </summary>
          <p>
            {t(
              'No confirman que la oficina siga operativa. Se omiten los teléfonos y las rutas antiguos hasta volver a comprobarlos.',
              'These do not confirm the office still operates. Old phone numbers and directions are omitted pending re-verification.',
              'Não confirmam que a representação continua funcionando. Os telefones e as rotas antigos ficam de fora até serem verificados de novo.',
            )}
          </p>
          <div className="fw-consular-cards">{archived.map(card)}</div>
        </details>
      )}
      {(fallback || destinationConsularDirectories[country]) && (
        <footer>
          <h3>
            {t('Otros contactos oficiales', 'Other official contacts', 'Outros contatos oficiais')}
          </h3>
          <ul className="fw-link-rows">
            {fallback && nationality !== country && (
              <li>
                <a href={fallback.url} target="_blank" rel="noreferrer">
                  <span>
                    <strong>{fallback.label[i]}</strong>
                  </span>
                  <small>
                    {hostOf(fallback.url)}
                    <ArrowUpRightIcon size={14} aria-hidden="true" />
                  </small>
                </a>
              </li>
            )}
            {destinationConsularDirectories[country]?.map((d) => {
              const [agency, what] = splitName(
                typeof d.name === 'string' ? d.name : d.name[langIndex(lang)],
              );
              return (
                <li key={d.url}>
                  <a href={d.url} target="_blank" rel="noreferrer">
                    <span>
                      <strong>{what ? `${agency}: ${what}` : agency}</strong>
                      {d.note && <span>{d.note[i]}</span>}
                    </span>
                    <small>
                      {hostOf(d.url)}
                      <ArrowUpRightIcon size={14} aria-hidden="true" />
                    </small>
                  </a>
                </li>
              );
            })}
          </ul>
        </footer>
      )}
    </section>
  );
}
