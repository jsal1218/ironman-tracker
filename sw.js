const C='dashfit-v6',A=['./','./index.html','./app.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png','./icons/favicon-32.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>{const n=fetch(e.request).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp))};return res}).catch(()=>r||caches.match('./index.html'));return r||n}))});
