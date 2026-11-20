/* ポケット17 — ゲーム 01-05 */
"use strict";
/* ============================================================
   01 ブロックドロップ
   ============================================================ */
GAMES.push({
  id:"blockdrop", title:"ブロックドロップ", cat:"パズル",
  ctrl:"←→ 移動／A 回転／B 落下",
  about:"落ちてくるブロックを並べて横一列を消す",
  kw:"tetris otimono",
  hint:"4段同時消しがいちばん点が入ります。Bボタンで一気に落とすと落下ぶんも加点。",
  thumb(c,W,H){
    const s=8;
    for(let i=0;i<10;i++) for(let j=0;j<14;j++){
      if((i+j)%7===0) px(c,20+i*s,j*s,s-1,s-1,PAL.dim);
    }
    const rows=[[1,1,1,1,1,1,0,1,1,1],[1,1,0,1,1,1,1,1,1,1],[0,1,1,1,1,0,1,1,1,1]];
    rows.forEach((r,y)=>r.forEach((v,x)=>{ if(v) px(c,20+x*s,78+y*s,s-1,s-1,y===1?PAL.teal:PAL.olive); }));
    [[0,0],[1,0],[2,0],[1,1]].forEach(([x,y])=> px(c,20+(x+3)*s,22+y*s,s-1,s-1,PAL.amber));
    txt(c,"PUZZLE",150,10,9,PAL.dim,"right");
  },
  start(api){
    const CW=27, COLS=10, ROWS=20, FW=COLS*CW, PANEL=78;
    const {canvas,ctx,W,H}=api.canvas(FW+PANEL, ROWS*CW, 380);
    const COL=[null,PAL.teal,PAL.blue,PAL.amber,PAL.olive,PAL.red,PAL.plum,PAL.bone];
    const SH=[[[1,1,1,1]],[[0,0,2],[2,2,2]],[[3,0,0],[3,3,3]],[[4,4],[4,4]],
              [[0,5,5],[5,5,0]],[[0,6,0],[6,6,6]],[[7,7,0],[0,7,7]]];
    let board=Array.from({length:ROWS},()=>Array(COLS).fill(0));
    let bag=[], cur=null, next=null, lines=0, level=1, fall=0, dead=false;
    function take(){ if(!bag.length) bag=[0,1,2,3,4,5,6].sort(()=>Math.random()-.5); return SH[bag.pop()].map(r=>r.slice()); }
    function spawn(){
      cur={m:next||take(), x:3, y:0};
      cur.x=Math.floor((COLS-cur.m[0].length)/2);
      next=take();
      if(hit(cur.m,cur.x,cur.y)){ dead=true; api.over({title:"ゲームオーバー", msg:lines+"段けした／レベル"+level}); }
    }
    function hit(m,px0,py0){
      for(let y=0;y<m.length;y++) for(let x=0;x<m[y].length;x++){
        if(!m[y][x]) continue;
        const nx=px0+x, ny=py0+y;
        if(nx<0||nx>=COLS||ny>=ROWS) return true;
        if(ny>=0 && board[ny][nx]) return true;
      }
      return false;
    }
    function rot(m){
      const h=m.length,w=m[0].length;
      const o=Array.from({length:w},()=>Array(h).fill(0));
      for(let y=0;y<h;y++) for(let x=0;x<w;x++) o[x][h-1-y]=m[y][x];
      return o;
    }
    function fullRows(){
      const f=[];
      for(let y=0;y<ROWS;y++) if(board[y].every(v=>v)) f.push(y);
      return f;
    }
    /* そろった段を抜いて、上に残ったぶんをそのまま下げる */
    function clearRows(full){
      const keep=board.filter((row,y)=>full.indexOf(y)<0);
      while(keep.length<ROWS) keep.unshift(Array(COLS).fill(0));
      board=keep;
    }
    function lock(){
      cur.m.forEach((row,y)=>row.forEach((v,x)=>{ if(v && cur.y+y>=0) board[cur.y+y][cur.x+x]=v; }));
      const full=fullRows();
      if(full.length){
        full.forEach(y=>{
          for(let x=0;x<COLS;x++) api.fx.burst(x*CW+CW/2, y*CW+CW/2, {n:3, col:COL[board[y][x]]||PAL.bone, sp:70, life:.4});
        });
        clearRows(full);
        lines+=full.length;
        const gain=[0,100,300,500,800][full.length]*level;
        api.add(gain);
        api.fx.pop(FW/2, full[0]*CW, "+"+gain, PAL.amber);
        api.fx.shake(3+full.length*2.2);
        level=1+Math.floor(lines/8);
        full.length>=3?api.sfx.great():api.sfx.good();
      } else api.sfx.tap();
      api.info("けした段 <b>"+lines+"</b>／レベル <b>"+level+"</b>");
      spawn();
    }
    function move(d){ if(!hit(cur.m,cur.x+d,cur.y)) cur.x+=d; }
    function turn(){
      const m=rot(cur.m);
      for(const k of [0,-1,1,-2,2]) if(!hit(m,cur.x+k,cur.y)){ cur.m=m; cur.x+=k; api.sfx.tap(); return; }
    }
    function hard(){
      let n=0; while(!hit(cur.m,cur.x,cur.y+1)){ cur.y++; n++; }
      api.add(n*2); api.fx.shake(2.4); lock();
    }
    function blk(x,y,c,s){
      s=s||CW;
      px(ctx,x+1,y+1,s-2,s-2,c);
      px(ctx,x+2,y+2,s-4,3,"rgba(255,255,255,.3)");
      px(ctx,x+2,y+s-5,s-4,2,"rgba(0,0,0,.25)");
    }
    function render(){
      px(ctx,0,0,W,H,PAL.screen);
      ctx.strokeStyle="rgba(147,160,92,.1)"; ctx.lineWidth=1;
      for(let x=0;x<=COLS;x++){ ctx.beginPath(); ctx.moveTo(x*CW,0); ctx.lineTo(x*CW,H); ctx.stroke(); }
      for(let y=0;y<=ROWS;y++){ ctx.beginPath(); ctx.moveTo(0,y*CW); ctx.lineTo(FW,y*CW); ctx.stroke(); }
      board.forEach((row,y)=>row.forEach((v,x)=>{ if(v) blk(x*CW,y*CW,COL[v]); }));
      if(cur&&!dead){
        let gy=cur.y; while(!hit(cur.m,cur.x,gy+1)) gy++;
        cur.m.forEach((row,y)=>row.forEach((v,x)=>{
          if(v) px(ctx,(cur.x+x)*CW+1,(gy+y)*CW+1,CW-2,CW-2,"rgba(233,227,208,.12)");
        }));
        cur.m.forEach((row,y)=>row.forEach((v,x)=>{ if(v&&cur.y+y>=0) blk((cur.x+x)*CW,(cur.y+y)*CW,COL[v]); }));
      }
      px(ctx,FW,0,PANEL,H,PAL.dim2);
      txt(ctx,"NEXT",FW+PANEL/2,18,10,PAL.tx3,"center");
      if(next){
        const w=next[0].length, s=14;
        const ox=FW+PANEL/2-w*s/2;
        next.forEach((row,y)=>row.forEach((v,x)=>{ if(v) blk(ox+x*s,36+y*s,COL[v],s); }));
      }
      txt(ctx,"LEVEL",FW+PANEL/2,104,10,PAL.tx3,"center");
      txt(ctx,String(level),FW+PANEL/2,126,20,PAL.amber,"center");
      txt(ctx,"LINES",FW+PANEL/2,158,10,PAL.tx3,"center");
      txt(ctx,String(lines),FW+PANEL/2,180,20,PAL.olive,"center");
      api.fx.draw(ctx);
    }
    spawn();
    api.info("けした段 <b>0</b>／レベル <b>1</b>");
    api.controls({dpad:"lrd", a:{label:"回転",code:"ArrowUp"}, b:{label:"落下",code:"Space"}, legend:"←→ 移動<br>↓ 早く落とす"});
    let rep=0;
    api.loop(dt=>{
      if(dead) return;
      rep-=dt;
      const L=Input.held("ArrowLeft"), R=Input.held("ArrowRight");
      if(Input.hit("ArrowLeft")){ move(-1); rep=.17; }
      else if(Input.hit("ArrowRight")){ move(1); rep=.17; }
      else if(rep<=0&&(L||R)){ move(L?-1:1); rep=.055; }
      if(Input.hit("ArrowUp")) turn();
      if(Input.hit("Space")) hard();
      const soft=Input.held("ArrowDown");
      fall+=dt*(soft?14:1);
      const need=Math.max(.07, .62-(level-1)*.055);
      while(fall>=need){
        fall-=need;
        if(!hit(cur.m,cur.x,cur.y+1)){ cur.y++; if(soft) api.add(1); } else lock();
        if(dead) break;
      }
      render();
    });
  }
});

/* ============================================================
   02 スネーク
   ============================================================ */
GAMES.push({
  id:"snake", title:"スネーク", cat:"アクション",
  ctrl:"十字キーで方向転換",
  about:"エサを食べて伸びる。壁と自分に当たるとアウト",
  kw:"snake hebi",
  hint:"長くなるほど加速します。壁ぎわを使って体をかわすのがコツ。",
  thumb(c,W,H){
    for(let y=0;y<H;y+=8) for(let x=0;x<W;x+=8) if((x/8+y/8)%2===0) px(c,x,y,8,8,PAL.dim2);
    const b=[[5,6],[6,6],[7,6],[8,6],[8,7],[8,8],[9,8],[10,8]];
    b.forEach(([x,y],i)=> px(c,x*8+1,y*8+1,6,6,i===b.length-1?PAL.olive:"rgba(147,160,92,.6)"));
    px(c,14*8+2,4*8+2,4,4,PAL.red);
    txt(c,"ACTION",150,10,9,PAL.dim,"right");
  },
  start(api){
    const N=20, CW=19;
    const {canvas,ctx,W,H}=api.canvas(N*CW,N*CW,380);
    let snake=[{x:9,y:10},{x:8,y:10},{x:7,y:10}];
    let dir={x:1,y:0}, queue=[], food=null, acc=0, dead=false, eaten=0;
    function place(){
      const free=[];
      for(let y=0;y<N;y++) for(let x=0;x<N;x++) if(!snake.some(s=>s.x===x&&s.y===y)) free.push({x,y});
      food=free[Math.floor(Math.random()*free.length)]||null;
    }
    place();
    function setDir(nx,ny){
      const last=queue.length?queue[queue.length-1]:dir;
      if(last.x===-nx&&last.y===-ny) return;
      if(last.x===nx&&last.y===ny) return;
      if(queue.length<2) queue.push({x:nx,y:ny});
    }
    function tick(){
      if(queue.length) dir=queue.shift();
      const h={x:snake[0].x+dir.x, y:snake[0].y+dir.y};
      if(h.x<0||h.y<0||h.x>=N||h.y>=N||snake.some((s,i)=>i<snake.length-1&&s.x===h.x&&s.y===h.y)){
        dead=true; api.fx.shake(8);
        api.fx.burst(snake[0].x*CW+CW/2, snake[0].y*CW+CW/2, {n:16, col:PAL.red, sp:130});
        api.over({title:"ゲームオーバー", msg:"エサ "+eaten+"個／体長 "+snake.length});
        return;
      }
      snake.unshift(h);
      if(food&&h.x===food.x&&h.y===food.y){
        eaten++; const g=10+eaten; api.add(g);
        api.fx.burst(food.x*CW+CW/2, food.y*CW+CW/2, {n:8, col:PAL.red, sp:85});
        api.fx.pop(food.x*CW+CW/2, food.y*CW, "+"+g, PAL.amber);
        api.sfx.good(); place();
      } else snake.pop();
      api.info("体長 <b>"+snake.length+"</b>／エサ <b>"+eaten+"</b>");
    }
    api.controls({dpad:true, legend:"十字キーで<br>すすむ向きをかえる"});
    api.swipe(canvas,d=>{
      if(d==="left") setDir(-1,0); else if(d==="right") setDir(1,0);
      else if(d==="up") setDir(0,-1); else setDir(0,1);
    });
    api.info("体長 <b>3</b>／エサ <b>0</b>");
    api.loop(dt=>{
      if(!dead){
        if(Input.hit("ArrowLeft")) setDir(-1,0);
        if(Input.hit("ArrowRight")) setDir(1,0);
        if(Input.hit("ArrowUp")) setDir(0,-1);
        if(Input.hit("ArrowDown")) setDir(0,1);
        const sp=Math.max(.055,.14-eaten*.0035);
        acc+=dt;
        while(acc>=sp&&!dead){ acc-=sp; tick(); }
      }
      px(ctx,0,0,W,H,PAL.screen);
      for(let y=0;y<N;y++) for(let x=0;x<N;x++) if((x+y)%2===0) px(ctx,x*CW,y*CW,CW,CW,PAL.dim2);
      if(food){
        const t=performance.now()/260;
        const w=6+Math.sin(t)*1.2;
        px(ctx,food.x*CW+CW/2-w/2, food.y*CW+CW/2-w/2, w, w, PAL.red);
        px(ctx,food.x*CW+CW/2-1, food.y*CW+3, 2, 3, PAL.olive);
      }
      snake.forEach((s,i)=>{
        if(i===0){
          px(ctx,s.x*CW+1,s.y*CW+1,CW-2,CW-2,PAL.olive);
          const ex=dir.x, ey=dir.y;
          px(ctx,s.x*CW+CW/2+ex*4-(ey?3:1)-1, s.y*CW+CW/2+ey*4-(ex?3:1)-1, 2,2, PAL.screen);
          px(ctx,s.x*CW+CW/2+ex*4+(ey?3:1)-1, s.y*CW+CW/2+ey*4+(ex?3:1)-1, 2,2, PAL.screen);
        } else {
          const f=1-i/(snake.length+6);
          px(ctx,s.x*CW+2,s.y*CW+2,CW-4,CW-4,"rgba(147,160,92,"+(0.3+f*0.55).toFixed(2)+")");
        }
      });
      api.fx.draw(ctx);
    });
  }
});

/* ============================================================
   03 ブロックくずし
   ============================================================ */
GAMES.push({
  id:"breakout", title:"ブロックくずし", cat:"アクション",
  ctrl:"←→ でバー移動／A で発射",
  about:"ボールを跳ね返してブロックを全部こわす",
  kw:"breakout block",
  hint:"バーの端で当てると角度がつきます。全部こわすとステージが上がって速くなります。",
  thumb(c,W,H){
    const cols=[PAL.red,PAL.amber,PAL.olive];
    for(let r=0;r<3;r++) for(let i=0;i<7;i++) px(c,8+i*21,16+r*11,19,8,cols[r]);
    px(c,66,92,30,5,PAL.blue);
    px(c,78,76,5,5,PAL.bone);
    txt(c,"ACTION",150,10,9,PAL.dim,"right");
  },
  start(api){
    const {canvas,ctx,W,H}=api.canvas(380,480,420);
    const COLS=8, ROWS=5, BW=(W-24)/COLS, BH=19;
    let bricks=[], px0=W/2, pw=72, lives=3, stage=1, ball=null, started=false, dead=false;
    const COLR=[PAL.red,PAL.amber,PAL.olive,PAL.teal,PAL.blue];
    function build(){
      bricks=[];
      for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++)
        bricks.push({x:12+c*BW,y:58+r*(BH+6),w:BW-5,h:BH,c:COLR[r]});
    }
    function reset(){ ball={x:px0,y:H-44,vx:0,vy:0,r:5.5,sp:225+stage*25}; started=false; }
    build(); reset();
    function launch(){
      if(started||dead) return;
      started=true;
      const a=(-90+(Math.random()*50-25))*Math.PI/180;
      ball.vx=Math.cos(a)*ball.sp; ball.vy=Math.sin(a)*ball.sp;
      api.sfx.tap();
    }
    api.info("のこり <b>3</b>／ステージ <b>1</b>");
    api.controls({dpad:"lr", a:{label:"発射",code:"Space"}, legend:"←→ でバーを動かす"});
    api.on(canvas,"pointermove",e=>{ px0=Math.max(pw/2,Math.min(W-pw/2,api.pos(canvas,e).x)); });
    api.on(canvas,"pointerdown",e=>{ px0=Math.max(pw/2,Math.min(W-pw/2,api.pos(canvas,e).x)); launch(); });
    api.loop(dt=>{
      if(!dead){
        if(Input.held("ArrowLeft")) px0-=430*dt;
        if(Input.held("ArrowRight")) px0+=430*dt;
        if(Input.hit("Space")) launch();
        px0=Math.max(pw/2,Math.min(W-pw/2,px0));
        if(!started){ ball.x=px0; ball.y=H-44; }
        else {
          for(let s=0;s<3;s++){
            ball.x+=ball.vx*dt/3; ball.y+=ball.vy*dt/3;
            if(ball.x<ball.r){ ball.x=ball.r; ball.vx*=-1; api.sfx.tap(); }
            if(ball.x>W-ball.r){ ball.x=W-ball.r; ball.vx*=-1; api.sfx.tap(); }
            if(ball.y<ball.r+30){ ball.y=ball.r+30; ball.vy*=-1; api.sfx.tap(); }
            if(ball.vy>0&&ball.y>H-32-ball.r&&ball.y<H-16&&Math.abs(ball.x-px0)<pw/2+ball.r){
              const off=(ball.x-px0)/(pw/2), ang=off*1.05;
              const sp=Math.hypot(ball.vx,ball.vy)*1.012;
              ball.vx=Math.sin(ang)*sp; ball.vy=-Math.abs(Math.cos(ang))*sp;
              ball.y=H-32-ball.r; api.sfx.tap(); api.fx.shake(1.6);
            }
            for(let i=0;i<bricks.length;i++){
              const b=bricks[i];
              if(ball.x>b.x-ball.r&&ball.x<b.x+b.w+ball.r&&ball.y>b.y-ball.r&&ball.y<b.y+b.h+ball.r){
                const ox=Math.min(Math.abs(ball.x-b.x),Math.abs(ball.x-(b.x+b.w)));
                const oy=Math.min(Math.abs(ball.y-b.y),Math.abs(ball.y-(b.y+b.h)));
                if(ox<oy) ball.vx*=-1; else ball.vy*=-1;
                api.fx.burst(b.x+b.w/2,b.y+b.h/2,{n:6,col:b.c,sp:80,life:.35});
                bricks.splice(i,1); api.add(10*stage); api.sfx.good(); api.fx.shake(1.2);
                break;
              }
            }
            if(ball.y>H+10){
              lives--; api.fx.shake(7);
              if(lives<=0){ dead=true; api.over({title:"ゲームオーバー", msg:"ステージ "+stage+" でおわり"}); return; }
              api.sfx.bad(); reset(); break;
            }
          }
          if(!bricks.length){ stage++; api.add(150*stage); api.sfx.great(); api.fx.shake(4); build(); reset(); }
        }
        api.info("のこり <b>"+lives+"</b>／ステージ <b>"+stage+"</b>");
      }
      px(ctx,0,0,W,H,PAL.screen);
      px(ctx,0,0,W,30,PAL.dim2);
      txt(ctx,"STAGE "+stage,10,15,11,PAL.tx3);
      for(let i=0;i<lives;i++) px(ctx,W-14-i*11,11,7,7,PAL.red);
      bricks.forEach(b=>{
        px(ctx,b.x,b.y,b.w,b.h,b.c);
        px(ctx,b.x+2,b.y+2,b.w-4,3,"rgba(255,255,255,.28)");
      });
      px(ctx,px0-pw/2,H-32,pw,9,PAL.blue);
      px(ctx,px0-pw/2+2,H-31,pw-4,3,"rgba(255,255,255,.3)");
      px(ctx,ball.x-ball.r,ball.y-ball.r,ball.r*2,ball.r*2,PAL.bone);
      if(!started) txt(ctx,"Aボタン／画面タップで発射",W/2,H-66,12,PAL.tx2,"center");
      api.fx.draw(ctx);
    });
  }
});

/* ============================================================
   04 ナンバーマージ
   ============================================================ */
GAMES.push({
  id:"merge", title:"ナンバーマージ", cat:"パズル",
  ctrl:"十字キー／スワイプでスライド",
  about:"同じ数字をくっつけて2048をめざす",
  kw:"2048 merge suuji",
  hint:"大きい数字は隅に寄せる。一方向は使わないように我慢すると崩れにくくなります。",
  fmt:v=>Number(v).toLocaleString(),
  thumb(c,W,H){
    const v=[[2,4,0,8],[0,16,32,8],[64,0,4,2],[128,256,0,4]];
    const C={2:PAL.dim,4:PAL.dim,8:PAL.blue,16:PAL.teal,32:PAL.olive,64:PAL.amber,128:PAL.red,256:PAL.plum};
    for(let y=0;y<4;y++) for(let x=0;x<4;x++){
      const n=v[y][x];
      px(c,30+x*26,4+y*26,24,24,n?C[n]:PAL.dim2);
      if(n) txt(c,String(n),30+x*26+12,4+y*26+13,n>99?9:11,n<=4?PAL.bone:PAL.screen,"center");
    }
  },
  start(api){
    const box=document.createElement("div");
    box.style.cssText="width:100%;max-width:330px";
    const bd=document.createElement("div");
    bd.style.cssText="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;width:100%;aspect-ratio:1/1;background:#141a13;padding:7px;border:1px solid #39412f;border-radius:4px";
    box.appendChild(bd); api.host.appendChild(box);
    const TC={2:"#2c3426",4:"#3a4430",8:PAL.blue,16:PAL.teal,32:PAL.olive,64:PAL.amber,128:PAL.red,256:PAL.plum,512:"#b58fd0",1024:"#d9c27a",2048:PAL.bone};
    let g=Array.from({length:4},()=>Array(4).fill(0)), top=2, won=false;
    function add(){
      const free=[];
      for(let y=0;y<4;y++) for(let x=0;x<4;x++) if(!g[y][x]) free.push([y,x]);
      if(!free.length) return;
      const [y,x]=free[Math.floor(Math.random()*free.length)];
      g[y][x]=Math.random()<.88?2:4;
    }
    function render(){
      bd.innerHTML="";
      for(let y=0;y<4;y++) for(let x=0;x<4;x++){
        const v=g[y][x], d=document.createElement("div");
        const col=TC[v]||PAL.bone;
        d.style.cssText="display:grid;place-items:center;border-radius:3px;font-family:"+FONT+
          ";font-size:"+(v>=1024?15:v>=128?19:23)+"px;background:"+(v?col:"rgba(147,160,92,.07)")+
          ";color:"+(v===2||v===4?PAL.bone:PAL.screen)+";aspect-ratio:1/1";
        d.textContent=v||"";
        bd.appendChild(d);
      }
      api.info("いちばん大きい数 <b>"+top+"</b>");
    }
    function slide(arr){
      const a=arr.filter(v=>v); let gained=0;
      for(let i=0;i<a.length-1;i++){
        if(a[i]===a[i+1]){ a[i]*=2; gained+=a[i]; top=Math.max(top,a[i]); a.splice(i+1,1); }
      }
      while(a.length<4) a.push(0);
      return {a,gained};
    }
    function lines(dir){
      const out=[];
      for(let i=0;i<4;i++){
        if(dir==="left") out.push(g[i].slice());
        else if(dir==="right") out.push(g[i].slice().reverse());
        else if(dir==="up") out.push([g[0][i],g[1][i],g[2][i],g[3][i]]);
        else out.push([g[3][i],g[2][i],g[1][i],g[0][i]]);
      }
      return out;
    }
    function put(dir,res){
      for(let i=0;i<4;i++){
        const a=res[i];
        if(dir==="left") g[i]=a.slice();
        else if(dir==="right") g[i]=a.slice().reverse();
        else if(dir==="up"){ for(let j=0;j<4;j++) g[j][i]=a[j]; }
        else { for(let j=0;j<4;j++) g[3-j][i]=a[j]; }
      }
    }
    function can(){
      for(let y=0;y<4;y++) for(let x=0;x<4;x++){
        if(!g[y][x]) return true;
        if(x<3&&g[y][x]===g[y][x+1]) return true;
        if(y<3&&g[y][x]===g[y+1][x]) return true;
      }
      return false;
    }
    function move(dir){
      if(won) return;
      const before=JSON.stringify(g);
      const ls=lines(dir), res=[]; let gained=0;
      ls.forEach(l=>{ const r=slide(l); res.push(r.a); gained+=r.gained; });
      put(dir,res);
      if(JSON.stringify(g)===before) return;
      if(gained){ api.add(gained); api.sfx.good(); api.info("いちばん大きい数 <b>"+top+"</b>　<b>+"+gained+"</b>"); }
      else api.sfx.tap();
      add(); render();
      if(top>=2048&&!won){ won=true; api.over({title:"2048 たっせい", msg:"もう一度あそぶと新しい盤面になります"}); return; }
      if(!can()) api.over({title:"てづまり", msg:"いちばん大きい数 "+top});
    }
    add(); add(); render();
    api.controls({dpad:true, legend:"十字キーで<br>タイルをすべらせる"});
    api.swipe(bd,d=>move(d));
    api.loop(()=>{
      if(Input.hit("ArrowLeft")) move("left");
      if(Input.hit("ArrowRight")) move("right");
      if(Input.hit("ArrowUp")) move("up");
      if(Input.hit("ArrowDown")) move("down");
    });
  }
});

/* ============================================================
   05 マインスイープ
   ============================================================ */
GAMES.push({
  id:"mines", title:"マインスイープ", cat:"パズル",
  ctrl:"タップであける／長押しで旗",
  about:"9×9に10個の爆弾。数字をヒントに安全なマスをあける",
  kw:"minesweeper bakudan",
  hint:"最初の1手は必ず安全です。早くクリアするほど高得点。",
  thumb(c,W,H){
    const s=13, ox=28, oy=4;
    const grid=[[1,1,2,"",""],[1,"f",1,"",""],[1,1,1,1,1],["","","",1,"f"],["","","",1,1]];
    for(let y=0;y<5;y++) for(let x=0;x<5;x++){
      const v=grid[y][x];
      const open=v!==""&&v!=="f";
      px(c,ox+x*s,oy+y*s,s-1,s-1, v==="f"?PAL.dim:open?"rgba(147,160,92,.14)":PAL.dim);
      if(open) txt(c,String(v),ox+x*s+(s-1)/2,oy+y*s+(s-1)/2+1,10,v===1?PAL.blue:PAL.olive,"center");
      if(v==="f"){ px(c,ox+x*s+5,oy+y*s+3,2,7,PAL.bone); px(c,ox+x*s+7,oy+y*s+3,4,3,PAL.red); }
    }
    for(let y=5;y<8;y++) for(let x=0;x<5;x++) px(c,ox+x*s,oy+y*s,s-1,s-1,PAL.dim);
    txt(c,"PUZZLE",150,10,9,PAL.dim,"right");
  },
  start(api){
    const N=9, MINES=10;
    const wrap=document.createElement("div");
    wrap.style.cssText="width:100%;max-width:330px;display:flex;flex-direction:column;gap:9px;align-items:center";
    const bd=document.createElement("div");
    bd.style.cssText="display:grid;grid-template-columns:repeat(9,1fr);gap:3px;width:100%;aspect-ratio:1/1";
    const btn=document.createElement("button");
    btn.className="key alt"; btn.style.cssText="width:100%;max-width:200px";
    wrap.appendChild(bd); wrap.appendChild(btn); api.host.appendChild(wrap);
    const FLAG='<svg viewBox="0 0 12 12" width="13" height="13" aria-hidden="true"><rect x="4" y="2" width="1.4" height="8" fill="'+PAL.bone+'"/><path d="M5.4 2.2 H10 L8.4 4 L10 5.8 H5.4 Z" fill="'+PAL.red+'"/></svg>';
    const MINE='<svg viewBox="0 0 12 12" width="13" height="13" aria-hidden="true"><circle cx="6" cy="6.4" r="3.2" fill="'+PAL.red+'"/><rect x="5.5" y="1.6" width="1" height="2.2" fill="'+PAL.bone+'"/><rect x="1.4" y="5.9" width="2" height="1" fill="'+PAL.bone+'"/><rect x="8.6" y="5.9" width="2" height="1" fill="'+PAL.bone+'"/></svg>';
    const NC=["",PAL.blue,PAL.olive,PAL.amber,PAL.plum,PAL.red,PAL.teal,PAL.bone,PAL.tx2];
    let mine=[],open=[],flag=[],placed=false,done=false,t0=0,flagMode=false,opened=0;
    for(let i=0;i<N*N;i++){ mine[i]=0; open[i]=0; flag[i]=0; }
    const setMode=v=>{ flagMode=v; btn.textContent=flagMode?"旗モード ON":"旗モード OFF"; btn.style.borderColor=flagMode?PAL.red:"#4a533d"; btn.style.color=flagMode?PAL.red:PAL.tx2; };
    setMode(false);
    btn.onclick=()=>setMode(!flagMode);
    const nb=i=>{
      const x=i%N,y=(i/N)|0,out=[];
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){
        if(!dx&&!dy) continue;
        const nx=x+dx,ny=y+dy;
        if(nx<0||ny<0||nx>=N||ny>=N) continue;
        out.push(ny*N+nx);
      }
      return out;
    };
    const count=i=>nb(i).filter(j=>mine[j]).length;
    function place(safe){
      const ban=new Set([safe,...nb(safe)]);
      let left=MINES,tries=0;
      while(left>0&&tries<5000){
        tries++;
        const i=Math.floor(Math.random()*N*N);
        if(mine[i]||ban.has(i)) continue;
        mine[i]=1; left--;
      }
      placed=true; t0=performance.now();
    }
    function reveal(i){
      if(open[i]||flag[i]) return;
      open[i]=1; opened++;
      if(count(i)===0&&!mine[i]) nb(i).forEach(j=>{ if(!open[j]) reveal(j); });
    }
    function render(){
      bd.innerHTML="";
      for(let i=0;i<N*N;i++){
        const d=document.createElement("div");
        d.dataset.i=i;
        d.className="msq";
        let bg="#2b3326", html="", col=PAL.bone;
        if(open[i]){
          const n=count(i);
          bg = mine[i]?"rgba(200,85,64,.3)":"rgba(147,160,92,.1)";
          html = mine[i]?MINE:(n?String(n):"");
          col = NC[n]||PAL.bone;
        } else if(flag[i]) html=FLAG;
        d.style.cssText="display:grid;place-items:center;aspect-ratio:1/1;border-radius:2px;background:"+bg+
          ";font-family:"+FONT+";font-size:14px;color:"+col+";cursor:pointer;user-select:none;-webkit-user-select:none";
        d.innerHTML=html;
        bd.appendChild(d);
      }
      const f=flag.reduce((a,b)=>a+b,0);
      api.info("のこり爆弾 <b>"+(MINES-f)+"</b>"+(placed?"／"+(((performance.now()-t0)/1000)|0)+"秒":""));
    }
    function lose(){
      done=true;
      for(let i=0;i<N*N;i++) if(mine[i]) open[i]=1;
      render(); api.fx.shake(9);
      api.over({title:"ばくはつ", score:0, save:false, value:"BOOM", msg:"爆弾をふみました"});
    }
    function win(){
      if(opened<N*N-MINES) return false;
      done=true;
      const sec=(performance.now()-t0)/1000;
      const sc=Math.max(150,Math.round(1600-sec*12));
      api.score(sc); render(); api.sfx.great();
      api.over({title:"クリア", score:sc, msg:sec.toFixed(1)+"秒でクリア"});
      return true;
    }
    function tap(i,isFlag){
      if(done) return;
      if(!placed){ if(isFlag) return; place(i); }
      if(isFlag||flagMode){
        if(!open[i]) flag[i]=flag[i]?0:1;
        api.sfx.tap(); render(); return;
      }
      if(flag[i]) return;
      if(mine[i]){ api.sfx.bad(); lose(); return; }
      reveal(i); api.sfx.tap();
      if(!win()) render();
    }
    let holdT=null, held=false;
    api.on(bd,"pointerdown",e=>{
      if(e.button&&e.button!==0) return;
      const t=e.target.closest(".msq"); if(!t) return;
      held=false;
      holdT=setTimeout(()=>{ held=true; tap(+t.dataset.i,true); },420);
    });
    api.on(bd,"pointerup",e=>{
      clearTimeout(holdT);
      if(e.button&&e.button!==0) return;
      const t=e.target.closest(".msq"); if(!t) return;
      if(!held) tap(+t.dataset.i,false);
    });
    api.on(bd,"pointercancel",()=>clearTimeout(holdT));
    api.on(bd,"pointerleave",()=>clearTimeout(holdT));
    api.on(bd,"contextmenu",e=>{
      e.preventDefault();
      const t=e.target.closest(".msq"); if(t) tap(+t.dataset.i,true);
    });
    api.controls(null);
    render();
    api.every(500,()=>{ if(!done&&placed) render(); });
  }
});
