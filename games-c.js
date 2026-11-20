/* ポケット17 — ゲーム 13-14 */
"use strict";
/* ============================================================
   13 フルーツキャッチ
   ============================================================ */
GAMES.push({
  id:"catch", title:"フルーツキャッチ", cat:"アクション",
  ctrl:"←→ でカゴを動かす",
  about:"落ちてくる果物を受けて、爆弾はよける",
  kw:"catch fruit kago",
  hint:"爆弾を取ってもミス1回。果物を落とすのもミスです。光っている実は高得点。",
  thumb(c,W,H){
    px(c,66,86,38,16,PAL.amber);
    px(c,70,90,30,2,"rgba(0,0,0,.3)");
    px(c,74,86,2,16,PAL.screen); px(c,86,86,2,16,PAL.screen); px(c,96,86,2,16,PAL.screen);
    c.fillStyle=PAL.red; c.beginPath(); c.arc(46,34,10,0,7); c.fill();
    c.fillStyle=PAL.plum; c.beginPath(); c.arc(112,20,9,0,7); c.fill();
    c.fillStyle="#d9c27a"; c.beginPath(); c.arc(84,56,8,0,7); c.fill();
    c.fillStyle=PAL.dim; c.beginPath(); c.arc(22,64,9,0,7); c.fill();
    px(c,24,52,2,5,PAL.red);
    txt(c,"ACTION",150,10,9,PAL.dim,"right");
  },
  start(api){
    const {canvas,ctx,W,H}=api.canvas(340,450,380);
    const BW=66, BH=22, BY=H-38;
    let bx=W/2, items=[], lives=3, dead=false, spawnT=.8, caught=0;
    const KINDS=[
      {c:PAL.red, r:10, pt:10},
      {c:PAL.plum, r:11, pt:10},
      {c:PAL.teal, r:9, pt:15},
      {c:"#d9c27a", r:8, pt:50, gold:true},
      {c:PAL.dim, r:10, pt:0, bad:true}
    ];
    function spawn(){
      const r=Math.random();
      const k = r<.22 ? KINDS[4] : r<.3 ? KINDS[3] : KINDS[Math.floor(Math.random()*3)];
      items.push({x:22+Math.random()*(W-44), y:-14, vy:115+Math.random()*55+caught*2, k, sp:Math.random()*6});
    }
    api.on(canvas,"pointermove",e=>{ bx=Math.max(BW/2,Math.min(W-BW/2,api.pos(canvas,e).x)); });
    api.on(canvas,"pointerdown",e=>{ bx=Math.max(BW/2,Math.min(W-BW/2,api.pos(canvas,e).x)); });
    api.controls({dpad:"lr", legend:"←→ でカゴを動かす"});
    api.info("のこり <b>3</b>／キャッチ <b>0</b>");
    api.loop(dt=>{
      if(!dead){
        if(Input.held("ArrowLeft")) bx-=390*dt;
        if(Input.held("ArrowRight")) bx+=390*dt;
        bx=Math.max(BW/2,Math.min(W-BW/2,bx));
        spawnT-=dt;
        if(spawnT<=0){ spawn(); spawnT=Math.max(.33,.95-caught*.012); }
        items.forEach(o=>{ o.y+=o.vy*dt; o.sp+=dt*3; });
        items=items.filter(o=>{
          if(o.y>BY-BH/2&&o.y<BY+BH&&Math.abs(o.x-bx)<BW/2+o.k.r*.6){
            if(o.k.bad){
              lives--; api.sfx.bad(); api.fx.shake(8);
              api.fx.burst(o.x,o.y,{n:14,col:PAL.red,sp:130});
              if(lives<=0) dead=true;
            } else {
              caught++; api.add(o.k.pt);
              api.fx.burst(o.x,o.y,{n:o.k.gold?12:6,col:o.k.c,sp:85});
              if(o.k.gold){ api.fx.pop(o.x,o.y-14,"+"+o.k.pt,PAL.amber); api.sfx.great(); } else api.sfx.good();
            }
            return false;
          }
          if(o.y>H+18){
            if(!o.k.bad){ lives--; api.sfx.bad(); api.fx.shake(4); if(lives<=0) dead=true; }
            return false;
          }
          return true;
        });
        if(dead){ api.over({title:"ゲームオーバー", msg:caught+"個キャッチ"}); return; }
        api.info("のこり <b>"+lives+"</b>／キャッチ <b>"+caught+"</b>");
      }
      px(ctx,0,0,W,H,PAL.screen);
      px(ctx,0,0,W,26,PAL.dim2);
      for(let i=0;i<lives;i++) px(ctx,10+i*11,10,7,7,PAL.red);
      txt(ctx,"CATCH "+caught,W-10,13,11,PAL.tx3,"right");
      items.forEach(o=>{
        const wob=Math.sin(o.sp)*2;
        if(o.k.bad){
          ctx.fillStyle=o.k.c; ctx.beginPath(); ctx.arc(o.x,o.y,o.k.r,0,7); ctx.fill();
          px(ctx,o.x+1,o.y-o.k.r-5,2,5,PAL.red);
          px(ctx,o.x-4,o.y-4,3,3,"rgba(233,227,208,.5)");
        } else {
          if(o.k.gold){
            ctx.globalAlpha=.3; ctx.fillStyle=o.k.c;
            ctx.beginPath(); ctx.arc(o.x,o.y,o.k.r+6,0,7); ctx.fill(); ctx.globalAlpha=1;
          }
          ctx.fillStyle=o.k.c; ctx.beginPath(); ctx.arc(o.x+wob*.3,o.y,o.k.r,0,7); ctx.fill();
          px(ctx,o.x-o.k.r*.5,o.y-o.k.r*.5,3,3,"rgba(255,255,255,.45)");
          px(ctx,o.x,o.y-o.k.r-4,2,5,PAL.olive);
        }
      });
      px(ctx,bx-BW/2,BY-BH/2,BW,BH,PAL.amber);
      px(ctx,bx-BW/2+2,BY-BH/2+2,BW-4,3,"rgba(255,255,255,.3)");
      for(let i=1;i<4;i++) px(ctx,bx-BW/2+i*BW/4,BY-BH/2,2,BH,"rgba(27,33,25,.45)");
      api.fx.draw(ctx);
    });
  }
});

/* ============================================================
   14 スペースシューター
   ============================================================ */
GAMES.push({
  id:"shooter", title:"スペースシューター", cat:"アクション",
  ctrl:"←→ で移動／A で発射",
  about:"編隊で降りてくる敵を撃ち落とす",
  kw:"shooter invader uchuu",
  hint:"画面を指でなぞると移動しながら自動で連射します。",
  thumb(c,W,H){
    for(let i=0;i<26;i++) px(c,(i*53)%W,(i*31)%H,1.6,1.6,"rgba(233,227,208,.3)");
    const cols=[PAL.plum,PAL.red,PAL.blue];
    for(let r=0;r<3;r++) for(let i=0;i<5;i++){
      const x=18+i*26, y=14+r*20;
      px(c,x,y,18,12,cols[r]);
      px(c,x+3,y+4,3,3,PAL.screen); px(c,x+12,y+4,3,3,PAL.screen);
      px(c,x-2,y+3,3,6,cols[r]); px(c,x+17,y+3,3,6,cols[r]);
    }
    px(c,78,92,4,10,PAL.bone);
    c.fillStyle=PAL.olive;
    c.beginPath(); c.moveTo(80,76); c.lineTo(90,96); c.lineTo(70,96); c.closePath(); c.fill();
    txt(c,"ACTION",150,106,9,PAL.dim,"right");
  },
  start(api){
    const {canvas,ctx,W,H}=api.canvas(340,450,380);
    const PY=H-34;
    let px0=W/2, bul=[], ebul=[], en=[], lives=3, wave=1, dead=false, cool=0, dir=1, auto=false, t=0, killed=0;
    function build(){
      en=[];
      const cols=6, rows=Math.min(4,2+Math.floor(wave/2));
      for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) en.push({x:32+c*50, y:52+r*38, w:24, h:18, t:r});
      dir=1;
    }
    build();
    function shoot(){
      if(cool>0||dead) return;
      bul.push({x:px0,y:PY-13}); cool=.22; api.sfx.tap();
    }
    api.on(canvas,"pointermove",e=>{ px0=Math.max(15,Math.min(W-15,api.pos(canvas,e).x)); });
    api.on(canvas,"pointerdown",e=>{ e.preventDefault(); px0=Math.max(15,Math.min(W-15,api.pos(canvas,e).x)); auto=true; shoot(); });
    api.on(canvas,"pointerup",()=>{ auto=false; });
    api.on(canvas,"pointercancel",()=>{ auto=false; });
    api.on(canvas,"pointerleave",()=>{ auto=false; });
    api.controls({dpad:"lr", a:{label:"発射",code:"Space"}, legend:"←→ で移動"});
    api.info("ウェーブ <b>1</b>／のこり <b>3</b>");
    api.loop(dt=>{
      if(!dead){
        t+=dt; cool-=dt;
        if(Input.held("ArrowLeft")) px0-=285*dt;
        if(Input.held("ArrowRight")) px0+=285*dt;
        if(Input.held("Space")||auto) shoot();
        px0=Math.max(15,Math.min(W-15,px0));
        const sp=26+wave*7+(24-Math.min(24,en.length))*2.2;
        let minX=1e9,maxX=-1e9;
        en.forEach(e=>{ e.x+=dir*sp*dt; minX=Math.min(minX,e.x); maxX=Math.max(maxX,e.x); });
        if(en.length&&(minX<17||maxX>W-17)){ dir*=-1; en.forEach(e=>e.y+=14); }
        if(en.length&&Math.random()<dt*(.5+wave*.18)){
          const e=en[Math.floor(Math.random()*en.length)];
          ebul.push({x:e.x,y:e.y+e.h/2,vy:145+wave*12});
        }
        bul.forEach(b=>b.y-=440*dt);
        bul=bul.filter(b=>b.y>-10);
        ebul.forEach(b=>b.y+=b.vy*dt);
        ebul=ebul.filter(b=>b.y<H+10);
        for(let i=bul.length-1;i>=0;i--){
          for(let j=en.length-1;j>=0;j--){
            const e=en[j];
            if(Math.abs(bul[i].x-e.x)<e.w/2+3&&Math.abs(bul[i].y-e.y)<e.h/2+5){
              api.fx.burst(e.x,e.y,{n:9,col:[PAL.plum,PAL.red,PAL.blue,PAL.teal][e.t%4],sp:100});
              en.splice(j,1); bul.splice(i,1); killed++;
              api.add(20+wave*5); api.sfx.good();
              break;
            }
          }
        }
        for(let i=ebul.length-1;i>=0;i--){
          if(Math.abs(ebul[i].x-px0)<12&&Math.abs(ebul[i].y-PY)<13){
            ebul.splice(i,1); lives--; api.sfx.bad(); api.fx.shake(9);
            api.fx.burst(px0,PY,{n:14,col:PAL.red,sp:130});
            if(lives<=0) dead=true;
          }
        }
        if(en.some(e=>e.y>PY-24)){ lives=0; dead=true; }
        if(dead){ api.over({title:"ゲームオーバー", msg:"ウェーブ "+wave+"／"+killed+"機撃墜"}); return; }
        if(!en.length){ wave++; api.add(120*wave); api.sfx.great(); api.fx.shake(3); ebul=[]; build(); }
        api.info("ウェーブ <b>"+wave+"</b>／のこり <b>"+lives+"</b>／撃墜 <b>"+killed+"</b>");
      }
      px(ctx,0,0,W,H,PAL.screen);
      for(let i=0;i<34;i++){
        const sx=(i*97)%W, sy=((i*53)+t*((i%3)+1)*10)%H;
        px(ctx,sx,sy,1.6,1.6,"rgba(233,227,208,"+(.14+(i%4)*.06).toFixed(2)+")");
      }
      const ecol=[PAL.plum,PAL.red,PAL.blue,PAL.teal];
      en.forEach(e=>{
        const col=ecol[e.t%4];
        px(ctx,e.x-e.w/2,e.y-e.h/2,e.w,e.h,col);
        px(ctx,e.x-e.w/2-3,e.y-2,3,7,col);
        px(ctx,e.x+e.w/2,e.y-2,3,7,col);
        px(ctx,e.x-6,e.y-3,4,4,PAL.screen);
        px(ctx,e.x+2,e.y-3,4,4,PAL.screen);
        px(ctx,e.x-4,e.y+4,8,2,PAL.screen);
      });
      bul.forEach(b=>px(ctx,b.x-1.5,b.y-8,3,10,PAL.bone));
      ebul.forEach(b=>px(ctx,b.x-2,b.y-5,4,9,PAL.amber));
      ctx.fillStyle=PAL.olive;
      ctx.beginPath();
      ctx.moveTo(px0,PY-14); ctx.lineTo(px0+13,PY+8); ctx.lineTo(px0+5,PY+8);
      ctx.lineTo(px0,PY+4); ctx.lineTo(px0-5,PY+8); ctx.lineTo(px0-13,PY+8);
      ctx.closePath(); ctx.fill();
      px(ctx,px0-2,PY-6,4,4,PAL.teal);
      px(ctx,px0-2,PY+8,4,4+Math.sin(t*28)*2,PAL.amber);
      px(ctx,0,0,W,24,PAL.dim2);
      for(let i=0;i<lives;i++) px(ctx,10+i*11,9,7,7,PAL.red);
      txt(ctx,"WAVE "+wave,W-10,12,11,PAL.tx3,"right");
      api.fx.draw(ctx);
    });
  }
});
