import { MISSIONS } from '../data/missions/manifest.js?v=20261024-1';
import { answerPlaybackItems, audioPathsForSlide, feedbackForAnswer, playFanfare, playRecorded, playRecordedSequence, setSoundEnabled, shouldAutoNarrate, stopSpeech } from './audio.js?v=20261024-1';
import { answerQuestion, createMissionState, nextSlide, previousSlide } from './mission-state.js?v=20261024-1';
import { checkNetwork, getOfflineState } from './network.js';
import { loadPreferences, loadProgress, savePreferences, saveProgress } from './preferences.js';
import { navigate, parseRoute } from './router.js';
import { cacheMission, loadDownloads, missionDownloadState, recoverDownloads, saveDownloads, verifyMissionDownload } from './storage.js?v=20261024-1';
import { determineStartup, waitForSplash } from './startup.js';
import { renderAge } from '../screens/age.js';
import { renderDownloads } from '../screens/downloads.js';
import { renderLibrary } from '../screens/library.js';
import { renderLoading } from '../screens/loading.js';
import { renderMenu } from '../screens/menu.js';
import { renderMissionPlayer, narrationText } from '../screens/mission-player.js?v=20261024-1';
import { renderMode } from '../screens/mode.js';
import { renderOffline } from '../screens/offline.js';
import { renderResult } from '../screens/result.js';
import { renderSettings } from '../screens/settings.js';

const app=document.querySelector('#app');
let preferences=loadPreferences();
const localPackage=document.documentElement.dataset.localPackage==='true';
let downloads=loadDownloads();
const activeDownloads=new Map();
let batchDownloading=false;
setSoundEnabled(preferences.sound);
const downloadedCount=()=>localPackage?MISSIONS.length:MISSIONS.filter(m=>missionDownloadState(downloads,m.id)==='downloaded').length;
let online=navigator.onLine;
let libraryFilter='all';
let missionState=null;
let lastSystemText='Добро пожаловать в КиберКвест';
let lastSceneAudio=null;
let lastQuestionAudio=[];
const playbackOptions=()=>({rate:preferences.speechRate==='slow'?.78:1,volume:preferences.volume});

function currentMission(){return MISSIONS.find(m=>m.id===missionState?.missionId)||MISSIONS[0];}
function loadResume(){try{return JSON.parse(localStorage.getItem('kiberkvest.lastProgress')||'null');}catch{return null;}}
function persistProgress(){if(!missionState)return;saveProgress(localStorage,missionState);localStorage.setItem('kiberkvest.lastProgress',JSON.stringify(missionState));}
function setContent(html){app.className=preferences.mode;app.innerHTML=html;document.title=`КиберКвест — ${app.querySelector('h1')?.textContent||'приключение'}`;app.querySelector('h1')?.setAttribute('tabindex','-1');app.querySelector('h1')?.focus?.();}

function render(){
 stopSpeech();
 const {name,params}=parseRoute(location.hash);
 if(name==='loading')return setContent(renderLoading());
 if(name==='offline')return setContent(renderOffline(getOfflineState(online,downloadedCount())));
 if(name==='mode')return setContent(renderMode());
 if(name==='age')return setContent(renderAge());
 if(name==='menu')return setContent(renderMenu(preferences,loadResume(),online));
 if(name==='library')return setContent(renderLibrary(MISSIONS,downloads,libraryFilter,online||localPackage,localPackage));
 if(name==='downloads')return setContent(renderDownloads(MISSIONS,downloads,{busy:batchDownloading}));
 if(name==='settings')return setContent(renderSettings(preferences));
 if(name==='result')return setContent(renderResult(MISSIONS.find(m=>m.id===Number(params.mission))||MISSIONS[0]));
 if(name==='mission'){
  const missionId=Math.min(10,Math.max(1,Number(params.mission)||1));
  if(!missionState||missionState.missionId!==missionId){missionState=loadProgress(localStorage,missionId)||createMissionState(missionId,Number(params.slide)||1);}
  const mission=currentMission();
  if(!online&&!localPackage&&missionDownloadState(downloads,missionId)!=='downloaded')return setContent(renderOffline(getOfflineState(false,0)));
  setContent(renderMissionPlayer(mission,missionState,preferences));
  const slide=mission.slides[missionState.slide-1];
  lastSystemText=narrationText(slide)||slide.bubble;
  const paths=audioPathsForSlide(mission.id,slide);
  lastSceneAudio={path:paths.scene,text:[slide.bubble,slide.question].filter(Boolean).join('. ')};
  lastQuestionAudio=[lastSceneAudio,...(slide.answers||[]).map((answer,index)=>({
   path:paths[`answer${index}`],text:`Вариант ${['А','Б','В','Г'][index]}. ${answer}`,
   onStart:()=>app.querySelector(`[data-action="speak-answer"][data-answer="${index}"]`)?.classList.add('speaking'),
   onEnd:()=>app.querySelector(`[data-action="speak-answer"][data-answer="${index}"]`)?.classList.remove('speaking')
  }))];
  if(shouldAutoNarrate(preferences)&&slide.kind==='question')playRecordedSequence(lastQuestionAudio,playbackOptions());
  return;
 }
 navigate('menu');
}

function renderDownloadStatus(){if(['downloads','library','offline','menu'].includes(parseRoute(location.hash).name))render();}
async function refreshDownloads(){
 downloads=await recoverDownloads(MISSIONS,downloads);
 saveDownloads(localStorage,downloads);
}
async function downloadMission(mission){
 const previous=downloads[mission.id];
 const controller=new AbortController();activeDownloads.set(mission.id,controller);
 downloads={...downloads,[mission.id]:{...previous,state:'downloading',progress:0,error:null}};
 saveDownloads(localStorage,downloads);renderDownloadStatus();
 try{
  const candidate=await cacheMission(mission,progress=>{
   downloads[mission.id].progress=Math.round(progress*100);
   const status=app.querySelector(`[data-download-status="${mission.id}"]`);
   if(status)status.textContent=`Загружается… ${Math.round(progress*100)}%`;
  },{signal:controller.signal});
  downloads={...downloads,[mission.id]:candidate};saveDownloads(localStorage,downloads);
  if(previous?.cacheName&&previous.cacheName!==candidate.cacheName)await caches.delete(previous.cacheName).catch(()=>{});
 }catch(error){
  downloads={...downloads,[mission.id]:error.name==='AbortError'?(previous||{state:'not-downloaded'}):{...previous,state:previous?.complete?'downloaded':'error',error:'Не удалось скачать. Проверьте подключение и свободное место.'}};
  saveDownloads(localStorage,downloads);
 }finally{activeDownloads.delete(mission.id);renderDownloadStatus();}
}

async function start(){
 await refreshDownloads();
 if(location.hash){render();return;}
 const startedAt=Date.now();
 setContent(`<section class="splash"><img src="assets/ui/kiberkvest-splash.webp" alt="КиберКвест: мальчик, девочка и волшебный помощник"><div class="splash-progress"><span>Запускаем приключение…</span><i></i></div></section>`);
 setTimeout(()=>app.querySelector('.splash-progress')?.classList.add('visible'),1000);
 await waitForSplash(startedAt);
 setContent(renderLoading('Проверяем подключение',55));
 online=await checkNetwork();
 setContent(renderLoading(online?'Ищем обновления':'Готовим автономный режим',90));
 setTimeout(()=>navigate(determineStartup({firstRun:preferences.firstRun,online,downloadedCount:downloadedCount()})),250);
}

app.addEventListener('click',async(event)=>{
 const button=event.target.closest('[data-action]');if(!button)return;
 if(!preferences.interacted)preferences=savePreferences(localStorage,{interacted:true});
 const action=button.dataset.action;
 if(action==='back'){history.length>1?history.back():navigate('menu');return;}
 if(action==='go'){navigate(button.dataset.route);return;}
 if(action==='choose-mode'){preferences=savePreferences(localStorage,{mode:button.dataset.mode});navigate('age');return;}
 if(action==='choose-age'){preferences=savePreferences(localStorage,{age:button.dataset.age,firstRun:false});navigate('menu');return;}
 if(action==='set-mode'){preferences=savePreferences(localStorage,{mode:button.dataset.mode});navigate('library');return;}
 if(action==='filter'){libraryFilter=button.dataset.filter;render();return;}
 if(action==='play'||action==='replay'){const id=Number(button.dataset.mission);if(!online&&!localPackage&&!(await verifyMissionDownload(MISSIONS.find(m=>m.id===id),downloads[id]))){downloads={...downloads,[id]:{state:'not-downloaded'}};saveDownloads(localStorage,downloads);navigate('offline');return;}missionState=createMissionState(id);persistProgress();navigate('mission',{mission:missionState.missionId,slide:1});return;}
 if(action==='resume'){missionState=loadResume();navigate('mission',{mission:missionState.missionId,slide:missionState.slide});return;}
 if(action==='answer'){const mission=currentMission();const slide=mission.slides[missionState.slide-1];const answerIndex=Number(button.dataset.answer);missionState=answerQuestion(missionState,slide,answerIndex);const feedback=missionState.feedback;const paths=audioPathsForSlide(mission.id,slide);const feedbackItem=feedbackForAnswer({slide,paths,answerIndex,feedback});persistProgress();render();playRecordedSequence(answerPlaybackItems({paths,answerIndex,answerText:`Вариант ${['А','Б','В','Г'][answerIndex]}. ${slide.answers[answerIndex]}`,feedback,feedbackText:feedbackItem.text,feedbackPath:feedbackItem.path}),playbackOptions());return;}
 if(action==='back-slide'){missionState=previousSlide(missionState);persistProgress();navigate('mission',{mission:missionState.missionId,slide:missionState.slide});render();return;}
 if(action==='next-slide'){if(missionState.slide===8){missionState={...missionState,complete:true};persistProgress();navigate('result',{mission:missionState.missionId});return;}missionState=nextSlide(missionState,8);persistProgress();navigate('mission',{mission:missionState.missionId,slide:missionState.slide});render();return;}
 if(action==='repeat-question'){playRecordedSequence(lastQuestionAudio,playbackOptions());return;}
 if(action==='repeat-scene'){playRecorded(lastSceneAudio?.path,{...playbackOptions(),fallbackText:lastSceneAudio?.text});return;}
 if(action==='speak-answer'){const mission=currentMission();const slide=mission.slides[missionState.slide-1];const index=Number(button.dataset.answer);const paths=audioPathsForSlide(mission.id,slide);playRecorded(paths[`answer${index}`],{...playbackOptions(),fallbackText:`Вариант ${['А','Б','В','Г'][index]}. ${slide.answers[index]}`,onStart:()=>button.classList.add('speaking'),onEnd:()=>button.classList.remove('speaking')});return;}
 if(action==='repeat-system'){playRecorded(lastSceneAudio?.path||'assets/audio/system/welcome.mp3',{...playbackOptions(),fallbackText:lastSystemText});return;}
 if(action==='fanfare'){if(preferences.sound)playFanfare(undefined,{volume:preferences.volume});return;}
 if(action==='retry-network'){online=await checkNetwork();navigate(determineStartup({firstRun:preferences.firstRun,online,downloadedCount:downloadedCount()}));return;}
 if(action==='offline-play'){navigate('library');return;}
 if(action==='cancel-download'){activeDownloads.get(Number(button.dataset.mission))?.abort();return;}
 if(action==='download'||action==='download-all'){
  if(action==='download-all'&&batchDownloading)return;
  const targets=action==='download-all'?MISSIONS:[MISSIONS.find(m=>m.id===Number(button.dataset.mission))];
  if(action==='download-all')batchDownloading=true;
  try{for(const mission of targets)if(mission&&!activeDownloads.has(mission.id))await downloadMission(mission);}
  finally{if(action==='download-all')batchDownloading=false;renderDownloadStatus();}
  return;
 }
});

app.addEventListener('change',(event)=>{
 const control=event.target.closest('[data-setting]');if(!control)return;
 const key=control.dataset.setting;
 const value=control.type==='checkbox'?control.checked:control.type==='range'?Number(control.value):control.value;
 preferences=savePreferences(localStorage,{[key]:value});
 if(key==='sound')setSoundEnabled(value);
 if(key==='voice'&&!value)stopSpeech();
 document.documentElement.classList.toggle('reduce-motion',preferences.reducedMotion);
});

window.addEventListener('hashchange',render);
window.addEventListener('online',()=>{online=true;render();});
window.addEventListener('offline',()=>{online=false;render();});
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});navigator.serviceWorker.addEventListener('message',(event)=>{if(event.data?.type==='UPDATE_READY'&&!document.querySelector('.update-ready')){const notice=document.createElement('div');notice.className='update-ready';notice.setAttribute('role','status');notice.textContent='Обновление готово. Оно применится после завершения текущей миссии.';document.body.append(notice);}});}
document.documentElement.classList.toggle('reduce-motion',preferences.reducedMotion);
start();
