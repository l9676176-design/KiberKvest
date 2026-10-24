import { screen } from './shared.js';
import { missionDownloadState } from '../js/storage.js?v=20261024-2';
export function renderDownloads(missions,downloads,{busy=false}={}){
 const labels={'not-downloaded':'Не скачана',downloaded:'Скачана: картинки и озвучка','update-available':'Нужно скачать полный комплект со звуком',error:'Ошибка загрузки. Повторите попытку.'};
 return screen('Загрузки и обновления',`<div class="download-summary"><strong>Полный автономный комплект</strong><span>${missions.length} миссий · картинки и озвучка</span><button class="primary" data-action="download-all" ${busy?'disabled':''}>Скачать все миссии</button></div><div class="download-list">${missions.map(m=>{
  const item=downloads[m.id];const state=missionDownloadState(downloads,m.id);const loading=state==='downloading';
  return `<article><div><strong>${m.id}. ${m.title}</strong><span data-download-status="${m.id}" role="status">${loading?`Загружается… ${item.progress||0}%`:labels[state]}${item?.error?` ${item.error}`:''}</span></div><button data-action="${loading?'cancel-download':'download'}" data-mission="${m.id}">${loading?'Отменить загрузку':state==='downloaded'?'Обновить':'Скачать'}</button></article>`;
 }).join('')}</div>`);
}
