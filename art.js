/* art.js — 23本のボックスアート。
   どれも同じ決まりで描く。光源は上三分の一にひとつだけ置き、
   主役は下半分に置いて影を落とす。最後に同じラベル加工をかける。
   そろえているのはこの三つで、絵柄がばらけないのはこのため。 */
const ART=(()=>{
  const P=PAL;

  /* ---- 色 ---- core.js の TONE をそのまま使う。計算の決まりを一か所に保つ ---- */
  const rgb = c => TONE.parse(c) || [0,0,0];
  const mix = (a,b,t) => TONE.mix(a,b,t);
  const dk  = (c,t) => TONE.dark(c,t);
  const lt  = (c,t) => TONE.light(c,t);
  function alpha(h,a){ const c=rgb(h); return "rgba("+c[0]+","+c[1]+","+c[2]+","+a+")"; }

  /* ---- 乱数。毎回同じ絵が出るように種を固定する ---- */
  function seed(n){ let s=n>>>0||1; return ()=>{ s^=s<<13; s>>>=0; s^=s>>17; s^=s<<5; s>>>=0; return s/4294967296; }; }

  /* ---- 形 ---- */
  function fill(c,col,fn){ c.save(); c.fillStyle=col; c.beginPath(); fn(c); c.fill(); c.restore(); }
  function box(c,x,y,w,h,col){ c.fillStyle=col; c.fillRect(x,y,w,h); }
  function poly(c,pts,col){ c.save(); c.fillStyle=col; c.beginPath(); c.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++) c.lineTo(pts[i][0],pts[i][1]); c.closePath(); c.fill(); c.restore(); }
  function line(c,x0,y0,x1,y1,col,w){ c.save(); c.strokeStyle=col; c.lineWidth=w||1; c.lineCap="round";
    c.beginPath(); c.moveTo(x0,y0); c.lineTo(x1,y1); c.stroke(); c.restore(); }
  function circ(c,x,y,r,col){ c.save(); c.fillStyle=col; c.beginPath(); c.arc(x,y,r,0,7); c.fill(); c.restore(); }
  function ring(c,x,y,r,col,w){ c.save(); c.strokeStyle=col; c.lineWidth=w||1; c.beginPath(); c.arc(x,y,r,0,7); c.stroke(); c.restore(); }

  /* ---- 空。上から下への階調 ---- */
  function sky(c,W,H,top,bot){ const g=c.createLinearGradient(0,0,0,H);
    g.addColorStop(0,top); g.addColorStop(1,bot); c.fillStyle=g; c.fillRect(0,0,W,H); }

  /* ---- 光源。これが絵の芯になる ---- */
  function glow(c,x,y,r,col,a){
    const g=c.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,alpha(col,a===undefined?0.85:a));
    g.addColorStop(0.45,alpha(col,(a===undefined?0.85:a)*0.3));
    g.addColorStop(1,alpha(col,0));
    c.save(); c.fillStyle=g; c.fillRect(x-r,y-r,r*2,r*2); c.restore();
  }

  /* ---- 光線。光源から下へ広がる筋 ---- */
  function rays(c,x,y,W,H,col,n,a){
    c.save(); c.globalAlpha=a===undefined?0.16:a; c.fillStyle=col;
    for(let i=0;i<(n||5);i++){
      const t=(i+0.5)/(n||5), sx=(t-0.5)*W*2.2;
      c.beginPath(); c.moveTo(x-3,y); c.lineTo(x+3,y);
      c.lineTo(x+sx+10,H+8); c.lineTo(x+sx-10,H+8); c.closePath(); c.fill();
    }
    c.restore();
  }

  /* ---- 奥行きのある床。消失点に向かう線 ---- */
  function floor(c,W,H,hz,vx,col,n){
    box(c,0,hz,W,H-hz,col);
    c.save(); c.strokeStyle=alpha(P.bone,0.1); c.lineWidth=1;
    for(let i=0;i<=(n||9);i++){ const x=(i/(n||9))*W*3-W;
      c.beginPath(); c.moveTo(vx,hz); c.lineTo(x,H); c.stroke(); }
    let y=hz, step=1.6;
    while(y<H){ c.beginPath(); c.moveTo(0,y); c.lineTo(W,y); c.stroke(); y+=step; step*=1.45; }
    c.restore();
  }

  /* ---- 影。主役を床に接地させる ---- */
  function shadow(c,x,y,w,h,a){ c.save(); c.fillStyle="rgba(0,0,0,"+(a||0.3)+")";
    c.beginPath(); c.ellipse(x,y,w,h,0,0,7); c.fill(); c.restore(); }

  /* ---- 立方体。等角投影 ---- */
  function cube(c,x,y,s,col){
    const h=s*0.5;
    poly(c,[[x,y-h],[x+s,y],[x,y+h],[x-s,y]],lt(col,0.22));          /* 天面 */
    poly(c,[[x-s,y],[x,y+h],[x,y+h+s],[x-s,y+s]],dk(col,0.38));      /* 左面 */
    poly(c,[[x+s,y],[x,y+h],[x,y+h+s],[x+s,y+s]],dk(col,0.16));      /* 右面 */
  }

  /* ---- 人。小さいブロック体 ---- */
  function guy(c,x,y,s,col,face){
    const bw=s*0.74, hw=s*0.82, hh=s*0.46;
    box(c,x-bw/2,y-s*0.3,bw*0.4,s*0.3,dk(col,0.36));        /* 脚 */
    box(c,x+bw*0.08,y-s*0.3,bw*0.4,s*0.3,dk(col,0.28));
    box(c,x-bw/2,y-s*0.86,bw,s*0.58,col);                   /* 胴 */
    box(c,x-bw/2,y-s*0.86,bw,s*0.12,lt(col,0.26));
    box(c,x-hw/2,y-s*0.86-hh,hw,hh,lt(col,0.14));           /* 頭 */
    box(c,x-hw/2,y-s*0.86-hh,hw,hh*0.26,lt(col,0.4));
    if(face!==undefined){
      box(c,x+(face>0?hw*0.08:-hw*0.3),y-s*0.86-hh*0.66,hw*0.22,hh*0.3,P.screen);
    }
  }


  /* ---- ラベル加工。全23枚に同じものをかける ---- */
  function label(c,W,H,key){
    const r=seed(key||7);
    /* 周辺減光 */
    const g=c.createRadialGradient(W*0.5,H*0.42,H*0.18,W*0.5,H*0.5,H*0.95);
    g.addColorStop(0,"rgba(0,0,0,0)"); g.addColorStop(1,"rgba(0,0,0,0.42)");
    c.save(); c.fillStyle=g; c.fillRect(0,0,W,H); c.restore();
    /* 紙の粒子 */
    c.save(); c.globalAlpha=0.055;
    for(let i=0;i<460;i++){ c.fillStyle=r()<0.5?"#ffffff":"#000000";
      c.fillRect(Math.floor(r()*W),Math.floor(r()*H),1,1); }
    c.restore();
    /* 版ずれ。下と右に一本だけ色をずらす */
    c.save(); c.globalAlpha=0.2; c.strokeStyle=P.red; c.lineWidth=1;
    c.strokeRect(4.5,5.5,W-9,H-10); c.restore();
    /* 内枠 */
    c.save(); c.strokeStyle=alpha(P.bone,0.62); c.lineWidth=1.5;
    c.strokeRect(4,4,W-8,H-8); c.restore();
    /* 角の切り欠き */
    c.save(); c.fillStyle=P.screen;
    [[0,0],[W,0],[0,H],[W,H]].forEach(([x,y])=>{ c.beginPath(); c.arc(x,y,3.2,0,7); c.fill(); });
    c.restore();
  }

  const S={};   /* 絵の本体をここに入れる */
  const api={
    rgb,mix,dk,lt,alpha,seed,fill,box,poly,line,circ,ring,sky,glow,rays,floor,shadow,cube,guy,label,S,
    has(id){ return !!S[id]; },
    draw(id,c,W,H){
      if(!S[id]) return false;
      c.save();
      try{ S[id](c,W,H); label(c,W,H,id.length*37+id.charCodeAt(0)); }
      catch(e){ c.restore(); return false; }
      c.restore();
      return true;
    }
  };
  return api;
})();

/* ===== 絵 その1 ===== */
(function(){
  const P=PAL, S=ART.S;
  const {box,poly,line,circ,ring,sky,glow,rays,floor,shadow,cube,guy,dk,lt,alpha,seed}=ART;

  /* 01 ブロックドロップ — 井戸の底から見上げる。光は真上のひとつ */
  /* 01 ブロックドロップ — 井戸の底から見上げる。光は真上のひとつ */
  S.blockdrop=function(c,W,H){
    sky(c,W,H,dk(P.dim,0.52),P.screen);
    const vx=W/2, op=19;
    poly(c,[[0,0],[vx-op,24],[vx-op,H],[0,H]],dk(P.olive,0.64));
    poly(c,[[W,0],[vx+op,24],[vx+op,H],[W,H]],dk(P.olive,0.76));
    for(let i=1;i<8;i++){ const y=24+i*i*2.4; if(y>H) break;
      line(c,0,y*0.7,vx-op,y,alpha(P.bone,0.07),1);
      line(c,W,y*0.7,vx+op,y,alpha(P.bone,0.05),1); }
    const g=c.createLinearGradient(0,6,0,30);
    g.addColorStop(0,alpha(P.bone,0.9)); g.addColorStop(0.55,alpha(P.bone,0.4));
    g.addColorStop(1,alpha(P.bone,0));
    c.save(); c.fillStyle=g; c.fillRect(vx-op+3,6,op*2-6,26); c.restore();
    glow(c,vx,16,46,P.bone,0.55);
    rays(c,vx,24,W,H,P.bone,4,0.09);
    const fall=[[vx-10,42,6,P.teal,[[0,0],[1,0],[2,0],[1,1]]],
                [vx+11,64,5.5,P.amber,[[0,0],[1,0],[1,1],[2,1]]],
                [vx-5,82,4.5,P.plum,[[0,0],[0,1],[1,0],[1,1]]]];
    fall.forEach(([x,y,s,col,cells])=>{ cells.forEach(([a,b])=>{
      box(c,x+a*s,y+b*s,s-1,s-1,col); box(c,x+a*s,y+b*s,s-1,1.5,lt(col,0.38)); }); });
    const stack=[[1,1,1,0,1,1,1],[1,1,0,1,1,1,1],[1,0,1,1,1,1,1]];
    const bw=(op*2-4)/7;
    stack.forEach((row,ry)=>row.forEach((v,rx)=>{ if(!v) return;
      const x=vx-op+2+rx*bw, y=H-5-(3-ry)*bw;
      box(c,x,y,bw-0.8,bw-0.8,ry===0?P.olive:dk(P.olive,0.32));
      box(c,x,y,bw-0.8,1.2,lt(P.olive,0.32)); }));
  };

  /* 02 スネーク — 真上から。光はりんご */
  /* 02 スネーク — 真上から。光はりんご */
  S.snake=function(c,W,H){
    box(c,0,0,W,H,dk(P.dim2,0.28));
    const r=seed(91);
    for(let y=14;y<H-14;y+=10) for(let x=14;x<W-14;x+=10)
      if(r()<0.45) box(c,x,y,10,10,alpha(P.olive,0.05));
    c.save(); c.strokeStyle=dk(P.olive,0.56); c.lineWidth=7;
    c.strokeRect(10.5,10.5,W-21,H-21); c.restore();
    c.save(); c.strokeStyle=alpha(P.screen,0.5); c.lineWidth=1; c.setLineDash([5,5]);
    c.strokeRect(10.5,10.5,W-21,H-21); c.restore();
    const pts=[[40,84],[40,62],[62,62],[62,40],[86,40],[86,66],[110,66],[110,44],[124,44]];
    c.save(); c.lineJoin="round"; c.lineCap="round";
    c.strokeStyle=dk(P.olive,0.42); c.lineWidth=15;
    c.beginPath(); c.moveTo(pts[0][0],pts[0][1]); pts.slice(1).forEach(p=>c.lineTo(p[0],p[1])); c.stroke();
    c.strokeStyle=P.olive; c.lineWidth=12;
    c.beginPath(); c.moveTo(pts[0][0],pts[0][1]); pts.slice(1).forEach(p=>c.lineTo(p[0],p[1])); c.stroke();
    c.strokeStyle=alpha(lt(P.olive,0.5),0.5); c.lineWidth=3;
    c.beginPath(); c.moveTo(pts[0][0]-2,pts[0][1]-2); pts.slice(1).forEach(p=>c.lineTo(p[0]-2,p[1]-2)); c.stroke();
    c.restore();
    const hx=124, hy=44;
    box(c,hx-6,hy-7,14,14,lt(P.olive,0.12));
    box(c,hx-6,hy-7,14,3,lt(P.olive,0.42));
    box(c,hx+1,hy-4,3,3,P.screen); box(c,hx+1,hy+2,3,3,P.screen);
    const ax=138, ay=78;
    glow(c,ax,ay,30,P.amber,0.8);
    circ(c,ax,ay,5.5,P.amber); circ(c,ax-1.8,ay-1.8,2,lt(P.amber,0.65));
    line(c,ax,ay-5,ax+2,ay-9,dk(P.olive,0.2),1.6);
  };

  /* 03 ブロックくずし — 壁をぶち抜く瞬間。光は衝突点 */
  S.breakout=function(c,W,H){
    sky(c,W,H,dk(P.blue,0.72),P.screen);
    const bw=W/9, bh=7;
    const cols=[P.red,P.amber,P.olive,P.teal];
    const hole=[[4,0],[4,1],[3,1],[5,1],[4,2]];
    for(let ry=0;ry<4;ry++) for(let rx=0;rx<9;rx++){
      if(hole.some(([a,b])=>a===rx&&b===ry)) continue;
      const x=rx*bw+1, y=14+ry*(bh+2), col=cols[ry];
      box(c,x,y,bw-2,bh,col); box(c,x,y,bw-2,1.5,lt(col,0.4)); box(c,x,y+bh-1.5,bw-2,1.5,dk(col,0.35)); }
    const ix=4.5*bw, iy=14+1.5*(bh+2);
    glow(c,ix,iy,34,P.bone,0.8);
    const r=seed(13);
    for(let i=0;i<14;i++){ const a=r()*6.283, d=8+r()*22;
      box(c,ix+Math.cos(a)*d,iy+Math.sin(a)*d,2.5,2.5,r()<0.5?P.amber:P.red); }
    c.save(); c.strokeStyle=alpha(P.bone,0.4); c.lineWidth=1.5; c.setLineDash([3,3]);
    c.beginPath(); c.moveTo(W*0.42,H-16); c.quadraticCurveTo(W*0.3,H*0.55,ix,iy+6); c.stroke(); c.restore();
    circ(c,ix,iy+8,3.2,P.bone);
    const px0=W*0.34, pw=34;
    shadow(c,px0+pw/2,H-7,pw*0.55,2.5,0.4);
    box(c,px0,H-16,pw,5,P.teal); box(c,px0,H-16,pw,1.8,lt(P.teal,0.45));
  };

  /* 04 ナンバーマージ — 二枚が融ける閃光。光はその一点 */
  /* 04 ナンバーマージ — 二枚が融ける閃光。光はその一点 */
  S.merge=function(c,W,H){
    sky(c,W,H,dk(P.dim,0.42),P.screen);
    poly(c,[[W*0.15,21],[W*0.85,21],[W*0.99,H-5],[W*0.01,H-5]],dk(P.olive,0.7));
    poly(c,[[W*0.165,24],[W*0.835,24],[W*0.965,H-9],[W*0.035,H-9]],dk(P.screen,0.12));
    const rows=4;
    function edge(t){ return [W*0.17+(W*0.045-W*0.17)*t, W*0.83+(W*0.955-W*0.83)*t]; }
    for(let ry=0;ry<rows;ry++){
      const t0=ry/rows, t1=(ry+1)/rows;
      const y0=25+t0*(H-35), y1=25+t1*(H-35);
      const [l0,r0]=edge(t0), [l1,r1]=edge(t1);
      for(let rx=0;rx<4;rx++){
        if(ry===1&&(rx===1||rx===2)) continue;
        const a=rx/4, b=(rx+1)/4;
        const base=((rx+ry)%3===0)?P.olive:P.teal;
        const col=dk(base,0.3+((rx*7+ry*3)%3)*0.12);
        poly(c,[[l0+(r0-l0)*a+1.5,y0+1.5],[l0+(r0-l0)*b-1.5,y0+1.5],
                [l1+(r1-l1)*b-1.5,y1-1.5],[l1+(r1-l1)*a+1.5,y1-1.5]],col);
        poly(c,[[l0+(r0-l0)*a+1.5,y0+1.5],[l0+(r0-l0)*b-1.5,y0+1.5],
                [l0+(r0-l0)*b-1.5,y0+4],[l0+(r0-l0)*a+1.5,y0+4]],lt(col,0.26));
      }
    }
    const fx=W*0.5, fy=25+0.37*(H-35);
    glow(c,fx,fy,42,P.bone,0.9);
    const r=seed(44);
    c.save(); c.globalAlpha=0.5;
    for(let i=0;i<10;i++){ const a=r()*6.283;
      line(c,fx,fy,fx+Math.cos(a)*(18+r()*18),fy+Math.sin(a)*(11+r()*12),P.amber,1.2); }
    c.restore();
    const tw=30, th=19;
    poly(c,[[fx-tw/2,fy-th/2],[fx+tw/2,fy-th/2],[fx+tw/2+3,fy+th/2],[fx-tw/2-3,fy+th/2]],P.amber);
    poly(c,[[fx-tw/2,fy-th/2],[fx+tw/2,fy-th/2],[fx+tw/2,fy-th/2+4],[fx-tw/2,fy-th/2+4]],lt(P.amber,0.5));
  };

  /* 05 マインスイープ — ふたを持ち上げた一枚から地雷。光はその隙間 */
  /* 05 マインスイープ — ふたを持ち上げた一枚から地雷。光はその隙間 */
  S.mines=function(c,W,H){
    sky(c,W,H,dk(P.dim,0.42),P.screen);
    const COLS=7, ROWS=4, ox=16, top=34;
    const open=[[0,1],[1,1],[2,2],[5,0],[6,2],[1,3],[4,3]];
    const flag=[[6,0],[3,3]];
    for(let gy=0;gy<ROWS;gy++){
      const sc=0.82+gy*0.12, cw=15*sc, lift=6*sc;
      const y=top+gy*17+gy*gy*0.9;
      const rowW=COLS*cw, rx=(W-rowW)/2;
      for(let gx=0;gx<COLS;gx++){
        const x=rx+gx*cw;
        if(open.some(([a,b])=>a===gx&&b===gy)){
          box(c,x+1,y,cw-2,cw*0.52,dk(P.dim2,0.3));
          box(c,x+1,y,cw-2,1,alpha(P.screen,0.6));
          continue;
        }
        box(c,x+1,y-lift,cw-2,cw*0.52+lift,dk(P.olive,0.46));
        box(c,x+1,y-lift,cw-2,lift,P.olive);
        box(c,x+1,y-lift,1.4,cw*0.52+lift,lt(P.olive,0.2));
        if(flag.some(([a,b])=>a===gx&&b===gy)){
          line(c,x+cw/2,y-lift-1,x+cw/2,y-lift-12*sc,P.bone,1.3);
          poly(c,[[x+cw/2,y-lift-12*sc],[x+cw/2+8*sc,y-lift-9*sc],[x+cw/2,y-lift-6*sc]],P.red);
        }
      }
    }
    const sc=0.82+2*0.12, cw=15*sc;
    const my=top+2*17+2*2*0.9, mx=(W-COLS*cw)/2+3*cw+cw/2;
    glow(c,mx,my-4,34,P.amber,0.85);
    circ(c,mx,my+3,5.2,dk(P.screen,0.35));
    for(let i=0;i<8;i++){ const a=i/8*6.283;
      line(c,mx+Math.cos(a)*4.4,my+3+Math.sin(a)*4.4,mx+Math.cos(a)*8,my+3+Math.sin(a)*8,dk(P.screen,0.35),1.7); }
    circ(c,mx-1.7,my+1.2,1.6,alpha(P.bone,0.75));
    c.save(); c.translate(mx+2,my-11); c.rotate(-0.3);
    box(c,-cw/2,-5,cw-2,9,lt(P.olive,0.1));
    box(c,-cw/2,-5,cw-2,2.4,lt(P.olive,0.4));
    c.restore();
  };

  /* 06 フラップジェット — 柱の隙間を抜ける。光は奥の太陽 */
  S.flap=function(c,W,H){
    sky(c,W,H,dk(P.amber,0.62),dk(P.plum,0.72));
    const sx=W*0.72, sy=H*0.3;
    glow(c,sx,sy,54,P.amber,0.75); circ(c,sx,sy,13,lt(P.amber,0.35));
    c.save(); c.globalAlpha=0.3;
    for(let i=0;i<4;i++) box(c,0,sy-14+i*11,W,3.5,P.screen);
    c.restore();
    const pil=[[18,0,40],[18,66,H],[62,0,26],[62,52,H],[108,0,52],[108,78,H],[146,0,34],[146,60,H]];
    pil.forEach(([x,y0,y1],i)=>{ const col=i%2?dk(P.olive,0.55):dk(P.olive,0.48);
      box(c,x,y0,26,y1-y0,col); box(c,x,y0,3,y1-y0,lt(col,0.18)); box(c,x+23,y0,3,y1-y0,dk(col,0.3));
      if(y0===0) box(c,x-3,y1-7,32,7,dk(col,0.12)); else box(c,x-3,y0,32,7,dk(col,0.12)); });
    const jx=88, jy=62;
    c.save(); c.globalAlpha=0.5;
    for(let i=1;i<6;i++) circ(c,jx-i*6,jy+i*1.2,3.4-i*0.5,P.teal);
    c.restore();
    poly(c,[[jx+9,jy],[jx-6,jy-5],[jx-3,jy],[jx-6,jy+5]],P.bone);
    poly(c,[[jx+9,jy],[jx-3,jy],[jx-6,jy+5]],dk(P.bone,0.25));
    circ(c,jx+2,jy-1,1.6,P.teal);
  };

  /* 07 エンドレスラン — 跳んだ瞬間。光は低い夕日 */
  S.runner=function(c,W,H){
    sky(c,W,H,dk(P.red,0.58),dk(P.plum,0.66));
    const sx=W*0.3, sy=H*0.52;
    glow(c,sx,sy,62,P.amber,0.6); circ(c,sx,sy,17,alpha(P.amber,0.55));
    poly(c,[[0,H*0.6],[28,H*0.48],[56,H*0.62],[90,H*0.5],[126,H*0.6],[W,H*0.52],[W,H],[0,H]],dk(P.plum,0.74));
    poly(c,[[0,H*0.68],[40,H*0.6],[78,H*0.7],[120,H*0.61],[W,H*0.69],[W,H],[0,H]],dk(P.screen,0.12));
    const gy=H-18;
    box(c,0,gy,W,H-gy,dk(P.olive,0.68));
    box(c,0,gy,W,2,P.olive);
    const r=seed(7);
    for(let i=0;i<16;i++) box(c,r()*W,gy+4+r()*12,3,1.4,alpha(P.bone,0.12));
    box(c,W*0.62,gy-11,9,11,dk(P.screen,0.2));
    box(c,W*0.84,gy-16,9,16,dk(P.screen,0.2));
    const rx=W*0.34, ry=gy-19;
    c.save(); c.globalAlpha=0.35; shadow(c,rx+4,gy+1,10,2.5,1); c.restore();
    c.save(); c.translate(rx,ry);
    poly(c,[[-7,-2],[3,-6],[7,2],[-3,7]],dk(P.bone,0.34));          /* 後ろ脚 */
    poly(c,[[-2,-4],[6,-9],[12,-2],[4,4]],dk(P.bone,0.2));          /* 前脚 */
    poly(c,[[-5,-14],[5,-16],[6,-1],[-4,1]],P.bone);                /* 胴 */
    poly(c,[[-9,-13],[-3,-17],[2,-9],[-4,-6]],dk(P.bone,0.26));     /* 後ろ腕 */
    poly(c,[[3,-16],[11,-19],[13,-13],[5,-10]],lt(P.bone,0.12));    /* 前腕 */
    box(c,-6,-25,12,9,P.bone);                                      /* 頭 */
    box(c,1,-23,3,3,P.screen);
    c.restore();
  };

  /* 08 もぐらたたき — 穴から顔を出した一匹。光は振り上げたハンマーの上 */
  /* 08 もぐらたたき — 穴から顔を出した一匹。光は振り上げたハンマーの上 */
  S.mole=function(c,W,H){
    sky(c,W,H,dk(P.teal,0.7),P.screen);
    glow(c,W*0.76,H*0.18,46,P.amber,0.45);
    const gy=H*0.38;
    poly(c,[[0,gy+5],[W,gy-3],[W,H],[0,H]],dk(P.olive,0.62));
    poly(c,[[0,gy+5],[W,gy-3],[W,gy+1],[0,gy+9]],dk(P.olive,0.34));
    const r=seed(5);
    for(let i=0;i<40;i++){ const x=r()*W, y=gy+8+r()*(H-gy-10);
      line(c,x,y,x+1.5,y-3,alpha(P.olive,0.16),1); }
    const holes=[[28,H*0.64],[80,H*0.57],[132,H*0.68],[54,H*0.86],[112,H*0.88]];
    holes.forEach(([x,y])=>{
      c.save(); c.fillStyle=dk(P.olive,0.3); c.beginPath(); c.ellipse(x,y+1.5,16,6.2,0,0,7); c.fill(); c.restore();
      c.save(); c.fillStyle=dk(P.screen,0.2); c.beginPath(); c.ellipse(x,y,14,5.2,0,0,7); c.fill(); c.restore();
    });
    const [mx,my]=holes[1];
    box(c,mx-9,my-19,18,13,dk(P.plum,0.14));
    box(c,mx-9,my-19,18,3.2,lt(P.plum,0.22));
    box(c,mx-13,my-14,4,6,dk(P.plum,0.3)); box(c,mx+9,my-14,4,6,dk(P.plum,0.3));
    box(c,mx-5.5,my-15,3.2,3.2,P.screen); box(c,mx+2.3,my-15,3.2,3.2,P.screen);
    box(c,mx-2.6,my-10,5.2,3,lt(P.bone,0.12));
    c.save(); c.fillStyle=dk(P.screen,0.2); c.beginPath();
    c.ellipse(mx,my,14,5.2,0,0,Math.PI); c.fill(); c.restore();
    c.save(); c.strokeStyle=dk(P.olive,0.3); c.lineWidth=2; c.beginPath();
    c.ellipse(mx,my,14,5.2,0,0,Math.PI); c.stroke(); c.restore();
    c.save(); c.translate(W*0.78,H*0.27); c.rotate(-0.55);
    box(c,-2,0,4,28,dk(P.olive,0.26));
    box(c,-12,-10,24,12,P.bone); box(c,-12,-10,24,3.4,lt(P.bone,0.45)); box(c,-12,-1,24,2,dk(P.bone,0.32));
    c.restore();
  };
})();

/* ===== 絵 その2 ===== */
(function(){
  const P=PAL, S=ART.S;
  const {box,poly,line,circ,ring,sky,glow,rays,floor,shadow,cube,guy,dk,lt,alpha,seed}=ART;

  /* 09 メモリーマッチ — 二枚がそろった瞬間。光はその二枚 */
  S.memory=function(c,W,H){
    sky(c,W,H,dk(P.plum,0.74),P.screen);
    const COLS=5, ROWS=3, cw=25, ch=26, ox=(W-COLS*cw)/2, oy=20;
    const up=[[1,1],[3,1]];
    for(let gy=0;gy<ROWS;gy++) for(let gx=0;gx<COLS;gx++){
      const x=ox+gx*cw, y=oy+gy*ch, face=up.some(([a,b])=>a===gx&&b===gy);
      shadow(c,x+cw/2,y+ch-5,cw*0.4,2.2,0.33);
      if(face){
        box(c,x+2,y+1,cw-5,ch-7,lt(P.bone,0.05));
        box(c,x+2,y+1,cw-5,2.4,lt(P.bone,0.4));
        circ(c,x+cw/2-1,y+ch/2-4,5.2,P.red);
        circ(c,x+cw/2-1,y+ch/2-4,2.2,lt(P.red,0.45));
      }else{
        box(c,x+2,y+1,cw-5,ch-7,dk(P.plum,0.4));
        box(c,x+2,y+1,cw-5,2.4,dk(P.plum,0.18));
        for(let i=0;i<3;i++) line(c,x+5,y+7+i*5,x+cw-8,y+7+i*5,alpha(P.plum,0.3),1.2);
      }
    }
    up.forEach(([gx,gy])=>glow(c,ox+gx*cw+cw/2,oy+gy*ch+ch/2-3,30,P.bone,0.55));
    c.save(); c.globalAlpha=0.45;
    line(c,ox+1*cw+cw/2,oy+1*ch+ch/2-3,ox+3*cw+cw/2,oy+1*ch+ch/2-3,P.amber,1.6);
    c.restore();
  };

  /* 10 リアクション — 合図が灯る瞬間。光はその円 */
  S.react=function(c,W,H){
    sky(c,W,H,dk(P.screen,0.1),P.screen);
    const cx=W*0.5, cy=H*0.42;
    glow(c,cx,cy,70,P.amber,0.8);
    ring(c,cx,cy,30,alpha(P.amber,0.22),8);
    ring(c,cx,cy,40,alpha(P.amber,0.1),5);
    circ(c,cx,cy,22,dk(P.amber,0.12));
    circ(c,cx,cy,22-3,P.amber);
    circ(c,cx-6,cy-7,6,lt(P.amber,0.55));
    c.save(); c.globalAlpha=0.5;
    for(let i=0;i<10;i++){ const a=i/10*6.283+0.2;
      line(c,cx+Math.cos(a)*34,cy+Math.sin(a)*34,cx+Math.cos(a)*44,cy+Math.sin(a)*44,P.amber,2); }
    c.restore();
    const hx=W*0.58, hy=H-6;
    poly(c,[[hx-13,H],[hx-9,hy-26],[hx-2,hy-30],[hx+3,hy-25],[hx+13,hy-8],[hx+12,H]],dk(P.bone,0.22));
    poly(c,[[hx-9,hy-26],[hx-2,hy-30],[hx+1,hy-18],[hx-7,hy-16]],P.bone);
    c.save(); c.globalAlpha=0.25;
    line(c,hx-4,hy-34,hx-4,hy-42,P.bone,2); line(c,hx+6,hy-32,hx+11,hy-39,P.bone,2);
    line(c,hx-14,hy-32,hx-19,hy-39,P.bone,2);
    c.restore();
  };

  /* 11 ターゲットシュート — 奥へ並ぶ的。光は手前の着弾 */
  S.aim=function(c,W,H){
    sky(c,W,H,dk(P.blue,0.78),P.screen);
    const hz=H*0.46, vx=W*0.52;
    ART.floor(c,W,H,hz,vx,dk(P.dim,0.42),11);
    const tg=[[W*0.22,hz+6,7],[W*0.74,hz+13,10],[W*0.4,hz+30,15]];
    tg.forEach(([x,y,r],i)=>{
      shadow(c,x,y+r*0.95,r*0.9,r*0.22,0.35);
      line(c,x,y,x,y+r*0.95,dk(P.olive,0.4),2);
      circ(c,x,y,r,P.bone); circ(c,x,y,r*0.66,P.red);
      circ(c,x,y,r*0.33,P.bone);
    });
    const [ax,ay,ar]=tg[2];
    glow(c,ax,ay,36,P.amber,0.75);
    const r=seed(61);
    for(let i=0;i<10;i++){ const a=r()*6.283, d=ar*0.4+r()*ar;
      box(c,ax+Math.cos(a)*d,ay+Math.sin(a)*d,2,2,P.amber); }
    circ(c,ax,ay,3,dk(P.screen,0.4));
    c.save(); c.strokeStyle=alpha(P.teal,0.85); c.lineWidth=1.6;
    c.beginPath(); c.arc(ax,ay,ar+8,0,7); c.stroke();
    [[0,-1],[0,1],[-1,0],[1,0]].forEach(([dx,dy])=>{
      c.beginPath(); c.moveTo(ax+dx*(ar+3),ay+dy*(ar+3));
      c.lineTo(ax+dx*(ar+14),ay+dy*(ar+14)); c.stroke(); });
    c.restore();
  };

  /* 12 スライドパズル — 一枚だけ抜けた枠。光は空いた穴 */
  /* 12 スライドパズル — 一枚だけ浮いている。光は空いた穴 */
  S.slide=function(c,W,H){
    sky(c,W,H,dk(P.dim,0.52),P.screen);
    const fw=74, cw=fw/4, fx=(W-fw)/2-6, fy=(H-fw)/2+2;
    shadow(c,fx+fw/2,fy+fw+8,fw*0.52,4,0.4);
    box(c,fx-6,fy-6,fw+12,fw+12,dk(P.olive,0.62));
    box(c,fx-6,fy-6,fw+12,3.5,dk(P.olive,0.34));
    box(c,fx-6,fy+fw+2.5,fw+12,3.5,dk(P.olive,0.76));
    box(c,fx,fy,fw,fw,dk(P.screen,0.34));
    for(let gy=0;gy<4;gy++) for(let gx=0;gx<4;gx++){
      if(gx===3&&gy===1) continue;
      if(gx===2&&gy===1) continue;
      const x=fx+gx*cw, y=fy+gy*cw;
      const col=((gx+gy)%2)?dk(P.teal,0.22):dk(P.teal,0.44);
      box(c,x+1.2,y+1.2,cw-2.4,cw-2.4,col);
      box(c,x+1.2,y+1.2,cw-2.4,2,lt(col,0.34));
      box(c,x+1.2,y+cw-3.2,cw-2.4,2,dk(col,0.34));
    }
    const hx=fx+3*cw+cw/2, hy=fy+1*cw+cw/2;
    glow(c,hx,hy,30,P.amber,0.6);
    box(c,fx+3*cw+1.2,fy+1*cw+1.2,cw-2.4,cw-2.4,dk(P.amber,0.62));
    box(c,fx+3*cw+1.2,fy+1*cw+1.2,cw-2.4,2,dk(P.amber,0.4));
    const lx=fx+2*cw+cw/2, ly=fy+1*cw+cw/2-9;
    shadow(c,lx+2,fy+1*cw+cw/2+3,cw*0.42,2.4,0.4);
    c.save(); c.translate(lx,ly); c.rotate(0.13); c.scale(1.16,1.16);
    box(c,-cw/2+1.2,-cw/2+1.2,cw-2.4,cw-2.4,P.amber);
    box(c,-cw/2+1.2,-cw/2+1.2,cw-2.4,2.6,lt(P.amber,0.5));
    box(c,-cw/2+1.2,cw/2-3.8,cw-2.4,2.6,dk(P.amber,0.3));
    c.restore();
    c.save(); c.globalAlpha=0.4; c.strokeStyle=P.bone; c.lineWidth=1.4; c.setLineDash([3,3]);
    c.beginPath(); c.moveTo(lx+cw*0.6,ly+2); c.lineTo(hx-cw*0.4,hy-3); c.stroke(); c.restore();
  };

  /* 13 フルーツキャッチ — 降ってくる実。光は上から */
  S.catch=function(c,W,H){
    sky(c,W,H,dk(P.teal,0.6),dk(P.screen,0.05));
    glow(c,W*0.5,-6,74,P.amber,0.5);
    rays(c,W*0.5,0,W,H,P.amber,5,0.08);
    const fr=[[36,26,5,P.red],[72,44,6,P.amber],[112,20,5,P.plum],[132,58,4.5,P.red],[54,66,4,P.amber]];
    fr.forEach(([x,y,r,col])=>{
      c.save(); c.globalAlpha=0.25;
      for(let i=1;i<4;i++) circ(c,x,y-i*7,r-i*0.7,col);
      c.restore();
      circ(c,x,y,r,col); circ(c,x-r*0.35,y-r*0.35,r*0.33,lt(col,0.5));
      line(c,x,y-r,x+1.5,y-r-3.5,dk(P.olive,0.1),1.4);
    });
    const bx=W*0.46, bw=44;
    shadow(c,bx,H-7,bw*0.5,2.6,0.4);
    poly(c,[[bx-bw/2,H-26],[bx+bw/2,H-26],[bx+bw/2-6,H-9],[bx-bw/2+6,H-9]],dk(P.olive,0.3));
    for(let i=1;i<5;i++){ const t=i/5;
      line(c,bx-bw/2+t*6,H-26+t*17,bx+bw/2-t*6,H-26+t*17,alpha(P.screen,0.28),1.2); }
    box(c,bx-bw/2,H-28,bw,3.5,P.olive);
    c.save(); c.strokeStyle=P.olive; c.lineWidth=2;
    c.beginPath(); c.arc(bx,H-28,bw*0.4,3.34,6.08); c.stroke(); c.restore();
  };

  /* 14 スペースシューター — 下から貫く光条。光はその弾 */
  S.shooter=function(c,W,H){
    box(c,0,0,W,H,P.screen);
    const r=seed(23);
    for(let i=0;i<60;i++){ const x=r()*W,y=r()*H,s=r()<0.85?1:2;
      box(c,x,y,s,s,alpha(P.bone,0.18+r()*0.5)); }
    for(let gy=0;gy<3;gy++) for(let gx=0;gx<6;gx++){
      if(gy===1&&gx===3) continue;
      const x=20+gx*22+(gy%2)*8, y=16+gy*17, col=[P.plum,P.teal,P.olive][gy];
      box(c,x,y,13,7,col); box(c,x,y,13,2,lt(col,0.3));
      box(c,x-3,y+2,3,4,dk(col,0.25)); box(c,x+13,y+2,3,4,dk(col,0.25));
      box(c,x+3,y+7,3,2.5,dk(col,0.4)); box(c,x+8,y+7,3,2.5,dk(col,0.4));
    }
    const sx=W*0.52, sy=H-16;
    const g=c.createLinearGradient(sx,sy,sx,16);
    g.addColorStop(0,alpha(P.amber,0.85)); g.addColorStop(1,alpha(P.amber,0));
    c.save(); c.fillStyle=g; c.fillRect(sx-4,16,8,sy-16); c.restore();
    glow(c,sx,34,34,P.amber,0.7);
    box(c,sx-1.6,16,3.2,sy-18,lt(P.amber,0.6));
    shadow(c,sx,H-5,13,2.4,0.35);
    poly(c,[[sx,sy-11],[sx+10,sy+3],[sx+4,sy+1],[sx,sy+5],[sx-4,sy+1],[sx-10,sy+3]],P.bone);
    poly(c,[[sx,sy-11],[sx+10,sy+3],[sx+4,sy+1],[sx,sy+5]],dk(P.bone,0.26));
    box(c,sx-2,sy-5,4,5,P.teal);
  };

  /* 15 ピンポン — 球が真ん中を抜ける。光は球 */
  S.pong=function(c,W,H){
    sky(c,W,H,dk(P.blue,0.8),P.screen);
    c.save(); c.globalAlpha=0.5;
    for(let i=0;i<5;i++) box(c,0,16+i*22,W,1,alpha(P.blue,0.3));
    c.restore();
    c.save(); c.strokeStyle=alpha(P.bone,0.22); c.lineWidth=2.5; c.setLineDash([7,8]);
    c.beginPath(); c.moveTo(W/2,8); c.lineTo(W/2,H-8); c.stroke(); c.restore();
    ring(c,W/2,H/2,24,alpha(P.bone,0.14),2);
    const bx=W*0.56, by=H*0.44;
    c.save(); c.globalAlpha=0.45;
    for(let i=1;i<8;i++) circ(c,bx-i*8,by+i*3.4,4.6-i*0.45,P.amber);
    c.restore();
    glow(c,bx,by,30,P.bone,0.8);
    circ(c,bx,by,5,P.bone);
    [[13,H*0.3,P.teal],[W-13-7,H*0.52,P.red]].forEach(([x,y,col])=>{
      box(c,x,y,7,34,col); box(c,x,y,7,3,lt(col,0.45)); box(c,x,y+31,7,3,dk(col,0.3));
      c.save(); c.globalAlpha=0.2; box(c,x-2,y-2,11,38,col); c.restore();
    });
  };

  /* 16 三目ならべ — そろった一列。光はその線 */
  S.ttt=function(c,W,H){
    sky(c,W,H,dk(P.dim,0.46),P.screen);
    const s=27, ox=(W-s*3)/2, oy=(H-s*3)/2+2;
    c.save(); c.strokeStyle=dk(P.olive,0.2); c.lineWidth=3.5; c.lineCap="round";
    for(let i=1;i<3;i++){
      c.beginPath(); c.moveTo(ox+i*s,oy-4); c.lineTo(ox+i*s,oy+s*3+4); c.stroke();
      c.beginPath(); c.moveTo(ox-4,oy+i*s); c.lineTo(ox+s*3+4,oy+i*s); c.stroke(); }
    c.restore();
    const O=[[1,0],[2,1],[0,2]], X=[[0,0],[1,1],[2,2]];
    O.forEach(([gx,gy])=>{ const x=ox+gx*s+s/2, y=oy+gy*s+s/2;
      ring(c,x,y,8,P.teal,3.4); });
    glow(c,ox+s*1.5,oy+s*1.5,54,P.amber,0.4);
    X.forEach(([gx,gy])=>{ const x=ox+gx*s+s/2, y=oy+gy*s+s/2;
      line(c,x-8,y-8,x+8,y+8,P.amber,3.8); line(c,x+8,y-8,x-8,y+8,P.amber,3.8); });
    c.save(); c.globalAlpha=0.7; c.lineCap="round";
    line(c,ox+s*0.5,oy+s*0.5,ox+s*2.5,oy+s*2.5,alpha(P.bone,0.8),2.4);
    c.restore();
  };
})();

/* ===== 絵 その3 ===== */
(function(){
  const P=PAL, S=ART.S;
  const {box,poly,line,circ,ring,sky,glow,rays,floor,shadow,cube,guy,dk,lt,alpha,seed}=ART;

  /* 17 四目ならべ — 落ちていく一枚。光はその軌跡 */
  S.four=function(c,W,H){
    sky(c,W,H,dk(P.blue,0.76),P.screen);
    const COLS=7, ROWS=5, cw=17, bw=COLS*cw, bx=(W-bw)/2, by=24, bh=ROWS*cw;
    box(c,bx-4,by-2,bw+8,bh+8,dk(P.blue,0.42));
    box(c,bx-4,by-2,bw+8,3,dk(P.blue,0.2));
    box(c,bx-4,by+bh+4,bw+8,2,dk(P.screen,0.2));
    const grid=[
      [0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0],
      [0,0,0,2,0,0,0],
      [0,0,2,1,1,0,0],
      [0,1,1,2,2,1,0]];
    for(let gy=0;gy<ROWS;gy++) for(let gx=0;gx<COLS;gx++){
      const x=bx+gx*cw+cw/2, y=by+gy*cw+cw/2, v=grid[gy][gx];
      if(v){ const col=v===1?P.amber:P.red;
        circ(c,x,y,cw*0.38,col); circ(c,x-cw*0.12,y-cw*0.12,cw*0.14,lt(col,0.45)); }
      else circ(c,x,y,cw*0.38,dk(P.screen,0.25));
      ring(c,x,y,cw*0.38,alpha(P.screen,0.35),1.6);
    }
    const dx=bx+4*cw+cw/2;
    const g=c.createLinearGradient(dx,6,dx,by+2*cw);
    g.addColorStop(0,alpha(P.amber,0)); g.addColorStop(1,alpha(P.amber,0.5));
    c.save(); c.fillStyle=g; c.fillRect(dx-5,6,10,by+2*cw-6); c.restore();
    glow(c,dx,14,30,P.amber,0.75);
    circ(c,dx,13,6.4,P.amber); circ(c,dx-2,11,2.4,lt(P.amber,0.6));
  };

  /* 18 たまご牧場 — 夕方の牧場。光はランプ */
  S.ranch=function(c,W,H){
    sky(c,W,H,dk(P.amber,0.52),dk(P.plum,0.7));
    const sx=W*0.2, sy=H*0.34;
    glow(c,sx,sy,50,P.amber,0.45); circ(c,sx,sy,11,alpha(P.amber,0.5));
    const hz=H*0.52;
    poly(c,[[0,hz+4],[46,hz-8],[96,hz+2],[W,hz-6],[W,H],[0,H]],dk(P.olive,0.56));
    poly(c,[[0,hz+16],[60,hz+6],[120,hz+16],[W,hz+8],[W,H],[0,H]],dk(P.olive,0.4));
    const r=seed(31);
    for(let i=0;i<46;i++){ const x=r()*W, y=hz+14+r()*(H-hz-16);
      line(c,x,y,x+1.4,y-3.4,alpha(P.olive,0.26),1); }
    const bx=W*0.68, by=hz+2;
    poly(c,[[bx-22,by],[bx,by-16],[bx+22,by],[bx+22,by+22],[bx-22,by+22]],dk(P.red,0.42));
    poly(c,[[bx-24,by+1],[bx,by-17],[bx+24,by+1],[bx+21,by+4],[bx,by-12],[bx-21,by+4]],dk(P.red,0.2));
    box(c,bx-7,by+6,14,16,dk(P.screen,0.2));
    box(c,bx-7,by+6,14,2,dk(P.red,0.6));
    glow(c,bx,by+10,16,P.amber,0.5);
    for(let i=0;i<5;i++){ const x=14+i*14;
      box(c,x,hz+22,2.5,13,dk(P.olive,0.68)); }
    box(c,12,hz+25,60,2.5,dk(P.olive,0.68));
    const nx=W*0.34, ny=H-19;
    c.save(); c.fillStyle=dk(P.olive,0.64); c.beginPath(); c.ellipse(nx,ny+4,26,8,0,0,7); c.fill(); c.restore();
    c.save(); c.fillStyle=dk(P.olive,0.5); c.beginPath(); c.ellipse(nx,ny+2,22,6.4,0,0,7); c.fill(); c.restore();
    glow(c,nx,ny-2,30,P.bone,0.4);
    [[-13,1,6],[0,-4,7],[13,1,6],[-6.5,5,5.4],[6.5,5,5.4]].forEach(([ox,oy,rr])=>{
      c.save(); c.fillStyle=dk(P.olive,0.58); c.beginPath();
      c.ellipse(nx+ox,ny+oy,rr*0.78+1.4,rr+1.4,0,0,7); c.fill(); c.restore();
      c.save(); c.fillStyle=P.bone; c.beginPath(); c.ellipse(nx+ox,ny+oy,rr*0.78,rr,0,0,7); c.fill(); c.restore();
      c.save(); c.fillStyle=dk(P.bone,0.16); c.beginPath();
      c.ellipse(nx+ox+rr*0.3,ny+oy+rr*0.25,rr*0.42,rr*0.52,0,0,7); c.fill(); c.restore();
      c.save(); c.fillStyle=lt(P.bone,0.45); c.beginPath();
      c.ellipse(nx+ox-rr*0.26,ny+oy-rr*0.32,rr*0.24,rr*0.3,0,0,7); c.fill(); c.restore();
    });
    const cx=W*0.14, cy=H-16;
    c.save(); c.fillStyle=P.amber; c.beginPath(); c.ellipse(cx,cy,7,6,0,0,7); c.fill(); c.restore();
    c.save(); c.fillStyle=lt(P.amber,0.2); c.beginPath(); c.ellipse(cx+4,cy-6,4.6,4.2,0,0,7); c.fill(); c.restore();
    poly(c,[[cx+8,cy-6],[cx+12,cy-4.6],[cx+8,cy-3.4]],P.red);
    box(c,cx+6,cy-8,1.6,1.6,P.screen);
  };

  /* 19 ハイウェイ17 — 消失点へ伸びる道。光は低い太陽 */
  S.highway=function(c,W,H){
    sky(c,W,H,dk(P.plum,0.5),dk(P.red,0.52));
    const hz=H*0.4, vx=W*0.5;
    glow(c,vx,hz,58,P.amber,0.7); circ(c,vx,hz-2,15,alpha(P.amber,0.55));
    c.save(); c.globalAlpha=0.35;
    for(let i=0;i<5;i++) box(c,vx-20,hz-11+i*6,40,2.4,dk(P.red,0.4));
    c.restore();
    poly(c,[[0,hz+6],[34,hz-4],[70,hz+3],[110,hz-5],[W,hz+4],[W,hz+12],[0,hz+14]],dk(P.screen,0.1));
    poly(c,[[vx-15,hz],[vx+15,hz],[W+34,H],[-34,H]],dk(P.dim,0.3));
    poly(c,[[vx-15,hz],[vx-19,hz],[-50,H],[-34,H]],dk(P.olive,0.6));
    poly(c,[[vx+15,hz],[vx+19,hz],[W+50,H],[W+34,H]],dk(P.olive,0.6));
    c.save(); c.strokeStyle=alpha(P.bone,0.3); c.lineWidth=1.4;
    [-5,5].forEach(o=>{ c.beginPath(); c.moveTo(vx+o,hz); c.lineTo(vx+o*7.5,H); c.stroke(); });
    c.restore();
    let y=hz+2, step=1.4;
    while(y<H){ const t=(y-hz)/(H-hz), w=2+t*9;
      box(c,vx-w/2,y,w,Math.max(1.2,step*0.5),alpha(P.bone,0.5)); y+=step*2.4; step*=1.42; }
    [[vx-24,hz+16,9,P.teal],[vx+30,hz+26,13,P.plum]].forEach(([x,yy,w,col])=>{
      box(c,x-w/2,yy-w*0.5,w,w*0.5,dk(col,0.3));
      box(c,x-w/2,yy-w*0.18,w,w*0.2,dk(col,0.5));
      box(c,x-w/2,yy,w*0.22,1.6,P.red); box(c,x+w/2-w*0.22,yy,w*0.22,1.6,P.red); });
    const cx=vx-14, cy=H-20, cw=46;
    shadow(c,cx,cy+15,cw*0.5,4,0.4);
    poly(c,[[cx-cw/2,cy+12],[cx+cw/2,cy+12],[cx+cw/2-3,cy-2],[cx-cw/2+3,cy-2]],P.teal);
    poly(c,[[cx-cw/2+6,cy-2],[cx+cw/2-6,cy-2],[cx+cw/2-11,cy-13],[cx-cw/2+11,cy-13]],dk(P.teal,0.42));
    poly(c,[[cx-cw/2+8,cy-3],[cx+cw/2-8,cy-3],[cx+cw/2-12,cy-11],[cx-cw/2+12,cy-11]],alpha(P.bone,0.22));
    box(c,cx-cw/2,cy+9,cw,3,dk(P.teal,0.5));
    box(c,cx-cw/2+2,cy+3,7,4,P.red); box(c,cx+cw/2-9,cy+3,7,4,P.red);
    glow(c,cx-cw/2+5,cy+5,13,P.red,0.6); glow(c,cx+cw/2-5,cy+5,13,P.red,0.6);
  };

  /* 20 ならく潜り — 地下へ降りる階段。光はランタン */
  /* 20 ならく潜り — 地下へ降りる階段。光はランタン */
  S.abyss=function(c,W,H){
    box(c,0,0,W,H,dk(P.screen,0.24));
    const r=seed(77);
    poly(c,[[0,0],[W,0],[W,20],[122,14],[92,26],[58,12],[28,24],[0,14]],dk(P.olive,0.78));
    poly(c,[[0,0],[W,0],[W,13],[120,8],[90,18],[56,7],[26,16],[0,8]],dk(P.olive,0.68));
    poly(c,[[0,14],[20,26],[10,56],[22,90],[8,H],[0,H]],dk(P.olive,0.74));
    poly(c,[[W,16],[W-22,30],[W-10,60],[W-24,94],[W-6,H],[W,H]],dk(P.olive,0.74));
    const steps=9;
    for(let i=0;i<steps;i++){
      const t=i/(steps-1);
      const x=W*0.26+t*(W*0.34), y=26+t*(H-46), w=46-t*16, h=6.5-t*1.6;
      poly(c,[[x-w/2,y],[x+w/2,y],[x+w/2-h*0.8,y+h],[x-w/2-h*0.8,y+h]],dk(P.dim,0.16+t*0.26));
      poly(c,[[x-w/2,y-2.2],[x+w/2,y-2.2],[x+w/2,y],[x-w/2,y]],dk(P.olive,0.34+t*0.2));
    }
    const ax=W*0.46, ay=H*0.5;
    glow(c,ax+11,ay-7,44,P.amber,0.9);
    c.save(); c.globalAlpha=0.1; c.fillStyle=P.amber;
    c.beginPath(); c.moveTo(ax+11,ay-7); c.lineTo(W*0.1,H); c.lineTo(W*0.92,H); c.closePath(); c.fill();
    c.restore();
    line(c,ax+9,ay-17,ax+12,ay-8,dk(P.olive,0.2),1.3);
    circ(c,ax+12,ay-5,4,P.amber); circ(c,ax+12,ay-5,1.8,lt(P.amber,0.7));
    box(c,ax-5,ay-10,9,11,dk(P.teal,0.08));
    box(c,ax-5,ay-10,9,2.4,lt(P.teal,0.2));
    box(c,ax-6,ay-18,11,8,P.bone);
    box(c,ax,ay-16,2.6,2.6,P.screen);
    box(c,ax-5,ay+1,3.6,7,dk(P.teal,0.34)); box(c,ax+0.8,ay+1,3.6,7,dk(P.teal,0.34));
    line(c,ax-8,ay-13,ax-14,ay-1,alpha(P.bone,0.8),2.2);
    [[24,H-28,P.amber],[W-26,H-36,P.teal]].forEach(([x,y,col])=>{
      box(c,x-9,y,18,10,dk(P.olive,0.52));
      box(c,x-9,y-4.5,18,5,dk(P.olive,0.3));
      box(c,x-2,y+1.6,4,4,col);
      glow(c,x,y+2,15,col,0.45); });
    for(let i=0;i<3;i++){ const x=14+r()*(W-28), y=30+r()*(H-72);
      if(Math.abs(x-ax)<26) continue;
      circ(c,x,y,1.5,alpha(P.red,0.6)); circ(c,x+5,y,1.5,alpha(P.red,0.6)); }
  };

  /* 21 ブロックデュエル — 壁を立てて撃ち合う。光は飛んでいる弾 */
  /* 21 ブロックデュエル — 壁を立てて撃ち合う。光は飛んでいる弾 */
  S.duel=function(c,W,H){
    sky(c,W,H,dk(P.plum,0.68),P.screen);
    const r=seed(17);
    for(let i=0;i<34;i++) box(c,r()*W,r()*H*0.62,1,1,alpha(P.bone,0.22));
    const gy=H-17;
    box(c,0,gy,W,H-gy,dk(P.olive,0.68));
    box(c,0,gy,W,2,dk(P.olive,0.36));
    for(let i=0;i<W;i+=11) box(c,i+2,gy+6,6,1.4,alpha(P.screen,0.26));
    const blk=(x,y,col)=>{ box(c,x,y,11,11,col); box(c,x,y,11,2,lt(col,0.3));
      box(c,x,y+9,11,2,dk(col,0.3)); box(c,x,y,1.6,11,lt(col,0.12)); };
    [[20,gy-11],[20,gy-22],[31,gy-11]].forEach(([x,y])=>blk(x,y,dk(P.teal,0.3)));
    [[W-31,gy-11],[W-31,gy-22],[W-42,gy-11],[W-31,gy-33]].forEach(([x,y])=>blk(x,y,dk(P.red,0.32)));
    shadow(c,52,gy+1,6,2,0.38); shadow(c,W-56,gy+1,6,2,0.38);
    guy(c,52,gy,13,P.teal,1);
    guy(c,W-56,gy,13,P.red,-1);
    const bx=W*0.5, by=gy-22;
    c.save(); c.globalAlpha=0.5;
    for(let i=1;i<7;i++) circ(c,bx-i*7,by+i*0.9,3.4-i*0.4,P.amber);
    c.restore();
    glow(c,bx,by,24,P.amber,0.85);
    circ(c,bx,by,3.6,lt(P.amber,0.45));
    const fx=W-62, fy=gy-18;
    glow(c,fx,fy,15,P.amber,0.6);
    for(let i=0;i<4;i++){ const a=3.6+i*0.3;
      line(c,fx,fy,fx+Math.cos(a)*6,fy+Math.sin(a)*6,alpha(P.amber,0.8),1.3); }
  };

  /* 22 スカイフォート — 空に浮く足場での撃ち合い。光は奥の太陽 */
  /* 22 スカイフォート — 空に浮く足場での撃ち合い。光は奥の太陽 */
  S.fort=function(c,W,H){
    sky(c,W,H,dk(P.teal,0.5),dk(P.blue,0.76));
    const sx=W*0.78, sy=H*0.2;
    glow(c,sx,sy,48,P.amber,0.5); circ(c,sx,sy,10,alpha(P.amber,0.45));
    c.save(); c.globalAlpha=0.14; c.fillStyle=P.bone;
    [[26,26,26,5],[104,18,32,4],[58,44,22,3.4],[128,50,26,4]].forEach(([x,y,w,h])=>{
      c.beginPath(); c.ellipse(x,y,w,h,0,0,7); c.fill(); });
    c.restore();
    const CS=7.2, cx=W*0.5, cy=H*0.44;
    const iso=(gx,gy,gz)=>[cx+(gx-gy)*CS, cy+(gx+gy)*CS*0.52-gz*CS*0.9];
    const cells=[];
    for(let gx=0;gx<8;gx++) for(let gy=0;gy<6;gy++){
      if((gx===0&&gy===5)||(gx===7&&gy===0)) continue;
      cells.push([gx,gy,0]);
    }
    [[1,1,1],[1,1,2],[2,1,1],[1,2,1],[6,4,1],[6,4,2],[5,4,1],[6,3,1]].forEach(v=>cells.push(v));
    cells.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1]) || a[2]-b[2]).forEach(([gx,gy,gz])=>{
      const [x,y]=iso(gx,gy,gz);
      const col = gz>0 ? (gx<4?P.teal:P.red) : dk(P.olive,0.34+((gx*3+gy)%3)*0.1);
      cube(c,x,y,CS,col);
    });
    c.save(); c.globalAlpha=0.3;
    const [b1x,b1y]=iso(0,0,0), [b2x,b2y]=iso(7,5,0);
    poly(c,[[b1x-CS,b1y+CS*1.2],[b2x+CS,b2y-CS*0.6],[cx,cy+6*CS+18]],dk(P.screen,0.3));
    c.restore();
    const [p1x,p1y]=iso(2,0,1), [p2x,p2y]=iso(5,5,1);
    guy(c,p1x,p1y+3,12,P.teal,1);
    guy(c,p2x,p2y+3,12,P.red,-1);
    const bx=(p1x+p2x)/2+6, by=(p1y+p2y)/2-9;
    c.save(); c.globalAlpha=0.45;
    for(let i=1;i<6;i++) circ(c,bx-i*7,by-i*2,3.2-i*0.4,P.amber);
    c.restore();
    glow(c,bx,by,22,P.amber,0.85); circ(c,bx,by,3.2,lt(P.amber,0.5));
  };

  /* 23 かさね — 自分の分身がプレートを踏んでいる。光はゴール */
  /* 23 かさね — 自分の分身がプレートを踏んでいる。光はゴール */
  S.kasane=function(c,W,H){
    sky(c,W,H,dk(P.dim,0.52),P.screen);
    const CS=8.4, cx=W*0.5, cy=H*0.26;
    const iso=(gx,gy)=>[cx+(gx-gy)*CS, cy+(gx+gy)*CS*0.52];
    const map=["#######",
               "#..1..#",
               "#.###.#",
               "#2...3#",
               "#.###.#",
               "#..G..#",
               "#######"];
    for(let s=0;s<13;s++) for(let gy=0;gy<7;gy++){
      const gx=s-gy; if(gx<0||gx>6) continue;
      const t=map[gy][gx], [x,y]=iso(gx,gy);
      if(t==="#"){ cube(c,x,y,CS,dk(P.olive,0.5+((gx+gy)%2)*0.1)); continue; }
      poly(c,[[x,y-CS*0.52],[x+CS,y],[x,y+CS*0.52],[x-CS,y]],dk(P.dim,0.26));
      poly(c,[[x,y-CS*0.52+1.4],[x+CS-2.6,y],[x,y+CS*0.52-1.4],[x-CS+2.6,y]],dk(P.dim,0.5));
      if(t==="1"||t==="2"||t==="3"){
        poly(c,[[x,y-CS*0.46],[x+CS*0.88,y],[x,y+CS*0.46],[x-CS*0.88,y]],alpha(P.amber,0.5));
        poly(c,[[x,y-CS*0.27],[x+CS*0.52,y],[x,y+CS*0.27],[x-CS*0.52,y]],P.amber);
      }
      if(t==="G"){
        glow(c,x,y-5,30,P.teal,0.75);
        poly(c,[[x,y-CS*0.52],[x+CS,y],[x,y+CS*0.52],[x-CS,y]],alpha(P.teal,0.55));
        const g=c.createLinearGradient(x,y-32,x,y);
        g.addColorStop(0,alpha(P.teal,0)); g.addColorStop(1,alpha(P.teal,0.5));
        c.save(); c.fillStyle=g; c.fillRect(x-CS*0.8,y-32,CS*1.6,32); c.restore();
      }
    }
    [[3,1],[1,3],[5,3]].forEach(([gx,gy],i)=>{
      const [x,y]=iso(gx,gy);
      c.save(); c.globalAlpha=0.33+i*0.06;
      guy(c,x,y+1,12,P.bone,1);
      c.restore();
    });
    const [hx,hy]=iso(3,4);
    shadow(c,hx,hy+2,6,2.2,0.4);
    guy(c,hx,hy+1,13,P.teal,1);
  };
})();
