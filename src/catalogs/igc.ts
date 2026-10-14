import type { Quake } from '../lib/domain.ts';
import { adapterReader, validAdapterEvent } from './adapter.ts';

const hosts = ['sismosgeociencias.up.ac.pa'];

export function validIGCEvent(value: unknown): value is Quake {
  return validAdapterEvent(value, 'IGC', hosts);
}

export const igcReader = adapterReader('/api/igc', 'IGC', hosts, 'faro-igc-v1');
