const CACHE='rota-shell-v7';
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const response=await fetch('/precache.json',{cache:'no-store'});
 if(!response.ok||response.redirected)throw new Error('A preparação offline ainda não está disponível.');
 const assets=await response.json();
 if(!Array.isArray(assets)||!assets.some(url=>url.endsWith('.js')))throw new Error('Manifesto offline incompleto.');
 const cache=await caches.open(CACHE);
 for(const url of [...new Set(['/',...assets])]){
  const resource=await fetch(url,{cache:'reload'});
  if(!resource.ok||resource.redirected)throw new Error('Um recurso offline ainda não está disponível.');
  await cache.put(url,resource);
 }
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const previous=(await caches.keys()).filter(key=>key.startsWith('rota-shell-')&&key!==CACHE);
 for(const key of previous.slice(0,-1))await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==location.origin||url.pathname.startsWith('/api/')||url.pathname.includes('signin')||url.pathname.includes('signout')||url.pathname==='/callback'||request.headers.has('RSC'))return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{try{const response=await fetch(request);if(response.ok&&!response.redirected&&response.headers.get('content-type')?.includes('text/html')){const cache=await caches.open(CACHE);await cache.put('/',response.clone())}return response}catch{return(await caches.match('/'))||new Response('Abra o Rota com conexão para preparar este aparelho.',{status:503})}})());return;
 }
 if(/\.(js|css|svg|png|woff2?)(\?|$)/.test(url.pathname))event.respondWith((async()=>{const cached=await caches.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok&&!response.redirected){const cache=await caches.open(CACHE);await cache.put(request,response.clone())}return response})());
});
