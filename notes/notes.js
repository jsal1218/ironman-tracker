(()=>{'use strict';
const DB=NotesDB,I=DASH_ICON,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],esc=MD.esc,DAY=864e5;
const COLORS={'':'None',green:'#0b8a62',gold:'#c99a1e',blue:'#3b82c4',rose:'#d0567a',violet:'#8a63d2',slate:'#6b7c74'};
const TEMPLATES={
 meeting:['Meeting notes',d=>`## Meeting — ${d}\n\n**Attendees:** \n\n### Agenda\n- \n\n### Notes\n- \n\n### Decisions\n- \n\n### Action items\n- [ ] Owner — task — due\n`],
 journal:['Daily journal',d=>`## ${d}\n\n### Grateful for\n1. \n\n### Today's focus\n- [ ] \n\n### Notes\n\n### Reflection\n`],
 todo:['To-do list',()=>`## To-do\n\n- [ ] \n- [ ] \n- [ ] \n\n### Later\n- [ ] \n`],
 workout:['Workout log',d=>`## Workout — ${d}\n\n**Type:** \n**Duration:** min\n**Effort (1–10):** \n\n| Exercise | Sets | Reps | Weight |\n|---|---|---|---|\n|  |  |  |  |\n\n### Notes\n`]};
let notes=[],cur=null,view={k:'all'},preview=false,dirty=false,saveT=null,lastSnap={},keys={},atturl={},meta={notebooks:[]};
const nowStr=()=>new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
const fmt=t=>{const d=new Date(t),n=new Date();return d.toDateString()===n.toDateString()?d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}):d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:d.getFullYear()===n.getFullYear()?undefined:'numeric'})};
const fmtDue=t=>new Date(t).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>t.hidden=true,2400)}
const text=n=>n.locked?(n._plain??''):n.body;
const words=s=>(MD.plain(s).match(/\S+/g)||[]).length;
const tasks=s=>{const a=(s.match(/^\s*(?:>\s*)?[-*+]\s+\[[ xX]\]/gm)||[]).length,d=(s.match(/^\s*(?:>\s*)?[-*+]\s+\[[xX]\]/gm)||[]).length;return[d,a]};
// ---------- crypto (per-note lock) ----------
const b64=b=>btoa(String.fromCharCode(...new Uint8Array(b))),ub64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function derive(pw,salt){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:210000,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function seal(key,salt,plain){const iv=crypto.getRandomValues(new Uint8Array(12)),ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(plain));return{salt:b64(salt),iv:b64(iv),ct:b64(ct),v:1}}
async function open_(key,L){return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub64(L.iv)},key,ub64(L.ct)))}
// ---------- load ----------
async function load(){notes=await DB.all('notes');meta=Object.assign({notebooks:[]},await DB.get('meta','meta')||{});
 const old=notes.filter(n=>n.trashed&&Date.now()-n.trashed>30*DAY);for(const n of old)await hardDelete(n.id); // auto-purge trash after 30 days
 renderNav();renderList();const h=location.hash.match(/^#n=(.+)$/);if(h)openNote(decodeURIComponent(h[1]));else if(innerWidth>=900){const f=visible()[0];f?openNote(f.id):showEmpty()}else showEmpty()}
async function hardDelete(id){await DB.del('notes',id);for(const v of await DB.byNote('versions',id))await DB.del('versions',v.id);for(const a of await DB.byNote('atts',id))await DB.del('atts',a.id);notes=notes.filter(n=>n.id!==id)}
const saveMeta=()=>DB.put('meta',meta,'meta');
const allTags=()=>[...new Set(notes.filter(n=>!n.trashed).flatMap(n=>n.tags||[]))].sort();
const allNbs=()=>[...new Set([...meta.notebooks,...notes.filter(n=>!n.trashed&&n.notebook).map(n=>n.notebook)])].sort();
// ---------- navigation ----------
function renderNav(){const live=notes.filter(n=>!n.trashed&&!n.archived),c=f=>notes.filter(f).length;
 const V=[['all','note','All notes',live.length],['pinned','pin','Pinned',c(n=>n.pinned&&!n.trashed&&!n.archived)],['due','bell','Due',c(n=>n.due&&!n.dueDone&&!n.trashed)],['archive','archive','Archive',c(n=>n.archived&&!n.trashed)],['trash','trash','Trash',c(n=>n.trashed)]];
 const cur_=(k,v)=>view.k===k&&(v===undefined||view.v===v);
 $('#views').innerHTML=V.map(([k,ic,l,n])=>`<button class="nav" data-view="${k}" aria-current="${cur_(k)}">${I(ic)}${l}<span class="n">${n||''}</span></button>`).join('');
 $('#nbs').innerHTML=allNbs().map(nb=>`<button class="nav" data-view="nb" data-v="${esc(nb)}" aria-current="${cur_('nb',nb)}">${I('folder')}${esc(nb)}<span class="n">${c(n=>n.notebook===nb&&!n.trashed&&!n.archived)||''}</span></button>`).join('')||'<p class="muted" style="padding:0 10px">No notebooks yet</p>';
 $('#tags').innerHTML=allTags().map(t=>`<button class="nav" data-view="tag" data-v="${esc(t)}" aria-current="${cur_('tag',t)}">${I('tag')}${esc(t)}</button>`).join('')||'<p class="muted" style="padding:0 10px">Add tags from a note</p>';
 const opts=(arr,all)=>`<option value="">${all}</option>`+arr.map(x=>`<option>${esc(x)}</option>`).join('');const fn=$('#fNb').value,ft=$('#fTag').value;$('#fNb').innerHTML=opts(allNbs(),'All notebooks');$('#fTag').innerHTML=opts(allTags(),'All tags');$('#fNb').value=fn;$('#fTag').value=ft;
 $('#viewTitle').textContent={all:'All notes',pinned:'Pinned',due:'Due',archive:'Archive',trash:'Trash',nb:view.v,tag:'#'+view.v}[view.k]}
$('#drawer').addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b)return;view={k:b.dataset.view,v:b.dataset.v};document.body.classList.remove('drawer-open');renderNav();renderList()});
$('#menuBtn').onclick=()=>document.body.classList.add('drawer-open');$('#scrim').onclick=()=>document.body.classList.remove('drawer-open');
$('#addNb').onclick=()=>{const n=prompt('New notebook name');if(n&&n.trim()){meta.notebooks=[...new Set([...meta.notebooks,n.trim()])];saveMeta();renderNav()}};
// ---------- list / search ----------
function visible(){const q=$('#q').value.trim().toLowerCase(),toks=q.split(/\s+/).filter(Boolean),fnb=$('#fNb').value,ftag=$('#fTag').value,fd=+$('#fDate').value,fc=$('#fCheck').checked,sort=$('#fSort').value;
 let L=notes.filter(n=>{switch(view.k){case'trash':if(!n.trashed)return false;break;case'archive':if(!n.archived||n.trashed)return false;break;case'due':if(!n.due||n.dueDone||n.trashed)return false;break;
  case'pinned':if(!n.pinned||n.trashed||n.archived)return false;break;case'nb':if(n.notebook!==view.v||n.trashed||n.archived)return false;break;case'tag':if(!(n.tags||[]).includes(view.v)||n.trashed||n.archived)return false;break;default:if(n.trashed||n.archived)return false}
  if(fnb&&n.notebook!==fnb)return false;if(ftag&&!(n.tags||[]).includes(ftag))return false;if(fd&&Date.now()-n.updated>fd*DAY)return false;if(fc&&(n.locked||!tasks(n.body)[1]))return false;
  if(toks.length){const hay=(n.title+' '+(n.locked?'':n.body)+' '+(n.tags||[]).join(' ')+' '+n.notebook).toLowerCase();return toks.every(t=>hay.includes(t.replace(/^#/,'')))}return true});
 if(view.k==='due')return L.sort((a,b)=>a.due-b.due);
 return L.sort((a,b)=>(view.k==='trash'?0:(b.pinned-a.pinned))||(sort==='title'?(a.title||'').localeCompare(b.title||''):b[sort]-a[sort]))}
function hl(s,toks){let h=esc(s);toks.forEach(t=>{if(t.length<1)return;const re=new RegExp('('+esc(t).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig');h=h.replace(/(<[^>]*>)|([^<]+)/g,(m,tag,txt)=>tag||txt.replace(re,'<mark>$1</mark>'))});return h}
function snippet(n,toks){if(n.locked)return`${I('lock','sm')} Locked note`;const p=MD.plain(n.body);if(!p)return'<span class="muted">No additional text</span>';
 let i=toks.length?Math.max(0,p.toLowerCase().indexOf(toks[0].replace(/^#/,''))-40):0;const s=(i>0?'…':'')+p.slice(i,i+160);return hl(s,toks.map(t=>t.replace(/^#/,'')))}
function renderList(){const L=visible(),toks=$('#q').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
 if(!L.length){$('#list').innerHTML=`<li class="empty">${I('note')}<p>${toks.length?'No notes match your search.':view.k==='trash'?'Trash is empty. Deleted notes stay here for 30 days.':view.k==='due'?'Nothing due. Add a reminder from a note’s tag menu.':'No notes here yet.'}</p>${view.k==='all'&&!toks.length?'<button class="primary" id="emptyNew">'+I('plus')+'New note</button>':''}</li>`;$('#emptyNew')&&($('#emptyNew').onclick=()=>newNote());return}
 $('#list').innerHTML=L.map(n=>{const[d,a]=n.locked?[0,0]:tasks(n.body),od=n.due&&!n.dueDone&&n.due<Date.now();
  return`<li class="item" data-id="${n.id}"><div class="swbg" aria-hidden="true"><span>${I('pin','sm')}${n.pinned?'Unpin':'Pin'}</span><span>${I('archive','sm')}${n.archived?'Unarchive':'Archive'}</span></div>
  <button class="card-n${cur&&cur.id===n.id?' sel':''}" style="--c:${COLORS[n.color]&&n.color?COLORS[n.color]:'transparent'}" data-open="${n.id}"><h3>${n.pinned?I('pin','sm'):''}${n.locked?I('lock','sm'):''}${hl(n.title||'Untitled',toks)}</h3><p>${snippet(n,toks)}</p>
  <span class="m">${view.k==='trash'?`Deleted ${fmt(n.trashed)}`:fmt(n.updated)}${n.notebook?` · ${I('folder','sm')} ${esc(n.notebook)}`:''}${a?`<span class="prog">${I('checklist','sm')} ${d}/${a}</span>`:''}${n.due&&!n.dueDone?`<span class="${od?'overdue':''}">${I('bell','sm')} ${fmtDue(n.due)}</span>`:''}${(n.tags||[]).map(t=>`<span class="pill">#${esc(t)}</span>`).join('')}</span></button></li>`}).join('');renderNav()}
['q','fNb','fTag','fDate','fSort','fCheck'].forEach(id=>$('#'+id).addEventListener('input',renderList));
$('#filterBtn').onclick=()=>{const f=$('#filters');f.hidden=!f.hidden;$('#filterBtn').setAttribute('aria-expanded',String(!f.hidden))};
$('#list').addEventListener('click',e=>{if(swiped){swiped=false;return}const b=e.target.closest('[data-open]');if(b)openNote(b.dataset.open)});
// swipe actions: right = pin, left = archive, far left = trash
let sw=null,swiped=false;
$('#list').addEventListener('pointerdown',e=>{const it=e.target.closest('.item');if(!it||e.pointerType==='mouse'&&e.button!==0)return;sw={it,x:e.clientX,y:e.clientY,dx:0,on:false}});
$('#list').addEventListener('pointermove',e=>{if(!sw)return;const dx=e.clientX-sw.x,dy=e.clientY-sw.y;if(!sw.on){if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.3){sw.on=true;sw.it.setPointerCapture(e.pointerId)}else if(Math.abs(dy)>12){sw=null;return}else return}
 sw.dx=dx;const c=sw.it.querySelector('.card-n'),bg=sw.it.querySelector('.swbg');c.style.transform=`translateX(${dx}px)`;bg.className='swbg'+(dx<-170?' d':dx<0?' l':'');if(dx<-170)bg.lastElementChild.innerHTML=I('trash','sm')+'Delete';});
const endSwipe=async()=>{if(!sw)return;const{it,dx,on}=sw;sw=null;const c=it.querySelector('.card-n');c.style.transform='';if(!on)return;swiped=true;setTimeout(()=>swiped=false,50);const n=notes.find(x=>x.id===it.dataset.id);if(!n)return;
 if(dx>80){n.pinned=!n.pinned;await store(n,true);toast(n.pinned?'Pinned':'Unpinned')}else if(dx<-170){await trash(n)}else if(dx<-80){n.archived=!n.archived;await store(n,true);toast(n.archived?'Archived':'Moved to notes');if(cur&&cur.id===n.id&&n.archived&&innerWidth<900)closeEditor()}renderList();try{navigator.vibrate&&navigator.vibrate(10)}catch(e){}};
$('#list').addEventListener('pointerup',endSwipe);$('#list').addEventListener('pointercancel',endSwipe);
// ---------- editor ----------
const TB=[['heading','Heading','h'],['bold','Bold (Ctrl+B)','b'],['italic','Italic (Ctrl+I)','i'],['list','Bulleted list','ul'],['checklist','Checklist','task'],['quote','Quote','q'],['code','Code','code'],['link','Link','link'],['table','Table','table'],['image','Image or file','img'],['note','Link to note','wiki'],['template','Insert template','tpl'],['slash','Commands','slash']];
$('#toolbar').innerHTML=TB.map(([ic,l,a])=>`<button type="button" data-act="${a}" aria-label="${l}" title="${l}">${I(ic)}</button>`).join('');
$('#toolbar').addEventListener('mousedown',e=>e.preventDefault());
$('#toolbar').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b)act(b.dataset.act)});
const ta=$('#body');
function showEmpty(){cur=null;$('#emptyEd').hidden=false;$('#lockGate').hidden=true}
async function openNote(id){await flush();const n=notes.find(x=>x.id===id);if(!n){showEmpty();return}cur=n;history.replaceState(null,'','#n='+encodeURIComponent(id));
 $('#emptyEd').hidden=true;document.body.classList.add('editing');
 if(n.locked&&!keys[n.id]){$('#lockGate').hidden=false;$('#unlockPw').value='';$('#unlockErr').textContent='';setTimeout(()=>$('#unlockPw').focus(),250);renderList();return}
 $('#lockGate').hidden=true;$('#title').value=n.title;ta.value=text(n);lastSnap[n.id]=lastSnap[n.id]||{ts:0,body:ta.value};
 setPreview(!!ta.value&&innerWidth<900);fillMeta();counts();backlinks();renderList();$('#saveState').textContent='';
 if(!n.title&&!n.body)setTimeout(()=>$('#title').focus(),260)}
$('#unlockForm').onsubmit=async e=>{e.preventDefault();const n=cur;try{const k=await derive($('#unlockPw').value,ub64(n.locked.salt));n._plain=await open_(k,n.locked);keys[n.id]=k;openNote(n.id)}catch(err){$('#unlockErr').textContent='Wrong password.'}};
function closeEditor(){flush();document.body.classList.remove('editing');history.replaceState(null,'',location.pathname);renderList()}
$('#backBtn').onclick=closeEditor;
function fillMeta(){const n=cur;$('#pinBtn').setAttribute('aria-pressed',String(!!n.pinned));
 $('#metaRow').innerHTML=[n.notebook&&`<span class="pill">${I('folder','sm')} ${esc(n.notebook)}</span>`,...(n.tags||[]).map(t=>`<span class="pill">#${esc(t)}</span>`),n.due&&`<span class="pill${!n.dueDone&&n.due<Date.now()?' overdue':''}">${I('bell','sm')} ${n.dueDone?'Done':fmtDue(n.due)}</span>`,n.color&&`<span class="pill"><span style="width:10px;height:10px;border-radius:50%;background:${COLORS[n.color]}"></span>${COLORS[n.color]?n.color:''}</span>`,n.locked&&`<span class="pill">${I('lock','sm')} Encrypted</span>`,n.archived&&`<span class="pill">${I('archive','sm')} Archived</span>`,n.trashed&&`<span class="pill">${I('trash','sm')} In trash</span>`].filter(Boolean).join('');
 $('#dates').textContent=`Edited ${fmt(n.updated)} · Created ${fmt(n.created)}`}
function counts(){const w=words(ta.value),[d,a]=tasks(ta.value);$('#counts').textContent=`${w.toLocaleString()} words · ${Math.max(1,Math.ceil(w/220))} min read${a?` · ${d}/${a} done`:''}`}
function setPreview(on){preview=on;ta.hidden=on;$('#preview').hidden=!on;$('#toolbar').hidden=on;$('#modeBtn').innerHTML=I(on?'edit':'eye');$('#modeBtn').setAttribute('aria-label',on?'Edit':'Preview');if(on)renderPreview()}
$('#modeBtn').onclick=()=>{setPreview(!preview);if(!preview)ta.focus()};
function renderPreview(){const el=$('#preview');el.innerHTML=MD.render(ta.value)||'<p class="muted">Nothing here yet.</p>';
 el.querySelectorAll('a.wiki').forEach(a=>{if(!findTitle(a.dataset.wiki))a.classList.add('missing')});resolveAtts(el)}
async function resolveAtts(el){for(const img of el.querySelectorAll('img[data-att]')){const id=img.dataset.att;if(!atturl[id]){const a=await DB.get('atts',id);if(!a)continue;atturl[id]=URL.createObjectURL(a.blob)}img.src=atturl[id]}}
$('#preview').addEventListener('change',e=>{const cb=e.target.closest('input[data-line]');if(!cb)return;const L=ta.value.split('\n'),i=+cb.dataset.line;L[i]=L[i].replace(/\[( |x|X)\]/,cb.checked?'[x]':'[ ]');ta.value=L.join('\n');changed();renderPreview();try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}});
$('#preview').addEventListener('click',async e=>{const w=e.target.closest('a.wiki');if(w){e.preventDefault();const t=findTitle(w.dataset.wiki);if(t)openNote(t.id);else{const n=await newNote({title:w.dataset.wiki},true);toast('Created “'+n.title+'”')}return}
 const a=e.target.closest('a[data-attlink]');if(a){e.preventDefault();const r=await DB.get('atts',a.dataset.attlink);if(r)download(r.blob,r.name)}});
const findTitle=t=>notes.find(n=>!n.trashed&&(n.title||'').trim().toLowerCase()===t.trim().toLowerCase());
function backlinks(){const t=(cur.title||'').trim().toLowerCase();if(!t){$('#backlinks').innerHTML='';return}
 const re=/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g,L=notes.filter(n=>n.id!==cur.id&&!n.trashed&&!n.locked&&[...n.body.matchAll(re)].some(m=>m[1].trim().toLowerCase()===t));
 $('#backlinks').innerHTML=L.length?`<h4>Linked from ${L.length} note${L.length>1?'s':''}</h4>${L.map(n=>`<button data-bl="${n.id}">${I('link','sm')}${esc(n.title||'Untitled')}</button>`).join('')}`:''}
$('#backlinks').addEventListener('click',e=>{const b=e.target.closest('[data-bl]');if(b)openNote(b.dataset.bl)});
function changed(){if(!cur)return;dirty=true;$('#saveState').textContent='Editing…';counts();clearTimeout(saveT);saveT=setTimeout(flush,600)}
ta.addEventListener('input',()=>{changed();slashCheck()});$('#title').addEventListener('input',changed);
$('#title').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ta.focus()}});
async function flush(){clearTimeout(saveT);if(!dirty||!cur)return;dirty=false;const n=cur,body=ta.value;n.title=$('#title').value.trim();
 if(n.locked){if(!keys[n.id])return;n._plain=body;n.locked=await seal(keys[n.id],ub64(n.locked.salt),body);n.body=''}else n.body=body;
 n.updated=Date.now();await store(n);await snapshot(n,body);$('#saveState').textContent='Saved';fillMeta();backlinks();renderList()}
async function store(n,touch){if(touch)n.updated=n.updated||Date.now();const{_plain,...rec}=n;await DB.put('notes',rec);mirror()}
async function snapshot(n,body,force){if(n.locked)return; // locked notes keep no plaintext history
 const s=lastSnap[n.id];if(!force&&s&&Date.now()-s.ts<120000)return;if(s&&s.body===body&&!force)return;
 await DB.put('versions',{id:DB.uid(),noteId:n.id,ts:Date.now(),title:n.title,body});lastSnap[n.id]={ts:Date.now(),body};
 const V=(await DB.byNote('versions',n.id)).sort((a,b)=>b.ts-a.ts);for(const v of V.slice(30))await DB.del('versions',v.id)}
function mirror(){try{const L=notes.filter(n=>!n.trashed&&!n.archived).sort((a,b)=>(b.pinned-a.pinned)||b.updated-a.updated).slice(0,6).map(n=>({id:n.id,t:n.title||'Untitled',p:n.locked?'':MD.plain(n.body).slice(0,90),pin:!!n.pinned,lock:!!n.locked,u:n.updated}));localStorage.setItem('dash-notes-recent',JSON.stringify(L))}catch(e){}}
async function newNote(f,open=true){await flush();const d=nowStr();const n=DB.blank(Object.assign({notebook:view.k==='nb'?view.v:'',tags:view.k==='tag'?[view.v]:[]},f||{}));if(f&&f.tpl){n.title=TEMPLATES[f.tpl][0]+(f.tpl==='todo'?'':' — '+new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'}));n.body=TEMPLATES[f.tpl][1](d);delete n.tpl}
 notes.push(n);await store(n);if(view.k==='trash'||view.k==='archive'||view.k==='due'){view={k:'all'}}renderNav();renderList();if(open){preview=false;await openNote(n.id)}return n}
$('#newBtn').onclick=()=>newNote();$('#newBtn').addEventListener('contextmenu',e=>{e.preventDefault();templatePicker(true)});
$('#pinBtn').onclick=async()=>{if(!cur)return;cur.pinned=!cur.pinned;await store(cur);fillMeta();renderList();toast(cur.pinned?'Pinned':'Unpinned')};
async function trash(n){if(n.trashed){if(!confirm('Delete forever? This cannot be undone.'))return;await hardDelete(n.id);toast('Deleted forever')}else{n.trashed=Date.now();await store(n);toast('Moved to trash — restore within 30 days')}
 if(cur&&cur.id===n.id){if(innerWidth<900)closeEditor();else{const f=visible()[0];f?openNote(f.id):showEmpty()}}renderList()}
// ---------- formatting / slash commands ----------
function wrap(a,b=a,ph='text'){const s=ta.selectionStart,e=ta.selectionEnd,sel=ta.value.slice(s,e)||ph;ta.setRangeText(a+sel+b,s,e,'end');ta.setSelectionRange(s+a.length,s+a.length+sel.length);ta.focus();changed()}
function linePrefix(p){const s=ta.selectionStart,ls=ta.value.lastIndexOf('\n',s-1)+1;ta.setRangeText(p,ls,ls,'end');ta.focus();changed()}
function insert(t,sel){const s=ta.selectionStart;ta.setRangeText(t,s,ta.selectionEnd,'end');if(sel)ta.setSelectionRange(s+sel[0],s+sel[1]);ta.focus();changed()}
function act(a){if(!cur)return;if(preview)setPreview(false);({h:()=>linePrefix('## '),b:()=>wrap('**'),i:()=>wrap('*'),ul:()=>linePrefix('- '),task:()=>linePrefix('- [ ] '),q:()=>linePrefix('> '),code:()=>{const s=ta.value.slice(ta.selectionStart,ta.selectionEnd);s.includes('\n')||!s?insert('\n```\n'+(s||'code')+'\n```\n',[5,5+(s||'code').length]):wrap('`')},
 link:()=>{const s=ta.value.slice(ta.selectionStart,ta.selectionEnd)||'link text';insert(`[${s}](https://)`,[s.length+3,s.length+11])},table:()=>insert('\n| Column | Column |\n|---|---|\n|  |  |\n',[3,9]),img:()=>$('#fileIn').click(),
 wiki:()=>notePicker(),tpl:()=>templatePicker(false),slash:()=>{insert('/');slashCheck()},hr:()=>insert('\n---\n'),date:()=>insert(nowStr()),h1:()=>linePrefix('# '),h3:()=>linePrefix('### '),ol:()=>linePrefix('1. ')}[a]||(()=>{}))()}
const SLASH=[['h1','heading','Heading 1'],['h','heading','Heading 2'],['h3','heading','Heading 3'],['task','checklist','Checklist'],['ul','list','Bulleted list'],['ol','list','Numbered list'],['q','quote','Quote'],['code','code','Code block'],['table','table','Table'],['hr','more','Divider'],['link','link','Web link'],['wiki','note','Link to note'],['img','image','Image or file'],['date','calendar','Today’s date'],['tpl','template','Template…']];
let slashAt=-1,slashSel=0;
function slashCheck(){const s=ta.selectionStart,v=ta.value,ls=v.lastIndexOf('\n',s-1)+1,line=v.slice(ls,s),m=line.match(/(?:^|\s)\/([\w-]*)$/);
 if(!m){hideSlash();return}slashAt=s-m[1].length-1;const q=m[1].toLowerCase(),L=SLASH.filter(x=>x[2].toLowerCase().includes(q));if(!L.length){hideSlash();return}slashSel=Math.min(slashSel,L.length-1);
 const box=$('#slash');box.innerHTML=L.map((x,i)=>`<button type="button" role="option" data-cmd="${x[0]}" aria-selected="${i===slashSel}">${I(x[1])}${x[2]}</button>`).join('');box.hidden=false;
 const lines=v.slice(0,s).split('\n').length;box.style.top=Math.min(ta.clientHeight-200,16+lines*26.4-ta.scrollTop)+'px';box.style.left='18px'}
function hideSlash(){$('#slash').hidden=true;slashAt=-1;slashSel=0}
function runSlash(cmd){const s=ta.selectionStart;ta.setRangeText('',slashAt,s,'end');hideSlash();act(cmd)}
$('#slash').addEventListener('mousedown',e=>e.preventDefault());$('#slash').addEventListener('click',e=>{const b=e.target.closest('[data-cmd]');if(b)runSlash(b.dataset.cmd)});
ta.addEventListener('keydown',e=>{const box=$('#slash');if(!box.hidden){const B=[...box.querySelectorAll('button')];if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();slashSel=(slashSel+(e.key==='ArrowDown'?1:-1)+B.length)%B.length;B.forEach((b,i)=>b.setAttribute('aria-selected',String(i===slashSel)));return}
  if(e.key==='Enter'||e.key==='Tab'){e.preventDefault();runSlash(B[slashSel].dataset.cmd);return}if(e.key==='Escape'){hideSlash();return}}
 if(e.key==='Enter'){const s=ta.selectionStart,ls=ta.value.lastIndexOf('\n',s-1)+1,line=ta.value.slice(ls,s),m=line.match(/^(\s*)([-*+] \[[ xX]\] |[-*+] |(\d+)\. |> )/);
  if(m){e.preventDefault();if(line.trim()===m[2].trim()){ta.setRangeText('',ls,s,'end');changed();return}let p=m[1]+m[2].replace(/\[[xX]\]/,'[ ]');if(m[3])p=m[1]+(+m[3]+1)+'. ';insert('\n'+p)}}
 if(e.key==='Tab'&&!e.shiftKey&&/^\s*([-*+]|\d+\.)\s/.test(ta.value.slice(ta.value.lastIndexOf('\n',ta.selectionStart-1)+1))){e.preventDefault();linePrefix('  ')}});
ta.addEventListener('blur',()=>setTimeout(hideSlash,150));
// ---------- attachments ----------
async function compress(file){if(!/^image\/(png|jpe?g|webp|gif|heic|heif)/i.test(file.type)||file.type==='image/gif')return file;
 try{const bmp=await createImageBitmap(file),k=Math.min(1,1600/Math.max(bmp.width,bmp.height));if(k===1&&file.size<300000)return file;const c=document.createElement('canvas');c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
  const b=await new Promise(r=>c.toBlob(r,'image/jpeg',.82));return b&&b.size<file.size?new File([b],file.name.replace(/\.\w+$/,'')+'.jpg',{type:'image/jpeg'}):file}catch(e){return file}}
async function attach(files){if(!cur)return;for(let f of files){if(f.size>15e6){toast('File too large (max 15 MB)');continue}const img=f.type.startsWith('image/');if(img)f=await compress(f);
 const id=DB.uid();await DB.put('atts',{id,noteId:cur.id,name:f.name||'image',type:f.type,size:f.size,blob:f});{const b=ta.value.slice(0,ta.selectionStart),pre=b&&!/\n\s*\n$|^\s*$/.test(b)?(b.endsWith('\n')?'\n':'\n\n'):'';insert(`${pre}${img?'!':''}[${(f.name||'image').replace(/[[\]]/g,'')}](att:${id})\n`)}}
 toast(files.length>1?'Attachments added':'Attachment added')}
$('#fileIn').onchange=e=>{attach([...e.target.files]);e.target.value=''};
ta.addEventListener('paste',e=>{const fs=[...(e.clipboardData?.files||[])];if(fs.length){e.preventDefault();attach(fs)}});
// ---------- sheets ----------
function sheet(title,html,onOpen){$('#sheetTitle').textContent=title;$('#sheetBody').innerHTML=html;const d=$('#sheet');if(!d.open)d.showModal();onOpen&&onOpen($('#sheetBody'))}
$('#sheetClose').onclick=()=>$('#sheet').close();
$('#propsBtn').onclick=()=>{if(!cur)return;const n=cur,dueV=n.due?new Date(n.due-new Date(n.due).getTimezoneOffset()*6e4).toISOString().slice(0,16):'';
 sheet('Organize',`<label>Notebook<input id="pNb" list="nbList" value="${esc(n.notebook)}" placeholder="No notebook"><datalist id="nbList">${allNbs().map(x=>`<option value="${esc(x)}">`).join('')}</datalist></label>
 <label>Tags (comma separated)<input id="pTags" value="${esc((n.tags||[]).join(', '))}" placeholder="work, ideas" autocapitalize="off"></label><div class="tchips">${allTags().map(t=>`<button type="button" data-addtag="${esc(t)}">#${esc(t)}</button>`).join('')}</div>
 <div class="lbl" style="margin:12px 0 6px;font-size:.82rem;color:var(--muted)">Color label</div><div class="swatches">${Object.entries(COLORS).map(([k,c])=>`<button type="button" class="sw" data-color="${k}" aria-pressed="${n.color===k}" aria-label="${k||'No color'}" style="background:${k?c:'var(--card)'}"></button>`).join('')}</div>
 <label style="margin-top:14px">Reminder / due<input type="datetime-local" id="pDue" value="${dueV}"></label><label class="row" style="flex-direction:row;align-items:center;gap:8px"><input type="checkbox" id="pDone" ${n.dueDone?'checked':''} style="width:22px;height:22px;min-height:0;accent-color:var(--acc)"> Mark done</label>
 <div class="row"><button class="primary" id="pSave">${I('check')}Save</button>${'Notification'in window&&Notification.permission!=='granted'?`<button id="pNotif">${I('bell')}Enable notifications</button>`:''}</div>`,b=>{
  b.querySelectorAll('[data-addtag]').forEach(x=>x.onclick=()=>{const v=b.querySelector('#pTags');const L=v.value.split(',').map(s=>s.trim()).filter(Boolean);if(!L.includes(x.dataset.addtag))L.push(x.dataset.addtag);v.value=L.join(', ')});
  b.querySelectorAll('[data-color]').forEach(x=>x.onclick=()=>{b.querySelectorAll('[data-color]').forEach(y=>y.setAttribute('aria-pressed',String(y===x)))});
  const nb=b.querySelector('#pNotif');nb&&(nb.onclick=async()=>{const r=await Notification.requestPermission();toast(r==='granted'?'Notifications on while Dash Notes is open':'Notifications not allowed');nb.remove()});
  b.querySelector('#pSave').onclick=async()=>{n.notebook=b.querySelector('#pNb').value.trim();n.tags=[...new Set(b.querySelector('#pTags').value.split(',').map(s=>s.trim().replace(/^#/,'')).filter(Boolean))];
   n.color=b.querySelector('[data-color][aria-pressed=true]')?.dataset.color||'';const dv=b.querySelector('#pDue').value,nd=dv?new Date(dv).getTime():null;if(nd!==n.due){n.notified=false}n.due=nd;n.dueDone=b.querySelector('#pDone').checked;
   if(n.notebook&&!meta.notebooks.includes(n.notebook)){meta.notebooks.push(n.notebook);saveMeta()}n.updated=Date.now();await store(n);$('#sheet').close();fillMeta();renderNav();renderList();toast('Saved')}})};
$('#moreBtn').onclick=()=>{if(!cur)return;const n=cur,M=[['history','history','Version history'],['lock',n.locked?'unlock':'lock',n.locked?'Remove password':'Lock with password'],['tpl','template','Insert template'],['md','download','Export as Markdown'],['share','share','Share'],['print','print','Print'],['dup','file','Duplicate'],
 ['arch','archive',n.archived?'Unarchive':'Archive'],...(n.trashed?[['restore','restore','Restore from trash']]:[]),['trash','trash',n.trashed?'Delete forever':'Move to trash']];
 sheet(n.title||'Untitled',`<div class="menu">${M.map(([a,ic,l])=>`<button data-m="${a}" class="${a==='trash'?'danger':''}">${I(ic)}${l}</button>`).join('')}</div>`,b=>b.querySelectorAll('[data-m]').forEach(x=>x.onclick=()=>menu(x.dataset.m)))};
async function menu(a){const n=cur;await flush();if(a!=='history'&&a!=='lock'&&a!=='tpl')$('#sheet').close();
 if(a==='history')return historySheet(n);if(a==='lock')return lockSheet(n);if(a==='tpl')return templatePicker(false);
 if(a==='md'){download(new Blob([`# ${n.title||'Untitled'}\n\n${text(n)}`],{type:'text/markdown'}),(n.title||'note').replace(/[\\/:*?"<>|]/g,'-')+'.md')}
 if(a==='share'){const data={title:n.title||'Note',text:`${n.title?n.title+'\n\n':''}${text(n)}`};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.text);toast('Copied to clipboard')}}catch(e){}}
 if(a==='print'){$('#printArea').innerHTML=`<h1>${esc(n.title||'Untitled')}</h1>`+MD.render(text(n));await resolveAtts($('#printArea'));setTimeout(()=>print(),100)}
 if(a==='dup'){if(n.locked)return toast('Unlock the note first to duplicate');await newNote({title:(n.title||'Untitled')+' (copy)',body:n.body,notebook:n.notebook,tags:[...(n.tags||[])],color:n.color})}
 if(a==='arch'){n.archived=!n.archived;await store(n);toast(n.archived?'Archived':'Unarchived');fillMeta();renderList()}
 if(a==='restore'){n.trashed=null;await store(n);toast('Restored');fillMeta();renderList()}
 if(a==='trash')await trash(n)}
async function historySheet(n){if(n.locked)return sheet('Version history','<p class="muted">Locked notes don’t keep version history, so no unencrypted copies are stored.</p>');
 await snapshot(n,ta.value,false);const V=(await DB.byNote('versions',n.id)).sort((a,b)=>b.ts-a.ts);
 sheet('Version history',V.length?`<p class="muted">Snapshots are saved automatically while you edit (up to 30).</p><ul class="hist">${V.map(v=>`<li><span><b>${new Date(v.ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}</b><br><span class="muted">${words(v.body)} words</span></span><button data-v="${v.id}">${I('eye','sm')}View</button></li>`).join('')}</ul><div id="hv"></div>`:'<p class="muted">No snapshots yet.</p>',b=>{
  b.querySelectorAll('[data-v]').forEach(x=>x.onclick=()=>{const v=V.find(y=>y.id===x.dataset.v);b.querySelector('#hv').innerHTML=`<div class="histprev md">${MD.render(v.body)}</div><button class="primary" id="hr">${I('restore')}Restore this version</button>`;
   b.querySelector('#hr').onclick=async()=>{await snapshot(n,ta.value,true);ta.value=v.body;$('#title').value=v.title||$('#title').value;changed();await flush();$('#sheet').close();if(preview)renderPreview();toast('Version restored (previous text saved in history)')}})})}
function lockSheet(n){if(n.locked){sheet('Remove password',`<p class="muted">The note will be stored unencrypted again.</p><button class="primary" id="ul">${I('unlock')}Remove password</button>`,b=>b.querySelector('#ul').onclick=async()=>{n.body=n._plain||'';n.locked=null;delete keys[n.id];await store(n);$('#sheet').close();fillMeta();renderList();toast('Password removed')});return}
 sheet('Lock with password',`<p class="muted">Encrypted on this device with AES-256-GCM (PBKDF2, 210k iterations). If you forget the password the note can’t be recovered. Attachments are not encrypted.</p><form id="lf"><label>Password<input type="password" id="lp1" autocomplete="new-password" minlength="4" required></label><label>Confirm<input type="password" id="lp2" autocomplete="new-password" required></label><button class="primary">${I('lock')}Encrypt note</button></form>`,b=>b.querySelector('#lf').onsubmit=async e=>{e.preventDefault();
  const p=b.querySelector('#lp1').value;if(p!==b.querySelector('#lp2').value)return toast('Passwords don’t match');const salt=crypto.getRandomValues(new Uint8Array(16)),k=await derive(p,salt),body=ta.value;
  n.locked=await seal(k,salt,body);n._plain=body;n.body='';keys[n.id]=k;await store(n);for(const v of await DB.byNote('versions',n.id))await DB.del('versions',v.id);delete lastSnap[n.id];$('#sheet').close();fillMeta();renderList();toast('Note encrypted')})}
function templatePicker(asNew){sheet(asNew?'New from template':'Insert template',`<div class="menu">${Object.entries(TEMPLATES).map(([k,[l]])=>`<button data-t="${k}">${I('template')}${l}</button>`).join('')}</div>`,b=>b.querySelectorAll('[data-t]').forEach(x=>x.onclick=async()=>{$('#sheet').close();const k=x.dataset.t;
  if(asNew||!cur)await newNote({tpl:k});else{if(preview)setPreview(false);insert((ta.value&&!ta.value.endsWith('\n')?'\n':'')+TEMPLATES[k][1](nowStr()));if(!$('#title').value){$('#title').value=TEMPLATES[k][0];changed()}}}))}
function notePicker(){sheet('Link to note',`<label>Search<input id="np" placeholder="Note title" autocomplete="off"></label><div class="menu" id="npl"></div>`,b=>{const inp=b.querySelector('#np'),L=b.querySelector('#npl');
 const r=()=>{const q=inp.value.trim().toLowerCase(),M=notes.filter(n=>!n.trashed&&n.id!==cur.id&&n.title&&n.title.toLowerCase().includes(q)).slice(0,12);L.innerHTML=M.map(n=>`<button data-t="${esc(n.title)}">${I('note')}${esc(n.title)}</button>`).join('')+(q&&!M.some(n=>n.title.toLowerCase()===q)?`<button data-t="${esc(inp.value.trim())}">${I('plus')}Link new note “${esc(inp.value.trim())}”</button>`:'');
  L.querySelectorAll('[data-t]').forEach(x=>x.onclick=()=>{$('#sheet').close();if(preview)setPreview(false);insert(`[[${x.dataset.t}]]`)})};inp.oninput=r;r();setTimeout(()=>inp.focus(),50)})}
// ---------- backup / import / zip ----------
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
const blobTo64=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(String(f.result).split(',')[1]);f.readAsDataURL(b)});
$('#dataBtn').onclick=()=>sheet('Backup & settings',`<div class="menu"><button id="ej">${I('download')}Export all notes (JSON, includes attachments)</button><button id="ez">${I('download')}Export all as Markdown (.zip)</button><button id="ij">${I('upload')}Import JSON backup</button>${'Notification'in window?`<button id="en">${I('bell')}Reminder notifications: ${Notification.permission==='granted'?'on':'tap to enable'}</button>`:''}<button id="ek">${I('keyboard')}Keyboard shortcuts</button></div><p class="muted">Notes are stored only on this device (IndexedDB). Export regularly to keep a backup.</p>`,b=>{
 b.querySelector('#ej').onclick=exportJSON;b.querySelector('#ez').onclick=exportZip;b.querySelector('#ij').onclick=()=>$('#importIn').click();b.querySelector('#ek').onclick=keysSheet;const en=b.querySelector('#en');en&&(en.onclick=async()=>{await Notification.requestPermission();$('#dataBtn').click()})});
async function exportJSON(){await flush();const atts=[];for(const a of await DB.all('atts'))atts.push({...a,blob:undefined,data:await blobTo64(a.blob)});
 download(new Blob([JSON.stringify({app:'dash-notes',version:1,exported:new Date().toISOString(),meta,notes:notes.map(({_plain,...n})=>n),versions:await DB.all('versions'),atts})],{type:'application/json'}),`dash-notes-${new Date().toISOString().slice(0,10)}.json`);toast('Backup downloaded')}
async function exportZip(){await flush();const allAtts=await DB.all('atts'),attTypes=Object.fromEntries(allAtts.map(a=>[a.id,a.type])),files=[],used=new Set(),safe=s=>(s||'Untitled').replace(/[\\/:*?"<>|]/g,'-').slice(0,80);
 for(const n of notes.filter(x=>!x.trashed)){let p=(n.notebook?safe(n.notebook)+'/':'')+safe(n.title),k=p,i=2;while(used.has(k))k=p+' ('+i+++')';used.add(k);
  const fm=`---\ntitle: ${n.title||'Untitled'}\ntags: [${(n.tags||[]).join(', ')}]\ncreated: ${new Date(n.created).toISOString()}\nupdated: ${new Date(n.updated).toISOString()}\n---\n\n`;
  files.push({name:`notes/${k}.md`,data:fm+(n.locked?'(This note is encrypted. Use the JSON export to keep its encrypted contents.)':n.body.replace(/\(att:([\w-]+)\)/g,(m,id)=>{const t=(attTypes[id]||'');return`(../attachments/${id}${({'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif','application/pdf':'.pdf'})[t]||''})`}))})}
 for(const a of allAtts)files.push({name:`attachments/${a.id}`+(({'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif','application/pdf':'.pdf'})[a.type]||''),data:a.blob});download(await Zip.make(files),`dash-notes-${new Date().toISOString().slice(0,10)}.zip`);toast('Zip downloaded')}
$('#importIn').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const j=JSON.parse(await f.text());if(j.app!=='dash-notes'||!Array.isArray(j.notes))throw 0;let c=0;
 for(const n of j.notes){const ex=notes.find(x=>x.id===n.id);if(ex&&ex.updated>=n.updated)continue;const rec=Object.assign(DB.blank(),n);await DB.put('notes',rec);if(ex)Object.assign(ex,rec);else notes.push(rec);c++}
 for(const v of j.versions||[])await DB.put('versions',v);for(const a of j.atts||[]){const bin=Uint8Array.from(atob(a.data),ch=>ch.charCodeAt(0));const{data,...r}=a;await DB.put('atts',{...r,blob:new Blob([bin],{type:a.type})})}
 if(j.meta?.notebooks){meta.notebooks=[...new Set([...meta.notebooks,...j.meta.notebooks])];saveMeta()}mirror();renderNav();renderList();$('#sheet').open&&$('#sheet').close();toast(`Imported ${c} note${c===1?'':'s'}`)}catch(err){toast('That file is not a Dash Notes backup')}};
function keysSheet(){const K=[['Ctrl/Cmd + Alt + N','New note'],['Ctrl/Cmd + K or /','Search'],['Ctrl/Cmd + S','Save now'],['Ctrl/Cmd + B / I','Bold / italic'],['Ctrl/Cmd + Shift + P','Toggle preview'],['Ctrl/Cmd + Shift + L','Insert checklist item'],['Ctrl/Cmd + Shift + .','Pin / unpin'],['/ (in editor)','Command menu'],['Esc','Back to list'],['?','This help']];
 sheet('Keyboard shortcuts',`<table class="keys">${K.map(([k,d])=>`<tr><td><kbd>${k}</kbd></td><td>${d}</td></tr>`).join('')}</table>`)}
$('#keysBtn').onclick=keysSheet;
document.addEventListener('keydown',e=>{const mod=e.metaKey||e.ctrlKey,inField=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
 if(mod&&e.altKey&&e.code==='KeyN'){e.preventDefault();newNote()}
 else if(mod&&e.code==='KeyK'||(!inField&&e.key==='/')){e.preventDefault();document.body.classList.remove('editing');$('#q').focus()}
 else if(mod&&e.code==='KeyS'){e.preventDefault();dirty=true;flush()}
 else if(mod&&e.shiftKey&&e.code==='KeyP'){e.preventDefault();if(cur)setPreview(!preview)}
 else if(mod&&e.shiftKey&&e.code==='KeyL'){e.preventDefault();act('task')}
 else if(mod&&e.shiftKey&&e.code==='Period'){e.preventDefault();$('#pinBtn').click()}
 else if(mod&&!e.shiftKey&&e.code==='KeyB'&&document.activeElement===ta){e.preventDefault();act('b')}
 else if(mod&&!e.shiftKey&&e.code==='KeyI'&&document.activeElement===ta){e.preventDefault();act('i')}
 else if(e.key==='Escape'&&!$('#sheet').open&&$('#slash').hidden){if(document.body.classList.contains('drawer-open'))document.body.classList.remove('drawer-open');else if(document.body.classList.contains('editing'))closeEditor()}
 else if(!inField&&e.key==='?'){keysSheet()}});
// ---------- reminders ----------
function checkDue(){const now=Date.now();notes.filter(n=>n.due&&!n.dueDone&&!n.trashed&&!n.notified&&n.due<=now).forEach(n=>{n.notified=true;store(n);toast(`Reminder: ${n.title||'Untitled'}`);
 try{if('Notification'in window&&Notification.permission==='granted'){const nt=new Notification('Dash Notes reminder',{body:n.title||'Untitled note',icon:'../icons/notes-192.png',tag:n.id});nt.onclick=()=>{focus();openNote(n.id)}}}catch(e){}});renderNav()}
setInterval(checkDue,30000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();else checkDue()});addEventListener('pagehide',()=>flush());
window.dashBusy=()=>dirty||document.body.classList.contains('editing')||$('#sheet').open;
window.__notes={get notes(){return notes},get cur(){return cur},flush,newNote};
load().then(()=>{mirror();checkDue()}).catch(e=>{console.warn(e);toast('Storage unavailable (private browsing?)')});
})();
