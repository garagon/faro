import EmergencyKit from './EmergencyKit.tsx';
import EvacuationPlan from './EvacuationPlan.tsx';
import { kitText } from '../data/emergencyKit.ts';
import { destinationFor } from '../data/destinations/index.ts';
import { useState } from 'react';
import { ArrowUpRightIcon, DownloadSimpleIcon, ArrowRightIcon } from '@phosphor-icons/react';
import type { Lang } from '../lib/resources.ts';

type Copy = [string, string];
type Section = {
  id: string;
  label: Copy;
  title: Copy;
  intro: Copy;
  steps: { title: Copy; body: Copy }[];
  note?: Copy;
  source: string;
  url: string;
};
const sections: Section[] = [
  {
    id: 'during',
    label: ['Durante el sismo', 'During an earthquake'],
    title: ['Agáchate. Cúbrete. Sujétate.', 'Drop. Cover. Hold on.'],
    intro: [
      'Si estás dentro de un edificio, permanece dentro mientras tiembla.',
      'If you are indoors, stay inside while the ground is shaking.',
    ],
    steps: [
      {
        title: ['Agáchate', 'Drop'],
        body: [
          'Apóyate sobre manos y rodillas para evitar caídas.',
          'Get on your hands and knees to avoid being knocked over.',
        ],
      },
      {
        title: ['Protege cabeza y cuello', 'Cover your head and neck'],
        body: [
          'Refúgiate bajo una mesa resistente cercana. Si no hay una, cúbrete con los brazos.',
          'Get under a nearby sturdy table. If none is available, shield yourself with your arms.',
        ],
      },
      {
        title: ['Sujétate hasta que termine', 'Hold on until shaking stops'],
        body: [
          'Sujeta la mesa y acompaña su movimiento. No uses ascensores.',
          'Grip the table and move with it. Avoid elevators.',
        ],
      },
    ],
    note: [
      'Si no puedes agacharte, permanece sentado y protege cabeza y cuello. Bloquea las ruedas si usas silla de ruedas.',
      'If you cannot get down, stay seated and protect your head and neck. Lock wheelchair wheels.',
    ],
    source: 'CDC',
    url: 'https://www.cdc.gov/earthquakes/safety/stay-safe-during-an-earthquake.html',
  },
  {
    id: 'after',
    label: ['Después y réplicas', 'Afterwards & aftershocks'],
    title: ['Revisa tu entorno antes de moverte', 'Check your surroundings before moving'],
    intro: [
      'Puede volver a temblar. Mantén cerca lo necesario para protegerte.',
      'Further shaking is possible. Be ready to protect yourself again.',
    ],
    steps: [
      {
        title: ['Si vuelve a temblar', 'If shaking resumes'],
        body: ['Agáchate, cúbrete y sujétate de nuevo.', 'Drop, cover and hold on again.'],
      },
      {
        title: ['Evita estructuras dañadas', 'Avoid damaged structures'],
        body: [
          'No entres en edificios dañados hasta que lo autorice la autoridad local. Aléjate de cables caídos.',
          'Stay out of damaged buildings until local officials permit entry. Keep clear of fallen power lines.',
        ],
      },
      {
        title: ['Comprueba si hay lesiones', 'Check for injuries'],
        body: [
          'Busca primeros auxilios si los necesitas. Ayuda a otras personas solo si puedes hacerlo sin exponerte.',
          'Seek first aid if needed. Help others only if you can do so without putting yourself at risk.',
        ],
      },
    ],
    note: [
      'Usa mensajes de texto para avisar a tus contactos. Reserva las llamadas para emergencias.',
      'Use text messages to contact others. Keep calls for emergencies.',
    ],
    source: 'CDC',
    url: 'https://www.cdc.gov/earthquakes/safety/stay-safe-after-an-earthquake.html',
  },
  {
    id: 'coast',
    label: ['Costa y tsunami', 'Coast & tsunami'],
    title: ['Reconoce las señales de tsunami', 'Recognise tsunami warning signs'],
    intro: [
      'En una zona costera baja: sismo fuerte o prolongado, cambio inusual del nivel del mar o rugido del océano.',
      'In a low-lying coastal area: strong or prolonged shaking, unusual sea-level changes or a roar from the ocean.',
    ],
    steps: [
      {
        title: ['Protégete durante el movimiento', 'Protect yourself during shaking'],
        body: ['Agáchate, cúbrete y sujétate.', 'Drop, cover and hold on.'],
      },
      {
        title: [
          'Evacúa cuando puedas moverte con seguridad',
          'Evacuate as soon as you can move safely',
        ],
        body: [
          'Ante señales naturales, ve a terreno alto o tierra adentro sin esperar una alerta. Si hay una orden oficial, sigue la evacuación indicada.',
          'With natural warning signs, go to higher ground or inland without waiting for an alert. Follow any official evacuation order.',
        ],
      },
      {
        title: ['Espera la autorización para regresar', 'Wait for permission to return'],
        body: [
          'No regreses hasta que lo autorice la autoridad local. La primera ola puede no ser la mayor.',
          'Do not return until local officials allow it. The first wave may not be the largest.',
        ],
      },
    ],
    note: [
      'Consulta con el municipio las vías de evacuación y puntos de encuentro. No regreses por tu equipaje.',
      'Ask the municipality about evacuation routes and assembly points. Do not go back for luggage.',
    ],
    source: 'NOAA / National Weather Service',
    url: 'https://www.weather.gov/safety/tsunami-during',
  },
  {
    id: 'driving',
    label: ['En la calle o en vehículo', 'Outside or driving'],
    title: ['Aléjate de lo que pueda caer', 'Keep clear of falling hazards'],
    intro: [
      'La acción depende del lugar donde te encuentre el sismo.',
      'What to do depends on where you are when shaking starts.',
    ],
    steps: [
      {
        title: ['En la calle', 'In the street'],
        body: [
          'Mantén distancia de edificios, postes y cables eléctricos.',
          'Keep away from buildings, poles and power lines.',
        ],
      },
      {
        title: [
          'En un túnel, puente o autopista urbana',
          'In a tunnel, on a bridge or urban highway',
        ],
        body: [
          'Reduce la velocidad. Detente en un lugar seguro después de salir de esa infraestructura.',
          'Slow down. Stop in a safe place after leaving that structure.',
        ],
      },
      {
        title: ['En una concentración de personas', 'In a crowded venue'],
        body: [
          'Protege cabeza y cuello y sigue las instrucciones del personal de seguridad.',
          'Protect your head and neck and follow security staff instructions.',
        ],
      },
    ],
    source: 'SENAPRED · Sismos',
    url: 'https://www.senapred.gov.cl/sismos/',
  },
  {
    id: 'contacts',
    label: ['Contacto con familiares', 'Contacting family'],
    title: ['Acuerda un plan de contacto', 'Agree on a contact plan'],
    intro: [
      'Organiza quién estará pendiente de ti durante el viaje.',
      'Decide who will check on you during your trip.',
    ],
    steps: [
      {
        title: ['Elige un contacto principal', 'Choose a primary contact'],
        body: [
          'Comparte con esa persona tu alojamiento y los contactos de tus acompañantes. Acuerden quién avisará al resto.',
          'Share your accommodation and travel companions’ contacts with this person. Agree who will notify everyone else.',
        ],
      },
      {
        title: ['Acuerda un horario y una alternativa', 'Agree on a time and a backup'],
        body: [
          'Indica cuándo volverás a escribir y qué hacer si no respondes. Lleva los teléfonos de recepción, seguro y asistencia de tu empresa fuera del móvil.',
          'Say when you will write again and what to do if you do not respond. Keep hotel, insurance and employer assistance numbers outside your phone.',
        ],
      },
      {
        title: ['Comunica hechos y hora', 'Share facts and the time'],
        body: [
          'Di cómo estás, dónde estás y si te trasladarás. Actualiza el mensaje cuando cambie tu situación.',
          'Say how you are, where you are and whether you will move. Update the message if your situation changes.',
        ],
      },
    ],
    note: [
      'Adaptación de Faro para viajeros a partir del plan de contactos de SENAPRED. No implica seguimiento automático.',
      'Faro’s traveller adaptation of SENAPRED’s contact planning guidance. It does not provide automatic tracking.',
    ],
    source: 'SENAPRED · Familia Preparada',
    url: 'https://www.senapred.gob.cl/familia-preparada/',
  },
  {
    id: 'kit',
    label: ['Mochila de emergencia', 'Emergency kit'],
    title: ['Ten lo esencial a mano', 'Keep essentials within reach'],
    intro: [
      'Prepara una bolsa accesible y adáptala a las necesidades de quienes viajan contigo.',
      'Prepare an accessible bag and adapt it to your travel companions’ needs.',
    ],
    steps: [
      {
        title: ['Agua y alimentos', 'Water and food'],
        body: [
          'Lleva agua y alimentos que puedas consumir sin cocinar. Planifica las provisiones con tu alojamiento.',
          'Keep water and food that needs no cooking. Plan supplies with your accommodation.',
        ],
      },
      {
        title: ['Medicamentos y documentos', 'Medication and documents'],
        body: [
          'Incluye medicamentos necesarios, recetas, botiquín, efectivo y copias de identidad y pasaporte.',
          'Include essential medication, prescriptions, first-aid supplies, cash and copies of ID and passport.',
        ],
      },
      {
        title: ['Luz, información y plan', 'Light, information and your plan'],
        body: [
          'Prepara linterna, baterías y radio portátil. Lleva una copia de tu plan y de los teléfonos de contacto.',
          'Pack a flashlight, batteries and portable radio. Carry a copy of your plan and contact numbers.',
        ],
      },
    ],
    note: [
      'Guarda copias de documentos de forma privada. Faro no necesita que subas tu pasaporte.',
      'Keep document copies private. Faro does not need you to upload your passport.',
    ],
    source: 'SENAPRED · Kit de emergencia',
    url: 'https://www.senapred.gob.cl/kit-emergencia/',
  },
  {
    id: 'hotel',
    label: ['Preparación en el hotel', 'Hotel preparation'],
    title: ['Confirma el plan con recepción', 'Confirm the plan with reception'],
    intro: [
      'Anota estas indicaciones antes de que ocurra una emergencia.',
      'Record these details before an emergency.',
    ],
    steps: [
      {
        title: ['Salida y punto de encuentro', 'Exit and assembly point'],
        body: [
          'Pide la ruta desde tu habitación y el punto de encuentro del hotel.',
          'Ask for the route from your room and the hotel assembly point.',
        ],
      },
      {
        title: ['Evacuación por tsunami', 'Tsunami evacuation'],
        body: [
          'Si el hotel está en la costa, pregunta por la ruta específica y las instrucciones de la autoridad local.',
          'If the hotel is near the coast, ask for the specific route and local authority instructions.',
        ],
      },
      {
        title: ['Contacto y acceso sin internet', 'Contact and offline access'],
        body: [
          'Acuerda dónde reunirte con tus acompañantes. Guarda una copia de las instrucciones.',
          'Agree where to meet your companions. Save a copy of the instructions.',
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
];
function guideText(lang: Lang, country: string) {
  const i = lang === 'es' ? 0 : 1;
  const local = destinationFor(country);
  const title =
    lang === 'es'
      ? 'FARO — GUÍA DE ACTUACIÓN\nInformación general. Sigue las instrucciones locales.'
      : 'FARO — EARTHQUAKE GUIDE\nGeneral information. Follow local instructions.';
  const content = sections.map((section) => {
    if (section.id === 'kit') return kitText(lang, []);
    const lines = [
      section.label[i],
      section.intro[i],
      ...section.steps.map((step, n) => `${n + 1}. ${step.title[i]}: ${step.body[i]}`),
      section.note?.[i] || '',
    ];
    if (section.id === 'during') {
      lines.push(outdoors[i]);
      if (country === 'CL')
        lines.push(
          lang === 'es'
            ? 'Chile: SENAPRED recomienda evacuar inmediatamente construcciones de adobe o autoconstruidas.'
            : 'Chile: SENAPRED recommends immediately evacuating adobe or self-built structures.',
          'https://www.senapred.gov.cl/sismos/',
        );
    }
    if (section.id === 'coast' && local?.evacuation)
      lines.push(`${local.evacuation.name}: ${local.evacuation.url}`);
    lines.push(
      section.url
        ? `${section.source}: ${section.url}`
        : lang === 'es'
          ? 'Preparación personal; confirmar con recepción.'
          : 'Personal preparation; confirm with reception.',
    );
    return lines.filter(Boolean).join('\n');
  });
  if (local?.civilProtection)
    content.push(
      `${lang === 'es' ? 'Indicaciones locales' : 'Local guidance'}: ${local.civilProtection.name}\n${local.civilProtection.url}`,
    );
  return [title, ...content].join('\n\n');
}
export default function SafetyGuide({
  lang,
  country,
  onHotel,
  onStatus,
}: {
  lang: Lang;
  country: string;
  onHotel: () => void;
  onStatus: () => void;
}) {
  const [active, setActive] = useState('during'),
    [downloaded, setDownloaded] = useState(false);
  const i = lang === 'es' ? 0 : 1,
    t = (es: string, en: string) => (lang === 'es' ? es : en);
  const destination = destinationFor(country);
  const current = sections.find((s) => s.id === active)!;
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([guideText(lang, country)], { type: 'text/plain;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `faro-guide-${lang}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  };
  return (
    <div className="fw-safety-layout">
      <aside className="fw-safety-index">
        <span>{t('Situación', 'Situation')}</span>
        <nav aria-label={t('Situaciones de la guía', 'Guide situations')}>
          {sections.map((s) => (
            <button
              key={s.id}
              aria-current={active === s.id ? 'true' : undefined}
              onClick={() => setActive(s.id)}
            >
              {s.label[i]}
              <ArrowRightIcon size={15} />
            </button>
          ))}
        </nav>
        <label htmlFor="guide-situation" className="fw-safety-mobile-label">
          {t('Situación', 'Situation')}
        </label>
        <select id="guide-situation" value={active} onChange={(e) => setActive(e.target.value)}>
          {sections.map((s) => (
            <option value={s.id} key={s.id}>
              {s.label[i]}
            </option>
          ))}
        </select>
        <div className="fw-safety-download">
          <button onClick={download}>
            <DownloadSimpleIcon size={17} />
            {t('Descargar guía', 'Download guide')}
          </button>
          <small>
            {t('Texto · todas las situaciones · español', 'Text · all situations · English')}
          </small>
          <span role="status">{downloaded ? t('Archivo generado.', 'File generated.') : ''}</span>
        </div>
      </aside>
      {active === 'kit' ? (
        <EmergencyKit lang={lang} />
      ) : (
        <article className="fw-safety-document" aria-labelledby="safety-title" key={active}>
          <header>
            <span>{current.label[i]}</span>
            <h2 id="safety-title">{current.title[i]}</h2>
            <p>{current.intro[i]}</p>
          </header>
          {active === 'during' && (
            <figure className="fw-official-instructions">
              <a
                href={`/illustrations/drop-cover-hold-${lang}.png`}
                target="_blank"
                rel="noopener"
                aria-label={t(
                  'Ampliar las instrucciones ilustradas',
                  'Enlarge illustrated instructions',
                )}
              >
                <img
                  src={`/illustrations/drop-cover-hold-${lang}.png`}
                  width="1920"
                  height="631"
                  alt={t(
                    'Agáchate sobre manos y rodillas. Cubre cabeza y cuello bajo una mesa resistente. Sujeta la mesa con una mano y sigue protegiéndote con la otra.',
                    'Drop onto your hands and knees. Cover your head and neck under a sturdy table. Hold the table with one hand and keep protecting yourself with the other.',
                  )}
                />
              </a>
              <figcaption>
                <a
                  href="https://www.earthquakecountry.org/graphics/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Earthquake Country Alliance · ShakeOut ↗
                </a>
                <span>{t('Toca la imagen para ampliarla.', 'Tap the image to enlarge.')}</span>
              </figcaption>
              <a
                className="fw-accessible-guide"
                href={`https://www.earthquakecountry.org/library/Accessible_Earthquake_Protective_Actions_Image-${lang === 'es' ? 'SP' : 'EN'}.pdf`}
                target="_blank"
                rel="noreferrer"
              >
                {t(
                  'Guía ilustrada: bastón, andador y silla de ruedas (PDF) ↗',
                  'Illustrated guide: cane, walker and wheelchair (PDF) ↗',
                )}
              </a>
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
          {active === 'during' && <p className="fw-safety-outdoors">{outdoors[i]}</p>}
          {active === 'during' && country === 'CL' && (
            <div className="fw-chile-guidance">
              <p>
                {t(
                  'En Chile, SENAPRED distingue las construcciones de adobe o autoconstruidas: recomienda evacuarlas inmediatamente. Identifica el tipo de construcción y el plan de tu alojamiento antes de una emergencia.',
                  'In Chile, SENAPRED distinguishes adobe and self-built structures: it recommends evacuating them immediately. Identify your accommodation’s construction type and plan before an emergency.',
                )}
              </p>
              <a href="https://www.senapred.gov.cl/sismos/" target="_blank" rel="noreferrer">
                SENAPRED · {t('Sismos', 'Earthquakes')} ↗
              </a>
            </div>
          )}
          {active === 'contacts' && (
            <button className="fw-primary" onClick={onStatus}>
              {t('Preparar mi actualización', 'Prepare my update')}
              <ArrowRightIcon size={16} />
            </button>
          )}
          {active === 'coast' && country === 'CL' && (
            <div className="fw-chile-guidance">
              <a href="https://www.senapred.gov.cl/tsunami/" target="_blank" rel="noreferrer">
                {t('Recomendaciones de SENAPRED · Chile', 'SENAPRED guidance · Chile')} ↗
              </a>
              <p>
                {t(
                  'SENAPRED recomienda conocer previamente las rutas y puntos de encuentro de la localidad que visitas. Los planos siguientes corresponden solo a Chile.',
                  'SENAPRED recommends knowing the routes and assembly points in the place you visit. The following maps cover Chile only.',
                )}
              </p>
              <a href="https://senapred.cl/planos-de-evacuacion/" target="_blank" rel="noreferrer">
                {t('Planos de evacuación de Chile', 'Chile evacuation maps')} ↗
              </a>
            </div>
          )}
          {country !== 'CL' && destination?.civilProtection && (
            <div className="fw-chile-guidance">
              <a href={destination.civilProtection.url} target="_blank" rel="noreferrer">
                {t('Indicaciones locales', 'Local guidance')} · {destination.civilProtection.name} ↗
              </a>
              <p>
                {t(
                  'Confirma las instrucciones y las rutas de evacuación del lugar donde estás.',
                  'Check the instructions and evacuation routes for your location.',
                )}
              </p>
            </div>
          )}
          {(active === 'hotel' || active === 'coast') && (
            <EvacuationPlan country={country} lang={lang} />
          )}
          {active === 'hotel' && (
            <button className="fw-primary" onClick={onHotel}>
              {t('Guardar plan del hotel', 'Save hotel plan')}
              <ArrowRightIcon size={16} />
            </button>
          )}
          <footer>
            <span>
              {current.url
                ? t('Resumen de recomendaciones', 'Guidance summary')
                : t('Lista de preparación para viajeros', 'Travel preparation checklist')}
            </span>
            {current.url ? (
              <a href={current.url} target="_blank" rel="noreferrer">
                {current.source}
                <ArrowUpRightIcon size={14} />
              </a>
            ) : (
              <span>{t('Confirmar con recepción', 'Confirm with reception')}</span>
            )}
          </footer>
        </article>
      )}
    </div>
  );
}
