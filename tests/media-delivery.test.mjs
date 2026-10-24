import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import { cacheMission } from '../src/js/storage.js';
import { MISSIONS } from '../src/data/missions/manifest.js';

async function workerFetch(request,{cached,fetcher=async()=>{throw new Error('offline');},failPut=false}={}){
 const listeners={};
 const source=await readFile(new URL('../src/sw.js',import.meta.url),'utf8');
 new Script(source).runInNewContext({
  Response,Headers,Request,URL,Uint8Array,
  fetch:fetcher,
  caches:{
   async match(req,options){
    // Model the browser Cache API's Vary check at the boundary.
    if(!cached)return undefined;
    if(cached.headers.has('Vary')&&!options?.ignoreVary&&typeof req!=='string'&&req.headers.has('Accept-Encoding'))return undefined;
    return cached.clone();
   },
   async open(){return {put:async()=>{if(failPut)throw new Error('cache write failed');}};},
  },
  self:{addEventListener:(name,handler)=>{listeners[name]=handler;}},
 });
 let response;
 listeners.fetch({request,respondWith:promise=>{response=promise;}});
 return response;
}

test('MP3 с GitHub Vary остаётся доступным для другого заголовка Accept-Encoding без сети',async()=>{
 const request=new Request('https://example.test/assets/audio/test.mp3',{headers:{'Accept-Encoding':'identity'}});
 const response=await workerFetch(request,{cached:new Response('recording',{headers:{'Content-Type':'audio/mp3','Vary':'Accept-Encoding'}})});
 assert.equal(response.status,200);assert.equal(await response.text(),'recording');
});

test('байтовый запрос проигрывателя получает нужный фрагмент скачанного MP3',async()=>{
 const request=new Request('https://example.test/assets/audio/test.mp3',{headers:{Range:'bytes=2-5','Accept-Encoding':'identity'}});
 const response=await workerFetch(request,{cached:new Response('0123456789',{headers:{'Content-Type':'audio/mp3','Vary':'Accept-Encoding'}})});
 assert.equal(response.status,206);assert.equal(response.headers.get('Content-Range'),'bytes 2-5/10');
 assert.equal(response.headers.get('Content-Length'),'4');assert.equal(await response.text(),'2345');
});

test('недоступный диапазон даёт 416 вместо повреждённой записи',async()=>{
 const response=await workerFetch(new Request('https://example.test/test.mp3',{headers:{Range:'bytes=20-'}}),{cached:new Response('0123456789')});
 assert.equal(response.status,416);assert.equal(response.headers.get('Content-Range'),'bytes */10');
});

test('сетевой ответ 206 не теряется из-за запрета Cache API на частичные ответы',async()=>{
 const response=await workerFetch(new Request('https://example.test/test.mp3',{headers:{Range:'bytes=0-3'}}),{fetcher:async()=>new Response('0123',{status:206,headers:{'Content-Range':'bytes 0-3/10'}}),failPut:true});
 assert.equal(response.status,206);assert.equal(await response.text(),'0123');
});

test('неудачная запись кэша не заменяет успешный ответ сервера ошибкой',async()=>{
 const response=await workerFetch(new Request('https://example.test/test.mp3'),{fetcher:async()=>new Response('recording'),failPut:true});
 assert.equal(response.status,200);assert.equal(await response.text(),'recording');
});

test('новая загрузка удаляет транспортный Vary из сохранённого медиа',async()=>{
 const entries=new Map();
 const cacheStorage={open:async()=>({put:async(path,response)=>entries.set(path,response)}),delete:async()=>true};
 await cacheMission(MISSIONS[0],()=>{},{cacheStorage,fetcher:async path=>new Response('media',{headers:{'Content-Type':path.includes('.mp3')?'audio/mp3':'image/webp','Vary':'Accept-Encoding'}})});
 const response=entries.get('assets/audio/mission-01/slide-02-answer-a.mp3');
 assert.equal(response.headers.has('Vary'),false);
});
