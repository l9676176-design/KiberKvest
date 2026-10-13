import assert from 'node:assert/strict';
import test from 'node:test';
import { getModeExperience } from '../src/js/modes/index.js';

test('один проигрыватель получает различия трёх режимов',()=>{
  assert.equal(getModeExperience('solo').helperHint.length>0,true);
  assert.equal(getModeExperience('family').discussionPrompt,true);
  assert.equal(getModeExperience('classroom').votePause,true);
  assert.deepEqual(getModeExperience('classroom').answerLabels,['А','Б','В','Г']);
});
