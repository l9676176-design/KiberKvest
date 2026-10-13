import assert from 'node:assert/strict';
import test from 'node:test';
import { MISSIONS } from '../src/data/missions/manifest.js';
import { renderLibrary } from '../src/screens/library.js';
import { renderMenu } from '../src/screens/menu.js';
import { renderMode } from '../src/screens/mode.js';

test('выбор режима содержит три утверждённых режима',()=>{
 const html=renderMode();
 for(const label of ['Я играю сам','Играем семьёй','Урок в классе'])assert.match(html,new RegExp(label));
});

test('главное меню содержит утверждённые действия',()=>{
 const html=renderMenu({mode:'solo',age:'7-9'},null,true);
 for(const label of ['Выбрать миссию','Семейный режим','Режим класса','Настройки','Загрузки и обновления'])assert.match(html,new RegExp(label));
});

test('библиотека показывает десять миссий',()=>{
 const html=renderLibrary(MISSIONS,{},'all');
 assert.equal((html.match(/class="mission-card/g)||[]).length,10);
});
