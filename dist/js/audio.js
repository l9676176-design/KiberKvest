let currentUtterance=null;
let currentAudio=null;
let playbackToken=0;

const ANSWER_KEYS=['a','b','c','d'];
const pad=value=>String(value).padStart(2,'0');

export function audioPathsForSlide(missionId,slide){
 const base=`assets/audio/mission-${pad(missionId)}/slide-${pad(slide.id)}`;
 const paths={scene:`${base}-scene.mp3`};
 if(slide.kind==='question'){
  slide.answers.forEach((_,index)=>{paths[`answer${index}`]=`${base}-answer-${ANSWER_KEYS[index]}.mp3`;});
  paths.correct=`${base}-correct.mp3`;
  paths.wrong=`${base}-wrong.mp3`;
 }
 return paths;
}

export function canStartSound({sound,interacted}){return Boolean(sound&&interacted);}
export function shouldAutoNarrate({mode,age,voice,interacted}){return mode==='solo'&&age==='7-9'&&voice&&interacted;}
export function stopSpeech(){
 playbackToken+=1;
 if(currentAudio){currentAudio.pause();currentAudio.currentTime=0;currentAudio=null;}
 if('speechSynthesis' in globalThis)speechSynthesis.cancel();
 currentUtterance=null;
}
export function speak(text,{rate=1,volume=0.8,onStart,onEnd}={}){
 if(!('speechSynthesis' in globalThis)||!text)return false;
 stopSpeech();
 currentUtterance=new SpeechSynthesisUtterance(text);
 currentUtterance.lang='ru-RU';currentUtterance.rate=rate;currentUtterance.volume=volume;
 currentUtterance.onstart=onStart||null;currentUtterance.onend=()=>{currentUtterance=null;onEnd?.();};
 speechSynthesis.speak(currentUtterance);return true;
}

export function playRecorded(path,{rate=1,volume=0.8,onStart,onEnd,fallbackText=''}={}){
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
 const queue=items.filter(item=>item?.path);
 if(!queue.length)return false;
 if(typeof Audio==='undefined')return speak(queue.map(item=>item.text).filter(Boolean).join('. '),{rate,volume});
 stopSpeech();
 const token=playbackToken;
 const playNext=index=>{
  if(token!==playbackToken||index>=queue.length){currentAudio=null;return;}
  const item=queue[index];
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

export function playFanfare(audioContext=new AudioContext()){
 const now=audioContext.currentTime;
 [523.25,659.25,783.99].forEach((frequency,index)=>{const oscillator=audioContext.createOscillator();const gain=audioContext.createGain();oscillator.frequency.value=frequency;gain.gain.setValueAtTime(0.0001,now+index*.12);gain.gain.exponentialRampToValueAtTime(.16,now+index*.12+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+index*.12+.35);oscillator.connect(gain).connect(audioContext.destination);oscillator.start(now+index*.12);oscillator.stop(now+index*.12+.36);});
}
