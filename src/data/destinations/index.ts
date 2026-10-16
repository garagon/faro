import type { Destination } from './types.ts';
import pa from './pa.ts';
import cl from './cl.ts';
import co from './co.ts';
import ar from './ar.ts';
import us from './us.ts';
import mx from './mx.ts';
import pe from './pe.ts';
import ec from './ec.ts';
import cr from './cr.ts';
import gt from './gt.ts';
import sv from './sv.ts';
import hn from './hn.ts';
import ni from './ni.ts';
import dom from './do.ts';

export const destinations: readonly Destination[] = [
  pa,
  cl,
  co,
  ar,
  us,
  mx,
  pe,
  ec,
  cr,
  gt,
  sv,
  hn,
  ni,
  dom,
];
const byCode = new Map(destinations.map((destination) => [destination.code, destination]));
export function destinationFor(code: string): Destination | undefined {
  return byCode.get(code);
}
