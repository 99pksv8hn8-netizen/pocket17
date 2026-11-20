/* ポケット17 — ゲーム 06-12 */
"use strict";
/* ============================================================
   06 フラップジェット
   ============================================================ */
GAMES.push({
  id:"flap", title:"フラップジェット", cat:"アクション",
  ctrl:"Aボタン／スペース／タップで上昇",
  about:"ゲートのすき間をすりぬけて進む",
  kw:"flappy jet",
  hint:"連打より、一定のリズムで小刻みに押すほうが安定します。",
  thumb(c,W,H){
    for(let i=0;i<18;i++) px(c,(i*37)%W,(i*23)%96,2,2,"rgba(233,227,208,.3)");
    px(c,100,0,22,38,PAL.teal); px(c,100,34,22,5,PAL.olive);
    px(c,100,74,22,30,PAL.teal); px(c,100,74,22,5,PAL.olive);
    px(c,36,52,16,8,PAL.amber); px(c,44,48,8,5,PAL.red); px(c,28,54,8,4,PAL.red);
    px(c,0,104,W,8,PAL.dim);
    txt(c,"ACTION",150,10,9,PAL.dim,"right");
  },
  start(api){
    const {canvas,ctx,W,H}=api.canvas(340,470,400);
    const G=1200, FLAP=-355, R=11, GAP=124, PWID=50, GROUND=30;
    let y=H/2, vy=0, gates=[], dist=0, passed=0, dead=false, started=false, sp=145;
    function addGate(x){ gates.push({x, top:62+Math.random()*(H-GROUND-GAP-128), done:false}); }
    for(let i=0;i<3;i++) addGate(W+110+i*180);
    function flap(){ if(dead) return; started=true; vy=FLAP; api.sfx.tap(); api.fx.burst(42,y+10,{n:3,col:PAL.red,sp:40,g:-20,life:.3}); }
    api.on(canvas,"pointerdown",e=>{ e.preventDefault(); flap(); });
    api.controls({wide:{label:"上昇",code:"Space"}, legend:"押すと上に<br>はなすと落ちる"});
    api.info("通過 <b>0</b>");
    api.loop(dt=>{
      if(!dead&&started){
        if(Input.hit("Space")||Input.hit("ArrowUp")) flap();
        sp=145+passed*3;
        vy+=G*dt; y+=vy*dt;
        gates.forEach(g=>g.x-=sp*dt);
        if(gates.length&&gates[0].x<-PWID-8){ gates.shift(); addGate(gates[gates.length-1].x+180); }
        dist+=sp*dt;
        for(const g of gates){
          if(!g.done&&g.x+PWID<42){ g.done=true; passed++; const pt=10+passed; api.add(pt); api.sfx.good(); api.fx.pop(W/2,46,"+"+pt,PAL.amber); }
          if(42+R>g.x&&42-R<g.x+PWID&&(y-R<g.top||y+R>g.top+GAP)) dead=true;
        }
        if(y+R>H-GROUND||y-R<0) dead=true;
        if(dead){
          api.fx.shake(10); api.fx.burst(42,y,{n:18,col:PAL.red,sp:150});
          api.over({title:"ついらく", msg:"ゲート "+passed+"個とおった"});
          return;
        }
        api.info("通過 <b>"+passed+"</b>");
      } else if(!dead){
        if(Input.hit("Space")||Input.hit("ArrowUp")) flap();
      }
      px(ctx,0,0,W,H,PAL.screen);
      for(let i=0;i<24;i++){
        const sx=((i*131-dist*.2)%(W+20)+W+20)%(W+20)-10;
        px(ctx,sx,(i*67)%(H-GROUND-16)+8,2,2,"rgba(233,227,208,"+(.14+(i%4)*.07).toFixed(2)+")");
      }
      gates.forEach(g=>{
        px(ctx,g.x,0,PWID,g.top,PAL.teal);
        px(ctx,g.x,g.top-9,PWID,9,PAL.olive);
        px(ctx,g.x,g.top+GAP,PWID,H-GROUND-g.top-GAP,PAL.teal);
        px(ctx,g.x,g.top+GAP,PWID,9,PAL.olive);
        px(ctx,g.x+3,0,3,g.top-9,"rgba(255,255,255,.15)");
      });
      px(ctx,0,H-GROUND,W,GROUND,PAL.dim);
      px(ctx,0,H-GROUND,W,2,PAL.olive);
      for(let i=0;i<14;i++){
        const lx=((i*42-dist*1.1)%(W+42)+W+42)%(W+42)-21;
        px(ctx,lx,H-GROUND+8,16,2,"rgba(233,227,208,.12)");
      }
      ctx.save();
      ctx.translate(42,y);
      ctx.rotate(Math.max(-.45,Math.min(.8,vy/600)));
      px(ctx,-13,-6,24,12,PAL.amber);
      px(ctx,-2,-11,12,6,PAL.red);
      px(ctx,7,-3,3,3,PAL.screen);
      if(vy<0) px(ctx,-19,-2,6,5,PAL.red);
      ctx.restore();
      if(!started){
        px(ctx,0,0,W,H,"rgba(14,18,13,.72)");
        txt(ctx,"Aボタンでスタート",W/2,H/2,14,PAL.bone,"center");
      }
      api.fx.draw(ctx);
    });
  }
});

/* ============================================================
   07 エンドレスラン
   ============================================================ */
GAMES.push({
  id:"runner", title:"エンドレスラン", cat:"アクション",
  ctrl:"Aボタン／スペースでジャンプ",
  about:"障害物をとびこえてどこまでも走る",
  kw:"runner jump",
  hint:"長押しで高く跳べます。速くなってきたら早めの踏み切りが安全。",
  fmt:v=>Number(v).toLocaleString()+" m",
  thumb(c,W,H){
    px(c,0,86,W,26,PAL.dim);
    px(c,0,86,W,2,PAL.olive);
    for(let i=0;i<4;i++) px(c,10+i*44,96,20,2,"rgba(233,227,208,.14)");
    px(c,96,62,12,24,PAL.red); px(c,136,70,10,16,PAL.amber);
    px(c,30,62,12,20,PAL.blue); px(c,31,52,10,10,PAL.teal);
    px(c,28,82,5,4,PAL.blue); px(c,38,82,5,4,PAL.blue);
    txt(c,"ACTION",150,10,9,PAL.dim,"right");
  },
  start(api){
    const {canvas,ctx,W,H}=api.canvas(440,250,520);
    const GY=196;
    let px0=52, py=GY, vy=0, onG=true, sp=225, dist=0, obs=[], dead=false, hold=0, t=0, cleared=0, nextIn=1.1;
    function spawn(){
      const tall=Math.random()<.34;
      obs.push({x:W+26, w:tall?14:(Math.random()<.4?30:16), h:tall?40:24, scored:false});
    }
    function jump(){ if(dead) return; if(onG){ vy=-405; onG=false; hold=.16; api.sfx.tap(); api.fx.burst(px0+9,GY+24,{n:4,col:PAL.dim,sp:55,life:.3}); } }
    api.on(canvas,"pointerdown",e=>{ e.preventDefault(); jump(); });
    api.controls({wide:{label:"ジャンプ",code:"Space"}, legend:"長押しで<br>高くとぶ"});
    api.info("きょり <b>0</b> m");
    api.loop(dt=>{
      if(!dead){
        t+=dt;
        if(Input.hit("Space")||Input.hit("ArrowUp")) jump();
        if((Input.held("Space")||Input.held("ArrowUp"))&&hold>0){ vy-=660*dt; hold-=dt; }
        sp=225+Math.min(290,dist/26);
        vy+=1450*dt; py+=vy*dt;
        if(py>=GY){ py=GY; vy=0; onG=true; }
        dist+=sp*dt/9;
        api.score(Math.floor(dist));
        nextIn-=dt;
        if(nextIn<=0){ spawn(); nextIn=Math.max(.52,1.25-dist/2600)+Math.random()*.55; }
        obs.forEach(o=>o.x-=sp*dt);
        obs=obs.filter(o=>{
          if(o.x+o.w<-18) return false;
          if(!o.scored&&o.x+o.w<px0){ o.scored=true; cleared++; api.sfx.good(); }
          return true;
        });
        for(const o of obs) if(px0+18>o.x&&px0<o.x+o.w&&py>GY-o.h+4) dead=true;
        if(dead){
          api.fx.shake(10); api.fx.burst(px0+9,py+10,{n:16,col:PAL.red,sp:140});
          api.over({title:"クラッシュ", score:Math.floor(dist), value:Math.floor(dist)+" m", msg:"障害物 "+cleared+"個こえた"});
          return;
        }
        api.info("きょり <b>"+Math.floor(dist)+"</b> m／こえた数 <b>"+cleared+"</b>");
      }
      px(ctx,0,0,W,H,PAL.screen);
      for(let i=0;i<6;i++){
        const hx=((i*176-dist*1.9)%(W+240)+W+240)%(W+240)-120;
        ctx.fillStyle="rgba(147,160,92,.12)";
        ctx.beginPath(); ctx.moveTo(hx-72,GY+24); ctx.lineTo(hx,GY-48-((i*37)%36)); ctx.lineTo(hx+72,GY+24); ctx.closePath(); ctx.fill();
      }
      px(ctx,0,GY+24,W,H-GY-24,PAL.dim);
      px(ctx,0,GY+24,W,2,PAL.olive);
      for(let i=0;i<20;i++){
        const lx=((i*54-dist*8)%(W+54)+W+54)%(W+54)-27;
        px(ctx,lx,GY+34,22,2,"rgba(233,227,208,.12)");
      }
      obs.forEach(o=>{
        px(ctx,o.x,GY+24-o.h,o.w,o.h,o.h>34?PAL.red:PAL.amber);
        px(ctx,o.x+2,GY+26-o.h,o.w-4,3,"rgba(255,255,255,.26)");
      });
      const legs=onG?Math.sin(t*20)*5:3;
      px(ctx,px0,py-2,18,22,PAL.blue);
      px(ctx,px0+2,py-13,14,12,PAL.teal);
      px(ctx,px0+10,py-9,3,3,PAL.screen);
      px(ctx,px0+2-legs,py+20,5,4,PAL.blue);
      px(ctx,px0+11+legs,py+20,5,4,PAL.blue);
      api.fx.draw(ctx);
    });
  }
});

/* ============================================================
   08 もぐらたたき
   ============================================================ */
GAMES.push({
  id:"mole", title:"もぐらたたき", cat:"反射",
  ctrl:"出てきた穴をタップ／クリック",
  about:"30秒で何匹たたけるか。連続ヒットで倍率アップ",
  kw:"mole mogura whack",
  hint:"続けて当てるとコンボ倍率が上がります。空ぶりでコンボは切れます。",
  thumb(c,W,H){
    for(let i=0;i<9;i++){
      const x=16+(i%3)*44, y=10+((i/3)|0)*32;
      px(c,x,y+18,38,10,PAL.dim);
      if(i===1||i===5){
        px(c,x+9,y+4,20,16,PAL.amber);
        px(c,x+13,y+9,3,3,PAL.screen); px(c,x+22,y+9,3,3,PAL.screen);
        px(c,x+17,y+14,4,3,PAL.red);
      }
    }
    txt(c,"REFLEX",150,10,9,PAL.dim,"right");
  },
  start(api){
    const {canvas,ctx,W,H}=api.canvas(330,330,360);
    const CS=110;
    let up=new Array(9).fill(0), left=30, done=false, hits=0, combo=0, best2=0, bump=new Array(9).fill(0);
    function mult(){ return 1+Math.floor(combo/3); }
    api.on(canvas,"pointerdown",e=>{
      if(done) return;
      e.preventDefault();
      const p=api.pos(canvas,e);
      const i=Math.floor(p.y/CS)*3+Math.floor(p.x/CS);
      if(i<0||i>8) return;
      if(up[i]>0){
        up[i]=0; hits++; combo++; best2=Math.max(best2,combo);
        const pt=10*mult(); api.add(pt);
        const cx=(i%3)*CS+CS/2, cy=((i/3)|0)*CS+CS/2;
        api.fx.burst(cx,cy,{n:9,col:PAL.amber,sp:105});
        api.fx.pop(cx,cy-18,"+"+pt,PAL.amber);
        api.fx.shake(2.6); api.sfx.good();
      } else {
        combo=0; api.sfx.bad(); api.fx.shake(1.4);
      }
    });
    api.controls(null);
    api.every(620,()=>{
      if(done) return;
      const free=[];
      for(let i=0;i<9;i++) if(!up[i]) free.push(i);
      if(!free.length) return;
      const n=left>18?1:(Math.random()<.45?2:1);
      for(let k=0;k<n&&free.length;k++){
        const idx=free.splice(Math.floor(Math.random()*free.length),1)[0];
        up[idx]=left>12?1000:800; bump[idx]=1;
      }
    });
    api.loop(dt=>{
      if(!done){
        left-=dt;
        for(let i=0;i<9;i++){
          if(up[i]>0){ up[i]-=dt*1000; if(up[i]<=0) up[i]=0; }
          if(bump[i]>0) bump[i]=Math.max(0,bump[i]-dt*5);
        }
        if(left<=0){
          done=true; left=0;
          api.over({title:"タイムアップ", msg:hits+"匹たたいた／最大コンボ "+best2});
          return;
        }
        api.info("のこり <b>"+left.toFixed(1)+"</b>秒／コンボ <b>×"+mult()+"</b>／ヒット <b>"+hits+"</b>");
      }
      px(ctx,0,0,W,H,PAL.screen);
      for(let i=0;i<9;i++){
        const gx=(i%3)*CS, gy=((i/3)|0)*CS;
        px(ctx,gx+10,gy+66,CS-20,26,PAL.dim2);
        px(ctx,gx+14,gy+70,CS-28,18,"#141a13");
        if(up[i]>0){
          const rise=bump[i]>0?(1-bump[i])*1:1;
          const oy=gy+70-34*rise;
          const panic=up[i]<380;
          px(ctx,gx+34,oy,42,36,PAL.amber);
          px(ctx,gx+30,oy+10,8,20,PAL.amber);
          px(ctx,gx+72,oy+10,8,20,PAL.amber);
          px(ctx,gx+44,oy+12,6,6,PAL.screen);
          px(ctx,gx+60,oy+12,6,6,PAL.screen);
          px(ctx,gx+51,oy+22,8,5,PAL.red);
          if(panic){ px(ctx,gx+40,oy-6,4,5,PAL.bone); px(ctx,gx+66,oy-6,4,5,PAL.bone); }
        }
      }
      px(ctx,0,0,W*(left/30),3,PAL.olive);
      api.fx.draw(ctx);
    });
  }
});

/* ============================================================
   09 メモリーマッチ
   ============================================================ */
GAMES.push({
  id:"memory", title:"メモリーマッチ", cat:"パズル",
  ctrl:"2枚めくって同じ絵をそろえる",
  about:"16枚から8組のペアをさがす神経衰弱",
  kw:"memory pair shinkeisuijaku",
  hint:"めくった位置を覚えておくこと。手数が少ないほど高得点。",
  thumb(c,W,H){
    const cols=[PAL.red,PAL.amber,PAL.olive,PAL.teal];
    for(let y=0;y<3;y++) for(let x=0;x<4;x++){
      const open=(x+y)%3===0;
      px(c,32+x*24,8+y*32,21,28, open?"rgba(147,160,92,.12)":PAL.dim);
      if(open){
        const col=cols[(x+y)%4];
        if((x+y)%2===0) px(c,32+x*24+7,8+y*32+10,8,8,col);
        else { px(c,32+x*24+6,8+y*32+13,10,3,col); px(c,32+x*24+10,8+y*32+9,3,10,col); }
      }
    }
    txt(c,"PUZZLE",150,10,9,PAL.dim,"right");
  },
  start(api){
    const COLS=[PAL.red,PAL.amber,PAL.olive,PAL.teal,PAL.blue,PAL.plum,PAL.bone,"#d9c27a"];
    const SH=[
      c=>'<rect x="4" y="4" width="12" height="12" fill="'+c+'"/>',
      c=>'<circle cx="10" cy="10" r="6.4" fill="'+c+'"/>',
      c=>'<path d="M10 3 L17 17 H3 Z" fill="'+c+'"/>',
      c=>'<path d="M10 2 L18 10 L10 18 L2 10 Z" fill="'+c+'"/>',
      c=>'<rect x="8" y="3" width="4" height="14" fill="'+c+'"/><rect x="3" y="8" width="14" height="4" fill="'+c+'"/>',
      c=>'<circle cx="10" cy="10" r="6.4" fill="none" stroke="'+c+'" stroke-width="3.4"/>',
      c=>'<rect x="3" y="4" width="14" height="3.6" fill="'+c+'"/><rect x="3" y="12.4" width="14" height="3.6" fill="'+c+'"/>',
      c=>'<path d="M10 2 L12.4 7.6 L18 10 L12.4 12.4 L10 18 L7.6 12.4 L2 10 L7.6 7.6 Z" fill="'+c+'"/>'
    ];
    const face=i=>'<svg viewBox="0 0 20 20" width="30" height="30" aria-hidden="true">'+SH[i](COLS[i])+'</svg>';
    const bd=document.createElement("div");
    bd.style.cssText="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;width:100%;max-width:320px;aspect-ratio:1/1";
    api.host.appendChild(bd);
    let deck=[], matched=0, moves=0, lock=false, t0=performance.now(), done=false, flipped=[];
    for(let i=0;i<8;i++){ deck.push(i); deck.push(i); }
    deck.sort(()=>Math.random()-.5);
    const state=deck.map(()=>0);
    function paint(){
      bd.innerHTML="";
      deck.forEach((d,i)=>{
        const c=document.createElement("div");
        c.className="mcard"; c.dataset.i=i;
        const open=state[i]>0;
        c.style.cssText="display:grid;place-items:center;aspect-ratio:3/4;border-radius:3px;cursor:pointer;"+
          "background:"+(state[i]===2?"rgba(147,160,92,.1)":open?"#2f3828":"#2b3326")+
          ";border:1px solid "+(state[i]===2?"rgba(147,160,92,.3)":"#39412f")+
          ";opacity:"+(state[i]===2?.6:1);
        c.innerHTML = open ? face(d) : '<svg viewBox="0 0 20 20" width="30" height="30" aria-hidden="true"><rect x="5" y="5" width="10" height="10" fill="none" stroke="'+PAL.dim+'" stroke-width="2"/></svg>';
        bd.appendChild(c);
      });
      const sec=((performance.now()-t0)/1000)|0;
      api.info("手数 <b>"+moves+"</b>／"+sec+"秒／そろった <b>"+matched+"/8</b>");
    }
    api.on(bd,"pointerdown",e=>{
      if(lock||done) return;
      const t=e.target.closest(".mcard"); if(!t) return;
      const i=+t.dataset.i;
      if(state[i]!==0) return;
      state[i]=1; flipped.push(i); api.sfx.tap(); paint();
      if(flipped.length===2){
        moves++; lock=true;
        const [a,b]=flipped;
        if(deck[a]===deck[b]){
          state[a]=state[b]=2; matched++; flipped=[]; lock=false;
          api.sfx.good(); paint();
          if(matched===8){
            done=true;
            const sec=(performance.now()-t0)/1000;
            const sc=Math.max(200,Math.round(2600-moves*55-sec*14));
            api.score(sc); api.sfx.great();
            api.over({title:"ぜんぶそろった", score:sc, msg:moves+"手／"+sec.toFixed(1)+"秒"});
          }
        } else {
          api.after(700,()=>{ state[a]=state[b]=0; flipped=[]; lock=false; paint(); });
          paint();
        }
      }
    });
    api.controls(null);
    paint();
    api.every(1000,()=>{ if(!done) paint(); });
  }
});

/* ============================================================
   10 リアクション
   ============================================================ */
GAMES.push({
  id:"react", title:"リアクション", cat:"反射", lower:true,
  ctrl:"緑になった瞬間に押す",
  about:"5回の平均反応速度をミリ秒で計測",
  kw:"reaction reflex ms",
  hint:"フライング（緑になる前の入力）は1回につき+250msのペナルティです。",
  fmt:v=>v+" ms",
  thumb(c,W,H){
    px(c,20,16,120,60,PAL.olive);
    txt(c,"NOW",80,46,20,PAL.screen,"center");
    txt(c,"238 ms",80,94,13,PAL.amber,"center");
    txt(c,"REFLEX",150,10,9,PAL.dim,"right");
  },
  start(api){
    const box=document.createElement("div");
    box.style.cssText="width:100%;max-width:340px;aspect-ratio:4/3;border-radius:4px;display:grid;place-items:center;"+
      "background:#2b3326;border:1px solid #39412f;cursor:pointer;user-select:none;-webkit-user-select:none;text-align:center;padding:16px";
    const label=document.createElement("div");
    label.style.cssText="font-family:"+FONT+";font-size:16px;line-height:1.7;color:"+PAL.bone;
    box.appendChild(label); api.host.appendChild(box);
    const N=5;
    let phase="idle", startAt=0, results=[], penalty=0, done=false;
    const small=s=>'<span style="font-size:11px;color:'+PAL.tx3+'">'+s+'</span>';
    function wait(){
      phase="wait";
      box.style.background="#2b3326"; box.style.borderColor="#39412f";
      label.innerHTML="まて…<br>"+small("緑になったら押す");
      api.after(900+Math.random()*2400,()=>{
        if(phase!=="wait"||done) return;
        phase="go"; startAt=performance.now();
        box.style.background=PAL.olive; box.style.borderColor=PAL.olive;
        label.innerHTML='<span style="color:'+PAL.screen+'">いま！</span>';
      });
    }
    function hit(){
      if(done) return;
      if(phase==="idle"){ wait(); return; }
      if(phase==="wait"){
        penalty+=250; api.sfx.bad(); phase="idle";
        box.style.background="rgba(200,85,64,.22)"; box.style.borderColor=PAL.red;
        label.innerHTML="フライング<br>"+small("+250ms・押して再開");
        return;
      }
      const ms=Math.round(performance.now()-startAt);
      results.push(ms); api.score(ms); api.sfx.good();
      phase="idle";
      api.info("試行 <b>"+results.length+"/"+N+"</b>／直近 "+ms+" ms");
      if(results.length>=N){
        done=true;
        const avg=Math.round(results.reduce((a,b)=>a+b,0)/N+penalty/N);
        const rank=avg<230?"かなり速い":avg<300?"平均より上":avg<380?"ふつう":"ゆったり";
        api.score(avg);
        api.over({title:"けいそく完了", score:avg, value:avg+" ms", lower:true,
          msg:"平均 "+avg+" ms（"+rank+"）<br>"+results.join(" / ")+" ms"+(penalty?"<br>ペナルティ +"+penalty+"ms":"")});
        return;
      }
      box.style.background="#2b3326"; box.style.borderColor="#39412f";
      label.innerHTML=ms+" ms<br>"+small("押して次へ（のこり"+(N-results.length)+"回）");
    }
    api.on(box,"pointerdown",e=>{ e.preventDefault(); hit(); });
    api.controls({wide:{label:"押す",fn:()=>hit()}});
    api.loop(()=>{ if(Input.hit("Space")) hit(); });
    label.innerHTML="押してスタート<br>"+small("全5回の平均をはかります");
    api.info("試行 <b>0/"+N+"</b>");
  }
});

/* ============================================================
   11 ターゲットシュート
   ============================================================ */
GAMES.push({
  id:"aim", title:"ターゲットシュート", cat:"反射",
  ctrl:"出てきた的をタップ／クリック",
  about:"30秒で的を撃つ。小さくなる前に当てるほど高得点",
  kw:"aim target shoot",
  hint:"的は時間が経つと縮んで点数が下がります。外すと−20点。",
  thumb(c,W,H){
    for(let i=0;i<=5;i++){ px(c,i*32,0,1,H,PAL.dim2); px(c,0,i*22,W,1,PAL.dim2); }
    const cx=96,cy=52;
    c.fillStyle=PAL.blue; c.beginPath(); c.arc(cx,cy,26,0,7); c.fill();
    c.fillStyle=PAL.screen; c.beginPath(); c.arc(cx,cy,16,0,7); c.fill();
    c.fillStyle=PAL.red; c.beginPath(); c.arc(cx,cy,7,0,7); c.fill();
    px(c,20,48,24,2,PAL.olive); px(c,31,37,2,24,PAL.olive);
    txt(c,"REFLEX",150,104,9,PAL.dim,"right");
  },
  start(api){
    const {canvas,ctx,W,H}=api.canvas(360,360,400);
    let left=30, done=false, tg=null, hits=0, shots=0, life=1.4;
    function spawn(){
      const r=32;
      tg={x:r+10+Math.random()*(W-2*r-20), y:r+10+Math.random()*(H-2*r-20), r0:r, born:performance.now()};
      life=Math.max(.75,1.5-(30-left)*.022);
    }
    spawn();
    function radius(){
      if(!tg) return 0;
      const age=(performance.now()-tg.born)/1000;
      return Math.max(9, tg.r0*(1-age/life*.62));
    }
    api.on(canvas,"pointerdown",e=>{
      if(done) return;
      e.preventDefault();
      const p=api.pos(canvas,e); shots++;
      if(tg){
        const r=radius();
        if(Math.hypot(p.x-tg.x,p.y-tg.y)<=r+3){
          hits++;
          const pt=Math.round(20+(r/tg.r0)*60);
          api.add(pt); api.sfx.good();
          api.fx.burst(tg.x,tg.y,{n:11,col:PAL.blue,sp:120});
          api.fx.pop(tg.x,tg.y-r-6,"+"+pt,PAL.amber);
          spawn(); return;
        }
      }
      api.add(-20); api.sfx.bad(); api.fx.shake(2.4);
      api.fx.burst(p.x,p.y,{n:4,col:PAL.dim,sp:50,life:.3});
    });
    api.controls(null);
    api.info("のこり <b>30.0</b>秒");
    api.loop(dt=>{
      if(!done){
        left-=dt;
        if(left<=0){
          done=true;
          const acc=shots?Math.round(hits/shots*100):0;
          api.over({title:"タイムアップ", msg:hits+"ヒット／"+shots+"発（命中率 "+acc+"%）"});
          return;
        }
        if(tg&&(performance.now()-tg.born)/1000>life){ api.sfx.bad(); api.add(-10); spawn(); }
        const acc=shots?Math.round(hits/shots*100):100;
        api.info("のこり <b>"+left.toFixed(1)+"</b>秒／命中率 <b>"+acc+"%</b>／ヒット <b>"+hits+"</b>");
      }
      px(ctx,0,0,W,H,PAL.screen);
      for(let i=0;i<=8;i++){ px(ctx,i*W/8,0,1,H,PAL.dim2); px(ctx,0,i*H/8,W,1,PAL.dim2); }
      if(tg&&!done){
        const r=radius();
        ctx.fillStyle=PAL.blue; ctx.beginPath(); ctx.arc(tg.x,tg.y,r,0,7); ctx.fill();
        ctx.fillStyle=PAL.screen; ctx.beginPath(); ctx.arc(tg.x,tg.y,r*.62,0,7); ctx.fill();
        ctx.fillStyle=PAL.red; ctx.beginPath(); ctx.arc(tg.x,tg.y,r*.3,0,7); ctx.fill();
      }
      px(ctx,0,0,W*(left/30),3,PAL.olive);
      api.fx.draw(ctx);
    });
  }
});

/* ============================================================
   12 スライドパズル
   ============================================================ */
GAMES.push({
  id:"slide", title:"スライドパズル", cat:"パズル",
  ctrl:"タップ／十字キーで動かす",
  about:"1〜15を順番に並べかえる15パズル",
  kw:"slide puzzle 15",
  hint:"上の段から順に確定させていくのが定石。手数が少ないほど高得点。",
  thumb(c,W,H){
    const v=[1,2,3,4,5,6,7,8,9,10,0,12,13,14,11,15];
    for(let i=0;i<16;i++){
      const x=32+(i%4)*24, y=8+((i/4)|0)*24, n=v[i];
      if(n){ px(c,x,y,22,22,(n===i+1)?"rgba(79,160,140,.3)":PAL.dim); txt(c,String(n),x+11,y+12,11,n===i+1?PAL.teal:PAL.bone,"center"); }
      else px(c,x,y,22,22,PAL.dim2);
    }
  },
  start(api){
    const bd=document.createElement("div");
    bd.style.cssText="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;width:100%;max-width:320px;aspect-ratio:1/1";
    api.host.appendChild(bd);
    let g=[...Array(15).keys()].map(i=>i+1).concat([0]);
    let moves=0, t0=0, done=false, started=false;
    const idx=v=>g.indexOf(v);
    function legal(i){
      const b=idx(0);
      return Math.abs(b%4-i%4)+Math.abs(((b/4)|0)-((i/4)|0))===1;
    }
    function swap(i){ const b=idx(0); g[b]=g[i]; g[i]=0; }
    function solved(){ for(let i=0;i<15;i++) if(g[i]!==i+1) return false; return true; }
    function shuffle(){
      for(let k=0;k<400;k++){
        const opts=[];
        for(let i=0;i<16;i++) if(legal(i)) opts.push(i);
        swap(opts[Math.floor(Math.random()*opts.length)]);
      }
      if(solved()) shuffle();
    }
    function paint(){
      bd.innerHTML="";
      g.forEach((v,i)=>{
        const d=document.createElement("div");
        d.className="sq"; d.dataset.i=i;
        const right=v!==0&&v===i+1;
        d.style.cssText="display:grid;place-items:center;aspect-ratio:1/1;border-radius:3px;font-family:"+FONT+
          ";font-size:21px;"+(v===0
            ? "background:rgba(0,0,0,.3);border:1px dashed #39412f;cursor:default"
            : "background:"+(right?"rgba(79,160,140,.22)":"#2b3326")+";border:1px solid "+(right?PAL.teal:"#39412f")+
              ";color:"+(right?PAL.teal:PAL.bone)+";cursor:pointer");
        d.textContent=v||"";
        bd.appendChild(d);
      });
      api.info("手数 <b>"+moves+"</b>／"+(started?(((performance.now()-t0)/1000)|0)+"秒":"0秒"));
    }
    function doMove(i){
      if(done||!legal(i)) return;
      if(!started){ started=true; t0=performance.now(); }
      swap(i); moves++; api.sfx.tap(); paint();
      if(solved()){
        done=true;
        const sec=(performance.now()-t0)/1000;
        const sc=Math.max(200,Math.round(4000-moves*18-sec*10));
        api.score(sc); api.sfx.great();
        api.over({title:"かんせい", score:sc, msg:moves+"手／"+sec.toFixed(1)+"秒"});
      }
    }
    api.on(bd,"pointerdown",e=>{
      const t=e.target.closest(".sq"); if(!t) return;
      doMove(+t.dataset.i);
    });
    function kmove(dx,dy){
      const b=idx(0), nx=b%4+dx, ny=((b/4)|0)+dy;
      if(nx<0||ny<0||nx>3||ny>3) return;
      doMove(ny*4+nx);
    }
    api.controls({dpad:true, legend:"十字キーの向きに<br>タイルをおす"});
    api.loop(()=>{
      if(Input.hit("ArrowLeft")) kmove(1,0);
      if(Input.hit("ArrowRight")) kmove(-1,0);
      if(Input.hit("ArrowUp")) kmove(0,1);
      if(Input.hit("ArrowDown")) kmove(0,-1);
    });
    shuffle(); paint();
    api.every(1000,()=>{ if(!done&&started) paint(); });
  }
});
