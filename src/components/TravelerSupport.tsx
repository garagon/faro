import { useState } from 'react';
import { supportFor, type TravelerSupport as Support } from '../data/travelerSupport.ts';
import { reviewDate } from '../lib/links.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
import { Actions, ExpandRow, List, Note, OutLink, PhoneRow, Text } from '../ui/index.ts';

type Props = {
  nationality: string;
  country: string;
  lang: Lang;
  /**
   * Where it is shown. `traveler` (under the embassy): the agency's help for the traveler.
   * `family`: its phone block, when every line in it is only for callers at home, so it reads
   * as help for the family. The phone block appears in exactly one of the two.
   */
  part?: 'traveler' | 'family';
};

/** No line in the block can be called from abroad: it is for relatives at home. */
const homeOnly = (support: Support) =>
  support.contacts.length > 0 && !support.contacts.some((c) => c.abroad);

export default function TravelerSupport({ nationality, country, lang, part = 'traveler' }: Props) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const support = supportFor(nationality, country);
  if (!support) return null;
  const i = langIndex(lang);
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const advisories = support.advisories;
  // Never fall back to another country's advisory: unknown destinations use the official index.
  const advisory = advisories?.destinations[country];
  const countryName =
    country === 'WORLD' ? '' : new Intl.DisplayNames([lang], { type: 'region' }).of(country);
  const forFamily = homeOnly(support);
  if (part === 'family' && !forFamily) return null;
  const sourceLink = (
    <OutLink href={support.contactSource}>
      {t(
        'Fuente y alcance de la asistencia',
        'Source and scope of assistance',
        'Fonte e alcance da assistência',
      )}
    </OutLink>
  );
  const reviewed = (
    <Note>
      {t(
        `Enlaces oficiales revisados el ${reviewDate(support.reviewedAt, lang)}. No son avisos en vivo de Faro.`,
        `Official links reviewed on ${reviewDate(support.reviewedAt, lang)}. They are not live alerts from Faro.`,
        `Links oficiais revisados em ${reviewDate(support.reviewedAt, lang)}. Não são alertas ao vivo do Faro.`,
      )}
    </Note>
  );
  // Under the agency's title in the embassy section; a section's own subhead for the family.
  const Heading = part === 'family' ? 'h3' : 'h4';
  const contact = (
    <div className="f-stack grid gap-2" data-gap="sm">
      <Heading className="f-subhead m-0 text-sm leading-snug font-medium">
        {support.contactTitle[i]}
      </Heading>
      <Text>
        {support.contactNote[i]}{' '}
        {t(
          'Si necesitas una ambulancia, policía o bomberos, usa los teléfonos locales que aparecen arriba.',
          'For an ambulance, police or fire service, use the local numbers above.',
          'Se você precisar de ambulância, polícia ou bombeiros, use os telefones locais que aparecem acima.',
        )}
      </Text>
      {support.contacts.length > 0 && (
        <List label={support.contactTitle[i]}>
          {support.contacts.map((contact) => (
            <PhoneRow
              key={contact.number}
              number={contact.display}
              dial={contact.number}
              name={contact.scope[i].replace(' · ', ', ')}
            />
          ))}
        </List>
      )}
    </div>
  );
  if (part === 'family')
    return (
      <div className="f-stack grid gap-4">
        {contact}
        <Actions>{sourceLink}</Actions>
        {reviewed}
      </div>
    );
  return (
    <section className="f-stack grid gap-4" aria-labelledby="fw-support-title">
      <div className="f-section-head flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="f-subhead m-0 text-sm leading-snug font-medium" id="fw-support-title">
          {support.title[i]}
        </h3>
        <span className="f-section-aside text-sm text-muted-foreground data-[state=stale]:text-amber-900">
          {support.agency}
        </span>
      </div>
      {!forFamily && contact}
      <Actions>
        {sourceLink}
        {advisories && (
          <OutLink href={advisory || advisories.index}>
            {advisory
              ? t(
                  `Avisos de viaje para ${countryName}`,
                  `Travel advisory for ${countryName}`,
                  `Avisos de viagem: ${countryName}`,
                )
              : t(
                  'Avisos de viaje por destino',
                  'Travel advisories by destination',
                  'Avisos de viagem por destino',
                )}
          </OutLink>
        )}
      </Actions>
      <List label={support.title[i]}>
        {support.resources.map((resource) => {
          const id = `fw-support-${resource.id}`;
          return (
            <ExpandRow
              key={resource.id}
              id={id}
              open={open.has(id)}
              onToggle={() => {
                const next = new Set(open);
                if (!next.delete(id)) next.add(id);
                setOpen(next);
              }}
              title={resource.title[i]}
            >
              <Text>{resource.description[i]}</Text>
              <Actions>
                <OutLink href={resource.url}>{resource.action[i]}</OutLink>
              </Actions>
            </ExpandRow>
          );
        })}
      </List>
      {reviewed}
    </section>
  );
}
