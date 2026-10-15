import { MapTrifoldIcon } from '@phosphor-icons/react';
import { ExternalLink } from './Ui.tsx';
import { pick, type Lang } from '../lib/i18n.ts';
import { googleMapsArea, offlineMapsHelp } from '../lib/offlineMap.ts';

type Props = {
  lang: Lang;
  /** The area to open: the saved stay when there is one, otherwise what Faro's map shows. */
  view: { lat: number; lng: number; zoom: number };
  /** Says which area opens, so the person knows before tapping. */
  around: 'stay' | 'here' | 'map';
};

/**
 * A map that works without signal, through the Google Maps app's own download. Faro never
 * stores tiles; it opens the area and gives the app's steps, with their limits, as Google
 * documents them.
 */
export default function OfflineMap({ lang, view, around }: Props) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const url = googleMapsArea(view);
  if (!url) return null;
  return (
    <section className="fw-offline-map" aria-labelledby="fw-offline-map-title">
      <MapTrifoldIcon size={26} aria-hidden="true" />
      <div>
        <h2 id="fw-offline-map-title">{t('Mapa sin conexión', 'Offline map', 'Mapa off-line')}</h2>
        <p>
          {t(
            'El mapa de Faro necesita internet. Antes de quedarte sin señal, guarda la zona en la app de Google Maps: ahí sigue funcionando sin conexión.',
            "Faro's map needs internet. Before you lose signal, save the area in the Google Maps app: it keeps working there offline.",
            'O mapa do Faro precisa de internet. Antes de ficar sem sinal, salve a área no app Google Maps: lá ele continua funcionando off-line.',
          )}
        </p>
        <ExternalLink href={url} className="fw-offline-map-open">
          {around === 'stay'
            ? t(
                'Abrir la zona de tu alojamiento en Google Maps',
                'Open the area around your stay in Google Maps',
                'Abrir a área da sua hospedagem no Google Maps',
              )
            : around === 'here'
              ? t(
                  'Abrir la zona donde estás en Google Maps',
                  'Open the area where you are in Google Maps',
                  'Abrir a área onde você está no Google Maps',
                )
              : t(
                  'Abrir la zona del mapa en Google Maps',
                  'Open the map area in Google Maps',
                  'Abrir a área do mapa no Google Maps',
                )}
        </ExternalLink>
        <ol>
          <li>
            {t(
              'En Google Maps, toca tu foto de perfil y luego «Mapas sin conexión».',
              'In Google Maps, tap your profile picture, then "Offline maps".',
              'No Google Maps, toque na sua foto do perfil e depois em "Mapas off-line".',
            )}
          </li>
          <li>
            {t(
              'Toca «Selecciona tu propio mapa», ajusta la zona y toca «Descargar».',
              'Tap "Select your own map", adjust the area and tap "Download".',
              'Toque em "Selecione seu mapa", ajuste a área e toque em "Download".',
            )}
          </li>
        </ol>
        <p className="fw-offline-map-note">
          {t(
            'Hazlo con wifi. Sin conexión no hay indicaciones a pie, en bicicleta ni en transporte público; en auto, solo si toda la ruta está en la zona guardada. El mapa caduca si no se actualiza y en algunos países no se puede descargar.',
            'Do it on Wi-Fi. Offline there are no walking, cycling or transit directions; driving works only if the whole route is in the saved area. The map expires unless updated, and some countries cannot be downloaded.',
            'Faça isso no Wi-Fi. Off-line não há rotas a pé, de bicicleta nem de transporte público; de carro, só se toda a rota estiver na área salva. O mapa expira se não for atualizado, e em alguns países não é possível baixar.',
          )}{' '}
          <ExternalLink href={offlineMapsHelp(lang)}>
            {t('Ayuda de Google', 'Google help', 'Ajuda do Google')}
          </ExternalLink>
        </p>
        <p className="fw-offline-map-note">
          {t(
            'Google recibe solo la zona que abres. Faro no descarga ni guarda mapas.',
            'Google receives only the area you open. Faro does not download or store maps.',
            'O Google recebe só a área que você abre. O Faro não baixa nem guarda mapas.',
          )}
        </p>
      </div>
    </section>
  );
}
