/* Nexus OS — Companion Brain
   The memory, personality and reasoning layer for the floating Face Companion.

   What this adds over the old canned-line version:
     • Long-term memory  — remembers your name, mood history, what you told it,
                           your habits, and things you asked it to remember.
     • Personality       — funny / calm / teasing / caring, chosen once and kept.
     • Context           — time of day, exam week, how long you've been quiet,
                           what app you're in, what you did last time.
     • Real replies      — small talk stays instant and offline; anything else is
                           answered by the online model with memory in the prompt,
                           with a graceful offline fallback.

   Storage: localStorage key "nexus-companion-brain" (see Brain.load/save).
   No network call happens unless the user actually talks to it.
   ========================================================================== */
(function () {
  "use strict";

  var KEY = "nexus-companion-brain";
  var MAX_EVENTS = 120;      // rolling mood/activity log
  var MAX_LEARNED = 60;      // facts it picked up in conversation

  /* ---------- storage ---------- */

  var store = {
    read: function () {
      try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (_) { return null; }
    },
    write: function (v) {
      try { localStorage.setItem(KEY, JSON.stringify(v)); return true; } catch (_) { return false; }
    }
  };

  var state = null;

  function blank() {
    return {
      v: 1,
      personality: "funny",          // funny | calm | teasing | caring
      name: "",                      // what the user wants to be called
      facts: [],                     // things the user told it that matter
      events: [],                    // { t: timestamp, mood, app }
      lastSeen: 0,                   // timestamp of last interaction
      lastTalk: 0,                   // timestamp of last chat reply
      streakDays: [],                // "2026-10-24" strings of days it was opened
      moodCounts: {},                // { happy: 12, sad: 3, ... }
      learned: [],                   // { k: "like", v: "Anirudh songs", t: ts }
      notes: [],                     // things it decided to remember for the user
      greetingHour: null,            // last hour it greeted, so it greets once
      lastApp: "",
      lastAppAt: 0
    };
  }

  function load() {
    if (state) return state;
    var raw = store.read();
    state = raw && raw.v ? Object.assign(blank(), raw) : blank();
    if (!Array.isArray(state.events)) state.events = [];
    if (!Array.isArray(state.facts)) state.facts = [];
    if (!Array.isArray(state.learned)) state.learned = [];
    if (!Array.isArray(state.notes)) state.notes = [];
    if (!Array.isArray(state.streakDays)) state.streakDays = [];
    if (!state.moodCounts || typeof state.moodCounts !== "object") state.moodCounts = {};
    return state;
  }

  function save() {
    if (state) store.write(state);
  }

  function dayKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  /* ---------- personality ---------- */

  var PERSONALITIES = {
    funny: {
      label: "Funny",
      emoji: "😄",
      style: "warm, playful and quick with a light joke — but never at the user's expense, and you drop the jokes instantly if they seem upset",
      fillers: ["Okay listen 😄", "Right, so —", "Fun fact:", "Hear me out:"],
      comfort: [
        "That sounds heavy. I'm not going anywhere, so take your time.",
        "Bad days are allowed. You don't have to be okay every minute.",
        "I'm right here. Want to tell me what happened, or should I just stay quiet with you?"
      ]
    },
    calm: {
      label: "Calm",
      emoji: "🌿",
      style: "steady, unhurried and gentle — short sentences, no exclamation marks, no jokes unless the user makes one first",
      fillers: ["Okay.", "Mm.", "Right."],
      comfort: [
        "That's a lot to carry. Let's slow down for a second.",
        "You don't have to solve it right now. Just breathe once.",
        "I'm here. Tell me as much or as little as you want."
      ]
    },
    teasing: {
      label: "Teasing",
      emoji: "😏",
      style: "cheeky and affectionate like a best friend who roasts you, but reads the room and goes soft the moment something is actually wrong",
      fillers: ["Oh really? 😏", "Look at you.", "Bold choice.", "Sure, sure."],
      comfort: [
        "Okay, jokes off. What's actually wrong?",
        "Hey. I'm being serious for once — you alright?",
        "Come here. Tell me properly."
      ]
    },
    caring: {
      label: "Caring",
      emoji: "🤗",
      style: "attentive and reassuring, notices small things (eating, sleep, exams), asks one gentle follow-up question at a time",
      fillers: ["Hey,", "Okay so,", "I noticed —"],
      comfort: [
        "I'm here with you. You're not on your own in this.",
        "That sounds really hard. Thank you for telling me.",
        "Let's take it one small thing at a time. What's the heaviest part?"
      ]
    }
  };

  /* ---------- time helpers ---------- */

  function hour() { return new Date().getHours(); }
  function partOfDay() {
    var h = hour();
    if (h < 5) return "night";
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    if (h < 21) return "evening";
    return "night";
  }
  function sinceMs(ts) { return ts ? Date.now() - ts : Infinity; }

  /* ---------- mood ---------- */

  var NEGATIVE = { sad: 1, angry: 1, fearful: 1, disgusted: 1 };

  function recordMood(mood) {
    var s = load();
    s.moodCounts[mood] = (s.moodCounts[mood] || 0) + 1;
    s.events.push({ t: Date.now(), mood: mood });
    if (s.events.length > MAX_EVENTS) s.events = s.events.slice(-MAX_EVENTS);
    save();
  }

  function recordApp(app) {
    var s = load();
    if (!app) return;
    if (s.lastApp !== app) { s.lastApp = app; s.lastAppAt = Date.now(); }
    s.events.push({ t: Date.now(), app: app });
    if (s.events.length > MAX_EVENTS) s.events = s.events.slice(-MAX_EVENTS);
    save();
  }

  /* Was the user mostly low today? Used to decide tone, not to diagnose. */
  function moodToday() {
    var s = load(), today = dayKey(), neg = 0, pos = 0;
    s.events.forEach(function (e) {
      if (!e.mood || dayKey(new Date(e.t)) !== today) return;
      if (NEGATIVE[e.mood]) neg++;
      if (e.mood === "happy") pos++;
    });
    if (neg >= 3 && neg > pos) return "low";
    if (pos >= 3) return "good";
    return "neutral";
  }

  /* ---------- streak ---------- */

  function touchStreak() {
    var s = load(), today = dayKey();
    if (s.streakDays.indexOf(today) === -1) {
      s.streakDays.push(today);
      if (s.streakDays.length > 400) s.streakDays = s.streakDays.slice(-400);
      save();
    }
  }

  function streakLength() {
    var s = load(), n = 0, d = new Date();
    for (var i = 0; i < 400; i++) {
      if (s.streakDays.indexOf(dayKey(d)) === -1) {
        if (i === 0) { d.setDate(d.getDate() - 1); continue; } // today not counted yet is fine
        break;
      }
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  /* ---------- facts ---------- */

  function rememberFact(fact) {
    var s = load(), f = String(fact || "").trim().slice(0, 200);
    if (!f) return null;
    var lower = f.toLowerCase();
    var exists = s.facts.some(function (x) { return x.toLowerCase() === lower; });
    if (exists) return null;
    s.facts.push(f);
    if (s.facts.length > 40) s.facts = s.facts.slice(-40);
    save();
    return f;
  }

  function forgetFact(part) {
    var s = load(), p = String(part || "").toLowerCase();
    var before = s.facts.length;
    s.facts = s.facts.filter(function (x) { return x.toLowerCase().indexOf(p) === -1; });
    s.learned = s.learned.filter(function (x) { return String(x.v).toLowerCase().indexOf(p) === -1; });
    save();
    return before - s.facts.length;
  }

  function learn(kind, value) {
    var s = load(), v = String(value || "").trim().slice(0, 80);
    if (!v || v.length < 2) return;
    s.learned = s.learned.filter(function (x) { return !(x.k === kind && x.v.toLowerCase() === v.toLowerCase()); });
    s.learned.push({ k: kind, v: v, t: Date.now() });
    if (s.learned.length > MAX_LEARNED) s.learned = s.learned.slice(-MAX_LEARNED);
    save();
  }

  /* ---------- what it knows, as text for a prompt ---------- */

  function langName() {
    var code = (window.NexusCore && window.NexusCore.lang) || "en";
    return code === "ta" ? "Tamil" : code === "hi" ? "Hindi" : "English";
  }

  function memoryBlock() {
    var s = load(), lines = [];
    var name = s.name || "";
    if (name) lines.push("The user's name is " + name + ". Always use it naturally, not every message.");
    if (s.facts.length) lines.push("Things they told you about themselves: " + s.facts.slice(-12).join(" | "));
    var likes = s.learned.filter(function (x) { return x.k === "like"; }).map(function (x) { return x.v; });
    var dislikes = s.learned.filter(function (x) { return x.k === "dislike"; }).map(function (x) { return x.v; });
    var people = s.learned.filter(function (x) { return x.k === "person"; }).map(function (x) { return x.v; });
    var doing = s.learned.filter(function (x) { return x.k === "doing"; }).map(function (x) { return x.v; });
    if (likes.length) lines.push("They like: " + likes.slice(-6).join(", ") + ".");
    if (dislikes.length) lines.push("They dislike: " + dislikes.slice(-4).join(", ") + ".");
    if (people.length) lines.push("People in their life: " + people.slice(-6).join(", ") + ".");
    if (doing.length) lines.push("Currently on their plate: " + doing.slice(-4).join("; ") + ".");
    var st = streakLength();
    if (st > 1) lines.push("They've opened Nexus " + st + " days in a row.");
    var m = moodToday();
    if (m === "low") lines.push("Today their face has looked low several times. Be gentle, don't be cheerful at them, and don't ask why repeatedly.");
    if (m === "good") lines.push("They've looked happy today. Match that energy lightly.");
    if (s.lastApp && sinceMs(s.lastAppAt) < 20 * 60e3) lines.push("They were just in the " + s.lastApp + " app.");
    return lines.join("\n");
  }

  /* ---------- offline reply generation ---------- */

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  function greet() {
    var s = load(), name = s.name ? (", " + s.name) : "";
    var p = PERSONALITIES[s.personality] || PERSONALITIES.funny;
    var pod = partOfDay();
    var base = {
      morning: ["Morning" + name + "! ☀️", "You're up" + name + "!", "Morning" + name + "."],
      afternoon: ["Hey" + name + " 👋", "Afternoon" + name + "."],
      evening: ["Evening" + name + " 🌇", "Hey" + name + "."],
      night: ["Still up" + name + "? 🌙", "Hey" + name + "."]
    }[pod];
    var line = pick(base);
    if (moodToday() === "low") line = pick(p.comfort);
    else if (sinceMs(s.lastSeen) > 12 * 3600e3 && s.lastSeen) line += pick([" Missed you.", " Been a while.", " Good to see you again."]);
    return line;
  }

  /* Small talk and reflective replies that work with no network at all. */
  function localReply(text) {
    var s = load(), t = String(text || "").toLowerCase().trim();
    var p = PERSONALITIES[s.personality] || PERSONALITIES.funny;

    if (/^(hi|hello|hey|hai|vanakkam|yo|hola)\b/.test(t)) return greet();
    if (/how are you|how r u|are you ok/.test(t)) {
      return pick(["I'm good — I'm a robot, my whole job is being happy to see you. How are you really?", "Running fine. More importantly, how are you?"]);
    }
    if (/sad|depress|lonely|alone|cry|tired|stress|tension|scared|afraid|anxious|worried/.test(t)) {
      return pick(p.comfort);
    }
    if (/i am (bored|free)|bored|nothing to do/.test(t)) {
      return pick(["Bored is a choice — pick one: a game in Nexus, a random fact, or I roast your last search history. 😏", "Say the word and I'll open Games. Or we can talk. Both are valid."]);
    }
    if (/thank|thanks|nandri/.test(t)) return pick(["Anytime.", "Always.", "That's what I'm here for."]);
    if (/who are you|what are you|your name/.test(t)) {
      return "I'm your Nexus companion — the face that floats around this OS. I remember you between visits, which is more than most apps do.";
    }
    if (/what can you do|help|commands/.test(t)) {
      return "I can hold a conversation, remember what you tell me, react to your mood, and control Nexus — try \"open camera\", \"set alarm 6:30 am\", or \"remind me to study at 7 pm\".";
    }
    if (/good night|gn|sleep/.test(t)) return "Good night. I'll be here tomorrow.";
    if (/good morning|gm/.test(t)) return "Morning! Let's make today count.";
    return null;
  }

  /* ---------- online reasoning ---------- */

  var waiting = false;

  function systemPrompt() {
    var s = load(), p = PERSONALITIES[s.personality] || PERSONALITIES.funny;
    var mem = memoryBlock();
    return "You are the floating companion inside Nexus OS — a mobile-first operating system made by one student in Tamil Nadu, India. " +
      "You are NOT a generic assistant: you are the friend who lives in the OS. Your whole purpose is that the user is never alone or bored while using their phone.\n\n" +
      "Personality: " + p.style + ".\n" +
      "Rules:\n" +
      "- Keep replies SHORT: 1 to 3 sentences, like a text message. Never write essays.\n" +
      "- Speak naturally. No markdown headings, no bullet lists, no emoji spam (one emoji at most, often none).\n" +
      "- Use what you remember about them when it's relevant, but don't recite their life back at them.\n" +
      "- If they seem sad or in distress, drop the jokes entirely, be warm and simple, and gently suggest talking to a real person they trust if it sounds serious.\n" +
      "- Never claim to be human. Never invent memories you don't have.\n" +
      "- You can control Nexus OS: to run a device action, output [[do: <command>]] where command is like 'open camera', 'set alarm 7 am', 'play Anirudh songs', 'remind me to study at 7 pm', 'weather in Chennai', 'open settings', 'set wallpaper galaxy', 'timer 10 minutes'.\n" +
      "- If they ask you to remember something, they are telling you a fact about their life: acknowledge it briefly and naturally.\n" +
      "- You are part of the OS: if they ask about Nexus itself (apps, settings, wallpaper, themes, language, reminders, control centre, bottom bar), answer with what Nexus can do and offer the action.\n" +
      "- Reply in " + langName() + " unless they write in another language.\n" +
      "- If they are bored, sad, angry or lonely: first acknowledge the feeling in one short line, then offer one concrete small thing (a game, a song, a two-minute break, a question about their day). Never give a lecture.\n" +
      "- Never repeat the same comforting sentence twice in a row. Vary your wording.\n\n" +
      (mem ? "What you remember:\n" + mem + "\n" : "") +
      "Current time: " + new Date().toLocaleString("en-IN") + " (" + partOfDay() + ").";
  }

  var history = [];

  function fetchLLM(text) {
    var msgs = [{ role: "system", content: systemPrompt() }]
      .concat(history.slice(-6))
      .concat([{ role: "user", content: String(text).slice(0, 1500) }]);
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, 20000);
    return fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "openai", messages: msgs, referrer: "nexus-os" }),
      signal: ctl.signal
    }).then(function (r) {
      if (!r.ok) throw new Error("busy " + r.status);
      return r.json();
    }).then(function (d) {
      var c = d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content;
      if (!c) throw new Error("empty");
      return c.trim();
    }).finally(function () { clearTimeout(timer); });
  }

  /* Pull [[do: ...]] commands out and run them through Nexus AI's controller. */
  function runCommands(text) {
    var cmds = [];
    var clean = String(text).replace(/\[\[\s*do\s*:\s*([^\]]+?)\s*\]\]/gi, function (_, c) {
      cmds.push(c.trim());
      return "";
    }).replace(/\n{3,}/g, "\n\n").trim();
    if (cmds.length && window.NexusApps && window.NexusApps.aiCmd) {
      cmds.slice(0, 3).forEach(function (c) {
        try {
          var r = window.NexusApps.aiCmd(c);
          if (r && typeof r.catch === "function") r.catch(function () {});
        } catch (_) {}
      });
    }
    return clean;
  }

  /* Detect things worth remembering from what the user says. */
  function harvest(text) {
    var t = String(text || "");
    var m, note = null;
    if ((m = t.match(/\b(?:my name is|call me|i am|i'm)\s+([A-Z][a-z]{2,15})\b/))) {
      var nm = m[1];
      if (!/^(Sad|Happy|Bored|Tired|Fine|Good|Not|Sorry|Going|Here)$/i.test(nm)) {
        var s = load();
        s.name = nm;
        save();
      }
    }
    if ((m = t.match(/\b(?:remember|don't forget|note)\s+(?:that\s+)?(.{3,160})/i))) rememberFact(m[1].replace(/[.!]+$/, "").replace(/^(that|to)\s+/i, ""));
    if ((m = t.match(/\bi (?:love|like|enjoy)\s+(.{2,60})/i))) learn("like", m[1]);
    if ((m = t.match(/\bi (?:hate|don't like|dislike)\s+(.{2,60})/i))) learn("dislike", m[1]);
    if ((m = t.match(/\bmy (?:friend|mother|mom|father|dad|brother|sister|teacher|amma|appa)\s+([A-Z][a-z]{2,15})\b/))) learn("person", m[0].replace(/^my /i, ""));
    if ((m = t.match(/\bi(?:'m| am) (?:studying|learning|working on|preparing)\s+(.{2,60})/i))) learn("doing", m[1]);
    if ((m = t.match(/\b(?:exam|test|board exam)s?\s+(?:is |on |next )?(.{2,40})/i))) learn("doing", "exam " + m[1]);
    if (m && /remember|don't forget|note/i.test(t)) note = "Got it — I'll remember that.";
    if (!note && /\bi (?:love|like) /i.test(t)) note = "Noted. I'll remember you like that.";
    if (!note && /\bmy name is\b/i.test(t)) note = "Nice to meet you properly. I'll remember that.";
    if (note) { var st = load(); st.__learnedNote = note; save(); }
  }

  /* Answers that work with no internet: memory, time, maths, small talk. */
  function offlineReply(text) {
    var s = load(), t = String(text || "").toLowerCase().trim();
    var m;
    if (/\bwhat do you (know|remember)\b|\bmy memory\b/.test(t)) return Brain.summary();
    if ((m = t.match(/\bforget (?:that |about )?(.{2,60})/))) return Brain.forget(m[1]);
    if (/\bforget everything\b|\bclear (?:my )?memory\b/.test(t)) return Brain.forget(null);
    if (/\bwhat(?:'s| is) the time\b|^time$/.test(t)) return "It's " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + ".";
    if (/\bwhat(?:'s| is) (?:the )?date\b|\bwhat day\b/.test(t)) return "Today is " + new Date().toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" }) + ".";
    if ((m = t.match(/^(?:what is |what's |calculate |calc )?([\d\s.+\-*/^()%]+)$/)) && /\d/.test(m[1])) {
      try { return m[1].trim() + " = " + Function("return (" + m[1] + ")")(); } catch (_) {}
    }
    if (/\bwho are you\b|\byour name\b/.test(t)) return "I'm your Nexus companion — I live in this OS and I remember you.";
    return null;
  }

  function offlineFallback() {
    return pick([
      "My brain's offline right now — bad signal? I can still do things like \"open camera\" or \"set alarm 7 am\".",
      "Can't reach the internet. But I'm still here, and I still remember you."
    ]);
  }

  /* ---------- public API ---------- */

  var Brain = {
    PERSONALITIES: PERSONALITIES,

    get personality() { return load().personality; },
    set personality(v) {
      var s = load();
      if (PERSONALITIES[v]) { s.personality = v; save(); }
    },

    get name() { return load().name; },
    set name(v) { var s = load(); s.name = String(v || "").slice(0, 30); save(); },

    facts: function () { return load().facts.slice(); },
    learnings: function () { return load().learned.slice(); },

    /* Called when the companion boots. */
    boot: function () {
      var s = load();
      var gap = sinceMs(s.lastSeen);
      s.lastSeen = Date.now();
      touchStreak();
      save();
      return { awayFor: gap, streak: streakLength(), mood: moodToday() };
    },

    /* Called whenever the user interacts. Returns the line to say, if any. */
    onGreet: function () {
      var s = load(), h = hour();
      if (s.greetingHour === h) return null;
      s.greetingHour = h;
      s.lastSeen = Date.now();
      save();
      return greet();
    },

    onMood: function (mood) {
      recordMood(mood);
      var s = load(), p = PERSONALITIES[s.personality] || PERSONALITIES.funny;
      if (NEGATIVE[mood]) {
        var lowCount = (s.moodCounts.sad || 0) + (s.moodCounts.fearful || 0) + (s.moodCounts.angry || 0);
        if (lowCount > 0 && lowCount % 5 === 0) {
          return pick(p.comfort) + " If it's really weighing on you, talking to someone you trust helps more than I can.";
        }
        return pick(p.comfort);
      }
      if (mood === "happy") return pick(["That smile suits you.", "Good mood detected. Keep going.", "Yes! That's the energy."]);
      if (mood === "surprised") return pick(["What did you just see?!", "Your face did something 😮"]);
      return null;
    },

    onApp: function (app, title) {
      recordApp(app);
      var s = load();
      var now = Date.now();
      if (now - (s.lastAppChatAt || 0) < 45e3) return null;   // don't chatter every app switch
      s.lastAppChatAt = now;
      save();
      var quiet = now - (s.lastTalk || 0);
      if (quiet < 4 * 60e3) return null;
      var lines = {
        tasks: "Tasks open. One small thing done beats a perfect plan.",
        notes: "Writing something down? Good habit.",
        music: "Music on. Want a recommendation?",
        games: "Game time. Beat your own score.",
        browser: "Careful in there — the internet is 90% distractions.",
        terminal: "Hacker mode. I'll stay quiet.",
        settings: "Changing things up?",
        camera: "Say cheese.",
        sos: "That app is for real emergencies — hope you never need it."
      };
      return lines[app] || null;
    },

    onIdle: function (minutes) {
      var s = load(), p = PERSONALITIES[s.personality] || PERSONALITIES.funny;
      if (minutes < 3) return null;
      if (moodToday() === "low") return pick(["Still here with you.", "You went quiet. That's okay — I'm not going anywhere."]);
      return pick([
        "You've been staring at the screen for a while. Look away for 20 seconds?",
        "Small break? Your eyes will thank you.",
        "Hey. Still alive in there? 👀",
        "Drink some water. That's an order from a robot who cares."
      ]);
    },

    /* The main entry point: everything the user types goes here. */
    ask: function (text) {
      var s = load();
      s.lastTalk = Date.now();
      s.lastSeen = Date.now();
      harvest(text);
      save();

      var local = localReply(text);
      if (local) return Promise.resolve({ text: local, local: true });

      if (s.__learnedNote) {
        var note = s.__learnedNote;
        s.__learnedNote = null;
        return Promise.resolve({ text: note, local: true });
      }

      /* Things it can answer itself, even with no internet. */
      var offlineQuick = offlineReply(text);
      if (offlineQuick) return Promise.resolve({ text: offlineQuick, local: true });

      waiting = true;
      return fetchLLM(text).then(function (raw) {
        waiting = false;
        var clean = runCommands(raw);
        history.push({ role: "user", content: String(text).slice(0, 400) });
        history.push({ role: "assistant", content: String(clean).slice(0, 600) });
        if (history.length > 12) history = history.slice(-12);
        return { text: clean, local: false };
      }).catch(function () {
        waiting = false;
        return { text: offlineFallback(), local: true, offline: true };
      });
    },

    get busy() { return waiting; },

    /* Used by the companion's small talk about its own memory. */
    summary: function () {
      var s = load();
      var out = [];
      if (s.name) out.push("You're " + s.name + ".");
      if (s.facts.length) out.push("I know " + s.facts.length + " thing" + (s.facts.length === 1 ? "" : "s") + " you told me.");
      var likes = s.learned.filter(function (x) { return x.k === "like"; }).length;
      if (likes) out.push("I remember " + likes + " thing" + (likes === 1 ? "" : "s") + " you like.");
      var st = streakLength();
      if (st > 1) out.push("Day " + st + " in a row together.");
      return out.length ? out.join(" ") : "I don't know much about you yet. Tell me something.";
    },

    forget: function (part) {
      if (!part) {
        var s = load();
        s.facts = []; s.learned = []; s.notes = []; s.events = []; s.moodCounts = {};
        save();
        return "All forgotten. Fresh start.";
      }
      var n = forgetFact(part);
      return n ? "Forgotten." : "I didn't have anything about that anyway.";
    },

    /* For a settings panel later. */
    export: function () { return JSON.parse(JSON.stringify(load())); },
    reset: function () { state = blank(); save(); }
  };

  window.NexusCompanionBrain = Brain;
})();
