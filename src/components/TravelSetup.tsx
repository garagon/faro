import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowRightIcon,
  LockSimpleIcon,
  XIcon,
  GlobeHemisphereWestIcon,
} from '@phosphor-icons/react';
import CountrySearch from './CountrySearch.tsx';
import { validProfilePhone, validProfileEmail, type Preferences } from '../lib/preferences.ts';
type Props = {
  saved: Preferences | null;
  language: 'es' | 'en';
  destination: string;
  nationality: string;
  onSave: (p: Preferences) => void;
  onClose: () => void;
  onDelete: () => void;
  onHelp: (country: string) => void;
};
export default function TravelSetup(p: Props) {
  const [language, setLanguage] = useState(p.language),
    [destination, setDestination] = useState(
      p.saved?.destination ?? (p.destination === 'WORLD' ? 'PA' : p.destination),
    ),
    [nationality, setNationality] = useState(p.nationality),
    [step, setStep] = useState(0),
    [name, setName] = useState(p.saved?.name || ''),
    [phone, setPhone] = useState(p.saved?.phone || ''),
    [email, setEmail] = useState(p.saved?.email || ''),
    [error, setError] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false);
  const t = (es: string, en: string) => (language === 'es' ? es : en);
  function save(e: React.FormEvent) {
    e.preventDefault();
    if (step === 0) {
      setStep(1);
      return;
    }
    try {
      p.onSave({
        version: 1,
        language,
        destination,
        nationality,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        savedAt: Date.now(),
      });
    } catch {
      setError(true);
    }
  }
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) p.onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fw-modal-overlay" />
        <Dialog.Content
          className="fw-setup"
          lang={language}
          onEscapeKeyDown={(e) => {
            const focused = document.activeElement;
            if (
              focused?.getAttribute('role') === 'combobox' &&
              focused.getAttribute('aria-expanded') === 'true'
            )
              e.preventDefault();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            requestAnimationFrame(() => {
              if (!document.querySelector('.fw-emergency-dialog'))
                document.querySelector<HTMLButtonElement>('.fw-profile-button')?.focus();
            });
          }}
        >
          <div className="fw-setup-brand">
            <span>
              <GlobeHemisphereWestIcon size={20} />
              {t('TU VIAJE EN FARO', 'YOUR TRIP IN FARO')}
            </span>
            <Dialog.Close
              className="fw-setup-close"
              aria-label={t('Cerrar configuración', 'Close setup')}
            >
              <XIcon size={20} />
            </Dialog.Close>
          </div>
          <Dialog.Title>
            {step === 0 ? t('Tus datos', 'Your details') : t('Tu viaje', 'Your trip')}
          </Dialog.Title>
          <Dialog.Description>
            {step === 0
              ? t(
                  'Cómo te llamas y cómo pueden contactarte.',
                  'Your name and how people can reach you.',
                )
              : t(
                  'Dónde estás y qué representación consular necesitas.',
                  'Where you are and which consular representation you need.',
                )}
          </Dialog.Description>
          {!p.saved && (
            <button className="fw-setup-emergency" onClick={() => p.onHelp(destination)}>
              {t('Necesito ayuda ahora', 'I need help now')}
            </button>
          )}
          <div className="fw-setup-progress" aria-label={t('Progreso', 'Progress')}>
            <span className={step === 0 ? 'active' : ''}>
              {t('1 · Tus datos', '1 · Your details')}
            </span>
            <span className={step === 1 ? 'active' : ''}>{t('2 · Tu viaje', '2 · Your trip')}</span>
          </div>
          <form onSubmit={save}>
            {step === 1 ? (
              <>
                <CountrySearch
                  label={t('País donde estás', 'Country you are in')}
                  lang={language}
                  value={destination}
                  onChange={setDestination}
                  required
                />
                <CountrySearch
                  label={t('Nacionalidad', 'Nationality')}
                  lang={language}
                  value={nationality}
                  onChange={setNationality}
                  required
                />
                <p className="fw-setup-hint">
                  {t(
                    'La cobertura consular varía según el país. Puedes consultar otras regiones sin cambiar el destino guardado.',
                    'Consular coverage varies by country. You can browse other regions without changing your saved destination.',
                  )}
                </p>
              </>
            ) : (
              <div className="fw-setup-personal">
                <fieldset className="fw-setup-language">
                  <legend>{t('Idioma', 'Language')}</legend>
                  <label>
                    <input
                      type="radio"
                      name="setup-language"
                      checked={language === 'es'}
                      onChange={() => setLanguage('es')}
                    />
                    Español
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="setup-language"
                      checked={language === 'en'}
                      onChange={() => setLanguage('en')}
                    />
                    English
                  </label>
                </fieldset>

                <label className="fw-setup-field">
                  {t('Tu nombre', 'Your name')} <span>{t('Obligatorio', 'Required')}</span>
                  <input
                    name="traveler-name"
                    autoComplete="name"
                    maxLength={80}
                    required
                    value={name}
                    onChange={(e) => {
                      e.target.setCustomValidity(
                        e.target.value.trim() ? '' : t('Escribe tu nombre.', 'Enter your name.'),
                      );
                      setName(e.target.value);
                    }}
                    autoFocus
                  />
                </label>
                <label className="fw-setup-field">
                  {t('Tu teléfono de contacto', 'Your contact phone')}{' '}
                  <span>{t('Opcional', 'Optional')}</span>
                  <input
                    name="traveler-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={40}
                    value={phone}
                    onChange={(e) => {
                      e.target.setCustomValidity(
                        validProfilePhone(e.target.value)
                          ? ''
                          : t(
                              'Revisa el teléfono e incluye el código de país.',
                              'Check the number and include the country code.',
                            ),
                      );
                      setPhone(e.target.value);
                    }}
                    placeholder="+507 6000 0000"
                  />
                </label>
                <label className="fw-setup-field">
                  {t('Tu correo de contacto', 'Your contact email')}{' '}
                  <span>{t('Opcional', 'Optional')}</span>
                  <input
                    name="traveler-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    maxLength={254}
                    value={email}
                    onChange={(e) => {
                      e.target.setCustomValidity(
                        validProfileEmail(e.target.value)
                          ? ''
                          : t('Revisa el correo de contacto.', 'Check the contact email.'),
                      );
                      setEmail(e.target.value);
                    }}
                    placeholder="nombre@ejemplo.com"
                  />
                </label>
                <p className="fw-setup-hint">
                  {t(
                    'Tu nombre aparecerá al preparar un aviso. Tú decides si compartes tu teléfono o correo. No se crea una cuenta.',
                    'Your name will be used when preparing an update. You decide whether to share your phone or email. No account is created.',
                  )}
                </p>
              </div>
            )}
            <div className="fw-setup-privacy">
              <LockSimpleIcon size={18} />
              <p>
                {t(
                  'Se guardan solo en este navegador y se recuperan al volver. Faro no envía estos datos a un servidor. Cada teléfono o computadora conserva su propia copia.',
                  'Saved only in this browser and restored when you return. Faro does not send this data to a server. Each phone or computer keeps its own copy.',
                )}
              </p>
            </div>
            {error && (
              <p className="fw-setup-error" role="alert">
                {t(
                  'No se pudo guardar el cambio. Revisa el almacenamiento del navegador o continúa sin guardar.',
                  'Could not save the change. Check browser storage or continue without saving.',
                )}
              </p>
            )}
            <button className="fw-setup-save" type="submit">
              {step === 0
                ? t('Continuar con mi viaje', 'Continue to my trip')
                : p.saved
                  ? t('Guardar cambios', 'Save changes')
                  : t('Guardar y continuar', 'Save and continue')}
              <ArrowRightIcon size={18} />
            </button>
            {step === 1 && (
              <button
                className="fw-setup-back"
                type="button"
                onClick={() => {
                  setStep(0);
                  setError(false);
                }}
              >
                {t('Volver a mis datos', 'Back to my details')}
              </button>
            )}
            <button className="fw-setup-skip" type="button" onClick={p.onClose}>
              {p.saved
                ? t('Cancelar', 'Cancel')
                : t('Entrar sin guardar', 'Continue without saving')}
            </button>
          </form>
          {p.saved && (
            <div className="fw-setup-delete">
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)}>
                  {t('Borrar perfil del viaje', 'Delete trip profile')}
                </button>
              ) : (
                <>
                  <p>
                    {t(
                      'Se borran nombre, teléfono, correo, idioma, destino y nacionalidad del perfil. Los contactos, planes y mensajes anteriores se conservan por separado.',
                      'Removes name, phone, email, language, destination and nationality from this profile. Contacts, plans and previous messages are kept separately.',
                    )}
                  </p>
                  <div>
                    <button
                      onClick={() => {
                        try {
                          p.onDelete();
                        } catch {
                          setError(true);
                        }
                      }}
                    >
                      {t('Borrar perfil', 'Delete profile')}
                    </button>
                    <button onClick={() => setConfirmDelete(false)}>
                      {t('Conservar', 'Keep profile')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
