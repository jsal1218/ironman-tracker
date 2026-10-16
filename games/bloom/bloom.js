(()=>{'use strict';const {tone,buzz,best,setBest,overlay,$}=G,cv=$('#cv'),x=cv.getContext('2d'),N=8;
const SH=[[[0,0]],[[0,0],[0,1]],[[0,0],[1,0]],[[0,0],[0,1],[0,2]],[[0,0],[1,0],[2,0]],[[0,0],[0,1],[0,2],[0,3]],[[0,0],[1,0],[2,0],[3,0]],[[0,0],[0,1],[0,2],[0,3],[0,4]],[[0,0],[1,0],[2,0],[3,0],[4,0]],
 [[0,0],[0,1],[1,0],[1,1]],[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]],[[0,0],[1,0],[1,1]],[[0,1],[1,0],[1,1]],[[0,0],[0,1],[1,0]],[[0,0],[0,1],[1,1]],
 [[0,0],[1,0],[2,0],[2,1]],[[0,1],[1,1],[2,1],[2,0]],[[0,0],[0,1],[0,2],[1,1]],[[0,0],[0,1],[1,1],[1,2]],[[0,1],[0,2],[1,0],[1,1]],[[0,0],[0,1],[0,2],[1,0]],[[0,0],[1,0],[1,1],[1,2]],[[0,0],[1,1]],[[0,1],[1,0]]];
const COL=['#d9b44a','#2fb582','#e9a0b4','#f1d58a','#9b6bd6','#0b8a62','#f28c6a'];
let W,H,DPR,cell,ox,oy,trayY,trayCell,grid,tray,score,combo,over,drag=null,anim=[],raf=0,lift;
function size(){DPR=Math.min(2,devicePixelRatio||1);W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DPR;cv.height=H*DPR;x.setTransform(DPR,0,0,DPR,0,0);
 cell=Math.floor(Math.min((W-24)/N,(H*.66)/N));ox=(W-cell*N)/2;oy=8;trayY=oy+cell*N+Math.max(16,(H-oy-cell*N-cell*3.2)/2);trayCell=Math.floor(Math.min(cell*.6,(W-40)/15));lift=cell*1.6;draw()}
addEventListener('resize',size);
const fits=(s,r,c)=>s.every(([a,b])=>r+a>=0&&r+a<N&&c+b>=0&&c+b<N&&!grid[r+a][c+b]);
const anyFit=s=>{for(let r=0;r<N;r++)for(let c=0;c<N;c++)if(fits(s,r,c))return[r,c];return null};
const dims=s=>[Math.max(...s.map(p=>p[0]))+1,Math.max(...s.map(p=>p[1]))+1];
function deal(){// fair dealing: re-roll so that at least one new piece fits the current garden whenever possible
 for(let k=0;k<30;k++){const t=[0,1,2].map(()=>({s:SH[Math.random()*SH.length|0],c:COL[Math.random()*COL.length|0]}));if(t.some(p=>anyFit(p.s))||k===29){tray=t;return}}}
function trayPos(i){const slot=(W-24)/3,[h,w]=dims(tray[i].s);return[12+slot*i+(slot-w*trayCell)/2,trayY+(cell*3.2-h*trayCell)/2-cell*.4]}
function start(fresh){const s=!fresh&&JSON.parse(localStorage.getItem('dash-games-bloom-state')||'null');
 if(s&&!s.over&&s.grid){({grid,tray,score,combo}=s)}else{grid=[...Array(N)].map(()=>Array(N).fill(null));score=0;combo=0;deal()}over=false;ui();size();check()}
function save(){try{localStorage.setItem('dash-games-bloom-state',JSON.stringify({grid,tray,score,combo,over}))}catch(e){}}
function ui(){$('#score').textContent=score;$('#best').textContent=Math.max(best(),score);$('#combo').textContent=combo>1?'×'+combo:'–';save()}
function lines(s,r,c){const g=grid.map(row=>row.slice());s.forEach(([a,b])=>g[r+a][c+b]=1);const R=[],C=[];for(let i=0;i<N;i++){if(g[i].every(Boolean))R.push(i);if(g.every(row=>row[i]))C.push(i)}return{R,C}}
function place(i,r,c){const p=tray[i];if(!p||!fits(p.s,r,c))return false;const{R,C}=lines(p.s,r,c);p.s.forEach(([a,b])=>grid[r+a][c+b]=p.c);tray[i]=null;
 let gain=p.s.length;const n=R.length+C.length;
 if(n){combo++;gain+=n*10*n*combo;const now=performance.now(),cl=new Set();R.forEach(rr=>{for(let k=0;k<N;k++)cl.add(rr*N+k)});C.forEach(cc=>{for(let k=0;k<N;k++)cl.add(k*N+cc)});
  cl.forEach(k=>{const rr=k/N|0,cc=k%N;anim.push({r:rr,c:cc,col:grid[rr][cc],t0:now+((rr+cc)%N)*18});grid[rr][cc]=null});
  [0,4,7].forEach((st,j)=>tone(523*Math.pow(2,(st+combo)/12),.14,'triangle',.1,0,j*.06));buzz(n>1?[15,30,15,30,20]:20);floatTxt(`+${gain}${combo>1?' combo ×'+combo:''}`)}
 else{combo=0;tone(300+p.s.length*30,.05,'sine',.07);buzz(8)}
 score+=gain;if(tray.every(t=>!t))deal();ui();check();kick();return true}
let fx=null;function floatTxt(s){fx={s,t0:performance.now()};kick()}
function check(){if(tray.some(t=>t&&anyFit(t.s)))return;over=true;const nb=setBest(score);save();tone(260,.4,'sawtooth',.07,110);buzz([40,60,40]);
 setTimeout(()=>overlay(nb?'New best!':'Garden full',`No room for the remaining beds. Score ${score} · Best ${best()}`,'Replant',()=>start(true),nb?'trophy':'restart'),500)}
function hover(){if(!drag)return null;const p=tray[drag.i],r=Math.round((drag.y-drag.gy-oy)/cell),c=Math.round((drag.x-drag.gx-ox)/cell);return fits(p.s,r,c)?{r,c}:null}
function cellRect(X,Y,s,col,a=1){x.globalAlpha=a;x.fillStyle=col;const m=Math.max(1,s*.06);x.beginPath();x.roundRect?x.roundRect(X+m,Y+m,s-2*m,s-2*m,s*.22):x.rect(X+m,Y+m,s-2*m,s-2*m);x.fill();
 x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.arc(X+s/2,Y+s/2,s*.14,0,7);x.fill();x.fillStyle='rgba(255,255,255,.25)';for(let k=0;k<4;k++){x.beginPath();x.arc(X+s/2+Math.cos(k*1.57)*s*.2,Y+s/2+Math.sin(k*1.57)*s*.2,s*.1,0,7);x.fill()}x.globalAlpha=1}
function draw(){const now=performance.now();x.clearRect(0,0,W,H);x.fillStyle='#0b6e4f';x.beginPath();x.roundRect?x.roundRect(ox-6,oy-6,cell*N+12,cell*N+12,16):x.rect(ox-6,oy-6,cell*N+12,cell*N+12);x.fill();
 for(let r=0;r<N;r++)for(let c=0;c<N;c++){x.fillStyle=(r+c)%2?'#8a6a45':'#94744e';x.fillRect(ox+c*cell,oy+r*cell,cell,cell);if(grid[r][c])cellRect(ox+c*cell,oy+r*cell,cell,grid[r][c])}
 const h=hover();if(drag&&h){const p=tray[drag.i],{R,C}=lines(p.s,h.r,h.c);x.fillStyle='rgba(217,180,74,.42)';R.forEach(r=>x.fillRect(ox,oy+r*cell,cell*N,cell));C.forEach(c=>x.fillRect(ox+c*cell,oy,cell,cell*N));
  p.s.forEach(([a,b])=>cellRect(ox+(h.c+b)*cell,oy+(h.r+a)*cell,cell,p.c,.45))}
 anim=anim.filter(a=>{const k=(now-a.t0)/260;if(k>=1)return false;if(k<0){cellRect(ox+a.c*cell,oy+a.r*cell,cell,a.col);return true}const s=cell*(1-k);x.globalAlpha=1-k;cellRect(ox+a.c*cell+(cell-s)/2,oy+a.r*cell+(cell-s)/2-k*cell*.4,s,a.col,1-k);x.globalAlpha=1;return true});
 x.fillStyle='rgba(11,110,79,.1)';x.beginPath();x.roundRect?x.roundRect(8,trayY-cell*.6,W-16,cell*3.2,18):x.rect(8,trayY-cell*.6,W-16,cell*3.2);x.fill();
 tray.forEach((p,i)=>{if(!p||(drag&&drag.i===i))return;const[X,Y]=trayPos(i),ok=anyFit(p.s);p.s.forEach(([a,b])=>cellRect(X+b*trayCell,Y+a*trayCell,trayCell,ok?p.c:'#b9ad9c'))});
 if(drag){const p=tray[drag.i];p.s.forEach(([a,b])=>cellRect(drag.x-drag.gx+b*cell,drag.y-drag.gy+a*cell,cell,p.c,.95))}
 if(fx){const k=(now-fx.t0)/900;if(k<1){x.globalAlpha=1-k;x.fillStyle='#7a5a00';x.font=`800 ${cell*.6}px system-ui,sans-serif`;x.textAlign='center';x.fillText(fx.s,W/2,oy+cell*N/2-k*cell);x.globalAlpha=1}else fx=null}
 if(anim.length||fx||drag)raf=requestAnimationFrame(draw)}
const kick=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(draw)};
function pick(px,py){for(let i=0;i<3;i++){const p=tray[i];if(!p)continue;const[X,Y]=trayPos(i),[h,w]=dims(p.s),pad=trayCell*.8;if(px>=X-pad&&px<=X+w*trayCell+pad&&py>=Y-pad&&py<=Y+h*trayCell+pad)return{i,X,Y}}return null}
const pt=e=>{const b=cv.getBoundingClientRect();return[e.clientX-b.left,e.clientY-b.top]};
cv.addEventListener('pointerdown',e=>{if(over)return;const[px,py]=pt(e),k=pick(px,py);if(!k)return;e.preventDefault();cv.setPointerCapture(e.pointerId);
 const gx=Math.min(Math.max(px-k.X,0),dims(tray[k.i].s)[1]*trayCell)/trayCell*cell,gy=Math.min(Math.max(py-k.Y,0),dims(tray[k.i].s)[0]*trayCell)/trayCell*cell+lift;
 drag={i:k.i,x:px,y:py,gx,gy};tone(440,.04,'sine',.05);buzz(5);kick()});
cv.addEventListener('pointermove',e=>{if(!drag)return;[drag.x,drag.y]=pt(e)});
cv.addEventListener('pointerup',e=>{if(!drag)return;[drag.x,drag.y]=pt(e);const h=hover(),i=drag.i;drag=null;if(!(h&&place(i,h.r,h.c))){tone(180,.06,'sine',.05);}kick()});
cv.addEventListener('pointercancel',()=>{drag=null;kick()});
$('#newBtn').onclick=()=>{if(score>0&&!over&&!confirm('Start a new garden?'))return;setBest(score);start(true)};
G.onHide(()=>{drag=null;save();setBest(score)});window.dashBusy=()=>!!drag;
// test hook (used by automated playtests): pointer coordinates to drag tray piece i so its top-left lands on (r,c)
window.__bloom={get score(){return score},get over(){return over},get tray(){return tray},anyFit,
 coords(i,r,c){const[X,Y]=trayPos(i),b=cv.getBoundingClientRect(),[a0,b0]=tray[i].s[0];return{down:[b.left+X+(b0+.5)*trayCell,b.top+Y+(a0+.5)*trayCell],up:[b.left+ox+(c+b0+.5)*cell,b.top+oy+(r+a0+.5)*cell+lift]}}};
start(false);
})();
