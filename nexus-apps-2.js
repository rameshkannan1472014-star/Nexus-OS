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
    const t = mCur(); 
    if (t) { 
      localStorage.removeItem("nx-song:" + t.id); 
      // Retry search for full song instead of preview
      songIds(t).then(ids => {
        if (ids.length && YP.player) {
          YP.cands = ids; YP.ci = 0; YP.player.loadVideoById(ids[0]);
        } else {
          const w = document.querySelector("#app-layer .nx-music");
          if (w) toast(w, "Searching alternative mirrors for full song…");
          tryJson(`https://vid.puffyan.us/api/v1/search?q=${encodeURIComponent(t.title + " " + t.artist)}`, 8000).then(res => {
            const vids = (res || []).filter(x => x.videoId).map(x => x.videoId);
            if (vids.length && YP.player) { YP.cands = vids; YP.ci = 0; YP.player.loadVideoById(vids[0]); }
          }).catch(() => {});
        }
      });
    }
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
  /* v51: the working mirror first (kavin.rocks is dead from a browser), and
     the Nexus server is no longer used — Render suspended it. */
  const SRC = [
    async (q) => ((await tryJson(`https://api.piped.private.coffee/search?filter=videos&q=${encodeURIComponent(q)}`, 8000)).items || []).filter((x) => x.type === "stream" && okLen(x.duration)).map((x) => (x.url || "").split("v=")[1]),
    async (q) => (await tryJson(`https://pipedapi.adminforge.de/search?q=${encodeURIComponent(q)}`, 7000)).items?.filter((x) => x.type === "stream" && okLen(x.duration)).map((x) => (x.url || "").split("v=")[1]) || [],
    async (q) => (await tryJson(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}`, 7000)).items?.filter((x) => x.type === "stream" && okLen(x.duration)).map((x) => (x.url || "").split("v=")[1]) || []
  ];
  const searching = {};
  async function songIds(t, light) {
    const c = store.get("nx-song:" + t.id, null); if (Array.isArray(c) && c.length) return c;
    if (searching[t.id]) return searching[t.id];
    const q1 = `${t.title.replace(/\s*[([].*?[)\]]/g, "")} ${t.artist.split(/,|&/)[0]} song`;
    const q2 = `${t.title} ${t.artist}`;
    const go = (async () => {
      for (const query of [q1, q2]) {
        const ctl = { done: false };
        const runs = (light ? SRC.slice(0, 2) : SRC).map((f) => f(query, ctl).then((ids) => { ids = ids.filter((id) => /^[\w-]{11}$/.test(id || "")).slice(0, 6); if (!ids.length) throw new Error("none"); return ids; }));
        try { const ids = await Promise.any(runs.map((r) => r.then((v) => { ctl.done = true; return v; }))); store.set("nx-song:" + t.id, ids); return ids; } catch (_) {}
      }
      return [];
    })();
    searching[t.id] = go; try { return await go; } finally { delete searching[t.id]; }
  }
  function prefetchNext() { if (!M.full) return; const n = M.queue[M.idx + 1]; if (n && !store.get("nx-song:" + n.id, null)) songIds(n).catch(() => {}); }
  /* v51: no server pings — the API is gone, and the failed requests were noise. */

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
    const slow = setTimeout(() => { if (tok === M.token && M.loading) { M.loading = "Still searching — almost there…"; mRefresh(true); } }, 10000);
    try {
      let ids = await songIds(t);
      if (!ids.length) {
        // Try direct YouTube search via embed/search fallback
        const res = await tryJson(`https://api.piped.private.coffee/search?filter=videos&q=${encodeURIComponent(t.title + " " + t.artist)}`, 10000);
        ids = (res.items || []).filter(x => x.type === "stream").map(x => (x.url || "").split("v=")[1]).filter(id => /^[\w-]{11}$/.test(id));
      }
      if (tok !== M.token) return;
      if (!ids.length) throw new Error("none");
      M.loading = "Starting…"; await ytPlay(ids); if (tok !== M.token) return; setTimeout(prefetchQueue, 1500);
      setTimeout(() => { if (tok === M.token && M.mode === "yt" && YP.state !== 1 && YP.state !== 3) { M.loading = ""; mRefresh(true); } }, 8000);
    } catch (_) { 
      // If full song lookup fails, retry once more with a broader query instead of preview
      try {
        const res = await tryJson(`https://vid.puffyan.us/api/v1/search?q=${encodeURIComponent(t.title + " " + t.artist)}`, 10000);
        const retryIds = (res || []).filter(x => x.videoId).map(x => x.videoId);
        if (retryIds.length && tok === M.token) {
          M.loading = "Starting…"; await ytPlay(retryIds); mRefresh(); return;
        }
      } catch(__) {}
      if (tok === M.token) {
        M.loading = "Finding full song (retrying)…";
        mRefresh();
        setTimeout(() => mPlay(queue, idx), 2000);
      }
    }
    finally { clearTimeout(slow); }
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
        <button type="button" class="nx-icon-btn" data-m-next aria-label="Next">${ic("next")}</button>
        <button type="button" class="nx-icon-btn${M.repeat ? " is-on" : ""}" data-m-repeat aria-label="Repeat">${ic("repeat")}</button>
      </div></div>`;
  }
  function mRefresh() {
    const w = document.querySelector("#app-layer .nx-music"); if (!w) return;
    const box = w.querySelector("[data-m-player]"); if (box) { box.innerHTML = mPlayer(); const tg = box.querySelector("[data-m-toggle]"); if (tg) tg._p = E.paused(); }
    mUpNext(w);
  }
  function mUpNext(w) {
    const box = w.querySelector("[data-m-queue]"); if (!box) return;
    mLists.queue = M.queue;
    box.innerHTML = M.queue.length ? `<div class="nx-section-title">Up next <small>${M.queue.length} songs</small></div><div class="nx-list">${M.queue.map((t, i) => mRow(t, i, "queue")).join("")}</div>` : "";
  }
  async function mLoadInto(w, sel, q, listKey) {
    const box = w.querySelector(sel); if (!box) return;
    box.innerHTML = `<div class="nx-list">${'<div class="nx-row"><span class="nx-skel" style="width:44px;height:44px"></span><span class="nx-skel" style="height:14px;flex:1"></span></div>'.repeat(5)}</div>`;
    try {
      const items = await mSearch(q); mLists[listKey] = items; if (M.full) items.slice(0, 4).forEach((t, k) => { if (!store.get("nx-song:" + t.id, null)) setTimeout(() => songIds(t, true).catch(() => {}), k * 300); });
      box.innerHTML = items.length ? `<div class="nx-list">${items.map((t, i) => mRow(t, i, listKey)).join("")}</div>` : `<div class="nx-empty">${ic("search")}<strong>No songs found</strong>Try another song or artist.</div>`;
    } catch (e) { box.innerHTML = `<div class="nx-error">${esc(e.message === "Failed to fetch" ? "Couldn't reach the music service. Check your internet." : e.message)}</div>`; }
  }
  function mLibrary(w) {
    const box = w.querySelector("[data-m-lib]"); const tab = M.libTab;
    if (tab === "library") {
      mLists.liked = liked(); mLists.recent = store.get("nexus-music-recent", []);
      box.innerHTML = `<div class="nx-section-title">Liked songs <small>${mLists.liked.length}</small></div>${mLists.liked.length ? `<div class="nx-list">${mLists.liked.map((t, i) => mRow(t, i, "liked")).join("")}</div>` : `<div class="nx-card nx-empty">${ic("heart")}<strong>No liked songs yet</strong>Tap the heart while a song plays.</div>`}
        <div class="nx-section-title">Recently played</div>${mLists.recent.length ? `<div class="nx-list">${mLists.recent.slice(0, 15).map((t, i) => mRow(t, i, "recent")).join("")}</div>` : `<p class="nx-note">Songs you play will show here.</p>`}`;
    } else if (tab === "playlists") {
      box.innerHTML = `<div class="nx-m-grid">${PLAYLISTS.map(([n, q, c]) => `<button type="button" class="nx-m-pl" data-m-q="${esc(q)}" data-m-title="${esc(n)}"><span class="nx-tile ${c}">${ic("music")}</span><strong>${esc(n)}</strong><span>Playlist</span></button>`).join("")}</div><div data-m-pl-list></div>`;
    } else {
      box.innerHTML = `<div class="nx-m-grid three">${ARTISTS.map((a) => `<button type="button" class="nx-m-artist" data-m-q="${esc(a)}" data-m-title="${esc(a)}"><span class="nx-avatar">${esc(a[0])}</span><span>${esc(a)}</span></button>`).join("")}</div><div data-m-pl-list></div>`;
    }
  }
  N.music = {
    async play(q) { const items = await mSearch(q); if (!items.length) return null; mPlay(items, 0); return items[0]; },
    pause() { E.pause(); }, resume() { if (mCur()) E.play(); }, next() { mStep(1); }, prev() { mStep(-1); }, stop: () => mStop(), current: mCur, isFull: () => M.full
  };
  N.register("music", {
    title: "Music",
    actions: `<button class="nx-icon-btn" type="button" data-m-gosearch aria-label="Search music">${ic("search")}</button>`,
    tabs: [{ key: "library", label: "Library" }, { key: "playlists", label: "Playlists" }, { key: "artists", label: "Artists" }],
    nav: [{ key: "home", label: "Home", icon: "home" }, { key: "search", label: "Search", icon: "search" }, { key: "lib", label: "Library", icon: "library" }],
    html: () => `<div data-view="home"><div data-m-player></div>
        <div class="nx-chips" style="margin-top:14px">${PICKS.map(([l, q], i) => `<button type="button" class="nx-chip${i ? "" : " is-active"}" data-m-pick="${esc(q)}">${esc(l)}</button>`).join("")}</div>
        <div data-m-queue></div></div>
      <div data-view="search" hidden><form class="nx-search" data-m-form role="search"><span>${ic("search")}</span><input name="q" placeholder="Songs, artists or albums" autocomplete="off" enterkeyhint="search" aria-label="Search music"></form><div data-m-results><div class="nx-empty">${ic("music")}<strong>Find any song</strong>Full songs play through YouTube.</div></div></div>
      <div data-view="lib" hidden><div data-m-lib></div></div>
      <div class="nx-card nx-m-mode"><span class="nx-row-main"><strong>Play full songs</strong><span>Uses the YouTube player. Turn off to hear 30-second previews (uses less data).</span></span><button type="button" class="nx-switch" data-m-full aria-checked="${M.full}" aria-label="Play full songs"></button></div><p class="nx-note">Song info from iTunes. Full songs are streamed by YouTube. On phones, YouTube pauses when you leave the browser or lock the screen.</p>`,
    init(win) {
      win.classList.add("nx-music"); if (M.full) ytWarm();
      win.querySelector(".nx-tabs").hidden = true;
      win.querySelector("[data-m-player]").innerHTML = mPlayer();
      if (M.queue.length) mUpNext(win);
      else mSearch(PICKS[0][1]).then((items) => { if (!M.queue.length) { M.queue = items; M.idx = -1; mUpNext(win); prefetchQueue(6); } }).catch(() => {});
      if (M.queue.length) prefetchQueue(6);
      const form = win.querySelector("[data-m-form]");
      form.addEventListener("submit", (e) => { e.preventDefault(); const q = form.q.value.trim(); if (q) { form.q.blur(); mLoadInto(win, "[data-m-results]", q, "results"); } });
      win.addEventListener("input", (e) => { if (e.target.matches("[data-m-seek]")) E.seek(e.target.value / 1000); });
      win.addEventListener("click", (e) => {
        const pl = e.target.closest("[data-m-play]");
        if (pl) { const list = pl.dataset.mList === "queue" ? M.queue : mLists[pl.dataset.mList] || []; mPlay(list.slice(), Number(pl.dataset.mPlay)); win.querySelectorAll(`[data-m-list="${pl.dataset.mList}"]`).forEach((b) => b.classList.toggle("is-on", b === pl)); return; }
        if (e.target.closest("[data-m-toggle]")) { if (!mCur()) { if (M.queue.length) mPlay(M.queue, 0); return; } E.paused() ? E.play() : E.pause(); return; }
        if (e.target.closest("[data-m-next]")) { mStep(1); return; }
        if (e.target.closest("[data-m-prev]")) { if (E.cur() > 3) E.seek(0); else mStep(-1); return; }
        if (e.target.closest("[data-m-shuffle]")) { M.shuffle = !M.shuffle; mRefresh(); toast(win, M.shuffle ? "Shuffle on" : "Shuffle off"); return; }
        if (e.target.closest("[data-m-repeat]")) { M.repeat = !M.repeat; mRefresh(); toast(win, M.repeat ? "Repeat this song" : "Repeat off"); return; }
        if (e.target.closest("[data-m-like]")) { const t = mCur(); if (!t) return; let l = liked(); l = isLiked(t) ? l.filter((x) => x.id !== t.id) : [t, ...l]; store.set("nexus-music-liked", l); mRefresh(); toast(win, isLiked(t) ? "Added to Liked songs" : "Removed from Liked songs"); return; }
        const pk = e.target.closest("[data-m-pick]");
        if (pk) { setActive(win, "[data-m-pick]", pk); mSearch(pk.dataset.mPick).then((items) => { M.queue = items; M.idx = -1; mUpNext(win); prefetchQueue(6); }).catch(() => toast(win, "Couldn't load songs")); return; }
        const q = e.target.closest("[data-m-q]");
        if (q) { const box = win.querySelector("[data-m-pl-list]"); box.innerHTML = `<div class="nx-section-title">${esc(q.dataset.mTitle)}</div><div data-m-pl-inner></div>`; mLoadInto(win, "[data-m-pl-inner]", q.dataset.mQ, "pl"); box.scrollIntoView({ behavior: "smooth" }); return; }
        if (e.target.closest("[data-m-full]")) { M.full = !M.full; store.set("nexus-music-full", M.full); e.target.closest("[data-m-full]").setAttribute("aria-checked", M.full); toast(win, M.full ? "Full songs on" : "Previews only"); if (mCur()) mPlay(M.queue, M.idx); return; }
        if (e.target.closest("[data-m-gosearch]")) { selectNav(win, "search"); this.onNav(win, "search"); }
      });
      if (!M.queue.length) win.querySelector("[data-m-queue]").innerHTML = `<div class="nx-list" style="margin-top:12px">${'<div class="nx-row"><span class="nx-skel" style="width:44px;height:44px"></span><span class="nx-skel" style="height:14px;flex:1"></span></div>'.repeat(4)}</div>`;
    },
    onNav(win, key) {
      showView(win, key); win.querySelector(".nx-tabs").hidden = key !== "lib";
      if (key === "lib") { N.selectTab(win, M.libTab); mLibrary(win); }
      if (key === "search") setTimeout(() => win.querySelector("[data-m-form] input")?.focus(), 50);
    },
    onTab(win, key) { M.libTab = key; selectNav(win, "lib"); showView(win, "lib"); mLibrary(win); }
  });

  /* ================================================================== *
   * CLOCK — alarms ring while Nexus OS is open; timer & stopwatch
   * ================================================================== */
  const C = { timerEnd: 0, timerTotal: 0, timerLeft: 0, timerRunning: false, swStart: 0, swAcc: 0, swRunning: false, laps: [], view: "alarm" };
  const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
  const ZONES = [["Chennai", "Asia/Kolkata"], ["Dubai", "Asia/Dubai"], ["Singapore", "Asia/Singapore"], ["Tokyo", "Asia/Tokyo"], ["Sydney", "Australia/Sydney"], ["London", "Europe/London"], ["Paris", "Europe/Paris"], ["New York", "America/New_York"], ["San Francisco", "America/Los_Angeles"], ["Toronto", "America/Toronto"], ["Moscow", "Europe/Moscow"], ["Beijing", "Asia/Shanghai"], ["Kuala Lumpur", "Asia/Kuala_Lumpur"], ["Colombo", "Asia/Colombo"], ["Riyadh", "Asia/Riyadh"], ["Nairobi", "Africa/Nairobi"], ["São Paulo", "America/Sao_Paulo"]];
  const alarms = () => store.get("nexus-alarms", [{ id: "a1", h: 6, m: 0, label: "Wake up", days: [], on: false }, { id: "a2", h: 7, m: 30, label: "School", days: [1, 2, 3, 4, 5], on: false }]);
  const fmtHM = (h, m) => { const d = new Date(); d.setHours(h, m, 0, 0); return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); };
  const daysLabel = (d) => !d.length ? "Once" : d.length === 7 ? "Every day" : d.join() === "1,2,3,4,5" ? "Weekdays" : d.join() === "0,6" ? "Weekends" : d.map((x) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][x]).join(", ");
  let ringCtx = null, ringTimer = null;
  function ring(title, sub, onSnooze) {
    document.querySelector(".nx-ringing")?.remove();
    const o = document.createElement("div"); o.className = "nx-ringing"; o.setAttribute("role", "alertdialog");
    o.innerHTML = `<div class="nx-ringing-ic">${ic("alarm", "lg")}</div><strong>${esc(title)}</strong><span>${esc(sub)}</span><div class="nx-ringing-btns">${onSnooze ? `<button type="button" data-snooze>Snooze 5 min</button>` : ""}<button type="button" data-stop>Stop</button></div>`;
    document.body.append(o);
    try {
      ringCtx = ringCtx || new (window.AudioContext || window.webkitAudioContext)();
      const beep = () => { [0, 0.25].forEach((dt) => { const os = ringCtx.createOscillator(), g = ringCtx.createGain(); os.frequency.value = 880; g.gain.value = 0.15; os.connect(g).connect(ringCtx.destination); const t0 = ringCtx.currentTime + dt; os.start(t0); g.gain.setValueAtTime(0.15, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2); os.stop(t0 + 0.22); }); };
      beep(); clearInterval(ringTimer); ringTimer = setInterval(beep, 1200);
    } catch (_) {}
    try { navigator.vibrate?.([400, 200, 400, 200, 400]); } catch (_) {}
    const stop = () => { clearInterval(ringTimer); o.remove(); };
    o.querySelector("[data-stop]").addEventListener("click", stop);
    o.querySelector("[data-snooze]")?.addEventListener("click", () => { stop(); onSnooze(); });
    setTimeout(stop, 60000);
    sysNotify(title, sub, "nexus-alarm");
  }
  function alarmCheck() {
    const now = new Date(), key = now.toDateString() + now.getHours() + ":" + now.getMinutes();
    const list = alarms(); let changed = false;
    list.forEach((a) => {
      if (!a.on || a.h !== now.getHours() || a.m !== now.getMinutes() || a.fired === key) return;
      if (a.days.length && !a.days.includes(now.getDay())) return;
      a.fired = key; changed = true; if (!a.days.length) a.on = false;
      ring(fmtHM(a.h, a.m), a.label || "Alarm", () => { const s = new Date(Date.now() + 5 * 60000); const l = alarms(); l.push({ id: uid(), h: s.getHours(), m: s.getMinutes(), label: (a.label || "Alarm") + " (snoozed)", days: [], on: true, snooze: true }); store.set("nexus-alarms", l); });
    });
    if (changed) { store.set("nexus-alarms", list.filter((a) => !(a.snooze && !a.on))); const w = document.querySelector("#app-layer .nx-clock"); if (w) cRender(w); }
    if (C.timerRunning && Date.now() >= C.timerEnd) { C.timerRunning = false; C.timerLeft = 0; ring("Time's up", "Your timer has finished"); const w = document.querySelector("#app-layer .nx-clock"); if (w) cRender(w); }
  }
  setInterval(alarmCheck, 1000);
  const tzTime = (tz) => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", timeZone: tz });
  function tzOffset(tz) {
    const f = (z) => { const p = new Intl.DateTimeFormat("en-US", { timeZone: z, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date()); const g = (t) => Number(p.find((x) => x.type === t).value); return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour") % 24, g("minute")); };
    const diff = Math.round((f(tz) - f(Intl.DateTimeFormat().resolvedOptions().timeZone)) / 60000);
    if (!diff) return "Same time"; const h = Math.trunc(diff / 60), m = Math.abs(diff % 60);
    return (diff > 0 ? "+" : "−") + Math.abs(h) + (m ? ":" + pad(m) : "") + " h";
  }
  const fmtDur = (ms, cs) => { const t = Math.max(0, ms); const h = Math.floor(t / 3600000), m = Math.floor((t % 3600000) / 60000), s = Math.floor((t % 60000) / 1000), c = Math.floor((t % 1000) / 10); return (h ? h + ":" + pad(m) : pad(m)) + ":" + pad(s) + (cs ? "." + pad(c) : ""); };
  const swNow = () => C.swAcc + (C.swRunning ? Date.now() - C.swStart : 0);
  N.clock = {
    startTimer(ms) { C.timerTotal = ms; C.timerEnd = Date.now() + ms; C.timerRunning = true; C.timerLeft = 0; C.view = "timer"; },
    stopTimer() { C.timerRunning = false; C.timerLeft = 0; },
    stopwatch(go) { if (go && !C.swRunning) { C.swStart = Date.now(); C.swRunning = true; } if (!go && C.swRunning) { C.swAcc += Date.now() - C.swStart; C.swRunning = false; } C.view = "sw"; return swNow(); }
  };
  function cRender(win) {
    const v = C.view;
    if (v === "alarm") {
      const l = alarms().sort((a, b) => a.h * 60 + a.m - (b.h * 60 + b.m));
      win.querySelector("[data-c-alarm]").innerHTML = l.length ? l.map((a) => `<div class="nx-card nx-c-alarm${a.on ? " is-on" : ""}"><button type="button" class="nx-c-alarm-main" data-c-edit="${a.id}"><b>${fmtHM(a.h, a.m).replace(/\s?(AM|PM|am|pm)/, '<small> $1</small>')}</b><span>${esc(a.label || "Alarm")} · ${daysLabel(a.days)}</span></button><button type="button" class="nx-switch" role="switch" aria-checked="${a.on}" aria-label="Alarm on" data-c-toggle="${a.id}"></button></div>`).join("") : `<div class="nx-card nx-empty">${ic("alarm")}<strong>No alarms</strong>Tap + to add one.</div>`;
      win.querySelector("[data-c-alarm]").insertAdjacentHTML("beforeend", `<p class="nx-note">Alarms ring while Nexus OS is open on your phone. For alarms when the phone is locked, also set one in your phone's Clock app.</p>`);
    } else if (v === "world") {
      const zones = store.get("nexus-world-zones", ["Asia/Kolkata", "Europe/London", "America/New_York", "Asia/Tokyo"]);
      win.querySelector("[data-c-world]").innerHTML = `<div class="nx-c-big"><b data-c-live>${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}</b><span>${new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}</span></div>
        <div class="nx-list">${zones.map((z) => { const n = (ZONES.find((x) => x[1] === z) || [z.split("/").pop().replace(/_/g, " ")])[0]; return `<div class="nx-row"><span class="nx-row-main"><strong>${esc(n)}</strong><span>${tzOffset(z)}</span></span><b class="nx-c-zone">${tzTime(z)}</b><button type="button" class="nx-del" data-c-rmzone="${z}" aria-label="Remove ${esc(n)}">${ic("x", "sm")}</button></div>`; }).join("")}</div>`;
    } else if (v === "timer") {
      const left = C.timerRunning ? C.timerEnd - Date.now() : C.timerLeft;
      const pct = C.timerTotal ? Math.max(0, Math.min(100, (left / C.timerTotal) * 100)) : 100;
      win.querySelector("[data-c-timer]").innerHTML = `<div class="nx-c-ring" style="--p:${pct}"><div><b data-c-tleft>${fmtDur(left || 0)}</b><span>${C.timerRunning ? "Running" : left ? "Paused" : "Set a time"}</span></div></div>
        ${!C.timerRunning && !left ? `<div class="nx-chips" style="justify-content:center;margin:0">${[1, 3, 5, 10, 15, 25, 30].map((m) => `<button type="button" class="nx-chip" data-c-preset="${m}">${m} min</button>`).join("")}</div>
          <div class="nx-field-row" style="margin-top:6px"><label class="nx-field">Minutes<input class="nx-input" type="number" min="0" max="600" value="5" data-c-min inputmode="numeric"></label><label class="nx-field">Seconds<input class="nx-input" type="number" min="0" max="59" value="0" data-c-sec inputmode="numeric"></label></div>` : ""}
        <div class="nx-c-btns">${C.timerRunning ? `<button type="button" class="nx-btn ghost" data-c-treset>Reset</button><button type="button" class="nx-btn" data-c-tpause>${ic("pause", "sm")} Pause</button>` : left ? `<button type="button" class="nx-btn ghost" data-c-treset>Reset</button><button type="button" class="nx-btn" data-c-tresume>${ic("play", "sm")} Resume</button>` : `<button type="button" class="nx-btn block" data-c-tstart>${ic("play", "sm")} Start timer</button>`}</div>`;
    } else {
      win.querySelector("[data-c-sw]").innerHTML = `<div class="nx-c-big sw"><b data-c-swt>${fmtDur(swNow(), true)}</b></div>
        <div class="nx-c-btns"><button type="button" class="nx-btn ghost" data-c-swlap ${swNow() ? "" : "disabled"}>${C.swRunning ? "Lap" : "Reset"}</button><button type="button" class="nx-btn${C.swRunning ? " danger" : ""}" data-c-swgo>${C.swRunning ? "Stop" : swNow() ? "Resume" : "Start"}</button></div>
        ${C.laps.length ? `<div class="nx-list" style="margin-top:16px">${C.laps.map((l, i) => `<div class="nx-row"><span class="nx-row-main"><strong>Lap ${C.laps.length - i}</strong></span><span class="nx-row-meta" style="font-variant-numeric:tabular-nums">${fmtDur(l, true)}</span></div>`).join("")}</div>` : ""}`;
    }
  }
  function cAlarmSheet(win, id) {
    const a = id ? alarms().find((x) => x.id === id) : { h: new Date().getHours(), m: 0, label: "", days: [], on: true };
    if (!a) return; const sel = new Set(a.days);
    openSheet(win, `<h3>${id ? "Edit alarm" : "New alarm"}</h3><form data-c-form>
      <label class="nx-field">Time<input class="nx-input" type="time" name="t" value="${pad(a.h)}:${pad(a.m)}" required style="font-size:22px;height:56px"></label>
      <label class="nx-field">Label<input class="nx-input" name="label" value="${esc(a.label)}" placeholder="e.g. Wake up" maxlength="40"></label>
      <div class="nx-field">Repeat<div class="nx-c-days">${DAYS.map((d, i) => `<button type="button" class="${sel.has(i) ? "is-active" : ""}" data-day="${i}" aria-pressed="${sel.has(i)}">${d}</button>`).join("")}</div></div>
      <button class="nx-btn block" type="submit">Save alarm</button>${id ? `<button class="nx-btn danger block" type="button" data-c-del style="margin-top:10px">${ic("trash", "sm")} Delete alarm</button>` : ""}</form>`, (p) => {
      p.addEventListener("click", (e) => { const d = e.target.closest("[data-day]"); if (d) { const i = Number(d.dataset.day); sel.has(i) ? sel.delete(i) : sel.add(i); d.classList.toggle("is-active"); d.setAttribute("aria-pressed", sel.has(i)); } if (e.target.closest("[data-c-del]")) { store.set("nexus-alarms", alarms().filter((x) => x.id !== id)); closeSheet(win); cRender(win); toast(win, "Alarm deleted"); } });
      p.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault(); const f = e.target; const [h, m] = f.t.value.split(":").map(Number);
        const l = alarms(); const rec = { id: id || uid(), h, m, label: f.label.value.trim(), days: [...sel].sort(), on: true };
        const i = l.findIndex((x) => x.id === rec.id); if (i >= 0) l[i] = rec; else l.push(rec);
        store.set("nexus-alarms", l); closeSheet(win); cRender(win);
        const next = new Date(); next.setHours(h, m, 0, 0); if (next < new Date()) next.setDate(next.getDate() + 1);
        const mins = Math.round((next - new Date()) / 60000); toast(win, `Alarm in ${Math.floor(mins / 60)} h ${mins % 60} min`);
        if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
      });
    });
  }
  const clockDef = {
    title: "Clock",
    nav: [{ key: "alarm", label: "Alarm", icon: "alarm" }, { key: "world", label: "World Clock", icon: "globe" }, { key: "timer", label: "Timer", icon: "hourglass" }, { key: "sw", label: "Stopwatch", icon: "stopwatch" }],
    html: () => `<div data-view="alarm"><div data-c-alarm></div><button class="nx-fab" type="button" data-c-new aria-label="New alarm">${ic("plus")}</button></div>
      <div data-view="world" hidden><div data-c-world></div><button class="nx-btn ghost block" type="button" data-c-addzone style="margin-top:12px">${ic("plus", "sm")} Add a city</button></div>
      <div data-view="timer" hidden><div data-c-timer></div></div><div data-view="sw" hidden><div data-c-sw></div></div>`,
    init(win) {
      win.classList.add("nx-clock"); C.view = "alarm"; cRender(win);
      const loop = setInterval(() => {
        if (!win.isConnected) { clearInterval(loop); return; }
        if (C.view === "world") { const el = win.querySelector("[data-c-live]"); if (el) el.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" }); }
        if (C.view === "timer" && C.timerRunning) { const left = C.timerEnd - Date.now(); const el = win.querySelector("[data-c-tleft]"); if (el) el.textContent = fmtDur(left); const r = win.querySelector(".nx-c-ring"); if (r) r.style.setProperty("--p", Math.max(0, (left / C.timerTotal) * 100)); }
        if (C.view === "sw" && C.swRunning) { const el = win.querySelector("[data-c-swt]"); if (el) el.textContent = fmtDur(swNow(), true); }
      }, 47);
      win.addEventListener("click", (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-c-new]")) return cAlarmSheet(win);
        if (g("[data-c-edit]")) return cAlarmSheet(win, g("[data-c-edit]").dataset.cEdit);
        if (g("[data-c-toggle]")) { const l = alarms(); const a = l.find((x) => x.id === g("[data-c-toggle]").dataset.cToggle); a.on = !a.on; store.set("nexus-alarms", l); cRender(win); if (a.on) toast(win, "Alarm on for " + fmtHM(a.h, a.m)); return; }
        if (g("[data-c-rmzone]")) { store.set("nexus-world-zones", store.get("nexus-world-zones", ["Asia/Kolkata", "Europe/London", "America/New_York", "Asia/Tokyo"]).filter((z) => z !== g("[data-c-rmzone]").dataset.cRmzone)); cRender(win); return; }
        if (g("[data-c-addzone]")) { openSheet(win, `<h3>Add a city</h3><div class="nx-list">${ZONES.map(([n, z]) => `<button type="button" class="nx-row" data-c-zone="${z}"><span class="nx-row-main"><strong>${n}</strong><span>${tzOffset(z)}</span></span><span class="nx-row-meta">${tzTime(z)}</span></button>`).join("")}</div>`, (p) => p.addEventListener("click", (ev) => { const z = ev.target.closest("[data-c-zone]"); if (!z) return; const l = store.get("nexus-world-zones", ["Asia/Kolkata", "Europe/London", "America/New_York", "Asia/Tokyo"]); if (!l.includes(z.dataset.cZone)) l.push(z.dataset.cZone); store.set("nexus-world-zones", l); closeSheet(win); cRender(win); })); return; }
        const startT = (ms) => { if (ms < 1000) { toast(win, "Set at least 1 second"); return; } C.timerTotal = ms; C.timerEnd = Date.now() + ms; C.timerRunning = true; C.timerLeft = 0; cRender(win); };
        if (g("[data-c-preset]")) return startT(Number(g("[data-c-preset]").dataset.cPreset) * 60000);
        if (g("[data-c-tstart]")) return startT((Number(win.querySelector("[data-c-min]").value) || 0) * 60000 + (Number(win.querySelector("[data-c-sec]").value) || 0) * 1000);
        if (g("[data-c-tpause]")) { C.timerLeft = C.timerEnd - Date.now(); C.timerRunning = false; cRender(win); return; }
        if (g("[data-c-tresume]")) { C.timerEnd = Date.now() + C.timerLeft; C.timerRunning = true; cRender(win); return; }
        if (g("[data-c-treset]")) { C.timerRunning = false; C.timerLeft = 0; C.timerTotal = 0; cRender(win); return; }
        if (g("[data-c-swgo]")) { if (C.swRunning) { C.swAcc = swNow(); C.swRunning = false; } else { C.swStart = Date.now(); C.swRunning = true; } cRender(win); return; }
        if (g("[data-c-swlap]")) { if (C.swRunning) C.laps.unshift(swNow()); else { C.swAcc = 0; C.laps = []; } cRender(win); }
      });
    },
    onNav(win, key) { C.view = key; showView(win, key); cRender(win); }
  };
  N.register("clock", clockDef);
  N.register("timer", Object.assign({}, clockDef, { init(win) { clockDef.init(win); selectNav(win, "timer"); clockDef.onNav(win, "timer"); } }));

  /* ================================================================== *
   * NEWS — BBC & The Hindu headlines through rss2json
   * ================================================================== */
  const FEEDS = {
    foryou: ["India", "https://www.thehindu.com/news/national/feeder/default.rss"],
    top: ["World", "https://feeds.bbci.co.uk/news/world/rss.xml"],
    tech: ["Technology", "https://feeds.bbci.co.uk/news/technology/rss.xml"],
    science: ["Science", "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml"],
    sport: ["Sports", "https://feeds.bbci.co.uk/sport/rss.xml"],
    business: ["Business", "https://feeds.bbci.co.uk/news/business/rss.xml"],
    fun: ["Entertainment", "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml"],
    asia: ["Asia", "https://feeds.bbci.co.uk/news/world/asia/rss.xml"]
  };
  const CAT_TILES = { tech: ["t-blue", "terminal"], science: ["t-teal", "globe"], sport: ["t-green", "trending"], business: ["t-orange", "chart"], fun: ["t-pink", "music"], asia: ["t-red", "pin"] };
  const NW = { tab: "foryou", cat: null, items: {} };
  const ago = (d) => { const m = Math.round((Date.now() - new Date(d.replace(" ", "T") + (/(Z|[+-]\d\d:?\d\d)$/.test(d) ? "" : "Z")).getTime()) / 60000); if (!Number.isFinite(m) || m < 0) return ""; return m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : Math.round(m / 1440) + " d ago"; };
  const strip = (h) => { const d = document.createElement("div"); d.innerHTML = h || ""; return (d.textContent || "").trim(); };
  async function nwFetch(key) {
    const c = store.get("nx-news:" + key, null); if (c && Date.now() - c.at < 15 * 60000) return c.items;
    const r = await fetch("https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(FEEDS[key][1]));
    const d = await r.json(); if (d.status !== "ok") throw new Error("News is busy right now. Try again soon.");
    const items = d.items.slice(0, 25).map((x) => ({ title: strip(x.title), link: x.link, date: x.pubDate, img: x.thumbnail || x.enclosure?.link || "", desc: strip(x.description).slice(0, 400), src: /bbc/.test(x.link) ? "BBC News" : "The Hindu" }));
    store.set("nx-news:" + key, { at: Date.now(), items }); return items;
  }
  const nwThumb = (x, cls) => x.img ? `<span class="${cls}"><img src="${esc(x.img.replace("/240/", "/480/"))}" alt="" loading="lazy"></span>` : `<span class="${cls} is-empty">${ic("newspaper", "lg")}</span>`;
  function nwList(items, key) {
    if (!items.length) return `<div class="nx-empty">${ic("newspaper")}<strong>No stories</strong></div>`;
    const [f, ...rest] = items;
    return `<button type="button" class="nx-nw-feat" data-nw-open="${key}:0">${nwThumb(f, "nx-nw-feat-img")}<strong>${esc(f.title)}</strong><span>${esc(f.src)} · ${ago(f.date)}</span></button>
      <div class="nx-nw-list">${rest.map((x, i) => `<button type="button" class="nx-nw-item" data-nw-open="${key}:${i + 1}"><span class="nx-nw-text"><small>${esc(FEEDS[key][0])}</small><strong>${esc(x.title)}</strong><span>${esc(x.src)} · ${ago(x.date)}</span></span>${nwThumb(x, "nx-nw-thumb")}</button>`).join("")}</div>`;
  }
  async function nwLoad(win, key) {
    const box = win.querySelector("[data-nw-feed]");
    box.innerHTML = `<div class="nx-skel" style="aspect-ratio:16/9;border-radius:14px"></div>${'<div style="display:flex;gap:10px;margin-top:14px"><div style="flex:1"><div class="nx-skel" style="height:14px"></div><div class="nx-skel" style="height:14px;width:60%;margin-top:8px"></div></div><div class="nx-skel" style="width:96px;height:72px"></div></div>'.repeat(3)}`;
    try { NW.items[key] = await nwFetch(key); if (win.isConnected) box.innerHTML = nwList(NW.items[key], key); }
    catch (e) { box.innerHTML = `<div class="nx-error">${esc(e.message === "Failed to fetch" ? "Couldn't load news. Check your internet." : e.message)}</div><button type="button" class="nx-btn ghost block" style="margin-top:10px" data-nw-retry="${key}">${ic("refresh", "sm")} Try again</button>`; }
  }
  function nwCats(win) {
    win.querySelector("[data-nw-feed]").innerHTML = `<div class="nx-nw-cats">${Object.keys(CAT_TILES).map((k) => `<button type="button" class="nx-card nx-nw-cat" data-nw-cat="${k}"><span class="nx-tile ${CAT_TILES[k][0]}">${ic(CAT_TILES[k][1])}</span><strong>${FEEDS[k][0]}</strong></button>`).join("")}</div>`;
  }
  function nwSaved(win) {
    const s = store.get("nexus-news-saved", []); NW.items.saved = s;
    win.querySelector("[data-nw-saved]").innerHTML = s.length ? `<div class="nx-nw-list">${s.map((x, i) => `<button type="button" class="nx-nw-item" data-nw-open="saved:${i}"><span class="nx-nw-text"><strong>${esc(x.title)}</strong><span>${esc(x.src)}</span></span>${nwThumb(x, "nx-nw-thumb")}</button>`).join("")}</div>` : `<div class="nx-card nx-empty">${ic("bookmark")}<strong>No saved stories</strong>Tap Save on a story to read it later.</div>`;
  }
  N.register("news", {
    title: "News",
    actions: `<button class="nx-icon-btn" type="button" data-nw-refresh aria-label="Refresh">${ic("refresh")}</button>`,
    tabs: [{ key: "foryou", label: "For You" }, { key: "top", label: "Top Stories" }, { key: "cats", label: "Categories" }],
    nav: [{ key: "home", label: "Home", icon: "home" }, { key: "saved", label: "Saved", icon: "bookmark" }],
    html: () => `<div data-view="home"><div data-nw-feed></div><p class="nx-note">Headlines from The Hindu and BBC News.</p></div><div data-view="saved" hidden><div data-nw-saved></div></div>`,
    init(win) {
      NW.tab = "foryou"; nwLoad(win, "foryou");
      win.addEventListener("click", (e) => {
        const o = e.target.closest("[data-nw-open]");
        if (o) {
          const [k, i] = o.dataset.nwOpen.split(":"); const x = NW.items[k]?.[Number(i)]; if (!x) return;
          const saved = store.get("nexus-news-saved", []).some((s) => s.link === x.link);
          openSheet(win, `${x.img ? `<img class="nx-nw-sheet-img" src="${esc(x.img.replace("/240/", "/480/"))}" alt="">` : ""}<h3>${esc(x.title)}</h3><p class="nx-note" style="margin:-6px 0 10px">${esc(x.src)} · ${ago(x.date)}</p><p style="margin:0 0 14px;color:var(--nx-muted);font-size:14px;line-height:1.55">${esc(x.desc || "Open the full story to read more.")}</p>
            <div class="nx-actions"><button type="button" class="nx-btn ghost" data-nw-save>${ic("bookmark", "sm")} ${saved ? "Saved" : "Save"}</button><a class="nx-btn" href="${esc(x.link)}" target="_blank" rel="noopener">${ic("external", "sm")} Read full story</a></div>`, (p) => {
            p.querySelector("[data-nw-save]").addEventListener("click", (ev) => { let s = store.get("nexus-news-saved", []); if (s.some((y) => y.link === x.link)) { s = s.filter((y) => y.link !== x.link); ev.currentTarget.innerHTML = ic("bookmark", "sm") + " Save"; } else { s.unshift(x); ev.currentTarget.innerHTML = ic("bookmark", "sm") + " Saved"; toast(win, "Saved for later"); } store.set("nexus-news-saved", s.slice(0, 50)); if (!win.querySelector('[data-view="saved"]').hidden) nwSaved(win); });
          });
          return;
        }
        const c = e.target.closest("[data-nw-cat]"); if (c) { NW.cat = c.dataset.nwCat; nwLoad(win, NW.cat); return; }
        const r = e.target.closest("[data-nw-retry]"); if (r) { nwLoad(win, r.dataset.nwRetry); return; }
        if (e.target.closest("[data-nw-refresh]")) { const k = NW.tab === "cats" ? NW.cat : NW.tab; if (k) { localStorage.removeItem("nx-news:" + k); nwLoad(win, k); } }
      });
    },
    onTab(win, key) { NW.tab = key; selectNav(win, "home"); showView(win, "home"); if (key === "cats") { NW.cat = null; nwCats(win); } else nwLoad(win, key); },
    onNav(win, key) { showView(win, key); win.querySelector(".nx-tabs").hidden = key !== "home"; if (key === "saved") nwSaved(win); }
  });

  /* ================================================================== *
   * CAMERA — photos & videos are saved to Files and Gallery
   * ================================================================== */
  const FILTERS = [["Normal", "none"], ["Mono", "grayscale(1) contrast(1.1)"], ["Warm", "sepia(.35) saturate(1.3) hue-rotate(-10deg)"], ["Cool", "saturate(1.1) hue-rotate(15deg) brightness(1.05)"], ["Vivid", "saturate(1.7) contrast(1.15)"], ["Vintage", "sepia(.6) contrast(.9) brightness(1.05)"]];
  const CAM = { stream: null, facing: "environment", mode: "photo", filter: "none", rec: null, chunks: [], recStart: 0, delay: 0, torch: false };
  function camStop() { CAM.stream?.getTracks().forEach((t) => t.stop()); CAM.stream = null; if (CAM.rec && CAM.rec.state !== "inactive") CAM.rec.stop(); }
  async function camStart(win) {
    camStop();
    const v = win.querySelector("[data-cam-video]"), msg = win.querySelector("[data-cam-msg]");
    if (!navigator.mediaDevices?.getUserMedia) { msg.hidden = false; msg.innerHTML = `${ic("camera")}<strong>Camera not available</strong>This browser can't use the camera.`; return; }
    try {
      CAM.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: CAM.facing, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: CAM.mode === "video" });
      if (!win.isConnected) { camStop(); return; }
      v.srcObject = CAM.stream; v.classList.toggle("is-front", CAM.facing === "user"); msg.hidden = true;
      const caps = CAM.stream.getVideoTracks()[0]?.getCapabilities?.() || {};
      win.querySelector("[data-cam-torch]").hidden = !caps.torch;
    } catch (e) {
      msg.hidden = false;
      msg.innerHTML = `${ic("camera")}<strong>${e.name === "NotAllowedError" ? "Camera permission needed" : "Couldn't start the camera"}</strong>${e.name === "NotAllowedError" ? "Allow camera access for this site in your browser settings, then try again." : "Another app may be using it."}<button type="button" class="nx-btn" style="margin-top:12px" data-cam-retry>Try again</button>`;
    }
  }
  async function camSave(win, blob, name, type) {
    const rec = { id: uid(), name, type, size: blob.size, added: Date.now(), blob, source: "camera" };
    try { await N.FilesDB.put(rec); } catch (_) { toast(win, "Couldn't save — storage may be full"); return; }
    const th = win.querySelector("[data-cam-last]"); const url = URL.createObjectURL(blob);
    th.innerHTML = type.startsWith("video") ? `<video src="${url}" muted></video>` : `<img src="${url}" alt="Last photo">`;
    toast(win, (type.startsWith("video") ? "Video" : "Photo") + " saved to Gallery");
  }
  const stamp = () => { const d = new Date(); return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "_" + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()); };
  function camShoot(win) {
    const v = win.querySelector("[data-cam-video]"); if (!CAM.stream || !v.videoWidth) { toast(win, "Camera isn't ready yet"); return; }
    if (CAM.mode === "video") {
      if (CAM.rec && CAM.rec.state === "recording") { CAM.rec.stop(); return; }
      if (!window.MediaRecorder) { toast(win, "Video recording isn't supported here"); return; }
      CAM.chunks = []; const mime = ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) => MediaRecorder.isTypeSupported?.(m)) || "";
      CAM.rec = new MediaRecorder(CAM.stream, mime ? { mimeType: mime } : undefined);
      CAM.rec.ondataavailable = (e) => e.data.size && CAM.chunks.push(e.data);
      CAM.rec.onstop = () => { win.classList.remove("is-recording"); const type = (CAM.rec.mimeType || "video/webm").split(";")[0]; const blob = new Blob(CAM.chunks, { type }); if (blob.size) camSave(win, blob, "VID_" + stamp() + (type.includes("mp4") ? ".mp4" : ".webm"), type); };
      CAM.rec.start(500); CAM.recStart = Date.now(); win.classList.add("is-recording");
      const t = setInterval(() => { const el = win.querySelector("[data-cam-rect]"); if (!win.isConnected || CAM.rec.state !== "recording") { clearInterval(t); return; } if (el) el.textContent = fmtDur(Date.now() - CAM.recStart); }, 250);
      return;
    }
    const go = () => {
      const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight; const ctx = c.getContext("2d");
      ctx.filter = CAM.filter; if (CAM.facing === "user") { ctx.translate(c.width, 0); ctx.scale(-1, 1); }
      ctx.drawImage(v, 0, 0);
      const fl = win.querySelector("[data-cam-flashfx]"); fl.classList.remove("go"); void fl.offsetWidth; fl.classList.add("go");
      c.toBlob((b) => b && camSave(win, b, "IMG_" + stamp() + ".jpg", "image/jpeg"), "image/jpeg", 0.92);
    };
    if (CAM.delay) { let n = CAM.delay; const el = win.querySelector("[data-cam-count]"); el.hidden = false; el.textContent = n; const t = setInterval(() => { n--; if (n <= 0) { clearInterval(t); el.hidden = true; go(); } else el.textContent = n; }, 1000); }
    else go();
  }
  N.register("camera", {
    title: "Camera",
    actions: `<button class="nx-icon-btn" type="button" data-cam-torch hidden aria-label="Flash">${ic("flash")}</button><button class="nx-icon-btn" type="button" data-cam-delay aria-label="Self-timer" style="width:auto;padding:0 10px;font-size:12px;font-weight:700">${ic("timer3", "sm")}<span data-cam-delay-l>Off</span></button>`,
    tabs: [{ key: "photo", label: "Photo" }, { key: "video", label: "Video" }, { key: "filters", label: "Filters" }],
    html: () => `<div class="nx-cam-view"><video data-cam-video autoplay playsinline muted></video><div class="nx-cam-flash" data-cam-flashfx></div>
        <div class="nx-cam-count" data-cam-count hidden></div><div class="nx-cam-rec"><i></i><span data-cam-rect>00:00</span></div>
        <div class="nx-empty nx-cam-msg" data-cam-msg><span class="nx-skel" style="width:40px;height:40px;border-radius:50%;margin:0 auto 10px;display:block"></span>Starting camera…</div></div>
      <div class="nx-chips nx-cam-filters" data-cam-filters hidden>${FILTERS.map(([n, f], i) => `<button type="button" class="nx-chip${i ? "" : " is-active"}" data-cam-filter="${f}">${n}</button>`).join("")}</div>`,
    footerHtml: () => `<div class="nx-cam-bar"><button type="button" class="nx-cam-last" data-cam-last aria-label="Open Gallery"></button><button type="button" class="nx-cam-shutter" data-cam-shoot aria-label="Take photo"><i></i></button><button type="button" class="nx-icon-btn nx-cam-flip" data-cam-flip aria-label="Switch camera">${ic("flip", "lg")}</button></div>`,
    init(win) {
      win.classList.add("nx-camera"); CAM.mode = "photo"; CAM.filter = "none";
      camStart(win); onClose(win, camStop);
      N.FilesDB.all().then((all) => { const last = all.filter((f) => f.source === "camera").sort((a, b) => b.added - a.added)[0]; if (last && win.isConnected) { const u = URL.createObjectURL(last.blob); win.querySelector("[data-cam-last]").innerHTML = last.type.startsWith("video") ? `<video src="${u}" muted></video>` : `<img src="${u}" alt="Last photo">`; } }).catch(() => {});
      win.addEventListener("click", (e) => {
        if (e.target.closest("[data-cam-shoot]")) return camShoot(win);
        if (e.target.closest("[data-cam-flip]")) { CAM.facing = CAM.facing === "user" ? "environment" : "user"; camStart(win); return; }
        if (e.target.closest("[data-cam-retry]")) return camStart(win);
        if (e.target.closest("[data-cam-last]")) { window.openApp("gallery"); return; }
        if (e.target.closest("[data-cam-delay]")) { CAM.delay = CAM.delay === 0 ? 3 : CAM.delay === 3 ? 10 : 0; win.querySelector("[data-cam-delay-l]").textContent = CAM.delay ? CAM.delay + "s" : "Off"; return; }
        if (e.target.closest("[data-cam-torch]")) { const t = CAM.stream?.getVideoTracks()[0]; CAM.torch = !CAM.torch; t?.applyConstraints({ advanced: [{ torch: CAM.torch }] }).catch(() => {}); e.target.closest("[data-cam-torch]").classList.toggle("is-on", CAM.torch); return; }
        const f = e.target.closest("[data-cam-filter]"); if (f) { CAM.filter = f.dataset.camFilter; setActive(win, "[data-cam-filter]", f); win.querySelector("[data-cam-video]").style.filter = CAM.filter; }
      });
    },
    onTab(win, key) {
      win.querySelector("[data-cam-filters]").hidden = key !== "filters";
      const newMode = key === "video" ? "video" : "photo";
      if (CAM.rec && CAM.rec.state === "recording") CAM.rec.stop();
      win.classList.toggle("is-video", newMode === "video");
      win.querySelector("[data-cam-shoot]").setAttribute("aria-label", newMode === "video" ? "Record video" : "Take photo");
      if (newMode !== CAM.mode) { CAM.mode = newMode; camStart(win); }
    }
  });
  window.addEventListener("pagehide", camStop);
})();
