import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'));
const packages = [];
const notices = [];
for (const [path, pkg] of Object.entries(lock.packages)) {
  if (!path) continue;
  if (!pkg.license) throw new Error(`Missing license metadata: ${path}`);
  const name = path.split('node_modules/').at(-1);
  packages.push({ name, version: pkg.version, license: pkg.license, development: !!pkg.dev });
  try {
    const entries = await readdir(join(root, path));
    for (const file of entries
      // Also names like MIT-LICENCE.txt (leaflet.markercluster) or LICENSE-MIT.
      .filter((n) => /^([\w]+-)?(license|licence|copying|notice)([.-][\w-]+)*$/i.test(n))
      .sort()) {
      notices.push(
        `===== ${name}@${pkg.version} (${file}) =====\n\n${await readFile(join(root, path, file), 'utf8')}`,
      );
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
packages.sort(
  (a, b) => a.name.localeCompare(b.name, 'en') || a.version.localeCompare(b.version, 'en'),
);
await writeFile(join(root, 'docs/dependencies.json'), JSON.stringify(packages, null, 2) + '\n');
await writeFile(
  join(root, 'licenses/dependencies.txt'),
  notices
    .join('\n\n')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .trimEnd() + '\n',
);
console.log(
  `Inventoried ${packages.length} dependency entries; retained ${notices.length} installed license/notice files.`,
);
