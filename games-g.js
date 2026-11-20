/* ポケット17 — ゲーム22（3D建築バトル） */
"use strict";

/* ============================================================
   22 スカイフォート
   一人称の3D。歩く・跳ぶ・撃つ・壁と階段を建てる1対1。
   見た目はローポリ。色は筐体と同じ8色だけを使う。
   オンラインは席0が計算役、席1は入力と視線だけを送る。
   ============================================================ */
GAMES.push({
  id:"fort", title:"スカイフォート", cat:"対戦", vs:true,
  ctrl:"画面左で移動／右で視点／A 撃つ／B 壁",
  about:"3Dの一人称で、壁と階段を建てながら撃ち合う1対1",
  kw:"3d fps build shooter kenchiku taisen online webgl",
  hint:"撃たれたらBで壁。階段ボタンで高い所へ。壁は3発で壊れます。素材は時間で戻ります。",
  three:true,
  thumb(c,W,H){
    px(c,0,0,W,62,"#2a3326");
    px(c,0,62,W,50,"#222a1e");
    c.fillStyle="#3b452f";
    c.beginPath(); c.moveTo(0,62); c.lineTo(W,62); c.lineTo(W,70); c.lineTo(0,70); c.closePath(); c.fill();
    /* 奥の壁 */
    c.fillStyle=PAL.blue;  c.beginPath(); c.moveTo(96,40); c.lineTo(126,46); c.lineTo(126,80); c.lineTo(96,70); c.closePath(); c.fill();
    c.fillStyle="#3f6a9c"; c.beginPath(); c.moveTo(126,46); c.lineTo(140,42); c.lineTo(140,74); c.lineTo(126,80); c.closePath(); c.fill();
    /* 階段 */
    c.fillStyle=PAL.teal;  c.beginPath(); c.moveTo(22,76); c.lineTo(58,58); c.lineTo(58,70); c.lineTo(22,88); c.closePath(); c.fill();
    /* 相手 */
    px(c,72,52,9,16,PAL.red); px(c,73,44,7,8,PAL.bone);
    /* 銃口 */
    c.fillStyle="#2b3326";
    c.beginPath(); c.moveTo(108,112); c.lineTo(150,86); c.lineTo(160,100); c.lineTo(132,112); c.closePath(); c.fill();
    px(c,78,54,4,1,PAL.bone); px(c,79,52,1,5,PAL.bone);
    txt(c,"3D",150,10,9,PAL.amber,"right");
  },
  start(api){
    const LIB="https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js";
    const box=document.createElement("div");
    box.style.cssText="width:100%;max-width:460px;display:flex;flex-direction:column;gap:8px";
    const note=document.createElement("div");
    note.style.cssText="font-family:"+FONT+";font-size:13px;color:#aeb49f;text-align:center;padding:30px 10px";
    note.textContent="3Dを読み込んでいます…";
    box.appendChild(note);
    api.host.appendChild(box);
    api.controls(null);

    let stopped=false, renderer=null;
    (function boot(){
      if(window.THREE){ run(); return; }
      const s=document.createElement("script");
      s.src=LIB; s.async=true; s.crossOrigin="anonymous";
      s.onload=()=>{ if(!stopped) (window.THREE ? run() : fail()); };
      s.onerror=fail;
      document.head.appendChild(s);
      setTimeout(()=>{ if(!stopped && !window.THREE) fail(); }, 15000);
    })();
    function fail(){
      if(stopped) return;
      note.innerHTML="3Dの部品を読み込めませんでした。<br><span style='font-size:11px;color:#79806c'>"+
        "通信環境を確かめてください。<br>このゲームだけはオフラインでは遊べません。</span>";
    }

    function run(){
      if(stopped) return;
      const T=window.THREE;
      note.remove();

      /* ---------- 設定 ---------- */
      const VW=480, VH=300;
      const ARENA=34, CELL=2, BHP=3, MATMAX=30, MATREG=3.2;
      const EYE=1.55, RAD=0.42, HEIGHT=1.8;
      const SPD=7.2, JUMP=7.4, GRAV=20, DMG=20, SHOOTCD=0.32, BUILDCD=0.22, RANGE=60;
      const C={ground:"#2b3326", sky:"#1b2119", grid:"#36402f",
               blue:"#5283bd", red:"#c85540", teal:"#4fa08c", amber:"#e3a73c",
               bone:"#e9e3d0", olive:"#93a05c"};

      /* ---------- 画面 ---------- */
      const wrapRel=document.createElement("div");
      wrapRel.style.cssText="position:relative;width:100%;max-width:460px";
      box.insertBefore(wrapRel, box.firstChild);
      const cv=document.createElement("canvas");
      cv.style.cssText="width:100%;aspect-ratio:"+VW+" / "+VH+";display:block;border-radius:4px;touch-action:none;background:"+C.sky;
      wrapRel.appendChild(cv);
      live.mainCanvas=cv;
      try{
        renderer=new T.WebGLRenderer({canvas:cv, antialias:false, powerPreference:"low-power"});
      }catch(e){
        note.textContent="この端末では3Dを表示できません";
        box.appendChild(note); return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
      renderer.setSize(VW,VH,false);
      renderer.setClearColor(C.sky);

      const scene=new T.Scene();
      scene.fog=new T.Fog(C.sky, 26, 64);
      const cam=new T.PerspectiveCamera(74, VW/VH, 0.1, 140);
      scene.add(new T.AmbientLight(0xffffff, 0.72));
      const sun=new T.DirectionalLight(0xffffff, 0.75);
      sun.position.set(12,24,8); scene.add(sun);

      const mat=c=>new T.MeshLambertMaterial({color:c});
      const MATS={ground:mat(C.ground), blue:mat(C.blue), red:mat(C.red),
                  teal:mat(C.teal), amber:mat(C.amber), bone:mat(C.bone), olive:mat(C.olive)};

      /* 地面と柵 */
      const ground=new T.Mesh(new T.BoxGeometry(ARENA,1,ARENA), MATS.ground);
      ground.position.y=-0.5; scene.add(ground);
      const gridH=new T.GridHelper(ARENA, ARENA/CELL, C.grid, C.grid);
      gridH.position.y=0.02; scene.add(gridH);
      for(let i=0;i<4;i++){
        const w=new T.Mesh(new T.BoxGeometry(i<2?ARENA:1, 5, i<2?1:ARENA), MATS.ground);
        w.position.set(i===2?-ARENA/2:i===3?ARENA/2:0, 2.5, i===0?-ARENA/2:i===1?ARENA/2:0);
        scene.add(w);
      }
      /* 最初から置いてある台 */
      const PLAT=[[-8,0,-8],[8,0,8],[0,0,0]];
      PLAT.forEach(([x,y,z])=>{
        const m=new T.Mesh(new T.BoxGeometry(6,1.2,6), MATS.ground);
        m.position.set(x,y+2.4,z); scene.add(m);
      });

      /* ---------- ブロック ---------- */
      const blocks=new Map();              /* "x,y,z" -> {x,y,z,t,hp,own,mesh} */
      const wallGeo=new T.BoxGeometry(CELL,CELL,CELL);
      /* 坂は板を45度傾けたもの。低いほうが手前（ローカル -z）、高いほうが奥（+z）。 */
      const rampGeo=new T.BoxGeometry(CELL, 0.34, CELL*1.45);
      const key=(x,y,z)=>x+","+y+","+z;
      const snap=v=>Math.round(v/CELL);
      function addBlock(gx,gy,gz,t,own,hp,rot){
        if(gy<0) return false;
        const k=key(gx,gy,gz);
        if(blocks.has(k)) return false;
        if(blocks.size>120) return false;
        const col=own===1?MATS.blue:MATS.red;
        let m;
        if(t===1){
          m=new T.Group();
          const plank=new T.Mesh(rampGeo, col);
          plank.rotation.x=-Math.PI/4;
          plank.position.y=CELL/2;
          m.add(plank);
          m.rotation.y=rot||0;
          m.position.set(gx*CELL, gy*CELL, gz*CELL);
        } else {
          m=new T.Mesh(wallGeo, col);
          m.position.set(gx*CELL, gy*CELL+CELL/2, gz*CELL);
        }
        scene.add(m);
        blocks.set(k,{x:gx,y:gy,z:gz,t:t,hp:hp||BHP,own:own,mesh:m,rot:rot||0});
        return true;
      }
      function paint(b){
        const col = b.hp<BHP ? (b.own===1?MATS.teal:MATS.amber) : (b.own===1?MATS.blue:MATS.red);
        if(b.mesh.material) b.mesh.material=col;
        else b.mesh.children.forEach(ch=>ch.material=col);
      }
      function delBlock(b){
        scene.remove(b.mesh);
        blocks.delete(key(b.x,b.y,b.z));
      }
      function hurtBlock(b){
        b.hp--;
        if(b.hp<=0){ delBlock(b); return true; }
        paint(b);
        return false;
      }
      function clearBlocks(){ Array.from(blocks.values()).forEach(delBlock); }
      function packBlocks(){
        const a=[];
        blocks.forEach(b=>a.push(b.x+" "+b.y+" "+b.z+" "+b.t+" "+b.hp+" "+b.own+" "+Math.round(b.rot*57.3)));
        return a.join(";");
      }
      function unpackBlocks(s){
        if(typeof s!=="string") return;
        const want=new Set();
        s.split(";").forEach(r=>{
          if(!r) return;
          const p=r.split(" ").map(Number);
          if(p.length<6||!isFinite(p[0])) return;
          const k=key(p[0],p[1],p[2]);
          want.add(k);
          const have=blocks.get(k);
          if(have){ if(have.hp!==p[4]){ have.hp=p[4]; paint(have); } }
          else addBlock(p[0],p[1],p[2],p[3],p[5],p[4],(p[6]||0)/57.3);
        });
        Array.from(blocks.keys()).forEach(k=>{ if(!want.has(k)) delBlock(blocks.get(k)); });
      }

      /* ---------- 人 ---------- */
      function mkBody(col){
        const g=new T.Group();
        const b=new T.Mesh(new T.BoxGeometry(0.8,1.1,0.5), mat(col));
        b.position.y=0.55; g.add(b);
        const h=new T.Mesh(new T.BoxGeometry(0.56,0.5,0.52), MATS.bone);
        h.position.y=1.38; g.add(h);
        const gun=new T.Mesh(new T.BoxGeometry(0.16,0.16,0.9), MATS.olive);
        gun.position.set(0.34,0.95,0.45); g.add(gun);
        scene.add(g);
        return g;
      }
      const foeBody=mkBody(C.red);

      function mkP(x,z,face){
        return {x:x, y:0, z:z, vy:0, yaw:face, pitch:0, hp:100, mat:MATMAX,
                cd:0, bcd:0, onG:true};
      }
      /* 前方は (-sin(yaw), -cos(yaw))。向かい合うように置く。 */
      let me=mkP(-13,-13,Math.PI*1.25), foe=mkP(13,13,Math.PI*0.25);
      let mode="cpu", seat=-1, over=false, ended=false, dc=false, winner=0;
      let tick=0, sendT=0, blkT=0, blkDirty=true, lastSeen=-1;

      /* ---------- 当たり判定 ---------- */
      function solidAt(x,y,z){
        /* 台 */
        for(const [px0,,pz0] of PLAT){
          if(Math.abs(x-px0)<3+RAD && Math.abs(z-pz0)<3+RAD && y<3.0 && y+HEIGHT>1.8) return true;
        }
        const gy=Math.floor(y/CELL);
        for(let yy=gy;yy<=Math.floor((y+HEIGHT-0.05)/CELL);yy++){
          for(let dx=-1;dx<=1;dx++) for(let dz=-1;dz<=1;dz++){
            const gx=snap(x)+dx, gz=snap(z)+dz;
            const b=blocks.get(key(gx,yy,gz));
            if(!b||b.t===1) continue;
            const bx=gx*CELL, bz=gz*CELL, by=yy*CELL;
            if(Math.abs(x-bx)<CELL/2+RAD && Math.abs(z-bz)<CELL/2+RAD && y<by+CELL && y+HEIGHT>by) return true;
          }
        }
        return false;
      }
      function floorAt(x,y,z){
        let top=0;
        for(const [px0,,pz0] of PLAT){
          if(Math.abs(x-px0)<3+RAD*0.5 && Math.abs(z-pz0)<3+RAD*0.5) top=Math.max(top,3.0);
        }
        blocks.forEach(b=>{
          const bx=b.x*CELL, bz=b.z*CELL;
          if(Math.abs(x-bx)>=CELL/2+RAD*0.6||Math.abs(z-bz)>=CELL/2+RAD*0.6) return;
          let h;
          if(b.t===1){
            /* 坂のローカル +z 方向にどれだけ進んだかで高さが決まる */
            const lx=x-bx, lz=z-bz;
            const si=Math.sin(b.rot), co=Math.cos(b.rot);
            const localZ=lx*si+lz*co;
            const fr=Math.max(0,Math.min(1,(localZ+CELL/2)/CELL));
            h=b.y*CELL+fr*CELL;
          } else h=(b.y+1)*CELL;
          if(h<=y+0.55) top=Math.max(top,h);
        });
        return top;
      }
      function step(p,fw,st,dt){
        const s=Math.sin(p.yaw), c=Math.cos(p.yaw);
        let dx=(-s*fw + c*st)*SPD*dt;
        let dz=(-c*fw - s*st)*SPD*dt;
        if(!solidAt(p.x+dx,p.y,p.z)) p.x+=dx;
        if(!solidAt(p.x,p.y,p.z+dz)) p.z+=dz;
        const lim=ARENA/2-1.2;
        p.x=Math.max(-lim,Math.min(lim,p.x));
        p.z=Math.max(-lim,Math.min(lim,p.z));
        p.vy-=GRAV*dt;
        p.y+=p.vy*dt;
        const fl=floorAt(p.x,p.y,p.z);
        if(p.y<=fl){ p.y=fl; p.vy=0; p.onG=true; } else p.onG=false;
        if(p.cd>0)p.cd-=dt;
        if(p.bcd>0)p.bcd-=dt;
        p.mat=Math.min(MATMAX,p.mat+MATREG*dt);
      }

      /* ---------- 撃つ・建てる ---------- */
      const ray=new T.Raycaster();
      const tmp=new T.Vector3();
      function dirOf(p){
        return new T.Vector3(-Math.sin(p.yaw)*Math.cos(p.pitch), Math.sin(p.pitch), -Math.cos(p.yaw)*Math.cos(p.pitch));
      }
      function shoot(p,who){
        if(p.cd>0||over) return;
        p.cd=SHOOTCD;
        api.sfx.tap();
        const from=new T.Vector3(p.x,p.y+EYE,p.z), d=dirOf(p);
        const target=who===1?foe:me;
        /* 相手に当たるか */
        const tc=new T.Vector3(target.x,target.y+1.0,target.z).sub(from);
        const along=tc.dot(d);
        let hitFoe=false, hitDist=RANGE;
        if(along>0&&along<RANGE){
          const perp=tc.clone().sub(d.clone().multiplyScalar(along)).length();
          if(perp<0.85){ hitFoe=true; hitDist=along; }
        }
        /* ブロックが手前にあるか */
        ray.set(from,d); ray.far=hitDist;
        const meshes=[]; blocks.forEach(b=>meshes.push(b.mesh));
        const hits=ray.intersectObjects(meshes,false);
        if(hits.length && hits[0].distance<hitDist){
          const m=hits[0].object;
          let found=null; blocks.forEach(b=>{ if(b.mesh===m) found=b; });
          if(found){ hurtBlock(found); blkDirty=true; api.fx.shake(1.2); }
          return;
        }
        if(hitFoe){
          target.hp-=DMG; api.fx.shake(4.5); api.sfx.bad();
          if(target.hp<=0&&!over){ over=true; winner=who; }
        }
      }
      /* そのマスが自分の体と重なるか。重なる所に建てると動けなくなる。 */
      function overlapsBody(gx,gy,gz,p){
        const bx=gx*CELL, bz=gz*CELL, by=gy*CELL;
        if(Math.abs(p.x-bx)>=CELL/2+RAD || Math.abs(p.z-bz)>=CELL/2+RAD) return false;
        return p.y < by+CELL && p.y+HEIGHT > by;
      }
      function build(p,who,ramp){
        if(p.bcd>0||over) return;
        const cost=2;
        if(p.mat<cost) return;
        const s=Math.sin(p.yaw), c=Math.cos(p.yaw);
        let gy=Math.floor((p.y+0.1)/CELL);
        if(gy<0) gy=0;
        /* 体に重ならない位置まで、前に1マスずつずらして探す */
        let gx=0, gz=0, found=false;
        for(const d of [CELL*1.4, CELL*2.2, CELL*3.0]){
          gx=snap(p.x - s*d); gz=snap(p.z - c*d);
          if(!overlapsBody(gx,gy,gz,p) && !(!ramp && overlapsBody(gx,gy+1,gz,p))){ found=true; break; }
        }
        if(!found) return;
        let made=false;
        if(ramp){
          /* ローカル +z を進行方向に向ける */
          made=addBlock(gx,gy,gz,1,who,BHP, p.yaw+Math.PI);
        } else {
          made=addBlock(gx,gy,gz,0,who,BHP) || false;
          if(addBlock(gx,gy+1,gz,0,who,BHP)) made=true;
        }
        if(made){ p.mat-=cost; p.bcd=BUILDCD; blkDirty=true; api.sfx.good(); }
      }

      /* ---------- 操作 ---------- */
      const keyIn={f:0,s:0,jump:false,shoot:false,wall:false,ramp:false};
      let look={x:0,y:0};
      const touches={};
      function pos(e){
        const r=cv.getBoundingClientRect();
        return {x:(e.clientX-r.left)/r.width*VW, y:(e.clientY-r.top)/r.height*VH, id:e.pointerId};
      }
      api.on(cv,"pointerdown",e=>{
        e.preventDefault();
        const p=pos(e);
        touches[p.id]={side:p.x<VW/2?"move":"look", x0:p.x, y0:p.y, x:p.x, y:p.y};
      });
      api.on(cv,"pointermove",e=>{
        const t=touches[e.pointerId]; if(!t) return;
        const p=pos(e);
        if(t.side==="look"){
          look.x+=(p.x-t.x)*0.0055; look.y+=(p.y-t.y)*0.0045;
        }
        t.x=p.x; t.y=p.y;
      });
      const endT=e=>{ delete touches[e.pointerId]; };
      api.on(cv,"pointerup",endT);
      api.on(cv,"pointercancel",endT);
      api.on(cv,"pointerleave",endT);
      function stick(){
        let f=0,s=0;
        Object.keys(touches).forEach(k=>{
          const t=touches[k];
          if(t.side!=="move") return;
          const dx=t.x-t.x0, dy=t.y-t.y0;
          const n=Math.max(1,Math.hypot(dx,dy)/40);
          f+=-dy/40/n; s+=dx/40/n;
        });
        return {f:Math.max(-1,Math.min(1,f)), s:Math.max(-1,Math.min(1,s))};
      }
      /* 画面下のボタン */
      const row=document.createElement("div");
      row.style.cssText="display:flex;gap:7px";
      const mkBtn=(label,cls)=>{
        const b=document.createElement("button");
        b.className="key"+(cls||" alt"); b.style.cssText="flex:1;font-size:13px;padding:11px 8px";
        b.textContent=label; row.appendChild(b); return b;
      };
      const jumpB=mkBtn("ジャンプ"), rampB=mkBtn("階段");
      box.appendChild(row);
      const hold=(b,set)=>{
        const d=e=>{ e.preventDefault(); set(true); };
        const u=e=>{ if(e)e.preventDefault(); set(false); };
        b.addEventListener("pointerdown",d); b.addEventListener("pointerup",u);
        b.addEventListener("pointercancel",u); b.addEventListener("pointerleave",u);
      };
      hold(jumpB,v=>keyIn.jump=v);
      hold(rampB,v=>keyIn.ramp=v);

      function readIn(){
        const st=stick();
        const kf=(Input.held("ArrowUp")?1:0)-(Input.held("ArrowDown")?1:0);
        const ks=(Input.held("ArrowRight")?1:0)-(Input.held("ArrowLeft")?1:0);
        return {
          f:Math.max(-1,Math.min(1,st.f+kf)),
          s:Math.max(-1,Math.min(1,st.s+ks)),
          jump:keyIn.jump||Input.rawHeld(" ")||Input.held("Space"),
          shoot:Input.held("KeyF")||Input.rawHeld("f"),
          wall:Input.held("KeyB")||Input.rawHeld("b"),
          ramp:keyIn.ramp
        };
      }
      api.controls({dpad:true, a:{label:"撃つ",code:"KeyF"}, b:{label:"壁",code:"KeyB"},
                    legend:"画面左で移動<br>画面右で視点"});

      /* ---------- CPU ---------- */
      let aiT=0,aiStrafe=1,aiB=0;
      function ai(dt){
        aiT-=dt; aiB-=dt;
        const dx=me.x-foe.x, dz=me.z-foe.z;
        const dist=Math.hypot(dx,dz);
        foe.yaw=Math.atan2(-dx,-dz);
        foe.pitch=Math.max(-0.5,Math.min(0.5,(me.y-foe.y)/Math.max(2,dist)));
        if(aiT<=0){ aiStrafe=Math.random()<0.5?-1:1; aiT=1.0+Math.random(); }
        const fw=dist>9?0.9:dist<5?-0.7:0;
        step(foe,fw,aiStrafe*0.55,dt);
        if(foe.onG&&Math.random()<0.012) foe.vy=JUMP;
        if(dist<26&&Math.random()<0.55) shoot(foe,2);
        if(foe.hp<65&&foe.mat>8&&aiB<=0){ build(foe,2,false); aiB=1.6; }
      }

      /* ---------- 通信 ---------- */
      const packP=p=>[Math.round(p.x*20)/20, Math.round(p.y*20)/20, Math.round(p.z*20)/20,
                      Math.round(p.yaw*100)/100, Math.round(p.hp)];
      function applyP(p,a){ if(!a) return; p.x=a[0]; p.y=a[1]; p.z=a[2]; p.yaw=a[3]; p.hp=a[4]; }
      function sendState(){
        api.net.put({st:{t:++tick, a:packP(me), b:packP(foe), w:winner}});
      }

      /* ---------- 画面の重ね描き ---------- */
      const hud=document.createElement("canvas");
      hud.width=VW; hud.height=VH;
      hud.style.cssText="position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
      wrapRel.appendChild(hud);
      const hx=hud.getContext("2d");
      function drawHud(){
        hx.clearRect(0,0,VW,VH);
        /* 照準 */
        hx.fillStyle=C.bone;
        hx.fillRect(VW/2-7,VH/2-1,5,2); hx.fillRect(VW/2+2,VH/2-1,5,2);
        hx.fillRect(VW/2-1,VH/2-7,2,5); hx.fillRect(VW/2-1,VH/2+2,2,5);
        /* 体力と素材 */
        const mine=(mode==="online"&&seat===1)?foe:me;
        const them=(mode==="online"&&seat===1)?me:foe;
        hx.fillStyle="rgba(20,26,19,.78)"; hx.fillRect(0,0,VW,26);
        const bar=(x,p,col)=>{ hx.fillStyle="#2b3326"; hx.fillRect(x,8,120,10);
          hx.fillStyle=col; hx.fillRect(x,8,Math.max(0,Math.round(120*Math.max(0,p.hp)/100)),10); };
        bar(8,mine,C.teal); bar(VW-128,them,C.red);
        hx.font="12px "+FONT; hx.fillStyle="#9aa189"; hx.textBaseline="middle";
        hx.textAlign="left";  hx.fillText("あなた",8,34);
        hx.textAlign="right"; hx.fillText("あいて",VW-8,34);
        hx.textAlign="left";  hx.fillStyle=C.amber;
        hx.fillText("素材 "+Math.floor(mine.mat),8,VH-12);
        if(over){
          hx.fillStyle="rgba(14,18,13,.82)"; hx.fillRect(0,VH/2-30,VW,60);
          hx.textAlign="center"; hx.fillStyle=C.amber; hx.font="26px "+FONT;
          let label;
          if(mode==="cpu") label=winner===1?"かち":"まけ";
          else label=((seat===0&&winner===1)||(seat===1&&winner===2))?"あなたの勝ち":"あなたの負け";
          hx.fillText(label,VW/2,VH/2);
        }
      }

      function finish(){
        if(ended) return;
        ended=true;
        if(mode==="cpu"){
          const win=winner===1;
          api.over({title:win?"かち":"まけ", score:win?Math.round(me.hp*10):0, save:win,
            value:win?"WIN":"LOSE", msg:win?"残り体力 "+Math.round(me.hp):"やられました"});
        } else {
          const win=(seat===0&&winner===1)||(seat===1&&winner===2);
          api.over({title:win?"あなたの勝ち":"あなたの負け", score:0, save:false,
            value:win?"WIN":"LOSE", msg:"オンライン対戦の結果"});
        }
      }
      function reset(){
        clearBlocks();
        me=mkP(-13,-13,Math.PI*1.25); foe=mkP(13,13,Math.PI*0.25);
        over=false; ended=false; winner=0; blkDirty=true; look={x:0,y:0};
      }

      api.modes([
        {id:"cpu", label:"CPUとたたかう"},
        {id:"online", label:"オンライン対戦"}
      ]).then(m=>{
        mode=m; reset();
        if(m==="online") matchUI(api, ()=>{
          seat=api.net.seat(); reset();
          if(seat===0){ sendState(); api.net.put({bl:packBlocks()}); }
        });
        else api.info("CPUとの1対1");
      });

      /* ---------- 毎フレーム ---------- */
      api.loop(dt=>{
        if(stopped) return;
        const inp=readIn();
        /* 視点は常に手元で動かす（通信の遅れを感じさせない） */
        const self=(mode==="online"&&seat===1)?foe:me;
        self.yaw-=look.x; self.pitch=Math.max(-1.2,Math.min(1.2,self.pitch-look.y));
        look.x=0; look.y=0;

        if(mode==="online"){
          if(dc){ drawHud(); return; }
          if(seat<0){ renderer.render(scene,cam); drawHud(); return; }
          const list=api.net.list();
          if(list.length<2){
            dc=true; over=true; ended=true;
            lostPeer(api, ()=>{ dc=false; seat=-1;
              matchUI(api,()=>{ seat=api.net.seat(); reset(); if(seat===0){ sendState(); api.net.put({bl:packBlocks()}); } }); });
            return;
          }
          seat=api.net.seat();
          if(seat===0){
            if(!over){
              step(me,inp.f,inp.s,dt);
              if(inp.jump&&me.onG) me.vy=JUMP;
              if(inp.shoot) shoot(me,1);
              if(inp.wall) build(me,1,false);
              if(inp.ramp) build(me,1,true);
              const g=api.net.at(1);
              const gi=(g&&g.presence&&g.presence.in)||{};
              if(typeof gi.yaw==="number"){ foe.yaw=gi.yaw; foe.pitch=gi.pitch||0; }
              step(foe,gi.f||0,gi.s||0,dt);
              if(gi.jump&&foe.onG) foe.vy=JUMP;
              if(gi.shoot) shoot(foe,2);
              if(gi.wall) build(foe,2,false);
              if(gi.ramp) build(foe,2,true);
            }
            sendT+=dt; blkT+=dt;
            if(sendT>=1/22){ sendT=0; sendState(); }
            if(blkDirty&&blkT>=1/7){ blkT=0; blkDirty=false; api.net.put({bl:packBlocks()}); }
          } else {
            api.net.put({in:{f:Math.round(inp.f*100)/100, s:Math.round(inp.s*100)/100,
              jump:inp.jump, shoot:inp.shoot, wall:inp.wall, ramp:inp.ramp,
              yaw:Math.round(foe.yaw*100)/100, pitch:Math.round(foe.pitch*100)/100}});
            const h=api.net.at(0);
            const st=h&&h.presence&&h.presence.st;
            const bl=h&&h.presence&&h.presence.bl;
            if(typeof bl==="string") unpackBlocks(bl);
            if(st&&st.t>lastSeen){
              lastSeen=st.t;
              applyP(me,st.a);
              const keepYaw=foe.yaw, keepPitch=foe.pitch;
              applyP(foe,st.b);
              foe.yaw=keepYaw; foe.pitch=keepPitch;
              winner=st.w||0;
              if(winner&&!over) over=true;
            }
          }
          if(over) finish();
        } else {
          if(!over){
            step(me,inp.f,inp.s,dt);
            if(inp.jump&&me.onG) me.vy=JUMP;
            if(inp.shoot) shoot(me,1);
            if(inp.wall) build(me,1,false);
            if(inp.ramp) build(me,1,true);
            ai(dt);
          }
          if(over) finish();
          api.info("体力 <b>"+Math.max(0,Math.round(me.hp))+"</b>　素材 "+Math.floor(me.mat));
        }

        /* 描画 */
        const you=(mode==="online"&&seat===1)?foe:me;
        const other=(mode==="online"&&seat===1)?me:foe;
        cam.position.set(you.x, you.y+EYE, you.z);
        cam.rotation.set(you.pitch, you.yaw, 0, "YXZ");
        foeBody.position.set(other.x, other.y, other.z);
        foeBody.rotation.y=other.yaw;
        foeBody.visible=other.hp>0;
        renderer.render(scene,cam);
        drawHud();
      });

    }

    return ()=>{
      stopped=true;
      try{ if(renderer){ renderer.dispose(); renderer.forceContextLoss(); } }catch(e){}
    };
  }
});
