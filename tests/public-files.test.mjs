import test from 'node:test';
import assert from 'node:assert/strict';
import { isPublicFile, sensitiveFindings } from '../scripts/public-files.mjs';

test('publication allowlist excludes credentials, captures and local artifacts', () => {
  for (const path of [
    '.vercel/project.json',
    'vercel.json',
    '.vercelignore',
    '.env',
    '.env.local',
    'capture.png',
    'audit-launch/report.md',
    'node_modules/pkg/index.js',
    'public/secret.json',
    '.openai/hosting.json',
  ])
    assert.equal(isPublicFile(path), false, path);
  assert.equal(isPublicFile('src/components/WebMap.tsx'), true);
});
test('publication scan reports locations without echoing secret values', () => {
  const token = ['gh', 'p_', 'a'.repeat(36)].join('');
  const findings = sensitiveFindings(`const credential = '${token}';`);
  assert.equal(findings[0].label, 'service token');
  assert.equal(JSON.stringify(findings).includes(token), false);
  const privatePath = ['', 'Users', 'test-person', 'file.txt'].join('/');
  assert.equal(sensitiveFindings(privatePath)[0].label, 'private filesystem path');
  assert.deepEqual(sensitiveFindings('https://earthquake.usgs.gov/earthquakes/'), []);
});
