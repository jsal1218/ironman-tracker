// VERSION is stamped automatically by the git pre-commit hook (scripts/stamp-version.sh). Do not edit by hand.
const VERSION='2026.10.13-202620-5ef760e';
const C='dashfit-'+VERSION,CORE=['./','./index.html','./app.js','./manifest.json'],STATIC=['./icons/icon-192.png','./icons/icon-512.png','./icons/favicon-32.png','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll([...CORE,...STATIC].map(u=>new Request(u,{cache:'reload'})))))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data==='version')e.source.postMessage({version:VERSION})});
const isCore=u=>u.pathname.endsWith('/')||/\/(index\.html|app\.js|sw\.js|manifest\.json)$/.test(u.pathname);
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 if(isCore(u)||e.request.mode==='navigate'){ // network-first, bypass HTTP cache (GitHub Pages max-age=600)
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok){const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp))}return r})
   .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('./index.html'))));return}
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(e.request,cp))}return res})))});
