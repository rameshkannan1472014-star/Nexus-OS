/* Nexus OS — Batch 3a: Widgets · Nexus AI · Paint · PDF Viewer (v41) */
(function () {
  "use strict";
  const N = window.NexusApps; if (!N) return;
  const { ic, esc, uid, store, toast, openSheet, closeSheet, setActive, showView, selectNav, FilesDB, userName } = N;
  Object.assign(N.I, {
    sparkle: '<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2Z"/><path d="M19 3v4M17 5h4"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/>',
    speaker: '<path d="M11 5 6 9H2v6h4l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    code: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    text: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    brush: '<path d="M9.1 11.1 18 2.2a2 2 0 0 1 2.8 2.8l-8.9 8.9"/><path d="M7 14c-1.7 0-3 1.3-3 3 0 1.3-1 2-2 2 1 1.3 2.6 2 4 2a4 4 0 0 0 4-4c0-1.7-1.3-3-3-3Z"/>',
    eraser: '<path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 19"/><path d="M22 21H7M5 11l9 9"/>',
    line: '<path d="M5 19 19 5"/>', rect: '<rect x="3" y="5" width="18" height="14" rx="2"/>', circle: '<circle cx="12" cy="12" r="9"/>',
    bucket: '<path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2a2 2 0 0 0 2.8 0Z"/><path d="m5 2 5 5M2 13h15M22 20a2 2 0 1 1-4 0c0-1.6 2-4 2-4s2 2.4 2 4Z"/>',
    undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>', redo: '<path d="m15 14 5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
    save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/>',
    widgets: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/>'
  });

  /* ================================================================== *
   * WIDGETS — choose which panels show on the home screen
   * ================================================================== */
  const WIDGETS = [
    ["weather", "Weather & clock", "Big time, date and live weather", ".weather-hero", "t-blue", "sun"],
    ["search", "Search bar", "Find apps and files fast", ".home-search", "t-slate", "search"],
    ["quick", "Quick Tools", "Shortcuts to your favourite tools", ".quick-tools", "t-indigo", "flash"],
    ["ai", "AI Assistant", "Ask Nexus AI from home", ".home-ai", "t-violet", "sparkle"],
    ["recent", "Recent apps", "Jump back into apps you used", ".recent-panel", "t-teal", "history"],
    ["storage", "Storage", "See how much space is used", ".storage-panel", "t-orange", "drive"],
    ["glance", "At a glance", "Weather, today's plan and music", ".widgets, .section-heading:has(+ .widgets)", "t-green", "widgets"],
    ["buddy", "Floating AI button", "The Nexus AI bubble in the corner", "#ai-companion", "t-pink", "message"]
  ];
  const wState = () => store.get("nexus-widgets", {});
  function applyWidgets() {
    const s = wState(); let st = document.getElementById("nx-widgets-style");
    if (!st) { st = document.createElement("style"); st.id = "nx-widgets-style"; document.head.append(st); }
    st.textContent = WIDGETS.filter((w) => s[w[0]] === false).map((w) => w[3].split(",").map((x) => "#os " + x.trim()).join(",").replace("#os #ai-companion", "#ai-companion") + "{display:none !important}").join("\n");
  }
  applyWidgets();
  N.register("widgets", {
    title: "Widgets",
    html: () => `<div class="nx-card nx-wg-hero"><span class="nx-tile t-blue">${ic("widgets")}</span><div><strong>Make home yours</strong><span>Turn panels on or off. Changes show on the home screen right away.</span></div></div>
      <div class="nx-wg-grid" data-wg></div>
      <button type="button" class="nx-btn ghost block" data-wg-all style="margin-top:14px">${ic("refresh", "sm")} Show all widgets</button>`,
    init(win) {
      const render = () => { const s = wState(); win.querySelector("[data-wg]").innerHTML = WIDGETS.map(([k, n, d, , t, i]) => `<button type="button" class="nx-card nx-wg${s[k] === false ? "" : " is-on"}" data-wg-k="${k}" aria-pressed="${s[k] !== false}"><span class="nx-tile ${t}">${ic(i)}</span><strong>${n}</strong><span>${d}</span><span class="nx-switch" role="presentation" aria-checked="${s[k] !== false}"></span></button>`).join(""); };
      render();
      win.addEventListener("click", (e) => {
        const b = e.target.closest("[data-wg-k]");
        if (b) { const s = wState(); s[b.dataset.wgK] = s[b.dataset.wgK] === false; store.set("nexus-widgets", s); applyWidgets(); render(); toast(win, (s[b.dataset.wgK] ? "Showing " : "Hid ") + WIDGETS.find((w) => w[0] === b.dataset.wgK)[1]); }
        if (e.target.closest("[data-wg-all]")) { store.set("nexus-widgets", {}); applyWidgets(); render(); toast(win, "All widgets are back"); }
      });
    }
  });

  /* ================================================================== *
   * NEXUS AI — real answers + it can control Nexus OS
   * ================================================================== */
  const AI = { busy: false, speak: store.get("nexus-ai-speak", false), rec: null };
  const chat = () => store.get("nexus-ai-chat", []);
  const saveChat = (c) => store.set("nexus-ai-chat", c.slice(-40));
  const SYSTEM = `You are Nexus AI, the friendly built-in assistant of Nexus OS, a web operating system made by a teenage developer in Tamil Nadu, India. The user is ${"{name}"}. Be warm, clear and brief (under 150 words unless asked for more). Use simple language suitable for a teenager. You understand English, Tamil and Tanglish; reply in the user's language. Use short paragraphs, bullet points and code blocks when helpful. Never produce unsafe, adult or hateful content.

YOU CAN CONTROL NEXUS OS. When the user asks you to DO something on the device (open/close apps, play music or radio, call or message someone, notes, tasks, events, reminders, alarms, timers, torch, wallpaper, colours, maps, directions, YouTube, news, photos, recordings, images, etc.), reply with ONE short friendly sentence, then put each action on its own line exactly like this:
[[do: open camera]]
Write the command in simple English using these forms: {cmds}
You can add several [[do: ...]] lines for several actions, in order. Only use [[do: ...]] when the user wants an action, never for normal questions. Never say you can't control the device — use a command instead. If something truly isn't possible from a website (Wi-Fi, Bluetooth, brightness, volume, screenshots), explain briefly.`;
  function md(t) {
    let h = esc(t);
    h = h.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, l, c) => `<pre><code>${c.replace(/\n$/, "")}</code></pre>`);
    h = h.replace(/`([^`\n]+)`/g, "<code>$1</code>").replace(/\*\*([^*\n]+)\*\*/g, "<b>$1</b>").replace(/^#{1,4} (.+)$/gm, "<b>$1</b>");
    h = h.replace(/^(?:\s*[-*•] .+(?:\n|$))+/gm, (m) => "<ul>" + m.trim().split("\n").map((l) => "<li>" + l.replace(/^\s*[-*•] /, "") + "</li>").join("") + "</ul>");
    h = h.replace(/^(?:\s*\d+\. .+(?:\n|$))+/gm, (m) => "<ol>" + m.trim().split("\n").map((l) => "<li>" + l.replace(/^\s*\d+\. /, "") + "</li>").join("") + "</ol>");
    return h.split(/\n{2,}/).map((p) => /^<(pre|ul|ol)/.test(p) ? p : "<p>" + p.replace(/\n/g, "<br>") + "</p>").join("");
  }
  const appNames = () => {
    const m = {}; const info = typeof appInfo !== "undefined" ? appInfo : {};
    Object.keys(info).forEach((k) => { m[k] = k; m[(info[k].title || "").toLowerCase().replace(/^nexus /, "")] = k; });
    Object.entries(N.APPS).forEach(([k, a]) => { m[k] = k; m[(a.title || "").toLowerCase()] = k; });
    Object.assign(m, { phone: "call", dialer: "call", calls: "call", photos: "gallery", alarm: "clock", stopwatch: "clock", sms: "messages", chat: "messages", fm: "radio", "app store": "store", "image generator": "generator", planner: "planner", calendar: "calendar", "file manager": "files", "pdf reader": "pdf", "pdf viewer": "pdf", torch: "sos", flashlight: "sos" });
    return m;
  };
  function parseTime(str) {
    const s = str.toLowerCase().trim(); const now = new Date();
    let m = s.match(/in (\d+)\s*(min|minute|minutes|mins|hour|hours|hr|hrs|h|m)\b/);
    if (m) return new Date(Date.now() + Number(m[1]) * (/^h/.test(m[2]) ? 3600e3 : 60e3));
    m = s.match(/(?:at )?(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?/);
    if (!m) return null;
    let h = Number(m[1]); const min = Number(m[2] || 0); const ap = (m[3] || "").replace(/\./g, "");
    if (h > 23 || min > 59) return null;
    if (ap === "pm" && h < 12) h += 12; if (ap === "am" && h === 12) h = 0;
    const d = new Date(now); d.setHours(h, min, 0, 0);
    if (/tomorrow/.test(s)) d.setDate(d.getDate() + 1);
    else if (d <= now) { if (!ap && h < 12 && h + 12 > now.getHours()) d.setHours(h + 12); if (d <= now) d.setDate(d.getDate() + 1); }
    return d;
  }
  const fmtWhen = (d) => (d.toDateString() === new Date().toDateString() ? "today" : "tomorrow") + " at " + d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  async function weatherReply(place) {
    let p = store.get("nexus-weather-place", null) || { name: "Chennai", lat: 13.0878, lon: 80.2785 };
    if (place) {
      const g = await (await fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + encodeURIComponent(place))).json();
      if (!g.results?.length) return `I couldn't find a place called "${place}".`;
      p = { name: g.results[0].name, lat: g.results[0].latitude, lon: g.results[0].longitude };
    }
    const d = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1`)).json();
    const c = d.current, W = { 0: "clear sky ☀️", 1: "mostly clear 🌤️", 2: "partly cloudy ⛅", 3: "cloudy ☁️", 45: "foggy 🌫️", 51: "light drizzle 🌦️", 53: "drizzle 🌦️", 61: "light rain 🌧️", 63: "rain 🌧️", 65: "heavy rain 🌧️", 80: "rain showers 🌦️", 81: "rain showers 🌧️", 95: "thunderstorms ⛈️" };
    return `**${p.name}** right now: **${Math.round(c.temperature_2m)}°C**, ${W[c.weather_code] || "mixed weather"}. Feels like ${Math.round(c.apparent_temperature)}°C, humidity ${c.relative_humidity_2m}%.\nToday: high ${Math.round(d.daily.temperature_2m_max[0])}°, low ${Math.round(d.daily.temperature_2m_min[0])}°, ${d.daily.precipitation_probability_max[0]}% chance of rain.`;
  }
  async function localIntent(q) {
    const s0 = q.toLowerCase().trim().replace(/[?!.]+$/, ""); const s = N.aiNorm ? N.aiNorm(q) : s0;
    let m;
    if (/^(hi|hello|hey|hai|vanakkam|good (morning|afternoon|evening))\b/.test(s0) && s0.split(" ").length <= 3) return { text: `Hi ${userName()}! 👋 I can answer questions, write and explain code, and control Nexus — try "open camera", "set alarm 6:30 am", "play Anirudh songs" or "draw a robot on Mars".` };
    if ((m = s.match(/(?:set (?:an |the )?alarm|wake me(?: up)?)(?: for| at)?\s+(.+)/))) {
      const d = parseTime(m[1]); if (!d) return { text: "What time should the alarm be? Try \"set alarm 6:30 am\"." };
      const l = store.get("nexus-alarms", []); l.push({ id: uid(), h: d.getHours(), m: d.getMinutes(), label: "Alarm", days: [], on: true }); store.set("nexus-alarms", l);
      return { text: `⏰ Alarm set for **${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}**. It rings while Nexus OS is open.`, action: ["Open Clock", "clock"] };
    }
    if ((m = s.match(/^remind me (?:to |about )?(.+?)(?:\s+((?:at|in|tomorrow)\b.*))?$/))) {
      let what = m[1], d = m[2] ? parseTime(m[2]) : null;
      if (!d) { const t = what.match(/(.+?)\s+((?:at|in|tomorrow)\b.*)$/); if (t) { what = t[1]; d = parseTime(t[2]); } }
      d = d || new Date(Date.now() + 3600e3);
      const l = store.get("nexus-reminders-v2", []); l.push({ id: uid(), text: what.charAt(0).toUpperCase() + what.slice(1), time: d.getTime(), done: false, notified: false, repeat: "none" }); store.set("nexus-reminders-v2", l);
      return { text: `🔔 I'll remind you to **${esc(what)}** ${fmtWhen(d)}.`, action: ["Open Reminder", "reminder"] };
    }
    { const c = await N.aiCmd?.(q); if (c) return c; }
    if (/\b(weather|temperature|rain|forecast)\b/.test(s) && s.length < 60) { m = s.match(/\b(?:in|at|for)\s+([a-z .'-]+)$/); return { text: await weatherReply(m ? m[1].replace(/\b(today|now|tomorrow)\b/g, "").trim() : "") , action: ["Open Weather", "weather"] }; }
    if (/what(?:'s| is) the time|^time$|time now/.test(s)) return { text: `It's **${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}**.` };
    if (/what(?:'s| is) (?:the |today'?s )?date|what day is/.test(s)) return { text: `Today is **${new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}**.` };
    if ((m = s.match(/^(?:what is |what's |calculate |calc |solve )?([\d\s.+\-*/^()%×÷]+|(?:sqrt|sin|cos|tan|log|ln)\s*\(?[\d\s.+\-*/^()]+\)?)$/)) && /\d/.test(m[1]) && /[+\-*/^%×÷(]|sqrt|sin|cos|tan|log/.test(m[1])) {
      try { const r = N.MathEngine.format(N.MathEngine.evaluate(m[1].replace(/×/g, "*").replace(/÷/g, "/"))); return { text: `${esc(m[1].trim())} = **${r}**` }; } catch (_) {}
    }
    if ((m = s.match(/^(?:search(?: the web)?|google)(?: for)?\s+(.+)/))) { N.openUrl("https://www.google.com/search?igu=1&q=" + encodeURIComponent(m[1])); return { text: `Searching the web for **${esc(m[1])}**…` }; }
    if ((m = s.match(/^(?:draw|generate|create|make|imagine)(?: me)?(?: an?| the)?(?: (?:image|picture|photo|drawing|art|wallpaper))?(?: of)?\s+(.{3,})/))) return { image: m[1] };
    return null;
  }
  async function llm(hist, onWait) {
    const msgs = [{ role: "system", content: SYSTEM.replace("{name}", userName()).replace("{cmds}", N.aiCmdHelp || "open <app>") }, ...hist.filter((x) => x.content).slice(-10).map((x) => ({ role: x.role, content: x.content.slice(0, 2000) }))];
    const countdown = async (sec) => { for (let k = sec; k > 0; k--) { onWait?.(k); await new Promise((r) => setTimeout(r, 1000)); } onWait?.(0); };
    const gap = 31000 - (Date.now() - store.get("nx-ai-last", 0)); if (gap > 0 && gap < 31000) await countdown(Math.ceil(gap / 1000));
    for (let attempt = 0; attempt < 3; attempt++) {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 45000);
      try {
        store.set("nx-ai-last", Date.now());
        const r = await fetch("https://text.pollinations.ai/openai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "openai", messages: msgs, referrer: "nexus-os" }), signal: ctl.signal });
        if (r.status === 402 || r.status === 429) { const b = await r.text().catch(() => ""); const sec = Number((b.match(/after (\d+)\s*s/i) || [])[1]) || 30; await countdown(Math.min(sec + 1, 40)); continue; }
        if (!r.ok) throw new Error("busy");
        const d = await r.json(); const c = d.choices?.[0]?.message?.content; if (!c) throw new Error("empty"); return c.trim();
      } finally { clearTimeout(t); }
    }
    throw new Error("busy");
  }
  async function llmAct(txt) {
    const cmds = []; txt = txt.replace(/\[\[\s*do\s*:\s*([^\]]+?)\s*\]\]/gi, (_, c) => { cmds.push(c.trim()); return ""; }).replace(/\n{3,}/g, "\n\n").trim();
    if (!cmds.length) return { content: txt };
    const out = []; let action = null, image = null;
    for (const c of cmds.slice(0, 4)) {
      const r = await localIntent(c).catch(() => null);
      if (r?.image) { image = r.image; continue; }
      if (r) { out.push(r.text); if (r.action) action = r.action; } else out.push(`(I couldn't do “${esc(c)}” yet.)`);
      if (cmds.length > 1) await new Promise((res) => setTimeout(res, 700));
    }
    if (image) return { ...(await aiImage(document.querySelector("#app-layer .nx-ai") || document.body, image)), pre: txt };
    return { content: (txt ? txt + "\n\n" : "") + out.join("\n"), action };
  }
  async function wikiFallback(q) {
    const term = q.replace(/^(tell me about|who|what|where|when) (is|was|are|were )?(the |a |an )?/i, "").replace(/\?.*$/, "").replace(/[.!].*$/, "").trim();
    const s = await (await fetch("https://en.wikipedia.org/w/api.php?origin=*&action=opensearch&limit=1&search=" + encodeURIComponent(term))).json();
    const title = s[1]?.[0]; if (!title) return null;
    const d = await (await fetch("https://en.wikipedia.org/api/rest_v1/page/summary/" + encodeURIComponent(title))).json();
    return d.extract ? `**${d.title}** — ${d.extract}\n\n(From Wikipedia)` : null;
  }
  async function aiImage(win, p) {
    if (!N.genFetch) return { content: "Image making isn't ready yet. Try again in a moment." };
    const typing = () => win.querySelector("[data-ai-typing] > div");
    try {
      const blob = await N.genFetch(N.genUrl(p, Math.floor(Math.random() * 1e6), 768, 768), (sec) => { const t = typing(); if (t) t.innerHTML = sec ? `<span class="nx-note" style="margin:0">Free AI image limit — starting in ${sec}s…</span>` : `<span class="nx-ai-dots"><i></i><i></i><i></i></span>`; });
      await FilesDB.put({ id: uid(), name: "AI_" + p.slice(0, 30).replace(/[^\w]+/g, "_") + ".jpg", type: blob.type || "image/jpeg", size: blob.size, added: Date.now(), blob, source: "generator" }).catch(() => {});
      const bmp = await createImageBitmap(blob); const c = document.createElement("canvas"); const k = Math.min(1, 512 / Math.max(bmp.width, bmp.height)); c.width = bmp.width * k; c.height = bmp.height * k; c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      return { content: "", img: { p, d: c.toDataURL("image/jpeg", 0.8) } };
    } catch (e) { return { content: N.genErr(e) }; }
  }
  function trimImgs(c) { let n = 0; for (let i = c.length - 1; i >= 0; i--) if (c[i].img?.d && ++n > 3) c[i].img.d = null; return c; }
  function aiBubble(m, i) {
    if (m.role === "user") return `<div class="nx-ai-msg me"><div>${esc(m.content)}</div></div>`;
    return `<div class="nx-ai-msg"><span class="nx-ai-orb sm">${ic("sparkle", "sm")}</span><div>${m.img ? `<p>Here's “${esc(m.img.p)}”:</p>${m.img.d ? `<img class="nx-ai-img" src="${m.img.d}" alt="${esc(m.img.p)}" loading="lazy">` : `<p class="nx-note">Image saved in Gallery › AI creations.</p>`}<div class="nx-actions" style="margin-top:8px"><button type="button" class="nx-btn sm ghost" data-ai-open="gallery">${ic("image", "sm")} Open Gallery</button><button type="button" class="nx-btn sm ghost" data-ai-again="${i}">${ic("refresh", "sm")} Another</button></div>` : md(m.content || "")}${m.action ? `<button type="button" class="nx-btn sm" data-ai-open="${esc(m.action[1])}" style="margin-top:8px">${esc(m.action[0])}</button>` : ""}</div></div>`;
  }
  const SUGG = [["sparkle", "Generate image", "Draw a cute robot reading a book in a library", "t-violet"], ["text", "Write text", "Write a short motivational speech for my school assembly", "t-blue"], ["code", "Code help", "Explain JavaScript promises with a simple example", "t-teal"], ["newspaper", "Summarize", "Summarize the story of the Chandrayaan-3 mission in 5 points", "t-orange"]];
  function aiRender(win) {
    const c = chat(); const box = win.querySelector("[data-ai-log]");
    box.innerHTML = c.length ? c.map(aiBubble).join("") : `<div class="nx-ai-hello"><span class="nx-ai-orb">${ic("sparkle", "lg")}</span><h3>Hello, ${esc(userName())}!</h3><p>How can I help you today?</p></div>
      <div class="nx-ai-sugg">${SUGG.map(([i, t, p, c]) => `<button type="button" class="nx-card" data-ai-ask="${esc(p)}"><span class="nx-tile ${c}">${ic(i)}</span><strong>${t}</strong><span>${esc(p)}</span></button>`).join("")}</div>
      <div class="nx-chips" style="margin-top:12px;flex-wrap:wrap">${["Set alarm 6:30 am", "Weather today", "Play Anirudh songs", "Remind me to study at 7 pm", "Open camera", "What is 15% of 2400"].map((x) => `<button type="button" class="nx-chip" data-ai-ask="${esc(x)}">${esc(x)}</button>`).join("")}</div>`;
    const body = win.querySelector(".nx-body"); requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
  }
  function aiSpeak(text) {
    if (!AI.speak || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/[*`#>]/g, "").replace(/\(From Wikipedia\)/, "").slice(0, 600)); u.lang = "en-IN"; speechSynthesis.speak(u);
  }
  async function aiAsk(win, q) {
    q = q.trim(); if (!q || AI.busy) return; AI.busy = true;
    let c = chat(); c.push({ role: "user", content: q }); saveChat(c); aiRender(win);
    win.querySelector("[data-ai-log]").insertAdjacentHTML("beforeend", `<div class="nx-ai-msg" data-ai-typing><span class="nx-ai-orb sm">${ic("sparkle", "sm")}</span><div><span class="nx-ai-dots"><i></i><i></i><i></i></span></div></div>`);
    win.querySelector(".nx-body").scrollTop = 1e9;
    let reply;
    try {
      const pct = q.match(/^(?:what is |what's )?(\d+(?:\.\d+)?)\s*% of (\d+(?:\.\d+)?)/i);
      if (pct) reply = { content: `${pct[1]}% of ${pct[2]} = **${N.MathEngine.format(Number(pct[1]) * Number(pct[2]) / 100)}**` };
      else {
        const loc = await localIntent(q);
        if (loc?.image) reply = await aiImage(win, loc.image);
        else if (loc) reply = { content: loc.text, action: loc.action };
        else { try { reply = await llmAct(await llm(chat(), (sec) => { const el = win.querySelector("[data-ai-typing] > div"); if (el) el.innerHTML = sec ? `<span class="nx-note" style="margin:0">Free AI is busy — answering in ${sec}s…</span>` : `<span class="nx-ai-dots"><i></i><i></i><i></i></span>`; })); } catch (_) { const w = await wikiFallback(q).catch(() => null); reply = { content: w || "I couldn't reach my brain online right now 😅. Check your internet and try again. Commands like \"open camera\" and \"set alarm 7 am\" still work offline." }; } }
      }
    } catch (e) { reply = { content: "Something went wrong: " + e.message }; }
    c = chat(); c.push({ role: "assistant", ...reply }); saveChat(trimImgs(c)); AI.busy = false;
    if (win.isConnected) aiRender(win); if (reply.content) aiSpeak(reply.content);
  }
  N.register("ai", {
    title: "Nexus AI",
    titleHtml: `<h2 class="nx-ai-title"><span class="nx-ai-orb xs">${ic("sparkle", "sm")}</span>Nexus AI <span class="nx-pill ok">Online</span></h2>`,
    actions: `<button class="nx-icon-btn" type="button" data-ai-voice aria-label="Read replies aloud">${ic("speaker")}</button><button class="nx-icon-btn" type="button" data-ai-new aria-label="New chat">${ic("edit")}</button>`,
    html: () => `<div data-ai-log class="nx-ai-log"></div>`,
    footerHtml: () => `<form class="nx-ms-compose nx-ai-compose" data-ai-form><button type="button" class="nx-ai-mic" data-ai-mic aria-label="Speak">${ic("mic")}</button><input name="q" placeholder="Ask anything…" autocomplete="off" aria-label="Message Nexus AI" maxlength="2000" enterkeyhint="send"><button type="submit" aria-label="Send">${ic("send")}</button></form>`,
    init(win) {
      win.classList.add("nx-ai"); aiRender(win);
      win.querySelector("[data-ai-voice]").classList.toggle("is-on", AI.speak);
      const form = win.querySelector("[data-ai-form]");
      form.addEventListener("submit", (e) => { e.preventDefault(); const q = form.q.value; form.q.value = ""; aiAsk(win, q); });
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) win.querySelector("[data-ai-mic]").hidden = true;
      win.addEventListener("click", (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-ai-ask]")) { const p = g("[data-ai-ask]").dataset.aiAsk; if (/^(Draw|Write|Explain|Summarize)/.test(p) && !g(".nx-chip")) { form.q.value = p; form.q.focus(); } else aiAsk(win, p); return; }
        if (g("[data-ai-open]")) { window.openApp(g("[data-ai-open]").dataset.aiOpen); return; }
        if (g("[data-ai-new]")) { if (chat().length && !confirm("Start a new chat? This clears the current one.")) return; saveChat([]); aiRender(win); return; }
        if (g("[data-ai-voice]")) { AI.speak = !AI.speak; store.set("nexus-ai-speak", AI.speak); g("[data-ai-voice]").classList.toggle("is-on", AI.speak); if (!AI.speak) speechSynthesis?.cancel(); toast(win, AI.speak ? "I'll read replies aloud" : "Voice replies off"); return; }
        if (g("[data-ai-again]")) { const m = chat()[Number(g("[data-ai-again]").dataset.aiAgain)]; if (m?.img) aiAsk(win, "Draw " + m.img.p); return; }
        if (g("[data-ai-mic]") && SR) {
          if (AI.rec) { AI.rec.stop(); return; }
          const r = new SR(); AI.rec = r; r.lang = "en-IN"; r.interimResults = true; const mic = g("[data-ai-mic]"); mic.classList.add("is-on");
          r.onresult = (ev) => { const t = [...ev.results].map((x) => x[0].transcript).join(""); form.q.value = t; if (ev.results[ev.results.length - 1].isFinal) { r.stop(); form.q.value = ""; aiAsk(win, t); } };
          r.onend = r.onerror = () => { AI.rec = null; mic.classList.remove("is-on"); };
          try { r.start(); } catch (_) { AI.rec = null; mic.classList.remove("is-on"); }
        }
      });
    }
  });

  /* ================================================================== *
   * PAINT — brush, shapes, fill, undo; saves to Gallery
   * ================================================================== */
  const PAL = ["#111827", "#ffffff", "#ef4444", "#f97316", "#facc15", "#22c55e", "#14b8a6", "#1e88ff", "#7c5cff", "#ec4899", "#8b5a2b", "#94a3b8"];
  const TOOLS = [["brush", "Brush"], ["eraser", "Eraser"], ["line", "Line"], ["rect", "Rectangle"], ["circle", "Circle"], ["bucket", "Fill"]];
  function floodFill(ctx, x, y, hex) {
    const { width: w, height: h } = ctx.canvas; const img = ctx.getImageData(0, 0, w, h); const d = img.data;
    const i0 = (y * w + x) * 4; const t = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]];
    const c = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255];
    if (t.every((v, k) => Math.abs(v - c[k]) < 3)) return;
    const match = (i) => Math.abs(d[i] - t[0]) < 40 && Math.abs(d[i + 1] - t[1]) < 40 && Math.abs(d[i + 2] - t[2]) < 40 && Math.abs(d[i + 3] - t[3]) < 40;
    const st = [[x, y]];
    while (st.length) {
      let [cx, cy] = st.pop(); let i = (cy * w + cx) * 4;
      while (cx >= 0 && match(i)) { cx--; i -= 4; } cx++; i += 4; let up = false, dn = false;
      while (cx < w && match(i)) {
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
        if (cy > 0) { const u = match(i - w * 4); if (u && !up) { st.push([cx, cy - 1]); up = true; } else if (!u) up = false; }
        if (cy < h - 1) { const v = match(i + w * 4); if (v && !dn) { st.push([cx, cy + 1]); dn = true; } else if (!v) dn = false; }
        cx++; i += 4;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  N.register("paint", {
    title: "Paint",
    actions: `<button class="nx-icon-btn" type="button" data-p-undo aria-label="Undo">${ic("undo")}</button><button class="nx-icon-btn" type="button" data-p-redo aria-label="Redo">${ic("redo")}</button><button class="nx-icon-btn" type="button" data-p-more aria-label="More">${ic("dots")}</button>`,
    html: () => `<div class="nx-p-tools">${TOOLS.map(([k, n], i) => `<button type="button" class="${i ? "" : "is-active"}" data-p-tool="${k}" aria-label="${n}" title="${n}">${ic(k)}</button>`).join("")}</div>
      <div class="nx-p-stage"><canvas data-p-canvas aria-label="Drawing canvas"></canvas></div>
      <div class="nx-p-bottom"><div class="nx-p-pal">${PAL.map((c, i) => `<button type="button" class="${i === 7 ? "is-active" : ""}" style="background:${c}" data-p-color="${c}" aria-label="Colour ${c}"></button>`).join("")}<label class="nx-th-custom" aria-label="Custom colour"><input type="color" value="#1e88ff" data-p-pick></label></div>
        <label class="nx-p-size"><span>Size</span><input class="nx-range" type="range" min="1" max="60" value="8" data-p-size aria-label="Brush size"><b data-p-sizev>8</b></label></div>`,
    init(win) {
      win.classList.add("nx-paint");
      const cv = win.querySelector("[data-p-canvas]"), ctx = cv.getContext("2d", { willReadFrequently: true }), stage = win.querySelector(".nx-p-stage");
      const S = { tool: "brush", color: "#1e88ff", size: 8, down: false, x0: 0, y0: 0, snap: null, undo: [], redo: [] };
      const fit = () => {
        const r = stage.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
        const old = S.ready ? ctx.getImageData(0, 0, cv.width, cv.height) : null; S.ready = true;
        cv.width = Math.max(10, Math.round(r.width * dpr)); cv.height = Math.max(10, Math.round(r.height * dpr));
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height); if (old) ctx.putImageData(old, 0, 0);
      };
      requestAnimationFrame(fit);
      let rt; const ro = new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (!S.down && Math.abs(stage.clientWidth * Math.min(2, window.devicePixelRatio || 1) - cv.width) > 4) fit(); }, 150); }); ro.observe(stage);
      const push = () => { S.undo.push(ctx.getImageData(0, 0, cv.width, cv.height)); if (S.undo.length > 25) S.undo.shift(); S.redo = []; };
      const pos = (e) => { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) * (cv.width / r.width)), Math.round((e.clientY - r.top) * (cv.height / r.height))]; };
      const scale = () => cv.width / cv.getBoundingClientRect().width;
      const shape = (x, y) => {
        ctx.putImageData(S.snap, 0, 0); ctx.strokeStyle = S.color; ctx.lineWidth = S.size * scale(); ctx.lineCap = "round"; ctx.beginPath();
        if (S.tool === "line") { ctx.moveTo(S.x0, S.y0); ctx.lineTo(x, y); }
        else if (S.tool === "rect") ctx.rect(S.x0, S.y0, x - S.x0, y - S.y0);
        else ctx.ellipse((S.x0 + x) / 2, (S.y0 + y) / 2, Math.abs(x - S.x0) / 2, Math.abs(y - S.y0) / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      };
      cv.addEventListener("pointerdown", (e) => {
        e.preventDefault(); cv.setPointerCapture(e.pointerId); const [x, y] = pos(e); push();
        if (S.tool === "bucket") { floodFill(ctx, x, y, S.color); return; }
        S.down = true; S.x0 = x; S.y0 = y; S.snap = ctx.getImageData(0, 0, cv.width, cv.height);
        if (S.tool === "brush" || S.tool === "eraser") { ctx.beginPath(); ctx.fillStyle = S.tool === "eraser" ? "#fff" : S.color; ctx.arc(x, y, (S.size * scale()) / 2, 0, Math.PI * 2); ctx.fill(); }
      });
      cv.addEventListener("pointermove", (e) => {
        if (!S.down) return; const [x, y] = pos(e);
        if (S.tool === "brush" || S.tool === "eraser") { ctx.strokeStyle = S.tool === "eraser" ? "#fff" : S.color; ctx.lineWidth = S.size * scale(); ctx.lineCap = ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(S.x0, S.y0); ctx.lineTo(x, y); ctx.stroke(); S.x0 = x; S.y0 = y; }
        else shape(x, y);
      });
      const end = () => { S.down = false; S.snap = null; };
      cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
      const saveImg = (download) => cv.toBlob(async (blob) => {
        if (!blob) return; const name = "Painting_" + new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "") + ".png";
        if (download) { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); return; }
        try { await FilesDB.put({ id: uid(), name, type: "image/png", size: blob.size, added: Date.now(), blob, source: "paint" }); toast(win, "Saved to Gallery › Paintings"); } catch (_) { toast(win, "Couldn't save"); }
      }, "image/png");
      win.addEventListener("input", (e) => { if (e.target.matches("[data-p-size]")) { S.size = Number(e.target.value); win.querySelector("[data-p-sizev]").textContent = S.size; } if (e.target.matches("[data-p-pick]")) { S.color = e.target.value; win.querySelectorAll("[data-p-color]").forEach((b) => b.classList.remove("is-active")); } });
      win.addEventListener("click", (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-p-tool]")) { S.tool = g("[data-p-tool]").dataset.pTool; setActive(win, "[data-p-tool]", g("[data-p-tool]")); return; }
        if (g("[data-p-color]")) { S.color = g("[data-p-color]").dataset.pColor; setActive(win, "[data-p-color]", g("[data-p-color]")); if (S.tool === "eraser") { S.tool = "brush"; setActive(win, "[data-p-tool]", win.querySelector('[data-p-tool="brush"]')); } return; }
        if (g("[data-p-undo]")) { if (!S.undo.length) return; S.redo.push(ctx.getImageData(0, 0, cv.width, cv.height)); ctx.putImageData(S.undo.pop(), 0, 0); return; }
        if (g("[data-p-redo]")) { if (!S.redo.length) return; S.undo.push(ctx.getImageData(0, 0, cv.width, cv.height)); ctx.putImageData(S.redo.pop(), 0, 0); return; }
        if (g("[data-p-more]")) openSheet(win, `<h3>Painting</h3><div class="nx-list"><button type="button" class="nx-row" data-pm="save"><span class="nx-tile t-blue">${ic("save")}</span><span class="nx-row-main"><strong>Save to Gallery</strong><span>Find it in Gallery › Paintings</span></span></button><button type="button" class="nx-row" data-pm="dl"><span class="nx-tile t-teal">${ic("download")}</span><span class="nx-row-main"><strong>Download PNG</strong><span>Save a copy to your phone</span></span></button><button type="button" class="nx-row" data-pm="clear"><span class="nx-tile t-red">${ic("trash")}</span><span class="nx-row-main"><strong>Clear canvas</strong><span>You can undo this</span></span></button></div>`, (p) => p.addEventListener("click", (ev) => {
          const a = ev.target.closest("[data-pm]")?.dataset.pm; if (!a) return; closeSheet(win);
          if (a === "save") saveImg(false); if (a === "dl") saveImg(true);
          if (a === "clear") { push(); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, cv.width, cv.height); }
        }));
      });
    }
  });

  /* ================================================================== *
   * PDF VIEWER — renders PDFs with pdf.js; remembers your page
   * ================================================================== */
  const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
  let pdfLib = null;
  const loadPdfJs = () => pdfLib || (pdfLib = new Promise((res, rej) => {
    if (window.pdfjsLib) { res(window.pdfjsLib); return; }
    const s = document.createElement("script"); s.src = PDFJS + "pdf.min.js";
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js"; res(window.pdfjsLib); };
    s.onerror = () => { pdfLib = null; rej(new Error("Couldn't load the PDF reader. Check your internet.")); }; document.head.append(s);
  }));
  const P = { doc: null, file: null, page: 1, zoom: 1, rendering: false };
  const pdfPos = () => store.get("nexus-pdf-pos", {});
  const pdfMarks = () => store.get("nexus-pdf-marks", {});
  async function pdfLibrary(win) {
    let files = []; try { files = (await FilesDB.all()).filter((f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name)).sort((a, b) => (pdfPos()[b.id]?.at || b.added) - (pdfPos()[a.id]?.at || a.added)); } catch (_) {}
    const pos = pdfPos();
    win.querySelector("[data-pdf-list]").innerHTML = files.length ? `<div class="nx-section-title">Your PDFs</div><div class="nx-list">${files.map((f) => `<button type="button" class="nx-row" data-pdf-open="${f.id}"><span class="nx-tile t-red">${ic("file")}</span><span class="nx-row-main"><strong>${esc(f.name)}</strong><span>${N.fmtBytes(f.size)}${pos[f.id] ? ` · page ${pos[f.id].page} of ${pos[f.id].pages}` : ""}</span></span>${ic("chev", "sm")}</button>`).join("")}</div>` : `<div class="nx-card nx-empty">${ic("file")}<strong>No PDFs yet</strong>Open one from your phone — it'll be kept here and in Files.</div>`;
  }
  async function pdfRender(win) {
    if (!P.doc || P.rendering) return; P.rendering = true;
    try {
      const page = await P.doc.getPage(P.page); const stage = win.querySelector("[data-pdf-stage]");
      const base = page.getViewport({ scale: 1 }); const width = stage.clientWidth - 16; const dpr = Math.min(2, window.devicePixelRatio || 1);
      const vp = page.getViewport({ scale: (width / base.width) * P.zoom * dpr });
      const cv = win.querySelector("[data-pdf-canvas]"); cv.width = vp.width; cv.height = vp.height; cv.style.width = vp.width / dpr + "px";
      await page.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
      win.querySelector("[data-pdf-pg]").textContent = `${P.page} / ${P.doc.numPages}`;
      const marked = (pdfMarks()[P.file.id] || []).includes(P.page); win.querySelector("[data-pdf-mark]").classList.toggle("is-on", marked);
      const pos = pdfPos(); pos[P.file.id] = { page: P.page, pages: P.doc.numPages, at: Date.now() }; store.set("nexus-pdf-pos", pos);
    } catch (e) { toast(win, "Couldn't show this page"); }
    P.rendering = false;
  }
  async function pdfOpen(win, rec) {
    showView(win, "reader"); win.querySelector(".nx-head h2").textContent = rec.name.replace(/\.pdf$/i, "");
    const st = win.querySelector("[data-pdf-msg]"); st.hidden = false; st.innerHTML = `<span class="nx-skel" style="width:60%;height:14px;display:block;margin:0 auto"></span>`;
    try {
      const lib = await loadPdfJs(); P.doc = await lib.getDocument({ data: new Uint8Array(await rec.blob.arrayBuffer()) }).promise; P.file = rec;
      P.page = Math.min(pdfPos()[rec.id]?.page || 1, P.doc.numPages); P.zoom = 1; st.hidden = true; win.querySelector("[data-pdf-bar]").hidden = false; pdfRender(win);
    } catch (e) { st.innerHTML = `<div class="nx-error">${esc(e.message || "This PDF couldn't be opened.")}</div>`; }
  }
  function pdfCloseReader(win) { P.doc = null; win.querySelector("[data-pdf-bar]").hidden = true; win.querySelector(".nx-head h2").textContent = "PDF Viewer"; showView(win, "lib"); pdfLibrary(win); }
  N.register("pdf", {
    title: "PDF Viewer",
    actions: `<button class="nx-icon-btn" type="button" data-pdf-pick aria-label="Open a PDF">${ic("upload")}</button>`,
    html: () => `<div data-view="lib"><button type="button" class="nx-card nx-pdf-open" data-pdf-pick><span class="nx-tile t-red">${ic("file")}</span><span><strong>Open a PDF</strong><span>Pick a file from your phone</span></span>${ic("plus")}</button><div data-pdf-list></div><input type="file" accept="application/pdf,.pdf" hidden data-pdf-file></div>
      <div data-view="reader" hidden><div class="nx-pdf-stage" data-pdf-stage><div data-pdf-msg class="nx-empty"></div><canvas data-pdf-canvas></canvas></div></div>`,
    footerHtml: () => `<div class="nx-pdf-bar" data-pdf-bar hidden><button type="button" class="nx-icon-btn" data-pdf-prev aria-label="Previous page">${ic("arrowL")}</button><button type="button" class="nx-icon-btn" data-pdf-zo aria-label="Zoom out">${ic("zoomOut")}</button><button type="button" class="nx-pdf-pg" data-pdf-pg data-pdf-goto>1 / 1</button><button type="button" class="nx-icon-btn" data-pdf-zi aria-label="Zoom in">${ic("zoomIn")}</button><button type="button" class="nx-icon-btn" data-pdf-mark aria-label="Bookmark page">${ic("bookmark")}</button><button type="button" class="nx-icon-btn" data-pdf-next aria-label="Next page">${ic("arrowR")}</button></div>`,
    init(win) {
      win.classList.add("nx-pdfv"); pdfLibrary(win); loadPdfJs().catch(() => {});
      const inp = win.querySelector("[data-pdf-file]");
      inp.addEventListener("change", async () => { const f = inp.files[0]; inp.value = ""; if (!f) return; const rec = { id: uid(), name: f.name, type: "application/pdf", size: f.size, added: Date.now(), blob: f, source: "pdf" }; try { await FilesDB.put(rec); } catch (_) {} pdfOpen(win, rec); });
      let sx = null; const stage = win.querySelector("[data-pdf-stage]");
      stage.addEventListener("touchstart", (e) => { sx = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
      stage.addEventListener("touchend", (e) => { if (sx == null || P.zoom > 1) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 70) { const n = P.page + (dx < 0 ? 1 : -1); if (n >= 1 && n <= P.doc.numPages) { P.page = n; pdfRender(win); } } sx = null; });
      win.addEventListener("click", async (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-pdf-pick]")) { inp.click(); return; }
        if (g("[data-pdf-open]")) { const id = g("[data-pdf-open]").dataset.pdfOpen; const rec = (await FilesDB.all()).find((f) => f.id === id); if (rec) pdfOpen(win, rec); return; }
        if (!P.doc) return;
        if (g("[data-pdf-prev]") && P.page > 1) { P.page--; pdfRender(win); }
        if (g("[data-pdf-next]") && P.page < P.doc.numPages) { P.page++; pdfRender(win); }
        if (g("[data-pdf-zi]")) { P.zoom = Math.min(3, P.zoom + 0.25); pdfRender(win); }
        if (g("[data-pdf-zo]")) { P.zoom = Math.max(0.5, P.zoom - 0.25); pdfRender(win); }
        if (g("[data-pdf-mark]")) { const m = pdfMarks(); const l = new Set(m[P.file.id] || []); l.has(P.page) ? l.delete(P.page) : l.add(P.page); m[P.file.id] = [...l].sort((a, b) => a - b); store.set("nexus-pdf-marks", m); g("[data-pdf-mark]").classList.toggle("is-on", l.has(P.page)); toast(win, l.has(P.page) ? `Bookmarked page ${P.page}` : "Bookmark removed"); }
        if (g("[data-pdf-goto]")) {
          const marks = pdfMarks()[P.file.id] || [];
          openSheet(win, `<h3>Go to page</h3><form data-pdf-go style="display:flex;gap:8px"><input class="nx-input" name="p" type="number" min="1" max="${P.doc.numPages}" value="${P.page}" inputmode="numeric" aria-label="Page number"><button class="nx-btn" type="submit">Go</button></form>${marks.length ? `<div class="nx-section-title">Bookmarks</div><div class="nx-chips" style="flex-wrap:wrap">${marks.map((p) => `<button type="button" class="nx-chip" data-pdf-jump="${p}">Page ${p}</button>`).join("")}</div>` : `<p class="nx-note">Tap the bookmark button to save pages you want to come back to.</p>`}`, (p) => {
            const go = (n) => { n = Math.max(1, Math.min(P.doc.numPages, n)); P.page = n; closeSheet(win); pdfRender(win); };
            p.querySelector("form").addEventListener("submit", (ev) => { ev.preventDefault(); go(Number(ev.target.p.value) || 1); });
            p.addEventListener("click", (ev) => { const j = ev.target.closest("[data-pdf-jump]"); if (j) go(Number(j.dataset.pdfJump)); });
          });
        }
      });
    },
    onBack(win) { if (P.doc || !win.querySelector('[data-view="reader"]').hidden) { pdfCloseReader(win); return true; } return false; }
  });
})();
