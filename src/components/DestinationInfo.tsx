import { useState } from 'react';
import { ArrowUpRightIcon } from 'lucide-react';
import { destinationFor } from '../data/destinations/index.ts';
import { missionsFor } from '../data/consularMissions.ts';
import { hostOf } from '../lib/links.ts';
import { caption, keepSeparators } from '../lib/caption.ts';
import type { Lang, Resource } from '../lib/resources.ts';
import { langIndex, pick } from '../lib/i18n.ts';
import {
  Actions,
  Disclosure,
  ExpandRow,
  List,
  ListRow,
  OutLink,
  Section,
  Text,
} from '../ui/index.ts';

type Props = {
  country: string;
  lang: Lang;
  /** Further official resources for this country (and worldwide ones), each opened on request. */
  resources?: readonly Resource[];
  /** The selected region as the app names it ("Panamá", "Todo el mundo"). */
  regionName?: string;
  /** Opens the País screen, where the country is changed. */
  onCountry?: () => void;
};

/** The country's official agencies, what Faro covers there, and further official resources. */
export default function DestinationInfo({
  country,
  lang,
  resources = [],
  regionName,
  onCountry,
}: Props) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    idx = langIndex(lang);
  const data = destinationFor(country);
  const name =
    country === 'WORLD' ? '' : new Intl.DisplayNames([lang], { type: 'region' }).of(country);
  const missions = missionsFor(country).filter((m) => !m.historical).length;
  const title = t('Organismos oficiales', 'Official agencies', 'Órgãos oficiais');
  const toggle = (id: string) => {
    const next = new Set(open);
    if (!next.delete(id)) next.add(id);
    setOpen(next);
  };
  const more = resources.length > 0 && (
    <div className="f-stack grid gap-2" data-gap="sm">
      <h3 className="f-subhead m-0 text-sm leading-snug font-medium">
        {t(
          'Más recursos y preparación',
          'More resources and preparedness',
          'Mais recursos e preparação',
        )}
      </h3>
      {regionName && (
        <Text caption>
          {t('Región', 'Region', 'Região')}: {regionName}.
          {onCountry && (
            <>
              {' '}
              {t('Cambia el país en', 'Change the country in', 'Altere o país em')}{' '}
              <button
                type="button"
                className="f-inline-link inline cursor-pointer rounded-sm border-0 bg-transparent p-0 font-medium text-foreground underline underline-offset-4 outline-none hover:decoration-2 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                onClick={onCountry}
              >
                {t('País', 'Country', 'País')}
              </button>
              .
            </>
          )}
        </Text>
      )}
      <List>
        {resources.map((r) => {
          const id = `fw-resource-${r.url.replace(/\W+/g, '-')}`;
          return (
            <ExpandRow
              key={r.url}
              id={id}
              open={open.has(id)}
              onToggle={() => toggle(id)}
              title={keepSeparators(r.name)}
              meta={keepSeparators(r.category[idx])}
            >
              {/* When each link was last reviewed is said on Fuentes, not on the row. */}
              <Text>{r.description[idx]}</Text>
              <Actions>
                <OutLink href={r.url}>
                  {t('Sitio oficial', 'Official website', 'Site oficial')}
                </OutLink>
              </Actions>
            </ExpandRow>
          );
        })}
      </List>
    </div>
  );
  if (!data)
    return (
      <Section id="fw-sources" title={title}>
        <div className="f-stack grid gap-2" data-gap="sm">
          <h3 className="f-subhead m-0 text-sm leading-snug font-medium">
            {country === 'WORLD'
              ? t(
                  'Elige el país donde necesitas ayuda',
                  'Choose the country where you need help',
                  'Escolha o país onde você precisa de ajuda',
                )
              : t(
                  `Faltan datos locales para ${name}`,
                  `Local information for ${name} is not yet available`,
                  `Ainda não há dados locais: ${name}`,
                )}
          </h3>
          <Text>
            {t(
              'Puedes consultar sismos de USGS y guardar tu plan. Para teléfonos, evacuación y asistencia, consulta a la autoridad local o a recepción.',
              'You can view USGS earthquakes and save your plan. For phone numbers, evacuation and assistance, check with local authorities or reception.',
              'Você pode consultar os terremotos do USGS e salvar seu plano. Para telefones, evacuação e assistência, consulte a autoridade local ou a recepção.',
            )}
          </Text>
        </div>
        {more}
      </Section>
    );
  const links = [
    // One caption line each: what the agency publishes, then the site that opens.
    {
      source: data.civilProtection,
      label: t('Avisos y recomendaciones', 'Notices and guidance', 'Avisos e recomendações'),
    },
    {
      source: data.weatherAgency,
      label: t('Avisos del tiempo', 'Weather warnings', 'Avisos do tempo'),
    },
    {
      source: data.seismicAgency,
      label: t('Sismos', 'Earthquakes', 'Terremotos'),
    },
    {
      source: data.evacuation,
      label: t('Planos de evacuación', 'Evacuation maps', 'Mapas de evacuação'),
    },
  ];
  return (
    <Section id="fw-sources" title={title}>
      <Text>
        {t(
          'Cada enlace abre el sitio del organismo. Sus publicaciones más recientes están allí.',
          'Each link opens the agency’s website, where its latest publications are.',
          'Cada link abre o site do órgão. As publicações mais recentes estão lá.',
        )}
      </Text>
      <List
        label={t(
          `Fuentes oficiales en ${name}`,
          `Official sources in ${name}`,
          `Fontes oficiais · ${name}`,
        )}
      >
        {links.map(
          ({ source, label }) =>
            source && (
              <ListRow
                key={source.url}
                href={source.url}
                external
                title={keepSeparators(source.name)}
                meta={caption(label, hostOf(source.url))}
                trail={<ArrowUpRightIcon className="size-4" aria-hidden="true" />}
              />
            ),
        )}
      </List>
      <Disclosure
        title={t(
          'Qué información ofrece Faro aquí',
          'What Faro covers here',
          'O que o Faro oferece aqui',
        )}
      >
        <dl className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
          <div>
            <dt>{t('Sismos en el mapa', 'Earthquakes on the map', 'Terremotos no mapa')}</dt>
            <dd>
              {country === 'PA'
                ? t(
                    'EMSC mientras el IGC de la Universidad de Panamá no publique registros nuevos; IGC y USGS como alternativas. La red nacional puede publicar más eventos.',
                    'EMSC while the University of Panama IGC is not publishing new records; IGC and USGS as alternatives. The national network may report more events.',
                    'EMSC enquanto o IGC da Universidade do Panamá não publicar registros novos; IGC e USGS como alternativas. A rede nacional pode publicar mais eventos.',
                  )
                : country === 'US'
                  ? t(
                      'USGS, con EMSC como alternativa.',
                      'USGS, with EMSC as an alternative.',
                      'USGS, com EMSC como alternativa.',
                    )
                  : t(
                      'EMSC, con USGS como alternativa. La red nacional puede publicar más eventos.',
                      'EMSC, with USGS as an alternative. The national network may report more events.',
                      'EMSC, com USGS como alternativa. A rede nacional pode publicar mais eventos.',
                    )}
            </dd>
          </div>
          <div>
            <dt>{t('Asistencia consular', 'Consular assistance', 'Assistência consular')}</dt>
            <dd>
              {missions
                ? t(
                    `${missions} representaciones con ficha. Selecciona tu nacionalidad arriba.`,
                    `${missions} missions with contact details. Select your nationality above.`,
                    `${missions} representações com ficha. Selecione sua nacionalidade acima.`,
                  )
                : t(
                    'Sin direcciones locales verificadas en Faro. Usa el directorio oficial cuando esté disponible.',
                    'No local addresses verified in Faro. Use the official directory where available.',
                    'Sem endereços locais verificados no Faro. Use o diretório oficial quando estiver disponível.',
                  )}
            </dd>
          </div>
          <div>
            <dt>
              {t('Refugios y voluntariado', 'Shelters and volunteering', 'Abrigos e voluntariado')}
            </dt>
            <dd>
              {t(
                'Sin disponibilidad confirmada. Consulta a la autoridad antes de trasladarte.',
                'No confirmed availability. Check with the authority before traveling.',
                'Sem disponibilidade confirmada. Consulte a autoridade antes de se deslocar.',
              )}
            </dd>
          </div>
        </dl>
      </Disclosure>
      {more}
    </Section>
  );
}
