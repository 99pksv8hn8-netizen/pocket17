/* ポケット17 — 共通部品（パレット・入力・描画・音・演出） */
"use strict";
/* ============================================================
   ポケット16 — 本体側のしくみ
   ============================================================ */

/* ハードウェアパレット。全ゲームこの8色だけで描く。 */
const PAL = {
  screen:"#1b2119", dim:"#36402f", dim2:"#22291f",
  bone:"#e9e3d0", olive:"#93a05c", amber:"#e3a73c",
  red:"#c85540", teal:"#4fa08c", blue:"#5283bd", plum:"#9b7cb0",
  /* 旧コードとの対応 */
  bg:"#1b2119", grid:"#36402f", line:"#36402f",
  tx:"#e9e3d0", tx2:"#aeb49f", tx3:"#79806c",
  a1:"#c85540", a2:"#e3a73c", a3:"#93a05c", a4:"#5283bd",
  a5:"#9b7cb0", a6:"#d98048", a7:"#4fa08c"
};
const FONT = '"DotGothic16", "Zen Kaku Gothic New", monospace';

const store = {
  get(k,d){ try{ const v=localStorage.getItem("p16:"+k); return v===null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem("p16:"+k, JSON.stringify(v)); }catch(e){} }
};
const el = id => document.getElementById(id);
const esc = s => String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* ---------- 入力 ---------- */
const Input = (()=>{
  const down=new Set(), hits=new Set(), raw=new Set();
  const ALIAS={a:"ArrowLeft",d:"ArrowRight",w:"ArrowUp",s:"ArrowDown"," ":"Space",Enter:"Space",z:"Space",x:"KeyX"};
  const norm = e => {
    if(e.key===" ") return "Space";
    const k = e.key.length===1 ? e.key.toLowerCase() : e.key;
    return ALIAS[k] || e.key;
  };
  window.addEventListener("keydown", e=>{
    const k=norm(e);
    if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Space"].includes(k)) e.preventDefault();
    if(!down.has(k)) hits.add(k);
    down.add(k);
    if(e.key && e.key.length===1) raw.add(e.key.toLowerCase());
  }, {passive:false});
  window.addEventListener("keyup", e=>{
    down.delete(norm(e));
    if(e.key && e.key.length===1) raw.delete(e.key.toLowerCase());
  });
  window.addEventListener("blur", ()=>{ down.clear(); raw.clear(); });
  return {
    held:k=>down.has(k),
    rawHeld:k=>raw.has(k),
    hit(k){ if(hits.has(k)){ hits.delete(k); return true; } return false; },
    vdown(k){ if(!down.has(k)) hits.add(k); down.add(k); },
    vup(k){ down.delete(k); },
    clear(){ down.clear(); hits.clear(); raw.clear(); }
  };
})();

/* ---------- 画面 ---------- */
function makeCanvas(w,h,maxw){
  const c=document.createElement("canvas");
  const dpr=Math.min(window.devicePixelRatio||1, 2.5);
  c.width=Math.round(w*dpr); c.height=Math.round(h*dpr);
  c.style.width="100%"; c.style.maxWidth=(maxw||w)+"px"; c.style.aspectRatio=w+" / "+h;
  const ctx=c.getContext("2d");
  ctx.scale(dpr,dpr); ctx.W=w; ctx.H=h;
  c.logicalW=w; c.logicalH=h;
  return {canvas:c, ctx, W:w, H:h};
}
function rr(ctx,x,y,w,h,r){
  r=Math.min(r,w/2,h/2);
  ctx.beginPath(); ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
function txt(ctx,s,x,y,size,col,align){
  ctx.fillStyle=col||PAL.bone;
  ctx.font=size+"px "+FONT;
  ctx.textAlign=align||"left"; ctx.textBaseline="middle";
  ctx.fillText(s,x,y);
}
/* ドット絵を1マス単位で置くための補助 */
function px(ctx,x,y,w,h,col){ ctx.fillStyle=col; ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); }
function sprite(ctx, x, y, s, rows, map){
  rows.forEach((row,ry)=>{
    for(let rx=0;rx<row.length;rx++){
      const c=map[row[rx]];
      if(c) px(ctx, x+rx*s, y+ry*s, s, s, c);
    }
  });
}

/* ---------- 音 ---------- */
const SFX=(()=>{
  let ac=null;
  const on = ()=> store.get("sound",true);
  function ctx(){ if(ac) return ac; try{ ac=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ ac=null; } return ac; }
  function tone(f,d,t,v){
    if(!on()) return;
    const a=ctx(); if(!a) return;
    try{
      if(a.state==="suspended") a.resume();
      const o=a.createOscillator(), g=a.createGain();
      o.type=t||"square"; o.frequency.value=f;
      g.gain.setValueAtTime(.0001,a.currentTime);
      g.gain.exponentialRampToValueAtTime(v||.06,a.currentTime+.008);
      g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+(d||.08));
      o.connect(g); g.connect(a.destination);
      o.start(); o.stop(a.currentTime+(d||.08)+.02);
    }catch(e){}
  }
  return {
    tap(){ tone(440,.045,"square",.04); },
    good(){ tone(680,.07,"square",.05); },
    great(){ tone(560,.06,"square",.05); setTimeout(()=>tone(840,.09,"square",.05),60); setTimeout(()=>tone(1120,.1,"square",.045),130); },
    bad(){ tone(170,.16,"sawtooth",.045); },
    over(){ tone(320,.13,"sawtooth",.05); setTimeout(()=>tone(200,.2,"sawtooth",.05),120); setTimeout(()=>tone(130,.26,"sawtooth",.045),290); }
  };
})();

/* ---------- 手触り（粒子・ゆれ・ポップ） ---------- */
const FX=(()=>{
  let parts=[], pops=[], shake=0;
  return {
    burst(x,y,o){
      o=o||{};
      const n=o.n||9, col=o.col||PAL.bone, sp=o.sp||95, life=o.life||.45, size=o.size||2.4;
      for(let i=0;i<n;i++){
        const a=Math.random()*Math.PI*2, v=sp*(.45+Math.random()*.75);
        parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(o.up?60:0),t:life*(.6+Math.random()*.7),m:life,col,g:o.g===undefined?230:o.g,size});
      }
      if(parts.length>260) parts=parts.slice(-260);
    },
    pop(x,y,text,col){ pops.push({x,y,text,col:col||PAL.amber,t:.75,m:.75}); if(pops.length>18) pops.shift(); },
    shake(n){ shake=Math.min(11,Math.max(shake,n)); },
    shakeVal(){ return shake; },
    update(dt){
      shake *= Math.pow(0.0015, dt);
      if(shake<0.12) shake=0;
      parts.forEach(p=>{ p.t-=dt; p.vy+=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; });
      parts=parts.filter(p=>p.t>0);
      pops.forEach(p=>{ p.t-=dt; p.y-=26*dt; });
      pops=pops.filter(p=>p.t>0);
    },
    draw(ctx){
      parts.forEach(p=>{
        ctx.globalAlpha=Math.max(0,Math.min(1,p.t/p.m));
        px(ctx,p.x-p.size/2,p.y-p.size/2,p.size,p.size,p.col);
      });
      pops.forEach(p=>{
        ctx.globalAlpha=Math.max(0,Math.min(1,p.t/p.m));
        txt(ctx,p.text,p.x,p.y,13,p.col,"center");
      });
      ctx.globalAlpha=1;
    },
    reset(){ parts=[]; pops=[]; shake=0; }
  };
})();
