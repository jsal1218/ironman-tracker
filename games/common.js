// Shared helpers for Dash games: best scores, WebAudio SFX (muted by default), haptics, overlay, pause on hide.
window.G=(()=>{'use strict';
const id=document.body.dataset.game,$=s=>document.querySelector(s);
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let muted=localStorage.getItem('dash-games-sound')!=='on',ac=null;
function tone(f,d=.08,type='sine',v=.12,slide=0,delay=0){if(muted)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();
 const t=ac.currentTime+delay,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+d);
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0008,t+d);o.connect(g).connect(ac.destination);o.start(t);o.stop(t+d+.02)}catch(e){}}
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
const best=()=>+localStorage.getItem(`dash-games-${id}-best`)||0;
const setBest=s=>{if(s>best()){localStorage.setItem(`dash-games-${id}-best`,s);return true}return false};
function sndBtn(){const b=$('#sound');if(!b)return;const r=()=>{b.textContent=muted?'🔇':'🔊';b.setAttribute('aria-label',muted?'Sound off (tap to turn on)':'Sound on (tap to mute)');b.setAttribute('aria-pressed',String(!muted))};
 r();b.onclick=()=>{muted=!muted;localStorage.setItem('dash-games-sound',muted?'off':'on');r();tone(660,.08)}}
function overlay(title,text,btn,cb){const o=$('#ov');o.querySelector('h2').textContent=title;o.querySelector('p').textContent=text;const b=o.querySelector('button');b.textContent=btn;b.onclick=()=>{o.hidden=true;cb&&cb()};o.hidden=false;setTimeout(()=>b.focus({preventScroll:true}),30)}
const hide=()=>{$('#ov').hidden=true};
function onHide(cb){document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')cb()});addEventListener('pagehide',cb)}
// keep the page still while playing (no pinch / double-tap zoom / rubber-band scroll)
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('touchmove',e=>{if(e.target.closest('.stage'))e.preventDefault()},{passive:false});
document.addEventListener('DOMContentLoaded',sndBtn);if(document.readyState!=='loading')sndBtn();
return{id,reduced,tone,buzz,best,setBest,overlay,hide,onHide,$,get muted(){return muted}};
})();
