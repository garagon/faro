import { FirstAidKitIcon, PillIcon, ArrowUpRightIcon } from '@phosphor-icons/react';
import { careSearchUrl } from '../lib/nearbyCare.ts';
import { hostOf, splitName } from '../lib/links.ts';
import { AreaFields, useSearchArea } from './AreaPicker.tsx';
import { healthDirectories } from '../data/healthDirectories.ts';
import { pick, type Lang } from '../lib/i18n.ts';
export default function NearbyCare({ lang, country }: { lang: Lang; country: string }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const search = useSearchArea(country, lang),
    area = search.area;
  return (
    <section className="fw-care" aria-labelledby="care-title">
      <header>
        <h2 id="care-title">
          {t('Farmacias y hospitales', 'Pharmacies and hospitals', 'Farmácias e hospitais')}
        </h2>
        <p>
          {t(
            'Escribe una zona o usa tu ubicación. Antes de ir, llama para confirmar que están atendiendo.',
            'Enter an area or use your location. Before going, call to confirm they are open.',
            'Digite uma área ou use sua localização. Antes de ir, ligue para confirmar que estão atendendo.',
          )}
        </p>
      </header>
      <AreaFields state={search} lang={lang} />
      <div className="fw-care-actions">
        {(['pharmacy', 'hospital'] as const).map((kind) => {
          const label =
            kind === 'pharmacy'
              ? t('Buscar farmacias', 'Find pharmacies', 'Buscar farmácias')
              : t('Buscar hospitales', 'Find hospitals', 'Buscar hospitais');
          const Icon = kind === 'pharmacy' ? PillIcon : FirstAidKitIcon;
          const url = careSearchUrl(kind, area, lang);
          return url ? (
            <a className="fw-care-search" key={kind} href={url} target="_blank" rel="noreferrer">
              <Icon size={22} aria-hidden="true" />
              <span>
                {label}
                <small>{t('En Google Maps', 'On Google Maps', 'No Google Maps')}</small>
              </span>
              <ArrowUpRightIcon size={16} aria-hidden="true" />
            </a>
          ) : (
            <button className="fw-care-search" key={kind} disabled>
              <Icon size={22} aria-hidden="true" />
              <span>
                {label}
                <small>
                  {t('Primero elige una zona', 'Choose an area first', 'Primeiro escolha uma área')}
                </small>
              </span>
            </button>
          );
        })}
      </div>
      <small>
        {t(
          'La búsqueda se abre en Google Maps con la zona o tu ubicación aproximada. Faro no la guarda. Después de un desastre, un resultado no garantiza que el lugar esté atendiendo. Buscar necesita conexión; sin señal, usa el mapa que guardaste en Google Maps.',
          'The search opens in Google Maps with the area or your approximate location. Faro does not save it. After a disaster, a result does not guarantee the place is open. Searching needs a connection; without signal, use the map you saved in Google Maps.',
          'A busca abre no Google Maps com a área ou sua localização aproximada. O Faro não a salva. Depois de um desastre, um resultado não garante que o lugar esteja atendendo. Buscar precisa de conexão; sem sinal, use o mapa que você salvou no Google Maps.',
        )}
      </small>
      {!!healthDirectories[country]?.length && (
        <div className="fw-care-official">
          <h3>
            {t(
              'Directorios oficiales de salud',
              'Official health directories',
              'Diretórios oficiais de saúde',
            )}
          </h3>
          <ul className="fw-link-rows">
            {healthDirectories[country].map((s) => {
              const [agency, what] = splitName(s.name);
              return (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    <span>
                      <strong>{agency}</strong>
                      {what && <span>{what}</span>}
                    </span>
                    <small>
                      {hostOf(s.url)}
                      <ArrowUpRightIcon size={14} aria-hidden="true" />
                    </small>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
