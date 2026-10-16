import { useState } from 'react';
import { DropIcon, HurricaneIcon } from '@phosphor-icons/react';
import { nwsEventLabels, type NwsAlert } from '../lib/nws.ts';
import { ageLabel } from '../lib/feedUpdates.ts';
import { checkedLabel } from '../lib/time.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
import { Actions, ExpandRow, List, Note, OutLink, SourceStamp, StatusIcon } from '../ui/index.ts';

// Numbers stay with their units at a line break ("hace 2 h", "13 oct").
const nb = (text: string) => text.replace(/(\d) (?=\S)/g, '$1\u00a0');

type Props = {
  lang: Lang;
  country: string;
  data: NwsAlert[] | null;
  failed: boolean;
  /** For "issued 12:36 · 10 min ago". */
  now: number;
};

/** NWS hurricane, tropical storm and flood products for U.S. areas, listed as published. */
export default function NwsPanel({ lang, country, data, failed, now }: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    idx = langIndex(lang);
  // Every alert starts open; the person can close the ones they have read.
  const [closed, setClosed] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setClosed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const rows = data?.filter((a) => a.kind !== 'tsunami') ?? null;
  const at = (n: number) => checkedLabel(n, now, lang);
  const mainland = country === 'US';
  return (
    <div className="f-stack" data-gap="lg">
      <section className="f-section" aria-labelledby="fw-nws-weather-title">
        <h2 className="f-section-title" id="fw-nws-weather-title">
          {t(
            'Avisos de huracán e inundación',
            'Hurricane and flood alerts',
            'Avisos de furacão e inundação',
          )}
        </h2>
        {failed && (
          <div role="status">
            <SourceStamp issuer="NWS" state="error">
              <span>
                {t(
                  'No se pudo consultar el NWS. No podemos confirmar si hay avisos.',
                  'The NWS could not be reached. We cannot confirm whether alerts exist.',
                  'Não foi possível consultar o NWS. Não podemos confirmar se há avisos.',
                )}
              </span>
            </SourceStamp>
          </div>
        )}
        {!rows && !failed && (
          <div className="f-prose">
            <p>{t('Consultando el NWS…', 'Checking NWS…', 'Consultando o NWS…')}</p>
          </div>
        )}
        {rows && rows.length === 0 && !failed && (
          <div className="f-prose">
            <p>
              {t(
                'El NWS no lista avisos de este tipo activos.',
                'The NWS lists no active alerts of this kind.',
                'O NWS não lista avisos ativos deste tipo.',
              )}
            </p>
          </div>
        )}
        {rows && rows.length > 0 && (
          <List label="NWS">
            {rows.slice(0, 8).map((a) => {
              const id = `fw-nws-${a.id}`.replace(/[^\w-]/g, '_');
              return (
                <ExpandRow
                  key={id}
                  id={id}
                  open={!closed.has(id)}
                  onToggle={() => toggle(id)}
                  // An alert in force; its name says which (warning, watch, advisory).
                  lead={
                    <StatusIcon
                      state="listed"
                      level={a.emergency ? 3 : 1}
                      icon={
                        a.kind === 'tropical' ? (
                          <HurricaneIcon size={20} weight="bold" />
                        ) : (
                          <DropIcon size={20} weight="fill" />
                        )
                      }
                    />
                  }
                  // A flash flood warning tagged catastrophic is, in NWS's words, an emergency:
                  // that is its name here, with the alert red of the icon.
                  title={
                    a.emergency
                      ? t(
                          'Emergencia por inundación repentina',
                          'Flash flood emergency',
                          'Emergência por inundação repentina',
                        )
                      : nwsEventLabels[a.event][idx]
                  }
                  meta={nb(
                    `${a.sender} · ${t('emitido', 'issued', 'emitido')} ${at(a.sent)} · ${ageLabel(a.sent, now, lang)}`,
                  )}
                >
                  {a.emergency && <p>{nwsEventLabels[a.event][idx]}</p>}
                  <p lang="en">{a.area}</p>
                  {a.expires && (
                    <p>
                      {t('Hasta', 'Until', 'Até')} {at(a.expires)}
                    </p>
                  )}
                  <Actions>
                    <OutLink
                      href={
                        a.kind === 'tropical'
                          ? 'https://www.nhc.noaa.gov/'
                          : 'https://www.weather.gov/alerts'
                      }
                    >
                      {t('Ver en la fuente', 'View at source', 'Ver na fonte')}
                    </OutLink>
                  </Actions>
                </ExpandRow>
              );
            })}
          </List>
        )}
        <Note
          more={
            <span>
              {t('Fuente', 'Source', 'Fonte')}:{' '}
              <a href="https://www.weather.gov/alerts" target="_blank" rel="noreferrer">
                NOAA, National Weather Service
              </a>
              .
            </span>
          }
        >
          {mainland
            ? t(
                'En EE. UU. continental se muestran avisos tropicales y de inundación repentina; los avisos locales de inundación están en weather.gov. Que no aparezca un aviso no significa que no haya riesgo.',
                'For the U.S. mainland, tropical and flash flood warnings are shown; local flood products are on weather.gov. No alert listed does not mean there is no risk.',
                'Nos EUA continentais, aparecem avisos tropicais e de inundação repentina; os avisos locais de inundação estão em weather.gov. Nenhum aviso na lista não significa que não haja risco.',
              )
            : t(
                'Avisos del NWS para este territorio; revisa las zonas indicadas en cada uno.',
                'NWS alerts for this territory; check the areas listed in each one.',
                'Avisos do NWS para este território; confira as áreas indicadas em cada um.',
              )}
        </Note>
      </section>
    </div>
  );
}
