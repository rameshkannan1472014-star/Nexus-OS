/* Nexus OS — Batch 2a: Music · Clock (+Timer) · News · Camera (v41) */
(function () {
  "use strict";
  const N = window.NexusApps; if (!N) return;
  const { ic, esc, uid, store, toast, openSheet, closeSheet, setActive, showView, selectNav, timeStr } = N;
  Object.assign(N.I, {
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    prev: '<path d="M19 20 9 12l10-8Z"/><path d="M5 19V5"/>',
    next: '<path d="m5 4 10 8-10 8Z"/><path d="M19 5v14"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/>',
    alarm: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M5 3 2 6M22 6l-3-3"/>',
    stopwatch: '<circle cx="12" cy="14" r="8"/><path d="M12 10v4M10 2h4M18 6l1.5-1.5"/>',
    hourglass: '<path d="M5 22h14M5 2h14M17 22v-4.2a2 2 0 0 0-.6-1.4L12 12l-4.4 4.4a2 2 0 0 0-.6 1.4V22M7 2v4.2a2 2 0 0 0 .6 1.4L12 12l4.4-4.4a2 2 0 0 0 .6-1.4V2"/>',
    camera: '<path d="M14.5 4h-5L7.5 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.5Z"/><circle cx="12" cy="13" r="3.5"/>',
    flip: '<path d="M20 11a8 8 0 0 0-14.7-4.4L4 8"/><path d="M4 3v5h5M4 13a8 8 0 0 0 14.7 4.4L20 16"/><path d="M20 21v-5h-5"/>',
    flash: '<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>',
    newspaper: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0v-9h4"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8Z"/>',
    timer3: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4M10 2h4"/>'
  });
  const onClose = (win, fn) => { const t = setInterval(() => { if (!win.isConnected) { clearInterval(t); fn(); } }, 700); };
  const pad = (n) => String(n).padStart(2, "0");
  async function sysNotify(title, body, tag) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try { const reg = await navigator.serviceWorker?.getRegistration?.(); if (reg?.showNotification) await reg.showNotification(title, { body, icon: "./icon.svg", tag }); else new Notification(title, { body, icon: "./icon.svg", tag }); } catch (_) {}
  }

  /* ================================================================== *
   * MUSIC — full songs through the official YouTube player (song info &
   * artwork from iTunes). Falls back to a 30-second preview.
   * ================================================================== */
  const M = { audio: new Audio(), queue: [], idx: -1, shuffle: false, repeat: false, libTab: "library", mode: "none", loading: "", token: 0, full: store.get("nexus-music-full", true) };
  M.audio.preload = "none";
  const PICKS = [["Tamil hits", "tamil hits"], ["Anirudh", "anirudh ravichander"], ["A.R. Rahman", "a r rahman"], ["Lo-fi study", "lofi study beats"], ["Bollywood", "bollywood hits"], ["English pop", "pop hits"], ["Workout", "workout motivation"]];
  const ARTISTS = ["Anirudh Ravichander", "A. R. Rahman", "Arijit Singh", "Sid Sriram", "Yuvan Shankar Raja", "Shreya Ghoshal", "Taylor Swift", "Ed Sheeran", "Imagine Dragons"];
  const PLAYLISTS = [["Study focus", "lofi chill study", "t-indigo"], ["Tamil melodies", "tamil melody", "t-pink"], ["Kuthu beats", "tamil kuthu", "t-orange"], ["Top Bollywood", "bollywood romantic", "t-red"], ["Gym power", "gym workout", "t-green"], ["Chill English", "acoustic chill", "t-sky"]];
  const mTrack = (t) => ({ id: String(t.trackId), title: t.trackName || "Untitled", artist: t.artistName || "Unknown artist", album: t.collectionName || "", art: (t.artworkUrl100 || "").replace("100x100", "600x600"), thumb: t.artworkUrl100 || "", preview: t.previewUrl, len: Math.round((t.trackTimeMillis || 0) / 1000) });
  async function mSearch(q) {
    const key = "nx-music-cache:" + q.toLowerCase(); const c = store.get(key, null);
    if (c && Date.now() - c.at < 6 * 3600e3) return c.items;
    const r = await fetch("https://itunes.apple.com/search?entity=song&limit=25&country=IN&term=" + encodeURIComponent(q));
    if (!r.ok) throw new Error("Music search is busy. Try again.");
    const items = ((await r.json()).results || []).filter((t) => t.previewUrl).map(mTrack);
    store.set(key, { at: Date.now(), items });
    return items;
  }
  const mCur = () => M.queue[M.idx] || null;
  const fmtT = (s) => (Number.isFinite(s) && s > 0 ? Math.floor(s / 60) + ":" + pad(Math.floor(s % 60)) : "0:00");

  /* ---- YouTube engine ---- */
  const YP = { api: null, player: null, box: null, cands: [], ci: 0, state: -1 };
  function ytApi() {
    if (window.YT?.Player) return Promise.resolve();
    return (YP.api = YP.api || new Promise((res, rej) => {
      const prev = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { prev?.(); res(); };
      const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; s.onerror = () => { YP.api = null; rej(new Error("yt")); }; document.head.append(s);
    }));
  }
  function ytBox() {
    if (YP.box) return YP.box;
    const b = document.createElement("div"); b.className = "nx-mvid off";
    b.innerHTML = `<div class="nx-mvid-frame"><div id="nx-mvid-el"></div></div><div class="nx-mvid-bar"><span data-mv-title></span><button type="button" data-mv-toggle aria-label="Play or pause"></button><button type="button" data-mv-next aria-label="Next song">${ic("next", "sm")}</button><button type="button" data-mv-open aria-label="Open Music">${ic("music", "sm")}</button><button type="button" data-mv-x aria-label="Stop music">${ic("x", "sm")}</button></div>`;
    b.addEventListener("click", (e) => {
      if (e.target.closest("[data-mv-toggle]")) E.paused() ? E.play() : E.pause();
      if (e.target.closest("[data-mv-next]")) mStep(1);
      if (e.target.closest("[data-mv-open]")) window.openApp("music");
      if (e.target.closest("[data-mv-x]")) mStop();
    });
    const bar = b.querySelector(".nx-mvid-bar"); let drag = null;
    bar.addEventListener("pointerdown", (e) => { if (e.target.closest("button") || b.classList.contains("full")) return; const r = b.getBoundingClientRect(); drag = { dx: e.clientX - r.left, dy: e.clientY - r.top }; bar.setPointerCapture(e.pointerId); });
    bar.addEventListener("pointermove", (e) => { if (!drag) return; const x = Math.max(4, Math.min(innerWidth - b.offsetWidth - 4, e.clientX - drag.dx)), y = Math.max(4, Math.min(innerHeight - b.offsetHeight - 4, e.clientY - drag.dy)); YP.pos = { x, y }; b.style.left = x + "px"; b.style.top = y + "px"; b.style.right = "auto"; b.style.bottom = "auto"; });
    bar.addEventListener("pointerup", () => { drag = null; });
    document.body.append(b); YP.box = b; requestAnimationFrame(ytPlace); return b;
  }
  function ytPlace() {
    const b = YP.box; if (!b) return; requestAnimationFrame(ytPlace);
    const on = M.mode === "yt"; b.classList.toggle("off", !on); if (!on) return;
    const w = document.querySelector("#app-layer .nx-music"); const art = w?.querySelector(".nx-m-art.is-video");
    const body = w?.querySelector(".nx-body")?.getBoundingClientRect(); const r = art?.getBoundingClientRect();
    const covered = document.querySelector("#app-layer .nx-sheet, .nx-ringing, .nx-lock, #control-center:not([hidden])");
    if (w && art && r.width && body && r.bottom > body.top + 30 && r.top < body.bottom - 30 && !covered) {
      if (!b.classList.contains("full")) b.classList.add("full");
      const ct = Math.max(0, body.top - r.top), cb = Math.max(0, r.bottom - body.bottom);
      const s = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;clip-path:inset(${ct}px 0 ${cb}px 0 round 16px)`;
      if (b._s !== s) { b.style.cssText = s; b._s = s; }
    } else {
      if (b.classList.contains("full")) { b.classList.remove("full"); b.style.cssText = YP.pos ? `left:${YP.pos.x}px;top:${YP.pos.y}px;right:auto;bottom:auto` : ""; b._s = ""; }
      b.classList.toggle("in-app", !!document.querySelector("#app-layer .nx-app")); b.classList.toggle("covered", !!covered);
    }
  }
  function ytState(e) {
    YP.state = e.data;
    if (e.data === 1) { M.loading = ""; const t = mCur(); if (t) store.set("nx-song:" + t.id, YP.cands.slice(YP.ci).concat(YP.cands.slice(0, YP.ci))); setTimeout(prefetchNext, 3000); M.loading = ""; }
    if (e.data === 0) { if (M.repeat) { YP.player.seekTo(0); YP.player.playVideo(); } else mStep(1); }
    if ("mediaSession" in navigator) navigator.mediaSession.playbackState = e.data === 1 ? "playing" : "paused";
    mRefresh(true);
  }
  function ytErr() {
    YP.ci++;
    if (YP.ci < YP.cands.length) { YP.player.loadVideoById(YP.cands[YP.ci]); return; }
    const t = mCur(); if (t) { localStorage.removeItem("nx-song:" + t.id); mPreview(t, "This song can't play in full here — playing a preview."); }
  }
  // Create the YouTube player in advance (invisible) so tapping a song starts it straight away.
  function ytWarm(firstId) {
    if (YP.player || YP.warming) return YP.warming; ytBox();
    YP.warming = ytApi().then(() => new Promise((res) => {
      YP.player = new YT.Player("nx-mvid-el", { width: "100%", height: "100%", ...(firstId ? { videoId: firstId } : {}), playerVars: { autoplay: 0, playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3 },
        events: { onReady: () => { YP.ready = true; res(); if (YP.pending) { const p = YP.pending; YP.pending = null; YP.player.loadVideoById(p); } }, onStateChange: ytState, onError: ytErr } });
    })).catch(() => { YP.warming = null; });
    return YP.warming;
  }
  function ytStart(ids) {
    ytBox(); const t0 = mCur(); if (t0) YP.box.querySelector("[data-mv-title]").textContent = t0.title + " · " + t0.artist;
    YP.cands = ids; YP.ci = 0; M.mode = "yt";
    if (YP.ready) YP.player.loadVideoById(ids[0]); else { YP.pending = ids[0]; ytWarm(); }
  }
  async function ytPlay(ids) { ytStart(ids); if (!YP.ready) await ytWarm(); }
  function prefetchQueue(n = 5) { if (!M.full) return; M.queue.slice(Math.max(0, M.idx), Math.max(0, M.idx) + n).forEach((t, k) => { if (!store.get("nx-song:" + t.id, null)) setTimeout(() => songIds(t, true).catch(() => {}), k * 250); }); }

  /* Find the song on YouTube fast: two free, quota-less search mirrors race first; the
     Nexus server joins only if they're slow (it can take ~30 s to wake up). */
  const okLen = (sec) => !sec || (sec > 60 && sec < 900);
  async function tryJson(url, ms) { const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), ms); try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error(r.status); return await r.json(); } finally { clearTimeout(tm); } }
  const SRC = [
    async (q) => (await tryJson(`https://invidious.f5.si/api/v1/search?type=video&fields=videoId,lengthSeconds&q=${encodeURIComponent(q)}`, 9000)).filter((x) => okLen(x.lengthSeconds)).map((x) => x.videoId),
    async (q) => ((await tryJson(`https://api.piped.private.coffee/search?filter=videos&q=${encodeURIComponent(q)}`, 9000)).items || []).filter((x) => x.type === "stream" && okLen(x.duration)).map((x) => (x.url || "").split("v=")[1]),
    async (q, ctl) => { await new Promise((r) => setTimeout(r, M.warm ? 1500 : 3000)); if (ctl.done) throw new Error("skip"); const u = new URL(N.API_BASE + "/api/youtube/search"); u.searchParams.set("q", q); const d = await tryJson(u, 45000); M.warm = true; return (d.items || []).map((x) => x.videoId); }
  ];
  const searching = {};
  async function songIds(t, light) {
    const c = store.get("nx-song:" + t.id, null); if (Array.isArray(c) && c.length) return c;
    if (searching[t.id]) return searching[t.id];
    const q = `${t.title.replace(/\s*[([].*?[)\]]/g, "")} ${t.artist.split(/,|&/)[0]} song`;
    const go = (async () => {
      const ctl = { done: false };
      const runs = (light ? SRC.slice(0, 2) : SRC).map((f) => f(q, ctl).then((ids) => { ids = ids.filter((id) => /^[\w-]{11}$/.test(id || "")).slice(0, 6); if (!ids.length) throw new Error("none"); return ids; }));
      try { const ids = await Promise.any(runs.map((r) => r.then((v) => { ctl.done = true; return v; }))); store.set("nx-song:" + t.id, ids); return ids; } catch (_) { return []; }
    })();
    searching[t.id] = go; try { return await go; } finally { delete searching[t.id]; }
  }
  function prefetchNext() { if (!M.full) return; const n = M.queue[M.idx + 1]; if (n && !store.get("nx-song:" + n.id, null)) songIds(n).catch(() => {}); }
  const wake = () => { if (Date.now() - (M.woke || 0) > 540e3) { M.woke = Date.now(); fetch(N.API_BASE + "/health").then(() => { M.warm = true; }).catch(() => {}); } };
  wake(); setInterval(() => { if (document.visibilityState === "visible") wake(); }, 600e3);

  /* ---- unified controls ---- */
  const E = {
    paused: () => (M.mode === "yt" ? YP.state !== 1 && YP.state !== 3 : M.audio.paused),
    play() { if (M.mode === "yt") YP.player?.playVideo(); else M.audio.play().catch(() => {}); },
    pause() { if (M.mode === "yt") YP.player?.pauseVideo(); else M.audio.pause(); },
    cur: () => (M.mode === "yt" ? YP.player?.getCurrentTime?.() || 0 : M.audio.currentTime || 0),
    dur: () => (M.mode === "yt" ? YP.player?.getDuration?.() || mCur()?.len || 0 : M.audio.duration || 30),
    seek(p) { const d = E.dur(); if (!d) return; if (M.mode === "yt") YP.player?.seekTo(p * d, true); else M.audio.currentTime = p * d; }
  };
  function mStop() { M.token++; M.audio.pause(); try { YP.player?.stopVideo(); } catch (_) {} M.mode = "none"; M.loading = ""; M.idx = -1; const hs = document.getElementById("music-status"); if (hs) hs.textContent = "Nothing playing"; mRefresh(); }
  function mPreview(t, msg) {
    try { YP.player?.stopVideo(); } catch (_) {} M.mode = "preview"; M.loading = ""; M.audio.src = t.preview; M.audio.play().catch(() => {});
    if (msg) { const w = document.querySelector("#app-layer .nx-music"); if (w) toast(w, msg); } mRefresh();
  }
  async function mPlay(queue, idx) {
    M.queue = queue; M.idx = idx; const t = mCur(); if (!t) return; const tok = ++M.token;
    N.radio?.stop(); M.audio.pause(); try { YP.player?.pauseVideo(); } catch (_) {}
    const rec = store.get("nexus-music-recent", []).filter((x) => x.id !== t.id); rec.unshift(t); store.set("nexus-music-recent", rec.slice(0, 30));
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: t.album, artwork: [{ src: t.art, sizes: "600x600", type: "image/jpeg" }] });
      navigator.mediaSession.setActionHandler("previoustrack", () => mStep(-1)); navigator.mediaSession.setActionHandler("nexttrack", () => mStep(1));
      navigator.mediaSession.setActionHandler("play", () => E.play()); navigator.mediaSession.setActionHandler("pause", () => E.pause());
    }
    const hs = document.getElementById("music-status"); if (hs) hs.textContent = t.title + " · " + t.artist;
    if (YP.box) YP.box.querySelector("[data-mv-title]").textContent = t.title + " · " + t.artist;
    if (!M.full) { mPreview(t); return; }
    const cached = store.get("nx-song:" + t.id, null);
    if (Array.isArray(cached) && cached.length) { // instant: start inside the tap
      M.loading = "Starting…"; ytStart(cached); mRefresh(); setTimeout(prefetchQueue, 1500);
      setTimeout(() => { if (tok === M.token && M.mode === "yt" && YP.state !== 1) { M.loading = YP.state === 3 || YP.state === -1 ? "Loading… if an ad plays, your song starts right after it" : ""; mRefresh(true); } }, 4500);
      setTimeout(() => { if (tok === M.token && M.loading && YP.state !== 1) { M.loading = ""; mRefresh(true); } }, 12000);
      return;
    }
    M.mode = M.mode === "yt" ? "yt" : "none"; M.loading = "Finding the full song…"; mRefresh();
    const slow = setTimeout(() => { if (tok === M.token && M.loading) { M.loading = "Still searching — almost there…"; mRefresh(true); } }, 6000);
    try {
      // Do not leave the user waiting on third-party video search. Start a playable
      // preview if full-track lookup is slow; the user can tap another track anytime.
      const ids = await Promise.race([
        songIds(t),
        new Promise((resolve) => setTimeout(() => resolve([]), 8000))
      ]);
      if (tok !== M.token) return;
      if (!ids.length) {
        mPreview(t, "Full playback is taking too long — playing the available preview.");
        return;
      }
      M.loading = "Starting…"; await ytPlay(ids); if (tok !== M.token) return; setTimeout(prefetchQueue, 1500);
      setTimeout(() => {
        if (tok === M.token && M.mode === "yt" && YP.state !== 1 && YP.state !== 3) {
          mPreview(t, "The full player did not start — playing the available preview.");
        }
      }, 10000);
    } catch (_) {
      if (tok === M.token) mPreview(t, "Full song not available right now — playing the available preview.");
    } finally { clearTimeout(slow); }
    mRefresh();
  }
  function mStep(d) {
    if (!M.queue.length) return;
    let i = M.shuffle ? Math.floor(Math.random() * M.queue.length) : M.idx + d;
    if (i >= M.queue.length) i = 0; if (i < 0) i = M.queue.length - 1;
    mPlay(M.queue, i);
  }
  M.audio.addEventListener("ended", () => { if (M.repeat) { M.audio.currentTime = 0; M.audio.play(); } else mStep(1); });
  ["play", "pause"].forEach((ev) => M.audio.addEventListener(ev, () => mRefresh(true)));
  setInterval(() => {
    if (YP.box) { const tg = YP.box.querySelector("[data-mv-toggle]"); const p = E.paused(); if (tg._p !== p) { tg.innerHTML = ic(p ? "play" : "pause", "sm"); tg._p = p; } }
    const w = document.querySelector("#app-layer .nx-music"); if (!w || M.mode === "none") return;
    const d = E.dur(), c = E.cur();
    const r = w.querySelector("[data-m-seek]"); if (r && !r.matches(":active")) r.value = d ? (c / d) * 1000 : 0;
    const a = w.querySelector("[data-m-cur]"); if (a) a.textContent = fmtT(c);
    const b = w.querySelector("[data-m-dur]"); if (b) b.textContent = fmtT(d);
    const tg = w.querySelector("[data-m-toggle]"); if (tg && tg._p !== E.paused()) mRefresh(true);
  }, 500);
  const liked = () => store.get("nexus-music-liked", []);
  const isLiked = (t) => !!t && liked().some((x) => x.id === t.id);
  function mRow(t, i, list) {
    const on = mCur()?.id === t.id;
    return `<button type="button" class="nx-row nx-m-row${on ? " is-on" : ""}" data-m-play="${i}" data-m-list="${list}"><img src="${esc(t.thumb)}" alt="" loading="lazy"><span class="nx-row-main"><strong>${esc(t.title)}</strong><span>${esc(t.artist)}${t.len ? " · " + fmtT(t.len) : ""}</span></span>${on && !E.paused() ? `<span class="nx-eq"><i></i><i></i><i></i></span>` : ic("play", "sm")}</button>`;
  }
  const mLists = {};
  function mPlayer() {
    const t = mCur(); const vid = M.full && t && (M.mode === "yt" || M.loading);
    const p = E.paused();
    return `<div class="nx-m-player">
      <div class="nx-m-art${vid ? " is-video" : ""}">${t ? `<img src="${esc(t.art)}" alt="">` : `<span>${ic("music", "lg")}</span>`}${M.loading ? `<div class="nx-m-load"><span class="nx-spin"></span><small>${esc(M.loading)}</small></div>` : ""}</div>
      <div class="nx-m-info"><div><strong>${esc(t?.title || "Pick a song to start")}</strong><span>${esc(t ? t.artist : "Search or tap a quick pick below")}${t ? ` · <em class="nx-m-badge${M.mode === "preview" ? " prev" : ""}">${M.mode === "preview" ? "30-sec preview" : "Full song"}</em>` : ""}</span></div>
        <button type="button" class="nx-icon-btn${isLiked(t) ? " is-on" : ""}" data-m-like aria-label="Like" ${t ? "" : "disabled"}>${ic("heart")}</button></div>
      <input class="nx-range" type="range" min="0" max="1000" value="0" data-m-seek aria-label="Song position" ${t ? "" : "disabled"}>
      <div class="nx-m-times"><span data-m-cur>0:00</span><span data-m-dur>${t ? fmtT(M.mode === "preview" ? 30 : t.len) : "0:00"}</span></div>
      <div class="nx-m-ctrl">
        <button type="button" class="nx-icon-btn${M.shuffle ? " is-on" : ""}" data-m-shuffle aria-label="Shuffle">${ic("shuffle")}</button>
        <button type="button" class="nx-icon-btn" data-m-prev aria-label="Previous">${ic("prev")}</button>
        <button type="button" class="nx-m-big" data-m-toggle aria-label="${p ? "Play" : "Pause"}">${ic(p ? "play" : "pause", "lg")}</button>
        <button type="button" class="nx-icon-btn" data-m-next aria-label="Next">${ic("next")}
