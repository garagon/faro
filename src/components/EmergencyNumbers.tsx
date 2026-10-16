import { WhatsappLogoIcon } from '@phosphor-icons/react';
import { emergencyFor } from '../lib/emergency.ts';
import { reviewDate } from '../lib/links.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
import { whatsappHref } from '../lib/phone.ts';
import {
  CallButton,
  List,
  ListRow,
  Note,
  OutLink,
  PhoneRow,
  SafetyNotice,
  Section,
  Text,
} from '../ui/index.ts';

/** The country's emergency numbers: the main one as the call button, the others as rows. */
export default function EmergencyNumbers({ country, lang }: { country: string; lang: Lang }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    idx = langIndex(lang);
  const data = emergencyFor(country),
    name =
      country === 'WORLD'
        ? undefined
        : new Intl.DisplayNames([lang], { type: 'region' }).of(country);
  const [main, ...others] = data?.numbers ?? [];
  return (
    <Section id="fw-help-numbers" title={t('Números', 'Numbers', 'Números')} aside={name}>
      {data && main ? (
        <>
          {/* The main number is the only red button; backups are rows. */}
          <CallButton
            number={main.number}
            label={`${t('Llamar al', 'Call', 'Ligar para o')} ${main.number}`}
            note={main.label[idx]}
          />
          {(others.length > 0 || data.whatsapp) && (
            <List label={t('Otros teléfonos', 'Other numbers', 'Outros telefones')}>
              {others.map((n) => (
                <PhoneRow key={n.number} number={n.number} name={n.label[idx]} />
              ))}
              {/* A text line for when calls do not go through but data does. */}
              {data.whatsapp && (
                <ListRow
                  href={whatsappHref(data.whatsapp.number)}
                  external
                  figure
                  title={data.whatsapp.number}
                  meta={data.whatsapp.label[idx]}
                  trail={<WhatsappLogoIcon size={20} weight="fill" aria-hidden="true" />}
                />
              )}
            </List>
          )}
          {data.note && <SafetyNotice>{data.note[idx]}</SafetyNotice>}
          <Note
            more={
              <OutLink href={data.source}>
                {t('Fuente oficial', 'Official source', 'Fonte oficial')}
              </OutLink>
            }
          >
            {t(
              'Números para llamar dentro del país, no desde el extranjero.',
              'Numbers for calls within the country, not from abroad.',
              'Números para ligar dentro do país, não do exterior.',
            )}{' '}
            {t(
              'Si estás en otro lugar, cambia el país arriba.',
              'If you are elsewhere, change the country above.',
              'Se você estiver em outro lugar, altere o país acima.',
            )}{' '}
            {t('Revisada el', 'Reviewed', 'Revisada em')} {reviewDate(data.reviewedAt, lang)}.
          </Note>
        </>
      ) : (
        <Text>
          {t(
            'No tenemos teléfonos verificados para este destino. Consulta al personal del alojamiento o a las autoridades locales.',
            'We have no verified numbers for this destination. Ask accommodation staff or local authorities.',
            'Não temos telefones verificados para este destino. Pergunte à equipe da hospedagem ou às autoridades locais.',
          )}{' '}
          {t(
            'Si estás en otro lugar, cambia el país arriba.',
            'If you are elsewhere, change the country above.',
            'Se você estiver em outro lugar, altere o país acima.',
          )}
        </Text>
      )}
    </Section>
  );
}
