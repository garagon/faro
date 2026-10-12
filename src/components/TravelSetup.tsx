import { useEffect, useRef, useState } from 'react';
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
  const language = p.language;
  const [destination, setDestination] = useState(
      p.saved?.destination ?? (p.destination === 'WORLD' ? 'PA' : p.destination),
    ),
    [nationality, setNationality] = useState(p.nationality),
    [step, setStep] = useState(0),
    [name, setName] = useState(p.saved?.name || ''),
    [phone, setPhone] = useState(p.saved?.phone || ''),
    [email, setEmail] = useState(p.saved?.email || ''),
    [error, setError] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    function fitViewport() {
      if (!viewport || !dialogRef.current) return;
      dialogRef.current.style.setProperty('--setup-height', `${viewport.height}px`);
      dialogRef.current.style.setProperty('--setup-top', `${viewport.offsetTop}px`);
      dialogRef.current.dataset.compact = String(viewport.height <= 540);
    }
    fitViewport();
    viewport.addEventListener('resize', fitViewport);
    viewport.addEventListener('scroll', fitViewport);
    return () => {
      viewport.removeEventListener('resize', fitViewport);
      viewport.removeEventListener('scroll', fitViewport);
    };
  }, []);
  useEffect(() => {
    bodyRef.current?.scrollTo(0, 0);
    titleRef.current?.focus({ preventScroll: true });
  }, [step]);
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
        <Dialog.Overlay className="fw-modal-overlay fw-setup-overlay" />
        <Dialog.Content
          className="fw-setup"
          ref={dialogRef}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            titleRef.current?.focus({ preventScroll: true });
          }}
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
          <header className="fw-setup-header">
            <div className="fw-setup-brand">
              <span>
                <GlobeHemisphereWestIcon size={18} />
                {t('Configura tu viaje', 'Set up your trip')}
              </span>
              <Dialog.Close
                className="fw-setup-close"
                aria-label={t('Cerrar configuración', 'Close setup')}
              >
                <XIcon size={20} />
              </Dialog.Close>
            </div>
            <Dialog.Title ref={titleRef} tabIndex={-1}>
              {step === 0 ? t('Tus datos', 'Your details') : t('Tu viaje', 'Your trip')}
            </Dialog.Title>
            <Dialog.Description>
              {step === 0
                ? t(
                    'Para identificarte cuando avises cómo estás.',
                    'So people know who your update is from.',
                  )
                : t(
                    'Encuentra información local y asistencia consular.',
                    'Find local information and consular assistance.',
                  )}
            </Dialog.Description>
            <ol className="fw-setup-progress" aria-label={t('Progreso', 'Progress')}>
              <li
                className={step === 0 ? 'active' : ''}
                aria-current={step === 0 ? 'step' : undefined}
              >
                {t('1 · Tus datos', '1 · Your details')}
              </li>
              <li
                className={step === 1 ? 'active' : ''}
                aria-current={step === 1 ? 'step' : undefined}
              >
                {t('2 · Tu viaje', '2 · Your trip')}
              </li>
            </ol>
          </header>
          <form onSubmit={save} className="fw-setup-form">
            <div className="fw-setup-body" ref={bodyRef}>
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
                    />
                  </label>
                  <div className="fw-setup-contacts">
                    <label className="fw-setup-field">
                      {t('Teléfono', 'Phone')} <span>{t('Opcional', 'Optional')}</span>
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
                        placeholder={t('Incluye el código de país', 'Include country code')}
                      />
                    </label>
                    <label className="fw-setup-field">
                      {t('Correo electrónico', 'Email')} <span>{t('Opcional', 'Optional')}</span>
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
                  </div>
                  <p className="fw-setup-hint">
                    {t(
                      'Tú decides si incluyes tu teléfono o correo al compartir un aviso.',
                      'You choose whether to include your phone or email when sharing an update.',
                    )}
                  </p>
                </div>
              )}
              <div className="fw-setup-privacy">
                <LockSimpleIcon size={18} />
                <p>
                  {t(
                    'Solo en este navegador. Sin cuenta ni envío a servidores. Los datos se conservan al volver y no se sincronizan entre dispositivos.',
                    'Only in this browser. No account or upload to servers. Your details are kept for your next visit and do not sync across devices.',
                  )}
                </p>
              </div>
              {p.saved && (
                <div className="fw-setup-delete">
                  {!confirmDelete ? (
                    <button type="button" onClick={() => setConfirmDelete(true)}>
                      {t('Borrar perfil del viaje', 'Delete trip profile')}
                    </button>
                  ) : (
                    <>
                      <p>
                        {t(
                          'Se borran nombre, teléfono, correo, destino y nacionalidad del perfil. Los contactos, planes y mensajes anteriores se conservan por separado.',
                          'Removes name, phone, email, destination and nationality from this profile. Contacts, plans and previous messages are kept separately.',
                        )}
                      </p>
                      <div>
                        <button
                          type="button"
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
                        <button type="button" onClick={() => setConfirmDelete(false)}>
                          {t('Conservar', 'Keep profile')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <footer className="fw-setup-actions">
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
                  ? t('Continuar', 'Continue')
                  : p.saved
                    ? t('Guardar cambios', 'Save changes')
                    : t('Guardar y continuar', 'Save and continue')}
                <ArrowRightIcon size={18} />
              </button>
              <div className="fw-setup-secondary">
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
              </div>
              {!p.saved && (
                <button
                  type="button"
                  className="fw-setup-emergency"
                  onClick={() => p.onHelp(destination || p.destination)}
                >
                  {t('Necesito ayuda ahora', 'I need help now')}
                </button>
              )}
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
