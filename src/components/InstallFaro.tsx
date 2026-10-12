import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { DownloadSimpleIcon, XIcon } from '@phosphor-icons/react';
import { installPlatform, type InstallPlatform } from '../lib/install.ts';
import '../styles/install.css';

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
export default function InstallFaro({ lang }: { lang: 'es' | 'en' }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<'accepted' | 'dismissed' | 'error' | null>(null);
  const [platform, setPlatform] = useState<InstallPlatform>(() =>
    installPlatform(navigator.userAgent, navigator.maxTouchPoints),
  );
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  useEffect(() => {
    const display = window.matchMedia('(display-mode: standalone)');
    const check = () =>
      setInstalled(
        display.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone,
      );
    const available = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
      setFeedback(null);
    };
    const complete = () => {
      setInstalled(true);
      setPrompt(null);
      setOpen(false);
    };
    check();
    display.addEventListener('change', check);
    window.addEventListener('beforeinstallprompt', available);
    window.addEventListener('appinstalled', complete);
    return () => {
      display.removeEventListener('change', check);
      window.removeEventListener('beforeinstallprompt', available);
      window.removeEventListener('appinstalled', complete);
    };
  }, []);
  async function install() {
    if (!prompt || busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      await prompt.prompt();
      setFeedback((await prompt.userChoice).outcome);
    } catch {
      setFeedback('error');
    } finally {
      setPrompt(null);
      setBusy(false);
    }
  }
  if (installed) return null;
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="fw-install-trigger">
          <DownloadSimpleIcon size={18} aria-hidden="true" />
          {t('Instalar Faro', 'Install Faro')}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fw-modal-overlay" />
        <Dialog.Content className="fw-modal fw-info-dialog fw-install-dialog" lang={lang}>
          <header className="fw-dialog-header">
            <img src="/icons/apple-touch-icon.png" width="48" height="48" alt="" />
            <div>
              <Dialog.Title>
                {t('Faro en tu pantalla de inicio', 'Faro on your home screen')}
              </Dialog.Title>
              <Dialog.Description>
                {t(
                  'Abre Faro desde su icono, sin buscar la página.',
                  'Open Faro from its icon without looking for the website.',
                )}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="fw-dialog-close"
              aria-label={t('Cerrar instalación', 'Close installation')}
            >
              <XIcon size={21} />
            </Dialog.Close>
          </header>
          <div className="fw-dialog-body">
            {prompt && (
              <button className="fw-install-native" onClick={install} disabled={busy}>
                {busy
                  ? t('Abriendo el navegador…', 'Opening browser prompt…')
                  : t('Instalar en este dispositivo', 'Install on this device')}
              </button>
            )}
            {feedback && (
              <p role="status" className="fw-install-feedback">
                {feedback === 'accepted'
                  ? t(
                      'Solicitud aceptada. El navegador completará la instalación.',
                      'Request accepted. Your browser will complete installation.',
                    )
                  : feedback === 'dismissed'
                    ? t(
                        'Instalación cancelada. Puedes usar el menú del navegador cuando quieras.',
                        'Installation canceled. You can use the browser menu whenever you want.',
                      )
                    : t(
                        'No se pudo abrir la instalación. Sigue los pasos del navegador.',
                        'Could not open installation. Follow the browser steps below.',
                      )}
              </p>
            )}
            <div
              className="fw-install-platforms"
              role="group"
              aria-label={t('Tu dispositivo', 'Your device')}
            >
              {(['ios', 'android', 'desktop'] as const).map((device) => (
                <button
                  key={device}
                  aria-pressed={platform === device}
                  onClick={() => setPlatform(device)}
                >
                  {device === 'ios'
                    ? 'iPhone / iPad'
                    : device === 'android'
                      ? 'Android'
                      : t('Computadora', 'Computer')}
                </button>
              ))}
            </div>
            {platform === 'ios' ? (
              <ol>
                <li>{t('Abre esta página en Safari.', 'Open this page in Safari.')}</li>
                <li>
                  {t(
                    'Toca Compartir (el cuadrado con una flecha hacia arriba). Según tu versión, está dentro del menú Más.',
                    'Tap Share (the square with an upward arrow). Depending on your version, it may be inside the More menu.',
                  )}
                </li>
                <li>
                  {t(
                    'Elige «Añadir a pantalla de inicio». Si aparece «Abrir como app web», déjalo activado y toca Añadir.',
                    'Choose “Add to Home Screen.” If “Open as Web App” appears, leave it on and tap Add.',
                  )}
                </li>
              </ol>
            ) : platform === 'android' ? (
              <ol>
                <li>{t('Abre esta página en Chrome.', 'Open this page in Chrome.')}</li>
                <li>
                  {t(
                    'Abre el menú ⋮ y elige «Instalar aplicación» o «Añadir a pantalla de inicio».',
                    'Open the ⋮ menu and choose “Install app” or “Add to Home screen.”',
                  )}
                </li>
                <li>
                  {t(
                    'Confirma Instalar o Añadir. El nombre de la opción puede variar según el navegador.',
                    'Confirm Install or Add. The option name may vary by browser.',
                  )}
                </li>
              </ol>
            ) : (
              <ol>
                <li>
                  {t(
                    'En Chrome o Edge, busca el icono de instalación en la barra de direcciones o la opción de instalar en el menú.',
                    'In Chrome or Edge, look for the install icon in the address bar or the install option in the menu.',
                  )}
                </li>
                <li>
                  {t(
                    'Si tu navegador no ofrece instalación, guarda esta página como marcador.',
                    'If your browser does not offer installation, bookmark this page.',
                  )}
                </li>
              </ol>
            )}
            <p className="fw-install-note">
              {t(
                'Necesitas internet para abrir Faro y actualizar las fuentes. Instalarlo no activa alertas cuando está cerrado. Los datos de tu viaje no se sincronizan; comprueba tu perfil al abrirlo desde el icono.',
                'You need internet to open Faro and refresh sources. Installing does not enable alerts while it is closed. Trip data does not sync; check your profile when opening from the icon.',
              )}
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
