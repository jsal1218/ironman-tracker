// Meadow Sweep: minesweeper-style logic. Mow the meadow without waking sleeping hedgehogs. First tap is always safe and opens an area.
(()=>{'use strict';const{tone,buzz,best,setBest,overlay,hide,$}=G,cv=$('#cv'),x=cv.getContext('2d');
const NUMC=['','#1f6fb5','#2a8a3c','#c0392b','#6a3ea1','#a0522d','#13827a','#333','#777'];
let W,H,top,bot,cs=36,ox=0,oy=0,cols=8,rows=10,hogs=10,grid=[],state='ready',raf=0,last=0,t=0,score=0,field=1,placed=false,flagMode=false,openCount=0,fieldT=0,woke=-1,parts=[],pops=[],press=null;
function dims(){cols=field>=3?9:8;rows=Math.min(14,9+field);hogs=Math.min(Math.round(cols*rows*.2),8+field*3)}
function size(){const f=G.fit(cv,x);W=f.W;H=f.H;top=f.top;bot=f.bot;cs=Math.floor(Math.min((W-24)/cols,(H-top-bot-56)/rows,60));ox=Math.round((W-cs*cols)/2);oy=Math.round(top+Math.max(8,(H-top-bot-36-cs*rows)/2))}
addEventListener('resize',()=>{size();draw()});
const idx=(c,r)=>r*cols+c,nb=(c,r)=>{const o=[];for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const cc=c+dc,rr=r+dr;if(cc>=0&&cc<cols&&rr>=0&&rr<rows)o.push([cc,rr])}return o};
function newField(){dims();size();grid=[...Array(cols*rows)].map(()=>({h:false,n:0,open:false,flag:false,a:0}));placed=false;openCount=0;fieldT=0;woke=-1;ui()}
function place(sc,sr){const ban=new Set([idx(sc,sr),...nb(sc,sr).map(([c,r])=>idx(c,r))]);let k=0;while(k<hogs){const i=Math.floor(Math.random()*grid.length);if(ban.has(i)||grid[i].h)continue;grid[i].h=true;k++}
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)grid[idx(c,r)].n=nb(c,r).filter(([a,b])=>grid[idx(a,b)].h).length;placed=true}
function ui(){$('#sc').textContent=score.toLocaleString();$('#rd').textContent=field;$('#hl').textContent=hogs-grid.filter(g=>g.flag).length}
function reset(){score=0;field=1;flagMode=false;setFlagBtn();parts=[];pops=[];newField()}
function start(){hide();reset();state='play';$('#pause').hidden=false;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
function reveal(c,r){const g=grid[idx(c,r)];if(g.open||g.flag)return;if(!placed)place(c,r);
 if(g.h){return lose(idx(c,r))}
 const q=[[c,r,0]],seen=new Set([idx(c,r)]);let n=0;while(q.length){const[a,b,d]=q.shift(),cell=grid[idx(a,b)];if(cell.open||cell.flag)continue;cell.open=true;cell.a=G.reduced?1:-d*.035;n++;
  if(cell.n===0)for(const[aa,bb]of nb(a,b)){const j=idx(aa,bb);if(!seen.has(j)&&!grid[j].open&&!grid[j].h){seen.add(j);q.push([aa,bb,d+1])}}}
 openCount+=n;const pts=n*5*field;score+=pts;if(n>4)pops.push({x:ox+(c+.5)*cs,y:oy+r*cs,txt:'+'+pts,l:.9});tone(n>4?520:620,n>4?.14:.05,'triangle',.05,n>4?880:0);buzz(5);ui();
 if(openCount===cols*rows-hogs)win()}
function chord(c,r){const g=grid[idx(c,r)];if(!g.open||!g.n)return;const ns=nb(c,r),f=ns.filter(([a,b])=>grid[idx(a,b)].flag).length;if(f!==g.n){tone(200,.05,'square',.02);return}for(const[a,b]of ns){if(state!=='play')return;const q=grid[idx(a,b)];if(!q.open&&!q.flag)reveal(a,b)}}
function toggleFlag(c,r){const g=grid[idx(c,r)];if(g.open)return;g.flag=!g.flag;g.a=G.reduced?1:0;tone(g.flag?880:440,.05,'sine',.05);buzz(18);ui()}
function win(){state='between';const secs=Math.round(fieldT),bonus=300*field+Math.max(0,240-secs)*2*field;score+=bonus;for(const g of grid)if(g.h)g.flag=true;ui();tone(523,.15,'triangle',.07);tone(659,.15,'triangle',.07,0,.12);tone(784,.3,'triangle',.07,0,.24);
 for(let k=0;k<(G.reduced?10:40);k++)parts.push({x:W/2,y:H/2,vx:(Math.random()-.5)*500,vy:-Math.random()*500,l:1.4,c:k%2?'#fbe9a6':'#7de0b5'});setBest(score);
 setTimeout(()=>overlay(`Field ${field} cleared!`,`+${bonus} bonus (${secs}s) · Score ${score.toLocaleString()}. Next: a bigger meadow with more hedgehogs.`,'Next field',()=>{field++;newField();state='play';last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)},'star'),G.reduced?150:800)}
function lose(i){woke=i;state='over';for(const g of grid)if(g.h)g.open=true;tone(300,.12,'square',.05,600);tone(180,.4,'sawtooth',.05,90,.1);buzz([50,40,120]);$('#pause').hidden=true;const nbst=setBest(score);
 setTimeout(()=>overlay(nbst?'New best!':'You woke a hedgehog!',`Score ${score.toLocaleString()} · Field ${field} · Best ${best().toLocaleString()}`,'Mow again',start,nbst?'trophy':'restart'),G.reduced?300:1100)}
function step(dt){t+=dt;if(state==='play'&&placed)fieldT+=dt;for(const g of grid)if(g.a<1)g.a=Math.min(1,g.a+dt*5);for(const p of parts){p.vy+=500*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt}parts=parts.filter(p=>p.l>0);for(const p of pops){p.l-=dt;p.y-=20*dt}pops=pops.filter(p=>p.l>0)}
function hog(px,py,s,awake){x.save();x.translate(px,py);x.fillStyle='#6b4a2b';x.beginPath();for(let k=0;k<=14;k++){const a=Math.PI+k*Math.PI/14,rr=k%2?s*.62:s*.85;x.lineTo(Math.cos(a)*rr,Math.sin(a)*rr*.9+s*.25)}x.closePath();x.fill();
 x.fillStyle='#e6c79a';x.beginPath();x.ellipse(s*.38,s*.18,s*.38,s*.28,0,0,7);x.fill();x.fillStyle='#2b1a0e';x.beginPath();x.arc(s*.74,s*.16,s*.08,0,7);x.fill();x.strokeStyle='#2b1a0e';x.lineWidth=Math.max(1.2,s*.07);x.beginPath();
 if(awake){x.arc(s*.4,s*.08,s*.07,0,7);x.fill()}else{x.moveTo(s*.3,s*.1);x.quadraticCurveTo(s*.4,s*.17,s*.5,s*.1);x.stroke()}x.restore()}
function draw(){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#1d5a3a');g.addColorStop(1,'#123a28');x.fillStyle=g;x.fillRect(0,0,W,H);
 x.fillStyle='rgba(233,200,106,.25)';x.beginPath();x.roundRect?x.roundRect(ox-6,oy-6,cs*cols+12,cs*rows+12,14):x.rect(ox-6,oy-6,cs*cols+12,cs*rows+12);x.fill();
 x.textAlign='center';x.textBaseline='middle';
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const q=grid[idx(c,r)],px=ox+c*cs,py=oy+r*cs,alt=(r+c)%2;
  if(!q.open||q.a<1){x.fillStyle=alt?'#5fb35a':'#6cc265';x.fillRect(px,py,cs,cs);x.strokeStyle='rgba(20,70,30,.35)';x.lineWidth=1.4;x.beginPath();for(const k of[.25,.5,.75]){x.moveTo(px+cs*k,py+cs*.78);x.lineTo(px+cs*k+cs*.06,py+cs*.6)}x.stroke()}
  if(q.open){const k=Math.max(0,q.a);if(k>0){x.save();x.translate(px+cs/2,py+cs/2);x.scale(k,k);x.fillStyle=q.h?(idx(c,r)===woke?'#e8735a':'#e7d3a6'):alt?'#ecdcb4':'#f3e6c4';x.fillRect(-cs/2,-cs/2,cs,cs);
   if(q.h){hog(0,-cs*.05,cs*.42,idx(c,r)===woke)}else if(q.n){x.fillStyle=NUMC[q.n];x.font=`800 ${cs*.52}px system-ui,sans-serif`;x.fillText(q.n,0,cs*.03)}x.restore()}}
  if(q.flag&&!q.open){const s=cs*(.5+.5*Math.min(1,q.a));x.save();x.translate(px+cs/2,py+cs/2);x.fillStyle='#6b4a2b';x.fillRect(-s*.04,-s*.32,s*.08,s*.66);x.fillStyle='#d9b44a';x.beginPath();x.moveTo(s*.04,-s*.32);x.lineTo(s*.42,-s*.18);x.lineTo(s*.04,-s*.04);x.fill();x.fillStyle='#3e8a52';x.beginPath();x.ellipse(0,s*.36,s*.24,s*.07,0,0,7);x.fill();x.restore()}
  if(press&&press.c===c&&press.r===r&&!q.open){x.fillStyle='rgba(255,255,255,.18)';x.fillRect(px,py,cs,cs)}}
 x.textBaseline='alphabetic';
 for(const p of parts){x.globalAlpha=Math.min(1,p.l);x.fillStyle=p.c;x.fillRect(p.x,p.y,5,5)}x.globalAlpha=1;
 for(const p of pops){x.globalAlpha=Math.min(1,p.l*2);x.font='800 18px system-ui,sans-serif';x.lineWidth=4;x.strokeStyle='rgba(0,0,0,.4)';x.strokeText(p.txt,p.x,p.y);x.fillStyle='#fbe9a6';x.fillText(p.txt,p.x,p.y)}x.globalAlpha=1;
 const by=oy+cs*rows+28;x.font='600 13px system-ui,sans-serif';x.fillStyle='rgba(236,242,238,.85)';x.fillText(flagMode?'Flag mode: tap to mark a hedgehog':placed?`${Math.floor(fieldT)}s · long-press to flag · tap a number to clear around it`:'Tap any patch to start mowing',W/2,Math.min(by,H-bot-10))}
function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.05,(now-last)/1000||0);last=now;step(dt);draw();if(state==='paused'||state==='ready'||((state==='over'||state==='between')&&!parts.length&&grid.every(g=>g.a>=1)))cancelAnimationFrame(raf)}
// input
const cellAt=e=>{const R=cv.getBoundingClientRect(),c=Math.floor((e.clientX-R.left-ox)/cs),r=Math.floor((e.clientY-R.top-oy)/cs);return c>=0&&c<cols&&r>=0&&r<rows?{c,r}:null};
cv.addEventListener('pointerdown',e=>{if(state!=='play')return;const p=cellAt(e);if(!p)return;cv.setPointerCapture?.(e.pointerId);press={...p,x:e.clientX,y:e.clientY,done:false,tm:setTimeout(()=>{if(press&&!press.done&&!grid[idx(press.c,press.r)].open){press.done=true;toggleFlag(press.c,press.r)}},380)}});
cv.addEventListener('pointermove',e=>{if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>12){clearTimeout(press.tm);press=null}});
cv.addEventListener('pointerup',e=>{if(!press)return;const p=press;press=null;clearTimeout(p.tm);if(p.done||state!=='play')return;const q=grid[idx(p.c,p.r)];if(q.open)chord(p.c,p.r);else if(flagMode)toggleFlag(p.c,p.r);else reveal(p.c,p.r)});
cv.addEventListener('pointercancel',()=>{if(press)clearTimeout(press.tm);press=null});
cv.addEventListener('contextmenu',e=>{e.preventDefault();const p=cellAt(e);if(p&&state==='play'){if(press){clearTimeout(press.tm);press=null}toggleFlag(p.c,p.r)}});
function setFlagBtn(){const b=$('#flagB');b.setAttribute('aria-pressed',String(flagMode));b.setAttribute('aria-label',flagMode?'Flag mode on':'Flag mode off')}
$('#flagB').onclick=()=>{flagMode=!flagMode;setFlagBtn();tone(flagMode?700:500,.05);if(state!=='play')draw()};
function pause(){if(state!=='play')return;state='paused';press=null;overlay('Paused',`Score ${score.toLocaleString()} · Field ${field}`,'Resume',()=>{state='play';last=performance.now();raf=requestAnimationFrame(loop)},'pause')}
$('#pause').onclick=pause;$('#pause').hidden=true;G.onHide(pause);window.dashBusy=()=>state==='play'||state==='paused'||state==='between';
reset();draw();overlay('Meadow Sweep','Tap to mow a patch. Numbers count the sleeping hedgehogs next door. Long-press (or flag mode) to mark one. Clear the field to move on.','Start mowing',start,'play');
window.__meadow={get state(){return state},get score(){return score},get field(){return field},get cols(){return cols},get rows(){return rows},get placed(){return placed},get grid(){return grid.map(g=>({h:g.h,open:g.open,flag:g.flag,n:g.n}))},get geo(){const R=cv.getBoundingClientRect();return{x:R.left+ox,y:R.top+oy,cs}}};
})();
