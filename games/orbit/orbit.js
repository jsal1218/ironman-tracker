(()=>{'use strict';const {tone,buzz,best,setBest,overlay,$}=G,N=4,ANIM=G.reduced?0:110;
const T={2:['Stardust','#8d84a8','#5b5373'],4:['Pebble','#a08f7d','#6c5c4c'],8:['Asteroid','#9a8a8a','#5a4848'],16:['Moon','#e8e1d0','#9f957f'],32:['Mars','#e2603f','#8f2a17'],64:['Ocean','#3fa8e2','#175c8f'],128:['Ringed','#e9c46a','#a1782a',1],256:['Gas giant','#f4a259','#b0531e'],512:['Star','#fbe9a6','#c99a1e'],1024:['Red giant','#ff6b4a','#c1121f'],2048:['Galaxy','#c084fc','#5b21b6'],4096:['Nebula','#f472b6','#9d174d'],8192:['Black hole','#3b2d5c','#000']};
const look=v=>T[v]||T[8192];
const board=$('#board');let grid,score,hist,undos,over,won,idc=0,lock=false;
for(let i=0;i<16;i++){const c=document.createElement('div');c.className='cell';c.style.transform=pos(i/4|0,i%4);board.appendChild(c)}
function pos(r,c){return`translate(calc(${c} * (100% + 10px)), calc(${r} * (100% + 10px)))`}
function paint(t){const[n,a,b,ring]=look(t.v);t.el.innerHTML=`<div class="orb${ring?' ring':''}" style="background:radial-gradient(circle at 32% 28%,${a},${b} 75%);box-shadow:0 0 ${t.v>=512?18:6}px ${a}88">${t.v}</div><small>${n}</small>`;t.el.setAttribute('aria-label',`${n} ${t.v}`)}
function mk(r,c,v,cls){const t={id:idc++,v,el:document.createElement('div')};t.el.className='tile'+(cls?' '+cls:'');t.el.style.transform=pos(r,c);paint(t);board.appendChild(t.el);grid[r][c]=t;return t}
function add(){const e=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(!grid[r][c])e.push([r,c]);if(!e.length)return;const[r,c]=e[Math.random()*e.length|0];mk(r,c,Math.random()<.9?2:4,'new')}
const snap=()=>({g:grid.map(row=>row.map(t=>t?t.v:0)),score,won});
function load(s){board.querySelectorAll('.tile').forEach(e=>e.remove());grid=s.g.map(()=>Array(N).fill(null));s.g.forEach((row,r)=>row.forEach((v,c)=>v&&mk(r,c,v)));score=s.score;won=s.won;ui()}
function ui(){$('#score').textContent=score;$('#best').textContent=Math.max(best(),score);$('#undoN').textContent=undos;$('#undo').disabled=!undos||!hist.length;save()}
function save(){try{localStorage.setItem('dash-games-orbit-state',JSON.stringify({...snap(),undos,over}))}catch(e){}}
function start(fresh){over=false;hist=[];undos=3;grid=[...Array(N)].map(()=>Array(N).fill(null));board.querySelectorAll('.tile').forEach(e=>e.remove());score=0;won=false;
 const s=!fresh&&JSON.parse(localStorage.getItem('dash-games-orbit-state')||'null');if(s&&!s.over&&s.g){load(s);undos=s.undos??3}else{add();add()}ui()}
function canMove(){for(let r=0;r<N;r++)for(let c=0;c<N;c++){const t=grid[r][c];if(!t)return true;if(c<N-1&&grid[r][c+1]?.v===t.v)return true;if(r<N-1&&grid[r+1][c]?.v===t.v)return true}return false}
function move(d){if(lock||over||!$('#ov').hidden)return;const V=[[-1,0],[0,1],[1,0],[0,-1]][d],s=snap(),merged=new Set();let moved=false,gain=0,top=0;
 const R=[0,1,2,3],C=[0,1,2,3];if(V[0]===1)R.reverse();if(V[1]===1)C.reverse();
 for(const r of R)for(const c of C){const t=grid[r][c];if(!t)continue;let nr=r,nc=c,mergedInto=null;
  for(;;){const tr=nr+V[0],tc=nc+V[1];if(tr<0||tr>=N||tc<0||tc>=N)break;const o=grid[tr][tc];if(!o){nr=tr;nc=tc;continue}if(o.v===t.v&&!merged.has(o))mergedInto=o;break}
  if(mergedInto){const o=mergedInto,or=nr+V[0],oc=nc+V[1];grid[r][c]=null;t.el.classList.add('dying');t.el.style.transform=pos(or,oc);o.v*=2;merged.add(o);gain+=o.v;top=Math.max(top,o.v);moved=true;
   setTimeout(()=>{t.el.remove();paint(o);o.el.classList.remove('pop','new');void o.el.offsetWidth;o.el.classList.add('pop')},ANIM)}
  else if(nr!==r||nc!==c){grid[r][c]=null;grid[nr][nc]=t;t.el.style.transform=pos(nr,nc);moved=true}}
 if(!moved){buzz(8);return}
 lock=true;hist.push(s);if(hist.length>30)hist.shift();score+=gain;
 if(gain){tone(220+Math.log2(top)*60,.12,'triangle',.12);buzz(top>=128?[12,30,12]:10)}else tone(160,.04,'sine',.05);
 setTimeout(()=>{lock=false;add();if(!won&&top>=2048){won=true;tone(523,.15);tone(784,.25,'sine',.12,0,.12);overlay('Galaxy formed!','You merged a galaxy. Keep going for a black hole?','Keep playing',null,'spark')}
  if(!canMove()){over=true;const nb=setBest(score);tone(300,.3,'sawtooth',.08,120);buzz([30,60,30]);overlay(nb?'New best!':'No more moves',`Score ${score}${nb?'':' · Best '+best()}`,'Play again',()=>start(true),nb?'trophy':'restart')}ui()},ANIM+5);ui()}
$('#undo').onclick=()=>{if(!undos||!hist.length||over)return;undos--;load(hist.pop());tone(330,.08,'sine',.08,220);ui()};
$('#newBtn').onclick=()=>{if(score>0&&!over&&!confirm('Start a new game?'))return;setBest(score);start(true)};
addEventListener('keydown',e=>{const k={ArrowUp:0,KeyW:0,ArrowRight:1,KeyD:1,ArrowDown:2,KeyS:2,ArrowLeft:3,KeyA:3}[e.code];if(k!=null){e.preventDefault();move(k)}else if(e.code==='KeyU')$('#undo').click()});
let sx=null,sy=null;board.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY});
board.addEventListener('pointerup',e=>{if(sx==null)return;const dx=e.clientX-sx,dy=e.clientY-sy;sx=null;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;move(Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0))});
board.addEventListener('pointercancel',()=>sx=null);
G.onHide(()=>{save();setBest(score)});
window.dashBusy=()=>!over&&score>0;
window.__orbit={get score(){return score},get over(){return over},move,get grid(){return grid.map(r=>r.map(t=>t?t.v:0))}};
start(false);
})();
