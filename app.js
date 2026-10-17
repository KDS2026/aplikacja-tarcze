const slides=[null,1,5,2,5,3,5,4];
const videos=[document.querySelector('#a'),document.querySelector('#b')];
let index=0, active=0, busy=false, generation=0, hideTimer;
const cover=document.querySelector('#cover'),status=document.querySelector('#status');
function label(){status.textContent=index===0?'Powitanie · → rozpocznij':slides[index]===5?'Przerywnik · → wycisz i przejdź':`Tarcza ${slides[index]}/4 · ${videos[active].paused?'→ uruchom':'→ dalej'}`;}
function error(message){document.querySelector('#error').textContent=message;document.querySelector('#error').hidden=false;}
async function play(){try{await videos[active].play();label();}catch(e){error('Naciśnij ponownie → lub przycisk Dalej, aby uruchomić film.');}}
async function show(target,autoplay=false){
 if(busy)return;busy=true;const token=++generation;
 try{
 const old=videos[active], next=videos[1-active];
 if(target===0){videos.forEach(v=>{v.pause();v.hidden=true;v.volume=1;});cover.hidden=false;index=0;label();return;}
 next.pause();next.volume=1;next.src=`media/${slides[target]}.mp4`;
 await new Promise((resolve,reject)=>{next.onloadeddata=resolve;next.onerror=()=>reject(new Error('Nie można wczytać filmu. Sprawdź folder media.'));next.load();});
 if(token!==generation)return;
 old.pause();old.volume=1;old.hidden=true;next.hidden=false;cover.hidden=true;active=1-active;index=target;
 document.querySelector('#error').hidden=true;label();if(autoplay)play();
 }catch(e){error(e.message);}finally{busy=false;}
}
async function fadeNext(){if(busy)return;busy=true;const v=videos[active],start=performance.now(),volume=v.volume;
 await new Promise(resolve=>{function tick(now){const t=Math.min(1,(now-start)/1400);v.volume=volume*(1-t);if(t<1)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
 v.pause();busy=false;await show(index+1,false);
}
async function forward(){if(busy)return;if(index===0)return show(1,false);const v=videos[active];
 if(slides[index]===5)return fadeNext();
 if(v.paused&&!v.ended)return play();
 if(index<slides.length-1)return show(index+1,true);
 v.pause();label();}
function backward(){if(!busy)show(Math.max(0,index-1),false);}
function wake(){document.body.classList.remove('quiet');clearTimeout(hideTimer);hideTimer=setTimeout(()=>document.body.classList.add('quiet'),2600);}
function fullscreen(){if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{});}
window.addEventListener('keydown',e=>{if(e.repeat)return;if(['ArrowRight','ArrowLeft',' '].includes(e.key))e.preventDefault();if(e.key==='ArrowRight')forward();if(e.key==='ArrowLeft')backward();if(e.key===' '&&index){const v=videos[active];if(!busy){v.paused?play():v.pause();label();}}if(e.key.toLowerCase()==='f')fullscreen();wake();});
// Każdy film kończy się zatrzymaną klatką; przejście wymaga strzałki.
videos.forEach(v=>v.addEventListener('ended',label));
document.querySelector('#next').onclick=forward;document.querySelector('#back').onclick=backward;document.querySelector('#full').onclick=fullscreen;
window.addEventListener('mousemove',wake);window.addEventListener('touchstart',wake);window.addEventListener('focusin',wake);label();wake();
