/* Nexus OS — Batch 2b: Messages · Calls · Gallery · Themes (v41) */
(function () {
  "use strict";
  const N = window.NexusApps; if (!N) return;
  const { ic, esc, uid, store, toast, openSheet, closeSheet, setActive, showView, selectNav, selectTab, FilesDB } = N;
  Object.assign(N.I, {
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    backspace: '<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><path d="m18 9-6 6M12 9l6 6"/>',
    share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    callIn: '<path d="M16 2v6h6M22 2l-6 6"/>',
    callOut: '<path d="M22 8V2h-6M16 8l6-6"/>'
  });
  const pad = (n) => String(n).padStart(2, "0");
  const COLORS = ["#1e88ff", "#7c5cff", "#14b8a6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#0ea5e9"];
  const colorFor = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return COLORS[h % COLORS.length]; };
  const avatar = (name, big) => `<span class="nx-avatar${big ? " nx-avatar-xl" : ""}" style="background:${colorFor(name)}">${esc((name || "?").trim()[0]?.toUpperCase() || "?")}</span>`;
  const when = (t) => { const d = new Date(t), now = new Date(); if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); const y = new Date(now); y.setDate(y.getDate() - 1); if (d.toDateString() === y.toDateString()) return "Yesterday"; return d.toLocaleDateString([], { day: "numeric", month: "short" }); };
  const cleanTel = (p) => String(p || "").replace(/[^\d+*#]/g, "");

  /* ---------- Shared contacts ---------- */
  const contacts = () => store.get("nexus-contacts", []);
  const saveContacts = (l) => store.set("nexus-contacts", l.sort((a, b) => a.name.localeCompare(b.name)));
  const contactById = (id) => contacts().find((c) => c.id === id);
  const contactByTel = (t) => contacts().find((c) => cleanTel(c.phone) && cleanTel(c.phone).slice(-10) === cleanTel(t).slice(-10));
  const canPick = () => "contacts" in navigator && "select" in navigator.contacts;
  async function importContacts(win, done) {
    try {
      const picked = await navigator.contacts.select(["name", "tel"], { multiple: true });
      const l = contacts(); let n = 0;
      picked.forEach((p) => { const name = p.name?.[0] || p.tel?.[0]; const phone = p.tel?.[0] || ""; if (!name || l.some((c) => cleanTel(c.phone) === cleanTel(phone) && phone)) return; l.push({ id: uid(), name, phone, fav: false }); n++; });
      saveContacts(l); toast(win, n ? `Added ${n} contact${n > 1 ? "s" : ""}` : "No new contacts"); done?.();
    } catch (_) { toast(win, "Contact import was cancelled"); }
  }
  function contactForm(win, c, done) {
    c = c || { name: "", phone: "", fav: false };
    openSheet(win, `<h3>${c.id ? "Edit contact" : "New contact"}</h3><form data-ct-form>
      <label class="nx-field">Name<input class="nx-input" name="name" value="${esc(c.name)}" required maxlength="40" autocomplete="name"></label>
      <label class="nx-field">Phone number<input class="nx-input" name="phone" value="${esc(c.phone)}" type="tel" inputmode="tel" maxlength="20" autocomplete="tel"></label>
      <button class="nx-btn block" type="submit">Save</button>
      ${!c.id && canPick() ? `<button class="nx-btn ghost block" type="button" data-ct-import style="margin-top:10px">${ic("users", "sm")} Import from phone contacts</button>` : ""}</form>`, (p) => {
      p.querySelector("[data-ct-import]")?.addEventListener("click", () => { closeSheet(win); importContacts(win, done); });
      p.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault(); const f = e.target; const l = contacts();
        const rec = { ...c, id: c.id || uid(), name: f.name.value.trim(), phone: f.phone.value.trim() };
        const i = l.findIndex((x) => x.id === rec.id); if (i >= 0) l[i] = rec; else l.push(rec);
        saveContacts(l); closeSheet(win); toast(win, "Contact saved"); done?.(rec);
      });
    });
  }
  function contactSheet(win, id, done) {
    const c = contactById(id); if (!c) return;
    openSheet(win, `<div class="nx-ct-head">${avatar(c.name, true)}<h3>${esc(c.name)}</h3><span>${esc(c.phone || "No number")}</span></div>
      <div class="nx-ct-acts"><button type="button" data-a="call" ${c.phone ? "" : "disabled"}>${ic("phone")}<span>Call</span></button><button type="button" data-a="msg">${ic("message")}<span>Message</span></button><button type="button" data-a="fav" class="${c.fav ? "is-on" : ""}">${ic("star")}<span>${c.fav ? "Favourite" : "Add to favourites"}</span></button><button type="button" data-a="edit">${ic("edit")}<span>Edit</span></button></div>
      <button type="button" class="nx-btn danger block" data-a="del">${ic("trash", "sm")} Delete contact</button>`, (p) => p.addEventListener("click", (e) => {
      const a = e.target.closest("[data-a]")?.dataset.a; if (!a) return;
      if (a === "call") { closeSheet(win); placeCall(win, c.phone, c.name); }
      if (a === "msg") { closeSheet(win); N.open("messages"); const w = document.querySelector("#app-layer .nx-messages"); if (w) msgOpenThread(w, "c:" + c.id); }
      if (a === "fav") { const l = contacts(); const x = l.find((y) => y.id === id); x.fav = !x.fav; saveContacts(l); contactSheet(win, id, done); done?.(); }
      if (a === "edit") contactForm(win, c, done);
      if (a === "del") { if (!confirm(`Delete ${c.name}?`)) return; saveContacts(contacts().filter((x) => x.id !== id)); closeSheet(win); toast(win, "Contact deleted"); done?.(); }
    }));
  }
  const contactRows = (list, attr) => list.map((c) => `<button type="button" class="nx-row" ${attr}="${c.id}">${avatar(c.name)}<span class="nx-row-main"><strong>${esc(c.name)}</strong><span>${esc(c.phone || "No number")}</span></span>${c.fav ? `<span class="nx-star-on">${ic("star", "sm")}</span>` : ""}</button>`).join("");
  function contactList(q, attr) {
    const l = contacts().filter((c) => !q || (c.name + " " + c.phone).toLowerCase().includes(q.toLowerCase()));
    if (!contacts().length) return `<div class="nx-card nx-empty">${ic("users")}<strong>No contacts yet</strong>Add people, or import them from your phone.<div class="nx-actions" style="justify-content:center;margin-top:12px"><button type="button" class="nx-btn sm" data-ct-new>${ic("plus", "sm")} Add contact</button>${canPick() ? `<button type="button" class="nx-btn ghost sm" data-ct-imp>${ic("users", "sm")} Import</button>` : ""}</div></div>`;
    let last = "", out = "";
    l.forEach((c) => { const L = c.name[0].toUpperCase(); if (L !== last) { if (out) out += "</div>"; out += `<div class="nx-group-label">${esc(L)}</div><div class="nx-list">`; last = L; } out += contactRows([c], attr); });
    return (out ? out + "</div>" : `<p class="nx-note">No matches.</p>`);
  }

  /* ================================================================== *
   * CALLS — keypad & contacts hand off to your phone's dialler
   * ================================================================== */
  const KEYS = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["*", ""], ["0", "+"], ["#", ""]];
  function placeCall(win, number, name) {
    const n = cleanTel(number); if (!n) { toast(win, "Enter a number first"); return; }
    const log = store.get("nexus-call-log", []); log.unshift({ id: uid(), number: n, name: name || contactByTel(n)?.name || "", at: Date.now() }); store.set("nexus-call-log", log.slice(0, 100));
    window.location.href = "tel:" + n;
  }
  const CL = { dial: "" };
  function callsRender(win, key) {
    if (key === "keypad") {
      const m = CL.dial ? contactByTel(CL.dial) : null;
      win.querySelector("[data-cl-num]").textContent = CL.dial || " ";
      win.querySelector("[data-cl-match]").textContent = m ? m.name : CL.dial ? "Tap call to dial" : "Enter a number";
      win.querySelector("[data-cl-bs]").style.visibility = CL.dial ? "visible" : "hidden";
    } else if (key === "recents") {
      const log = store.get("nexus-call-log", []);
      win.querySelector("[data-cl-recents]").innerHTML = log.length ? `<div class="nx-list">${log.map((c) => `<div class="nx-row">${avatar(c.name || c.number)}<span class="nx-row-main"><strong>${esc(c.name || c.number)}</strong><span><span class="nx-callout">${ic("callOut", "sm")}</span> ${c.name ? esc(c.number) + " · " : ""}${when(c.at)}</span></span><button type="button" class="nx-icon-btn nx-call-ic" data-cl-call="${esc(c.number)}" aria-label="Call ${esc(c.name || c.number)}">${ic("phone")}</button></div>`).join("")}</div><button type="button" class="nx-btn ghost block" data-cl-clear style="margin-top:12px">Clear call history</button>` : `<div class="nx-card nx-empty">${ic("phone")}<strong>No recent calls</strong>Calls you start from Nexus show here.</div>`;
    } else if (key === "contacts") {
      win.querySelector("[data-cl-contacts]").innerHTML = contactList(win.querySelector("[data-cl-q]")?.value || "", "data-cl-ct");
    } else {
      const f = contacts().filter((c) => c.fav);
      win.querySelector("[data-cl-favs]").innerHTML = f.length ? `<div class="nx-fav-grid">${f.map((c) => `<button type="button" data-cl-ct="${c.id}">${avatar(c.name, true)}<span>${esc(c.name)}</span></button>`).join("")}</div>` : `<div class="nx-card nx-empty">${ic("star")}<strong>No favourites</strong>Open a contact and tap Add to favourites.</div>`;
    }
  }
  N.register("call", {
    title: "Phone",
    actions: `<button class="nx-icon-btn" type="button" data-ct-new aria-label="New contact">${ic("plus")}</button>`,
    nav: [{ key: "keypad", label: "Keypad", icon: "grid" }, { key: "recents", label: "Recents", icon: "history" }, { key: "contacts", label: "Contacts", icon: "users" }, { key: "favs", label: "Favourites", icon: "star" }],
    html: () => `<div data-view="keypad" class="nx-dial"><div class="nx-dial-num"><b data-cl-num> </b><span data-cl-match>Enter a number</span></div>
        <div class="nx-dial-keys">${KEYS.map(([k, l]) => `<button type="button" data-cl-key="${k}"><b>${k}</b><small>${l || "&nbsp;"}</small></button>`).join("")}</div>
        <div class="nx-dial-row"><span></span><button type="button" class="nx-dial-call" data-cl-dial aria-label="Call">${ic("phone", "lg")}</button><button type="button" class="nx-icon-btn" data-cl-bs aria-label="Delete digit">${ic("backspace", "lg")}</button></div>
        <p class="nx-note" style="text-align:center">Calls are placed by your phone's dialler.</p></div>
      <div data-view="recents" hidden><div data-cl-recents></div></div>
      <div data-view="contacts" hidden><div class="nx-search"><span>${ic("search")}</span><input data-cl-q placeholder="Search contacts" aria-label="Search contacts"></div><div data-cl-contacts></div></div>
      <div data-view="favs" hidden><div data-cl-favs></div></div>`,
    init(win) {
      CL.dial = ""; callsRender(win, "keypad"); let cur = "keypad";
      const refresh = () => callsRender(win, cur);
      win.querySelector("[data-cl-q]").addEventListener("input", () => callsRender(win, "contacts"));
      win.addEventListener("click", (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-cl-key]")) { if (CL.dial.length < 18) CL.dial += g("[data-cl-key]").dataset.clKey; try { navigator.vibrate?.(8); } catch (_) {} callsRender(win, "keypad"); return; }
        if (g("[data-cl-bs]")) { CL.dial = CL.dial.slice(0, -1); callsRender(win, "keypad"); return; }
        if (g("[data-cl-dial]")) return placeCall(win, CL.dial);
        if (g("[data-cl-call]")) return placeCall(win, g("[data-cl-call]").dataset.clCall);
        if (g("[data-cl-clear]")) { store.set("nexus-call-log", []); refresh(); return; }
        if (g("[data-cl-ct]")) return contactSheet(win, g("[data-cl-ct]").dataset.clCt, refresh);
        if (g("[data-ct-new]")) return contactForm(win, null, refresh);
        if (g("[data-ct-imp]")) return importContacts(win, refresh);
      });
      this._set = (k) => { cur = k; };
    },
    onNav(win, key) { this._set?.(key); showView(win, key); callsRender(win, key); }
  });

  /* ================================================================== *
   * MESSAGES — chats saved on the device; texts go out via your SMS app
   * ================================================================== */
  const threads = () => store.get("nexus-threads", {});
  const threadName = (key) => key === "self" ? "Notes to self" : key.startsWith("c:") ? (contactById(key.slice(2))?.name || "Unknown") : key.slice(2);
  const threadPhone = (key) => key.startsWith("c:") ? contactById(key.slice(2))?.phone : key.startsWith("n:") ? key.slice(2) : "";
  const MSG = { open: null };
  function msgList(win) {
    const t = threads(); const q = (win.querySelector("[data-ms-q]")?.value || "").toLowerCase();
    const keys = Object.keys(t).filter((k) => t[k].length).sort((a, b) => t[b].at(-1).at - t[a].at(-1).at).filter((k) => !q || threadName(k).toLowerCase().includes(q) || t[k].some((m) => m.text.toLowerCase().includes(q)));
    if (!keys.includes("self") && !q) keys.push("self");
    win.querySelector("[data-ms-list]").innerHTML = `<div class="nx-list">${keys.map((k) => { const last = t[k]?.at(-1); return `<button type="button" class="nx-row nx-ms-row" data-ms-open="${esc(k)}">${k === "self" ? `<span class="nx-avatar" style="background:var(--nx-accent)">${ic("bookmark", "sm")}</span>` : avatar(threadName(k))}<span class="nx-row-main"><strong>${esc(threadName(k))}</strong><span>${esc(last ? (last.me ? "You: " : "") + last.text : "Save ideas, links and lists")}</span></span><span class="nx-row-meta">${last ? when(last.at) : ""}</span></button>`; }).join("")}</div>`;
  }
  function msgOpenThread(win, key) {
    MSG.open = key; const box = win.querySelector("[data-view='thread']");
    showView(win, "thread"); win.querySelector(".nx-nav").hidden = true; win.querySelector(".nx-fab")?.setAttribute("hidden", "");
    win.querySelector(".nx-head h2").textContent = threadName(key);
    const phone = threadPhone(key);
    win.querySelector("[data-ms-call]").hidden = !phone;
    const msgs = threads()[key] || [];
    let lastDay = "";
    box.querySelector("[data-ms-bubbles]").innerHTML = (key !== "self" ? `<p class="nx-note nx-ms-info">${phone ? `Messages open in your phone's SMS app to send to ${esc(phone)}. A copy stays here.` : "This contact has no phone number. Messages are saved here only."}</p>` : `<p class="nx-note nx-ms-info">Only you can see this chat.</p>`) +
      msgs.map((m) => { const d = new Date(m.at).toDateString(); const sep = d !== lastDay ? `<div class="nx-ms-day">${when(m.at).includes(":") ? "Today" : when(m.at)}</div>` : ""; lastDay = d; return `${sep}<div class="nx-bubble${m.me ? " me" : ""}"><span>${esc(m.text)}</span><small>${new Date(m.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}${m.sms ? " · via SMS" : ""}</small></div>`; }).join("");
    const body = win.querySelector(".nx-body"); requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
  }
  function msgClose(win) { MSG.open = null; win.querySelector(".nx-head h2").textContent = "Messages"; win.querySelector(".nx-nav").hidden = false; win.querySelector(".nx-fab")?.removeAttribute("hidden"); win.querySelector("[data-ms-call]").hidden = true; showView(win, "chats"); selectNav(win, "chats"); msgList(win); }
  N.register("messages", {
    title: "Messages",
    actions: `<button class="nx-icon-btn" type="button" data-ms-call hidden aria-label="Call">${ic("phone")}</button>`,
    nav: [{ key: "chats", label: "Chats", icon: "message" }, { key: "contacts", label: "Contacts", icon: "users" }],
    html: () => `<div data-view="chats"><div class="nx-search"><span>${ic("search")}</span><input data-ms-q placeholder="Search messages" aria-label="Search messages"></div><div data-ms-list></div><button class="nx-fab" type="button" data-ms-new aria-label="New message">${ic("edit")}</button></div>
      <div data-view="contacts" hidden><div data-ms-contacts></div><button class="nx-btn ghost block" type="button" data-ct-new style="margin-top:12px">${ic("plus", "sm")} New contact</button></div>
      <div data-view="thread" hidden><div data-ms-bubbles class="nx-ms-thread"></div></div>`,
    footerHtml: () => `<form class="nx-ms-compose" data-ms-form hidden><input name="t" placeholder="Type a message" autocomplete="off" aria-label="Message" maxlength="1000"><button type="submit" aria-label="Send">${ic("send")}</button></form>`,
    init(win) {
      win.classList.add("nx-messages"); msgList(win);
      const form = win.querySelector("[data-ms-form]");
      const obs = new MutationObserver(() => { form.hidden = win.querySelector("[data-view='thread']").hidden; }); obs.observe(win.querySelector("[data-view='thread']"), { attributes: true });
      win.querySelector("[data-ms-q]").addEventListener("input", () => msgList(win));
      form.addEventListener("submit", (e) => {
        e.preventDefault(); const text = form.t.value.trim(); if (!text || !MSG.open) return;
        const t = threads(); const phone = threadPhone(MSG.open);
        (t[MSG.open] = t[MSG.open] || []).push({ id: uid(), text, at: Date.now(), me: true, sms: !!phone });
        store.set("nexus-threads", t); form.t.value = ""; msgOpenThread(win, MSG.open);
        if (phone) setTimeout(() => { window.location.href = "sms:" + cleanTel(phone) + "?body=" + encodeURIComponent(text); }, 150);
      });
      const pickNew = () => openSheet(win, `<h3>New message</h3><form data-ms-to style="display:flex;gap:8px;margin-bottom:12px"><input class="nx-input" name="n" type="tel" inputmode="tel" placeholder="Type a phone number" aria-label="Phone number"><button class="nx-btn" type="submit">Go</button></form>${contacts().length ? `<div class="nx-list">${contactRows(contacts(), "data-ms-pick")}</div>` : `<p class="nx-note">Add contacts in the Contacts tab to pick them here.</p>`}`, (p) => {
        p.addEventListener("click", (e) => { const c = e.target.closest("[data-ms-pick]"); if (c) { closeSheet(win); msgOpenThread(win, "c:" + c.dataset.msPick); } });
        p.querySelector("form").addEventListener("submit", (e) => { e.preventDefault(); const n = cleanTel(e.target.n.value); if (!n) return; closeSheet(win); const c = contactByTel(n); msgOpenThread(win, c ? "c:" + c.id : "n:" + n); });
      });
      const refreshC = () => { win.querySelector("[data-ms-contacts]").innerHTML = contactList("", "data-ms-ct"); };
      win.addEventListener("click", (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-ms-open]")) return msgOpenThread(win, g("[data-ms-open]").dataset.msOpen);
        if (g("[data-ms-new]")) return pickNew();
        if (g("[data-ms-ct]")) return contactSheet(win, g("[data-ms-ct]").dataset.msCt, refreshC);
        if (g("[data-ct-new]")) return contactForm(win, null, refreshC);
        if (g("[data-ct-imp]")) return importContacts(win, refreshC);
        if (g("[data-ms-call]")) { const p = threadPhone(MSG.open || ""); if (p) placeCall(win, p, threadName(MSG.open)); }
      });
      this._refreshC = refreshC;
    },
    onNav(win, key) { showView(win, key); if (key === "contacts") this._refreshC?.(); else msgList(win); },
    onBack(win) { if (MSG.open) { msgClose(win); return true; } return false; }
  });

  /* ================================================================== *
   * GALLERY — photos & videos from Camera, Files, Paint & Generator
   * ================================================================== */
  const G = { items: [], urls: [], album: null, tab: "photos", idx: -1, list: [] };
  const favs = () => new Set(store.get("nexus-gallery-fav", []));
  async function gLoad() {
    G.urls.forEach((u) => URL.revokeObjectURL(u)); G.urls = [];
    let files = []; try { files = await FilesDB.all(); } catch (_) {}
    const media = files.filter((f) => /^(image|video)\//.test(f.type)).map((f) => { const u = URL.createObjectURL(f.blob); G.urls.push(u); return { id: f.id, name: f.name, type: f.type, at: f.added, src: u, source: f.source || "imported", size: f.size, blob: f.blob }; });
    let legacy = []; try { legacy = JSON.parse(localStorage.getItem("nexus-camera-photos") || "[]"); } catch (_) {}
    legacy.forEach((p) => { if (p.data) media.push({ id: "legacy-" + p.id, name: p.name || "Photo.jpg", type: "image/jpeg", at: Number(p.id) || 0, src: p.data, source: "camera", legacy: true }); });
    G.items = media.sort((a, b) => b.at - a.at);
  }
  const ALBUMS = [["camera", "Camera", "camera", "t-blue"], ["videos", "Videos", "video", "t-red"], ["fav", "Favourites", "heart", "t-pink"], ["generator", "AI creations", "image", "t-violet"], ["paint", "Paintings", "palette", "t-orange"], ["imported", "Imported", "download", "t-teal"]];
  const inAlbum = (it, a) => a === "videos" ? it.type.startsWith("video") : a === "fav" ? favs().has(it.id) : a === "imported" ? !["camera", "generator", "paint"].includes(it.source) : it.source === a;
  function gGrid(list) {
    G.list = list;
    if (!list.length) return `<div class="nx-card nx-empty">${ic("image")}<strong>No photos here yet</strong>Take photos with Camera, or tap Import to add them from your phone.<button type="button" class="nx-btn sm" data-g-import style="margin-top:12px">${ic("upload", "sm")} Import photos</button></div>`;
    let out = "", day = "";
    list.forEach((it, i) => {
      const d = new Date(it.at); const label = when(it.at).includes(":") ? "Today" : d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short", year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric" });
      if (label !== day) { if (out) out += "</div>"; out += `<div class="nx-group-label">${esc(label)}</div><div class="nx-g-grid">`; day = label; }
      out += `<button type="button" class="nx-g-cell" data-g-view="${i}" aria-label="${esc(it.name)}">${it.type.startsWith("video") ? `<video src="${it.src}#t=0.1" muted preload="metadata"></video><span class="nx-g-badge">${ic("play", "sm")}</span>` : `<img src="${it.src}" alt="" loading="lazy">`}${favs().has(it.id) ? `<span class="nx-g-fav">${ic("heart", "sm")}</span>` : ""}</button>`;
    });
    return out + "</div>";
  }
  function gRender(win) {
    const box = win.querySelector("[data-g-main]");
    win.querySelector(".nx-head h2").textContent = G.album ? ALBUMS.find((a) => a[0] === G.album)[1] : "Gallery";
    if (G.album) { box.innerHTML = gGrid(G.items.filter((it) => inAlbum(it, G.album))); return; }
    if (G.tab === "photos") box.innerHTML = `<p class="nx-note" style="margin-top:0">${G.items.length} item${G.items.length === 1 ? "" : "s"}</p>` + gGrid(G.items);
    else box.innerHTML = `<div class="nx-g-albums">${ALBUMS.map(([k, n, icn, t]) => { const l = G.items.filter((it) => inAlbum(it, k)); const cover = l.find((x) => x.type.startsWith("image")); return `<button type="button" class="nx-g-album" data-g-album="${k}"><span class="nx-g-cover">${cover ? `<img src="${cover.src}" alt="">` : `<span class="nx-tile ${t}">${ic(icn)}</span>`}</span><strong>${n}</strong><span>${l.length}</span></button>`; }).join("")}</div>`;
  }
  function gViewer(win, i) {
    G.idx = i; const it = G.list[i]; if (!it) return;
    win.querySelector(".nx-gv")?.remove();
    const v = document.createElement("div"); v.className = "nx-gv";
    v.innerHTML = `<div class="nx-gv-top"><button type="button" class="nx-icon-btn" data-gv-close aria-label="Close">${ic("back", "lg")}</button><span><strong>${esc(it.name)}</strong><small>${new Date(it.at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</small></span></div>
      <div class="nx-gv-stage">${it.type.startsWith("video") ? `<video src="${it.src}" controls playsinline autoplay></video>` : `<img src="${it.src}" alt="${esc(it.name)}">`}
        ${i > 0 ? `<button type="button" class="nx-gv-nav prev" data-gv-step="-1" aria-label="Previous">${ic("chev", "lg")}</button>` : ""}${i < G.list.length - 1 ? `<button type="button" class="nx-gv-nav next" data-gv-step="1" aria-label="Next">${ic("chev", "lg")}</button>` : ""}</div>
      <div class="nx-gv-bar"><button type="button" data-gv="fav" class="${favs().has(it.id) ? "is-on" : ""}">${ic("heart")}<span>Favourite</span></button><button type="button" data-gv="share">${ic("share")}<span>Share</span></button><a href="${it.src}" download="${esc(it.name)}">${ic("download")}<span>Save</span></a><button type="button" data-gv="del">${ic("trash")}<span>Delete</span></button></div>`;
    win.append(v);
    let sx = null; const st = v.querySelector(".nx-gv-stage");
    st.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
    st.addEventListener("touchend", (e) => { if (sx == null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 60) { const j = G.idx + (dx < 0 ? 1 : -1); if (G.list[j]) gViewer(win, j); } });
    v.addEventListener("click", async (e) => {
      if (e.target.closest("[data-gv-close]")) { v.remove(); gRender(win); return; }
      const s = e.target.closest("[data-gv-step]"); if (s) { gViewer(win, G.idx + Number(s.dataset.gvStep)); return; }
      const a = e.target.closest("[data-gv]")?.dataset.gv;
      if (a === "fav") { const f = favs(); f.has(it.id) ? f.delete(it.id) : f.add(it.id); store.set("nexus-gallery-fav", [...f]); e.target.closest("[data-gv]").classList.toggle("is-on"); toast(win, f.has(it.id) ? "Added to Favourites" : "Removed from Favourites"); }
      if (a === "share") {
        try { const blob = it.blob || (await (await fetch(it.src)).blob()); const file = new File([blob], it.name, { type: it.type }); if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: it.name }); else toast(win, "Sharing isn't supported here — use Save"); } catch (_) {}
      }
      if (a === "del") {
        if (!confirm("Delete this " + (it.type.startsWith("video") ? "video" : "photo") + "?")) return;
        if (it.legacy) { const all = JSON.parse(localStorage.getItem("nexus-camera-photos") || "[]").filter((p) => "legacy-" + p.id !== it.id); localStorage.setItem("nexus-camera-photos", JSON.stringify(all)); }
        else await FilesDB.del(it.id);
        v.remove(); await gLoad(); gRender(win); toast(win, "Deleted");
      }
    });
  }
  N.register("gallery", {
    title: "Gallery",
    actions: `<button class="nx-icon-btn" type="button" data-g-import aria-label="Import photos">${ic("upload")}</button><button class="nx-icon-btn" type="button" data-g-cam aria-label="Open camera">${ic("camera")}</button>`,
    tabs: [{ key: "photos", label: "Photos" }, { key: "albums", label: "Albums" }],
    html: () => `<div data-g-main><div class="nx-g-grid">${'<span class="nx-skel" style="aspect-ratio:1"></span>'.repeat(9)}</div></div><input type="file" accept="image/*,video/*" multiple hidden data-g-file>`,
    async init(win) {
      win.classList.add("nx-gallery"); G.album = null; G.tab = "photos";
      await gLoad(); if (win.isConnected) gRender(win);
      const file = win.querySelector("[data-g-file]");
      file.addEventListener("change", async () => {
        const fs = [...file.files]; if (!fs.length) return;
        for (const f of fs) { try { await FilesDB.put({ id: uid(), name: f.name, type: f.type, size: f.size, added: Date.now(), blob: f, source: "imported" }); } catch (_) {} }
        file.value = ""; await gLoad(); gRender(win); toast(win, `Imported ${fs.length} item${fs.length > 1 ? "s" : ""}`);
      });
      win.addEventListener("click", (e) => {
        if (e.target.closest("[data-g-import]")) { file.click(); return; }
        if (e.target.closest("[data-g-cam]")) { window.openApp("camera"); return; }
        const v = e.target.closest("[data-g-view]"); if (v) { gViewer(win, Number(v.dataset.gView)); return; }
        const a = e.target.closest("[data-g-album]"); if (a) { G.album = a.dataset.gAlbum; win.querySelector(".nx-tabs").hidden = true; gRender(win); }
      });
    },
    onTab(win, key) { G.tab = key; G.album = null; gRender(win); },
    onBack(win) {
      const v = win.querySelector(".nx-gv"); if (v) { v.remove(); gRender(win); return true; }
      if (G.album) { G.album = null; win.querySelector(".nx-tabs").hidden = false; gRender(win); return true; }
      return false;
    }
  });

  /* ================================================================== *
   * THEMES — wallpaper, accent colour, light/dark and icon shape
   * ================================================================== */
  const WALLS = [
    ["nexus", "Nexus Blue", "radial-gradient(ellipse at 50% -18%,#123c77 0,transparent 54%),linear-gradient(180deg,#06152d,#030b19 75%)"],
    ["aurora", "Aurora", "radial-gradient(ellipse at 20% 0%,#0f766e 0,transparent 50%),radial-gradient(ellipse at 90% 30%,#4c1d95 0,transparent 45%),#030b19"],
    ["sunset", "Sunset", "radial-gradient(ellipse at 50% -10%,#be185d 0,transparent 50%),radial-gradient(ellipse at 100% 40%,#c2410c 0,transparent 40%),#160a1f"],
    ["galaxy", "Galaxy", "radial-gradient(ellipse at 70% 10%,#6d28d9 0,transparent 45%),radial-gradient(ellipse at 10% 60%,#1d4ed8 0,transparent 40%),#07051a"],
    ["ocean", "Ocean", "linear-gradient(170deg,#0c4a6e 0%,#075985 30%,#04203a 80%)"],
    ["forest", "Forest", "radial-gradient(ellipse at 30% 0%,#166534 0,transparent 55%),linear-gradient(180deg,#052e16,#020c06)"],
    ["midnight", "Midnight", "linear-gradient(180deg,#000,#0b0f19)"],
    ["rose", "Rose Gold", "radial-gradient(ellipse at 50% 0%,#9f1239 0,transparent 55%),linear-gradient(180deg,#2a0b16,#12060b)"]
  ];
  const SHAPES = [["rounded", "Rounded", "15px"], ["circle", "Circle", "50%"], ["squircle", "Squircle", "24px"], ["square", "Square", "6px"]];
  const ACC = ["#1e88ff", "#7c5cff", "#14b8a6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#0ea5e9", "#a855f7", "#f97316"];
  const theme = () => store.get("nexus-theme", { wall: "nexus", shape: "rounded" });
  function applyTheme() {
    const t = theme();
    const w = t.wall === "custom" && t.img ? `center / cover no-repeat url("${t.img}"), #000` : (WALLS.find((x) => x[0] === t.wall) || WALLS[0])[2];
    if (t.wall && t.wall !== "nexus") document.body.style.setProperty("background", w, "important"); else document.body.style.removeProperty("background");
    if (t.wall === "custom") document.body.style.setProperty("background-attachment", "fixed"); else document.body.style.removeProperty("background-attachment");
    let st = document.getElementById("nx-theme-style"); if (!st) { st = document.createElement("style"); st.id = "nx-theme-style"; document.head.append(st); }
    const r = (SHAPES.find((s) => s[0] === t.shape) || SHAPES[0])[2];
    st.textContent = `.app-icon,.quick-grid b,.recent-apps b,.dock button{border-radius:${r} !important}`;
  }
  applyTheme();
  const setAccent = (c) => { store.set("nexus-accent", c); document.documentElement.style.setProperty("--nx-user-accent", c); document.documentElement.style.setProperty("--accent", c); try { window.saveNexusAppearance?.(); } catch (_) {} };
  N.theme = {
    walls: WALLS.map((w) => [w[0], w[1]]), accents: ACC, shapes: SHAPES.map((x) => x[0]),
    setWall(k) { const t = theme(); t.wall = k; store.set("nexus-theme", t); applyTheme(); },
    setShape(k) { const t = theme(); t.shape = k; store.set("nexus-theme", t); applyTheme(); },
    setAccent: (c) => setAccent(c), current: theme,
    setMode(light) { document.body.classList.toggle("light-mode", light); try { window.saveNexusAppearance?.(); } catch (_) {} }
  };
  function thPreview() {
    const t = theme(); const w = t.wall === "custom" && t.img ? `center / cover url("${t.img}")` : (WALLS.find((x) => x[0] === t.wall) || WALLS[0])[2];
    const r = (SHAPES.find((s) => s[0] === t.shape) || SHAPES[0])[2];
    return `<div class="nx-th-preview" style="background:${w}"><div class="nx-th-clock">${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div><div class="nx-th-icons">${["#ef4444", "#1e88ff", "#f59e0b", "#22c55e", "#ec4899", "#7c5cff", "#14b8a6", "#64748b"].map((c) => `<i style="background:${c};border-radius:${r}"></i>`).join("")}</div><div class="nx-th-dock" style="--a:var(--nx-accent)"></div></div>`;
  }
  function thRender(win, tab) {
    const t = theme(); const box = win.querySelector("[data-th-main]");
    win.querySelector("[data-th-prev]").innerHTML = thPreview();
    if (tab === "walls") box.innerHTML = `<div class="nx-th-walls">${WALLS.map(([k, n, g]) => `<button type="button" class="nx-th-wall${t.wall === k ? " is-active" : ""}" data-th-wall="${k}"><span style="background:${g}"></span><b>${n}</b></button>`).join("")}<button type="button" class="nx-th-wall${t.wall === "custom" ? " is-active" : ""}" data-th-upload><span class="nx-th-up" ${t.img ? `style="background:center/cover url('${t.img}')"` : ""}>${t.img ? "" : ic("upload")}</span><b>Your photo</b></button></div><input type="file" accept="image/*" hidden data-th-file>`;
    else if (tab === "colors") {
      const cur = store.get("nexus-accent", ACC[0]); const light = document.body.classList.contains("light-mode");
      box.innerHTML = `<div class="nx-section-title">Accent colour</div><div class="nx-th-swatches">${ACC.map((c) => `<button type="button" class="${c === cur ? "is-active" : ""}" data-th-acc="${c}" style="background:${c}" aria-label="Accent ${c}">${c === cur ? ic("check", "sm") : ""}</button>`).join("")}<label class="nx-th-custom" aria-label="Custom colour"><input type="color" value="${esc(cur)}" data-th-pick>${ic("palette", "sm")}</label></div>
        <div class="nx-section-title">Home screen mode</div><div class="nx-seg"><button type="button" class="${light ? "" : "is-active"}" data-th-mode="dark">${ic("moon", "sm")} Dark</button><button type="button" class="${light ? "is-active" : ""}" data-th-mode="light">${ic("sun", "sm")} Light</button></div><p class="nx-note">Apps keep the Nexus dark design so they stay easy to read.</p>`;
    } else box.innerHTML = `<div class="nx-section-title">App icon shape</div><div class="nx-th-shapes">${SHAPES.map(([k, n, r]) => `<button type="button" class="nx-card${t.shape === k ? " is-active" : ""}" data-th-shape="${k}"><i style="border-radius:${r}"></i><span>${n}</span></button>`).join("")}</div>
      <button type="button" class="nx-btn ghost block" data-th-reset style="margin-top:18px">${ic("refresh", "sm")} Reset to Nexus default</button>`;
  }
  N.register("themes", {
    title: "Themes",
    tabs: [{ key: "walls", label: "Wallpapers" }, { key: "colors", label: "Colors" }, { key: "icons", label: "Icons" }],
    html: () => `<div data-th-prev></div><div data-th-main></div>`,
    init(win) {
      let tab = "walls"; thRender(win, tab); this._tab = (k) => { tab = k; thRender(win, k); };
      const save = (patch) => { store.set("nexus-theme", { ...theme(), ...patch }); applyTheme(); thRender(win, tab); };
      win.addEventListener("change", (e) => {
        if (e.target.matches("[data-th-pick]")) { setAccent(e.target.value); thRender(win, tab); }
        if (e.target.matches("[data-th-file]")) {
          const f = e.target.files[0]; if (!f) return; const img = new Image(); const u = URL.createObjectURL(f);
          img.onload = () => { const s = Math.min(1, 1280 / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); try { save({ wall: "custom", img: c.toDataURL("image/jpeg", 0.82) }); toast(win, "Wallpaper set"); } catch (_) { toast(win, "That photo is too big — try another"); } };
          img.src = u;
        }
      });
      win.addEventListener("click", (e) => {
        const g = (s) => e.target.closest(s);
        if (g("[data-th-wall]")) { save({ wall: g("[data-th-wall]").dataset.thWall }); toast(win, "Wallpaper applied"); return; }
        if (g("[data-th-upload]")) { const t = theme(); if (t.img && t.wall !== "custom") { save({ wall: "custom" }); return; } win.querySelector("[data-th-file]").click(); return; }
        if (g("[data-th-acc]")) { setAccent(g("[data-th-acc]").dataset.thAcc); thRender(win, tab); return; }
        if (g("[data-th-mode]")) { const light = g("[data-th-mode]").dataset.thMode === "light"; document.body.classList.toggle("light-mode", light); try { window.saveNexusAppearance?.(); } catch (_) {} thRender(win, tab); return; }
        if (g("[data-th-shape]")) { save({ shape: g("[data-th-shape]").dataset.thShape }); return; }
        if (g("[data-th-reset]")) { store.set("nexus-theme", { wall: "nexus", shape: "rounded" }); setAccent(ACC[0]); document.body.classList.remove("light-mode"); try { window.saveNexusAppearance?.(); } catch (_) {} applyTheme(); thRender(win, tab); toast(win, "Back to the Nexus default look"); }
      });
    },
    onTab(win, key) { this._tab?.(key); }
  });
})();
