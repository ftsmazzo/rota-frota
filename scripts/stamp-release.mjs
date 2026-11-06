import fs from 'node:fs/promises';
const release=new Date().toISOString();
await fs.writeFile('lib/release.ts',`export const APP_RELEASE=${JSON.stringify(release)};\n`);
await fs.writeFile('release.json',JSON.stringify({release}));
const worker=await fs.readFile('public/sw.js','utf8');
await fs.writeFile('public/sw.js',worker.replace(/const CACHE='[^']+';/,`const CACHE='rota-shell-${release}';`));
console.log('Release: '+release);
