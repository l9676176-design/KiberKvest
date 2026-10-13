export function createMissionState(missionId,slide=1){return {missionId,slide,selected:[],wrongAnswer:null,feedback:null,complete:false};}

function sameSet(left,right){return left.length===right.length&&[...left].sort().every((v,i)=>v===[...right].sort()[i]);}

export function answerQuestion(state,slide,answer){
 if(slide.selection==='multiple'){
  if(!slide.correctSet.includes(answer))return {...state,wrongAnswer:answer,feedback:'wrong',complete:false};
  const selected=state.selected.includes(answer)?state.selected.filter(item=>item!==answer):[...state.selected,answer];
  const complete=sameSet(selected,slide.correctSet);
  return {...state,selected,wrongAnswer:null,feedback:complete?'correct':null,complete};
 }
 const complete=answer===slide.correct;
 return {...state,selected:[answer],wrongAnswer:complete?null:answer,feedback:complete?'correct':'wrong',complete};
}

export function canAdvance(state,slide){return slide.kind!=='question'||state.complete;}
export function nextSlide(state,total){return {...state,slide:Math.min(total,state.slide+1),selected:[],wrongAnswer:null,feedback:null,complete:false};}
export function previousSlide(state){return {...state,slide:Math.max(1,state.slide-1),selected:[],wrongAnswer:null,feedback:null,complete:false};}
