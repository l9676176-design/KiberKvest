import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('адаптивные стили учитывают телефон, планшет, компьютер и проектор',async()=>{
 const layout=await readFile(new URL('../app/styles/layout.css',import.meta.url),'utf8');
 const comic=await readFile(new URL('../app/styles/comic.css',import.meta.url),'utf8');
 const all=layout+comic;
 for(const marker of ['safe-area-inset-bottom','max-width:600px','max-width:900px','min-width:1280px','aspect-ratio:16/9'])assert.match(all,new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
