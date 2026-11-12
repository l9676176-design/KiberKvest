import assert from 'node:assert/strict';
import test from 'node:test';
import { loadPreferences, savePreferences } from '../src/js/preferences.js';

function memoryStorage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};}

test('режим, возраст и настройки сохраняются между запусками',()=>{
  const storage=memoryStorage();
  savePreferences(storage,{mode:'family',age:'7-12',autoNarrate:false,sound:false,subtitles:true,reducedMotion:true});
  const value=loadPreferences(storage);
  assert.equal(value.mode,'family');
  assert.equal(value.age,'7-12');
  assert.equal(value.autoNarrate,false);
  assert.equal(value.sound,false);
  assert.equal(value.subtitles,true);
  assert.equal(value.reducedMotion,true);
});

test('новому пользователю нужен явный выбор авточтения',()=>{
  const value=loadPreferences(memoryStorage());
  assert.equal(value.age,'7-12');
  assert.equal(value.autoNarrate,null);
});

test('старые настройки сохраняют поведение чтения и прогресс',()=>{
  for(const [age,expected] of [['7-9',true],['10-12',false]]){
    const storage=memoryStorage();
    storage.setItem('kiberkvest.preferences.v1',JSON.stringify({age,voice:false,sound:false,firstRun:false}));
    storage.setItem('kiberkvest.progress.1','{"slide":4}');
    const value=loadPreferences(storage);
    assert.equal(value.age,'7-12');
    assert.equal(value.autoNarrate,expected);
    assert.equal(value.voice,false);
    assert.equal(value.sound,false);
    assert.equal(value.firstRun,false);
    savePreferences(storage,{volume:0.3});
    assert.equal(loadPreferences(storage).autoNarrate,expected);
    assert.equal(storage.getItem('kiberkvest.progress.1'),'{"slide":4}');
  }
});
