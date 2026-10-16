import { adapterReader } from './adapter.ts';

// EMSC collects solutions from many national networks; `authority` keeps the credited agency.
export const emscReader = adapterReader(
  '/api/emsc',
  'EMSC',
  ['www.emsc-csem.org', 'www.seismicportal.eu'],
  'faro-emsc-v1',
);
