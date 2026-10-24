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
  /* Ramesh's drawing, exactly: a tall rectangle, two dark bars inside it,
     a strap curving up from the top and one curving down from the bottom.
     Nothing else — the bars are the only thing that moves. */
  function faceSVG(expr) {
    var e = expr || "idle";
    var barW = e === "sad" ? 26 : e === "happy" || e === "surprised" ? 30 : 28;
    var tilt = e === "sad" ? -5 : e === "happy" ? 4 : e === "angry" ? 6 : 0;
    var upY = e === "surprised" ? 44 : e === "happy" ? 46 : 48;
    var loY = e === "surprised" ? 70 : e === "happy" ? 70 : 72;
    return "<svg class='fc-face' viewBox='0 0 100 140' preserveAspectRatio='xMidYMid meet' aria-hidden='true'>" +
      "<path class='fc-strap fc-strap-top' d='M44 40 C40 16 50 8 62 10' stroke='#cfd8ee' stroke-width='7' stroke-linecap='round' fill='none'/>" +
      "<rect class='fc-body' x='24' y='36' width='52' height='74' rx='3' fill='#dfe6f4'/>" +
      "<g class='fc-bars' transform='rotate(" + tilt + " 50 74)'>" +
        "<rect class='fc-bar fc-bar-up' x='" + (50 - barW / 2) + "' y='" + upY + "' width='" + barW + "' height='9' rx='4.5' fill='#7c879d'/>" +
        "<rect class='fc-bar fc-bar-low' x='" + (50 - barW / 2) + "' y='" + loY + "' width='" + barW + "' height='9' rx='4.5' fill='#7c879d'/>" +
      "</g>" +
      "<path class='fc-strap fc-strap-bottom' d='M56 110 C60 134 50 142 38 140' stroke='#cfd8ee' stroke-width='7' stroke-linecap='round' fill='none'/>" +
      "</svg>";
  }

  /* ---------- Top AI bar: avatar + input, pinned, takes no page space ---------- */
  function buildBar() {
    /* The face alone, in the top centre. Nothing else sits in this bar. */
    var bar = el("div", "fc-bar");
    bar.id = "fc-bar";

    var avatar = el("div", "fc-bar-avatar", faceSVG("idle") + "<span class='face-companion-status'></span>");
    avatar.id = "fc-avatar";
    avatar.title = "Nexus Buddy — double tap to talk, hold for personality";
    avatar.setAttribute("role", "button");
    avatar.setAttribute("tabindex", "0");
    avatar.setAttribute("aria-label", "Nexus Buddy — double tap to talk, hold for personality");

    bar.appendChild(avatar);
    document.body.appendChild(bar);

    /* The page starts below the bar, so the bar never covers content. */
    document.documentElement.style.setProperty("--fc-bar-h", "56px");
    applyBarHeight();

    /* Double tap = live talk. Hold = personality. One tap does nothing,
       so you can never open it by accident. */
    var holdTimer = null;
    var taps = 0;
    var tapTimer = null;
    var held = false;

    avatar.addEventListener("pointerdown", function (e) {
      if (e) e.preventDefault();
      held = false;
      holdTimer = setTimeout(function () {
        holdTimer = null;
        held = true;
        openPersonalityPicker();
      }, 650);
    });
    avatar.addEventListener("pointerup", function () {
      if (held) return;                       /* that was a long press */
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
      taps++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(function () { taps = 0; }, 420);
      if (taps >= 2) {
        taps = 0;
        clearTimeout(tapTimer);
        startLiveTalk();
      }
    });
    avatar.addEventListener("pointerleave", function () {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    });
    avatar.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startLiveTalk(); }
    });
    /* Double tap on a touchscreen also fires dblclick on some browsers. */
    avatar.addEventListener("dblclick", function (e) { e.preventDefault(); startLiveTalk(); });
    /* Voice and camera live in the chat header now; the bar holds the face only. */
    var voiceBtn = document.getElementById("fc-voice-btn");
    if (voiceBtn) voiceBtn.addEventListener("click", toggleVoice);
    var camBtn = document.getElementById("fc-cam-btn");
    if (camBtn) camBtn.addEventListener("click", toggleCamera);
  }

  /* Measure the bar (incl. the phone's safe-area inset) and reserve that space. */
  function applyBarHeight() {
    var bar = document.getElementById("fc-bar");
    if (!bar) return;
    var h = Math.round(bar.getBoundingClientRect().height);
    if (h > 0) document.documentElement.style.setProperty("--fc-bar-h", h + "px");
  }

  function toggleVoice() {
    var voiceBtn = document.getElementById("fc-voice-btn");
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      speak("Voice isn't available in this browser. I'll keep talking in the bubble.");
      return;
    }
    state.voiceEnabled = !state.voiceEnabled;
    if (voiceBtn) {
      voiceBtn.textContent = state.voiceEnabled ? "🔊" : "🔇";
      voiceBtn.title = state.voiceEnabled ? "Mute voice" : "Turn voice on";
      voiceBtn.setAttribute("aria-label", voiceBtn.title);
      voiceBtn.setAttribute("aria-pressed", String(state.voiceEnabled));
    }
    window.speechSynthesis.cancel();
    if (state.voiceEnabled) speak("Voice on.");
  }

  /* Speak into the bar instead of typing. */
  function startListening() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var input = document.getElementById("fc-bar-input");
    if (!SR || !input) { speak("Voice input isn't supported in this browser."); return; }
    try {
      var rec = new SR();
      rec.lang = "en-IN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      var resting = "Type, or tap 🎤 to speak…";
      input.placeholder = "Listening… speak now";
      var fb = document.getElementById("fc-bubble");
      if (fb) { fb.textContent = "Listening… 🎤"; fb.classList.add("show"); }
      rec.onresult = function (e) {
        var text = (e.results[0][0].transcript || "").trim();
        input.placeholder = resting;
        if (text) sendToCompanion(text);
      };
      rec.onerror = function () {
        input.placeholder = resting;
        var fb2 = document.getElementById("fc-bubble");
        if (fb2) { fb2.textContent = "I couldn't hear that — try typing?"; fb2.classList.add("show"); }
      };
      rec.onend = function () { input.placeholder = resting; };
      rec.start();
    } catch (_) { input.placeholder = "Ask me anything…"; }
  }

  function buildUI() {
    buildBar();
    buildChatPanel();
  }

  function buildLegacyUI() {
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

    makeDraggable(wrap, avatar);

    chatBtn.addEventListener("click", toggleChat);
    camBtn.addEventListener("click", toggleCamera);
    hiBtn.addEventListener("click", function () { talkScreen(true); });
    voiceBtn.addEventListener("click", toggleVoice);
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
    var newBtn = el("button", null, "⟳");
    newBtn.setAttribute("aria-label", "Start a new chat");
    newBtn.title = "Start a new chat";
    var closeBtn = el("button", null, "✕");
    closeBtn.setAttribute("aria-label", "Close chat");
    head.appendChild(newBtn);
    head.appendChild(closeBtn);

    var log = el("div", "fc-chat-log");
    log.id = "fc-chat-log";

    /* Typing still works — the input lives inside the panel, out of the way
       until you need it. */
    var form = el("form", "fc-chat-form");
    form.id = "fc-bar-form";
    var input = el("input");
    input.type = "text";
    input.id = "fc-bar-input";
    input.placeholder = "Type, or tap 🎤 to speak…";
    input.autocomplete = "off";
    input.maxLength = 800;
    input.setAttribute("aria-label", "Message your Nexus companion");
    input.setAttribute("enterkeyhint", "send");
    var mic = el("button", null, "🎤");
    mic.type = "button";
    mic.setAttribute("aria-label", "Speak to your companion");
    var send = el("button", null, "➤");
    send.type = "submit";
    send.setAttribute("aria-label", "Send");
    form.appendChild(input);
    form.appendChild(mic);
    form.appendChild(send);

    panel.appendChild(head);
    panel.appendChild(log);
    panel.appendChild(form);
    document.body.appendChild(panel);

    newBtn.addEventListener("click", function () {
      if (log) log.innerHTML = "";
      openChat(true);
    });
    closeBtn.addEventListener("click", closeChat);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      input.value = "";
      sendToCompanion(text);
    });
    mic.addEventListener("click", startListening);
  }

  /* Double tap on the face = live talk: open the chat and start listening. */
  function startLiveTalk() {
    /* Live talk means it answers out loud, like a friend on a call. */
    if (!state.voiceEnabled && "speechSynthesis" in window) {
      state.voiceEnabled = true;
      var vb = document.getElementById("fc-voice-btn");
      if (vb) {
        vb.textContent = "🔊";
        vb.title = "Mute voice";
        vb.setAttribute("aria-label", "Mute voice");
        vb.setAttribute("aria-pressed", "true");
      }
      refreshVoices();
    }
    openChat(true);
    var line = brainCall("onGreet", null);
    if (line) addMsg("me", line);
    setTimeout(startListening, 250);
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

  function openChat(force) {
    var panel = document.getElementById("fc-chat");
    var bar = document.getElementById("fc-bar");
    if (!panel || !bar) return;
    panel.classList.add("open");
    bar.classList.add("is-open");
    var log = document.getElementById("fc-chat-log");
    if (log && !log.childElementCount) {
      var b = brain();
      var hello = b && typeof b.onGreet === "function" ? b.onGreet() : null;
      addMsg("me", hello || "Hi! I'm here. What's up?");
      var sub = panel.querySelector(".fc-chat-sub");
      if (sub && b && typeof b.summary === "function") sub.textContent = b.summary();
    }
    var input = bar.querySelector("input");
    if (input && force !== false) setTimeout(function () { input.focus(); }, 120);
  }

  function closeChat() {
    var panel = document.getElementById("fc-chat");
    var bar = document.getElementById("fc-bar");
    if (panel) panel.classList.remove("open");
    if (bar) {
      bar.classList.remove("is-open");
      var input = bar.querySelector("input");
      if (input) input.blur();
    }
  }

  function toggleChat() {
    var panel = document.getElementById("fc-chat");
    if (!panel) return;
    if (panel.classList.contains("open")) closeChat();
    else openChat(true);
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

  function sayInBar(text) {
    var input = document.getElementById("fc-bar-input");
    if (input && !input.matches(":focus")) {
      input.placeholder = text.replace(/\s+/g, " ").slice(0, 90);
      clearTimeout(state.barTimer);
      state.barTimer = setTimeout(function () {
        if (input) input.placeholder = "Ask me anything…";
      }, 4200);
    }
  }

  /* A friend's voice, not a cartoon: an adult English-Indian voice when the
     phone has one, spoken a touch slower and lower than the default. */
  var VOICE_PREF = ["Google UK English Female", "Google US English", "Samantha", "Microsoft Neerja Online (Natural) - English (India)",
    "Microsoft Heera - English (India)", "Veena", "Rishi", "Google UK English Male", "Microsoft Ravi - English (India)"];
  var pickedVoice = null;

  function pickVoice() {
    if (!("speechSynthesis" in window)) return null;
    var voices = window.speechSynthesis.getVoices() || [];
    if (!voices.length) return null;
    /* 1) an explicitly preferred name */
    for (var i = 0; i < VOICE_PREF.length; i++) {
      var v = voices.filter(function (x) { return x.name === VOICE_PREF[i]; })[0];
      if (v) return v;
    }
    /* 2) any Indian English voice that is not a child/small voice */
    var inEn = voices.filter(function (x) {
      return /en[-_]IN/i.test(x.lang) && !/child|kid|junior|baby/i.test(x.name);
    });
    if (inEn.length) return inEn[0];
    /* 3) any adult English voice */
    var en = voices.filter(function (x) {
      return /^en/i.test(x.lang) && !/child|kid|junior|baby/i.test(x.name);
    });
    return en[0] || voices[0];
  }

  function refreshVoices() {
    pickedVoice = pickVoice();
  }
  if ("speechSynthesis" in window) {
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
    setTimeout(refreshVoices, 600);
  }

  function speak(text, holdMs) {
    sayInBar(text);
    var bubble = document.getElementById("fc-bubble");
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add("show");
    if (state.voiceEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      var clean = String(text).replace(/[*_`#>]/g, "").replace(/\[\[.*?\]\]/g, "").replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, "").trim();
      if (!clean) return;
      var utterance = new SpeechSynthesisUtterance(clean);
      var v = pickedVoice || pickVoice();
      if (v) { utterance.voice = v; pickedVoice = v; }
      utterance.lang = (v && v.lang) || (window.NexusCore && NexusCore.lang === "ta" ? "ta-IN" : NexusCore && NexusCore.lang === "hi" ? "hi-IN" : "en-IN");
      utterance.rate = 0.94;      /* unhurried, like someone talking to you */
      utterance.pitch = 0.92;     /* a little lower than default — not a child */
      utterance.volume = 1;
      utterance.onstart = function () { var a = document.getElementById("fc-avatar"); if (a) a.classList.add("talking"); };
      function done() { var a = document.getElementById("fc-avatar"); if (a) a.classList.remove("talking"); }
      utterance.onend = done;
      utterance.onerror = done;
      window.speechSynthesis.speak(utterance);
      /* Some Android builds pause long utterances; this nudges it along. */
      var keepAlive = setTimeout(function () {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);
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
    if (btn) btn.textContent = "⏳";
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
      if (btn) btn.textContent = "🙈";
      react("happy", "I can see you now! Smile, frown, look surprised — I'll react!");
      video.addEventListener("playing", function () {
        if (!state.detecting) {
          state.detecting = true;
          detectLoop();
        }
      });
    }).catch(function (err) {
      if (btn) btn.textContent = "📷";
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
    var camBtn = document.getElementById("fc-cam-btn");
    if (camBtn) camBtn.textContent = "📷";
    react(null, "Okay, eyes closed. 🙈 Tap “Watch me” anytime!");
  }

  function detectLoop() {
    if (!state.detecting || !state.video || document.hidden) return;
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
      if (document.hidden || state.watching) return;   /* paused while the tab is hidden */
      var mins = Math.floor((Date.now() - lastAct) / 60000);
      if (mins < 3 || Date.now() - state.lastSpeakAt < 60000) return;
      var key = "idle" + mins;
      if (state.lastIdleKey === key) return;
      state.lastIdleKey = key;
      var b = brain();
      if (!b || typeof b.onIdle !== "function") return;
      var line = null;
      try { line = b.onIdle(mins); } catch (_) { line = null; }
      if (line) { sayInBar(line); addMsg("me", line); }
    }, 30000);
  }

  function init() {
    if (document.getElementById("face-companion")) return;
    buildUI();
    watchScreen();
    watchIdle();
    var b = brain();
    if (b && typeof b.boot === "function") { try { b.boot(); } catch (_) {} }
    setTimeout(applyBarHeight, 300);
    window.addEventListener("resize", applyBarHeight);
    window.addEventListener("orientationchange", function () { setTimeout(applyBarHeight, 250); });
    setTimeout(function () {
      var line = brainCall("onGreet", null);
      if (line) { sayInBar(line); return; }
      if (!state.lastScreenKey) talkScreen(true);
    }, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
