import {readFileSync,writeFileSync,mkdirSync,cpSync,rmSync} from 'node:fs';
const v=(process.env.GITHUB_SHA||'dev').slice(0,7),h=readFileSync('index.html','utf8').replace('__VERSION__',v);
rmSync('dist',{recursive:true,force:true});mkdirSync('dist');cpSync('public','dist',{recursive:true});writeFileSync('dist/index.html',h);
console.log('built dist/index.html',(h.length/1024).toFixed(0)+'KB',v);
