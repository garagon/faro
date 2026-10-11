export type Lang = 'es' | 'en';
export type Resource = {
  name: string;
  category: [string, string];
  description: [string, string];
  url: string;
  country: string;
};
export const resources: Resource[] = [
  {
    name: 'SENAPRED · Chile Preparado',
    country: 'CL',
    category: ['Protección civil · mapas oficiales', 'Civil protection · official maps'],
    description: [
      'Consulta amenazas, planos de evacuación y puntos de encuentro para localidades de Chile.',
      'Consult hazards, evacuation maps and assembly points for locations in Chile.',
    ],
    url: 'https://www.senapred.gov.cl/visor-chile-preparado/',
  },
  {
    name: 'SENAPRED · Planos de evacuación',
    country: 'CL',
    category: ['Evacuación por tsunami', 'Tsunami evacuation'],
    description: [
      'Planos oficiales por localidad. Comprueba la versión y sigue las indicaciones locales.',
      'Official local maps. Check the version and follow local instructions.',
    ],
    url: 'https://www.senapred.gov.cl/planos-de-evacuacion/',
  },
  {
    name: 'Universidad de Panamá · IGC',
    country: 'PA',
    category: ['Universidad · monitoreo sísmico', 'University · seismic monitoring'],
    description: [
      'Consulta la red sísmica nacional y sus reportes. No es un albergue.',
      'Consult the national seismic network and its reports. This is not a shelter.',
    ],
    url: 'https://sismosgeociencias.up.ac.pa/',
  },
  {
    name: 'Universidad Tecnológica de Panamá',
    country: 'PA',
    category: ['Universidad · evacuación en campus', 'University · campus evacuation'],
    description: [
      'La FIM publica rutas y puntos de encuentro del Edificio 1. Uso del campus; no confirma acceso ni refugio para turistas.',
      'FIM publishes Building 1 evacuation routes and assembly points. Campus use; tourist access or shelter is not confirmed.',
    ],
    url: 'https://fim.utp.ac.pa/protocolos-de-evacuacion',
  },
  {
    name: 'Alcaldía de Panamá · Gestión Social',
    country: 'PA',
    category: ['Municipalidad · respuesta local', 'Municipality · local response'],
    description: [
      'Información municipal sobre apoyo social y respuesta a emergencias. Consulta directamente la atención disponible.',
      'Municipal information on social support and emergency response. Check current services directly.',
    ],
    url: 'https://mupa.gob.pa/mupa-directores/directora-de-gestion-social/',
  },
  {
    name: 'Alcaldía de Panamá · Resiliencia',
    country: 'PA',
    category: ['Municipalidad · gestión de riesgos', 'Municipality · risk management'],
    description: [
      'Plan municipal 2020–2030. Documento de planificación; no es un listado de refugios abiertos.',
      'Municipal plan 2020–2030. Planning document; not a list of open shelters.',
    ],
    url: 'https://resiliencia.mupa.gob.pa/wp-content/uploads/2022/08/Plan-de-Gestion-de-Riesgo-2020_Banco-Mundial.pdf',
  },
  {
    name: 'Mingob · AMUPA',
    country: 'PA',
    category: ['Municipios · coordinación', 'Municipalities · coordination'],
    description: [
      'Información oficial sobre preparación de los municipios. No es una convocatoria de voluntariado.',
      'Official information on municipal preparedness. This is not a volunteer opening.',
    ],
    url: 'https://www.mingob.gob.pa/mingob-y-amupa-refuerzan-la-gestion-de-riesgos-y-preparacion-de-los-municipios-ante-emergencias/',
  },
  {
    name: 'SINAPROC',
    country: 'PA',
    category: ['Protección civil', 'Civil protection'],
    description: [
      'Avisos y recomendaciones de la autoridad nacional.',
      'Notices and guidance from the national authority.',
    ],
    url: 'https://www.sinaproc.gob.pa/',
  },
  {
    name: 'Servicio Geológico Colombiano',
    country: 'CO',
    category: ['Red sísmica nacional', 'National seismic network'],
    description: ['Reportes oficiales de actividad sísmica.', 'Official seismic activity reports.'],
    url: 'https://www.sgc.gov.co/sismos',
  },
  {
    name: 'USGS',
    country: '*',
    category: ['Fuente sísmica mundial', 'Global earthquake source'],
    description: [
      'Feed GeoJSON oficial, actualizado cada minuto. Cobertura variable según la región.',
      'Official GeoJSON feed, updated every minute. Coverage varies by region.',
    ],
    url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php',
  },
  {
    name: 'NOAA · Tsunami Warning Centers',
    country: 'US',
    category: ['Boletines de tsunami', 'Tsunami bulletins'],
    description: [
      'Consulta directamente los boletines y el área a la que aplican.',
      'Read official bulletins and their applicable areas directly.',
    ],
    url: 'https://www.tsunami.gov/',
  },
];
export type HotelPlan = {
  name: string;
  meeting: string;
  notes: string;
  lat: string;
  lng: string;
  savedAt: number;
  country: string;
};
export function validPlan(x: unknown): x is HotelPlan {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false;
  const p = x as Record<string, unknown>;
  return (
    !!p &&
    ['name', 'meeting', 'notes', 'lat', 'lng', 'country'].every((k) => typeof p[k] === 'string') &&
    Number.isFinite(p.savedAt)
  );
}
export function planCoordinates(p: HotelPlan | null): [number, number] | null {
  if (!p || !p.lat.trim() || !p.lng.trim()) return null;
  const lat = Number(p.lat),
    lng = Number(p.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? [lat, lng]
    : null;
}
