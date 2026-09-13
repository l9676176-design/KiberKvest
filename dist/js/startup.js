export const SPLASH_MIN_MS=3500;
export const SPLASH_MAX_MS=6000;

export function determineStartup({firstRun,online,downloadedCount}){
 if(!online)return 'offline';
 return firstRun?'mode':'menu';
}

export function waitForSplash(startedAt=Date.now(),wait=setTimeout){
 return new Promise((resolve)=>wait(resolve,Math.max(0,SPLASH_MIN_MS-(Date.now()-startedAt))));
}
