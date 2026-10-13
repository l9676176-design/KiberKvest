const CACHE_NAME='kiberkvest-shell-2026.09-audio';
const APP_SHELL=['./','index.html','manifest.webmanifest','data/version.json','data/missions/manifest.js','data/missions/types.js','js/main.js','js/router.js','js/startup.js','js/network.js','js/preferences.js','js/storage.js','js/mission-state.js','js/audio.js','js/modes/index.js','js/modes/solo.js','js/modes/family.js','js/modes/classroom.js','screens/shared.js','screens/loading.js','screens/offline.js','screens/mode.js','screens/age.js','screens/menu.js','screens/library.js','screens/downloads.js','screens/settings.js','screens/mission-player.js','screens/result.js','styles/tokens.css','styles/layout.css','styles/comic.css','styles/accessibility.css','assets/ui/kiberkvest-splash.webp','assets/ui/kiberkvest-mode-selection.webp','assets/ui/icon.svg'];
const MISSION_ASSETS=Array.from({length:10},(_,missionIndex)=>Array.from({length:8},(_,slideIndex)=>`assets/missions/mission-${String(missionIndex+1).padStart(2,'0')}/page-${slideIndex+1}.webp`)).flat();
const MISSION_AUDIO=Array.from({length:10},(_,missionIndex)=>{
 const mission=String(missionIndex+1).padStart(2,'0');
 return [
  ...Array.from({length:8},(_,index)=>`assets/audio/mission-${mission}/slide-${String(index+1).padStart(2,'0')}-scene.mp3`),
  ...Object.entries({2:3,3:3,4:3,5:4,6:3}).flatMap(([slide,count])=>[
   ...Array.from({length:count},(_,index)=>`assets/audio/mission-${mission}/slide-${String(slide).padStart(2,'0')}-answer-${['a','b','c','d'][index]}.mp3`),
   `assets/audio/mission-${mission}/slide-${String(slide).padStart(2,'0')}-correct.mp3`,
   `assets/audio/mission-${mission}/slide-${String(slide).padStart(2,'0')}-wrong.mp3`
  ])
 ];
}).flat();

self.addEventListener('install',(event)=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll([...APP_SHELL,...MISSION_ASSETS,...MISSION_AUDIO])));});
self.addEventListener('activate',(event)=>{event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('kiberkvest-shell-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))),self.clients.claim().then(()=>self.clients.matchAll()).then(clients=>clients.forEach(client=>client.postMessage({type:'UPDATE_READY'}))) ]));});
self.addEventListener('fetch',(event)=>{
 if(event.request.method!=='GET')return;
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>event.request.mode==='navigate'?caches.match('index.html'):new Response('Материал пока не скачан',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}}))));
});
