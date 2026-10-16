/* Nexus OS — Batch 4b: Notes · Tasks · Recorder · Games · Books · SOS · Cleaner (v41) */
(function () {
  "use strict";
  const N = window.NexusApps; if (!N) return;
  const { ic, esc, uid, store, toast, openSheet, closeSheet, setActive, showView, selectNav, selectTab, FilesDB } = N;
  Object.assign(N.I, {
    pinIc: '<path d="M12 17v5M9 10.8V4h6v6.8l3 3.2v2H6v-2Z"/>',
    stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    gamepad: '<path d="M6 11h4M8 9v4M15 12h.01M18 10h.01"/><rect x="2" y="6" width="20" height="12" rx="6"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    siren: '<path d="M7 18v-6a5 5 0 0 1 10 0v6M5 21h14v-3H5ZM21 12h1M18.5 4.5 18 5M2 12h1M12 2v1M4.9 4.9l.7.7"/>',
    sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
    listCheck: '<path d="M11 18H3M15 18l2 2 4-4M16 12H3M16 6H3"/>'
  });
  const pad = (n) => String(n).padStart(2, "0");
  const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "just now" : m < 60 ? m + " min ago" : m < 1440 ? Math.round(m / 60) + " h ago" : new Date(t).toLocaleDateString([], { day: "numeric", month: "short" }); };

  /* ================================================================== *
   * NOTES — colourful notes with pin, search and autosave
   * ================================================================== */
  const NCOL = ["", "#1e3a8a", "#065f46", "#7c2d12", "#701a75", "#713f12", "#155e75"];
  function notes() {
    let l = store.get("nexus-notes-v2", null);
    if (!Array.isArray(l)) { l = []; const t = localStorage.getItem("nexus-note-title") || "", c = localStorage.getItem("nexus-note-content") || ""; if (t || c) l.push({ id: uid(), title: t, body: c, color: "", pin: false, at: Date.now() }); store.set("nexus-notes-v2", l); }
    return l;
  }
  const saveNotes = (l) => store.set("nexus-notes-v2", l);
  const NT = { open: null, q: "" };
  function ntList(win) {
    const q = NT.q.toLowerCase(); const l = notes().filter((n) => !q || (n.title + " " + n.body).toLowerCase().includes(q)).sort((a, b) => (b.pin - a.pin) || b.at - a.at);
    const card = (n) => `<button type="button" class="nx-nt-card" data-nt-open="${n.id}" style="${n.color ? `background:${n.color};border-color:transparent` : ""}">${n.pin ? `<span class="nx-nt-pin">${ic("pinIc", "sm")}</span>` : ""}<strong>${esc(n.title || "Untitled")}</strong><p>${esc(n.body.slice(0, 160)) || "<i>Empty note</i>"}</p><small>${ago(n.at)}</small></button>`;
    win.querySelector("[data-nt-list]").innerHTML = l.length ? `<div class="nx-nt-grid">${l.map(card).join("")}</div>` : `<div class="nx-card nx-empty">${ic("file")}<strong>${q ? "No matching notes" : "No notes yet"}</strong>${q ? "" : "Tap + to write your first note."}</div>`;
  }
  function ntOpen(win, id) {
    let n = notes().find((x) => x.id === id);
    if (!n) { n = { id: uid(), title: "", body: "", color: "", pin: false, at: Date.now() }; const l = notes(); l.push(n); saveNotes(l); }
    NT.open = n.id; showView(win, "edit"); win.querySelector("[data-nt-fab]").hidden = true;
    win.querySelector(".nx-head-actions").innerHTML = `<button class="nx-icon-btn${n.pin ? " is-on" : ""}" type="button" data-nt-pin aria-label="Pin">${ic("pinIc")}</button><button class="nx-icon-btn" type="button" data-nt-share aria-label="Share">${ic("share")}</button><button class="nx-icon-btn" type="button" data-nt-del aria-label="Delete">${ic("trash")}</button>`;
    const ed = win.querySelector("[data-view='edit']");
    ed.innerHTML = `<input class="nx-nt-title" data-nt-t placeholder="Title" value="${esc(n.title)}" maxlength="80" aria-label="Title"><div class="nx-nt-meta">${new Date(n.at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} · <span data-nt-count>${n.body.length}</span> characters</div><textarea class="nx-nt-body" data-nt-b placeholder="Start writing…" aria-label="Note">${esc(n.body)}</textarea>
      <div class="nx-nt-colors">${NCOL.map((c) => `<button type="button" data-nt-c="${c}" class="${c === n.color ? "is-active" : ""}" style="background:${c || "var(--nx-surface-2)"}" aria-label="Colour"></button>`).join("")}</div>`;
    win.querySelector("[data-view='edit']").style.setProperty("--ntc", n.color || "transparent");
    setTimeout(() => (n.title || n.body ? null : ed.querySelector("[data-nt-t]").focus()), 60);
  }
  function ntClose(win) {
    const l = notes(); const n = l.find((x) => x.id === NT.open);
    if (n && !n.title.trim() && !n.body.trim()) saveNotes(l.filter((x) => x.id !== n.id));
    NT.open = null; win.querySelector(".nx-head-actions").innerHTML = `<button class="nx-icon-btn" type="button" data-nt-search aria-label="Search">${ic("search")}</button>`;
    win.querySelector("[data-nt-fab]").hidden = false; showView(win, "list"); ntList(win);
  }
  N.register("notes", {
    title: "Notes",
    actions: `<button class="nx-icon-btn" type="button" data-nt-search aria-label="Search">${ic("search")}</button>`,
    html: () => `<div data-view="list"><div class="nx-search" data-nt-sbox hidden><span>${ic("search")}</span><input data-nt-q placeholder="Search notes" aria-label="Search notes"></div><div data-nt-list></div></div><div data-view="edit" hidden class="nx-nt-edit"></div><button class="nx-fab" type="button" data-nt-fab aria-label="New note">${ic("plus")}</button>`,
    init(win) {
      win.classList.add("nx-notes"); ntList(win); let tmr;
      win.addEventListener("input", (e) => {
        if (e.target.matches("[data-nt-q]")) { NT.q = e.target.value; ntList(win); return; }
        if (e.target.matches("[data-nt-t],[data-nt-b]") && NT.open) { clearTimeout(tmr); const c = win.querySelector("[data-nt-count]"); if (c) c.textContent = win.querySelector("[data-nt-b]").value.length; tmr = setTimeout(() => { const l = notes(); const n = l.find((x) => x.id === NT.open); if (!n) return; n.title = win.querySelector("[data-nt-t]").value; n.body = win.querySelector("[data-nt-b]").value; n.at = Date.now(); saveNotes(l); }, 300); }
      });
      win.addEventListener("click", (e) => {
        const g = (s) => e.target.closest(s); const upd = (fn) => { const l = notes(); const n = l.find((x) => x.id === NT.open); if (n) { fn(n); saveNotes(l); } return n; };
        if (g("[data-nt-open]")) return ntOpen(win, g("[data-nt-open]").dataset.ntOpen);
        if (g("[data-nt-fab]")) return ntOpen(win, null);
        if (g("[data-nt-search]")) { const b = win.querySelector("[data-nt-sbox]"); b.hidden = !b.hidden; if (!b.hidden) b.querySelector("input").focus(); else { NT.q = ""; b.querySelector("input").value = ""; ntList(win); } return; }
        if (g("[data-nt-pin]")) { const n = upd((x) => (x.pin = !x.pin)); g("[data-nt-pin]").classList.toggle("is-on", n.pin); toast(win, n.pin ? "Pinned to top" : "Unpinned"); return; }
        if (g("[data-nt-c]")) { const c = g("[data-nt-c]").dataset.ntC; upd((x) => (x.color = c)); setActive(win, "[data-nt-c]", g("[data-nt-c]")); win.querySelector("[data-view='edit']").style.setProperty("--ntc", c || "transparent"); return; }
        if (g("[data-nt-share]")) { const n = notes().find((x) => x.id === NT.open); const t = (n.title ? n.title + "\n\n" : "") + n.body; if (navigator.share) navigator.share({ title: n.title || "Note", text: t }).catch(() => {}); else { navigator.clipboard?.writeText(t); toast(win, "Copied to clipboard"); } return; }
        if (g("[data-nt-del]")) { if (!confirm("Delete this note?")) return; saveNotes(notes().filter((x) => x.id !== NT.open)); NT.open = null; ntClose(win); toast(win, "Note deleted"); }
      });
    },
    onBack(win) { if (NT.open) { ntClose(win); return true; } return false; }
  });

  /* ================================================================== *
   * TASKS — to-do list (keeps the old nexus-tasks format)
   * ================================================================== */
  const tasks = () => store.get("nexus-tasks", []).map((t) => ({ id: t.id || uid(), text: t.text, done: !!t.done, due: t.due || "", prio: t.prio || "" }));
  const saveTasks = (l) => store.set("nexus-tasks", l);
  const todayStr = () => { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
  N.register("tasks", {
    title: "Tasks",
    tabs: [{ key: "todo", label: "To do" }, { key: "today", label: "Today" }, { key: "done", label: "Done" }],
    html: () => `<div data-tk-sum></div><div data-tk-list></div>`,
    footerHtml: () => `<form class="nx-ms-compose" data-tk-form><input name="t" placeholder="Add a task…" maxlength="120" autocomplete="off" aria-label="New task"><button type="button" class="nx-ai-mic" data-tk-today aria-label="Due today" title="Due today" style="background:var(--nx-surface-3);color:var(--nx-text)">${ic("calendar", "sm")}</button><button type="submit" aria-label="Add">${ic("plus")}</button></form>`,
    init(win) {
      let tab = "todo", forToday = false; const l0 = tasks(); saveTasks(l0);
      const render = () => {
        const all = tasks(); const t = todayStr();
        const list = all.filter((x) => tab === "done" ? x.done : tab === "today" ? !x.done && x.due && x.due <= t : !x.done);
        const done = all.filter((x) => x.done).length; const p = all.length ? Math.round((done / all.length) * 100) : 0;
        win.querySelector("[data-tk-sum]").innerHTML = `<div class="nx-card nx-tk-sum"><div><strong>${all.length - done} left</strong><span>${done} of ${all.length} done</span></div><div class="nx-bar" style="flex:1"><i style="width:${p}%"></i></div><b>${p}%</b></div>`;
        win.querySelector("[data-tk-list]").innerHTML = list.length ? `<div class="nx-list">${list.map((x) => `<div class="nx-row nx-tk${x.done ? " is-done" : ""}${x.prio ? " is-prio" : ""}"><button type="button" class="nx-pl-check" data-tk-done="${x.id}" aria-label="${x.done ? "Mark not done" : "Mark done"}">${x.done ? ic("check", "sm") : ""}</button><span class="nx-row-main"><strong>${esc(x.text)}</strong>${x.due ? `<span class="${!x.done && x.due < t ? "late" : ""}">${x.due === t ? "Today" : x.due < t ? "Overdue · " + x.due : x.due}</span>` : ""}</span><button type="button" class="nx-icon-btn${x.prio ? " is-on" : ""}" data-tk-prio="${x.id}" aria-label="Important">${ic("star", "sm")}</button><button type="button" class="nx-del" data-tk-del="${x.id}" aria-label="Delete">${ic("x", "sm")}</button></div>`).join("")}</div>${tab === "done" ? `<button type="button" class="nx-btn ghost block" data-tk-clear style="margin-top:12px">Clear done tasks</button>` : ""}` : `<div class="nx-card nx-empty">${ic("listCheck")}<strong>${tab === "done" ? "Nothing finished yet" : tab === "today" ? "Nothing due today" : "All clear!"}</strong>${tab === "done" ? "Tick tasks to see them here." : "Add a task below."}</div>`;
      };
      render(); this._tab = (k) => { tab = k; render(); };
      const form = win.querySelector("[data-tk-form]");
      form.addEventListener("submit", (e) => { e.preventDefault(); const t = form.t.value.trim(); if (!t) return; const l = tasks(); l.unshift({ id: uid(), text: t, done: false, due: forToday || tab === "today" ? todayStr() : "", prio: "" }); saveTasks(l); form.t.value = ""; render(); });
      win.addEventListener("click", (e) => {
        const g = (s) => e.target.closest(s); const upd = (id, fn) => { const l = tasks(); const x = l.find((y) => y.id === id); if (x) fn(x); saveTasks(l); render(); };
        if (g("[data-tk-today]")) { forToday = !forToday; g("[data-tk-today]").style.background = forToday ? "var(--nx-accent)" : "var(--nx-surface-3)"; toast(win, forToday ? "New tasks will be due today" : "No due date"); return; }
        if (g("[data-tk-done]")) { upd(g("[data-tk-done]").dataset.tkDone, (x) => (x.done = !x.done)); return; }
        if (g("[data-tk-prio]")) { upd(g("[data-tk-prio]").dataset.tkPrio, (x) => (x.prio = x.prio ? "" : "high")); return; }
        if (g("[data-tk-del]")) { saveTasks(tasks().filter((x) => x.id !== g("[data-tk-del]").dataset.tkDel)); render(); return; }
        if (g("[data-tk-clear]")) { saveTasks(tasks().filter((x) => !x.done)); render(); }
      });
    },
    onTab(win, k) { this._tab?.(k); }
  });

  /* ================================================================== *
   * RECORDER — voice recordings saved to Files
   * ================================================================== */
  const RC = { rec: null, stream: null, chunks: [], t0: 0, ctx: null, an: null, raf: 0, audio: new Audio(), playing: null, urls: [] };
  const fmtD = (ms) => { const s = Math.floor(ms / 1000); return pad(Math.floor(s / 60)) + ":" + pad(s % 60); };
  async function rcList(win) {
    RC.urls.forEach((u) => URL.revokeObjectURL(u)); RC.urls = [];
    let l = []; try { l = (await FilesDB.all()).filter((f) => f.source === "recorder" || (f.type.startsWith("audio") && /^Recording/.test(f.name))).sort((a, b) => b.added - a.added); } catch (_) {}
    RC.items = l;
    win.querySelector("[data-rc-list]").innerHTML = l.length ? `<div class="nx-section-title">Recordings <small>${l.length}</small></div><div class="nx-list">${l.map((f, i) => `<div class="nx-row"><button type="button" class="nx-icon-btn nx-rc-play${RC.playing === f.id ? " is-on" : ""}" data-rc-play="${i}" aria-label="Play">${ic(RC.playing === f.id ? "pause" : "play")}</button><span class="nx-row-main"><strong>${esc(f.name.replace(/\.\w+$/, ""))}</strong><span>${new Date(f.added).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} · ${f.dur ? fmtD(f.dur) : N.fmtBytes(f.size)}</span></span><button type="button" class="nx-icon-btn" data-rc-more="${i}" aria-label="More">${ic("dots")}</button></div>`).join("")}</div>` : `<div class="nx-card nx-empty">${ic("mic")}<strong>No recordings yet</strong>Tap the red button to record.</div>`;
  }
  function rcStopAll() { cancelAnimationFrame(RC.raf); RC.stream?.getTracks().forEach((t) => t.stop()); RC.stream = null; try { RC.ctx?.close(); } catch (_) {} RC.ctx = null; }
  N.register("recorder", {
    title: "Recorder",
    html: () => `<div class="nx-card nx-rc-main"><canvas data-rc-wave class="nx-rc-wave" width="600" height="140"></canvas><b data-rc-time>00:00</b><span data-rc-state>Ready to record</span>
        <div class="nx-rc-btns"><button type="button" class="nx-icon-btn" data-rc-pause hidden aria-label="Pause">${ic("pause")}</button><button type="button" class="nx-rc-big" data-rc-go aria-label="Record"><i></i></button><button type="button" class="nx-icon-btn" data-rc-cancel hidden aria-label="Discard">${ic("x")}</button></div></div>
      <div data-rc-list></div>`,
    init(win) {
      win.classList.add("nx-rec"); rcList(win);
      const cv = win.querySelector("[data-rc-wave]"), c2 = cv.getContext("2d");
      const drawIdle = () => { c2.clearRect(0, 0, 600, 140); c2.fillStyle = "rgba(142,164,198,.35)"; for (let i = 0; i < 60; i++) c2.fillRect(i * 10 + 2, 68, 6, 4); };
      drawIdle();
      const draw = () => { const d = new Uint8Array(RC.an.frequencyBinCount); RC.an.getByteTimeDomainData(d); c2.clearRect(0, 0, 600, 140); const acc = getComputedStyle(win).getPropertyValue("--nx-accent").trim() || "#1e88ff"; c2.fillStyle = acc; for (let i = 0; i < 60; i++) { let m = 0; for (let j = 0; j < 16; j++) m = Math.max(m, Math.abs(d[i * 16 + j] - 128)); const h = Math.max(4, (m / 128) * 130); c2.fillRect(i * 10 + 2, 70 - h / 2, 6, h); } if (RC.rec?.state === "recording") win.querySelector("[data-rc-time]").textContent = fmtD(Date.now() - RC.t0); RC.raf = requestAnimationFrame(draw); };
      const ui = (state) => { const go = win.querySelector("[data-rc-go]"); go.classList.toggle("is-rec", state !== "idle"); win.querySelector("[data-rc-pause]").hidden = state === "idle"; win.querySelector("[data-rc-cancel]").hidden = state === "idle"; win.querySelector("[data-rc-pause]").innerHTML = ic(state === "paused" ? "mic" : "pause"); win.querySelector("[data-rc-state]").textContent = { idle: "Ready to record", rec: "● Recording", paused: "Paused" }[state]; win.querySelector("[data-rc-state]").className = state === "rec" ? "live" : ""; };
      let discard = false, paused = 0, pauseAt = 0;
      const start = async () => {
        if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { toast(win, "Recording isn't supported here"); return; }
        try { RC.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } catch (e) { toast(win, e.name === "NotAllowedError" ? "Allow the microphone for this site" : "Couldn't start the microphone"); return; }
        RC.ctx = new (window.AudioContext || window.webkitAudioContext)(); RC.an = RC.ctx.createAnalyser(); RC.an.fftSize = 2048; RC.ctx.createMediaStreamSource(RC.stream).connect(RC.an);
        const mime = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((m) => MediaRecorder.isTypeSupported?.(m)) || "";
        RC.rec = new MediaRecorder(RC.stream, mime ? { mimeType: mime } : undefined); RC.chunks = []; discard = false; paused = 0;
        RC.rec.ondataavailable = (e) => e.data.size && RC.chunks.push(e.data);
        RC.rec.onstop = async () => {
          const dur = Date.now() - RC.t0; rcStopAll(); drawIdle(); ui("idle"); win.querySelector("[data-rc-time]").textContent = "00:00"; if (discard) return;
          const type = (RC.rec.mimeType || "audio/webm").split(";")[0]; const blob = new Blob(RC.chunks, { type }); const n = new Date();
          const name = `Recording ${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())} ${pad(n.getHours())}.${pad(n.getMinutes())}.${type.includes("mp4") ? "m4a" : "webm"}`;
          try { await FilesDB.put({ id: uid(), name, type, size: blob.size, added: Date.now(), blob, source: "recorder", dur }); toast(win, "Recording saved"); } catch (_) { toast(win, "Couldn't save — storage may be full"); }
          if (win.isConnected) rcList(win);
        };
        RC.rec.start(500); RC.t0 = Date.now(); ui("rec"); draw();
      };
      const t = setInterval(() => { if (!win.isConnected) { clearInterval(t); if (RC.rec?.state === "recording") RC.rec.stop(); else rcStopAll(); RC.audio.pause(); } }, 700);
      RC.audio.onended = () => { RC.playing = null; if (win.isConnected) rcList(win); };
      win.addEventListener("click", (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-rc-go]")) { if (RC.rec && RC.rec.state !== "inactive") RC.rec.stop(); else start(); return; }
        if (g("[data-rc-pause]") && RC.rec) { if (RC.rec.state === "recording") { RC.rec.pause(); pauseAt = Date.now(); ui("paused"); } else if (RC.rec.state === "paused") { RC.rec.resume(); RC.t0 += Date.now() - pauseAt; ui("rec"); } return; }
        if (g("[data-rc-cancel]") && RC.rec) { if (!confirm("Discard this recording?")) return; discard = true; RC.rec.stop(); return; }
        if (g("[data-rc-play]")) { const f = RC.items[Number(g("[data-rc-play]").dataset.rcPlay)]; if (RC.playing === f.id) { RC.audio.pause(); RC.playing = null; } else { const u = URL.createObjectURL(f.blob); RC.urls.push(u); RC.audio.src = u; RC.audio.play(); RC.playing = f.id; } rcList(win); return; }
        if (g("[data-rc-more]")) {
          const f = RC.items[Number(g("[data-rc-more]").dataset.rcMore)];
          openSheet(win, `<h3>${esc(f.name.replace(/\.\w+$/, ""))}</h3><form data-rc-ren style="display:flex;gap:8px;margin-bottom:12px"><input class="nx-input" name="n" value="${esc(f.name.replace(/\.\w+$/, ""))}" maxlength="60" aria-label="Name"><button class="nx-btn" type="submit">Rename</button></form><div class="nx-actions"><button type="button" class="nx-btn ghost" data-a="share">${ic("share", "sm")} Share</button><button type="button" class="nx-btn danger" data-a="del">${ic("trash", "sm")} Delete</button></div>`, (p) => {
            p.querySelector("form").addEventListener("submit", async (ev) => { ev.preventDefault(); const ext = (f.name.match(/\.\w+$/) || [".webm"])[0]; f.name = ev.target.n.value.trim() + ext; await FilesDB.put(f); closeSheet(win); rcList(win); });
            p.addEventListener("click", async (ev) => { const a = ev.target.closest("[data-a]")?.dataset.a; if (a === "del") { await FilesDB.del(f.id); closeSheet(win); rcList(win); toast(win, "Deleted"); } if (a === "share") { const file = new File([f.blob], f.name, { type: f.type }); if (navigator.canShare?.({ files: [file] })) navigator.share({ files: [file] }).catch(() => {}); else toast(win, "Sharing isn't supported here"); } });
          });
        }
      });
    }
  });

  /* ================================================================== *
   * GAMES — Tic-tac-toe (vs Nexus AI) and Memory Match
   * ================================================================== */
  const best = () => store.get("nexus-game-best", {});
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const winner = (b) => { for (const [a, c, d] of LINES) if (b[a] && b[a] === b[c] && b[a] === b[d]) return { p: b[a], line: [a, c, d] }; return b.every(Boolean) ? { p: "draw" } : null; };
  function minimax(b, me) { const w = winner(b); if (w) return { s: w.p === "O" ? 10 : w.p === "X" ? -10 : 0 }; let bestM = { s: me === "O" ? -99 : 99 }; b.forEach((v, i) => { if (v) return; b[i] = me; const r = minimax(b, me === "O" ? "X" : "O"); b[i] = null; if (me === "O" ? r.s > bestM.s : r.s < bestM.s) bestM = { s: r.s, i }; }); return bestM; }
  function gTTT(win, box) {
    const S = { b: Array(9).fill(null), turn: "X", over: false, level: store.get("nexus-ttt-level", "hard"), score: store.get("nexus-ttt-score", { you: 0, ai: 0, draw: 0 }) };
    const render = (w) => {
      box.innerHTML = `<div class="nx-g-score"><span><b>${S.score.you}</b>You</span><span><b>${S.score.draw}</b>Draws</span><span><b>${S.score.ai}</b>Nexus AI</span></div>
        <div class="nx-seg" style="margin-bottom:14px">${["easy", "hard"].map((l) => `<button type="button" class="${S.level === l ? "is-active" : ""}" data-lv="${l}">${l === "easy" ? "Easy" : "Unbeatable"}</button>`).join("")}</div>
        <div class="nx-ttt">${S.b.map((v, i) => `<button type="button" data-c="${i}" class="${v ? "v" + v : ""}${w?.line?.includes(i) ? " win" : ""}" ${v || S.over ? "disabled" : ""} aria-label="Cell ${i + 1}">${v || ""}</button>`).join("")}</div>
        <p class="nx-g-msg">${w ? (w.p === "X" ? "You win! 🎉" : w.p === "O" ? "Nexus AI wins 🤖" : "It's a draw 🤝") : "Your turn — you're X"}</p>${w ? `<button type="button" class="nx-btn block" data-again>Play again</button>` : ""}`;
    };
    const end = (w) => { S.over = true; S.score[w.p === "X" ? "you" : w.p === "O" ? "ai" : "draw"]++; store.set("nexus-ttt-score", S.score); render(w); };
    render();
    box.onclick = (e) => {
      const lv = e.target.closest("[data-lv]"); if (lv) { S.level = lv.dataset.lv; store.set("nexus-ttt-level", S.level); render(); return; }
      if (e.target.closest("[data-again]")) { S.b = Array(9).fill(null); S.over = false; render(); return; }
      const c = e.target.closest("[data-c]"); if (!c || S.over) return; const i = Number(c.dataset.c); if (S.b[i]) return;
      S.b[i] = "X"; let w = winner(S.b); if (w) return end(w); render();
      setTimeout(() => { const free = S.b.map((v, j) => (v ? -1 : j)).filter((j) => j >= 0); const m = S.level === "easy" && Math.random() < 0.6 ? free[Math.floor(Math.random() * free.length)] : minimax(S.b.slice(), "O").i; S.b[m] = "O"; w = winner(S.b); if (w) end(w); else render(); }, 320);
    };
  }
  function gMemory(win, box) {
    const EM = ["🚀", "🎮", "🦁", "🍕", "⚽", "🎸", "🌈", "🐼"];
    let cards, open, moves, found, t0, timer, lock;
    const reset = () => { cards = [...EM, ...EM].sort(() => Math.random() - 0.5).map((e, i) => ({ e, i, up: false, done: false })); open = []; moves = 0; found = 0; t0 = 0; lock = false; clearInterval(timer); render(); };
    const render = () => {
      const b = best().memory;
      box.innerHTML = `<div class="nx-g-score"><span><b data-mv>${moves}</b>Moves</span><span><b data-tm>${t0 ? Math.floor((Date.now() - t0) / 1000) : 0}s</b>Time</span><span><b>${b ? b + "" : "—"}</b>Best moves</span></div>
        <div class="nx-mem">${cards.map((c) => `<button type="button" data-k="${c.i}" class="${c.up || c.done ? "up" : ""}${c.done ? " done" : ""}" aria-label="Card"><span>${c.e}</span></button>`).join("")}</div>
        <p class="nx-g-msg">${found === EM.length ? `Done in ${moves} moves! ${b && moves <= b ? "New best! 🏆" : ""}` : "Find all the matching pairs"}</p><button type="button" class="nx-btn ${found === EM.length ? "" : "ghost "}block" data-again>${found === EM.length ? "Play again" : "Restart"}</button>`;
    };
    reset();
    box.onclick = (e) => {
      if (e.target.closest("[data-again]")) return reset();
      const k = e.target.closest("[data-k]"); if (!k || lock) return; const c = cards.find((x) => x.i === Number(k.dataset.k)); if (c.up || c.done) return;
      if (!t0) { t0 = Date.now(); timer = setInterval(() => { const el = box.querySelector("[data-tm]"); if (!win.isConnected) clearInterval(timer); else if (el) el.textContent = Math.floor((Date.now() - t0) / 1000) + "s"; }, 500); }
      c.up = true; open.push(c); k.classList.add("up");
      if (open.length === 2) {
        moves++; box.querySelector("[data-mv]").textContent = moves; const [a, b] = open; open = [];
        if (a.e === b.e) { a.done = b.done = true; found++; if (found === EM.length) { clearInterval(timer); const bs = best(); if (!bs.memory || moves < bs.memory) { bs.memory = moves; store.set("nexus-game-best", bs); } } render(); }
        else { lock = true; setTimeout(() => { a.up = b.up = false; lock = false; render(); }, 750); }
      }
    };
  }
  const GAMES = [["ttt", "Tic-Tac-Toe", "Beat Nexus AI — if you can", "t-blue", gTTT], ["memory", "Memory Match", "Find the matching pairs", "t-violet", gMemory]];
  N.register("games", {
    title: "Games",
    html: () => `<div data-view="hub"><div class="nx-card nx-g-hero"><span class="nx-tile t-pink">${ic("gamepad", "lg")}</span><div><strong>Nexus Arcade</strong><span>Quick games for a study break</span></div></div><div class="nx-g-list">${GAMES.map(([k, n, d, t]) => `<button type="button" class="nx-card nx-g-item" data-game="${k}"><span class="nx-tile ${t}">${k === "ttt" ? "✕○" : "🃏"}</span><span class="nx-row-main"><strong>${n}</strong><span>${d}</span></span>${ic("play")}</button>`).join("")}</div></div><div data-view="play" hidden><div data-g-box></div></div>`,
    init(win) {
      win.classList.add("nx-games");
      win.addEventListener("click", (e) => { const g = e.target.closest("[data-game]"); if (!g) return; const G = GAMES.find((x) => x[0] === g.dataset.game); showView(win, "play"); win.querySelector(".nx-head h2").textContent = G[1]; this._in = true; G[4](win, win.querySelector("[data-g-box]")); });
    },
    onBack(win) { if (this._in) { this._in = false; showView(win, "hub"); win.querySelector(".nx-head h2").textContent = "Games"; return true; } return false; }
  });

  /* ================================================================== *
   * BOOKS — find books & read free ones from Open Library
   * ================================================================== */
  const SUBJ = [["Popular", "subject:juvenile_fiction"], ["Science", "subject:science"], ["Space", "subject:astronomy"], ["Coding", "subject:computer_programming"], ["Adventure", "subject:adventure"], ["Mystery", "subject:mystery"], ["India", "subject:india"]];
  const BK = { list: [], shelf: () => store.get("nexus-shelf", []) };
  const cover = (b, sz = "M") => b.cover ? `https://covers.openlibrary.org/b/id/${b.cover}-${sz}.jpg` : "";
  async function bkSearch(q) {
    const c = store.get("nx-books:" + q, null); if (c && Date.now() - c.at < 86400e3) return c.items;
    const d = await (await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=24&fields=key,title,author_name,cover_i,ia,ebook_access,first_publish_year`)).json();
    const items = d.docs.map((x) => ({ key: x.key, title: x.title, author: (x.author_name || ["Unknown"])[0], cover: x.cover_i || 0, year: x.first_publish_year || "", ia: x.ebook_access === "public" ? (x.ia || [])[0] : "" }));
    store.set("nx-books:" + q, { at: Date.now(), items }); return items;
  }
  const bkCard = (b, i, attr) => `<button type="button" class="nx-bk" ${attr}="${i}"><span class="nx-bk-cover">${b.cover ? `<img src="${cover(b)}" alt="" loading="lazy">` : `<em>${esc(b.title.slice(0, 40))}</em>`}${b.ia ? `<i>Free</i>` : ""}</span><strong>${esc(b.title)}</strong><span>${esc(b.author)}</span></button>`;
  async function bkLoad(win, q, title) {
    const box = win.querySelector("[data-bk-res]"); box.innerHTML = `<div class="nx-bk-grid">${'<span class="nx-skel" style="aspect-ratio:2/3;border-radius:10px"></span>'.repeat(6)}</div>`;
    try { const l = await bkSearch(q); BK.list = l; if (win.isConnected) box.innerHTML = `<div class="nx-section-title">${esc(title)}</div>` + (l.length ? `<div class="nx-bk-grid">${l.map((b, i) => bkCard(b, i, "data-bk")).join("")}</div>` : `<div class="nx-empty">${ic("book")}<strong>No books found</strong></div>`); }
    catch (_) { box.innerHTML = `<div class="nx-error">Couldn't reach the library. Check your internet.</div>`; }
  }
  function bkSheet(win, b) {
    const on = BK.shelf().some((x) => x.key === b.key);
    openSheet(win, `<div class="nx-bk-detail">${b.cover ? `<img src="${cover(b, "L")}" alt="">` : ""}<div><h3>${esc(b.title)}</h3><p>${esc(b.author)}${b.year ? " · " + b.year : ""}</p>${b.ia ? `<span class="nx-pill ok">Free to read</span>` : `<span class="nx-pill warn">Preview / borrow</span>`}</div></div>
      <div class="nx-actions" style="margin-top:14px">${b.ia ? `<button type="button" class="nx-btn" data-bk-read>${ic("book", "sm")} Read now</button>` : ""}<a class="nx-btn ${b.ia ? "ghost" : ""}" href="https://openlibrary.org${b.key}" target="_blank" rel="noopener">${ic("external", "sm")} Open Library</a><button type="button" class="nx-btn ghost" data-bk-shelf>${ic("bookmark", "sm")} ${on ? "On shelf" : "Add to shelf"}</button></div>`, (p) => p.addEventListener("click", (e) => {
      if (e.target.closest("[data-bk-read]")) { closeSheet(win); const v = document.createElement("div"); v.className = "nx-gv nx-bk-reader"; v.innerHTML = `<div class="nx-gv-top"><button type="button" class="nx-icon-btn" data-x aria-label="Close">${ic("back", "lg")}</button><span><strong>${esc(b.title)}</strong><small>${esc(b.author)}</small></span></div><iframe src="https://archive.org/embed/${encodeURIComponent(b.ia)}" title="${esc(b.title)}" allowfullscreen></iframe>`; v.querySelector("[data-x]").onclick = () => v.remove(); win.append(v); const s = BK.shelf().filter((x) => x.key !== b.key); s.unshift({ ...b, read: Date.now() }); store.set("nexus-shelf", s); }
      if (e.target.closest("[data-bk-shelf]")) { let s = BK.shelf(); s = s.some((x) => x.key === b.key) ? s.filter((x) => x.key !== b.key) : [b, ...s]; store.set("nexus-shelf", s); closeSheet(win); toast(win, s.some((x) => x.key === b.key) ? "Added to your shelf" : "Removed from shelf"); if (!win.querySelector('[data-view="shelf"]').hidden) bkShelf(win); }
    }));
  }
  function bkShelf(win) { const s = BK.shelf(); win.querySelector("[data-bk-shelf-list]").innerHTML = s.length ? `<div class="nx-bk-grid">${s.map((b, i) => bkCard(b, i, "data-bk-s")).join("")}</div>` : `<div class="nx-card nx-empty">${ic("book")}<strong>Your shelf is empty</strong>Add books you want to read.</div>`; }
  N.register("books", {
    title: "Books",
    nav: [{ key: "discover", label: "Discover", icon: "search" }, { key: "shelf", label: "My shelf", icon: "bookmark" }],
    html: () => `<div data-view="discover"><form class="nx-search" data-bk-form role="search"><span>${ic("search")}</span><input name="q" placeholder="Title, author or topic" autocomplete="off" enterkeyhint="search" aria-label="Search books"></form><div class="nx-chips">${SUBJ.map(([l, q], i) => `<button type="button" class="nx-chip${i ? "" : " is-active"}" data-bk-sub="${q}">${l}</button>`).join("")}</div><div data-bk-res></div><p class="nx-note">Books from Open Library. “Free” books open in the Internet Archive reader.</p></div><div data-view="shelf" hidden><div data-bk-shelf-list></div><button type="button" class="nx-btn ghost block" data-bk-pdf style="margin-top:12px">${ic("file", "sm")} Read my own PDF books</button></div>`,
    init(win) {
      bkLoad(win, SUBJ[0][1], "Popular for young readers");
      const f = win.querySelector("[data-bk-form]"); f.addEventListener("submit", (e) => { e.preventDefault(); const q = f.q.value.trim(); if (q) bkLoad(win, q, `Results for “${q}”`); });
      win.addEventListener("click", (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-bk-sub]")) { setActive(win, "[data-bk-sub]", g("[data-bk-sub]")); bkLoad(win, g("[data-bk-sub]").dataset.bkSub, g("[data-bk-sub]").textContent + " books"); return; }
        if (g("[data-bk]")) return bkSheet(win, BK.list[Number(g("[data-bk]").dataset.bk)]);
        if (g("[data-bk-s]")) return bkSheet(win, BK.shelf()[Number(g("[data-bk-s]").dataset.bkS)]);
        if (g("[data-bk-pdf]")) window.openApp("pdf");
      });
    },
    onNav(win, k) { showView(win, k); if (k === "shelf") bkShelf(win); },
    onBack(win) { const r = win.querySelector(".nx-bk-reader"); if (r) { r.remove(); return true; } return false; }
  });

  /* ================================================================== *
   * SOS — emergency calls, share location, torch & siren
   * ================================================================== */
  const HELP = [["112", "Emergency", "All emergencies", "t-red"], ["100", "Police", "", "t-blue"], ["108", "Ambulance", "", "t-green"], ["101", "Fire", "", "t-orange"], ["1098", "Childline", "Help for children", "t-violet"], ["181", "Women helpline", "", "t-pink"]];
  const SOS = { siren: null, torch: null };
  function sirenToggle(on) {
    if (!on) { try { SOS.siren?.osc.stop(); SOS.siren?.ctx.close(); } catch (_) {} clearInterval(SOS.siren?.t); SOS.siren = null; return false; }
    const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(), g = ctx.createGain(); osc.type = "sawtooth"; g.gain.value = 0.35; osc.connect(g).connect(ctx.destination); osc.start();
    let up = true; const t = setInterval(() => { osc.frequency.linearRampToValueAtTime(up ? 1500 : 650, ctx.currentTime + 0.45); up = !up; }, 450);
    SOS.siren = { ctx, osc, t }; try { navigator.vibrate?.([500, 200, 500, 200, 500]); } catch (_) {} return true;
  }
  async function torchToggle(on) {
    if (!on) { SOS.torch?.getTracks().forEach((t) => t.stop()); SOS.torch = null; return false; }
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }); const tr = s.getVideoTracks()[0];
    if (!tr.getCapabilities?.().torch) { s.getTracks().forEach((t) => t.stop()); throw new Error("no torch"); }
    await tr.applyConstraints({ advanced: [{ torch: true }] }); SOS.torch = s; return true;
  }
  N.torch = (on) => torchToggle(on); N.torchOn = () => !!SOS.torch; N.siren = (on) => sirenToggle(on);
  N.register("sos", {
    title: "Emergency SOS",
    html: () => `<div class="nx-sos-hero"><button type="button" class="nx-sos-btn" data-sos-hold aria-label="Hold to call 112"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" data-ring/></svg><b>SOS</b><span>Hold 2 sec</span></button><p>Hold the button to call <b>112</b> (India emergency).</p></div>
      <div class="nx-sos-tools"><button type="button" class="nx-card" data-sos-loc><span class="nx-tile t-blue">${ic("pin")}</span><strong>Send my location</strong><span>To trusted contacts</span></button><button type="button" class="nx-card" data-sos-torch><span class="nx-tile t-yellow">${ic("flash")}</span><strong>Torch</strong><span data-sos-tl>Off</span></button><button type="button" class="nx-card" data-sos-siren><span class="nx-tile t-red">${ic("siren")}</span><strong>Loud siren</strong><span data-sos-sl>Off</span></button></div>
      <div class="nx-section-title">Trusted contacts</div><div data-sos-ct></div>
      <div class="nx-section-title">Helplines</div><div class="nx-list">${HELP.map(([n, l, d, t]) => `<a class="nx-row" href="tel:${n}"><span class="nx-tile ${t}">${ic("phone")}</span><span class="nx-row-main"><strong>${l}</strong><span>${n}${d ? " · " + d : ""}</span></span><b class="nx-sos-num">${n}</b></a>`).join("")}</div>`,
    init(win) {
      win.classList.add("nx-sosapp");
      const trusted = () => store.get("nexus-contacts", []).filter((c) => c.sos && c.phone);
      const renderCt = () => { const all = store.get("nexus-contacts", []); const t = trusted(); win.querySelector("[data-sos-ct]").innerHTML = (t.length ? `<div class="nx-list">${t.map((c) => `<div class="nx-row"><span class="nx-avatar">${esc(c.name[0])}</span><span class="nx-row-main"><strong>${esc(c.name)}</strong><span>${esc(c.phone)}</span></span><a class="nx-icon-btn" href="tel:${esc(c.phone.replace(/\s/g, ""))}" aria-label="Call ${esc(c.name)}" style="color:#22c55e">${ic("phone")}</a></div>`).join("")}</div>` : `<div class="nx-card nx-empty" style="padding:18px">${ic("users")}<strong>No trusted contacts</strong>${all.length ? "Choose family members who should get your SOS." : "Add contacts in the Phone app first."}</div>`) + (all.length ? `<button type="button" class="nx-btn ghost block" data-sos-pick style="margin-top:10px">${ic("users", "sm")} Choose trusted contacts</button>` : `<button type="button" class="nx-btn ghost block" data-sos-phone style="margin-top:10px">Open Phone app</button>`); };
      renderCt();
      const btn = win.querySelector("[data-sos-hold]"); let ht = null;
      const down = (e) => { e.preventDefault(); btn.classList.add("hold"); try { navigator.vibrate?.(30); } catch (_) {} ht = setTimeout(() => { btn.classList.remove("hold"); try { navigator.vibrate?.([200, 100, 200]); } catch (_) {} window.location.href = "tel:112"; }, 2000); };
      const up = () => { clearTimeout(ht); btn.classList.remove("hold"); };
      btn.addEventListener("pointerdown", down); ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => btn.addEventListener(ev, up));
      const tm = setInterval(() => { if (!win.isConnected) { clearInterval(tm); sirenToggle(false); torchToggle(false); } }, 700);
      win.addEventListener("click", async (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-sos-siren]")) { const on = sirenToggle(!SOS.siren); win.querySelector("[data-sos-sl]").textContent = on ? "ON — tap to stop" : "Off"; g("[data-sos-siren]").classList.toggle("is-on", on); return; }
        if (g("[data-sos-torch]")) { try { const on = await torchToggle(!SOS.torch); win.querySelector("[data-sos-tl]").textContent = on ? "On" : "Off"; g("[data-sos-torch]").classList.toggle("is-on", on); } catch (_) { toast(win, "Torch isn't available — use your phone's quick settings"); } return; }
        if (g("[data-sos-loc]")) {
          toast(win, "Getting your location…");
          const send = (txt) => { const nums = trusted().map((c) => c.phone.replace(/[^\d+]/g, "")); const body = encodeURIComponent(txt); if (nums.length) window.location.href = `sms:${nums.join(",")}?body=${body}`; else if (navigator.share) navigator.share({ text: txt }).catch(() => {}); else { navigator.clipboard?.writeText(txt); toast(win, "Message copied — paste it to someone"); } };
          if (!navigator.geolocation) { send("🆘 I need help. Please call me."); return; }
          navigator.geolocation.getCurrentPosition((p) => send(`🆘 I need help! My location: https://maps.google.com/?q=${p.coords.latitude.toFixed(6)},${p.coords.longitude.toFixed(6)} (sent from Nexus OS)`), () => send("🆘 I need help. Please call me. (Location was not available)"), { enableHighAccuracy: true, timeout: 10000 });
          return;
        }
        if (g("[data-sos-phone]")) { window.openApp("call"); return; }
        if (g("[data-sos-pick]")) {
          const all = store.get("nexus-contacts", []);
          openSheet(win, `<h3>Trusted contacts</h3><p class="nx-note" style="margin:-6px 0 12px">They'll get your location when you tap Send my location.</p><div class="nx-list">${all.map((c) => `<button type="button" class="nx-row" data-tc="${c.id}"><span class="nx-avatar">${esc(c.name[0])}</span><span class="nx-row-main"><strong>${esc(c.name)}</strong><span>${esc(c.phone || "No number")}</span></span><span class="nx-switch" aria-checked="${!!c.sos}"></span></button>`).join("")}</div>`, (p) => p.addEventListener("click", (ev) => { const b = ev.target.closest("[data-tc]"); if (!b) return; const l = store.get("nexus-contacts", []); const c = l.find((x) => x.id === b.dataset.tc); c.sos = !c.sos; store.set("nexus-contacts", l); b.querySelector(".nx-switch").setAttribute("aria-checked", c.sos); renderCt(); }));
        }
      });
    }
  });

  /* ================================================================== *
   * CLEANER — free up space used by Nexus OS
   * ================================================================== */
  const CACHE_PREFIX = ["nx-music-cache:", "nx-news:", "nx-radio:", "nx-books:", "nx-yt", "nexus-weather-cache", "nexus-yt-cache"];
  function lsGroups() {
    let cache = 0, cacheN = 0, data = 0;
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); const sz = (k.length + (localStorage.getItem(k) || "").length) * 2; if (CACHE_PREFIX.some((p) => k.startsWith(p))) { cache += sz; cacheN++; } else data += sz; }
    return { cache, cacheN, data };
  }
  N.register("cleaner", {
    title: "Cleaner",
    html: () => `<div data-cl-main><div class="nx-skel" style="height:180px;border-radius:20px"></div></div>`,
    init(win) {
      const render = async () => {
        const est = await navigator.storage?.estimate?.().catch(() => null); const files = await FilesDB.all().catch(() => []); const ls = lsGroups();
        let swN = 0, swOld = 0; try { const keys = await caches.keys(); swN = keys.length; swOld = keys.filter((k) => k.startsWith("nexus-os-") && k !== "nexus-os-v44").length; } catch (_) {}
        const fileBytes = files.reduce((a, f) => a + (f.size || 0), 0); const used = est?.usage || fileBytes + ls.cache + ls.data; const quota = est?.quota || 0;
        const junk = ls.cache; const big = files.slice().sort((a, b) => b.size - a.size).slice(0, 5);
        const callLog = store.get("nexus-call-log", []).length, aiChat = store.get("nexus-ai-chat", []).length;
        win.querySelector("[data-cl-main]").innerHTML = `<div class="nx-card nx-cl-hero"><div class="nx-c-ring nx-sec-ring" style="--p:${quota ? Math.max(2, Math.min(100, (used / quota) * 100)) : 10}"><div><b style="font-size:20px !important">${N.fmtBytes(used)}</b><span>used</span></div></div><div><strong>Nexus storage</strong><span>${quota ? N.fmtBytes(quota) + " allowed by your browser" : "Space used on this phone"}</span><span>${files.length} files · ${N.fmtBytes(fileBytes)}</span></div></div>
          <div class="nx-section-title">Clean up</div><div class="nx-list">
            <div class="nx-row"><span class="nx-tile t-teal">${ic("sparkles")}</span><span class="nx-row-main"><strong>Temporary data</strong><span>${ls.cacheN} saved lists from Music, News, Radio, Books · ${N.fmtBytes(junk)}</span></span><button type="button" class="nx-btn sm" data-cl="cache" ${ls.cacheN ? "" : "disabled"}>Clean</button></div>
            <div class="nx-row"><span class="nx-tile t-blue">${ic("download")}</span><span class="nx-row-main"><strong>Old app versions</strong><span>${swOld ? swOld + " old offline copies" : "Nothing old"} · ${swN} total</span></span><button type="button" class="nx-btn sm" data-cl="sw" ${swOld ? "" : "disabled"}>Clean</button></div>
            <div class="nx-row"><span class="nx-tile t-violet">${ic("message")}</span><span class="nx-row-main"><strong>Nexus AI chat</strong><span>${aiChat} messages</span></span><button type="button" class="nx-btn sm ghost" data-cl="ai" ${aiChat ? "" : "disabled"}>Clear</button></div>
            <div class="nx-row"><span class="nx-tile t-green">${ic("phone")}</span><span class="nx-row-main"><strong>Call history</strong><span>${callLog} calls</span></span><button type="button" class="nx-btn sm ghost" data-cl="calls" ${callLog ? "" : "disabled"}>Clear</button></div></div>
          ${big.length ? `<div class="nx-section-title">Biggest files</div><div class="nx-list">${big.map((f) => `<div class="nx-row"><span class="nx-tile t-orange">${ic(f.type.startsWith("image") ? "image" : f.type.startsWith("video") ? "video" : f.type.startsWith("audio") ? "music" : "file")}</span><span class="nx-row-main"><strong>${esc(f.name)}</strong><span>${N.fmtBytes(f.size)}</span></span><button type="button" class="nx-del" data-cl-del="${f.id}" aria-label="Delete ${esc(f.name)}">${ic("trash", "sm")}</button></div>`).join("")}</div>` : ""}
          <p class="nx-note">Cleaning never deletes your notes, contacts, photos or settings unless you pick them.</p>`;
      };
      render();
      win.addEventListener("click", async (e) => {
        const g = (s) => e.target.closest(s); const a = g("[data-cl]")?.dataset.cl;
        if (a === "cache") { const ks = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (CACHE_PREFIX.some((p) => k.startsWith(p)) && k !== "nexus-weather-cache") ks.push(k); } ks.forEach((k) => localStorage.removeItem(k)); toast(win, `Cleaned ${ks.length} items`); }
        if (a === "sw") { const keys = await caches.keys(); await Promise.all(keys.filter((k) => k.startsWith("nexus-os-") && k !== "nexus-os-v44").map((k) => caches.delete(k))); toast(win, "Old versions removed"); }
        if (a === "ai" && confirm("Clear your Nexus AI chat?")) { store.set("nexus-ai-chat", []); toast(win, "Chat cleared"); }
        if (a === "calls" && confirm("Clear call history?")) { store.set("nexus-call-log", []); toast(win, "Call history cleared"); }
        if (g("[data-cl-del]")) { if (!confirm("Delete this file?")) return; await FilesDB.del(g("[data-cl-del]").dataset.clDel); toast(win, "File deleted"); }
        if (a || g("[data-cl-del]")) render();
      });
    }
  });
})();
