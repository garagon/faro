import type { Localized } from './destinations/types.ts';

type SupportResource = {
  id: string;
  title: Localized;
  description: Localized;
  action: Localized;
  url: string;
};
type TravelerSupport = {
  title: Localized;
  agency: string;
  reviewedAt: string;
  contactSource: string;
  contacts: { number: string; display: string; scope: Localized }[];
  advisories: { index: string; destinations: Record<string, string> };
  resources: SupportResource[];
};
const state = 'https://travel.state.gov/en/international-travel';
export const travelerSupport: Record<string, TravelerSupport> = {
  US: {
    title: ['Para ciudadanos estadounidenses en el extranjero', 'For U.S. citizens abroad'],
    agency: 'U.S. Department of State',
    reviewedAt: '2026-10-12',
    contactSource: `${state}/help-abroad/crisis-response.html`,
    contacts: [
      {
        number: '+12025014444',
        display: '+1 202-501-4444',
        scope: ['Desde fuera de EE. UU. y Canadá', 'From outside the U.S. and Canada'],
      },
      {
        number: '+18884074747',
        display: '+1 888-407-4747',
        scope: [
          'Desde EE. UU. o Canadá · también para familiares',
          'From the U.S. or Canada · also for family members',
        ],
      },
    ],
    advisories: {
      index: `${state}/travel-advisories.html`,
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
        title: ['Recibir avisos de la embajada', 'Get embassy alerts'],
        description: [
          'STEP es gratuito: permite recibir correos de la embajada y facilita que te contacte durante una crisis. La inscripción se hace en el sitio oficial; Faro no envía tu perfil.',
          'STEP is free: receive embassy emails and help consular staff reach you during a crisis. Enroll on the official site; Faro does not send your profile.',
        ],
        action: ['Consultar e inscribirme en STEP', 'Learn about and enroll in STEP'],
        url: `${state}/travel-advisories/smart-traveler-enrollment-program.html`,
      },
      {
        id: 'passport',
        title: ['Perdí mi pasaporte', 'I lost my passport'],
        description: [
          'Contacta a la embajada o consulado para reemplazarlo. Indica si tienes un viaje próximo y consulta los requisitos antes de ir.',
          'Contact the embassy or consulate to arrange a replacement. Explain any upcoming travel and check requirements before visiting.',
        ],
        action: ['Ver cómo reemplazarlo', 'See replacement instructions'],
        url: `${state}/help-abroad/lost-stolen-passport.html`,
      },
      {
        id: 'insurance',
        title: ['Atención médica y seguro', 'Medical care and insurance'],
        description: [
          'Confirma con tu aseguradora la cobertura en el extranjero, el pago al hospital y la evacuación médica. Guarda su teléfono de asistencia. El gobierno de EE. UU. no paga tus gastos médicos.',
          'Check overseas coverage, hospital payment and medical evacuation with your insurer. Save its assistance number. The U.S. government does not pay your medical bills.',
        ],
        action: ['Revisar cobertura y evacuación médica', 'Review coverage and medical evacuation'],
        url: `${state}/planning/guidance/insurance.html`,
      },
      {
        id: 'departure',
        title: ['Necesito salir del país', 'I need to leave the country'],
        description: [
          'Consulta las instrucciones de la embajada y las opciones de tu aerolínea. La asistencia de salida depende de la crisis; no presupongas una evacuación del gobierno ni transporte gratuito.',
          'Check embassy instructions and options with your airline. Departure assistance depends on the crisis; do not assume a government evacuation or free transport.',
        ],
        action: ['Ver asistencia durante una crisis', 'See crisis assistance'],
        url: `${state}/help-abroad/crisis-response.html`,
      },
      {
        id: 'missing',
        title: ['No puedo contactar a un familiar', 'I cannot reach a family member'],
        description: [
          'Consulta cómo pedir ayuda para localizar a un ciudadano estadounidense en el extranjero. Faro no localiza personas ni confirma la entrega de mensajes.',
          'Find out how to request help locating a U.S. citizen abroad. Faro does not locate people or confirm message delivery.',
        ],
        action: ['Consultar ayuda para familiares', 'Find help for family members'],
        url: `${state}/help-abroad/missing-us-citizen.html`,
      },
      {
        id: 'work',
        title: ['Estoy de viaje por trabajo', 'I am traveling for work'],
        description: [
          'Acuerda con tu equipo un contacto de emergencia y el próximo aviso. Revisa el plan de asistencia de tu empresa y guarda sus contactos en «Mi viaje».',
          'Agree on an emergency contact and next check-in with your team. Review your employer’s assistance plan and save contacts in “My trip.”',
        ],
        action: ['Preparar un viaje de trabajo', 'Prepare for business travel'],
        url: `${state}/planning/safety-tips/business.html`,
      },
    ],
  },
};

export function supportFor(nationality: string, destination: string) {
  return nationality && nationality !== destination ? travelerSupport[nationality] : undefined;
}
