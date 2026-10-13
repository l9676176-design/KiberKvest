import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { MISSIONS } from '../src/data/missions/manifest.js';
import * as audio from '../src/js/audio.js';

const { audioPathsForSlide, feedbackForAnswer } = audio;

test('десять миссий содержат полный комплект из 340 MP3', async () => {
  const paths = MISSIONS.flatMap((mission) =>
    mission.slides.flatMap((slide) => Object.values(audioPathsForSlide(mission.id, slide))),
  );

  assert.equal(paths.length, 340);
  assert.equal(new Set(paths).size, 340);
  for (const relativePath of paths) {
    assert.match(relativePath, /\.mp3(?:\?v=[\d-]+)?$/);
    const absolutePath = fileURLToPath(new URL(`../src/${relativePath}`, import.meta.url));
    await access(absolutePath);
    assert.equal((await stat(absolutePath)).size > 0, true);
  }
});

test('неправильные ответы миссии «Сообщение от папы» получают точные пояснения', () => {
  const mission = MISSIONS.find(({ id }) => id === 2);
  const expected = new Map([
    [2, [null, 'Дождь не подтверждает личность отправителя.', 'Спортивная сумка не подтверждает личность отправителя.']],
    [3, ['Ответ незнакомому номеру не подтверждает, что пишет папа.', null, 'Переводить деньги до проверки просьбы опасно.']],
    [4, ['Скрывать случившееся опасно — нужно сразу позвать взрослого.', null, 'Продолжать разговор опасно — нужно сразу позвать взрослого.']],
    [6, ['Спорить с мошенником опасно — его нужно заблокировать и рассказать взрослому.', null, 'Удалять чат и молчать опасно — нужно заблокировать отправителя и рассказать взрослому.']],
  ]);

  for (const [slideId, badByAnswer] of expected) {
    const slide = mission.slides.find(({ id }) => id === slideId);
    assert.deepEqual(slide.badByAnswer, badByAnswer);
    const paths = audioPathsForSlide(mission.id, slide);
    badByAnswer.forEach((text, answerIndex) => {
      if (!text) return;
      assert.deepEqual(
        feedbackForAnswer({ slide, paths, answerIndex, feedback: 'wrong' }),
        { path: null, text },
      );
    });
  }
});

test('вариант В в вопросе 4 использует исправленную запись буквы В', async () => {
  const mission = MISSIONS.find(({ id }) => id === 2);
  const slide = mission.slides.find(({ id }) => id === 5);
  assert.equal(
    audioPathsForSlide(mission.id, slide).answer2,
    'assets/audio/mission-02/slide-05-answer-c.mp3?v=20261013-9',
  );
  const file = new URL('../src/assets/audio/mission-02/slide-05-answer-c.mp3', import.meta.url);
  const hash = createHash('sha256').update(await readFile(file)).digest('hex');
  assert.notEqual(hash, 'd81cd3bec99647004f773119c48164e4ba641ca1dc278cecb21d2a35f0064638');
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

test('MP3 миссий не блокируют установку обновления', async () => {
  const source = await import('node:fs/promises').then(({ readFile }) =>
    readFile(new URL('../src/sw.js', import.meta.url), 'utf8'),
  );
  assert.match(source, /MISSION_AUDIO/);
  assert.doesNotMatch(source, /addAll\(\[\.\.\.APP_SHELL,\.\.\.MISSION_ASSETS,\.\.\.MISSION_AUDIO\]\)/);
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

test('точное текстовое пояснение остаётся в очереди без отдельного MP3',()=>{
  assert.deepEqual(
    audio.answerPlaybackItems({
      paths:{answer2:'answer-c.mp3'},
      answerIndex:2,
      answerText:'Вариант В',
      feedback:'wrong',
      feedbackText:'Точное пояснение',
      feedbackPath:null,
    }),
    [{path:'answer-c.mp3',text:'Вариант В'},{path:null,text:'Точное пояснение'}],
  );
});

test('после записанного варианта текстовое пояснение произносится системным голосом',async()=>{
  const spoken=[];
  globalThis.Audio=class{
    pause(){}
    play(){queueMicrotask(()=>this.onended?.());return Promise.resolve();}
  };
  globalThis.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
  globalThis.speechSynthesis={
    cancel(){},
    speak(utterance){spoken.push(utterance.text);queueMicrotask(()=>utterance.onend?.());},
  };

  audio.playRecordedSequence([
    {path:'answer-c.mp3',text:'Вариант В'},
    {path:null,text:'Точное пояснение'},
  ]);
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.deepEqual(spoken,['Точное пояснение']);

  delete globalThis.Audio;
  delete globalThis.SpeechSynthesisUtterance;
  delete globalThis.speechSynthesis;
});

test('в вопросе 5 варианты Б и В запускают разные реплики до общей оценки',()=>{
  const paths={answer1:'slide-06-answer-b.mp3',answer2:'slide-06-answer-c.mp3',wrong:'slide-06-wrong.mp3'};
  const optionB=audio.answerPlaybackItems({
    paths,
    answerIndex:1,
    answerText:'Вариант Б. Просто удалить переписку',
    feedback:'wrong',
    feedbackText:'Одного удаления или спора недостаточно.',
  });
  const optionC=audio.answerPlaybackItems({
    paths,
    answerIndex:2,
    answerText:'Вариант В. Поспорить с мошенником',
    feedback:'wrong',
    feedbackText:'Одного удаления или спора недостаточно.',
  });

  assert.deepEqual(optionB.map(item=>item.path),['slide-06-answer-b.mp3','slide-06-wrong.mp3']);
  assert.deepEqual(optionC.map(item=>item.path),['slide-06-answer-c.mp3','slide-06-wrong.mp3']);
  assert.notEqual(optionB[0].path,optionC[0].path);
});

test('неверный ответ Г в вопросе 4 озвучивается вместе с объяснением ошибки',()=>{
  const slide=MISSIONS[0].slides[4];
  const paths=audio.audioPathsForSlide(1,slide);
  const items=audio.answerPlaybackItems({
    paths,
    answerIndex:3,
    answerText:`Вариант Г. ${slide.answers[3]}`,
    feedback:'wrong',
    feedbackText:slide.bad,
  });

  assert.deepEqual(items,[
    {path:'assets/audio/mission-01/slide-05-answer-d.mp3',text:'Вариант Г. Солнечная погода'},
    {path:'assets/audio/mission-01/slide-05-wrong.mp3',text:'Погода не говорит о безопасности сообщения.'},
  ]);
});

test('одиночный вопрос запускает собственную реплику выбранного варианта',async()=>{
  const main=await import('node:fs/promises').then(({readFile})=>
    readFile(new URL('../src/js/main.js',import.meta.url),'utf8'),
  );
  assert.doesNotMatch(main,/else\{playRecorded\(paths\[feedback\]/);
  assert.match(main,/playRecordedSequence\(answerPlaybackItems/);
});
