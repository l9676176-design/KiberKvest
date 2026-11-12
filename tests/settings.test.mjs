import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { canStartSound, shouldAutoNarrate } from '../src/js/audio.js';

test('звук не запускается до первого действия пользователя',()=>{
  assert.equal(canStartSound({sound:true,interacted:false}),false);
  assert.equal(canStartSound({sound:true,interacted:true}),true);
});

test('авточтение зависит от выбора, режима и разрешений звука',()=>{
  const enabled={sound:true,mode:'solo',age:'7-12',autoNarrate:true,voice:true,interacted:true};
  assert.equal(shouldAutoNarrate(enabled),true);
  for(const patch of [{autoNarrate:false},{autoNarrate:null},{mode:'family'},{mode:'classroom'},{voice:false},{sound:false},{interacted:false}]){
    assert.equal(shouldAutoNarrate({...enabled,...patch}),false);
  }
});

test('изменение настроек обрабатывается одним слушателем',async()=>{
  const main=await readFile(new URL('../src/js/main.js',import.meta.url),'utf8');
  assert.equal((main.match(/app\.addEventListener\('change'/g)||[]).length,1);
});
