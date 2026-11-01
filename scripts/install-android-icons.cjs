'use strict';
const fs=require('node:fs'),path=require('node:path');
const source=path.resolve(__dirname,'..','assets','android-res'),target=path.resolve(__dirname,'..','android','app','src','main','res');
if(!fs.existsSync(source))throw new Error('Generated Android icon resources are missing: '+source);
if(!fs.existsSync(path.dirname(target)))throw new Error('Android project has not been generated yet.');
fs.mkdirSync(target,{recursive:true});fs.cpSync(source,target,{recursive:true,force:true});
for(const file of ['mipmap-mdpi/ic_launcher.png','mipmap-hdpi/ic_launcher.png','mipmap-xhdpi/ic_launcher.png','mipmap-xxhdpi/ic_launcher.png','mipmap-xxxhdpi/ic_launcher.png','mipmap-anydpi-v26/ic_launcher.xml'])if(!fs.existsSync(path.join(target,file)))throw new Error('Missing Android launcher icon: '+file);
console.log('Installed custom Sanabil Android launcher icons.');
