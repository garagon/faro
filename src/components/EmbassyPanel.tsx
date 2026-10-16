import { useMemo, useState } from 'react';
import { displayPhone } from '../lib/phone.ts';
import { ArrowUpRightIcon } from '@phosphor-icons/react';
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
import {
  Actions,
  Disclosure,
  Field,
  List,
  ListRow,
  Note,
  OutLink,
  PhoneRow,
  SafetyNotice,
  Section,
  Segmented,
  SelectField,
  SourceStamp,
  Text,
} from '../ui/index.ts';
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

const outIcon = <ArrowUpRightIcon size={16} aria-hidden="true" />;

/** Embassies and consulates for the chosen nationality, or the whole directory on request. */
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
  const normal = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const entries = missionsFor(country, all ? undefined : nationality || 'NONE');
  const filtered = entries.filter(
    (m) =>
      (kind === 'all' || m.kind === kind) &&
      normal(`${names.of(m.nation)} ${m.name[i]} ${m.city || ''}`).includes(normal(query)),
  );
  const current = filtered.filter((m) => !m.historical),
    archived = filtered.filter((m) => m.historical);
  const fallback = consularFallback(country, nationality);
  const reviewed = (m: Mission) => (
    <SourceStamp>
      {t('Fuente revisada el', 'Source reviewed', 'Fonte revisada em')}{' '}
      {reviewDate(m.reviewedAt, lang)}
      {m.sourceDate
        ? `. ${t('Fecha de publicación', 'Publication date', 'Data de publicação')}: ${reviewDate(m.sourceDate, lang)}`
        : ''}
      .
    </SourceStamp>
  );
  const links = (m: Mission) => {
    const route = missionDirections(m, mode);
    return (
      <Actions>
        <OutLink href={m.source}>
          {m.historical
            ? t('Ver referencia oficial', 'Official reference', 'Ver referência oficial')
            : t('Contacto oficial', 'Official contact', 'Contato oficial')}
        </OutLink>
        {route && (
          <OutLink href={route}>
            {t(
              'Cómo llegar (Google Maps)',
              'Directions (Google Maps)',
              'Como chegar (Google Maps)',
            )}
          </OutLink>
        )}
        {!m.historical && !m.locationUnconfirmed && m.map && (
          <button type="button" onClick={() => onMap(m.map!)}>
            {t('Ver en el mapa', 'Show on the map', 'Ver no mapa')}
          </button>
        )}
      </Actions>
    );
  };
  // Record ids can hold spaces (a city): never valid in an id reference.
  const titleId = (m: Mission) => `fw-office-${m.id.replace(/[^\w-]/g, '_')}`;
  // In the directory, each office says whose it is and what kind.
  const whose = (m: Mission) => `${names.of(m.nation)}, ${missionKinds[m.kind][i].toLowerCase()}`;
  /** A current office: its name and address, then its lines as rows, then how to use them. */
  function office(m: Mission) {
    const sameLine = !!m.phone && m.phone === m.emergency;
    const emergencyNote =
      m.emergency &&
      (m.emergencyNote?.[i] ||
        t(
          `Para emergencias de ciudadanos de ${names.of(m.nation)}. No sustituye al servicio local de emergencias.`,
          `For citizens of ${names.of(m.nation)} in an emergency. Does not replace local emergency services.`,
          `Para emergências de cidadãos (${names.of(m.nation)}). Não substitui o serviço de emergência local.`,
        ));
    return (
      <article className="f-stack" data-gap="sm" key={m.id} aria-labelledby={titleId(m)}>
        <List>
          <ListRow
            title={
              <h3 className="f-subhead" id={titleId(m)}>
                {m.name[i]}
              </h3>
            }
            meta={[all && whose(m), m.address].filter(Boolean).join(' · ') || undefined}
          />
          {m.emergency && !sameLine && (
            <PhoneRow
              number={displayPhone(m.emergency)}
              dial={m.emergency}
              name={t('Emergencia consular', 'Consular emergency', 'Emergência consular')}
            />
          )}
          {m.phone && (
            <PhoneRow
              number={displayPhone(m.phone)}
              dial={m.phone}
              name={
                sameLine
                  ? t(
                      'Oficina y emergencia consular',
                      'Office and consular emergency',
                      'Atendimento e emergência consular',
                    )
                  : t('Oficina', 'Office', 'Atendimento')
              }
            />
          )}
        </List>
        {(m.note || emergencyNote) && (
          <Note>
            {m.note?.[i]}
            {m.note && emergencyNote && ' '}
            {emergencyNote}
          </Note>
        )}
        {links(m)}
        {reviewed(m)}
      </article>
    );
  }
  /** A historical reference: no phone and no route until it is checked again. */
  function reference(m: Mission) {
    return (
      <article className="f-prose" key={m.id} aria-labelledby={titleId(m)}>
        <h3 id={titleId(m)}>{`${m.name[i]}, ${m.city}`}</h3>
        {(all || m.address) && (
          <Text caption>{[all && whose(m), m.address].filter(Boolean).join(' · ')}</Text>
        )}
        {m.note && <Text>{m.note[i]}</Text>}
        {links(m)}
        <Text caption>{reviewed(m)}</Text>
      </article>
    );
  }
  return (
    <Section id="fw-help-embassy" title={t('Tu embajada', 'Your embassy', 'Sua embaixada')}>
      <Text>
        {t(
          'Encuentra tu representación y consulta cómo contactar o llegar.',
          'Find your representation, contact details and directions.',
          'Encontre sua representação e veja como entrar em contato ou chegar.',
        )}
      </Text>
      <CountrySearch
        label={t('Nacionalidad', 'Nationality', 'Nacionalidade')}
        lang={lang}
        value={nationality}
        hint={
          !all && savedNationality === nationality && nationality
            ? t(
                'Nacionalidad guardada en tu perfil.',
                'Nationality saved in your profile.',
                'Nacionalidade salva no seu perfil.',
              )
            : undefined
        }
        onChange={(value) => {
          onNationalityChange(value);
          setAll(false);
          setQuery('');
          setKind('all');
        }}
      />
      <Actions>
        <button
          type="button"
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
        {/* Only a nationality saved in Viaje needs Viaje to change it; otherwise it is chosen here. */}
        {savedNationality && (
          <button type="button" onClick={onProfile}>
            {t(
              'Editar mis datos en Viaje',
              'Edit my details in Trip',
              'Editar meus dados em Viagem',
            )}
          </button>
        )}
      </Actions>
      {all && (
        <div className="f-stack">
          <Field
            id="fw-consular-query"
            label={t(
              'Buscar país u oficina',
              'Search country or office',
              'Buscar país ou representação',
            )}
            type="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <SelectField
            id="fw-consular-kind"
            label={t('Tipo de oficina', 'Office type', 'Tipo de representação')}
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="all">{t('Todas', 'All', 'Todas')}</option>
            {Object.entries(missionKinds).map(([id, name]) => (
              <option value={id} key={id}>
                {name[i]}
              </option>
            ))}
          </SelectField>
        </div>
      )}
      <Note>
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
      </Note>
      {!!current.length && (
        <>
          {current.some((m) => missionDirections(m, mode)) && (
            <div className="f-stack" data-gap="sm">
              <span className="f-field-label" aria-hidden="true">
                {t('Rutas en Google Maps', 'Google Maps directions', 'Rotas no Google Maps')}
              </span>
              <Segmented
                block
                label={t('Rutas en Google Maps', 'Google Maps directions', 'Rotas no Google Maps')}
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'walking', label: t('A pie', 'Walking', 'A pé') },
                  { value: 'driving', label: t('En vehículo', 'Driving', 'De carro') },
                ]}
              />
            </div>
          )}
          <SafetyNotice>
            {t(
              'Confirma atención antes de ir. Las oficinas no son refugios y las rutas no están verificadas tras un desastre.',
              'Confirm services before traveling. Offices are not shelters and routes have not been verified after a disaster.',
              'Confirme o atendimento antes de ir. As representações não são abrigos e as rotas não foram verificadas após um desastre.',
            )}
          </SafetyNotice>
          <div className="f-stack">{current.map(office)}</div>
        </>
      )}
      {/* Before a choice the introduction above says what to do; after one, an empty result says why. */}
      {!current.length && (nationality || all) && (
        <Text role="status">
          {nationality === country && !all
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
        </Text>
      )}
      <TravelerSupport nationality={nationality} country={country} lang={lang} />
      {!!archived.length && (
        <Disclosure
          title={`${t(
            'Referencias históricas · vigencia sin confirmar',
            'Historical references · current status unconfirmed',
            'Referências históricas · vigência não confirmada',
          )} (${archived.length})`}
        >
          <Text>
            {t(
              'No confirman que la oficina siga operativa. Se omiten los teléfonos y las rutas antiguos hasta volver a comprobarlos.',
              'These do not confirm the office still operates. Old phone numbers and directions are omitted pending re-verification.',
              'Não confirmam que a representação continua funcionando. Os telefones e as rotas antigos ficam de fora até serem verificados de novo.',
            )}
          </Text>
          {archived.map(reference)}
        </Disclosure>
      )}
      {(fallback || destinationConsularDirectories[country]) && (
        <div className="f-stack" data-gap="sm">
          <h3 className="f-subhead">
            {t('Otros contactos oficiales', 'Other official contacts', 'Outros contatos oficiais')}
          </h3>
          <List>
            {fallback && nationality !== country && (
              <ListRow
                href={fallback.url}
                external
                title={fallback.label[i]}
                meta={hostOf(fallback.url)}
                trail={outIcon}
              />
            )}
            {destinationConsularDirectories[country]?.map((d) => {
              const [agency, what] = splitName(
                typeof d.name === 'string' ? d.name : d.name[langIndex(lang)],
              );
              return (
                <ListRow
                  key={d.url}
                  href={d.url}
                  external
                  title={what ? `${agency}: ${what}` : agency}
                  meta={d.note ? `${d.note[i]} · ${hostOf(d.url)}` : hostOf(d.url)}
                  trail={outIcon}
                />
              );
            })}
          </List>
        </div>
      )}
    </Section>
  );
}
