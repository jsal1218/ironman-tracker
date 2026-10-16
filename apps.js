// Dash app registry. To add an app: create a folder (e.g. /myapp/ whose index.html loads ../shared/base.css,
// ../shared/theme.js and ../shared/update.js), optionally add its files to PRE in sw.js for offline use,
// and add one entry below. `widget(el)` is optional (a live card on the home screen); `parent` groups shortcuts.
window.DASH_APPS=[
 {id:'nba',name:'DashHoops',tagline:'Live pro basketball scores',path:'nba/',icon:'icons/hoops.svg',widget:nbaWidget,widgetTitle:'Tonight’s games'},
 {id:'notes',name:'Dash Notes',tagline:'Fast, private, offline notes',path:'notes/',icon:'icons/notes.svg',widget:notesWidget,widgetTitle:'Notes'},
 {id:'finance',name:'Dash Finance',tagline:'Business income, expenses and taxes',path:'finance/',icon:'icons/finance.svg',widget:financeWidget,widgetTitle:'Business finances'},
 {id:'games',name:'Dash Games',tagline:'Quick single-player games',path:'games/',icon:'icons/games.svg',widget:gamesWidget,widgetTitle:'Your best scores'},
 {id:'orbit',name:'Orbit Merge',path:'games/orbit/',icon:'icons/orbit.svg',parent:'games'},
 {id:'pilot',name:'Paper Pilot',path:'games/pilot/',icon:'icons/pilot.svg',parent:'games'},
 {id:'bloom',name:'Bloom Blocks',path:'games/bloom/',icon:'icons/bloom.svg',parent:'games'},
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function gamesWidget(el){const I=DASH_ICON,L=DASH_APPS.filter(a=>a.parent==='games'),bs=L.map(a=>+localStorage.getItem('dash-games-'+a.id+'-best')||0);
 el.innerHTML=`<a class="gcard" href="games/"><ul class="glist">${L.map((a,i)=>`<li><img src="${a.icon}" width="40" height="40" alt=""><span class="gn"><b>${esc(a.name)}</b><small>${bs[i]?`${I('trophy','sm')} Best ${bs[i].toLocaleString()}`:'Not played yet'}</small></span></li>`).join('')}</ul><span class="gcta">${I('play','sm')} Play in Dash Games</span></a>`}
function nbaWidget(el){let timer;const I=DASH_ICON,ymd=d=>`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
 const tm=iso=>new Date(iso).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
 async function load(){try{const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${ymd(new Date())}`,{cache:'no-store'});if(!r.ok)throw 0;const d=await r.json(),ev=d.events||[];
  if(!ev.length){el.innerHTML=`<p class="muted">${I('calendar','sm')} No games today.</p>`;window.dashStat&&dashStat('nba','No games today');return}
  const rank={in:0,pre:1,post:2};ev.sort((x,y)=>rank[x.status.type.state]-rank[y.status.type.state]||new Date(x.date)-new Date(y.date));const nLive=ev.filter(e=>e.status.type.state==='in').length;
  const team=(t,st,home)=>`<span class="tk-t"><img src="${esc(t.team.logo||'')}" width="22" height="22" alt="" loading="lazy"><b>${home?'<i class="tk-at" aria-hidden="true">@</i>':''}${esc(t.team.abbreviation)}</b>${st==='pre'?'':`<span class="tk-s${t.winner?' w':''}">${esc(t.score)}</span>`}</span>`;
  el.innerHTML=`<div class="ticker">${ev.map(e=>{const c=e.competitions[0].competitors,h=c.find(x=>x.homeAway==='home'),a=c.find(x=>x.homeAway==='away'),s=e.status.type.state;
   return`<a class="tk${s==='in'?' on':''}" href="nba/?game=${encodeURIComponent(e.id)}">${team(a,s)}${team(h,s,1)}<span class="${s==='in'?'pill live':'pill'}">${s==='pre'?tm(e.date)+' ET':esc(e.status.type.shortDetail.replace(' - ',' · '))}</span></a>`}).join('')}</div>`;
  window.dashStat&&dashStat('nba',nLive?`${nLive} live now`:`${ev.length} games today`,nLive>0);
  clearTimeout(timer);if(nLive)timer=setTimeout(()=>document.visibilityState==='visible'?load():document.addEventListener('visibilitychange',load,{once:true}),25000)}
  catch(e){el.innerHTML=`<p class="muted">Scores unavailable right now — you may be offline.</p>`}}
 load();addEventListener('online',load)}

function notesWidget(el){const I=DASH_ICON;if(!window.NotesDB){el.innerHTML='<p class="muted">Open Dash Notes to get started.</p>';return}
 async function draw(){let L=[];try{L=(await NotesDB.all('notes')).filter(n=>!n.trashed&&!n.archived).sort((a,b)=>(b.pinned-a.pinned)||b.updated-a.updated)}catch(e){}
  const plain=s=>String(s||'').replace(/!?\[[^\]]*\]\([^)]*\)/g,' ').replace(/^\s*([-*+]|\d+[.)])\s+(\[[ xX]\]\s+)?/gm,'').replace(/^\s*\|?[\s:|-]*-{3,}[\s:|-]*$/gm,' ').replace(/[#>*_~=`|\[\]()!-]/g,' ').replace(/\s+/g,' ').trim().slice(0,80);
  el.querySelector('.nlist').innerHTML=L.length?L.slice(0,4).map(n=>`<li><a href="notes/#n=${encodeURIComponent(n.id)}"><span class="nic">${I(n.locked?'lock':n.pinned?'pin':'note','sm')}</span><span class="nt"><b>${esc(n.title||'Untitled')}</b><small>${n.locked?'Locked note':esc(plain(n.body))||'No additional text'}</small></span></a></li>`).join(''):'<li class="muted" style="padding:8px 0">No notes yet — jot one down above.</li>'}
 el.innerHTML=`<form class="qadd"><label class="sr" for="qn">Quick note</label><input id="qn" placeholder="Quick note…" autocomplete="off" enterkeyhint="done"><button class="primary iconbtn" aria-label="Add note">${I('plus')}</button></form><ul class="nlist"></ul>`;
 el.querySelector('form').onsubmit=async e=>{e.preventDefault();const v=el.querySelector('#qn').value.trim();if(!v)return;const[t,...rest]=v.split(/\n/);await NotesDB.put('notes',NotesDB.blank({title:t.slice(0,120),body:rest.join('\n')}));el.querySelector('#qn').value='';draw()};
 draw();document.addEventListener('visibilitychange',()=>document.visibilityState==='visible'&&draw())}

function financeWidget(el){const I=DASH_ICON,F=window.FinDB;if(!F){el.innerHTML='<p class="muted">Open Dash Finance to get started.</p>';return}
 async function draw(){let s;try{s=await F.load()}catch(e){el.innerHTML='<p class="muted">Finance data is unavailable in this browser mode.</p>';return}
  if(s.settings.lock){el.innerHTML=`<p class="muted fin-locked">${I('lock','sm')} Dash Finance is locked. Open it to see your numbers.</p>`;window.dashStat&&dashStat('finance','Finance locked');return}
  const t=F.today(),d=F.D(t),f=F.today(new Date(d.getFullYear(),d.getMonth(),1)),e=F.today(new Date(d.getFullYear(),d.getMonth()+1,0)),fl=F.flows(s,f,e),bal=F.total(s),mx=Math.max(fl.inc,fl.exp,1);
  const mon=d.toLocaleDateString('en-US',{month:'long'});
  el.querySelector('.fin-sum').innerHTML=`<div class="fin-bal"><small>Current balance</small><b>${F.money(bal)}</b></div><div class="fin-io"><div><span>${I('arrow-in','sm')} Income · ${mon}</span><b class="fin-in">${F.money(fl.inc)}</b><i class="fbar"><i style="width:${fl.inc/mx*100}%"></i></i></div><div><span>${I('arrow-out','sm')} Expenses · ${mon}</span><b>${F.money(fl.exp)}</b><i class="fbar out"><i style="width:${fl.exp/mx*100}%"></i></i></div></div>`;
  window.dashStat&&dashStat('finance',`Balance ${F.money(bal)}`)}
 el.innerHTML=`<div class="fin-sum"></div><form class="fqa" novalidate><div class="fseg" role="group" aria-label="Type"><button type="button" data-ft="expense" aria-pressed="true">Expense</button><button type="button" data-ft="income" aria-pressed="false">Income</button></div><label class="sr" for="fqA">Amount</label><input id="fqA" inputmode="decimal" placeholder="$0.00" autocomplete="off"><label class="sr" for="fqP">Description</label><input id="fqP" placeholder="Payee or note" autocomplete="off"><button class="primary iconbtn" aria-label="Add transaction">${I('plus')}</button><p class="fq-msg muted" aria-live="polite"></p></form>`;
 let type='expense';el.querySelectorAll('[data-ft]').forEach(b=>b.onclick=()=>{type=b.dataset.ft;el.querySelectorAll('[data-ft]').forEach(x=>x.setAttribute('aria-pressed',x===b))});
 el.querySelector('form').onsubmit=async ev=>{ev.preventDefault();const msg=el.querySelector('.fq-msg'),amt=F.cents(el.querySelector('#fqA').value);if(!(amt>0)){msg.textContent='Enter an amount, e.g. 42.50';return}
  const s=await F.load();if(s.settings.lock){msg.textContent='Unlock Dash Finance to add.';return}const now=Date.now(),payee=el.querySelector('#fqP').value.trim().slice(0,120),prev=payee&&s.tx.find(x=>x.payee&&x.payee.toLowerCase()===payee.toLowerCase()&&x.type===type&&x.cat);
  s.tx.push({id:F.uid(),type,amt,date:F.today(),acct:F.defaultAcct(s),cat:prev?prev.cat:F.defaultCat(s,type),payee,method:'',notes:'Added from Dash home',tags:[],receipt:null,created:now,updated:now});await F.save(s);
  el.querySelector('#fqA').value='';el.querySelector('#fqP').value='';msg.textContent=`${type==='income'?'Income':'Expense'} of ${F.money(amt)} added`;draw()};
 draw();document.addEventListener('visibilitychange',()=>document.visibilityState==='visible'&&draw())}
