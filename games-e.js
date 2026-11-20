/* ポケット17 — ゲーム 19-20（レース／冒険） */
"use strict";

/* ============================================================
   19 ハイウェイ17
   奥行きのある道を、手前から奥へ帯を重ねて描く方式で立体に見せている。
   ============================================================ */
GAMES.push({
  id:"highway", title:"ハイウェイ17", cat:"レース", lower:true,
  ctrl:"←→ でハンドル／B でブレーキ",
  about:"カーブと坂のあるコースを3周するタイムアタック",
  kw:"race drive racing 3d time attack course",
  hint:"曲がっている間は外に振られます。早めに内側へ寄せるのがコツ。草地に出ると減速します。",
  fmt:v=>(v/1000).toFixed(2)+"秒",
  thumb(c,W,H){
    px(c,0,0,W,46,"#232a1e");
    c.fillStyle="#3a4036";
    c.beginPath(); c.moveTo(66,46); c.lineTo(94,46); c.lineTo(150,112); c.lineTo(10,112); c.closePath(); c.fill();
    c.fillStyle=PAL.bone;
    c.beginPath(); c.moveTo(78,46); c.lineTo(82,46); c.lineTo(88,74); c.lineTo(72,74); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(68,86); c.lineTo(92,86); c.lineTo(98,112); c.lineTo(62,112); c.closePath(); c.fill();
    px(c,0,46,66,4,PAL.red); px(c,94,46,66,4,PAL.red);
    px(c,62,92,36,16,PAL.blue); px(c,68,86,24,8,PAL.teal);
    px(c,58,104,10,8,PAL.screen); px(c,92,104,10,8,PAL.screen);
    txt(c,"RACE",150,10,9,"#5a6450","right");
  },
  start(api){
    const {canvas,ctx,W,H}=api.canvas(380,232,440);
    const SEGL=180, ROADW=1500, DRAW=140, CAMH=950, LAPS=3;
    const camD=1/Math.tan((72/2)*Math.PI/180);
    const MAXS=SEGL*58, ACC=MAXS/4.2, BRK=-MAXS/1.6, DEC=-MAXS/7, OFF=-MAXS/2.4, OFFMAX=MAXS/3.6;

    let segs=[], cars=[], pz=0, speed=0, pxx=0, lap=1, t=0, lapT=0, best=0, done=false, started=false, countdown=3;

    const lastY=()=> segs.length ? segs[segs.length-1].p2.world.y : 0;
    function addSeg(curve,y){
      const n=segs.length;
      segs.push({i:n, curve:curve, dark:Math.floor(n/3)%2===0,
        p1:{world:{y:lastY(), z:n*SEGL}, camera:{}, screen:{}},
        p2:{world:{y:y, z:(n+1)*SEGL}, camera:{}, screen:{}}});
    }
    const eIn=(a,b,p)=>a+(b-a)*p*p;
    const eInOut=(a,b,p)=>a+(b-a)*(-Math.cos(p*Math.PI)/2+.5);
    function addRoad(enter,hold,leave,curve,dy){
      const y0=lastY(), y1=y0+dy*SEGL, tot=enter+hold+leave;
      for(let n=0;n<enter;n++) addSeg(eIn(0,curve,n/enter), eInOut(y0,y1,n/tot));
      for(let n=0;n<hold;n++)  addSeg(curve,               eInOut(y0,y1,(enter+n)/tot));
      for(let n=0;n<leave;n++) addSeg(eInOut(curve,0,n/leave), eInOut(y0,y1,(enter+hold+n)/tot));
    }
    function build(){
      segs=[];
      addRoad(40,46,40,0,0);
      addRoad(28,38,28,3.2,28);
      addRoad(28,48,28,-4,-18);
      addRoad(24,28,24,0,46);
      addRoad(34,56,34,5,0);
      addRoad(28,38,28,-3,-38);
      addRoad(40,56,40,0,0);
      addRoad(24,38,24,-5.2,26);
      addRoad(28,48,28,2.4,-18);
      addRoad(46,56,46,0,0);
    }
    build();
    const trackLen=segs.length*SEGL;
    const segAt=z=>segs[Math.floor((((z%trackLen)+trackLen)%trackLen)/SEGL)%segs.length];

    const COL=["#c85540","#e3a73c","#4fa08c","#9b7cb0","#5283bd"];
    for(let i=0;i<14;i++){
      cars.push({z:Math.random()*trackLen, off:(Math.random()*1.7-.85),
                 sp:MAXS*(0.32+Math.random()*0.22), col:COL[i%COL.length]});
    }

    function project(p,cx,cy,cz){
      p.camera.x=(p.world.x||0)-cx;
      p.camera.y=(p.world.y||0)-cy;
      p.camera.z=(p.world.z||0)-cz;
      p.screen.scale=camD/p.camera.z;
      p.screen.x=Math.round(W/2 + p.screen.scale*p.camera.x*W/2);
      p.screen.y=Math.round(H/2 - p.screen.scale*p.camera.y*H/2);
      p.screen.w=Math.round(p.screen.scale*ROADW*W/2);
    }
    function band(x1,y1,w1,x2,y2,w2,col){
      ctx.fillStyle=col;
      ctx.beginPath();
      ctx.moveTo(x1-w1,y1); ctx.lineTo(x2-w2,y2); ctx.lineTo(x2+w2,y2); ctx.lineTo(x1+w1,y1);
      ctx.closePath(); ctx.fill();
    }
    function carSprite(x,y,w,col,me){
      const h=w*0.62;
      px(ctx, x-w/2, y-h, w, h*0.62, col);
      px(ctx, x-w*0.34, y-h-h*0.34, w*0.68, h*0.4, me?PAL.teal:"rgba(0,0,0,.45)");
      px(ctx, x-w/2-w*0.08, y-h*0.34, w*0.2, h*0.34, PAL.screen);
      px(ctx, x+w/2-w*0.12, y-h*0.34, w*0.2, h*0.34, PAL.screen);
      if(me) px(ctx, x-w*0.3, y-h*0.08, w*0.6, h*0.14, PAL.red);
    }

    function render(){
      const base=Math.floor(pz/SEGL)%segs.length;
      const pct=(pz%SEGL)/SEGL;
      const pSeg=segs[base];
      const pY=pSeg.p1.world.y+(pSeg.p2.world.y-pSeg.p1.world.y)*pct;
      let x=0, dx=-(pSeg.curve*pct), maxy=H;

      /* 空と遠景 */
      px(ctx,0,0,W,H,"#1a2017");
      const sky=ctx.createLinearGradient(0,0,0,H*0.6);
      sky.addColorStop(0,"#222b1d"); sky.addColorStop(1,"#39402c");
      ctx.fillStyle=sky; ctx.fillRect(0,0,W,H*0.6);
      const hx=((-pz*0.00018+ 5)%1+1)%1;
      for(let i=0;i<7;i++){
        const mx=((i/7 - hx)%1+1)%1*W*1.4-W*0.2;
        ctx.fillStyle="rgba(147,160,92,.14)";
        ctx.beginPath(); ctx.moveTo(mx-54,H*0.5); ctx.lineTo(mx,H*0.5-30-(i%3)*14); ctx.lineTo(mx+54,H*0.5); ctx.closePath(); ctx.fill();
      }

      const seen=[];
      for(let n=0;n<DRAW;n++){
        const idx=(base+n)%segs.length;
        const s=segs[idx];
        const looped=(base+n)>=segs.length;
        const cz=pz-(looped?trackLen:0);
        project(s.p1,(pxx*ROADW)-x,      CAMH+pY, cz);
        project(s.p2,(pxx*ROADW)-x-dx,   CAMH+pY, cz);
        x+=dx; dx+=s.curve;
        s.clip=maxy;
        if(s.p1.camera.z<=camD || s.p2.screen.y>=s.p1.screen.y || s.p2.screen.y>=maxy) continue;
        const a=s.p1.screen, b=s.p2.screen;
        ctx.fillStyle=s.dark?"#2b3326":"#242b1f";
        ctx.fillRect(0,b.y,W,a.y-b.y);
        const rw1=a.w/6, rw2=b.w/6;
        band(a.x,a.y,a.w+rw1,b.x,b.y,b.w+rw2, s.dark?PAL.bone:PAL.red);
        band(a.x,a.y,a.w,b.x,b.y,b.w, s.dark?"#3c4238":"#353b31");
        if(s.dark){
          const lw1=a.w/32, lw2=b.w/32;
          [-1/3,1/3].forEach(f=>{
            band(a.x+a.w*f,a.y,lw1,b.x+b.w*f,b.y,lw2,"rgba(233,227,208,.5)");
          });
        }
        seen.push(s);
        maxy=b.y;
      }
      /* 車は奥から手前へ */
      for(let k=seen.length-1;k>=0;k--){
        const s=seen[k];
        cars.forEach(c=>{
          if(segAt(c.z)!==s) return;
          const p=(((c.z%trackLen)+trackLen)%trackLen)%SEGL/SEGL;
          const sx=s.p1.screen.x+(s.p2.screen.x-s.p1.screen.x)*p;
          const sy=s.p1.screen.y+(s.p2.screen.y-s.p1.screen.y)*p;
          const sw=s.p1.screen.w+(s.p2.screen.w-s.p1.screen.w)*p;
          if(sy>s.clip) return;
          carSprite(sx+sw*c.off, sy, Math.max(4,sw*0.42), c.col, false);
        });
      }
      /* 自車 */
      const bump=Math.abs(pxx)>1 ? Math.sin(t*40)*2 : 0;
      carSprite(W/2+pxx*0 , H-14+bump, 52, PAL.olive, true);

      /* 計器 */
      px(ctx,0,0,W,24,"rgba(20,26,19,.8)");
      txt(ctx,"LAP "+Math.min(lap,LAPS)+"/"+LAPS, 9, 12, 12, PAL.bone);
      txt(ctx, (lapT/1000).toFixed(2)+"秒", W/2, 12, 12, PAL.amber, "center");
      txt(ctx, Math.round(speed/SEGL*3.2)+" km/h", W-9, 12, 12, PAL.olive, "right");
      if(!started){
        px(ctx,0,0,W,H,"rgba(14,18,13,.72)");
        txt(ctx, countdown>0?String(Math.ceil(countdown)):"GO!", W/2, H/2, 40, countdown>0?PAL.bone:PAL.olive, "center");
      }
      api.fx.draw(ctx);
    }

    api.controls({dpad:"lr", b:{label:"ブレーキ",code:"ArrowDown"}, legend:"←→ でハンドル<br>アクセルは自動"});
    api.on(canvas,"pointerdown",e=>{
      const p=api.pos(canvas,e);
      Input.vdown(p.x<W/2?"ArrowLeft":"ArrowRight");
    });
    api.on(canvas,"pointerup",()=>{ Input.vup("ArrowLeft"); Input.vup("ArrowRight"); });
    api.on(canvas,"pointercancel",()=>{ Input.vup("ArrowLeft"); Input.vup("ArrowRight"); });
    api.info("スタートまで…");

    api.loop(dt=>{
      if(done){ render(); return; }
      t+=dt;
      if(!started){
        countdown-=dt;
        if(countdown<=-0.6){ started=true; api.sfx.great(); }
        else if(Math.floor(countdown+dt)!==Math.floor(countdown) && countdown>0) api.sfx.tap();
        render(); return;
      }
      lapT+=dt*1000;
      const seg=segAt(pz);
      const sr=speed/MAXS;
      if(Input.held("ArrowLeft"))  pxx-=1.7*dt*sr;
      if(Input.held("ArrowRight")) pxx+=1.7*dt*sr;
      pxx-=dt*sr*seg.curve*0.32;                      /* カーブで外に振られる */
      speed += (Input.held("ArrowDown") ? BRK : ACC)*dt;
      if(Math.abs(pxx)>1){
        if(speed>OFFMAX){ speed+=OFF*dt; api.fx.shake(1.6); }
        pxx=Math.max(-2.1,Math.min(2.1,pxx));
      }
      speed=Math.max(0,Math.min(MAXS,speed));
      /* 他の車 */
      cars.forEach(c=>{
        c.z=(c.z+c.sp*dt)%trackLen;
        const gap=((c.z-pz)%trackLen+trackLen)%trackLen;
        if(gap<SEGL*1.2 && Math.abs(c.off-pxx)<0.52 && speed>c.sp){
          speed=c.sp*0.55; api.fx.shake(6); api.sfx.bad();
          api.fx.burst(W/2,H-30,{n:8,col:c.col,sp:110});
        }
      });
      pz+=speed*dt;
      if(pz>=trackLen){
        pz-=trackLen;
        if(!best||lapT<best) best=lapT;
        lap++;
        if(lap>LAPS){
          done=true;
          api.score(Math.round(t*1000));
          api.over({title:"ゴール", score:Math.round(t*1000), value:(t).toFixed(2)+"秒", lower:true,
            msg:"3周の合計タイム<br>ベストラップ "+(best/1000).toFixed(2)+"秒"});
          return;
        }
        api.sfx.great(); api.fx.pop(W/2,60,"LAP "+lap,PAL.amber);
        lapT=0;
      }
      api.score(Math.round(t*1000));
      api.info("ラップ <b>"+Math.min(lap,LAPS)+"/"+LAPS+"</b>"+(best?"　ベスト "+(best/1000).toFixed(2)+"秒":""));
      render();
    });
  }
});

/* ============================================================
   20 ならく潜り
   ============================================================ */
GAMES.push({
  id:"abyss", title:"ならく潜り", cat:"冒険",
  ctrl:"十字キーで移動／敵に当たると攻撃",
  about:"地下へ潜り、装備を集めて戦うダンジョン探検",
  kw:"roguelike dungeon rpg adventure equip bouken",
  hint:"敵に向かって歩くと攻撃します。体力が減ったらくすりを。階段は次の階へ。深いほど敵が強くなります。",
  thumb(c,W,H){
    const s=16;
    for(let y=0;y<7;y++) for(let x=0;x<10;x++){
      const wall=(x===0||y===0||x===9||y===6||(x===3&&y<4)||(x===6&&y>2));
      px(c,x*s,y*s,s-1,s-1, wall?"#2b3326":"#1f251c");
    }
    px(c,1*s+4,3*s+3,8,10,PAL.bone); px(c,1*s+5,3*s+1,6,4,PAL.teal);
    px(c,5*s+3,1*s+4,10,8,PAL.red); px(c,5*s+5,1*s+6,2,2,PAL.screen); px(c,5*s+10,1*s+6,2,2,PAL.screen);
    px(c,8*s+3,5*s+4,10,8,PAL.amber); px(c,8*s+3,5*s+7,10,2,"#7a5a20");
    px(c,7*s+4,2*s+4,8,8,PAL.olive);
    txt(c,"RPG",150,106,9,"#5a6450","right");
  },
  start(api){
    const N=9, CS=32, TOP=52;
    const {canvas,ctx,W,H}=api.canvas(N*CS, N*CS+TOP, 330);
    const WALL=1, FLOOR=0, STAIR=2, CHEST=3, HERB=4;

    const WEAPONS=[["木のぼう",1],["たんけん",3],["かたてけん",6],["いくさおの",10],["だいけん",15],["かみなりの剣",22]];
    const ARMORS =[["ぬのの服",1],["かわのよろい",3],["くさりかたびら",6],["てつのよろい",10],["りゅうのよろい",16]];
    const RARE=[["",1,PAL.bone],["するどい",1.4,PAL.teal],["わざもの",1.9,PAL.blue],["でんせつの",2.6,PAL.amber]];
    const MOBS=[
      {n:"ねずみ", col:PAL.plum,  hp:6,  atk:3,  def:0, exp:3,  gold:2},
      {n:"こうもり",col:PAL.blue, hp:9,  atk:5,  def:1, exp:6,  gold:4},
      {n:"がいこつ",col:PAL.bone, hp:16, atk:8,  def:3, exp:12, gold:8},
      {n:"ゴーレム",col:PAL.teal, hp:28, atk:12, def:6, exp:24, gold:16},
      {n:"まりゅう", col:PAL.red,  hp:44, atk:18, def:9, exp:44, gold:30}
    ];

    let floor=1, hp=30, mhp=30, lv=1, exp=0, gold=0, herbs=2, dead=false, busy=false;
    let wep={n:"木のぼう", v:1, col:PAL.bone}, arm={n:"ぬのの服", v:1, col:PAL.bone};
    let grid=[], seen=[], mobs=[], px0=1, py0=1, msg="";

    const atk=()=> 3+lv*2+wep.v;
    const def=()=> 1+lv+arm.v;
    const need=()=> lv*lv*8;
    const at=(x,y)=> (x<0||y<0||x>=N||y>=N) ? WALL : grid[y][x];
    const mobAt=(x,y)=> mobs.find(m=>m.x===x&&m.y===y);

    function gen(){
      for(let tries=0;tries<40;tries++){
        grid=[]; seen=[];
        for(let y=0;y<N;y++){
          grid.push([]); seen.push([]);
          for(let x=0;x<N;x++){
            const edge=(x===0||y===0||x===N-1||y===N-1);
            grid[y].push(edge||Math.random()<0.17?WALL:FLOOR);
            seen[y].push(false);
          }
        }
        px0=1; py0=1; grid[1][1]=FLOOR;
        /* 届く場所だけを使う */
        const ok=[[1,1]], mark={"1,1":1};
        for(let i=0;i<ok.length;i++){
          const [x,y]=ok[i];
          [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
            const nx=x+dx, ny=y+dy;
            if(at(nx,ny)===WALL||mark[nx+","+ny]) return;
            mark[nx+","+ny]=1; ok.push([nx,ny]);
          });
        }
        if(ok.length<28) continue;
        const far=ok.filter(([x,y])=>Math.abs(x-1)+Math.abs(y-1)>7);
        if(!far.length) continue;
        const st=far[Math.floor(Math.random()*far.length)];
        grid[st[1]][st[0]]=STAIR;
        const spots=ok.filter(([x,y])=>!(x===1&&y===1)&&!(x===st[0]&&y===st[1]));
        shuffle(spots);
        let k=0;
        for(let i=0;i<1+Math.floor(Math.random()*2) && k<spots.length;i++,k++) grid[spots[k][1]][spots[k][0]]=CHEST;
        for(let i=0;i<1+Math.floor(Math.random()*2) && k<spots.length;i++,k++) grid[spots[k][1]][spots[k][0]]=HERB;
        mobs=[];
        const num=Math.min(7, 2+Math.floor(floor/2));
        for(let i=0;i<num && k<spots.length;i++,k++){
          const tier=Math.min(MOBS.length-1, Math.floor((floor-1)/3+Math.random()*1.4));
          const b=MOBS[tier], s=1+(floor-1)*0.22;
          mobs.push({x:spots[k][0], y:spots[k][1], t:tier,
            hp:Math.round(b.hp*s), max:Math.round(b.hp*s),
            atk:Math.round(b.atk*s), def:Math.round(b.def*s),
            exp:Math.round(b.exp*s), gold:Math.round(b.gold*s)});
        }
        look(); return;
      }
    }
    function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }
    function look(){
      for(let y=py0-2;y<=py0+2;y++) for(let x=px0-2;x<=px0+2;x++){
        if(x<0||y<0||x>=N||y>=N) continue;
        if(Math.abs(x-px0)+Math.abs(y-py0)<=3) seen[y][x]=true;
      }
    }
    function say(s){ msg=s; api.info(s); }

    function levelUp(){
      while(exp>=need()){
        exp-=need(); lv++;
        mhp+=8; hp=Math.min(mhp,hp+8);
        api.sfx.great(); api.fx.pop(W/2,TOP+40,"レベル "+lv+"!",PAL.amber);
      }
    }
    function gain(m){
      exp+=m.exp; gold+=m.gold;
      api.fx.burst(m.x*CS+CS/2, TOP+m.y*CS+CS/2, {n:9, col:MOBS[m.t].col, sp:95});
      levelUp();
    }
    function hit(m){
      const d=Math.max(1, atk()+Math.floor(Math.random()*3)-m.def);
      m.hp-=d;
      api.sfx.tap(); api.fx.shake(2);
      api.fx.pop(m.x*CS+CS/2, TOP+m.y*CS, "-"+d, PAL.bone);
      if(m.hp<=0){
        say(MOBS[m.t].n+"をたおした");
        gain(m);
        mobs=mobs.filter(x=>x!==m);
      } else say(MOBS[m.t].n+"に "+d+" のダメージ");
    }
    function enemyTurn(){
      mobs.forEach(m=>{
        const dist=Math.abs(m.x-px0)+Math.abs(m.y-py0);
        if(dist===1){
          const d=Math.max(1, m.atk+Math.floor(Math.random()*2)-def());
          hp-=d; api.sfx.bad(); api.fx.shake(3.5);
          api.fx.pop(px0*CS+CS/2, TOP+py0*CS, "-"+d, PAL.red);
          if(hp<=0){
            hp=0; dead=true;
            const sc=floor*100+gold+lv*50;
            api.score(sc);
            api.over({title:"ちからつきた", score:sc,
              msg:"地下 "+floor+"階／レベル "+lv+"／"+gold+"G"});
          }
          return;
        }
        if(dist>6) return;
        const opts=[[Math.sign(px0-m.x),0],[0,Math.sign(py0-m.y)]].filter(([dx,dy])=>dx||dy);
        shuffle(opts);
        for(const [dx,dy] of opts){
          const nx=m.x+dx, ny=m.y+dy;
          if(at(nx,ny)===WALL||mobAt(nx,ny)||(nx===px0&&ny===py0)) continue;
          m.x=nx; m.y=ny; return;
        }
      });
    }
    function chest(){
      busy=true;
      const isW=Math.random()<0.5;
      const tbl=isW?WEAPONS:ARMORS;
      const idx=Math.min(tbl.length-1, Math.floor((floor-1)/3+Math.random()*1.6));
      const rIdx=Math.random()<0.06?3:Math.random()<0.2?2:Math.random()<0.45?1:0;
      const r=RARE[rIdx];
      const item={n:r[0]+tbl[idx][0], v:Math.round(tbl[idx][1]*r[1]), col:r[2]};
      const cur=isW?wep:arm;
      const up=item.v-cur.v;
      api.sheet(
        '<h4>たからばこ</h4>'+
        '<p><b style="color:'+item.col+'">'+esc(item.n)+'</b><br>'+
        (isW?"こうげき":"ぼうぎょ")+' +'+item.v+'　'+
        '<span style="color:'+(up>0?PAL.olive:PAL.tx3)+'">'+(up>0?"いまより +"+up:"いまのほうが強い")+'</span></p>'+
        '<div class="keys"><button class="key" id="eq">そうびする</button>'+
        '<button class="key alt" id="sell">うる（+'+(item.v*3)+'G）</button></div>'
      );
      el("eq").onclick=()=>{
        if(isW) wep=item; else arm=item;
        api.sfx.good(); say(item.n+" をそうびした");
        api.close(); busy=false; paint();
      };
      el("sell").onclick=()=>{
        gold+=item.v*3; api.sfx.tap(); say(item.n+" をうった");
        api.close(); busy=false; paint();
      };
    }
    function step(dx,dy){
      if(dead||busy) return;
      const nx=px0+dx, ny=py0+dy;
      const m=mobAt(nx,ny);
      if(m){ hit(m); enemyTurn(); look(); paint(); return; }
      if(at(nx,ny)===WALL) return;
      px0=nx; py0=ny;
      const tile=grid[ny][nx];
      if(tile===STAIR){
        floor++; hp=Math.min(mhp, hp+Math.ceil(mhp*0.25));
        api.sfx.great(); say("地下 "+floor+"階へ おりた");
        gen(); paint(); return;
      }
      if(tile===CHEST){ grid[ny][nx]=FLOOR; look(); paint(); chest(); return; }
      if(tile===HERB){ grid[ny][nx]=FLOOR; herbs++; api.sfx.good(); say("くすりを ひろった"); }
      enemyTurn(); look(); paint();
    }
    function drink(){
      if(dead||busy) return;
      if(herbs<=0){ api.sfx.bad(); say("くすりがない"); return; }
      if(hp>=mhp){ say("まだ元気だ"); return; }
      herbs--; hp=Math.min(mhp, hp+Math.ceil(mhp*0.45));
      api.sfx.good(); api.fx.pop(px0*CS+CS/2, TOP+py0*CS, "かいふく", PAL.olive);
      enemyTurn(); paint();
    }

    function paint(){
      px(ctx,0,0,W,H,PAL.screen);
      /* 情報 */
      px(ctx,0,0,W,TOP,"#141a13");
      txt(ctx,"地下 "+floor+"階",8,14,12,PAL.bone);
      txt(ctx,"Lv."+lv,W-8,14,12,PAL.olive,"right");
      const bw=W-16, r=hp/mhp;
      px(ctx,8,22,bw,8,"#2b3326");
      px(ctx,8,22,Math.max(0,Math.round(bw*r)),8, r>0.5?PAL.olive:r>0.25?PAL.amber:PAL.red);
      txt(ctx,hp+" / "+mhp,8,40,11,PAL.tx2);
      txt(ctx,"こ"+atk()+"  ぼ"+def()+"  くすり"+herbs+"  "+gold+"G",W-8,40,11,PAL.tx3,"right");
      /* 地図 */
      for(let y=0;y<N;y++) for(let x=0;x<N;x++){
        const sx=x*CS, sy=TOP+y*CS;
        if(!seen[y][x]){ px(ctx,sx,sy,CS,CS,"#11160f"); continue; }
        const near=Math.abs(x-px0)+Math.abs(y-py0)<=3;
        const t=grid[y][x];
        if(t===WALL){
          px(ctx,sx,sy,CS-1,CS-1,near?"#2f3828":"#232a1e");
          px(ctx,sx+2,sy+2,CS-5,3,near?"#3b452f":"#2a3124");
        } else {
          px(ctx,sx,sy,CS-1,CS-1,near?"#1f251c":"#181d16");
          px(ctx,sx+CS/2-1,sy+CS/2-1,2,2,"rgba(147,160,92,.25)");
        }
        if(t===STAIR){
          px(ctx,sx+5,sy+6,CS-11,4,PAL.teal);
          px(ctx,sx+8,sy+12,CS-17,4,PAL.teal);
          px(ctx,sx+11,sy+18,CS-23,4,PAL.teal);
        }
        if(t===CHEST){
          px(ctx,sx+6,sy+10,CS-13,CS-17,PAL.amber);
          px(ctx,sx+6,sy+15,CS-13,3,"#7a5a20");
        }
        if(t===HERB){
          px(ctx,sx+13,sy+8,4,5,PAL.bone);
          px(ctx,sx+11,sy+12,9,10,PAL.red);
        }
      }
      mobs.forEach(m=>{
        if(!seen[m.y][m.x]) return;
        const sx=m.x*CS, sy=TOP+m.y*CS, c=MOBS[m.t].col;
        px(ctx,sx+7,sy+9,CS-15,CS-16,c);
        px(ctx,sx+10,sy+13,3,3,PAL.screen);
        px(ctx,sx+CS-14,sy+13,3,3,PAL.screen);
        const w=Math.round((CS-14)*(m.hp/m.max));
        px(ctx,sx+7,sy+5,CS-14,2,"#2b3326");
        px(ctx,sx+7,sy+5,Math.max(1,w),2,PAL.red);
      });
      /* 自分 */
      const sx=px0*CS, sy=TOP+py0*CS;
      px(ctx,sx+10,sy+7,CS-20,6,PAL.teal);
      px(ctx,sx+8,sy+13,CS-16,10,PAL.bone);
      px(ctx,sx+CS-9,sy+11,3,12,wep.col);
      api.fx.draw(ctx);
    }

    api.controls({dpad:true, a:{label:"くすり",fn:()=>drink()}, legend:"敵に向かって歩くと<br>こうげき"});
    api.on(canvas,"pointerdown",e=>{
      if(dead||busy) return;
      const p=api.pos(canvas,e);
      const gx=Math.floor(p.x/CS), gy=Math.floor((p.y-TOP)/CS);
      const dx=gx-px0, dy=gy-py0;
      if(Math.abs(dx)+Math.abs(dy)!==1) return;
      step(dx,dy);
    });
    gen(); paint();
    say("地下 1階。階段をさがそう");
    api.loop(()=>{
      if(dead||busy) return;
      if(Input.hit("ArrowLeft"))  step(-1,0);
      if(Input.hit("ArrowRight")) step(1,0);
      if(Input.hit("ArrowUp"))    step(0,-1);
      if(Input.hit("ArrowDown"))  step(0,1);
      if(Input.hit("Space"))      drink();
    });
  }
});
