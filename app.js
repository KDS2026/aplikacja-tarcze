const slides=[null,1,5,2,5,3,5,4];
const videos=[document.querySelector('#a'),document.querySelector('#b')];
const cover=document.querySelector('#cover'),status=document.querySelector('#status');
let index=0,active=0,generation=0,hideTimer,loadTimer,fadeTimer,loading=false,fading=false;
function label(){
 const v=videos[active];
 status.textContent=index===0?'Powitanie · → rozpocznij':loading?'Wczytywanie filmu… · ← cofnij':fading?'Wyciszanie…':slides[index]===5?`Przerywnik · ${v.paused?'pauza · ':''}→ wycisz i przejdź`:`Tarcza ${slides[index]}/4 · ${v.paused?'→ uruchom':'→ dalej'}`;
 document.querySelector('#pause').textContent=index&& !v.paused?'Pauza':'Odtwórz';
}
function error(message){document.querySelector('#error').textContent=message;document.querySelector('#error').hidden=false;wake();}
function cancelTransition(){generation++;clearTimeout(loadTimer);clearTimeout(fadeTimer);fading=false;loading=false;videos.forEach(v=>{v.onloadeddata=null;v.onerror=null;v.volume=1;});}
function play(){
 if(!index)return;
 const v=videos[active],token=generation;
 // play() może pozostawać nierozstrzygnięte podczas buforowania. Nie blokuje sterowania.
 const result=v.play();label();
 if(result)result.then(()=>{if(token===generation)label();}).catch(e=>{
  if(token===generation&&e.name!=='AbortError')error('Nie udało się uruchomić filmu. Naciśnij Odtwórz lub spację.');
 });
}
function show(target,autoplay=false){
 cancelTransition();const token=generation;
 videos.forEach(v=>v.pause());
 document.querySelector('#error').hidden=true;
 if(target===0){videos.forEach(v=>v.hidden=true);cover.hidden=false;index=0;label();return;}
 const old=videos[active],next=videos[1-active];
 old.hidden=true;next.hidden=false;cover.hidden=true;active=1-active;index=target;loading=true;
 next.onloadeddata=()=>{
  if(token!==generation)return;
  clearTimeout(loadTimer);loading=false;label();
 };
 next.onerror=()=>{if(token===generation){clearTimeout(loadTimer);loading=false;label();error('Nie można wczytać filmu. Sprawdź połączenie i spróbuj ponownie. Klawisz ← pozwala się cofnąć.');}};
 next.src=`media/${slides[target]}.mp4`;next.load();
 loadTimer=setTimeout(()=>{if(token===generation&&loading)error('Film nadal się wczytuje. Możesz poczekać lub cofnąć się klawiszem ←.');},15000);
 label();if(autoplay)play();
}
function fadeNext(){
 if(fading)return;
 const token=generation,v=videos[active],start=performance.now(),volume=v.volume;
 fading=true;label();
 // Timer działa także, gdy przeglądarka wstrzyma rysowanie klatek.
 function tick(){
  if(token!==generation)return;
  const t=Math.min(1,(performance.now()-start)/1400);
  v.volume=volume*(1-t);
  if(t<1)fadeTimer=setTimeout(tick,25);
  else{v.pause();show(index+1,false);}
 }
 tick();
}
function forward(){
 if(fading)return;
 if(index===0)return show(1,false);
 if(slides[index]===5)return fadeNext();
 const v=videos[active];
 if(v.paused&&!v.ended)return play();
 if(index<slides.length-1)return show(index+1,true);
 v.pause();label();
}
function backward(){show(Math.max(0,index-1),false);}
function togglePause(){
 if(!index)return;
 if(fading){clearTimeout(fadeTimer);fading=false;videos[active].volume=1;}
 const v=videos[active];if(v.paused)play();else v.pause();label();
}
function wake(){document.body.classList.remove('quiet');clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(!loading&&!fading)document.body.classList.add('quiet');},3000);}
function fullscreen(){if(document.fullscreenElement)document.exitFullscreen();else document.documentElement.requestFullscreen().catch(()=>{});}
// Capture obsługuje klawisze także po kliknięciu przycisku lub filmu.
window.addEventListener('keydown',e=>{
 const key=e.code||e.key;
 if(!['ArrowRight','ArrowLeft','Space','KeyF',' '].includes(key))return;
 e.preventDefault();e.stopPropagation();if(e.repeat)return;wake();
 if(key==='ArrowRight')forward();if(key==='ArrowLeft')backward();
 if(key==='Space'||key===' ')togglePause();if(key==='KeyF')fullscreen();
},true);
videos.forEach(v=>{v.tabIndex=-1;['play','pause','ended'].forEach(event=>v.addEventListener(event,label));});
document.querySelector('#next').onclick=forward;document.querySelector('#back').onclick=backward;
document.querySelector('#pause').onclick=togglePause;document.querySelector('#full').onclick=fullscreen;
window.addEventListener('mousemove',wake);window.addEventListener('touchstart',wake);window.addEventListener('focusin',wake);label();wake();
