import assert from 'node:assert/strict';
import test from 'node:test';
import { canStartSound, shouldAutoNarrate } from '../src/js/audio.js';

test('звук не запускается до первого действия пользователя',()=>{
  assert.equal(canStartSound({sound:true,interacted:false}),false);
  assert.equal(canStartSound({sound:true,interacted:true}),true);
});

test('авточтение включается только в solo 7–9 после действия',()=>{
  assert.equal(shouldAutoNarrate({mode:'solo',age:'7-9',voice:true,interacted:true}),true);
  assert.equal(shouldAutoNarrate({mode:'family',age:'7-9',voice:true,interacted:true}),false);
});
