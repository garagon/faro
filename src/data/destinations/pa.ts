import type { Destination } from './types.ts';
export default {
  code: 'PA',
  emergency: {
    source: 'https://sume911.pa/acerca-de/como-funciona',
    agency: 'SUME',
    numbers: [
      {
        number: '911',
        label: ['Emergencias · SUME', 'Emergencies · SUME'],
      },
    ],
    reviewedAt: '2026-10-11',
  },
  civilProtection: {
    name: 'SINAPROC',
    url: 'https://www.sinaproc.gob.pa/',
    reviewedAt: '2026-10-12',
  },
  seismicAgency: {
    name: 'IGC · Universidad de Panamá',
    url: 'https://sismosgeociencias.up.ac.pa/',
    reviewedAt: '2026-10-12',
  },
  region: {
    bounds: {
      south: 4,
      north: 12,
      west: -85,
      east: -75,
    },
    view: {
      lat: 8.5,
      lng: -80,
      zoom: 6,
    },
    scope: ['Panamá y alrededores', 'Panama and surrounding area'],
  },
  resources: [
    {
      name: 'Universidad Tecnológica de Panamá',
      category: ['Universidad · evacuación en campus', 'University · campus evacuation'],
      description: [
        'La FIM publica rutas y puntos de encuentro del Edificio 1. Uso del campus; no confirma acceso ni refugio para turistas.',
        'FIM publishes Building 1 evacuation routes and assembly points. Campus use; tourist access or shelter is not confirmed.',
      ],
      url: 'https://fim.utp.ac.pa/protocolos-de-evacuacion',
      reviewedAt: '2026-10-11',
    },
    {
      name: 'Alcaldía de Panamá · Gestión Social',
      category: ['Municipalidad · respuesta local', 'Municipality · local response'],
      description: [
        'Información municipal sobre apoyo social y respuesta a emergencias. Consulta directamente la atención disponible.',
        'Municipal information on social support and emergency response. Check current services directly.',
      ],
      url: 'https://mupa.gob.pa/mupa-directores/directora-de-gestion-social/',
      reviewedAt: '2026-10-11',
    },
    {
      name: 'Alcaldía de Panamá · Resiliencia',
      category: ['Municipalidad · gestión de riesgos', 'Municipality · risk management'],
      description: [
        'Plan municipal 2020–2030. Documento de planificación; no es un listado de refugios abiertos.',
        'Municipal plan 2020–2030. Planning document; not a list of open shelters.',
      ],
      url: 'https://resiliencia.mupa.gob.pa/wp-content/uploads/2022/08/Plan-de-Gestion-de-Riesgo-2020_Banco-Mundial.pdf',
      reviewedAt: '2026-10-11',
    },
    {
      name: 'Mingob · AMUPA',
      category: ['Municipios · coordinación', 'Municipalities · coordination'],
      description: [
        'Información oficial sobre preparación de los municipios. No es una convocatoria de voluntariado.',
        'Official information on municipal preparedness. This is not a volunteer opening.',
      ],
      url: 'https://www.mingob.gob.pa/mingob-y-amupa-refuerzan-la-gestion-de-riesgos-y-preparacion-de-los-municipios-ante-emergencias/',
      reviewedAt: '2026-10-11',
    },
  ],
} satisfies Destination;
