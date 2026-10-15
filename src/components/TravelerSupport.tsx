import { ExternalLink, LinkRow, PhoneButton, PhoneRow } from './Ui.tsx';
import { supportFor } from '../data/travelerSupport.ts';
import { reviewDate } from '../lib/links.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';

type Props = { nationality: string; country: string; lang: Lang };
export default function TravelerSupport({ nationality, country, lang }: Props) {
  const support = supportFor(nationality, country);
  if (!support) return null;
  const i = langIndex(lang);
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const advisories = support.advisories;
  // Never fall back to another country's advisory: unknown destinations use the official index.
  const advisory = advisories?.destinations[country];
  const countryName =
    country === 'WORLD' ? '' : new Intl.DisplayNames([lang], { type: 'region' }).of(country);
  return (
    <section className="fw-traveler-support" aria-label={support.title[i]}>
      <header>
        <h3>{support.title[i]}</h3>
        <p>{support.agency}</p>
      </header>
      <div className="fw-support-contact">
        <h4>{support.contactTitle[i]}</h4>
        <p>
          {support.contactNote[i]}{' '}
          {t(
            'Si necesitas una ambulancia, policía o bomberos, usa los teléfonos locales que aparecen arriba.',
            'For an ambulance, police or fire service, use the local numbers above.',
            'Se você precisar de ambulância, polícia ou bombeiros, use os telefones locais que aparecem acima.',
          )}
        </p>
        {support.contacts.length > 0 && (
          <PhoneRow>
            {support.contacts.map((contact) => (
              <PhoneButton
                key={contact.number}
                href={`tel:${contact.number}`}
                number={contact.display}
                label={contact.scope[i].replace(' · ', ', ')}
              />
            ))}
          </PhoneRow>
        )}
      </div>
      <LinkRow>
        <ExternalLink href={support.contactSource}>
          {t(
            'Fuente y alcance de la asistencia',
            'Source and scope of assistance',
            'Fonte e alcance da assistência',
          )}
        </ExternalLink>
        {advisories && (
          <ExternalLink href={advisory || advisories.index}>
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
          </ExternalLink>
        )}
      </LinkRow>
      <div className="fw-support-topics">
        {support.resources.map((resource) => (
          <details key={resource.id}>
            <summary>{resource.title[i]}</summary>
            <p>{resource.description[i]}</p>
            <ExternalLink href={resource.url}>{resource.action[i]}</ExternalLink>
          </details>
        ))}
      </div>
      <small>
        {t(
          `Enlaces oficiales revisados el ${reviewDate(support.reviewedAt, lang)}. No son avisos en vivo de Faro.`,
          `Official links reviewed on ${reviewDate(support.reviewedAt, lang)}. They are not live alerts from Faro.`,
          `Links oficiais revisados em ${reviewDate(support.reviewedAt, lang)}. Não são alertas ao vivo do Faro.`,
        )}
      </small>
    </section>
  );
}
