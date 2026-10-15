import { useState } from 'react';
import { LockSimpleIcon } from '@phosphor-icons/react';
import { pick, type Lang } from '../lib/i18n.ts';

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

export default function LocalDataInfo({ lang }: { lang: Lang }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const [confirm, setConfirm] = useState(false),
    [failed, setFailed] = useState(false);
  return (
    <details className="fw-local-data">
      <summary>
        <LockSimpleIcon size={18} />
        <span>
          {t(
            'Tus datos quedan en este navegador',
            'Your data stays in this browser',
            'Seus dados ficam neste navegador',
          )}
        </span>
      </summary>
      <div>
        <p>
          {t(
            'Faro guarda aquí tu perfil, contactos, plan del hotel y actualizaciones de estado. Se recuperan al volver a abrir el sitio en este mismo navegador. No se envían a un servidor ni se sincronizan con otros dispositivos.',
            'Faro stores your profile, contacts, hotel plan and status updates here. They are restored when you reopen the site in this same browser. They are not sent to a server or synced to other devices.',
            'O Faro guarda aqui seu perfil, contatos, plano do hotel e atualizações de status. Eles são recuperados quando você abre o site de novo neste mesmo navegador. Não são enviados a um servidor nem sincronizados com outros dispositivos.',
          )}
        </p>
        <p>
          {t(
            'En computadora y teléfono funciona igual; cada navegador conserva su propia copia. Al borrar los datos del sitio se pierde esa copia. En navegación privada puede borrarse al cerrar la sesión. Puedes descargar la ficha de tu viaje para conservarla.',
            'It works the same on desktop and phone; each browser keeps its own copy. Clearing site data removes that copy. Private browsing may erase it when the session ends. You can download your trip sheet to keep a copy.',
            'Funciona igual no computador e no celular; cada navegador guarda sua própria cópia. Ao apagar os dados do site, essa cópia se perde. Na navegação privada, ela pode ser apagada ao encerrar a sessão. Você pode baixar a ficha da sua viagem para guardar uma cópia.',
          )}
        </p>
        <dl>
          <div>
            <dt>{t('Ubicación', 'Location', 'Localização')}</dt>
            <dd>
              {t(
                'Se usa con tu permiso para calcular distancias en el dispositivo. No se guarda automáticamente.',
                'Used with your permission to calculate distances on your device. It is not saved automatically.',
                'É usada com sua permissão para calcular distâncias no dispositivo. Não é salva automaticamente.',
              )}
            </dd>
          </div>
          <div>
            <dt>{t('Conexiones externas', 'External connections', 'Conexões externas')}</dt>
            <dd>
              {t(
                'Los catálogos sísmicos necesitan internet, pero no reciben tus datos del viaje. El mapa se carga automáticamente al abrir su vista. OpenFreeMap recibe tu IP y el área que consultas.',
                'Earthquake catalogs need internet but do not receive your trip data. The map loads automatically when its view opens. OpenFreeMap receives your IP and the area you view.',
                'Os catálogos sísmicos precisam de internet, mas não recebem os dados da sua viagem. O mapa carrega automaticamente ao abrir a visualização dele. O OpenFreeMap recebe seu IP e a área que você consulta.',
              )}
            </dd>
          </div>
          <div>
            <dt>{t('Compartir', 'Sharing', 'Compartilhar')}</dt>
            <dd>
              {t(
                'Solo al elegir compartir, copiar o abrir una ruta, el texto o el destino pasa a la aplicación que elijas. Puedes borrar los datos desde cada sección.',
                'Only when you choose to share, copy or open directions does the text or destination pass to the app you choose. You can delete saved data in each section.',
                'Só quando você escolhe compartilhar, copiar ou abrir uma rota, o texto ou o destino passa para o app que você escolher. Você pode apagar os dados salvos em cada seção.',
              )}
            </dd>
          </div>
        </dl>
        {/* One place to delete everything; each section can still delete its own part. */}
        {!confirm ? (
          <button type="button" className="fw-text" onClick={() => setConfirm(true)}>
            {t(
              'Borrar todo lo que Faro guardó en este navegador',
              'Delete everything Faro saved in this browser',
              'Apagar tudo o que o Faro salvou neste navegador',
            )}
          </button>
        ) : (
          <p
            className="fw-local-data-confirm"
            role="group"
            aria-label={t('Confirmar', 'Confirm', 'Confirmar')}
          >
            {t(
              '¿Borrar perfil, salud, alojamiento, contactos, mensajes, mochila y países guardados? No se puede deshacer.',
              'Delete profile, health, stay, contacts, messages, go bag and saved countries? This cannot be undone.',
              'Apagar perfil, saúde, hospedagem, contatos, mensagens, mochila e países salvos? Não é possível desfazer.',
            )}{' '}
            <button
              type="button"
              className="fw-text"
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
            </button>{' '}
            <button type="button" className="fw-text" onClick={() => setConfirm(false)}>
              {t('Cancelar', 'Cancel', 'Cancelar')}
            </button>
          </p>
        )}
        {failed && (
          <p role="alert">
            {t(
              'El navegador no permitió borrar todo. Borra los datos del sitio desde la configuración del navegador.',
              'The browser did not allow deleting everything. Clear site data from the browser settings.',
              'O navegador não permitiu apagar tudo. Apague os dados do site nas configurações do navegador.',
            )}
          </p>
        )}
        <p>
          <a href="/privacy.html">
            {t(
              'Privacidad y condiciones de uso: todo lo que se guarda y a quién llega',
              'Privacy and terms of use: everything that is stored and who receives what',
              'Privacidade e termos de uso: tudo o que é guardado e quem recebe o quê',
            )}
          </a>
        </p>
      </div>
    </details>
  );
}
