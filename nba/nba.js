(()=>{'use strict';
const API='https://site.api.espn.com/apis/site/v2/sports/basketball/nba/';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TZ=Intl.DateTimeFormat().resolvedOptions().timeZone,TZL=TZ==='America/New_York'?'ET':(new Intl.DateTimeFormat('en-US',{timeZoneName:'short'}).formatToParts(new Date()).find(p=>p.type==='timeZoneName')||{}).value||'';
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,ymd=s=>s.replace(/-/g,'');
const parse=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const tm=t=>new Date(t).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})+' '+TZL;
let date=iso(new Date()),favs=new Set(JSON.parse(localStorage.getItem('dashhoops-favs')||'[]')),timer=null,events=[],openId=null,dTimer=null;
const isToday=()=>date===iso(new Date());
// ---------- date navigation ----------
const setDate=d=>{date=d;$('#date').value=d;history.replaceState(null,'',d===iso(new Date())?location.pathname:`?date=${d}`);load(true)};
const q=new URLSearchParams(location.search).get('date');if(q&&/^\d{4}-\d{2}-\d{2}$/.test(q))date=q;$('#date').value=date;
const step=n=>{const d=parse(date);d.setDate(d.getDate()+n);setDate(iso(d))};
$('#prev').onclick=()=>step(-1);$('#next').onclick=()=>step(1);$('#todayBtn').onclick=()=>setDate(iso(new Date()));$('#date').onchange=e=>e.target.value&&setDate(e.target.value);
// ---------- scoreboard ----------
async function load(showSkel){clearTimeout(timer);
 $('#dateLbl').textContent=parse(date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'})+(isToday()?' · Today':'');
 if(showSkel){$('#games').setAttribute('aria-busy','true');$('#games').innerHTML='<div class="skel"></div><div class="skel"></div><div class="skel"></div>'}
 const key='dashhoops-sb-'+date;
 try{const r=await fetch(`${API}scoreboard?dates=${ymd(date)}`,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);const d=await r.json();
  events=d.events||[];try{localStorage.setItem(key,JSON.stringify({t:Date.now(),events}))}catch(e){}
  $('#msg').innerHTML='';render(d.leagues?.[0]?.season?.type?.name);$('#upd').textContent='Updated '+new Date().toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',second:'2-digit'})}
 catch(err){const c=JSON.parse(localStorage.getItem(key)||'null');
  if(c){events=c.events;render();$('#msg').innerHTML=`<div class="banner" role="status">${navigator.onLine?'Couldn’t reach the score service':'You’re offline'} — showing scores saved ${new Date(c.t).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}. <button id="retry">Retry</button></div>`}
  else{$('#games').innerHTML='';$('#games').setAttribute('aria-busy','false');$('#msg').innerHTML=`<div class="card empty" role="alert"><b>${navigator.onLine?'Scores are unavailable right now.':'You’re offline.'}</b><br>We’ll try again automatically. <br><button id="retry" class="primary" style="margin-top:10px">Retry now</button></div>`}
  $('#retry').onclick=()=>load(true)}
 schedule()}
function schedule(){clearTimeout(timer);const live=events.some(e=>e.status.type.state==='in'),soon=events.some(e=>e.status.type.state==='pre'&&new Date(e.date)-Date.now()<15*6e4);
 const ms=live||soon?25000:isToday()?120000:0;if(ms)timer=setTimeout(()=>{if(document.visibilityState==='visible')load()},ms);
 $('#upd').dataset.live=live?'1':'';if(live)$('#upd').textContent=$('#upd').textContent.replace(/ · live.*/,'')+' · live, auto-updating'}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){load();if(openId)detail(openId,true)}});
addEventListener('online',()=>load());
const side=(c,k)=>c.find(x=>x.homeAway===k);
function status(e){const s=e.status.type;if(s.state==='pre')return s.name==='STATUS_SCHEDULED'?`<span class="pill">${tm(e.date)}</span>`:`<span class="pill">${esc(s.shortDetail)}</span>`;
 if(s.state==='in')return`<span class="pill live">${esc(s.shortDetail.replace(' - ',' · '))}</span>`;return`<span class="muted"><b>${esc(s.shortDetail)}</b></span>`}
function teamRow(t,st,win){const rec=(t.records||[]).find(r=>r.type==='total')?.summary||t.records?.[0]?.summary||'',ab=t.team.abbreviation,f=favs.has(ab);
 return`<div class="team"><img src="${esc(t.team.logo||'')}" width="32" height="32" alt="" loading="lazy"><span class="nm"><b>${esc(t.team.shortDisplayName||t.team.displayName)} <small>${esc(ab)}</small></b><small>${esc(rec)}${t.homeAway==='home'?' · Home':''}</small></span><span class="row" style="flex-wrap:nowrap">${st==='pre'?'':`<span class="score ${st==='post'&&!win?'lose':''}">${esc(t.score)}</span>`}<button class="star" data-fav="${esc(ab)}" aria-pressed="${f}" aria-label="${f?'Unpin':'Pin'} ${esc(t.team.displayName)}">${f?'★':'☆'}</button></span></div>`}
function render(seasonType){const g=$('#games');g.setAttribute('aria-busy','false');
 if(!events.length){g.innerHTML=`<div class="card empty" style="grid-column:1/-1"><b>No games scheduled</b><br>Try another date with ‹ ›.</div>`;return}
 const fav=e=>e.competitions[0].competitors.some(c=>favs.has(c.team.abbreviation));
 const L=[...events].sort((a,b)=>(fav(b)-fav(a))||new Date(a.date)-new Date(b.date));
 g.innerHTML=L.map(e=>{const c=e.competitions[0],a=side(c.competitors,'away'),h=side(c.competitors,'home'),st=e.status.type.state,tag=e.season?.slug&&e.season.slug!=='regular-season'?`<span class="pill">${esc(e.season.slug.replace(/-/g,' '))}</span>`:'';
  const tv=(c.broadcasts||[]).flatMap(b=>b.names||[]).join(', ');
  return`<article class="game card${fav(e)?' fav':''}${st==='in'?' is-live':''}" data-id="${esc(e.id)}"><div class="ghead">${status(e)}<span class="row">${tag}${tv?`<span class="muted">${esc(tv)}</span>`:''}<button class="open" data-open aria-label="Details: ${esc(e.name)}">Box ›</button></span></div>${teamRow(a,st,a.winner)}${teamRow(h,st,h.winner)}</article>`}).join('')}
$('#games').addEventListener('click',e=>{const f=e.target.closest('[data-fav]');if(f){e.stopPropagation();const ab=f.dataset.fav;favs.has(ab)?favs.delete(ab):favs.add(ab);localStorage.setItem('dashhoops-favs',JSON.stringify([...favs]));render();return}
 const g=e.target.closest('.game');if(g)detail(g.dataset.id)});
// ---------- game detail ----------
$('#dClose').onclick=()=>$('#detail').close();$('#detail').addEventListener('close',()=>{openId=null;clearTimeout(dTimer)});
async function detail(id,quiet){openId=id;clearTimeout(dTimer);const dlg=$('#detail');if(!dlg.open){$('#dBody').innerHTML='<div class="skel"></div>';dlg.showModal()}
 try{const r=await fetch(`${API}summary?event=${encodeURIComponent(id)}`,{cache:'no-store'});if(!r.ok)throw 0;const d=await r.json();if(openId!==id)return;
  const c=d.header.competitions[0],a=side(c.competitors,'away'),h=side(c.competitors,'home'),st=c.status.type.state;
  $('#dTitle').textContent=`${a.team.abbreviation} @ ${h.team.abbreviation}`;
  const per=Math.max(4,...[a,h].map(t=>(t.linescores||[]).length)),pl=i=>i<4?`Q${i+1}`:`OT${i>4?i-3:''}`;
  let html=`<div class="row between" style="margin-bottom:10px">${st==='pre'?`<span class="pill">${tm(c.date)}</span>`:st==='in'?`<span class="pill live">${esc(c.status.type.shortDetail)}</span>`:`<b>${esc(c.status.type.shortDetail)}</b>`}<span class="muted">${esc(d.gameInfo?.venue?.fullName||'')}</span></div>`;
  html+=`<div class="tbl"><table><thead><tr><th>Team</th>${Array.from({length:per},(_,i)=>`<th>${pl(i)}</th>`).join('')}<th>T</th></tr></thead><tbody>${[a,h].map(t=>`<tr><td><b>${esc(t.team.abbreviation)}</b> <span class="muted">${esc(t.record?.[0]?.summary||'')}</span></td>${Array.from({length:per},(_,i)=>`<td>${esc(t.linescores?.[i]?.displayValue??'–')}</td>`).join('')}<td><b>${esc(t.score??'–')}</b></td></tr>`).join('')}</tbody></table></div>`;
  if(d.leaders?.length)html+=`<h2>Leaders</h2><div class="lead">${d.leaders.map(t=>`<div><b>${esc(t.team.abbreviation)}</b>${(t.leaders||[]).map(l=>l.leaders?.[0]?`<div class="muted">${esc(l.displayName)}: <b style="color:var(--text)">${esc(l.leaders[0].athlete.shortName)}</b> ${esc(l.leaders[0].displayValue)}</div>`:'').join('')}</div>`).join('')}</div>`;
  const P=d.boxscore?.players||[];
  if(P.length)P.forEach(t=>{const s=t.statistics?.[0];if(!s?.athletes?.length)return;html+=`<h2>${esc(t.team.displayName)}</h2><div class="tbl"><table><thead><tr><th>Player</th>${s.names.map(n=>`<th>${esc(n)}</th>`).join('')}</tr></thead><tbody>${s.athletes.map(p=>`<tr><td>${esc(p.athlete.shortName)}${p.starter?' <small class="muted">S</small>':''}</td>${p.didNotPlay?`<td colspan="${s.names.length}" style="text-align:left" class="muted">${esc(p.reason||'DNP')}</td>`:p.stats.map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`});
  else html+=`<p class="muted">Box score appears at tip-off.</p>`;
  $('#dBody').innerHTML=html;if(st==='in')dTimer=setTimeout(()=>{if(document.visibilityState==='visible')detail(id,true)},25000)}
 catch(e){if(!quiet)$('#dBody').innerHTML='<div class="empty" role="alert">Couldn’t load game details. Check your connection and try again.</div>';else dTimer=setTimeout(()=>detail(id,true),25000)}}
load(true);
})();
