import { ListOrderedIcon, MapIcon } from 'lucide-react';
import { pick, type Lang } from '../lib/i18n.ts';
import { googleMapsArea, offlineMapsHelp } from '../lib/offlineMap.ts';
import {
  Actions,
  Disclosure,
  LinkButton,
  Note,
  OutLink,
  RowIcon,
  Section,
  Steps,
  Text,
} from '../ui/index.ts';

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
  const howTo = (
    <>
      <Steps
        items={[
          {
            id: 'profile',
            text: t(
              'En Google Maps, toca tu foto de perfil y luego «Mapas sin conexión».',
              'In Google Maps, tap your profile picture, then "Offline maps".',
              'No Google Maps, toque na sua foto do perfil e depois em "Mapas off-line".',
            ),
          },
          {
            id: 'download',
            text: t(
              'Toca «Selecciona tu propio mapa», ajusta la zona y toca «Descargar».',
              'Tap "Select your own map", adjust the area and tap "Download".',
              'Toque em "Selecione seu mapa", ajuste a área e toque em "Download".',
            ),
          },
        ]}
      />
      {/* The app's limits, as Google documents them: text to read, with the source after it. */}
      <Text>
        {t(
          'Hazlo con wifi. Sin conexión no hay indicaciones a pie, en bicicleta ni en transporte público; en auto, solo si toda la ruta está en la zona guardada. El mapa caduca si no se actualiza y en algunos países no se puede descargar.',
          'Do it on Wi-Fi. Offline there are no walking, cycling or transit directions; driving works only if the whole route is in the saved area. The map expires unless updated, and some countries cannot be downloaded.',
          'Faça isso no Wi-Fi. Off-line não há rotas a pé, de bicicleta nem de transporte público; de carro, só se toda a rota estiver na área salva. O mapa expira se não for atualizado, e em alguns países não é possível baixar.',
        )}
      </Text>
      <Actions>
        <OutLink href={offlineMapsHelp(lang)}>
          {t('Ayuda de Google', 'Google help', 'Ajuda do Google')}
        </OutLink>
      </Actions>
    </>
  );
  return (
    <Section id="fw-offline-map" title={t('Mapa sin conexión', 'Offline map', 'Mapa off-line')}>
      <Text>
        {t(
          'El mapa de Faro necesita internet. Antes de quedarte sin señal, guarda la zona en la app de Google Maps: ahí sigue funcionando sin conexión.',
          "Faro's map needs internet. Before you lose signal, save the area in the Google Maps app: it keeps working there offline.",
          'O mapa do Faro precisa de internet. Antes de ficar sem sinal, salve a área no app Google Maps: lá ele continua funcionando off-line.',
        )}
      </Text>
      <LinkButton
        variant="secondary"
        href={url}
        external
        icon={<MapIcon className="size-4" aria-hidden="true" />}
      >
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
      </LinkButton>
      {/* What the third party receives, in one line next to its button. */}
      <Note>
        {t(
          'Google recibe solo la zona; Faro no guarda mapas.',
          'Google gets only the area; Faro stores no maps.',
          'O Google recebe a área; o Faro não guarda mapas.',
        )}
      </Note>
      {/* Viaje (its one home) starts every row with an icon: this one shares the text edge. */}
      <Disclosure
        lead={<RowIcon icon={<ListOrderedIcon className="size-4" />} />}
        title={t(
          'Cómo guardarla y sus límites',
          'How to save it and its limits',
          'Como salvá-la e seus limites',
        )}
      >
        {howTo}
      </Disclosure>
    </Section>
  );
}
