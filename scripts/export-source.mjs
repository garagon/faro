import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { create } from 'tar';
import { collectPublicFiles } from './public-files.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = await collectPublicFiles(root);
const dir = join(root, 'artifacts');
await mkdir(dir, { recursive: true });
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const manifest = [];
for (const path of files) manifest.push({ path, sha256: sha256(await readFile(join(root, path))) });
await writeFile(join(dir, 'source-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const archive = join(dir, 'faro-source.tar.gz');
await create({ cwd: root, file: archive, gzip: true, portable: true, noMtime: true }, files);
await writeFile(
  join(dir, 'faro-source.tar.gz.sha256'),
  `${sha256(await readFile(archive))}  faro-source.tar.gz\n`,
);
console.log(
  `Prepared ${files.length} reviewed source files in artifacts/faro-source.tar.gz. No publication action performed.`,
);
