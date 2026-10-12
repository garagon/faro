// Directories by citizenship, distinct from missions physically located in a destination.
// These links do not assert that a mission exists at a particular address.
export const consularDirectories: Record<
  string,
  { url: string; label: [string, string]; reviewedAt: string }
> = {
  AR: {
    url: 'https://cancilleria.gob.ar/es/emergencia-consular',
    label: ['Directorio consular de Argentina', 'Argentina consular directory'],
    reviewedAt: '2026-10-11',
  },
  CL: {
    url: 'https://www.chile.gob.cl/consulados',
    label: ['Consulados de Chile', 'Chilean consulates'],
    reviewedAt: '2026-10-12',
  },
  CO: {
    url: 'https://www.cancilleria.gov.co/directorio-institucional',
    label: ['Directorio consular de Colombia', 'Colombia consular directory'],
    reviewedAt: '2026-10-12',
  },
  MX: {
    url: 'https://portales.sre.gob.mx/directorio/buscar',
    label: ['Embajadas y consulados de México', 'Mexican embassies and consulates'],
    reviewedAt: '2026-10-12',
  },
  ES: {
    url: 'https://exteriores.gob.es/es/EmbajadasConsulados/Paginas/index.aspx',
    label: ['Embajadas y consulados de España', 'Spanish embassies and consulates'],
    reviewedAt: '2026-10-12',
  },
  US: {
    url: 'https://www.usembassy.gov/',
    label: ['Embajadas y consulados de Estados Unidos', 'U.S. embassies and consulates'],
    reviewedAt: '2026-10-12',
  },
};
