import { supportFor } from '../data/travelerSupport.ts';
import '../styles/travelerSupport.css';

type Props = { nationality: string; country: string; lang: 'es' | 'en' };
export default function TravelerSupport({ nationality, country, lang }: Props) {
  const support = supportFor(nationality, country);
  if (!support) return null;
  const i = lang === 'es' ? 0 : 1;
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const advisory = support.advisories.destinations[country];
  const countryName =
    country === 'WORLD' ? '' : new Intl.DisplayNames([lang], { type: 'region' }).of(country);
  return (
    <section className="fw-traveler-support" aria-label={support.title[i]}>
      <header>
        <h3>{support.title[i]}</h3>
        <p>{support.agency}</p>
      </header>
      <div className="fw-support-contact">
        <h4>{t('Si no logras contactar a tu embajada', 'If you cannot reach your embassy')}</h4>
        <p>
          {t(
            'Para una urgencia consular. Si necesitas una ambulancia, policía o bomberos, usa los teléfonos locales que aparecen arriba.',
            'For a consular emergency. For an ambulance, police or fire service, use the local numbers above.',
          )}
        </p>
        <div className="fw-support-phones">
          {support.contacts.map((contact) => (
            <div key={contact.number}>
              <span>{contact.scope[i]}</span>
              <a href={`tel:${contact.number}`}>{contact.display}</a>
            </div>
          ))}
        </div>
        <a href={support.contactSource} target="_blank" rel="noreferrer">
          {t('Fuente y alcance de la asistencia', 'Source and scope of assistance')} ↗
        </a>
      </div>
      <a
        className="fw-support-advisory"
        href={advisory || support.advisories.index}
        target="_blank"
        rel="noreferrer"
      >
        <strong>
          {advisory
            ? t(`Avisos de viaje: ${countryName}`, `Travel advisory: ${countryName}`)
            : t('Buscar avisos por destino', 'Find destination advisories')}{' '}
          ↗
        </strong>
        <span>
          {t(
            'Consulta la publicación actual en Travel.State.gov.',
            'Read the current publication on Travel.State.gov.',
          )}
        </span>
      </a>
      <div className="fw-support-topics">
        {support.resources.map((resource) => (
          <details key={resource.id}>
            <summary>{resource.title[i]}</summary>
            <p>{resource.description[i]}</p>
            <a href={resource.url} target="_blank" rel="noreferrer">
              {resource.action[i]} ↗
            </a>
          </details>
        ))}
      </div>
      <small>
        {t('Fuentes consultadas', 'Sources checked')}: {support.reviewedAt} ·{' '}
        {t(
          'Enlaces oficiales; no son avisos en vivo de Faro.',
          'Official links; not live alerts from Faro.',
        )}
      </small>
    </section>
  );
}
