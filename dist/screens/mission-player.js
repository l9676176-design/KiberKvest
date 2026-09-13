import { getModeExperience } from '../js/modes/index.js';
import { screen } from './shared.js';
const LABELS=['А','Б','В','Г'];

export function narrationText(slide){return [slide.bubble,slide.question,...(slide.answers||[])].filter(Boolean).join('. ');}

export function renderMissionPlayer(mission,state,preferences){
 const slide=mission.slides[state.slide-1];
 const experience=getModeExperience(preferences.mode);
 let body='';
 if(slide.kind==='intro')body=`<div class="story-card"><h2>Миссия «${slide.name}»</h2><p>${slide.lead}</p></div>`;
 if(slide.kind==='question')body=`<div class="question-card"><h2>${slide.question}</h2>${experience.votePause?'<p class="teacher-note">Пауза для голосования руками. Откройте ответ после обсуждения.</p>':''}<div class="answers">${slide.answers.map((answer,index)=>`<div class="answer-row"><button class="answer ${state.selected.includes(index)?state.feedback||'selected':''}" data-action="answer" data-answer="${index}"><span>${LABELS[index]}</span>${answer}</button><button class="listen" data-action="speak-answer" data-answer="${index}" aria-label="Прослушать вариант ${LABELS[index]}">🔊</button></div>`).join('')}</div><button class="secondary" data-action="repeat-question">Повторить вопрос и ответы</button>${state.feedback?`<p class="feedback ${state.feedback}" role="status">${state.feedback==='correct'?slide.ok:slide.bad}</p>`:''}</div>`;
 if(slide.kind==='pause')body=`<div class="story-card"><h2>Передышка</h2><p>${slide.text}</p><button class="primary" data-action="fanfare">▶ Повторить фанфару</button></div>`;
 if(slide.kind==='final')body=`<div class="final-card"><h2>${slide.rule}</h2><p>${slide.bubble}</p><div class="discussion"><strong>Для семьи или класса:</strong> ${slide.discussion}</div>${slide.source?`<div class="source">Источник фактов: ${slide.source}</div>`:''}</div>`;
 return screen(mission.title,`<div class="mission-progress"><span>Страница ${state.slide} из 8</span><div><i style="width:${state.slide/8*100}%"></i></div></div><div class="comic-stage"><img src="${slide.image}" alt="${mission.title}. Страница ${state.slide}: ${slide.title}"><div class="scene-title">${slide.title}</div>${preferences.subtitles?`<div class="bubble">${slide.bubble}</div>`:''}<div class="task-panel">${experience.helperHint?`<p class="mode-hint">${experience.helperHint}</p>`:''}${body}</div><div class="wrong-burst ${state.feedback==='wrong'?'show':''}" aria-hidden="true">БУМ!</div></div><footer class="mission-nav"><button data-action="back-slide" ${state.slide===1?'disabled':''}>← Назад</button><button data-action="repeat-scene">🔊 Реплика</button><button class="primary" data-action="next-slide" ${slide.kind==='question'&&!state.complete?'disabled':''}>${state.slide===8?'Завершить':'Дальше →'}</button></footer>`,{back:true,className:'mission-screen'});
}
