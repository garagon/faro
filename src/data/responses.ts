import type { Localized } from './destinations/types.ts';

/**
 * Official responses to a specific disaster, summarized by hand from the cited publications.
 * Each fact keeps its source and the time it refers to. A response stops showing after
 * `showUntil` unless someone reviews it again: figures change and Faro does not track them.
 */
export type ResponseFact = { label: Localized; text: Localized; source: string };
export type ResponseLink = { name: Localized; url: string };
export type ActiveResponse = {
  id: string;
  country: string;
  /** Names the event by magnitude and place; the date goes on its own line, never beside "M". */
  title: Localized;
  /** When it happened, as published (ISO, UTC), to show the date and how long ago. */
  occurredAt: string;
  /** Who reported the time. */
  occurredSource: string;
  /**
   * Each agency's magnitude as published, the title's first. Agencies compute it differently;
   * showing both avoids a local reader seeing another figure and doubting the card.
   */
  magnitudes: { value: string; source: Localized }[];
  /** The local date and time as people there say it. */
  when: Localized;
  /** The latest official picture in one or two sentences, with its data time. */
  highlight: Localized;
  summary: Localized;
  reviewedAt: string;
  showUntil: string;
  facts: ResponseFact[];
  /** Shown only to people who selected this nationality. */
  consular?: {
    nationality: string;
    text: Localized;
    lines: { scope: Localized; number: string; display: string }[];
    url: string;
  };
  help: Localized[];
  links: ResponseLink[];
};

export const activeResponses: ActiveResponse[] = [
  {
    id: 'pa-2026-10-09-earthquake',
    country: 'PA',
    title: [
      'Sismo de magnitud 7.7 en el sur de Panamá',
      'Magnitude 7.7 earthquake in southern Panama',
      'Terremoto de magnitude 7.7 no sul do Panamá',
    ],
    occurredAt: '2026-10-09T17:56:00Z',
    occurredSource: 'USGS',
    // Checked 2026-10-14: USGS us6000u18k M7.7 mww, reviewed; SINAPROC communiqués #9 and #11
    // say 7.5; IGC table M7.2, REVISADO.
    magnitudes: [
      { value: '7.7', source: ['USGS', 'USGS', 'USGS'] },
      { value: '7.5', source: ['SINAPROC', 'SINAPROC', 'SINAPROC'] },
      { value: '7.2', source: ['IGC de Panamá', "Panama's IGC", 'IGC do Panamá'] },
    ],
    when: [
      'viernes 9 de octubre, 12:56 (hora de Panamá)',
      'Friday, October 9, 12:56 (Panama time)',
      'sexta-feira, 9 de outubro, 12:56 (horário do Panamá)',
    ],
    highlight: [
      'Balance de SINAPROC del 13 oct (datos hasta las 19:00): más de 33 albergues con más de 2841 personas. Había 11 comunidades incomunicadas en Herrera.',
      'SINAPROC update of Oct 13 (data up to 7:00 p.m.): more than 33 shelters with more than 2,841 people. 11 communities in Herrera were cut off.',
      'Balanço do SINAPROC de 13 de out. (dados até as 19:00): mais de 33 abrigos com mais de 2.841 pessoas. Havia 11 comunidades isoladas em Herrera.',
    ],
    summary: [
      'Resumen de publicaciones oficiales: SINAPROC, Departamento de Estado de EE. UU., USGS y Copernicus.',
      'Summary of official publications: SINAPROC, U.S. Department of State, USGS and Copernicus.',
      'Resumo de publicações oficiais: SINAPROC, Departamento de Estado dos EUA, USGS e Copernicus.',
    ],
    // Re-reviewed on 2026-10-14 against SINAPROC communiqué #11 (data up to 13 Oct, 19:00). At
    // most 14 days after each review; figures older than that must not stay on screen.
    reviewedAt: '2026-10-14',
    showUntil: '2026-10-28',
    facts: [
      {
        label: ['Balance de SINAPROC', 'SINAPROC update', 'Balanço do SINAPROC'],
        text: [
          'Mismo comunicado #11 (13 oct, datos hasta las 19:00), además de los albergues: más de 3667 familias evaluadas (11 527 personas); unas 3390 viviendas afectadas, 727 de ellas pérdida total en Herrera y Los Santos. Las cifras son preliminares.',
          'Same statement #11 (Oct 13, data up to 7:00 p.m.), besides the shelters: more than 3,667 families assessed (11,527 people); about 3,390 homes affected, 727 of them total losses in Herrera and Los Santos. Figures are preliminary.',
          'Mesmo comunicado #11 (13 de out., dados até as 19:00), além dos abrigos: mais de 3.667 famílias avaliadas (11.527 pessoas); cerca de 3.390 moradias afetadas, 727 delas com perda total em Herrera e Los Santos. Os números são preliminares.',
        ],
        source: 'SINAPROC',
      },
      {
        label: ['Zonas afectadas', 'Affected areas', 'Áreas afetadas'],
        text: [
          'Según el comunicado #8 (12 oct), hubo daños en Veraguas, Coclé, Los Santos, Herrera, Chiriquí, Panamá Oeste, Colón y Darién, y comunidades incomunicadas en Los Santos y Herrera por daños en puentes, carreteras y deslizamientos.',
          'According to statement #8 (Oct 12), there was damage in Veraguas, Coclé, Los Santos, Herrera, Chiriquí, Panamá Oeste, Colón and Darién, and communities in Los Santos and Herrera were cut off by damaged bridges, roads and landslides.',
          'Segundo o comunicado #8 (12 de out.), houve danos em Veraguas, Coclé, Los Santos, Herrera, Chiriquí, Panamá Oeste, Colón e Darién, e comunidades isoladas em Los Santos e Herrera por danos em pontes, estradas e deslizamentos.',
        ],
        source: 'SINAPROC',
      },
      {
        label: ['Apoyo internacional', 'International support', 'Apoio internacional'],
        text: [
          'A pedido del Gobierno de Panamá, EE. UU. desplegó un equipo de respuesta a desastres y equipos de búsqueda y rescate urbano para evaluar estructuras. El servicio Copernicus de la UE activó su cartografía de emergencia por satélite.',
          'At the request of the Government of Panama, the U.S. deployed a disaster assistance response team and urban search and rescue teams to assess structures. The EU Copernicus service activated its satellite emergency mapping.',
          'A pedido do Governo do Panamá, os EUA mobilizaram uma equipe de resposta a desastres e equipes de busca e resgate urbano para avaliar estruturas. O serviço Copernicus da UE ativou seu mapeamento de emergência por satélite.',
        ],
        source: 'U.S. Department of State, Copernicus EMS',
      },
    ],
    consular: {
      nationality: 'US',
      text: [
        'Ciudadanos de EE. UU.: línea consular las 24 horas del Departamento de Estado. Inscríbete en STEP para recibir avisos de la embajada.',
        'U.S. citizens: the State Department consular line, 24 hours a day. Enroll in STEP to receive embassy alerts.',
        'Cidadãos dos EUA: linha consular 24 horas do Departamento de Estado. Inscreva-se no STEP para receber avisos da embaixada.',
      ],
      lines: [
        {
          scope: ['Desde el exterior', 'From abroad', 'Do exterior'],
          number: '+12025014444',
          display: '+1 202-501-4444',
        },
        {
          scope: ['Desde EE. UU. y Canadá', 'From the U.S. and Canada', 'Dos EUA e do Canadá'],
          number: '+18884074747',
          display: '+1 888-407-4747',
        },
      ],
      url: 'https://mytravel.state.gov/s/step',
    },
    help: [
      [
        'Dona dinero a organizaciones de ayuda establecidas: compran en el lugar, más rápido y sin costos de envío.',
        'Give money to established relief organizations: they buy locally, faster and without shipping costs.',
        'Doe dinheiro a organizações de ajuda estabelecidas: elas compram no local, mais rápido e sem custos de envio.',
      ],
      [
        'No envíes ropa, comida, medicinas ni agua embotellada salvo que una organización lo pida: saturan la logística.',
        'Do not send clothes, food, medicine or bottled water unless an organization asks: they clog the supply chain.',
        'Não envie roupas, comida, remédios nem água engarrafada, a menos que uma organização peça: isso sobrecarrega a logística.',
      ],
      [
        'Verifica la organización antes de donar. Después de un desastre aparecen estafas, campañas falsas y colectas fraudulentas.',
        'Verify the organization before giving. Scams, fake appeals and fraudulent fundraisers follow disasters.',
        'Verifique a organização antes de doar. Depois de um desastre aparecem golpes, campanhas falsas e arrecadações fraudulentas.',
      ],
    ],
    links: [
      {
        name: [
          'SINAPROC: comunicado oficial #11',
          'SINAPROC: official statement #11',
          'SINAPROC: comunicado oficial #11',
        ],
        url: 'https://www.sinaproc.gob.pa/comunicado-oficial-11/',
      },
      {
        name: [
          'Departamento de Estado de EE. UU.: respuesta y formas de ayudar',
          'U.S. Department of State: response and ways to help',
          'Departamento de Estado dos EUA: resposta e formas de ajudar',
        ],
        url: 'https://www.state.gov/responding-to-panama-earthquake/',
      },
      {
        name: [
          'USGS: datos del sismo M7.7',
          'USGS: M7.7 earthquake data',
          'USGS: dados do terremoto M7.7',
        ],
        url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us6000u18k',
      },
      {
        name: [
          'Copernicus EMS: cartografía de emergencia (EMSR934)',
          'Copernicus EMS: emergency mapping (EMSR934)',
          'Copernicus EMS: mapeamento de emergência (EMSR934)',
        ],
        url: 'https://mapping.emergency.copernicus.eu/activations/EMSR934/',
      },
      {
        name: [
          'FTC: cómo donar sin caer en estafas',
          'FTC: how to donate wisely and avoid scams',
          'FTC: como doar sem cair em golpes',
        ],
        url: 'https://consumer.ftc.gov/features/donating-safely-and-avoiding-scams',
      },
    ],
  },
];

/** Responses for a country that are still within their review window. */
export function responsesFor(country: string, now: number) {
  return activeResponses.filter(
    (r) => r.country === country && now < Date.parse(r.showUntil + 'T23:59:59Z'),
  );
}
