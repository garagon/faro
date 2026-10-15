import { emergencyFor } from '../lib/emergency.ts';
import { PhoneButton, PhoneRow } from './Ui.tsx';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
import { telHref, whatsappHref } from '../lib/phone.ts';
import { WhatsappLogoIcon } from '@phosphor-icons/react';
export default function EmergencyNumbers({ country, lang }: { country: string; lang: Lang }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const data = emergencyFor(country),
    name =
      country === 'WORLD'
        ? t('el destino', 'your destination', 'seu destino')
        : new Intl.DisplayNames([lang], { type: 'region' }).of(country);
  return (
    <section
      className="fw-emergency-numbers"
      aria-label={t('Teléfonos de emergencia', 'Emergency numbers', 'Telefones de emergência')}
    >
      <header>
        <div>
          <h2>{t(`Emergencias en ${name}`, `Emergencies in ${name}`, `Emergência · ${name}`)}</h2>
          <p>
            {t(
              'Llama desde este país. Si estás en otro lugar, cambia el país arriba.',
              'Call from within this country. If you are elsewhere, change the country above.',
              'Ligue de dentro deste país. Se você estiver em outro lugar, altere o país acima.',
            )}
          </p>
        </div>
      </header>
      {data ? (
        // The main number is the only red button; backups share the neutral style.
        <PhoneRow>
          {data.numbers.map((n, i) => (
            <PhoneButton
              key={n.number}
              href={telHref(n.number)}
              number={i === 0 ? `${t('Llamar al', 'Call', 'Ligar para o')} ${n.number}` : n.number}
              label={n.label[langIndex(lang)]}
              tone={i === 0 ? 'call' : 'neutral'}
            />
          ))}
          {data.whatsapp && (
            <PhoneButton
              href={whatsappHref(data.whatsapp.number)}
              number={data.whatsapp.number}
              label={data.whatsapp.label[langIndex(lang)]}
              tone="neutral"
              icon={<WhatsappLogoIcon size={18} weight="fill" aria-hidden="true" />}
            />
          )}
        </PhoneRow>
      ) : (
        <p>
          {t(
            'No tenemos teléfonos verificados para este destino. Consulta al personal del alojamiento o a las autoridades locales.',
            'We have no verified numbers for this destination. Ask accommodation staff or local authorities.',
            'Não temos telefones verificados para este destino. Pergunte à equipe da hospedagem ou às autoridades locais.',
          )}
        </p>
      )}
      {data?.note && <p className="fw-emergency-scope">{data.note[langIndex(lang)]}</p>}
      {data && (
        <small>
          {t(
            'Números para llamar dentro del país, no desde el extranjero.',
            'Numbers for calls within the country, not from abroad.',
            'Números para ligar dentro do país, não do exterior.',
          )}{' '}
          <a href={data.source} target="_blank" rel="noreferrer">
            {t('Fuente oficial', 'Official source', 'Fonte oficial')}
          </a>
          , {t('revisada el', 'reviewed', 'revisada em')}{' '}
          {new Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeZone: 'UTC' }).format(
            new Date(data.reviewedAt + 'T12:00:00Z'),
          )}
          .
        </small>
      )}
    </section>
  );
}
