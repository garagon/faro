import { fileURLToPath } from 'node:url';
import { collectPublicFiles } from './public-files.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = await collectPublicFiles(root);
console.log(
  `Publication check passed: ${files.length} allowed files, no matching secrets or private paths. This is a heuristic check, not a guarantee.`,
);
