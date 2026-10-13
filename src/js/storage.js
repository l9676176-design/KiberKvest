export const DOWNLOAD_STATES=['not-downloaded','downloading','downloaded','update-available','error'];
const KEY='kiberkvest.downloads.v1';

export function commitMissionVersion(current,candidate){return candidate?.complete?candidate:current;}
export function loadDownloads(storage=localStorage){try{return JSON.parse(storage.getItem(KEY)||'{}');}catch{return {};}}
export function saveDownloads(storage=localStorage,value){storage.setItem(KEY,JSON.stringify(value));return value;}
export function missionDownloadState(downloads,id){return downloads[id]?.state||'downloaded';}

export async function cacheMission(mission,onProgress=()=>{}){
 if(!('caches' in globalThis))return {state:'downloaded',version:mission.version,files:mission.slides.map(s=>s.image)};
 const temporary=`kiberkvest-${mission.slug}-${mission.version}-temp`;
 const finalName=`kiberkvest-${mission.slug}-${mission.version}`;
 const cache=await caches.open(temporary);
 for(let index=0;index<mission.slides.length;index+=1){
  await cache.add(mission.slides[index].image);
  onProgress((index+1)/mission.slides.length);
 }
 const final=await caches.open(finalName);
 const requests=await cache.keys();
 for(const request of requests)await final.put(request,await cache.match(request));
 await caches.delete(temporary);
 return {state:'downloaded',version:mission.version,files:mission.slides.map(s=>s.image)};
}
