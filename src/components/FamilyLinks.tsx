import { ArrowUpRightIcon, ChatCircleTextIcon } from '@phosphor-icons/react';
import { hostOf, splitName } from '../lib/links.ts';
import { caption } from '../lib/caption.ts';
import { familyLinksFor } from '../data/familyLinks.ts';
import { langIndex, pick, type Lang } from '../lib/i18n.ts';
import { Button, List, ListRow, Section, Text } from '../ui/index.ts';
import TravelerSupport from './TravelerSupport.tsx';

type Props = {
  country: string;
  lang: Lang;
  onStatus: () => void;
  /** The traveler's nationality: its foreign ministry's lines for relatives at home, if any. */
  nationality: string;
};

/** Official reunification services. Searches happen on their sites, under their policies. */
export default function FamilyLinks({ country, lang, onStatus, nationality }: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    idx = langIndex(lang);
  return (
    <Section
      id="fw-help-family"
      title={t('Para tu familia', 'For your family', 'Para sua família')}
    >
      <Text>
        {t(
          'Si puedes, avisa tú primero. Si perdiste el contacto con alguien, estos servicios oficiales ayudan a restablecerlo.',
          'If you can, send your own update first. If you lost contact with someone, these official services help restore it.',
          'Se puder, avise você primeiro. Se você perdeu contato com alguém, estes serviços oficiais ajudam a restabelecê-lo.',
        )}
      </Text>
      <Button
        variant="secondary"
        icon={<ChatCircleTextIcon size={20} aria-hidden="true" />}
        onClick={onStatus}
      >
        {/* The same name as the Avisar tab ("Check in" in English). */}
        {t('Avisar cómo estoy', 'Check in', 'Avisar como estou')}
      </Button>
      <List
        label={t(
          'Encontrar o avisar a familiares',
          'Find or reach family',
          'Encontrar ou avisar familiares',
        )}
      >
        {familyLinksFor(country).map((l) => {
          const [agency, service] = splitName(l.name[idx]);
          return (
            <ListRow
              key={l.id}
              href={l.url[idx]}
              external
              title={service ? `${service} (${agency})` : agency}
              meta={caption(l.description[idx], hostOf(l.url[idx]))}
              trail={<ArrowUpRightIcon size={16} aria-hidden="true" />}
            />
          );
        })}
      </List>
      {/* That Faro sends nothing to these services is said once, in Ayuda's scope note. */}
      <TravelerSupport part="family" nationality={nationality} country={country} lang={lang} />
    </Section>
  );
}
