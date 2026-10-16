import { ArrowUpRightIcon, BuildingOfficeIcon, MapTrifoldIcon } from '@phosphor-icons/react';
import { destinationFor } from '../data/destinations/index.ts';
import { pick, type Lang } from '../lib/i18n.ts';
import { List, ListRow, Note, RowIcon, SafetyNotice, Steps } from '../ui/index.ts';

const out = <ArrowUpRightIcon size={16} aria-hidden="true" />;

export default function EvacuationPlan({ country, lang }: { country: string; lang: Lang }) {
  const t = (es: string, en: string, pt: string) => pick(lang, es, en, pt),
    destination = destinationFor(country);
  const step = (id: string, title: string, body: string) => ({
    id,
    text: (
      <>
        <h4 className="f-subhead">{title}</h4>
        {body}
      </>
    ),
  });
  return (
    <section className="f-section" aria-labelledby="evacuation-title">
      <h3 id="evacuation-title" className="f-section-title">
        {t('Antes de seguir una ruta', 'Before following a route', 'Antes de seguir uma rota')}
      </h3>
      <SafetyNotice>
        {t(
          'Faro no verifica el estado de calles, salidas ni puntos de encuentro. Una ruta de Google Maps no es una ruta de evacuación.',
          'Faro does not verify roads, exits or meeting points. Google Maps directions are not an evacuation route.',
          'O Faro não verifica ruas, saídas nem pontos de encontro. Uma rota do Google Maps não é uma rota de evacuação.',
        )}
      </SafetyNotice>
      <Steps
        items={[
          step(
            'exit',
            t('Confirma la salida', 'Confirm the exit', 'Confirme a saída'),
            t(
              'Pide en recepción la ruta desde tu habitación, una alternativa y apoyo si tienes movilidad reducida. No uses ascensores durante el sismo.',
              'Ask reception for the route from your room, an alternative and support if you have limited mobility. Do not use elevators during shaking.',
              'Peça à recepção a rota a partir do seu quarto, uma alternativa e apoio se você tiver mobilidade reduzida. Não use elevadores durante o tremor.',
            ),
          ),
          step(
            'tsunami',
            t('Ten en cuenta el tsunami', 'Consider tsunami risk', 'Considere o risco de tsunami'),
            t(
              'El punto del hotel puede estar en zona inundable. En la costa, confirma con la autoridad local la ruta a terreno alto o tierra adentro.',
              'The hotel meeting point may be in a flood zone. On the coast, confirm the route to higher ground or inland with local authorities.',
              'O ponto de encontro do hotel pode ficar em área inundável. No litoral, confirme com a autoridade local a rota para terreno alto ou para longe da costa.',
            ),
          ),
          step(
            'current',
            t(
              'Sigue las indicaciones actuales',
              'Follow current instructions',
              'Siga as orientações atuais',
            ),
            t(
              'Los daños pueden bloquear una ruta prevista. No regreses a una zona evacuada hasta que la autoridad lo permita.',
              'Damage can block a planned route. Do not return to an evacuated area until authorities allow it.',
              'Danos podem bloquear uma rota prevista. Não volte a uma área evacuada até que a autoridade permita.',
            ),
          ),
        ]}
      />
      {!destination?.evacuation && (
        <Note>
          {t(
            'Faro no tiene un plano oficial de evacuación integrado para este país. Confirma la ruta exacta con recepción y protección civil.',
            'Faro has no integrated official evacuation map for this country. Confirm the exact route with reception and civil protection.',
            'O Faro não tem um mapa oficial de evacuação integrado para este país. Confirme a rota exata com a recepção e a defesa civil.',
          )}
        </Note>
      )}
      {(destination?.evacuation || destination?.civilProtection) && (
        <List>
          {destination.evacuation && (
            <ListRow
              href={destination.evacuation.url}
              external
              lead={<RowIcon icon={<MapTrifoldIcon size={20} aria-hidden="true" />} />}
              title={t(
                'Consultar planos oficiales',
                'View official evacuation maps',
                'Ver mapas oficiais de evacuação',
              )}
              meta={destination.evacuation.name}
              trail={out}
            />
          )}
          {destination.civilProtection && (
            <ListRow
              href={destination.civilProtection.url}
              external
              lead={<RowIcon icon={<BuildingOfficeIcon size={20} aria-hidden="true" />} />}
              title={`${t('Indicaciones locales de', 'Local guidance from', 'Orientações locais:')} ${destination.civilProtection.name}`}
              meta={
                destination.evacuation
                  ? t(
                      'Instrucciones del lugar donde estás',
                      'Instructions for where you are',
                      'Instruções do lugar onde você está',
                    )
                  : undefined
              }
              trail={out}
            />
          )}
        </List>
      )}
      {/* The general steps come from Chile's SENAPRED and NOAA; Chile's maps are only shown there. */}
      <Note>
        {t(
          'Orientación general: SENAPRED (Chile) y NOAA.',
          'General guidance: SENAPRED (Chile) and NOAA.',
          'Orientação geral: SENAPRED (Chile) e NOAA.',
        )}
      </Note>
    </section>
  );
}
