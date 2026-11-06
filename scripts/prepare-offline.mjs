import fs from 'node:fs';
import path from 'node:path';
const files=['/demo-inspection.png'];
function scan(dir,prefix){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const absolute=path.join(dir,entry.name),url=prefix+'/'+entry.name;if(entry.isDirectory())scan(absolute,url);else if(/\.(js|css|svg|png|webmanifest|woff2?)$/.test(entry.name)&&entry.name!=='sw.js')files.push(url)}}
scan('.next/static','/_next/static');scan('public','');fs.writeFileSync('public/precache.json',JSON.stringify(files));console.log('PWA offline assets: '+files.length);
