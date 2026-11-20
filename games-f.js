/* ポケット17 — ゲーム21（建築バトル） */
"use strict";

/* ============================================================
   21 ブロックデュエル
   横から見た1対1。撃つ・跳ぶ・壁を建てる。
   オンラインは席0が計算役。席1は押しているボタンだけを送り、
   盤面は席0が配る（ずれない代わりに、席1は少し遅れる）。
   ============================================================ */
GAMES.push({
  id:"duel", title:"ブロックデュエル", cat:"対戦", vs:true,
  ctrl:"←→ 移動／↑ ジャンプ／A 撃つ／B 建てる",
  about:"壁を建てて守りながら撃ち合う1対1。CPU戦・オンライン対戦",
  kw:"build battle shoot 1v1 kenchiku taisen online",
  hint:"撃たれたらBで壁。↑を押しながらBで足場。壁は3発で壊れます。素材は時間で戻ります。",
  thumb(c,W,H){
    px(c,0,96,W,16,"#2b3326");
    for(let i=0;i<3;i++){ px(c,40,70-i*13,13,12,PAL.teal); px(c,41,71-i*13,11,3,"rgba(255,255,255,.25)"); }
    px(c,108,83,13,13,PAL.amber); px(c,108,70,13,12,PAL.amber);
    px(c,22,82,10,14,PAL.blue); px(c,23,76,8,7,PAL.bone);
    px(c,132,82,10,14,PAL.red);  px(c,133,76,8,7,PAL.bone);
    px(c,60,84,6,3,PAL.bone); px(c,76,84,6,3,PAL.bone);
    px(c,0,0,W,12,"rgba(20,26,19,.8)");
    px(c,6,4,40,5,PAL.blue); px(c,114,4,40,5,PAL.red);
    txt(c,"VS",150,106,9,PAL.amber,"right");
  },
  start(api){
    const CW=24, COLS=32, ROWS=18, W=COLS*CW, H=ROWS*CW;
    const {canvas,ctx}=api.canvas(W,H,460);
    const GROUND=ROWS-2;
    const G=1500, JUMP=-540, SPD=235, BSPD=760, MATMAX=24, MATREG=2.2;
    const SHOOTCD=0.28, BUILDCD=0.16, BLOCKHP=3, DMG=16;

    /* 0=なし 1..3=青の壁(残り耐久) 4..6=赤の壁 7=地面 */
    let grid=new Uint8Array(COLS*ROWS);
    const gi=(x,y)=>y*COLS+x;
    const solid=(x,y)=> (x<0||y<0||x>=COLS||y>=ROWS) ? true : grid[gi(x,y)]!==0;

    let mode="cpu", seat=-1, over=false, ended=false, dc=false, winner=0;
    let A=null, B=null, bullets=[], tick=0, sendT=0, gridT=0, gridDirty=true, myIn={}, lastSeen=-1;

    function mkP(x,face,col){
      return {x:x, y:(GROUND-2)*CW, vx:0, vy:0, w:16, h:30, face:face, hp:100, mat:MATMAX,
              cd:0, bcd:0, onG:false, col:col};
    }
    function reset(){
      grid=new Uint8Array(COLS*ROWS);
      for(let x=0;x<COLS;x++) for(let y=GROUND;y<ROWS;y++) grid[gi(x,y)]=7;
      /* ちょっとした足場 */
      [[7,GROUND-3],[8,GROUND-3],[23,GROUND-3],[24,GROUND-3],[15,GROUND-5],[16,GROUND-5]]
        .forEach(([x,y])=>{ grid[gi(x,y)]=7; });
      A=mkP(3*CW, 1, PAL.blue);
      B=mkP((COLS-4)*CW, -1, PAL.red);
      bullets=[]; over=false; ended=false; winner=0; gridDirty=true;
    }
    reset();

    /* ---- 当たり判定（軸ごとに押し戻す） ---- */
    function hitsWall(p,nx,ny){
      const x0=Math.floor(nx/CW), x1=Math.floor((nx+p.w-1)/CW);
      const y0=Math.floor(ny/CW), y1=Math.floor((ny+p.h-1)/CW);
      for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++) if(solid(x,y)) return true;
      return false;
    }
    function move(p,dt){
      p.vy+=G*dt;
      if(p.vy>900) p.vy=900;
      let nx=p.x+p.vx*dt;
      if(hitsWall(p,nx,p.y)){
        while(!hitsWall(p,p.x+Math.sign(p.vx),p.y) && Math.abs(p.x-nx)>1) p.x+=Math.sign(p.vx);
        p.vx=0;
      } else p.x=nx;
      p.x=Math.max(0,Math.min(W-p.w,p.x));
      let ny=p.y+p.vy*dt;
      p.onG=false;
      if(hitsWall(p,p.x,ny)){
        while(!hitsWall(p,p.x,p.y+Math.sign(p.vy))) p.y+=Math.sign(p.vy);
        if(p.vy>0) p.onG=true;
        p.vy=0;
      } else p.y=ny;
      if(p.y>H){ p.hp=0; }
    }
    function shoot(p,who){
      if(p.cd>0||over) return;
      p.cd=SHOOTCD;
      bullets.push({x:p.x+p.w/2+p.face*12, y:p.y+10, vx:p.face*BSPD, o:who});
      api.sfx.tap();
      api.fx.burst(p.x+p.w/2+p.face*14, p.y+10, {n:3, col:PAL.amber, sp:70, life:.2, g:0});
    }
    function build(p,who,up){
      if(p.bcd>0||over) return;
      const cost=up?1:2;
      if(p.mat<cost) return;
      const base=who===1?1:4;
      let placed=false;
      if(up){
        const gx=Math.floor((p.x+p.w/2)/CW), gy=Math.floor((p.y+p.h+2)/CW);
        if(gy<ROWS && !solid(gx,gy)){ grid[gi(gx,gy)]=base+BLOCKHP-1; placed=true; }
      } else {
        const gx=Math.floor((p.x+p.w/2+p.face*CW*1.1)/CW);
        const gy=Math.floor((p.y+p.h-2)/CW);
        [gy,gy-1].forEach(y=>{
          if(gx>=0&&gx<COLS&&y>=0&&y<ROWS&&!solid(gx,y)){ grid[gi(gx,y)]=base+BLOCKHP-1; placed=true; }
        });
      }
      if(placed){
        p.mat-=cost; p.bcd=BUILDCD; gridDirty=true;
        api.sfx.good();
      }
    }
    function damageBlock(gx,gy){
      const v=grid[gi(gx,gy)];
      if(v===0||v===7) return v===7;
      const base=v<4?1:4;
      const left=(v-base)%3;
      if(left<=0){ grid[gi(gx,gy)]=0; api.fx.burst(gx*CW+CW/2, gy*CW+CW/2, {n:7, col:v<4?PAL.blue:PAL.red, sp:95}); }
      else grid[gi(gx,gy)]=v-1;
      gridDirty=true;
      return true;
    }
    function sim(dt){
      [A,B].forEach(p=>{ if(p.cd>0)p.cd-=dt; if(p.bcd>0)p.bcd-=dt; p.mat=Math.min(MATMAX,p.mat+MATREG*dt); });
      move(A,dt); move(B,dt);
      for(let i=bullets.length-1;i>=0;i--){
        const b=bullets[i];
        let gone=false;
        for(let s=0;s<3 && !gone;s++){
          b.x+=b.vx*dt/3;
          if(b.x<-10||b.x>W+10){ gone=true; break; }
          const gx=Math.floor(b.x/CW), gy=Math.floor(b.y/CW);
          if(solid(gx,gy)){ damageBlock(gx,gy); gone=true; break; }
          const foe=b.o===1?B:A;
          if(b.x>foe.x&&b.x<foe.x+foe.w&&b.y>foe.y&&b.y<foe.y+foe.h){
            foe.hp-=DMG; gone=true;
            api.sfx.bad(); api.fx.shake(4);
            api.fx.burst(b.x,b.y,{n:8,col:PAL.bone,sp:110});
          }
        }
        if(gone) bullets.splice(i,1);
      }
      if(!over && (A.hp<=0||B.hp<=0)){
        over=true;
        winner = A.hp<=0 ? 2 : 1;
        api.fx.shake(9);
      }
    }
    function act(p,who,inp,dt){
      p.vx=0;
      if(inp.l){ p.vx=-SPD; p.face=-1; }
      if(inp.r){ p.vx= SPD; p.face= 1; }
      if(inp.u && p.onG){ p.vy=JUMP; p.onG=false; api.sfx.tap(); }
      if(inp.s) shoot(p,who);
      if(inp.b) build(p,who,!!inp.u);
    }
    /* 画面のBボタンは "KeyB"、キーボードの b は生のまま届く */
    const bDown=()=> Input.held("KeyB") || Input.rawHeld("b");
    const readMe=()=>({
      l:Input.held("ArrowLeft"), r:Input.held("ArrowRight"),
      u:Input.held("ArrowUp"),   s:Input.held("Space"), b:bDown()
    });

    /* ---- CPU ---- */
    let aiT=0, aiJump=0;
    function ai(dt){
      aiT-=dt;
      const dx=A.x-B.x, adx=Math.abs(dx);
      const inp={l:false,r:false,u:false,s:false,b:false};
      if(adx>CW*7) { if(dx<0) inp.l=true; else inp.r=true; }
      else if(adx<CW*3){ if(dx<0) inp.r=true; else inp.l=true; }
      B.face = dx<0 ? -1 : 1;
      if(Math.abs(A.y-B.y)<CW*1.6 && adx<CW*14) inp.s=true;
      if(B.hp<70 && B.mat>6 && aiT<=0){ inp.b=true; aiT=1.1; }
      aiJump-=dt;
      if(B.onG && aiJump<=0 && Math.random()<0.02){ inp.u=true; aiJump=1.4; }
      act(B,2,inp,dt);
    }

    /* ---- 通信 ---- */
    function packGrid(){
      let s="";
      for(let i=0;i<grid.length;i++) s+=String.fromCharCode(48+grid[i]);
      return s;
    }
    function unpackGrid(s){
      if(typeof s!=="string"||s.length!==COLS*ROWS) return;
      for(let i=0;i<grid.length;i++) grid[i]=s.charCodeAt(i)-48;
    }
    const packP=p=>[Math.round(p.x),Math.round(p.y),Math.round(p.hp),p.face,Math.round(p.mat)];
    function applyP(p,a){
      if(!a) return;
      p.x=a[0]; p.y=a[1]; p.hp=a[2]; p.face=a[3]; p.mat=a[4];
    }
    function sendState(){
      api.net.put({st:{
        t:++tick, a:packP(A), b:packP(B),
        k:bullets.slice(0,14).map(b=>[Math.round(b.x),Math.round(b.y),b.o]),
        w:winner
      }});
    }

    /* ---- 描画 ---- */
    function drawP(p,me){
      const x=Math.round(p.x), y=Math.round(p.y);
      px(ctx,x,y+8,p.w,p.h-8,p.col);
      px(ctx,x+2,y,p.w-4,9,PAL.bone);
      px(ctx,x+(p.face>0?p.w-5:1),y+2,3,3,PAL.screen);
      px(ctx,x+(p.face>0?p.w-2:-6),y+12,8,4,PAL.amber);
      if(me){ px(ctx,x+p.w/2-3,y-9,6,4,PAL.olive); }
      const bw=Math.max(0,Math.round(p.w*(p.hp/100)));
      px(ctx,x,y-5,p.w,3,"#2b3326");
      px(ctx,x,y-5,bw,3,p.hp>50?PAL.olive:p.hp>25?PAL.amber:PAL.red);
    }
    function render(){
      px(ctx,0,0,W,H,PAL.screen);
      for(let i=0;i<22;i++) px(ctx,(i*97)%W,(i*53)%(H-80),2,2,"rgba(233,227,208,.1)");
      for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){
        const v=grid[gi(x,y)];
        if(!v) continue;
        const sx=x*CW, sy=y*CW;
        if(v===7){
          px(ctx,sx,sy,CW,CW,"#2b3326");
          px(ctx,sx,sy,CW,3,"#3b452f");
        } else {
          const blue=v<4, left=((v-(blue?1:4))%3)+1;
          const col=blue?PAL.blue:PAL.red;
          px(ctx,sx+1,sy+1,CW-2,CW-2,col);
          px(ctx,sx+2,sy+2,CW-4,3,"rgba(255,255,255,.3)");
          if(left<3){
            ctx.fillStyle="rgba(27,33,25,.45)";
            for(let k=0;k<(3-left)*3;k++) ctx.fillRect(sx+3+((k*7)%(CW-7)), sy+4+((k*5)%(CW-9)), 2, 2);
          }
        }
      }
      bullets.forEach(b=> px(ctx,Math.round(b.x)-3,Math.round(b.y)-2,7,4, b.o===1?PAL.teal:PAL.amber));
      const myP = (mode==="online" && seat===1) ? B : A;
      drawP(A, myP===A); drawP(B, myP===B);
      /* 計器 */
      px(ctx,0,0,W,26,"rgba(20,26,19,.82)");
      const bar=(x,p,col)=>{ px(ctx,x,8,120,10,"#2b3326"); px(ctx,x,8,Math.max(0,Math.round(120*p.hp/100)),10,col); };
      bar(8,A,PAL.blue); bar(W-128,B,PAL.red);
      txt(ctx,"素材 "+Math.floor(A.mat),8,34,11,PAL.tx3);
      txt(ctx,"素材 "+Math.floor(B.mat),W-8,34,11,PAL.tx3,"right");
      if(over){
        px(ctx,0,H/2-34,W,68,"rgba(14,18,13,.85)");
        let label;
        if(mode==="cpu") label = winner===1?"かち":"まけ";
        else if(mode==="duo") label = winner===1?"青のかち":"赤のかち";
        else label = ((seat===0&&winner===1)||(seat===1&&winner===2)) ? "あなたの勝ち" : "あなたの負け";
        txt(ctx,label,W/2,H/2,26,PAL.amber,"center");
      }
      api.fx.draw(ctx);
    }

    function finish(){
      if(ended) return;
      ended=true;
      if(mode==="cpu"){
        const win=winner===1;
        api.over({title:win?"かち":"まけ", score:win?Math.round(A.hp*10):0, save:win,
          value:win?"WIN":"LOSE", msg:win?"残り体力 "+Math.round(A.hp):"CPUにやられました"});
      } else if(mode==="duo"){
        api.over({title:winner===1?"青のかち":"赤のかち", score:0, save:false,
          value:winner===1?"青":"赤", msg:"ふたり対戦の結果"});
      } else {
        const win=(seat===0&&winner===1)||(seat===1&&winner===2);
        api.over({title:win?"あなたの勝ち":"あなたの負け", score:0, save:false,
          value:win?"WIN":"LOSE", msg:"オンライン対戦の結果"});
      }
    }

    api.controls({dpad:"lru", a:{label:"撃つ",code:"Space"}, b:{label:"建てる",code:"KeyB"},
                  legend:"↑ ジャンプ<br>↑+B で足場"});
    api.modes([
      {id:"cpu", label:"CPUとたたかう"},
      {id:"duo", label:"ふたりで（キーボード）"},
      {id:"online", label:"オンライン対戦"}
    ]).then(m=>{
      mode=m; reset();
      if(m==="online"){
        matchUI(api, ()=>{ seat=api.net.seat(); reset(); if(seat===0){ sendState(); api.net.put({gr:packGrid()}); } });
      } else if(m==="duo"){
        Input.alias(false);   /* A/W/D を矢印として扱わない */
        api.info("青=A/D/W・F撃つ・G建てる　赤=←→↑・スペース・B");
      } else api.info("CPUとの1対1");
    });

    api.loop(dt=>{
      if(mode==="online"){
        if(dc){ render(); return; }
        if(seat<0){ render(); return; }
        const list=api.net.list();
        if(list.length<2){
          dc=true; over=true; ended=true;
          lostPeer(api, ()=>{ dc=false; seat=-1; matchUI(api,()=>{ seat=api.net.seat(); reset(); if(seat===0){ sendState(); api.net.put({gr:packGrid()}); } }); });
          return;
        }
        seat=api.net.seat();
        if(seat===0){
          act(A,1,readMe(),dt);
          const g=api.net.at(1);
          const gi2=(g&&g.presence&&g.presence.in)||{};
          act(B,2,gi2,dt);
          if(!over) sim(dt);
          sendT+=dt; gridT+=dt;
          if(sendT>=1/25){ sendT=0; sendState(); }
          if(gridDirty && gridT>=1/8){ gridT=0; gridDirty=false; api.net.put({gr:packGrid()}); }
          if(over) finish();
          api.info("あなた=青　体力 "+Math.max(0,Math.round(A.hp)));
        } else {
          const me=readMe();
          api.net.put({in:{l:me.l,r:me.r,u:me.u,s:me.s,b:me.b}});
          const h=api.net.at(0);
          const st=h&&h.presence&&h.presence.st;
          const gr=h&&h.presence&&h.presence.gr;
          if(gr) unpackGrid(gr);
          if(st && st.t>lastSeen){
            lastSeen=st.t;
            applyP(A,st.a); applyP(B,st.b);
            bullets=(st.k||[]).map(k=>({x:k[0],y:k[1],vx:0,o:k[2]}));
            winner=st.w||0;
            if(winner && !over){ over=true; }
          }
          if(over) finish();
          api.info("あなた=赤　体力 "+Math.max(0,Math.round(B.hp)));
        }
        render(); return;
      }

      /* CPU戦・キーボードふたり */
      if(!over){
        if(mode==="duo"){
          act(A,1,{l:Input.rawHeld("a"), r:Input.rawHeld("d"), u:Input.rawHeld("w"),
                   s:Input.rawHeld("f"), b:Input.rawHeld("g")},dt);
          act(B,2,{l:Input.held("ArrowLeft"), r:Input.held("ArrowRight"), u:Input.held("ArrowUp"),
                   s:Input.held("Space"), b:bDown()},dt);
        } else {
          act(A,1,readMe(),dt);
          ai(dt);
        }
        sim(dt);
        if(mode==="cpu") api.info("体力 <b>"+Math.max(0,Math.round(A.hp))+"</b>　素材 "+Math.floor(A.mat));
      }
      if(over) finish();
      render();
    });
  }
});
