import assert from 'node:assert/strict';
import { access, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { MISSIONS } from '../src/data/missions/manifest.js';
import * as audio from '../src/js/audio.js';

const { audioPathsForSlide } = audio;

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

test('выбор варианта озвучивается до итоговой реплики',()=>{
  assert.equal(typeof audio.answerPlaybackItems,'function');
  const paths={answer0:'answer-a.mp3',correct:'correct.mp3',wrong:'wrong.mp3'};
  assert.deepEqual(
    audio.answerPlaybackItems({paths,answerIndex:0,answerText:'Вариант А',feedback:null,feedbackText:''}),
    [{path:'answer-a.mp3',text:'Вариант А'}],
  );
  assert.deepEqual(
    audio.answerPlaybackItems({paths,answerIndex:0,answerText:'Вариант А',feedback:'correct',feedbackText:'Молодец'}),
    [{path:'answer-a.mp3',text:'Вариант А'},{path:'correct.mp3',text:'Молодец'}],
  );
});
