/* ==========================================================================
   Nexus OS — Control Center (v51)
   Rebuilt after feedback: the first version was too crowded. Now it opens
   with just what you reach for — brightness, volume, the three switches,
   next reminder and a row of app shortcuts. Everything else (language,
   wallpapers, accent, bottom-bar buttons, toggles) lives behind "More".
   Open it by dragging down from the top edge, or tapping ☷.
   ========================================================================== */
(function () {
  "use strict";
  var Core = window.NexusCore;
  var N = window.NexusApps;
  var store = (N && N.store) || {
    get: function (k, f) { try { var v = localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (_) { return f; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } }
  };

  var cc = null;
  var scrim = null;
  var open = false;
  var startY = null;
  var mode = "mini"; // mini | full

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function build() {
    if (cc) return;
    scrim = el("div", "nx-cc-scrim");
    cc = el("section", "nx-cc");
    cc.id = "nx-cc";
    cc.setAttribute("role", "dialog");
    cc.setAttribute("aria-label", "Control Center");
    document.body.appendChild(scrim);
    document.body.appendChild(cc);
    scrim.addEventListener("click", close);
  }

  function nextReminder() {
    return store.get("nexus-reminders-v2", [])
      .filter(function (r) { return !r.done && r.time > Date.now() - 60000; })
      .sort(function (a, b) { return a.time - b.time; })[0] || null;
  }

  function fmtTime(ts) {
    var d = new Date(ts), now = new Date();
    var time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (d.toDateString() === now.toDateString()) return "Today " + time;
    var tom = new Date(now); tom.setDate(now.getDate() + 1);
    if (d.toDateString() === tom.toDateString()) return "Tomorrow " + time;
    return d.toLocaleDateString([], { day: "numeric", month: "short" }) + " " + time;
  }

  /* ---------- the compact panel ---------- */

  function renderMini() {
    var snd = Core.sound;
    var rem = nextReminder();
    var shortcuts = (Core.getDock() || []).slice(0, 5);

    cc.innerHTML =
      '<div class="nx-cc-grip"></div>' +
      '<div class="nx-cc-top">' +
        '<div><p class="nx-cc-date">' + esc(new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "short" })) + "</p>" +
        '<h2>' + Core.t("control_center") + "</h2></div>" +
        '<div class="nx-cc-topbtns">' +
          '<button class="nx-cc-icon" type="button" data-cc-more aria-label="More controls">⋯</button>' +
          '<button class="nx-cc-icon" type="button" data-cc-close aria-label="Close">✕</button>' +
        "</div>" +
      "</div>" +

      '<div class="nx-cc-quick">' +
        '<button class="nx-cc-big' + (snd.muted ? " is-off" : "") + '" type="button" data-cc-mute>' +
          '<span>' + (snd.muted ? "🔕" : "🔊") + "</span><b>" + (snd.muted ? "Muted" : snd.volume + "%") + "</b><small>Sound</small></button>" +
        '<button class="nx-cc-big' + (Core.light ? "" : " is-on") + '" type="button" data-cc-theme>' +
          '<span>◐</span><b>' + (Core.light ? "Light" : "Dark") + "</b><small>Theme</small></button>" +
        '<button class="nx-cc-big" type="button" data-cc-lang>' +
          '<span>🌐</span><b>' + esc(Core.langInfo().native) + "</b><small>Language</small></button>" +
        '<button class="nx-cc-big" type="button" data-cc-fullscreen>' +
          '<span>⛶</span><b>Screen</b><small>Fill</small></button>' +
      "</div>" +

      '<div class="nx-cc-slider"><label>☀ Brightness</label><output>' + store.get("nexus-brightness", 100) + "%</output>" +
        '<input type="range" data-cc-range="brightness" min="55" max="115" value="' + store.get("nexus-brightness", 100) + '" aria-label="Brightness"></div>' +
      '<div class="nx-cc-slider"><label>🔊 Volume</label><output>' + snd.volume + "%</output>" +
        '<input type="range" data-cc-range="volume" min="0" max="100" value="' + snd.volume + '" aria-label="Volume"></div>' +

      '<div class="nx-cc-shortcuts">' +
        shortcuts.map(function (s) {
          return '<button type="button" data-cc-open="' + s.app + '"><span>' + s.icon + "</span><small>" + esc(s.label) + "</small></button>";
        }).join("") +
      "</div>" +

      (rem
        ? '<button type="button" class="nx-cc-rem" data-cc-rem="' + esc(rem.id) + '"><span class="nx-cc-rem-dot"></span><span><b>' + esc(rem.text) + "</b><small>" + esc(fmtTime(rem.time)) + "</small></span><i>✓</i></button>"
        : '<button type="button" class="nx-cc-rem empty" data-cc-open="reminder"><span class="nx-cc-rem-dot"></span><span><b>' + Core.t("no_reminders") + "</b><small>Tap to add one</small></span></button>");

    wireMini();
  }

  function wireMini() {
    cc.querySelector("[data-cc-close]").addEventListener("click", close);
    cc.querySelector("[data-cc-more]").addEventListener("click", function () { mode = "full"; render(); });
    cc.querySelector("[data-cc-mute]").addEventListener("click", function () { Core.sound.muted = !Core.sound.muted; render(); });
    cc.querySelector("[data-cc-theme]").addEventListener("click", function () { Core.setLight(!Core.light); render(); });
    cc.querySelector("[data-cc-lang]").addEventListener("click", function () {
      var langs = Core.LANGS, i = 0;
      langs.forEach(function (l, k) { if (l.code === Core.lang) i = k; });
      Core.setLang(langs[(i + 1) % langs.length].code);
      render();
    });
    cc.querySelector("[data-cc-fullscreen]").addEventListener("click", function () {
      close();
      if (window.NexusFullscreen) {
        var frame = document.querySelector(".nx-browser-frame:not([hidden])");
        if (frame) { window.NexusFullscreen.enter(frame); return; }
        document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(function () {});
      }
    });
    cc.querySelectorAll("[data-cc-open]").forEach(function (b) {
      b.addEventListener("click", function () { var a = b.dataset.ccOpen; close(); if (window.openApp) window.openApp(a); });
    });
    var r = cc.querySelector("[data-cc-rem]");
    if (r && r.dataset.ccRem) r.addEventListener("click", function () {
      var list = store.get("nexus-reminders-v2", []);
      list.forEach(function (x) { if (x.id === r.dataset.ccRem) x.done = true; });
      store.set("nexus-reminders-v2", list);
      if (Core.tone) Core.tone(780, 70);
      render();
    });
    var bright = cc.querySelector("[data-cc-range='brightness']");
    bright.addEventListener("input", function () {
      var v = Number(bright.value);
      store.set("nexus-brightness", v);
      document.documentElement.style.filter = "brightness(" + Math.min(1.15, v / 100) + ")";
      bright.parentNode.querySelector("output").textContent = v + "%";
    });
    var vol = cc.querySelector("[data-cc-range='volume']");
    vol.addEventListener("input", function () {
      Core.sound.volume = Number(vol.value);
      vol.parentNode.querySelector("output").textContent = vol.value + "%";
    });
  }

  /* ---------- the full panel ---------- */

  function renderFull() {
    var snd = Core.sound;
    cc.innerHTML =
      '<div class="nx-cc-grip"></div>' +
      '<div class="nx-cc-top"><div><h2>More controls</h2></div><div class="nx-cc-topbtns">' +
        '<button class="nx-cc-icon" type="button" data-cc-back aria-label="Back">‹</button>' +
        '<button class="nx-cc-icon" type="button" data-cc-close aria-label="Close">✕</button></div></div>' +

      '<div class="nx-cc-switches">' +
        sw("duck", "🔉 Lower sound on alerts", snd.ducking) +
        sw("mute", "🔕 Mute everything", snd.muted) +
      "</div>" +

      '<div class="nx-cc-block"><h3>🌐 ' + Core.t("language") + '</h3><div class="nx-cc-chips">' +
        Core.LANGS.map(function (l) {
          return '<button type="button" class="nx-cc-chip' + (l.code === Core.lang ? " is-on" : "") + '" data-cc-lang="' + l.code + '">' + esc(l.native) + "</button>";
        }).join("") + "</div></div>" +

      '<div class="nx-cc-block"><h3>🎨 ' + Core.t("wallpaper") + '</h3><div class="nx-cc-walls">' +
        Core.WALLPAPERS.map(function (w) {
          return '<button type="button" class="nx-cc-wall' + (w.id === Core.wallpaper ? " is-on" : "") + '" data-cc-wall="' + w.id + '" style="background-image:' + w.css + '" aria-label="' + esc(w.label) + '"><span>' + esc(w.label) + "</span></button>";
        }).join("") + "</div></div>" +

      '<div class="nx-cc-block"><h3>✳ ' + Core.t("accent") + '</h3><div class="nx-cc-accents">' +
        Core.ACCENTS.map(function (a) {
          return '<button type="button" class="nx-cc-accent' + (a.id === Core.accent ? " is-on" : "") + '" data-cc-accent="' + a.id + '" style="--c:' + a.color + '" aria-label="' + esc(a.label) + '"></button>';
        }).join("") + "</div></div>" +

      '<div class="nx-cc-block"><h3>▤ ' + Core.t("dock") + '</h3><div class="nx-cc-dock">' +
        Core.DOCK_CHOICES.map(function (d) {
          var on = Core.getDock().some(function (x) { return x.app === d.app; });
          return '<button type="button" class="nx-cc-chip' + (on ? " is-on" : "") + '" data-cc-dock="' + d.app + '">' + d.icon + " " + esc(d.label) + "</button>";
        }).join("") + "</div></div>" +

      '<div class="nx-cc-block"><h3>⇅ Toggles</h3><div class="nx-cc-tiles">' +
        tile("wifi", "⌁", "Wi-Fi") + tile("bluetooth", "ᛒ", "Bluetooth") + tile("airplane", "✈", "Airplane") +
      "</div></div>" +

      '<button type="button" class="nx-cc-wide" data-cc-open="settings">⚙ ' + Core.t("settings") + "</button>" +
      '<p class="nx-cc-note">Wi-Fi, Bluetooth and airplane mode are visual demos — a website cannot change your phone\'s real settings.</p>';

    cc.querySelector("[data-cc-close]").addEventListener("click", close);
    cc.querySelector("[data-cc-back]").addEventListener("click", function () { mode = "mini"; render(); });
    cc.querySelectorAll("[data-cc-lang]").forEach(function (b) {
      b.addEventListener("click", function () { Core.setLang(b.dataset.ccLang); render(); });
    });
    cc.querySelectorAll("[data-cc-wall]").forEach(function (b) {
      b.addEventListener("click", function () { Core.setWallpaper(b.dataset.ccWall); render(); });
    });
    cc.querySelectorAll("[data-cc-accent]").forEach(function (b) {
      b.addEventListener("click", function () { Core.setAccent(b.dataset.ccAccent); render(); });
    });
    cc.querySelectorAll("[data-cc-dock]").forEach(function (b) {
      b.addEventListener("click", function () {
        var app = b.dataset.ccDock, list = Core.getDock();
        var has = list.some(function (x) { return x.app === app; });
        if (has) { if (list.length <= 2) return; list = list.filter(function (x) { return x.app !== app; }); }
        else {
          var found = Core.DOCK_CHOICES.filter(function (x) { return x.app === app; })[0];
          if (found && list.length < 7) list.push(found);
        }
        Core.setDock(list);
        render();
      });
    });
    cc.querySelectorAll("[data-cc-sw]").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.dataset.ccSw === "duck") Core.sound.ducking = !Core.sound.ducking;
        if (b.dataset.ccSw === "mute") Core.sound.muted = !Core.sound.muted;
        render();
      });
    });
    cc.querySelectorAll("[data-cc-tile]").forEach(function (b) {
      b.addEventListener("click", function () { b.classList.toggle("active"); });
    });
    cc.querySelectorAll("[data-cc-open]").forEach(function (b) {
      b.addEventListener("click", function () { var a = b.dataset.ccOpen; close(); if (window.openApp) window.openApp(a); });
    });
  }

  function tile(key, icon, label) {
    return '<button type="button" class="nx-cc-tile active" data-cc-tile="' + key + '"><span>' + icon + "</span><b>" + label + "</b></button>";
  }
  function sw(key, label, on) {
    return '<button type="button" class="nx-cc-sw' + (on ? " is-on" : "") + '" data-cc-sw="' + key + '"><span>' + label + '</span><i></i></button>';
  }

  function render() {
    if (!cc || !Core) return;
    if (mode === "full") renderFull(); else renderMini();
  }

  function openCC() {
    build();
    mode = "mini";
    render();
    open = true;
    scrim.classList.add("show");
    cc.classList.add("show");
    document.body.classList.add("cc-open");
  }
  function close() {
    if (!cc) return;
    open = false;
    cc.classList.remove("show");
    scrim.classList.remove("show");
    document.body.classList.remove("cc-open");
  }
  function toggle() { if (open) close(); else openCC(); }

  /* ---------- gestures: drag down from the top edge ---------- */

  function initGesture() {
    document.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      startY = (!open && e.touches[0].clientY < 44) ? e.touches[0].clientY : null;
      if (open) cc.dataset.dragFrom = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener("touchmove", function (e) {
      if (e.touches.length !== 1) return;
      if (startY != null && e.touches[0].clientY - startY > 55) {
        startY = null;
        openCC();
        try { navigator.vibrate && navigator.vibrate(12); } catch (_) {}
        return;
      }
      if (open && cc.dataset.dragFrom && cc.scrollTop <= 0 && e.touches[0].clientY - Number(cc.dataset.dragFrom) > 90) {
        cc.dataset.dragFrom = "";
        close();
      }
    }, { passive: true });

    document.addEventListener("touchend", function () { startY = null; cc && (cc.dataset.dragFrom = ""); }, { passive: true });

    document.addEventListener("mousedown", function (e) { if (!open && e.clientY < 10) openCC(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) close(); });
  }

  function boot() {
    build();
    initGesture();
    var old = document.getElementById("control-center");
    if (old) old.hidden = true;
    var oldBtn = document.getElementById("control-center-open");
    if (oldBtn) oldBtn.remove();
    var status = document.querySelector(".top-bar .status");
    if (status && !document.getElementById("nx-cc-topbtn")) {
      var b = el("button", "control-center-open", "☷");
      b.id = "nx-cc-topbtn";
      b.type = "button";
      b.setAttribute("aria-label", "Control Center");
      b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); toggle(); });
      status.insertBefore(b, status.firstChild);
    }
    document.addEventListener("nexus-lang", function () { if (open) render(); });
    document.addEventListener("nexus-sound", function () { if (open && mode === "full") render(); });
    document.addEventListener("nexus-dock", function () { if (open) render(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.NexusControlCenter = { open: openCC, close: close, toggle: toggle, get isOpen() { return open; } };
})();
