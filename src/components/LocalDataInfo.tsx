import { useState } from 'react';
import { flushSync } from 'react-dom';
import { pick, type Lang } from '../lib/i18n.ts';
import { Button, ScopeNote, Text } from '../ui/index.ts';

/**
 * Removes everything Faro keeps in this browser (every `faro-` key: profile, health, stay,
 * contacts, messages, go bag, saved countries, language and the public data copies), then
 * reloads so no screen keeps a copy in memory. The offline application copy has no personal data.
 */
function forgetEverything() {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('faro-')) keys.push(key);
  }
  for (const key of keys) localStorage.removeItem(key);
  return keys.every((key) => localStorage.getItem(key) === null);
}

/**
 * The last words of Viaje: one place to delete everything Faro saved here, and the screen's one
 * scope note, which says where the data stays and links to the privacy page for the details
 * (location, connections to other services, sharing). Each section can still delete its own part.
 */
export default function LocalDataInfo({ lang }: { lang: Lang }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const [confirm, setConfirm] = useState(false),
    [failed, setFailed] = useState(false);
  // The button gives way to the confirmation and back; focus follows, as in the form above.
  const ask = (open: boolean) => {
    flushSync(() => setConfirm(open));
    document.getElementById(open ? 'local-delete-confirm' : 'local-delete')?.focus();
  };
  return (
    <div className="f-stack grid gap-4">
      {!confirm ? (
        <Button variant="ghost" data-tone="error" id="local-delete" onClick={() => ask(true)}>
          {/* "In this browser" is the scope note's first words, just below. */}
          {t(
            'Borrar todo lo que guardó Faro',
            'Delete everything Faro saved',
            'Apagar tudo o que o Faro salvou',
          )}
        </Button>
      ) : (
        <div
          className="f-stack grid gap-2"
          data-gap="sm"
          role="group"
          aria-label={t('Confirmar', 'Confirm', 'Confirmar')}
        >
          <Text>
            {t(
              '¿Borrar perfil, salud, alojamiento, contactos, mensajes, mochila y países guardados? No se puede deshacer.',
              'Delete profile, health, stay, contacts, messages, go bag and saved countries? This cannot be undone.',
              'Apagar perfil, saúde, hospedagem, contatos, mensagens, mochila e países salvos? Não é possível desfazer.',
            )}
          </Text>
          <div className="f-chips">
            <Button
              variant="secondary"
              id="local-delete-confirm"
              onClick={() => {
                try {
                  if (forgetEverything()) location.reload();
                  else setFailed(true);
                } catch {
                  setFailed(true);
                }
              }}
            >
              {t('Sí, borrar todo', 'Yes, delete everything', 'Sim, apagar tudo')}
            </Button>
            <Button variant="ghost" onClick={() => ask(false)}>
              {t('Cancelar', 'Cancel', 'Cancelar')}
            </Button>
          </div>
        </div>
      )}
      {failed && (
        <Text role="alert">
          {t(
            'El navegador no permitió borrar todo. Borra los datos del sitio desde la configuración del navegador.',
            'The browser did not allow deleting everything. Clear site data from the browser settings.',
            'O navegador não permitiu apagar tudo. Apague os dados do site nas configurações do navegador.',
          )}
        </Text>
      )}
      <ScopeNote>
        {t(
          'Se guarda solo en este navegador, sin cuenta. Faro no envía nada por ti.',
          'Stored only in this browser, with no account. Faro never sends anything for you.',
          'Fica salvo só neste navegador, sem conta. O Faro não envia nada por você.',
        )}{' '}
        <a href="/privacy.html">
          {t(
            'Qué se guarda y a quién llega',
            'What is stored and who receives what',
            'O que é guardado e quem recebe o quê',
          )}
        </a>
      </ScopeNote>
    </div>
  );
}
