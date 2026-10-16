import { ArrowUpRightIcon, CrosshairIcon, FirstAidKitIcon, PillIcon } from '@phosphor-icons/react';
import { careSearchUrl } from '../lib/nearbyCare.ts';
import { hostOf, splitName } from '../lib/links.ts';
import { useSearchArea } from './AreaPicker.tsx';
import { careAreas } from '../data/careAreas.ts';
import { healthDirectories } from '../data/healthDirectories.ts';
import { pick, type Lang } from '../lib/i18n.ts';
import {
  Button,
  Field,
  List,
  ListRow,
  Note,
  RowIcon,
  Section,
  SelectField,
  Text,
} from '../ui/index.ts';

const outIcon = <ArrowUpRightIcon size={16} aria-hidden="true" />;

/**
 * Searches for pharmacies and hospitals around an area the person types, picks or shares. The
 * search opens on Google Maps only when tapped; nothing is stored (see useSearchArea).
 */
export default function NearbyCare({ lang, country }: { lang: Lang; country: string }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const search = useSearchArea(country, lang);
  const { place, gps, status, area, countryName } = search;
  const areas = careAreas[country] ?? [];
  // A common area shows as chosen while the box still holds exactly its name.
  const chosenArea = !gps && areas.includes(place.trim()) ? place.trim() : '';
  return (
    <Section
      id="fw-help-care"
      title={t('Farmacias y hospitales', 'Pharmacies and hospitals', 'Farmácias e hospitais')}
    >
      <Text>
        {t(
          'Escribe una zona o usa tu ubicación. Antes de ir, llama para confirmar que están atendiendo.',
          'Enter an area or use your location. Before going, call to confirm they are open.',
          'Digite uma área ou use sua localização. Antes de ir, ligue para confirmar que estão atendendo.',
        )}
      </Text>
      <Field
        id="fw-care-place"
        label={t(
          'Ciudad, barrio o dirección',
          'City, neighborhood or address',
          'Cidade, bairro ou endereço',
        )}
        maxLength={160}
        value={place}
        placeholder={t(
          'Ej.: El Cangrejo, Ciudad de Panamá',
          'E.g. El Cangrejo, Panama City',
          'Ex.: El Cangrejo, Cidade do Panamá',
        )}
        onChange={(e) => search.setPlace(e.target.value)}
      />
      {areas.length > 0 && (
        <SelectField
          id="fw-care-areas"
          label={t('Zonas frecuentes', 'Common areas', 'Áreas frequentes')}
          value={chosenArea}
          onChange={(e) => e.target.value && search.setPlace(e.target.value)}
        >
          <option value="">{t('Elige una zona', 'Choose an area', 'Escolha uma área')}</option>
          {areas.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </SelectField>
      )}
      <Button
        variant="secondary"
        icon={<CrosshairIcon size={20} aria-hidden="true" />}
        // Unavailable while a request is running, but kept focusable and readable (no dimming).
        aria-disabled={status === 'pending' || undefined}
        onClick={() => status !== 'pending' && search.locate()}
      >
        {status === 'pending'
          ? t('Buscando ubicación…', 'Finding location…', 'Buscando localização…')
          : t('Usar mi ubicación', 'Use my location', 'Usar minha localização')}
      </Button>
      <div role="status">
        <Note>
          {status === 'failed'
            ? t(
                'No se obtuvo tu ubicación. Escribe una ciudad o dirección.',
                'Location unavailable. Enter a city or address.',
                'Não foi possível obter sua localização. Digite uma cidade ou endereço.',
              )
            : gps
              ? t(
                  `Búsqueda alrededor de ${gps}. Tu ubicación puede estar en otro país que el seleccionado.`,
                  `Search around ${gps}. Your location may be in a different country from the selected one.`,
                  `Busca ao redor de ${gps}. Sua localização pode estar em um país diferente do selecionado.`,
                )
              : area
                ? t(`Se buscará en ${area}.`, `Searching in ${area}.`, `Área da busca: ${area}.`)
                : t(
                    `Buscar en ${countryName || 'el lugar que escribas'}.`,
                    `Search in ${countryName || 'the place you enter'}.`,
                    `Área da busca: ${countryName || 'o lugar que você digitar'}.`,
                  )}
        </Note>
      </div>
      <List label={t('Buscar en Google Maps', 'Search Google Maps', 'Buscar no Google Maps')}>
        {(['pharmacy', 'hospital'] as const).map((kind) => {
          const label =
            kind === 'pharmacy'
              ? t('Buscar farmacias', 'Find pharmacies', 'Buscar farmácias')
              : t('Buscar hospitales', 'Find hospitals', 'Buscar hospitais');
          const Icon = kind === 'pharmacy' ? PillIcon : FirstAidKitIcon;
          const url = careSearchUrl(kind, area, lang);
          const lead = <RowIcon icon={<Icon size={20} />} />;
          return url ? (
            <ListRow
              key={kind}
              lead={lead}
              title={label}
              meta={t('En Google Maps', 'On Google Maps', 'No Google Maps')}
              href={url}
              external
              trail={outIcon}
            />
          ) : (
            // Nothing to search yet: a row that says what is missing, not a link.
            <ListRow
              key={kind}
              lead={lead}
              title={label}
              meta={t(
                'Primero elige una zona',
                'Choose an area first',
                'Primeiro escolha uma área',
              )}
            />
          );
        })}
      </List>
      <Note>
        {t(
          'La búsqueda se abre en Google Maps con la zona o tu ubicación aproximada. Faro no la guarda. Después de un desastre, un resultado no garantiza que el lugar esté atendiendo. Buscar necesita conexión; sin señal, usa el mapa que guardaste en Google Maps.',
          'The search opens in Google Maps with the area or your approximate location. Faro does not save it. After a disaster, a result does not guarantee the place is open. Searching needs a connection; without signal, use the map you saved in Google Maps.',
          'A busca abre no Google Maps com a área ou sua localização aproximada. O Faro não a salva. Depois de um desastre, um resultado não garante que o lugar esteja atendendo. Buscar precisa de conexão; sem sinal, use o mapa que você salvou no Google Maps.',
        )}
      </Note>
      {!!healthDirectories[country]?.length && (
        <div className="f-stack" data-gap="sm">
          <h3 className="f-subhead">
            {t(
              'Directorios oficiales de salud',
              'Official health directories',
              'Diretórios oficiais de saúde',
            )}
          </h3>
          <List>
            {healthDirectories[country].map((s) => {
              const [agency, what] = splitName(s.name);
              return (
                <ListRow
                  key={s.url}
                  href={s.url}
                  external
                  title={what ? `${agency}: ${what}` : agency}
                  // Official pages in Spanish: said for English and Portuguese readers.
                  meta={`${hostOf(s.url)}${what ? t('', ' · in Spanish', ' · em espanhol') : ''}`}
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
