import { LockSimpleIcon } from '@phosphor-icons/react';
import { pick, type Lang } from '../lib/i18n.ts';
export default function LocalDataInfo({ lang }: { lang: Lang }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
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
                'Los catálogos sísmicos necesitan internet, pero no reciben tus datos del viaje. El mapa se carga automáticamente al abrir su vista. OpenStreetMap recibe tu IP y el área que consultas.',
                'Earthquake catalogs need internet but do not receive your trip data. The map loads automatically when its view opens. OpenStreetMap receives your IP and the area you view.',
                'Os catálogos sísmicos precisam de internet, mas não recebem os dados da sua viagem. O mapa carrega automaticamente ao abrir a visualização dele. O OpenStreetMap recebe seu IP e a área que você consulta.',
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
