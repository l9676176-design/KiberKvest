import { screen } from './shared.js';
export function renderLibrary(missions,downloads,filter='all'){
 const visible=missions.filter(m=>filter==='all'||m.category===filter);
 const cards=visible.map(m=>`<article class="mission-card"><img src="${m.slides[0].image}" alt="Обложка миссии ${m.id}: ${m.title}"><div class="mission-copy"><span class="eyebrow">Миссия ${m.id}</span><h2>${m.title}</h2><p>${m.categoryLabel} · ${m.duration}</p><span class="download-badge">${downloads[m.id]?.state==='downloading'?'Загружается':'Скачана'}</span><button class="primary" data-action="play" data-mission="${m.id}">Играть</button></div></article>`).join('');
 return screen('Выбери миссию',`<div class="filters" role="group" aria-label="Фильтр миссий"><button data-action="filter" data-filter="all" aria-pressed="${filter==='all'}">Все</button><button data-action="filter" data-filter="social" aria-pressed="${filter==='social'}">Социальная безопасность</button><button data-action="filter" data-filter="digital" aria-pressed="${filter==='digital'}">Цифровая безопасность и источники</button></div><div class="mission-grid">${cards}</div>`);
}
