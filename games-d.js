/* ポケット17 — ゲーム 18（育成放置） */
"use strict";

/* ============================================================
   18 たまご牧場
   ============================================================ */
GAMES.push({
  id:"ranch", title:"たまご牧場", cat:"育成",
  ctrl:"なでてたまごを集める／放置でも増える",
  about:"生きものを増やして、たまごを集める放置ゲーム",
  kw:"idle clicker ikusei houchi tamago farm",
  hint:"閉じているあいだも増えます（最大8時間ぶん）。10匹ごとに、その種類の生産が2倍になります。",
  fmt:v=>big(v),
  thumb(c,W,H){
    px(c,0,78,W,34,PAL.dim);
    px(c,0,78,W,2,PAL.olive);
    const kinds=[[22,PAL.olive,10],[58,PAL.teal,9],[96,PAL.blue,11],[130,PAL.amber,8]];
    kinds.forEach(([x,col,r],i)=>{
      c.fillStyle=col;
      c.beginPath(); c.arc(x,72-r+ (i%2?2:0), r,0,7); c.fill();
      px(c,x-r*0.45,70-r,3,3,PAL.screen);
      px(c,x+r*0.2,70-r,3,3,PAL.screen);
    });
    c.fillStyle=PAL.bone;
    [[40,40],[72,28],[112,44]].forEach(([x,y])=>{
      c.beginPath(); c.ellipse(x,y,5,6.5,0,0,7); c.fill();
    });
    txt(c,"IDLE",150,10,9,PAL.dim,"right");
  },
  start(api){
    const KINDS=[
      {n:"ぷに",    col:PAL.olive, base:0.5,  cost:15,      r:11},
      {n:"もこ",    col:PAL.teal,  base:3,    cost:150,     r:12},
      {n:"ぴょん",  col:PAL.blue,  base:18,   cost:1800,    r:10},
      {n:"ぐら",    col:PAL.amber, base:95,   cost:22000,   r:14},
      {n:"しゅわ",  col:PAL.plum,  base:520,  cost:280000,  r:12},
      {n:"ほしまる",col:PAL.bone,  base:3200, cost:4000000, r:13}
    ];
    const SAVE="ranch", CAP=8*3600;   /* 放置で受け取れるのは最大8時間ぶん */

    let st = load();
    function fresh(){ return {eggs:0, life:0, own:[0,0,0,0,0,0], star:0, born:Date.now(), seen:Date.now()}; }
    function load(){
      const d=store.get(SAVE,null);
      if(!d || !Array.isArray(d.own) || d.own.length!==6) return fresh();
      return {
        eggs:+d.eggs||0, life:+d.life||0,
        own:d.own.map(v=>Math.max(0,Math.floor(+v||0))),
        star:Math.max(0,Math.floor(+d.star||0)),
        born:+d.born||Date.now(), seen:+d.seen||Date.now()
      };
    }
    function save(){ st.seen=Date.now(); store.set(SAVE, st); }

    const boost = i => Math.pow(2, Math.floor(st.own[i]/10));   /* 10匹ごとに2倍 */
    const starMul = ()=> 1 + st.star*0.1;
    function cps(){
      let s=0;
      KINDS.forEach((k,i)=> s += k.base*st.own[i]*boost(i));
      return s*starMul();
    }
    function price(i){ return Math.ceil(KINDS[i].cost * Math.pow(1.15, st.own[i])); }
    function canStar(){ return st.life >= 1e6; }
    function starGain(){ return Math.max(0, Math.floor(Math.sqrt(st.life/1e6)) - st.star); }

    /* 留守のあいだのぶん */
    let welcome="";
    (function offline(){
      const dt=Math.min(CAP, Math.max(0,(Date.now()-st.seen)/1000));
      if(dt>60 && cps()>0){
        const got=cps()*dt*0.5;
        st.eggs+=got; st.life+=got;
        welcome="おかえり。留守のあいだに <b>"+big(got)+"</b> こ";
      }
      st.seen=Date.now();
      /* 受け取った時点で保存する。
         ここで書かないと、すぐ閉じて開き直したときに同じぶんを何度でも受け取れてしまう。 */
      save();
    })();

    /* ---- 画面 ---- */
    const wrap=document.createElement("div");
    wrap.style.cssText="width:100%;max-width:360px;display:flex;flex-direction:column;gap:9px";
    const {canvas,ctx,W,H}=makeCanvas(340,150,360);
    canvas.style.borderRadius="4px";
    wrap.appendChild(canvas);
    const bar=document.createElement("div");
    bar.style.cssText="display:flex;gap:7px;align-items:stretch";
    const pet=document.createElement("button");
    pet.className="key"; pet.style.cssText="flex:1;font-size:14px";
    pet.textContent="なでる";
    const starB=document.createElement("button");
    starB.className="key alt"; starB.style.cssText="font-size:12px;padding:10px 12px";
    bar.appendChild(pet); bar.appendChild(starB);
    const shop=document.createElement("div");
    shop.style.cssText="display:flex;flex-direction:column;gap:5px;max-height:212px;overflow-y:auto;-webkit-overflow-scrolling:touch";
    wrap.appendChild(bar); wrap.appendChild(shop);
    api.host.appendChild(wrap);
    live.mainCanvas=canvas;

    function rowFor(i){
      const d=document.createElement("button");
      d.dataset.i=i;
      d.style.cssText="display:flex;align-items:center;gap:9px;text-align:left;cursor:pointer;"+
        "background:#141a13;border:1px solid #39412f;border-radius:4px;padding:8px 9px;color:#e9e3d0;font-family:inherit";
      shop.appendChild(d);
      return d;
    }
    const rows=KINDS.map((k,i)=>rowFor(i));

    function paintShop(){
      const money=st.eggs;
      KINDS.forEach((k,i)=>{
        const p=price(i), afford=money>=p;
        const d=rows[i];
        d.style.opacity = (st.own[i]>0 || afford || (i>0 && st.own[i-1]>0)) ? 1 : .45;
        d.style.borderColor = afford ? "#6f7a58" : "#39412f";
        const mul=boost(i);
        const made=k.base*st.own[i]*mul*starMul();
        d.innerHTML=
          '<span style="width:26px;height:26px;border-radius:50%;background:'+k.col+';flex:0 0 auto"></span>'+
          '<span style="flex:1;min-width:0">'+
            '<span style="display:block;font-size:13px;font-weight:700">'+k.n+
              ' <span style="color:#8a9180;font-weight:400">×'+st.own[i]+(mul>1?' <span style="color:'+PAL.amber+'">えさ'+mul+'倍</span>':'')+'</span></span>'+
            '<span style="display:block;font-family:'+FONT+';font-size:10.5px;color:#8a9180">'+
              big(made)+' こ/秒</span>'+
          '</span>'+
          '<span style="font-family:'+FONT+';font-size:12px;color:'+(afford?PAL.amber:"#6d7564")+'">'+big(p)+'</span>';
      });
    }
    function buy(i){
      const p=price(i);
      if(st.eggs<p) { api.sfx.bad(); return; }
      st.eggs-=p; st.own[i]++;
      api.sfx.good();
      if(st.own[i]%10===0){ api.sfx.great(); api.fx.pop(W/2,60,"えさ "+boost(i)+"倍！",PAL.amber); api.fx.shake(3); }
      paintShop(); save();
    }
    shop.addEventListener("pointerdown", e=>{
      const t=e.target.closest("[data-i]");
      if(t) buy(+t.dataset.i);
    });

    function doPet(){
      const g=Math.max(1, cps()*0.05);
      st.eggs+=g; st.life+=g;
      api.fx.pop(60+Math.random()*220, 60+Math.random()*40, "+"+big(g), PAL.bone);
      api.fx.burst(W/2, H-30, {n:3, col:PAL.bone, sp:60, life:.35});
      api.sfx.tap();
    }
    pet.addEventListener("pointerdown", e=>{ e.preventDefault(); doPet(); });
    api.on(canvas,"pointerdown", e=>{ e.preventDefault(); doPet(); });

    function paintStar(){
      const g=starGain();
      if(canStar() && g>0){
        starB.textContent="転生 +"+g+"★";
        starB.style.borderColor=PAL.amber; starB.style.color=PAL.amber;
        starB.disabled=false;
      } else {
        starB.textContent="★"+st.star;
        starB.style.borderColor="#4a533d"; starB.style.color="#8a9180";
        starB.disabled=true;
      }
    }
    starB.addEventListener("click", ()=>{
      const g=starGain();
      if(!canStar() || g<=0) return;
      api.sheet('<h4>転生しますか</h4>'+
        '<p>生きものとたまごがすべて消えるかわりに、<br>★を <b>'+g+'</b> つ受け取ります。<br>'+
        '★1つにつき、生産がずっと <b>+10%</b> になります。</p>'+
        '<div class="keys"><button class="key" id="yes">転生する</button>'+
        '<button class="key alt" id="no">やめる</button></div>');
      el("yes").onclick=()=>{
        st.star+=g; st.eggs=0; st.own=[0,0,0,0,0,0];
        api.sfx.great(); api.fx.shake(7);
        save(); paintShop(); paintStar(); api.close();
      };
      el("no").onclick=()=>api.close();
    });

    /* ---- 牧場の絵 ---- */
    let t=0;
    function draw(){
      px(ctx,0,0,W,H,PAL.screen);
      for(let i=0;i<16;i++){
        const sx=(i*73)%W, sy=(i*29)%60;
        px(ctx,sx,sy,2,2,"rgba(233,227,208,.1)");
      }
      px(ctx,0,H-44,W,44,PAL.dim);
      px(ctx,0,H-44,W,2,PAL.olive);
      for(let i=0;i<9;i++) px(ctx, 10+i*38, H-34, 10, 2, "rgba(147,160,92,.35)");

      /* 種類ごとに、持っている数に応じて並べる */
      let slot=0;
      KINDS.forEach((k,i)=>{
        const show=Math.min(6, st.own[i]);
        for(let j=0;j<show;j++){
          const x=22+(slot%10)*33;
          const row=Math.floor(slot/10);
          const y=H-54-row*34;
          const bob=Math.sin(t*2.2+slot*0.8)*3;
          const r=k.r*0.78;
          ctx.fillStyle=k.col;
          ctx.beginPath(); ctx.ellipse(x, y+bob, r, r*0.86, 0, 0, 7); ctx.fill();
          px(ctx, x-r*0.42, y+bob-r*0.2, 3, 3, PAL.screen);
          px(ctx, x+r*0.18, y+bob-r*0.2, 3, 3, PAL.screen);
          if(Math.sin(t*2.2+slot*0.8)>0.92) px(ctx, x-2, y+bob+r*0.3, 5, 2, PAL.screen);
          slot++;
          if(slot>=30) break;
        }
      });
      /* ときどき たまごが落ちる */
      if(cps()>0 && Math.random()<0.04){
        api.fx.burst(20+Math.random()*(W-40), H-60, {n:1, col:PAL.bone, sp:20, life:.9, g:90, size:4});
      }
      px(ctx,0,0,W,26,"rgba(20,26,19,.85)");
      txt(ctx,"たまご "+big(st.eggs), 9, 13, 13, PAL.bone);
      txt(ctx, big(cps())+" こ/秒", W-9, 13, 12, PAL.olive, "right");
      api.fx.draw(ctx);
    }

    api.controls({wide:{label:"なでる", fn:()=>doPet()}, legend:"閉じていても<br>たまごは増える"});
    paintShop(); paintStar();
    api.info(welcome || "生きものを買うと、ひとりでにたまごが増えます");

    let acc=0, savet=0;
    api.loop(dt=>{
      t+=dt;
      const got=cps()*dt;
      st.eggs+=got; st.life+=got;
      acc+=dt; savet+=dt;
      if(welcome && t>6) welcome="";
      if(acc>=0.25){
        acc=0;
        paintShop(); paintStar();
        if(!welcome) api.info("つうさん <b>"+big(st.life)+"</b> こ　★"+st.star+
          (canStar()&&starGain()>0?"　<b style='color:"+PAL.amber+"'>転生できます</b>":""));
      }
      if(savet>=5){ savet=0; save(); api.record(st.life); }
      api.score(st.life);
      draw();
    });

    return ()=>{ save(); api.record(st.life); };
  }
});
