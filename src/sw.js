const CACHE_NAME='kiberkvest-shell-2026.10-multiple-wrong-feedback';
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

self.addEventListener('install',(event)=>{
 self.skipWaiting();
 // Optional mission media must never prevent a code update from activating.
 event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)));
});
self.addEventListener('activate',(event)=>{event.waitUntil((async()=>{
 const keys=await caches.keys();
 const staleCaches=keys.filter(key=>key.startsWith('kiberkvest-shell-')&&key!==CACHE_NAME);
 await Promise.all(staleCaches.map(key=>caches.delete(key)));
 await self.clients.claim();
 const clients=await self.clients.matchAll({type:'window'});
 if(staleCaches.length)await Promise.all(clients.map(client=>client.navigate(client.url)));
})());});
const storeResponse=async(request,response)=>{if(response?.ok){const cache=await caches.open(CACHE_NAME);await cache.put(request,response.clone());}return response;};
const offlineFallback=(request)=>request.mode==='navigate'?caches.match('index.html'):caches.match(request).then(cached=>cached||new Response('Материал пока не скачан',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}}));
const networkFirst=(request)=>fetch(request).then(response=>storeResponse(request,response)).catch(()=>offlineFallback(request));
const cacheFirst=(request)=>caches.match(request).then(cached=>cached||networkFirst(request));

self.addEventListener('fetch',(event)=>{
 if(event.request.method!=='GET')return;
 const fresh=event.request.mode==='navigate'||event.request.destination==='script'||event.request.destination==='style';
 event.respondWith(fresh?networkFirst(event.request):cacheFirst(event.request));
});
