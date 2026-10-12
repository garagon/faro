import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { installPlatform } from '../src/lib/install.ts';

test('installation help recognizes iOS including iPad desktop user agents', () => {
  assert.equal(installPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'ios');
  assert.equal(installPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 5), 'ios');
  assert.equal(installPlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X)', 0), 'desktop');
  assert.equal(installPlatform('Mozilla/5.0 (Linux; Android 15)'), 'android');
  assert.equal(installPlatform('Unknown browser'), 'desktop');
});
test('install manifest stays on its host and includes valid phone icon sizes', async () => {
  const manifest = JSON.parse(
    await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'),
  );
  assert.equal(manifest.start_url, '/');
  assert.equal(manifest.scope, '/');
  assert.equal(manifest.id, '/');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.prefer_related_applications, false);
  for (const size of [192, 512]) {
    const icon = manifest.icons.find(
      (entry: { sizes: string }) => entry.sizes === `${size}x${size}`,
    );
    assert.ok(icon);
    assert.equal(icon.src, `/icons/icon-${size}.png`);
    const bytes = await readFile(new URL(`../public${icon.src}`, import.meta.url));
    assert.equal(bytes.readUInt32BE(16), size);
    assert.equal(bytes.readUInt32BE(20), size);
  }
  const apple = await readFile(new URL('../public/icons/apple-touch-icon.png', import.meta.url));
  assert.equal(apple.readUInt32BE(16), 180);
  assert.equal(apple.readUInt32BE(20), 180);
});
