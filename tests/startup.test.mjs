import assert from 'node:assert/strict';
import test from 'node:test';
import { SPLASH_MAX_MS, SPLASH_MIN_MS, determineStartup } from '../app/js/startup.js';
import { getOfflineState } from '../app/js/network.js';

test('заставка укладывается в диапазон 3,5–6 секунд',()=>{
  assert.equal(SPLASH_MIN_MS,3500);
  assert.equal(SPLASH_MAX_MS,6000);
});

test('первый и повторный запуск ведут на нужный экран',()=>{
  assert.equal(determineStartup({firstRun:true,online:true,downloadedCount:0}),'mode');
  assert.equal(determineStartup({firstRun:false,online:true,downloadedCount:10}),'menu');
});

test('офлайн различает наличие скачанных миссий',()=>{
  assert.equal(getOfflineState(false,2).canPlay,true);
  assert.equal(getOfflineState(false,0).canPlay,false);
  assert.equal(determineStartup({firstRun:false,online:false,downloadedCount:2}),'offline');
});
