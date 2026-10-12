import { consularDirectories } from '../data/consularDirectories.ts';
export type Embassy = {
  id: string;
  nation: string;
  country: string;
  name: [string, string];
  address: string;
  lat: number;
  lng: number;
  source: string;
  mapSource: string;
  phone?: string;
  emergency?: string;
  emergencySource?: string;
  hours?: [string, string];
  note?: [string, string];
};
// Addresses checked with the sending states. Coordinates are approximate OSM building centroids, not entrances.
export const embassies: Embassy[] = [
  {
    id: 'ar-pa',
    nation: 'AR',
    country: 'PA',
    name: ['Embajada y sección consular de Argentina', 'Embassy and consular section of Argentina'],
    address: 'Calle 50, Edificio Global Bank, piso 24, Panamá',
    lat: 8.9840877,
    lng: -79.5166915,
    source: 'https://epnma.cancilleria.gob.ar/es/contacto-sede',
    mapSource: 'https://www.openstreetmap.org/way/894389293',
    phone: '+5073020003',
    emergency: '+50766161112',
    emergencySource: 'https://epnma.cancilleria.gob.ar/es/emergencia-celular-de-guardia',
    hours: [
      'Sección consular: lunes a viernes, 08:00–13:00, con cita previa (hora de Panamá).',
      'Consular section: Monday–Friday, 08:00–13:00, by appointment (Panama time).',
    ],
  },
  {
    id: 'co-pa',
    nation: 'CO',
    country: 'PA',
    name: ['Embajada de Colombia', 'Embassy of Colombia'],
    address: 'Punta Pacífica, Edificio Oceanía, Torre 2000, piso 17, oficina 17C, Panamá',
    lat: 8.9809386,
    lng: -79.5099599,
    source: 'https://panama.embajada.gov.co/acerca/atencion_usuario',
    mapSource: 'https://www.openstreetmap.org/way/785971625',
    note: [
      'La sección consular atiende en otra dirección. Consulta la fuente antes de ir.',
      'The consular section is at another address. Check the source before travelling.',
    ],
  },
  {
    id: 'us-pa',
    nation: 'US',
    country: 'PA',
    name: ['Embajada de Estados Unidos', 'Embassy of the United States'],
    address: 'Avenida Demetrio Basilio Lakas, edificio 783, Clayton, Panamá',
    lat: 8.9984337,
    lng: -79.5612701,
    source: 'https://travel.state.gov/en/international-travel/travel-advisories/panama.html',
    mapSource: 'https://www.openstreetmap.org/way/300882164',
  },
  {
    id: 'mx-pa',
    nation: 'MX',
    country: 'PA',
    name: ['Embajada de México', 'Embassy of Mexico'],
    address: 'Av. Samuel Lewis y Calle 58, edificio ADR, piso 10, Obarrio, Panamá',
    lat: 8.986889,
    lng: -79.5184137,
    source: 'https://embamex.sre.gob.mx/panama/index.php/contacto',
    mapSource: 'https://www.openstreetmap.org/way/382503815',
  },
  {
    id: 'es-pa',
    nation: 'ES',
    country: 'PA',
    name: ['Embajada de España', 'Embassy of Spain'],
    address: 'Palacio de España, Plaza Belisario Porras, Av. Perú y Calle 33 A, Panamá',
    lat: 8.9695274,
    lng: -79.5368682,
    source: 'https://www.exteriores.gob.es/Embajadas/panama/es/Embajada/Paginas/Contacto.aspx',
    mapSource: 'https://www.openstreetmap.org/way/157402115',
    note: [
      'Existe un traslado provisional anunciado sin fecha: confirma la sede antes de salir.',
      'A temporary move has been announced without a date: confirm the location before leaving.',
    ],
  },
];
export function directionsUrl(e: Embassy, mode: 'walking' | 'driving') {
  const q = new URLSearchParams({
    api: '1',
    destination: `${e.name[0]}, ${e.address}`,
    travelmode: mode,
  });
  return `https://www.google.com/maps/dir/?${q}`;
}

export function embassyFor(country: string, nationality: string): Embassy | undefined {
  return embassies.find((e) => e.country === country && e.nation === nationality);
}

export function consularFallback(
  country: string,
  nationality: string,
): { url: string; label: [string, string]; note?: [string, string] } | null {
  if (country === 'PA' && nationality === 'CL')
    return {
      url: 'https://www.consulado.gob.cl/emergencia-panama',
      label: ['Asistencia a chilenos en Panamá', 'Assistance for Chileans in Panama'],
      note: [
        'Información de la Cancillería de Chile publicada el 9 oct 2026. Consulta la página para ver sus canales y formularios.',
        'Chile’s foreign ministry information published Oct 9, 2026. See the page for channels and forms.',
      ],
    };
  if (Object.hasOwn(consularDirectories, nationality)) return consularDirectories[nationality];
  if (country === 'CL' && nationality)
    return {
      url: 'https://www.consulado.gob.cl/redes/consulados-extranjeros-en-chile',
      label: [
        'Directorio oficial de consulados en Chile',
        'Official directory of consulates in Chile',
      ],
    };
  return null;
}
