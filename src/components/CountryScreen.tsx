import { useMemo, useState, type ReactNode } from 'react';
import { BookmarkSimpleIcon, CheckIcon, CrosshairIcon } from '@phosphor-icons/react';
import { countryOptions, matchCountries } from '../lib/countryMatch.ts';
import { emergencyFor } from '../lib/emergency.ts';
import { pick, type Lang } from '../lib/i18n.ts';
import {
  BackLink,
  Button,
  Field,
  List,
  ListRow,
  Note,
  ScreenHead,
  Section,
  Segmented,
} from '../ui/index.ts';

type Props = {
  lang: Lang;
  country: string;
  saved: string[];
  onChoose: (code: string) => void;
  onToggleSave: () => void;
  onLocate: () => void;
  locating: boolean;
  /** What happened with "Use my location", when it did not choose a country. */
  locateStatus?: ReactNode;
  onLanguage: (lang: Lang) => void;
  onBack: () => void;
  backLabel: string;
  /** Install Faro, offered here once rather than on every screen. */
  install?: ReactNode;
};

/**
 * Where you are: search any country, use your location, switch between saved countries, and the
 * language. Opened from the country in the header; a screen, never a popup.
 */
export default function CountryScreen(p: Props) {
  const t = (es: string, en: string, pt: string) => pick(p.lang, es, en, pt);
  const [query, setQuery] = useState('');
  const options = useMemo(() => countryOptions(p.lang, true), [p.lang]);
  const name = (code: string) => options.find((o) => o.code === code)?.name ?? code;
  // The main emergency number as each row's caption, where Faro has it.
  const meta = (code: string) => {
    const n = emergencyFor(code)?.numbers[0]?.number;
    return n ? t(`Emergencias ${n}`, `Emergencies ${n}`, `Emergências ${n}`) : undefined;
  };
  const results = query.trim() ? matchCountries(options, query).slice(0, 12) : [];
  // The country on screen is shown apart; "Saved" lists only what the person saved.
  const others = p.saved.filter((c) => c !== p.country);
  const row = (code: string) => (
    <ListRow
      key={code}
      title={name(code)}
      meta={meta(code)}
      trail={code === p.country ? <CheckIcon size={18} aria-hidden="true" /> : undefined}
      onClick={() => p.onChoose(code)}
    />
  );
  return (
    <div className="f-column">
      <div className="f-stack" data-gap="sm">
        <BackLink onClick={p.onBack}>{p.backLabel}</BackLink>
        <ScreenHead title={t('País', 'Country', 'País')} titleId="fw-country-title" />
      </div>
      <div className="f-stack">
        <Field
          id="fw-country-query"
          label={t('Buscar un país', 'Search for a country', 'Buscar um país')}
          type="search"
          autoComplete="off"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          // Enter (or Search on a phone keyboard): one match is chosen; several, the first gets focus.
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || e.nativeEvent.isComposing || !results.length) return;
            e.preventDefault();
            if (results.length === 1) p.onChoose(results[0].code);
            else
              e.currentTarget
                .closest('.f-stack')
                ?.querySelector<HTMLElement>('.f-list .f-row')
                ?.focus();
          }}
        />
        {query.trim() &&
          (results.length ? (
            <List label={t('Resultados', 'Results', 'Resultados')}>
              {results.map((c) => row(c.code))}
            </List>
          ) : (
            <Note>
              {t(
                'No hay coincidencias. Prueba otro nombre.',
                'No matches. Try another name.',
                'Nenhum resultado. Tente outro nome.',
              )}
            </Note>
          ))}
        <Button
          variant="secondary"
          icon={<CrosshairIcon size={20} aria-hidden="true" />}
          onClick={p.onLocate}
          disabled={p.locating}
        >
          {p.locating
            ? t('Ubicando…', 'Locating…', 'Localizando…')
            : t('Usar mi ubicación', 'Use my location', 'Usar minha localização')}
        </Button>
        {p.locateStatus && <Note>{p.locateStatus}</Note>}
      </div>
      <Section id="fw-country-now" title={t('Ahora', 'Now', 'Agora')}>
        <List>
          <ListRow
            title={name(p.country)}
            meta={meta(p.country)}
            trail={<CheckIcon size={18} aria-hidden="true" />}
          />
        </List>
        {p.country !== 'WORLD' && (
          <Button
            variant="ghost"
            icon={
              <BookmarkSimpleIcon
                size={18}
                weight={p.saved.includes(p.country) ? 'fill' : 'regular'}
                aria-hidden="true"
              />
            }
            aria-pressed={p.saved.includes(p.country)}
            onClick={p.onToggleSave}
          >
            {p.saved.includes(p.country)
              ? t(
                  `Guardado · quitar ${name(p.country)}`,
                  `Saved · remove ${name(p.country)}`,
                  `Salvo · remover ${name(p.country)}`,
                )
              : t(
                  `Guardar ${name(p.country)} para volver rápido`,
                  `Save ${name(p.country)} to come back quickly`,
                  `Salvar ${name(p.country)} para voltar rápido`,
                )}
          </Button>
        )}
      </Section>
      {others.length > 0 && (
        <Section id="fw-country-saved" title={t('Guardados', 'Saved', 'Salvos')}>
          <List>{others.map(row)}</List>
        </Section>
      )}
      <Section id="fw-country-language" title={t('Idioma', 'Language', 'Idioma')}>
        <Segmented
          block
          label={t('Idioma', 'Language', 'Idioma')}
          value={p.lang}
          onChange={p.onLanguage}
          options={[
            { value: 'es', label: 'Español' },
            { value: 'en', label: 'English' },
            { value: 'pt', label: 'Português' },
          ]}
        />
      </Section>
      {p.install}
    </div>
  );
}
