(()=>{'use strict';
const KEY='fitness-tracker-entries-v1',SKEY='im-tracker-settings-v1',TYPES=['swim','bike','run','brick','strength','other'],MAIN=['swim','bike','run'];
const IM={swim:3.8,bike:180,run:42.2},KM_MI=1.609344,M_YD=.9144,DAY=864e5;
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const col=t=>`var(--${t})`;
let entries=load(KEY,[]),S=Object.assign({units:'metric',swimUnit:'m',raceName:'',raceDate:'',planStart:'',planWeeks:30,targets:{swim:3,bike:7,run:4,brick:1,strength:1,other:0}},load(SKEY,{}));
let period='week',shown=50,dirty=true;
function load(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}}
// migrate v1 entries
entries.forEach(e=>{if(e.type==='cycle')e.type='bike';if(e.type==='walk')e.type='other';if(!TYPES.includes(e.type))e.type='other';if(!e.sample&&/^\[sample\]/.test(e.notes||''))e.sample=true});
const persist=()=>{localStorage.setItem(KEY,JSON.stringify(entries));dirty=true;render()};
const saveS=()=>{localStorage.setItem(SKEY,JSON.stringify(S));render()};
const iso=d=>new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const parse=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r1=n=>Math.round(n*10)/10,today=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
const monday=x=>{const s=new Date(x);s.setHours(0,0,0,0);s.setDate(s.getDate()-((s.getDay()+6)%7));return s};
const hm=min=>{min=Math.round(min);const h=Math.floor(min/60),m=min%60;return h?`${h}h${m?` ${m}m`:''}`:`${m}m`};
const mmss=sec=>{sec=Math.round(sec);return`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`};
const isSwim=t=>t==='swim',runLike=t=>t==='run'||t==='brick';
// units: distance stored canonically in km
const unit=t=>isSwim(t)?S.swimUnit:S.units==='imperial'?'mi':'km';
const fromKm=(t,km)=>isSwim(t)?km*1000/(S.swimUnit==='yd'?M_YD:1):S.units==='imperial'?km/KM_MI:km;
const toKm=(t,v)=>isSwim(t)?v*(S.swimUnit==='yd'?M_YD:1)/1000:S.units==='imperial'?v*KM_MI:v;
const distStr=(t,km)=>{const v=fromKm(t,km);return isSwim(t)?`${Math.round(v).toLocaleString()} ${unit(t)}`:`${r1(v)} ${unit(t)}`};
function pace(e){if(!e.distance||!e.duration)return'';const v=fromKm(e.type,e.distance),u=unit(e.type);
 if(isSwim(e.type))return`${mmss(e.duration*60/(v/100))} /100${u}`;
 if(e.type==='bike')return`${r1(v/(e.duration/60))} ${u==='mi'?'mph':'km/h'}`;
 if(runLike(e.type)||e.type==='other')return`${mmss(e.duration*60/v)} /${u}`;return''}
// ---------- form ----------
$('#typeChips').innerHTML=TYPES.map((t,i)=>`<input type="radio" name="type" id="t-${t}" value="${t}"${i===2?' checked':''}><label for="t-${t}">${t}</label>`).join('');
$('#durChips').innerHTML=[30,45,60,90,120,180].map(m=>`<button type="button" class="chip" data-dur="${m}">${m}</button>`).join('');
$('#rpe').innerHTML+=Array.from({length:10},(_,i)=>`<option>${i+1}</option>`).join('');
$('#filter').innerHTML+=TYPES.map(t=>`<option value="${t}">${t[0].toUpperCase()+t.slice(1)}</option>`).join('');
$('#targetInputs').innerHTML=TYPES.map(t=>`<label style="text-transform:capitalize">${t}<input type="number" min="0" max="60" step="0.5" inputmode="decimal" id="tg-${t}"></label>`).join('');
const curType=()=>document.querySelector('input[name=type]:checked').value;
const setUnitLbl=()=>{const t=curType();$('#distUnit').textContent=t==='strength'?'n/a':unit(t);$('#distance').disabled=t==='strength';$('#distance').step=isSwim(t)?'25':'any'};
$('#typeChips').addEventListener('change',setUnitLbl);
$('#durChips').addEventListener('click',e=>{const b=e.target.closest('[data-dur]');if(b)$('#duration').value=b.dataset.dur});
$('#date').value=iso(new Date());
const flash=(el,m)=>{$(el).textContent=m;clearTimeout(flash[el]);flash[el]=setTimeout(()=>$(el).textContent='',2500)};
function fill(o,edit){$('#t-'+o.type).checked=true;setUnitLbl();$('#date').value=edit?o.date:iso(new Date());$('#duration').value=o.duration;
 $('#distance').value=o.distance!=null?(isSwim(o.type)?Math.round(fromKm(o.type,o.distance)):r1(fromKm(o.type,o.distance))):'';
 ['hr','rpe','calories'].forEach(k=>$('#'+k).value=o[k]??'');$('#notes').value=edit?o.notes||'':''}
function resetForm(){const t=curType();$('#form').reset();$('#t-'+t).checked=true;$('#eid').value='';$('#date').value=iso(new Date());$('#saveBtn').textContent='Add session';$('#formTitle').textContent='Quick add session';$('#cancelEdit').hidden=true;setUnitLbl()}
$('#cancelEdit').onclick=resetForm;
$('#repeatBtn').onclick=()=>{const l=[...entries].filter(e=>!e.sample).sort((a,b)=>b.date.localeCompare(a.date))[0]||entries[entries.length-1];if(l){fill(l,false);flash('#status','Copied last session — adjust and save')}else flash('#status','No sessions yet')};
$('#form').onsubmit=e=>{e.preventDefault();const t=curType(),num=id=>$(id).value===''||$(id).disabled?null:+$(id).value,d=num('#distance');
 const o={id:$('#eid').value||(crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random())),type:t,date:$('#date').value,duration:+$('#duration').value,distance:d!=null?toKm(t,d):null,hr:num('#hr'),rpe:num('#rpe'),calories:num('#calories'),notes:$('#notes').value.trim()};
 const i=entries.findIndex(x=>x.id===o.id);i>=0?entries[i]=o:entries.push(o);flash('#status',i>=0?'Saved changes':'Session added ✓');resetForm();persist()};
// ---------- list (paged + delegated) ----------
let sorted=[];
function renderList(){if(dirty){sorted=[...entries].sort((a,b)=>b.date.localeCompare(a.date));dirty=false}
 const f=$('#filter').value,l=f?sorted.filter(e=>e.type===f):sorted;
 $('#entries').innerHTML=l.length?l.slice(0,shown).map(e=>{const bits=[hm(e.duration)];if(e.distance)bits.push(distStr(e.type,e.distance));const p=pace(e);if(p)bits.push(p);
  const sub=[e.hr?`♥ ${e.hr}`:'',e.rpe?`RPE ${e.rpe}`:'',e.calories?`${e.calories} kcal`:'',esc(e.notes)].filter(Boolean).join(' · ');
  return`<div class="entry"><span class="badge" style="background:${col(e.type)}">${e.type}</span><div class="info"><div><b>${bits.join(' · ')}</b> <span class="muted">${e.date}</span></div><div class="sub">${sub}</div></div><button data-edit="${e.id}" aria-label="Edit ${e.type} on ${e.date}">✎</button><button class="danger" data-del="${e.id}" aria-label="Delete ${e.type} on ${e.date}">✕</button></div>`}).join(''):'<div class="empty">No sessions yet. Add one above, or load sample data in Settings.</div>';
 $('#moreBtn').hidden=l.length<=shown;$('#moreBtn').textContent=`Show more (${l.length-shown} older)`}
$('#entries').addEventListener('click',e=>{const ed=e.target.closest('[data-edit]'),de=e.target.closest('[data-del]');
 if(ed){const o=entries.find(x=>x.id===ed.dataset.edit);fill(o,true);$('#eid').value=o.id;$('#saveBtn').textContent='Save changes';$('#formTitle').textContent='Edit session';$('#cancelEdit').hidden=false;scrollTo({top:0,behavior:'smooth'});$('#duration').focus({preventScroll:true})}
 if(de&&confirm('Delete this session?')){entries=entries.filter(x=>x.id!==de.dataset.del);persist()}});
$('#moreBtn').onclick=()=>{shown+=100;renderList()};$('#filter').onchange=()=>{shown=50;renderList()};
// ---------- navigation ----------
$$('[role=tab]').forEach(b=>b.onclick=()=>{$$('[role=tab]').forEach(x=>x.setAttribute('aria-selected',x===b));$$('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+b.dataset.view));render()});
$$('#period button').forEach(b=>b.onclick=()=>{period=b.dataset.p;$$('#period button').forEach(x=>x.setAttribute('aria-pressed',x===b));renderProgress()});
$('#metric').onchange=renderProgress;
// ---------- aggregation ----------
const inR=(s,e)=>entries.filter(x=>{const d=parse(x.date);return d>=s&&d<e});
function agg(l){const a={sessions:0,minutes:0,calories:0,by:{}};TYPES.forEach(t=>a.by[t]={sessions:0,minutes:0,km:0,calories:0});
 l.forEach(e=>{const b=a.by[e.type];a.sessions++;a.minutes+=e.duration;a.calories+=e.calories||0;b.sessions++;b.minutes+=e.duration;b.km+=e.distance||0;b.calories+=e.calories||0});return a}
function shift(d,p,n){const x=new Date(d);if(p==='week')x.setDate(x.getDate()+7*n);else if(p==='month')x.setMonth(x.getMonth()+n);else x.setFullYear(x.getFullYear()+n);return x}
function startOf(d,p){return p==='week'?monday(d):p==='month'?new Date(d.getFullYear(),d.getMonth(),1):new Date(d.getFullYear(),0,1)}
function plan(){const first=sorted.length?sorted[sorted.length-1].date:null,startStr=S.planStart||first;if(!startStr)return null;
 const start=monday(parse(startStr));let end,weeks;
 if(S.raceDate){const r=parse(S.raceDate);weeks=Math.max(1,Math.ceil((r-start+DAY)/(7*DAY)));end=r}else{weeks=+S.planWeeks||30;end=new Date(start.getTime()+weeks*7*DAY)}
 const t=today(),wk=Math.floor((t-start)/(7*DAY))+1,months=Math.max(1,Math.round(weeks/4.345)),mo=Math.min(months,Math.floor((wk-1)/4.345)+1);
 return{start,end,weeks,wk,mo,months,days:Math.ceil((end-t)/DAY)}}
function phase(wk,n){const f=wk/n;return wk<1?'Pre-plan':wk>n?'Post-race / recovery':f<=.35?'Base':f<=.7?'Build':f<=.9?'Peak':'Taper'}
function renderRace(){const p=plan(),el=$('#race');
 if(!p){el.innerHTML=`<div><h2>Training plan</h2><p class="muted">Log your first session (or set a plan start in Settings) to start a ${S.planWeeks||30}-week plan. Race date is optional.</p></div>`;return}
 const wkTxt=p.wk<1?`Starts in ${1-p.wk} wk`:p.wk>p.weeks?'Plan complete':`Week ${p.wk} of ${p.weeks}`,moTxt=p.wk<1?'':`Month ${Math.max(1,p.mo)} of ${p.months}`;
 const pct=Math.min(100,Math.max(0,(p.wk-1)/p.weeks*100));
 el.innerHTML=`<div style="flex:1;min-width:220px"><h2>${esc(S.raceName)||(S.raceDate?'Race':'Ironman plan')}</h2><div class="muted">${S.raceDate?`Race day ${parse(S.raceDate).toLocaleDateString(undefined,{dateStyle:'medium'})}`:`No race date set — ${p.weeks}-week plan from ${p.start.toLocaleDateString()}`} · Phase: <b>${phase(p.wk,p.weeks)}</b></div>
 <div class="track" style="margin-top:10px" role="progressbar" aria-label="Plan progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><div style="width:${pct}%;background:var(--acc2)"></div></div></div>
 <div class="big"><div><b>${wkTxt.replace(/^Week /,'')}</b><span class="muted">${p.wk>=1&&p.wk<=p.weeks?'Training week':wkTxt}</span></div>${moTxt?`<div><b>${moTxt.replace(/^Month /,'')}</b><span class="muted">Month</span></div>`:''}<div><b>${Math.max(0,p.days)}</b><span class="muted">Days ${S.raceDate?'to race':'left in plan'} · ${Math.max(0,Math.ceil(p.days/7))} wk</span></div></div>`}
function chg(c,p){if(!p&&!c)return'<span class="muted">—</span>';if(!p)return'<span style="color:var(--acc2)">new</span>';const d=Math.round((c-p)/p*100);return`<span style="color:${d>=0?'var(--acc2)':'var(--danger)'}">${d>=0?'▲':'▼'} ${Math.abs(d)}%</span>`}
function renderProgress(){if(dirty)renderList();renderRace();
 const t=today(),start=startOf(t,period),end=shift(start,period,1),prevS=shift(start,period,-1),cur=agg(inR(start,end)),ptd=Math.min(end-start,t-start+DAY),prev=agg(inR(prevS,new Date(prevS.getTime()+ptd)));
 const pname={week:'week',month:'month',year:'year'}[period];
 $('#rangeLbl').textContent=`This ${pname}: ${start.toLocaleDateString()} – ${new Date(end-DAY).toLocaleDateString()}`;
 const dist=t=>{const k=cur.by[t].km;return k?distStr(t,k):'—'};
 $('#stats').innerHTML=[['Sessions',cur.sessions,chg(cur.sessions,prev.sessions)],['Time',hm(cur.minutes),chg(cur.minutes,prev.minutes)],['Swim',dist('swim'),chg(cur.by.swim.km,prev.by.swim.km)],['Bike',dist('bike'),chg(cur.by.bike.km,prev.by.bike.km)],['Run',dist('run'),chg(cur.by.run.km+cur.by.brick.km,prev.by.run.km+prev.by.brick.km)]]
  .map(([k,v,c])=>`<div class="stat"><b>${v}</b><span>${k} · ${c}</span></div>`).join('');
 // stacked chart
 const n=period==='year'?5:12,m=$('#metric').value,buckets=[];for(let i=n-1;i>=0;i--){const s=shift(start,period,-i);buckets.push({s,a:agg(inR(s,shift(s,period,1)))})}
 const val=(a,ty)=>m==='hours'?a.by[ty].minutes/60:a.by[ty][m];const tot=buckets.map(b=>TYPES.reduce((x,ty)=>x+val(b.a,ty),0)),max=Math.max(1,...tot),W=600,H=225,P=32,bw=(W-P)/n;
 const lab=s=>period==='week'?`${s.getMonth()+1}/${s.getDate()}`:period==='month'?s.toLocaleString(undefined,{month:'short'}):s.getFullYear();
 $('#chart').innerHTML=`<svg viewBox="0 0 ${W} 250" role="img" aria-label="${m} per ${pname} by discipline">${[0,.5,1].map(f=>`<line x1="${P}" x2="${W}" y1="${H-f*(H-15)}" y2="${H-f*(H-15)}" stroke="var(--line)"/><text x="0" y="${H-f*(H-15)+4}">${r1(max*f)}</text>`).join('')}${buckets.map((b,i)=>{let y=H;return TYPES.map(ty=>{const h=val(b.a,ty)/max*(H-15);if(!h)return'';y-=h;return`<rect x="${P+i*bw+bw*.15}" y="${y}" width="${bw*.7}" height="${h}" fill="${col(ty)}"><title>${lab(b.s)} ${ty}: ${r1(val(b.a,ty))}</title></rect>`}).join('')+`<text x="${P+i*bw+bw/2}" y="${H+17}" text-anchor="middle">${lab(b.s)}</text>`}).join('')}</svg>`;
 $('#legend').innerHTML=TYPES.map(ty=>`<span><i style="background:${col(ty)}"></i>${ty}</span>`).join('');
 // breakdown with change
 $('#bdTitle').textContent=`Breakdown · vs same point last ${pname}`;const tm=Math.max(1,...TYPES.map(ty=>cur.by[ty].minutes));
 $('#breakdown').innerHTML=TYPES.filter(ty=>cur.by[ty].sessions||prev.by[ty].sessions).map(ty=>{const b=cur.by[ty];return`<div class="brow"><span>${ty}</span><div class="track"><div style="width:${b.minutes/tm*100}%;background:${col(ty)}"></div></div><span class="muted">${hm(b.minutes)} · ${chg(b.minutes,prev.by[ty].minutes)}</span></div>`}).join('')||'<div class="empty">No sessions this period.</div>';
 // targets (always this week)
 const w=agg(inR(monday(t),new Date(monday(t).getTime()+7*DAY)));
 $('#targets').innerHTML=TYPES.filter(ty=>+S.targets[ty]>0||w.by[ty].minutes).map(ty=>{const h=w.by[ty].minutes/60,tg=+S.targets[ty]||0,p=tg?Math.min(100,h/tg*100):100;return`<div class="brow"><span>${ty}</span><div class="track" role="progressbar" aria-label="${ty} hours vs target" aria-valuenow="${Math.round(p)}" aria-valuemin="0" aria-valuemax="100"><div style="width:${p}%;background:${col(ty)}"></div></div><span class="muted">${r1(h)} / ${tg||'–'} h${tg&&h>=tg?' ✓':''}</span></div>`}).join('');
 // long sessions
 $('#longs').innerHTML=MAIN.map(ty=>{const l=entries.filter(e=>(e.type===ty||(ty==='run'&&e.type==='brick'))&&e.distance);const best=l.reduce((a,e)=>!a||e.distance>a.distance?e:a,null),
  r28=l.filter(e=>parse(e.date)>=new Date(t-28*DAY)).reduce((a,e)=>Math.max(a,e.distance),0),p=best?Math.min(100,best.distance/IM[ty]*100):0;
  return`<div class="brow"><span>${ty}</span><div class="track" role="progressbar" aria-label="Longest ${ty} as percent of Ironman distance" aria-valuenow="${Math.round(p)}" aria-valuemin="0" aria-valuemax="100"><div style="width:${p}%;background:${col(ty)}"></div></div><span class="muted">${best?distStr(ty,best.distance):'—'} / ${distStr(ty,IM[ty])}</span></div><div class="muted" style="margin:-6px 0 6px 84px">${best?`${Math.round(p)}% · best ${best.date} · last 4 wk ${r28?distStr(ty,r28):'—'}`:'No sessions with distance'}</div>`}).join('');
 // streaks
 const days=new Set(entries.map(e=>e.date)),d=new Date();let cs=0;if(!days.has(iso(d)))d.setDate(d.getDate()-1);while(days.has(iso(d))){cs++;d.setDate(d.getDate()-1)}
 let best=0,run=0,pv=null;[...days].sort().forEach(s=>{const x=parse(s);run=pv&&(x-pv)/DAY<1.5?run+1:1;best=Math.max(best,run);pv=x});
 const wks=new Set([...days].map(s=>iso(monday(parse(s)))));let ws=0,wd=monday(t);if(!wks.has(iso(wd)))wd.setDate(wd.getDate()-7);while(wks.has(iso(wd))){ws++;wd.setDate(wd.getDate()-7)}
 $('#streaks').innerHTML=`<div class="big"><div><b>${cs}</b><span class="muted">Day streak</span></div><div><b>${best}</b><span class="muted">Longest day streak</span></div><div><b>${ws}</b><span class="muted">Active-week streak</span></div></div>`}
// ---------- settings ----------
function fillSettings(){['raceName','raceDate','planStart','planWeeks','units','swimUnit'].forEach(k=>$('#'+k).value=S[k]??'');TYPES.forEach(t=>$('#tg-'+t).value=S.targets[t]??0)}
$('#setForm').onsubmit=e=>{e.preventDefault();['raceName','raceDate','planStart','units','swimUnit'].forEach(k=>S[k]=$('#'+k).value);S.planWeeks=+$('#planWeeks').value||30;TYPES.forEach(t=>S.targets[t]=+$('#tg-'+t).value||0);saveS();setUnitLbl();flash('#setStatus','Saved ✓')};
$('#exportBtn').onclick=()=>{const b=new Blob([JSON.stringify({app:'im-tracker',version:2,exported:new Date().toISOString(),settings:S,entries},null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=`im-tracker-backup-${iso(new Date())}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};
$('#importBtn').onclick=()=>$('#importFile').click();
$('#importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text()),l=Array.isArray(j)?j:j.entries;if(!Array.isArray(l))throw 0;
 const ok=l.filter(x=>x&&x.date&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&+x.duration>0).map(x=>({...x,id:String(x.id||Math.random()),type:TYPES.includes(x.type)?x.type:x.type==='cycle'?'bike':'other',duration:+x.duration}));
 const replace=confirm(`Import ${ok.length} sessions.\nOK = REPLACE all current data\nCancel = MERGE (same IDs overwritten)`);
 if(replace)entries=ok;else{const m=new Map(entries.map(x=>[x.id,x]));ok.forEach(x=>m.set(x.id,x));entries=[...m.values()]}
 if(j.settings&&replace)S=Object.assign(S,j.settings);localStorage.setItem(SKEY,JSON.stringify(S));fillSettings();persist();alert('Import complete')}catch{alert('Not a valid backup file')}e.target.value=''};
$('#clearBtn').onclick=()=>{if(entries.length&&confirm('Delete ALL sessions? Export a backup first if unsure.')){entries=[];persist()}};
$('#clearSampleBtn').onclick=()=>{const n=entries.filter(e=>e.sample).length;if(!n)return alert('No sample data present');entries=entries.filter(e=>!e.sample);persist()};
$('#sampleBtn').onclick=()=>{if(!confirm('Load a generated 20-week SAMPLE Ironman build? Existing sample entries are replaced; your own sessions are kept.'))return;
 let seed=42;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647,j=(a,b)=>a+(b-a)*rnd();
 entries=entries.filter(e=>!e.sample);const t=today(),start=new Date(monday(t).getTime()-19*7*DAY),W=20;
 const add=(d,type,dur,kmPerMin,hr,rpe,note)=>{if(d>t||rnd()<.06)return;dur=Math.round(dur/5)*5;entries.push({id:'sample-'+iso(d)+'-'+type+'-'+entries.length,sample:true,type,date:iso(d),duration:dur,distance:kmPerMin?Math.round(dur*kmPerMin*j(.95,1.05)*100)/100:null,hr:hr?Math.round(j(hr-4,hr+4)):null,rpe,calories:Math.round(dur*j(8,11)),notes:'[sample] '+note})};
 for(let w=0;w<W;w++){const rec=w%4===3,s=(0.65+0.5*w/(W-1))*(rec?.7:1),D=i=>new Date(start.getTime()+(w*7+i)*DAY),ph=w<7?'Base':w<14?'Build':'Peak';
  add(D(0),'swim',55*s,.026*j(.95,1.05),0,4,`${ph}: technique + 8×100 pull`);add(D(0),'strength',40,0,0,5,'Core & posterior chain');
  add(D(1),'bike',75*s,.48,142,7,`${ph}: 4×8 min sweet spot`);add(D(1),'run',35*s,.175,148,5,'Easy run off intervals');
  add(D(2),'swim',65*s,.027,0,6,`${ph}: CSS set 10×200`);add(D(2),'run',55*s,.18,155,7,`${ph}: 3×10 min tempo`);
  add(D(3),'bike',90*s,.47,135,5,'Z2 endurance spin');add(D(3),'strength',30,0,0,4,'Mobility + single-leg work');
  add(D(4),'swim',60*s,.026,0,5,'Open-water skills / sighting');
  const lr=Math.min(330,(150+190*w/(W-1)))*(rec?.65:1);add(D(5),'bike',lr,.45,132,6,`Long ride Z2 — ${ph}`);add(D(5),'brick',Math.min(45,15+w*1.6)*(rec?.6:1),.172,150,7,'Brick run off the bike');
  add(D(6),'run',Math.min(165,70+100*w/(W-1))*(rec?.7:1),.163,140,6,`Long run Z2 — ${ph}`)}
 if(!S.planStart){S.planStart=iso(start);localStorage.setItem(SKEY,JSON.stringify(S));fillSettings()}persist();alert('Sample data loaded (tagged [sample]). See the Progress tab.')};
function render(){renderList();if($('#view-progress').classList.contains('active'))renderProgress()}
fillSettings();setUnitLbl();render();
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
})();
