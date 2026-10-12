import { useMemo, useState } from 'react';
import { ArrowUpRightIcon, MapPinIcon, PhoneIcon } from '@phosphor-icons/react';
import { consularFallback, type Embassy } from '../lib/embassies.ts';
import {
  missionsFor,
  missionDirections,
  missionKinds,
  destinationConsularDirectories,
  type Mission,
} from '../data/consularMissions.ts';
import CountrySearch from './CountrySearch.tsx';
type Props = {
  savedNationality: string | null;
  onProfile: () => void;
  lang: 'es' | 'en';
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
  const t = (es: string, en: string) => (lang === 'es' ? es : en),
    i = lang === 'es' ? 0 : 1;
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
    return (
      <article className="fw-consular-card" key={m.id}>
        <div>
          <span>
            {names.of(m.nation)} · {missionKinds[m.kind][i]}
          </span>
          <h3>{m.historical ? `${m.name[i]} · ${m.city}` : m.name[i]}</h3>
        </div>
        {m.address && <address>{m.address}</address>}
        {!m.historical && m.phone && (
          <a className="fw-consular-phone" href={`tel:${m.phone}`}>
            <PhoneIcon size={17} />
            {t('Llamar', 'Call')} {m.phone}
          </a>
        )}
        {!m.historical && m.emergency && (
          <div className="fw-consular-emergency">
            <strong>{t('Emergencia consular', 'Consular emergency')}</strong>
            <a href={`tel:${m.emergency}`}>{m.emergency}</a>
            <p>
              {m.emergencyNote?.[i] ||
                t(
                  `Para emergencias de ciudadanos de ${names.of(m.nation)}. No sustituye al servicio local de emergencias.`,
                  `For citizens of ${names.of(m.nation)} in an emergency. Does not replace local emergency services.`,
                )}
            </p>
          </div>
        )}
        {m.note && <p>{m.note[i]}</p>}
        <div className="fw-consular-actions">
          <a href={m.source} target="_blank" rel="noreferrer">
            {m.historical
              ? t('Ver referencia oficial', 'Official reference')
              : t('Contacto oficial', 'Official contact')}
            <ArrowUpRightIcon size={16} />
          </a>
          {route && (
            <a href={route} target="_blank" rel="noreferrer">
              {t('Cómo llegar · Google Maps', 'Directions · Google Maps')} ↗
            </a>
          )}
          {!m.historical && !m.locationUnconfirmed && m.map && (
            <button className="fw-text" onClick={() => onMap(m.map!)}>
              <MapPinIcon size={16} />
              {t('Ver en Faro', 'View in Faro')}
            </button>
          )}
        </div>
        <small>
          {t('Fuente consultada', 'Source checked')}: {m.reviewedAt}
          {m.sourceDate ? ` · ${t('Publicación', 'Published')}: ${m.sourceDate}` : ''}
        </small>
      </article>
    );
  }
  return (
    <section className="fw-consular-directory" aria-labelledby="consular-title">
      <header>
        <div>
          <span>
            {t('DOCUMENTOS Y ASISTENCIA EN EL EXTERIOR', 'DOCUMENTS AND ASSISTANCE ABROAD')}
          </span>
          <h2 id="consular-title">{t('Embajadas y consulados', 'Embassies and consulates')}</h2>
          <p>
            {t(
              'Busca por nacionalidad. Una misma nacionalidad puede tener varias oficinas con servicios diferentes.',
              'Search by nationality. A country may have several offices providing different services.',
            )}
          </p>
        </div>
        <button className="fw-text" onClick={onProfile}>
          {t('Editar mi perfil', 'Edit my profile')}
        </button>
      </header>
      <div className="fw-consular-filters">
        <CountrySearch
          label={t('Nacionalidad', 'Nationality')}
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
            ? t('Ver mi nacionalidad', 'My nationality')
            : t('Explorar el directorio', 'Browse directory')}
        </button>
      </div>
      {savedNationality === nationality && nationality && (
        <small>
          {t('Nacionalidad guardada en tu perfil.', 'Nationality saved in your profile.')}
        </small>
      )}
      {all && (
        <div className="fw-consular-filters">
          <label>
            {t('Buscar país u oficina', 'Search country or office')}
            <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" />
          </label>
          <label>
            {t('Tipo de oficina', 'Office type')}
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="all">{t('Todas', 'All')}</option>
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
            )
          : t(
              `Oficinas en ${names.of(country)}. Cobertura parcial; usa también los directorios oficiales.`,
              `Offices in ${names.of(country)}. Partial coverage; also check the official directories.`,
            )}
      </p>
      {!!current.length && (
        <>
          {current.some((m) => missionDirections(m, mode)) && (
            <div className="fw-consular-route-mode">
              <span>{t('Rutas en Google Maps', 'Google Maps directions')}</span>
              <button aria-pressed={mode === 'walking'} onClick={() => setMode('walking')}>
                {t('A pie', 'Walking')}
              </button>
              <button aria-pressed={mode === 'driving'} onClick={() => setMode('driving')}>
                {t('En vehículo', 'Driving')}
              </button>
            </div>
          )}
          <p className="fw-preparation-note">
            {t(
              'Confirma atención antes de ir. Las oficinas no son refugios y las rutas no están verificadas tras un desastre.',
              'Confirm services before travelling. Offices are not shelters and routes have not been verified after a disaster.',
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
              )
            : nationality === country && !all
              ? t(
                  'Estás consultando tu propio país. Usa las autoridades y servicios locales.',
                  'You are viewing your own country. Use local authorities and services.',
                )
              : t(
                  'No hay fichas actuales para esta selección. Revisa las referencias y directorios oficiales.',
                  'No current contact cards for this selection. Check the references and official directories.',
                )}
        </p>
      )}
      {!!archived.length && (
        <details className="fw-consular-archive">
          <summary>
            {t(
              'Referencias históricas · vigencia sin confirmar',
              'Historical references · current status unconfirmed',
            )}{' '}
            ({archived.length})
          </summary>
          <p>
            {t(
              'No confirman que la oficina siga operativa. Se omiten los teléfonos y las rutas antiguos hasta volver a comprobarlos.',
              'These do not confirm the office still operates. Old phone numbers and directions are omitted pending re-verification.',
            )}
          </p>
          <div className="fw-consular-cards">{archived.map(card)}</div>
        </details>
      )}
      {(fallback || destinationConsularDirectories[country]) && (
        <footer>
          <h3>{t('Otros contactos oficiales', 'Other official contacts')}</h3>
          {fallback && nationality !== country && (
            <a href={fallback.url} target="_blank" rel="noreferrer">
              {fallback.label[i]} ↗
            </a>
          )}
          {destinationConsularDirectories[country]?.map((d) => (
            <div key={d.url}>
              <a href={d.url} target="_blank" rel="noreferrer">
                {d.name} ↗
              </a>
              {d.note && <small>{d.note[i]}</small>}
            </div>
          ))}
        </footer>
      )}
    </section>
  );
}
