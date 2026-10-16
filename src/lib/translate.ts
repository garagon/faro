/**
 * Translation of official text published only in Spanish, always started by the person.
 * On-device translation (where the browser offers it) sends nothing anywhere. The Google
 * Translate links open only when tapped and carry only public official text, never personal data.
 */

// Google Translate's text box accepts about 5,000 characters; longer text is cut, not refused.
const MAX_TEXT = 4500;

export function googleTextTranslation(text: string, from = 'es', to = 'en') {
  const clipped = text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}…` : text;
  const params = new URLSearchParams({ sl: from, tl: to, op: 'translate', text: clipped });
  return `https://translate.google.com/?${params}`;
}

/** The official page itself, shown translated by Google. Only https pages are passed on. */
export function googlePageTranslation(url: string, from = 'es', to = 'en') {
  try {
    if (new URL(url).protocol !== 'https:') return '';
  } catch {
    return '';
  }
  const params = new URLSearchParams({ sl: from, tl: to, u: url });
  return `https://translate.google.com/translate?${params}`;
}

type DeviceTranslator = { translate(text: string): Promise<string> };
type TranslatorApi = {
  availability(options: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
  create(options: { sourceLanguage: string; targetLanguage: string }): Promise<DeviceTranslator>;
};

/**
 * The browser's built-in translator, only if its language model is already on the device:
 * Faro never triggers a model download during an emergency.
 */
export async function deviceTranslator(from = 'es', to = 'en'): Promise<DeviceTranslator | null> {
  const api = (globalThis as { Translator?: TranslatorApi }).Translator;
  if (!api) return null;
  const languages = { sourceLanguage: from, targetLanguage: to };
  try {
    if ((await api.availability(languages)) !== 'available') return null;
    return await api.create(languages);
  } catch {
    return null;
  }
}
