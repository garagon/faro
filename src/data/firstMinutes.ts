import type { Localized } from './destinations/types.ts';

export type FirstMinutesAction = 'call' | 'tsunami' | 'status';
export type FirstMinutesStep = {
  id: string;
  text: Localized;
  action?: FirstMinutesAction;
  source: { name: string; url: string };
};
/** What the person says is happening. Faro never chooses it from a feed. */
export type EmergencyKind = 'earthquake' | 'hurricane' | 'flood';
/** `short` labels a compact selector; `label` is the full name. */
export const emergencyKinds: readonly { id: EmergencyKind; label: Localized; short: Localized }[] =
  [
    {
      id: 'earthquake',
      label: ['Sismo', 'Earthquake', 'Terremoto'],
      short: ['Sismo', 'Earthquake', 'Terremoto'],
    },
    {
      id: 'hurricane',
      label: ['Huracán o tormenta', 'Hurricane or storm', 'Furacão ou tempestade'],
      short: ['Huracán', 'Hurricane', 'Furacão'],
    },
    {
      id: 'flood',
      label: ['Inundación', 'Flood', 'Inundação'],
      short: ['Inundación', 'Flood', 'Inundação'],
    },
  ];

const cdcDuring = {
  name: 'CDC',
  url: 'https://www.cdc.gov/earthquakes/safety/stay-safe-during-an-earthquake.html',
};
const cdcAfter = {
  name: 'CDC',
  url: 'https://www.cdc.gov/earthquakes/safety/stay-safe-after-an-earthquake.html',
};
const cdcHurricane = {
  name: 'CDC',
  url: 'https://www.cdc.gov/hurricanes/media/pdfs/338199-A_NCEH_PUB_HurricaneKeyMsgs-English-508.pdf',
};
const ready = { name: 'Ready.gov', url: 'https://www.ready.gov/earthquakes' };
const readyHurricanes = { name: 'Ready.gov', url: 'https://www.ready.gov/hurricanes' };
const readyFloods = { name: 'Ready.gov', url: 'https://www.ready.gov/floods' };
const readyEvacuation = { name: 'Ready.gov', url: 'https://www.ready.gov/evacuation' };
const readyLandslides = { name: 'Ready.gov', url: 'https://www.ready.gov/landslides-debris-flow' };
const nwsHurricane = {
  name: 'NOAA / NWS',
  url: 'https://www.weather.gov/safety/hurricane-action',
};
const nwsFlood = { name: 'NOAA / NWS', url: 'https://www.weather.gov/safety/flood-during' };
const femaEarthquake = {
  name: 'FEMA',
  url: 'https://www.fema.gov/sites/default/files/documents/fema_shelter-in-place_guidance-earthquake_0.pdf',
};
const nwsTsunami = { name: 'NOAA / NWS', url: 'https://www.weather.gov/safety/tsunami-during' };
const fcc = {
  name: 'FCC',
  url: 'https://www.fcc.gov/reports-research/guides/tips-communicating-emergency',
};

// Short actions for the emergency screen. Each step restates its cited guidance; the full
// situation guides stay in SafetyGuide. Reviewed 2026-10-14.
export const hazardSteps: Record<EmergencyKind, readonly FirstMinutesStep[]> = {
  earthquake: [
    {
      id: 'shaking',
      text: [
        'Si sigue temblando: agáchate, cúbrete y sujétate.',
        'If it is still shaking: drop, cover and hold on.',
        'Se ainda estiver tremendo: abaixe‑se, proteja‑se e segure‑se.',
      ],
      source: cdcDuring,
    },
    {
      id: 'building',
      text: [
        'Si el edificio está dañado, sal cuando deje de temblar y aléjate rápido de él. No vuelvas a entrar.',
        'If the building is damaged, go outside once shaking stops and quickly move away from it. Do not go back in.',
        'Se o prédio estiver danificado, saia quando o tremor parar e afaste‑se dele rapidamente. Não volte a entrar.',
      ],
      source: ready,
    },
    {
      id: 'elevator',
      text: [
        'En un edificio de varios pisos, no uses el ascensor.',
        'In a multistory building, do not use elevators.',
        'Em um prédio de vários andares, não use o elevador.',
      ],
      source: femaEarthquake,
    },
    // The coast step, in four short lines (it was one paragraph of ten): every instruction kept.
    {
      id: 'coast',
      text: [
        'En la playa o junto al mar: apenas pare, ve a pie a un lugar alto o tierra adentro, aunque haya sido leve.',
        'On the beach or by the water: as soon as it stops, go on foot to high ground or inland, even if it was weak.',
        'Na praia ou junto ao mar: assim que parar, vá a pé para um lugar alto ou para longe da costa, mesmo que tenha sido fraco.',
      ],
      source: nwsTsunami,
    },
    {
      id: 'coast-strong',
      text: [
        'En el resto de la costa, hazlo si fue fuerte o largo. No esperes una alerta.',
        'Elsewhere on the coast, do so if it was strong or long. Do not wait for an alert.',
        'No resto da costa, faça isso se foi forte ou longo. Não espere um alerta.',
      ],
      source: nwsTsunami,
    },
    {
      id: 'coast-cannot',
      text: [
        'Si no puedes llegar, sube lo más alto posible o aléjate del mar todo lo que puedas.',
        'If you cannot get there, go as high as possible or as far from the sea as you can.',
        'Se não conseguir chegar, suba o mais alto possível ou afaste‑se do mar o máximo que puder.',
      ],
      source: nwsTsunami,
    },
    {
      id: 'coast-wait',
      text: [
        'Puede haber olas durante horas o días: no vuelvas hasta que la autoridad diga que es seguro.',
        'Waves can continue for hours or days: do not return until officials say it is safe.',
        'Pode haver ondas durante horas ou dias: não volte até que as autoridades digam que é seguro.',
      ],
      action: 'tsunami',
      source: nwsTsunami,
    },
    {
      id: 'gas',
      text: [
        'Si hueles gas o ves una tubería rota, sal del lugar sin usar fósforos, encendedores, aparatos ni interruptores: una chispa puede causar una explosión.',
        'If you smell gas or see a broken line, get out without using matches, lighters, appliances or light switches: a spark can cause an explosion.',
        'Se sentir cheiro de gás ou vir um cano rompido, saia do local sem usar fósforos, isqueiros, aparelhos nem interruptores: uma faísca pode causar uma explosão.',
      ],
      source: cdcAfter,
    },
    {
      id: 'trapped',
      text: [
        'Si quedas atrapado: envía un mensaje, golpea una tubería o pared, o usa un silbato.',
        'If you are trapped: send a text, bang on a pipe or wall, or use a whistle.',
        'Se ficar preso: envie uma mensagem, bata em um cano ou parede, ou use um apito.',
      ],
      source: ready,
    },
    {
      id: 'aftershocks',
      text: [
        'Puede volver a temblar. Si pasa, agáchate, cúbrete y sujétate otra vez.',
        'More shaking is possible. If it happens, drop, cover and hold on again.',
        'Pode voltar a tremer. Se acontecer, abaixe‑se, proteja‑se e segure‑se de novo.',
      ],
      source: cdcAfter,
    },
  ],
  hurricane: [
    {
      id: 'evacuate',
      text: [
        'Si las autoridades ordenan evacuar, hazlo de inmediato.',
        'If officials tell you to evacuate, do so immediately.',
        'Se as autoridades mandarem evacuar, faça isso imediatamente.',
      ],
      source: readyHurricanes,
    },
    {
      id: 'no-car',
      text: [
        'Si no tienes auto, pregunta en recepción o a la autoridad local cómo evacuar y sal con anticipación.',
        'If you have no car, ask reception or local officials how to evacuate, and leave early.',
        'Se você não tiver carro, pergunte na recepção ou às autoridades locais como evacuar e saia com antecedência.',
      ],
      source: readyEvacuation,
    },
    {
      id: 'essentials',
      text: [
        'Al evacuar, lleva solo lo esencial: teléfono, cargador, medicamentos, pasaporte y efectivo.',
        'When evacuating, take only essentials: phone, charger, medication, passport and cash.',
        'Ao evacuar, leve só o essencial: celular, carregador, remédios, passaporte e dinheiro em espécie.',
      ],
      source: cdcHurricane,
    },
    {
      id: 'interior',
      text: [
        'Si te quedas, refúgiate en una habitación interior, lejos de ventanas y puertas de vidrio.',
        'If you stay, shelter in an interior room away from windows and glass doors.',
        'Se ficar, abrigue‑se em um cômodo interno, longe de janelas e portas de vidro.',
      ],
      source: nwsHurricane,
    },
    {
      id: 'eye',
      text: [
        'Si el viento se calma de golpe, no salgas: puede ser el ojo y el viento volverá.',
        'If the wind suddenly calms, stay inside: it may be the eye, and the wind will return.',
        'Se o vento acalmar de repente, não saia: pode ser o olho do furacão, e o vento vai voltar.',
      ],
      source: nwsHurricane,
    },
    {
      id: 'rising-water',
      text: [
        'Si entra agua al edificio, sube a un piso más alto; no te encierres en un ático.',
        'If water enters the building, go to a higher floor; do not climb into a closed attic.',
        'Se entrar água no prédio, suba para um andar mais alto; não se feche em um sótão.',
      ],
      source: readyHurricanes,
    },
  ],
  flood: [
    {
      id: 'higher',
      text: [
        'Ve a terreno más alto o a un piso más alto; si te ordenan evacuar, hazlo de inmediato.',
        'Move to higher ground or a higher floor; if told to evacuate, do so immediately.',
        'Vá para um terreno mais alto ou um andar mais alto; se mandarem evacuar, faça isso imediatamente.',
      ],
      source: readyFloods,
    },
    {
      id: 'no-crossing',
      text: [
        'No camines, nades ni manejes por agua de inundación, aunque parezca quieta. 15 cm de agua en movimiento pueden derribarte y 30 cm arrastrar un vehículo. Da la vuelta.',
        "Do not walk, swim or drive through floodwater, even if it looks still. 6 inches of moving water can knock you down and 1 foot can sweep a vehicle away. Turn around, don't drown.",
        'Não ande, nade nem dirija pela água da inundação, mesmo que pareça parada. 15 cm de água em movimento podem derrubar você e 30 cm podem arrastar um veículo. Dê meia-volta.',
      ],
      source: readyFloods,
    },
    {
      id: 'bridges',
      text: [
        'No cruces puentes sobre agua que corre rápido.',
        'Stay off bridges over fast-moving water.',
        'Não atravesse pontes sobre água que corre rápido.',
      ],
      source: readyFloods,
    },
    {
      id: 'landslide',
      text: [
        'Con lluvias fuertes en zonas de cerros, aléjate de laderas y cauces. Si un río cambia de golpe o se pone turbio, o escuchas ruidos de tierra, sube a un lugar alto y seguro.',
        'In heavy rain near hills, stay away from slopes and stream beds. If a stream suddenly changes flow or turns muddy, or you hear rumbling ground, move to high, safe ground.',
        'Com chuva forte em áreas de morros, afaste‑se de encostas e leitos de rios. Se um rio mudar de repente ou ficar turvo, ou se você ouvir barulho de terra se movendo, suba para um lugar alto e seguro.',
      ],
      source: readyLandslides,
    },
    {
      id: 'electric',
      text: [
        'Si el agua cubre enchufes o cables, o ves chispas u oyes zumbidos, sal de esa habitación.',
        'If water covers outlets or cords, or you see sparks or hear buzzing, get out of that room.',
        'Se a água cobrir tomadas ou fios, ou se você vir faíscas ou ouvir zumbidos, saia desse cômodo.',
      ],
      source: nwsFlood,
    },
    {
      id: 'flood-trapped',
      text: [
        'Si quedas atrapado, sube al punto más alto y llama al número de emergencias si puedes.',
        'If you are trapped, move to the highest point and call the emergency number if you can.',
        'Se ficar preso, suba ao ponto mais alto e ligue para o número de emergência, se puder.',
      ],
      action: 'call',
      source: nwsFlood,
    },
  ],
};

// Valid in any emergency; shown under the hazard-specific steps.
export const generalSteps: readonly FirstMinutesStep[] = [
  {
    id: 'call',
    text: [
      'Si hay peligro para la vida, llama al número local de emergencias y no cuelgues hasta que contesten.',
      'If a life is in danger, call the local emergency number and stay on the line until someone answers.',
      'Se houver risco de vida, ligue para o número local de emergência e não desligue até alguém atender.',
    ],
    action: 'call',
    source: cdcHurricane,
  },
  {
    id: 'authorities',
    text: [
      'Sigue siempre las instrucciones de las autoridades locales.',
      'Always follow the instructions of local officials.',
      'Siga sempre as instruções das autoridades locais.',
    ],
    source: readyEvacuation,
  },
  {
    id: 'message',
    text: [
      'Usa mensajes de texto y llamadas breves: los mensajes suelen pasar cuando las llamadas no, y ahorras batería.',
      'Use texts and keep calls brief: texts often get through when calls do not, and you save battery.',
      'Use mensagens de texto e ligações curtas: as mensagens costumam chegar quando as ligações não completam, e você economiza bateria.',
    ],
    action: 'status',
    source: fcc,
  },
];
