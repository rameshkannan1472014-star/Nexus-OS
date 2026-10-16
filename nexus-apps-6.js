/* Nexus OS — Batch 4a: FM Radio · Store · Shop Finder · Feedback · Security · Casting (v41) */
(function () {
  "use strict";
  const N = window.NexusApps; if (!N) return;
  const { ic, esc, uid, store, toast, openSheet, closeSheet, setActive, showView, selectNav, selectTab, FilesDB } = N;
  Object.assign(N.I, {
    radio: '<path d="M4.9 19.1a10 10 0 0 1 0-14.2M7.8 16.2a6 6 0 0 1 0-8.4M16.2 7.8a6 6 0 0 1 0 8.4M19.1 4.9a10 10 0 0 1 0 14.2"/><circle cx="12" cy="12" r="2"/>',
    store: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0"/>',
    cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h3l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
    pill: '<path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7ZM8.5 8.5l7 7"/>',
    shirt: '<path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2Z"/>',
    cake: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1M2 21h20M7 8v3M12 8v3M17 8v3M7 4h.01M12 4h.01M17 4h.01"/>',
    pen: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    smartphone: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    cast: '<path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6M2 12a9 9 0 0 1 8 8M2 16a5 5 0 0 1 4 4M2 20h.01"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    bug: '<rect x="8" y="6" width="8" height="14" rx="4"/><path d="m19 7-3 2M5 7l3 2M19 19l-3-2M5 19l3-2M20 13h-4M4 13h4M10 4l1 2M14 4l-1 2"/>',
    bulb: '<path d="M9 18h6M10 22h4M15.1 14c.2-1 .7-1.7 1.4-2.5A4.6 4.6 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>',
    keyhole: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    globe2: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>'
  });
  const pad = (n) => String(n).padStart(2, "0");
  const myPlace = () => new Promise((res) => {
    const fall = () => { const w = store.get("nexus-weather-place", null); res(w ? { lat: w.lat, lon: w.lon, name: w.name, gps: false } : { lat: 11.1085, lon: 77.3411, name: "Tiruppur", gps: false }); };
    if (!navigator.geolocation) return fall();
    navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lon: p.coords.longitude, name: "your location", gps: true }), fall, { timeout: 9000, maximumAge: 300000 });
  });
  const km = (a, b) => { const R = 6371, dLa = ((b.lat - a.lat) * Math.PI) / 180, dLo = ((b.lon - a.lon) * Math.PI) / 180; const x = Math.sin(dLa / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
  const fmtKm = (k) => (k < 1 ? Math.round(k * 1000) + " m" : k.toFixed(1) + " km");

  /* ================================================================== *
   * FM RADIO — live internet radio from radio-browser.info
   * ================================================================== */
  const R = { audio: new Audio(), cur: null, lists: {}, tab: "popular", state: "idle" };
  R.audio.preload = "none";
  const MIRRORS = ["https://de1.api.radio-browser.info", "https://nl1.api.radio-browser.info", "https://at1.api.radio-browser.info"];
  const RTABS = { popular: "countrycode=IN", tamil: "language=tamil", hindi: "language=hindi", world: "tag=pop" };
  async function rFetch(q) {
    const key = "nx-radio:" + q; const c = store.get(key, null); if (c && Date.now() - c.at < 6 * 3600e3) return c.items;
    let last;
    for (const m of MIRRORS) {
      try {
        const r = await fetch(`${m}/json/stations/search?${q}&limit=60&order=clickcount&reverse=true&hidebroken=true&is_https=true`);
        if (!r.ok) throw new Error("busy");
        const seen = new Set(); const items = (await r.json()).filter((s) => s.url_resolved?.startsWith("https") && !seen.has(s.name.trim().toLowerCase()) && seen.add(s.name.trim().toLowerCase())).slice(0, 40).map((s) => ({ id: s.stationuuid, name: s.name.trim(), url: s.url_resolved, logo: s.favicon?.startsWith("https") ? s.favicon : "", tags: (s.tags || "").split(",").slice(0, 2).join(" · "), lang: s.language, country: s.country }));
        store.set(key, { at: Date.now(), items }); return items;
      } catch (e) { last = e; }
    }
    throw last || new Error("busy");
  }
  N.radio = { async play(q) { const l = await rFetch(q ? "name=" + encodeURIComponent(q) : "countrycode=IN"); if (!l.length) return null; rPlay(l[0]); return l[0]; }, stop() { R.audio.pause(); }, current: () => R.cur };
  const rFavs = () => store.get("nexus-radio-favs", []);
  function rPlay(s) {
    N.music?.pause(); R.cur = s; R.state = "loading"; R.audio.src = s.url; R.audio.play().catch(() => { R.state = "error"; rPlayer(); });
    if ("mediaSession" in navigator) navigator.mediaSession.metadata = new MediaMetadata({ title: s.name, artist: "Nexus FM Radio", artwork: s.logo ? [{ src: s.logo }] : [] });
    rPlayer(); rMarkRows();
  }
  R.audio.addEventListener("playing", () => { R.state = "playing"; rPlayer(); rMarkRows(); });
  R.audio.addEventListener("pause", () => { if (R.state !== "error") R.state = "paused"; rPlayer(); rMarkRows(); });
  R.audio.addEventListener("waiting", () => { R.state = "loading"; rPlayer(); });
  R.audio.addEventListener("error", () => { if (R.cur) { R.state = "error"; rPlayer(); } });
  const rLogo = (s, cls) => `<span class="${cls}">${s?.logo ? `<img src="${esc(s.logo)}" alt="" loading="lazy" onerror="this.remove()">` : ""}${ic("radio")}</span>`;
  function rPlayer() {
    const w = document.querySelector("#app-layer .nx-radio"); if (!w) return; const s = R.cur;
    const fav = s && rFavs().some((x) => x.id === s.id);
    const status = { idle: "Pick a station to start", loading: "Connecting…", playing: "● Live", paused: "Paused", error: "This station isn't working right now — try another" }[R.state];
    w.querySelector("[data-r-player]").innerHTML = `<div class="nx-r-player${R.state === "playing" ? " is-live" : ""}">${rLogo(s, "nx-r-art")}<div class="nx-r-info"><small class="${R.state === "playing" ? "live" : R.state === "error" ? "err" : ""}">${status}</small><strong>${esc(s?.name || "Nexus FM Radio")}</strong><span>${esc(s ? [s.tags, s.lang].filter(Boolean).join(" · ") || s.country : "Live internet radio from India & the world")}</span></div>
      <div class="nx-r-ctrl"><button type="button" class="nx-icon-btn${fav ? " is-on" : ""}" data-r-fav ${s ? "" : "disabled"} aria-label="Favourite">${ic("heart")}</button><button type="button" class="nx-m-big" data-r-toggle aria-label="${R.state === "playing" ? "Stop" : "Play"}" ${s ? "" : "disabled"}>${R.state === "loading" ? '<span class="nx-spin"></span>' : ic(R.state === "playing" ? "pause" : "play", "lg")}</button></div></div>
      <label class="nx-p-size" style="margin-top:12px"><span>${ic("volume", "sm")}</span><input class="nx-range" type="range" min="0" max="100" value="${Math.round(R.audio.volume * 100)}" data-r-vol aria-label="Volume"></label>`;
  }
  function rMarkRows() { document.querySelectorAll("#app-layer .nx-radio [data-r-play]").forEach((b) => { const on = R.cur && b.dataset.rId === R.cur.id; b.classList.toggle("is-on", on); const eq = b.querySelector(".nx-eq"); if (on && R.state === "playing" && !eq) b.insertAdjacentHTML("beforeend", '<span class="nx-eq"><i></i><i></i><i></i></span>'); if ((!on || R.state !== "playing") && eq) eq.remove(); }); }
  function rRows(list, key) {
    R.lists[key] = list;
    return list.length ? `<div class="nx-list">${list.map((s, i) => `<button type="button" class="nx-row nx-r-row" data-r-play="${i}" data-r-list="${key}" data-r-id="${esc(s.id)}">${rLogo(s, "nx-r-logo")}<span class="nx-row-main"><strong>${esc(s.name)}</strong><span>${esc([s.tags, s.lang].filter(Boolean).join(" · ") || s.country)}</span></span></button>`).join("")}</div>` : `<div class="nx-card nx-empty">${ic("radio")}<strong>No stations</strong></div>`;
  }
  async function rLoad(win, key, q) {
    const box = win.querySelector("[data-r-list]");
    if (key === "favs") { const f = rFavs(); box.innerHTML = f.length ? rRows(f, "favs") : `<div class="nx-card nx-empty">${ic("heart")}<strong>No favourites yet</strong>Tap the heart while a station plays.</div>`; rMarkRows(); return; }
    box.innerHTML = `<div class="nx-list">${'<div class="nx-row"><span class="nx-skel" style="width:44px;height:44px"></span><span class="nx-skel" style="height:14px;flex:1"></span></div>'.repeat(6)}</div>`;
    try { const items = await rFetch(q || RTABS[key]); if (win.isConnected) { box.innerHTML = rRows(items, key); rMarkRows(); } }
    catch (_) { box.innerHTML = `<div class="nx-error">Couldn't load radio stations. Check your internet.</div>`; }
  }
  N.register("radio", {
    title: "FM Radio",
    actions: `<button class="nx-icon-btn" type="button" data-r-search aria-label="Search stations">${ic("search")}</button>`,
    tabs: [{ key: "popular", label: "India" }, { key: "tamil", label: "Tamil" }, { key: "hindi", label: "Hindi" }, { key: "world", label: "World" }, { key: "favs", label: "Favourites" }],
    html: () => `<div data-r-player></div><form class="nx-search" data-r-form hidden role="search" style="margin-top:14px"><span>${ic("search")}</span><input name="q" placeholder="Search stations, e.g. Mirchi" autocomplete="off" enterkeyhint="search" aria-label="Search stations"></form><div class="nx-section-title" data-r-title>Popular in India</div><div data-r-list></div><p class="nx-note">Stations from the free radio-browser.info directory. Some may be offline at times.</p>`,
    init(win) {
      win.classList.add("nx-radio"); rPlayer(); rLoad(win, R.tab = "popular");
      const form = win.querySelector("[data-r-form]");
      form.addEventListener("submit", (e) => { e.preventDefault(); const q = form.q.value.trim(); if (!q) return; win.querySelector("[data-r-title]").textContent = `Results for “${q}”`; rLoad(win, "search", "name=" + encodeURIComponent(q)); });
      win.addEventListener("input", (e) => { if (e.target.matches("[data-r-vol]")) R.audio.volume = e.target.value / 100; });
      win.addEventListener("click", (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-r-play]")) { const b = g("[data-r-play]"); const s = R.lists[b.dataset.rList]?.[Number(b.dataset.rPlay)]; if (s) { if (R.cur?.id === s.id && R.state === "playing") R.audio.pause(); else rPlay(s); } return; }
        if (g("[data-r-toggle]")) { if (!R.cur) return; if (R.state === "playing" || R.state === "loading") { R.audio.pause(); R.state = "paused"; rPlayer(); } else rPlay(R.cur); return; }
        if (g("[data-r-fav]")) { if (!R.cur) return; let f = rFavs(); f = f.some((x) => x.id === R.cur.id) ? f.filter((x) => x.id !== R.cur.id) : [R.cur, ...f]; store.set("nexus-radio-favs", f); rPlayer(); toast(win, f.some((x) => x.id === R.cur.id) ? "Added to Favourites" : "Removed from Favourites"); if (R.tab === "favs") rLoad(win, "favs"); return; }
        if (g("[data-r-search]")) { form.hidden = !form.hidden; if (!form.hidden) form.q.focus(); }
      });
    },
    onTab(win, key) { R.tab = key; win.querySelector("[data-r-title]").textContent = { popular: "Popular in India", tamil: "Tamil stations", hindi: "Hindi stations", world: "Top world music", favs: "Your favourites" }[key]; rLoad(win, key); }
  });

  /* ================================================================== *
   * STORE — Nexus apps, Android apps & useful web apps
   * ================================================================== */
  let installEvt = null;
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; });
  const ANDROID = [
    ["WhatsApp", "Messaging", "com.whatsapp", "#25d366", "W"], ["Instagram", "Social", "com.instagram.android", "#e1306c", "I"], ["Spotify", "Music", "com.spotify.music", "#1db954", "S"], ["YouTube", "Video", "com.google.android.youtube", "#ff0000", "▶"],
    ["Google Classroom", "Education", "com.google.android.apps.classroom", "#1e8e3e", "C"], ["Duolingo", "Education", "com.duolingo", "#58cc02", "D"], ["Khan Academy", "Education", "org.khanacademy.android", "#14bf96", "K"], ["Canva", "Design", "com.canva.editor", "#7d2ae8", "C"],
    ["Google Maps", "Travel", "com.google.android.apps.maps", "#4285f4", "M"], ["PhonePe", "Payments", "com.phonepe.app", "#5f259f", "P"], ["Sololearn", "Coding", "com.sololearn", "#149ef2", "S"], ["Snapseed", "Photo", "com.niksoftware.snapseed", "#0f9d58", "S"]
  ];
  const WEB = [["Scratch", "Make games with blocks", "https://scratch.mit.edu/", "#f9a825", "S"], ["Replit", "Code in your browser", "https://replit.com/", "#f26207", "R"], ["GeoGebra", "Maths graphs & geometry", "https://www.geogebra.org/calculator", "#6557d2", "G"], ["Photopea", "Free photo editor", "https://www.photopea.com/", "#18a497", "P"], ["Code.org", "Learn to code", "https://code.org/", "#00adbc", "C"], ["Excalidraw", "Sketch diagrams", "https://excalidraw.com/", "#6965db", "E"], ["Desmos", "Graphing calculator", "https://www.desmos.com/calculator", "#2f7d32", "D"], ["Typing Club", "Learn fast typing", "https://www.typingclub.com/", "#0b7bda", "T"]];
  const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  N.register("store", {
    title: "Nexus Store",
    actions: `<button class="nx-icon-btn" type="button" data-st-search aria-label="Search">${ic("search")}</button>`,
    tabs: [{ key: "nexus", label: "Nexus apps" }, { key: "android", label: "Android" }, { key: "web", label: "Web apps" }],
    html: () => `<form class="nx-search" data-st-form hidden role="search"><span>${ic("search")}</span><input name="q" placeholder="Search apps" autocomplete="off" aria-label="Search apps"></form><div data-st-main></div>`,
    init(win) {
      let tab = "nexus", q = "";
      const render = () => {
        const box = win.querySelector("[data-st-main]"); const m = (s) => !q || s.toLowerCase().includes(q);
        if (tab === "nexus") {
          const apps = Object.entries(N.APPS).filter(([k, a]) => k !== "timer" && m(a.title || k)).sort((a, b) => (a[1].title || "").localeCompare(b[1].title || ""));
          box.innerHTML = `${!isStandalone() ? `<div class="nx-card nx-st-hero"><span class="nx-tile t-blue">${ic("smartphone")}</span><div><strong>Install Nexus OS</strong><span>${installEvt ? "Add Nexus to your home screen like a real app." : "In Chrome, tap ⋮ then “Add to Home screen”."}</span></div>${installEvt ? `<button type="button" class="nx-btn sm" data-st-install>Install</button>` : ""}</div>` : ""}
            <div class="nx-section-title">Built in <small>${apps.length} apps</small></div><div class="nx-list">${apps.map(([k, a]) => `<div class="nx-row"><span class="nx-tile ${["t-blue", "t-violet", "t-teal", "t-orange", "t-pink", "t-green", "t-red", "t-indigo"][k.length % 8]}">${esc((a.title || k)[0])}</span><span class="nx-row-main"><strong>${esc(a.title || k)}</strong><span>Nexus OS · Installed</span></span><button type="button" class="nx-btn sm ghost" data-st-open="${k}">Open</button></div>`).join("")}</div>`;
        } else if (tab === "android") {
          box.innerHTML = `<p class="nx-note" style="margin-top:0">Opens the Google Play Store to install real Android apps.</p><div class="nx-list">${ANDROID.filter((a) => m(a[0] + a[1])).map(([n, c, id, col, l]) => `<div class="nx-row"><span class="nx-st-ic" style="background:${col}">${esc(l)}</span><span class="nx-row-main"><strong>${esc(n)}</strong><span>${esc(c)}</span></span><a class="nx-btn sm" href="https://play.google.com/store/apps/details?id=${id}" target="_blank" rel="noopener">Install</a></div>`).join("")}</div>`;
        } else {
          box.innerHTML = `<div class="nx-list">${WEB.filter((a) => m(a[0] + a[1])).map(([n, d, u, col, l]) => `<div class="nx-row"><span class="nx-st-ic" style="background:${col}">${esc(l)}</span><span class="nx-row-main"><strong>${esc(n)}</strong><span>${esc(d)}</span></span><a class="nx-btn sm ghost" href="${u}" target="_blank" rel="noopener">Open</a></div>`).join("")}</div>`;
        }
      };
      render(); this._tab = (k) => { tab = k; render(); };
      const form = win.querySelector("[data-st-form]");
      form.addEventListener("input", () => { q = form.q.value.trim().toLowerCase(); render(); });
      form.addEventListener("submit", (e) => e.preventDefault());
      win.addEventListener("click", async (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-st-open]")) { window.openApp(g("[data-st-open]").dataset.stOpen); return; }
        if (g("[data-st-search]")) { form.hidden = !form.hidden; if (!form.hidden) form.q.focus(); else { q = ""; form.q.value = ""; render(); } return; }
        if (g("[data-st-install]") && installEvt) { installEvt.prompt(); const r = await installEvt.userChoice.catch(() => null); if (r?.outcome === "accepted") toast(win, "Installing Nexus OS…"); installEvt = null; render(); }
      });
    },
    onTab(win, key) { this._tab?.(key); }
  });

  /* ================================================================== *
   * SHOP FINDER — real shops near you from OpenStreetMap
   * ================================================================== */
  const SHOPS = [
    ["food", "Food", "food", "t-orange", 'nwr["amenity"~"^(restaurant|fast_food|cafe|food_court)$"]', ["restaurant","cafe"]],
    ["grocery", "Grocery", "cart", "t-green", 'nwr["shop"~"^(supermarket|convenience|greengrocer|grocery)$"]', ["supermarket","convenience store"]],
    ["pharmacy", "Pharmacy", "pill", "t-red", 'nwr["amenity"="pharmacy"]', ["pharmacy", "medicals"]],
    ["clothes", "Clothes", "shirt", "t-pink", 'nwr["shop"~"^(clothes|tailor|fabric|shoes)$"]', ["clothes shop","shoe shop"]],
    ["phones", "Mobiles", "smartphone", "t-blue", 'nwr["shop"~"^(mobile_phone|electronics|computer)$"]', ["mobile phone shop","electronics shop"]],
    ["bakery", "Bakery", "cake", "t-yellow", 'nwr["shop"~"^(bakery|confectionery|pastry)$"]', ["bakery"]],
    ["books", "Stationery", "pen", "t-indigo", 'nwr["shop"~"^(stationery|books)$"]', ["stationery shop","book shop"]],
    ["atm", "ATM", "bank", "t-teal", 'nwr["amenity"~"^(atm|bank)$"]', ["atm","bank"]]
  ];
  const OVERPASS = ["https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter"];
  async function shopNominatim(terms, at) {
    const out = new Map(); const vb = `${at.lon - 0.06},${at.lat + 0.05},${at.lon + 0.06},${at.lat - 0.05}`;
    if (!at.city) { try { const r = await (await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${at.lat}&lon=${at.lon}`, { headers: { "Accept-Language": "en" } })).json(); at.city = r.address?.city || r.address?.town || r.address?.county || r.address?.state_district || ""; } catch (_) {} }
    for (const t of terms) {
      try {
        const d = await (await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&extratags=1&addressdetails=1&limit=40&bounded=1&viewbox=${vb}&q=${encodeURIComponent(at.city ? t + " in " + at.city : t)}`, { headers: { "Accept-Language": "en" } })).json();
        d.forEach((x) => { if (!x.name) return; const a = x.address || {}; out.set(x.osm_type + x.osm_id, { id: x.osm_type + x.osm_id, name: x.name, lat: Number(x.lat), lon: Number(x.lon), kind: (x.type || "").replace(/_/g, " "), hours: x.extratags?.opening_hours || "", phone: x.extratags?.phone || x.extratags?.["contact:phone"] || "", street: [a.road, a.suburb || a.city_district || a.town || a.city].filter(Boolean).join(", ") }); });
      } catch (_) {}
      await new Promise((r) => setTimeout(r, 1100));
    }
    if (!out.size && !terms.length) throw new Error("busy");
    return [...out.values()].map((s) => ({ ...s, dist: km(at, s) })).filter((s) => s.dist < 8).sort((a, b) => a.dist - b.dist);
  }
  async function shopFind(sel, at, radius = 2500, terms = []) {
    try { return await shopOverpass(sel, at, radius); } catch (_) { return shopNominatim(terms, at); }
  }
  async function shopOverpass(sel, at, radius) {
    const q = `[out:json][timeout:25];(${sel}(around:${radius},${at.lat},${at.lon}););out center 60;`;
    let last;
    for (const u of OVERPASS) {
      try {
        const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 10000);
        const r = await fetch(u, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded" }, signal: ctl.signal }).finally(() => clearTimeout(tm));
        if (!r.ok) throw new Error("busy");
        const d = await r.json();
        return d.elements.map((e) => ({ id: e.type + e.id, name: e.tags?.name || e.tags?.brand || "", lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon, kind: (e.tags?.shop || e.tags?.amenity || "").replace(/_/g, " "), hours: e.tags?.opening_hours || "", phone: e.tags?.phone || e.tags?.["contact:phone"] || "", street: [e.tags?.["addr:street"], e.tags?.["addr:city"]].filter(Boolean).join(", ") }))
          .filter((s) => s.name && s.lat).map((s) => ({ ...s, dist: km(at, s) })).sort((a, b) => a.dist - b.dist);
      } catch (e) { last = e; }
    }
    throw last || new Error("busy");
  }
  N.register("shop", {
    title: "Shop Finder",
    html: () => `<div class="nx-card nx-sf-where"><span class="nx-tile t-blue">${ic("locate")}</span><span class="nx-row-main"><strong data-sf-place>Finding where you are…</strong><span>Real shops from the map</span></span><button type="button" class="nx-btn sm ghost" data-sf-relocate>Refresh</button></div>
      <div class="nx-sf-cats">${SHOPS.map(([k, l, i, t]) => `<button type="button" class="nx-sf-cat" data-sf="${k}"><span class="nx-tile ${t}">${ic(i)}</span><span>${l}</span></button>`).join("")}</div><div data-sf-res><p class="nx-note" style="text-align:center">Pick a category to see shops near you.</p></div><p class="nx-note">Shop data © OpenStreetMap contributors. Small local shops may be missing.</p>`,
    init(win) {
      let at = null, cat = null;
      const locate = async () => { win.querySelector("[data-sf-place]").textContent = "Finding where you are…"; at = await myPlace(); if (!win.isConnected) return; win.querySelector("[data-sf-place]").textContent = at.gps ? "Near your location" : "Near " + at.name; if (cat) run(cat); };
      const run = async (k) => {
        cat = k; const s = SHOPS.find((x) => x[0] === k); const box = win.querySelector("[data-sf-res]");
        box.innerHTML = `<div class="nx-list">${'<div class="nx-row"><span class="nx-skel" style="width:40px;height:40px"></span><span class="nx-skel" style="height:14px;flex:1"></span></div>'.repeat(5)}</div>`;
        if (!at) at = await myPlace();
        try {
          const list = await shopFind(s[4], at, 2500, s[5]); if (!win.isConnected || cat !== k) return;
          box.innerHTML = list.length ? `<div class="nx-section-title">${s[1]} nearby <small>${list.length}</small></div><div class="nx-list">${list.slice(0, 40).map((x) => `<div class="nx-row nx-sf-row"><span class="nx-tile ${s[3]}">${ic(s[2])}</span><span class="nx-row-main"><strong>${esc(x.name)}</strong><span>${esc([x.kind, x.street].filter(Boolean).join(" · "))}${x.hours ? `<br><small>${esc(x.hours.slice(0, 60))}</small>` : ""}</span></span><span class="nx-sf-acts"><b>${fmtKm(x.dist)}</b><span>${x.phone ? `<a class="nx-icon-btn" href="tel:${esc(x.phone.split(";")[0].replace(/\s/g, ""))}" aria-label="Call ${esc(x.name)}">${ic("phone", "sm")}</a>` : ""}<a class="nx-icon-btn" href="https://www.google.com/maps/dir/?api=1&destination=${x.lat},${x.lon}" target="_blank" rel="noopener" aria-label="Directions to ${esc(x.name)}">${ic("nav", "sm")}</a></span></span></div>`).join("")}</div>` : `<div class="nx-card nx-empty">${ic(s[2])}<strong>No ${s[1].toLowerCase()} shops found</strong>OpenStreetMap may not list shops here yet.</div>`;
        } catch (_) { box.innerHTML = `<div class="nx-error">The shop search is busy. Try again in a minute.</div>`; }
      };
      locate();
      win.addEventListener("click", (e) => { const c = e.target.closest("[data-sf]"); if (c) { setActive(win, "[data-sf]", c); run(c.dataset.sf); } if (e.target.closest("[data-sf-relocate]")) locate(); });
    }
  });

  /* ================================================================== *
   * FEEDBACK — rate Nexus, report bugs, suggest features
   * ================================================================== */
  const REPO = "https://github.com/rameshkannan1472014-star/Nexus-OS";
  const TYPES = [["bug", "Report a bug", "bug", "t-red"], ["idea", "Suggest a feature", "bulb", "t-yellow"], ["love", "Say something nice", "heart", "t-pink"]];
  N.register("feedback", {
    title: "Feedback",
    html: () => `<div class="nx-card nx-fb-rate"><strong>How do you like Nexus OS?</strong><div class="nx-fb-stars" data-fb-stars>${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-star="${n}" aria-label="${n} star${n > 1 ? "s" : ""}">${ic("star", "lg")}</button>`).join("")}</div><span data-fb-label>Tap a star</span></div>
      <div class="nx-section-title">Tell us more</div><div class="nx-list" data-fb-types>${TYPES.map(([k, l, i, t], j) => `<button type="button" class="nx-row${j ? "" : " is-active"}" data-fb-type="${k}"><span class="nx-tile ${t}">${ic(i)}</span><span class="nx-row-main"><strong>${l}</strong></span><span class="nx-fb-radio"></span></button>`).join("")}</div>
      <form data-fb-form style="margin-top:12px"><label class="nx-field">Message<textarea class="nx-input" name="msg" rows="4" maxlength="1500" placeholder="What happened, or what would you like to see?" required style="resize:vertical;padding-top:10px"></textarea></label>
        <label class="nx-fb-check"><input type="checkbox" name="dev" checked> Include device info (browser, screen size)</label>
        <button class="nx-btn block" type="submit">${ic("send", "sm")} Send feedback</button></form>
      <p class="nx-note">Feedback opens as a GitHub issue on the Nexus OS project (you'll need a free GitHub account). A copy is kept here.</p><div data-fb-hist></div>`,
    init(win) {
      let stars = store.get("nexus-rating", 0), type = "bug";
      const LABELS = ["Tap a star", "Needs a lot of work", "It's okay", "Good", "Really good", "I love it!"];
      const paint = () => { win.querySelectorAll("[data-star]").forEach((b) => b.classList.toggle("is-on", Number(b.dataset.star) <= stars)); win.querySelector("[data-fb-label]").textContent = LABELS[stars]; };
      const hist = () => { const h = store.get("nexus-feedback", []); win.querySelector("[data-fb-hist]").innerHTML = h.length ? `<div class="nx-section-title">Sent from this phone</div><div class="nx-list">${h.map((x) => `<div class="nx-row"><span class="nx-row-main"><strong>${esc(TYPES.find((t) => t[0] === x.type)?.[1] || "Feedback")}</strong><span>${esc(x.msg.slice(0, 80))}</span></span><span class="nx-row-meta">${new Date(x.at).toLocaleDateString([], { day: "numeric", month: "short" })}</span></div>`).join("")}</div>` : ""; };
      paint(); hist();
      win.querySelector("[data-fb-form]").addEventListener("submit", (e) => {
        e.preventDefault(); const f = e.target; const msg = f.msg.value.trim(); if (!msg) return;
        const label = TYPES.find((t) => t[0] === type)[1];
        const dev = f.dev.checked ? `\n\n---\nRating: ${stars ? "★".repeat(stars) + "☆".repeat(5 - stars) : "not given"}\nBrowser: ${navigator.userAgent}\nScreen: ${screen.width}×${screen.height} @${devicePixelRatio}x\nNexus: v42` : "";
        const title = `[${type === "bug" ? "Bug" : type === "idea" ? "Idea" : "Thanks"}] ${msg.split("\n")[0].slice(0, 70)}`;
        window.open(`${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(msg + dev)}${type === "bug" ? "&labels=bug" : type === "idea" ? "&labels=enhancement" : ""}`, "_blank", "noopener");
        const h = store.get("nexus-feedback", []); h.unshift({ id: uid(), type, msg, stars, at: Date.now() }); store.set("nexus-feedback", h.slice(0, 20));
        f.msg.value = ""; hist(); toast(win, "Thanks! Finish sending it on GitHub.");
        void label;
      });
      win.addEventListener("click", (e) => {
        const s = e.target.closest("[data-star]"); if (s) { stars = Number(s.dataset.star); store.set("nexus-rating", stars); paint(); if (stars === 5) toast(win, "Thank you! 💙"); return; }
        const t = e.target.closest("[data-fb-type]"); if (t) { type = t.dataset.fbType; setActive(win, "[data-fb-type]", t); }
      });
    }
  });

  /* ================================================================== *
   * SECURITY — safety check, permissions, and a Nexus app-lock PIN
   * ================================================================== */
  const sha = async (t) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode("nexus-os:" + t)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  function lockScreen(onDone, setup) {
    document.querySelector(".nx-lock")?.remove();
    const o = document.createElement("div"); o.className = "nx-lock"; let pin = "", first = null;
    const title = () => setup ? (first ? "Type the PIN again" : "Choose a 4-digit PIN") : "Enter your PIN";
    o.innerHTML = `<div class="nx-lock-ic">${ic("keyhole", "lg")}</div><strong data-l-t>${title()}</strong><span data-l-s>${setup ? "You'll need this to open Nexus OS" : "Nexus OS is locked"}</span><div class="nx-lock-dots">${"<i></i>".repeat(4)}</div>
      <div class="nx-lock-keys">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((k) => k === "" ? (setup ? `<button type="button" data-l-cancel class="txt">Cancel</button>` : `<button type="button" data-l-forgot class="txt">Forgot?</button>`) : `<button type="button" data-k="${k}">${k}</button>`).join("")}</div>`;
    document.body.append(o);
    const dots = () => o.querySelectorAll(".nx-lock-dots i").forEach((d, i) => d.classList.toggle("on", i < pin.length));
    const shake = (msg) => { o.querySelector("[data-l-s]").textContent = msg; o.classList.remove("shake"); void o.offsetWidth; o.classList.add("shake"); pin = ""; dots(); try { navigator.vibrate?.(200); } catch (_) {} };
    o.addEventListener("click", async (e) => {
      if (e.target.closest("[data-l-cancel]")) { o.remove(); return; }
      if (e.target.closest("[data-l-forgot]")) { if (prompt("To remove the PIN, type RESET. (Your apps and files stay.)") === "RESET") { localStorage.removeItem("nexus-pin"); o.remove(); onDone?.(); } return; }
      const k = e.target.closest("[data-k]")?.dataset.k; if (k == null) return;
      if (k === "⌫") { pin = pin.slice(0, -1); dots(); return; }
      if (pin.length >= 4) return; pin += k; dots(); if (pin.length < 4) return;
      const h = await sha(pin);
      if (setup) {
        if (!first) { first = h; pin = ""; dots(); o.querySelector("[data-l-t]").textContent = title(); return; }
        if (first !== h) { first = null; o.querySelector("[data-l-t]").textContent = title(); shake("PINs didn't match — try again"); return; }
        localStorage.setItem("nexus-pin", h); o.remove(); onDone?.(true); return;
      }
      if (h === localStorage.getItem("nexus-pin")) { o.classList.add("bye"); setTimeout(() => o.remove(), 250); sessionStorage.setItem("nexus-unlocked", "1"); onDone?.(); }
      else shake("Wrong PIN");
    });
  }
  if (localStorage.getItem("nexus-pin") && !sessionStorage.getItem("nexus-unlocked")) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => lockScreen()); else lockScreen(); }
  N.lockNow = () => { sessionStorage.removeItem("nexus-unlocked"); window.closeWindow?.(); lockScreen(); };
  async function permState(name) { try { return (await navigator.permissions.query({ name })).state; } catch (_) { return "unknown"; } }
  async function secChecks() {
    const notif = "Notification" in window ? Notification.permission : "unsupported";
    const persisted = await navigator.storage?.persisted?.().catch(() => false);
    const chromeV = Number((navigator.userAgent.match(/Chrome\/(\d+)/) || [])[1] || 0);
    return [
      ["Secure connection (HTTPS)", location.protocol === "https:" || location.hostname === "localhost", "Nexus is loaded over an encrypted connection.", "Open Nexus with https:// for safety."],
      ["App lock PIN", !!localStorage.getItem("nexus-pin"), "Nexus asks for your PIN when it opens.", "Set a PIN so others can't open your Nexus."],
      ["Browser is up to date", !chromeV || chromeV >= 128, chromeV ? `Chrome ${chromeV} — good.` : "Your browser looks current.", "Update Chrome from the Play Store."],
      ["Files kept safely", !!persisted, "Your browser won't delete Nexus files when space is low.", "Tap Fix so your browser keeps Nexus files."],
      ["Notifications", notif === "granted", "Reminders and alarms can alert you.", notif === "denied" ? "Blocked — allow in Chrome site settings." : "Allow so reminders can alert you."]
    ];
  }
  N.register("security", {
    title: "Security",
    html: () => `<div data-sec-score></div><div class="nx-section-title">Safety check</div><div data-sec-checks></div>
      <div class="nx-section-title">App permissions</div><div class="nx-list" data-sec-perms></div>
      <div class="nx-section-title">App lock</div><div class="nx-list" data-sec-lock></div>
      <p class="nx-note">Permissions belong to your browser. To change one, tap the lock icon next to the web address in Chrome.</p>`,
    init(win) {
      const render = async () => {
        const checks = await secChecks(); if (!win.isConnected) return; const ok = checks.filter((c) => c[1]).length; const score = Math.round((ok / checks.length) * 100);
        win.querySelector("[data-sec-score]").innerHTML = `<div class="nx-card nx-sec-hero"><div class="nx-c-ring nx-sec-ring" style="--p:${score}"><div><b>${score}</b><span>Score</span></div></div><div><strong>${score >= 80 ? "You're well protected" : score >= 50 ? "Pretty safe — a few fixes" : "Let's make Nexus safer"}</strong><span>${ok} of ${checks.length} checks passed</span></div></div>`;
        win.querySelector("[data-sec-checks]").innerHTML = `<div class="nx-list">${checks.map(([n, pass, good, bad], i) => `<div class="nx-row"><span class="nx-sec-dot ${pass ? "ok" : "bad"}">${ic(pass ? "check" : "info", "sm")}</span><span class="nx-row-main"><strong>${n}</strong><span>${pass ? good : bad}</span></span>${!pass && [1, 3, 4].includes(i) ? `<button type="button" class="nx-btn sm" data-sec-fix="${i}">Fix</button>` : ""}</div>`).join("")}</div>`;
        const perms = [["camera", "Camera", "camera"], ["microphone", "Microphone", "mic"], ["geolocation", "Location", "pin"], ["notifications", "Notifications", "bell"]];
        const st = await Promise.all(perms.map((p) => permState(p[0])));
        win.querySelector("[data-sec-perms]").innerHTML = perms.map(([k, n, i], j) => `<div class="nx-row"><span class="nx-tile t-slate">${ic(i)}</span><span class="nx-row-main"><strong>${n}</strong><span>${{ granted: "Allowed", denied: "Blocked", prompt: "Asks each time", unknown: "Not available" }[st[j]] || st[j]}</span></span><span class="nx-pill ${st[j] === "granted" ? "ok" : st[j] === "denied" ? "bad" : "warn"}">${{ granted: "On", denied: "Off", prompt: "Ask" }[st[j]] || "—"}</span></div>`).join("");
        const has = !!localStorage.getItem("nexus-pin");
        win.querySelector("[data-sec-lock]").innerHTML = has ? `<button type="button" class="nx-row" data-sec-lock-now><span class="nx-tile t-blue">${ic("lock")}</span><span class="nx-row-main"><strong>Lock now</strong><span>Show the PIN screen</span></span>${ic("chev", "sm")}</button><button type="button" class="nx-row" data-sec-change><span class="nx-tile t-indigo">${ic("keyhole")}</span><span class="nx-row-main"><strong>Change PIN</strong></span>${ic("chev", "sm")}</button><button type="button" class="nx-row" data-sec-remove><span class="nx-tile t-red">${ic("trash")}</span><span class="nx-row-main"><strong>Remove PIN</strong></span>${ic("chev", "sm")}</button>` : `<button type="button" class="nx-row" data-sec-set><span class="nx-tile t-blue">${ic("keyhole")}</span><span class="nx-row-main"><strong>Set a PIN</strong><span>Lock Nexus OS with a 4-digit code</span></span>${ic("chev", "sm")}</button>`;
      };
      render();
      win.addEventListener("click", async (e) => {
        const g = (s) => e.target.closest(s);
        const fix = g("[data-sec-fix]")?.dataset.secFix;
        if (fix === "1" || g("[data-sec-set]") || g("[data-sec-change]")) { lockScreen((ok) => { if (ok) toast(win, "PIN set — Nexus is locked when it opens"); render(); }, true); return; }
        if (fix === "3") { const ok = await navigator.storage?.persist?.().catch(() => false); toast(win, ok ? "Your files will be kept" : "Your browser said no — installing Nexus helps"); render(); return; }
        if (fix === "4") { await Notification.requestPermission?.(); render(); return; }
        if (g("[data-sec-lock-now]")) { N.lockNow(); return; }
        if (g("[data-sec-remove]")) { lockScreen(() => { localStorage.removeItem("nexus-pin"); toast(win, "PIN removed"); render(); }); }
      });
    }
  });

  /* ================================================================== *
   * CASTING — show videos & your screen on a TV
   * ================================================================== */
  N.register("casting", {
    title: "Mirror Casting",
    html: () => `<div class="nx-card nx-cast-hero"><div class="nx-cast-tv">${ic("monitor", "lg")}<i></i></div><strong>Cast to your TV</strong><span>Works with Chromecast and Android TVs on the same Wi-Fi.</span></div>
      <div class="nx-section-title">Cast a video</div><div class="nx-card" style="padding:14px"><div class="nx-cast-preview" data-cast-prev><span>${ic("video", "lg")}</span><p>Pick a video from Gallery or your phone</p></div>
        <div class="nx-actions" style="margin-top:12px"><button type="button" class="nx-btn sm ghost" data-cast-gallery>${ic("image", "sm")} From Gallery</button><button type="button" class="nx-btn sm ghost" data-cast-file>${ic("upload", "sm")} From phone</button><button type="button" class="nx-btn sm" data-cast-go disabled>${ic("cast", "sm")} Cast</button></div><input type="file" accept="video/*,audio/*" hidden data-cast-input></div>
      <div class="nx-section-title">Mirror your whole screen</div><div class="nx-list">
        <button type="button" class="nx-row" data-cast-screen><span class="nx-tile t-blue">${ic("monitor")}</span><span class="nx-row-main"><strong>Share this screen</strong><span data-cast-sup>Preview your screen share (computer browsers)</span></span>${ic("chev", "sm")}</button>
        <div class="nx-row"><span class="nx-tile t-teal">${ic("smartphone")}</span><span class="nx-row-main"><strong>Mirror your phone</strong><span>Swipe down twice › tap Cast or Smart View › choose your TV</span></span></div>
        <div class="nx-row"><span class="nx-tile t-violet">${ic("globe2")}</span><span class="nx-row-main"><strong>Cast this tab from Chrome</strong><span>Chrome menu ⋮ › Cast… › pick your TV</span></span></div></div>
      <video data-cast-video playsinline controls hidden class="nx-cast-v"></video>`,
    init(win) {
      const v = win.querySelector("[data-cast-video]"), go = win.querySelector("[data-cast-go]"), prev = win.querySelector("[data-cast-prev]"); let url = null, stream = null;
      const canRemote = "remote" in HTMLMediaElement.prototype;
      if (!navigator.mediaDevices?.getDisplayMedia) win.querySelector("[data-cast-sup]").textContent = "Not supported on phones — use “Mirror your phone” below";
      const load = (blob, name) => { if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(blob); v.srcObject = null; v.src = url; v.hidden = false; prev.innerHTML = `<span>${ic("video", "lg")}</span><p>${esc(name)}</p>`; go.disabled = false; };
      win.querySelector("[data-cast-input]").addEventListener("change", (e) => { const f = e.target.files[0]; if (f) load(f, f.name); e.target.value = ""; });
      const stop = () => { stream?.getTracks().forEach((t) => t.stop()); stream = null; if (url) URL.revokeObjectURL(url); };
      const t = setInterval(() => { if (!win.isConnected) { clearInterval(t); stop(); } }, 800);
      win.addEventListener("click", async (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-cast-file]")) { win.querySelector("[data-cast-input]").click(); return; }
        if (g("[data-cast-gallery]")) {
          const vids = (await FilesDB.all().catch(() => [])).filter((f) => /^(video|audio)\//.test(f.type)).sort((a, b) => b.added - a.added);
          openSheet(win, `<h3>Choose a video</h3>${vids.length ? `<div class="nx-list">${vids.map((f, i) => `<button type="button" class="nx-row" data-cv="${i}"><span class="nx-tile t-red">${ic("video")}</span><span class="nx-row-main"><strong>${esc(f.name)}</strong><span>${N.fmtBytes(f.size)}</span></span></button>`).join("")}</div>` : `<div class="nx-empty">${ic("video")}<strong>No videos yet</strong>Record one with Camera or make one in the Generator.</div>`}`, (p) => p.addEventListener("click", (ev) => { const b = ev.target.closest("[data-cv]"); if (b) { const f = vids[Number(b.dataset.cv)]; closeSheet(win); load(f.blob, f.name); } }));
          return;
        }
        if (g("[data-cast-go]")) {
          if (canRemote && v.remote) { try { await v.remote.prompt(); toast(win, "Casting… control playback here"); } catch (err) { toast(win, err.name === "NotFoundError" ? "No TV found on your Wi-Fi" : err.name === "NotSupportedError" ? "This video can't be cast — try Mirror your phone" : "Casting cancelled"); } }
          else toast(win, "This browser can't cast videos — use Mirror your phone");
          return;
        }
        if (g("[data-cast-screen]")) {
          if (!navigator.mediaDevices?.getDisplayMedia) { toast(win, "Use your phone's Cast / Smart View button"); return; }
          try { stop(); stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }); v.src = ""; v.srcObject = stream; v.muted = true; v.hidden = false; v.play(); go.disabled = true; prev.innerHTML = `<span>${ic("monitor", "lg")}</span><p>Sharing your screen — use Chrome's Cast to send it to a TV</p>`; stream.getVideoTracks()[0].addEventListener("ended", () => { v.hidden = true; prev.innerHTML = `<span>${ic("video", "lg")}</span><p>Screen sharing stopped</p>`; }); }
          catch (_) { toast(win, "Screen sharing was cancelled"); }
        }
      });
    }
  });
})();
