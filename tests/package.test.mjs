import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('автономный пакет содержит локальный сервер и понятный запуск',async()=>{
 const build=await readFile(new URL('../scripts/build-offline.ps1',import.meta.url),'utf8');
 const server=await readFile(new URL('../scripts/server.mjs',import.meta.url),'utf8');
 const launcher=await readFile(new URL('../start-kiberkvest.cmd',import.meta.url),'utf8');
 assert.match(build,/Compress-Archive/);
 assert.doesNotMatch(build,/[^\x00-\x7F]/);
 assert.match(server,/createServer/);
 assert.match(server,/127\.0\.0\.1/);
 assert.match(server,/existsSync\(join\(base,'index\.html'\)\)/);
 assert.match(launcher,/node/);
});
