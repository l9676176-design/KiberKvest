import assert from 'node:assert/strict';
import test from 'node:test';
import { loadPreferences, savePreferences } from '../app/js/preferences.js';

function memoryStorage(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};}

test('режим, возраст и настройки сохраняются между запусками',()=>{
  const storage=memoryStorage();
  savePreferences(storage,{mode:'family',age:'10-12',sound:false,subtitles:true,reducedMotion:true});
  const value=loadPreferences(storage);
  assert.equal(value.mode,'family');
  assert.equal(value.age,'10-12');
  assert.equal(value.sound,false);
  assert.equal(value.subtitles,true);
  assert.equal(value.reducedMotion,true);
});
