import assert from 'node:assert/strict';
import test from 'node:test';

import { MISSIONS, validateMissionCatalog } from '../app/data/missions/manifest.js';

test('каталог содержит десять полноценных миссий с балансом категорий 5/5', () => {
  const result = validateMissionCatalog(MISSIONS);

  assert.deepEqual(result, {
    missionCount: 10,
    socialCount: 5,
    digitalCount: 5,
    invalidMissions: [],
  });
});

test('каждая миссия содержит восемь страниц и пять вопросов', () => {
  for (const mission of MISSIONS) {
    assert.equal(mission.slides.length, 8, mission.title);
    assert.equal(
      mission.slides.filter((slide) => slide.kind === 'question').length,
      5,
      mission.title,
    );
  }
});
