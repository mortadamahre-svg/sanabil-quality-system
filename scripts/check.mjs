import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
let bad=0;const fail=m=>{console.error('FAIL:',m);bad++};
const html=readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script>/gi)].map(m=>m[1]).filter(s=>s.trim());
if(!scripts.length)fail('No inline JavaScript found');
for(const [i,s] of scripts.entries()){try{new vm.Script(s);console.log('PASS: inline script '+(i+1))}catch(e){fail(e.message)}}
if(!/<html\\b[^>]*lang=["']ar["'][^>]*dir=["']rtl["']/i.test(html))fail('Arabic RTL document missing');
if(/href=["']style\\.css|src=["']app\\.js/.test(html))fail('Unexpected external app files');
const manifest=JSON.parse(readFileSync('manifest.webmanifest','utf8'));
for(const icon of manifest.icons||[])if(!existsSync(icon.src.replace(/^\\//,'')))fail('Missing icon '+icon.src);
for(const f of ['sw.js','manifest.webmanifest','icon-192.png','icon-512.png'])if(!existsSync(f))fail('Missing '+f);
if(bad){console.error('Static checks failed:',bad);process.exit(1)}
console.log('All static checks passed');