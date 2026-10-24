/* Nexus OS — Batch 3b: Maps · Generator · Planner · Calendar (v41) */
(function () {
  "use strict";
  const N = window.NexusApps; if (!N) return;
  const { ic, esc, uid, store, toast, openSheet, closeSheet, setActive, showView, selectNav, selectTab, FilesDB } = N;
  Object.assign(N.I, {
    nav: '<path d="m3 11 19-9-9 19-2-8Z"/>',
    route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
    food: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
    fuel: '<path d="M3 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18M2 22h14M15 9h2a2 2 0 0 1 2 2v6a2 2 0 0 0 4 0V9l-3-3M7 7h4"/>',
    hospital: '<path d="M12 6v12M6 12h12"/><rect x="3" y="3" width="18" height="18" rx="3"/>',
    bank: '<path d="M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M2 10l10-7 10 7Z"/>',
    school: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 2.5 9 2.5 12 0v-5"/>',
    tree: '<path d="M12 22v-6M7 16h10l-5-14Z"/>',
    wand: '<path d="m15 4 5 5L9 20l-5-5Z"/><path d="M14 9 9 4M19 2v4M21 4h-4M5 3v2M6 4H4"/>',
    film: '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M7 3v18M17 3v18M2 8h5M2 13h5M2 18h5M17 8h5M17 13h5M17 18h5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    fire: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.4 0 2.5-1.1 2.5-2.5 0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.3.5 1.3 1 2 1 2.3Z"/>'
  });
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const parseYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const hm12 = (t) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); };
  const COLS = ["#1e88ff", "#22c55e", "#f59e0b", "#ec4899", "#7c5cff", "#14b8a6", "#ef4444"];

  /* ================================================================== *
   * MAPS — OpenStreetMap + place search near you
   * ================================================================== */
  const MP = { center: null, results: [], sel: null };
  const CATS = [["food", "Restaurants", "restaurant"], ["fuel", "Petrol", "fuel"], ["hospital", "Hospitals", "hospital"], ["bank", "ATMs", "atm"], ["school", "Schools", "school"], ["tree", "Parks", "park"]];
  const mpHome = () => { const w = store.get("nexus-weather-place", null); return w ? { lat: w.lat, lon: w.lon, name: w.name } : { lat: 11.1085, lon: 77.3411, name: "Tiruppur" }; };
  const kmBetween = (a, b) => { const R = 6371, dLa = ((b.lat - a.lat) * Math.PI) / 180, dLo = ((b.lon - a.lon) * Math.PI) / 180; const x = Math.sin(dLa / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
  const fmtKm = (k) => (k < 1 ? Math.round(k * 1000) + " m" : k.toFixed(1) + " km");
  function mpFrame(win, p, z = 0.02) {
    const f = win.querySelector("[data-mp-frame]");
    f.src = `https://www.openstreetmap.org/export/embed.html?bbox=${p.lon - z},${p.lat - z * 0.8},${p.lon + z},${p.lat + z * 0.8}&layer=mapnik&marker=${p.lat},${p.lon}`;
  }
  const gDir = (p) => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`;
  function mpRow(r, i, attr) { return `<button type="button" class="nx-row" ${attr}="${i}"><span class="nx-tile t-blue">${ic("pin")}</span><span class="nx-row-main"><strong>${esc(r.name)}</strong><span>${esc(r.addr)}</span></span>${MP.center ? `<span class="nx-row-meta">${fmtKm(kmBetween(MP.center, r))}</span>` : ""}</button>`; }
  function mpShow(win, list, title) {
    MP.results = list;
    win.querySelector("[data-mp-res]").innerHTML = list.length ? `<div class="nx-section-title">${esc(title)} <small>${list.length}</small></div><div class="nx-list">${list.map((r, i) => mpRow(r, i, "data-mp-pick")).join("")}</div>` : `<div class="nx-card nx-empty">${ic("search")}<strong>Nothing found</strong>Try a different name or zoom out with a bigger city.</div>`;
  }
  async function mpSearch(win, q, near) {
    const box = win.querySelector("[data-mp-res]"); box.innerHTML = `<div class="nx-list">${'<div class="nx-row"><span class="nx-skel" style="width:40px;height:40px"></span><span class="nx-skel" style="height:14px;flex:1"></span></div>'.repeat(3)}</div>`;
    const c = MP.center || mpHome(); let url = "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=0&limit=12&q=" + encodeURIComponent(q);
    if (near) url += `&viewbox=${c.lon - 0.12},${c.lat + 0.1},${c.lon + 0.12},${c.lat - 0.1}&bounded=1`;
    try {
      const d = await (await fetch(url, { headers: { "Accept-Language": "en" } })).json();
      const list = d.map((x) => ({ name: x.name || x.display_name.split(",")[0], addr: x.display_name.split(",").slice(1, 4).join(",").trim(), lat: Number(x.lat), lon: Number(x.lon) }));
      if (near) list.sort((a, b) => kmBetween(c, a) - kmBetween(c, b));
      mpShow(win, list, near ? q.replace(/^./, (m) => m.toUpperCase()) + " nearby" : "Results");
      if (list[0] && !near) { mpFrame(win, list[0], 0.03); }
    } catch (_) { box.innerHTML = `<div class="nx-error">Couldn't search maps. Check your internet.</div>`; }
  }
  function mpPlace(win, r) {
    MP.sel = r; mpFrame(win, r, 0.006);
    const saved = store.get("nexus-places", []).some((p) => p.lat === r.lat && p.lon === r.lon);
    openSheet(win, `<h3>${esc(r.name)}</h3><p class="nx-note" style="margin:-6px 0 14px">${esc(r.addr || `${r.lat.toFixed(4)}, ${r.lon.toFixed(4)}`)}${MP.center ? " · " + fmtKm(kmBetween(MP.center, r)) + " away" : ""}</p>
      <div class="nx-actions"><a class="nx-btn" href="${gDir(r)}" target="_blank" rel="noopener">${ic("nav", "sm")} Directions</a><button type="button" class="nx-btn ghost" data-mp-save>${ic("bookmark", "sm")} ${saved ? "Saved" : "Save"}</button><button type="button" class="nx-btn ghost" data-mp-share>${ic("share", "sm")} Share</button></div>`, (p) => p.addEventListener("click", (e) => {
      if (e.target.closest("[data-mp-save]")) { let l = store.get("nexus-places", []); if (l.some((x) => x.lat === r.lat && x.lon === r.lon)) l = l.filter((x) => !(x.lat === r.lat && x.lon === r.lon)); else { l.unshift(r); toast(win, "Place saved"); } store.set("nexus-places", l); closeSheet(win); }
      if (e.target.closest("[data-mp-share]")) { const url = `https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lon}#map=17/${r.lat}/${r.lon}`; if (navigator.share) navigator.share({ title: r.name, url }).catch(() => {}); else { navigator.clipboard?.writeText(url); toast(win, "Link copied"); } }
    }));
  }
  N.register("maps", {
    title: "Maps",
    nav: [{ key: "explore", label: "Explore", icon: "pin" }, { key: "saved", label: "Saved", icon: "bookmark" }, { key: "dir", label: "Directions", icon: "route" }],
    html: () => `<div data-view="explore"><form class="nx-search" data-mp-form role="search"><span>${ic("search")}</span><input name="q" placeholder="Search places, shops, cities" autocomplete="off" enterkeyhint="search" aria-label="Search places"><button type="button" class="nx-icon-btn" data-mp-loc aria-label="My location">${ic("locate")}</button></form>
        <div class="nx-chips">${CATS.map(([i, l, q]) => `<button type="button" class="nx-chip" data-mp-cat="${q}">${ic(i, "sm")} ${l}</button>`).join("")}</div>
        <div class="nx-mp-map"><iframe data-mp-frame title="Map" loading="lazy" referrerpolicy="no-referrer"></iframe><span class="nx-mp-where" data-mp-where></span></div>
        <div data-mp-res></div><p class="nx-note">Map data © OpenStreetMap contributors.</p></div>
      <div data-view="saved" hidden><div data-mp-saved></div></div>
      <div data-view="dir" hidden><div class="nx-card" style="padding:16px"><form data-mp-dir>
        <label class="nx-field">From<input class="nx-input" name="from" placeholder="My location" autocomplete="off"></label>
        <label class="nx-field">To<input class="nx-input" name="to" placeholder="Where do you want to go?" required autocomplete="off"></label>
        <div class="nx-seg" data-mp-mode style="margin-bottom:12px"><button type="button" class="is-active" data-m="driving">Car</button><button type="button" data-m="two-wheeler">Bike</button><button type="button" data-m="transit">Bus</button><button type="button" data-m="walking">Walk</button></div>
        <button class="nx-btn block" type="submit">${ic("nav", "sm")} Start directions</button></form></div><p class="nx-note">Turn-by-turn directions open in Google Maps.</p></div>`,
    init(win) {
      win.classList.add("nx-maps"); MP.center = null; const h = mpHome(); mpFrame(win, h, 0.04);
      win.querySelector("[data-mp-where]").textContent = h.name;
      mpShow(win, [], ""); win.querySelector("[data-mp-res]").innerHTML = "";
      const form = win.querySelector("[data-mp-form]");
      form.addEventListener("submit", (e) => { e.preventDefault(); const q = form.q.value.trim(); if (q) { form.q.blur(); mpSearch(win, q, false); } });
      win.querySelector("[data-mp-dir]").addEventListener("submit", (e) => {
        e.preventDefault(); const f = e.target; const mode = win.querySelector("[data-mp-mode] .is-active").dataset.m;
        const u = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(f.to.value)}${f.from.value.trim() ? "&origin=" + encodeURIComponent(f.from.value) : ""}&travelmode=${mode === "two-wheeler" ? "two-wheeler" : mode}`;
        window.open(u, "_blank", "noopener");
      });
      win.addEventListener("click", (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-mp-mode] button")) { setActive(win, "[data-mp-mode] button", g("[data-mp-mode] button")); return; }
        if (g("[data-mp-loc]")) {
          if (!navigator.geolocation) { toast(win, "Location isn't available"); return; }
          toast(win, "Finding you…");
          navigator.geolocation.getCurrentPosition((p) => { MP.center = { lat: p.coords.latitude, lon: p.coords.longitude, name: "You are here" }; mpFrame(win, MP.center, 0.01); win.querySelector("[data-mp-where]").textContent = "Your location"; }, () => toast(win, "Allow location for this site to use this"), { enableHighAccuracy: true, timeout: 12000 });
          return;
        }
        if (g("[data-mp-cat]")) { setActive(win, "[data-mp-cat]", g("[data-mp-cat]")); mpSearch(win, g("[data-mp-cat]").dataset.mpCat, true); return; }
        if (g("[data-mp-pick]")) { mpPlace(win, MP.results[Number(g("[data-mp-pick]").dataset.mpPick)]); return; }
        if (g("[data-mp-spick]")) { const r = store.get("nexus-places", [])[Number(g("[data-mp-spick]").dataset.mpSpick)]; selectNav(win, "explore"); showView(win, "explore"); mpPlace(win, r); }
      });
    },
    onNav(win, key) {
      showView(win, key);
      if (key === "saved") { const l = store.get("nexus-places", []); win.querySelector("[data-mp-saved]").innerHTML = l.length ? `<div class="nx-list">${l.map((r, i) => mpRow(r, i, "data-mp-spick")).join("")}</div>` : `<div class="nx-card nx-empty">${ic("bookmark")}<strong>No saved places</strong>Open a place and tap Save — like Home, School or Tuition.</div>`; }
    }
  });

  /* ================================================================== *
   * PHOTO & VIDEO GENERATOR — AI images + animated videos
   * ================================================================== */
  const STYLES = [["None", ""], ["Realistic", "photorealistic, detailed, natural light"], ["Anime", "anime style, vibrant, studio quality"], ["3D", "3D render, pixar style, soft lighting"], ["Watercolor", "watercolor painting, soft"], ["Pixel art", "pixel art, 16-bit"], ["Cyberpunk", "cyberpunk, neon lights, futuristic"]];
  const SIZES = [["Square", 1024, 1024], ["Portrait", 768, 1344], ["Wide", 1344, 768]];
  const GN = { style: "", size: 0, last: null, busy: false };
  const genUrl = (p, seed, w = 1024, h = 1024) => `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=${w}&height=${h}&nologo=true&safe=true&seed=${seed}`;
  const GEN_GAP = 46000;
  async function genFetch(url, onWait) {
    let wait = store.get("nx-gen-last", 0) + GEN_GAP - Date.now();
    while (wait > 0) { onWait?.(Math.ceil(wait / 1000)); await new Promise((r) => setTimeout(r, Math.min(1000, wait))); wait = store.get("nx-gen-last", 0) + GEN_GAP - Date.now(); }
    onWait?.(0); store.set("nx-gen-last", Date.now());
    let r; try { r = await fetch(url); } catch (_) { throw new Error("offline"); }
    if (r.status === 402 || r.status === 429) throw new Error("limit");
    if (!r.ok) throw new Error("busy");
    const b = await r.blob(); if (!b.type.startsWith("image")) throw new Error("busy"); return b;
  }
  const genErr = (e) => e.message === "limit" ? "You've used the free AI image for now. Wait about a minute, then tap Try again." : e.message === "offline" ? "Couldn't reach the image service. Check your internet." : "The image service is busy. Try again in a moment.";
  N.genFetch = genFetch; N.genUrl = genUrl; N.genErr = genErr;
  const blobImg = (blob) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(blob); });
  async function saveBlobToGallery(blob, name) { const id = uid(); await FilesDB.put({ id, name, type: blob.type, size: blob.size, added: Date.now(), blob, source: "generator" }); return id; }
  const GURLS = [];
  async function genCreations(win) {
    let l = []; try { l = (await FilesDB.all()).filter((f) => f.source === "generator").sort((a, b) => b.added - a.added).slice(0, 24); } catch (_) {}
    GURLS.forEach((u) => URL.revokeObjectURL(u)); GURLS.length = 0; GN.mine = l;
    const box = win.querySelector("[data-gn-mine]"); if (!box) return;
    box.innerHTML = l.length ? `<div class="nx-section-title">My creations <small>${l.length}</small></div><div class="nx-g-grid">${l.map((c, i) => { const u = URL.createObjectURL(c.blob); GURLS.push(u); return `<button type="button" class="nx-g-cell" data-gn-old="${i}" aria-label="${esc(c.name)}">${c.type.startsWith("video") ? `<video src="${u}#t=0.5" muted preload="metadata"></video><span class="nx-g-badge">${ic("play", "sm")}</span>` : `<img src="${u}" alt="" loading="lazy">`}</button>`; }).join("")}</div>` : "";
  }
  N.register("generator", {
    title: "Photo & Video Generator",
    tabs: [{ key: "img", label: "Text to Image" }, { key: "vid", label: "Text to Video" }],
    html: () => `<form data-gn-form class="nx-card nx-gn-form"><label class="nx-field" style="margin:0">Describe what you want<textarea class="nx-input" name="p" rows="3" maxlength="400" placeholder="A futuristic city at sunset with flying cars" required></textarea></label>
        <div class="nx-chips" data-gn-styles>${STYLES.map(([n, s], i) => `<button type="button" class="nx-chip${i ? "" : " is-active"}" data-gn-style="${esc(s)}">${n}</button>`).join("")}</div>
        <div class="nx-seg" data-gn-sizes data-for="img">${SIZES.map(([n], i) => `<button type="button" class="${i ? "" : "is-active"}" data-gn-size="${i}">${n}</button>`).join("")}</div>
        <p class="nx-note" data-for="vid" hidden style="margin:0">Creates one AI scene and turns it into an 8-second video with smooth camera moves.</p>
        <button class="nx-btn block" type="submit">${ic("wand", "sm")} <span data-gn-go>Generate image</span></button></form>
      <div data-gn-out></div><div data-gn-mine></div><p class="nx-note">Images come from the free Pollinations AI service (safety filter on). It allows about one image a minute, and everything you make is saved in Gallery › AI creations.</p>`,
    init(win) {
      win.classList.add("nx-gen"); let mode = "img"; genCreations(win);
      this._mode = (m) => { mode = m; win.querySelectorAll("[data-for]").forEach((el) => { el.hidden = el.dataset.for !== m; }); win.querySelector("[data-gn-go]").textContent = m === "img" ? "Generate image" : "Generate video"; if (!GN.busy) win.querySelector("[data-gn-out]").innerHTML = ""; };
      const out = win.querySelector("[data-gn-out]");
      const shell = (msg) => { out.innerHTML = `<div class="nx-card nx-gn-result"><div class="nx-gn-frame"><span class="nx-skel"></span><div class="nx-gn-status" data-gn-st>${msg}</div></div></div>`; };
      const waitMsg = (s) => { const st = out.querySelector("[data-gn-st]"); if (st && s) st.textContent = `Free AI limit — starting in ${s}s…`; else if (st) st.textContent = "Creating…"; };
      const fail = (e) => { out.querySelector(".nx-gn-frame").innerHTML = `<div class="nx-error" style="margin:16px">${esc(genErr(e))}</div>`; out.querySelector(".nx-gn-result").insertAdjacentHTML("beforeend", `<button type="button" class="nx-btn sm ghost" data-gn-again>${ic("refresh", "sm")} Try again</button>`); };
      const showResult = (blob, p, isVideo) => {
        GN.last = { p, blob }; const u = URL.createObjectURL(blob); const ext = isVideo ? (blob.type.includes("mp4") ? "mp4" : "webm") : "jpg";
        out.innerHTML = `<div class="nx-card nx-gn-result"><div class="nx-gn-frame">${isVideo ? `<video src="${u}" controls loop autoplay muted playsinline class="nx-gn-canvas"></video>` : `<img src="${u}" alt="${esc(p)}">`}</div><p class="nx-note" style="margin:0 0 10px">${ic("check", "sm")} Saved to Gallery › AI creations</p><div class="nx-actions"><a class="nx-btn sm" href="${u}" download="${esc("AI_" + p.slice(0, 24).replace(/[^\w]+/g, "_") + "." + ext)}">${ic("download", "sm")} Download</a>${isVideo ? "" : `<button type="button" class="nx-btn sm ghost" data-gn-wall>${ic("image", "sm")} Set as wallpaper</button>`}<button type="button" class="nx-btn sm ghost" data-gn-again>${ic("refresh", "sm")} Make another</button></div></div>`;
      };
      const makeImage = async (p) => {
        const [, w, h] = SIZES[GN.size]; shell("Creating your image…");
        try { const blob = await genFetch(genUrl(p + (GN.style ? ", " + GN.style : ""), Math.floor(Math.random() * 1e6), w, h), waitMsg); if (!win.isConnected) return; await saveBlobToGallery(blob, "AI_" + p.slice(0, 30).replace(/[^\w]+/g, "_") + ".jpg").catch(() => {}); showResult(blob, p, false); genCreations(win); }
        catch (e) { if (win.isConnected) fail(e); }
      };
      const makeVideo = async (p) => {
        shell("Painting your scene…"); let img;
        try { const blob = await genFetch(genUrl(p + ", cinematic wide shot" + (GN.style ? ", " + GN.style : ""), Math.floor(Math.random() * 1e6), 1344, 768), waitMsg); img = await blobImg(blob); } catch (e) { if (win.isConnected) fail(e); return; }
        if (!win.isConnected) return;
        const st = out.querySelector("[data-gn-st]"); if (st) st.textContent = "Animating…";
        const W = 1280, H = 720, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const ctx = cv.getContext("2d");
        const frame = out.querySelector(".nx-gn-frame"); frame.innerHTML = ""; frame.append(cv); cv.className = "nx-gn-canvas";
        const moves = [[1.0, 0.5, 0.5, 1.25, 0.3, 0.4], [1.25, 0.3, 0.4, 1.35, 0.7, 0.45], [1.35, 0.7, 0.45, 1.15, 0.55, 0.6], [1.15, 0.55, 0.6, 1.0, 0.5, 0.5]];
        const per = 2000, total = per * moves.length, ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const base = Math.max(W / img.width, H / img.height);
        const draw = (t) => {
          const i = Math.min(moves.length - 1, Math.floor(t / per)), k = ease((t - i * per) / per), m = moves[i];
          const z = m[0] + (m[3] - m[0]) * k, cx = m[1] + (m[4] - m[1]) * k, cy = m[2] + (m[5] - m[2]) * k;
          const sw = img.width * base * z, sh = img.height * base * z;
          ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
          ctx.drawImage(img, Math.min(0, Math.max(W - sw, W / 2 - cx * sw)), Math.min(0, Math.max(H - sh, H / 2 - cy * sh)), sw, sh);
          const a = t < 400 ? 1 - t / 400 : t > total - 400 ? (t - (total - 400)) / 400 : 0; if (a > 0) { ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fillRect(0, 0, W, H); }
          if (t > 300 && t < 2600) { const o = Math.min(1, (t - 300) / 400) * Math.min(1, (2600 - t) / 400); ctx.fillStyle = `rgba(0,0,0,${0.45 * o})`; ctx.fillRect(0, H - 110, W, 110); ctx.fillStyle = `rgba(255,255,255,${o})`; ctx.font = "600 40px Inter, system-ui, sans-serif"; ctx.textAlign = "center"; ctx.fillText(p.length > 48 ? p.slice(0, 46) + "…" : p, W / 2, H - 42); }
        };
        if (!(window.MediaRecorder && cv.captureStream)) { const t0 = performance.now(); const loop = () => { const t = (performance.now() - t0) % total; draw(t); if (win.isConnected) requestAnimationFrame(loop); }; loop(); out.querySelector(".nx-gn-result").insertAdjacentHTML("beforeend", `<p class="nx-note">This browser can't record video, but you can watch the preview.</p>`); return; }
        const mime = ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find((x) => MediaRecorder.isTypeSupported?.(x)) || "";
        const rec = new MediaRecorder(cv.captureStream(30), mime ? { mimeType: mime, videoBitsPerSecond: 5e6 } : undefined); const chunks = [];
        rec.ondataavailable = (e) => e.data.size && chunks.push(e.data); const done = new Promise((r) => (rec.onstop = r)); rec.start(250);
        const t0 = performance.now(); await new Promise((r) => { const step = () => { const t = performance.now() - t0; draw(Math.min(t, total - 1)); if (t < total && win.isConnected) requestAnimationFrame(step); else r(); }; step(); });
        rec.stop(); await done; if (!win.isConnected) return;
        const blob = new Blob(chunks, { type: (rec.mimeType || "video/webm").split(";")[0] });
        await saveBlobToGallery(blob, "AI_video_" + p.slice(0, 24).replace(/[^\w]+/g, "_") + (blob.type.includes("mp4") ? ".mp4" : ".webm")).catch(() => {});
        showResult(blob, p, true); genCreations(win);
      };
      const form = win.querySelector("[data-gn-form]");
      form.addEventListener("submit", async (e) => {
        e.preventDefault(); const p = form.p.value.trim(); if (!p || GN.busy) return; GN.busy = true; form.querySelector("[type=submit]").disabled = true;
        try { if (mode === "vid") await makeVideo(p); else await makeImage(p); } finally { GN.busy = false; form.querySelector("[type=submit]").disabled = false; }
      });
      win.addEventListener("click", async (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-gn-style]")) { GN.style = g("[data-gn-style]").dataset.gnStyle; setActive(win, "[data-gn-style]", g("[data-gn-style]")); return; }
        if (g("[data-gn-size]")) { GN.size = Number(g("[data-gn-size]").dataset.gnSize); setActive(win, "[data-gn-size]", g("[data-gn-size]")); return; }
        if (g("[data-gn-again]")) { form.requestSubmit(); return; }
        if (g("[data-gn-old]")) { const c = GN.mine?.[Number(g("[data-gn-old]").dataset.gnOld)]; if (c) { showResult(c.blob, c.name.replace(/^AI_(video_)?/, "").replace(/\.\w+$/, "").replace(/_/g, " "), c.type.startsWith("video")); win.querySelector(".nx-body").scrollTop = 0; } return; }
        if (g("[data-gn-wall]") && GN.last?.blob) {
          try { const img = await blobImg(GN.last.blob); const c = document.createElement("canvas"); const s = Math.min(1, 1280 / Math.max(img.width, img.height)); c.width = img.width * s; c.height = img.height * s; c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); const data = c.toDataURL("image/jpeg", 0.82); store.set("nexus-theme", { ...store.get("nexus-theme", {}), wall: "custom", img: data }); document.body.style.setProperty("background", `center / cover no-repeat url("${data}"), #000`, "important"); document.body.style.setProperty("background-attachment", "fixed"); toast(win, "Wallpaper set — go home to see it"); } catch (_) { toast(win, "Couldn't set wallpaper"); }
        }
      });
    },
    onTab(win, key) { this._mode?.(key); }
  });

  /* ================================================================== *
   * DAY PLANNER — Day / Week / Month, habits & goals
   * ================================================================== */
  const plan = () => store.get("nexus-plan", []);
  const PL = { date: ymd(new Date()), tab: "day", view: "plan" };
  function plItemSheet(win, it, date, done) {
    it = it || { title: "", date: date || PL.date, start: "09:00", end: "10:00", color: COLS[0], note: "" };
    openSheet(win, `<h3>${it.id ? "Edit plan" : "Add to plan"}</h3><form>
      <label class="nx-field">What?<input class="nx-input" name="title" value="${esc(it.title)}" placeholder="e.g. Study maths" required maxlength="60"></label>
      <label class="nx-field">Date<input class="nx-input" type="date" name="date" value="${it.date}" required></label>
      <div class="nx-field-row"><label class="nx-field">Start<input class="nx-input" type="time" name="start" value="${it.start}" required></label><label class="nx-field">End<input class="nx-input" type="time" name="end" value="${it.end}"></label></div>
      <div class="nx-field">Colour<div class="nx-th-swatches" style="gap:10px;margin-top:6px">${COLS.map((c) => `<button type="button" data-c="${c}" style="background:${c};width:34px;height:34px" class="${c === it.color ? "is-active" : ""}" aria-label="Colour"></button>`).join("")}</div></div>
      <button class="nx-btn block" type="submit">Save</button>${it.id ? `<button class="nx-btn danger block" type="button" data-del style="margin-top:10px">${ic("trash", "sm")} Delete</button>` : ""}</form>`, (p) => {
      let color = it.color;
      p.addEventListener("click", (e) => { const c = e.target.closest("[data-c]"); if (c) { color = c.dataset.c; p.querySelectorAll("[data-c]").forEach((b) => b.classList.toggle("is-active", b === c)); } if (e.target.closest("[data-del]")) { store.set("nexus-plan", plan().filter((x) => x.id !== it.id)); closeSheet(win); done(); } });
      p.querySelector("form").addEventListener("submit", (e) => { e.preventDefault(); const f = e.target; const l = plan(); const rec = { ...it, id: it.id || uid(), title: f.title.value.trim(), date: f.date.value, start: f.start.value, end: f.end.value, color }; const i = l.findIndex((x) => x.id === rec.id); if (i >= 0) l[i] = rec; else l.push(rec); store.set("nexus-plan", l); closeSheet(win); PL.date = rec.date; done(); toast(win, "Saved to your plan"); });
    });
  }
  function plDay(win) {
    const sel = parseYmd(PL.date); const start = new Date(sel); start.setDate(sel.getDate() - 3);
    const strip = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
    const items = plan().filter((x) => x.date === PL.date).sort((a, b) => a.start.localeCompare(b.start));
    const now = new Date(); const nowHM = pad(now.getHours()) + ":" + pad(now.getMinutes()); const isToday = PL.date === ymd(now);
    return `<div class="nx-pl-head"><button type="button" class="nx-icon-btn" data-pl-shift="-7" aria-label="Previous week">${ic("arrowL")}</button><strong>${sel.toLocaleDateString([], { month: "long", year: "numeric" })}</strong><button type="button" class="nx-icon-btn" data-pl-shift="7" aria-label="Next week">${ic("arrowR")}</button></div>
      <div class="nx-pl-strip">${strip.map((d) => { const k = ymd(d); const has = plan().some((x) => x.date === k); return `<button type="button" class="${k === PL.date ? "is-active" : ""}${k === ymd(now) ? " is-today" : ""}" data-pl-date="${k}"><small>${d.toLocaleDateString([], { weekday: "short" })}</small><b>${d.getDate()}</b>${has ? "<i></i>" : ""}</button>`; }).join("")}</div>
      ${items.length ? `<div class="nx-pl-time">${items.map((x) => { const live = isToday && x.start <= nowHM && (x.end || x.start) > nowHM; return `<div class="nx-pl-item${x.done ? " is-done" : ""}${live ? " is-live" : ""}" style="--c:${x.color}"><span class="nx-pl-at">${hm12(x.start)}</span><button type="button" class="nx-pl-card" data-pl-edit="${x.id}"><strong>${esc(x.title)}</strong><span>${hm12(x.start)}${x.end ? " – " + hm12(x.end) : ""}${live ? " · Now" : ""}</span></button><button type="button" class="nx-pl-check" data-pl-done="${x.id}" aria-label="Mark done">${x.done ? ic("check", "sm") : ""}</button></div>`; }).join("")}</div>` : `<div class="nx-card nx-empty">${ic("calendar")}<strong>Nothing planned</strong>Tap + to plan study time, classes or play.</div>`}`;
  }
  function plWeek() {
    const sel = parseYmd(PL.date); const mon = new Date(sel); mon.setDate(sel.getDate() - ((sel.getDay() + 6) % 7));
    return `<div class="nx-list">${Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); const k = ymd(d); const it = plan().filter((x) => x.date === k).sort((a, b) => a.start.localeCompare(b.start)); return `<button type="button" class="nx-row nx-pl-wrow${k === ymd(new Date()) ? " is-today" : ""}" data-pl-open="${k}"><span class="nx-pl-wd"><small>${d.toLocaleDateString([], { weekday: "short" })}</small><b>${d.getDate()}</b></span><span class="nx-row-main"><strong>${it.length ? esc(it.map((x) => x.title).slice(0, 2).join(", ")) + (it.length > 2 ? ` +${it.length - 2}` : "") : "Free day"}</strong><span>${it.length ? it.length + " plan" + (it.length > 1 ? "s" : "") + " · from " + hm12(it[0].start) : "Nothing planned"}</span></span>${ic("chev", "sm")}</button>`; }).join("")}</div>`;
  }
  function monthGrid(year, month, dotsFor, selected, attr) {
    const first = new Date(year, month, 1); const lead = first.getDay(); const days = new Date(year, month + 1, 0).getDate(); const today = ymd(new Date());
    let cells = ""; for (let i = 0; i < lead; i++) cells += "<span></span>";
    for (let d = 1; d <= days; d++) { const k = ymd(new Date(year, month, d)); const dots = dotsFor(k); cells += `<button type="button" class="${k === selected ? "is-active" : ""}${k === today ? " is-today" : ""}" ${attr}="${k}"><b>${d}</b><span class="nx-dots">${dots.slice(0, 3).map((c) => `<i style="background:${c}"></i>`).join("")}</span></button>`; }
    return `<div class="nx-month"><div class="nx-month-wd">${["S", "M", "T", "W", "T", "F", "S"].map((x) => `<span>${x}</span>`).join("")}</div><div class="nx-month-grid">${cells}</div></div>`;
  }
  function plMonth() {
    const sel = parseYmd(PL.date);
    return `<div class="nx-pl-head"><button type="button" class="nx-icon-btn" data-pl-mshift="-1" aria-label="Previous month">${ic("arrowL")}</button><strong>${sel.toLocaleDateString([], { month: "long", year: "numeric" })}</strong><button type="button" class="nx-icon-btn" data-pl-mshift="1" aria-label="Next month">${ic("arrowR")}</button></div>` + monthGrid(sel.getFullYear(), sel.getMonth(), (k) => plan().filter((x) => x.date === k).map((x) => x.color), PL.date, "data-pl-open");
  }
  const habits = () => store.get("nexus-habits", [{ id: "h1", name: "Read 20 minutes", log: {} }, { id: "h2", name: "Drink 8 glasses of water", log: {} }, { id: "h3", name: "Practice coding", log: {} }]);
  const streak = (h) => { let n = 0; const d = new Date(); if (!h.log[ymd(d)]) d.setDate(d.getDate() - 1); while (h.log[ymd(d)]) { n++; d.setDate(d.getDate() - 1); } return n; };
  function plHabits() {
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d; });
    return habits().map((h) => `<div class="nx-card nx-hb"><div class="nx-hb-top"><strong>${esc(h.name)}</strong><span class="nx-hb-streak">${ic("fire", "sm")} ${streak(h)} day${streak(h) === 1 ? "" : "s"}</span><button type="button" class="nx-del" data-hb-del="${h.id}" aria-label="Delete habit">${ic("x", "sm")}</button></div><div class="nx-hb-days">${days.map((d) => { const k = ymd(d); return `<button type="button" class="${h.log[k] ? "is-on" : ""}" data-hb="${h.id}" data-day="${k}" aria-label="${d.toDateString()}"><small>${d.toLocaleDateString([], { weekday: "narrow" })}</small><i>${h.log[k] ? ic("check", "sm") : d.getDate()}</i></button>`; }).join("")}</div></div>`).join("") + `<form data-hb-add class="nx-ms-compose" style="border:0;padding:4px 0;background:none"><input name="n" placeholder="Add a new habit" maxlength="40" aria-label="New habit"><button type="submit" aria-label="Add">${ic("plus")}</button></form>`;
  }
  const goals = () => store.get("nexus-goals", [{ id: "g1", name: "Build 10 Nexus apps", done: 8, target: 10 }, { id: "g2", name: "Read 12 books this year", done: 3, target: 12 }]);
  function plGoals() {
    return goals().map((g) => { const p = Math.min(100, Math.round((g.done / g.target) * 100)); return `<div class="nx-card nx-goal"><div class="nx-hb-top"><span class="nx-tile t-indigo">${ic("target")}</span><span class="nx-row-main"><strong>${esc(g.name)}</strong><span>${g.done} of ${g.target} · ${p}%</span></span><button type="button" class="nx-del" data-gl-del="${g.id}" aria-label="Delete goal">${ic("x", "sm")}</button></div><div class="nx-bar"><i style="width:${p}%"></i></div><div class="nx-c-btns" style="margin-top:10px;justify-content:flex-end"><button type="button" class="nx-btn sm ghost" data-gl="${g.id}" data-d="-1">−1</button><button type="button" class="nx-btn sm" data-gl="${g.id}" data-d="1">+1</button></div></div>`; }).join("") + `<button type="button" class="nx-btn ghost block" data-gl-new>${ic("plus", "sm")} New goal</button>`;
  }
  function plRender(win) {
    const box = win.querySelector("[data-pl-main]"); const fab = win.querySelector("[data-pl-add]");
    win.querySelector(".nx-tabs").hidden = PL.view !== "plan"; fab.hidden = PL.view !== "plan";
    if (PL.view === "plan") box.innerHTML = PL.tab === "day" ? plDay(win) : PL.tab === "week" ? plWeek() : plMonth();
    else box.innerHTML = PL.view === "habits" ? plHabits() : plGoals();
    const today = plan().filter((x) => x.date === ymd(new Date()) && !x.done).sort((a, b) => a.start.localeCompare(b.start))[0];
    const nt = document.getElementById("next-task"); if (nt && today) nt.textContent = hm12(today.start) + " · " + today.title;
  }
  N.register("planner", {
    title: "Day Planner",
    tabs: [{ key: "day", label: "Day" }, { key: "week", label: "Week" }, { key: "month", label: "Month" }],
    nav: [{ key: "plan", label: "Plan", icon: "calendar" }, { key: "habits", label: "Habits", icon: "fire" }, { key: "goals", label: "Goals", icon: "target" }],
    html: () => `<div data-pl-main></div><button class="nx-fab" type="button" data-pl-add aria-label="Add plan">${ic("plus")}</button>`,
    init(win) {
      win.classList.add("nx-planner"); PL.view = "plan"; PL.tab = "day"; PL.date = ymd(new Date()); plRender(win);
      const r = () => plRender(win);
      win.addEventListener("submit", (e) => { if (e.target.matches("[data-hb-add]")) { e.preventDefault(); const n = e.target.n.value.trim(); if (!n) return; const l = habits(); l.push({ id: uid(), name: n, log: {} }); store.set("nexus-habits", l); r(); } });
      win.addEventListener("click", (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-pl-add]")) return plItemSheet(win, null, PL.date, r);
        if (g("[data-pl-edit]")) return plItemSheet(win, plan().find((x) => x.id === g("[data-pl-edit]").dataset.plEdit), null, r);
        if (g("[data-pl-done]")) { const l = plan(); const x = l.find((y) => y.id === g("[data-pl-done]").dataset.plDone); x.done = !x.done; store.set("nexus-plan", l); r(); return; }
        if (g("[data-pl-date]")) { PL.date = g("[data-pl-date]").dataset.plDate; r(); return; }
        if (g("[data-pl-shift]")) { const d = parseYmd(PL.date); d.setDate(d.getDate() + Number(g("[data-pl-shift]").dataset.plShift)); PL.date = ymd(d); r(); return; }
        if (g("[data-pl-mshift]")) { const d = parseYmd(PL.date); d.setDate(1); d.setMonth(d.getMonth() + Number(g("[data-pl-mshift]").dataset.plMshift)); PL.date = ymd(d); r(); return; }
        if (g("[data-pl-open]")) { PL.date = g("[data-pl-open]").dataset.plOpen; PL.tab = "day"; selectTab(win, "day"); r(); return; }
        if (g("[data-hb]")) { const l = habits(); const h = l.find((x) => x.id === g("[data-hb]").dataset.hb); const k = g("[data-hb]").dataset.day; if (h.log[k]) delete h.log[k]; else h.log[k] = true; store.set("nexus-habits", l); r(); return; }
        if (g("[data-hb-del]")) { if (confirm("Delete this habit?")) { store.set("nexus-habits", habits().filter((x) => x.id !== g("[data-hb-del]").dataset.hbDel)); r(); } return; }
        if (g("[data-gl]")) { const l = goals(); const x = l.find((y) => y.id === g("[data-gl]").dataset.gl); x.done = Math.max(0, Math.min(x.target, x.done + Number(g("[data-gl]").dataset.d))); store.set("nexus-goals", l); r(); if (x.done === x.target) toast(win, "Goal complete! 🎉"); return; }
        if (g("[data-gl-del]")) { if (confirm("Delete this goal?")) { store.set("nexus-goals", goals().filter((x) => x.id !== g("[data-gl-del]").dataset.glDel)); r(); } return; }
        if (g("[data-gl-new]")) openSheet(win, `<h3>New goal</h3><form><label class="nx-field">Goal<input class="nx-input" name="n" required maxlength="50" placeholder="e.g. Solve 50 maths problems"></label><label class="nx-field">Target number<input class="nx-input" name="t" type="number" min="1" max="10000" value="10" required inputmode="numeric"></label><button class="nx-btn block" type="submit">Add goal</button></form>`, (p) => p.querySelector("form").addEventListener("submit", (ev) => { ev.preventDefault(); const l = goals(); l.push({ id: uid(), name: ev.target.n.value.trim(), done: 0, target: Number(ev.target.t.value) }); store.set("nexus-goals", l); closeSheet(win); r(); }));
      });
    },
    onTab(win, key) { PL.tab = key; plRender(win); },
    onNav(win, key) { PL.view = key; plRender(win); win.querySelector(".nx-body").scrollTop = 0; }
  });
  N.plan = { monthGrid, ymd, parseYmd, hm12 };

  /* ================================================================== *
   * CALENDAR — month view with events, plans and reminders
   * ================================================================== */
  const events = () => store.get("nexus-events", []);
  const CA = { date: ymd(new Date()) };
  function caDay(k) {
    const ev = events().filter((e) => e.date === k).map((e) => ({ kind: "event", id: e.id, title: e.title, time: e.time, color: e.color }));
    /* Public holidays and festivals for Tamil Nadu. */
    const hd = (window.NexusCore && window.NexusCore.holidaysOn(k) || []).map((h) => ({ kind: "holiday", title: h.title, time: "", color: "#38a3ff" }));
    const pl = plan().filter((x) => x.date === k).map((x) => ({ kind: "plan", title: x.title, time: x.start, color: x.color }));
    const rm = store.get("nexus-reminders-v2", []).filter((r) => ymd(new Date(r.time)) === k).map((r) => ({ kind: "reminder", title: r.text, time: pad(new Date(r.time).getHours()) + ":" + pad(new Date(r.time).getMinutes()), color: "#f59e0b" }));
    return [...hd, ...ev, ...pl, ...rm].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }
  function caRender(win) {
    const sel = parseYmd(CA.date);
    win.querySelector(".nx-head h2").textContent = sel.toLocaleDateString([], { month: "long", year: "numeric" });
    const list = caDay(CA.date);
    win.querySelector("[data-ca-main]").innerHTML = `<div class="nx-card" style="padding:12px">${monthGrid(sel.getFullYear(), sel.getMonth(), (k) => caDay(k).map((x) => x.color), CA.date, "data-ca-d")}</div>
      <div class="nx-section-title">${sel.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}</div>
      ${list.length ? `<div class="nx-list">${list.map((x) => `<button type="button" class="nx-row nx-ca-ev" style="--c:${x.color}" ${x.kind === "event" ? `data-ca-edit="${x.id}"` : x.kind === "holiday" ? `data-ca-holiday` : `data-ca-go="${x.kind}"`}><span class="nx-ca-bar"></span><span class="nx-row-main"><strong>${esc(x.title)}</strong><span>${x.time ? hm12(x.time) : "All day"} · ${x.kind === "event" ? "Event" : x.kind === "holiday" ? "Holiday" : x.kind === "plan" ? "Day Planner" : "Reminder"}</span></span>${x.kind === "holiday" ? "" : ic("chev", "sm")}</button>`).join("")}</div>` : `<div class="nx-card nx-empty">${ic("calendar")}<strong>No events</strong>Tap + to add a birthday, exam or trip.</div>`}`;
  }
  function caSheet(win, ev, done) {
    ev = ev || { title: "", date: CA.date, time: "", color: COLS[0], note: "" };
    openSheet(win, `<h3>${ev.id ? "Edit event" : "New event"}</h3><form>
      <label class="nx-field">Title<input class="nx-input" name="title" value="${esc(ev.title)}" placeholder="e.g. Maths exam" required maxlength="60"></label>
      <div class="nx-field-row"><label class="nx-field">Date<input class="nx-input" type="date" name="date" value="${ev.date}" required></label><label class="nx-field">Time (optional)<input class="nx-input" type="time" name="time" value="${ev.time}"></label></div>
      <label class="nx-field">Notes<input class="nx-input" name="note" value="${esc(ev.note || "")}" maxlength="120" placeholder="Room, place, things to bring"></label>
      <div class="nx-field">Colour<div class="nx-th-swatches" style="gap:10px;margin-top:6px">${COLS.map((c) => `<button type="button" data-c="${c}" style="background:${c};width:34px;height:34px" class="${c === ev.color ? "is-active" : ""}" aria-label="Colour"></button>`).join("")}</div></div>
      <button class="nx-btn block" type="submit">Save event</button>${ev.id ? `<button class="nx-btn danger block" type="button" data-del style="margin-top:10px">${ic("trash", "sm")} Delete event</button>` : ""}</form>`, (p) => {
      let color = ev.color;
      p.addEventListener("click", (e) => { const c = e.target.closest("[data-c]"); if (c) { color = c.dataset.c; p.querySelectorAll("[data-c]").forEach((b) => b.classList.toggle("is-active", b === c)); } if (e.target.closest("[data-del]")) { store.set("nexus-events", events().filter((x) => x.id !== ev.id)); closeSheet(win); done(); } });
      p.querySelector("form").addEventListener("submit", (e) => { e.preventDefault(); const f = e.target; const l = events(); const rec = { ...ev, id: ev.id || uid(), title: f.title.value.trim(), date: f.date.value, time: f.time.value, note: f.note.value.trim(), color }; const i = l.findIndex((x) => x.id === rec.id); if (i >= 0) l[i] = rec; else l.push(rec); store.set("nexus-events", l); CA.date = rec.date; closeSheet(win); done(); toast(win, "Event saved"); });
    });
  }
  N.register("calendar", {
    title: "Calendar",
    actions: `<button class="nx-icon-btn" type="button" data-ca-prev aria-label="Previous month">${ic("arrowL")}</button><button class="nx-icon-btn" type="button" data-ca-today aria-label="Today" style="width:auto;padding:0 10px;font-size:12px;font-weight:700">Today</button><button class="nx-icon-btn" type="button" data-ca-next aria-label="Next month">${ic("arrowR")}</button>`,
    html: () => `<div data-ca-main></div><button class="nx-fab" type="button" data-ca-add aria-label="New event">${ic("plus")}</button>`,
    init(win) {
      CA.date = ymd(new Date()); caRender(win); const r = () => caRender(win);
      let sx = null; win.querySelector(".nx-body").addEventListener("touchstart", (e) => { sx = e.target.closest(".nx-month") ? e.touches[0].clientX : null; }, { passive: true });
      win.querySelector(".nx-body").addEventListener("touchend", (e) => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 60) { const d = parseYmd(CA.date); d.setDate(1); d.setMonth(d.getMonth() + (dx < 0 ? 1 : -1)); CA.date = ymd(d); r(); } });
      win.addEventListener("click", (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-ca-d]")) { CA.date = g("[data-ca-d]").dataset.caD; r(); return; }
        if (g("[data-ca-prev]") || g("[data-ca-next]")) { const d = parseYmd(CA.date); d.setDate(1); d.setMonth(d.getMonth() + (g("[data-ca-next]") ? 1 : -1)); CA.date = ymd(d); r(); return; }
        if (g("[data-ca-today]")) { CA.date = ymd(new Date()); r(); return; }
        if (g("[data-ca-add]")) return caSheet(win, null, r);
        if (g("[data-ca-edit]")) return caSheet(win, events().find((x) => x.id === g("[data-ca-edit]").dataset.caEdit), r);
        if (g("[data-ca-go]")) window.openApp(g("[data-ca-go]").dataset.caGo === "plan" ? "planner" : "reminder");
      });
    }
  });
})();
