import { useEffect, useState } from 'react';
import {
  ChatCircleDotsIcon,
  CopyIcon,
  EnvelopeSimpleIcon,
  ShareNetworkIcon,
  TelegramLogoIcon,
  WhatsappLogoIcon,
} from '@phosphor-icons/react';
import { shareLink, type ShareChannel } from '../lib/share.ts';
import { pick, type Lang } from '../lib/i18n.ts';

type Props = {
  lang: Lang;
  text: string;
  subject: string;
  /** When false the buttons stay visible but do nothing, with the reason in `hint`. */
  enabled?: boolean;
  hint?: string;
  label: string;
  /** Checked again at the moment of sharing, for messages that expire. */
  allow?: () => boolean;
};

/** One row of channels used worldwide; the person chooses the recipient in each app. */
export default function ShareButtons({
  lang,
  text,
  subject,
  enabled = true,
  hint,
  label,
  allow,
}: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const [feedback, setFeedback] = useState('');
  // Without data, WhatsApp and Telegram wait in the outbox; SMS only needs a phone signal.
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  const ok = () => enabled && (!allow || allow());
  const all: { id: ShareChannel; name: string; Icon: typeof WhatsappLogoIcon }[] = [
    { id: 'whatsapp', name: 'WhatsApp', Icon: WhatsappLogoIcon },
    { id: 'telegram', name: 'Telegram', Icon: TelegramLogoIcon },
    { id: 'sms', name: 'SMS', Icon: ChatCircleDotsIcon },
    { id: 'email', name: t('Correo', 'Email', 'E-mail'), Icon: EnvelopeSimpleIcon },
  ];
  const channels = online ? all : [all[2], ...all.filter((c) => c.id !== 'sms')];
  const offlineHint = online
    ? ''
    : t(
        'Sin datos: el SMS sale con señal de llamadas; WhatsApp y Telegram esperan a que vuelva internet.',
        'No data: SMS goes out with a call signal; WhatsApp and Telegram wait until internet returns.',
        'Sem dados: o SMS sai com sinal de chamadas; WhatsApp e Telegram esperam a internet voltar.',
      );
  const copy = async () => {
    if (!ok()) return;
    try {
      await navigator.clipboard.writeText(text);
      setFeedback(
        t(
          'Copiado. Pégalo en la conversación que elijas.',
          'Copied. Paste it into any chat.',
          'Copiado. Cole na conversa que você escolher.',
        ),
      );
    } catch {
      setFeedback(
        t(
          'No se pudo copiar. Selecciona el texto para copiarlo a mano.',
          'Could not copy. Select the text to copy it manually.',
          'Não foi possível copiar. Selecione o texto para copiá-lo manualmente.',
        ),
      );
    }
  };
  const share = async () => {
    if (!ok()) return;
    try {
      await navigator.share({ text });
    } catch {
      // Closing the share sheet is not an error worth reporting.
    }
  };
  return (
    <div className="fw-share">
      <div className="fw-share-channels" role="group" aria-label={label}>
        {channels.map(({ id, name, Icon }) =>
          enabled ? (
            <a
              key={id}
              className="fw-share-channel"
              data-channel={id}
              href={shareLink(id, text, subject)}
              target={id === 'whatsapp' || id === 'telegram' ? '_blank' : undefined}
              rel="noreferrer"
              onClick={(e) => {
                if (!ok()) e.preventDefault();
              }}
            >
              <Icon size={20} weight={id === 'sms' || id === 'email' ? 'regular' : 'fill'} />
              {name}
            </a>
          ) : (
            <span key={id} className="fw-share-channel" data-channel={id} aria-disabled="true">
              <Icon size={20} weight={id === 'sms' || id === 'email' ? 'regular' : 'fill'} />
              {name}
            </span>
          ),
        )}
      </div>
      <div className="fw-share-more">
        {typeof navigator.share === 'function' && (
          <button className="fw-secondary" disabled={!enabled} onClick={() => void share()}>
            <ShareNetworkIcon size={17} aria-hidden="true" />
            {t('Otras apps', 'Other apps', 'Outros apps')}
          </button>
        )}
        <button className="fw-secondary" disabled={!enabled} onClick={() => void copy()}>
          <CopyIcon size={17} aria-hidden="true" />
          {t('Copiar texto', 'Copy text', 'Copiar texto')}
        </button>
      </div>
      {/* Always present, so a screen reader announces the feedback when it appears. */}
      <p className="fw-share-note" role="status">
        {[feedback || hint, offlineHint].filter(Boolean).join(' ')}
      </p>
    </div>
  );
}
