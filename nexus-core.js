/* ==========================================================================
   Nexus OS — Settings core (v50)
   One small module that holds the things several parts of the OS share:
     • language      (English / தமிழ் / हिन्दी) + string lookup
     • sound         (system volume, notification ducking)
     • themes        (wallpapers + accent colours)
     • dock layout   (which buttons, in what order)
     • events        (holidays and school events for the calendar)
     • suggestions   (search + content in the chosen language)
   Everything is kept in localStorage so it survives a reload.
   ========================================================================== */
(function () {
  "use strict";
  var N = window.NexusApps;
  var store = (N && N.store) || {
    get: function (k, f) { try { var v = localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (_) { return f; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (_) { return false; } }
  };

  /* ---------------- languages ---------------- */

  var LANGS = [
    { code: "en", label: "English", native: "English", locale: "en-IN" },
    { code: "ta", label: "Tamil", native: "தமிழ்", locale: "ta-IN" },
    { code: "hi", label: "Hindi", native: "हिन्दी", locale: "hi-IN" }
  ];

  /* Only the interface strings that are worth translating. Anything missing
     falls back to English, so the app never shows a blank label. */
  var STRINGS = {
    en: {
      search_placeholder: "Search apps, files, web…",
      ask_placeholder: "Ask me anything…",
      your_apps: "Your apps",
      quick_tools: "Quick Tools",
      at_a_glance: "At a glance",
      settings: "Settings",
      control_center: "Control Center",
      reminders: "Reminders",
      no_reminders: "No reminders yet",
      weather: "Weather",
      today: "Today",
      apps_count: "APPS",
      language: "Language",
      appearance: "Appearance",
      wallpaper: "Wallpaper",
      accent: "Accent colour",
      dock: "Bottom bar",
      sound: "Sound",
      notifications: "Notifications",
      greeting_morning: "Good morning",
      greeting_afternoon: "Good afternoon",
      greeting_evening: "Good evening",
      greeting_night: "Good night"
    },
    ta: {
      search_placeholder: "ஆப்ஸ், கோப்புகள், இணையம் தேடு…",
      ask_placeholder: "என்னிடம் எதையும் கேள்…",
      your_apps: "உங்கள் ஆப்ஸ்",
      quick_tools: "விரைவு கருவிகள்",
      at_a_glance: "ஒரு பார்வையில்",
      settings: "அமைப்புகள்",
      control_center: "கட்டுப்பாட்டு மையம்",
      reminders: "நினைவூட்டல்கள்",
      no_reminders: "நினைவூட்டல்கள் இல்லை",
      weather: "வானிலை",
      today: "இன்று",
      apps_count: "ஆப்ஸ்",
      language: "மொழி",
      appearance: "தோற்றம்",
      wallpaper: "சுவர் படம்",
      accent: "நிறம்",
      dock: "கீழ் பட்டி",
      sound: "ஒலி",
      notifications: "அறிவிப்புகள்",
      greeting_morning: "காலை வணக்கம்",
      greeting_afternoon: "மதிய வணக்கம்",
      greeting_evening: "மாலை வணக்கம்",
      greeting_night: "இனிய இரவு"
    },
    hi: {
      search_placeholder: "ऐप, फ़ाइलें, वेब खोजें…",
      ask_placeholder: "मुझसे कुछ भी पूछें…",
      your_apps: "आपके ऐप",
      quick_tools: "त्वरित उपकरण",
      at_a_glance: "एक नज़र में",
      settings: "सेटिंग्स",
      control_center: "कंट्रोल सेंटर",
      reminders: "रिमाइंडर",
      no_reminders: "कोई रिमाइंडर नहीं",
      weather: "मौसम",
      today: "आज",
      apps_count: "ऐप",
      language: "भाषा",
      appearance: "रूप",
      wallpaper: "वॉलपेपर",
      accent: "रंग",
      dock: "नीचे की पट्टी",
      sound: "आवाज़",
      notifications: "सूचनाएँ",
      greeting_morning: "सुप्रभात",
      greeting_afternoon: "नमस्ते",
      greeting_evening: "शुभ संध्या",
      greeting_night: "शुभ रात्रि"
    }
  };

  var lang = store.get("nexus-lang", "en");
  if (!STRINGS[lang]) lang = "en";

  function t(key) {
    return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
  }
  function langInfo() {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === lang) return LANGS[i];
    return LANGS[0];
  }
  function setLang(code) {
    if (!STRINGS[code]) return;
    lang = code;
    store.set("nexus-lang", code);
    document.documentElement.lang = code;
    applyLanguage();
  }

  /* Swap the text of the handful of elements that carry a data-t key. */
  function applyLanguage() {
    document.querySelectorAll("[data-t]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-t"));
    });
    document.querySelectorAll("[data-t-placeholder]").forEach(function (el) {
      el.placeholder = t(el.getAttribute("data-t-placeholder"));
    });
    var gs = document.getElementById("global-search");
    if (gs) gs.placeholder = t("search_placeholder");
    var barInput = document.getElementById("fc-bar-input");
    if (barInput) barInput.placeholder = t("ask_placeholder");
    document.dispatchEvent(new CustomEvent("nexus-lang"));
  }

  /* ---------------- sound ---------------- */

  var sound = {
    get volume() { return store.get("nexus-sound-volume", 60); },
    set volume(v) {
      store.set("nexus-sound-volume", Math.max(0, Math.min(100, Number(v) || 0)));
      document.dispatchEvent(new CustomEvent("nexus-sound"));
    },
    get ducking() { return store.get("nexus-duck", true); },
    set ducking(v) { store.set("nexus-duck", !!v); document.dispatchEvent(new CustomEvent("nexus-sound")); },
    get muted() { return store.get("nexus-muted", false); },
    set muted(v) { store.set("nexus-muted", !!v); document.dispatchEvent(new CustomEvent("nexus-sound")); },

    /* Turn every media element down while a notification is showing. */
    duck: function (ms) {
      if (!sound.ducking || sound.muted) return;
      var media = Array.prototype.slice.call(document.querySelectorAll("audio, video"));
      var saved = [];
      media.forEach(function (m) {
        if (m.muted) return;
        saved.push([m, m.volume]);
        try { m.volume = Math.max(0.08, m.volume * 0.25); } catch (_) {}
      });
      if (!saved.length) return;
      setTimeout(function () {
        saved.forEach(function (pair) {
          try { pair[0].volume = pair[1]; } catch (_) {}
        });
      }, ms || 2200);
    }
  };

  /* A short tone for UI feedback (clicks, toggles). */
  var audioCtx = null;
  function tone(freq, ms) {
    if (sound.muted) return;
    var vol = sound.volume / 100;
    if (vol <= 0) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.frequency.value = freq || 660;
      g.gain.value = 0.05 * vol;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (ms || 90) / 1000);
      o.stop(audioCtx.currentTime + (ms || 90) / 1000);
    } catch (_) {}
  }

  /* ---------------- themes ---------------- */

  var WALLPAPERS = [
    { id: "aurora", label: "Aurora", css: "radial-gradient(ellipse at 18% 0%,rgba(111,87,225,.28),transparent 42%),radial-gradient(ellipse at 85% 25%,rgba(42,132,187,.20),transparent 34%),linear-gradient(160deg,#0c0e16,#0a1626)" },
    { id: "midnight", label: "Midnight", css: "radial-gradient(circle at 70% 10%,rgba(80,110,255,.22),transparent 45%),linear-gradient(180deg,#070a14,#0d1224)" },
    { id: "sunset", label: "Sunset", css: "linear-gradient(160deg,#2a1330,#5b1f3b 45%,#a8472f 80%,#e08b4c)" },
    { id: "ocean", label: "Ocean", css: "linear-gradient(170deg,#06263c,#0a4a63 55%,#117a86)" },
    { id: "forest", label: "Forest", css: "linear-gradient(170deg,#0a1f16,#12402a 60%,#1d6b3c)" },
    { id: "candy", label: "Candy", css: "linear-gradient(160deg,#2b1035,#6a1f5e 50%,#c73a86)" },
    { id: "mono", label: "Mono", css: "linear-gradient(170deg,#0d0d10,#1b1b22 60%,#2a2a35)" },
    { id: "sakura", label: "Sakura", css: "linear-gradient(165deg,#241322,#5c2a45 55%,#b8668a)" }
  ];

  var ACCENTS = [
    { id: "violet", label: "Violet", color: "#9b8cff" },
    { id: "blue", label: "Blue", color: "#38a3ff" },
    { id: "teal", label: "Teal", color: "#2ee6c5" },
    { id: "green", label: "Green", color: "#4ade80" },
    { id: "amber", label: "Amber", color: "#ffc247" },
    { id: "rose", label: "Rose", color: "#ff6b9d" },
    { id: "red", label: "Red", color: "#ff5a5f" },
    { id: "white", label: "Mono", color: "#dfe6ff" }
  ];

  function applyTheme() {
    var light = store.get("nexus-light", false);
    document.body.classList.toggle("light-mode", !!light);
    var wp = store.get("nexus-wallpaper", "aurora");
    var acc = store.get("nexus-accent", "violet");
    var w = WALLPAPERS.filter(function (x) { return x.id === wp; })[0] || WALLPAPERS[0];
    var a = ACCENTS.filter(function (x) { return x.id === acc; })[0] || ACCENTS[0];
    document.body.style.backgroundImage = w.css;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
    document.documentElement.style.setProperty("--accent", a.color);
    document.documentElement.style.setProperty("--nx-accent", a.color);
    /* A soft tint of the accent on the top bar and the dock. */
    document.documentElement.style.setProperty("--nx-accent-soft", a.color + "33");
  }
  function setWallpaper(id) { store.set("nexus-wallpaper", id); applyTheme(); }
  function setAccent(id) { store.set("nexus-accent", id); applyTheme(); }

  /* ---------------- dock / bottom buttons ---------------- */

  var DOCK_DEFAULT = [
    { app: "browser", icon: "🌐", label: "Browser" },
    { app: "files", icon: "📁", label: "Files" },
    { app: "reminder", icon: "🔔", label: "Reminders" },
    { app: "ai", icon: "🤖", label: "AI" },
    { app: "gallery", icon: "🖼️", label: "Gallery" },
    { app: "settings", icon: "⚙️", label: "Settings" }
  ];
  var DOCK_CHOICES = DOCK_DEFAULT.concat([
    { app: "music", icon: "♫", label: "Music" },
    { app: "notes", icon: "▤", label: "Notes" },
    { app: "tasks", icon: "✓", label: "Tasks" },
    { app: "calendar", icon: "📅", label: "Calendar" },
    { app: "terminal", icon: "⌨", label: "Terminal" },
    { app: "youtube", icon: "▶", label: "YouTube" }
  ]);

  function getDock() {
    var d = store.get("nexus-dock", null);
    if (!Array.isArray(d) || !d.length) return DOCK_DEFAULT.slice();
    return d;
  }
  function setDock(list) { store.set("nexus-dock", list); document.dispatchEvent(new CustomEvent("nexus-dock")); }

  function renderDock() {
    var nav = document.querySelector(".dock");
    if (!nav) return;
    var items = getDock();
    var html = items.map(function (it) {
      var cls = it.app === "ai" ? "dock-ai" : "";
      return '<button data-app="' + it.app + '" class="' + cls + '" aria-label="' + it.label + '">' + it.icon + "</button>";
    }).join("");
    html += '<button data-system-nav="home" aria-label="Home" title="Home">⌂</button>' +
      '<button data-system-nav="back" aria-label="Back" title="Back">‹</button>' +
      '<button data-system-nav="recent" aria-label="Recent apps" title="Recent apps">▢</button>';
    nav.innerHTML = html;
  }

  /* ---------------- holidays and school events ---------------- */

  /* Tamil Nadu public holidays plus a few that matter to a school student.
     Fixed-date ones are exact; lunar ones are noted as approximate. */
  var HOLIDAYS = [
    { m: 1, d: 1, title: "New Year's Day", ta: "புத்தாண்டு" },
    { m: 1, d: 14, title: "Pongal (Bhogi)", ta: "பொங்கல்" },
    { m: 1, d: 15, title: "Pongal — Thai Pongal", ta: "தை பொங்கல்" },
    { m: 1, d: 16, title: "Mattu Pongal", ta: "மாட்டுப் பொங்கல்" },
    { m: 1, d: 26, title: "Republic Day", ta: "குடியரசு தினம்" },
    { m: 4, d: 14, title: "Tamil New Year (Puthandu)", ta: "தமிழ் புத்தாண்டு" },
    { m: 5, d: 1, title: "May Day", ta: "தொழிலாளர் தினம்" },
    { m: 8, d: 15, title: "Independence Day", ta: "சுதந்திர தினம்" },
    { m: 9, d: 5, title: "Teachers' Day", ta: "ஆசிரியர் தினம்" },
    { m: 10, d: 2, title: "Gandhi Jayanti", ta: "காந்தி ஜெயந்தி" },
    { m: 11, d: 14, title: "Children's Day", ta: "குழந்தைகள் தினம்" },
    { m: 12, d: 25, title: "Christmas", ta: "கிறிஸ்துமஸ்" }
  ];

  function holidaysInMonth(year, month /* 0-based */) {
    return HOLIDAYS.filter(function (h) { return h.m === month + 1; })
      .map(function (h) {
        var date = year + "-" + String(h.m).padStart(2, "0") + "-" + String(h.d).padStart(2, "0");
        return { kind: "holiday", date: date, title: h.title, titleTa: h.ta, time: "", color: "#38a3ff" };
      });
  }
  function holidaysOn(dateKey) {
    return holidaysInMonth(Number(dateKey.slice(0, 4)), Number(dateKey.slice(5, 7)) - 1)
      .filter(function (h) { return h.date === dateKey; });
  }

  /* ---------------- content in the chosen language ---------------- */

  var SUGGESTIONS = {
    en: ["Best study timetable for exams", "Weather in Dindigul", "Tamil movie songs", "Explain photosynthesis", "ISRO Chandrayaan news"],
    ta: ["பத்தாம் வகுப்பு பாடம்", "இன்றைய வானிலை திண்டுக்கல்", "தமிழ் பாடல்கள்", "ஒளிச்சேர்க்கை விளக்கம்", "இஸ்ரோ செய்திகள்"],
    hi: ["परीक्षा की तैयारी", "आज का मौसम", "हिंदी गाने", "प्रकाश संश्लेषण", "इसरो समाचार"]
  };
  function suggestions() { return SUGGESTIONS[lang] || SUGGESTIONS.en; }

  /* ---------------- greeting ---------------- */

  function greeting() {
    var h = new Date().getHours();
    if (h < 12) return t("greeting_morning");
    if (h < 17) return t("greeting_afternoon");
    if (h < 21) return t("greeting_evening");
    return t("greeting_night");
  }

  /* ---------------- boot ---------------- */

  function boot() {
    document.documentElement.lang = lang;
    applyTheme();
    renderDock();
    applyLanguage();
    document.addEventListener("nexus-dock", renderDock);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  function setLight(on) {
    store.set("nexus-light", !!on);
    applyTheme();
  }

  window.NexusCore = {
    get light() { return !!store.get("nexus-light", false); },
    setLight: setLight,
    LANGS: LANGS, langInfo: langInfo, get lang() { return lang; }, setLang: setLang, t: t, applyLanguage: applyLanguage,
    sound: sound, tone: tone,
    WALLPAPERS: WALLPAPERS, ACCENTS: ACCENTS, setWallpaper: setWallpaper, setAccent: setAccent, applyTheme: applyTheme,
    get wallpaper() { return store.get("nexus-wallpaper", "aurora"); },
    get accent() { return store.get("nexus-accent", "violet"); },
    DOCK_CHOICES: DOCK_CHOICES, getDock: getDock, setDock: setDock, renderDock: renderDock,
    holidaysInMonth: holidaysInMonth, holidaysOn: holidaysOn, HOLIDAYS: HOLIDAYS,
    suggestions: suggestions, greeting: greeting
  };
})();
