import type { Quake } from '../lib/domain.ts';
import { emscFeltLink, intensityLabel, pagerLabel, usgsEventLink } from '../lib/impact.ts';
import { pick, type Lang } from '../lib/i18n.ts';
import { Actions, Badge, Facts, Note, OutLink, type Fact } from '../ui/index.ts';

type Props = { q: Quake; lang: Lang; onTsunami: () => void };

// PAGER colours on Faro's official scale; green is listed without a warning colour.
const pagerLevel = { green: undefined, yellow: 1, orange: 2, red: 3 } as const;

/** Products published by the catalog itself. Faro does not compute intensity or impact. */
export default function QuakeImpact({ q, lang, onTsunami }: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const impact = q.impact;
  // Report forms open on the agency's site; nothing passes through Faro.
  const feltUrl =
    q.source === 'USGS'
      ? usgsEventLink(q.url, 'tellus')
      : q.source === 'EMSC'
        ? emscFeltLink(q.url)
        : null;
  const reported = impact && (impact.alert || impact.felt || impact.mmi !== null || impact.tsunami);
  const credited = q.source === 'EMSC' && !!q.authority;
  if (!impact && !feltUrl && !credited) return null;
  const facts: Fact[] = [];
  if (impact?.alert)
    facts.push({
      id: 'pager',
      term: t('Alerta PAGER', 'PAGER alert', 'Alerta PAGER'),
      hint: t(
        'Estimación de víctimas y pérdidas',
        'Estimated casualties and losses',
        'Estimativa de vítimas e perdas',
      ),
      value: <Badge level={pagerLevel[impact.alert]}>{pagerLabel(impact.alert, lang)}</Badge>,
    });
  if (impact && impact.mmi !== null)
    facts.push({
      id: 'mmi',
      term: t(
        'Intensidad máxima estimada',
        'Maximum estimated intensity',
        'Intensidade máxima estimada',
      ),
      hint: 'ShakeMap',
      value: intensityLabel(impact.mmi, lang),
    });
  if (impact && impact.felt !== null && impact.felt > 0) {
    facts.push({
      id: 'felt',
      term: t('Personas que lo reportaron', 'People who reported it', 'Pessoas que relataram'),
      hint: t('¿Lo sentiste?', 'Did You Feel It?', 'Você sentiu?'),
      value: new Intl.NumberFormat(lang).format(impact.felt),
    });
    if (impact.cdi !== null)
      facts.push({
        id: 'cdi',
        term: t(
          'Intensidad máxima reportada',
          'Maximum reported intensity',
          'Intensidade máxima relatada',
        ),
        hint: t('Por las personas', 'By people', 'Pelas pessoas'),
        value: intensityLabel(impact.cdi, lang),
      });
  }
  return (
    <section
      className="f-stack grid gap-4"
      aria-label={t('Datos oficiales de impacto', 'Impact data', 'Dados oficiais de impacto')}
    >
      {credited && (
        <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
          <p className="f-caption m-0 text-sm text-muted-foreground">
            {t(
              `Calculado por ${q.authority}, publicado por EMSC.`,
              `Calculated by ${q.authority}, published by EMSC.`,
              `Calculado por ${q.authority}, publicado pelo EMSC.`,
            )}
          </p>
        </div>
      )}
      {impact && (
        <>
          <div className="f-stack grid gap-2" data-gap="sm">
            <h3 className="f-subhead m-0 text-sm leading-snug font-medium">
              {t('Lo que publica USGS', 'What USGS publishes', 'O que o USGS publica')}
            </h3>
            {reported ? (
              facts.length > 0 && <Facts items={facts} />
            ) : (
              <div className="f-prose grid max-w-2xl gap-3 *:m-0 [&_dd]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dt]:font-medium [&_h3]:text-sm [&_h3]:font-medium [&_small]:text-sm [&_small]:text-muted-foreground [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-2 [&_ul]:ps-5">
                <p>
                  {t(
                    'USGS no ha publicado alerta PAGER, intensidad ni reportes para este sismo. Puede publicarlos más tarde.',
                    'USGS has not published a PAGER alert, intensity or reports for this earthquake. It may do so later.',
                    'O USGS não publicou alerta PAGER, intensidade nem relatos para este terremoto. Pode publicá-los mais tarde.',
                  )}
                </p>
              </div>
            )}
          </div>
          {impact.tsunami && (
            <Note
              more={
                <button
                  type="button"
                  className="f-inline-link inline cursor-pointer rounded-sm border-0 bg-transparent p-0 font-medium text-foreground underline underline-offset-4 outline-none hover:decoration-2 focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  onClick={onTsunami}
                >
                  {t('Ver avisos de tsunami', 'See tsunami notices', 'Ver avisos de tsunami')}
                </button>
              }
            >
              {t(
                'USGS lo marca como sismo grande en zona oceánica y remite a tsunami.gov. La marca no indica si hubo o habrá un tsunami.',
                'USGS flags it as a large event in an oceanic region and points to tsunami.gov. The flag does not say whether a tsunami occurred or will occur.',
                'O USGS o marca como terremoto grande em zona oceânica e remete a tsunami.gov. A marca não indica se houve ou haverá um tsunami.',
              )}
            </Note>
          )}
          <Note>
            {t(
              'Son estimaciones regionales de USGS. No describen el riesgo ni la intensidad en tu ubicación.',
              'These are USGS regional estimates. They do not describe risk or intensity at your location.',
              'São estimativas regionais do USGS. Não descrevem o risco nem a intensidade na sua localização.',
            )}
          </Note>
          {(impact.mmi !== null || impact.alert) && (
            <Actions>
              {impact.mmi !== null && (
                <OutLink href={usgsEventLink(q.url, 'shakemap') ?? q.url}>ShakeMap</OutLink>
              )}
              {impact.alert && (
                <OutLink href={usgsEventLink(q.url, 'pager') ?? q.url}>PAGER</OutLink>
              )}
            </Actions>
          )}
        </>
      )}
      {feltUrl && (
        <Actions>
          <OutLink href={feltUrl}>
            {t(
              '¿Lo sentiste? Repórtalo a',
              'Did you feel it? Report it to',
              'Você sentiu? Relate ao',
            )}{' '}
            {q.source === 'USGS' ? 'USGS' : 'EMSC'}
          </OutLink>
        </Actions>
      )}
    </section>
  );
}
