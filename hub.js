(()=>{'use strict';
// One-time hand-off: people who installed DashFit at the site root (before the hub existed) land in DashFit once.
try{const E=JSON.parse(localStorage.getItem('fitness-tracker-entries-v1')||'[]');if(E.length&&!localStorage.getItem('dash-hub-intro')){localStorage.setItem('dash-hub-intro','1');location.replace('fitness/?moved=1');return}localStorage.setItem('dash-hub-intro','1')}catch(e){}
const g=document.getElementById('apps');
g.innerHTML=DASH_APPS.map(a=>`<article class="tile card"><a class="tlink" href="${a.path}"><img src="${a.icon}" width="52" height="52" alt=""><span><b>${esc(a.name)}</b><small>${esc(a.tagline)}</small></span><span class="go" aria-hidden="true">›</span></a><div class="widget" id="w-${a.id}" aria-live="polite"><p class="muted">Loading…</p></div></article>`).join('');
DASH_APPS.forEach(a=>a.widget&&a.widget(document.getElementById('w-'+a.id)));
const h=new Date().getHours();document.getElementById('greet').textContent=(h<12?'Good morning':h<18?'Good afternoon':'Good evening')+' 👋';
document.getElementById('today').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
})();
