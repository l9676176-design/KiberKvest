export const MODE_LABELS={solo:'Я играю сам',family:'Играем семьёй',classroom:'Урок в классе'};
export const AGE_LABELS={'7-9':'7–9 лет','10-12':'10–12 лет'};
export function screen(title,content,{back=true,className=''}={}){
 return `<section class="screen ${className}" aria-labelledby="screen-title"><header class="screen-head">${back?'<button class="icon-button" data-action="back" aria-label="Назад">←</button>':'<span></span>'}<h1 id="screen-title">${title}</h1><span class="brand-mini">КК</span></header>${content}</section>`;
}
