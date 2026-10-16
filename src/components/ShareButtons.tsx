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
import { ActionRow, List, Note } from '../ui/index.ts';

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

/** One list of channels used worldwide; the person chooses the recipient in each app. */
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
  const all: {
    id: ShareChannel;
    name: string;
    meta: string;
    Icon: typeof WhatsappLogoIcon;
  }[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      meta: t(
        'Eliges el chat en WhatsApp',
        'You pick the chat in WhatsApp',
        'Escolha a conversa no WhatsApp',
      ),
      Icon: WhatsappLogoIcon,
    },
    {
      id: 'telegram',
      name: 'Telegram',
      meta: t(
        'Eliges el chat en Telegram',
        'You pick the chat in Telegram',
        'Escolha a conversa no Telegram',
      ),
      Icon: TelegramLogoIcon,
    },
    {
      id: 'sms',
      name: 'SMS',
      meta: t(
        'Sale con señal de llamadas',
        'Goes out with a call signal',
        'Sai com sinal de chamadas',
      ),
      Icon: ChatCircleDotsIcon,
    },
    {
      id: 'email',
      name: t('Correo', 'Email', 'E-mail'),
      meta: t(
        'Eliges a quién en tu correo',
        'You pick who in your email app',
        'Escolha para quem no e-mail',
      ),
      Icon: EnvelopeSimpleIcon,
    },
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
  const status = [feedback || hint, offlineHint].filter(Boolean).join(' ');
  return (
    <div className="f-stack" data-gap="sm">
      <List label={label}>
        {channels.map(({ id, name, meta, Icon }) => (
          <ActionRow
            key={id}
            icon={
              <Icon
                size={20}
                weight={id === 'sms' || id === 'email' ? 'regular' : 'fill'}
                aria-hidden="true"
              />
            }
            title={name}
            meta={meta}
            href={shareLink(id, text, subject)}
            external={id === 'whatsapp' || id === 'telegram'}
            disabled={!enabled}
            onClick={(e) => {
              if (!ok()) e.preventDefault();
            }}
          />
        ))}
        {typeof navigator.share === 'function' && (
          <ActionRow
            icon={<ShareNetworkIcon size={20} aria-hidden="true" />}
            title={t('Otras apps', 'Other apps', 'Outros apps')}
            meta={t(
              'El menú para compartir del teléfono',
              "Your phone's share menu",
              'O menu de compartilhar do celular',
            )}
            disabled={!enabled}
            onClick={() => void share()}
          />
        )}
        <ActionRow
          icon={<CopyIcon size={20} aria-hidden="true" />}
          title={t('Copiar texto', 'Copy text', 'Copiar texto')}
          meta={t(
            'Para pegarlo en cualquier chat',
            'To paste into any chat',
            'Para colar em qualquer conversa',
          )}
          disabled={!enabled}
          onClick={() => void copy()}
        />
      </List>
      {/* Always present, so a screen reader announces the feedback when it appears. */}
      <div role="status">{status && <Note>{status}</Note>}</div>
    </div>
  );
}
