import { PhoneIcon } from '@phosphor-icons/react';
import { emergencyFor } from '../lib/emergency.ts';
export default function EmergencyNumbers({
  country,
  lang,
}: {
  country: string;
  lang: 'es' | 'en';
}) {
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  const data = emergencyFor(country),
    name =
      country === 'WORLD'
        ? t('el destino', 'your destination')
        : new Intl.DisplayNames([lang], { type: 'region' }).of(country);
  return (
    <section
      className="fw-emergency-numbers"
      aria-label={t('Teléfonos de emergencia', 'Emergency numbers')}
    >
      <header>
        <div>
          <h2>
            {t('Emergencias', 'Emergencies')} · {name}
          </h2>
          <p>
            {t(
              'País seleccionado. Comprueba que corresponde a donde estás.',
              'Selected country. Check that it matches where you are.',
            )}
          </p>
        </div>
        {data && (
          <a href={data.source} target="_blank" rel="noreferrer">
            {t('Fuente oficial', 'Official source')} ↗
          </a>
        )}
      </header>
      {data ? (
        <div className="fw-emergency-lines">
          {data.numbers.map((n) => (
            <a
              key={n.number}
              href={`tel:${n.number}`}
              aria-label={`${t('Llamar', 'Call')} ${n.number} · ${n.label[lang === 'es' ? 0 : 1]}`}
            >
              <PhoneIcon size={19} />
              <strong>{n.number}</strong>
              <span>{n.label[lang === 'es' ? 0 : 1]}</span>
            </a>
          ))}
        </div>
      ) : (
        <p>
          {t(
            'No tenemos teléfonos verificados para este destino. Consulta al personal del alojamiento o a las autoridades locales.',
            'We have no verified numbers for this destination. Ask accommodation staff or local authorities.',
          )}
        </p>
      )}
      {data && (
        <small>
          {t(
            'Estos números cortos son para llamadas dentro del país, no desde el extranjero.',
            'These short numbers are for calls within the country, not from abroad.',
          )}
        </small>
      )}
    </section>
  );
}
