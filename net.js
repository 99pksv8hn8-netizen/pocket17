/* ポケット17 — 通信
 *
 * 置き場所によって中身が入れかわる。どちらでもゲーム側からの使い方は同じ。
 *   claude.ai のページ    … そこに用意されている room 機能
 *   自分のサイト（通常）  … WebRTC でブラウザ同士を直接つなぐ（PeerJS）
 *
 * 席のきまり:
 *   席0 = 先に部屋を作った側。進行役。盤面の正解を持つ。
 *   席1 = あとから入った側。自分の手だけを送る。
 */
"use strict";
const Net = (()=>{
  const LIB = "https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js";
  let kind=null, probed=false, code="", cb=null;
  /* claude.ai 側 */
  let claudeNs=null, rm=null, unsub=null;
  /* WebRTC 側 */
  let peer=null, conn=null, role=null, mine={}, theirs=null, libLoad=null, heal=null;

  const nick = ()=> store.get("nick","") || "";
  const nickOut = ()=> (nick().slice(0,12) || "プレイヤー");
  const sane = c => String(c||"").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,20) || "room";
  const fire = ()=>{ if(cb) try{ cb(list()); }catch(e){} };

  /* ---------- どの方式が使えるか ---------- */
  async function probe(){
    if(probed) return kind;
    probed=true;
    try{
      if(window.claude && typeof window.claude.use==="function"){
        const ns=await window.claude.use("room");
        if(ns){ claudeNs=ns; kind="room"; return kind; }
      }
    }catch(e){}
    if(typeof window.RTCPeerConnection==="function") kind="peer";
    return kind;
  }

  function loadLib(){
    if(window.Peer) return Promise.resolve(true);
    if(libLoad) return libLoad;
    libLoad=new Promise(res=>{
      let done=false;
      const fin=v=>{ if(!done){ done=true; res(v); } };
      const s=document.createElement("script");
      s.src=LIB; s.async=true; s.crossOrigin="anonymous";
      s.onload=()=>fin(!!window.Peer);
      s.onerror=()=>fin(false);
      document.head.appendChild(s);
      setTimeout(()=>fin(!!window.Peer), 12000);
    });
    return libLoad;
  }

  /* ---------- 入室 ---------- */
  async function enter(c, onChange){
    const k=await probe();
    cb=onChange||null;
    code=sane(c);
    if(k==="room") return enterRoom();
    if(k==="peer") return enterPeer();
    return {ok:false, why:"この端末では通信が使えません"};
  }

  async function enterRoom(){
    try{
      rm=await claudeNs.join("p17-"+code);
    }catch(e){
      return {ok:false, why:(e&&e.code==="not_permitted")
        ? "このページでは通信が許可されていません" : "つながりませんでした"};
    }
    unsub=rm.onPeers(()=>fire(), ()=>fire());
    try{ await rm.presence({nick:nickOut(), t:Date.now()}); }catch(e){}
    return {ok:true};
  }

  async function enterPeer(){
    if(!(await loadLib())) return {ok:false, why:"通信の部品を読み込めませんでした。通信環境を確かめてください"};
    const id="p17-"+code;
    mine={nick:nickOut(), t:Date.now()};
    theirs=null; role=null;

    /* まず部屋の主になってみる。すでに主がいれば客として入る。 */
    const host=await claim(id);
    if(host.ok){
      role="host"; peer=host.peer;
      peer.on("connection", c=>attach(c));
      guard();
      fire();
      return {ok:true};
    }
    if(host.type==="timeout")
      return {ok:false, why:"仲介サーバーに届きませんでした。少し待ってやり直してください"};
    if(host.type!=="unavailable-id")
      return {ok:false, why:"つながりませんでした（"+(host.type||"原因不明")+"）"};

    const g=await join(id);
    if(!g.ok) return {ok:false, why:g.why};
    role="guest"; peer=g.peer;
    attach(g.conn);
    guard();
    fire();
    return {ok:true};
  }

  /* 合言葉の名前を自分のものにできれば部屋の主 */
  function claim(id){
    return new Promise(res=>{
      let done=false, p;
      const fin=v=>{ if(!done){ done=true; clearTimeout(t); res(v); } };
      try{ p=new window.Peer(id,{debug:0}); }
      catch(e){ res({ok:false,type:"init"}); return; }
      const t=setTimeout(()=>{ try{p.destroy();}catch(e){} fin({ok:false,type:"timeout"}); }, 9000);
      p.on("open", ()=> fin({ok:true, peer:p}));
      p.on("error", e=>{
        const type=e&&e.type;
        if(type==="unavailable-id"){ try{p.destroy();}catch(_){} fin({ok:false,type:type}); return; }
        if(done) return;
        try{p.destroy();}catch(_){}
        fin({ok:false,type:type});
      });
    });
  }

  function join(id){
    return new Promise(res=>{
      let done=false, p;
      const fin=v=>{ if(!done){ done=true; clearTimeout(t); res(v); } };
      try{ p=new window.Peer(undefined,{debug:0}); }
      catch(e){ res({ok:false,why:"通信を開始できませんでした"}); return; }
      const t=setTimeout(()=>{
        try{p.destroy();}catch(e){}
        fin({ok:false,why:"相手に届きませんでした。合言葉を確かめて、もう一度ためしてください"});
      }, 12000);
      p.on("open", ()=>{
        let c;
        try{ c=p.connect(id,{reliable:true}); }
        catch(e){ try{p.destroy();}catch(_){} fin({ok:false,why:"相手に接続できませんでした"}); return; }
        c.on("open", ()=> fin({ok:true, peer:p, conn:c}));
        c.on("error", ()=>{ try{p.destroy();}catch(_){} fin({ok:false,why:"相手に接続できませんでした"}); });
      });
      p.on("error", e=>{
        const type=e&&e.type;
        try{p.destroy();}catch(_){}
        fin({ok:false, why: type==="peer-unavailable"
          ? "その合言葉の相手が見つかりません" : "つながりませんでした（"+(type||"原因不明")+"）"});
      });
    });
  }

  function send(c, patch){
    if(c && c.open){ try{ c.send({p:patch}); }catch(e){} }
  }
  function attach(c){
    conn=c;
    let greeted=false;
    /* 自分の状態をまるごと送る。
     * つながった直後は相手がまだ受け口を用意していないことがあるので、
     * (1)つながった時 (2)相手から最初の便りが来た時 (3)2秒ごと の3回路で送る。 */
    const whole=()=>send(c, mine);
    const ready=()=>{
      theirs = theirs || {};
      whole();
      if(heal) clearInterval(heal);
      heal=setInterval(()=>{ if(c.open) whole(); else { clearInterval(heal); heal=null; } }, 2000);
      fire();
    };
    const gone=()=>{
      theirs=null;
      if(conn===c) conn=null;
      if(heal){ clearInterval(heal); heal=null; }
      fire();
    };
    c.on("data", d=>{
      if(!d || typeof d!=="object" || !d.p || typeof d.p!=="object") return;
      theirs = theirs || {};
      Object.keys(d.p).forEach(k=>{
        if(d.p[k]===null) delete theirs[k];
        else theirs[k]=d.p[k];
      });
      if(!greeted){ greeted=true; whole(); }
      fire();
    });
    c.on("open", ready);
    c.on("close", gone);
    c.on("error", gone);
    if(c.open) ready(); else fire();
  }

  function guard(){
    if(!peer) return;
    peer.on("disconnected", ()=>{ try{ peer.reconnect(); }catch(e){} });
    peer.on("close", ()=>{ theirs=null; conn=null; fire(); });
    peer.on("error", ()=> fire());
  }

  /* ---------- 参加者 ---------- */
  function slot(who){
    const isMe = (who===role);
    return {
      peer: who, by: who, kind:"viewer", guest:false,
      isMe: isMe, sameTab: isMe,
      presence: isMe ? mine : (theirs || {}),
      updatedAt: Date.now()
    };
  }
  function list(){
    if(kind==="room"){
      if(!rm) return [];
      return rm.peers().filter(p=>p.kind==="viewer").slice()
               .sort((a,b)=> a.peer<b.peer?-1:a.peer>b.peer?1:0);
    }
    if(kind==="peer" && role){
      if(!theirs) return [slot(role)];
      return role==="host" ? [slot("host"), slot("guest")] : [slot("host"), slot("guest")];
    }
    return [];
  }
  /* 席の番号は並び順ではなく役で決める */
  function seat(){
    if(kind==="peer") return role==="host" ? 0 : role==="guest" ? 1 : -1;
    const l=list(), m=l.find(p=>p.sameTab);
    return m ? l.indexOf(m) : -1;
  }
  function at(i){
    if(kind==="peer"){
      if(!role) return null;
      const want = i===0 ? "host" : i===1 ? "guest" : null;
      if(!want) return null;
      if(want!==role && !theirs) return null;
      return slot(want);
    }
    return list()[i] || null;
  }
  function me(){
    if(kind==="peer") return role ? slot(role) : null;
    return list().find(p=>p.sameTab) || null;
  }

  function put(patch){
    if(!patch) return;
    if(kind==="room"){ if(rm) rm.presence(patch).catch(()=>{}); return; }
    if(kind==="peer"){
      Object.keys(patch).forEach(k=>{
        if(patch[k]===null) delete mine[k];
        else mine[k]=patch[k];
      });
      if(conn && conn.open){ try{ conn.send({p:patch}); }catch(e){} }
    }
  }

  function leave(){
    if(heal){ clearInterval(heal); heal=null; }
    if(unsub){ try{ unsub(); }catch(e){} unsub=null; }
    if(rm){ try{ rm.leave(); }catch(e){} rm=null; }
    if(conn){ try{ conn.close(); }catch(e){} conn=null; }
    if(peer){ try{ peer.destroy(); }catch(e){} peer=null; }
    role=null; mine={}; theirs=null; cb=null; code="";
  }

  return {
    probe, enter, leave, list, me, seat, at, put, nick,
    setNick(n){ store.set("nick", String(n||"").slice(0,12)); },
    code:()=>code,
    kind:()=>kind,
    live:()=> kind==="room" ? !!rm : !!role
  };
})();
