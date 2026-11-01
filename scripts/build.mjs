import {readFileSync,writeFileSync,mkdirSync,cpSync,rmSync,existsSync} from 'node:fs';
const version=(process.env.GITHUB_SHA||'dev').slice(0,7);
const html=readFileSync('index.html','utf8').replace('__VERSION__',version);
rmSync('dist',{recursive:true,force:true});
mkdirSync('dist',{recursive:true});
for(const f of ['sw.js','manifest.webmanifest','icon-192.png','icon-512.png','icon.svg','.nojekyll']){
 if(existsSync(f))cpSync(f,'dist/'+f);
}
writeFileSync('dist/index.html',html);
console.log('Built dist/index.html ('+(html.length/1024).toFixed(1)+' KB), version '+version);