import type { Localized } from './destinations/types.ts';

export type SupportResource = {
  id: string;
  title: Localized;
  description: Localized;
  action: Localized;
  url: string;
};
export type SupportContact = {
  number: string;
  display: string;
  scope: Localized;
  /** The traveler can call it from abroad; other lines are for relatives at home. */
  abroad?: true;
};
export type TravelerSupport = {
  title: Localized;
  agency: string;
  reviewedAt: string;
  contactSource: string;
  /** Heading for the fallback telephone block; must state who may call. */
  contactTitle: Localized;
  /** Hours and caller scope; the component appends the local-emergency reminder. */
  contactNote: Localized;
  contacts: SupportContact[];
  /** Destination advisories exist only where the authority publishes them per country. */
  advisories?: { index: string; publisher: string; destinations: Record<string, string> };
  resources: SupportResource[];
};
const state = 'https://travel.state.gov/en/international-travel';
const argentina = 'https://cancilleria.gob.ar/es';
const brazil = 'https://www.gov.br/mre/pt-br/assuntos/portal-consular';
const brazilEmergencyContact = `${brazil}/quem-contatar/assistencia-a-brasileiros-que-se-encontram-no-exterior/assistencia-a-brasileiros-que-se-encontram-no-exterior-emergencias`;
export const travelerSupport: Record<string, TravelerSupport> = {
  US: {
    title: [
      'Para ciudadanos estadounidenses en el extranjero',
      'For U.S. citizens abroad',
      'Para cidadãos dos EUA no exterior',
    ],
    agency: 'U.S. Department of State',
    reviewedAt: '2026-10-12',
    contactSource: `${state}/help-abroad/crisis-response.html`,
    contactTitle: [
      'Si no logras contactar a tu embajada',
      'If you cannot reach your embassy',
      'Se você não conseguir falar com sua embaixada',
    ],
    contactNote: [
      'Para una urgencia consular.',
      'For a consular emergency.',
      'Para uma emergência consular.',
    ],
    contacts: [
      {
        number: '+12025014444',
        display: '+1 202-501-4444',
        scope: [
          'Desde fuera de EE. UU. y Canadá',
          'From outside the U.S. and Canada',
          'De fora dos EUA e do Canadá',
        ],
        abroad: true,
      },
      {
        number: '+18884074747',
        display: '+1 888-407-4747',
        scope: [
          'Desde EE. UU. o Canadá · también para familiares',
          'From the U.S. or Canada · also for family members',
          'Dos EUA ou do Canadá · também para familiares',
        ],
      },
    ],
    advisories: {
      index: `${state}/travel-advisories.html`,
      publisher: 'Travel.State.gov',
      destinations: Object.fromEntries(
        Object.entries({
          PA: 'panama',
          CO: 'colombia',
          CL: 'chile',
          MX: 'mexico',
          CR: 'costa-rica',
          PE: 'peru',
          EC: 'ecuador',
          CA: 'canada',
        }).map(([code, slug]) => [code, `${state}/travel-advisories/${slug}.html`]),
      ),
    },
    resources: [
      {
        id: 'step',
        title: [
          'Recibir avisos de la embajada',
          'Get embassy alerts',
          'Receber avisos da embaixada',
        ],
        description: [
          'STEP es gratuito: permite recibir correos de la embajada y facilita que te contacte durante una crisis. La inscripción se hace en el sitio oficial; Faro no envía tu perfil.',
          'STEP is free: receive embassy emails and help consular staff reach you during a crisis. Enroll on the official site; Faro does not send your profile.',
          'O STEP é gratuito: permite receber e-mails da embaixada e facilita que ela entre em contato com você durante uma crise. A inscrição é feita no site oficial; o Faro não envia seu perfil.',
        ],
        action: [
          'Consultar e inscribirme en STEP',
          'Learn about and enroll in STEP',
          'Saber mais e me inscrever no STEP',
        ],
        url: `${state}/travel-advisories/smart-traveler-enrollment-program.html`,
      },
      {
        id: 'passport',
        title: ['Perdí mi pasaporte', 'I lost my passport', 'Perdi meu passaporte'],
        description: [
          'Contacta a la embajada o consulado para reemplazarlo. Indica si tienes un viaje próximo y consulta los requisitos antes de ir.',
          'Contact the embassy or consulate to arrange a replacement. Explain any upcoming travel and check requirements before visiting.',
          'Entre em contato com a embaixada ou o consulado para substituí-lo. Informe se tem uma viagem próxima e confira os requisitos antes de ir.',
        ],
        action: ['Ver cómo reemplazarlo', 'See replacement instructions', 'Ver como substituí-lo'],
        url: `${state}/help-abroad/lost-stolen-passport.html`,
      },
      {
        id: 'insurance',
        title: [
          'Atención médica y seguro',
          'Medical care and insurance',
          'Atendimento médico e seguro',
        ],
        description: [
          'Confirma con tu aseguradora la cobertura en el extranjero, el pago al hospital y la evacuación médica. Guarda su teléfono de asistencia. El gobierno de EE. UU. no paga tus gastos médicos.',
          'Check overseas coverage, hospital payment and medical evacuation with your insurer. Save its assistance number. The U.S. government does not pay your medical bills.',
          'Confirme com sua seguradora a cobertura no exterior, o pagamento ao hospital e a evacuação médica. Guarde o telefone de assistência dela. O governo dos EUA não paga suas despesas médicas.',
        ],
        action: [
          'Revisar cobertura y evacuación médica',
          'Review coverage and medical evacuation',
          'Revisar cobertura e evacuação médica',
        ],
        url: `${state}/planning/guidance/insurance.html`,
      },
      {
        id: 'departure',
        title: ['Necesito salir del país', 'I need to leave the country', 'Preciso sair do país'],
        description: [
          'Consulta las instrucciones de la embajada y las opciones de tu aerolínea. La asistencia de salida depende de la crisis; no presupongas una evacuación del gobierno ni transporte gratuito.',
          'Check embassy instructions and options with your airline. Departure assistance depends on the crisis; do not assume a government evacuation or free transport.',
          'Confira as instruções da embaixada e as opções da sua companhia aérea. A assistência para sair depende da crise; não presuma uma evacuação do governo nem transporte gratuito.',
        ],
        action: [
          'Ver asistencia durante una crisis',
          'See crisis assistance',
          'Ver assistência durante uma crise',
        ],
        url: `${state}/help-abroad/crisis-response.html`,
      },
      {
        id: 'missing',
        title: [
          'No puedo contactar a un familiar',
          'I cannot reach a family member',
          'Não consigo falar com um familiar',
        ],
        description: [
          'Consulta cómo pedir ayuda para localizar a un ciudadano estadounidense en el extranjero. Faro no localiza personas ni confirma la entrega de mensajes.',
          'Find out how to request help locating a U.S. citizen abroad. Faro does not locate people or confirm message delivery.',
          'Veja como pedir ajuda para localizar um cidadão dos EUA no exterior. O Faro não localiza pessoas nem confirma a entrega de mensagens.',
        ],
        action: [
          'Consultar ayuda para familiares',
          'Find help for family members',
          'Ver ajuda para familiares',
        ],
        url: `${state}/help-abroad/missing-us-citizen.html`,
      },
      {
        id: 'work',
        title: [
          'Estoy de viaje por trabajo',
          'I am traveling for work',
          'Estou viajando a trabalho',
        ],
        description: [
          'Acuerda con tu equipo un contacto de emergencia y el próximo aviso. Revisa el plan de asistencia de tu empresa y guarda sus contactos en «Mi viaje».',
          'Agree on an emergency contact and next check-in with your team. Review your employer’s assistance plan and save contacts in “My trip.”',
          'Combine com sua equipe um contato de emergência e o próximo aviso. Revise o plano de assistência da sua empresa e salve os contatos em “Minha viagem”.',
        ],
        action: [
          'Preparar un viaje de trabajo',
          'Prepare for business travel',
          'Preparar uma viagem de trabalho',
        ],
        url: `${state}/planning/safety-tips/business.html`,
      },
    ],
  },
  // Cancillería Argentina has no central line for people abroad: each embassy or consulate has its
  // own on-call phone. The Buenos Aires on-call service below is for callers in Argentina.
  AR: {
    title: [
      'Para ciudadanos argentinos en el exterior',
      'For Argentine citizens abroad',
      'Para cidadãos argentinos no exterior',
    ],
    agency: 'Cancillería Argentina',
    reviewedAt: '2026-10-13',
    contactSource: `${argentina}/emergencia-consular`,
    contactTitle: [
      'Si estás en Argentina y un familiar tiene una emergencia en el exterior',
      'If you are in Argentina and a relative has an emergency abroad',
      'Se você está na Argentina e um familiar tem uma emergência no exterior',
    ],
    contactNote: [
      'Servicio de guardia de la Cancillería: lunes a viernes de 20:00 a 09:00; sábados, domingos y feriados, las 24 horas. También por WhatsApp (solo WhatsApp): (011) 15 5061-5903. Si estás en el exterior, llama al celular de guardia de la embajada o consulado de tu ubicación.',
      'Foreign ministry on-call service: Monday–Friday 20:00–09:00; Saturdays, Sundays and holidays, 24 hours. Also on WhatsApp (WhatsApp only): (011) 15 5061-5903. If you are abroad, call the on-call phone of the embassy or consulate for your location.',
      'Serviço de plantão da Chancelaria: segunda a sexta, das 20:00 às 09:00; sábados, domingos e feriados, 24 horas. Também por WhatsApp (só WhatsApp): (011) 15 5061-5903. Se você está no exterior, ligue para o celular de plantão da embaixada ou do consulado da sua localização.',
    ],
    contacts: [
      {
        number: '+5491150407243',
        display: '(011) 15 5040-7243',
        scope: [
          'Desde Argentina · solo voz · para familiares',
          'From Argentina · voice only · for family members',
          'Da Argentina · só voz · para familiares',
        ],
      },
    ],
    resources: [
      {
        id: 'on-call',
        title: [
          'Tengo una emergencia consular',
          'I have a consular emergency',
          'Tenho uma emergência consular',
        ],
        description: [
          'Usa el celular de guardia de la embajada o consulado que cubre el lugar donde estás. Es solo para catástrofes, detenciones, inadmisiones, trata, violencia, accidentes graves, hospitalizaciones o fallecimientos. Si no es una emergencia, no uses ese número.',
          'Use the on-call phone of the embassy or consulate covering where you are. It is only for disasters, arrests, refused entry, trafficking, violence, serious accidents, hospitalization or death. If it is not an emergency, do not use that number.',
          'Use o celular de plantão da embaixada ou do consulado que atende o lugar onde você está. É só para catástrofes, detenções, entrada negada no país, tráfico de pessoas, violência, acidentes graves, hospitalizações ou mortes. Se não for uma emergência, não use esse número.',
        ],
        action: [
          'Ver celulares de guardia por país',
          'See on-call phones by country',
          'Ver celulares de plantão por país',
        ],
        url: `${argentina}/emergencia-consular`,
      },
      {
        id: 'viajar',
        title: [
          'Registrar mi viaje en ViajAR',
          'Register my trip with ViajAR',
          'Registrar minha viagem no ViajAR',
        ],
        description: [
          'ViajAR es el registro voluntario de la Cancillería para argentinos que viajan al exterior: facilita la asistencia consular y permite recibir avisos por correo. La inscripción se hace en el sitio oficial; Faro no envía tu perfil.',
          'ViajAR is the foreign ministry’s voluntary registry for Argentines traveling abroad: it supports consular assistance and sends notices by email. Register on the official site; Faro does not send your profile.',
          'O ViajAR é o registro voluntário da Chancelaria para argentinos que viajam ao exterior: facilita a assistência consular e permite receber avisos por e-mail. A inscrição é feita no site oficial; o Faro não envia seu perfil.',
        ],
        action: ['Ir al registro ViajAR', 'Go to the ViajAR registry', 'Ir ao registro ViajAR'],
        url: 'https://acreditaciones.mrecic.gov.ar/p_viajAR',
      },
      {
        id: 'passport',
        title: [
          'Perdí mi pasaporte o DNI',
          'I lost my passport or ID',
          'Perdi meu passaporte ou DNI',
        ],
        description: [
          'Contacta a la embajada o consulado argentino de tu zona: los documentos de viaje y requisitos dependen de cada sede. La pérdida de documentos no figura entre las emergencias consulares; usa los canales de atención habituales.',
          'Contact the Argentine embassy or consulate for your area: travel documents and requirements vary by office. Lost documents are not listed as a consular emergency; use the regular contact channels.',
          'Entre em contato com a embaixada ou o consulado argentino da sua região: os documentos de viagem e os requisitos dependem de cada representação. A perda de documentos não está entre as emergências consulares; use os canais de atendimento habituais.',
        ],
        action: [
          'Buscar embajadas y consulados',
          'Find embassies and consulates',
          'Buscar embaixadas e consulados',
        ],
        url: `${argentina}/representaciones`,
      },
      {
        id: 'insurance',
        title: [
          'Atención médica y seguro',
          'Medical care and insurance',
          'Atendimento médico e seguro',
        ],
        description: [
          'En general, la salud pública de otros países no atiende gratis a extranjeros no residentes. La Cancillería recomienda un seguro de asistencia al viajero y leer sus exclusiones, como enfermedades preexistentes.',
          'Public health systems abroad generally do not treat non-resident foreigners for free. The foreign ministry recommends travel assistance insurance and reading its exclusions, such as pre-existing conditions.',
          'Em geral, a saúde pública de outros países não atende de graça estrangeiros não residentes. A Chancelaria recomenda um seguro de assistência ao viajante e ler as exclusões dele, como doenças preexistentes.',
        ],
        action: [
          'Ver recomendaciones sobre seguros',
          'See insurance advice',
          'Ver recomendações sobre seguros',
        ],
        url: `${argentina}/servicios/recomendaciones/seguros-de-viajero`,
      },
      {
        id: 'limits',
        title: [
          'Qué puede hacer el consulado',
          'What the consulate can do',
          'O que o consulado pode fazer',
        ],
        description: [
          'Puede asistir a personas accidentadas o con problemas graves de salud e informar a familiares sobre accidentes, fallecimientos o catástrofes. No paga pasajes, hoteles ni gastos médicos; una repatriación solo se evalúa en casos muy especiales de vulnerabilidad extrema. No presupongas una evacuación.',
          'It can assist people injured or seriously ill and inform relatives about accidents, deaths or disasters. It does not pay for tickets, hotels or medical costs; repatriation is only assessed in very special cases of extreme vulnerability. Do not assume an evacuation.',
          'Pode ajudar pessoas acidentadas ou com problemas graves de saúde e informar familiares sobre acidentes, mortes ou catástrofes. Não paga passagens, hotéis nem despesas médicas; uma repatriação só é avaliada em casos muito especiais de vulnerabilidade extrema. Não presuma uma evacuação.',
        ],
        action: [
          'Ver funciones de los cónsules',
          'See what consuls do',
          'Ver funções dos cônsules',
        ],
        url: `${argentina}/servicios/recomendaciones/funciones-de-los-consules`,
      },
      {
        id: 'missing',
        title: [
          'No puedo contactar a un familiar',
          'I cannot reach a family member',
          'Não consigo falar com um familiar',
        ],
        description: [
          'A pedido de familiares directos y con fines humanitarios, el consulado puede procurar el paradero de una persona a través de las autoridades locales. Desde Argentina, usa el servicio de guardia indicado arriba. Faro no localiza personas ni confirma la entrega de mensajes.',
          'At the request of close relatives and for humanitarian purposes, the consulate can seek a person’s whereabouts through local authorities. From Argentina, use the on-call service above. Faro does not locate people or confirm message delivery.',
          'A pedido de familiares diretos e com fins humanitários, o consulado pode tentar localizar uma pessoa por meio das autoridades locais. Da Argentina, use o serviço de plantão indicado acima. O Faro não localiza pessoas nem confirma a entrega de mensagens.',
        ],
        action: [
          'Ver funciones de los cónsules',
          'See what consuls do',
          'Ver funções dos cônsules',
        ],
        url: `${argentina}/servicios/recomendaciones/funciones-de-los-consules`,
      },
    ],
  },
  // Itamaraty asks Brazilians abroad to contact the local consular office; the Brasília duty line
  // below is for callers in Brazil, outside business hours. Official page titles stay in Portuguese
  // in every interface language.
  BR: {
    title: [
      'Para ciudadanos brasileños en el exterior',
      'For Brazilian citizens abroad',
      'Para cidadãos brasileiros no exterior',
    ],
    agency: 'Itamaraty · Ministério das Relações Exteriores',
    reviewedAt: '2026-10-13',
    contactSource: brazilEmergencyContact,
    contactTitle: [
      'Si estás en Brasil y un familiar tiene una emergencia en el exterior',
      'If you are in Brazil and a relative has an emergency abroad',
      'Se você está no Brasil e um familiar tem uma emergência no exterior',
    ],
    contactNote: [
      'Llamada o mensaje fuera del horario comercial, solo para emergencias extremas con riesgo para la vida, la seguridad o la dignidad. En horario comercial, Itamaraty pide escribir a dac@itamaraty.gov.br. Si estás en el exterior, contacta a la embajada o consulado de tu ubicación.',
      'Call or message outside business hours, only for extreme emergencies involving a risk to life, safety or dignity. During business hours, Itamaraty asks you to email dac@itamaraty.gov.br. If you are abroad, contact the embassy or consulate for your location.',
      'Ligação ou mensagem fora do horário comercial, só para emergências extremas com risco à vida, à segurança ou à dignidade. No horário comercial, o Itamaraty pede que você escreva para dac@itamaraty.gov.br. Se você está no exterior, entre em contato com a embaixada ou o consulado da sua localização.',
    ],
    contacts: [
      {
        number: '+5561982600610',
        display: '+55 61 98260-0610',
        scope: [
          'Desde Brasil · fuera del horario comercial · llamada o mensaje',
          'From Brazil · outside business hours · call or message',
          'Do Brasil · fora do horário comercial · ligação ou mensagem',
        ],
      },
    ],
    resources: [
      {
        id: 'emergency',
        title: [
          'Tengo una emergencia consular',
          'I have a consular emergency',
          'Tenho uma emergência consular',
        ],
        description: [
          'Contacta a la embajada o consulado del lugar donde estás. Itamaraty considera emergencias los desastres naturales y conflictos, desapariciones en las últimas 48 horas, violencia, detenciones, accidentes graves y fallecimientos. Perder el pasaporte o un vuelo no lo es.',
          'Contact the embassy or consulate where you are. Itamaraty treats natural disasters and conflicts, disappearances within the last 48 hours, violence, arrests, serious accidents and deaths as emergencies. A lost passport or missed flight is not.',
          'Entre em contato com a embaixada ou o consulado do lugar onde você está. O Itamaraty considera emergências os desastres naturais e conflitos, desaparecimentos nas últimas 48 horas, violência, detenções, acidentes graves e mortes. Perder o passaporte ou um voo não é.',
        ],
        action: [
          'Ver «Emergências no Exterior»',
          'See “Emergências no Exterior”',
          'Ver “Emergências no Exterior”',
        ],
        url: `${brazil}/emergencias-no-exterior`,
      },
      {
        id: 'passport',
        title: ['Perdí mi pasaporte', 'I lost my passport', 'Perdi meu passaporte'],
        description: [
          'Para volver a Brasil, la oficina consular puede emitir una Autorização de Retorno ao Brasil (ARB), gratuita y válida solo para el regreso. Debes presentarte en persona; algunas oficinas piden cita. No es una emergencia consular: hazlo en horario de atención.',
          'To return to Brazil, the consular office can issue a free Autorização de Retorno ao Brasil (ARB), valid only for the return trip. You must attend in person; some offices require an appointment. This is not a consular emergency: use office hours.',
          'Para voltar ao Brasil, a repartição consular pode emitir uma Autorização de Retorno ao Brasil (ARB), gratuita e válida só para o retorno. É preciso comparecer pessoalmente; algumas repartições exigem agendamento. Não é uma emergência consular: faça isso no horário de atendimento.',
        ],
        action: [
          'Ver cómo solicitar la ARB',
          'See how to request an ARB',
          'Ver como solicitar a ARB',
        ],
        url: 'https://www.gov.br/pt-br/servicos/solicitar-autorizacao-de-retorno-ao-brasil',
      },
      {
        id: 'limits',
        title: [
          'Qué puede hacer el consulado',
          'What the consulate can do',
          'O que o consulado pode fazer',
        ],
        description: [
          'Puede asistir en desastres, hospitalizaciones, detenciones y desapariciones, y emitir documentos de viaje. No paga gastos médicos ni de abogados, no presta dinero y no cambia vuelos. No presupongas una evacuación.',
          'It can assist with disasters, hospitalization, arrests and disappearances, and issue travel documents. It does not pay medical or legal costs, lend money or rebook flights. Do not assume an evacuation.',
          'Pode ajudar em desastres, hospitalizações, detenções e desaparecimentos, e emitir documentos de viagem. Não paga despesas médicas nem de advogados, não empresta dinheiro e não remarca voos. Não presuma uma evacuação.',
        ],
        action: [
          'Ver «Assistência Consular»',
          'See “Assistência Consular”',
          'Ver “Assistência Consular”',
        ],
        url: `${brazil}/assistencia-consular`,
      },
      {
        id: 'missing',
        title: [
          'No puedo contactar a un familiar',
          'I cannot reach a family member',
          'Não consigo falar com um familiar',
        ],
        description: [
          'Itamaraty trata como emergencia la desaparición de un brasileño en el exterior en las últimas 48 horas. Lo mejor es contactar a la oficina consular del país donde está. Desde Brasil, usa la línea indicada arriba. Faro no localiza personas ni confirma la entrega de mensajes.',
          'Itamaraty treats a Brazilian’s disappearance abroad within the last 48 hours as an emergency. The best route is the consular office in the country where they are. From Brazil, use the line above. Faro does not locate people or confirm message delivery.',
          'O Itamaraty trata como emergência o desaparecimento de um brasileiro no exterior nas últimas 48 horas. O melhor é entrar em contato com a repartição consular do país onde a pessoa está. Do Brasil, use a linha indicada acima. O Faro não localiza pessoas nem confirma a entrega de mensagens.',
        ],
        action: [
          'Ver contactos de emergencia',
          'See emergency contacts',
          'Ver contatos de emergência',
        ],
        url: brazilEmergencyContact,
      },
    ],
  },
};

export function supportFor(nationality: string, destination: string) {
  return nationality && nationality !== destination ? travelerSupport[nationality] : undefined;
}
