/* ==========================================================================
   Nexus OS — Control Center (v50)
   A proper shade: drag down from the very top of the screen (or tap
   "Control"), and it slides over the page. Everything the OS can control
   lives here: brightness, volume, sound ducking, wallpaper and accent,
   bottom-bar buttons, language, Wi-Fi/Bluetooth/airplane demos, the next
   reminders, and the quick toggles.
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
    scrim.id = "nx-cc-scrim";
    cc = el("section", "nx-cc");
    cc.id = "nx-cc";
    cc.setAttribute("role", "dialog");
    cc.setAttribute("aria-label", "Control Center");
    document.body.appendChild(scrim);
    document.body.appendChild(cc);
    scrim.addEventListener("click", close);
  }

  function toggleReminder(id) {
    var list = store.get("nexus-reminders-v2", []);
    var r = list.filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    r.done = !r.done;
    store.set("nexus-reminders-v2", list);
    Core && Core.tone && Core.tone(760, 70);
    render();
  }

  function nextReminders() {
    var now = Date.now();
    return store.get("nexus-reminders-v2", [])
      .filter(function (r) { return !r.done; })
      .sort(function (a, b) { return a.time - b.time; })
      .slice(0, 3);
  }

  function fmtTime(ts) {
    var d = new Date(ts), now = new Date();
    var sameDay = d.toDateString() === now.toDateString();
    var time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (sameDay) return "Today " + time;
    var tom = new Date(now); tom.setDate(now.getDate() + 1);
    if (d.toDateString() === tom.toDateString()) return "Tomorrow " + time;
    return d.toLocaleDateString([], { day: "numeric", month: "short" }) + " " + time;
  }

  function render() {
    if (!cc || !Core) return;
    var snd = Core.sound;
    var rems = nextReminders();
    var lang = Core.lang;

    cc.innerHTML =
      '<div class="nx-cc-grip" aria-hidden="true"></div>' +
      '<div class="nx-cc-head"><div><p class="nx-cc-date">' + esc(new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })) + "</p>" +
      '<h2 data-t="control_center">' + Core.t("control_center") + "</h2></div>" +
      '<button class="nx-cc-close" type="button" aria-label="Close">✕</button></div>' +

      '<div class="nx-cc-tiles">' +
      tile("wifi", "⌁", "Wi-Fi", "On · simulated") +
      tile("bluetooth", "ᛒ", "Bluetooth", "On · simulated") +
      tile("airplane", "✈", "Airplane", "Off · simulated") +
      tile("theme", "◐", "Theme", Core.light ? "Light" : "Dark") +
      "</div>" +

      slider("brightness", "☀", "Brightness", store.get("nexus-brightness", 100), 55, 115) +
      slider("volume", "🔊", "Volume", snd.volume, 0, 100) +

      '<div class="nx-cc-switches">' +
      sw("duck", "🔉", "Lower sound on alerts", snd.ducking) +
      sw("mute", "🔕", "Mute everything", snd.muted) +
      "</div>" +

      '<div class="nx-cc-block"><h3>🔔 ' + Core.t("reminders") + '</h3>' +
      (rems.length
        ? '<div class="nx-cc-rems">' + rems.map(function (r) {
            return '<button type="button" class="nx-cc-rem" data-cc-rem="' + esc(r.id) + '"><span class="nx-cc-rem-dot"></span><span><b>' + esc(r.text) + "</b><small>" + esc(fmtTime(r.time)) + "</small></span></button>";
          }).join("") + "</div>"
        : '<p class="nx-cc-empty">' + Core.t("no_reminders") + ' · <button type="button" class="nx-cc-link" data-cc-open="reminder">Add one</button></p>') +
      "</div>" +

      '<div class="nx-cc-block"><h3>🌐 ' + Core.t("language") + "</h3><div class=\"nx-cc-chips\">" +
      Core.LANGS.map(function (l) {
        return '<button type="button" class="nx-cc-chip' + (l.code === lang ? " is-on" : "") + '" data-cc-lang="' + l.code + '">' + esc(l.native) + "</button>";
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

      '<button type="button" class="nx-cc-wide" data-cc-open="settings">⚙ ' + Core.t("settings") + "</button>" +
      '<p class="nx-cc-note">Wi-Fi, Bluetooth and airplane mode are visual demos — a website cannot change your phone\'s real settings.</p>';

    cc.querySelector(".nx-cc-close").addEventListener("click", close);

    cc.querySelectorAll("[data-cc-rem]").forEach(function (b) {
      b.addEventListener("click", function () { toggleReminder(b.dataset.ccRem); });
    });
    cc.querySelectorAll("[data-cc-open]").forEach(function (b) {
      b.addEventListener("click", function () {
        var app = b.dataset.ccOpen;
        close();
        if (window.openApp) window.openApp(app);
      });
    });
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
        if (has) {
          if (list.length <= 2) return;
          list = list.filter(function (x) { return x.app !== app; });
        } else {
          var found = Core.DOCK_CHOICES.filter(function (x) { return x.app === app; })[0];
          if (found && list.length < 7) list.push(found);
        }
        Core.setDock(list);
        render();
      });
    });

    var bright = cc.querySelector("[data-cc-range='brightness']");
    if (bright) bright.addEventListener("input", function () {
      var v = Number(bright.value);
      store.set("nexus-brightness", v);
      document.documentElement.style.filter = "brightness(" + Math.min(1.15, v / 100) + ")";
      bright.parentNode.querySelector("output").textContent = v + "%";
    });
    var vol = cc.querySelector("[data-cc-range='volume']");
    if (vol) vol.addEventListener("input", function () {
      Core.sound.volume = Number(vol.value);
      vol.parentNode.querySelector("output").textContent = vol.value + "%";
    });
    cc.querySelectorAll("[data-cc-sw]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.dataset.ccSw;
        if (k === "duck") Core.sound.ducking = !Core.sound.ducking;
        if (k === "mute") Core.sound.muted = !Core.sound.muted;
        render();
      });
    });
    cc.querySelectorAll("[data-cc-tile]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.dataset.ccTile;
        if (k === "theme") {
          Core.setLight(!Core.light);
          render();
          return;
        }
        b.classList.toggle("active");
        var small = b.querySelector("small");
        if (small) small.textContent = (b.classList.contains("active") ? "On" : "Off") + " · simulated";
      });
    });
  }

  function tile(key, icon, label, sub) {
    var active = key === "wifi" || key === "bluetooth" ? true : key === "theme" ? !Core.light : false;
    return '<button type="button" class="nx-cc-tile' + (active ? " active" : "") + '" data-cc-tile="' + key + '"><span>' + icon + "</span><b>" + label + "</b><small>" + sub + "</small></button>";
  }
  function slider(key, icon, label, value, min, max) {
    return '<div class="nx-cc-slider"><label>' + icon + " " + label + '</label><output>' + value + '%</output>' +
      '<input type="range" data-cc-range="' + key + '" min="' + min + '" max="' + max + '" value="' + value + '" aria-label="' + label + '"></div>';
  }
  function sw(key, icon, label, on) {
    return '<button type="button" class="nx-cc-sw' + (on ? " is-on" : "") + '" data-cc-sw="' + key + '"><span>' + icon + " " + label + '</span><i></i></button>';
  }

  function openCC() {
    build();
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

  /* ---------------- drag down from the top ---------------- */

  function initGesture() {
    document.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      var y = e.touches[0].clientY;
      /* Only from the very top strip, and not while the shade is already open. */
      if (!open && y < 46) startY = y;
      else startY = null;
    }, { passive: true });

    document.addEventListener("touchmove", function (e) {
      if (startY == null || e.touches.length !== 1) return;
      var dy = e.touches[0].clientY - startY;
      if (dy > 60) {
        startY = null;
        openCC();
        try { navigator.vibrate && navigator.vibrate(12); } catch (_) {}
      }
    }, { passive: true });

    document.addEventListener("touchend", function () { startY = null; }, { passive: true });

    /* The shade itself: drag up to close. */
    document.addEventListener("touchstart", function (e) {
      if (!open || e.touches.length !== 1) return;
      var y = e.touches[0].clientY;
      cc.dataset.dragFrom = y;
    }, { passive: true });
    document.addEventListener("touchmove", function (e) {
      if (!open || !cc || cc.dataset.dragFrom == null) return;
      var dy = e.touches[0].clientY - Number(cc.dataset.dragFrom);
      if (dy > 90 && cc.scrollTop <= 0) { cc.dataset.dragFrom = ""; close(); }
    }, { passive: true });

    /* Desktop: pull with the mouse from the top edge. */
    document.addEventListener("mousedown", function (e) {
      if (!open && e.clientY < 12) { openCC(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) close();
    });
  }

  function boot() {
    build();
    initGesture();
    var old = document.getElementById("control-center");
    if (old) old.hidden = true;
    /* The real shade replaces the old panel and the old "Control" button. */
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
    document.addEventListener("nexus-sound", function () { if (open) render(); });
    document.addEventListener("nexus-dock", function () { if (open) render(); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.NexusControlCenter = { open: openCC, close: close, toggle: toggle, get isOpen() { return open; } };
})();
