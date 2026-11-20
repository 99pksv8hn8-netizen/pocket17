/* ポケット17 — 本体の動き（カタログ・起動・終了・スコア） */
"use strict";

/* ============================================================
   実行環境
   ============================================================ */
const GAMES=[];
let live=null, score=0, best=0, cur=null;
const bk = id => "best:"+id;

const Api={
  get host(){ return el("field"); },
  canvas(w,h,maxw){
    const o=makeCanvas(w,h,maxw);
    el("field").appendChild(o.canvas);
    live.mainCanvas=o.canvas;
    return o;
  },
  loop(fn){
    let last=performance.now(), raf=0, dead=false;
    const step=now=>{
      if(dead) return;
      let dt=(now-last)/1000; last=now;
      if(dt>0.1) dt=0.1;
      fn(dt);
      FX.update(dt);
      const c=live && live.mainCanvas;
      if(c){
        const s=FX.shakeVal();
        c.style.transform = s>0 ? "translate("+((Math.random()-.5)*s).toFixed(1)+"px,"+((Math.random()-.5)*s).toFixed(1)+"px)" : "";
      }
      raf=requestAnimationFrame(step);
    };
    raf=requestAnimationFrame(step);
    live.loops.push(()=>{ dead=true; cancelAnimationFrame(raf); });
  },
  every(ms,fn){ const t=setInterval(fn,ms); live.timers.push(()=>clearInterval(t)); return t; },
  after(ms,fn){ const t=setTimeout(fn,ms); live.timers.push(()=>clearTimeout(t)); return t; },
  on(t,type,fn,opt){ t.addEventListener(type,fn,opt); live.listeners.push(()=>t.removeEventListener(type,fn,opt)); },
  score(v){
    score=Math.max(0,Math.round(v));
    el("sc").textContent = (cur&&cur.fmt) ? cur.fmt(score) : score.toLocaleString();
  },
  /* 終わりのないゲーム用。結果画面を出さずに記録だけ残す。 */
  record(v){
    const sc=Math.round(v);
    if(!cur || !isFinite(sc) || sc<=0) return false;
    const low=!!cur.lower;
    const better = low ? (sc<best || best===0) : (sc>best);
    if(better){ best=sc; store.set(bk(cur.id),sc); el("bs").textContent=fmt(cur,sc); }
    Rank.submit(cur.id, sc, low);
    return better;
  },
  add(v){ Api.score(score+v); },
  info(html){ el("note").innerHTML=html||""; },
  pos(canvas,e){
    const r=canvas.getBoundingClientRect();
    const p=(e.touches&&e.touches[0])?e.touches[0]:e;
    return {x:(p.clientX-r.left)/r.width*(canvas.logicalW||r.width),
            y:(p.clientY-r.top)/r.height*(canvas.logicalH||r.height)};
  },
  swipe(target,fn){
    let sx=0,sy=0,act=false;
    Api.on(target,"pointerdown",e=>{act=true;sx=e.clientX;sy=e.clientY;});
    Api.on(target,"pointerup",e=>{
      if(!act) return; act=false;
      const dx=e.clientX-sx, dy=e.clientY-sy;
      if(Math.hypot(dx,dy)<26) return;
      if(Math.abs(dx)>Math.abs(dy)) fn(dx>0?"right":"left"); else fn(dy>0?"down":"up");
    });
    Api.on(target,"pointercancel",()=>{act=false;});
  },
  /* 筐体の十字キーとボタンを組む */
  controls(cfg){
    const deck=el("deck");
    deck.innerHTML="";
    if(!cfg){ deck.classList.remove("on"); return; }
    deck.classList.add("on");
    const hold=(node,on,off)=>{
      const dn=e=>{ e.preventDefault(); node.classList.add("hold"); on(); };
      const up=e=>{ if(e) e.preventDefault(); node.classList.remove("hold"); if(off) off(); };
      node.addEventListener("pointerdown",dn);
      node.addEventListener("pointerup",up);
      node.addEventListener("pointercancel",up);
      node.addEventListener("pointerleave",up);
    };
    if(cfg.dpad){
      const want=cfg.dpad===true?"lrud":cfg.dpad;
      const pad=document.createElement("div");
      pad.className="dpad";
      const defs=[["u","ArrowUp"],["d","ArrowDown"],["l","ArrowLeft"],["r","ArrowRight"]];
      defs.forEach(([k,codeName])=>{
        const b=document.createElement("b");
        b.className=k;
        if(!want.includes(k)) b.style.opacity=".4";
        pad.appendChild(b);
        if(want.includes(k)) hold(b, ()=>Input.vdown(codeName), ()=>Input.vup(codeName));
      });
      const c=document.createElement("b"); c.className="c"; pad.appendChild(c);
      deck.appendChild(pad);
    }
    if(cfg.legend){
      const g=document.createElement("div");
      g.className="legend"; g.innerHTML=cfg.legend;
      deck.appendChild(g);
    }
    const abs=document.createElement("div");
    abs.className="abs";
    const mk=(spec,cls)=>{
      if(!spec) return;
      const b=document.createElement("button");
      b.type="button";
      b.className="ab"+(cls?" "+cls:"")+(spec.wide?" wide":"");
      b.textContent=spec.label;
      if(spec.fn) hold(b, ()=>spec.fn());
      else hold(b, ()=>Input.vdown(spec.code), ()=>Input.vup(spec.code));
      abs.appendChild(b);
    };
    if(cfg.wide) mk({label:cfg.wide.label, code:cfg.wide.code, fn:cfg.wide.fn, wide:true});
    else { mk(cfg.b,"b"); mk(cfg.a); }
    deck.appendChild(abs);
  },
  fx:FX,
  sfx:SFX,
  pal:PAL,
  rr, txt, px, sprite,
  net:Net,
  /* 画面内のパネル */
  sheet(html){
    el("card").innerHTML=html;
    el("sheet").classList.add("on");
    return el("card");
  },
  close(){ el("sheet").classList.remove("on"); },
  /* モード選択。Promise で選ばれた id を返す */
  modes(list){
    return new Promise(res=>{
      const c=Api.sheet('<h4>'+esc(cur.title)+'</h4><p>あそびかたをえらぶ</p><div class="keys" style="flex-direction:column">'+
        list.map((m,i)=>'<button class="key'+(i?" alt":"")+'" data-m="'+m.id+'" style="width:100%">'+esc(m.label)+'</button>').join("")+
        '</div>');
      c.querySelectorAll("[data-m]").forEach(b=>{
        b.onclick=()=>{ Api.close(); res(b.dataset.m); };
      });
    });
  },
  over(opt){
    opt=opt||{};
    const sc=(opt.score===undefined)?score:Math.round(opt.score);
    const low=(opt.lower!==undefined)?opt.lower:!!cur.lower;
    const better = low ? (sc<best || best===0) : (sc>best);
    let rec=false, place=0;
    if(opt.save!==false && sc>0){
      if(better){ best=sc; store.set(bk(cur.id),sc); rec=true; el("bs").textContent=fmt(cur,sc); }
      Rank.submit(cur.id, sc, low);
      const b=Rank.board(cur.id);
      const idx=b.findIndex(r=>r.name===Rank.name());
      if(idx>=0 && b.length>1) place=idx+1;
    }
    SFX.over();
    Api.sheet(
      '<h4>'+esc(opt.title||"おわり")+'</h4>'+
      '<p class="fig tnum">'+(opt.value!==undefined?esc(opt.value):fmt(cur,sc))+'</p>'+
      (rec?'<div class="rec">ハイスコア更新</div>':'')+
      (place?'<div class="rec" style="background:#4fa08c">'+esc(Rank.name())+' は '+place+'位</div>':'')+
      '<p>'+(opt.msg||"もう一度あそびますか？")+'</p>'+
      (Rank.named()?'':'<p style="font-size:11px;color:#79806c">名前を入れると順位がつきます</p>')+
      '<div class="keys"><button class="key" id="re">もう一度</button>'+
      (Rank.named()?'':'<button class="key alt" id="nm">名前を入れる</button>')+
      '<button class="key alt" id="bk2">一覧へ</button></div>'
    );
    el("re").onclick=()=>{ Api.close(); start(cur); };
    el("bk2").onclick=()=> toMenu();
    if(!Rank.named() && el("nm")) el("nm").onclick=()=> askName(()=>Api.over(opt));
  }
};

function fmt(g,v){
  if(v===0||v===undefined||v===null) return "0";
  return g && g.fmt ? g.fmt(v) : Number(v).toLocaleString();
}

function stop(){
  if(!live) return;
  live.loops.forEach(f=>f());
  live.timers.forEach(f=>f());
  live.listeners.forEach(f=>f());
  if(typeof live.cleanup==="function"){ try{ live.cleanup(); }catch(e){} }
  live=null;
  Net.leave();
  FX.reset();
  el("field").innerHTML="";
  el("note").innerHTML=""; el("guide").textContent="";
  el("deck").innerHTML=""; el("deck").classList.remove("on");
  Api.close();
  Input.clear();
}

function start(g){
  stop();
  cur=g; score=0;
  best=store.get(bk(g.id),0)||0;
  el("sc").textContent="0";
  el("bs").textContent=fmt(g,best);
  el("gname").innerHTML=esc(g.title)+'<s>'+esc(g.ctrl||"")+'</s>';
  el("guide").textContent=g.hint||"";
  el("menu").hidden=true; el("ranking").hidden=true; el("game").hidden=false;
  const played=store.get("played",{});
  played[g.id]=(played[g.id]||0)+1; store.set("played",played);
  live={loops:[],timers:[],listeners:[],cleanup:null,mainCanvas:null};
  try{ live.cleanup=g.start(Api)||null; }
  catch(err){ el("field").innerHTML='<div style="color:'+PAL.red+';font-size:12px;padding:24px">読み込みに失敗しました: '+esc(err.message)+'</div>'; }
}

function toMenu(){
  stop();
  el("game").hidden=true; el("ranking").hidden=true; el("menu").hidden=false;
  cur=null; draw(); paintName();
}
el("quit").onclick=toMenu;
window.addEventListener("keydown",e=>{ if(e.key==="Escape" && cur) toMenu(); });

/* ---------- 名前 ---------- */
function paintName(){
  const m=Rank.me();
  el("pname").textContent=Rank.name();
  el("ptier").textContent=m.tier+" Lv."+m.lv+(m.pt?"・"+m.pt+"pt":"");
}
function askName(after){
  Api.sheet(
    '<h4>名前を入れる</h4>'+
    '<p>順位はこの端末のなかだけに残ります。<br>'+Rank.MAXN+'文字まで。</p>'+
    '<label for="nmi">なまえ</label>'+
    '<input id="nmi" type="text" maxlength="'+Rank.MAXN+'" value="'+esc(Rank.named()?Rank.name():"")+'">'+
    '<div class="keys"><button class="key" id="nok">決定</button>'+
    '<button class="key alt" id="ncl">やめる</button></div>'
  );
  const i=el("nmi");
  if(i && i.focus) i.focus();
  el("nok").onclick=()=>{
    Rank.setName(i.value);
    paintName(); Api.close();
    if(after) after(); else if(!el("ranking").hidden) drawRanking();
  };
  el("ncl").onclick=()=>{ Api.close(); if(after) after(); };
}
el("nameBtn").onclick=()=>askName();

/* ---------- ランキング ---------- */
let rkPick=null;
function toRanking(){
  stop();
  el("menu").hidden=true; el("game").hidden=true; el("ranking").hidden=false;
  cur=null;
  drawRanking();
  window.scrollTo(0,0);
}
function rkRow(i,name,sub,val,gid){
  return '<li class="rkrow"><span class="rkno'+(i<3?" top":"")+'">'+(i+1)+'</span>'+
    '<span class="rkname">'+esc(name)+(sub?'<small>'+esc(sub)+'</small>':'')+'</span>'+
    '<span class="rkval">'+esc(val)+'</span>'+
    (gid?'<button class="rkdel" data-n="'+esc(name)+'" data-g="'+esc(gid)+'" aria-label="この記録を消す">✕</button>':'')+
    '</li>';
}
function drawRanking(){
  const m=Rank.me();
  el("rme").textContent=Rank.name()+"　"+m.tier+" Lv."+m.lv+"　"+m.pt+"pt";
  const all=Rank.standings();
  const ids=Rank.games();
  if(!rkPick || ids.indexOf(rkPick)<0) rkPick=ids[0]||null;
  let h='<div class="rksec"><h4>総合</h4>';
  h += all.length
    ? '<ol class="rklist">'+all.map((r,i)=>rkRow(i,r.name,r.tier+" Lv."+r.lv,r.pt+"pt")).join("")+'</ol>'
    : '<p class="rknone">まだ記録がありません。<br>名前を入れてから遊ぶと、ここに順位が出ます。</p>';
  h+='</div>';
  if(ids.length){
    const g=GAMES.find(x=>x.id===rkPick);
    h+='<div class="rksec"><h4>ゲーム別</h4><select id="rksel" aria-label="ゲームをえらぶ">'+
      ids.map(id=>{
        const gg=GAMES.find(x=>x.id===id);
        return '<option value="'+esc(id)+'"'+(id===rkPick?" selected":"")+'>'+esc(gg?gg.title:id)+'</option>';
      }).join("")+'</select>'+
      '<ol class="rklist">'+Rank.board(rkPick).map((r,i)=>rkRow(i,r.name,"",fmt(g,r.s),rkPick)).join("")+'</ol></div>';
  }
  h+='<div class="rksec"><div class="keys" style="justify-content:flex-start">'+
     '<button class="key alt" id="rkname">名前を変える</button>'+
     (all.length?'<button class="key alt" id="rkwipe">記録をぜんぶ消す</button>':'')+
     '</div></div>';
  el("rkbody").innerHTML=h;

  const sel=el("rksel");
  if(sel) sel.onchange=()=>{ rkPick=sel.value; drawRanking(); };
  el("rkbody").querySelectorAll(".rkdel").forEach(b=>{
    b.onclick=()=>{ Rank.erase(b.dataset.n, b.dataset.g); paintName(); drawRanking(); };
  });
  el("rkname").onclick=()=>askName();
  if(el("rkwipe")) el("rkwipe").onclick=()=>{
    Api.sheet('<h4>ぜんぶ消しますか</h4><p>すべての名前の記録が消えます。もとに戻せません。</p>'+
      '<div class="keys"><button class="key" id="wy">消す</button>'+
      '<button class="key alt" id="wn">やめる</button></div>');
    el("wy").onclick=()=>{ Rank.eraseAll(); Api.close(); paintName(); drawRanking(); };
    el("wn").onclick=()=>Api.close();
  };
}
el("rbk").onclick=toMenu;
el("toRank").onclick=toRanking;

/* ---------- カタログ ---------- */
let tab="ぜんぶ", q="";
function tabs(){
  const set=["ぜんぶ",...Array.from(new Set(GAMES.map(g=>g.cat)))];
  el("tabs").innerHTML=set.map(c=>'<button class="tab" aria-pressed="'+(c===tab)+'" data-c="'+esc(c)+'">'+esc(c)+'</button>').join("");
  el("tabs").querySelectorAll(".tab").forEach(b=>{
    b.onclick=()=>{ tab=b.dataset.c; tabs(); draw(); };
  });
}
function draw(){
  const played=store.get("played",{});
  const total=Object.values(played).reduce((a,b)=>a+b,0);
  el("cnt").textContent=GAMES.length+"本";
  el("playedTx").textContent=total?("あそんだ回数 "+total):"";
  const hit=GAMES.filter(g=>{
    if(tab!=="ぜんぶ" && g.cat!==tab) return false;
    if(q && !(g.title+" "+g.ctrl+" "+g.cat+" "+(g.kw||"")+" "+(g.about||"")).toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  if(!hit.length){ el("list").innerHTML='<div class="none">みつかりません</div>'; return; }
  el("list").innerHTML=hit.map(g=>{
    const b=store.get(bk(g.id),0);
    const n=String(GAMES.indexOf(g)+1).padStart(2,"0");
    return '<button class="item'+(g.vs?" vs":"")+'" data-id="'+g.id+'">'+
      '<span class="shot" data-shot="'+g.id+'"><span class="no">'+n+(g.vs?" VS":"")+'</span></span>'+
      '<span class="txt"><h3>'+esc(g.title)+'</h3>'+
      '<span class="meta"><span>'+esc(g.cat)+'</span>'+
      (b?'<span class="hi tnum">'+fmt(g,b)+'</span>':'<span>—</span>')+
      '</span></span></button>';
  }).join("");
  /* サムネイルはゲーム自身に描かせる */
  el("list").querySelectorAll("[data-shot]").forEach(host=>{
    const g=GAMES.find(x=>x.id===host.dataset.shot);
    if(!g || !g.thumb) return;
    const o=makeCanvas(160,112,320);
    o.canvas.style.maxWidth="100%";
    host.appendChild(o.canvas);
    o.ctx.fillStyle=PAL.screen; o.ctx.fillRect(0,0,160,112);
    try{ g.thumb(o.ctx,160,112); }catch(e){}
  });
  el("list").querySelectorAll(".item").forEach(b=>{
    b.onclick=()=>{ const g=GAMES.find(x=>x.id===b.dataset.id); if(g) start(g); };
  });
}
el("q").addEventListener("input",e=>{ q=e.target.value.trim(); draw(); });
