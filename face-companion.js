/* Nexus OS — Floating Face Companion
   A draggable AI buddy that watches the user's face through the camera,
   reads expressions (via face-api.js) and reacts to what happens on screen. */
(function () {
  "use strict";

  var FACE_API_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
  var MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

  var EXPRESSIONS = {
    happy:     { emoji: "😄", lines: ["You look happy! Love it!", "That smile made my day!"] },
    sad:       { emoji: "🥺", lines: ["You seem a bit down… want some music?", "Cheer up! I'm here with you."] },
    surprised: { emoji: "😲", lines: ["Whoa! What did you just see?!", "You look amazed!"] },
    angry:     { emoji: "😟", lines: ["Take a deep breath… everything's fine.", "Rough moment? I'm with you."] },
    fearful:   { emoji: "😨", lines: ["Don't worry, I've got you!", "It's okay, you're safe here."] },
    disgusted: { emoji: "🤢", lines: ["Yikes! What was that face?", "Not a fan of that, huh?"] },
    neutral:   { emoji: "🙂", lines: ["All calm. Nice focus!", "Looking cool and collected."] }
  };

  var APP_REACTIONS = {
    music: "🎵 Music time! Want me to vibe along?",
    youtube: "▶ YouTube! Don't fall into a rabbit hole!",
    camera: "📷 Say cheese!",
    games: "🧩 Game time! Good luck!",
    notes: "▤ Great ideas start in notes.",
    terminal: "›_ Hacker mode: ON.",
    settings: "⚙ Tweaking things? Careful in there!",
    ai: "🤖 Visiting my cousin Nexus AI?",
    gallery: "🖼️ Looking at memories?",
    browser: "🌐 Surfing the web!"
  };

  var state = {
    stream: null,
    video: null,
    modelsReady: false,
    watching: false,
    detecting: false,
    lastExpression: null,
    lastSpeakAt: 0,
    bubbleTimer: null,
    loadPromise: null,
    voiceEnabled: false,
    screenTimer: null,
    lastScreenKey: "",
    lastScreenAt: 0
  };

  function el(tag, cls, html) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (html != null) node.innerHTML = html;
    return node;
  }

  /* Drawn robot face (SVG) — works on every device, no emoji font needed. */
  var MOUTHS = {
    idle:      "M38 66 Q50 72 62 66",
    happy:     "M34 62 Q50 82 66 62 Z",
    sad:       "M36 72 Q50 60 64 72",
    surprised: "M50 62 m-7 0 a7 9 0 1 0 14 0 a7 9 0 1 0 -14 0",
    angry:     "M36 70 L64 70",
    fearful:   "M36 70 Q43 64 50 70 Q57 76 64 70",
    disgusted: "M36 68 Q46 74 52 66 Q58 60 64 68",
    neutral:   "M38 67 L62 67"
  };
  var BROWS = {
    sad: ["M28 34 L42 30", "M58 30 L72 34"],
    angry: ["M28 30 L42 36", "M58 36 L72 30"],
    surprised: ["M28 26 Q35 22 42 26", "M58 26 Q65 22 72 26"],
    fearful: ["M28 32 L42 27", "M58 27 L72 32"]
  };
  function faceSVG(expr) {
    var mouth = MOUTHS[expr] || MOUTHS.idle;
    var filled = expr === "happy" || expr === "surprised";
    var eyeH = expr === "surprised" || expr === "fearful" ? 9 : (expr === "happy" ? 4 : 7);
    var brows = BROWS[expr] || [];
    var b = brows.map(function (d) { return "<path d='" + d + "' stroke='#9fb4ff' stroke-width='3' stroke-linecap='round' fill='none'/>"; }).join("");
    return "<svg class='fc-face' viewBox='0 0 100 100' aria-hidden='true'>" +
      "<line x1='50' y1='4' x2='50' y2='14' stroke='#7c8cff' stroke-width='3'/><circle cx='50' cy='4' r='4' fill='#4ade80'/>" +
      "<rect x='14' y='14' width='72' height='74' rx='24' fill='#dfe6ff'/>" +
      "<rect x='20' y='22' width='60' height='58' rx='18' fill='#141a33'/>" + b +
      "<g class='fc-eyes'><ellipse cx='37' cy='45' rx='6' ry='" + eyeH + "' fill='#5eead4'/><ellipse cx='63' cy='45' rx='6' ry='" + eyeH + "' fill='#5eead4'/></g>" +
      "<path d='" + mouth + "' stroke='#5eead4' stroke-width='3.5' stroke-linecap='round' fill='" + (filled ? "#5eead4" : "none") + "'/>" +
      (expr === "sad" ? "<ellipse cx='30' cy='56' rx='2.5' ry='4' fill='#60a5fa'/>" : "") +
      "</svg>";
  }

  function buildUI() {
    var wrap = el("div", "face-companion");
    wrap.id = "face-companion";

    var bubble = el("div", "face-companion-bubble");
    bubble.id = "fc-bubble";

    var avatar = el("div", "face-companion-avatar", faceSVG("idle") + "<span class='face-companion-status'></span>");
    avatar.id = "fc-avatar";
    avatar.title = "Nexus Face Buddy — drag me, or use the buttons";

    var actions = el("div", "face-companion-actions");
    var chatBtn = el("button", null, "💬 Talk");
    chatBtn.id = "fc-chat-btn";
    chatBtn.title = "Talk to me";
    chatBtn.setAttribute("aria-label", "Talk to me");
    var camBtn = el("button", null, "📷 Watch me");
    camBtn.id = "fc-cam-btn";
    var hiBtn = el("button", null, "◉ Screen");
    hiBtn.id = "fc-hi-btn";
    hiBtn.title = "Talk about this screen";
    hiBtn.setAttribute("aria-label", "Talk about this screen");
    var voiceBtn = el("button", null, "🔇");
    voiceBtn.id = "fc-voice-btn";
    voiceBtn.title = "Turn voice on";
    voiceBtn.setAttribute("aria-label", "Turn voice on");
    voiceBtn.setAttribute("aria-pressed", "false");
    actions.appendChild(chatBtn);
    actions.appendChild(camBtn);
    actions.appendChild(hiBtn);
    actions.appendChild(voiceBtn);

    wrap.appendChild(bubble);
    wrap.appendChild(avatar);
    wrap.appendChild(actions);
    document.body.appendChild(wrap);

    buildChatPanel();

    makeDraggable(wrap, avatar);

    chatBtn.addEventListener("click", toggleChat);
    camBtn.addEventListener("click", toggleCamera);
    hiBtn.addEventListener("click", function () { talkScreen(true); });
    voiceBtn.addEventListener("click", function () {
      if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
        speak("Voice isn't available in this browser. I'll keep talking in the bubble.");
        return;
      }
      state.voiceEnabled = !state.voiceEnabled;
      voiceBtn.textContent = state.voiceEnabled ? "🔊" : "🔇";
      voiceBtn.title = state.voiceEnabled ? "Mute voice" : "Turn voice on";
      voiceBtn.setAttribute("aria-label", voiceBtn.title);
      voiceBtn.setAttribute("aria-pressed", String(state.voiceEnabled));
      window.speechSynthesis.cancel();
      if (state.voiceEnabled) talkScreen(true);
    });
  }

  /* ---------- Brain bridge (works without nexus-companion-brain.js) ---------- */
  function brain() { return window.NexusCompanionBrain || null; }

  function brainCall(fn, fallback) {
    var b = brain();
    if (!b || typeof b[fn] !== "function") return fallback;
    try { return b[fn](); } catch (_) { return fallback; }
  }

  /* ---------- Chat panel ---------- */
  function buildChatPanel() {
    var panel = el("div", "face-companion-chat");
    panel.id = "fc-chat";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Chat with your Nexus companion");

    var head = el("div", "fc-chat-head");
    head.appendChild(el("span", null, "🤖"));
    var titleBox = el("div");
    titleBox.appendChild(el("strong", null, "Nexus Buddy"));
    var sub = el("div", "fc-chat-sub");
    sub.textContent = "remembers you";
    titleBox.appendChild(sub);
    head.appendChild(titleBox);
    var closeBtn = el("button", null, "✕");
    closeBtn.setAttribute("aria-label", "Close chat");
    head.appendChild(closeBtn);

    var log = el("div", "fc-chat-log");
    log.id = "fc-chat-log";

    var form = el("form", "fc-chat-form");
    var input = el("input");
    input.type = "text";
    input.placeholder = "Say something…";
    input.autocomplete = "off";
    input.maxLength = 800;
    input.setAttribute("aria-label", "Message your companion");
    var send = el("button", null, "➤");
    send.type = "submit";
    send.setAttribute("aria-label", "Send");
    form.appendChild(input);
    form.appendChild(send);

    panel.appendChild(head);
    panel.appendChild(log);
    panel.appendChild(form);
    document.body.appendChild(panel);

    closeBtn.addEventListener("click", function () { panel.classList.remove("open"); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      input.value = "";
      sendToCompanion(text);
    });
  }

  function addMsg(role, text) {
    var log = document.getElementById("fc-chat-log");
    if (!log) return null;
    var node = el("div", "fc-msg " + role);
    node.textContent = text;
    log.appendChild(node);
    log.scrollTop = log.scrollHeight;
    return node;
  }

  function toggleChat() {
    var panel = document.getElementById("fc-chat");
    if (!panel) return;
    var opening = !panel.classList.contains("open");
    panel.classList.remove("open");
    if (!opening) return;
    panel.classList.add("open");
    var log = document.getElementById("fc-chat-log");
    if (log && !log.childElementCount) {
      var b = brain();
      var hello = b && typeof b.onGreet === "function" ? b.onGreet() : null;
      addMsg("me", hello || "Hi! I'm here. What's up?");
      if (b && typeof b.summary === "function") {
        var sub = document.querySelector(".fc-chat-sub");
        if (sub) sub.textContent = b.summary();
      }
    }
    var input = panel.querySelector("input");
    if (input) setTimeout(function () { input.focus(); }, 120);
  }

  function sendToCompanion(text) {
    addMsg("them", text);
    var typing = addMsg("me typing", "…");
    var b = brain();
    var mood = state.lastExpression && state.lastExpression !== "away" ? state.lastExpression : null;

    function answer(reply) {
      if (typing && typing.parentNode) typing.parentNode.removeChild(typing);
      var out = typeof reply === "string" ? reply : (reply && reply.text) || "…";
      addMsg("me", out);
      speak(out);
      if (mood && mood !== "neutral" && Math.random() < 0.5) react(mood, out);
      else react(null, out);
    }

    if (b && typeof b.ask === "function") {
      var p = b.ask(text);
      if (p && typeof p.then === "function") p.then(answer).catch(function () { answer("Something broke in my head there. Say that again?"); });
      else answer(p);
      return;
    }

    /* No brain loaded: keep the old instant behaviour. */
    setTimeout(function () { answer(replyLineFor(text)); }, 500);
  }

  function replyLineFor(text) {
    var t = String(text).toLowerCase();
    if (/sad|lonely|alone|tired|stress/.test(t)) return "I'm here with you. Want to talk about it?";
    if (/hi|hello|hey/.test(t)) return "Hey! Good to see you.";
    if (/thank/.test(t)) return "Anytime.";
    return "Tell me more — I'm listening.";
  }

  /* ---------- Personality picker ---------- */
  function openPersonalityPicker() {
    var b = brain();
    if (!b) { speak("Personality settings need the brain file loaded."); return; }
    var wrap = el("div", "fc-picker");
    var card = el("div", "fc-picker-card");
    card.appendChild(el("h3", null, "How should I behave?"));
    card.appendChild(el("p", null, "Pick one. You can change it any time by long-pressing my face."));
    var opts = b.PERSONALITIES || {};
    Object.keys(opts).forEach(function (key) {
      var o = opts[key];
      var btn = el("button", "fc-pick" + (b.personality === key ? " is-on" : ""));
      btn.type = "button";
      var em = el("span", null, o.emoji);
      var txt = el("div");
      txt.appendChild(document.createTextNode(o.label));
      var small = el("small", null, (o.style || "").split(" — ")[0]);
      txt.appendChild(small);
      btn.appendChild(em);
      btn.appendChild(txt);
      btn.addEventListener("click", function () {
        b.personality = key;
        wrap.classList.remove("open");
        react(null, "Okay — " + o.label.toLowerCase() + " it is. " + o.emoji);
      });
      card.appendChild(btn);
    });
    wrap.appendChild(card);
    wrap.addEventListener("click", function (e) { if (e.target === wrap) wrap.classList.remove("open"); });
    document.body.appendChild(wrap);
    wrap.classList.add("open");
  }

  function makeDraggable(wrap, handle) {
    var startX, startY, baseRight, baseBottom, moved;
    handle.addEventListener("pointerdown", function (e) {
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      var rect = wrap.getBoundingClientRect();
      baseRight = window.innerWidth - rect.right;
      baseBottom = window.innerHeight - rect.bottom;
      handle.setPointerCapture(e.pointerId);
    });
    handle.addEventListener("pointermove", function (e) {
      if (startX == null) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      var right = Math.min(Math.max(baseRight - dx, 4), window.innerWidth - 80);
      var bottom = Math.min(Math.max(baseBottom - dy, 4), window.innerHeight - 120);
      wrap.style.right = right + "px";
      wrap.style.bottom = bottom + "px";
    });
    var holdTimer = null;
    handle.addEventListener("pointerup", function () {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
      if (!moved) {
        var line = brainCall("onGreet", null);
        if (!line) {
          line = state.watching
            ? "I'm watching your expressions! Smile at me 😄"
            : "Tap “💬 Talk” to chat, or “📷 Watch me” so I can see your face!";
        }
        react(null, line);
      }
      startX = startY = null;
    });
    /* Long-press = personality settings. */
    handle.addEventListener("pointerdown", function () {
      holdTimer = setTimeout(function () {
        holdTimer = null;
        moved = true;
        openPersonalityPicker();
      }, 700);
    });
  }

  function speak(text, holdMs) {
    var bubble = document.getElementById("fc-bubble");
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add("show");
    if (state.voiceEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      utterance.rate = 1;
      utterance.onstart = function () { document.getElementById("fc-avatar").classList.add("talking"); };
      function done() { document.getElementById("fc-avatar").classList.remove("talking"); }
      utterance.onend = done;
      utterance.onerror = done;
      window.speechSynthesis.speak(utterance);
    }
    clearTimeout(state.bubbleTimer);
    state.bubbleTimer = setTimeout(function () {
      bubble.classList.remove("show");
    }, holdMs || 3500);
  }

  function react(expression, forcedLine) {
    var avatar = document.getElementById("fc-avatar");
    if (!avatar) return;
    var info = expression && EXPRESSIONS[expression];
    var status = avatar.querySelector(".face-companion-status");
    avatar.innerHTML = faceSVG(info ? expression : "idle");
    if (status) avatar.appendChild(status);
    avatar.classList.remove("react");
    void avatar.offsetWidth;
    avatar.classList.add("react");

    var line = forcedLine;
    if (!line && info) {
      line = info.lines[Math.floor(Math.random() * info.lines.length)];
    }
    if (line) speak(line);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function ensureModels() {
    if (state.loadPromise) return state.loadPromise;
    state.loadPromise = loadScript(FACE_API_URL).then(function () {
      return Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
    }).then(function () {
      state.modelsReady = true;
    });
    return state.loadPromise;
  }

  function toggleCamera() {
    if (state.watching) {
      stopWatching();
    } else {
      startWatching();
    }
  }

  function startWatching() {
    var btn = document.getElementById("fc-cam-btn");
    btn.textContent = "⏳ Loading…";
    speak("Warming up my eyes… 👀");

    ensureModels().then(function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported in this browser.");
      }
      return navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false
      });
    }).then(function (stream) {
      state.stream = stream;
      var preview = el("div", "face-companion-preview");
      preview.id = "fc-preview";
      var video = el("video");
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      preview.appendChild(video);
      preview.appendChild(el("small", null, "You (only I can see this)"));
      document.body.appendChild(preview);
      state.video = video;

      state.watching = true;
      document.getElementById("fc-avatar").classList.add("watching");
      btn.textContent = "🙈 Stop";
      react("happy", "I can see you now! Smile, frown, look surprised — I'll react!");
      video.addEventListener("playing", function () {
        if (!state.detecting) {
          state.detecting = true;
          detectLoop();
        }
      });
    }).catch(function (err) {
      btn.textContent = "📷 Watch me";
      state.watching = false;
      speak("😢 " + (err && err.name === "NotAllowedError"
        ? "Camera permission was denied. Allow it to let me see you!"
        : "I couldn't open the camera here."));
    });
  }

  function stopWatching() {
    state.watching = false;
    state.detecting = false;
    state.lastExpression = null;
    if (state.stream) {
      state.stream.getTracks().forEach(function (t) { t.stop(); });
      state.stream = null;
    }
    var preview = document.getElementById("fc-preview");
    if (preview) preview.remove();
    state.video = null;
    document.getElementById("fc-avatar").classList.remove("watching");
    document.getElementById("fc-cam-btn").textContent = "📷 Watch me";
    react(null, "Okay, eyes closed. 🙈 Tap “Watch me” anytime!");
  }

  function detectLoop() {
    if (!state.detecting || !state.video) return;
    var options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
    faceapi.detectSingleFace(state.video, options).withFaceExpressions()
      .then(function (result) {
        if (!state.detecting) return;
        if (!result) {
          if (state.lastExpression !== "away" && Date.now() - state.lastSpeakAt > 8000) {
            state.lastExpression = "away";
            react(null, "Where did you go? 👀 Come back!");
            state.lastSpeakAt = Date.now();
          }
          return;
        }
        var expressions = result.expressions;
        var best = "neutral";
        var bestScore = 0;
        Object.keys(expressions).forEach(function (key) {
          if (expressions[key] > bestScore) {
            bestScore = expressions[key];
            best = key;
          }
        });
        if (best !== state.lastExpression && bestScore > 0.55 &&
            Date.now() - state.lastSpeakAt > 4000) {
          state.lastExpression = best;
          state.lastSpeakAt = Date.now();
          var brainLine = null;
          var b = brain();
          if (b && typeof b.onMood === "function") {
            try { brainLine = b.onMood(best); } catch (_) { brainLine = null; }
          }
          react(best, brainLine || undefined);
        } else {
          state.lastExpression = best;
        }
      })
      .catch(function () { /* keep looping on transient errors */ })
      .finally(function () {
        if (state.detecting) setTimeout(detectLoop, 700);
      });
  }

  function talkScreen(force) {
    if (!window.NexusCompanionScreen || document.hidden) return;
    var context = window.NexusCompanionScreen.context(document);
    var key = JSON.stringify(context);
    if (!force && key === state.lastScreenKey) return;
    var elapsed = Date.now() - state.lastScreenAt;
    if (!force && elapsed < 8000) {
      clearTimeout(state.screenTimer);
      state.screenTimer = setTimeout(function () { talkScreen(false); }, 8000 - elapsed);
      return;
    }
    state.lastScreenKey = key;
    state.lastScreenAt = Date.now();
    state.lastSpeakAt = Date.now();
    react("happy", window.NexusCompanionScreen.describe(context));
  }

  /* Observe Nexus windows, not the camera or the companion's own bubble. */
  function watchScreen() {
    function schedule() {
      clearTimeout(state.screenTimer);
      state.screenTimer = setTimeout(function () { talkScreen(false); }, 900);
    }
    var layer = document.getElementById("app-layer");
    if (layer) {
      new MutationObserver(schedule).observe(layer, { childList: true, subtree: true,
        characterData: true, attributes: true, attributeFilter: ["class", "hidden"] });
      layer.addEventListener("input", schedule);
      layer.addEventListener("change", schedule);
      layer.addEventListener("click", schedule);
    }
    var music = document.getElementById("music-status");
    if (music) new MutationObserver(schedule).observe(music, { childList: true, characterData: true, subtree: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && window.speechSynthesis) window.speechSynthesis.cancel();
      else schedule();
    });
  }

  /* ---------- Idle nudge: it notices when you go quiet ---------- */
  function watchIdle() {
    var lastAct = Date.now();
    function touch() { lastAct = Date.now(); }
    ["click", "keydown", "touchstart", "pointermove"].forEach(function (ev) {
      window.addEventListener(ev, touch, { passive: true });
    });
    setInterval(function () {
      if (document.hidden || state.watching) return;
      var mins = Math.floor((Date.now() - lastAct) / 60000);
      if (mins < 3 || Date.now() - state.lastSpeakAt < 60000) return;
      var key = "idle" + mins;
      if (state.lastIdleKey === key) return;
      state.lastIdleKey = key;
      var b = brain();
      if (!b || typeof b.onIdle !== "function") return;
      var line = null;
      try { line = b.onIdle(mins); } catch (_) { line = null; }
      if (line) react(null, line);
    }, 30000);
  }

  function init() {
    if (document.getElementById("face-companion")) return;
    buildUI();
    watchScreen();
    watchIdle();
    var b = brain();
    if (b && typeof b.boot === "function") { try { b.boot(); } catch (_) {} }
    setTimeout(function () {
      var line = brainCall("onGreet", null);
      if (line) { react(null, line); return; }
      if (!state.lastScreenKey) talkScreen(true);
    }, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
