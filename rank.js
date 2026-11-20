/* ポケット17 — 名前とランキング
 *
 * 記録はこの端末のなかだけに残る。
 * 同じ端末で名前を変えながら遊べば、順位がついて競える。
 *
 * あとで全国ランキングにしたくなったら、read() と write() の中身を
 * 外部サービスの読み書きに差し替えるだけでいい。呼び出し側は変えなくて済む。
 */
"use strict";
const Rank = (()=>{
  const KEY = "rank";
  const GUEST = "ゲスト";
  const MAXN = 8;

  /* 保存の形
     { games: { <ゲームid>: { lower:bool, rows:{ <名前>:{s:点, at:時刻} } } } } */
  function read(){
    const d = store.get(KEY, null);
    if(!d || typeof d!=="object" || !d.games) return {games:{}};
    return d;
  }
  function write(d){ store.set(KEY, d); }

  /* 名前は8文字まで。改行や見えない文字は落とす。 */
  function clean(n){
    return String(n==null?"":n)
      .replace(/[\u0000-\u001f\u007f​-‏‪-‮﻿]/g,"")
      .replace(/\s+/g," ")
      .trim()
      .slice(0, MAXN);
  }
  function name(){ return clean(store.get("nick","")) || GUEST; }
  function named(){ return clean(store.get("nick","")) !== ""; }
  function setName(n){
    const c = clean(n);
    store.set("nick", c);
    return c;
  }

  /* 成績を記録する。自己ベストを更新したときだけ true を返す。 */
  function submit(gameId, score, lower){
    if(!gameId || !isFinite(score) || score<=0) return false;
    const who = name();
    const d = read();
    const g = d.games[gameId] || (d.games[gameId] = {lower:!!lower, rows:{}});
    g.lower = !!lower;
    const now = Date.now();
    const had = g.rows[who];
    const better = !had || (lower ? score < had.s : score > had.s);
    if(!better) return false;
    g.rows[who] = {s:Math.round(score), at:now};
    write(d);
    return true;
  }

  /* そのゲームの順位表 */
  function board(gameId){
    const d = read();
    const g = d.games[gameId];
    if(!g) return [];
    const rows = Object.keys(g.rows).map(n=>({name:n, s:g.rows[n].s, at:g.rows[n].at}));
    rows.sort((a,b)=> g.lower ? a.s-b.s : b.s-a.s);
    return rows;
  }
  function games(){ return Object.keys(read().games); }

  /* 総合成績。各ゲームの順位を点に換算して合計する。 */
  const PT = [10,6,4];
  function standings(){
    const d = read();
    const pt = {};
    Object.keys(d.games).forEach(gid=>{
      board(gid).forEach((r,i)=>{
        pt[r.name] = (pt[r.name]||0) + (PT[i]!==undefined ? PT[i] : 1);
      });
    });
    return Object.keys(pt)
      .map(n=>Object.assign({name:n, pt:pt[n]}, grade(pt[n])))
      .sort((a,b)=> b.pt-a.pt || (a.name<b.name?-1:1));
  }
  function grade(pt){
    const lv = 1 + Math.floor(pt/5);
    const t = lv>=50 ? "プラチナ" : lv>=25 ? "ゴールド" : lv>=10 ? "シルバー" : "ブロンズ";
    return {lv:lv, tier:t};
  }
  function me(){
    const who = name();
    const all = standings();
    const hit = all.find(r=>r.name===who);
    return hit || Object.assign({name:who, pt:0}, grade(0));
  }

  /* 消す。name だけ渡せばその人の全記録、両方渡せば1件。 */
  function erase(who, gameId){
    const d = read();
    if(gameId){
      if(d.games[gameId] && d.games[gameId].rows[who]) delete d.games[gameId].rows[who];
    } else {
      Object.keys(d.games).forEach(g=>{ delete d.games[g].rows[who]; });
    }
    Object.keys(d.games).forEach(g=>{
      if(!Object.keys(d.games[g].rows).length) delete d.games[g];
    });
    write(d);
  }
  function eraseAll(){ write({games:{}}); }

  return {name, named, setName, clean, submit, board, games, standings, grade, me, erase, eraseAll,
          GUEST, MAXN};
})();
