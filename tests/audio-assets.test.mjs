import assert from 'node:assert/strict';
import { access, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { MISSIONS } from '../src/data/missions/manifest.js';
import { audioPathsForSlide } from '../src/js/audio.js';

test('десять миссий содержат полный комплект из 340 MP3', async () => {
  const paths = MISSIONS.flatMap((mission) =>
    mission.slides.flatMap((slide) => Object.values(audioPathsForSlide(mission.id, slide))),
  );

  assert.equal(paths.length, 340);
  assert.equal(new Set(paths).size, 340);
  for (const relativePath of paths) {
    assert.equal(relativePath.endsWith('.mp3'), true);
    const absolutePath = fileURLToPath(new URL(`../src/${relativePath}`, import.meta.url));
    await access(absolutePath);
    assert.equal((await stat(absolutePath)).size > 0, true);
  }
});

test('интерфейс сообщает, что голос создан ИИ', async () => {
  const source = await import('../src/screens/settings.js');
  assert.match(source.renderSettings({
    sound: true,
    volume: 0.8,
    voice: true,
    speechRate: 'normal',
    subtitles: true,
    reducedMotion: false,
    age: '7-9',
    mode: 'solo',
  }), /озвучка создана ИИ/i);
});

test('MP3 всех миссий входят в автономный кэш', async () => {
  const source = await import('node:fs/promises').then(({ readFile }) =>
    readFile(new URL('../src/sw.js', import.meta.url), 'utf8'),
  );
  assert.match(source, /MISSION_AUDIO/);
  assert.match(source, /\.\.\.MISSION_AUDIO/);
});
