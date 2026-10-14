import { useState } from 'react';
import CountrySearch from './CountrySearch.tsx';
import { pick, type Lang } from '../lib/i18n.ts';

type Props = {
  lang: Lang;
  countryName: string;
  onSave: (nationality: string) => void;
  onMore: () => void;
  onDismiss: () => void;
};

/**
 * First-visit setup that never blocks the app: only the nationality, which Faro needs to show
 * the person's embassy. The name is asked later, when a message is prepared.
 */
export default function SetupCard({ lang, countryName, onSave, onMore, onDismiss }: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const [nationality, setNationality] = useState('');
  return (
    <section className="fw-home-setup" aria-labelledby="fw-setup-card-title">
      <div className="fw-home-setup-text">
        <h2 id="fw-setup-card-title">
          {t('¿De qué país eres?', 'Where are you from?', 'De que país você é?')}
        </h2>
        <p>
          {t(
            `Para mostrarte tu embajada en ${countryName} y la ayuda de tu país. Se guarda solo en este navegador.`,
            `To show your embassy in ${countryName} and your country’s help. Saved only in this browser.`,
            `Para mostrar a embaixada do seu país em ${countryName} e a ajuda do seu país. Fica salvo só neste navegador.`,
          )}
        </p>
        <button className="fw-text fw-home-setup-more" onClick={onMore}>
          {t(
            'Completar perfil con nombre y contacto',
            'Add name and contact to your profile',
            'Completar perfil com nome e contato',
          )}
        </button>
      </div>
      <div className="fw-home-setup-form">
        <CountrySearch
          label={t('Nacionalidad', 'Nationality', 'Nacionalidade')}
          lang={lang}
          value={nationality}
          onChange={setNationality}
        />
        <div className="fw-home-setup-buttons">
          <button
            className="fw-primary"
            disabled={!nationality}
            onClick={() => onSave(nationality)}
          >
            {t('Guardar', 'Save', 'Salvar')}
          </button>
          <button className="fw-secondary" onClick={onDismiss}>
            {t('Ahora no', 'Not now', 'Agora não')}
          </button>
        </div>
      </div>
    </section>
  );
}
