/* Nexus OS — Nexus AI device control (v42)
 * Understands natural commands ("can you turn on the torch", "play some
 * Anirudh songs", "call amma", "add maths homework to my tasks") and runs
 * them. Nexus AI also asks the online model to translate any other phrasing
 * (Tamil, Tanglish, long sentences) into these commands.                   */
(function () {
  "use strict";
  const N = window.NexusApps; if (!N) return;
  const { store, uid } = N; const esc = (x) => String(x); // replies go through the chat's markdown renderer, which escapes HTML
  const pad = (n) => String(n).padStart(2, "0");
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const ymd = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());

  /* ---------- helpers ---------- */
  async function inApp(app, fn, tries = 30) {
    window.openApp(app);
    for (let i = 0; i < tries; i++) { await wait(120); const w = document.querySelector("#app-layer .nx-app"); if (w && w.dataset.appName !== "ai" && w.querySelector(".nx-body")) { if (fn) { await wait(150); try { await fn(w); } catch (_) {} } return w; } }
    return null;
  }
  function fill(w, formSel, value) {
    const f = w.querySelector(formSel); if (!f) return false; f.hidden = false;
    const inp = f.querySelector("input, textarea"); inp.value = value; inp.dispatchEvent(new Event("input", { bubbles: true }));
    f.requestSubmit ? f.requestSubmit() : f.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true })); return true;
  }
  const later = (fn) => setTimeout(fn, 650);
  const APPN = () => {
    const m = {}; const info = typeof appInfo !== "undefined" ? appInfo : {};
    Object.keys(info).forEach((k) => { m[k] = k; m[(info[k].title || "").toLowerCase().replace(/^nexus /, "")] = k; });
    Object.entries(N.APPS).forEach(([k, a]) => { m[k] = k; m[(a.title || "").toLowerCase()] = k; });
    Object.assign(m, {
      phone: "call", dialer: "call", dialler: "call", calls: "call", contacts: "call", "phone app": "call", keypad: "call",
      photos: "gallery", pictures: "gallery", pics: "gallery", "my photos": "gallery", images: "gallery", album: "gallery",
      alarm: "clock", alarms: "clock", stopwatch: "clock", timer: "timer", watch: "clock",
      sms: "messages", chat: "messages", chats: "messages", message: "messages", texts: "messages",
      fm: "radio", "fm radio": "radio", "app store": "store", "play store": "store", appstore: "store",
      "image generator": "generator", "video generator": "generator", "ai image": "generator",
      planner: "planner", "day planner": "planner", schedule: "planner", habits: "planner", goals: "planner",
      calendar: "calendar", "file manager": "files", "my files": "files", documents: "files", downloads: "files",
      "pdf reader": "pdf", pdf: "pdf", torch: "sos", flashlight: "sos", emergency: "sos",
      cam: "camera", selfie: "camera", "voice recorder": "recorder", "audio recorder": "recorder",
      internet: "browser", chrome: "browser", google: "browser", web: "browser", "web browser": "browser",
      yt: "youtube", "you tube": "youtube", songs: "music", spotify: "music", "music player": "music", "music app": "music",
      calc: "calculator", "to do": "tasks", todo: "tasks", "to-do": "tasks", "to do list": "tasks", "todo list": "tasks",
      map: "maps", "google maps": "maps", wallpaper: "themes", wallpapers: "themes", theme: "themes",
      "ai": "ai", assistant: "ai", "nexus ai": "ai", setting: "settings", "control center": "settings",
      game: "games", "tic tac toe": "games", book: "books", "e books": "books", ebooks: "books", library: "books",
      cleaner: "cleaner", "clean up": "cleaner", shop: "shop", shops: "shop", "shop finder": "shop",
      cast: "casting", "screen mirror": "casting", "mirror casting": "casting", security: "security", lock: "security",
      notepad: "notes", note: "notes", paint: "paint", drawing: "paint", draw: "paint", widget: "widgets", news: "news", newspaper: "news"
    });
    return m;
  };
  function lev(a, b) { const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9; const d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
  function findApp(name) {
    const map = APPN(); name = name.replace(/\b(app|application|the|my)\b/g, "").replace(/\s+/g, " ").trim(); if (!name) return null;
    if (map[name]) return map[name];
    const keys = Object.keys(map).filter(Boolean);
    const sw = keys.find((k) => k.startsWith(name) && name.length >= 3) || keys.find((k) => name.length >= 4 && k.includes(name));
    if (sw) return map[sw];
    let best = null, bd = 3; keys.forEach((k) => { const d = lev(name, k); if (d < bd && k.length > 3) { bd = d; best = k; } });
    return best && bd <= (name.length > 6 ? 2 : 1) ? map[best] : null;
  }
  const title = (k) => N.APPS[k]?.title || (typeof appInfo !== "undefined" && appInfo[k]?.title) || cap(k);
  function contactFind(q) {
    q = q.toLowerCase().trim(); const l = store.get("nexus-contacts", []);
    return l.find((c) => c.name.toLowerCase() === q) || l.find((c) => c.name.toLowerCase().startsWith(q)) || l.find((c) => c.name.toLowerCase().split(/\s+/).some((w) => w === q)) || l.find((c) => lev(c.name.toLowerCase(), q) <= 1) || null;
  }
  const digits = (s) => s.replace(/[^\d+]/g, "");

  /* dates: today, tomorrow, monday, 25 oct, oct 25, 25/10 */
  const MON = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const WD = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  function parseDate(s) {
    const now = new Date(); let d = null, m;
    if (/\bday after tomorrow\b/.test(s)) { d = new Date(now); d.setDate(d.getDate() + 2); }
    else if (/\btomorrow\b|\bnaalai\b|\bnaale\b/.test(s)) { d = new Date(now); d.setDate(d.getDate() + 1); }
    else if (/\btoday\b|\btonight\b|\binniku\b/.test(s)) d = new Date(now);
    else if ((m = s.match(/\b(?:next\s+)?(sun|mon|tues?|wed(?:nes)?|thu(?:rs)?|fri|sat(?:ur)?)(?:day)?\b/))) { const idx = WD.findIndex((w) => w.startsWith(m[1].slice(0, 3))); d = new Date(now); let k = (idx - d.getDay() + 7) % 7; if (k === 0 || /next/.test(m[0])) k += k === 0 ? 7 : 0; d.setDate(d.getDate() + k); }
    else if ((m = s.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?([a-z]{3})[a-z]*\b/)) && MON.includes(m[2])) d = new Date(now.getFullYear(), MON.indexOf(m[2]), Number(m[1]));
    else if ((m = s.match(/\b([a-z]{3})[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/)) && MON.includes(m[1])) d = new Date(now.getFullYear(), MON.indexOf(m[1]), Number(m[2]));
    else if ((m = s.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/))) d = new Date(m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : now.getFullYear(), Number(m[2]) - 1, Number(m[1]));
    else if ((m = s.match(/\bon (?:the )?(\d{1,2})(?:st|nd|rd|th)?\b/))) d = new Date(now.getFullYear(), now.getMonth(), Number(m[1]));
    if (d && d < new Date(now.getFullYear(), now.getMonth(), now.getDate()) && !/\d{4}/.test(s)) d.setFullYear(d.getFullYear() + 1);
    return d;
  }
  function parseClock(s) {
    let m = s.match(/\b(?:at\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\b/) || s.match(/\bat\s+(\d{1,2})(?:[:.](\d{2}))?\b/) || s.match(/\b(\d{1,2})[:.](\d{2})\b/);
    if (!m) { if (/\bnoon\b/.test(s)) return "12:00"; if (/\bmorning\b/.test(s)) return "09:00"; if (/\bevening\b/.test(s)) return "18:00"; if (/\bnight|tonight\b/.test(s)) return "20:00"; if (/\bafternoon\b/.test(s)) return "15:00"; return ""; }
    let h = Number(m[1]); const mi = Number(m[2] || 0); const ap = (m[3] || "").replace(/\./g, "");
    if (ap === "pm" && h < 12) h += 12; if (ap === "am" && h === 12) h = 0;
    if (!ap && h < 7 && h > 0) h += 12;
    return h < 24 && mi < 60 ? pad(h) + ":" + pad(mi) : "";
  }
  const stripWhen = (s) => s.replace(/\b(on|at|for|this|next|by)\s*$/,"").replace(/\s+(?:on|at|this|next|by|for)?\s*(?:day after tomorrow|tomorrow|today|tonight|(?:next\s+)?(?:sun|mon|tues?|wed(?:nes)?|thu(?:rs)?|fri|sat(?:ur)?)(?:day)?|\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?[a-z]{3,9}|[a-z]{3,9}\s+\d{1,2}(?:st|nd|rd|th)?|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?|the \d{1,2}(?:st|nd|rd|th)?)\b/g, "").replace(/\s+(?:at\s+)?\d{1,2}(?:[:.]\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?(?=\s|$)/g, "").replace(/\s+(?:in the\s+)?(?:morning|evening|afternoon|night|noon)\b/g, "").replace(/\s+(on|at|for|by)$/,"").trim();
  const fmtDate = (d) => { const t = new Date(); const k = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(t.getFullYear(), t.getMonth(), t.getDate())) / 864e5); return k === 0 ? "today" : k === 1 ? "tomorrow" : d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" }); };
  const hm12 = (hm) => { if (!hm) return ""; const [h, m] = hm.split(":").map(Number); const d = new Date(); d.setHours(h, m); return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); };

  const COLORS = { blue: "#1e88ff", purple: "#7c5cff", violet: "#a855f7", teal: "#14b8a6", green: "#22c55e", yellow: "#f59e0b", gold: "#f59e0b", orange: "#f97316", red: "#ef4444", pink: "#ec4899", sky: "#0ea5e9", cyan: "#0ea5e9", white: "#e2e8f0" };

  /* ---------- normalise ---------- */
  function norm(q) {
    let s = " " + q.toLowerCase().replace(/[’']/g, "'").replace(/[?!。]+/g, " ").replace(/\s+/g, " ").trim() + " ";
    for (let i = 0; i < 3; i++) s = s
      .replace(/^ (?:hey|hi|hello|ok|okay|yo|oi|dei|da|bro|machi|nexus|nexus ai|assistant)[ ,]+/, " ")
      .replace(/^ (?:please|pls|plz|kindly|just|quickly|now|can you|could you|would you|will you|can u|could u|would you mind|i want you to|i want to|i wanna|i would like to|i'd like to|i need to|i need you to|help me|let's|lets|go ahead and|try to|i said)[ ,]+/, " ")
      .replace(/ (?:please|pls|plz|for me|right now|now|quickly|immediately|asap|thanks|thank you|da|bro|machi|nexus)[ ,.]*$/, " ");
    s = s.trim().replace(/\b(naalai|naale|nalaiku|naalaikku)\b/g, "tomorrow").replace(/\b(inniku|innaiku|indru)\b/g, "today").replace(/\b(\d{1,2}) ?(?:manikku|mani)\b/g, "at $1").replace(/\b(kaalai|kalaila|morning)\s+at (\d{1,2})\b/g, "at $2 am").replace(/\b(saayangalam|maalai|evening)\s+at (\d{1,2})\b/g, "at $2 pm")
      .replace(/\b(paattu|paatu|pattu|paadal)\b/g, "songs").replace(/\b(enaku|enakku|ennai|enna|mujhe)\s+/g, "").replace(/\s+(pannu|pannunga|panni vidu|karo|kar do)\b/g, "")
      .replace(/^(.+?)\s+(?:ezhuppi vidu|ezhuppu|ezhupu|ezhupi vidu|wake me up|wake me)$/, "wake me up $1").replace(/^(.+?)\s+(?:podu|pottu vidu|pottu|play pannu|play)$/, "play $1").replace(/^(.+?)\s+(?:thira|thirai|kholo)$/, "open $1").replace(/^(.+?)\s+(?:koopidu|kupidu|call pannu|ku call)$/, "call $1");
    return s.replace(/[.,]+$/, "").replace(/\s+/g, " ").trim();
  }

  /* ---------- the command table ---------- */
  const R = [];
  const on = (re, fn) => R.push([re, fn]);

  // help
  on(/^(?:what can you do|what (?:all )?can you control|help|commands|show (?:me )?commands|how do i (?:use|control) (?:you|nexus))$/, () => ({ text: `I can control Nexus OS for you. Try:\n- **Apps:** "open camera", "close this app", "go home"\n- **Music:** "play Anirudh songs", "pause", "next song", "play Radio Mirchi"\n- **Calls & texts:** "call Amma", "message Appa I'm coming"\n- **Planning:** "add maths homework to my tasks", "remind me to study at 7 pm", "add science exam on Friday at 10 am", "what's my plan today"\n- **Notes:** "take a note buy pens"\n- **Clock:** "set alarm 6:30 am", "timer 10 minutes", "start stopwatch"\n- **Look:** "change wallpaper to galaxy", "make the accent red", "light mode"\n- **Tools:** "turn on torch", "battery level", "lock Nexus", "find pharmacy near me", "navigate to Tiruppur bus stand"\n- **Make:** "draw a robot on Mars", "search YouTube for Chandrayaan"` }));

  // go home / close / back
  on(/^(?:go (?:back )?(?:to )?(?:the )?home(?: ?screen)?|home|home ?screen|close (?:this|the|current|all|every)?\s*(?:app|apps|window|windows|everything)?|exit(?: app)?|minimi[sz]e(?: app)?)$/, () => { later(() => window.closeWindow?.()); return { text: "🏠 Going to the home screen." }; });

  on(/^(?:close|exit|quit|kill|shut)\s+(?:the\s+|my\s+)?(.+?)(?:\s+app)?$/, (m) => { const k = findApp(m[1]); if (!k) return null; if (k === "music") { N.music?.stop(); return { text: "⏹️ Music stopped." }; } if (k === "radio") { N.radio?.stop(); return { text: "📻 Radio stopped." }; } later(() => window.closeWindow?.()); return { text: `Closed **${esc(title(k))}**.` }; });

  // torch
  on(/^(?:(?:turn|switch|put)\s+(on|off)\s+(?:the\s+)?(?:torch|flash ?light|flash)|(?:turn|switch|put)\s+(?:the\s+)?(?:torch|flash ?light|flash)\s+(on|off)|(?:torch|flash ?light|flash)\s*(on|off)?|(on|off)\s+(?:the\s+)?(?:torch|flash ?light))$/, async (m) => {
    const want = (m[1] || m[2] || m[3] || m[4] || (N.torchOn?.() ? "off" : "on")) === "on";
    if (!N.torch) return { text: "The torch isn't ready yet." };
    try { await N.torch(want); return { text: want ? "🔦 Torch is **on**. Say \"turn off torch\" to stop." : "🔦 Torch is **off**." }; }
    catch (_) { return { text: "I couldn't control the torch here. Allow the camera for this site, or use the torch in your phone's quick settings." }; }
  });
  on(/^(?:(?:turn|switch)\s+(on|off)\s+(?:the\s+)?siren|(?:start|play|sound)\s+(?:the\s+)?(?:siren|alarm sound)|stop\s+(?:the\s+)?siren)$/, (m) => { const want = !/off|stop/.test(m[0]); N.siren?.(want); return { text: want ? "🚨 Siren on. Say \"stop siren\" to stop." : "Siren off." }; });
  on(/^(?:sos|help me|i need help|emergency|call (?:the )?(?:police|ambulance|emergency)|i'm in danger|im in danger)$/, (m) => { if (/police/.test(m[0])) { location.href = "tel:100"; return { text: "📞 Calling police (100)…" }; } if (/ambulance/.test(m[0])) { location.href = "tel:108"; return { text: "📞 Calling ambulance (108)…" }; } later(() => window.openApp("sos")); return { text: "🆘 Opening **Emergency SOS**. Hold the red button to call 112." }; });

  // music controls
  on(/^(?:pause|stop)(?: the| my)?(?: music| song| songs| audio| playing| player)?$|^(?:music|song) (?:pause|stop|off)$/, () => { N.music?.pause(); N.radio?.stop(); return { text: "⏸️ Paused." }; });
  on(/^(?:resume|continue|unpause|play again|keep playing)(?: the)?(?: music| song)?$/, () => { if (!N.music?.current()) return { text: "Nothing to resume — try \"play Tamil hits\"." }; N.music.resume(); return { text: "▶️ Resuming." }; });
  on(/^(?:next|skip)(?: the)?(?: song| track| one)?$|^(?:play )?(?:the )?next (?:song|track)$|^change (?:the )?song$/, () => { if (!N.music?.current()) return { text: "Nothing is playing right now." }; N.music.next(); return { text: "⏭️ Next song." }; });
  on(/^(?:previous|prev|go back to the last|last|back)(?: song| track)$|^play (?:the )?previous(?: song| track)?$/, () => { N.music?.prev(); return { text: "⏮️ Previous song." }; });
  on(/^(?:what(?:'s| is) (?:this song|playing|the song)|which song is (?:this|playing)|song name)$/, () => { const t = N.music?.current(); return { text: t ? `🎵 **${esc(t.title)}** by ${esc(t.artist)}.` : "Nothing is playing in Music right now." }; });

  // games (before "play X")
  on(/^(?:play|start|open)\s+(?:a\s+)?(?:game|games|tic ?tac ?toe|tic-tac-toe|memory(?: match| game)?|x ?o|x and o)$/, (m) => { const g = /tic|x ?o|x and o/.test(m[0]) ? "ttt" : /memory/.test(m[0]) ? "memory" : ""; inApp("games", (w) => g && w.querySelector(`[data-game="${g}"]`)?.click()); return { text: g ? `🎮 Starting **${g === "ttt" ? "Tic-Tac-Toe" : "Memory Match"}**. Good luck!` : "🎮 Opening **Games**." }; });

  // radio
  on(/^(?:play|start|tune (?:in )?to|put on|open)\s+(?:the\s+)?(.*?)\s*(?:fm|radio)(?: station)?$|^(?:play|tune to)\s+(?:the\s+)?(?:radio|fm)\s+(.+)$/, async (m) => {
    const q = (m[1] || m[2] || "").replace(/\b(some|a|the|station|channel)\b/g, "").trim();
    try { const s = await N.radio?.play(q && !/^(any|some)$/.test(q) ? q : ""); if (!s) return { text: `I couldn't find a station called "${esc(q)}".`, action: ["Open FM Radio", "radio"] }; return { text: `📻 Playing **${esc(s.name)}**.`, action: ["Open FM Radio", "radio"] }; }
    catch (_) { return { text: "The radio directory isn't answering right now. Try again in a minute.", action: ["Open FM Radio", "radio"] }; }
  });

  // YouTube
  on(/^(?:search|find|look up|look for|show(?: me)?|play|watch|put on)\s+(?:for\s+)?(.+?)\s+(?:on|in|from)\s+(?:youtube|yt|you tube)$|^(?:youtube|yt)\s+(?:search\s+(?:for\s+)?)?(.+)$|^(?:search|open)\s+youtube\s+(?:and search\s+)?(?:for\s+)?(.+)$|^watch\s+(.+)$/, (m) => {
    const q = (m[1] || m[2] || m[3] || m[4]).trim(); inApp("youtube", (w) => fill(w, "[data-yt-form]", q)); return { text: `▶️ Searching YouTube for **${esc(q)}**.` };
  });

  // music: play X
  on(/^(?:play|put on|start playing|listen to|i want to listen to|play me)\s+(.+)$/, async (m) => {
    let q = m[1].replace(/\b(some|a|any|the|me|my|few|good)\b/g, " ").replace(/\b(songs?|music|tracks?|hits?)\b(?=\s*$)/, (x) => (/hits?/.test(x) ? "hits" : "")).replace(/\b(in|on) (the )?music( app)?$/, "").replace(/\s+/g, " ").trim();
    if (!q || /^(songs?|music|a song|something|anything)$/.test(q)) { if (N.music?.current()) { N.music.resume(); return { text: "▶️ Playing your music." }; } q = "tamil hits"; }
    const lang = q.match(/^(tamil|hindi|english|telugu|malayalam|kannada|punjabi)$/); if (lang) q = lang[1] + " hits";
    try { const t = await N.music?.play(q); if (t) return { text: `🎵 Playing **${esc(t.title)}** by ${esc(t.artist)}${N.music.isFull?.() ? " — the full song." : " (preview)."}`, action: ["Open Music", "music"] }; } catch (_) {}
    return { text: `I couldn't find songs for "${esc(q)}".`, action: ["Open Music", "music"] };
  });

  // call
  on(/^(?:call|phone|dial|ring|make a call to|give a call to|call up)\s+(.+?)(?:\s+(?:on|using)\s+(?:the\s+)?phone)?$/, (m) => {
    const who = m[1].replace(/^(to|my)\s+/, "").trim();
    if (/^[\d\s+()-]{3,}$/.test(who)) { location.href = "tel:" + digits(who); return { text: `📞 Calling **${esc(who)}**…` }; }
    const c = contactFind(who);
    if (!c || !c.phone) return { text: `I couldn't find **${esc(who)}** in your contacts. Add them in the Phone app first.`, action: ["Open Phone", "call"] };
    const log = store.get("nexus-call-log", []); log.unshift({ id: uid(), name: c.name, phone: c.phone, at: Date.now(), dir: "out" }); store.set("nexus-call-log", log.slice(0, 200));
    location.href = "tel:" + digits(c.phone); return { text: `📞 Calling **${esc(c.name)}** (${esc(c.phone)})…` };
  });

  // messages / whatsapp
  on(/^(?:send\s+(?:a\s+)?(?:message|msg|text|sms|whatsapp)\s+to|message|msg|text|sms|whatsapp|tell)\s+(.+?)(?:\s+(?:saying|that|says|to say|:|-)\s+|\s*,\s*)(.+)$|^(?:send\s+(?:a\s+)?(?:message|msg|text|sms|whatsapp)\s+to|message|text|sms|whatsapp)\s+(\S+)$/, (m) => {
    const wa = /whatsapp/.test(m[0]); const who = (m[1] || m[3]).trim(); const body = (m[2] || "").trim(); if (/^(me|us|him|her|them|about)$/.test(who) || (/^tell/.test(m[0]) && !contactFind(who))) return null;
    const c = /^[\d\s+()-]{3,}$/.test(who) ? { name: who, phone: who } : contactFind(who);
    if (!c?.phone) return { text: `I couldn't find **${esc(who)}** in your contacts.`, action: ["Open Phone", "call"] };
    if (wa) { const n = digits(c.phone).replace(/^0/, ""); window.open(`https://wa.me/${n.length === 10 ? "91" + n : n.replace(/^\+/, "")}?text=${encodeURIComponent(body)}`, "_blank"); return { text: `💬 Opening WhatsApp to **${esc(c.name)}**.` }; }
    const th = store.get("nexus-threads", {}); const key = c.id ? "c:" + c.id : "n:" + digits(c.phone);
    if (body) { (th[key] = Array.isArray(th[key]) ? th[key] : []).push({ id: uid(), text: body, at: Date.now(), me: true, sms: true }); store.set("nexus-threads", th); }
    location.href = `sms:${digits(c.phone)}?body=${encodeURIComponent(body)}`;
    return { text: body ? `💬 Sending "${esc(body)}" to **${esc(c.name)}** — tap Send in your SMS app.` : `💬 Opening a message to **${esc(c.name)}**.` };
  });

  on(/^(?:message|msg|text|sms|whatsapp)\s+(\S+(?:\s+\S+)?)\s+(.+)$/, (m) => {
    const w = m[1].split(" "); let c = contactFind(m[1]), body = m[2];
    if (!c && w.length > 1) { c = contactFind(w[0]); body = w[1] + " " + m[2]; }
    if (!c?.phone) return null;
    return runOne(`${/whatsapp/.test(m[0]) ? "whatsapp" : "message"} ${c.name.toLowerCase()} saying ${body}`);
  });

  // notes
  on(/^(?:take|make|write|add|create|save|jot down)\s+(?:a\s+|new\s+)?note(?:\s+(?:that|saying|about|of|to|:)|\s*:)?\s+(.+)$|^note(?: down)?\s*:?\s+(.+)$|^(?:remember|remember that)\s+(.+)$/, (m) => {
    const body = (m[1] || m[2] || m[3]).trim(); const l = store.get("nexus-notes-v2", []);
    l.push({ id: uid(), title: cap(body.split(/\s+/).slice(0, 5).join(" ")), body: cap(body), color: "", pin: false, at: Date.now() }); store.set("nexus-notes-v2", l);
    return { text: `📝 Saved a note: "${esc(cap(body))}".`, action: ["Open Notes", "notes"] };
  });
  on(/^(?:take|make|write|create|new)\s+(?:a\s+)?note$/, () => { inApp("notes", (w) => w.querySelector("[data-nt-fab]")?.click()); return { text: "📝 Opening a new note." }; });

  // tasks
  on(/^(?:add|create|new|make)\s+(?:a\s+)?(?:task|todo|to-do|to do)\s*(?:to\s+|:|called|named)?\s*(.+)$|^add\s+(.+?)\s+to\s+(?:my\s+)?(?:tasks?|to-?do(?: list)?|to do(?: list)?|list|task list)$/, (m) => {
    let t = (m[1] || m[2]).trim(); const d = parseDate(t); if (d) t = stripWhen(t);
    const l = store.get("nexus-tasks", []); l.unshift({ id: uid(), text: cap(t), done: false, due: d ? ymd(d) : "", prio: /\b(important|urgent)\b/.test(m[0]) ? "high" : "" }); store.set("nexus-tasks", l);
    return { text: `✅ Added **${esc(cap(t))}** to your tasks${d ? `, due ${fmtDate(d)}` : ""}.`, action: ["Open Tasks", "tasks"] };
  });
  on(/^(?:show|what are|list|read)(?: me)?\s+(?:my\s+)?(?:tasks|to-?dos?|to do list|pending tasks)(?: for today)?$|^what do i have to do$/, () => {
    const l = store.get("nexus-tasks", []).filter((x) => !x.done);
    return { text: l.length ? `You have **${l.length}** task${l.length > 1 ? "s" : ""} left:\n${l.slice(0, 8).map((x) => "- " + esc(x.text) + (x.due ? ` (${x.due})` : "")).join("\n")}` : "🎉 No pending tasks!", action: ["Open Tasks", "tasks"] };
  });
  on(/^(?:mark|tick|complete|finish|i (?:have )?(?:finished|completed|did|done))\s+(.+?)(?:\s+(?:as\s+)?(?:done|complete|completed|finished))?$/, (m) => {
    const q = m[1].replace(/^(the|my)\s+|\s+task$/g, "").toLowerCase(); const l = store.get("nexus-tasks", []); const t = l.find((x) => !x.done && x.text.toLowerCase().includes(q));
    if (!t) return null; t.done = true; store.set("nexus-tasks", l); return { text: `✅ Marked **${esc(t.text)}** as done. Nice work!` };
  });

  // events / plans
  on(/^(?:add|create|schedule|put|set|save|book)\s+(?:an?\s+)?(?:event|meeting|appointment|plan|class|exam|test|birthday|party|match)?\s*(?:called|named|for|:)?\s*(.+?)\s+(?:on|at|for|this|next|tomorrow|today|tonight|day after)\b(.*)$|^(?:add|put)\s+(.+?)\s+(?:to|in|on)\s+(?:my\s+)?(?:calendar|planner|schedule|plan)(.*)$/, (m) => {
    const raw = m[0]; let what = (m[1] || m[3]).trim(); const rest = (m[2] || m[4] || "") + " " + raw;
    if (/\b(task|todo|to-do|note|alarm|reminder|timer|wallpaper|accent|colou?r|mode)\b/.test(what)) return null;
    const d = parseDate(rest) || (/\btoday|tonight\b/.test(rest) ? new Date() : null); const tm = parseClock(rest.replace(/\d{1,2}[/-]\d{1,2}/, ""));
    if (!d && !tm) return null;
    const date = d || new Date(); what = stripWhen(what.replace(/\b(an?|the)\s+(event|meeting)\b/, "").trim()) || what;
    const kind = raw.match(/\b(exam|test|class|birthday|party|match|meeting|appointment)\b/); if (kind && !what.toLowerCase().includes(kind[1])) what = /^(with|for|at|about|of)\b/.test(what) ? kind[1] + " " + what : what + " " + kind[1];
    const l = store.get("nexus-events", []); l.push({ id: uid(), title: cap(what), date: ymd(date), time: tm, note: "", color: "#1e88ff" }); store.set("nexus-events", l);
    return { text: `📅 Added **${esc(cap(what))}** to your calendar for ${fmtDate(date)}${tm ? " at " + hm12(tm) : ""}.`, action: ["Open Calendar", "calendar"] };
  });
  on(/^(?:what(?:'s| is| do i have)|show|tell me|read)\s+(?:on\s+)?(?:me\s+)?(?:my\s+)?(?:plan|plans|schedule|agenda|events|timetable|day)?\s*(?:for\s+|on\s+)?(today|tomorrow|this week)?(?:'s)?\s*(?:plan|schedule|agenda|events)?$|^(?:my|today'?s?|tomorrow'?s?) (?:plan|schedule|agenda)$/, (m) => {
    if (!/plan|schedule|agenda|events|timetable|today|tomorrow|day/.test(m[0]) || /^show (?:me )?(?:my )?day$/.test(m[0])) return null;
    const tomorrow = /tomorrow/.test(m[0]); const d = new Date(); if (tomorrow) d.setDate(d.getDate() + 1); const k = ymd(d);
    const items = [];
    store.get("nexus-plan", []).filter((x) => x.date === k).forEach((x) => items.push([x.start || "", x.title + (x.done ? " ✓" : "")]));
    store.get("nexus-events", []).filter((x) => x.date === k).forEach((x) => items.push([x.time || "", x.title]));
    store.get("nexus-reminders-v2", []).filter((x) => !x.done && ymd(new Date(x.time)) === k).forEach((x) => { const t = new Date(x.time); items.push([pad(t.getHours()) + ":" + pad(t.getMinutes()), "🔔 " + x.text]); });
    items.sort((a, b) => (a[0] || "99").localeCompare(b[0] || "99"));
    return { text: items.length ? `Here's ${tomorrow ? "tomorrow" : "today"}:\n${items.map(([t, x]) => `- ${t ? "**" + hm12(t) + "** " : ""}${esc(x)}`).join("\n")}` : `Nothing planned for ${tomorrow ? "tomorrow" : "today"} yet. Say "add study maths tomorrow at 5 pm".`, action: ["Open Day Planner", "planner"] };
  });

  // clock: timer / stopwatch / alarms off
  on(/^(?:set|start|put)?\s*(?:a\s+)?timer\s+(?:for\s+)?(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)$|^(?:set|start)\s+(?:a\s+)?(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs|second|seconds)\s+timer$|^(?:count down|countdown)\s+(\d+)\s*(min|minutes|sec|seconds)$/, (m) => {
    const n = Number(m[1] || m[3] || m[5]), u = m[2] || m[4] || m[6]; const ms = n * (/^h/.test(u) ? 3600e3 : /^s/.test(u) ? 1e3 : 60e3);
    if (!N.clock) return null; N.clock.startTimer(ms); later(() => window.openApp("timer"));
    return { text: `⏱️ Timer started for **${n} ${u.startsWith("h") ? "hour" : u.startsWith("s") ? "second" : "minute"}${n === 1 ? "" : "s"}**. It rings while Nexus is open.` };
  });
  on(/^(?:stop|cancel)\s+(?:the\s+)?timer$/, () => { N.clock?.stopTimer(); return { text: "⏱️ Timer stopped." }; });
  on(/^(?:start|begin|open)\s+(?:the\s+|a\s+)?stop ?watch$|^stop ?watch(?: start)?$/, () => { N.clock?.stopwatch(true); later(() => window.openApp("clock")); setTimeout(() => document.querySelector('#app-layer .nx-clock [data-nx-nav="sw"]')?.click(), 1300); return { text: "⏱️ Stopwatch started." }; });
  on(/^(?:stop|pause)\s+(?:the\s+)?stop ?watch$/, () => { const ms = N.clock?.stopwatch(false) || 0; return { text: `⏱️ Stopwatch stopped at **${Math.floor(ms / 60000)}:${pad(Math.floor(ms / 1000) % 60)}**.` }; });
  on(/^(?:turn off|cancel|delete|remove|disable|clear)\s+(?:all\s+)?(?:my\s+)?(?:the\s+)?alarms?$/, (m) => { const l = store.get("nexus-alarms", []); l.forEach((a) => (a.on = false)); store.set("nexus-alarms", l); return { text: `⏰ Turned off ${l.length} alarm${l.length === 1 ? "" : "s"}.` }; });
  on(/^(?:show|what are|list)\s+(?:my\s+)?alarms$/, () => { const l = store.get("nexus-alarms", []).filter((a) => a.on); return { text: l.length ? "Your alarms:\n" + l.map((a) => `- **${hm12(pad(a.h) + ":" + pad(a.m))}** ${esc(a.label || "")}`).join("\n") : "No alarms are on.", action: ["Open Clock", "clock"] }; });

  // look & feel
  on(/^(?:turn on|switch to|enable|change to|go|use|set)?\s*(dark|light|night|day)\s*(?:mode|theme)?(?:\s+on)?$|^(?:turn off|disable)\s+(dark|light)\s*mode$/, (m) => {
    if (!N.theme) return null; let light = /light|day/.test(m[1] || ""); if (m[2]) light = m[2] === "dark"; N.theme.setMode(light); return { text: light ? "☀️ Switched the home screen to **light mode**." : "🌙 Switched to **dark mode**." };
  });
  on(/^(?:change|set|switch|update|put|turn|make)\s+(?:the\s+|my\s+)?(?:wall ?paper|background|home ?screen(?: background)?)(?:\s+(?:to|as|into)\s+(.+))?$|^(?:use|apply)\s+(.+?)\s+wall ?paper$|^(?:next|another|new|random)\s+wall ?paper$/, (m) => {
    if (!N.theme) return null; const q = (m[1] || m[2] || "").replace(/\s*wall ?paper\s*/, "").trim(); const W = N.theme.walls;
    if (/my (?:own )?photo|my picture|from gallery|custom/.test(q)) { inApp("themes"); return { text: "🖼️ Opening Themes — tap “Your photo” to pick a picture." }; }
    let w = q ? W.find(([k, n]) => n.toLowerCase().includes(q) || k.includes(q.split(" ")[0])) : null;
    if (!w) { if (q) return { text: `I don't have a "${esc(q)}" wallpaper. Choose from: ${W.map((x) => x[1]).join(", ")}.`, action: ["Open Themes", "themes"] }; const cur = N.theme.current().wall; const i = W.findIndex((x) => x[0] === cur); w = W[(i + 1) % W.length]; }
    N.theme.setWall(w[0]); return { text: `🖼️ Wallpaper changed to **${w[1]}**.`, action: ["Open Themes", "themes"] };
  });
  on(/^(?:change|set|make|switch|turn)\s+(?:the\s+|my\s+)?(?:accent|theme|ui|app|nexus|os|system|highlight)?\s*(?:colou?r|color)?\s*(?:to|into|as)?\s*(blue|purple|violet|teal|green|yellow|gold|orange|red|pink|sky|cyan|white)(?:\s+colou?r)?$|^(blue|purple|violet|teal|green|yellow|gold|orange|red|pink|sky|cyan)\s+(?:accent|theme|colou?r)$/, (m) => {
    const c = m[1] || m[2]; if (!N.theme) return null; N.theme.setAccent(COLORS[c]); return { text: `🎨 Accent colour changed to **${c}**.`, action: ["Open Themes", "themes"] };
  });
  on(/^(?:change|set|make)\s+(?:the\s+)?(?:app\s+)?icons?(?:\s+shape)?\s+(?:to\s+|into\s+)?(rounded|round|circle|circles|circular|squircle|square|squares)$/, (m) => { const k = /circ|round$/.test(m[1]) && !/rounded/.test(m[1]) ? "circle" : /squircle/.test(m[1]) ? "squircle" : /square/.test(m[1]) ? "square" : "rounded"; N.theme?.setShape(k); return { text: `Icons are now **${k}**.` }; });

  // device info & limits
  on(/^(?:what(?:'s| is)\s+(?:my\s+|the\s+)?)?(?:battery|charge|charging)(?:\s+(?:level|percentage|percent|status))?(?:\s+(?:left|now))?$|^how much (?:battery|charge)(?: is left| do i have)?$/, async () => {
    try { const b = await navigator.getBattery(); return { text: `🔋 Battery is at **${Math.round(b.level * 100)}%**${b.charging ? " and charging ⚡" : ""}.` }; } catch (_) { return { text: "This browser doesn't share the battery level." }; }
  });
  on(/^(?:turn|switch|put)?\s*(?:on|off)?\s*(?:the\s+)?(wi-?fi|bluetooth|mobile data|data|hotspot|airplane mode|flight mode|aeroplane mode|location|gps|brightness|volume|dnd|do not disturb)\s*(?:on|off|up|down|to\s+\d+%?)?$|^(?:increase|decrease|raise|lower|reduce|turn up|turn down|set)\s+(?:the\s+)?(brightness|volume)(?:\s+to\s+\d+%?)?$/, (m) => {
    const x = (m[1] || m[2]).replace("wifi", "Wi-Fi"); return { text: `I can't change your phone's **${x}** — websites aren't allowed to, to keep your phone safe. Swipe down from the top of your phone to use quick settings.` };
  });
  on(/^(?:lock|lock up)\s*(?:the\s+)?(?:phone|nexus|nexus os|screen|os|device|it|apps?)?$/, () => {
    if (!store.get("nexus-pin", null)) return { text: "🔒 You haven't set a PIN yet. Open Security and tap “Set up app lock”.", action: ["Open Security", "security"] };
    later(() => N.lockNow?.()); return { text: "🔒 Locking Nexus…" };
  });
  on(/^(?:take|capture|grab)\s+(?:a\s+)?screen ?shot$/, () => ({ text: "Websites can't take screenshots. Press **Power + Volume down** together on your phone." }));
  on(/^(?:call me|my name is|change my name to|set my name to)\s+([a-z][a-z.'-]{1,15}(?: [a-z][a-z.'-]{1,15})?)$/, (m) => { if (/^(fine|good|ok|okay|bored|hungry|tired|sad|happy|back|here)$/.test(m[1])) return null; const n = m[1].split(" ").map(cap).join(" "); store.set("nexus-username", n); return { text: `Nice to meet you, **${esc(n)}**! 😊 I'll call you that from now on.` }; });

  // camera / recorder / paint / generator
  on(/^(?:take|click|capture|snap|shoot)\s+(?:a\s+|my\s+)?(photo|picture|pic|selfie|snap|video)$|^(?:open\s+)?(?:selfie|front)\s+camera$/, (m) => { inApp("camera"); return { text: m[1] === "video" ? "🎥 Opening the camera — switch to Video and tap record." : "📸 Opening the camera — tap the shutter button." }; });
  on(/^(?:record|start recording)\s*(?:my\s+|a\s+)?(?:voice|audio|sound|voice note|voice memo|memo)?$/, () => { inApp("recorder", async (w) => { await new Promise((r) => setTimeout(r, 300)); w.querySelector("[data-rc-go]")?.click(); }); return { text: "🎙️ Starting a voice recording. Tap the red button to stop." }; });
  on(/^(?:make|create|generate)\s+(?:a\s+|an\s+)?(?:ai\s+)?video\s+(?:of|about|showing|with)?\s*(.+)$/, (m) => { inApp("generator", async (w) => { w.querySelector('[data-nx-tab="vid"]')?.click(); await new Promise((r) => setTimeout(r, 200)); const ta = w.querySelector("[data-gn-form] textarea"); if (ta) { ta.value = m[1]; ta.dispatchEvent(new Event("input", { bubbles: true })); } }); return { text: `🎬 Opening the Video Generator with “${esc(m[1])}” — tap Generate.` }; });

  // maps & places
  on(/^(?:navigate|directions?|take me|guide me|route|show (?:me )?(?:the )?(?:way|route)|how (?:do i|to|can i) (?:go|get|reach))\s+(?:to\s+|for\s+)?(.+)$/, (m) => { const q = m[1].trim(); window.open("https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(q), "_blank"); return { text: `🧭 Opening directions to **${esc(q)}** in Google Maps.` }; });
  on(/^(?:find|show|search|where(?: is| are)?(?: the)?|nearest|any)\s+(?:me\s+)?(?:the\s+|a\s+|an\s+|some\s+)?(?:nearest\s+|nearby\s+|closest\s+)?(pharmac(?:y|ies)|medical(?: shops?)?|medicals?|hospitals?|clinics?|atms?|banks?|bakery|bakeries|grocery|groceries|supermarkets?|restaurants?|hotels?|food|cafes?|tea shops?|petrol(?: bunks?| pumps?)?|fuel|stationery|clothes(?: shops?)?|textiles?|mobile shops?|shops?)(?:\s+(?:near|around|close to)\s+(?:me|here|us))?(?:\s+nearby)?$/, (m) => {
    const w = m[1]; const cat = /pharm|medical/.test(w) ? "pharmacy" : /hospital|clinic/.test(w) ? "" : /atm|bank/.test(w) ? "atm" : /bake/.test(w) ? "bakery" : /grocer|super/.test(w) ? "grocery" : /restaur|hotel|food|cafe|tea/.test(w) ? "food" : /stationer/.test(w) ? "stationery" : /cloth|textile/.test(w) ? "clothes" : /mobile/.test(w) ? "mobiles" : "";
    if (cat) { inApp("shop", (x) => x.querySelector(`[data-sf="${cat}"]`)?.click()); return { text: `🛍️ Finding **${cat === "food" ? "places to eat" : cat}** near you.` }; }
    const q = /petrol|fuel/.test(w) ? "petrol bunk" : /hospital|clinic/.test(w) ? "hospital" : w; inApp("maps", (x) => fill(x, "[data-mp-form]", q)); return { text: `📍 Searching the map for **${esc(q)}**.` };
  });
  on(/^(?:show|find|search|locate|where is|open)\s+(.+?)\s+(?:on|in)\s+(?:the\s+)?(?:map|maps|google maps)$|^(?:where is|where's|locate)\s+(.+)$/, (m) => { const q = (m[1] || m[2]).trim(); if (/^(my|the) (phone|music|file)/.test(q)) return null; inApp("maps", (x) => fill(x, "[data-mp-form]", q)); return { text: `📍 Showing **${esc(q)}** on the map.` }; });

  // books / news / cleaner / settings pages
  on(/^(?:read|find|search(?: for)?|open|get)\s+(?:the\s+|a\s+)?(?:book|novel|story book|ebook)s?\s+(?:called|named|about|on|by)?\s*(.+)$|^(?:i want to read|read)\s+(.+?)\s+book$/, (m) => { const q = (m[1] || m[2]).trim(); inApp("books", (x) => fill(x, "[data-bk-form]", q)); return { text: `📚 Looking for books: **${esc(q)}**.` }; });
  on(/^(?:show|read|tell me|give me|what(?:'s| is)(?: the)?|open)\s*(?:me\s+)?(?:the\s+)?(?:latest\s+|today'?s\s+|top\s+)?(?:news|headlines)(?: today)?$|^what'?s happening(?: in the world| today)?$/, () => { inApp("news"); return { text: "📰 Opening today's headlines." }; });
  on(/^(?:clean|clear|free up|boost)\s*(?:the\s+|my\s+)?(?:phone|storage|space|cache|junk|memory|ram|nexus)?(?:\s+space)?$/, () => { inApp("cleaner"); return { text: "🧹 Opening **Cleaner** — tap Clean to free up space." }; });

  // open a website
  on(/^(?:open|go to|visit|launch)\s+((?:https?:\/\/)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/\S*)?)$/, (m) => { N.openUrl(/^https?:/.test(m[1]) ? m[1] : "https://" + m[1]); return { text: `🌐 Opening **${esc(m[1])}**…` }; });
  // web search
  on(/^(?:search|google|search the web|look up|search online)(?:\s+for)?\s+(.+)$/, (m) => { N.openUrl("https://www.google.com/search?igu=1&q=" + encodeURIComponent(m[1])); return { text: `🔎 Searching the web for **${esc(m[1])}**.` }; });

  // open app (generic, last)
  on(/^(?:open|launch|start|run|show(?: me)?|go to|switch to|take me to|bring up|load|enter|use)\s+(?:the\s+|my\s+)?(.+?)(?:\s+(?:app|application|page|screen|section))?$|^(.+?)\s+(?:open|kholo|thira|open pannu|open karo)$/, (m) => {
    const raw = (m[1] || m[2]).trim(); const k = findApp(raw);
    if (!k || /^(whatsapp|instagram|insta|spotify|gmail|telegram|chatgpt|netflix|amazon|flipkart|swiggy|zomato|phonepe|google pay|gpay|duolingo|canva|classroom|google classroom|jiosaavn|google drive|drive|wikipedia|snapseed|khan academy|sololearn)$/.test(raw)) {
      const alias = { insta: "instagram", gpay: "google pay", drive: "google drive", classroom: "google classroom" }; const a = N.androidApp?.(alias[raw] || raw);
      if (a) { setTimeout(() => a.open(), 400); return { text: `📱 Opening **${a.name}**…` }; }
      if (!k) return null;
    }
    if (k === "ai") return { text: "You're already talking to me 😊" };
    later(() => window.openApp(k)); return { text: `Opening **${esc(title(k))}**…` };
  });
  on(/^(camera|music|youtube|settings|gallery|files|calculator|calendar|clock|maps|notes|tasks|weather|browser|radio|news|games|books|phone|messages|store|themes|terminal)$/, (m) => { const k = findApp(m[1]); if (!k) return null; later(() => window.openApp(k)); return { text: `Opening **${esc(title(k))}**…` }; });

  /* ---------- runner ---------- */
  async function runOne(s) { for (const [re, fn] of R) { const m = s.match(re); if (m) { const r = await fn(m); if (r) return r; } } return null; }
  async function command(q) {
    const s = norm(q); if (!s) return null;
    let r = await runOne(s); if (r) return r;
    const parts = s.split(/\s*(?:,\s*and then|,\s*then|\band then\b|\bthen\b|\band also\b|\band\b|;)\s*/).map(norm).filter(Boolean);
    if (parts.length > 1 && parts.length <= 4) {
      const out = []; let act = null;
      for (let i = 0; i < parts.length; i++) {
        let p = parts[i]; if (i > 0 && /^(it|that)$/.test(p)) continue;
        const one = await runOne(p); if (!one) return null; out.push(one.text); if (one.action) act = one.action;
        if (i < parts.length - 1) await wait(900);
      }
      return { text: out.join("\n"), action: act };
    }
    return null;
  }
  N.aiCmd = command; N.aiNorm = norm;
  N.aiCmdHelp = `open <app> · close app · go home · play <song/artist> · pause · resume · next song · previous song · play <station> radio · search youtube for <x> · call <contact or number> · message <contact> saying <text> · whatsapp <contact> saying <text> · take a note <text> · add task <text> [today/tomorrow] · add <event> on <date> at <time> · what's my plan today/tomorrow · remind me to <x> at <time> · set alarm <time> · turn off alarms · timer <n> minutes · start stopwatch · turn on torch · turn off torch · siren on · change wallpaper to <aurora/sunset/galaxy/ocean/forest/midnight/rose gold> · change accent to <colour> · light mode · dark mode · battery level · lock nexus · take a photo · record voice · find <pharmacy/atm/food/grocery/bakery> near me · navigate to <place> · show <place> on map · read book <name> · show news · weather in <city> · draw <image idea> · make a video of <idea> · open <website.com> · search <query>`;
})();
