import { useState } from 'react';
import { WindIcon } from 'lucide-react';
import { ageLabel } from '../lib/feedUpdates.ts';
import { checkedLabel } from '../lib/time.ts';
import { lineStamp, sourceLine } from '../lib/sourceStatus.ts';
import {
  ADVISORY_STALE,
  advisoryUrl,
  basinLabels,
  basinOf,
  graphicsUrl,
  issuerOf,
  position,
  stormClassLabels,
  wind,
  type StormsSnapshot,
} from '../lib/storms.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
import {
  Actions,
  ExpandRow,
  List,
  OutLink,
  ScopeNote,
  SourceStamp,
  StatusIcon,
} from '../ui/index.ts';

// Numbers stay with their units at a line break ("hace 2 h", "13 oct").
const nb = (text: string) => text.replace(/(\d) (?=\S)/g, '$1\u00a0');

type Props = {
  lang: Lang;
  data: StormsSnapshot | null;
  failed: boolean;
  /** When the last failed request was made, while the NHC is failing. */
  failedAt?: number | null;
  online: boolean;
  now: number;
  weather?: { name: string; url: string };
};

/** Active tropical cyclones as published by NHC/CPHC. Faro does not judge local impact. */
export default function StormsPanel(p: Props) {
  const t = (es: string, en: string, pt: string) => pick(p.lang, es, en, pt),
    idx = langIndex(p.lang);
  // Every storm starts open; the person can close the ones they have read.
  const [closed, setClosed] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const at = (n: number) => checkedLabel(n, p.now, p.lang);
  const storms = p.data?.storms ?? [];
  // Offline or older than a few polls (every 5 min), the list is the last data, said as on every
  // tab; a failing source says so with its time instead.
  const old = !!p.data && !p.failed && (!p.online || p.now - p.data.fetched > 20 * 60000);
  // The NHC's state in the one vocabulary: checked, no response or offline, with its time.
  const line = sourceLine({
    checked: p.data?.fetched ?? null,
    failed: p.failed,
    failedAt: p.failedAt,
    online: p.online,
    old,
    now: p.now,
    lang: p.lang,
  });
  return (
    <div className="f-stack grid gap-8" data-gap="lg">
      <div className="f-stack grid gap-2" data-gap="sm">
        {line.state !== 'checked' && (
          <div role="status">
            <SourceStamp issuer="NHC" state={lineStamp(line.state)}>
              {line.text}
              {/* Nothing received: the failure is never read as "no cyclones". */}
              {!p.data &&
                line.state !== 'checking' &&
                `. ${t(
                  'Esto no significa que no haya ciclones.',
                  'This does not mean there are no cyclones.',
                  'Isso não significa que não haja ciclones.',
                )}`}
            </SourceStamp>
          </div>
        )}
        {p.data && storms.length === 0 && (
          <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
            <p>
              {t(
                'El NHC no tiene ciclones activos: no emitió pronósticos en las últimas 12 horas.',
                'NHC has no active cyclones: it has issued no forecasts in the last 12 hours.',
                'O NHC não tem ciclones ativos: não emitiu previsões nas últimas 12 horas.',
              )}
            </p>
          </div>
        )}
        {storms.length > 0 && (
          <List
            label={t(
              'Ciclones tropicales activos',
              'Active tropical cyclones',
              'Ciclones tropicais ativos',
            )}
          >
            {storms.map((s) => {
              const id = `fw-storm-${s.id}`.replace(/[^\w-]/g, '_');
              const old = !!s.issued && p.now - s.issued > ADVISORY_STALE;
              return (
                <ExpandRow
                  key={id}
                  id={id}
                  open={!closed.has(id)}
                  onToggle={() => toggle(id)}
                  lead={<StatusIcon state="listed" icon={<WindIcon className="size-4" />} />}
                  title={`${stormClassLabels[s.classification][idx]} ${s.name}`}
                  meta={nb(
                    [
                      basinLabels[basinOf(s)][idx],
                      s.intensityKt !== null && wind(s.intensityKt, p.lang),
                    ]
                      .filter(Boolean)
                      .join(' · '),
                  )}
                >
                  <p>
                    {s.intensityKt !== null &&
                      `${t('Viento máximo', 'Maximum wind', 'Vento máximo')} ${wind(s.intensityKt, p.lang)}. `}
                    {s.pressureMb !== null && `${s.pressureMb} hPa. `}
                    {t('Centro en', 'Center at', 'Centro em')} {position(s)}.
                  </p>
                  <SourceStamp issuer={issuerOf(s)} state={old ? 'stale' : undefined}>
                    <span>
                      {t('Boletín', 'Advisory', 'Boletim')} {s.advisory.toUpperCase()}
                      {s.issued > 0 &&
                        nb(
                          ` · ${t('emitido', 'issued', 'emitido')} ${at(s.issued)} · ${ageLabel(s.issued, p.now, p.lang)}`,
                        )}
                      {old &&
                        ` · ${t(
                          'Puede haber uno más reciente.',
                          'A newer one may exist.',
                          'Pode haver um mais recente.',
                        )}`}
                    </span>
                  </SourceStamp>
                  <Actions>
                    <OutLink href={advisoryUrl(s, p.lang)}>
                      {p.lang === 'es' && s.spanish
                        ? 'Boletín en español'
                        : t(
                            'Boletín oficial (en inglés)',
                            'Official advisory',
                            'Boletim oficial (em inglês)',
                          )}
                    </OutLink>
                    <OutLink href={graphicsUrl(s)}>
                      {t('Trayectoria y cono', 'Track and cone', 'Trajetória e cone')}
                    </OutLink>
                  </Actions>
                </ExpandRow>
              );
            })}
          </List>
        )}
        <div>
          <SourceStamp
            issuer={
              <a href="https://www.nhc.noaa.gov/" target="_blank" rel="noreferrer">
                {t(
                  'Centro Nacional de Huracanes de NOAA',
                  'NOAA National Hurricane Center',
                  'Centro Nacional de Furacões da NOAA',
                )}
              </a>
            }
          >
            {t(
              'Atlántico, Caribe y Pacífico',
              'Atlantic, Caribbean and Pacific',
              'Atlântico, Caribe e Pacífico',
            )}
            {/* The time is said above when the data is old or the source failing. */}
            {line.state === 'checked' && ` · ${line.text}`}
          </SourceStamp>
        </div>
      </div>
      <ScopeNote>
        {t(
          'El cono muestra la trayectoria probable del centro, no el tamaño del ciclón: viento, lluvia, marejada e inundaciones pueden ocurrir fuera de él. Faro no determina si un ciclón afectará tu ubicación; las vigilancias y avisos de cada país los emite su servicio meteorológico',
          'The cone shows the probable path of the center, not the size of the storm: wind, rain, surge and flooding can occur outside it. Faro does not determine whether a cyclone will affect your location; each country’s watches and warnings come from its meteorological service',
          'O cone mostra a trajetória provável do centro, não o tamanho do ciclone: vento, chuva, maré de tempestade e inundações podem ocorrer fora dele. O Faro não determina se um ciclone afetará sua localização; as vigilâncias e os avisos de cada país são emitidos pelo seu serviço meteorológico',
        )}
        {p.weather ? (
          <>
            {' '}
            (
            <a href={p.weather.url} target="_blank" rel="noreferrer">
              {p.weather.name}
            </a>
            ).
          </>
        ) : (
          '.'
        )}
        {p.lang === 'es' &&
          p.data?.storms.some((s) => s.spanish) &&
          ' El texto en español del NHC es una traducción automática; ante dudas, el inglés es la versión oficial.'}
      </ScopeNote>
    </div>
  );
}
