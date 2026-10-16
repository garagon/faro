import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { DownloadSimpleIcon, XIcon } from '@phosphor-icons/react';
import { installPlatform, type InstallPlatform } from '../lib/install.ts';
import { langTag, pick, type Lang } from '../lib/i18n.ts';

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
export default function InstallFaro({ lang }: { lang: Lang }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<'accepted' | 'dismissed' | 'error' | null>(null);
  const [platform, setPlatform] = useState<InstallPlatform>(() =>
    installPlatform(navigator.userAgent, navigator.maxTouchPoints),
  );
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
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
        <button type="button" className="f-button f-pressable" data-variant="secondary">
          <DownloadSimpleIcon size={20} aria-hidden="true" />
          {t('Instalar Faro', 'Install Faro', 'Instalar o Faro')}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fw-modal-overlay" />
        <Dialog.Content className="fw-modal fw-info-dialog fw-install-dialog" lang={langTag(lang)}>
          <header className="fw-dialog-header">
            <img src="/icons/apple-touch-icon.png" width="48" height="48" alt="" />
            <div>
              <Dialog.Title>
                {t(
                  'Faro en tu pantalla de inicio',
                  'Faro on your home screen',
                  'O Faro na sua tela inicial',
                )}
              </Dialog.Title>
              <Dialog.Description>
                {t(
                  'Abre Faro desde su icono, sin buscar la página.',
                  'Open Faro from its icon without looking for the website.',
                  'Abra o Faro pelo ícone, sem procurar o site.',
                )}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="fw-dialog-close"
              aria-label={t('Cerrar instalación', 'Close installation', 'Fechar instalação')}
            >
              <XIcon size={21} />
            </Dialog.Close>
          </header>
          <div className="fw-dialog-body">
            {prompt && (
              <button className="fw-install-native" onClick={install} disabled={busy}>
                {busy
                  ? t('Abriendo el navegador…', 'Opening browser prompt…', 'Abrindo o navegador…')
                  : t(
                      'Instalar en este dispositivo',
                      'Install on this device',
                      'Instalar neste dispositivo',
                    )}
              </button>
            )}
            {feedback && (
              <p role="status" className="fw-install-feedback">
                {feedback === 'accepted'
                  ? t(
                      'Solicitud aceptada. El navegador completará la instalación.',
                      'Request accepted. Your browser will complete installation.',
                      'Solicitação aceita. O navegador vai concluir a instalação.',
                    )
                  : feedback === 'dismissed'
                    ? t(
                        'Instalación cancelada. Puedes usar el menú del navegador cuando quieras.',
                        'Installation canceled. You can use the browser menu whenever you want.',
                        'Instalação cancelada. Você pode usar o menu do navegador quando quiser.',
                      )
                    : t(
                        'No se pudo abrir la instalación. Sigue los pasos del navegador.',
                        'Could not open installation. Follow the browser steps below.',
                        'Não foi possível abrir a instalação. Siga os passos do navegador.',
                      )}
              </p>
            )}
            <div
              className="fw-install-platforms"
              role="group"
              aria-label={t('Tu dispositivo', 'Your device', 'Seu dispositivo')}
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
                      : t('Computadora', 'Computer', 'Computador')}
                </button>
              ))}
            </div>
            {platform === 'ios' ? (
              <ol>
                <li>
                  {t(
                    'Abre esta página en Safari.',
                    'Open this page in Safari.',
                    'Abra esta página no Safari.',
                  )}
                </li>
                <li>
                  {t(
                    'Toca Compartir (el cuadrado con una flecha hacia arriba). Según tu versión, está dentro del menú Más.',
                    'Tap Share (the square with an upward arrow). Depending on your version, it may be inside the More menu.',
                    'Toque em Compartilhar (o quadrado com uma seta para cima). Dependendo da versão, ele fica dentro do menu Mais.',
                  )}
                </li>
                <li>
                  {t(
                    'Elige «Añadir a pantalla de inicio». Si aparece «Abrir como app web», déjalo activado y toca Añadir.',
                    'Choose “Add to Home Screen.” If “Open as Web App” appears, leave it on and tap Add.',
                    'Escolha “Adicionar à Tela de Início”. Se aparecer “Abrir como App Web”, deixe ativado e toque em Adicionar.',
                  )}
                </li>
              </ol>
            ) : platform === 'android' ? (
              <ol>
                <li>
                  {t(
                    'Abre esta página en Chrome.',
                    'Open this page in Chrome.',
                    'Abra esta página no Chrome.',
                  )}
                </li>
                <li>
                  {t(
                    'Abre el menú ⋮ y elige «Instalar aplicación» o «Añadir a pantalla de inicio».',
                    'Open the ⋮ menu and choose “Install app” or “Add to Home screen.”',
                    'Abra o menu ⋮ e escolha “Instalar app” ou “Adicionar à tela inicial”.',
                  )}
                </li>
                <li>
                  {t(
                    'Confirma Instalar o Añadir. El nombre de la opción puede variar según el navegador.',
                    'Confirm Install or Add. The option name may vary by browser.',
                    'Confirme Instalar ou Adicionar. O nome da opção pode variar conforme o navegador.',
                  )}
                </li>
              </ol>
            ) : (
              <ol>
                <li>
                  {t(
                    'En Chrome o Edge, busca el icono de instalación en la barra de direcciones o la opción de instalar en el menú.',
                    'In Chrome or Edge, look for the install icon in the address bar or the install option in the menu.',
                    'No Chrome ou no Edge, procure o ícone de instalação na barra de endereço ou a opção de instalar no menu.',
                  )}
                </li>
                <li>
                  {t(
                    'Si tu navegador no ofrece instalación, guarda esta página como marcador.',
                    'If your browser does not offer installation, bookmark this page.',
                    'Se o seu navegador não oferecer instalação, salve esta página nos favoritos.',
                  )}
                </li>
              </ol>
            )}
            <p className="fw-install-note">
              {t(
                'Necesitas internet para abrir Faro y actualizar las fuentes. Instalarlo no activa alertas cuando está cerrado. Los datos de tu viaje no se sincronizan; comprueba tu perfil al abrirlo desde el icono.',
                'You need internet to open Faro and refresh sources. Installing does not enable alerts while it is closed. Trip data does not sync; check your profile when opening from the icon.',
                'Você precisa de internet para abrir o Faro e atualizar as fontes. Instalar não ativa alertas quando ele está fechado. Os dados da viagem não são sincronizados; confira seu perfil ao abrir pelo ícone.',
              )}
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
