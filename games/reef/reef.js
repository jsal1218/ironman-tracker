// Reef Swap: tide-pool match-3. Swap neighbors to line up 3+; 4 in a line makes a wave tile, L/T makes a bubble burst, 5 makes a whirlpool.
(()=>{'use strict';const{tone,buzz,best,setBest,overlay,hide,$}=G,cv=$('#cv'),x=cv.getContext('2d');
const N=8,T=6,MOVES=30,COL=['#ff7a59','#f2c14e','#3ccf91','#efe9ff','#a77be6','#46b3f7'],DARK=['#b8432a','#a8791a','#1c8a5d','#9c8fc4','#6a43a8','#1f73b0'];
let W,H,top,bot,cs=40,ox=0,oy=0,state='ready',raf=0,last=0,t=0,score=0,moves=MOVES,board=[],phase='idle',anim=0,sel=-1,drag=null,cascade=0,parts=[],pops=[],beams=[],idle=0,hint=null,swapA=-1,swapB=-1,swapBack=false,pend=[],nextBonus=2500,shake=0,bestShown=0;
const rc=i=>[i/N|0,i%N],R=n=>Math.floor(Math.random()*n),SPD=()=>G.reduced?60:16;
function size(){const f=G.fit(cv,x);W=f.W;H=f.H;top=f.top;bot=f.bot;cs=Math.floor(Math.min((W-36)/N,(H-top-bot-70)/N,72));ox=Math.round((W-cs*N)/2);oy=Math.round(top+Math.max(10,(H-top-bot-cs*N)/2-10))}
addEventListener('resize',()=>{size();draw()});
const tile=(t,r,sp=0)=>({t,sp,y:r,clr:0});
function runs(){const out=[];for(const dir of['h','v'])for(let a=0;a<N;a++){let s=0;for(let b=1;b<=N;b++){const i0=dir==='h'?a*N+s:s*N+a,i1=dir==='h'?a*N+b:b*N+a,t0=board[i0]?board[i0].t:-9;if(b<N&&board[i1]&&t0>=0&&board[i1].t===t0)continue;if(b-s>=3&&t0>=0){const cells=[];for(let k=s;k<b;k++)cells.push(dir==='h'?a*N+k:k*N+a);out.push({dir,cells,t:t0})}s=b}}return out}
function fill(){board=[];for(let i=0;i<N*N;i++){const[r]=rc(i);let t;do t=R(T);while((i%N>=2&&board[i-1].t===t&&board[i-2].t===t)||(r>=2&&board[i-N].t===t&&board[i-2*N].t===t));board.push(tile(t,r))}if(!findMove())fill()}
function adj(a,b){const[r1,c1]=rc(a),[r2,c2]=rc(b);return Math.abs(r1-r2)+Math.abs(c1-c2)===1}
function sw(a,b){const k=board[a];board[a]=board[b];board[b]=k}
function validSwap(a,b){const A=board[a],B=board[b];if(A.sp===4||B.sp===4||(A.sp&&B.sp))return true;sw(a,b);const ok=runs().length>0;sw(a,b);return ok}
function findMove(){for(let i=0;i<N*N;i++){const[r,c]=rc(i);if(c<N-1&&validSwap(i,i+1))return[i,i+1];if(r<N-1&&validSwap(i,i+N))return[i,i+N]}return null}
function shuffle(){let n=0;do{for(const tl of board)if(tl.sp!==4)tl.t=R(T);n++}while((runs().length||!findMove())&&n<200);pops.push({x:W/2,y:oy+cs*N/2,txt:'Fresh tide!',l:1.4,big:1});tone(330,.3,'sine',.06,660)}
function reset(){size();score=0;moves=MOVES;nextBonus=2500;cascade=0;parts=[];pops=[];beams=[];sel=-1;drag=null;hint=null;idle=0;phase='idle';fill();ui()}
function ui(){$('#sc').textContent=score.toLocaleString();$('#mv').textContent=moves}
function start(){hide();reset();state='play';$('#pause').hidden=false;last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}
function trySwap(a,b){if(phase!=='idle'||state!=='play'||a<0||b<0||!adj(a,b))return;sel=-1;hint=null;idle=0;swapA=a;swapB=b;swapBack=false;phase='swap';anim=0;tone(520,.05,'sine',.04)}
function afterSwap(){sw(swapA,swapB);if(swapBack){phase='idle';return}
 const A=board[swapA],B=board[swapB];
 if(!(A.sp===4||B.sp===4||(A.sp&&B.sp))&&!runs().length){sw(swapA,swapB);swapBack=true;phase='swap';anim=0;tone(180,.12,'triangle',.05,140);buzz(15);return}
 moves--;cascade=0;ui();const clear=new Set();
 if(A.sp===4||B.sp===4){const w=A.sp===4?swapA:swapB,o=w===swapA?swapB:swapA;clear.add(w);if(board[o].sp===4){for(let i=0;i<N*N;i++)clear.add(i)}else{const tc=board[o].t;for(let i=0;i<N*N;i++)if(board[i].t===tc)clear.add(i);if(board[o].sp)clear.add(o)}board[w].sp=0;board[w].t=-2;beams.push({k:'ring',i:w,l:.6});tone(300,.5,'sine',.08,1200);expandAndClear(clear,[]);return}
 if(A.sp&&B.sp&&!runs().length){clear.add(swapA);clear.add(swapB);expandAndClear(clear,[]);return}
 resolve([swapA,swapB])}
function resolve(swapped){const rs=runs();if(!rs.length)return false;const clear=new Set(),create=[],inH=new Map();
 for(const r of rs){r.cells.forEach(i=>{clear.add(i);if(r.dir==='h')inH.set(i,r.t)})}
 for(const r of rs){const piv=r.cells.find(i=>swapped.includes(i))??r.cells[r.cells.length>>1];if(r.cells.length>=5)create.push({i:piv,t:-1,sp:4});else if(r.cells.length===4)create.push({i:piv,t:r.t,sp:r.dir==='h'?2:1})
  if(r.dir==='v')for(const i of r.cells)if(inH.has(i)&&!create.some(c=>c.i===i))create.push({i,t:r.t,sp:3})}
 expandAndClear(clear,create);return true}
function expandAndClear(clear,create){const fired=new Set();let ch=true;
 while(ch){ch=false;for(const i of[...clear]){const tl=board[i];if(!tl||!tl.sp||fired.has(i))continue;fired.add(i);ch=true;const[r,c]=rc(i);
  if(tl.sp===1){for(let k=0;k<N;k++)clear.add(r*N+k);beams.push({k:'h',i,l:.4})}
  else if(tl.sp===2){for(let k=0;k<N;k++)clear.add(k*N+c);beams.push({k:'v',i,l:.4})}
  else if(tl.sp===3){for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const rr=r+dr,cc=c+dc;if(rr>=0&&rr<N&&cc>=0&&cc<N)clear.add(rr*N+cc)}beams.push({k:'ring',i,l:.5})}
  else if(tl.sp===4){const cnt=Array(T).fill(0);board.forEach(b=>b.t>=0&&cnt[b.t]++);const tc=cnt.indexOf(Math.max(...cnt));board.forEach((b,j)=>b.t===tc&&clear.add(j));beams.push({k:'ring',i,l:.6})}}}
 for(const c of create)clear.delete(c.i);pend=create;
 const mult=cascade+1,pts=clear.size*10*mult+create.length*60+fired.size*40;score+=pts;ui();
 let sx=0,sy=0;for(const i of clear){board[i].clr=1;const[r,c]=rc(i);sx+=c;sy+=r;const px=ox+(c+.5)*cs,py=oy+(r+.5)*cs;for(let k=0;k<(G.reduced?2:5);k++){const a=Math.random()*6.28,v=(60+Math.random()*140);parts.push({x:px,y:py,vx:Math.cos(a)*v,vy:Math.sin(a)*v-40,l:.7,c:board[i].t>=0?COL[board[i].t]:'#fbe9a6',r:2+Math.random()*3})}}
 const n=clear.size||1;pops.push({x:ox+(sx/n+.5)*cs,y:oy+(sy/n+.5)*cs,txt:(mult>1?`x${mult} `:'')+'+'+pts,l:.9,big:mult>1||fired.size});
 if(cascade>=2)pops.push({x:W/2,y:oy-6+cs*.2,txt:['','','Splash!','Tidal!','Reef rush!'][Math.min(4,cascade)],l:1.1,big:1});
 tone(392*Math.pow(1.122,Math.min(cascade*2,10)),.12,'triangle',.07,0);if(fired.size){tone(160,.3,'sine',.08,80);buzz(25);if(!G.reduced)shake=.25}else buzz(8);
 if(score>=nextBonus){moves+=3;nextBonus+=3000+nextBonus*.2|0;pops.push({x:W/2,y:oy+cs*N+24,txt:'+3 moves',l:1.4,big:1});tone(784,.2,'sine',.06,1175,.1);ui()}
 phase='clear';anim=0}
function gravity(){for(const i of board.keys())if(board[i]&&board[i].clr>0)board[i]=null;for(const c of pend)board[c.i]=tile(c.t,(c.i/N)|0,c.sp);pend=[];
 for(let c=0;c<N;c++){let w=N-1;for(let r=N-1;r>=0;r--){const tl=board[r*N+c];if(tl){board[r*N+c]=null;board[w*N+c]=tl;w--}}let k=1;for(let r=w;r>=0;r--){board[r*N+c]=tile(R(T),-k);k++}}phase='fall'}
function settle(dt){let moving=false;for(let i=0;i<N*N;i++){const tl=board[i],r=(i/N)|0;if(tl.y<r){tl.y=Math.min(r,tl.y+SPD()*dt);moving=true}}if(moving)return;
 cascade++;if(resolve([]))return;cascade=0;phase='idle';if(moves<=0)return end();if(!findMove())shuffle()}
function step(dt){t+=dt;
 if(phase==='swap'){anim+=dt/(G.reduced?.06:.14);if(anim>=1)afterSwap()}
 else if(phase==='clear'){anim+=dt/(G.reduced?.08:.2);for(const tl of board)if(tl&&tl.clr>0)tl.clr=Math.max(.001,1-anim);if(anim>=1)gravity()}
 else if(phase==='fall')settle(dt);
 else{idle+=dt;if(idle>6&&!hint)hint=findMove()}
 for(const p of parts){p.vy+=320*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt}parts=parts.filter(p=>p.l>0);for(const p of pops){p.l-=dt;p.y-=30*dt}pops=pops.filter(p=>p.l>0);for(const b of beams)b.l-=dt;beams=beams.filter(b=>b.l>0);shake=Math.max(0,shake-dt)}
function end(){state='over';$('#pause').hidden=true;const nb=setBest(score);draw();setTimeout(()=>overlay(nb?'New best!':'Out of moves',`Score ${score.toLocaleString()} · Best ${best().toLocaleString()}`,'Play again',start,nb?'trophy':'restart'),G.reduced?150:600)}
// art
function star(r,n,ri){x.beginPath();for(let k=0;k<n*2;k++){const a=-Math.PI/2+k*Math.PI/n,rr=k%2?ri:r;x.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}x.closePath()}
function piece(tl,px,py,s){x.save();x.translate(px,py);const sc=tl.clr>0?tl.clr:1;x.scale(sc,sc);const t0=tl.t,c=COL[t0],d=DARK[t0];x.lineWidth=Math.max(1.5,s*.07);
 if(tl.sp===4){const g=x.createConicGradient?x.createConicGradient(t*3,0,0):null;if(g){COL.forEach((cc,k)=>g.addColorStop(k/6,cc));g.addColorStop(1,COL[0]);x.fillStyle=g}else x.fillStyle='#fbe9a6';x.beginPath();x.arc(0,0,s*.9,0,7);x.fill();x.strokeStyle='#fff';x.lineWidth=s*.12;x.beginPath();for(let a=0;a<12;a+=.2){const rr=a/12*s*.75;x.lineTo(Math.cos(a+t*4)*rr,Math.sin(a+t*4)*rr)}x.stroke();x.restore();return}
 x.fillStyle=c;x.strokeStyle=d;
 if(t0===0){star(s*.95,5,s*.45);x.fill();x.stroke();x.fillStyle='rgba(255,255,255,.55)';for(let k=0;k<5;k++){const a=-Math.PI/2+k*1.2566;x.beginPath();x.arc(Math.cos(a)*s*.45,Math.sin(a)*s*.45,s*.07,0,7);x.fill()}}
 else if(t0===1){x.beginPath();x.moveTo(0,s*.8);x.arc(0,s*.1,s*.85,Math.PI*1.05,Math.PI*1.95);x.closePath();x.fill();x.stroke();x.beginPath();for(let k=-2;k<=2;k++){x.moveTo(0,s*.75);x.lineTo(Math.sin(k*.5)*s*.8,s*.1-Math.cos(k*.5)*s*.78)}x.stroke();x.fillRect(-s*.25,s*.62,s*.5,s*.2)}
 else if(t0===2){x.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3+Math.PI/6;x.lineTo(Math.cos(a)*s*.88,Math.sin(a)*s*.88)}x.closePath();x.fill();x.stroke();x.fillStyle='rgba(255,255,255,.45)';x.beginPath();x.moveTo(-s*.45,-s*.15);x.lineTo(-s*.1,-s*.55);x.lineTo(s*.05,-s*.45);x.lineTo(-s*.32,-s*.02);x.fill()}
 else if(t0===3){const g=x.createRadialGradient(-s*.3,-s*.3,s*.1,0,0,s*.85);g.addColorStop(0,'#ffffff');g.addColorStop(1,'#b9addf');x.fillStyle=g;x.beginPath();x.arc(0,0,s*.78,0,7);x.fill();x.stroke();x.fillStyle='rgba(255,255,255,.9)';x.beginPath();x.arc(-s*.28,-s*.3,s*.16,0,7);x.fill()}
 else if(t0===4){star(s*.95,12,s*.62);x.fill();x.stroke();x.fillStyle='#d6bcff';x.beginPath();x.arc(0,0,s*.38,0,7);x.fill()}
 else{x.beginPath();x.ellipse(-s*.1,0,s*.62,s*.45,0,0,7);x.fill();x.stroke();x.beginPath();x.moveTo(s*.45,0);x.lineTo(s*.92,-s*.42);x.lineTo(s*.92,s*.42);x.closePath();x.fill();x.stroke();x.fillStyle='#fff';x.beginPath();x.arc(-s*.38,-s*.08,s*.12,0,7);x.fill();x.fillStyle='#0b2a2e';x.beginPath();x.arc(-s*.36,-s*.08,s*.06,0,7);x.fill()}
 if(tl.sp===1||tl.sp===2){x.strokeStyle='rgba(255,255,255,.95)';x.lineWidth=s*.12;x.beginPath();for(const k of[-.35,0,.35]){if(tl.sp===1){x.moveTo(-s*.75,k*s);x.lineTo(s*.75,k*s)}else{x.moveTo(k*s,-s*.75);x.lineTo(k*s,s*.75)}}x.globalAlpha=.75;x.stroke();x.globalAlpha=1}
 if(tl.sp===3){x.strokeStyle='#fbe9a6';x.lineWidth=s*.14;x.beginPath();x.arc(0,0,s*.98+Math.sin(t*6)*s*.05,0,7);x.stroke()}
 x.restore()}
function draw(){const g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0f4a4f');g.addColorStop(1,'#08262a');x.fillStyle=g;x.fillRect(0,0,W,H);
 x.save();if(shake>0)x.translate((Math.random()-.5)*8*shake,(Math.random()-.5)*8*shake);
 // caustic light
 x.globalAlpha=.07;x.fillStyle='#bff7ee';for(let k=0;k<6;k++){x.beginPath();x.ellipse(W*((k*.37+t*.01)%1),H*((k*.53)%1),120,40,k+t*.05,0,7);x.fill()}x.globalAlpha=1;
 x.fillStyle='rgba(233,200,106,.22)';rr(ox-8,oy-8,cs*N+16,cs*N+16,18);x.fill();x.fillStyle='rgba(6,30,32,.6)';rr(ox-4,oy-4,cs*N+8,cs*N+8,14);x.fill();
 for(let r=0;r<N;r++)for(let c=0;c<N;c++){x.fillStyle=(r+c)%2?'rgba(240,226,180,.10)':'rgba(240,226,180,.05)';x.fillRect(ox+c*cs,oy+r*cs,cs,cs)}
 x.save();x.beginPath();x.rect(ox,oy,cs*N,cs*N);x.clip();const s=cs*.42;
 for(let i=0;i<N*N;i++){const tl=board[i];if(!tl)continue;const[r,c]=rc(i);let px=ox+(c+.5)*cs,py=oy+(tl.y+.5)*cs;
  if(phase==='swap'&&(i===swapA||i===swapB)){const o=i===swapA?swapB:swapA,[r2,c2]=rc(o),k=Math.min(1,anim),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,kk=swapBack?e:e;px+=(c2-c)*cs*kk;py+=(r2-r)*cs*kk}
  if(i===sel){x.fillStyle='rgba(251,233,166,.35)';x.fillRect(ox+c*cs+2,oy+r*cs+2,cs-4,cs-4)}
  let ss=s;if(hint&&hint.includes(i)&&!G.reduced)ss=s*(1+.08*Math.sin(t*8));else if(hint&&hint.includes(i)){x.strokeStyle='#fbe9a6';x.lineWidth=3;x.strokeRect(ox+c*cs+3,oy+r*cs+3,cs-6,cs-6)}
  piece(tl,px,py,ss)}
 for(const b of beams){const[r,c]=rc(b.i),k=b.l*2;x.fillStyle=`rgba(255,250,220,${Math.min(.8,k)})`;if(b.k==='h')x.fillRect(ox,oy+r*cs+cs*.3,cs*N,cs*.4);else if(b.k==='v')x.fillRect(ox+c*cs+cs*.3,oy,cs*.4,cs*N);else{x.strokeStyle=`rgba(251,233,166,${Math.min(1,k)})`;x.lineWidth=6;x.beginPath();x.arc(ox+(c+.5)*cs,oy+(r+.5)*cs,(1.2-b.l)*cs*2.2,0,7);x.stroke()}}
 x.restore();
 for(const p of parts){x.globalAlpha=Math.min(1,p.l*2);x.fillStyle=p.c;x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill()}x.globalAlpha=1;
 x.textAlign='center';for(const p of pops){x.globalAlpha=Math.min(1,p.l*2);x.font=`800 ${p.big?24:18}px system-ui,sans-serif`;x.lineWidth=4;x.strokeStyle='rgba(0,0,0,.5)';x.strokeText(p.txt,p.x,p.y);x.fillStyle=p.big?'#fbe9a6':'#fff';x.fillText(p.txt,p.x,p.y)}x.globalAlpha=1;
 const by=oy+cs*N+14;if(by+20<H-bot){x.font='600 13px system-ui,sans-serif';x.fillStyle='rgba(236,242,238,.75)';x.fillText(`Next +3 moves at ${nextBonus.toLocaleString()}`,W/2,by+16)}
 x.restore()}
function rr(a,b,w,h,r){x.beginPath();x.roundRect?x.roundRect(a,b,w,h,r):x.rect(a,b,w,h)}
function loop(now){raf=requestAnimationFrame(loop);const dt=Math.min(.033,(now-last)/1000||0);last=now;if(state==='play')step(dt);draw();if(state!=='play')cancelAnimationFrame(raf)}
// input
const cellAt=(px,py)=>{const c=Math.floor((px-ox)/cs),r=Math.floor((py-oy)/cs);return c>=0&&c<N&&r>=0&&r<N?r*N+c:-1};
const pos=e=>{const r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]};
cv.addEventListener('pointerdown',e=>{if(state!=='play')return;const[a,b]=pos(e),i=cellAt(a,b);if(i<0)return;cv.setPointerCapture?.(e.pointerId);drag={i,x:a,y:b,moved:false};idle=0});
cv.addEventListener('pointermove',e=>{if(!drag||drag.moved)return;const[a,b]=pos(e),dx=a-drag.x,dy=b-drag.y;if(Math.hypot(dx,dy)<cs*.35)return;drag.moved=true;const[r,c]=rc(drag.i);let o=-1;if(Math.abs(dx)>Math.abs(dy)){if(dx>0&&c<N-1)o=drag.i+1;else if(dx<0&&c>0)o=drag.i-1}else{if(dy>0&&r<N-1)o=drag.i+N;else if(dy<0&&r>0)o=drag.i-N}trySwap(drag.i,o)});
cv.addEventListener('pointerup',e=>{if(!drag)return;const d=drag;drag=null;if(d.moved||phase!=='idle')return;if(sel===d.i)sel=-1;else if(sel>=0&&adj(sel,d.i))trySwap(sel,d.i);else{sel=d.i;tone(700,.04,'sine',.03)}});
cv.addEventListener('pointercancel',()=>drag=null);
$('#hintB').onclick=()=>{if(state==='play'&&phase==='idle'){hint=findMove();idle=6}};
function pause(){if(state!=='play')return;state='paused';drag=null;overlay('Paused',`Score ${score.toLocaleString()} · ${moves} moves left`,'Resume',()=>{state='play';last=performance.now();raf=requestAnimationFrame(loop)},'pause')}
$('#pause').onclick=pause;$('#pause').hidden=true;G.onHide(pause);window.dashBusy=()=>state==='play'||state==='paused';
reset();draw();overlay('Reef Swap','Swap neighboring tiles to match 3 or more. Match 4 for a wave, an L or T for a bubble burst, 5 for a whirlpool. 30 moves, earn more as you score.','Dive in',start,'play');
window.__reef={get state(){return state},get score(){return score},get moves(){return moves},get phase(){return phase},get board(){return board.map(b=>b&&b.t)},get geo(){const r=cv.getBoundingClientRect();return{x:r.left+ox,y:r.top+oy,cs}},findMove,setMoves(n){moves=n;ui()}};
})();
