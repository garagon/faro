/**
 * Links that open a messaging app with the text ready; the person picks the recipient and
 * sends it there. Faro never sends anything itself.
 */
export type ShareChannel = 'whatsapp' | 'telegram' | 'sms' | 'email';

export function shareLink(channel: ShareChannel, text: string, subject = ''): string {
  const body = encodeURIComponent(text);
  switch (channel) {
    case 'whatsapp':
      return `https://wa.me/?text=${body}`;
    case 'telegram':
      // Telegram documents `url` as required; the message itself goes there.
      return `https://t.me/share/url?url=${body}`;
    case 'sms':
      // `?&body=` is read by both iOS and Android messaging apps.
      return `sms:?&body=${body}`;
    case 'email':
      return `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
  }
}
