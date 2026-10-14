import type { OfficialLink } from './destinations/types.ts';
// Add only official directories; a listing never proves current operation or stock.
export const healthDirectories: Record<string, OfficialLink[]> = {
  PA: [
    {
      name: 'MINSA · Instalaciones de salud',
      url: 'https://instalaciones.minsa.gob.pa/',
      reviewedAt: '2026-10-12',
    },
    {
      name: 'MINSA · Avisos de atención',
      url: 'https://www.minsa.gob.pa/',
      reviewedAt: '2026-10-12',
    },
  ],
  GT: [
    {
      name: 'MSPAS · Establecimientos de salud',
      url: 'https://establecimientosdesalud.mspas.gob.gt/establecimientos/buscar-en-el-mapa.html',
      reviewedAt: '2026-10-13',
    },
  ],
  NI: [
    {
      name: 'MINSA · Red de Salud (establecimientos)',
      url: 'https://www.minsa.gob.ni/red-de-salud',
      reviewedAt: '2026-10-13',
    },
  ],
  CL: [
    {
      name: 'SENAPRED · Visor Chile Preparado (recintos de salud)',
      url: 'https://www.senapred.cl/visor-preparado/',
      reviewedAt: '2026-10-12',
    },
  ],
};
