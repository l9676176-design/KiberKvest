import assert from 'node:assert/strict';
import test from 'node:test';
import { ROUTES, buildRoute, parseRoute } from '../src/js/router.js';

test('маршрутизатор поддерживает все экраны из docs/brief.md', () => {
  assert.deepEqual(ROUTES, ['splash','loading','offline','mode','age','menu','library','downloads','mission','result','settings']);
});

test('маршрут миссии сохраняет номер и страницу', () => {
  const hash=buildRoute('mission',{mission:3,slide:5});
  assert.equal(hash,'#mission?mission=3&slide=5');
  assert.deepEqual(parseRoute(hash),{name:'mission',params:{mission:'3',slide:'5'}});
});
