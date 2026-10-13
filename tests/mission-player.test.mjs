import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { MISSIONS } from '../src/data/missions/manifest.js';
import { answerQuestion, canAdvance, createMissionState, nextSlide } from '../src/js/mission-state.js';
import { renderMissionPlayer } from '../src/screens/mission-player.js';

test('ошибка блокирует переход, правильный ответ открывает его',()=>{
  const slide={kind:'question',selection:'single',correct:1};
  let state=createMissionState(2);
  state=answerQuestion(state,slide,0);
  assert.equal(state.feedback,'wrong');
  assert.equal(canAdvance(state,slide),false);
  state=answerQuestion(state,slide,1);
  assert.equal(state.feedback,'correct');
  assert.equal(canAdvance(state,slide),true);
});

test('вопрос с признаками требует точное множество из трёх ответов',()=>{
  const slide={kind:'question',selection:'multiple',correctSet:[0,1,2]};
  let state=createMissionState(1);
  state=answerQuestion(state,slide,0);
  assert.deepEqual(state.selected,[0]);
  state=answerQuestion(state,slide,1);
  assert.deepEqual(state.selected,[0,1]);
  assert.equal(canAdvance(state,slide),false);
  state=answerQuestion(state,slide,2);
  assert.deepEqual(state.selected,[0,1,2]);
  assert.equal(canAdvance(state,slide),true);
  assert.equal(nextSlide(state,8).slide,2);
});

test('неверный признак показывает ошибку, но не мешает выбирать правильные',()=>{
  const slide={kind:'question',selection:'multiple',correctSet:[0,1,2]};
  let state=createMissionState(1);
  state=answerQuestion(state,slide,0);
  state=answerQuestion(state,slide,3);
  assert.deepEqual(state.selected,[0]);
  assert.equal(state.wrongAnswer,3);
  assert.equal(state.feedback,'wrong');
  assert.equal(state.complete,false);
  state=answerQuestion(state,slide,1);
  assert.deepEqual(state.selected,[0,1]);
  assert.equal(state.wrongAnswer,null);
  assert.equal(state.feedback,null);
});

test('неверный вариант в вопросе 4 показывает БУМ, пояснение и выделение ошибки',()=>{
  const mission=MISSIONS[0];
  const slide=mission.slides[4];
  const state=answerQuestion(createMissionState(1,5),slide,3);
  const html=renderMissionPlayer(mission,state,{mode:'solo',subtitles:true});

  assert.match(html,/class="answer wrong" data-action="answer" data-answer="3"/);
  assert.match(html,/class="wrong-burst show"[^>]*>БУМ!<\/div>/);
  assert.match(html,/Погода не говорит о безопасности сообщения\./);
});

test('неверный ответ в миссии «Сообщение от папы» показывает своё точное пояснение',()=>{
  const mission=MISSIONS.find(({id})=>id===2);
  const slide=mission.slides.find(({id})=>id===3);
  const state=answerQuestion(createMissionState(2,3),slide,2);
  const html=renderMissionPlayer(mission,state,{mode:'solo',subtitles:true});

  assert.match(html,/Переводить деньги до проверки просьбы опасно\./);
  assert.doesNotMatch(html,/Нельзя проверять человека через тот же подозрительный чат\./);
});

test('выбранные варианты ответа имеют заметное состояние',async()=>{
  const comic=await readFile(new URL('../src/styles/comic.css',import.meta.url),'utf8');
  assert.match(comic,/\.answer\.selected\{[^}]+\}/);
});
