const KEY='kiberkvest.preferences.v1';
export const DEFAULT_PREFERENCES=Object.freeze({mode:'solo',age:'7-12',autoNarrate:null,sound:true,volume:0.8,voice:true,speechRate:'normal',subtitles:true,reducedMotion:false,interacted:false,firstRun:true});

export function loadPreferences(storage=localStorage){
 try{
  const saved=JSON.parse(storage.getItem(KEY)||'{}')||{};
  const autoNarrate=typeof saved.autoNarrate==='boolean'?saved.autoNarrate:
   saved.age==='7-9'?true:saved.age==='10-12'?false:null;
  return {...DEFAULT_PREFERENCES,...saved,age:'7-12',autoNarrate};
 }catch{return {...DEFAULT_PREFERENCES};}
}

export function savePreferences(storage=localStorage,patch={}){
 const next={...loadPreferences(storage),...patch};
 storage.setItem(KEY,JSON.stringify(next));
 return next;
}

export function progressKey(missionId){return `kiberkvest.progress.${missionId}`;}
export function loadProgress(storage=localStorage,missionId){try{return JSON.parse(storage.getItem(progressKey(missionId))||'null');}catch{return null;}}
export function saveProgress(storage=localStorage,progress){storage.setItem(progressKey(progress.missionId),JSON.stringify(progress));return progress;}
