import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { MISSIONS } from '../src/data/missions/manifest.js';
import test from 'node:test';
import { Script } from 'node:vm';

test('PWA устанавливается как русское автономное приложение',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/manifest.webmanifest',import.meta.url),'utf8'));
 assert.equal(manifest.lang,'ru');
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.start_url,'./');
 assert.equal(manifest.icons.length>0,true);
});

test('service worker устанавливает оболочку независимо от тяжёлых файлов миссий',async()=>{
 const source=await readFile(new URL('../src/sw.js',import.meta.url),'utf8');
 assert.match(source,/MISSION_ASSETS/);
 assert.match(source,/10/);
 assert.match(source,/8/);
 assert.match(source,/addAll/);
 assert.match(source,/addAll\(APP_SHELL\)/);
 assert.doesNotMatch(source,/addAll\(\[\.\.\.APP_SHELL,\.\.\.MISSION_ASSETS/);
 assert.match(source,/fetch/);
 assert.doesNotThrow(()=>new Script(source));
 const shell=source.match(/const APP_SHELL=\[(.*?)\];/s)?.[1]||'';
 const references=[...shell.matchAll(/'([^']+)'/g)].map(match=>match[1]).filter(path=>path!=='./');
 for(const path of references)await access(fileURLToPath(new URL(`../src/${path}`,import.meta.url)));
 for(const mission of MISSIONS)for(const slide of mission.slides)await access(fileURLToPath(new URL(`../src/${slide.image}`,import.meta.url)));
});

test('страница принудительного обновления удаляет старый worker и его кэши',async()=>{
 const source=await readFile(new URL('../src/update.html',import.meta.url),'utf8');
 assert.match(source,/getRegistrations/);
 assert.match(source,/unregister/);
 assert.match(source,/caches\.keys/);
 assert.match(source,/location\.replace/);
});

test('обновлённый service worker сразу заменяет старый кэш и перезагружает открытое приложение',async()=>{
 const source=await readFile(new URL('../src/sw.js',import.meta.url),'utf8');
 const listeners={};
 const deleted=[];
 const navigated=[];
 let skipped=false;
 const currentCache=source.match(/const CACHE_NAME='([^']+)'/)?.[1];
 const client={url:'https://example.test/KiberKvest/',navigate:async(url)=>{navigated.push(url);}};
 const context={
  caches:{
   open:async()=>({addAll:async()=>{}}),
   keys:async()=>['kiberkvest-shell-old',currentCache],
   delete:async(key)=>{deleted.push(key);return true;},
  },
  self:{
   addEventListener:(type,handler)=>{listeners[type]=handler;},
   skipWaiting:()=>{skipped=true;},
   clients:{claim:async()=>{},matchAll:async()=>[client]},
  },
 };
 new Script(source).runInNewContext(context);
 let installWork;
 listeners.install({waitUntil:(work)=>{installWork=work;}});
 await installWork;
 assert.equal(skipped,true);
 let activateWork;
 listeners.activate({waitUntil:(work)=>{activateWork=work;}});
 await activateWork;
 assert.deepEqual(deleted,['kiberkvest-shell-old']);
 assert.deepEqual(navigated,[client.url]);
});

test('страница, стили и скрипты проверяются в сети раньше старого кэша',async()=>{
 const worker=await readFile(new URL('../src/sw.js',import.meta.url),'utf8');
 const main=await readFile(new URL('../src/js/main.js',import.meta.url),'utf8');
 assert.match(worker,/request\.destination==='script'/);
 assert.match(worker,/request\.destination==='style'/);
 assert.match(worker,/networkFirst/);
 assert.match(main,/updateViaCache:'none'/);
});

test('исправления миссии загружаются по новым адресам, минуя старый кэш браузера',async()=>{
 const index=await readFile(new URL('../src/index.html',import.meta.url),'utf8');
 const main=await readFile(new URL('../src/js/main.js',import.meta.url),'utf8');
 assert.match(index,/src="js\/main\.js\?v=20261024-2"/);
 assert.match(main,/from '\.\.\/data\/missions\/manifest\.js\?v=20261024-2'/);
 assert.match(main,/from '\.\/audio\.js\?v=20261024-2'/);
 assert.match(main,/from '\.\/mission-state\.js\?v=20261024-2'/);
 assert.match(main,/from '\.\.\/screens\/mission-player\.js\?v=20261024-2'/);
});
