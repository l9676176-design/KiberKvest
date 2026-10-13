export const ROUTES=['splash','loading','offline','mode','age','menu','library','downloads','mission','result','settings'];

export function buildRoute(name,params={}){
 const query=new URLSearchParams(params).toString();
 return `#${ROUTES.includes(name)?name:'menu'}${query?`?${query}`:''}`;
}

export function parseRoute(hash=''){
 const raw=hash.replace(/^#/,'')||'menu';
 const [candidate,query='']=raw.split('?');
 const name=ROUTES.includes(candidate)?candidate:'menu';
 return {name,params:Object.fromEntries(new URLSearchParams(query))};
}

export function navigate(name,params={}){
 window.location.hash=buildRoute(name,params);
}
