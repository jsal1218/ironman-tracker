// Dash app registry. To add an app: create a folder (e.g. /myapp/ whose index.html loads ../shared/base.css,
// ../shared/theme.js and ../shared/update.js), optionally add its files to PRE in sw.js for offline use,
// and add one entry below. `widget(el)` is optional (a live card on the home screen); `parent` groups shortcuts.
window.DASH_APPS=[
 {id:'nba',name:'DashHoops',tagline:'Live pro basketball scores',path:'nba/',icon:'icons/hoops.svg',widget:nbaWidget,widgetTitle:'Tonight’s games'},
 {id:'games',name:'Dash Games',tagline:'Quick single-player games',path:'games/',icon:'icons/games.svg',widget:gamesWidget,widgetTitle:'Your best scores'},
 {id:'orbit',name:'Orbit Merge',path:'games/orbit/',icon:'icons/orbit.svg',parent:'games'},
 {id:'pilot',name:'Paper Pilot',path:'games/pilot/',icon:'icons/pilot.svg',parent:'games'},
 {id:'bloom',name:'Bloom Blocks',path:'games/bloom/',icon:'icons/bloom.svg',parent:'games'},
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function gamesWidget(el){const I=DASH_ICON,L=DASH_APPS.filter(a=>a.parent==='games'),bs=L.map(a=>+localStorage.getItem('dash-games-'+a.id+'-best')||0);
 el.innerHTML=`<ul class="glist">${L.map((a,i)=>`<li><a href="${a.path}"><img src="${a.icon}" width="40" height="40" alt=""><span class="gn"><b>${esc(a.name)}</b><small>${bs[i]?`${I('trophy','sm')} Best ${bs[i].toLocaleString()}`:'Not played yet'}</small></span><span class="gplay">${I('play','sm')}</span></a></li>`).join('')}</ul>`}
function nbaWidget(el){let timer;const I=DASH_ICON,ymd=d=>`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
 const tm=iso=>new Date(iso).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
 async function load(){try{const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${ymd(new Date())}`,{cache:'no-store'});if(!r.ok)throw 0;const d=await r.json(),ev=d.events||[];
  if(!ev.length){el.innerHTML=`<p class="muted">${I('calendar','sm')} No games today.</p>`;window.dashStat&&dashStat('nba','No games today');return}
  const rank={in:0,pre:1,post:2};ev.sort((x,y)=>rank[x.status.type.state]-rank[y.status.type.state]||new Date(x.date)-new Date(y.date));const nLive=ev.filter(e=>e.status.type.state==='in').length;
  const team=(t,st)=>`<span class="tk-t"><img src="${esc(t.team.logo||'')}" width="22" height="22" alt="" loading="lazy"><b>${esc(t.team.abbreviation)}</b>${st==='pre'?'':`<span class="tk-s${t.winner?' w':''}">${esc(t.score)}</span>`}</span>`;
  el.innerHTML=`<div class="ticker">${ev.map(e=>{const c=e.competitions[0].competitors,h=c.find(x=>x.homeAway==='home'),a=c.find(x=>x.homeAway==='away'),s=e.status.type.state;
   return`X${team(a,s)}${team(h,s)}<span class="${s==='in'?'pill live':'pill'}">${s==='pre'?tm(e.date)+' ET':esc(e.status.type.shortDetail.replace(' - ',' · '))}</span></a>`}).join('')}</div>`;
  window.dashStat&&dashStat('nba',nLive?`${nLive} live now`:`${ev.length} games today`,nLive>0);
  clearTimeout(timer);if(nLive)timer=setTimeout(()=>document.visibilityState==='visible'?load():document.addEventListener('visibilitychange',load,{once:true}),25000)}
  catch(e){el.innerHTML=`<p class="muted">Scores unavailable right now — you may be offline.</p>`}}
 load();addEventListener('online',load)}
