export function getOfflineState(online,downloadedCount){
 if(online)return {online:true,canPlay:true,message:'Подключение есть. Ищем обновления.'};
 if(downloadedCount>0)return {online:false,canPlay:true,message:'Сейчас нет подключения к интернету. Загруженные миссии доступны без сети'};
 return {online:false,canPlay:false,message:'Сейчас нет подключения. Для первой загрузки миссий потребуется интернет'};
}

export async function checkNetwork(fetcher=fetch){
 if(typeof navigator!=='undefined'&&!navigator.onLine)return false;
 try{const response=await fetcher('data/version.json',{cache:'no-store'});return response.ok;}catch{return false;}
}
