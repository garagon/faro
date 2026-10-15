import { downloadText } from '../lib/download.ts';
import SafetyIllustration, { type SafetyScene } from './SafetyIllustration.tsx';
import EvacuationPlan from './EvacuationPlan.tsx';
import { kitText } from '../data/emergencyKit.ts';
import { destinationFor } from '../data/destinations/index.ts';
import { useState } from 'react';
import { ArrowUpRightIcon, DownloadSimpleIcon, ArrowRightIcon } from '@phosphor-icons/react';
import type { Lang } from '../lib/resources.ts';
import '../styles/guide.css';
import { langIndex, langTag, pick, type Localized } from '../lib/i18n.ts';

type Copy = Localized;
// "During" uses the attributed ShakeOut graphic and "kit" its own checklist drawing.
const scenes: Partial<Record<string, SafetyScene>> = {
  after: 'exit',
  coast: 'coast',
  driving: 'street',
  'hurricane-before': 'timeline',
  'hurricane-during': 'storm',
  'hurricane-after': 'aftermath',
  'flood-during': 'flood',
  'flood-after': 'aftermath',
  volcano: 'ash',
  contacts: 'message',
  hotel: 'hotel',
};
const sourceUrl = (section: Section, lang: Lang) =>
  lang === 'es' && section.urlEs ? section.urlEs : section.url;
/** The language of the page the source link opens, so readers know before tapping. */
const sourceLang = (section: Section, lang: Lang): Lang =>
  (lang === 'es' && section.urlEs) || section.spanishSource ? 'es' : 'en';
type Group = 'earthquake' | 'weather' | 'volcano' | 'prepare';
const groups: { id: Group; label: Copy }[] = [
  { id: 'earthquake', label: ['Sismo y tsunami', 'Earthquake and tsunami', 'Terremoto e tsunami'] },
  { id: 'weather', label: ['Huracán e inundación', 'Hurricane and flood', 'Furacão e inundação'] },
  { id: 'volcano', label: ['Volcán', 'Volcano', 'Vulcão'] },
  { id: 'prepare', label: ['Preparación', 'Preparation', 'Preparação'] },
];
type Section = {
  id: string;
  group: Group;
  label: Copy;
  title: Copy;
  intro: Copy;
  steps: { title: Copy; body: Copy }[];
  note?: Copy;
  /** Official watch/warning terms, shown as a short glossary under the steps. */
  terms?: { term: Copy; meaning: Copy }[];
  source: string;
  url: string;
  /** Official Spanish version of the same guidance, when one exists. */
  urlEs?: string;
  /** The source itself is in Spanish; otherwise it is in English. */
  spanishSource?: true;
};
const sections: Section[] = [
  {
    id: 'during',
    group: 'earthquake',
    label: ['Durante el sismo', 'During an earthquake', 'Durante o terremoto'],
    title: [
      'Agáchate. Cúbrete. Sujétate.',
      'Drop. Cover. Hold on.',
      'Abaixe-se. Proteja-se. Segure-se.',
    ],
    intro: [
      'Si estás dentro de un edificio, permanece dentro mientras tiembla.',
      'If you are indoors, stay inside while the ground is shaking.',
      'Se você estiver dentro de um prédio, fique lá dentro enquanto o chão tremer.',
    ],
    steps: [
      {
        title: ['Agáchate', 'Drop', 'Abaixe-se'],
        body: [
          'Apóyate sobre manos y rodillas para evitar caídas.',
          'Get on your hands and knees to avoid being knocked over.',
          'Apoie-se nas mãos e nos joelhos para evitar quedas.',
        ],
      },
      {
        title: [
          'Protege cabeza y cuello',
          'Cover your head and neck',
          'Proteja a cabeça e o pescoço',
        ],
        body: [
          'Refúgiate bajo una mesa resistente cercana. Si no hay una, cúbrete con los brazos.',
          'Get under a nearby sturdy table. If none is available, shield yourself with your arms.',
          'Abrigue-se debaixo de uma mesa resistente próxima. Se não houver uma, proteja-se com os braços.',
        ],
      },
      {
        title: [
          'Sujétate hasta que termine',
          'Hold on until shaking stops',
          'Segure-se até o tremor parar',
        ],
        body: [
          'Sujeta la mesa y acompaña su movimiento. No uses ascensores.',
          'Grip the table and move with it. Avoid elevators.',
          'Segure a mesa e acompanhe o movimento dela. Não use elevadores.',
        ],
      },
    ],
    note: [
      'Si no puedes agacharte, permanece sentado y protege cabeza y cuello. Bloquea las ruedas si usas silla de ruedas.',
      'If you cannot get down, stay seated and protect your head and neck. Lock wheelchair wheels.',
      'Se você não conseguir se abaixar, fique sentado e proteja a cabeça e o pescoço. Trave as rodas se usar cadeira de rodas.',
    ],
    source: 'CDC',
    url: 'https://www.cdc.gov/earthquakes/safety/stay-safe-during-an-earthquake.html',
  },
  {
    id: 'after',
    group: 'earthquake',
    label: ['Después y réplicas', 'Afterwards & aftershocks', 'Depois e réplicas'],
    title: [
      'Revisa tu entorno antes de moverte',
      'Check your surroundings before moving',
      'Verifique o entorno antes de se mover',
    ],
    intro: [
      'Puede volver a temblar. Mantén cerca lo necesario para protegerte.',
      'Further shaking is possible. Be ready to protect yourself again.',
      'Pode voltar a tremer. Esteja pronto para se proteger de novo.',
    ],
    steps: [
      {
        title: ['Si vuelve a temblar', 'If shaking resumes', 'Se voltar a tremer'],
        body: [
          'Agáchate, cúbrete y sujétate de nuevo.',
          'Drop, cover and hold on again.',
          'Abaixe-se, proteja-se e segure-se de novo.',
        ],
      },
      {
        title: [
          'Evita estructuras dañadas',
          'Avoid damaged structures',
          'Evite estruturas danificadas',
        ],
        body: [
          'No entres en edificios dañados hasta que lo autorice la autoridad local. Aléjate de cables caídos.',
          'Stay out of damaged buildings until local officials permit entry. Keep clear of fallen power lines.',
          'Não entre em prédios danificados até que a autoridade local autorize. Afaste-se de fios elétricos caídos.',
        ],
      },
      {
        title: ['Comprueba si hay lesiones', 'Check for injuries', 'Verifique se há feridos'],
        body: [
          'Busca primeros auxilios si los necesitas. Ayuda a otras personas solo si puedes hacerlo sin exponerte.',
          'Seek first aid if needed. Help others only if you can do so without putting yourself at risk.',
          'Procure primeiros socorros se precisar. Ajude outras pessoas só se puder fazer isso sem se expor ao risco.',
        ],
      },
    ],
    note: [
      'Usa mensajes de texto para avisar a tus contactos. Reserva las llamadas para emergencias.',
      'Use text messages to contact others. Keep calls for emergencies.',
      'Use mensagens de texto para avisar seus contatos. Deixe as ligações para emergências.',
    ],
    source: 'CDC',
    url: 'https://www.cdc.gov/earthquakes/safety/stay-safe-after-an-earthquake.html',
  },
  {
    id: 'coast',
    group: 'earthquake',
    label: ['Costa y tsunami', 'Coast & tsunami', 'Costa e tsunami'],
    title: [
      'Reconoce las señales de tsunami',
      'Recognize tsunami warning signs',
      'Reconheça os sinais de tsunami',
    ],
    intro: [
      'En una zona costera baja: sismo fuerte o prolongado, cambio inusual del nivel del mar o rugido del océano.',
      'In a low-lying coastal area: strong or prolonged shaking, unusual sea-level changes or a roar from the ocean.',
      'Em uma área costeira baixa: terremoto forte ou prolongado, mudança incomum do nível do mar ou um rugido vindo do oceano.',
    ],
    steps: [
      {
        title: [
          'Protégete durante el movimiento',
          'Protect yourself during shaking',
          'Proteja-se durante o tremor',
        ],
        body: [
          'Agáchate, cúbrete y sujétate.',
          'Drop, cover and hold on.',
          'Abaixe-se, proteja-se e segure-se.',
        ],
      },
      {
        title: [
          'Evacúa cuando puedas moverte con seguridad',
          'Evacuate as soon as you can move safely',
          'Evacue assim que puder se mover com segurança',
        ],
        body: [
          'En la playa o junto al mar, sal después de cualquier sismo, aunque sea leve. Ante señales naturales, ve a terreno alto o tierra adentro sin esperar una alerta; si no puedes llegar, sube lo más alto posible. Si hay una orden oficial, sigue la evacuación indicada.',
          'On the beach or by the water, leave after any earthquake, even a weak one. With natural warning signs, go to higher ground or inland without waiting for an alert; if you cannot get there, go as high as possible. Follow any official evacuation order.',
          'Na praia ou junto ao mar, saia depois de qualquer terremoto, mesmo fraco. Diante de sinais naturais, vá para um terreno alto ou para o interior sem esperar um alerta; se não conseguir chegar, suba o mais alto possível. Se houver uma ordem oficial, siga a evacuação indicada.',
        ],
      },
      {
        title: [
          'Espera la autorización para regresar',
          'Wait for permission to return',
          'Espere a autorização para voltar',
        ],
        body: [
          'No regreses hasta que lo autorice la autoridad local. La primera ola puede no ser la mayor y el peligro puede durar horas o días.',
          'Do not return until local officials allow it. The first wave may not be the largest, and the danger can last hours or days.',
          'Não volte até que a autoridade local autorize. A primeira onda pode não ser a maior, e o perigo pode durar horas ou dias.',
        ],
      },
    ],
    note: [
      'Consulta con el municipio las vías de evacuación y puntos de encuentro. No regreses por tu equipaje.',
      'Ask the municipality about evacuation routes and assembly points. Do not go back for luggage.',
      'Consulte a prefeitura sobre as rotas de evacuação e os pontos de encontro. Não volte para buscar a bagagem.',
    ],
    source: 'NOAA / National Weather Service',
    url: 'https://www.weather.gov/safety/tsunami-during',
  },
  {
    id: 'driving',
    group: 'earthquake',
    label: ['En la calle o en vehículo', 'Outside or driving', 'Na rua ou em um veículo'],
    title: [
      'Aléjate de lo que pueda caer',
      'Keep clear of falling hazards',
      'Afaste-se do que possa cair',
    ],
    intro: [
      'La acción depende del lugar donde te encuentre el sismo.',
      'What to do depends on where you are when shaking starts.',
      'O que fazer depende de onde você está quando o terremoto começa.',
    ],
    steps: [
      {
        title: ['En la calle', 'In the street', 'Na rua'],
        body: [
          'Mantén distancia de edificios, postes y cables eléctricos.',
          'Keep away from buildings, poles and power lines.',
          'Mantenha distância de prédios, postes e fios elétricos.',
        ],
      },
      {
        title: [
          'En un túnel, puente o autopista urbana',
          'In a tunnel, on a bridge or urban highway',
          'Em túnel, ponte ou via expressa urbana',
        ],
        body: [
          'Reduce la velocidad. Detente en un lugar seguro después de salir de esa infraestructura.',
          'Slow down. Stop in a safe place after leaving that structure.',
          'Reduza a velocidade. Pare em um lugar seguro depois de sair dessa estrutura.',
        ],
      },
      {
        title: [
          'En una concentración de personas',
          'In a crowded venue',
          'Em um local com muita gente',
        ],
        body: [
          'Protege cabeza y cuello y sigue las instrucciones del personal de seguridad.',
          'Protect your head and neck and follow security staff instructions.',
          'Proteja a cabeça e o pescoço e siga as instruções da equipe de segurança.',
        ],
      },
    ],
    source: 'SENAPRED · Sismos',
    url: 'https://www.senapred.gov.cl/sismos/',
    spanishSource: true,
  },
  {
    id: 'hurricane-before',
    group: 'weather',
    label: ['Huracán: antes', 'Hurricane: before', 'Furacão: antes'],
    title: [
      'Prepárate con la vigilancia o el aviso',
      'Prepare when a watch or warning is issued',
      'Prepare-se quando houver vigilância ou aviso',
    ],
    intro: [
      'Los huracanes no son solo un problema de la costa: la lluvia y el viento llegan tierra adentro.',
      'Hurricanes are not just a coastal problem: rain and wind can reach far inland.',
      'Os furacões não são um problema só do litoral: a chuva e o vento podem chegar longe, terra adentro.',
    ],
    steps: [
      {
        title: [
          'Pregunta por la zona de evacuación',
          'Ask about the evacuation zone',
          'Pergunte pela zona de evacuação',
        ],
        body: [
          'Pregunta en recepción o a la autoridad local si estás en una zona de evacuación y cuál es la ruta. Sigue sus instrucciones.',
          'Ask reception or local officials whether you are in an evacuation zone and which route to use. Follow their instructions.',
          'Pergunte na recepção ou à autoridade local se você está em uma zona de evacuação e qual é a rota. Siga as instruções.',
        ],
      },
      {
        title: ['Alertas y batería', 'Alerts and battery', 'Alertas e bateria'],
        body: [
          'Ten más de una forma de recibir alertas. Mantén el teléfono cargado y una batería externa.',
          'Have more than one way to receive alerts. Keep your phone charged and carry a backup battery.',
          'Tenha mais de uma forma de receber alertas. Mantenha o celular carregado e tenha uma bateria externa.',
        ],
      },
      {
        title: [
          'Medicamentos y suministros',
          'Medication and supplies',
          'Medicamentos e suprimentos',
        ],
        body: [
          'Ten a mano medicamentos y suministros: después de un huracán podrías no conseguirlos durante días o semanas.',
          'Keep medication and supplies at hand: you may not be able to get them for days or even weeks after a hurricane.',
          'Tenha medicamentos e suprimentos à mão: depois de um furacão, talvez você não consiga obtê-los por dias ou semanas.',
        ],
      },
    ],
    note: [
      'Guarda copias de tus documentos en un espacio digital protegido con contraseña.',
      'Keep copies of your documents in a password-protected digital space.',
      'Guarde cópias dos seus documentos em um espaço digital protegido por senha.',
    ],
    terms: [
      {
        term: ['Vigilancia de huracán', 'Hurricane watch', 'Vigilância de furacão'],
        meaning: [
          'Condiciones de huracán (vientos de 119 km/h o más) posibles en la zona; se emite unas 48 h antes de los vientos de tormenta tropical.',
          'Hurricane conditions (winds of 119 km/h or more) are possible in the area; issued about 48 h before tropical-storm-force winds.',
          'Condições de furacão (ventos de 119 km/h ou mais) são possíveis na área; é emitida cerca de 48 h antes dos ventos de tempestade tropical.',
        ],
      },
      {
        term: ['Aviso de huracán', 'Hurricane warning', 'Aviso de furacão'],
        meaning: [
          'Se esperan condiciones de huracán en la zona, unas 36 h antes. Termina los preparativos y evacúa si lo ordenan.',
          'Hurricane conditions are expected in the area, about 36 h ahead. Finish preparing and evacuate if ordered.',
          'Condições de furacão são esperadas na área, cerca de 36 h antes. Termine os preparativos e evacue se houver ordem.',
        ],
      },
      {
        term: ['Tormenta tropical', 'Tropical storm', 'Tempestade tropical'],
        meaning: [
          'Vientos de 63 a 118 km/h: posibles en 48 h (vigilancia) o esperados en 36 h (aviso).',
          'Winds of 63–118 km/h: possible within 48 h (watch) or expected within 36 h (warning).',
          'Ventos de 63 a 118 km/h: possíveis em 48 h (vigilância) ou esperados em 36 h (aviso).',
        ],
      },
      {
        term: ['Marejada ciclónica', 'Storm surge', 'Maré de tempestade'],
        meaning: [
          'Inundación potencialmente mortal por agua que avanza desde la costa: posible (vigilancia) o esperada (aviso).',
          'Life-threatening flooding from water moving inland from the shoreline: possible (watch) or expected (warning).',
          'Inundação potencialmente fatal pela água que avança a partir do litoral: possível (vigilância) ou esperada (aviso).',
        ],
      },
    ],
    source: 'Ready.gov',
    url: 'https://www.ready.gov/hurricanes',
    urlEs: 'https://www.ready.gov/es/huracanes',
  },
  {
    id: 'hurricane-during',
    group: 'weather',
    label: ['Huracán: durante', 'Hurricane: during', 'Furacão: durante'],
    title: [
      'Evacúa si te lo ordenan. Si no, refúgiate adentro.',
      'Evacuate if ordered. Otherwise, shelter inside.',
      'Evacue se houver ordem. Se não, abrigue-se em local fechado.',
    ],
    intro: [
      'Sigue las instrucciones de las autoridades locales por radio, TV o teléfono.',
      'Follow local officials’ instructions on radio, TV or your phone.',
      'Siga as instruções das autoridades locais pelo rádio, pela TV ou pelo celular.',
    ],
    steps: [
      {
        title: ['Si ordenan evacuar', 'If ordered to leave', 'Se mandarem evacuar'],
        body: [
          'Sal de inmediato y sigue las instrucciones de los funcionarios locales.',
          'Leave immediately and follow local officials’ instructions.',
          'Saia imediatamente e siga as instruções das autoridades locais.',
        ],
      },
      {
        title: ['Habitación interior', 'Interior room', 'Cômodo interno'],
        body: [
          'Refúgiate en una habitación interior pequeña, armario o pasillo, lejos de ventanas, tragaluces y puertas de vidrio.',
          'Shelter in a small interior room, closet or hallway, away from windows, skylights and glass doors.',
          'Abrigue-se em um cômodo interno pequeno, closet ou corredor, longe de janelas, claraboias e portas de vidro.',
        ],
      },
      {
        title: ['La calma no es el final', 'The calm is not the end', 'A calmaria não é o fim'],
        body: [
          'Si pasa el ojo, habrá una calma breve. Después, el viento vuelve con fuerza desde la dirección opuesta.',
          'If the eye passes over, there will be a short calm. Then hurricane-force winds return from the opposite direction.',
          'Se o olho passar, haverá uma calmaria breve. Depois, o vento volta com força da direção oposta.',
        ],
      },
    ],
    note: [
      'Si el agua entra al edificio, sube a un piso más alto. No te encierres en un ático.',
      'If water enters the building, go to a higher floor. Do not climb into a closed attic.',
      'Se a água entrar no prédio, suba para um andar mais alto. Não se feche em um sótão.',
    ],
    source: 'NOAA / National Weather Service',
    url: 'https://www.weather.gov/safety/hurricane-action',
  },
  {
    id: 'hurricane-after',
    group: 'weather',
    label: ['Huracán: después', 'Hurricane: after', 'Furacão: depois'],
    title: ['Sal solo si es necesario', 'Go out only if necessary', 'Saia só se for necessário'],
    intro: [
      'Las inundaciones pueden durar varios días después de la tormenta.',
      'Flooding can persist for several days after the storm.',
      'As inundações podem durar vários dias depois da tempestade.',
    ],
    steps: [
      {
        title: [
          'Vuelve solo con autorización',
          'Return only when it is safe',
          'Volte só com autorização',
        ],
        body: [
          'Si evacuaste, regresa solo cuando las autoridades indiquen que es seguro.',
          'If you evacuated, return only when officials say it is safe.',
          'Se você evacuou, volte só quando as autoridades disserem que é seguro.',
        ],
      },
      {
        title: [
          'Calles inundadas y cables caídos',
          'Flooded roads and downed lines',
          'Ruas inundadas e fios caídos',
        ],
        body: [
          'Evita calles inundadas y puentes dañados. Atento a cables eléctricos caídos y a muros o aceras debilitados.',
          'Avoid flooded roads and washed-out bridges. Watch for downed power lines and weakened walls or sidewalks.',
          'Evite ruas inundadas e pontes danificadas. Fique atento a fios elétricos caídos e a muros ou calçadas enfraquecidos.',
        ],
      },
      {
        title: ['Monóxido de carbono', 'Carbon monoxide', 'Monóxido de carbono'],
        body: [
          'Nunca uses un generador portátil dentro de un edificio o garaje. Usa linternas, no velas.',
          'Never use a portable generator inside a building or garage. Use flashlights, not candles.',
          'Nunca use um gerador portátil dentro de um prédio ou garagem. Use lanternas, não velas.',
        ],
      },
    ],
    note: [
      'No entres en un edificio si huele a gas, si lo rodea agua de inundación o si las autoridades no lo declararon seguro.',
      'Stay out of any building if you smell gas, if floodwater surrounds it or if authorities have not declared it safe.',
      'Não entre em um prédio se sentir cheiro de gás, se a água da inundação estiver ao redor dele ou se as autoridades não o tiverem declarado seguro.',
    ],
    source: 'NOAA / National Weather Service',
    url: 'https://www.weather.gov/safety/hurricane-after',
  },
  {
    id: 'flood-during',
    group: 'weather',
    label: ['Inundación: durante', 'Flood: during', 'Inundação: durante'],
    title: ['No entres al agua', 'Stay out of the water', 'Não entre na água'],
    intro: [
      'El nivel y la velocidad del agua pueden cambiar rápido. Las inundaciones repentinas pueden llegar sin aviso.',
      'Water levels and flow can change quickly. Flash floods can come without warning.',
      'O nível e a velocidade da água podem mudar rápido. As inundações repentinas podem chegar sem aviso.',
    ],
    steps: [
      {
        title: ['Sube', 'Get higher', 'Suba'],
        body: [
          'Ve a terreno más alto o a un piso más alto. Si te ordenan evacuar, hazlo de inmediato.',
          'Move to higher ground or a higher floor. If told to evacuate, do so immediately.',
          'Vá para um terreno mais alto ou um andar mais alto. Se mandarem evacuar, faça isso imediatamente.',
        ],
      },
      {
        title: ['No cruces el agua', 'Do not cross the water', 'Não atravesse a água'],
        body: [
          'No camines, nades ni manejes por agua de inundación, aunque parezca quieta. 15 cm de agua en movimiento pueden derribarte y 30 cm arrastrar un vehículo.',
          'Do not walk, swim or drive through floodwater, even if it looks still. Six inches (15 cm) of moving water can knock you down; one foot (30 cm) can sweep a vehicle away.',
          'Não caminhe, nade nem dirija pela água da inundação, mesmo que pareça parada. 15 cm de água em movimento podem derrubar você e 30 cm podem arrastar um veículo.',
        ],
      },
      {
        title: ['Si quedas atrapado', 'If you are trapped', 'Se você ficar preso'],
        body: [
          'Sube al nivel más alto del edificio y pide ayuda. No te encierres en un ático; sube al techo solo si es necesario.',
          'Go to the highest level of the building and signal for help. Do not climb into a closed attic; go onto the roof only if necessary.',
          'Suba ao nível mais alto do prédio e peça ajuda. Não se feche em um sótão; suba ao telhado só se for necessário.',
        ],
      },
    ],
    note: [
      'No cruces puentes sobre agua que corre rápido: pueden caer sin aviso.',
      'Stay off bridges over fast-moving water: they can be washed away without warning.',
      'Não atravesse pontes sobre água que corre rápido: elas podem cair sem aviso.',
    ],
    source: 'Ready.gov',
    url: 'https://www.ready.gov/floods',
    urlEs: 'https://www.ready.gov/es/inundaciones',
  },
  {
    id: 'flood-after',
    group: 'weather',
    label: ['Inundación: después', 'Flood: after', 'Inundação: depois'],
    title: ['Espera antes de volver', 'Wait before going back', 'Espere antes de voltar'],
    intro: [
      'Sigue las instrucciones de las autoridades. Evita conducir salvo en emergencias.',
      'Follow authorities’ instructions. Avoid driving except in emergencies.',
      'Siga as instruções das autoridades. Evite dirigir, exceto em emergências.',
    ],
    steps: [
      {
        title: [
          'Vuelve solo con autorización',
          'Return only when it is safe',
          'Volte só com autorização',
        ],
        body: [
          'Regresa solo cuando las autoridades digan que es seguro.',
          'Return only when authorities say it is safe.',
          'Volte só quando as autoridades disserem que é seguro.',
        ],
      },
      {
        title: ['Evita el agua de inundación', 'Avoid floodwater', 'Evite a água da inundação'],
        body: [
          'Puede estar contaminada, ocultar escombros y tener corriente por cables caídos.',
          'It can be contaminated, hide debris and be electrically charged by downed power lines.',
          'Ela pode estar contaminada, esconder entulho e estar eletrificada por fios elétricos caídos.',
        ],
      },
      {
        title: ['Cuidado con la electricidad', 'Electrical safety', 'Cuidado com a eletricidade'],
        body: [
          'No toques equipos eléctricos si están mojados o si estás de pie en el agua.',
          'Do not touch electrical equipment if it is wet or if you are standing in water.',
          'Não toque em equipamentos elétricos se estiverem molhados ou se você estiver de pé na água.',
        ],
      },
    ],
    note: [
      'Sigue las indicaciones locales sobre el agua del grifo. Usa agua embotellada, hervida o tratada para beber y cocinar.',
      'Follow local advice on tap water. Use bottled, boiled or treated water for drinking and cooking.',
      'Siga as orientações locais sobre a água da torneira. Use água engarrafada, fervida ou tratada para beber e cozinhar.',
    ],
    source: 'Ready.gov',
    url: 'https://www.ready.gov/floods',
    urlEs: 'https://www.ready.gov/es/inundaciones',
  },
  {
    id: 'flood-health',
    group: 'weather',
    label: ['Inundación: salud', 'Flood: health', 'Inundação: saúde'],
    title: [
      'Cuida tu salud después del agua',
      'Protect your health after the water',
      'Cuide da sua saúde depois da água',
    ],
    intro: [
      'El agua de inundación puede tener orina de animales y los charcos atraen mosquitos. Algunas enfermedades aparecen días o semanas después.',
      'Floodwater can carry animal urine, and standing water breeds mosquitoes. Some illnesses appear days or weeks later.',
      'A água da inundação pode ter urina de animais, e a água parada atrai mosquitos. Algumas doenças aparecem dias ou semanas depois.',
    ],
    steps: [
      {
        title: [
          'Evita el contacto con el agua',
          'Avoid contact with the water',
          'Evite o contato com a água',
        ],
        body: [
          'No camines, nades ni te bañes en agua que pueda estar contaminada. Cubre las heridas con vendas impermeables y usa botas si tienes que estar cerca del agua.',
          'Do not wade, swim or bathe in water that may be contaminated. Cover cuts with waterproof bandages and wear boots if you must be near the water.',
          'Não caminhe, nade nem tome banho em água que possa estar contaminada. Cubra as feridas com curativos impermeáveis e use botas se precisar ficar perto da água.',
        ],
      },
      {
        title: [
          'Fiebre después de una inundación',
          'Fever after a flood',
          'Febre depois de uma inundação',
        ],
        body: [
          'Si tienes fiebre, dolor de cabeza o muscular, u ojos rojos en las semanas siguientes al contacto con el agua, busca atención médica y di que estuviste en una inundación (puede ser leptospirosis o dengue).',
          'If you get a fever, headache, muscle aches or red eyes in the weeks after contact with floodwater, see a doctor and say you were in a flood (it can be leptospirosis or dengue).',
          'Se você tiver febre, dor de cabeça ou dor muscular, ou olhos vermelhos nas semanas seguintes ao contato com a água, procure atendimento médico e diga que esteve em uma inundação (pode ser leptospirose ou dengue).',
        ],
      },
      {
        title: ['Mosquitos', 'Mosquitoes', 'Mosquitos'],
        body: [
          'Usa repelente registrado y ropa de manga larga. Vacía o tapa los recipientes donde se junta agua.',
          'Use a registered insect repellent and long sleeves. Empty or cover containers that hold water.',
          'Use repelente registrado e roupa de manga longa. Esvazie ou tampe os recipientes que acumulam água.',
        ],
      },
    ],
    note: [
      'Para beber y cocinar, usa agua embotellada, hervida o tratada hasta que las autoridades digan otra cosa.',
      'For drinking and cooking, use bottled, boiled or treated water until authorities say otherwise.',
      'Para beber e cozinhar, use água engarrafada, fervida ou tratada até que as autoridades digam o contrário.',
    ],
    source: 'CDC',
    url: 'https://www.cdc.gov/leptospirosis/prevention/index.html',
  },
  {
    id: 'volcano',
    group: 'volcano',
    label: ['Volcán y ceniza', 'Volcano and ashfall', 'Vulcão e cinzas'],
    title: [
      'Aléjate y protégete de la ceniza',
      'Move away and protect yourself from ash',
      'Afaste-se e proteja-se das cinzas',
    ],
    intro: [
      'La ceniza puede viajar cientos de kilómetros e irritar ojos, piel, nariz y garganta.',
      'Ash can travel hundreds of miles and irritate the eyes, skin, nose and throat.',
      'As cinzas podem viajar centenas de quilômetros e irritar os olhos, a pele, o nariz e a garganta.',
    ],
    steps: [
      {
        title: [
          'Evacúa temprano si lo ordenan',
          'Evacuate early if ordered',
          'Evacue cedo se houver ordem',
        ],
        body: [
          'Sigue las órdenes de evacuación. Evita las zonas en la dirección del viento y los valles de ríos que bajan del volcán.',
          'Follow evacuation orders. Avoid areas downwind and river valleys downstream of the volcano.',
          'Siga as ordens de evacuação. Evite as áreas na direção do vento e os vales de rios que descem do vulcão.',
        ],
      },
      {
        title: ['Refúgiate de la ceniza', 'Shelter from ash', 'Abrigue-se das cinzas'],
        body: [
          'Quédate adentro, cierra puertas y ventanas y cubre las entradas de aire hasta que las autoridades digan que puedes salir.',
          'Stay indoors, seal doors and windows and cover ventilation openings until authorities say it is safe to go out.',
          'Fique em local fechado, feche portas e janelas e cubra as entradas de ar até que as autoridades digam que você pode sair.',
        ],
      },
      {
        title: ['Si debes salir', 'If you must go outside', 'Se precisar sair'],
        body: [
          'Usa una mascarilla certificada bien ajustada, como N95. Evita conducir con mucha ceniza.',
          'Wear a well-fitting certified mask such as an N95. Avoid driving in heavy ash.',
          'Use uma máscara certificada bem ajustada, como a N95. Evite dirigir com muita cinza.',
        ],
      },
    ],
    note: [
      'No subas al techo a quitar ceniza.',
      'Do not get on the roof to remove ash.',
      'Não suba no telhado para tirar cinzas.',
    ],
    source: 'Ready.gov',
    url: 'https://www.ready.gov/volcanoes',
    urlEs: 'https://www.ready.gov/es/volcanes',
  },
  {
    id: 'contacts',
    group: 'prepare',
    label: [
      'Contacto con familia o equipo',
      'Contacting family or team',
      'Contato com família ou equipe',
    ],
    title: [
      'Acuerda un plan de contacto',
      'Agree on a contact plan',
      'Combine um plano de contato',
    ],
    intro: [
      'Organiza quién estará pendiente de ti durante el viaje.',
      'Decide who will check on you during your trip.',
      'Defina quem vai ficar atento a você durante a viagem.',
    ],
    steps: [
      {
        title: [
          'Elige un contacto principal',
          'Choose a primary contact',
          'Escolha um contato principal',
        ],
        body: [
          'Comparte con esa persona tu alojamiento y los contactos de tus acompañantes. Acuerden quién avisará al resto.',
          'Share your accommodation and travel companions’ contacts with this person. Agree who will notify everyone else.',
          'Compartilhe com essa pessoa sua hospedagem e os contatos de quem viaja com você. Combinem quem vai avisar os demais.',
        ],
      },
      {
        title: [
          'Acuerda un horario y una alternativa',
          'Agree on a time and a backup',
          'Combine um horário e uma alternativa',
        ],
        body: [
          'Indica cuándo volverás a escribir y qué hacer si no respondes. Lleva los teléfonos de recepción, seguro y asistencia de tu empresa anotados fuera del celular.',
          'Say when you will write again and what to do if you do not respond. Keep hotel, insurance and employer assistance numbers outside your phone.',
          'Diga quando você vai escrever de novo e o que fazer se você não responder. Leve os telefones da recepção, do seguro e da assistência da sua empresa anotados fora do celular.',
        ],
      },
      {
        title: ['Comunica hechos y hora', 'Share facts and the time', 'Comunique fatos e horário'],
        body: [
          'Di cómo estás, dónde estás y si te trasladarás. Actualiza el mensaje cuando cambie tu situación.',
          'Say how you are, where you are and whether you will move. Update the message if your situation changes.',
          'Diga como você está, onde está e se vai se deslocar. Atualize a mensagem quando sua situação mudar.',
        ],
      },
    ],
    note: [
      'Adaptación de Faro para viajeros a partir del plan de contactos de SENAPRED. No implica seguimiento automático.',
      'Faro’s traveler adaptation of SENAPRED’s contact planning guidance. It does not provide automatic tracking.',
      'Adaptação do Faro para viajantes a partir do plano de contatos do SENAPRED. Não faz rastreamento automático.',
    ],
    source: 'SENAPRED · Familia Preparada',
    url: 'https://www.senapred.gob.cl/familia-preparada/',
    spanishSource: true,
  },
  {
    id: 'kit',
    group: 'prepare',
    label: ['Mochila de emergencia', 'Emergency kit', 'Mochila de emergência'],
    title: ['Ten lo esencial a mano', 'Keep essentials within reach', 'Tenha o essencial à mão'],
    intro: [
      'Prepara una bolsa accesible y adáptala a las necesidades de quienes viajan contigo.',
      'Prepare an accessible bag and adapt it to your travel companions’ needs.',
      'Prepare uma bolsa acessível e adapte-a às necessidades de quem viaja com você.',
    ],
    steps: [
      {
        title: ['Agua y alimentos', 'Water and food', 'Água e alimentos'],
        body: [
          'Lleva agua y alimentos que puedas consumir sin cocinar. Planifica las provisiones con tu alojamiento.',
          'Keep water and food that needs no cooking. Plan supplies with your accommodation.',
          'Leve água e alimentos que possam ser consumidos sem cozinhar. Planeje os suprimentos com sua hospedagem.',
        ],
      },
      {
        title: [
          'Medicamentos y documentos',
          'Medication and documents',
          'Medicamentos e documentos',
        ],
        body: [
          'Incluye medicamentos necesarios, recetas, botiquín, efectivo y copias de identidad y pasaporte.',
          'Include essential medication, prescriptions, first-aid supplies, cash and copies of ID and passport.',
          'Inclua medicamentos necessários, receitas, kit de primeiros socorros, dinheiro em espécie e cópias do documento de identidade e do passaporte.',
        ],
      },
      {
        title: [
          'Luz, información y plan',
          'Light, information and your plan',
          'Luz, informação e plano',
        ],
        body: [
          'Prepara linterna, baterías y radio portátil. Lleva una copia de tu plan y de los teléfonos de contacto.',
          'Pack a flashlight, batteries and portable radio. Carry a copy of your plan and contact numbers.',
          'Prepare lanterna, pilhas e rádio portátil. Leve uma cópia do seu plano e dos telefones de contato.',
        ],
      },
    ],
    note: [
      'Guarda copias de documentos de forma privada. Faro no necesita que subas tu pasaporte.',
      'Keep document copies private. Faro does not need you to upload your passport.',
      'Guarde cópias dos documentos de forma privada. O Faro não precisa que você envie seu passaporte.',
    ],
    source: 'SENAPRED · Kit de emergencia',
    url: 'https://www.senapred.gob.cl/kit-emergencia/',
    spanishSource: true,
  },
  {
    id: 'hotel',
    group: 'prepare',
    label: [
      'Preparación en el alojamiento',
      'Accommodation preparation',
      'Preparação na hospedagem',
    ],
    title: [
      'Confirma el plan con recepción',
      'Confirm the plan with reception',
      'Confirme o plano com a recepção',
    ],
    intro: [
      'Anota estas indicaciones antes de que ocurra una emergencia.',
      'Record these details before an emergency.',
      'Anote estas orientações antes que ocorra uma emergência.',
    ],
    steps: [
      {
        title: [
          'Salida y punto de encuentro',
          'Exit and assembly point',
          'Saída e ponto de encontro',
        ],
        body: [
          'Pide la ruta desde tu habitación y el punto de encuentro del hotel.',
          'Ask for the route from your room and the hotel assembly point.',
          'Peça a rota a partir do seu quarto e o ponto de encontro do hotel.',
        ],
      },
      {
        title: ['Evacuación por tsunami', 'Tsunami evacuation', 'Evacuação por tsunami'],
        body: [
          'Si el hotel está en la costa, pregunta por la ruta específica y las instrucciones de la autoridad local.',
          'If the hotel is near the coast, ask for the specific route and local authority instructions.',
          'Se o hotel estiver no litoral, pergunte pela rota específica e pelas instruções da autoridade local.',
        ],
      },
      {
        title: [
          'Contacto y acceso sin internet',
          'Contact and offline access',
          'Contato e acesso sem internet',
        ],
        body: [
          'Acuerda dónde reunirte con tus acompañantes. Guarda una copia de las instrucciones.',
          'Agree where to meet your companions. Save a copy of the instructions.',
          'Combine onde encontrar quem viaja com você. Guarde uma cópia das instruções.',
        ],
      },
    ],
    source: '',
    url: '',
  },
];
const outdoors: Copy = [
  'En el exterior, permanece fuera y aléjate de edificios y cables.',
  'Outdoors, stay outside and away from buildings and power lines.',
  'Ao ar livre, fique do lado de fora e longe de prédios e fios elétricos.',
];
function guideText(lang: Lang, country: string) {
  const i = langIndex(lang);
  const local = destinationFor(country);
  const title = pick(
    lang,
    'FARO — GUÍA DE ACTUACIÓN\nInformación general. Sigue las instrucciones locales.',
    'FARO — EMERGENCY GUIDE\nGeneral information. Follow local instructions.',
    'FARO — GUIA DE EMERGÊNCIA\nInformação geral. Siga as instruções locais.',
  );
  // A printed or offline copy needs the numbers to call and the day it was saved.
  const saved = `${pick(lang, 'Guardada el', 'Saved on', 'Salva em')} ${new Intl.DateTimeFormat(langTag(lang), { dateStyle: 'long' }).format(Date.now())}.`;
  const numbers = local?.emergency
    ? [
        `${pick(lang, 'Emergencias', 'Emergency numbers', 'Números de emergência')} · ${new Intl.DisplayNames([langTag(lang)], { type: 'region' }).of(country) ?? country}:`,
        ...local.emergency.numbers.map((n) => `${n.number} — ${n.label[i]}`),
        pick(
          lang,
          'Para llamar desde un teléfono en el país.',
          'For calls from a phone in the country.',
          'Para ligar de um telefone no país.',
        ),
      ].join('\n')
    : '';
  const content = sections.map((section) => {
    if (section.id === 'kit') return kitText(lang, []);
    const lines = [
      section.label[i],
      section.intro[i],
      ...section.steps.map((step, n) => `${n + 1}. ${step.title[i]}: ${step.body[i]}`),
      section.note?.[i] || '',
      ...(section.terms ?? []).map((x) => `${x.term[i]}: ${x.meaning[i]}`),
    ];
    if (section.id === 'during') {
      lines.push(outdoors[i]);
      if (country === 'CL')
        lines.push(
          pick(
            lang,
            'Chile: SENAPRED recomienda evacuar inmediatamente construcciones de adobe o autoconstruidas.',
            'Chile: SENAPRED recommends immediately evacuating adobe or self-built structures.',
            'Chile: o SENAPRED recomenda evacuar imediatamente construções de adobe ou autoconstruídas.',
          ),
          'https://www.senapred.gov.cl/sismos/',
        );
    }
    if (section.id === 'coast' && local?.evacuation)
      lines.push(`${local.evacuation.name}: ${local.evacuation.url}`);
    lines.push(
      section.url
        ? `${section.source}: ${sourceUrl(section, lang)}`
        : pick(
            lang,
            'Preparación personal; confirmar con recepción.',
            'Personal preparation; confirm with reception.',
            'Preparação pessoal; confirmar com a recepção.',
          ),
    );
    return lines.filter(Boolean).join('\n');
  });
  if (local?.civilProtection)
    content.push(
      `${pick(lang, 'Indicaciones locales', 'Local guidance', 'Orientações locais')}: ${local.civilProtection.name}\n${local.civilProtection.url}`,
    );
  return [`${title}\n${saved}`, numbers, ...content].filter(Boolean).join('\n\n');
}
export default function SafetyGuide({
  lang,
  country,
  onHotel,
  onStatus,
  onKit,
  topic = 'during',
}: {
  lang: Lang;
  country: string;
  /** The topic to open first, e.g. the hazard chosen on the emergency screen. */
  topic?: string;
  onHotel: () => void;
  onStatus: () => void;
  /** The go bag has its own section; the guide links there. */
  onKit: () => void;
}) {
  const [active, setActive] = useState(sections.some((s) => s.id === topic) ? topic : 'during'),
    [downloaded, setDownloaded] = useState(false);
  const i = langIndex(lang),
    t = (es: string, en: string, pt: string) => pick(lang, es, en, pt);
  const destination = destinationFor(country);
  const current = sections.find((s) => s.id === active)!;
  // ShakeOut publishes these graphics in Spanish and English only; Portuguese uses the Spanish one.
  const shakeOutLang = lang === 'en' ? 'en' : 'es';
  const download = () => {
    downloadText(guideText(lang, country), `faro-guide-${lang}.txt`);
    setDownloaded(true);
  };
  return (
    <div className="fw-safety-layout">
      <aside className="fw-safety-index">
        <span>{t('Temas', 'Topics', 'Temas')}</span>
        <nav aria-label={t('Situaciones de la guía', 'Guide situations', 'Situações do guia')}>
          {groups.map((g) => (
            <div key={g.id} className="fw-safety-group">
              <small>{g.label[i]}</small>
              {sections
                .filter((s) => s.group === g.id)
                .map((s) => (
                  <button
                    key={s.id}
                    aria-current={active === s.id ? 'true' : undefined}
                    onClick={() => (s.id === 'kit' ? onKit() : setActive(s.id))}
                  >
                    {s.label[i]}
                    <ArrowRightIcon size={15} />
                  </button>
                ))}
            </div>
          ))}
        </nav>
        <label htmlFor="guide-situation" className="fw-safety-mobile-label">
          {t('Temas', 'Topics', 'Temas')}
        </label>
        <select
          id="guide-situation"
          value={active}
          onChange={(e) => (e.target.value === 'kit' ? onKit() : setActive(e.target.value))}
        >
          {groups.map((g) => (
            <optgroup key={g.id} label={g.label[i]}>
              {sections
                .filter((s) => s.group === g.id)
                .map((s) => (
                  <option value={s.id} key={s.id}>
                    {s.label[i]}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <div className="fw-safety-download">
          <button onClick={download}>
            <DownloadSimpleIcon size={17} />
            {t('Descargar guía', 'Download guide', 'Baixar guia')}
          </button>
          <small>
            {t(
              'Texto · todas las situaciones · español',
              'Text · all situations · English',
              'Texto · todas as situações · português',
            )}
          </small>
          <span role="status">
            {downloaded ? t('Archivo generado.', 'File generated.', 'Arquivo gerado.') : ''}
          </span>
        </div>
      </aside>
      <article className="fw-safety-document" aria-labelledby="safety-title" key={active}>
        <header>
          <span>{current.label[i]}</span>
          <h2 id="safety-title">{current.title[i]}</h2>
          <p>{current.intro[i]}</p>
        </header>
        {active === 'during' && (
          <figure className="fw-official-instructions">
            <a
              href={`/illustrations/drop-cover-hold-${shakeOutLang}.png`}
              target="_blank"
              rel="noopener"
              aria-label={t(
                'Ampliar las instrucciones ilustradas',
                'Enlarge illustrated instructions',
                'Ampliar as instruções ilustradas (em espanhol)',
              )}
            >
              <img
                src={`/illustrations/drop-cover-hold-${shakeOutLang}.png`}
                width="1920"
                height="631"
                alt={t(
                  'Agáchate sobre manos y rodillas. Cubre cabeza y cuello bajo una mesa resistente. Sujeta la mesa con una mano y sigue protegiéndote con la otra.',
                  'Drop onto your hands and knees. Cover your head and neck under a sturdy table. Hold the table with one hand and keep protecting yourself with the other.',
                  'Imagem em espanhol. Abaixe-se sobre as mãos e os joelhos. Proteja a cabeça e o pescoço debaixo de uma mesa resistente. Segure a mesa com uma mão e continue se protegendo com a outra.',
                )}
              />
            </a>
            <figcaption>
              <a
                href="https://www.earthquakecountry.org/graphics/"
                target="_blank"
                rel="noreferrer"
              >
                {t(
                  'Ilustración: ShakeOut, Earthquake Country Alliance',
                  'Illustration: ShakeOut, Earthquake Country Alliance',
                  'Ilustração: ShakeOut, Earthquake Country Alliance',
                )}
                <ArrowUpRightIcon size={13} aria-hidden="true" />
              </a>
              <span>
                {t(
                  'Toca la imagen para ampliarla.',
                  'Tap the image to enlarge.',
                  'Imagem em espanhol. Toque para ampliar.',
                )}
              </span>
            </figcaption>
            <a
              className="fw-accessible-guide"
              href={`https://www.earthquakecountry.org/library/Accessible_Earthquake_Protective_Actions_Image-${shakeOutLang === 'es' ? 'SP' : 'EN'}.pdf`}
              target="_blank"
              rel="noreferrer"
            >
              {t(
                'Guía ilustrada: bastón, andador y silla de ruedas (PDF)',
                'Illustrated guide: cane, walker and wheelchair (PDF)',
                'Guia ilustrado: bengala, andador e cadeira de rodas (PDF em espanhol)',
              )}
              <ArrowUpRightIcon size={13} aria-hidden="true" />
            </a>
          </figure>
        )}
        {scenes[active] && (
          <figure className="fw-guide-illustration">
            <SafetyIllustration scene={scenes[active]!} lang={lang} />
            <figcaption>
              {t(
                'Esquema de Faro. Las instrucciones son las del texto; sigue a las autoridades locales.',
                'Faro diagram. The written steps are the instructions; follow local authorities.',
                'Esquema do Faro. As instruções são as do texto; siga as autoridades locais.',
              )}
            </figcaption>
          </figure>
        )}
        <ol className="fw-safety-steps" role="list">
          {current.steps.map((step, n) => (
            <li role="listitem" key={n}>
              <span aria-hidden="true">{n + 1}</span>
              <div>
                <h3>{step.title[i]}</h3>
                <p>{step.body[i]}</p>
              </div>
            </li>
          ))}
        </ol>
        {current.note && (
          <div className="fw-safety-note">
            <p>{current.note[i]}</p>
          </div>
        )}
        {current.terms && (
          <section className="fw-safety-terms" aria-labelledby="safety-terms">
            <h3 id="safety-terms">
              {t('Vigilancia y aviso', 'Watch and warning', 'Vigilância e aviso')}
            </h3>
            <dl>
              {current.terms.map((x) => (
                <div key={x.term[1]}>
                  <dt>{x.term[i]}</dt>
                  <dd>{x.meaning[i]}</dd>
                </div>
              ))}
            </dl>
            <p>
              {t(
                'Términos del Centro Nacional de Huracanes (NHC). Cada país puede usar los suyos: sigue los avisos de su servicio meteorológico.',
                'National Hurricane Center (NHC) terms. Each country may use its own: follow its meteorological service.',
                'Termos do Centro Nacional de Furacões (NHC). Cada país pode usar os seus: siga os avisos do serviço meteorológico local.',
              )}{' '}
              <a href="https://www.nhc.noaa.gov/aboutgloss.shtml" target="_blank" rel="noreferrer">
                {t('Glosario del NHC', 'NHC glossary', 'Glossário do NHC')}
                <ArrowUpRightIcon size={13} aria-hidden="true" />
              </a>
            </p>
          </section>
        )}
        {active === 'during' && <p className="fw-safety-outdoors">{outdoors[i]}</p>}
        {active === 'during' && country === 'CL' && (
          <div className="fw-chile-guidance">
            <p>
              {t(
                'En Chile, SENAPRED distingue las construcciones de adobe o autoconstruidas: recomienda evacuarlas inmediatamente. Identifica el tipo de construcción y el plan de tu alojamiento antes de una emergencia.',
                'In Chile, SENAPRED distinguishes adobe and self-built structures: it recommends evacuating them immediately. Identify your accommodation’s construction type and plan before an emergency.',
                'No Chile, o SENAPRED distingue as construções de adobe ou autoconstruídas: recomenda evacuá-las imediatamente. Identifique o tipo de construção e o plano da sua hospedagem antes de uma emergência.',
              )}
            </p>
            <a href="https://www.senapred.gov.cl/sismos/" target="_blank" rel="noreferrer">
              {t('SENAPRED: sismos', 'SENAPRED: earthquakes', 'SENAPRED: terremotos')}
              <ArrowUpRightIcon size={13} aria-hidden="true" />
            </a>
          </div>
        )}
        {active === 'contacts' && (
          <button className="fw-primary" onClick={onStatus}>
            {t('Preparar mi actualización', 'Prepare my update', 'Preparar minha atualização')}
            <ArrowRightIcon size={16} />
          </button>
        )}
        {active === 'coast' && country === 'CL' && (
          <div className="fw-chile-guidance">
            <a href="https://www.senapred.gov.cl/tsunami/" target="_blank" rel="noreferrer">
              {t(
                'Recomendaciones de SENAPRED, Chile',
                'SENAPRED guidance, Chile',
                'Recomendações do SENAPRED, Chile',
              )}
              <ArrowUpRightIcon size={13} aria-hidden="true" />
            </a>
            <p>
              {t(
                'SENAPRED recomienda conocer previamente las rutas y puntos de encuentro de la localidad que visitas. Los planos siguientes corresponden solo a Chile.',
                'SENAPRED recommends knowing the routes and assembly points in the place you visit. The following maps cover Chile only.',
                'O SENAPRED recomenda conhecer antes as rotas e os pontos de encontro do lugar que você visita. Os mapas a seguir são apenas do Chile.',
              )}
            </p>
            <a href="https://senapred.cl/planos-de-evacuacion/" target="_blank" rel="noreferrer">
              {t(
                'Planos de evacuación de Chile',
                'Chile evacuation maps',
                'Mapas de evacuação do Chile',
              )}
              <ArrowUpRightIcon size={13} aria-hidden="true" />
            </a>
          </div>
        )}
        {country !== 'CL' && destination?.civilProtection && (
          <div className="fw-chile-guidance">
            <a href={destination.civilProtection.url} target="_blank" rel="noreferrer">
              {t('Indicaciones locales de', 'Local guidance from', 'Orientações locais:')}{' '}
              {destination.civilProtection.name}
              <ArrowUpRightIcon size={13} aria-hidden="true" />
            </a>
            <p>
              {t(
                'Confirma las instrucciones y las rutas de evacuación del lugar donde estás.',
                'Check the instructions and evacuation routes for your location.',
                'Confirme as instruções e as rotas de evacuação do lugar onde você está.',
              )}
            </p>
          </div>
        )}
        {(active === 'hotel' || active === 'coast') && (
          <EvacuationPlan country={country} lang={lang} />
        )}
        {active === 'hotel' && (
          <button className="fw-primary" onClick={onHotel}>
            {t('Guardar plan del hotel', 'Save hotel plan', 'Salvar plano do hotel')}
            <ArrowRightIcon size={16} />
          </button>
        )}
        <footer>
          <span>
            {current.url
              ? t('Resumen de recomendaciones', 'Guidance summary', 'Resumo de recomendações')
              : t(
                  'Lista de preparación para viajeros',
                  'Travel preparation checklist',
                  'Lista de preparação para viajantes',
                )}
          </span>
          {current.url ? (
            <a href={sourceUrl(current, lang)} target="_blank" rel="noreferrer">
              {current.source}
              {sourceLang(current, lang) !== lang &&
                ` (${
                  sourceLang(current, lang) === 'es'
                    ? t('', 'in Spanish', 'em espanhol')
                    : t('en inglés', '', 'em inglês')
                })`}
              <ArrowUpRightIcon size={14} />
            </a>
          ) : (
            <span>
              {t('Confirmar con recepción', 'Confirm with reception', 'Confirmar com a recepção')}
            </span>
          )}
        </footer>
      </article>
    </div>
  );
}
