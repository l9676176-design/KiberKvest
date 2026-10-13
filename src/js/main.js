import { MISSIONS } from '../data/missions/manifest.js';
import { answerPlaybackItems, audioPathsForSlide, playFanfare, playRecorded, playRecordedSequence, shouldAutoNarrate, speak, stopSpeech } from './audio.js';
import { answerQuestion, createMissionState, nextSlide, previousSlide } from './mission-state.js?v=20261013-8';
import { checkNetwork, getOfflineState } from './network.js';
import { loadPreferences, loadProgress, savePreferences, saveProgress } from './preferences.js';
import { navigate, parseRoute } from './router.js';
import { cacheMission, loadDownloads, saveDownloads } from './storage.js';
import { determineStartup, waitForSplash } from './startup.js';
import { renderAge } from '../screens/age.js';
import { renderDownloads } from '../screens/downloads.js';
import { renderLibrary } from '../screens/library.js';
import { renderLoading } from '../screens/loading.js';
import { renderMenu } from '../screens/menu.js';
import { renderMissionPlayer, narrationText } from '../screens/mission-player.js?v=20261013-8';
import { renderMode } from '../screens/mode.js';
import { renderOffline } from '../screens/offline.js';
import { renderResult } from '../screens/result.js';
import { renderSettings } from '../screens/settings.js';

const app=document.querySelector('#app');
let preferences=loadPreferences();
let downloads=loadDownloads();
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
 if(name==='offline')return setContent(renderOffline(getOfflineState(online,MISSIONS.length)));
 if(name==='mode')return setContent(renderMode());
 if(name==='age')return setContent(renderAge());
 if(name==='menu')return setContent(renderMenu(preferences,loadResume(),online));
 if(name==='library')return setContent(renderLibrary(MISSIONS,downloads,libraryFilter));
 if(name==='downloads')return setContent(renderDownloads(MISSIONS,downloads));
 if(name==='settings')return setContent(renderSettings(preferences));
 if(name==='result')return setContent(renderResult(MISSIONS.find(m=>m.id===Number(params.mission))||MISSIONS[0]));
 if(name==='mission'){
  const missionId=Math.min(10,Math.max(1,Number(params.mission)||1));
  if(!missionState||missionState.missionId!==missionId){missionState=loadProgress(localStorage,missionId)||createMissionState(missionId,Number(params.slide)||1);}
  const mission=currentMission();
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

async function start(){
 if(location.hash){render();return;}
 const startedAt=Date.now();
 setContent(`<section class="splash"><img src="assets/ui/kiberkvest-splash.webp" alt="КиберКвест: мальчик, девочка и волшебный помощник"><div class="splash-progress"><span>Запускаем приключение…</span><i></i></div></section>`);
 setTimeout(()=>app.querySelector('.splash-progress')?.classList.add('visible'),1000);
 await waitForSplash(startedAt);
 setContent(renderLoading('Проверяем подключение',55));
 online=await checkNetwork();
 setContent(renderLoading(online?'Ищем обновления':'Готовим автономный режим',90));
 setTimeout(()=>navigate(determineStartup({firstRun:preferences.firstRun,online,downloadedCount:MISSIONS.length})),250);
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
 if(action==='play'||action==='replay'){missionState=createMissionState(Number(button.dataset.mission));persistProgress();navigate('mission',{mission:missionState.missionId,slide:1});return;}
 if(action==='resume'){missionState=loadResume();navigate('mission',{mission:missionState.missionId,slide:missionState.slide});return;}
 if(action==='answer'){const mission=currentMission();const slide=mission.slides[missionState.slide-1];const answerIndex=Number(button.dataset.answer);missionState=answerQuestion(missionState,slide,answerIndex);const feedback=missionState.feedback;const paths=audioPathsForSlide(mission.id,slide);const feedbackText=feedback==='correct'?slide.ok:slide.bad;persistProgress();render();playRecordedSequence(answerPlaybackItems({paths,answerIndex,answerText:`Вариант ${['А','Б','В','Г'][answerIndex]}. ${slide.answers[answerIndex]}`,feedback,feedbackText}),playbackOptions());return;}
 if(action==='back-slide'){missionState=previousSlide(missionState);persistProgress();navigate('mission',{mission:missionState.missionId,slide:missionState.slide});render();return;}
 if(action==='next-slide'){if(missionState.slide===8){missionState={...missionState,complete:true};persistProgress();navigate('result',{mission:missionState.missionId});return;}missionState=nextSlide(missionState,8);persistProgress();navigate('mission',{mission:missionState.missionId,slide:missionState.slide});render();return;}
 if(action==='repeat-question'){playRecordedSequence(lastQuestionAudio,playbackOptions());return;}
 if(action==='repeat-scene'){playRecorded(lastSceneAudio?.path,{...playbackOptions(),fallbackText:lastSceneAudio?.text});return;}
 if(action==='speak-answer'){const mission=currentMission();const slide=mission.slides[missionState.slide-1];const index=Number(button.dataset.answer);const paths=audioPathsForSlide(mission.id,slide);playRecorded(paths[`answer${index}`],{...playbackOptions(),fallbackText:`Вариант ${['А','Б','В','Г'][index]}. ${slide.answers[index]}`,onStart:()=>button.classList.add('speaking'),onEnd:()=>button.classList.remove('speaking')});return;}
 if(action==='repeat-system'){speak(lastSystemText,{rate:preferences.speechRate==='slow'?.78:1,volume:preferences.volume});return;}
 if(action==='fanfare'){if(preferences.sound)playFanfare();return;}
 if(action==='retry-network'){online=await checkNetwork();navigate(determineStartup({firstRun:preferences.firstRun,online,downloadedCount:MISSIONS.length}));return;}
 if(action==='offline-play'){navigate('library');return;}
 if(action==='download'||action==='download-all'){
  const targets=action==='download-all'?MISSIONS:[MISSIONS.find(m=>m.id===Number(button.dataset.mission))];
  for(const mission of targets){downloads={...downloads,[mission.id]:{state:'downloading'}};saveDownloads(localStorage,downloads);render();try{downloads={...downloads,[mission.id]:await cacheMission(mission)};}catch{downloads={...downloads,[mission.id]:{state:'error'}};}saveDownloads(localStorage,downloads);}
  render();return;
 }
});

app.addEventListener('change',(event)=>{
 const control=event.target.closest('[data-setting]');if(!control)return;
 const key=control.dataset.setting;
 const value=control.type==='checkbox'?control.checked:control.type==='range'?Number(control.value):control.value;
 preferences=savePreferences(localStorage,{[key]:value});
 document.documentElement.classList.toggle('reduce-motion',preferences.reducedMotion);
});

app.addEventListener('change',(event)=>{
 const key=event.target.dataset.setting;if(!key)return;
 const value=event.target.type==='checkbox'?event.target.checked:event.target.type==='range'?Number(event.target.value):event.target.value;
 preferences=savePreferences(localStorage,{[key]:value});
 document.documentElement.classList.toggle('reduce-motion',preferences.reducedMotion);
});

window.addEventListener('hashchange',render);
window.addEventListener('online',()=>{online=true;render();});
window.addEventListener('offline',()=>{online=false;render();});
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});navigator.serviceWorker.addEventListener('message',(event)=>{if(event.data?.type==='UPDATE_READY'&&!document.querySelector('.update-ready')){const notice=document.createElement('div');notice.className='update-ready';notice.setAttribute('role','status');notice.textContent='Обновление готово. Оно применится после завершения текущей миссии.';document.body.append(notice);}});}
document.documentElement.classList.toggle('reduce-motion',preferences.reducedMotion);
start();
