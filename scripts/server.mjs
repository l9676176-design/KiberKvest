import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const host='127.0.0.1';
const port=Number(process.env.KIBERKVEST_PORT||4173);
const base=dirname(fileURLToPath(import.meta.url));
const root=existsSync(join(base,'index.html'))?base:resolve(join(base,'../src'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg'};

const server=createServer((request,response)=>{
 const pathname=decodeURIComponent(new URL(request.url,`http://${host}`).pathname);
 const relative=pathname==='/'?'index.html':normalize(pathname).replace(/^([/\\])+/, '');
 let file=resolve(join(root,relative));
 if(!file.startsWith(root)){response.writeHead(403);response.end('Доступ запрещён');return;}
 if(!existsSync(file)||statSync(file).isDirectory())file=join(root,'index.html');
 response.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});
 createReadStream(file).pipe(response);
});

server.listen(port,host,()=>{
 const url=`http://${host}:${port}/`;
 console.log(`КиберКвест запущен: ${url}`);
 console.log('Для остановки нажмите Ctrl+C.');
 if(!process.argv.includes('--no-open'))spawn('cmd',['/c','start','',url],{detached:true,stdio:'ignore'}).unref();
});
