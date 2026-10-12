import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const excludedDirectories = new Set([
  'node_modules',
  '.vercel',
  '.git',
  'dist',
  'coverage',
  'artifacts',
  'test-results',
  'playwright-report',
]);
const rootFiles = new Set([
  'README.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  'PRIVACY.md',
  'NOTICE',
  'LICENSE',
  'THIRD_PARTY_NOTICES.md',
  'AGENTS.md',
  'package.json',
  'package-lock.json',
  'index.html',
  'vite.config.ts',
  'tsconfig.json',
  'eslint.config.js',
  '.gitignore',
  '.gitattributes',
  '.editorconfig',
  '.prettierrc.json',
  '.prettierignore',
  '.nvmrc',
]);
export function isPublicFile(path) {
  return (
    rootFiles.has(path) ||
    /^(src|server|tests|scripts)\/[\w./-]+\.(tsx?|css|json|mjs|mts)$/.test(path) ||
    /^docs\/[\w./-]+\.(md|json)$/.test(path) ||
    /^licenses\/[\w.-]+\.txt$/.test(path) ||
    /^\.github\/[\w./-]+\.(yml|yaml|md)$/.test(path) ||
    [
      'public/faro-mark.svg',
      'public/data/coastline.json',
      'public/about.html',
      'public/robots.txt',
      'public/llms.txt',
      'public/illustrations/drop-cover-hold-es.png',
      'public/illustrations/drop-cover-hold-en.png',
    ].includes(path)
  );
}
const privatePath =
  /(?:[/\\]Users[/\\][^\s/\\]+|[/\\]home[/\\][^\s/\\]+|[/\\]var[/\\]folders[/\\]|[A-Z]:\\Users\\)/;
const patterns = [
  ['private filesystem path', privatePath],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['AWS access key', /AKIA[A-Z0-9]{16}/],
  [
    'service token',
    /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk-(?:proj|ant)-[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]{20,}|sk_live_[A-Za-z0-9]{20,})/,
  ],
  [
    'credential URL',
    /(?:postgres(?:ql)?|mongodb(?:\+srv)?|mysql|redis|amqps?):\/\/[^\s@]+:[^\s@]+@/,
  ],
  [
    'secret assignment',
    /\b(?:password|passwd|api_key|apiKey|auth_token|client_secret)\s*[:=]\s*['"][A-Za-z0-9_+/=-]{16,}['"]/,
  ],
];
export function sensitiveFindings(text) {
  return patterns.flatMap(([label, regex]) =>
    text
      .split('\n')
      .flatMap((line, index) => (regex.test(line) ? [{ label, line: index + 1 }] : [])),
  );
}
export async function collectPublicFiles(root) {
  const files = [];
  async function visit(directory = '') {
    for (const entry of await readdir(join(root, directory), { withFileTypes: true })) {
      if (excludedDirectories.has(entry.name) || entry.name === '.DS_Store') continue;
      const path = directory ? `${directory}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Symlinks cannot be published: ${path}`);
      if (entry.isDirectory()) {
        await visit(path);
        continue;
      }
      if (['vercel.json', '.vercelignore'].includes(entry.name)) continue;
      if (/^\.env(?:\.|$)/.test(entry.name) && entry.name !== '.env.example') continue;
      if (!isPublicFile(path)) throw new Error(`File outside publication allowlist: ${path}`);
      const findings = sensitiveFindings(await readFile(join(root, path), 'utf8'));
      if (findings.length)
        throw new Error(
          `${path}: ${findings.map((f) => `${f.label} at line ${f.line}`).join('; ')}`,
        );
      files.push(path);
    }
  }
  await visit();
  return files.sort();
}
