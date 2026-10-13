import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { answerQuestion, canAdvance, createMissionState, nextSlide } from '../src/js/mission-state.js';

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

test('ошибочный признак не добавляет общую реплику к следующим вариантам',()=>{
  const slide={kind:'question',selection:'multiple',correctSet:[0,1,2]};
  let state=createMissionState(1);
  state=answerQuestion(state,slide,3);
  assert.deepEqual(state.selected,[3]);
  assert.equal(state.feedback,null);
  state=answerQuestion(state,slide,1);
  assert.deepEqual(state.selected,[3,1]);
  assert.equal(state.feedback,null);
});

test('выбранные варианты ответа имеют заметное состояние',async()=>{
  const comic=await readFile(new URL('../src/styles/comic.css',import.meta.url),'utf8');
  assert.match(comic,/\.answer\.selected\{[^}]+\}/);
});
