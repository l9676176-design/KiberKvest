import assert from 'node:assert/strict';
import test from 'node:test';
import { MISSIONS } from '../src/data/missions/manifest.js';
import * as storage from '../src/js/storage.js';
import * as audio from '../src/js/audio.js';

// Browser APIs are replaced only at the storage/audio boundary; production functions run unchanged.
function memoryCaches(){
 const stores=new Map();
 return {
  async keys(){return [...stores.keys()];},
  async delete(name){return stores.delete(name);},
  async open(name){
   if(!stores.has(name))stores.set(name,new Map());
   const entries=stores.get(name);
   return {
    async add(path){entries.set(path,new Response('media'));},
    async put(path,response){entries.set(typeof path==='string'?path:path.url,response.clone());},
    async match(path){return entries.get(typeof path==='string'?path:path.url)?.clone();},
    async keys(){return [...entries.keys()].map(url=>({url}));},
   };
  },
 };
}

test('скачивание сохраняет MP3 каждой сцены и ответов вместе с картинками',async()=>{
 const cacheStorage=memoryCaches();const old=globalThis.caches;globalThis.caches=cacheStorage;
 try{
  const result=await storage.cacheMission(MISSIONS[0],()=>{},{cacheStorage,fetcher:async path=>new Response('media',{headers:{'Content-Type':path.includes('.mp3')?'audio/mpeg':'image/webp'}})});
  for(const path of ['assets/missions/mission-01/page-8.webp','assets/audio/mission-01/slide-08-scene.mp3','assets/audio/mission-01/slide-05-answer-d.mp3','assets/audio/mission-01/slide-06-wrong.mp3'])assert.ok(result.files.includes(path),`В автономном комплекте отсутствует ${path}`);
  assert.equal(result.complete,true);
 }finally{globalThis.caches=old;}
});

test('отмена прерывает скачивание и удаляет неполный комплект',async()=>{
 const cacheStorage=memoryCaches();const old=globalThis.caches;globalThis.caches=cacheStorage;
 try{
  const controller=new AbortController();controller.abort();
  await assert.rejects(storage.cacheMission(MISSIONS[0],()=>{},{cacheStorage,signal:controller.signal,fetcher:async()=>new Response('media')}),{name:'AbortError'});
  assert.deepEqual(await cacheStorage.keys(),[]);
 }finally{globalThis.caches=old;}
});

test('страница HTML вместо MP3 не считается успешной загрузкой',async()=>{
 const cacheStorage=memoryCaches();const old=globalThis.caches;globalThis.caches=cacheStorage;
 try{
  await assert.rejects(storage.cacheMission(MISSIONS[0],()=>{},{cacheStorage,fetcher:async()=>new Response('<html>not found</html>',{headers:{'Content-Type':'text/html'}})}));
  assert.deepEqual(await cacheStorage.keys(),[]);
 }finally{globalThis.caches=old;}
});

test('миссия без подтверждённого комплекта не помечается скачанной',()=>{
 assert.equal(storage.missionDownloadState({},1),'not-downloaded');
 assert.equal(storage.missionDownloadState({1:{state:'downloaded',files:['old-image.webp']}},1),'update-available');
});

test('выключенный звук запрещает запись, очередь, системную речь и фанфару',()=>{
 assert.equal(typeof audio.setSoundEnabled,'function','Нужен единый выключатель для всех путей воспроизведения');
 const original={Audio:globalThis.Audio,speechSynthesis:globalThis.speechSynthesis};let played=0;
 globalThis.Audio=class{play(){played++;return Promise.resolve();}pause(){}};
 globalThis.speechSynthesis={cancel(){},speak(){played++;}};
 try{
  audio.setSoundEnabled(false);
  assert.equal(audio.playRecorded('scene.mp3'),false);
  assert.equal(audio.playRecordedSequence([{path:'scene.mp3',text:'Реплика'}]),false);
  assert.equal(audio.speak('Реплика'),false);
  assert.equal(audio.playFanfare(),false);
  assert.equal(played,0);
 }finally{audio.setSoundEnabled(true);for(const [key,value] of Object.entries(original)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});

test('авточтение не запускается, когда звук выключен',()=>{
 assert.equal(audio.shouldAutoNarrate({sound:false,mode:'solo',age:'7-9',voice:true,interacted:true}),false);
});

test('индивидуальное пояснение имеет собственную запись для автономной игры',()=>{
 const slide=MISSIONS[1].slides[1];
 const result=audio.feedbackForAnswer({slide,paths:audio.audioPathsForSlide(2,slide),answerIndex:1,feedback:'wrong'});
 assert.match(result.path||'',/slide-02-wrong-b\.mp3$/);
});

test('выключение звука останавливает уже звучащую фанфару',()=>{
 let closed=0;
 const context={currentTime:0,close(){closed++;return Promise.resolve();},createOscillator(){return {frequency:{value:0},connect(){return {connect(){}};},start(){},stop(){}};},createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}};}};
 audio.setSoundEnabled(true);audio.playFanfare(context);audio.setSoundEnabled(false);
 assert.equal(closed,1);
 audio.setSoundEnabled(true);
});

test('неудачное обновление не повреждает предыдущий рабочий комплект',async()=>{
 const cacheStorage=memoryCaches();
 const fetcher=async path=>new Response('media',{headers:{'Content-Type':path.includes('.mp3')?'audio/mpeg':'image/webp'}});
 const previous=await storage.cacheMission(MISSIONS[0],()=>{},{cacheStorage,fetcher});
 let calls=0;
 await assert.rejects(storage.cacheMission(MISSIONS[0],()=>{},{cacheStorage,fetcher:async path=>{if(++calls===3)throw new Error('network failed');return fetcher(path);}}));
 assert.deepEqual(await cacheStorage.keys(),[previous.cacheName]);
 assert.equal(await storage.verifyMissionDownload(MISSIONS[0],previous,cacheStorage),true);
});

test('после закрытия вкладки во время обновления старый полный комплект снова доступен',async()=>{
 assert.equal(typeof storage.recoverDownloads,'function');
 const cacheStorage=memoryCaches();
 const previous=await storage.cacheMission(MISSIONS[0],()=>{},{cacheStorage,fetcher:async path=>new Response('media',{headers:{'Content-Type':path.includes('.mp3')?'audio/mpeg':'image/webp'}})});
 const restored=await storage.recoverDownloads(MISSIONS,{1:{...previous,state:'downloading',progress:40}},cacheStorage);
 assert.equal(restored[1].state,'downloaded');
 assert.equal(await storage.verifyMissionDownload(MISSIONS[0],restored[1],cacheStorage),true);
});
