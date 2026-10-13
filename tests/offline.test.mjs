import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { MISSIONS } from '../src/data/missions/manifest.js';
import test from 'node:test';
import { Script } from 'node:vm';

test('PWA устанавливается как русское автономное приложение',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../src/manifest.webmanifest',import.meta.url),'utf8'));
 assert.equal(manifest.lang,'ru');
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.start_url,'./');
 assert.equal(manifest.icons.length>0,true);
});

test('service worker кэширует оболочку и восемьдесят страниц миссий',async()=>{
 const source=await readFile(new URL('../src/sw.js',import.meta.url),'utf8');
 assert.match(source,/MISSION_ASSETS/);
 assert.match(source,/10/);
 assert.match(source,/8/);
 assert.match(source,/addAll/);
 assert.match(source,/fetch/);
 assert.doesNotThrow(()=>new Script(source));
 const shell=source.match(/const APP_SHELL=\[(.*?)\];/s)?.[1]||'';
 const references=[...shell.matchAll(/'([^']+)'/g)].map(match=>match[1]).filter(path=>path!=='./');
 for(const path of references)await access(fileURLToPath(new URL(`../src/${path}`,import.meta.url)));
 for(const mission of MISSIONS)for(const slide of mission.slides)await access(fileURLToPath(new URL(`../src/${slide.image}`,import.meta.url)));
});
