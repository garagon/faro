import { ArrowUpRightIcon, CrosshairIcon } from 'lucide-react';
import { careSearchUrl } from '../lib/nearbyCare.ts';
import { hostOf, splitName } from '../lib/links.ts';
import { caption } from '../lib/caption.ts';
import { areaStatus, useSearchArea } from './AreaPicker.tsx';
import { careAreas } from '../data/careAreas.ts';
import { healthDirectories } from '../data/healthDirectories.ts';
import { pick, type Lang } from '../lib/i18n.ts';
import { Button, Field, List, ListRow, Note, Section, SelectField, Text } from '../ui/index.ts';

const outIcon = <ArrowUpRightIcon className="size-4" aria-hidden="true" />;

/**
 * Searches for pharmacies and hospitals around an area the person types, picks or shares. The
 * search opens on Google Maps only when tapped; nothing is stored (see useSearchArea).
 */
export default function NearbyCare({ lang, country }: { lang: Lang; country: string }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const search = useSearchArea(country, lang);
  const { place, gps, status, area } = search;
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
          'Escribe una zona o usa tu ubicación. Tras un desastre, un resultado no garantiza que atiendan: llama antes de ir.',
          'Enter an area or use your location. After a disaster, a result does not mean they are open: call before going.',
          'Digite uma área ou use sua localização. Depois de um desastre, um resultado não garante atendimento: ligue antes de ir.',
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
        icon={<CrosshairIcon className="size-4" aria-hidden="true" />}
        // Unavailable while a request is running, but kept focusable and readable (no dimming).
        aria-disabled={status === 'pending' || undefined}
        onClick={() => status !== 'pending' && search.locate()}
      >
        {status === 'pending'
          ? t('Buscando ubicación…', 'Finding location…', 'Buscando localização…')
          : t('Usar mi ubicación', 'Use my location', 'Usar minha localização')}
      </Button>
      <div role="status">
        <Note>{areaStatus(search, lang)}</Note>
      </div>
      {/* No icons: no other row in Ayuda has one, so every row starts at the same edge. */}
      <List label={t('Buscar en Google Maps', 'Search Google Maps', 'Buscar no Google Maps')}>
        {(['pharmacy', 'hospital'] as const).map((kind) => {
          const label =
            kind === 'pharmacy'
              ? t('Buscar farmacias', 'Find pharmacies', 'Buscar farmácias')
              : t('Buscar hospitales', 'Find hospitals', 'Buscar hospitais');
          const url = careSearchUrl(kind, area, lang);
          return url ? (
            <ListRow
              key={kind}
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
      {/* What the third party receives, in one line next to its buttons. */}
      <Note>
        {t(
          'Google Maps recibe la zona; Faro no la guarda.',
          'Google Maps gets the area; Faro keeps nothing.',
          'O Google Maps recebe a área; o Faro não a guarda.',
        )}
      </Note>
      {!!healthDirectories[country]?.length && (
        <div className="f-stack grid gap-2" data-gap="sm">
          <h3 className="f-subhead m-0 text-sm leading-snug font-medium">
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
                  meta={caption(hostOf(s.url), what && t('', 'in Spanish', 'em espanhol'))}
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
