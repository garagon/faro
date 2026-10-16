import { ArrowUpRightIcon, MapPinIcon } from '@phosphor-icons/react';
import { displayPlace, distanceKm, placeLang, type Quake } from '../lib/domain.ts';
import type { Geo } from './WebMap.tsx';
import QuakeImpact from './QuakeImpact.tsx';
import { langTag, pick, type Lang } from '../lib/i18n.ts';
import { depthInFull, distance } from '../lib/units.ts';
import {
  Disclosure,
  Button,
  Facts,
  LinkButton,
  Magnitude,
  Note,
  OutLink,
  Sheet,
} from '../ui/index.ts';
type Props = {
  open: boolean;
  selected: Quake | undefined;
  geo: Geo | null;
  lang: Lang;
  provider: string;
  fetched: number | null;
  generated: number | null;
  onClose: () => void;
  onMap: (q: Quake) => void;
  onTsunami: () => void;
};

/**
 * One earthquake as its catalogue published it: magnitude, place, time, depth and epicentre,
 * then what the agency itself publishes about impact. Nothing here is a risk rating.
 */
export default function InformationDialog(p: Props) {
  const { selected: q, lang } = p,
    t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const stamp = (n: number, utc = false) =>
    new Intl.DateTimeFormat(lang, {
      dateStyle: 'medium',
      timeStyle: 'medium',
      ...(utc ? { timeZone: 'UTC' } : {}),
    }).format(n);
  const local = (n: number) =>
    new Intl.DateTimeFormat(lang, {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(n);
  const zoneName = (n: number) =>
    new Intl.DateTimeFormat(lang, { timeZoneName: 'short' })
      .formatToParts(n)
      .find((part) => part.type === 'timeZoneName')?.value ?? '';
  const ago = (n: number) => {
    const min = Math.max(0, Math.round((Date.now() - n) / 60000));
    return min < 60
      ? t(`hace ${min} min`, `${min} min ago`, `há ${min} min`)
      : min < 48 * 60
        ? t(
            `hace ${Math.round(min / 60)} h`,
            `${Math.round(min / 60)} h ago`,
            `há ${Math.round(min / 60)} h`,
          )
        : t(
            `hace ${Math.round(min / 1440)} días`,
            `${Math.round(min / 1440)} days ago`,
            `há ${Math.round(min / 1440)} dias`,
          );
  };
  const close = t('Cerrar', 'Close', 'Fechar');
  if (!q)
    return (
      <Sheet
        open={p.open}
        onClose={p.onClose}
        lang={langTag(lang)}
        closeLabel={close}
        title={t('Detalle del sismo', 'Earthquake details', 'Detalhes do terremoto')}
        description={t(
          'Datos publicados por el catálogo oficial.',
          'Data published by the official catalog.',
          'Dados publicados pelo catálogo oficial.',
        )}
      >
        <p>
          {t(
            'Este evento ya no está en el catálogo actual.',
            'This event is no longer in the current catalog.',
            'Este evento não está mais no catálogo atual.',
          )}
        </p>
      </Sheet>
    );
  const magType = q.magType && q.magType.toUpperCase() !== 'M' ? q.magType : '';
  return (
    <Sheet
      open={p.open}
      onClose={p.onClose}
      lang={langTag(lang)}
      closeLabel={close}
      lead={
        <Magnitude
          value={q.mag}
          size="lg"
          label={`${t('magnitud', 'magnitude', 'magnitude')}${magType ? ` ${magType}` : ''}`}
        />
      }
      title={<span lang={placeLang(q)}>{displayPlace(q.place)}</span>}
      description={
        <>
          {/* Who calculated it, when EMSC credits another agency, is under the facts. */}
          {ago(q.time)} · {q.source || 'USGS'} ·{' '}
          {q.reviewed
            ? t('revisado', 'reviewed', 'revisado')
            : q.source === 'EMSC'
              ? t(
                  'la fuente no indica si fue revisado',
                  'the source does not say whether it was reviewed',
                  'a fonte não indica se foi revisado',
                )
              : t('preliminar', 'preliminary', 'preliminar')}
        </>
      }
      actions={
        <>
          <Button icon={<MapPinIcon size={18} aria-hidden="true" />} onClick={() => p.onMap(q)}>
            {t('Ver en el mapa', 'Show on map', 'Ver no mapa')}
          </Button>
          {q.url && (
            <LinkButton variant="secondary" href={q.url} external>
              {t('Reporte oficial', 'Official report', 'Relatório oficial')}
              <ArrowUpRightIcon size={16} aria-hidden="true" />
            </LinkButton>
          )}
        </>
      }
    >
      <Facts
        items={[
          {
            id: 'time',
            term: t('Hora', 'Time', 'Horário'),
            value: (
              <>
                <time dateTime={new Date(q.time).toISOString()}>{local(q.time)}</time>{' '}
                {zoneName(q.time)}
              </>
            ),
          },
          { id: 'utc', term: t('Hora UTC', 'UTC time', 'Horário UTC'), value: stamp(q.time, true) },
          {
            id: 'depth',
            term: t('Profundidad', 'Depth', 'Profundidade'),
            value: depthInFull(q.depth, lang),
          },
          {
            id: 'epicentre',
            term: t('Epicentro', 'Epicenter', 'Epicentro'),
            value: `${q.lat.toFixed(4)}, ${q.lng.toFixed(4)}`,
          },
          ...(p.geo
            ? [
                {
                  id: 'distance',
                  term: t('Distancia a ti', 'Distance from you', 'Distância de você'),
                  value: distance(distanceKm([p.geo.lat, p.geo.lng], [q.lat, q.lng]), lang),
                },
              ]
            : []),
        ]}
      />
      <Note>
        {t(
          'La magnitud y la distancia no determinan el riesgo en tu ubicación. El catálogo no indica si el sismo es una réplica.',
          'Magnitude and distance do not determine risk at your location. The catalog does not say whether the earthquake is an aftershock.',
          'A magnitude e a distância não determinam o risco na sua localização. O catálogo não indica se o terremoto é uma réplica.',
        )}
      </Note>
      <QuakeImpact q={q} lang={lang} onTsunami={p.onTsunami} />
      <MoreDetails q={q} lang={lang} stamp={stamp} />
    </Sheet>
  );
}

/** The rest of the record, opened in place; closed again each time the sheet opens. */
function MoreDetails({ q, lang, stamp }: { q: Quake; lang: Lang; stamp: (n: number) => string }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const magType = q.magType && q.magType.toUpperCase() !== 'M' ? q.magType : '';
  return (
    <Disclosure
      title={t('Más datos del registro', 'More record details', 'Mais dados do registro')}
    >
      <Facts
        items={[
          {
            id: 'updated',
            term: t('Última revisión', 'Last revision', 'Última revisão'),
            value: q.updated
              ? stamp(q.updated)
              : t(
                  'La fuente no indica esta fecha',
                  'Not provided by the source',
                  'A fonte não indica esta data',
                ),
          },
          {
            id: 'type',
            term: t('Tipo de magnitud', 'Magnitude type', 'Tipo de magnitude'),
            value:
              magType ||
              t(
                'No especificado por la fuente',
                'Not specified by the source',
                'Não especificado pela fonte',
              ),
          },
          { id: 'id', term: 'ID', value: q.id },
        ]}
      />
      <Note
        more={
          <OutLink href="https://www.usgs.gov/programs/earthquake-hazards/earthquake-magnitude-energy-release-and-shaking-intensity">
            {t(
              'Magnitud e intensidad, USGS',
              'Magnitude and intensity, USGS',
              'Magnitude e intensidade, USGS',
            )}
          </OutLink>
        }
      >
        {t(
          'La magnitud expresa el tamaño del sismo. La intensidad describe cuánto se sintió en un lugar y puede variar entre localidades.',
          'Magnitude describes the size of an earthquake. Intensity describes shaking at a location and can vary from place to place.',
          'A magnitude expressa o tamanho do terremoto. A intensidade descreve quanto ele foi sentido em um lugar e pode variar entre localidades.',
        )}
      </Note>
    </Disclosure>
  );
}
