const KEY='kiberkvest.preferences.v1';
export const DEFAULT_PREFERENCES=Object.freeze({mode:'solo',age:'7-9',sound:true,volume:0.8,voice:true,speechRate:'normal',subtitles:true,reducedMotion:false,interacted:false,firstRun:true});

export function loadPreferences(storage=localStorage){
 try{return {...DEFAULT_PREFERENCES,...JSON.parse(storage.getItem(KEY)||'{}')};}catch{return {...DEFAULT_PREFERENCES};}
}

export function savePreferences(storage=localStorage,patch={}){
 const next={...loadPreferences(storage),...patch};
 storage.setItem(KEY,JSON.stringify(next));
 return next;
}

export function progressKey(missionId){return `kiberkvest.progress.${missionId}`;}
export function loadProgress(storage=localStorage,missionId){try{return JSON.parse(storage.getItem(progressKey(missionId))||'null');}catch{return null;}}
export function saveProgress(storage=localStorage,progress){storage.setItem(progressKey(progress.missionId),JSON.stringify(progress));return progress;}
