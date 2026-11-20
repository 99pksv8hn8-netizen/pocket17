/* ポケット17 — オフラインでも遊べるようにする
 * つながっているときは必ず新しいファイルを取りにいき、
 * 取れなかったときだけ保存しておいたものを使う。
 * ファイルを更新したら下の v1 の数字を上げること。 */
const CACHE = "pocket17-v1";
const FILES = [
  "./", "index.html", "404.html", "manifest.webmanifest",
  "style.css",
  "core.js", "net.js", "app.js",
  "games-a.js", "games-b.js", "games-c.js",
  "games-vs.js", "boot.js",
  "favicon.svg", "favicon-32.png", "apple-touch-icon.png",
  "icon-192.png", "icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(FILES.map(f => c.add(f))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;  // フォント等はそのまま
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match("index.html")))
  );
});
