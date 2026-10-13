import assert from 'node:assert/strict';
import test from 'node:test';
import { DOWNLOAD_STATES, commitMissionVersion } from '../src/js/storage.js';

test('поддерживаются пять состояний загрузки',()=>{
  assert.deepEqual(DOWNLOAD_STATES,['not-downloaded','downloading','downloaded','update-available','error']);
});

test('неполная новая версия не заменяет старую',()=>{
  const oldVersion={version:'1',files:['a.png']};
  assert.equal(commitMissionVersion(oldVersion,{version:'2',files:['b.png'],complete:false}),oldVersion);
  assert.deepEqual(commitMissionVersion(oldVersion,{version:'2',files:['b.png'],complete:true}),{version:'2',files:['b.png'],complete:true});
});
