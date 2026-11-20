/* ポケット17 — 対戦ゲーム 15-17 */
"use strict";
/* ============================================================
   対戦のしくみ

   席0 = 進行役。盤面の正解を自分の presence.st に書く。
   席1 = 相手。自分の手だけを presence.mv に書く。
   席2以降 = 観戦。進行役の st を読んで表示するだけ。
   席は peer の文字列順で決まるので、取り決めの通信はいらない。
   ============================================================ */
function matchUI(api, onReady){
  const saved=api.net.nick();
  const c=api.sheet(
    '<h4>オンライン対戦</h4>'+
    '<p>相手と同じ合言葉を入れると、つながります。</p>'+
    '<label for="nk">あなたの名前</label>'+
    '<input id="nk" type="text" maxlength="12" value="'+esc(saved)+'" placeholder="なまえ" style="letter-spacing:0">'+
    '<label for="cd">合言葉（英数字）</label>'+
    '<input id="cd" type="text" maxlength="12" placeholder="aiueo" autocomplete="off">'+
    '<div class="keys"><button class="key" id="go">つながる</button>'+
    '<button class="key alt" id="cx">やめる</button></div>'
  );
  const cd=el("cd");
  cd.focus();
  el("cx").onclick=()=>toMenu();
  el("go").onclick=async ()=>{
    const code=cd.value.trim();
    if(!code){ cd.focus(); return; }
    api.net.setNick(el("nk").value.trim());
    api.sheet('<h4>つないでいます</h4><p>合言葉「'+esc(code)+'」</p>');
    const r=await api.net.enter(code, list=>paintWait(list));
    if(!r.ok){
      api.sheet('<h4>つながりません</h4><p>'+esc(r.why)+'</p>'+
        '<p style="font-size:11px">このページにログインして招待された人だけが対戦できます。<br>'+
        '同じ端末で2人で遊ぶこともできます。</p>'+
        '<div class="keys"><button class="key" id="again2">やりなおす</button>'+
        '<button class="key alt" id="bk3">一覧へ</button></div>');
      el("again2").onclick=()=>matchUI(api,onReady);
      el("bk3").onclick=()=>toMenu();
      return;
    }
    paintWait(api.net.list());
  };
  let started=false;
  function paintWait(list){
    if(started) return;
    if(list.length>=2){
      started=true;
      api.close();
      onReady();
      return;
    }
    api.sheet(
      '<h4>相手をまっています</h4>'+
      '<p>合言葉「'+esc(api.net.code())+'」をあいてに伝えてください。</p>'+
      '<div class="who">'+list.map(p=>'<div><i></i>'+esc((p.presence&&p.presence.nick)||"プレイヤー")+(p.sameTab?"（あなた）":"")+'</div>').join("")+
      '<div><i class="off"></i>あいて…</div></div>'+
      '<div class="keys"><button class="key alt" id="bk4">やめる</button></div>'
    );
    el("bk4").onclick=()=>toMenu();
  }
}
function lostPeer(api, retry){
  api.sheet('<h4>あいてが切れました</h4><p>通信が切れたか、ページを閉じたようです。</p>'+
    '<div class="keys"><button class="key" id="rt">もう一度さがす</button>'+
    '<button class="key alt" id="bk5">一覧へ</button></div>');
  el("rt").onclick=()=>{ api.close(); retry(); };
  el("bk5").onclick=()=>toMenu();
}

/* ============================================================
   15 ピンポン
   ============================================================ */
GAMES.push({
  id:"pong", title:"ピンポン", cat:"対戦", vs:true,
  ctrl:"↑↓ でバーを動かす",
  about:"CPU戦・ふたり対戦・オンライン対戦",
  kw:"pong tennis taisen online",
  hint:"バーの端で当てると角度がつきます。ふたり対戦は左側がWとS、右側が↑と↓。",
  thumb(c,W,H){
    for(let y=4;y<H;y+=10) px(c,W/2-1,y,2,6,PAL.dim);
    px(c,10,38,6,30,PAL.blue);
    px(c,W-16,52,6,30,PAL.red);
    px(c,74,58,6,6,PAL.bone);
    txt(c,"2",46,18,15,"rgba(233,227,208,.35)","center");
    txt(c,"1",114,18,15,"rgba(233,227,208,.35)","center");
    txt(c,"VS",150,106,9,PAL.amber,"right");
  },
  start(api){
    const {canvas,ctx,W,H}=api.canvas(440,290,500);
    const PH=62, PW=9, GOAL=5;
    let mode="cpu", py=H/2, ay=H/2, mine=0, theirs=0, over=false, aiSp=175, pause=.8;
    let b={x:W/2,y:H/2,vx:0,vy:0,r:5.5};
    let seat=-1, netOn=false, lastSent=0, ended=false, dc=false;
    function serve(dirx){
      b.x=W/2; b.y=H/2;
      const a=Math.random()*.7-.35;
      const sp=245+mine*14;
      b.vx=Math.cos(a)*sp*dirx; b.vy=Math.sin(a)*sp;
      pause=.7;
    }
    function reset(){ mine=0; theirs=0; over=false; ended=false; dc=false; aiSp=175; py=H/2; ay=H/2; serve(1); }

    function begin(m){
      mode=m; reset();
      if(m==="online"){
        netOn=true;
        api.controls({dpad:"ud", legend:"↑↓ であなたのバー"});
      } else if(m==="duo"){
        api.controls({dpad:"ud", legend:"左:W/S<br>右:↑↓・画面は左右タップ"});
      } else {
        api.controls({dpad:"ud", legend:"↑↓ でバーを動かす"});
      }
      api.info(label());
    }
    function label(){
      if(mode==="online"){
        const l=api.net.list();
        const meName=(api.net.me()&&api.net.me().presence&&api.net.me().presence.nick)||"あなた";
        const other=l.find(p=>!p.sameTab);
        const oName=(other&&other.presence&&other.presence.nick)||"あいて";
        return (seat===0?esc(meName):esc(oName))+" <b>"+mine+"</b> — <b>"+theirs+"</b> "+(seat===0?esc(oName):esc(meName));
      }
      if(mode==="duo") return "左 <b>"+mine+"</b> — <b>"+theirs+"</b> 右";
      return "あなた <b>"+mine+"</b> — <b>"+theirs+"</b> CPU";
    }
    /* 同じ端末でのふたり用：左半分と右半分を別々に触れる */
    const touches={};
    api.on(canvas,"pointerdown",e=>{
      const p=api.pos(canvas,e); touches[e.pointerId]=p.x<W/2?"L":"R";
      apply(e);
    });
    api.on(canvas,"pointermove",e=>{ if(touches[e.pointerId]) apply(e); else apply(e); });
    api.on(canvas,"pointerup",e=>{ delete touches[e.pointerId]; });
    api.on(canvas,"pointercancel",e=>{ delete touches[e.pointerId]; });
    function apply(e){
      const p=api.pos(canvas,e);
      const side=touches[e.pointerId]||(p.x<W/2?"L":"R");
      const y=Math.max(PH/2,Math.min(H-PH/2,p.y));
      if(mode==="duo"){ if(side==="L") py=y; else ay=y; }
      else py=y;
    }

    function drawField(leftY, rightY, s1, s2, note){
      px(ctx,0,0,W,H,PAL.screen);
      for(let y=6;y<H;y+=16) px(ctx,W/2-1,y,2,9,PAL.dim);
      txt(ctx,String(s1),W/2-34,26,26,"rgba(233,227,208,.3)","right");
      txt(ctx,String(s2),W/2+34,26,26,"rgba(233,227,208,.3)","left");
      px(ctx,20,leftY-PH/2,PW,PH,PAL.blue);
      px(ctx,21,leftY-PH/2+2,PW-2,4,"rgba(255,255,255,.3)");
      px(ctx,W-20-PW,rightY-PH/2,PW,PH,PAL.red);
      px(ctx,W-19-PW,rightY-PH/2+2,PW-2,4,"rgba(255,255,255,.3)");
      px(ctx,b.x-b.r,b.y-b.r,b.r*2,b.r*2,PAL.bone);
      if(note) txt(ctx,note,W/2,H-20,12,PAL.tx2,"center");
      api.fx.draw(ctx);
    }

    function bounceWall(){
      if(b.y<b.r){ b.y=b.r; b.vy*=-1; api.sfx.tap(); }
      if(b.y>H-b.r){ b.y=H-b.r; b.vy*=-1; api.sfx.tap(); }
    }
    function hitPaddle(pxp, pyp, toRight){
      const off=(b.y-pyp)/(PH/2), ang=off*.9;
      const sp=Math.min(680,Math.hypot(b.vx,b.vy)*1.035);
      b.vx=(toRight?1:-1)*Math.abs(Math.cos(ang))*sp;
      b.vy=Math.sin(ang)*sp;
      b.x=pxp;
      api.sfx.tap(); api.fx.shake(2);
      api.fx.burst(pxp,b.y,{n:4,col:PAL.bone,sp:70,life:.25,g:0});
    }

    api.modes([
      {id:"cpu", label:"CPUとたたかう"},
      {id:"duo", label:"ふたりで（同じ端末）"},
      {id:"online", label:"オンライン対戦"}
    ]).then(m=>{
      if(m==="online"){
        matchUI(api, ()=>{ seat=api.net.seat(); begin("online"); });
      } else begin(m);
    });

    api.loop(dt=>{
      if(mode==="online"&&netOn){
        if(dc) return;
        const list=api.net.list();
        if(list.length<2){
          dc=true; over=true; ended=true;
          lostPeer(api, ()=>{
            dc=false; seat=-1;
            matchUI(api,()=>{ seat=api.net.seat(); begin("online"); });
          });
          return;
        }
        seat=api.net.seat();
        if(seat===0){
          /* 進行役：物理計算して結果を配る */
          if(Input.held("ArrowUp")) py-=320*dt;
          if(Input.held("ArrowDown")) py+=320*dt;
          py=Math.max(PH/2,Math.min(H-PH/2,py));
          const g=api.net.at(1);
          const gy=g&&g.presence&&typeof g.presence.my==="number"?g.presence.my:ay;
          ay=gy;
          if(pause>0) pause-=dt;
          else if(!over){
            for(let s=0;s<3;s++){
              b.x+=b.vx*dt/3; b.y+=b.vy*dt/3;
              bounceWall();
              if(b.vx<0&&b.x<20+PW+b.r&&Math.abs(b.y-py)<PH/2+b.r) hitPaddle(20+PW+b.r,py,true);
              if(b.vx>0&&b.x>W-20-PW-b.r&&Math.abs(b.y-ay)<PH/2+b.r) hitPaddle(W-20-PW-b.r,ay,false);
              if(b.x<-10){ theirs++; api.sfx.bad(); api.fx.shake(6); serve(1); break; }
              if(b.x>W+10){ mine++; api.sfx.great(); api.fx.shake(6); serve(-1); break; }
            }
            if(mine>=GOAL||theirs>=GOAL) over=true;
          }
          const now=performance.now();
          if(now-lastSent>33){
            lastSent=now;
            api.net.put({st:{seq:now|0, bx:Math.round(b.x), by:Math.round(b.y), hy:Math.round(py), s1:mine, s2:theirs, ov:over?1:0}});
          }
          api.info(label());
          drawField(py,ay,mine,theirs, over?(mine>=GOAL?"あなたの勝ち":"あいての勝ち"):(pause>0?"つぎのサーブ":""));
          if(over&&!ended){ ended=true; api.over({title:mine>=GOAL?"勝ち":"負け", score:mine*100, save:false, value:mine+" — "+theirs, msg:"オンライン対戦の結果"}); }
        } else {
          /* 相手側：自分のバーだけ送り、盤面は受け取る */
          if(Input.held("ArrowUp")) ay-=320*dt;
          if(Input.held("ArrowDown")) ay+=320*dt;
          ay=Math.max(PH/2,Math.min(H-PH/2,ay));
          const now=performance.now();
          if(now-lastSent>33){ lastSent=now; api.net.put({my:Math.round(ay)}); }
          const h=api.net.at(0);
          const st=h&&h.presence&&h.presence.st;
          if(st){
            b.x+=((st.bx||b.x)-b.x)*Math.min(1,dt*18);
            b.y+=((st.by||b.y)-b.y)*Math.min(1,dt*18);
            py+=((st.hy||py)-py)*Math.min(1,dt*18);
            mine=st.s1||0; theirs=st.s2||0;
            if(st.ov&&!ended){
              ended=true;
              api.over({title:theirs>=GOAL?"勝ち":"負け", score:theirs*100, save:false, value:theirs+" — "+mine, msg:"オンライン対戦の結果"});
            }
          }
          api.info(label());
          drawField(py,ay,mine,theirs,"あなたは右のバー");
        }
        return;
      }

      /* CPU戦・ふたり対戦 */
      if(over) { drawField(py,ay,mine,theirs,""); return; }
      if(mode==="duo"){
        if(Input.rawHeld("w")) py-=330*dt;
        if(Input.rawHeld("s")) py+=330*dt;
        if(Input.held("ArrowUp")) ay-=330*dt;
        if(Input.held("ArrowDown")) ay+=330*dt;
      } else {
        if(Input.held("ArrowUp")) py-=330*dt;
        if(Input.held("ArrowDown")) py+=330*dt;
        const t=b.vx>0?b.y:H/2, d=t-ay;
        ay+=Math.max(-aiSp*dt,Math.min(aiSp*dt,d));
      }
      py=Math.max(PH/2,Math.min(H-PH/2,py));
      ay=Math.max(PH/2,Math.min(H-PH/2,ay));
      if(pause>0) pause-=dt;
      else {
        for(let s=0;s<3;s++){
          b.x+=b.vx*dt/3; b.y+=b.vy*dt/3;
          bounceWall();
          if(b.vx<0&&b.x<20+PW+b.r&&Math.abs(b.y-py)<PH/2+b.r) hitPaddle(20+PW+b.r,py,true);
          if(b.vx>0&&b.x>W-20-PW-b.r&&Math.abs(b.y-ay)<PH/2+b.r) hitPaddle(W-20-PW-b.r,ay,false);
          if(b.x<-10){
            theirs++; api.sfx.bad(); api.fx.shake(6);
            if(mode==="cpu"&&theirs>=GOAL){ over=true; api.over({title:"しあい終了", msg:mine+"点とってから敗退"}); return; }
            if(mode==="duo"&&theirs>=GOAL){ over=true; api.over({title:"右の勝ち", score:0, save:false, value:mine+" — "+theirs, msg:"ふたり対戦の結果"}); return; }
            serve(1); break;
          }
          if(b.x>W+10){
            mine++; api.sfx.great(); api.fx.shake(6);
            if(mode==="cpu"){ api.add(100); aiSp+=22; }
            if(mode==="duo"&&mine>=GOAL){ over=true; api.over({title:"左の勝ち", score:0, save:false, value:mine+" — "+theirs, msg:"ふたり対戦の結果"}); return; }
            serve(-1); break;
          }
        }
      }
      api.info(label());
      drawField(py,ay,mine,theirs,pause>0?"つぎのサーブ":"");
    });
  }
});

/* ============================================================
   16 三目ならべ
   ============================================================ */
GAMES.push({
  id:"ttt", title:"三目ならべ", cat:"対戦", vs:true,
  ctrl:"マスをタップして置く",
  about:"CPU連勝チャレンジ・ふたり対戦・オンライン対戦",
  kw:"tictactoe maru batsu taisen online",
  hint:"CPU戦は負けた時点で終了。勝ち100点、引き分け20点。勝ち進むとCPUが賢くなります。",
  thumb(c,W,H){
    const g=[1,0,2, 0,1,0, 2,0,1];
    for(let i=0;i<9;i++){
      const x=46+(i%3)*24, y=16+((i/3)|0)*24;
      px(c,x,y,22,22,PAL.dim);
      if(g[i]===1){ c.strokeStyle=PAL.blue; c.lineWidth=3; c.beginPath(); c.arc(x+11,y+11,6,0,7); c.stroke(); }
      if(g[i]===2){ c.strokeStyle=PAL.red; c.lineWidth=3; c.beginPath(); c.moveTo(x+5,y+5); c.lineTo(x+17,y+17); c.moveTo(x+17,y+5); c.lineTo(x+5,y+17); c.stroke(); }
    }
    txt(c,"VS",150,106,9,PAL.amber,"right");
  },
  start(api){
    const {canvas,ctx,W,H}=api.canvas(300,300,330);
    const LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    const CS=100;
    let b=Array(9).fill(0), mode="cpu", round=1, wins=0, draws=0, lock=false, over=false, msg="", turn=1;
    let seat=-1, mvN=0, seen=-1, stSeq=0;
    function win(bb){
      for(const L of LINES){ const [a,c,d]=L; if(bb[a]&&bb[a]===bb[c]&&bb[a]===bb[d]) return {p:bb[a],L}; }
      return bb.every(v=>v)?{p:0,L:null}:null;
    }
    function mm(bb,t,depth){
      const r=win(bb);
      if(r){ if(r.p===2) return 10-depth; if(r.p===1) return depth-10; return 0; }
      const sc=[];
      for(let i=0;i<9;i++){
        if(bb[i]) continue;
        bb[i]=t; sc.push(mm(bb,t===1?2:1,depth+1)); bb[i]=0;
      }
      return t===2?Math.max(...sc):Math.min(...sc);
    }
    function cpuPick(){
      const empty=[];
      for(let i=0;i<9;i++) if(!b[i]) empty.push(i);
      const smart=Math.min(.95,.3+(round-1)*.14);
      if(Math.random()>smart) return empty[Math.floor(Math.random()*empty.length)];
      let bestS=-Infinity, mv=empty[0];
      for(const i of empty){ b[i]=2; const s=mm(b,1,0); b[i]=0; if(s>bestS){ bestS=s; mv=i; } }
      return mv;
    }
    function draw2(){
      px(ctx,0,0,W,H,PAL.screen);
      const r=win(b);
      for(let i=0;i<9;i++){
        const x=(i%3)*CS, y=((i/3)|0)*CS;
        const hl=r&&r.L&&r.L.includes(i);
        px(ctx,x+3,y+3,CS-6,CS-6,hl?"rgba(227,167,60,.22)":PAL.dim);
        if(b[i]===1){
          ctx.strokeStyle=PAL.blue; ctx.lineWidth=8; ctx.lineCap="round";
          ctx.beginPath(); ctx.arc(x+CS/2,y+CS/2,24,0,7); ctx.stroke();
        } else if(b[i]===2){
          ctx.strokeStyle=PAL.red; ctx.lineWidth=8; ctx.lineCap="round";
          ctx.beginPath();
          ctx.moveTo(x+CS/2-21,y+CS/2-21); ctx.lineTo(x+CS/2+21,y+CS/2+21);
          ctx.moveTo(x+CS/2+21,y+CS/2-21); ctx.lineTo(x+CS/2-21,y+CS/2+21);
          ctx.stroke();
        }
      }
      if(msg) txt(ctx,msg,W/2,H/2,22,PAL.amber,"center");
      api.fx.draw(ctx);
    }
    function info(){
      if(mode==="cpu") api.info("ラウンド <b>"+round+"</b>／"+wins+"勝 "+draws+"分");
      else if(mode==="duo") api.info(turn===1?"<b>○</b> のばん":"<b>×</b> のばん");
      else {
        const myMark=seat===0?1:2;
        api.info((turn===myMark?"<b>あなた</b>のばん":"あいてのばん")+"／あなたは "+(myMark===1?"○":"×"));
      }
    }
    function cpuRound(res){
      if(res===1){ wins++; api.add(100); api.sfx.great(); msg="かち"; }
      else if(res===0){ draws++; api.add(20); api.sfx.good(); msg="ひきわけ"; }
      else { over=true; msg="まけ"; api.sfx.bad(); draw2(); api.over({title:"連勝ストップ", msg:wins+"勝 "+draws+"分（ラウンド"+round+"）"}); return; }
      draw2();
      api.after(900,()=>{ b=Array(9).fill(0); round++; lock=false; msg=""; info(); draw2(); });
    }
    function place(i){
      if(over||lock||b[i]) return;
      if(mode==="cpu"){
        b[i]=1; api.sfx.tap(); api.fx.burst((i%3)*CS+CS/2,((i/3)|0)*CS+CS/2,{n:5,col:PAL.blue,sp:60,life:.3}); draw2();
        const r=win(b);
        if(r){ cpuRound(r.p===1?1:0); return; }
        lock=true;
        api.after(330,()=>{
          if(over) return;
          const m=cpuPick();
          if(m!==undefined) b[m]=2;
          draw2();
          const r2=win(b);
          if(r2){ cpuRound(r2.p===2?-1:0); return; }
          lock=false; info();
        });
      } else if(mode==="duo"){
        b[i]=turn; api.sfx.tap(); draw2();
        const r=win(b);
        if(r){
          over=true;
          msg=r.p===0?"ひきわけ":(r.p===1?"○のかち":"×のかち"); draw2();
          api.over({title:msg, score:0, save:false, value:r.p===0?"DRAW":(r.p===1?"○":"×"), msg:"もう一度あそべます"});
          return;
        }
        turn=turn===1?2:1; info();
      } else {
        const myMark=seat===0?1:2;
        if(turn!==myMark) return;
        if(seat===0){
          b[i]=1; apply(); send();
        } else {
          mvN++; api.net.put({mv:{n:mvN,i:i}});
          api.sfx.tap();
        }
      }
    }
    function apply(){
      const r=win(b);
      if(r){
        over=true;
        msg=r.p===0?"ひきわけ":(r.p===1?"○のかち":"×のかち");
        turn=0;
      } else turn=turn===1?2:1;
      api.sfx.tap(); draw2(); info();
      if(over) finishOnline(r);
    }
    function finishOnline(r){
      const myMark=seat===0?1:2;
      const youWin=r&&r.p===myMark;
      api.over({title:r&&r.p===0?"ひきわけ":(youWin?"あなたの勝ち":"あなたの負け"),
        score:0, save:false, value:r&&r.p===0?"DRAW":(youWin?"WIN":"LOSE"), msg:"オンライン対戦の結果"});
    }
    function send(){ stSeq++; api.net.put({st:{seq:stSeq, b:b.join(""), t:turn, ov:over?1:0}}); }

    api.on(canvas,"pointerdown",e=>{
      e.preventDefault();
      const p=api.pos(canvas,e);
      const i=Math.floor(p.y/CS)*3+Math.floor(p.x/CS);
      if(i>=0&&i<9) place(i);
    });
    api.controls(null);
    api.modes([
      {id:"cpu", label:"CPU連勝チャレンジ"},
      {id:"duo", label:"ふたりで（同じ端末）"},
      {id:"online", label:"オンライン対戦"}
    ]).then(m=>{
      mode=m;
      if(m==="online"){
        matchUI(api, ()=>{
          seat=api.net.seat(); turn=1; b=Array(9).fill(0); over=false; msg="";
          if(seat===0) send();
          info(); draw2();
        });
      } else { info(); draw2(); }
    });

    api.loop(()=>{
      if(mode!=="online"||seat<0) return;
      const list=api.net.list();
      if(list.length<2&&!over){
        over=true;
        lostPeer(api, ()=>{ seat=-1; over=false; matchUI(api,()=>{ seat=api.net.seat(); turn=1; b=Array(9).fill(0); over=false; msg=""; if(seat===0) send(); info(); draw2(); }); });
        return;
      }
      seat=api.net.seat();
      if(seat===0){
        const g=api.net.at(1);
        const mv=g&&g.presence&&g.presence.mv;
        if(mv&&mv.n>seen&&!over){
          seen=mv.n;
          const i=mv.i|0;
          if(i>=0&&i<9&&!b[i]&&turn===2){ b[i]=2; apply(); send(); }
        }
      } else {
        const h=api.net.at(0);
        const st=h&&h.presence&&h.presence.st;
        if(st&&st.seq>stSeq){
          stSeq=st.seq;
          const nb=String(st.b||"").split("").map(Number);
          if(nb.length===9) b=nb;
          turn=st.t|0;
          const r=win(b);
          if(st.ov&&!over){ over=true; msg=r&&r.p===0?"ひきわけ":(r&&r.p===1?"○のかち":"×のかち"); finishOnline(r); }
          info(); draw2();
        }
      }
    });
  }
});

/* ============================================================
   17 四目ならべ
   ============================================================ */
GAMES.push({
  id:"four", title:"四目ならべ", cat:"対戦", vs:true,
  ctrl:"←→ で列をえらび A で落とす",
  about:"7列6段。たて・よこ・ななめに4つそろえる",
  kw:"connect four yonmoku taisen online",
  hint:"相手の3つならびは先に止める。真ん中の列を取ると筋が増えて有利です。",
  thumb(c,W,H){
    const cols=7, rows=6, s=15, ox=26, oy=9;
    px(c,ox-3,oy-3,cols*s+6,rows*s+6,PAL.dim2);
    const bd=["0000000","0000000","0002000","0001000","0021000","0012200"];
    for(let y=0;y<rows;y++) for(let x=0;x<cols;x++){
      const v=+bd[y][x];
      c.fillStyle = v===1?PAL.amber : v===2?PAL.red : PAL.screen;
      c.beginPath(); c.arc(ox+x*s+s/2, oy+y*s+s/2, s/2-1.6, 0, 7); c.fill();
    }
    txt(c,"VS",150,106,9,PAL.amber,"right");
  },
  start(api){
    const COLS=7, ROWS=6, CS=46;
    const {canvas,ctx,W,H}=api.canvas(COLS*CS, ROWS*CS+34, 360);
    const TOP=34;
    let b=Array.from({length:ROWS},()=>Array(COLS).fill(0));
    let mode="cpu", turn=1, over=false, lock=false, sel=3, msg="", winCells=[], wins=0;
    let seat=-1, mvN=0, seen=-1, stSeq=0, dropAnim=null;
    const COLR=[null,PAL.amber,PAL.red];
    function drop(c,p){
      for(let y=ROWS-1;y>=0;y--) if(!b[y][c]){ b[y][c]=p; return y; }
      return -1;
    }
    function winner(){
      const dirs=[[0,1],[1,0],[1,1],[1,-1]];
      for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){
        const p=b[y][x]; if(!p) continue;
        for(const [dy,dx] of dirs){
          const cells=[[y,x]];
          for(let k=1;k<4;k++){
            const ny=y+dy*k, nx=x+dx*k;
            if(ny<0||nx<0||ny>=ROWS||nx>=COLS||b[ny][nx]!==p) break;
            cells.push([ny,nx]);
          }
          if(cells.length===4) return {p, cells};
        }
      }
      return b[0].every(v=>v)?{p:0,cells:[]}:null;
    }
    function open(){ const o=[]; for(let x=0;x<COLS;x++) if(!b[0][x]) o.push(x); return o; }
    /* CPU：4手先まで読む */
    function score4(p){
      let s=0;
      const dirs=[[0,1],[1,0],[1,1],[1,-1]];
      for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){
        for(const [dy,dx] of dirs){
          const ey=y+dy*3, ex=x+dx*3;
          if(ey<0||ex<0||ey>=ROWS||ex>=COLS) continue;
          let me=0, you=0;
          for(let k=0;k<4;k++){
            const v=b[y+dy*k][x+dx*k];
            if(v===p) me++; else if(v) you++;
          }
          if(me&&!you) s+=[0,1,8,60,0][me];
          if(you&&!me) s-=[0,1,10,80,0][you];
        }
      }
      for(let y=0;y<ROWS;y++) s+=b[y][3]===p?4:(b[y][3]?-4:0);
      return s;
    }
    /* p = これから打つ側。戻り値は p から見た評価。 */
    function nega(depth,p,alpha,beta){
      const w=winner();
      if(w){ if(!w.p) return 0; return w.p===p ? 10000-depth : depth-10000; }
      if(depth>=4) return score4(p);
      const o=open();
      if(!o.length) return 0;
      let bestV=-1e9;
      for(const c of o){
        const y=drop(c,p);
        const v=-nega(depth+1, p===1?2:1, -beta, -alpha);
        b[y][c]=0;
        if(v>bestV) bestV=v;
        if(bestV>alpha) alpha=bestV;
        if(alpha>=beta) break;
      }
      return bestV;
    }
    function cpuPick(){
      const o=open();
      if(!o.length) return -1;
      /* 1手勝ち・1手負けは先に見る */
      for(const c of o){ const y=drop(c,2); const w=winner(); b[y][c]=0; if(w&&w.p===2) return c; }
      for(const c of o){ const y=drop(c,1); const w=winner(); b[y][c]=0; if(w&&w.p===1) return c; }
      let bestV=-1e9, mv=o[Math.floor(o.length/2)];
      for(const c of o){
        const y=drop(c,2);
        const v=-nega(1,1,-1e9,1e9);
        b[y][c]=0;
        if(v>bestV){ bestV=v; mv=c; }
      }
      return mv;
    }
    function render(){
      px(ctx,0,0,W,H,PAL.screen);
      /* 選んでいる列 */
      if(!over&&canAct()){
        px(ctx,sel*CS+3,0,CS-6,TOP-8,"rgba(227,167,60,.18)");
        const p=myMark();
        ctx.fillStyle=COLR[p]||PAL.amber;
        ctx.beginPath(); ctx.arc(sel*CS+CS/2, TOP/2-3, 11, 0, 7); ctx.fill();
      }
      px(ctx,0,TOP,W,H-TOP,PAL.dim2);
      for(let y=0;y<ROWS;y++) for(let x=0;x<COLS;x++){
        const cx=x*CS+CS/2, cy=TOP+y*CS+CS/2;
        const v=b[y][x];
        const isWin=winCells.some(([wy,wx])=>wy===y&&wx===x);
        ctx.fillStyle = v?COLR[v]:PAL.screen;
        ctx.beginPath(); ctx.arc(cx,cy,CS/2-4,0,7); ctx.fill();
        if(v){
          ctx.fillStyle="rgba(255,255,255,.22)";
          ctx.beginPath(); ctx.arc(cx-5,cy-5,5,0,7); ctx.fill();
        }
        if(isWin){
          ctx.strokeStyle=PAL.bone; ctx.lineWidth=3;
          ctx.beginPath(); ctx.arc(cx,cy,CS/2-4,0,7); ctx.stroke();
        }
      }
      if(msg){
        px(ctx,0,H/2-24,W,48,"rgba(14,18,13,.82)");
        txt(ctx,msg,W/2,H/2,22,PAL.amber,"center");
      }
      api.fx.draw(ctx);
    }
    function myMark(){
      if(mode==="online") return seat===0?1:2;
      if(mode==="duo") return turn;
      return 1;
    }
    function canAct(){
      if(over||lock) return false;
      if(mode==="online") return seat>=0 && turn===myMark();
      return true;
    }
    function info(){
      if(mode==="cpu") api.info("あなた=<b>黄</b>／CPU=赤"+(wins?"　"+wins+"勝":""));
      else if(mode==="duo") api.info(turn===1?"<b>黄</b> のばん":"<b>赤</b> のばん");
      else api.info((turn===myMark()?"<b>あなた</b>のばん":"あいてのばん")+"／あなたは "+(myMark()===1?"黄":"赤"));
    }
    function settle(w){
      if(!w) return false;
      over=true; winCells=w.cells||[];
      if(w.p===0){ msg="ひきわけ"; api.sfx.bad(); }
      else {
        const mine=w.p===myMark();
        msg=w.p===1?"黄のかち":"赤のかち";
        w.cells.forEach(([y,x])=>api.fx.burst(x*CS+CS/2,TOP+y*CS+CS/2,{n:8,col:COLR[w.p],sp:95}));
        api.fx.shake(6);
        mine?api.sfx.great():api.sfx.bad();
      }
      render();
      const mine=w.p===myMark();
      if(mode==="cpu"){
        if(w.p===1){ wins++; api.add(300); api.over({title:"かち", msg:"CPUに勝ちました"}); }
        else if(w.p===0) api.over({title:"ひきわけ", score:60, msg:"盤が埋まりました"});
        else api.over({title:"まけ", score:0, save:false, value:"LOSE", msg:"CPUの勝ちです"});
      } else if(mode==="duo"){
        api.over({title:msg, score:0, save:false, value:w.p===0?"DRAW":(w.p===1?"黄":"赤"), msg:"ふたり対戦の結果"});
      } else {
        api.over({title:w.p===0?"ひきわけ":(mine?"あなたの勝ち":"あなたの負け"),
          score:0, save:false, value:w.p===0?"DRAW":(mine?"WIN":"LOSE"), msg:"オンライン対戦の結果"});
      }
      return true;
    }
    function playCol(c){
      if(!canAct()) return;
      if(b[0][c]) return;
      if(mode==="online"&&seat!==0){
        mvN++; api.net.put({mv:{n:mvN,c:c}}); api.sfx.tap(); return;
      }
      const p=mode==="duo"?turn:myMark();
      const y=drop(c,p);
      if(y<0) return;
      api.sfx.tap();
      api.fx.burst(c*CS+CS/2,TOP+y*CS+CS/2,{n:5,col:COLR[p],sp:60,life:.3});
      const w=winner();
      if(mode==="online"){
        if(w){ turn=0; stSeq++; api.net.put({st:{seq:stSeq,b:flat(),t:0,ov:1}}); settle(w); return; }
        turn=2; stSeq++; api.net.put({st:{seq:stSeq,b:flat(),t:turn,ov:0}});
        info(); render(); return;
      }
      if(w){ settle(w); return; }
      if(mode==="duo"){ turn=turn===1?2:1; info(); render(); return; }
      /* CPU の手番 */
      render(); lock=true; info();
      api.after(420,()=>{
        if(over) return;
        const cc=cpuPick();
        if(cc>=0){
          const yy=drop(cc,2);
          api.fx.burst(cc*CS+CS/2,TOP+yy*CS+CS/2,{n:5,col:PAL.red,sp:60,life:.3});
          api.sfx.tap();
        }
        const w2=winner();
        lock=false;
        if(w2){ settle(w2); return; }
        info(); render();
      });
    }
    function flat(){ return b.map(r=>r.join("")).join(""); }
    function unflat(s){
      const out=[];
      for(let y=0;y<ROWS;y++) out.push(s.slice(y*COLS,(y+1)*COLS).split("").map(Number));
      return out;
    }
    api.on(canvas,"pointerdown",e=>{
      e.preventDefault();
      const p=api.pos(canvas,e);
      const c=Math.max(0,Math.min(COLS-1,Math.floor(p.x/CS)));
      sel=c; playCol(c);
    });
    api.controls({dpad:"lr", a:{label:"落とす",fn:()=>playCol(sel)}, legend:"←→ で列をえらぶ"});
    api.modes([
      {id:"cpu", label:"CPUとたたかう"},
      {id:"duo", label:"ふたりで（同じ端末）"},
      {id:"online", label:"オンライン対戦"}
    ]).then(m=>{
      mode=m;
      if(m==="online"){
        matchUI(api,()=>{
          seat=api.net.seat(); turn=1; over=false; msg=""; winCells=[];
          b=Array.from({length:ROWS},()=>Array(COLS).fill(0));
          if(seat===0){ stSeq++; api.net.put({st:{seq:stSeq,b:flat(),t:1,ov:0}}); }
          info(); render();
        });
      } else { info(); render(); }
    });
    api.loop(()=>{
      if(Input.hit("ArrowLeft")){ sel=Math.max(0,sel-1); api.sfx.tap(); render(); }
      if(Input.hit("ArrowRight")){ sel=Math.min(COLS-1,sel+1); api.sfx.tap(); render(); }
      if(Input.hit("Space")) playCol(sel);
      if(mode!=="online"||seat<0) return;
      const list=api.net.list();
      if(list.length<2&&!over){
        over=true;
        lostPeer(api,()=>{
          seat=-1; over=false;
          matchUI(api,()=>{
            seat=api.net.seat(); turn=1; over=false; msg=""; winCells=[];
            b=Array.from({length:ROWS},()=>Array(COLS).fill(0));
            if(seat===0){ stSeq++; api.net.put({st:{seq:stSeq,b:flat(),t:1,ov:0}}); }
            info(); render();
          });
        });
        return;
      }
      seat=api.net.seat();
      if(seat===0){
        const g=api.net.at(1);
        const mv=g&&g.presence&&g.presence.mv;
        if(mv&&mv.n>seen&&!over&&turn===2){
          seen=mv.n;
          const c=mv.c|0;
          if(c>=0&&c<COLS&&!b[0][c]){
            const y=drop(c,2);
            api.fx.burst(c*CS+CS/2,TOP+y*CS+CS/2,{n:5,col:PAL.red,sp:60,life:.3});
            api.sfx.tap();
            const w=winner();
            if(w){ turn=0; stSeq++; api.net.put({st:{seq:stSeq,b:flat(),t:0,ov:1}}); settle(w); return; }
            turn=1; stSeq++; api.net.put({st:{seq:stSeq,b:flat(),t:turn,ov:0}});
            info(); render();
          }
        }
      } else {
        const h=api.net.at(0);
        const st=h&&h.presence&&h.presence.st;
        if(st&&st.seq>stSeq){
          stSeq=st.seq;
          if(typeof st.b==="string"&&st.b.length===ROWS*COLS) b=unflat(st.b);
          turn=st.t|0;
          const w=winner();
          if(st.ov&&!over) settle(w||{p:0,cells:[]});
          info(); render();
        }
      }
    });
  }
});
