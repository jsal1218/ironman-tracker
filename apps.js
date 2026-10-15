// Dash app registry. To add an app: create a folder (e.g. /myapp/ with index.html that loads ../shared/update.js),
// add it to sw.js PRE (optional, for offline), and add one entry here. `widget(el)` is optional and may return a cleanup fn.
window.DASH_APPS=[
 {id:'fitness',name:'DashFit',tagline:'Triathlon training tracker',path:'fitness/',icon:'icons/icon-192.png',widget:fitWidget},
 {id:'nba',name:'DashHoops',tagline:'Pro basketball scores, live',path:'nba/',icon:'icons/nba-192.png',widget:nbaWidget},
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fitWidget(el){let E=[],S={};try{E=JSON.parse(localStorage.getItem('fitness-tracker-entries-v1'))||[];S=JSON.parse(localStorage.getItem('im-tracker-settings-v1'))||{}}catch(e){}
 if(!E.length){el.innerHTML='<p class="muted">No sessions yet — log your first swim, bike or run.</p>';return}
 const ws=S.weekStart==null?1:+S.weekStart,t=new Date();t.setHours(0,0,0,0);const st=new Date(t);st.setDate(t.getDate()-((t.getDay()-ws+7)%7));
 const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10),a=iso(st),wk=E.filter(e=>e.date>=a);
 const by={swim:0,bike:0,run:0,other:0};wk.forEach(e=>{const k=e.type==='brick'?'run':by[e.type]!=null?e.type:'other';by[k]+=e.duration});
 const tot=Object.values(by).reduce((x,y)=>x+y,0),hm=m=>`${Math.floor(m/60)}h ${Math.round(m%60)}m`,col={swim:'#3b8fd9',bike:'#e9a800',run:'#e85d5d',other:'#a970e8'};
 el.innerHTML=`<div class="big"><b>${hm(tot)}</b><span class="muted">${wk.length} sessions this week</span></div><div class="stack" aria-hidden="true">${Object.entries(by).map(([k,v])=>v?`<i style="flex:${v};background:${col[k]}"></i>`:'').join('')}</div><div class="muted">${['swim','bike','run'].map(k=>`${k[0].toUpperCase()+k.slice(1)} ${hm(by[k])}`).join(' · ')}</div>`}
function nbaWidget(el){let timer;const ymd=d=>`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
 const tm=iso=>new Date(iso).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
 async function load(){try{const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${ymd(new Date())}`,{cache:'no-store'});if(!r.ok)throw 0;const d=await r.json(),ev=d.events||[];
  if(!ev.length){el.innerHTML='<p class="muted">No games today.</p>';return}
  const rank={in:0,pre:1,post:2};ev.sort((x,y)=>rank[x.status.type.state]-rank[y.status.type.state]);const live=ev.some(e=>e.status.type.state==='in');
  el.innerHTML=`<ul class="mini">${ev.slice(0,4).map(e=>{const c=e.competitions[0].competitors,h=c.find(x=>x.homeAway==='home'),a=c.find(x=>x.homeAway==='away'),s=e.status.type.state;
   return`<li><span>${esc(a.team.abbreviation)} ${s==='pre'?'':`<b>${esc(a.score)}</b>`} @ ${esc(h.team.abbreviation)} ${s==='pre'?'':`<b>${esc(h.score)}</b>`}</span><span class="${s==='in'?'pill live':'muted'}">${s==='pre'?tm(e.date)+' ET':esc(e.status.type.shortDetail)}</span></li>`}).join('')}</ul>${ev.length>4?`<div class="muted">+${ev.length-4} more games</div>`:''}`;
  clearTimeout(timer);if(live)timer=setTimeout(()=>document.visibilityState==='visible'?load():document.addEventListener('visibilitychange',load,{once:true}),25000)}
  catch(e){el.innerHTML='<p class="muted">Scores unavailable right now (offline?).</p>'}}
 load();addEventListener('online',load)}
