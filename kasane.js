/* ポケット17 — 「かさね」の計算部分
 *
 * 記録しているのは位置ではなく「押していたボタン」。
 * だから世界が変われば、過去の自分の動きの結果も変わる。
 *
 * 同じ入力を与えれば必ず同じ結果になる（決定論）。
 * おかげで、各ステージの正解手順をテストで再生して
 * 「本当にクリアできる」ことを証明できる。
 */
"use strict";

const KASANE = (()=>{
  const STEP=5;             /* 1マス進むのにかかる刻み数 */
  const LIMIT=240;          /* 1人ぶんの持ち時間（刻み）= 12秒 */
  const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];   /* 上 右 下 左 */

  /* 地形の記号
     # 壁   . 床   @ 出発   G ゴール   O 穴   B 箱
     1 2 3 ふむと開く板     A B C それぞれに対応する扉
     （箱の B と扉の B は、箱を小文字 b で書いて区別する） */
  function parse(rows){
    const h=rows.length, w=rows[0].length;
    const tiles=[], boxes=[];
    let start=null, goal=null;
    for(let y=0;y<h;y++){
      const line=[];
      for(let x=0;x<w;x++){
        const c=rows[y][x];
        let t=".";
        if(c==="#") t="#";
        else if(c==="O") t="O";
        else if(c==="@"){ start={x,y}; t="."; }
        else if(c==="G"){ goal={x,y}; t="G"; }
        else if(c==="b"){ boxes.push({x,y}); t="."; }
        else if("123".indexOf(c)>=0) t=c;
        else if("ABC".indexOf(c)>=0) t=c;
        line.push(t);
      }
      tiles.push(line);
    }
    return {w,h,tiles,start,goal,boxes};
  }

  const DOOR_OF={"1":"A","2":"B","3":"C"};

  function create(level, traces){
    const L=parse(level.map);
    const st={
      L:L,
      tick:0,
      boxes:L.boxes.map(b=>({x:b.x,y:b.y,px:b.x,py:b.y,prog:0})),
      filled:{},                       /* 埋まった穴 */
      selves:[],
      done:null,                       /* "clear" | "timeout" */
      live:null
    };
    (traces||[]).forEach((tr,i)=>{
      st.selves.push({i:i, x:L.start.x, y:L.start.y, px:L.start.x, py:L.start.y,
                      prog:0, dir:2, alive:true, trace:tr, rec:null});
    });
    st.live={i:st.selves.length, x:L.start.x, y:L.start.y, px:L.start.x, py:L.start.y,
             prog:0, dir:2, alive:true, trace:null, rec:[]};
    st.selves.push(st.live);
    return st;
  }

  const at=(st,x,y)=>{
    if(x<0||y<0||x>=st.L.w||y>=st.L.h) return "#";
    const t=st.L.tiles[y][x];
    if(t==="O" && st.filled[x+","+y]) return ".";
    return t;
  };
  const boxAt=(st,x,y)=> st.boxes.find(b=>b.x===x&&b.y===y&&b.prog===0) || null;

  /* 板がふまれているか（人か箱が乗っていれば押されている） */
  function pressed(st, ch){
    for(const s of st.selves){
      if(s.alive && st.L.tiles[s.y][s.x]===ch) return true;
    }
    for(const b of st.boxes){
      if(st.L.tiles[b.y][b.x]===ch) return true;
    }
    return false;
  }
  function doorOpen(st, ch){
    const plate=Object.keys(DOOR_OF).find(k=>DOOR_OF[k]===ch);
    return plate ? pressed(st, plate) : false;
  }
  function passable(st,x,y){
    const t=at(st,x,y);
    if(t==="#") return false;
    if("ABC".indexOf(t)>=0) return doorOpen(st,t);
    return true;
  }

  /* 1刻みすすめる。dir は 0..3、なければ -1。 */
  function step(st, liveDir){
    if(st.done) return st.done;
    const d=(liveDir===undefined||liveDir===null)?-1:liveDir;
    if(st.live.rec) st.live.rec.push(d);

    st.boxes.forEach(b=>{ if(b.prog>0){ b.prog--; if(b.prog===0){ b.px=b.x; b.py=b.y; } } });

    for(const s of st.selves){
      if(!s.alive) continue;
      if(s.prog>0){
        s.prog--;
        if(s.prog>0) continue;
        /* 到着。そのまま同じ刻みで次の一歩を読む（押しっぱなしで止まらないように） */
        s.px=s.x; s.py=s.y;
        const t=at(st,s.x,s.y);
        if(t==="O"){                       /* 穴に落ちて、そこが床になる */
          st.filled[s.x+","+s.y]=1;
          s.alive=false; s.fell=true;
          continue;
        }
        if(t==="G"){ st.done="clear"; return st.done; }
      }
      const want = (s===st.live) ? d : (s.trace[st.tick]===undefined?-1:s.trace[st.tick]);
      if(want<0||want>3) continue;
      s.dir=want;
      const [dx,dy]=DIRS[want];
      const nx=s.x+dx, ny=s.y+dy;
      if(!passable(st,nx,ny)) continue;
      const box=boxAt(st,nx,ny);
      if(box){
        const bx=nx+dx, by=ny+dy;
        if(!passable(st,bx,by)) continue;
        if(boxAt(st,bx,by)) continue;
        if(at(st,bx,by)==="O"){            /* 箱が穴に落ちて埋める */
          st.filled[bx+","+by]=1;
          st.boxes=st.boxes.filter(b=>b!==box);
        } else {
          box.px=box.x; box.py=box.y;
          box.x=bx; box.y=by; box.prog=STEP;
        }
      }
      s.px=s.x; s.py=s.y;
      s.x=nx; s.y=ny; s.prog=STEP;
    }

    st.tick++;
    if(st.tick>=LIMIT && !st.done) st.done="timeout";
    return st.done;
  }

  /* 記録ぶんをまとめて再生する（テスト用） */
  function run(level, traces, liveTrace){
    const st=create(level, traces);
    const t=liveTrace||[];
    for(let i=0;i<LIMIT;i++){
      const r=step(st, i<t.length?t[i]:-1);
      if(r) return {result:r, tick:st.tick, state:st};
    }
    return {result:st.done||"timeout", tick:st.tick, state:st};
  }
  /* 手順の書き方: [[方向, 刻み数], ...]  方向は u r d l、待つときは w */
  function trace(parts){
    const map={u:0,r:1,d:2,l:3,w:-1};
    const out=[];
    parts.forEach(([k,n])=>{ for(let i=0;i<n;i++) out.push(map[k]); });
    return out;
  }
  /* 手順の並びを順に実行して、最後にクリアできるか見る */
  function play(level, list){
    const traces=[];
    let last=null;
    for(const t of list){
      last=run(level, traces, t);
      if(last.result==="clear") return {clear:true, used:traces.length+1, tick:last.tick};
      traces.push(t.slice(0,LIMIT));
    }
    return {clear:false, used:traces.length, tick:last?last.tick:0};
  }

  return {STEP, LIMIT, DIRS, parse, create, step, run, trace, play, at, boxAt, passable, doorOpen, pressed};
})();
