import { ArrowUpRightIcon } from '@phosphor-icons/react';
import { hostOf, splitName } from '../lib/links.ts';
import { familyLinksFor } from '../data/familyLinks.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';

type Props = { country: string; lang: Lang; onStatus: () => void };

/** Official reunification services. Searches happen on their sites, under their policies. */
export default function FamilyLinks({ country, lang, onStatus }: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    idx = langIndex(lang);
  return (
    <section className="fw-family-links" aria-labelledby="fw-family-title">
      <header>
        <div>
          <h2 id="fw-family-title">
            {t(
              'Encontrar o avisar a familiares',
              'Find or reach family',
              'Encontrar ou avisar familiares',
            )}
          </h2>
          <p>
            {t(
              'Si puedes, avisa tú primero. Si perdiste el contacto con alguien, estos servicios oficiales ayudan a restablecerlo.',
              'If you can, send your own update first. If you lost contact with someone, these official services help restore it.',
              'Se puder, avise você primeiro. Se você perdeu contato com alguém, estes serviços oficiais ajudam a restabelecê-lo.',
            )}
          </p>
        </div>
        <button className="fw-secondary" onClick={onStatus}>
          {t('Avisar cómo estoy', 'Send a status update', 'Avisar como estou')}
        </button>
      </header>
      <ul className="fw-link-rows">
        {familyLinksFor(country).map((l) => {
          const [agency, service] = splitName(l.name);
          return (
            <li key={l.id}>
              <a href={l.url[idx]} target="_blank" rel="noreferrer">
                <span>
                  <strong>{service ? `${service} (${agency})` : agency}</strong>
                  <span>{l.description[idx]}</span>
                </span>
                <small>
                  {hostOf(l.url[idx])}
                  <ArrowUpRightIcon size={14} aria-hidden="true" />
                </small>
              </a>
            </li>
          );
        })}
      </ul>
      <small>
        {t(
          'Faro no envía búsquedas ni datos a estos servicios. Cada sitio tiene su propia política de privacidad.',
          'Faro does not send searches or data to these services. Each site has its own privacy policy.',
          'O Faro não envia buscas nem dados a esses serviços. Cada site tem sua própria política de privacidade.',
        )}
      </small>
    </section>
  );
}
