import assert from 'node:assert/strict';
import { access, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { MISSIONS } from '../app/data/missions/manifest.js';

test('браузерная версия использует компактные WebP-иллюстрации', async () => {
  const appRoot = fileURLToPath(new URL('../app/', import.meta.url));
  const images = MISSIONS.flatMap((mission) => mission.slides.map((slide) => slide.image));

  assert.equal(images.length, 80);
  assert.equal(images.every((path) => path.endsWith('.webp')), true);

  let totalBytes = 0;
  for (const relativePath of images) {
    const absolutePath = fileURLToPath(new URL(`../app/${relativePath}`, import.meta.url));
    await access(absolutePath);
    totalBytes += (await stat(absolutePath)).size;
  }

  const uiFiles = await readdir(`${appRoot}assets/ui`);
  assert.equal(uiFiles.includes('kiberkvest-splash.webp'), true);
  assert.equal(uiFiles.includes('kiberkvest-mode-selection.webp'), true);
  assert.equal(totalBytes < 35 * 1024 * 1024, true);
});
