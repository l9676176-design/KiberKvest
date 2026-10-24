import { audioPathsForSlide } from './audio.js?v=20261024-1';

export const DOWNLOAD_STATES=['not-downloaded','downloading','downloaded','update-available','error'];
export const PACKAGE_VERSION='20261024-1';
const KEY='kiberkvest.downloads.v1';

export function commitMissionVersion(current,candidate){return candidate?.complete?candidate:current;}
export function loadDownloads(storage=localStorage){try{return JSON.parse(storage.getItem(KEY)||'{}');}catch{return {};}}
export function saveDownloads(storage=localStorage,value){storage.setItem(KEY,JSON.stringify(value));return value;}
export function missionDownloadState(downloads,id){
 const item=downloads[id];
 if(!item)return 'not-downloaded';
 if(item.state==='downloaded'&&(!item.complete||item.packageVersion!==PACKAGE_VERSION))return 'update-available';
 return item.state;
}
export function missionAssetPaths(mission){
 return [...new Set(mission.slides.flatMap(slide=>[slide.image,...Object.values(audioPathsForSlide(mission.id,slide))]))];
}

export async function verifyMissionDownload(mission,item,cacheStorage=globalThis.caches){
 if(missionDownloadState({[mission.id]:item},mission.id)!=='downloaded'||item.version!==mission.version||!cacheStorage)return false;
 if(!(await cacheStorage.keys()).includes(item.cacheName))return false;
 const cache=await cacheStorage.open(item.cacheName);
 for(const path of missionAssetPaths(mission)){
  const response=await cache.match(path);
  if(!response?.ok)return false;
 }
 return true;
}

export async function recoverDownloads(missions,downloads,cacheStorage=globalThis.caches){
 const recovered={...downloads};
 for(const mission of missions){
  const item=downloads[mission.id];if(!item)continue;
  const candidate={...item,state:'downloaded'};
  if(await verifyMissionDownload(mission,candidate,cacheStorage)){
   const {progress,error,...complete}=candidate;recovered[mission.id]=complete;
  }else{
   recovered[mission.id]={...item,state:item.complete?'not-downloaded':item.state==='downloaded'?'update-available':item.state==='downloading'?'error':item.state,complete:false};
  }
 }
 return recovered;
}

export async function cacheMission(mission,onProgress=()=>{},{signal,cacheStorage=globalThis.caches,fetcher=globalThis.fetch}={}){
 signal?.throwIfAborted();
 if(!cacheStorage)throw new Error('Браузер не поддерживает автономное хранение. Откройте приложение по HTTPS.');
 const files=missionAssetPaths(mission);
 // The candidate stays unreferenced until every file is checked; the previous package remains intact.
 const cacheName=`kiberkvest-${mission.slug}-${mission.version}-${PACKAGE_VERSION}-${globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`}`;
 const cache=await cacheStorage.open(cacheName);
 try{
  for(let index=0;index<files.length;index++){
   signal?.throwIfAborted();
   const path=files[index];
   const response=await fetcher(path,{cache:'reload',signal});
   const type=response.headers.get('Content-Type')||'';
   const expected=path.includes('.mp3')?'audio/':'image/';
   if(!response.ok||!type.startsWith(expected)||(await response.clone().arrayBuffer()).byteLength===0)throw new Error(`Не удалось скачать файл: ${path}`);
   await cache.put(path,response);
   onProgress((index+1)/files.length);
  }
  signal?.throwIfAborted();
  return {state:'downloaded',version:mission.version,packageVersion:PACKAGE_VERSION,complete:true,cacheName,files};
 }catch(error){await cacheStorage.delete(cacheName);throw error;}
}
