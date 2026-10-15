/* ==========================================================================
   Nexus OS — Batch 1 apps (v40)
   YouTube · Files · Terminal · Browser · Calculator · Reminder · Weather · Settings
   Loaded after app.js. It replaces openApp() for these 8 apps only; every other
   app keeps using the original window from app.js.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (_) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { return false; } }
  };
  const API_BASE = (typeof NEXUS_API_BASE !== "undefined" && NEXUS_API_BASE) || "https://nexus-os-api-qffq.onrender.com";
  const userName = () => (store.get("nexus-username", "Ramesh") || "Ramesh").trim() || "Ramesh";
  const fmtBytes = (n) => {
    if (!Number.isFinite(n) || n <= 0) return "0 B";
    const u = ["B", "KB", "MB", "GB", "TB"]; let i = 0;
    while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
    return (n >= 100 || i === 0 ? Math.round(n) : n.toFixed(1)) + " " + u[i];
  };
  const timeStr = (d) => new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  /* Icon set (stroke icons, 24×24) */
  const I = {
    back: '<path d="m15 18-6-6 6-6"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    dots: '<circle cx="12" cy="5" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="12" cy="19" r="1.2"/>',
    more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5Z"/>',
    file: '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',
    video: '<rect x="2" y="6" width="14" height="12" rx="2.5"/><path d="m22 8-6 4 6 4Z"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    package: '<path d="m12 2 9 5v10l-9 5-9-5V7Z"/><path d="m3 7 9 5 9-5M12 12v10"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4L21 8"/><path d="M21 3v5h-5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    arrowL: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
    arrowR: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2.5"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    wifi: '<path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><path d="M2 9a15 15 0 0 1 20 0"/><path d="M12 19.5h.01"/>',
    bluetooth: '<path d="m7 7 10 10-5 5V2l5 5L7 17"/>',
    signal: '<path d="M4 20v-3M9 20v-7M14 20V9M19 20V4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10Z"/>',
    volume: '<path d="M11 5 6 9H2v6h4l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    battery: '<rect x="2" y="7" width="17" height="10" rx="2"/><path d="M22 11v2M6 10v4M10 10v4"/>',
    drive: '<path d="M22 12H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6Z"/><path d="M6 16h.01M10 16h.01"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    convert: '<path d="M7 7h13l-3-3M17 17H4l3 3"/>',
    chart: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>',
    calc: '<rect x="4" y="2" width="16" height="20" rx="2.5"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/>',
    wind: '<path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h16a3 3 0 1 1-3 3"/><path d="M3 16h7"/>',
    droplet: '<path d="M12 2.7 6.3 8.4a8 8 0 1 0 11.4 0Z"/>',
    umbrella: '<path d="M22 12a10 10 0 0 0-20 0Z"/><path d="M12 12v8a2 2 0 0 0 4 0"/>',
    thermo: '<path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0Z"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    shorts: '<rect x="6" y="2" width="12" height="20" rx="4"/><path d="m10.5 9 4 3-4 3Z"/>',
    subs: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M7 3h10M5 5h14"/><path d="m10.5 11 4 2.5-4 2.5Z"/>',
    library: '<rect x="3" y="4" width="4" height="16" rx="1"/><rect x="9" y="4" width="4" height="16" rx="1"/><path d="m15.5 5 3.8-1 2.7 15.5-3.8 1Z"/>',
    trending: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    check: '<path d="m5 12 5 5 9-10"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    external: '<path d="M14 4h6v6M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>',
    bookmark: '<path d="M6 3h12v18l-6-4-6 4Z"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    terminal: '<path d="m4 17 6-5-6-5M12 19h8"/>',
    play: '<path d="M7 4v16l13-8Z"/>',
    zoomIn: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6M11 8v6"/>',
    zoomOut: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M8 11h6"/>',
    swap: '<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>',
    palette: '<circle cx="13.5" cy="6.5" r="1"/><circle cx="17.5" cy="10.5" r="1"/><circle cx="8.5" cy="7.5" r="1"/><circle cx="6.5" cy="12.5" r="1"/><path d="M12 2a10 10 0 0 0 0 20c1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7H16a6 6 0 0 0 6-6c0-4.4-4.5-8.2-10-8.2Z"/>'
  };
  const ic = (name, cls = "") => `<svg class="nx-ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${I[name] || ""}</svg>`;

  /* Optional key-click sound (Settings › Sound) */
  let audioCtx = null;
  function tick() {
    if (!store.get("nexus-sound-clicks", false)) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      const vol = Math.max(0, Math.min(1, store.get("nexus-sound-volume", 60) / 100)) * 0.08;
      o.frequency.value = 1400; o.type = "sine"; g.gain.value = vol;
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
      o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.06);
    } catch (_) {}
  }

  function toast(win, msg) {
    if (!win) return;
    win.querySelector(".nx-toast")?.remove();
    const t = document.createElement("div");
    t.className = "nx-toast"; t.setAttribute("role", "status"); t.textContent = msg;
    win.append(t); setTimeout(() => t.remove(), 2400);
  }

  function openSheet(win, html, onMount) {
    closeSheet(win);
    const s = document.createElement("div");
    s.className = "nx-sheet";
    s.innerHTML = `<div class="nx-sheet-backdrop" data-sheet-close></div><div class="nx-sheet-panel" role="dialog" aria-modal="true">${html}</div>`;
    s.addEventListener("click", (e) => { if (e.target.closest("[data-sheet-close]")) closeSheet(win); });
    win.append(s);
    if (onMount) onMount(s.querySelector(".nx-sheet-panel"));
    return s;
  }
  function closeSheet(win) { win?.querySelector(".nx-sheet")?.remove(); }

  function setActive(container, selector, el) {
    container.querySelectorAll(selector).forEach((b) => {
      const on = b === el; b.classList.toggle("is-active", on);
      if (b.getAttribute("role") === "tab") b.setAttribute("aria-selected", String(on));
    });
  }
  function showView(win, key) {
    win.querySelectorAll("[data-view]").forEach((v) => { v.hidden = v.dataset.view !== key; });
    const body = win.querySelector(".nx-body"); if (body) body.scrollTop = 0;
  }
  function selectNav(win, key) {
    const btn = win.querySelector(`[data-nx-nav="${key}"]`);
    if (btn) setActive(win, "[data-nx-nav]", btn);
  }
  function selectTab(win, key) {
    const btn = win.querySelector(`[data-nx-tab="${key}"]`);
    if (btn) setActive(win, "[data-nx-tab]", btn);
  }

  /* ------------------------------------------------------------------ *
   * Safe math engine (no eval) — used by Calculator, Terminal and Graph
   * ------------------------------------------------------------------ */
  const MathEngine = (() => {
    const FN = { asin: Math.asin, acos: Math.acos, atan: Math.atan, sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, abs: Math.abs, ln: Math.log, log: Math.log10 };
    const NAMES = ["asin", "acos", "atan", "sqrt", "sin", "cos", "tan", "abs", "ln", "log", "pi", "π", "e", "x"];
    function tokenize(src, base, vars) {
      const s = String(src)
        .replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/√/g, "sqrt")
        .replace(/\bAND\b/g, "&").replace(/\bXOR\b/g, "~").replace(/\bOR\b/g, "|");
      const out = []; let i = 0;
      const digit = base === 16 ? /[0-9A-Fa-f]/ : base === 8 ? /[0-7]/ : base === 2 ? /[01]/ : null;
      while (i < s.length) {
        const c = s[i];
        if (/\s/.test(c)) { i++; continue; }
        if (digit) {
          if (digit.test(c)) { let j = i; while (j < s.length && digit.test(s[j])) j++; out.push({ t: "num", v: parseInt(s.slice(i, j), base) }); i = j; continue; }
        } else if (/[0-9.]/.test(c)) {
          let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
          if (s[j] === "E" && /[-+0-9]/.test(s[j + 1] || "")) { j += 2; while (j < s.length && /[0-9]/.test(s[j])) j++; }
          const str = s.slice(i, j);
          if ((str.match(/\./g) || []).length > 1 || str === ".") throw new Error("Invalid number");
          out.push({ t: "num", v: parseFloat(str) }); i = j; continue;
        }
        if (/[a-zA-Zπ_]/.test(c)) {
          let j = i; while (j < s.length && /[a-zA-Z0-9π_]/.test(s[j])) j++;
          let word = s.slice(i, j);
          if (vars && Object.prototype.hasOwnProperty.call(vars, word)) { out.push({ t: "id", v: word }); i = j; continue; }
          // split runs like "2sinx" / "xsin" into known names
          let k = 0; const parts = [];
          while (k < word.length) {
            const lower = word.slice(k).toLowerCase();
            const hit = NAMES.find((n) => lower.startsWith(n));
            if (!hit) { parts.length = 0; break; }
            parts.push(word.substr(k, hit.length)); k += hit.length;
          }
          if (parts.length) parts.forEach((p) => out.push({ t: "id", v: p })); else out.push({ t: "id", v: word });
          i = j; continue;
        }
        if ("+-*/^()!%&|~,".includes(c)) { out.push({ t: "op", v: c }); i++; continue; }
        throw new Error("Unexpected “" + c + "”");
      }
      return out;
    }
    function fact(n) {
      if (n < 0 || !Number.isInteger(n)) throw new Error("Factorial needs a whole number");
      if (n > 170) return Infinity; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r;
    }
    function evaluate(src, opts = {}) {
      const tokens = tokenize(src, opts.base || 10, opts.vars);
      if (!tokens.length) throw new Error("Empty");
      let p = 0;
      const peek = () => tokens[p];
      const isOp = (v) => peek() && peek().t === "op" && peek().v === v;
      const int = !!opts.int;
      const T = (v) => Math.trunc(v);
      const expr = () => bor();
      function bor() { let v = bxor(); while (isOp("|")) { p++; v = T(v) | T(bxor()); } return v; }
      function bxor() { let v = band(); while (isOp("~")) { p++; v = T(v) ^ T(band()); } return v; }
      function band() { let v = add(); while (isOp("&")) { p++; v = T(v) & T(add()); } return v; }
      function add() { let v = mul(); while (isOp("+") || isOp("-")) { const o = tokens[p++].v; const r = mul(); v = o === "+" ? v + r : v - r; } return v; }
      function mul() {
        let v = unary();
        for (;;) {
          if (isOp("*") || isOp("/")) {
            const o = tokens[p++].v; const r = unary();
            if (o === "/") { if (r === 0) throw new Error("Can't divide by zero"); v = int ? T(v / r) : v / r; } else v *= r;
          } else if (peek() && (peek().t === "num" || peek().t === "id" || isOp("("))) { v *= unary(); }
          else break;
        }
        return v;
      }
      function unary() { if (isOp("-")) { p++; return -unary(); } if (isOp("+")) { p++; return unary(); } return pow(); }
      function pow() { const b = postfix(); if (isOp("^")) { p++; return Math.pow(b, unary()); } return b; }
      function postfix() { let v = primary(); for (;;) { if (isOp("!")) { p++; v = fact(v); } else if (isOp("%")) { p++; v = v / 100; } else break; } return v; }
      function group() { const v = expr(); if (isOp(")")) p++; return v; }
      function primary() {
        const tk = tokens[p++];
        if (!tk) throw new Error("Incomplete expression");
        if (tk.t === "num") return tk.v;
        if (tk.t === "op" && tk.v === "(") return group();
        if (tk.t === "id") {
          const raw = tk.v, n = raw.toLowerCase();
          if (opts.vars && Object.prototype.hasOwnProperty.call(opts.vars, raw)) return Number(opts.vars[raw]);
          if (n === "pi" || n === "π") return Math.PI;
          if (n === "e") return Math.E;
          if (n === "x" && opts.x !== undefined) return opts.x;
          if (FN[n]) {
            const arg = isOp("(") ? (p++, group()) : postfix();
            if (opts.deg && (n === "sin" || n === "cos" || n === "tan")) {
              const r = FN[n](arg * Math.PI / 180);
              return Math.abs(r) < 1e-12 ? 0 : r;
            }
            if (opts.deg && (n === "asin" || n === "acos" || n === "atan")) return FN[n](arg) * 180 / Math.PI;
            return FN[n](arg);
          }
          throw new Error("Unknown name “" + raw + "”");
        }
        throw new Error("Unexpected “" + tk.v + "”");
      }
      const v = expr();
      if (p < tokens.length) throw new Error("Unexpected “" + tokens[p].v + "”");
      return v;
    }
    function format(v) {
      if (!Number.isFinite(v)) return v > 0 ? "∞" : v < 0 ? "−∞" : "Error";
      const a = Math.abs(v);
      if (a !== 0 && (a >= 1e15 || a < 1e-9)) return v.toExponential(8).replace(/\.?0+e/, "e");
      return String(Number(v.toPrecision(12)));
    }
    return { evaluate, format };
  })();

  /* ------------------------------------------------------------------ *
   * Window framework
   * ------------------------------------------------------------------ */
  const APPS = {};
  let statusTimer = null;

  function nxOpen(name) {
    const app = APPS[name];
    const layer = document.getElementById("app-layer");
    if (!layer) return;
    const win = document.createElement("section");
    win.className = "app-window nx-app nx-" + name;
    win.setAttribute("role", "dialog");
    win.setAttribute("aria-modal", "true");
    win.setAttribute("aria-label", app.title);
    win.dataset.appName = name;

    const head = app.headHtml ? app.headHtml() :
      `<header class="nx-head"><button class="nx-icon-btn" type="button" data-nx-back aria-label="Back">${ic("back", "lg")}</button>
        <div class="nx-title">${app.titleHtml || `<h2>${esc(app.title)}</h2>`}</div>
        <div class="nx-head-actions">${app.actions || ""}</div></header>`;
    const tabs = app.tabs ? `<div class="nx-tabs" role="tablist" aria-label="${esc(app.title)} sections">${app.tabs.map((t, i) =>
      `<button type="button" role="tab" class="nx-tab${i ? "" : " is-active"}" aria-selected="${!i}" data-nx-tab="${t.key}">${esc(t.label)}</button>`).join("")}</div>` : "";
    const nav = app.nav ? `<nav class="nx-nav" style="--n:${app.nav.length}" aria-label="${esc(app.title)} navigation">${app.nav.map((n, i) =>
      `<button type="button" class="nx-nav-btn${i || n.noSelect ? "" : " is-active"}${n.fab ? " is-fab" : ""}" data-nx-nav="${n.key}" aria-label="${esc(n.label)}">${n.badge ? `<span class="nx-nav-badge" data-badge="${n.key}">1</span>` : ic(n.icon)}${n.fab ? "" : `<span>${esc(n.label)}</span>`}</button>`).join("")}</nav>` : "";

    win.innerHTML = `<div class="nx-status"><span class="nx-status-time">${timeStr(Date.now())}</span><span class="nx-status-icons">${ic("signal")}${ic("wifi")}${ic("battery")}</span></div>
      ${head}${tabs}<div class="nx-body">${app.html()}</div>${nav}${app.footerHtml ? app.footerHtml() : ""}`;

    win.addEventListener("click", (e) => {
      if (e.target.closest("button")) tick();
      if (e.target.closest("[data-nx-back]")) { if (app.onBack && app.onBack(win)) return; window.closeWindow?.(); return; }
      const tab = e.target.closest("[data-nx-tab]");
      if (tab) { setActive(win, "[data-nx-tab]", tab); app.onTab?.(win, tab.dataset.nxTab); return; }
      const nb = e.target.closest("[data-nx-nav]");
      if (nb) {
        const def = app.nav.find((n) => n.key === nb.dataset.nxNav);
        if (!def?.fab && !def?.noSelect) setActive(win, "[data-nx-nav]", nb);
        if (app.onNav) app.onNav(win, nb.dataset.nxNav); else showView(win, nb.dataset.nxNav);
      }
    });

    layer.replaceChildren(win);
    document.body.classList.add("app-is-open");
    requestAnimationFrame(() => win.classList.add("is-open"));
    clearInterval(statusTimer);
    statusTimer = setInterval(() => {
      if (!win.isConnected) { clearInterval(statusTimer); return; }
      const el = win.querySelector(".nx-status-time"); if (el) el.textContent = timeStr(Date.now());
    }, 15000);
    try { app.init?.(win); } catch (err) { console.error("Nexus app failed to start:", name, err); }
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const win = document.querySelector("#app-layer .nx-app");
    if (!win) return;
    if (win.querySelector(".nx-sheet")) { closeSheet(win); return; }
    const app = APPS[win.dataset.appName];
    if (app?.onBack && app.onBack(win)) return;
    window.closeWindow?.();
  });

  /* ================================================================== *
   * 1. YOUTUBE
   * ================================================================== */
  const YT_CACHE_MIN = 30;
  const ytState = { mode: "home", query: "", next: "", channel: null };
  async function ytSearch(params) {
    const key = "nexus-yt-cache:" + JSON.stringify(params);
    const cached = store.get(key, null);
    if (cached && Date.now() - cached.at < YT_CACHE_MIN * 60000) return cached.data;
    const u = new URL(API_BASE + "/api/youtube/search");
    Object.entries(params).forEach(([k, v]) => { if (v) u.searchParams.set(k, v); });
    const res = await fetch(u);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || "YouTube search is unavailable right now.");
    try { sessionStorage; store.set(key, { at: Date.now(), data }); } catch (_) {}
    return data;
  }
  const ytInitial = (s) => esc((String(s || "?").trim()[0] || "?").toUpperCase());
  const ytThumb = (item, hq) => esc(hq ? String(item.thumbnail || "").replace("mqdefault", "hqdefault") : item.thumbnail || "");
  const ytValid = (id) => /^[a-zA-Z0-9_-]{11}$/.test(String(id || ""));

  APPS.youtube = {
    title: "YouTube",
    titleHtml: `<div class="nx-yt-logo"><span class="nx-yt-mark"><svg viewBox="0 0 24 24"><path d="M6 3.5v17l15-8.5Z"/></svg></span>YouTube</div>`,
    actions: `<button class="nx-icon-btn" type="button" data-yt-focus aria-label="Search">${ic("search")}</button>`,
    tabs: [{ key: "home", label: "Home" }, { key: "trending", label: "Trending" }, { key: "subs", label: "Subscriptions" }],
    nav: [{ key: "home", label: "Home", icon: "home" }, { key: "shorts", label: "Shorts", icon: "shorts" }, { key: "add", label: "Play a link", icon: "plus", fab: true },
      { key: "subs", label: "Subscriptions", icon: "subs" }, { key: "library", label: "Library", icon: "library" }],
    html: () => `
      <form class="nx-search" data-yt-form role="search"><span>${ic("search")}</span><input type="search" name="q" placeholder="Search YouTube" autocomplete="off" enterkeyhint="search" aria-label="Search YouTube"></form>
      <div class="nx-chips" data-yt-chips>${["All", "Science", "Coding", "Space", "Music", "Cricket", "Gaming", "News"].map((c, i) => `<button type="button" class="nx-chip${i ? "" : " is-active"}" data-yt-chip="${c}">${c}</button>`).join("")}</div>
      <div class="nx-yt-player" data-yt-player hidden></div>
      <div data-view="home"><div data-yt-feed></div></div>
      <div data-view="shorts" hidden><div class="nx-section-title">Shorts</div><div class="nx-yt-shorts-grid" data-yt-shorts-grid></div></div>
      <div data-view="subs" hidden><div data-yt-subs></div></div>
      <div data-view="library" hidden><div data-yt-library></div></div>
      <p class="nx-note">Videos come from YouTube. Some owners block playback inside other apps.</p>`,
    init(win) {
      const form = win.querySelector("[data-yt-form]");
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const q = form.q.value.trim(); if (!q) return;
        const id = typeof extractYouTubeId === "function" ? extractYouTubeId(q) : "";
        if (id) { ytPlay(win, { videoId: id, title: "Video from link", channel: "" }); return; }
        form.q.blur(); ytGo(win, "home", q);
      });
      win.addEventListener("click", (e) => {
        if (e.target.closest("[data-yt-focus]")) { form.q.focus(); return; }
        const chip = e.target.closest("[data-yt-chip]");
        if (chip) { setActive(win, "[data-yt-chip]", chip); ytGo(win, ytState.mode === "shorts" ? "shorts" : "home", chip.dataset.ytChip === "All" ? "" : chip.dataset.ytChip); return; }
        const v = e.target.closest("[data-yt-video]");
        if (v) { const item = JSON.parse(v.dataset.ytVideo); ytPlay(win, item, v.hasAttribute("data-short")); return; }
        if (e.target.closest("[data-yt-close]")) { const p = win.querySelector("[data-yt-player]"); p.hidden = true; p.innerHTML = ""; return; }
        const sub = e.target.closest("[data-yt-sub]");
        if (sub) { ytToggleSub(win, JSON.parse(sub.dataset.ytSub)); return; }
        const ch = e.target.closest("[data-yt-channel]");
        if (ch) { ytState.channel = JSON.parse(ch.dataset.ytChannel); renderSubs(win); return; }
        if (e.target.closest("[data-yt-more]")) { ytLoad(win, true); return; }
        if (e.target.closest("[data-yt-retry]")) { ytLoad(win); return; }
        if (e.target.closest("[data-yt-clear-history]")) { store.set("nexus-yt-history", []); renderLibrary(win); return; }
      });
      ytGo(win, "home", "");
    },
    onTab(win, key) {
      if (key === "subs") { selectNav(win, "subs"); ytShow(win, "subs"); renderSubs(win); return; }
      selectNav(win, "home"); ytGo(win, key === "trending" ? "trending" : "home", "");
    },
    onNav(win, key) {
      if (key === "add") {
        openSheet(win, `<h3>Play a YouTube link</h3><form data-yt-link><label class="nx-field">Paste a link<input class="nx-input" name="url" placeholder="https://youtu.be/…" autocomplete="off" required></label><button class="nx-btn block" type="submit">${ic("play", "sm")} Play</button></form>`, (panel) => {
          const f = panel.querySelector("[data-yt-link]"); f.url.focus();
          f.addEventListener("submit", (e) => {
            e.preventDefault();
            const id = typeof extractYouTubeId === "function" ? extractYouTubeId(f.url.value) : "";
            if (!ytValid(id)) { toast(win, "That doesn't look like a YouTube link"); return; }
            closeSheet(win); ytShow(win, "home"); selectNav(win, "home"); ytPlay(win, { videoId: id, title: "Video from link", channel: "" });
          });
        });
        return;
      }
      if (key === "shorts") { selectTab(win, "home"); ytGo(win, "shorts", ytState.query); return; }
      if (key === "subs") { selectTab(win, "subs"); ytShow(win, "subs"); renderSubs(win); return; }
      if (key === "library") { ytShow(win, "library"); renderLibrary(win); return; }
      selectTab(win, "home"); ytGo(win, "home", "");
    }
  };
  function ytShow(win, view) {
    ytState.mode = view;
    showView(win, view === "trending" ? "home" : view);
    win.querySelector("[data-yt-chips]").hidden = view === "subs" || view === "library";
  }
  function ytGo(win, mode, query) {
    ytState.query = query || "";
    ytShow(win, mode);
    ytLoad(win);
  }
  function ytQuery() {
    if (ytState.mode === "trending") return ytState.query || "trending India today";
    return ytState.query || "science technology explained";
  }
  function ytSkeleton(short) {
    if (short) return Array.from({ length: 4 }, () => `<div class="nx-skel" style="aspect-ratio:9/15"></div>`).join("");
    return `<div class="nx-skel" style="aspect-ratio:16/9"></div><div style="display:flex;gap:10px;padding:10px 2px"><div class="nx-skel" style="width:36px;height:36px;border-radius:50%"></div><div style="flex:1"><div class="nx-skel" style="height:14px;margin-bottom:6px"></div><div class="nx-skel" style="height:12px;width:60%"></div></div></div>
      <div class="nx-yt-shorts" style="margin-top:12px">${Array.from({ length: 3 }, () => `<div class="nx-skel" style="aspect-ratio:9/15"></div>`).join("")}</div>`;
  }
  function ytCard(item, kind) {
    const data = esc(JSON.stringify({ videoId: item.videoId, title: item.title, channel: item.channel, channelId: item.channelId, thumbnail: item.thumbnail }));
    if (kind === "featured") return `<button type="button" class="nx-yt-featured" data-yt-video="${data}"><span class="nx-yt-thumb"><img src="${ytThumb(item, true)}" alt="" loading="lazy"></span>
      <span class="nx-yt-meta"><span class="nx-avatar">${ytInitial(item.channel)}</span><span><strong>${esc(item.title)}</strong><span>${esc(item.channel)}</span></span></span></button>`;
    if (kind === "short") return `<button type="button" class="nx-yt-short" data-short data-yt-video="${data}"><img src="${ytThumb(item, true)}" alt="" loading="lazy"><span>${esc(item.title)}</span></button>`;
    return `<button type="button" class="nx-yt-item" data-yt-video="${data}"><span class="nx-yt-thumb"><img src="${ytThumb(item)}" alt="" loading="lazy"></span><span><strong>${esc(item.title)}</strong><span>${esc(item.channel)}</span></span></button>`;
  }
  async function ytLoad(win, append = false) {
    const mode = ytState.mode;
    const isShorts = mode === "shorts";
    const target = win.querySelector(isShorts ? "[data-yt-shorts-grid]" : "[data-yt-feed]");
    if (!target) return;
    const slowTimer = setTimeout(() => { const n = target.querySelector("[data-yt-wait]"); if (n) n.hidden = false; }, 4000);
    if (!append) target.innerHTML = ytSkeleton(isShorts) + `<p class="nx-note" data-yt-wait hidden>Waking up the Nexus server — the first search can take up to a minute.</p>`;
    else target.querySelector("[data-yt-more]")?.remove();
    const q = ytQuery();
    try {
      if (isShorts) {
        const d = await ytSearch({ q: (ytState.query || "science") + " #shorts", mode: "shorts", pageToken: append ? ytState.next : "" });
        const items = (d.items || []).filter((i) => ytValid(i.videoId));
        ytState.next = d.nextPageToken || "";
        const html = items.map((i) => ytCard(i, "short")).join("");
        if (!append) target.innerHTML = html || `<div class="nx-empty" style="grid-column:1/-1">No Shorts found.</div>`; else target.insertAdjacentHTML("beforeend", html);
        if (ytState.next) target.insertAdjacentHTML("beforeend", `<button class="nx-btn ghost block" style="grid-column:1/-1" type="button" data-yt-more>Load more Shorts</button>`);
      } else {
        const [videos, shorts] = await Promise.all([
          ytSearch({ q, mode: "videos", pageToken: append ? ytState.next : "" }),
          append ? Promise.resolve(null) : ytSearch({ q: q + " #shorts", mode: "shorts" }).catch(() => null)
        ]);
        const items = (videos.items || []).filter((i) => ytValid(i.videoId));
        ytState.next = videos.nextPageToken || "";
        if (!append) {
          if (!items.length) { target.innerHTML = `<div class="nx-empty">${ic("search")}<strong>No videos found</strong>Try a different search.</div>`; return; }
          const [first, ...rest] = items;
          const shortItems = (shorts?.items || []).filter((i) => ytValid(i.videoId)).slice(0, 8);
          target.innerHTML = ytCard(first, "featured") +
            (shortItems.length ? `<div class="nx-section-title"><span style="display:flex;align-items:center;gap:6px">${ic("shorts", "sm")} Shorts</span><button type="button" data-nx-nav="shorts">See all</button></div><div class="nx-yt-shorts">${shortItems.map((i) => ytCard(i, "short")).join("")}</div>` : "") +
            `<div class="nx-yt-list" data-yt-list>${rest.map((i) => ytCard(i, "item")).join("")}</div>`;
        } else {
          target.querySelector("[data-yt-list]")?.insertAdjacentHTML("beforeend", items.map((i) => ytCard(i, "item")).join(""));
        }
        if (ytState.next) target.insertAdjacentHTML("beforeend", `<button class="nx-btn ghost block" style="margin-top:14px" type="button" data-yt-more>Load more videos</button>`);
      }
    } catch (err) {
      const msg = err.message === "Failed to fetch" ? "Couldn't reach the Nexus server. Check your internet connection." : err.message;
      const box = `<div class="nx-error" ${isShorts ? 'style="grid-column:1/-1"' : ""}>${esc(msg)}</div><button class="nx-btn ghost block" style="margin-top:10px;${isShorts ? "grid-column:1/-1" : ""}" type="button" data-yt-retry>${ic("refresh", "sm")} Try again</button>`;
      if (append) target.insertAdjacentHTML("beforeend", box); else target.innerHTML = box;
    } finally { clearTimeout(slowTimer); }
  }
  function ytPlay(win, item, isShort = false) {
    if (!ytValid(item.videoId)) return;
    const box = win.querySelector("[data-yt-player]");
    const subs = store.get("nexus-yt-subs", []);
    const subbed = item.channelId && subs.some((s) => s.id === item.channelId);
    box.classList.toggle("is-short", !!isShort);
    box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.videoId)}?autoplay=1&playsinline=1&rel=0" title="${esc(item.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
      <div class="nx-yt-now"><span class="nx-avatar">${ytInitial(item.channel)}</span><div><strong>${esc(item.title)}</strong><span>${esc(item.channel || "YouTube")}</span></div>
      ${item.channelId ? `<button class="nx-btn sm ${subbed ? "ghost" : ""}" type="button" data-yt-sub="${esc(JSON.stringify({ id: item.channelId, name: item.channel }))}">${subbed ? "Subscribed" : "Subscribe"}</button>` : ""}
      <button class="nx-icon-btn" type="button" data-yt-close aria-label="Close player">${ic("x")}</button></div>`;
    box.hidden = false;
    win.querySelector(".nx-body").scrollTo({ top: 0, behavior: "smooth" });
    const hist = store.get("nexus-yt-history", []).filter((h) => h.videoId !== item.videoId);
    hist.unshift({ ...item, at: Date.now() }); store.set("nexus-yt-history", hist.slice(0, 40));
  }
  function ytToggleSub(win, ch) {
    let subs = store.get("nexus-yt-subs", []);
    const has = subs.some((s) => s.id === ch.id);
    subs = has ? subs.filter((s) => s.id !== ch.id) : [{ id: ch.id, name: ch.name }, ...subs];
    store.set("nexus-yt-subs", subs);
    win.querySelectorAll("[data-yt-sub]").forEach((b) => { if (JSON.parse(b.dataset.ytSub).id === ch.id) { b.textContent = has ? "Subscribe" : "Subscribed"; b.classList.toggle("ghost", !has); } });
    toast(win, has ? "Unsubscribed from " + ch.name : "Subscribed to " + ch.name);
    if (ytState.mode === "subs") renderSubs(win);
  }
  async function renderSubs(win) {
    const box = win.querySelector("[data-yt-subs]");
    const subs = store.get("nexus-yt-subs", []);
    if (!subs.length) { box.innerHTML = `<div class="nx-empty">${ic("subs")}<strong>No subscriptions yet</strong>Play a video and tap Subscribe to follow its channel here.</div>`; return; }
    if (!ytState.channel || !subs.some((s) => s.id === ytState.channel.id)) ytState.channel = subs[0];
    box.innerHTML = `<div class="nx-yt-subs">${subs.map((s) => `<button type="button" class="nx-yt-sub${s.id === ytState.channel.id ? " is-active" : ""}" data-yt-channel="${esc(JSON.stringify(s))}"><span class="nx-avatar">${ytInitial(s.name)}</span><span>${esc(s.name)}</span></button>`).join("")}</div><div data-yt-chfeed>${ytSkeleton(false)}</div>`;
    const feed = box.querySelector("[data-yt-chfeed]");
    try {
      const d = await ytSearch({ q: "", mode: "videos", channelId: ytState.channel.id });
      const items = (d.items || []).filter((i) => ytValid(i.videoId));
      feed.innerHTML = items.length ? `<div class="nx-yt-list" style="margin-top:4px">${items.map((i) => ytCard(i, "item")).join("")}</div>` : `<div class="nx-empty">No videos from this channel.</div>`;
    } catch (err) { feed.innerHTML = `<div class="nx-error">${esc(err.message === "Failed to fetch" ? "Couldn't reach the Nexus server." : err.message)}</div>`; }
  }
  function renderLibrary(win) {
    const box = win.querySelector("[data-yt-library]");
    const hist = store.get("nexus-yt-history", []);
    box.innerHTML = `<div class="nx-section-title"><span>Watch history</span>${hist.length ? `<button type="button" data-yt-clear-history>Clear</button>` : ""}</div>` +
      (hist.length ? `<div class="nx-yt-list" style="margin-top:0">${hist.map((i) => ytCard(i, "item")).join("")}</div>` : `<div class="nx-empty">${ic("history")}<strong>Nothing watched yet</strong>Videos you play will show up here.</div>`);
  }

  /* ================================================================== *
   * 2. FILES (stored in IndexedDB on this device)
   * ================================================================== */
  const FilesDB = {
    _db: null,
    open() {
      if (this._db) return this._db;
      this._db = new Promise((resolve, reject) => {
        if (!("indexedDB" in window)) { reject(new Error("This browser can't store files.")); return; }
        const req = indexedDB.open("nexus-files", 1);
        req.onupgradeneeded = () => req.result.createObjectStore("files", { keyPath: "id" });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      return this._db;
    },
    async tx(mode, fn) {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const t = db.transaction("files", mode); const s = t.objectStore("files");
        const r = fn(s); t.oncomplete = () => resolve(r?.result); t.onerror = () => reject(t.error);
      });
    },
    all() { return this.tx("readonly", (s) => s.getAll()).then((r) => r || []); },
    put(rec) { return this.tx("readwrite", (s) => s.put(rec)); },
    del(id) { return this.tx("readwrite", (s) => s.delete(id)); }
  };
  const FILE_CATS = [
    { key: "documents", label: "Documents", icon: "file", tile: "t-blue" },
    { key: "downloads", label: "Downloads", icon: "download", tile: "t-sky" },
    { key: "images", label: "Images", icon: "image", tile: "t-orange" },
    { key: "videos", label: "Videos", icon: "video", tile: "t-yellow" },
    { key: "audio", label: "Audio", icon: "music", tile: "t-red" },
    { key: "apk", label: "APK", icon: "package", tile: "t-green" }
  ];
  function fileCat(f) {
    const n = (f.name || "").toLowerCase(), t = f.type || "";
    if (n.endsWith(".apk") || t === "application/vnd.android.package-archive") return "apk";
    if (t.startsWith("image/")) return "images";
    if (t.startsWith("video/")) return "videos";
    if (t.startsWith("audio/")) return "audio";
    if (t.startsWith("text/") || t === "application/pdf" || /\.(pdf|docx?|xlsx?|pptx?|txt|md|csv|rtf|odt|ods|json|html?)$/.test(n)) return "documents";
    return "downloads";
  }
  const catOf = (key) => FILE_CATS.find((c) => c.key === key) || FILE_CATS[1];
  const fileState = { files: [], cat: null, sort: "recent", query: "" };

  APPS.files = {
    title: "Files",
    actions: `<button class="nx-icon-btn" type="button" data-files-add aria-label="Add files">${ic("plus")}</button>`,
    nav: [{ key: "home", label: "Home", icon: "home" }, { key: "all", label: "Files", icon: "folder" }, { key: "search", label: "Search", icon: "search" }],
    html: () => `
      <input type="file" multiple hidden data-files-input>
      <div data-view="home">
        <button type="button" class="nx-search" data-nx-nav="search" style="width:100%;text-align:left"><span>${ic("search")}</span><span style="color:var(--nx-faint)">Search files…</span></button>
        <div class="nx-list" data-files-cats></div>
        <div class="nx-card nx-storage" style="margin-top:12px"><div class="nx-storage-head"><strong>Storage</strong><span data-files-used>Checking…</span></div><div class="nx-bar"><i data-files-bar style="width:0"></i></div><small data-files-quota></small></div>
        <div class="nx-section-title">Recent</div><div data-files-recent></div>
      </div>
      <div data-view="all" hidden>
        <div data-files-crumb></div>
        <div class="nx-chips" style="padding-bottom:12px">${[["recent", "Recent"], ["name", "Name"], ["size", "Size"]].map(([k, l], i) => `<button type="button" class="nx-chip${i ? "" : " is-active"}" data-files-sort="${k}">${l}</button>`).join("")}</div>
        <div data-files-list></div>
      </div>
      <div data-view="search" hidden>
        <form class="nx-search" data-files-search role="search"><span>${ic("search")}</span><input type="search" name="q" placeholder="Search files…" autocomplete="off" aria-label="Search files"></form>
        <div data-files-results></div>
      </div>
      <button class="nx-fab" type="button" data-files-add aria-label="Add files">${ic("plus")}</button>`,
    async init(win) {
      const input = win.querySelector("[data-files-input]");
      win.addEventListener("click", (e) => {
        if (e.target.closest("[data-files-add]")) { input.click(); return; }
        const c = e.target.closest("[data-files-cat]");
        if (c) { fileState.cat = c.dataset.filesCat; selectNav(win, "all"); showView(win, "all"); renderFileList(win); return; }
        if (e.target.closest("[data-files-allcats]")) { fileState.cat = null; renderFileList(win); return; }
        const s = e.target.closest("[data-files-sort]");
        if (s) { fileState.sort = s.dataset.filesSort; setActive(win, "[data-files-sort]", s); renderFileList(win); return; }
        const f = e.target.closest("[data-file-id]");
        if (f) { openFilePreview(win, f.dataset.fileId); return; }
        const navBtn = e.target.closest(".nx-body [data-nx-nav]");
        if (navBtn) { selectNav(win, navBtn.dataset.nxNav); showView(win, navBtn.dataset.nxNav); setTimeout(() => win.querySelector("[data-files-search] input")?.focus(), 50); }
      });
      input.addEventListener("change", async () => {
        const list = Array.from(input.files || []);
        if (!list.length) return;
        let ok = 0;
        for (const file of list) {
          try { await FilesDB.put({ id: uid(), name: file.name, type: file.type, size: file.size, added: Date.now(), modified: file.lastModified || Date.now(), blob: file }); ok++; }
          catch (_) { toast(win, "Not enough space to save " + file.name); }
        }
        input.value = "";
        if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
        if (ok) toast(win, ok === 1 ? "1 file added" : ok + " files added");
        await refreshFiles(win);
      });
      const sf = win.querySelector("[data-files-search]");
      sf.addEventListener("submit", (e) => e.preventDefault());
      sf.q.addEventListener("input", () => { fileState.query = sf.q.value.trim().toLowerCase(); renderFileSearch(win); });
      await refreshFiles(win);
    },
    onNav(win, key) {
      showView(win, key);
      if (key === "all") { fileState.cat = null; renderFileList(win); }
      if (key === "search") setTimeout(() => win.querySelector("[data-files-search] input")?.focus(), 50);
    }
  };
  async function refreshFiles(win) {
    try { fileState.files = await FilesDB.all(); }
    catch (err) { fileState.files = []; win.querySelector("[data-files-cats]").innerHTML = `<div class="nx-error">${esc(err.message)}</div>`; return; }
    const counts = {}; FILE_CATS.forEach((c) => (counts[c.key] = 0));
    fileState.files.forEach((f) => counts[fileCat(f)]++);
    win.querySelector("[data-files-cats]").innerHTML = FILE_CATS.map((c) => `<button type="button" class="nx-row" data-files-cat="${c.key}"><span class="nx-tile ${c.tile}">${ic(c.icon)}</span><span class="nx-row-main"><strong>${c.label}</strong></span><span class="nx-row-meta">${counts[c.key]} ${counts[c.key] === 1 ? "item" : "items"}</span>${ic("chev", "sm")}</button>`).join("");
    const recent = [...fileState.files].sort((a, b) => b.added - a.added).slice(0, 4);
    win.querySelector("[data-files-recent]").innerHTML = recent.length ? `<div class="nx-list">${recent.map(fileRow).join("")}</div>` :
      `<div class="nx-card nx-empty">${ic("folder")}<strong>No files yet</strong>Tap + to add photos, PDFs, songs or any file from your phone. They stay saved in Nexus.</div>`;
    let used = fileState.files.reduce((s, f) => s + (f.size || 0), 0), quota = 0;
    try { const est = await navigator.storage?.estimate?.(); if (est) { used = Math.max(used, est.usage || 0); quota = est.quota || 0; } } catch (_) {}
    win.querySelector("[data-files-used]").textContent = quota ? `${fmtBytes(used)} / ${fmtBytes(quota)}` : fmtBytes(used) + " used";
    win.querySelector("[data-files-bar]").style.width = quota ? Math.max(1.5, Math.min(100, (used / quota) * 100)).toFixed(1) + "%" : "2%";
    win.querySelector("[data-files-quota]").textContent = `${fileState.files.length} ${fileState.files.length === 1 ? "file" : "files"} saved in Nexus · space shown is what your browser allows Nexus to use`;
    if (!win.querySelector('[data-view="all"]').hidden) renderFileList(win);
    if (!win.querySelector('[data-view="search"]').hidden) renderFileSearch(win);
  }
  function fileRow(f) {
    const c = catOf(fileCat(f));
    const date = new Date(f.added).toLocaleDateString([], { day: "numeric", month: "short" });
    return `<button type="button" class="nx-row" data-file-id="${esc(f.id)}"><span class="nx-tile ${c.tile}">${ic(c.icon)}</span><span class="nx-row-main"><strong>${esc(f.name)}</strong><span>${fmtBytes(f.size)} · ${date}</span></span>${ic("chev", "sm")}</button>`;
  }
  function sortFiles(list) {
    const l = [...list];
    if (fileState.sort === "name") l.sort((a, b) => a.name.localeCompare(b.name));
    else if (fileState.sort === "size") l.sort((a, b) => b.size - a.size);
    else l.sort((a, b) => b.added - a.added);
    return l;
  }
  function renderFileList(win) {
    const crumb = win.querySelector("[data-files-crumb]");
    const list = fileState.cat ? fileState.files.filter((f) => fileCat(f) === fileState.cat) : fileState.files;
    crumb.innerHTML = fileState.cat ? `<button type="button" class="nx-crumb" data-files-allcats>${ic("back", "sm")} All files <span style="color:var(--nx-faint)">/</span> <span style="color:var(--nx-text)">${catOf(fileState.cat).label}</span></button>` :
      `<div class="nx-section-title" style="margin-top:4px">All files <small>${list.length}</small></div>`;
    win.querySelector("[data-files-list]").innerHTML = list.length ? `<div class="nx-list">${sortFiles(list).map(fileRow).join("")}</div>` :
      `<div class="nx-card nx-empty">${ic(fileState.cat ? catOf(fileState.cat).icon : "folder")}<strong>Nothing here yet</strong>Tap + to add files.</div>`;
  }
  function renderFileSearch(win) {
    const q = fileState.query; const box = win.querySelector("[data-files-results]");
    if (!q) { box.innerHTML = `<div class="nx-empty">Type a file name to search.</div>`; return; }
    const hits = fileState.files.filter((f) => f.name.toLowerCase().includes(q));
    box.innerHTML = hits.length ? `<div class="nx-list">${sortFiles(hits).map(fileRow).join("")}</div>` : `<div class="nx-empty">No files match “${esc(q)}”.</div>`;
  }
  async function openFilePreview(win, id) {
    const f = fileState.files.find((x) => x.id === id); if (!f) return;
    const url = URL.createObjectURL(f.blob);
    const cat = fileCat(f);
    let media = "";
    if (cat === "images") media = `<img class="nx-preview-media" src="${url}" alt="${esc(f.name)}">`;
    else if (cat === "videos") media = `<video class="nx-preview-media" src="${url}" controls playsinline></video>`;
    else if (cat === "audio") media = `<audio src="${url}" controls style="width:100%"></audio>`;
    else if (f.type === "application/pdf") media = `<iframe class="nx-preview-frame" src="${url}" title="${esc(f.name)}"></iframe>`;
    else if ((f.type.startsWith("text/") || /\.(txt|md|csv|json|js|py|html?|css)$/i.test(f.name)) && f.size < 1_000_000) media = `<pre class="nx-preview-text" data-file-text>Loading…</pre>`;
    else media = `<div class="nx-card nx-empty">${ic(catOf(cat).icon)}<strong>No preview</strong>Save it to your phone to open it with another app.</div>`;
    const sheet = openSheet(win, `<h3 style="word-break:break-word">${esc(f.name)}</h3>${media}
      <p class="nx-note" style="margin-bottom:0">${fmtBytes(f.size)} · ${esc(f.type || "Unknown type")} · added ${new Date(f.added).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
      <div class="nx-actions"><a class="nx-btn ghost" href="${url}" download="${esc(f.name)}">${ic("download", "sm")} Save</a><button class="nx-btn danger" type="button" data-file-del>${ic("trash", "sm")} Delete</button></div>
      <button class="nx-btn ghost block" style="margin-top:10px" type="button" data-file-open>${ic("external", "sm")} Open in a new tab</button>`, async (panel) => {
      const pre = panel.querySelector("[data-file-text]"); if (pre) pre.textContent = await f.blob.text();
      panel.querySelector("[data-file-open]").addEventListener("click", () => window.open(url, "_blank", "noopener"));
      const del = panel.querySelector("[data-file-del]");
      del.addEventListener("click", async () => {
        if (!del.dataset.confirm) { del.dataset.confirm = "1"; del.innerHTML = ic("trash", "sm") + " Tap again to delete"; return; }
        await FilesDB.del(f.id); closeSheet(win); toast(win, "Deleted " + f.name); refreshFiles(win);
      });
    });
    const obs = new MutationObserver(() => { if (!sheet.isConnected) { URL.revokeObjectURL(url); obs.disconnect(); } });
    obs.observe(win, { childList: true });
  }

  /* ================================================================== *
   * 3. TERMINAL
   * ================================================================== */
  const TERM_FS_KEY = "nexus-term-fs";
  function termDefaultFs() {
    const h = "/home/" + userName().toLowerCase().replace(/[^a-z0-9]/g, "") ;
    return {
      "/": { d: 1 }, "/home": { d: 1 }, [h]: { d: 1 }, [h + "/Documents"]: { d: 1 }, [h + "/Downloads"]: { d: 1 }, [h + "/Music"]: { d: 1 }, [h + "/Pictures"]: { d: 1 }, [h + "/Videos"]: { d: 1 },
      [h + "/readme.txt"]: { c: "Welcome to the Nexus OS terminal.\nType 'help' to see what you can do." },
      [h + "/Documents/roadmap.txt"]: { c: "Nexus OS roadmap\n- [x] Batch 1: new app design\n- [ ] Batch 2: Music, Clock, News, Camera, Messages, Calls, Gallery, Themes\n- [ ] Nexus AI that can open apps" }
    };
  }
  const termHome = () => "/home/" + userName().toLowerCase().replace(/[^a-z0-9]/g, "");
  let termFs = null;
  const fsLoad = () => (termFs = termFs || store.get(TERM_FS_KEY, null) || termDefaultFs());
  const fsSave = () => store.set(TERM_FS_KEY, termFs);
  function fsResolve(cwd, p) {
    if (!p || p === "~") return termHome();
    let path = p.startsWith("~") ? termHome() + p.slice(1) : p.startsWith("/") ? p : cwd + "/" + p;
    const parts = [];
    path.split("/").forEach((seg) => { if (!seg || seg === ".") return; if (seg === "..") parts.pop(); else parts.push(seg); });
    return "/" + parts.join("/");
  }
  const fsParent = (p) => p === "/" ? "/" : p.slice(0, p.lastIndexOf("/")) || "/";
  const fsChildren = (dir) => Object.keys(fsLoad()).filter((k) => k !== dir && fsParent(k) === dir).map((k) => k.slice(k.lastIndexOf("/") + 1)).sort();
  const pretty = (p) => p === termHome() ? "~" : p.startsWith(termHome() + "/") ? "~" + p.slice(termHome().length) : p;
  const termSessions = [0, 1, 2].map(() => ({ lines: [], hist: [], hIdx: -1, cwd: null, py: false, vars: {}, started: false }));
  let termCur = 0, termCtrl = false, termAlt = false;
  const COMMANDS = ["help", "ls", "cd", "pwd", "mkdir", "touch", "cat", "echo", "rm", "mv", "clear", "date", "whoami", "hostname", "uname", "neofetch", "history", "open", "calc", "python3", "python", "sudo", "exit", "nexus"];

  APPS.terminal = {
    title: "Terminal",
    actions: `<button class="nx-icon-btn" type="button" data-term-clear aria-label="Clear screen">${ic("trash")}</button>`,
    tabs: [{ key: "0", label: "Tab 1" }, { key: "1", label: "Tab 2" }, { key: "2", label: "Tab 3" }],
    html: () => `<div class="nx-term" data-term><div class="nx-term-out" data-term-out></div><label class="nx-term-line"><span class="p" data-term-prompt></span><input data-term-in autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="send" aria-label="Terminal command"></label></div>`,
    footerHtml: () => `<div class="nx-keys">${[["ctrl", "Ctrl"], ["alt", "Alt"], ["tab", "Tab"], ["slash", "/"], ["up", "↑"], ["down", "↓"]].map(([k, l]) => `<button type="button" class="nx-key" data-term-key="${k}" aria-label="${l}">${l}</button>`).join("")}</div>`,
    init(win) {
      win.classList.add("nx-terminal");
      const input = win.querySelector("[data-term-in]");
      win.querySelector("[data-term]").addEventListener("click", (e) => { if (!window.getSelection()?.toString()) input.focus(); });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); termRun(win, input.value); input.value = ""; }
        else if (e.key === "ArrowUp") { e.preventDefault(); termHist(win, -1); }
        else if (e.key === "ArrowDown") { e.preventDefault(); termHist(win, 1); }
        else if (e.key === "Tab") { e.preventDefault(); termComplete(win); }
        else if (e.ctrlKey && e.key.toLowerCase() === "l") { e.preventDefault(); termSessions[termCur].lines = []; termRender(win); }
        else if (e.ctrlKey && e.key.toLowerCase() === "c") { if (!input.selectionStart || input.selectionStart === input.selectionEnd) { e.preventDefault(); termCancel(win); } }
      });
      input.addEventListener("input", (e) => {
        if (!(termCtrl || termAlt) || !e.data) return;
        const ch = e.data.slice(-1).toLowerCase();
        input.value = input.value.slice(0, -1);
        if (termCtrl) {
          if (ch === "c") termCancel(win);
          else if (ch === "l") { termSessions[termCur].lines = []; termRender(win); }
          else if (ch === "u") input.value = "";
          else if (ch === "a") input.setSelectionRange(0, 0);
        } else if (termAlt && ch === ".") {
          const last = termSessions[termCur].hist[0] || ""; input.value += last.split(/\s+/).pop() || "";
        }
        termCtrl = termAlt = false; termKeys(win);
      });
      win.addEventListener("click", (e) => {
        if (e.target.closest("[data-term-clear]")) { termSessions[termCur].lines = []; termRender(win); input.focus(); return; }
        const k = e.target.closest("[data-term-key]"); if (!k) return;
        const key = k.dataset.termKey;
        if (key === "ctrl") { termCtrl = !termCtrl; termAlt = false; }
        else if (key === "alt") { termAlt = !termAlt; termCtrl = false; }
        else if (key === "tab") termComplete(win);
        else if (key === "slash") input.value += "/";
        else if (key === "up") termHist(win, -1);
        else if (key === "down") termHist(win, 1);
        termKeys(win); input.focus();
      });
      termSwitch(win, termCur);
    },
    onTab(win, key) { termSwitch(win, Number(key)); }
  };
  function termKeys(win) {
    win.querySelector('[data-term-key="ctrl"]')?.classList.toggle("is-on", termCtrl);
    win.querySelector('[data-term-key="alt"]')?.classList.toggle("is-on", termAlt);
  }
  function termPrompt(s) { return s.py ? ">>> " : `${userName().toLowerCase().replace(/[^a-z0-9]/g, "")}@nexus:${pretty(s.cwd)}$ `; }
  function termSwitch(win, i) {
    termCur = i; selectTab(win, String(i));
    const s = termSessions[i];
    if (!s.started) {
      s.started = true; s.cwd = termHome(); fsLoad();
      s.lines.push(`<span class="d">Nexus OS Terminal</span> <span class="m">· tab ${i + 1}</span>`, `<span class="m">Type</span> help <span class="m">to see commands.</span>`, "");
    }
    termRender(win); win.querySelector("[data-term-in]")?.focus({ preventScroll: true });
  }
  function termRender(win) {
    const s = termSessions[termCur];
    win.querySelector("[data-term-out]").innerHTML = s.lines.join("\n") + (s.lines.length ? "\n" : "");
    win.querySelector("[data-term-prompt]").textContent = termPrompt(s);
    const box = win.querySelector("[data-term]"); box.scrollTop = box.scrollHeight;
  }
  function termCancel(win) {
    const s = termSessions[termCur], input = win.querySelector("[data-term-in]");
    s.lines.push(`<span class="p">${esc(termPrompt(s))}</span>${esc(input.value)}^C`); input.value = ""; termRender(win);
  }
  function termHist(win, dir) {
    const s = termSessions[termCur], input = win.querySelector("[data-term-in]");
    if (!s.hist.length) return;
    s.hIdx = Math.max(-1, Math.min(s.hist.length - 1, s.hIdx - dir));
    input.value = s.hIdx < 0 ? "" : s.hist[s.hIdx];
    requestAnimationFrame(() => input.setSelectionRange(input.value.length, input.value.length));
  }
  function termComplete(win) {
    const s = termSessions[termCur], input = win.querySelector("[data-term-in]");
    const parts = input.value.split(" "); const last = parts[parts.length - 1];
    let options;
    if (parts.length === 1) options = COMMANDS.filter((c) => c.startsWith(last));
    else {
      const slash = last.lastIndexOf("/");
      const dir = fsResolve(s.cwd, slash >= 0 ? last.slice(0, slash) || "/" : ".");
      const stem = slash >= 0 ? last.slice(slash + 1) : last;
      options = fsChildren(dir).filter((n) => n.startsWith(stem)).map((n) => (slash >= 0 ? last.slice(0, slash + 1) : "") + n + (fsLoad()[dir === "/" ? "/" + n : dir + "/" + n]?.d ? "/" : ""));
    }
    if (options.length === 1) { parts[parts.length - 1] = options[0]; input.value = parts.join(" ") + (parts.length === 1 ? " " : ""); }
    else if (options.length > 1) { s.lines.push(`<span class="p">${esc(termPrompt(s))}</span>${esc(input.value)}`, esc(options.join("  "))); termRender(win); }
  }
  function termRun(win, raw) {
    const s = termSessions[termCur];
    const line = raw.replace(/\s+$/, "");
    s.lines.push(`<span class="p">${esc(termPrompt(s))}</span>${esc(line)}`);
    if (line.trim()) { s.hist.unshift(line); s.hist = s.hist.slice(0, 100); }
    s.hIdx = -1;
    const out = (txt, cls) => s.lines.push(cls ? `<span class="${cls}">${esc(txt)}</span>` : esc(txt));
    try { if (s.py) runPython(s, line.trim(), out); else runShell(win, s, line.trim(), out); }
    catch (err) { out(String(err.message || err), "e"); }
    if (s.lines.length > 600) s.lines = s.lines.slice(-600);
    termRender(win);
  }
  function runPython(s, line, out) {
    if (!line) return;
    if (/^(exit|quit)\(\)$/.test(line)) { s.py = false; return; }
    const strLit = (t) => { const m = t.match(/^(["'])(.*)\1$/); return m ? m[2].replace(/\\n/g, "\n") : null; };
    const val = (t) => {
      t = t.trim();
      const lit = strLit(t); if (lit !== null) return lit;
      if (t === "True" || t === "False") return t;
      return MathEngine.format(MathEngine.evaluate(t.replace(/\*\*/g, "^").replace(/math\./g, ""), { vars: s.vars }));
    };
    const pm = line.match(/^print\((.*)\)$/);
    if (pm) {
      const args = pm[1].trim() ? splitArgs(pm[1]) : [];
      out(args.map(val).join(" ")); return;
    }
    const am = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
    if (am) {
      const lit = strLit(am[2].trim());
      if (lit !== null) { out("Nexus mini-Python stores numbers only in variables.", "m"); return; }
      s.vars[am[1]] = MathEngine.evaluate(am[2].replace(/\*\*/g, "^").replace(/math\./g, ""), { vars: s.vars }); return;
    }
    if (/^(import|from)\s/.test(line)) { out("Modules aren't available here — math functions like sqrt(), sin() and pi work without importing.", "m"); return; }
    const lit = strLit(line); if (lit !== null) { out("'" + lit + "'"); return; }
    try { out(val(line)); }
    catch (err) { out("SyntaxError: " + err.message + " — mini-Python supports print(), maths and number variables.", "e"); }
  }
  function splitArgs(src) {
    const args = []; let cur = "", q = null, depth = 0;
    for (const ch of src) {
      if (q) { cur += ch; if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
      if (ch === "(") depth++; if (ch === ")") depth--;
      if (ch === "," && depth === 0) { args.push(cur); cur = ""; continue; }
      cur += ch;
    }
    if (cur.trim()) args.push(cur);
    return args;
  }
  function runShell(win, s, line, out) {
    if (!line) return;
    const fs = fsLoad();
    let redirect = null;
    const rm = line.match(/^(.*?)\s*(>>?)\s*(\S+)$/);
    let cmdLine = line;
    if (rm && /^echo\b/.test(line)) { cmdLine = rm[1]; redirect = { append: rm[2] === ">>", path: fsResolve(s.cwd, rm[3]) }; }
    const args = cmdLine.match(/"[^"]*"|'[^']*'|\S+/g).map((a) => a.replace(/^["']|["']$/g, ""));
    const cmd = args.shift();
    const need = (n) => { if (args.length < n) throw new Error(cmd + ": missing operand"); };
    switch (cmd) {
      case "help":
        out("Files      ls, cd, pwd, mkdir, touch, cat, echo, rm, mv", "y");
        out("System     date, whoami, hostname, uname, neofetch, history, clear", "y");
        out("Nexus      open <app>, calc <maths>, python3, nexus", "y");
        out("Keys       Tab completes · ↑/↓ history · Ctrl+C cancels · Ctrl+L clears", "m");
        out("This terminal is a safe sandbox: it can't change your phone.", "m");
        break;
      case "ls": {
        const dir = fsResolve(s.cwd, args.find((a) => !a.startsWith("-")) || ".");
        if (!fs[dir]) throw new Error("ls: cannot access '" + (args[0] || dir) + "': No such file or directory");
        if (!fs[dir].d) { out(dir.split("/").pop()); break; }
        const names = fsChildren(dir);
        s.lines.push(names.map((n) => fs[(dir === "/" ? "" : dir) + "/" + n].d ? `<span class="d">${esc(n)}</span>` : esc(n)).join("  ") || "");
        if (!names.length) s.lines.pop();
        break;
      }
      case "cd": {
        const dir = fsResolve(s.cwd, args[0]);
        if (!fs[dir]) throw new Error("cd: " + args[0] + ": No such file or directory");
        if (!fs[dir].d) throw new Error("cd: " + args[0] + ": Not a directory");
        s.cwd = dir; break;
      }
      case "pwd": out(s.cwd); break;
      case "mkdir": need(1); args.filter((a) => !a.startsWith("-")).forEach((a) => {
        const p = fsResolve(s.cwd, a);
        if (fs[p]) throw new Error("mkdir: cannot create directory '" + a + "': File exists");
        if (!fs[fsParent(p)]?.d) throw new Error("mkdir: cannot create directory '" + a + "': No such file or directory");
        fs[p] = { d: 1 };
      }); fsSave(); break;
      case "touch": need(1); args.forEach((a) => {
        const p = fsResolve(s.cwd, a);
        if (!fs[fsParent(p)]?.d) throw new Error("touch: cannot touch '" + a + "': No such file or directory");
        if (!fs[p]) fs[p] = { c: "" };
      }); fsSave(); break;
      case "cat": need(1); args.forEach((a) => {
        const p = fsResolve(s.cwd, a);
        if (!fs[p]) throw new Error("cat: " + a + ": No such file or directory");
        if (fs[p].d) throw new Error("cat: " + a + ": Is a directory");
        if (fs[p].c) out(fs[p].c);
      }); break;
      case "echo": {
        const text = args.join(" ");
        if (redirect) {
          if (!fs[fsParent(redirect.path)]?.d) throw new Error("echo: No such file or directory");
          if (fs[redirect.path]?.d) throw new Error("echo: Is a directory");
          const prev = fs[redirect.path]?.c || "";
          fs[redirect.path] = { c: redirect.append && prev ? prev + "\n" + text : text }; fsSave();
        } else out(text);
        break;
      }
      case "rm": {
        need(1); const rec = args.some((a) => /^-[a-z]*r/.test(a));
        args.filter((a) => !a.startsWith("-")).forEach((a) => {
          const p = fsResolve(s.cwd, a);
          if (!fs[p]) throw new Error("rm: cannot remove '" + a + "': No such file or directory");
          if (p === "/" || p === "/home" || p === termHome()) throw new Error("rm: refusing to remove '" + a + "'");
          if (fs[p].d && !rec) throw new Error("rm: cannot remove '" + a + "': Is a directory (use rm -r)");
          Object.keys(fs).forEach((k) => { if (k === p || k.startsWith(p + "/")) delete fs[k]; });
        }); fsSave(); break;
      }
      case "mv": {
        need(2); const from = fsResolve(s.cwd, args[0]); let to = fsResolve(s.cwd, args[1]);
        if (!fs[from]) throw new Error("mv: cannot stat '" + args[0] + "': No such file or directory");
        if (fs[to]?.d) to = to + "/" + from.split("/").pop();
        if (!fs[fsParent(to)]?.d) throw new Error("mv: target directory does not exist");
        Object.keys(fs).forEach((k) => { if (k === from || k.startsWith(from + "/")) { fs[to + k.slice(from.length)] = fs[k]; delete fs[k]; } }); fsSave(); break;
      }
      case "clear": s.lines = []; break;
      case "date": out(new Date().toString()); break;
      case "whoami": out(userName().toLowerCase().replace(/[^a-z0-9]/g, "")); break;
      case "hostname": out("nexus"); break;
      case "uname": out(args.includes("-a") ? "NexusOS nexus 2.0.0-web #40 " + (navigator.platform || "web") + " JavaScript" : "NexusOS"); break;
      case "nexus": out("Nexus OS 2.0 · web edition · build v40", "d"); out("Made by " + userName() + ". 33 apps. Batch 1 apps redesigned.", "m"); break;
      case "neofetch": {
        const logo = ["   ▄▄▄▄   ▄▄▄▄ ", "   █  █   █  █ ", "   ▀▀▀▀   ▀▀▀▀ ", "   ▄▄▄▄   ▄▄▄▄ ", "   █  █   █  █ ", "   ▀▀▀▀   ▀▀▀▀ "];
        const u = userName().toLowerCase().replace(/[^a-z0-9]/g, "");
        const info = [`<span class="p">${esc(u)}@nexus</span>`, "OS: Nexus OS 2.0 (web)", "Shell: nexus-sh", `Resolution: ${screen.width}×${screen.height}`, `Language: ${esc(navigator.language || "en")}`, `Apps: 33`];
        logo.forEach((l, i) => s.lines.push(`<span class="d">${esc(l)}</span>  ${info[i] || ""}`));
        break;
      }
      case "history": s.hist.slice().reverse().forEach((h, i) => out(String(i + 1).padStart(4) + "  " + h)); break;
      case "open": {
        need(1); const name = args[0].toLowerCase();
        const has = (typeof appInfo !== "undefined" && appInfo[name]) || APPS[name];
        if (!has) throw new Error("open: no app called '" + args[0] + "'. Try: open weather");
        out("Opening " + name + "…", "m"); setTimeout(() => window.openApp(name), 250); break;
      }
      case "calc": need(1); out(MathEngine.format(MathEngine.evaluate(args.join(" ")))); break;
      case "python": case "python3":
        s.py = true; out("Python 3.11 (Nexus mini-Python)", "y"); out("Supports print(), maths and number variables. Type exit() to leave.", "m"); break;
      case "sudo": out(userName().toLowerCase() + " is not in the sudoers file. Nice try.", "e"); break;
      case "exit": s.lines = []; s.started = false; termSwitch(win, termCur); return;
      default: throw new Error(cmd + ": command not found. Type 'help'.");
    }
  }

  /* ================================================================== *
   * 4. BROWSER
   * ================================================================== */
  const BLOCKED = ["github.com", "scratch.mit.edu", "developer.mozilla.org", "duckduckgo.com", "bing.com", "facebook.com", "instagram.com", "x.com", "twitter.com", "linkedin.com", "reddit.com", "amazon.in", "amazon.com", "flipkart.com", "chatgpt.com", "openai.com", "whatsapp.com", "netflix.com", "perplexity.ai", "stackoverflow.com"];
  const SHORTCUTS = [
    { name: "Google", url: "https://www.google.com/?igu=1", tile: "t-blue", glyph: "G" },
    { name: "Wikipedia", url: "https://en.m.wikipedia.org/wiki/Main_Page", tile: "t-slate", glyph: "W" },
    { name: "W3Schools", url: "https://www.w3schools.com/", tile: "t-green", glyph: "W3" },
    { name: "Khan Academy", url: "https://www.khanacademy.org/", tile: "t-teal", glyph: "K" },
    { name: "Maps", url: "https://www.openstreetmap.org/export/embed.html?bbox=80.15%2C12.95%2C80.35%2C13.15&layer=mapnik", tile: "t-orange", icon: "pin" },
    { name: "GitHub", url: "https://github.com/", tile: "t-indigo", icon: "terminal" },
    { name: "Scratch", url: "https://scratch.mit.edu/", tile: "t-yellow", glyph: "S" },
    { name: "News", url: "https://www.google.com/search?igu=1&tbm=nws&q=India+news", tile: "t-red", glyph: "N" }
  ];
  const br = { tabs: [], cur: 0 };
  function brNewTab(url) { const t = { id: uid(), url: null, title: "New tab", hist: [], idx: -1 }; br.tabs.push(t); br.cur = br.tabs.length - 1; if (url) brPush(t, url); return t; }
  function brPush(t, url) { t.hist = t.hist.slice(0, t.idx + 1); t.hist.push(url); t.idx = t.hist.length - 1; t.url = url; t.title = brHost(url); }
  const brTab = () => br.tabs[br.cur];
  function brHost(url) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch (_) { return url; } }
  function brNormalize(raw) {
    const input = String(raw || "").trim(); if (!input) return null;
    let url = input;
    if (!/^https?:\/\//i.test(url)) url = /^[^\s]+\.[a-z]{2,}(\/.*)?$/i.test(url) ? "https://" + url : "https://www.google.com/search?igu=1&q=" + encodeURIComponent(input);
    try {
      const u = new URL(url);
      if (!["http:", "https:"].includes(u.protocol)) return null;
      if (u.hostname === "en.wikipedia.org") u.hostname = "en.m.wikipedia.org";
      if (/(^|\.)google\.[a-z.]+$/.test(u.hostname) && (u.pathname === "/search" || u.pathname === "/") && !u.searchParams.has("igu")) u.searchParams.set("igu", "1");
      const yt = typeof extractYouTubeId === "function" ? extractYouTubeId(u.href) : "";
      if (yt) return "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(yt);
      return u.href;
    } catch (_) { return null; }
  }
  const brBlocked = (url) => { const h = brHost(url); return BLOCKED.some((b) => h === b || h.endsWith("." + b)); };

  APPS.browser = {
    title: "Browser",
    headHtml: () => `<header class="nx-head"><button class="nx-icon-btn" type="button" data-nx-back aria-label="Close browser">${ic("back", "lg")}</button>
      <form class="nx-address" data-br-form role="search"><span data-br-lock>${ic("lock", "sm")}</span><input name="q" type="text" inputmode="url" placeholder="Search or type a web address" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" aria-label="Address"></form>
      <button class="nx-icon-btn" type="button" data-br-reload aria-label="Reload">${ic("refresh")}</button></header>`,
    nav: [{ key: "back", label: "Back", icon: "arrowL", noSelect: true }, { key: "fwd", label: "Forward", icon: "arrowR", noSelect: true }, { key: "home", label: "Home", icon: "home", noSelect: true },
      { key: "tabs", label: "Tabs", badge: true, noSelect: true }, { key: "menu", label: "Menu", icon: "menu", noSelect: true }],
    html: () => `<div class="nx-progress" data-br-progress></div>
      <div class="nx-browser-home" data-br-home></div>
      <div class="nx-card nx-empty" data-br-blocked hidden style="margin:16px"></div>
      <iframe class="nx-browser-frame" data-br-frame title="Web page" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen; autoplay; encrypted-media; picture-in-picture; geolocation" sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads allow-presentation" hidden></iframe>
      <div class="nx-browser-bar" data-br-bar hidden><span>Page blank? Some sites don't allow other apps to show them.</span><button class="nx-btn sm ghost" type="button" data-br-outside>${ic("external", "sm")} Open</button></div>`,
    init(win) {
      win.classList.add("nx-browser");
      if (!br.tabs.length) brNewTab();
      const form = win.querySelector("[data-br-form]");
      form.addEventListener("submit", (e) => { e.preventDefault(); const u = brNormalize(form.q.value); if (!u) { toast(win, "Type a web address or search words"); return; } form.q.blur(); brGo(win, u); });
      form.q.addEventListener("focus", () => form.q.select());
      win.querySelector("[data-br-frame]").addEventListener("load", () => brProgress(win, false));
      win.addEventListener("click", (e) => {
        const sc = e.target.closest("[data-br-url]"); if (sc) { brGo(win, sc.dataset.brUrl); return; }
        if (e.target.closest("[data-br-reload]")) { const t = brTab(); if (t.url) brRender(win, true); return; }
        if (e.target.closest("[data-br-outside]")) { const t = brTab(); if (t.url) window.open(t.url.replace("igu=1&", "").replace("?igu=1", ""), "_blank", "noopener"); return; }
        const rmBm = e.target.closest("[data-br-rmbm]"); if (rmBm) { e.stopPropagation(); store.set("nexus-br-bookmarks", store.get("nexus-br-bookmarks", []).filter((b) => b.url !== rmBm.dataset.brRmbm)); brHome(win); return; }
      });
      brRender(win);
    },
    onNav(win, key) {
      const t = brTab();
      if (key === "back") { if (t.idx > 0) { t.idx--; t.url = t.hist[t.idx]; t.title = brHost(t.url); brRender(win); } else if (t.url) { t.url = null; t.idx = -1; brRender(win); } return; }
      if (key === "fwd") { if (t.idx < t.hist.length - 1) { t.idx++; t.url = t.hist[t.idx]; t.title = brHost(t.url); brRender(win); } return; }
      if (key === "home") { t.url = null; brRender(win); return; }
      if (key === "tabs") { brTabsSheet(win); return; }
      if (key === "menu") brMenu(win);
    }
  };
  function brGo(win, url) {
    const t = brTab(); brPush(t, url);
    const hist = store.get("nexus-br-history", []).filter((h) => h.url !== url);
    hist.unshift({ url, title: brHost(url), at: Date.now() }); store.set("nexus-br-history", hist.slice(0, 30));
    brRender(win);
  }
  function brProgress(win, on) {
    const p = win.querySelector("[data-br-progress]"); if (!p) return;
    if (on) { p.style.opacity = "1"; p.style.width = "8%"; requestAnimationFrame(() => (p.style.width = "70%")); }
    else { p.style.width = "100%"; setTimeout(() => { p.style.opacity = "0"; p.style.width = "0"; }, 300); }
  }
  function brRender(win, reload) {
    const t = brTab();
    const frame = win.querySelector("[data-br-frame]"), home = win.querySelector("[data-br-home]"), bar = win.querySelector("[data-br-bar]"), blocked = win.querySelector("[data-br-blocked]");
    const form = win.querySelector("[data-br-form]");
    win.querySelector('[data-badge="tabs"]').textContent = br.tabs.length;
    win.querySelector('[data-nx-nav="back"]').disabled = !t.url;
    win.querySelector('[data-nx-nav="fwd"]').disabled = t.idx >= t.hist.length - 1;
    if (!t.url) {
      frame.hidden = true; frame.removeAttribute("src"); bar.hidden = true; blocked.hidden = true; home.hidden = false; form.q.value = "";
      win.querySelector("[data-br-lock]").innerHTML = ic("search", "sm"); brHome(win); return;
    }
    home.hidden = true;
    form.q.value = t.url.startsWith("https://www.google.com/search") ? (new URL(t.url).searchParams.get("q") || t.url) : t.url.replace(/^https:\/\//, "");
    win.querySelector("[data-br-lock]").innerHTML = t.url.startsWith("https:") ? ic("lock", "sm") : ic("info", "sm");
    if (brBlocked(t.url)) {
      frame.hidden = true; frame.removeAttribute("src"); bar.hidden = true; blocked.hidden = false;
      blocked.innerHTML = `${ic("globe")}<strong>${esc(brHost(t.url))} opens outside Nexus</strong>This website doesn't allow other apps to show it.<br><br><button class="nx-btn" type="button" data-br-outside>${ic("external", "sm")} Open in your browser</button>`;
      return;
    }
    blocked.hidden = true; frame.hidden = false; bar.hidden = false;
    if (reload || frame.getAttribute("src") !== t.url) { brProgress(win, true); frame.src = t.url; }
  }
  function brHome(win) {
    const bms = store.get("nexus-br-bookmarks", []);
    win.querySelector("[data-br-home]").innerHTML = `
      <div class="nx-browser-logo"><span class="nx-tile t-blue" style="width:56px;height:56px;border-radius:17px">${ic("globe", "lg")}</span><b>Nexus <em>Browser</em></b></div>
      <form class="nx-search" data-br-home-form role="search"><span>${ic("search")}</span><input name="q" placeholder="Search Google or type a URL" autocomplete="off" enterkeyhint="search" aria-label="Search the web"></form>
      <div class="nx-shortcuts">${SHORTCUTS.map((s) => `<button type="button" class="nx-shortcut" data-br-url="${esc(s.url)}"><span class="nx-tile ${s.tile}">${s.icon ? ic(s.icon) : esc(s.glyph)}</span>${esc(s.name)}</button>`).join("")}</div>
      ${bms.length ? `<div class="nx-section-title">Bookmarks</div><div class="nx-list">${bms.map((b) => `<div class="nx-row" style="padding-right:4px"><button type="button" class="nx-row" style="padding:0;border:0;min-height:0;flex:1" data-br-url="${esc(b.url)}"><span class="nx-tile t-slate">${ic("bookmark", "sm")}</span><span class="nx-row-main"><strong>${esc(b.title)}</strong><span>${esc(brHost(b.url))}</span></span></button><button type="button" class="nx-del" data-br-rmbm="${esc(b.url)}" aria-label="Remove bookmark">${ic("x", "sm")}</button></div>`).join("")}</div>` : ""}`;
    const f = win.querySelector("[data-br-home-form]");
    f.addEventListener("submit", (e) => { e.preventDefault(); const u = brNormalize(f.q.value); if (u) brGo(win, u); });
  }
  function brTabsSheet(win) {
    const draw = (panel) => {
      panel.innerHTML = `<h3>${br.tabs.length} ${br.tabs.length === 1 ? "tab" : "tabs"}</h3><div class="nx-tabs-grid">${br.tabs.map((t, i) => `<div class="nx-tab-card${i === br.cur ? " is-current" : ""}" role="button" tabindex="0" data-br-tab="${i}"><strong>${esc(t.url ? t.title : "New tab")}</strong><span>${esc(t.url || "Nexus start page")}</span><button type="button" class="nx-tab-x" data-br-close="${i}" aria-label="Close tab">${ic("x", "sm")}</button></div>`).join("")}</div>
        <button class="nx-btn block" style="margin-top:14px" type="button" data-br-newtab>${ic("plus", "sm")} New tab</button>`;
    };
    openSheet(win, "", (panel) => {
      draw(panel);
      panel.addEventListener("click", (e) => {
        const c = e.target.closest("[data-br-close]");
        if (c) { e.stopPropagation(); br.tabs.splice(Number(c.dataset.brClose), 1); if (!br.tabs.length) brNewTab(); br.cur = Math.min(br.cur, br.tabs.length - 1); draw(panel); brRender(win); return; }
        const t = e.target.closest("[data-br-tab]"); if (t) { br.cur = Number(t.dataset.brTab); closeSheet(win); brRender(win); return; }
        if (e.target.closest("[data-br-newtab]")) { brNewTab(); closeSheet(win); brRender(win); win.querySelector("[data-br-form] input").focus(); }
      });
    });
  }
  function brMenu(win) {
    const t = brTab();
    const bms = store.get("nexus-br-bookmarks", []);
    const marked = t.url && bms.some((b) => b.url === t.url);
    const hist = store.get("nexus-br-history", []).slice(0, 8);
    openSheet(win, `<h3>Menu</h3><div class="nx-list">
      ${t.url ? `<button type="button" class="nx-row" data-m="bm"><span class="nx-tile t-yellow">${ic("star", "sm")}</span><span class="nx-row-main"><strong>${marked ? "Remove bookmark" : "Bookmark this page"}</strong></span></button>
      <button type="button" class="nx-row" data-m="copy"><span class="nx-tile t-blue">${ic("copy", "sm")}</span><span class="nx-row-main"><strong>Copy link</strong></span></button>
      <button type="button" class="nx-row" data-m="out"><span class="nx-tile t-green">${ic("external", "sm")}</span><span class="nx-row-main"><strong>Open in your phone's browser</strong></span></button>` : ""}
      <button type="button" class="nx-row" data-m="new"><span class="nx-tile t-violet">${ic("plus", "sm")}</span><span class="nx-row-main"><strong>New tab</strong></span></button></div>
      ${hist.length ? `<div class="nx-section-title">Recent <button type="button" data-m="clearhist">Clear</button></div><div class="nx-list">${hist.map((h) => `<button type="button" class="nx-row" data-br-url="${esc(h.url)}"><span class="nx-tile t-slate">${ic("history", "sm")}</span><span class="nx-row-main"><strong>${esc(h.title)}</strong><span>${esc(h.url)}</span></span></button>`).join("")}</div>` : ""}`, (panel) => {
      panel.addEventListener("click", async (e) => {
        const u = e.target.closest("[data-br-url]"); if (u) { closeSheet(win); brGo(win, u.dataset.brUrl); return; }
        const m = e.target.closest("[data-m]")?.dataset.m; if (!m) return;
        if (m === "bm") { store.set("nexus-br-bookmarks", marked ? bms.filter((b) => b.url !== t.url) : [{ url: t.url, title: t.title }, ...bms]); toast(win, marked ? "Bookmark removed" : "Bookmarked"); }
        if (m === "copy") { try { await navigator.clipboard.writeText(t.url); toast(win, "Link copied"); } catch (_) { toast(win, "Couldn't copy the link"); } }
        if (m === "out") window.open(t.url, "_blank", "noopener");
        if (m === "new") { brNewTab(); brRender(win); }
        if (m === "clearhist") { store.set("nexus-br-history", []); toast(win, "History cleared"); }
        closeSheet(win);
      });
    });
  }

  /* ================================================================== *
   * 5. CALCULATOR
   * ================================================================== */
  const calc = { expr: "", last: "", done: false, deg: true, base: 10, mode: "basic" };
  const BASES = [["HEX", 16], ["DEC", 10], ["OCT", 8], ["BIN", 2]];
  const CONVERT = {
    Length: { m: 1, mm: 0.001, cm: 0.01, km: 1000, inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.344 },
    Weight: { kg: 1, mg: 1e-6, g: 0.001, tonne: 1000, ounce: 0.028349523125, pound: 0.45359237 },
    Temperature: { "°C": "C", "°F": "F", K: "K" },
    Area: { "m²": 1, "cm²": 1e-4, "km²": 1e6, hectare: 1e4, acre: 4046.8564224, "sq ft": 0.09290304 },
    Speed: { "km/h": 1 / 3.6, "m/s": 1, mph: 0.44704, knot: 0.514444 },
    Data: { byte: 1, bit: 0.125, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4 },
    Time: { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, year: 31557600 }
  };
  APPS.calculator = {
    title: "Calculator",
    actions: `<button class="nx-icon-btn" type="button" data-calc-deg aria-label="Switch degrees or radians" style="width:auto;padding:0 10px;font-size:12px;font-weight:700">DEG</button>`,
    tabs: [{ key: "basic", label: "Basic" }, { key: "scientific", label: "Scientific" }, { key: "programmer", label: "Programmer" }],
    nav: [{ key: "calc", label: "Calculator", icon: "calc" }, { key: "history", label: "History", icon: "history" }, { key: "convert", label: "Converter", icon: "convert" }, { key: "graph", label: "Graph", icon: "chart" }],
    html: () => `
      <div data-view="calc" style="display:flex;flex-direction:column;flex:1">
        <div class="nx-calc-display" aria-live="polite"><div class="nx-calc-expr" data-calc-expr></div><div class="nx-calc-main" data-calc-main>0</div><div class="nx-calc-preview" data-calc-preview></div></div>
        <div class="nx-prog-rows" data-calc-prog hidden></div>
        <div class="nx-calc-keys sci" data-calc-sci hidden></div>
        <div class="nx-calc-keys" data-calc-keys></div>
      </div>
      <div data-view="history" hidden><div data-calc-history></div></div>
      <div data-view="convert" hidden><div data-calc-convert></div></div>
      <div data-view="graph" hidden><div data-calc-graph></div></div>`,
    init(win) {
      win.classList.add("nx-calculator");
      calcMode(win, calc.mode); selectTab(win, calc.mode); win.classList.toggle("is-prog", calc.mode === "programmer");
      win.addEventListener("click", (e) => {
        const k = e.target.closest("[data-k]"); if (k) { calcPress(win, k.dataset.k); return; }
        if (e.target.closest("[data-calc-deg]")) { calc.deg = !calc.deg; calcDraw(win); return; }
        const b = e.target.closest("[data-base]"); if (b) { calcSetBase(win, Number(b.dataset.base)); return; }
        const h = e.target.closest("[data-calc-reuse]"); if (h) { calc.expr = h.dataset.calcReuse; calc.done = false; selectNav(win, "calc"); showView(win, "calc"); win.querySelector(".nx-tabs").hidden = false; calcDraw(win); return; }
        if (e.target.closest("[data-calc-clearhist]")) { store.set("nexus-calc-history", []); calcHistory(win); }
      });
      win.addEventListener("keydown", (e) => {
        if (e.target.matches("input, select, textarea") || win.querySelector('[data-view="calc"]').hidden) return;
        const map = { Enter: "=", "=": "=", Backspace: "DEL", Escape: null, Delete: "AC", "*": "×", "/": "÷", "-": "−", x: "×" };
        let key = e.key in map ? map[e.key] : e.key;
        if (key === null) return;
        if (/^[0-9.+()%^!]$/.test(key) || ["×", "÷", "−", "=", "DEL", "AC"].includes(key) || (calc.mode === "programmer" && /^[a-fA-F]$/.test(key))) { e.preventDefault(); calcPress(win, key.toUpperCase?.() === key ? key : key.toUpperCase()); }
      });
      win.tabIndex = -1; win.focus({ preventScroll: true });
    },
    onTab(win, key) { calcMode(win, key); selectNav(win, "calc"); showView(win, "calc"); win.classList.toggle("is-prog", key === "programmer"); },
    onNav(win, key) {
      showView(win, key);
      win.querySelector(".nx-tabs").hidden = key !== "calc";
      if (key === "history") calcHistory(win);
      if (key === "convert") calcConvert(win);
      if (key === "graph") calcGraph(win);
    }
  };
  function calcMode(win, mode) {
    calc.mode = mode;
    if (mode !== "programmer") { calc.base = 10; }
    calc.expr = ""; calc.last = ""; calc.done = false;
    const keys = win.querySelector("[data-calc-keys]"), sci = win.querySelector("[data-calc-sci]"), prog = win.querySelector("[data-calc-prog]");
    win.querySelector("[data-calc-deg]").hidden = mode !== "scientific";
    const K = (k, cls = "", label = k) => `<button type="button" class="nx-ck ${cls}" data-k="${esc(k)}" aria-label="${esc(label === k ? k : label)}">${label}</button>`;
    sci.hidden = mode !== "scientific"; prog.hidden = mode !== "programmer";
    if (mode === "scientific") sci.innerHTML = [["sin(", "sin"], ["cos(", "cos"], ["tan(", "tan"], ["ln(", "ln"], ["log(", "log"], ["√(", "√"], ["^2", "x²"], ["^", "xʸ"], ["π", "π"], ["e", "e"], ["(", "("], [")", ")"], ["!", "n!"], ["1/", "1/x"], ["%", "%"]].map(([k, l]) => K(k, "fn", l)).join("");
    if (mode === "programmer") {
      keys.innerHTML = [K("A", "fn"), K("B", "fn"), K("C", "fn"), K("AC", "fn"), K("D", "fn"), K("E", "fn"), K("F", "fn"), K("DEL", "fn", "⌫"),
        K("7"), K("8"), K("9"), K("÷", "op"), K("4"), K("5"), K("6"), K("×", "op"), K("1"), K("2"), K("3"), K("−", "op"),
        K(" AND ", "fn", "AND"), K("0"), K(" OR ", "fn", "OR"), K("+", "op"), K(" XOR ", "fn", "XOR"), K("(", "fn"), K(")", "fn"), K("=", "eq")].join("");
      keys.querySelectorAll(".nx-ck").forEach((b) => (b.style.minHeight = "44px"));
    } else {
      keys.innerHTML = [K("AC", "fn"), K("DEL", "fn", "⌫"), K("%", "fn"), K("÷", "op"), K("7"), K("8"), K("9"), K("×", "op"), K("4"), K("5"), K("6"), K("−", "op"), K("1"), K("2"), K("3"), K("+", "op"), K("()", "fn", "( )"), K("0"), K("."), K("=", "eq")].join("");
      if (mode === "scientific") keys.querySelectorAll(".nx-ck").forEach((b) => (b.style.minHeight = "50px"));
    }
    calcDraw(win);
  }
  function calcEval(expr) {
    let e = expr.trim(); if (!e) return null;
    e = e.replace(/[+\-−×÷^]\s*$/, "").replace(/\b(AND|OR|XOR)\s*$/, "");
    const open = (e.match(/\(/g) || []).length - (e.match(/\)/g) || []).length;
    if (open > 0) e += ")".repeat(open);
    return MathEngine.evaluate(e, { deg: calc.deg, base: calc.base, int: calc.mode === "programmer" });
  }
  const toBase = (v, b) => (v < 0 ? "−" : "") + Math.trunc(Math.abs(v)).toString(b).toUpperCase();
  function calcPress(win, k) {
    const ops = ["+", "−", "×", "÷", "^", " AND ", " OR ", " XOR "];
    if (k === "AC") { calc.expr = ""; calc.last = ""; calc.done = false; }
    else if (k === "DEL") { calc.done = false; calc.expr = /\b(AND|OR|XOR) $/.test(calc.expr) ? calc.expr.replace(/ (AND|OR|XOR) $/, "") : /(sin|cos|tan|ln|log|√)\($/.test(calc.expr) ? calc.expr.replace(/(sin|cos|tan|ln|log|√)\($/, "") : calc.expr.slice(0, -1); }
    else if (k === "=") {
      try {
        const v = calcEval(calc.expr); if (v === null) return;
        const out = calc.mode === "programmer" ? toBase(v, calc.base).replace("−", "-") : MathEngine.format(v);
        const h = store.get("nexus-calc-history", []); h.unshift({ expr: calc.expr, result: out, at: Date.now() }); store.set("nexus-calc-history", h.slice(0, 60));
        calc.last = calc.expr + " ="; calc.expr = out.replace(/^-/, "−"); calc.done = true;
      } catch (err) { win.querySelector("[data-calc-preview]").textContent = err.message; return; }
    } else if (k === "()") {
      const open = (calc.expr.match(/\(/g) || []).length - (calc.expr.match(/\)/g) || []).length;
      const lastCh = calc.expr.slice(-1);
      calc.expr += open > 0 && /[0-9)πe!%]/.test(lastCh) ? ")" : "(";
      calc.done = false;
    } else {
      if (calc.done) { calc.done = false; if (!ops.includes(k) && k !== "%" && k !== "!" && k !== "^2") { calc.last = ""; calc.expr = ""; } }
      if (ops.includes(k)) {
        if (!calc.expr && k !== "−") return;
        if (ops.some((o) => calc.expr.endsWith(o))) calc.expr = calc.expr.replace(/(\+|−|×|÷|\^| AND | OR | XOR )$/, "");
      }
      if (k === "." ) { const seg = calc.expr.split(/[+−×÷^()]/).pop(); if (seg.includes(".")) return; if (!seg) k = "0."; }
      calc.expr += k;
    }
    calcDraw(win);
  }
  function calcDraw(win) {
    const main = win.querySelector("[data-calc-main]"), prev = win.querySelector("[data-calc-preview]"), ex = win.querySelector("[data-calc-expr]");
    const pretty = calc.expr.replace(/\*/g, "×");
    main.textContent = pretty || "0";
    main.classList.toggle("is-long", pretty.length > 12);
    ex.textContent = calc.last;
    const degBtn = win.querySelector("[data-calc-deg]"); if (degBtn) degBtn.textContent = calc.deg ? "DEG" : "RAD";
    let v = null;
    try { v = calc.done ? null : calcEval(calc.expr); } catch (_) { v = null; }
    prev.textContent = v === null || !/[+−×÷^!%(a-zπ√&|]|AND|OR|XOR/i.test(calc.expr) ? "" : "= " + (calc.mode === "programmer" ? toBase(v, calc.base) : MathEngine.format(v));
    if (calc.mode === "programmer") {
      let cur = 0; try { cur = calcEval(calc.expr) ?? 0; } catch (_) {}
      win.querySelector("[data-calc-prog]").innerHTML = BASES.map(([l, b]) => `<button type="button" class="nx-prog-row${b === calc.base ? " is-active" : ""}" data-base="${b}"><b>${l}</b><span>${toBase(cur, b)}</span></button>`).join("");
      const allowed = calc.base === 16 ? /[0-9A-F]/ : calc.base === 8 ? /[0-7]/ : calc.base === 2 ? /[01]/ : /[0-9]/;
      win.querySelectorAll("[data-calc-keys] [data-k]").forEach((b) => { if (/^[0-9A-F]$/.test(b.dataset.k)) b.disabled = !allowed.test(b.dataset.k); });
    }
  }
  function calcSetBase(win, b) {
    let cur = 0; try { cur = calcEval(calc.expr) ?? 0; } catch (_) {}
    calc.base = b; calc.expr = cur ? toBase(cur, b) : ""; calc.last = ""; calc.done = false; calcDraw(win);
  }
  function calcHistory(win) {
    const h = store.get("nexus-calc-history", []);
    win.querySelector("[data-calc-history]").innerHTML = h.length ? `<div class="nx-section-title" style="margin-top:4px">History <button type="button" data-calc-clearhist>Clear</button></div><div class="nx-list">${h.map((x) => `<button type="button" class="nx-row" data-calc-reuse="${esc(x.result)}" style="flex-direction:column;align-items:flex-end;gap:2px"><span style="font-size:13px;color:var(--nx-muted)">${esc(x.expr)} =</span><strong style="font-size:20px;font-weight:600">${esc(x.result)}</strong></button>`).join("")}</div><p class="nx-note">Tap a result to use it again.</p>` :
      `<div class="nx-empty">${ic("history")}<strong>No calculations yet</strong>Your results will be saved here.</div>`;
  }
  function calcConvert(win) {
    const box = win.querySelector("[data-calc-convert]");
    const st = store.get("nexus-calc-convert", { cat: "Length", from: "m", to: "foot", value: "1" });
    const draw = () => {
      const units = Object.keys(CONVERT[st.cat]);
      if (!units.includes(st.from)) st.from = units[0];
      if (!units.includes(st.to)) st.to = units[1];
      box.innerHTML = `<div class="nx-chips" style="padding-bottom:12px">${Object.keys(CONVERT).map((c) => `<button type="button" class="nx-chip${c === st.cat ? " is-active" : ""}" data-cv-cat="${c}">${c}</button>`).join("")}</div>
        <label class="nx-field">Value<input class="nx-input" data-cv-value inputmode="decimal" value="${esc(st.value)}" style="font-size:20px;height:52px"></label>
        <div class="nx-field-row" style="align-items:end"><label class="nx-field">From<select class="nx-select" data-cv-from>${units.map((u) => `<option${u === st.from ? " selected" : ""}>${esc(u)}</option>`).join("")}</select></label>
        <label class="nx-field">To<select class="nx-select" data-cv-to>${units.map((u) => `<option${u === st.to ? " selected" : ""}>${esc(u)}</option>`).join("")}</select></label></div>
        <button type="button" class="nx-btn ghost block" data-cv-swap style="margin-bottom:12px">${ic("swap", "sm")} Swap units</button>
        <div class="nx-convert-result"><small data-cv-label></small><strong data-cv-out>—</strong></div>`;
      compute();
    };
    const compute = () => {
      const raw = parseFloat(String(st.value).replace(/,/g, ""));
      const out = box.querySelector("[data-cv-out]"), label = box.querySelector("[data-cv-label]");
      label.textContent = `${st.value || 0} ${st.from} =`;
      if (!Number.isFinite(raw)) { out.textContent = "—"; return; }
      let r;
      if (st.cat === "Temperature") {
        const c = st.from === "°C" ? raw : st.from === "°F" ? (raw - 32) * 5 / 9 : raw - 273.15;
        r = st.to === "°C" ? c : st.to === "°F" ? c * 9 / 5 + 32 : c + 273.15;
      } else r = raw * CONVERT[st.cat][st.from] / CONVERT[st.cat][st.to];
      out.textContent = MathEngine.format(r) + " " + st.to;
      store.set("nexus-calc-convert", st);
    };
    draw();
    box.onclick = (e) => {
      const c = e.target.closest("[data-cv-cat]"); if (c) { st.cat = c.dataset.cvCat; st.from = ""; st.to = ""; draw(); return; }
      if (e.target.closest("[data-cv-swap]")) { [st.from, st.to] = [st.to, st.from]; draw(); }
    };
    box.oninput = (e) => { if (e.target.matches("[data-cv-value]")) { st.value = e.target.value; compute(); } };
    box.onchange = (e) => { if (e.target.matches("[data-cv-from]")) st.from = e.target.value; if (e.target.matches("[data-cv-to]")) st.to = e.target.value; compute(); };
  }
  function calcGraph(win) {
    const box = win.querySelector("[data-calc-graph]");
    const st = { fn: store.get("nexus-calc-graph", "sin(x)"), scale: 10 };
    box.innerHTML = `<form class="nx-search" data-g-form style="margin-top:2px"><span style="font-weight:700;color:var(--nx-accent);font-size:14px">y =</span><input name="fn" value="${esc(st.fn)}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Function of x"><button class="nx-btn sm" type="submit">Plot</button></form>
      <div class="nx-chips">${["sin(x)", "x^2", "2x+1", "cos(x)·x", "√x", "1/x", "x^3−3x"].map((f) => `<button type="button" class="nx-chip" data-g-preset="${esc(f)}">${esc(f)}</button>`).join("")}</div>
      <canvas class="nx-graph-canvas" data-g-canvas></canvas>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px"><span class="nx-note" style="margin:0" data-g-msg></span><span style="display:flex;gap:6px"><button type="button" class="nx-icon-btn" data-g-zoom="out" aria-label="Zoom out">${ic("zoomOut")}</button><button type="button" class="nx-icon-btn" data-g-zoom="in" aria-label="Zoom in">${ic("zoomIn")}</button></span></div>`;
    const canvas = box.querySelector("[data-g-canvas]"), msg = box.querySelector("[data-g-msg]");
    const draw = () => {
      const css = canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
      const W = Math.max(200, Math.round(css.width)), H = W;
      canvas.width = W * dpr; canvas.height = H * dpr;
      const ctx = canvas.getContext("2d"); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const light = document.body.classList.contains("light-mode");
      ctx.fillStyle = light ? "#ffffff" : "#020812"; ctx.fillRect(0, 0, W, H);
      const s = st.scale, px = (x) => (x + s) / (2 * s) * W, py = (y) => H - (y + s) / (2 * s) * H;
      const step = s <= 5 ? 1 : s <= 20 ? 2 : s <= 50 ? 5 : 10;
      ctx.lineWidth = 1; ctx.strokeStyle = light ? "#e3e9f3" : "#0f2140"; ctx.beginPath();
      for (let g = -Math.floor(s / step) * step; g <= s; g += step) { ctx.moveTo(px(g), 0); ctx.lineTo(px(g), H); ctx.moveTo(0, py(g)); ctx.lineTo(W, py(g)); }
      ctx.stroke();
      ctx.strokeStyle = light ? "#8193b0" : "#3a5a8a"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(px(0), 0); ctx.lineTo(px(0), H); ctx.moveTo(0, py(0)); ctx.lineTo(W, py(0)); ctx.stroke();
      ctx.fillStyle = light ? "#50627f" : "#5f7699"; ctx.font = "10px system-ui"; ctx.textAlign = "center";
      for (let g = -Math.floor(s / step) * step; g <= s; g += step) { if (g) { ctx.fillText(String(g), px(g), py(0) + 12); ctx.fillText(String(g), px(0) - 10, py(g) + 3); } }
      const expr = st.fn.replace(/·/g, "*").replace(/−/g, "-");
      let ok = false, err = "";
      ctx.strokeStyle = "#1e88ff"; ctx.lineWidth = 2.4; ctx.lineJoin = "round"; ctx.beginPath();
      let pen = false, prevY = null;
      for (let i = 0; i <= W * 2; i++) {
        const x = -s + (i / (W * 2)) * 2 * s; let y;
        try { y = MathEngine.evaluate(expr, { x, deg: false }); } catch (e) { err = e.message; break; }
        if (!Number.isFinite(y) || Math.abs(y) > s * 50 || (prevY !== null && Math.abs(y - prevY) > s * 4)) { pen = false; prevY = Number.isFinite(y) ? y : null; continue; }
        if (!pen) { ctx.moveTo(px(x), py(y)); pen = true; } else ctx.lineTo(px(x), py(y));
        ok = true; prevY = y;
      }
      ctx.stroke();
      msg.textContent = err ? err : ok ? `x from −${s} to ${s}` : "Nothing to draw in this range";
      msg.style.color = err ? "var(--nx-danger)" : "";
    };
    const form = box.querySelector("[data-g-form]");
    form.addEventListener("submit", (e) => { e.preventDefault(); st.fn = form.fn.value.trim() || "x"; store.set("nexus-calc-graph", st.fn); draw(); });
    box.onclick = (e) => {
      const p = e.target.closest("[data-g-preset]"); if (p) { st.fn = p.dataset.gPreset; form.fn.value = st.fn; store.set("nexus-calc-graph", st.fn); draw(); return; }
      const z = e.target.closest("[data-g-zoom]"); if (z) { st.scale = z.dataset.gZoom === "in" ? Math.max(1, st.scale / 2) : Math.min(200, st.scale * 2); draw(); }
    };
    requestAnimationFrame(draw);
  }

  /* ================================================================== *
   * 6. REMINDER (+ background checker that runs while Nexus is open)
   * ================================================================== */
  const REM_KEY = "nexus-reminders-v2";
  function remLoad() {
    let list = store.get(REM_KEY, null);
    if (!Array.isArray(list)) {
      const old = store.get("nexus-reminders", []);
      list = (Array.isArray(old) ? old : []).map((o) => ({ id: uid(), text: String(o.text || "Reminder"), time: new Date(o.time).getTime() || Date.now(), done: false, notified: new Date(o.time).getTime() < Date.now(), repeat: "none" }));
      store.set(REM_KEY, list);
    }
    return list;
  }
  const remSave = (l) => store.set(REM_KEY, l);
  const dayStart = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  function remWhen(t) {
    const d = new Date(t), today = dayStart(Date.now()), day = dayStart(t), diff = Math.round((day - today) / 86400000);
    const label = diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff === -1 ? "Yesterday" : Math.abs(diff) < 7 && diff > 0 ? d.toLocaleDateString([], { weekday: "long" }) : d.toLocaleDateString([], { day: "numeric", month: "short", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
    return label + ", " + timeStr(t);
  }
  async function remNotify(r) {
    const title = "Reminder";
    const body = r.text;
    showBanner(r);
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      const reg = await navigator.serviceWorker?.getRegistration?.();
      if (reg?.showNotification) await reg.showNotification(title, { body, icon: "./icon.svg", badge: "./icon.svg", tag: r.id });
      else new Notification(title, { body, icon: "./icon.svg", tag: r.id });
    } catch (_) {}
  }
  function showBanner(r) {
    document.querySelector(".nx-banner")?.remove();
    const b = document.createElement("div");
    b.className = "nx-banner"; b.setAttribute("role", "alert");
    b.innerHTML = `<span class="nx-banner-ic">${ic("bell")}</span><span><b>Reminder</b><span>${esc(r.text)}</span></span><button type="button" aria-label="Dismiss">${ic("x", "sm")}</button>`;
    b.querySelector("button").addEventListener("click", () => b.remove());
    b.addEventListener("click", (e) => { if (!e.target.closest("button")) { b.remove(); window.openApp("reminder"); } });
    document.body.append(b);
    try { navigator.vibrate?.([120, 60, 120]); } catch (_) {}
    setTimeout(() => b.remove(), 12000);
  }
  function remCheck() {
    const list = remLoad(); const now = Date.now(); let changed = false;
    list.forEach((r) => {
      if (r.done || r.notified || r.time > now) return;
      if (now - r.time < 12 * 3600e3) remNotify(r);
      changed = true;
      if (r.repeat === "daily" || r.repeat === "weekly") {
        const step = r.repeat === "daily" ? 86400000 : 604800000;
        while (r.time <= now) r.time += step;
        r.notified = false;
      } else r.notified = true;
    });
    if (changed) { remSave(list); const w = document.querySelector("#app-layer .nx-reminder"); if (w) remRender(w); }
  }
  setInterval(remCheck, 15000);
  setTimeout(remCheck, 2500);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) remCheck(); });
  const remState = { filter: "all", view: "home", calMonth: null, calSel: null, showDone: false };

  APPS.reminder = {
    title: "Reminder",
    actions: `<button class="nx-icon-btn" type="button" data-rem-new aria-label="New reminder">${ic("plus")}</button>`,
    tabs: [{ key: "all", label: "All" }, { key: "today", label: "Today" }, { key: "upcoming", label: "Upcoming" }],
    nav: [{ key: "home", label: "Home", icon: "home" }, { key: "calendar", label: "Calendar", icon: "calendar" }, { key: "more", label: "More", icon: "more" }],
    html: () => `
      <div data-view="home"><button type="button" class="nx-rem-add" data-rem-new>${ic("plus")} Add a reminder…</button><div data-rem-list></div></div>
      <div data-view="calendar" hidden><div data-rem-cal></div></div>
      <div data-view="more" hidden><div data-rem-more></div></div>
      <button class="nx-fab" type="button" data-rem-new aria-label="New reminder">${ic("plus")}</button>`,
    init(win) {
      win.classList.add("nx-reminder");
      remState.view = "home"; remState.filter = "all";
      win.addEventListener("click", (e) => {
        if (e.target.closest("[data-rem-new]")) { remSheet(win, null, remState.view === "calendar" ? remState.calSel : null); return; }
        const chk = e.target.closest("[data-rem-check]");
        if (chk) { const l = remLoad(); const r = l.find((x) => x.id === chk.dataset.remCheck); if (r) { r.done = !r.done; remSave(l); remRender(win); if (r.done) toast(win, "Marked as done"); } return; }
        const del = e.target.closest("[data-rem-del]");
        if (del) { remSave(remLoad().filter((x) => x.id !== del.dataset.remDel)); remRender(win); toast(win, "Reminder deleted"); return; }
        const ed = e.target.closest("[data-rem-edit]"); if (ed) { remSheet(win, ed.dataset.remEdit); return; }
        if (e.target.closest("[data-rem-toggle-done]")) { remState.showDone = !remState.showDone; remRender(win); return; }
        const day = e.target.closest("[data-cal-day]"); if (day) { remState.calSel = Number(day.dataset.calDay); remRender(win); return; }
        const mv = e.target.closest("[data-cal-move]"); if (mv) { const d = new Date(remState.calMonth); d.setMonth(d.getMonth() + Number(mv.dataset.calMove)); remState.calMonth = d.getTime(); remRender(win); return; }
        if (e.target.closest("[data-rem-perm]")) { Notification.requestPermission?.().then(() => remRender(win)); return; }
        if (e.target.closest("[data-rem-test]")) { remNotify({ id: "test", text: "This is how your reminders will look." }); return; }
        if (e.target.closest("[data-rem-cleardone]")) { remSave(remLoad().filter((x) => !x.done)); remRender(win); toast(win, "Completed reminders cleared"); }
      });
      remRender(win);
    },
    onTab(win, key) { remState.filter = key; remState.view = "home"; selectNav(win, "home"); showView(win, "home"); remRender(win); },
    onNav(win, key) { remState.view = key; showView(win, key); win.querySelector(".nx-tabs").hidden = key !== "home"; remRender(win); }
  };
  function remItem(r) {
    const overdue = !r.done && r.time < Date.now();
    return `<div class="nx-rem-item${r.done ? " is-done" : ""}"><button type="button" class="nx-check" role="checkbox" aria-checked="${r.done}" aria-label="Mark “${esc(r.text)}” done" data-rem-check="${r.id}">${ic("check")}</button>
      <button type="button" class="nx-row-main" style="border:0;background:none;padding:0;text-align:left;color:inherit" data-rem-edit="${r.id}"><strong>${esc(r.text)}</strong><span class="when${overdue ? " overdue" : ""}">${ic("clock")}${remWhen(r.time)}${r.repeat !== "none" ? " · " + (r.repeat === "daily" ? "Every day" : "Every week") : ""}</span></button>
      <button type="button" class="nx-del" data-rem-del="${r.id}" aria-label="Delete reminder">${ic("trash", "sm")}</button></div>`;
  }
  function remRender(win) {
    const list = remLoad().sort((a, b) => a.time - b.time);
    if (remState.view === "home") {
      const today = dayStart(Date.now()), tomorrow = today + 86400000;
      const open = list.filter((r) => !r.done);
      let shown = open;
      if (remState.filter === "today") shown = open.filter((r) => r.time < tomorrow);
      if (remState.filter === "upcoming") shown = open.filter((r) => r.time >= tomorrow);
      const done = list.filter((r) => r.done);
      const empty = { all: ["Nothing to remember", "Tap + to add your first reminder."], today: ["All clear for today", "Nothing due today."], upcoming: ["Nothing coming up", "Reminders after today show here."] }[remState.filter];
      win.querySelector("[data-rem-list]").innerHTML = (shown.length ? `<div class="nx-list">${shown.map(remItem).join("")}</div>` : `<div class="nx-card nx-empty">${ic("bell")}<strong>${empty[0]}</strong>${empty[1]}</div>`) +
        (remState.filter === "all" && done.length ? `<div class="nx-section-title"><span>Completed · ${done.length}</span><button type="button" data-rem-toggle-done>${remState.showDone ? "Hide" : "Show"}</button></div>${remState.showDone ? `<div class="nx-list">${done.map(remItem).join("")}</div>` : ""}` : "");
    }
    if (remState.view === "calendar") {
      if (!remState.calMonth) { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); remState.calMonth = d.getTime(); }
      if (!remState.calSel) remState.calSel = dayStart(Date.now());
      const m = new Date(remState.calMonth), y = m.getFullYear(), mo = m.getMonth();
      const first = new Date(y, mo, 1).getDay(), days = new Date(y, mo + 1, 0).getDate();
      const marks = new Set(list.filter((r) => !r.done).map((r) => dayStart(r.time)));
      const today = dayStart(Date.now());
      let cells = ""; for (let i = 0; i < first; i++) cells += `<span class="nx-cal-day is-out"></span>`;
      for (let d = 1; d <= days; d++) { const t = new Date(y, mo, d).getTime(); cells += `<button type="button" class="nx-cal-day${t === today ? " is-today" : ""}${t === remState.calSel ? " is-sel" : ""}${marks.has(t) ? " has" : ""}" data-cal-day="${t}" aria-label="${new Date(t).toDateString()}">${d}</button>`; }
      const sel = list.filter((r) => dayStart(r.time) === remState.calSel);
      win.querySelector("[data-rem-cal]").innerHTML = `<div class="nx-card nx-cal"><div class="nx-cal-head"><button type="button" class="nx-icon-btn" data-cal-move="-1" aria-label="Previous month">${ic("back")}</button><strong>${m.toLocaleDateString([], { month: "long", year: "numeric" })}</strong><button type="button" class="nx-icon-btn" data-cal-move="1" aria-label="Next month">${ic("chev")}</button></div>
        <div class="nx-cal-grid">${["S", "M", "T", "W", "T", "F", "S"].map((d) => `<span class="dow">${d}</span>`).join("")}${cells}</div></div>
        <div class="nx-section-title">${new Date(remState.calSel).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })}</div>
        ${sel.length ? `<div class="nx-list">${sel.map(remItem).join("")}</div>` : `<div class="nx-card nx-empty">No reminders on this day.<br><br><button type="button" class="nx-btn sm" data-rem-new>${ic("plus", "sm")} Add one</button></div>`}`;
    }
    if (remState.view === "more") {
      const perm = "Notification" in window ? Notification.permission : "unsupported";
      const pill = perm === "granted" ? `<span class="nx-pill ok">On</span>` : perm === "denied" ? `<span class="nx-pill bad">Blocked</span>` : perm === "unsupported" ? `<span class="nx-pill">Not supported</span>` : `<span class="nx-pill warn">Off</span>`;
      const open = list.filter((r) => !r.done).length, done = list.length - open;
      win.querySelector("[data-rem-more]").innerHTML = `<div class="nx-list">
        <div class="nx-row"><span class="nx-tile t-orange">${ic("bell")}</span><span class="nx-row-main"><strong>Phone notifications</strong><span>${perm === "denied" ? "Turn on in your browser's site settings" : "Alerts even when you're in another app"}</span></span>${pill}</div>
        ${perm === "default" ? `<div class="nx-row"><button type="button" class="nx-btn block" data-rem-perm>Allow notifications</button></div>` : ""}
        <button type="button" class="nx-row" data-rem-test><span class="nx-tile t-blue">${ic("play", "sm")}</span><span class="nx-row-main"><strong>Test a reminder</strong><span>Shows a sample alert now</span></span></button>
        <div class="nx-row"><span class="nx-tile t-green">${ic("check")}</span><span class="nx-row-main"><strong>${open} active · ${done} completed</strong></span></div>
        ${done ? `<button type="button" class="nx-row" data-rem-cleardone><span class="nx-tile t-red">${ic("trash", "sm")}</span><span class="nx-row-main"><strong>Clear completed</strong></span></button>` : ""}</div>
        <p class="nx-note">Reminders ring while Nexus OS is open in a tab. Install Nexus to your home screen for the best results.</p>`;
    }
  }
  function remSheet(win, editId, presetDay) {
    const list = remLoad(); const r = editId ? list.find((x) => x.id === editId) : null;
    let t = r ? new Date(r.time) : new Date(Date.now() + 3600000);
    if (!r) { t.setMinutes(0, 0, 0); if (presetDay && presetDay > dayStart(Date.now())) { const p = new Date(presetDay); p.setHours(9, 0, 0, 0); t = p; } }
    const pad = (n) => String(n).padStart(2, "0");
    const dateVal = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`, timeVal = `${pad(t.getHours())}:${pad(t.getMinutes())}`;
    let repeat = r?.repeat || "none";
    openSheet(win, `<h3>${r ? "Edit reminder" : "New reminder"}</h3><form data-rem-form>
      <label class="nx-field">What should I remind you about?<input class="nx-input" name="text" required maxlength="120" value="${esc(r?.text || "")}" placeholder="e.g. Study for exam"></label>
      ${r ? "" : `<div class="nx-chips" style="padding-bottom:12px">${[["1h", "In 1 hour"], ["tonight", "Tonight 8 PM"], ["tomorrow", "Tomorrow 9 AM"]].map(([k, l]) => `<button type="button" class="nx-chip" data-quick="${k}">${l}</button>`).join("")}</div>`}
      <div class="nx-field-row"><label class="nx-field">Date<input class="nx-input" type="date" name="date" required value="${dateVal}"></label><label class="nx-field">Time<input class="nx-input" type="time" name="time" required value="${timeVal}"></label></div>
      <div class="nx-field">Repeat<div class="nx-seg">${[["none", "Never"], ["daily", "Daily"], ["weekly", "Weekly"]].map(([k, l]) => `<button type="button" class="${k === repeat ? "is-active" : ""}" data-repeat="${k}">${l}</button>`).join("")}</div></div>
      <button class="nx-btn block" type="submit">${r ? "Save changes" : "Add reminder"}</button></form>`, (panel) => {
      const f = panel.querySelector("[data-rem-form]");
      if (!r) setTimeout(() => f.text.focus(), 60);
      panel.addEventListener("click", (e) => {
        const rp = e.target.closest("[data-repeat]"); if (rp) { repeat = rp.dataset.repeat; panel.querySelectorAll("[data-repeat]").forEach((b) => b.classList.toggle("is-active", b === rp)); }
        const q = e.target.closest("[data-quick]");
        if (q) {
          const d = new Date();
          if (q.dataset.quick === "1h") d.setTime(Date.now() + 3600000);
          if (q.dataset.quick === "tonight") { d.setHours(20, 0, 0, 0); if (d < new Date()) d.setDate(d.getDate() + 1); }
          if (q.dataset.quick === "tomorrow") { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); }
          f.date.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; f.time.value = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
          panel.querySelectorAll("[data-quick]").forEach((b) => b.classList.toggle("is-active", b === q));
        }
      });
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const time = new Date(f.date.value + "T" + f.time.value).getTime();
        if (!Number.isFinite(time)) { toast(win, "Pick a valid date and time"); return; }
        const l = remLoad();
        if (r) { const x = l.find((y) => y.id === r.id); Object.assign(x, { text: f.text.value.trim(), time, repeat, notified: time <= Date.now() && repeat === "none" ? x.notified : false }); }
        else l.push({ id: uid(), text: f.text.value.trim(), time, done: false, notified: false, repeat });
        remSave(l); closeSheet(win); remRender(win);
        toast(win, r ? "Reminder updated" : "Reminder set for " + remWhen(time));
        if (!r && "Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
      });
    });
  }

  /* ================================================================== *
   * 7. WEATHER (Open-Meteo, no key needed)
   * ================================================================== */
  function wxIcon(code, day = 1) {
    if (code === 0) return [day ? "☀️" : "🌙", "Clear"];
    if (code === 1) return [day ? "🌤️" : "🌙", "Mainly clear"];
    if (code === 2) return [day ? "⛅" : "☁️", "Partly cloudy"];
    if (code === 3) return ["☁️", "Cloudy"];
    if (code === 45 || code === 48) return ["🌫️", "Fog"];
    if ([51, 53, 55].includes(code)) return ["🌦️", "Drizzle"];
    if ([56, 57, 66, 67].includes(code)) return ["🌧️", "Freezing rain"];
    if (code === 61 || code === 63) return ["🌧️", "Rain"];
    if (code === 65) return ["🌧️", "Heavy rain"];
    if ([71, 73, 75, 77].includes(code)) return ["❄️", "Snow"];
    if (code === 80 || code === 81) return [day ? "🌦️" : "🌧️", "Showers"];
    if (code === 82) return ["⛈️", "Heavy showers"];
    if (code === 85 || code === 86) return ["🌨️", "Snow showers"];
    if (code === 95) return ["⛈️", "Thunderstorm"];
    if (code === 96 || code === 99) return ["⛈️", "Thunderstorm, hail"];
    return ["🌥️", "Mixed"];
  }
  const wx = { place: null, data: null };
  APPS.weather = {
    title: "Weather",
    actions: `<button class="nx-icon-btn" type="button" data-wx-locate aria-label="Use my location">${ic("locate")}</button><button class="nx-icon-btn" type="button" data-wx-search aria-label="Change city">${ic("search")}</button>`,
    nav: [{ key: "today", label: "Today", icon: "sun" }, { key: "hourly", label: "Hourly", icon: "clock" }, { key: "week", label: "7 Days", icon: "calendar" }],
    html: () => `<form class="nx-search" data-wx-form hidden role="search"><span>${ic("search")}</span><input name="city" placeholder="Search a city, e.g. Tiruppur" autocomplete="off" enterkeyhint="search" aria-label="City"></form>
      <div data-wx-results></div>
      <div data-view="today"><div data-wx-today>${'<div class="nx-skel" style="height:190px;border-radius:18px"></div><div class="nx-wx-stats">' + '<div class="nx-skel" style="height:74px"></div>'.repeat(3) + '</div><div class="nx-skel" style="height:110px;margin-top:12px"></div>'}</div></div>
      <div data-view="hourly" hidden><div data-wx-hourly></div></div>
      <div data-view="week" hidden><div data-wx-week></div></div>
      <p class="nx-note" data-wx-updated></p>`,
    init(win) {
      const form = win.querySelector("[data-wx-form]");
      form.addEventListener("submit", (e) => { e.preventDefault(); wxSearch(win, form.city.value.trim()); });
      win.addEventListener("click", (e) => {
        if (e.target.closest("[data-wx-search]")) { form.hidden = !form.hidden; win.querySelector("[data-wx-results]").innerHTML = ""; if (!form.hidden) form.city.focus(); return; }
        if (e.target.closest("[data-wx-locate]")) { wxLocate(win); return; }
        const p = e.target.closest("[data-wx-place]"); if (p) { wx.place = JSON.parse(p.dataset.wxPlace); store.set("nexus-weather-place", wx.place); form.hidden = true; form.city.value = ""; win.querySelector("[data-wx-results]").innerHTML = ""; wxLoad(win); return; }
        if (e.target.closest("[data-wx-retry]")) wxLoad(win);
      });
      wx.place = store.get("nexus-weather-place", null) || { name: "Chennai", country: "India", admin: "Tamil Nadu", lat: 13.0878, lon: 80.2785 };
      const cache = store.get("nexus-weather-cache", null);
      if (cache && cache.place?.name === wx.place.name) { wx.data = cache.data; wxRender(win, cache.at); }
      wxLoad(win);
    }
  };
  async function wxSearch(win, q) {
    const box = win.querySelector("[data-wx-results]"); if (!q) return;
    box.innerHTML = `<div class="nx-skel" style="height:54px;margin-bottom:12px"></div>`;
    try {
      const r = await fetch("https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name=" + encodeURIComponent(q));
      const d = await r.json();
      if (!d.results?.length) { box.innerHTML = `<div class="nx-error" style="margin-bottom:12px">No city called “${esc(q)}”. Check the spelling.</div>`; return; }
      box.innerHTML = `<div class="nx-list" style="margin-bottom:12px">${d.results.map((p) => { const place = { name: p.name, country: p.country || "", admin: p.admin1 || "", lat: p.latitude, lon: p.longitude };
        return `<button type="button" class="nx-row" data-wx-place="${esc(JSON.stringify(place))}"><span class="nx-tile t-sky">${ic("pin", "sm")}</span><span class="nx-row-main"><strong>${esc(p.name)}</strong><span>${esc([p.admin1, p.country].filter(Boolean).join(", "))}</span></span></button>`; }).join("")}</div>`;
    } catch (_) { box.innerHTML = `<div class="nx-error" style="margin-bottom:12px">Couldn't search right now. Check your internet.</div>`; }
  }
  function wxLocate(win) {
    if (!navigator.geolocation) { toast(win, "Location isn't available on this device"); return; }
    toast(win, "Finding your location…");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      let name = "My location", admin = "", country = "";
      try {
        const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        const d = await r.json(); name = d.city || d.locality || name; admin = d.principalSubdivision || ""; country = d.countryName || "";
      } catch (_) {}
      wx.place = { name, admin, country, lat, lon, gps: true }; store.set("nexus-weather-place", wx.place); wxLoad(win);
    }, () => toast(win, "Location permission was not given"), { timeout: 12000, maximumAge: 600000 });
  }
  async function wxLoad(win) {
    const p = wx.place;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day,precipitation&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max&forecast_days=7&timezone=auto`;
    try {
      const r = await fetch(url); if (!r.ok) throw new Error("Weather service is busy. Try again in a minute.");
      wx.data = await r.json();
      store.set("nexus-weather-cache", { at: Date.now(), place: p, data: wx.data });
      if (win.isConnected) wxRender(win, Date.now());
      wxHome();
    } catch (err) {
      if (!wx.data && win.isConnected) win.querySelector("[data-wx-today]").innerHTML = `<div class="nx-error">${esc(err.message === "Failed to fetch" ? "Couldn't load the weather. Check your internet." : err.message)}</div><button class="nx-btn ghost block" style="margin-top:10px" type="button" data-wx-retry>${ic("refresh", "sm")} Try again</button>`;
      else if (win.isConnected) toast(win, "Showing saved weather — couldn't refresh");
    }
  }
  function wxHours(d, count) {
    const now = Date.now(); const out = [];
    for (let i = 0; i < d.hourly.time.length && out.length < count; i++) {
      const t = new Date(d.hourly.time[i]).getTime();
      if (t + 3600000 <= now) continue;
      out.push({ t, temp: d.hourly.temperature_2m[i], code: d.hourly.weather_code[i], rain: d.hourly.precipitation_probability[i], wind: d.hourly.wind_speed_10m[i], day: d.hourly.is_day[i] });
    }
    return out;
  }
  function wxRender(win, at) {
    const d = wx.data, p = wx.place; if (!d?.current) return;
    const c = d.current, [icon, cond] = wxIcon(c.weather_code, c.is_day);    const hi = Math.round(d.daily.temperature_2m_max[0]), lo = Math.round(d.daily.temperature_2m_min[0]);
    const rainToday = d.daily.precipitation_probability_max?.[0];
    const hours = wxHours(d, 24);
    const hourLabel = (t) => new Date(t).toLocaleTimeString([], { hour: "numeric" });
    const days = d.daily.time.map((t, i) => ({ t: new Date(t + "T12:00").getTime(), code: d.daily.weather_code[i], hi: d.daily.temperature_2m_max[i], lo: d.daily.temperature_2m_min[i], rain: d.daily.precipitation_probability_max?.[i], rise: d.daily.sunrise?.[i], set: d.daily.sunset?.[i], uv: d.daily.uv_index_max?.[i] }));
    const wMin = Math.min(...days.map((x) => x.lo)), wMax = Math.max(...days.map((x) => x.hi)), span = Math.max(1, wMax - wMin);
    const dayName = (x, i) => i === 0 ? "Today" : new Date(x.t).toLocaleDateString([], { weekday: "short" });
    const dayRow = (x, i, detail) => `<div class="nx-wx-day"><span>${dayName(x, i)}</span><i>${wxIcon(x.code)[0]}</i><small>${x.rain >= 10 ? x.rain + "%" : ""}</small>
      <div class="nx-wx-range"><span class="lo">${Math.round(x.lo)}°</span><span class="track"><i style="left:${((x.lo - wMin) / span) * 100}%;right:${100 - ((x.hi - wMin) / span) * 100}%"></i></span><span class="hi">${Math.round(x.hi)}°</span></div>
      ${detail ? `<span style="grid-column:2/-1;font-size:11.5px;color:var(--nx-muted);margin-top:-4px">${wxIcon(x.code)[1]}${x.uv != null ? " · UV " + Math.round(x.uv) : ""}${x.rise ? " · Sunrise " + timeStr(x.rise) : ""}</span>` : ""}</div>`;
    const stat = (icn, val, label) => `<div class="nx-wx-stat">${ic(icn)}<b>${val}</b><span>${label}</span></div>`;

    win.querySelector("[data-wx-today]").innerHTML = `
      <div class="nx-wx-hero">
        <div class="nx-wx-place">${ic("pin")}${esc(p.name)}${p.admin ? `<span style="color:var(--nx-muted);font-weight:500">· ${esc(p.admin)}</span>` : ""}</div>
        <div class="nx-wx-now"><div><div class="nx-wx-temp">${Math.round(c.temperature_2m)}<sup>°C</sup></div><div class="nx-wx-cond">${cond}</div>
          <div class="nx-wx-hl">H: ${hi}° · L: ${lo}° · Feels like ${Math.round(c.apparent_temperature)}°</div></div><div class="nx-wx-icon" aria-hidden="true">${icon}</div></div>
      </div>
      <div class="nx-wx-stats">${stat("wind", Math.round(c.wind_speed_10m) + " km/h", "Wind")}${stat("droplet", c.relative_humidity_2m + "%", "Humidity")}${stat("umbrella", (rainToday ?? "—") + "%", "Rain chance")}</div>
      <div class="nx-section-title">Next hours <button type="button" data-goto="hourly">See all</button></div>
      <div class="nx-card nx-wx-hours">${hours.slice(0, 12).map((h, i) => `<div class="nx-wx-hour${i === 0 ? " is-now" : ""}"><span>${i === 0 ? "Now" : hourLabel(h.t)}</span><i>${wxIcon(h.code, h.day)[0]}</i><b>${Math.round(h.temp)}°</b>${h.rain >= 20 ? `<small>${h.rain}%</small>` : ""}</div>`).join("")}</div>
      <div class="nx-section-title">7-day forecast <button type="button" data-goto="week">Details</button></div>
      <div class="nx-card">${days.map((x, i) => dayRow(x, i, false)).join("")}</div>
      <div class="nx-wx-stats">${stat("sun", days[0].rise ? timeStr(days[0].rise) : "—", "Sunrise")}${stat("moon", days[0].set ? timeStr(days[0].set) : "—", "Sunset")}${stat("thermo", days[0].uv != null ? Math.round(days[0].uv) : "—", "UV index")}</div>`;
    win.querySelector("[data-wx-hourly]").innerHTML = `<div class="nx-section-title">Next 24 hours <small>${esc(p.name)}</small></div><div class="nx-card">${hours.map((h, i) => {
      const [hi2, cd] = wxIcon(h.code, h.day);
      return `<div class="nx-wx-hrow"><b style="font-size:13px">${i === 0 ? "Now" : hourLabel(h.t)}</b><i>${hi2}</i><span>${cd}${h.rain != null ? " · " + h.rain + "% rain" : ""} · ${Math.round(h.wind)} km/h</span><b>${Math.round(h.temp)}°</b></div>`;
    }).join("")}</div>`;
    win.querySelector("[data-wx-week]").innerHTML = `<div class="nx-section-title">7-day forecast <small>${esc(p.name)}</small></div><div class="nx-card">${days.map((x, i) => dayRow(x, i, true)).join("")}</div>`;
    const up = win.querySelector("[data-wx-updated]");
    if (up) up.innerHTML = `Updated ${timeStr(at || Date.now())} · Weather data from <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>`;
  }
  function wxHome() {
    const d = wx.data, p = wx.place; if (!d?.current) return;
    const [icon, cond] = wxIcon(d.current.weather_code, d.current.is_day);
    const set = (sel, txt) => { const el = document.querySelector(sel); if (el) el.textContent = txt; };
    set("#hero-temp", Math.round(d.current.temperature_2m) + "°C");
    set("#hero-condition", cond);
    set(".hero-weather-icon", icon);
    const hl = document.querySelectorAll(".hero-high-low span");
    if (hl[0]) hl[0].textContent = "H: " + Math.round(d.daily.temperature_2m_max[0]) + "°";
    if (hl[1]) hl[1].textContent = "L: " + Math.round(d.daily.temperature_2m_min[0]) + "°";
    const loc = document.querySelector(".hero-weather-copy small"); if (loc) loc.textContent = "📍 " + p.name;
    set("#weather-summary", Math.round(d.current.temperature_2m) + "°C · " + cond);
    set("#weather-detail", p.name + " · Wind " + Math.round(d.current.wind_speed_10m) + " km/h");
  }
  {
    const baseInit = APPS.weather.init;
    APPS.weather.init = function (win) {
      win.addEventListener("click", (e) => { const g = e.target.closest("[data-goto]"); if (g) { selectNav(win, g.dataset.goto); showView(win, g.dataset.goto); } });
      baseInit.call(this, win);
    };
    // Show saved weather on the home screen right away, then refresh it quietly.
    const cache = store.get("nexus-weather-cache", null);
    wx.place = store.get("nexus-weather-place", null) || { name: "Chennai", country: "India", admin: "Tamil Nadu", lat: 13.0878, lon: 80.2785 };
    if (cache?.data && cache.place?.name === wx.place.name) { wx.data = cache.data; setTimeout(wxHome, 0); }
    if (!cache || Date.now() - cache.at > 30 * 60000) {
      setTimeout(() => wxLoad({ isConnected: false, querySelector: () => null }), 1200);
    }
  }

  /* ================================================================== *
   * 8. SETTINGS
   * ================================================================== */
  const SET_ROWS = [
    { key: "wifi", label: "Wi-Fi", icon: "wifi", tile: "t-blue", group: "Connections", words: "internet network online" },
    { key: "bluetooth", label: "Bluetooth", icon: "bluetooth", tile: "t-indigo", group: "Connections", words: "devices pair" },
    { key: "data", label: "Mobile data", icon: "signal", tile: "t-green", group: "Connections", words: "network 4g 5g data saver" },
    { key: "display", label: "Display", icon: "sun", tile: "t-orange", group: "Device", words: "dark light theme brightness colour color accent" },
    { key: "sound", label: "Sound", icon: "volume", tile: "t-pink", group: "Device", words: "volume click vibration" },
    { key: "battery", label: "Battery", icon: "battery", tile: "t-green", group: "Device", words: "charge power" },
    { key: "storage", label: "Storage", icon: "drive", tile: "t-sky", group: "Device", words: "space files memory" },
    { key: "apps", label: "Apps", icon: "grid", tile: "t-violet", group: "Device", words: "applications" },
    { key: "notifications", label: "Notifications", icon: "bell", tile: "t-red", group: "Privacy", words: "alerts reminders" },
    { key: "security", label: "Privacy & security", icon: "shield", tile: "t-teal", group: "Privacy", words: "permissions camera microphone location" },
    { key: "about", label: "About Nexus OS", icon: "info", tile: "t-slate", group: "System", words: "version name device" }
  ];
  const ACCENTS = ["#1e88ff", "#7c5cff", "#14b8a6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899"];
  const setState = { detail: null, battery: null };
  const conn = () => navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  const isDark = () => !document.body.classList.contains("light-mode");
  function applyAccent(color) {
    document.documentElement.style.setProperty("--nx-user-accent", color);
    document.documentElement.style.setProperty("--accent", color);
  }
  applyAccent(store.get("nexus-accent", ACCENTS[0]));

  APPS.settings = {
    title: "Settings",
    html: () => `
      <div data-view="list">
        <button type="button" class="nx-card nx-profile" data-set-open="about" style="width:100%;text-align:left;color:inherit">
          <span class="nx-avatar">${esc(userName()[0].toUpperCase())}</span>
          <span style="flex:1"><strong>${esc(userName())}</strong><span>Nexus OS on this device</span></span>${ic("chev")}</button>
        <label class="nx-search" role="search"><span>${ic("search")}</span><input type="search" data-set-search placeholder="Search settings…" aria-label="Search settings" autocomplete="off"></label>
        <div data-set-groups></div>
      </div>
      <div data-view="detail" hidden><div data-set-detail></div></div>`,
    init(win) {
      setState.detail = null;
      setGroups(win, "");
      win.querySelector("[data-set-search]").addEventListener("input", (e) => setGroups(win, e.target.value));
      win.addEventListener("click", (e) => {
        const o = e.target.closest("[data-set-open]"); if (o) { setOpen(win, o.dataset.setOpen); return; }
        const sw = e.target.closest("[data-set-switch]"); if (sw) { setSwitch(win, sw.dataset.setSwitch, sw); return; }
        const ac = e.target.closest("[data-accent]"); if (ac) { store.set("nexus-accent", ac.dataset.accent); applyAccent(ac.dataset.accent); setOpen(win, "display"); return; }
        const op = e.target.closest("[data-open-app]"); if (op) { window.openApp(op.dataset.openApp); return; }
        if (e.target.closest("[data-test-sound]")) { const was = store.get("nexus-sound-clicks", false); store.set("nexus-sound-clicks", true); tick(); store.set("nexus-sound-clicks", was); return; }
        if (e.target.closest("[data-notif-ask]")) { if ("Notification" in window) Notification.requestPermission().then(() => setOpen(win, "notifications")); return; }
        if (e.target.closest("[data-notif-test]")) { remNotify({ id: "test", text: "Notifications from Nexus OS are working." }); return; }
        if (e.target.closest("[data-persist]")) { navigator.storage?.persist?.().then((ok) => { toast(win, ok ? "Your phone will keep Nexus data safe" : "Your browser decided not to allow this yet"); setOpen(win, "storage"); }); return; }
        if (e.target.closest("[data-save-name]")) {
          const v = win.querySelector("[data-name-input]").value.trim().slice(0, 24);
          if (!v) { toast(win, "Type a name first"); return; }
          store.set("nexus-username", v); toast(win, "Name saved"); return;
        }
      });
      win.addEventListener("input", (e) => {
        if (e.target.matches("[data-brightness]")) {
          const v = Number(e.target.value); store.set("nexus-brightness", v);
          document.documentElement.style.filter = v === 100 ? "" : `brightness(${v / 100})`;
          const s = document.getElementById("brightness-slider"); if (s) s.value = v;
          const o = win.querySelector("[data-brightness-out]"); if (o) o.textContent = v + "%";
        }
        if (e.target.matches("[data-volume]")) { store.set("nexus-sound-volume", Number(e.target.value)); const o = win.querySelector("[data-volume-out]"); if (o) o.textContent = e.target.value + "%"; }
      });
      const live = () => { if (!win.isConnected) { window.removeEventListener("online", live); window.removeEventListener("offline", live); return; } if (setState.detail) setOpen(win, setState.detail, true); else setGroups(win, win.querySelector("[data-set-search]").value); };
      window.addEventListener("online", live); window.addEventListener("offline", live);
      navigator.getBattery?.().then((b) => { setState.battery = b; ["levelchange", "chargingchange"].forEach((ev) => b.addEventListener(ev, live)); live(); }).catch(() => {});
    },
    onBack(win) {
      if (!setState.detail) return false;
      setState.detail = null;
      win.querySelector(".nx-head h2").textContent = "Settings";
      showView(win, "list"); setGroups(win, win.querySelector("[data-set-search]").value);
      return true;
    }
  };
  function setMeta(key) {
    const c = conn();
    switch (key) {
      case "wifi": return navigator.onLine ? "Connected" : "Offline";
      case "bluetooth": return "Phone setting";
      case "data": return c?.effectiveType ? c.effectiveType.toUpperCase() : (navigator.onLine ? "On" : "Off");
      case "display": return isDark() ? "Dark" : "Light";
      case "sound": return store.get("nexus-sound-clicks", false) ? "Clicks on" : "Silent";
      case "battery": return setState.battery ? Math.round(setState.battery.level * 100) + "%" + (setState.battery.charging ? " ⚡" : "") : "";
      case "apps": return (typeof appInfo !== "undefined" ? Object.keys(appInfo).length : 33) + "";
      case "notifications": return "Notification" in window ? ({ granted: "Allowed", denied: "Blocked", default: "Ask" }[Notification.permission] || "") : "Not supported";
      case "about": return "v2.0";
      default: return "";
    }
  }
  function setGroups(win, q) {
    const query = q.trim().toLowerCase();
    const rows = SET_ROWS.filter((r) => !query || (r.label + " " + r.words).toLowerCase().includes(query));
    const groups = [...new Set(rows.map((r) => r.group))];
    const box = win.querySelector("[data-set-groups]");
    if (!rows.length) { box.innerHTML = `<div class="nx-empty">${ic("search")}<strong>No settings found</strong>Try another word, like “dark” or “battery”.</div>`; return; }
    box.innerHTML = groups.map((g) => `<div class="nx-group-label">${g}</div><div class="nx-list">${rows.filter((r) => r.group === g).map((r) =>
      `<button type="button" class="nx-row" data-set-open="${r.key}"><span class="nx-tile ${r.tile}">${ic(r.icon)}</span><span class="nx-row-main"><strong>${r.label}</strong></span><span class="nx-row-meta">${esc(setMeta(r.key))}</span>${ic("chev", "sm")}</button>`).join("")}</div>`).join("");
  }
  const sRow = (label, value, extra = "") => `<div class="nx-row"><span class="nx-row-main"><strong>${label}</strong>${extra ? `<span>${extra}</span>` : ""}</span><span class="nx-row-meta">${value}</span></div>`;
  const sSwitch = (key, label, on, extra = "") => `<div class="nx-row"><span class="nx-row-main"><strong>${label}</strong>${extra ? `<span>${extra}</span>` : ""}</span><button type="button" class="nx-switch" role="switch" aria-checked="${on}" aria-label="${esc(label)}" data-set-switch="${key}"></button></div>`;
  const pill = (state) => state === "granted" ? `<span class="nx-pill ok">Allowed</span>` : state === "denied" ? `<span class="nx-pill bad">Blocked</span>` : state === "prompt" ? `<span class="nx-pill warn">Ask first</span>` : `<span class="nx-pill">${esc(state || "Unknown")}</span>`;
  function setSwitch(win, key, el) {
    const on = el.getAttribute("aria-checked") !== "true";
    el.setAttribute("aria-checked", String(on));
    if (key === "dark") { document.body.classList.toggle("light-mode", !on); window.saveNexusAppearance?.(); }
    if (key === "clicks") { store.set("nexus-sound-clicks", on); if (on) tick(); }
  }
  async function setOpen(win, key, quiet) {
    const row = SET_ROWS.find((r) => r.key === key); if (!row) return;
    setState.detail = key;
    win.querySelector(".nx-head h2").textContent = row.label;
    if (!quiet) showView(win, "detail");
    const box = win.querySelector("[data-set-detail]");
    const hero = (title, sub) => `<div class="nx-detail-hero"><span class="nx-tile ${row.tile}">${ic(row.icon)}</span><strong>${title}</strong><span>${sub}</span></div>`;
    const note = (t) => `<p class="nx-note">${t}</p>`;
    const c = conn();
    let html = "";
    if (key === "wifi" || key === "data") {
      html = hero(navigator.onLine ? "Connected" : "Offline", navigator.onLine ? "Nexus OS is online" : "Check your Wi-Fi or mobile data") +
        `<div class="nx-list">${sRow("Status", navigator.onLine ? `<span class="nx-pill ok">Online</span>` : `<span class="nx-pill bad">Offline</span>`)}${sRow("Network speed", c?.effectiveType ? c.effectiveType.toUpperCase() : "Unknown")}${sRow("Download estimate", c?.downlink ? c.downlink + " Mbps" : "—")}${sRow("Delay (ping)", c?.rtt != null ? c.rtt + " ms" : "—")}${key === "data" ? sRow("Data saver", c?.saveData ? "On" : "Off") : ""}</div>` +
        note("Nexus OS runs in your browser, so Wi-Fi and mobile data are switched on or off from your phone's own settings. This page shows the live connection.");
    } else if (key === "bluetooth") {
      html = hero("Bluetooth", "Managed by your phone") + `<div class="nx-list">${sRow("Bluetooth for websites", "bluetooth" in navigator ? `<span class="nx-pill ok">Supported</span>` : `<span class="nx-pill">Not supported</span>`)}</div>` +
        note("Turn Bluetooth on or off from your phone's quick settings. Websites can only connect to a Bluetooth device after you pick it yourself.");
    } else if (key === "display") {
      const b = store.get("nexus-brightness", 100), acc = store.get("nexus-accent", ACCENTS[0]);
      html = `<div class="nx-group-label">Appearance</div><div class="nx-list">${sSwitch("dark", "Dark mode", isDark(), "Easier on your eyes at night")}</div>
        <div class="nx-group-label">Brightness</div><div class="nx-card" style="padding:14px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px"><span>${ic("sun", "sm")}</span><b data-brightness-out>${b}%</b></div><input class="nx-range" type="range" min="60" max="110" value="${b}" data-brightness aria-label="Brightness"></div>
        <div class="nx-group-label">Accent colour</div><div class="nx-card" style="padding:14px"><div class="nx-swatches">${ACCENTS.map((a) => `<button type="button" class="nx-swatch${a === acc ? " is-active" : ""}" style="--c:${a}" data-accent="${a}" aria-label="Accent ${a}"></button>`).join("")}</div></div>`;
    } else if (key === "sound") {
      const v = store.get("nexus-sound-volume", 60);
      html = `<div class="nx-list">${sSwitch("clicks", "Key click sounds", store.get("nexus-sound-clicks", false), "Soft click when you tap buttons")}</div>
        <div class="nx-group-label">Click volume</div><div class="nx-card" style="padding:14px"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px"><span>${ic("volume", "sm")}</span><b data-volume-out>${v}%</b></div><input class="nx-range" type="range" min="0" max="100" value="${v}" data-volume aria-label="Click volume"></div>
        <button type="button" class="nx-btn ghost block" style="margin-top:12px" data-test-sound>${ic("play", "sm")} Test sound</button>` + note("Media volume is controlled by your phone's volume buttons.");
    } else if (key === "battery") {
      const bt = setState.battery;
      if (!bt) html = hero("Battery", "Not available") + note("This browser doesn't share battery details with websites. Chrome on Android does.");
      else {
        const lvl = Math.round(bt.level * 100);
        const ring = lvl <= 20 ? "var(--nx-danger)" : lvl <= 40 ? "var(--nx-warning)" : "var(--nx-success)";
        const mins = (s) => Number.isFinite(s) && s > 0 ? Math.floor(s / 3600) + " h " + Math.round((s % 3600) / 60) + " min" : "—";
        html = `<div class="nx-detail-hero"><div class="nx-ring" style="--p:${lvl};--ring:${ring}"><div>${lvl}%</div></div><span>${bt.charging ? "Charging ⚡" : "On battery"}</span></div>
          <div class="nx-list">${sRow("Level", lvl + "%")}${sRow("Status", bt.charging ? `<span class="nx-pill ok">Charging</span>` : `<span class="nx-pill">Not charging</span>`)}${sRow(bt.charging ? "Full in" : "Time left", mins(bt.charging ? bt.chargingTime : bt.dischargingTime))}</div>`;
      }
    } else if (key === "storage") {
      let usage = 0, quota = 0, persisted = false, filesBytes = 0, filesCount = 0;
      try { const e = await navigator.storage?.estimate?.(); usage = e?.usage || 0; quota = e?.quota || 0; } catch (_) {}
      try { persisted = await navigator.storage?.persisted?.(); } catch (_) {}
      try { const all = await FilesDB.all(); filesCount = all.length; filesBytes = all.reduce((s, f) => s + (f.size || 0), 0); } catch (_) {}
      let lsBytes = 0; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); lsBytes += (k.length + (localStorage.getItem(k) || "").length) * 2; } } catch (_) {}
      if (setState.detail !== "storage") return;
      const pct = quota ? Math.min(100, (usage / quota) * 100) : 0;
      html = `<div class="nx-card nx-storage" style="margin-top:6px"><div class="nx-storage-head"><strong>${fmtBytes(usage)} used</strong><span>of ${quota ? fmtBytes(quota) : "—"}</span></div><div class="nx-bar"><i style="width:${Math.max(pct, 1.5)}%"></i></div><small>Space your phone gives Nexus OS. It grows as you save more.</small></div>
        <div class="nx-group-label">What's using space</div><div class="nx-list">${sRow("Files app", fmtBytes(filesBytes), filesCount + " file" + (filesCount === 1 ? "" : "s"))}${sRow("Notes, photos & settings", fmtBytes(lsBytes))}</div>
        <div class="nx-group-label">Protection</div><div class="nx-list">${sRow("Keep Nexus data", persisted ? `<span class="nx-pill ok">Protected</span>` : `<span class="nx-pill warn">Not yet</span>`, "Stops the phone clearing your files when space is low")}</div>
        ${persisted ? "" : `<button type="button" class="nx-btn block" style="margin-top:12px" data-persist>${ic("shield", "sm")} Protect my Nexus data</button>`}`;
    } else if (key === "apps") {
      const list = typeof appInfo !== "undefined" ? Object.entries(appInfo) : [];
      html = `<div class="nx-section-title">${list.length} apps installed</div><div class="nx-list">${list.map(([k, a]) => `<button type="button" class="nx-row" data-open-app="${k}"><span class="nx-row-main"><strong>${esc(a.title)}</strong>${APPS[k] ? `<span>New design</span>` : ""}</span>${ic("chev", "sm")}</button>`).join("")}</div>`;
    } else if (key === "notifications") {
      const p = "Notification" in window ? Notification.permission : "unsupported";
      html = hero(p === "granted" ? "Allowed" : p === "denied" ? "Blocked" : p === "unsupported" ? "Not supported" : "Not set up yet", "Used by Reminder and Clock alarms") +
        `<div class="nx-list">${sRow("Permission", pill(p === "default" ? "prompt" : p))}</div>` +
        (p === "default" ? `<button type="button" class="nx-btn block" style="margin-top:12px" data-notif-ask>${ic("bell", "sm")} Allow notifications</button>` : "") +
        (p === "granted" ? `<button type="button" class="nx-btn ghost block" style="margin-top:12px" data-notif-test>${ic("bell", "sm")} Send a test notification</button>` : "") +
        (p === "denied" ? note("Notifications are blocked. Turn them on in your browser: tap the lock icon next to the address, then Permissions.") : note("Reminders pop up while Nexus OS is open. With notifications allowed, they also show in your phone's notification bar."));
    } else if (key === "security") {
      const names = [["camera", "Camera"], ["microphone", "Microphone"], ["geolocation", "Location"], ["notifications", "Notifications"]];
      const states = await Promise.all(names.map(async ([n]) => { try { return (await navigator.permissions.query({ name: n })).state; } catch (_) { return "unknown"; } }));
      if (setState.detail !== "security") return;
      html = hero("Your privacy", "Nexus OS only gets what you allow") + `<div class="nx-group-label">Permissions</div><div class="nx-list">${names.map(([, label], i) => sRow(label, pill(states[i]))).join("")}</div>
        <div class="nx-group-label">How your data is kept</div><div class="nx-list">${sRow("Notes, files & reminders", "This phone only")}${sRow("Connection", location.protocol === "https:" ? `<span class="nx-pill ok">Secure (HTTPS)</span>` : `<span class="nx-pill warn">Local test</span>`)}</div>` +
        note("To change a permission, tap the lock icon next to the website address in your browser.");
    } else if (key === "about") {
      const scr = `${screen.width}×${screen.height}`;
      html = `<div class="nx-detail-hero"><span class="nx-tile t-blue">${ic("grid")}</span><strong>Nexus OS</strong><span>Version 2.0 · Batch 1 app design</span></div>
        <div class="nx-group-label">Your name</div><div class="nx-card" style="padding:12px;display:flex;gap:8px"><input class="nx-input" data-name-input value="${esc(userName())}" maxlength="24" aria-label="Your name"><button type="button" class="nx-btn" data-save-name>Save</button></div>
        <div class="nx-group-label">This device</div><div class="nx-list">${sRow("Screen", scr)}${sRow("Language", esc(navigator.language || "—"))}${sRow("Apps", setMeta("apps"))}${sRow("Built by", "Ramesh Kannan")}</div>` +
        note(`Source code on <a href="https://github.com/rameshkannan1472014-star/Nexus-OS" target="_blank" rel="noopener">GitHub</a>.`);
    }
    box.innerHTML = html;
  }
  // restore saved brightness
  { const b = store.get("nexus-brightness", 100); if (b !== 100) document.documentElement.style.filter = `brightness(${b / 100})`; }

  /* ------------------------------------------------------------------ *
   * Install: route the 8 Batch 1 apps to the new windows
   * ------------------------------------------------------------------ */
  const legacyOpen = window.openApp;
  window.openApp = function (name) {
    if (APPS[name]) return nxOpen(name);
    return legacyOpen ? legacyOpen(name) : undefined;
  };
  // eslint-disable-next-line no-global-assign
  try { openApp = window.openApp; } catch (_) {}
  window.NexusApps = { APPS, MathEngine, version: "2.0" };
})();
