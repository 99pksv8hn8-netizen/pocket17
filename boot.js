/* ポケット17 — 電源投入 */
"use strict";

/* ===== 電源を入れる ===== */
tabs();
draw();
paintName();

(async ()=>{
  const k=await Net.probe();
  el("netLamp").textContent = k ? "つながる" : "使えない";
  el("netLamp").style.color = k ? "" : "var(--ink-soft)";
})();

/* オフラインでも遊べるようにする。claude.ai 上では使えないので黙って見送る。 */
if("serviceWorker" in navigator && location.protocol==="https:" && !(window.claude&&window.claude.use)){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("sw.js").catch(()=>{});
  });
}

function powerOn(saved){
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const b=el("boot");
  if(reduce){ b.classList.add("off"); return; }
  const tx=el("bootTx");
  tx.textContent="POCKET 17";
  setTimeout(()=>{ tx.textContent="READY"; },320);
  setTimeout(()=>{
    b.classList.add("off");
    el("lens").classList.add("lit");
    if(saved && saved.g){
      const g=GAMES.find(x=>x.id===saved.g);
      if(g) start(g);
    }
  },640);
}

/* 公開しなおしても、開いていた画面にもどる */
try{
  if(window.claude && window.claude.hot){
    if(window.claude.hot.snapshot) window.claude.hot.snapshot(()=>({g: cur?cur.id:null}));
    if(window.claude.hot.ready) window.claude.hot.ready(powerOn);
    else powerOn(window.claude.hot.data||{});
  } else powerOn({});
}catch(e){ powerOn({}); }
