import type { Destination } from './types.ts';
export default {
  code: 'PE',
  emergency: {
    source: 'https://www.gob.pe/547-telefonos-de-emergencia',
    agency: 'Gobierno del Perú',
    numbers: [
      {
        number: '105',
        label: ['Policía', 'Police'],
      },
      {
        number: '116',
        label: ['Bomberos', 'Fire department'],
      },
      {
        number: '106',
        label: ['SAMU · cobertura regional', 'SAMU · regional coverage'],
      },
    ],
    note: [
      'La cobertura de SAMU varía por región. Consulta la lista de regiones en la fuente oficial.',
      'SAMU coverage varies by region. Check the regional list in the official source.',
    ],
    reviewedAt: '2026-10-12',
  },
  civilProtection: {
    name: 'INDECI',
    url: 'https://www.gob.pe/indeci',
    reviewedAt: '2026-10-12',
  },
  seismicAgency: {
    name: 'IGP · Centro Sismológico Nacional',
    url: 'https://censis.igp.gob.pe/',
    reviewedAt: '2026-10-12',
  },
  region: {
    bounds: {
      south: -19,
      north: 1,
      west: -83,
      east: -68,
    },
    view: {
      lat: -9,
      lng: -75,
      zoom: 5,
    },
    scope: ['Perú y alrededores', 'Peru and surrounding area'],
  },
  resources: [],
} satisfies Destination;
