let currentUtterance=null;
let currentAudio=null;
let playbackToken=0;
let soundEnabled=true;
let currentFanfare=null;

const ANSWER_KEYS=['a','b','c','d'];
const AUDIO_REVISIONS=new Map([['2-5-c','20261014-1']]);
const pad=value=>String(value).padStart(2,'0');
const revision=(missionId,slideId,key)=>{const value=AUDIO_REVISIONS.get(`${missionId}-${slideId}-${key}`);return value?`?v=${value}`:'';};

export function audioPathsForSlide(missionId,slide){
 const base=`assets/audio/mission-${pad(missionId)}/slide-${pad(slide.id)}`;
 const paths={scene:`${base}-scene.mp3`};
 if(slide.kind==='question'){
  slide.answers.forEach((_,index)=>{const key=ANSWER_KEYS[index];paths[`answer${index}`]=`${base}-answer-${key}.mp3${revision(missionId,slide.id,key)}`;});
  paths.correct=`${base}-correct.mp3`;
  paths.wrong=`${base}-wrong.mp3`;
  slide.answers.forEach((_,index)=>{if(slide.badByAnswer?.[index])paths[`wrong${index}`]=`${base}-wrong-${ANSWER_KEYS[index]}.mp3`;});
 }
 return paths;
}

export function feedbackForAnswer({slide,paths,answerIndex,feedback}){
 if(feedback==='correct')return {path:paths.correct,text:slide.ok};
 return {
  path:slide.badByAnswer?.[answerIndex]?paths[`wrong${answerIndex}`]:paths.wrong,
  text:slide.badByAnswer?.[answerIndex]||slide.bad,
 };
}

export function answerPlaybackItems({paths,answerIndex,answerText,feedback,feedbackText,feedbackPath=undefined}){
 const items=[{path:paths[`answer${answerIndex}`],text:answerText}];
 if(feedback)items.push({path:feedbackPath===undefined?paths[feedback]:feedbackPath,text:feedbackText});
 return items;
}

export function canStartSound({sound,interacted}){return Boolean(sound&&interacted);}
export function shouldAutoNarrate({sound=true,mode,age,voice,interacted}){return sound&&mode==='solo'&&age==='7-9'&&voice&&interacted;}
export function setSoundEnabled(enabled){soundEnabled=Boolean(enabled);if(!soundEnabled)stopSpeech();}
export function stopSpeech(){
 playbackToken+=1;
 if(currentFanfare){Promise.resolve(currentFanfare.close?.()).catch(()=>{});currentFanfare=null;}
 if(currentAudio){currentAudio.pause();currentAudio.currentTime=0;currentAudio=null;}
 if('speechSynthesis' in globalThis)speechSynthesis.cancel();
 currentUtterance=null;
}
export function speak(text,{rate=1,volume=0.8,onStart,onEnd}={}){
 if(!soundEnabled)return false;
 if(!('speechSynthesis' in globalThis)||!text)return false;
 stopSpeech();
 currentUtterance=new SpeechSynthesisUtterance(text);
 currentUtterance.lang='ru-RU';currentUtterance.rate=rate;currentUtterance.volume=volume;
 currentUtterance.onstart=onStart||null;currentUtterance.onend=()=>{currentUtterance=null;onEnd?.();};
 speechSynthesis.speak(currentUtterance);return true;
}

export function playRecorded(path,{rate=1,volume=0.8,onStart,onEnd,fallbackText=''}={}){
 if(!soundEnabled)return false;
 if(typeof Audio==='undefined'||!path)return speak(fallbackText,{rate,volume,onStart,onEnd});
 stopSpeech();
 const token=playbackToken;
 const audio=new Audio(path);
 currentAudio=audio;audio.playbackRate=rate;audio.volume=volume;
 let finished=false;
 const fallback=()=>{if(finished||token!==playbackToken)return;finished=true;currentAudio=null;speak(fallbackText,{rate,volume,onStart,onEnd});};
 audio.onplay=()=>onStart?.();
 audio.onended=()=>{if(token!==playbackToken)return;finished=true;currentAudio=null;onEnd?.();};
 audio.onerror=fallback;
 audio.play().catch(fallback);
 return true;
}

export function playRecordedSequence(items,{rate=1,volume=0.8}={}){
 if(!soundEnabled)return false;
 const queue=items.filter(item=>item?.path||item?.text);
 if(!queue.length)return false;
 if(typeof Audio==='undefined')return speak(queue.map(item=>item.text).filter(Boolean).join('. '),{rate,volume});
 stopSpeech();
 const token=playbackToken;
 const playNext=index=>{
  if(token!==playbackToken||index>=queue.length){currentAudio=null;return;}
  const item=queue[index];
  if(!item.path){
   if(!('speechSynthesis' in globalThis)||!item.text){item.onEnd?.();playNext(index+1);return;}
   const utterance=new SpeechSynthesisUtterance(item.text);currentUtterance=utterance;
   utterance.lang='ru-RU';utterance.rate=rate;utterance.volume=volume;utterance.onstart=()=>item.onStart?.();
   utterance.onend=()=>{if(token!==playbackToken)return;currentUtterance=null;item.onEnd?.();playNext(index+1);};
   utterance.onerror=utterance.onend;speechSynthesis.speak(utterance);return;
  }
  const audio=new Audio(item.path);currentAudio=audio;audio.playbackRate=rate;audio.volume=volume;
  let finished=false;
  const fallback=()=>{
   if(finished||token!==playbackToken)return;
   finished=true;item.onEnd?.();currentAudio=null;
   speak(queue.slice(index).map(entry=>entry.text).filter(Boolean).join('. '),{rate,volume});
  };
  audio.onplay=()=>item.onStart?.();
  audio.onended=()=>{if(token!==playbackToken)return;finished=true;item.onEnd?.();playNext(index+1);};
  audio.onerror=fallback;
  audio.play().catch(fallback);
 };
 playNext(0);return true;
}

export function playFanfare(audioContext,{volume=0.8}={}){
 if(!soundEnabled||volume<=0)return false;
 stopSpeech();
 audioContext=audioContext||new AudioContext();
 currentFanfare=audioContext;
 const now=audioContext.currentTime;
 [523.25,659.25,783.99].forEach((frequency,index)=>{const oscillator=audioContext.createOscillator();const gain=audioContext.createGain();oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0.0001,now+index*.12);gain.gain.exponentialRampToValueAtTime(.2*volume,now+index*.12+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+index*.12+.35);oscillator.connect(gain).connect(audioContext.destination);oscillator.start(now+index*.12);oscillator.stop(now+index*.12+.36);});
 setTimeout(()=>{if(currentFanfare===audioContext){Promise.resolve(audioContext.close?.()).catch(()=>{});currentFanfare=null;}},700);
 return true;
}
