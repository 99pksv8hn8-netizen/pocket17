/* ポケット17 — ゲーム23「かさね」 */
"use strict";

/* ステージ。記号は kasane.js の parse を参照。
   @出発 Gゴール #壁 .床 O穴 b箱 1,2,3ふむ板 A,B,C対応する扉 */
const KASANE_LEVELS=[
  { name:"ふたりめ", hint:"板をふんでいる間だけ扉が開く。1人では足りない。",
    map:["##########",
         "#@..#...G#",
         "#...A....#",
         "#...#....#",
         "#1..#....#",
         "##########"] },

  { name:"はこ", hint:"箱を板にのせれば、ふみっぱなしになる。",
    map:["##########",
         "#@...#...#",
         "#.b..#...#",
         "#..1.A..G#",
         "##########"] },

  { name:"はし", hint:"穴に落ちた自分は、そこを埋める床になる。",
    map:["##########",
         "#@..O...G#",
         "##########"] },

  { name:"ふたつの扉", hint:"奥の板をふむには、手前の扉が開いている必要がある。",
    map:["############",
         "#@..#..#...#",
         "#...A..B..G#",
         "#1..#2.#...#",
         "############"] },

  { name:"とめる", hint:"箱で道をふさげば、過去の自分はそこで止まる。",
    map:["############",
         "#@...1.#..G#",
         "#......A...#",
         "#.....b....#",
         "#..........#",
         "############"] },

  { name:"しあげ", hint:"埋めて、とめて、ふませる。",
    map:["############",
         "#@..O.1.#.G#",
         "#.......A..#",
         "#...b......#",
         "#..........#",
         "############"] }
];

GAMES.push({
  id:"kasane", title:"かさね", cat:"パズル", lower:false,
  ctrl:"十字キーで移動／A つぎの自分へ／B やりなおし",
  about:"過去の自分と同時に動いて解く、ひとりきりの共同作業",
  kw:"puzzle replay ghost kasane time",
  hint:"12秒たつと、その操作が記録されて次の自分が出てきます。記録しているのは位置ではなく操作です。",
  thumb(c,W,H){
    const s=14, ox=8, oy=14;
    const map=["##########","#@..O...G#","##########"];
    for(let y=0;y<3;y++) for(let x=0;x<10;x++){
      const ch=map[y][x];
      px(c, ox+x*s, oy+y*s, s-1, s-1, ch==="#"?"#2b3326":ch==="O"?"#141a13":"#1f251c");
      if(ch==="G") px(c, ox+x*s+3, oy+y*s+3, s-7, s-7, PAL.amber);
    }
    /* 過去の自分（うすい）と、いまの自分 */
    [[2,1,"rgba(79,160,140,.45)"],[3,1,"rgba(79,160,140,.7)"]].forEach(([x,y,col])=>{
      px(c, ox+x*s+3, oy+y*s+2, s-7, s-5, col);
    });
    px(c, ox+1*s+3, oy+1*s+2, s-7, s-5, PAL.teal);
    txt(c,"PUZZLE",150,104,9,PAL.dim,"right");
  },
  start(api){
    const CS=26, TOP=30;
    let lv=store.get("kasane:lv",0);
    if(lv>=KASANE_LEVELS.length) lv=0;
    let L=KASANE_LEVELS[lv];
    let traces=[], st=null, cleared=store.get("kasane:cleared",{});
    const {canvas,ctx}=api.canvas(12*CS, 6*CS+TOP, 360);
    const W=12*CS, H=6*CS+TOP;

    function begin(){
      L=KASANE_LEVELS[lv];
      traces=[];
      st=KASANE.create(L, traces);
      say();
    }
    function nextSelf(){
      if(!st) return;
      const rec=st.live.rec.slice();
      traces.push(rec);
      st=KASANE.create(L, traces);
      api.sfx.tap();
      say();
    }
    function restart(){
      traces=[];
      st=KASANE.create(L, traces);
      api.sfx.bad();
      say();
    }
    function say(extra){
      const left=Math.max(0, KASANE.LIMIT-st.tick);
      api.info("ステージ "+(lv+1)+"／"+KASANE_LEVELS.length+"　<b>"+L.name+"</b>　"+
               "自分 <b>"+(traces.length+1)+"</b>人　のこり "+(left/20).toFixed(1)+"秒"+(extra?"　"+extra:""));
    }
    function clearLevel(){
      const used=traces.length+1;
      cleared[lv]=Math.min(cleared[lv]||99, used);
      store.set("kasane:cleared", cleared);
      const total=Object.keys(cleared).length;
      const sum=Object.values(cleared).reduce((a,b)=>a+b,0);
      const score=total*1000+Math.max(0,600-sum*20);
      api.score(score); api.record(score);
      api.sfx.great(); api.fx.shake(5);
      const last = lv>=KASANE_LEVELS.length-1;
      api.sheet(
        '<h4>'+esc(L.name)+' クリア</h4>'+
        '<p class="fig tnum">'+used+'人</p>'+
        '<p>'+(last?"すべてのステージを解きました。":"次のステージへ進めます。")+'<br>'+
        'クリアずみ '+total+"／"+KASANE_LEVELS.length+'</p>'+
        '<div class="keys">'+
        (last?'':'<button class="key" id="nx">つぎへ</button>')+
        '<button class="key alt" id="rt2">もう一度</button>'+
        '<button class="key alt" id="bk6">一覧へ</button></div>'
      );
      if(!last) el("nx").onclick=()=>{ lv++; store.set("kasane:lv",lv); api.close(); begin(); };
      el("rt2").onclick=()=>{ api.close(); restart(); };
      el("bk6").onclick=()=>toMenu();
    }

    api.controls({dpad:true, a:{label:"つぎの自分",fn:()=>nextSelf()},
                  b:{label:"やりなおし",fn:()=>restart()},
                  legend:"12秒たつと<br>操作が記録される"});
    /* 画面タップでも移動できるように */
    api.on(canvas,"pointerdown",e=>{
      const r=canvas.getBoundingClientRect();
      const p=api.pos(canvas,e);
      const me=st&&st.live;
      if(!me||!me.alive) return;
      const cx=me.x*CS+CS/2, cy=TOP+me.y*CS+CS/2;
      const dx=p.x-cx, dy=p.y-cy;
      tapDir = Math.abs(dx)>Math.abs(dy) ? (dx>0?1:3) : (dy>0?2:0);
      tapHold=6;
    });
    let tapDir=-1, tapHold=0;

    function draw(){
      px(ctx,0,0,W,H,PAL.screen);
      const Lv=st.L;
      for(let y=0;y<Lv.h;y++) for(let x=0;x<Lv.w;x++){
        const sx=x*CS, sy=TOP+y*CS;
        const t=Lv.tiles[y][x];
        const filled=st.filled[x+","+y];
        if(t==="#"){
          px(ctx,sx,sy,CS-1,CS-1,"#2f3828");
          px(ctx,sx+2,sy+2,CS-5,3,"#3b452f");
          continue;
        }
        px(ctx,sx,sy,CS-1,CS-1,"#1b2119");
        px(ctx,sx+CS/2-1,sy+CS/2-1,2,2,"rgba(147,160,92,.22)");
        if(t==="O"&&!filled){
          px(ctx,sx+2,sy+2,CS-5,CS-5,"#0d110c");
          px(ctx,sx+5,sy+5,CS-11,CS-11,"#060806");
        }
        if(t==="O"&&filled){
          px(ctx,sx+2,sy+2,CS-5,CS-5,"#24301f");
          px(ctx,sx+5,sy+CS/2-1,CS-11,2,"rgba(147,160,92,.3)");
        }
        if("123".indexOf(t)>=0){
          const on=KASANE.pressed(st,t);
          px(ctx,sx+3,sy+3,CS-7,CS-7, on?"rgba(227,167,60,.35)":"rgba(147,160,92,.14)");
          px(ctx,sx+6,sy+6,CS-13,CS-13, on?PAL.amber:PAL.olive);
        }
        if("ABC".indexOf(t)>=0){
          const open=KASANE.doorOpen(st,t);
          if(open){
            px(ctx,sx+1,sy+1,4,CS-3,"rgba(227,167,60,.5)");
            px(ctx,sx+CS-6,sy+1,4,CS-3,"rgba(227,167,60,.5)");
          } else {
            px(ctx,sx+1,sy+1,CS-3,CS-3,PAL.amber);
            for(let k=0;k<3;k++) px(ctx,sx+3,sy+5+k*6,CS-7,2,"rgba(27,33,25,.4)");
          }
        }
        if(t==="G"){
          const t2=performance.now()/260;
          const g=3+Math.sin(t2)*1.2;
          px(ctx,sx+g,sy+g,CS-1-g*2,CS-1-g*2,"rgba(227,167,60,.25)");
          px(ctx,sx+6,sy+6,CS-13,CS-13,PAL.amber);
        }
      }
      /* 箱 */
      st.boxes.forEach(b=>{
        const f=b.prog/KASANE.STEP;
        const bx=(b.x*(1-f)+b.px*f)*CS, by=TOP+(b.y*(1-f)+b.py*f)*CS;
        px(ctx,bx+2,by+2,CS-5,CS-5,"#8a6a3a");
        px(ctx,bx+4,by+4,CS-9,3,"rgba(255,255,255,.25)");
        px(ctx,bx+2,by+CS/2-2,CS-5,3,"#6b5230");
      });
      /* 人。過去の自分ほど うすい */
      st.selves.forEach((s,i)=>{
        if(!s.alive) return;
        const f=s.prog/KASANE.STEP;
        const sx=(s.x*(1-f)+s.px*f)*CS, sy=TOP+(s.y*(1-f)+s.py*f)*CS;
        const isLive=(s===st.live);
        const a=isLive?1:0.3+0.4*(i/Math.max(1,st.selves.length-1));
        ctx.globalAlpha=a;
        px(ctx,sx+6,sy+4,CS-13,6,PAL.bone);
        px(ctx,sx+5,sy+10,CS-11,CS-15,isLive?PAL.teal:PAL.blue);
        const d=s.dir;
        px(ctx,sx+(d===1?CS-9:d===3?5:CS/2-2),sy+6,3,3,PAL.screen);
        ctx.globalAlpha=1;
        if(isLive){
          px(ctx,sx+CS/2-4,sy-4,8,3,PAL.amber);
        }
      });
      /* 上の帯 */
      px(ctx,0,0,W,TOP,"#141a13");
      txt(ctx,"自分 "+(traces.length+1)+"人",8,15,12,PAL.bone);
      const left=Math.max(0,KASANE.LIMIT-st.tick);
      txt(ctx,(left/20).toFixed(1)+"秒",W/2,15,13, left<60?PAL.red:PAL.olive,"center");
      txt(ctx,L.name,W-8,15,12,PAL.tx3,"right");
      px(ctx,0,TOP-3,W*(left/KASANE.LIMIT),3,left<60?PAL.red:PAL.olive);
      api.fx.draw(ctx);
    }

    begin();
    api.info("");
    let acc=0;
    api.loop(dt=>{
      acc+=dt;
      while(acc>=1/20){
        acc-=1/20;
        if(st.done==="clear") break;
        if(st.done==="timeout"){ nextSelf(); break; }
        let d=-1;
        if(Input.held("ArrowUp")) d=0;
        else if(Input.held("ArrowRight")) d=1;
        else if(Input.held("ArrowDown")) d=2;
        else if(Input.held("ArrowLeft")) d=3;
        if(d<0&&tapHold>0){ d=tapDir; tapHold--; }
        const r=KASANE.step(st,d);
        if(r==="clear"){ clearLevel(); break; }
        if(r==="timeout"){ nextSelf(); break; }
      }
      say();
      draw();
    });
  }
});
