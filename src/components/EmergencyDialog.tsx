import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { XIcon, BookOpenTextIcon, ChatCircleTextIcon } from '@phosphor-icons/react';
import CountrySearch from './CountrySearch.tsx';
import EmergencyNumbers from './EmergencyNumbers.tsx';
type Props = {
  country: string;
  lang: 'es' | 'en';
  onClose: () => void;
  onCountry: (code: string) => void;
  onGuide: () => void;
  onStatus: () => void;
};
export default function EmergencyDialog(p: Props) {
  const [country, setCountry] = useState(p.country === 'WORLD' ? '' : p.country),
    [editing, setEditing] = useState(p.country === 'WORLD'),
    [returnFocus] = useState(() =>
      document.activeElement instanceof HTMLElement ? document.activeElement : null,
    );
  const t = (es: string, en: string) => (p.lang === 'es' ? es : en);
  const name = country ? new Intl.DisplayNames([p.lang], { type: 'region' }).of(country) : '';
  return (
    <Dialog.Root
      open
      onOpenChange={(v) => {
        if (!v) p.onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fw-modal-overlay" />
        <Dialog.Content
          className="fw-modal fw-info-dialog fw-emergency-dialog"
          lang={p.lang}
          onCloseAutoFocus={(event) => {
            if (returnFocus?.isConnected) {
              event.preventDefault();
              returnFocus.focus();
            }
          }}
          onEscapeKeyDown={(e) => {
            const focused = document.activeElement;
            if (
              focused?.getAttribute('role') === 'combobox' &&
              focused.getAttribute('aria-expanded') === 'true'
            )
              e.preventDefault();
          }}
        >
          <header className="fw-dialog-header">
            <div>
              <Dialog.Title>{t('Ayuda de emergencia', 'Emergency help')}</Dialog.Title>
              <Dialog.Description>
                {t('Comprueba el país antes de llamar.', 'Check the country before calling.')}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="fw-dialog-close"
              aria-label={t('Cerrar ayuda', 'Close emergency help')}
            >
              <XIcon size={21} />
            </Dialog.Close>
          </header>
          <div className="fw-dialog-body">
            <div className="fw-emergency-country">
              {editing ? (
                <CountrySearch
                  label={t('País donde necesitas ayuda', 'Country where you need help')}
                  lang={p.lang}
                  value={country}
                  onChange={(code) => {
                    setCountry(code);
                    if (code) {
                      p.onCountry(code);
                      setEditing(false);
                    }
                  }}
                />
              ) : (
                <>
                  <span>
                    {t('País seleccionado', 'Selected country')}
                    <strong>{name}</strong>
                  </span>
                  <button className="fw-secondary" onClick={() => setEditing(true)}>
                    {t('Cambiar país', 'Change country')}
                  </button>
                </>
              )}
            </div>
            {country && !editing ? (
              <EmergencyNumbers country={country} lang={p.lang} />
            ) : (
              <p className="fw-emergency-prompt">
                {t(
                  'Selecciona un país para ver sus teléfonos.',
                  'Select a country to see its emergency numbers.',
                )}
              </p>
            )}
            <p className="fw-emergency-explanation">
              {t(
                'Al pulsar un número se abre la función de llamadas de tu dispositivo. Faro no envía tu ubicación ni solicita ayuda automáticamente.',
                'Tapping a number opens your device’s calling function. Faro does not send your location or request help automatically.',
              )}
            </p>
          </div>
          <footer className="fw-dialog-actions">
            <button className="fw-secondary" onClick={p.onGuide}>
              <BookOpenTextIcon size={18} />
              {t('Qué hacer ahora', 'What to do now')}
            </button>
            <button className="fw-secondary" onClick={p.onStatus}>
              <ChatCircleTextIcon size={18} />
              {t('Avisar cómo estoy', 'Send a status update')}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
