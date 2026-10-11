import { LockSimpleIcon } from '@phosphor-icons/react';
export default function LocalDataInfo({ lang }: { lang: 'es' | 'en' }) {
  const t = (es: string, en: string) => (lang === 'es' ? es : en);
  return (
    <details className="fw-local-data">
      <summary>
        <LockSimpleIcon size={18} />
        <span>{t('Tus datos quedan en este navegador', 'Your data stays in this browser')}</span>
      </summary>
      <div>
        <p>
          {t(
            'Faro guarda aquí tu perfil, contactos, plan del hotel y actualizaciones de estado. Se recuperan al volver a abrir el sitio en este mismo navegador. No se envían a un servidor ni se sincronizan con otros dispositivos.',
            'Faro stores your profile, contacts, hotel plan and status updates here. They are restored when you reopen the site in this same browser. They are not sent to a server or synced to other devices.',
          )}
        </p>
        <p>
          {t(
            'En computadora y teléfono funciona igual; cada navegador conserva su propia copia. Al borrar los datos del sitio se pierde esa copia. En navegación privada puede borrarse al cerrar la sesión. Puedes descargar la ficha de tu viaje para conservarla.',
            'It works the same on desktop and phone; each browser keeps its own copy. Clearing site data removes that copy. Private browsing may erase it when the session ends. You can download your trip sheet to keep a copy.',
          )}
        </p>
        <dl>
          <div>
            <dt>{t('Ubicación', 'Location')}</dt>
            <dd>
              {t(
                'Se usa con tu permiso para calcular distancias en el dispositivo. No se guarda automáticamente.',
                'Used with your permission to calculate distances on your device. It is not saved automatically.',
              )}
            </dd>
          </div>
          <div>
            <dt>{t('Conexiones externas', 'External connections')}</dt>
            <dd>
              {t(
                'Los catálogos sísmicos necesitan internet, pero no reciben tus datos del viaje. El mapa se carga automáticamente al abrir su vista. OpenStreetMap recibe tu IP y el área que consultas.',
                'Earthquake catalogs need internet but do not receive your trip data. The map loads automatically when its view opens. OpenStreetMap receives your IP and the area you view.',
              )}
            </dd>
          </div>
          <div>
            <dt>{t('Compartir', 'Sharing')}</dt>
            <dd>
              {t(
                'Solo al elegir compartir, copiar o abrir una ruta, el texto o el destino pasa a la aplicación que elijas. Puedes borrar los datos desde cada sección.',
                'Only when you choose to share, copy or open directions does the text or destination pass to the app you choose. You can delete saved data in each section.',
              )}
            </dd>
          </div>
        </dl>
      </div>
    </details>
  );
}
