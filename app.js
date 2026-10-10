const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function updateClock() {
  const now = new Date();
  $("#clock").textContent = now.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  $("#date").textContent = now.toLocaleDateString([], {weekday:"long", month:"long", day:"numeric"});
  const hour = now.getHours();
  $("#greeting").textContent = hour < 12 ? "Good morning ☀️" : hour < 18 ? "Good afternoon 👋" : "Good evening 🌙";
}
updateClock();
setInterval(updateClock, 30000);

const appInfo = {
  browser: {title:"Web Browser", body:'<div class="browser-toolbar"><button class="browser-nav" data-action="browser-back" aria-label="Back">‹</button><button class="browser-nav" data-action="browser-forward" aria-label="Forward">›</button><form id="browser-form" class="browser-address"><input id="browser-url" type="text" placeholder="Search or enter website address" autocomplete="url" required><button type="submit">Go</button></form></div><div class="browser-home"><h3>Browse the web</h3><p>Search the web or open a website in your default browser.</p><div class="browser-shortcuts"><button data-web-url="https://www.google.com/">Google</button><button data-web-url="https://www.youtube.com/">YouTube</button><button data-web-url="https://en.wikipedia.org/">Wikipedia</button><button data-web-url="https://github.com/">GitHub</button></div><p class="hint">Websites may block being shown inside another app. Nexus OS opens them in your browser for full compatibility.</p></div>'},
  files: {title:"File Manager", body:'<p>Choose files to view their names. Your phone will ask you which files to share with Nexus OS.</p><input id="files-picker" type="file" multiple><div id="files-list" class="file-list"><p class="hint">No files selected.</p></div><p class="hint">For safety, this app only sees files you choose.</p>'},
  terminal: {title:"Terminal", body:'<p>A safe demo terminal. It does not execute system commands.</p><div class="terminal-box">Nexus OS [Prototype]\nType help to see demo commands.</div><input id="terminal-input" placeholder="Type help"><button class="window-action" data-action="terminal-run">Run demo command</button><div id="terminal-output" role="status"></div>'},
  calculator: {title:"Calculator", body:'<div class="calculator"><input id="calc-input" class="calculator-display" inputmode="none" autocomplete="off" aria-label="Calculator display" placeholder="0" readonly><div class="calculator-keys" aria-label="Calculator keypad"><button class="utility" data-calc-key="AC">AC</button><button class="utility" data-calc-key="(">(</button><button class="utility" data-calc-key=")">)</button><button class="operator" data-calc-key="÷">÷</button><button data-calc-key="7">7</button><button data-calc-key="8">8</button><button data-calc-key="9">9</button><button class="operator" data-calc-key="×">×</button><button data-calc-key="4">4</button><button data-calc-key="5">5</button><button data-calc-key="6">6</button><button class="operator" data-calc-key="-">−</button><button data-calc-key="1">1</button><button data-calc-key="2">2</button><button data-calc-key="3">3</button><button class="operator" data-calc-key="+">+</button><button class="utility" data-calc-key="±">±</button><button data-calc-key="0">0</button><button data-calc-key=".">.</button><button class="equals" data-calc-key="=">=</button><button class="utility" data-calc-key="DEL" style="grid-column:span 4">⌫ Delete</button></div><p id="calc-output" class="calculator-result" role="status">Ready</p></div>'},
  weather: {title:"Live Weather", body:'<p>Current conditions and today’s forecast for a city.</p><form id="weather-form" class="inline-form"><input id="weather-city" placeholder="Enter city (e.g. Chennai)" value="Chennai" required><button class="window-action" type="submit">Get weather</button></form><div id="weather-result" class="weather-result"><p>Search a city to load weather. Internet required.</p></div><p class="attribution">Weather data: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a></p>'},
  calendar: {title:"Day Planner", body:'<p>Add a task for your prototype dashboard.</p><input id="task-input" placeholder="e.g. Study Python for 20 minutes"><button class="window-action" data-action="save-task">Save task</button><p id="task-output" role="status"></p>'},
  gallery: {title:"Gallery", body:'<p>Select photos to preview them here.</p><input id="gallery-input" type="file" accept="image/*" multiple><div id="gallery-preview" class="gallery-preview"></div>'},
  settings: {title:"Settings", body:'<p>Personalise your prototype.</p><button class="window-action" data-action="toggle-theme">Toggle light / dark mode</button><p>Screen and camera permissions are not enabled in this prototype.</p>'},
  music: {title:"Online Music", body:'<div class="music-card"><div class="album-art">♫</div><h3>Listen on the internet</h3><p>Search music online and play it through a music service.</p><form id="music-search-form" class="inline-form"><input id="music-search-query" placeholder="Song, artist or genre" required><button class="window-action" type="submit">Search</button></form><div class="online-music-links"><button data-music-service="youtube">YouTube Music</button><button data-music-service="soundcloud">SoundCloud</button><button data-music-service="spotify">Spotify</button></div><p class="hint">Online services open in your browser. Playback, sign-in and availability depend on each service. Nexus OS does not host or download music.</p><details><summary>Play an audio URL</summary><p>Use a direct audio stream URL you have permission to play.</p><input id="online-audio-url" type="url" placeholder="https://example.com/audio.mp3"><button class="window-action" data-action="play-online-audio">Play stream</button><audio id="audio-player" controls preload="none"></audio></details></div>'},
  messages: {title:"Message Drafts", body:'<p>Write and save a message draft. This does not send SMS or access your phone messages.</p><textarea id="message-draft" placeholder="Write your draft…"></textarea><button class="window-action" data-action="save-message">Save draft</button><button class="window-action secondary-action" data-action="load-message">Load draft</button><p id="message-status" role="status"></p>'},
  store: {title:"Nexus Mini Apps", body:'<p>Launch the tools included in this prototype.</p><div class="file-list"><div>🧮 Calculator <button data-launch="calculator">Open</button></div><div>📝 Notes <button data-launch="notes">Open</button></div><div>⏱️ Timer <button data-launch="timer">Open</button></div><div>🎨 Paint <button data-launch="paint">Open</button></div><div>🌦️ Weather <button data-launch="weather">Open</button></div><div>🎵 Music <button data-launch="music">Open</button></div></div>'},
  call: {title:"Phone Dialer Demo", body:'<p>This is a dialer interface only. It cannot place phone calls from the website.</p><input id="dial-display" aria-label="Phone number" placeholder="Enter number" readonly><div class="dial-pad"><button data-dial="1">1</button><button data-dial="2">2</button><button data-dial="3">3</button><button data-dial="4">4</button><button data-dial="5">5</button><button data-dial="6">6</button><button data-dial="7">7</button><button data-dial="8">8</button><button data-dial="9">9</button><button data-dial="*">*</button><button data-dial="0">0</button><button data-dial="#">#</button></div><button class="window-action secondary-action" data-action="dial-clear">Clear</button><p id="dial-status" class="hint">Demo only — no calls are made.</p>'},
  security: {title:"Security Center", body:'<div class="feature-card"><span class="big-emoji">🛡️</span><h3>Nexus safety check</h3><p>Review basic browser-app settings.</p></div><button class="window-action" data-action="security-scan">Run safety check</button><div id="security-results" class="file-list"></div><p class="hint">This checks only the Nexus OS demo, not your whole phone.</p>'},
  cleaner: {title:"Storage Cleaner", body:'<div class="feature-card"><span class="big-emoji">🧹</span><h3>Browser session helper</h3><p>Clear temporary previews and reset this app window. Your saved notes and tasks will be kept.</p></div><button class="window-action" data-action="clean-session">Clear temporary previews</button><p id="cleaner-status" role="status"></p>'},
  games: {title:"Mini Match", body:'<p>Find matching pairs. Tap two cards to reveal them.</p><div id="match-game" class="match-game"><button data-match="🌟">?</button><button data-match="🚀">?</button><button data-match="🌈">?</button><button data-match="🎧">?</button><button data-match="🎧">?</button><button data-match="🌈">?</button><button data-match="🚀">?</button><button data-match="🌟">?</button></div><button class="window-action secondary-action" data-action="reset-game">Restart game</button><p id="game-status" class="hint">Match all four pairs.</p>'},
  notes: {title:"Notes", body:'<p>Notes are saved on this browser.</p><input id="note-title" placeholder="Note title"><textarea id="note-content" placeholder="Start writing…"></textarea><button class="window-action" data-action="save-note">Save note</button><button class="window-action secondary-action" data-action="load-note">Load saved note</button><p id="note-status" role="status"></p>'},
  camera: {title:"Camera", body:'<p>Allow camera access when your browser asks. Camera access requires HTTPS and permission.</p><div class="camera-actions"><button class="window-action" data-action="start-camera">Start camera</button><button class="window-action secondary-action" data-action="stop-camera">Stop</button><button class="window-action" data-action="capture-photo">Take photo</button></div><video id="camera-video" class="camera-video" autoplay playsinline muted></video><canvas id="camera-snapshot" hidden></canvas><div id="camera-preview" class="camera-preview">Camera preview will appear here.</div><p id="camera-status" class="hint" role="status">Tap Start camera and allow permission.</p><details><summary>Choose an existing photo instead</summary><input id="camera-input" type="file" accept="image/*" capture="environment"></details>'},
  timer: {title:"Focus Timer", body:'<div class="timer-face" id="timer-display">05:00</div><label>Minutes <input id="timer-minutes" type="number" min="1" max="180" value="5"></label><button class="window-action" data-action="start-timer">▶ Start</button><button class="window-action secondary-action" data-action="stop-timer">Reset</button><p id="timer-status" role="status">Ready when you are.</p>'},
  paint: {title:"Paint", body:'<div class="paint-ribbon"><div class="paint-tools"><label>Tool <select id="paint-tool"><option value="pen">Pencil</option><option value="marker">Marker</option><option value="eraser">Eraser</option></select></label><label>Color <input id="paint-color" type="color" value="#202020"></label><label>Size <input id="paint-size" type="range" min="1" max="48" value="5"></label><output id="paint-size-value">5 px</output><button class="window-action secondary-action" data-action="undo-paint">Undo</button><button class="window-action secondary-action" data-action="clear-paint">Clear</button><button class="window-action" data-action="save-paint">Save image</button></div><div class="paint-swatches"><button data-paint-color="#202020" style="--swatch:#202020" aria-label="Black"></button><button data-paint-color="#ffffff" style="--swatch:#ffffff" aria-label="White"></button><button data-paint-color="#e5484d" style="--swatch:#e5484d" aria-label="Red"></button><button data-paint-color="#2f9e44" style="--swatch:#2f9e44" aria-label="Green"></button><button data-paint-color="#1c7ed6" style="--swatch:#1c7ed6" aria-label="Blue"></button><button data-paint-color="#f08c00" style="--swatch:#f08c00" aria-label="Orange"></button><button data-paint-color="#7950f2" style="--swatch:#7950f2" aria-label="Purple"></button></div></div><canvas id="paint-canvas" width="1200" height="720"></canvas><p class="hint">Paint with touch or mouse, then save your drawing as a PNG.</p>'},
  tasks: {title:"Tasks", body:'<p>Manage a checklist saved in this browser.</p><form id="quick-task-form" class="inline-form"><input id="quick-task-input" placeholder="Add a task…" required><button class="window-action" type="submit">Add</button></form><div id="quick-task-list" class="task-list"></div>'},
  youtube: {title:"YouTube", body:'<div class="youtube-launch"><div class="youtube-mark">▶</div><h3>YouTube</h3><p>Watch videos, search channels and open your subscriptions on YouTube.</p><button class="window-action" data-action="open-youtube">Open YouTube ↗</button><button class="window-action secondary-action" data-action="open-youtube-music">Open YouTube Music ↗</button><p class="hint">YouTube may not allow its full website to be embedded inside Nexus OS, so it opens in your browser.</p></div>'},
  recorder: {title:"Voice Recorder", body:'<p>Record audio after granting microphone permission.</p><button class="window-action" data-action="start-recording">Start recording</button><button class="window-action secondary-action" data-action="stop-recording">Stop recording</button><audio id="recording-playback" controls></audio><p id="recorder-status" class="hint">Recording stays in this browser session.</p>'},
  ai: {title:"Nexus AI Companion", body:'<p>Hi! I’m the Nexus AI character 🤖</p><p>This is a UI prototype, so I am not connected to an AI model yet.</p><textarea id="ai-prompt" placeholder="What would you like help with?"></textarea><button class="window-action" data-action="ai-demo">Ask Nexus AI</button><p id="ai-output" role="status"></p>'}
};

function closeWindow() { $("#app-layer").replaceChildren(); }
function openApp(name) {
  const app = appInfo[name];
  if (!app) return;
  const layer = $("#app-layer");
  const win = document.createElement("section");
  win.className = "app-window";
  win.setAttribute("role", "dialog");
  win.setAttribute("aria-modal", "true");
  win.setAttribute("aria-label", app.title);
  const head = document.createElement("header");
  head.className = "window-head";
  const title = document.createElement("h2");
  title.textContent = app.title;
  const close = document.createElement("button");
  close.className = "close-window";
  close.type = "button";
  close.setAttribute("aria-label", "Close app");
  close.textContent = "×";
  close.addEventListener("click", closeWindow);
  head.append(title, close);
  const body = document.createElement("div");
  body.className = "window-body";
  body.innerHTML = app.body;
  win.append(head, body);
  layer.replaceChildren(win);
  close.focus();
  if (name === "paint") initPaint();
  if (name === "tasks" || name === "calendar") {
    renderSavedTasks($("#quick-task-list"));
    renderSavedTasks($("#task-list"));
  }
}
$$("[data-app]").forEach(button => button.addEventListener("click", () => openApp(button.dataset.app)));

$("#ai-companion").addEventListener("click", () => openApp("ai"));
function openExternal(url) {
  if (!/^https:\/\//i.test(url)) return;
  window.open(url, "_blank", "noopener,noreferrer");
}
document.addEventListener("click", function(event) {
  const nav = event.target.closest("[data-system-nav]");
  if (nav) {
    const action = nav.dataset.systemNav;
    if (action === "home") { closeWindow(); $("#control-center").hidden = true; window.scrollTo({top:0,behavior:"smooth"}); }
    if (action === "back") { if (!$("#app-layer").innerHTML.trim()) $("#control-center").hidden = true; else closeWindow(); }
    if (action === "recent") { const names = [...document.querySelectorAll(".app-grid .app")].map(b=>b.querySelector("span:last-child")?.textContent).filter(Boolean); alert("Nexus OS apps: " + names.join(", ")); }
    return;
  }
  const webShortcut=event.target.closest("[data-web-url]");
  if(webShortcut){openExternal(webShortcut.dataset.webUrl);return;}
  const service=event.target.closest("[data-music-service]");
  if(service){
    const q=encodeURIComponent($("#music-search-query")?.value.trim() || "");
    const urls={youtube:"https://music.youtube.com/search?q="+q,soundcloud:"https://soundcloud.com/search?q="+q,spotify:"https://open.spotify.com/search/"+q};
    openExternal(urls[service.dataset.musicService]);return;
  }
  const paintColor=event.target.closest("[data-paint-color]");
  if(paintColor && $("#paint-color")){$("#paint-color").value=paintColor.dataset.paintColor;return;}
});
document.addEventListener("submit", function(event) {
  if(event.target.id==="browser-form"){
    event.preventDefault();
    let value=$("#browser-url").value.trim();
    if(!/^https?:\/\//i.test(value)){
      value=value.includes(".") && !value.includes(" ") ? "https://"+value : "https://www.google.com/search?q="+encodeURIComponent(value);
    }
    openExternal(value);
  }
  if(event.target.id==="music-search-form"){
    event.preventDefault();
    const q=encodeURIComponent($("#music-search-query").value.trim());
    openExternal("https://music.youtube.com/search?q="+q);
  }
});
let ccTouchStartY=0;
document.addEventListener("touchstart",e=>{if(e.touches.length===1)ccTouchStartY=e.touches[0].clientY},{passive:true});
document.addEventListener("touchend",e=>{
 const endY=e.changedTouches[0]?.clientY ?? 0;
 if(ccTouchStartY<45 && endY-ccTouchStartY>70){$("#control-center").hidden=false;$("#control-date").textContent=new Date().toLocaleString([], {weekday:"long",month:"short",day:"numeric"});}
 if(!$("#control-center").hidden && ccTouchStartY-endY>70) $("#control-center").hidden=true;
},{passive:true});
$("#control-center-open")?.addEventListener("click",()=>{$("#control-center").hidden=false;$("#control-date").textContent=new Date().toLocaleString([], {weekday:"long",month:"short",day:"numeric"});});
$("#control-center-close")?.addEventListener("click",()=>$("#control-center").hidden=true);
$("#control-center")?.addEventListener("click",e=>{
 const tile=e.target.closest("[data-control]");
 if(!tile)return;
 const type=tile.dataset.control;
 if(type==="music"){ $("#control-center").hidden=true;openApp("music");return;}
 if(type==="theme"){document.body.classList.toggle("light-mode");$("#theme-state").textContent=document.body.classList.contains("light-mode")?"Light mode":"Dark mode";return;}
 tile.classList.toggle("active");
 const state=$("#"+type+"-state"); if(state) state.textContent=(tile.classList.contains("active")?"On":"Off")+" · simulated";
});
$("#brightness-slider")?.addEventListener("input",e=>{const value=Number(e.target.value);$("#brightness-value").textContent=value+"%";document.documentElement.style.filter="brightness("+Math.min(1.1,value/100)+")";});


$("#global-search").addEventListener("input", event => {
  const query = event.target.value.trim().toLowerCase();
  let visible = 0;
  $$(".app-grid .app").forEach(button => {
    const matches = button.textContent.toLowerCase().includes(query);
    button.hidden = !matches;
    if (matches) visible++;
  });
  let empty = $(".empty-search");
  if (!visible && !empty) {
    empty = document.createElement("p");
    empty.className = "empty-search";
    empty.textContent = "No matching apps. Try another search.";
    $(".app-grid").append(empty);
  } else if (visible && empty) empty.remove();
});


function escapeText(value) {
  return String(value).replace(/[&<>"']/g, function (c) { return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]); });
}
function getSavedTasks() {
  try { return JSON.parse(localStorage.getItem("nexus-tasks") || "[]"); } catch (_) { return []; }
}
function renderSavedTasks(target) {
  if (!target) return;
  const tasks = getSavedTasks();
  target.innerHTML = tasks.length ? tasks.map(function (task, i) {
    return '<label class="task-item"><input type="checkbox" data-task-index="' + i + '" ' + (task.done ? "checked" : "") + '><span class="' + (task.done ? "done" : "") + '">' + escapeText(task.text) + '</span><button type="button" data-delete-task="' + i + '" aria-label="Delete task">×</button></label>';
  }).join("") : '<p class="hint">No tasks yet. Add one above.</p>';
}
function addSavedTask(value) {
  const task = value.trim();
  if (!task) return;
  const tasks = getSavedTasks();
  tasks.push({text:task, done:false});
  localStorage.setItem("nexus-tasks", JSON.stringify(tasks));
  renderSavedTasks($("#task-list"));
  renderSavedTasks($("#quick-task-list"));
  const next = tasks.find(function (item) { return !item.done; });
  $("#next-task").textContent = next ? next.text : "All tasks complete";
}
function previewImage(file, target) {
  if (!file || !file.type.startsWith("image/") || !target) return;
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.alt = file.name;
  img.className = "preview-image";
  target.replaceChildren(img);
}
function initPaint() {
  const canvas = $("#paint-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  let drawing = false;
  const history = [];
  window.nexusPaintHistory = history;
  function saveState(){history.push(ctx.getImageData(0,0,canvas.width,canvas.height));if(history.length>20)history.shift();}
  saveState();
  function point(e) {
    const rect = canvas.getBoundingClientRect();
    return {x:(e.clientX-rect.left)*canvas.width/rect.width, y:(e.clientY-rect.top)*canvas.height/rect.height};
  }
  canvas.onpointerdown = function (e) { drawing = true; canvas.setPointerCapture(e.pointerId); saveState(); const p=point(e);  ctx.beginPath(); ctx.moveTo(p.x,p.y); };
  canvas.onpointermove = function (e) { if (!drawing) return; const p=point(e); const tool=$("#paint-tool")?.value || "pen";ctx.globalCompositeOperation=tool==="eraser"?"destination-out":"source-over";ctx.strokeStyle=$("#paint-color").value;ctx.globalAlpha = tool === "marker" ? 0.35 : 1;ctx.lineWidth=Number($("#paint-size").value);ctx.lineTo(p.x,p.y);ctx.stroke();lastPoint=p; };
  canvas.onpointerup = canvas.onpointercancel = function () { drawing = false;ctx.globalAlpha=1;ctx.globalCompositeOperation="source-over"; };
}

$("#app-layer").addEventListener("click", event => {
  const calcKey = event.target.closest("[data-calc-key]");
  if (calcKey) {
    const display = $("#calc-input");
    const output = $("#calc-output");
    const key = calcKey.dataset.calcKey;
    if (key === "AC") { display.value = ""; output.textContent = "Cleared"; }
    else if (key === "DEL") { display.value = display.value.slice(0, -1); output.textContent = "Ready"; }
    else if (key === "±") {
      const current = display.value;
      if (current && /^-?[0-9]*\.?[0-9]+$/.test(current)) display.value = current.startsWith("-") ? current.slice(1) : "-" + current;
      else if (current) display.value = current + "(-1)";
    }
    else if (key === "=") {
      let expression = display.value.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
      if (!expression || !/^[0-9\s()+\-*\/.%]+$/.test(expression)) output.textContent = "Enter a valid calculation.";
      else {
        try {
          const result = Function('"use strict"; return (' + expression + ')')();
          if (Number.isFinite(result)) { display.value = String(Number(result.toPrecision(12))); output.textContent = "= " + display.value; }
          else output.textContent = "Cannot divide by zero.";
        } catch { output.textContent = "Check your expression."; }
      }
    } else { display.value += key; output.textContent = "Ready"; }
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;



  if (action === "dial-clear") { $("#dial-display").value = ""; $("#dial-status").textContent = "Demo only — no calls are made."; }
  if (action === "security-scan") {
    $("#security-results").innerHTML = '<div>✓ App runs in your browser <span>OK</span></div><div>✓ Saved notes stay in this browser <span>Local</span></div><div>✓ No phone-call permission used <span>OK</span></div><div>ℹ️ Device-wide antivirus scan <span>Not available to a website</span></div>';
  }
  if (action === "clean-session") {
    $(".preview-image").forEach(function (img) { img.remove(); });
    const audio = $("#audio-player"); if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); }
    $("#cleaner-status").textContent = "Temporary previews cleared. Saved notes and tasks were kept.";
  }
  if (action === "reset-game") {
    const game = $("#match-game");
    if (game) { game.dataset.open = ""; game.dataset.matched = ""; $("button", game).forEach(function (card) { card.textContent = "?"; card.disabled = false; }); }
    if ($("#game-status")) $("#game-status").textContent = "Match all four pairs.";
  }

  if (action === "save-message") {
    localStorage.setItem("nexus-message-draft", $("#message-draft").value);
    $("#message-status").textContent = "Draft saved on this browser.";
  }
  if (action === "load-message") {
    $("#message-draft").value = localStorage.getItem("nexus-message-draft") || "";
    $("#message-status").textContent = "Draft loaded.";
  }
  if (action === "save-note") {
    localStorage.setItem("nexus-note-title", $("#note-title").value);
    localStorage.setItem("nexus-note-content", $("#note-content").value);
    $("#note-status").textContent = "Note saved on this browser ✓";
  }
  if (action === "load-note") {
    $("#note-title").value = localStorage.getItem("nexus-note-title") || "";
    $("#note-content").value = localStorage.getItem("nexus-note-content") || "";
    $("#note-status").textContent = "Saved note loaded.";
  }

  if (action === "open-url") { const v=$("#browser-url").value.trim(); if(v) openExternal(/^https?:/i.test(v)?v:"https://"+v); }
  if (action === "open-youtube") openExternal("https://www.youtube.com/");
  if (action === "open-youtube-music") openExternal("https://music.youtube.com/");
  if (action === "play-online-audio") { const url=$("#online-audio-url").value.trim(); const audio=$("#audio-player"); if(/^https:\/\//i.test(url)&&audio){audio.src=url;audio.play().catch(()=>{});} }
  if (action === "start-camera") {
    const video=$("#camera-video"), status=$("#camera-status");
    if(!navigator.mediaDevices?.getUserMedia){status.textContent="Camera API is unavailable. Open Nexus OS in an up-to-date browser over HTTPS."; }
    else navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false}).then(stream=>{window.nexusCameraStream=stream;video.srcObject=stream;video.hidden=false;status.textContent="Camera is on. Tap Take photo to capture.";}).catch(err=>{status.textContent="Camera could not start: "+(err.name==="NotAllowedError"?"permission denied":err.message||"check camera permission");});
  }
  if (action === "stop-camera") { if(window.nexusCameraStream) window.nexusCameraStream.getTracks().forEach(t=>t.stop());window.nexusCameraStream=null;if($("#camera-video"))$("#camera-video").srcObject=null;if($("#camera-status"))$("#camera-status").textContent="Camera stopped."; }
  if (action === "capture-photo") { const video=$("#camera-video"), canvas=$("#camera-snapshot"), preview=$("#camera-preview");if(video?.videoWidth&&canvas){canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext("2d").drawImage(video,0,0);const img=document.createElement("img");img.src=canvas.toDataURL("image/png");img.alt="Captured photo";img.className="preview-image";preview.replaceChildren(img);$("#camera-status").textContent="Photo captured. Long-press the preview to save it if your browser supports that."; }else if($("#camera-status"))$("#camera-status").textContent="Start the camera first and allow permission."; }
  if (action === "start-recording") { navigator.mediaDevices?.getUserMedia({audio:true}).then(stream=>{const rec=new MediaRecorder(stream);const chunks=[];rec.ondataavailable=e=>chunks.push(e.data);rec.onstop=()=>{const audio=$("#recording-playback");audio.src=URL.createObjectURL(new Blob(chunks,{type:rec.mimeType||"audio/webm"}));stream.getTracks().forEach(t=>t.stop());};window.nexusRecorder=rec;rec.start();$("#recorder-status").textContent="Recording…";}).catch(()=>$("#recorder-status").textContent="Microphone permission was denied or recording is unavailable.");}
  if (action === "stop-recording") { if(window.nexusRecorder?.state==="recording"){window.nexusRecorder.stop();$("#recorder-status").textContent="Recording ready to play."; } }
  if (action === "undo-paint") { const canvas=$("#paint-canvas"), history=window.nexusPaintHistory; if(canvas && history && history.length>1){history.pop();canvas.getContext("2d").putImageData(history[history.length-1],0,0);} }
  if (action === "play-audio") {
    const audio = $("#audio-player");
    if (audio && audio.src) audio.play().catch(function () {});
    else if ($("#track-subtitle")) $("#track-subtitle").textContent = "Choose an audio file first.";
  }
  if (action === "pause-audio") { const audio = $("#audio-player"); if (audio) audio.pause(); }
  if (action === "start-timer") {
    if (window.nexusTimer) clearInterval(window.nexusTimer);
    let remaining = Math.max(1, Math.min(180, Number($("#timer-minutes").value) || 5)) * 60;
    const draw = function () { $("#timer-display").textContent = String(Math.floor(remaining/60)).padStart(2,"0") + ":" + String(remaining%60).padStart(2,"0"); };
    draw(); $("#timer-status").textContent = "Timer running…";
    window.nexusTimer = setInterval(function () {
      remaining--; draw();
      if (remaining <= 0) { clearInterval(window.nexusTimer); window.nexusTimer = null; $("#timer-status").textContent = "Time is up! ⏰"; }
    }, 1000);
  }
  if (action === "stop-timer") {
    if (window.nexusTimer) clearInterval(window.nexusTimer);
    window.nexusTimer = null; $("#timer-display").textContent = "05:00"; $("#timer-status").textContent = "Timer reset.";
  }
  if (action === "clear-paint") {
    const canvas = $("#paint-canvas"); if (canvas) canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height);
  }
  if (action === "save-paint") {
    const canvas = $("#paint-canvas"); if (canvas) { const link=document.createElement("a"); link.download="nexus-drawing.png"; link.href=canvas.toDataURL("image/png"); link.click(); }
  }
  if (action === "toggle-theme") {
    document.body.classList.toggle("light-mode");
  }

  if (action === "open-url") {
    let raw = $("#browser-url").value.trim();
    if (!raw) return;
    if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
    try {
      const url = new URL(raw);
      if (url.protocol === "https:" || url.protocol === "http:") window.open(url.href, "_blank", "noopener,noreferrer");
    } catch { alert("Please enter a valid website address."); }
  }
  if (action === "terminal-run") {
    const command = $("#terminal-input").value.trim();
    $("#terminal-output").textContent = command === "help" ? "Demo commands: help, date, clear" : command === "date" ? new Date().toString() : command === "clear" ? "" : "Demo only: try help, date or clear.";
  }
  if (action === "calculate") {
    const expression = $("#calc-input").value.trim();
    if (!/^[0-9\s()+\-*\/.%]+$/.test(expression)) { $("#calc-output").textContent = "Use numbers and basic math operators only."; return; }
    try {
      const result = Function('"use strict"; return (' + expression + ')')();
      $("#calc-output").textContent = Number.isFinite(result) ? "= " + result : "Please check that calculation.";
    } catch { $("#calc-output").textContent = "Please enter a valid calculation."; }
  }
  if (action === "save-task") {
    const task = $("#task-input").value.trim();
    if (!task) return;
    $("#next-task").textContent = task;
    $("#task-output").textContent = "Task added to this page for this session.";
  }
  if (action === "set-track") {
    const track = $("#track-input").value.trim() || "Nothing playing";
    $("#music-status").textContent = track;
    $("#track-output").textContent = "Updated the dashboard preview.";
  }
  if (action === "toggle-theme") document.body.classList.toggle("light-mode");
  if (action === "open-controls") $("#control-center").hidden = false;
  if (action === "ai-demo") {
    const prompt = $("#ai-prompt").value.trim();
    $("#ai-output").textContent = prompt ? "I’m only a UI demo so far. Next, we can connect a real AI model to answer: “" + prompt + "”" : "Write a question first.";
  }
});

/* Control Center: these switches affect Nexus OS's interface only, not Android settings. */
const controlCenter = $("#control-center");
if ($("#control-center-open")) $("#control-center-open").addEventListener("click", function () { controlCenter.hidden = false; });
if ($("#control-center-close")) $("#control-center-close").addEventListener("click", function () { controlCenter.hidden = true; });
const quickState = {wifi:true, bluetooth:true, airplane:false};
$$("[data-control]").forEach(function (button) {
  button.addEventListener("click", function () {
    const type = button.dataset.control;
    if (type === "music") { controlCenter.hidden = true; openApp("music"); return; }
    if (type === "theme") {
      document.body.classList.toggle("light-mode");
      $("#theme-state").textContent = document.body.classList.contains("light-mode") ? "Light mode" : "Dark mode";
      button.classList.toggle("active", !document.body.classList.contains("light-mode"));
      return;
    }
    quickState[type] = !quickState[type];
    button.classList.toggle("active", quickState[type]);
    const text = type === "airplane" ? (quickState[type] ? "On · simulated" : "Off · simulated") : (quickState[type] ? "On · simulated" : "Off · simulated");
    $("#" + type + "-state").textContent = text;
    $("#network-status").textContent = quickState.airplane || !quickState.wifi ? "● Offline mode" : "● Online";
  });
});
$("#brightness-slider").addEventListener("input", function (event) {
  const value = Number(event.target.value);
  document.documentElement.style.setProperty("--screen-brightness", value / 100);
  $("#brightness-value").textContent = value + "%";
});
$("#app-layer").addEventListener("change", function (event) {
  if (event.target.id === "files-picker") {
    const target = $("#files-list");
    target.replaceChildren();
    Array.from(event.target.files).forEach(function (file) {
      const row = document.createElement("div");
      row.textContent = "📄 " + file.name + " · " + Math.max(1, Math.round(file.size / 1024)) + " KB";
      target.append(row);
    });
    if (!event.target.files.length) target.innerHTML = '<p class="hint">No files selected.</p>';
  }
  if (event.target.id === "camera-input" && event.target.files[0]) previewImage(event.target.files[0], $("#camera-preview"));
  if (event.target.id === "gallery-input") {
    const target = $("#gallery-preview");
    target.replaceChildren();
    Array.from(event.target.files).forEach(function (file) {
      const img = document.createElement("img"); img.src = URL.createObjectURL(file); img.alt = file.name; img.className = "preview-image"; target.append(img);
    });
  }
  if (event.target.matches("[data-task-index]")) {
    const tasks = getSavedTasks();
    const index = Number(event.target.dataset.taskIndex);
    if (tasks[index]) tasks[index].done = event.target.checked;
    localStorage.setItem("nexus-tasks", JSON.stringify(tasks));
    renderSavedTasks($("#task-list")); renderSavedTasks($("#quick-task-list"));
    const next = tasks.find(function (task) { return !task.done; });
    $("#next-task").textContent = next ? next.text : "All tasks complete";
  }
});
$("#app-layer").addEventListener("submit", function (event) {
  if (event.target.id === "weather-form") {
    event.preventDefault();
    loadWeather($("#weather-city").value.trim());
  }
  if (event.target.id === "quick-task-form") {
    event.preventDefault(); addSavedTask($("#quick-task-input").value);
    $("#quick-task-input").value = "";
  }
});
$("#app-layer").addEventListener("click", function (event) {
  const launch = event.target.closest("[data-launch]");
  if (launch) { openApp(launch.dataset.launch); return; }
  const remove = event.target.closest("[data-delete-task]");
  if (remove) {
    const tasks = getSavedTasks(); tasks.splice(Number(remove.dataset.deleteTask), 1);
    localStorage.setItem("nexus-tasks", JSON.stringify(tasks));
    renderSavedTasks($("#task-list")); renderSavedTasks($("#quick-task-list"));
  }
});
function weatherLabel(code) {
  if (code === 0) return ["☀️","Clear sky"];
  if ([1,2,3].includes(code)) return ["🌤️","Partly cloudy"];
  if ([45,48].includes(code)) return ["🌫️","Fog"];
  if ([51,53,55,56,57].includes(code)) return ["🌦️","Drizzle"];
  if ([61,63,65,66,67,80,81,82].includes(code)) return ["🌧️","Rain"];
  if ([71,73,75,77,85,86].includes(code)) return ["❄️","Snow"];
  if ([95,96,99].includes(code)) return ["⛈️","Thunderstorm"];
  return ["🌥️","Mixed conditions"];
}
async function loadWeather(city) {
  const target = $("#weather-result");
  if (!target) return;
  target.innerHTML = "<p>Checking weather…</p>";
  try {
    const geoResponse = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(city) + "&count=1&language=en&format=json");
    if (!geoResponse.ok) throw new Error("Could not search for that city.");
    const geo = await geoResponse.json();
    if (!geo.results || !geo.results.length) throw new Error("City not found. Check the spelling and try again.");
    const place = geo.results[0];
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + place.latitude + "&longitude=" + place.longitude + "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=1&timezone=auto";
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather service is temporarily unavailable.");
    const data = await response.json();
    const now = data.current; const label = weatherLabel(now.weather_code);
    target.innerHTML = '<div class="weather-hero"><span>' + label[0] + '</span><div><h3>' + escapeText(place.name) + ', ' + escapeText(place.country || "") + '</h3><p>' + label[1] + '</p></div></div><div class="weather-temp">' + Math.round(now.temperature_2m) + '°C</div><p>Feels like ' + Math.round(now.apparent_temperature) + '°C</p><div class="weather-stats"><div><small>Humidity</small><b>' + now.relative_humidity_2m + '%</b></div><div><small>Wind</small><b>' + Math.round(now.wind_speed_10m) + ' km/h</b></div><div><small>Today high</small><b>' + Math.round(data.daily.temperature_2m_max[0]) + '°C</b></div><div><small>Today low</small><b>' + Math.round(data.daily.temperature_2m_min[0]) + '°C</b></div></div><p class="hint">Rain chance today: ' + (data.daily.precipitation_probability_max[0] ?? "—") + '%</p>';
    $("#weather-summary").textContent = Math.round(now.temperature_2m) + "°C · " + label[1];
    $("#weather-detail").textContent = place.name + " · Wind " + Math.round(now.wind_speed_10m) + " km/h";
  } catch (error) {
    target.innerHTML = '<p class="error-text">' + escapeText(error.message || "Weather could not load. Check your internet connection.") + '</p>';
  }
}


$("#app-layer").addEventListener("click", function (event) {
  const dial = event.target.closest("[data-dial]");
  if (dial) { const display=$("#dial-display"); if (display) display.value += dial.dataset.dial; return; }
  const card = event.target.closest("[data-match]");
  if (card && !card.disabled) {
    const game=$("#match-game");
    const opened=(game.dataset.open || "").split(",").filter(Boolean);
    card.textContent=card.dataset.match;
    if (opened.length === 0) { game.dataset.open=String(Array.from(game.querySelectorAll("button")).indexOf(card)); return; }
    const firstIndex=Number(opened[0]);
    const cards=Array.from(game.querySelectorAll("button"));
    const first=cards[firstIndex];
    if (first === card) { game.dataset.open=""; card.textContent="?"; return; }
    if (first.dataset.match === card.dataset.match) {
      first.disabled=true; card.disabled=true;
      const matched=cards.filter(function (item) { return item.disabled; }).length;
      $("#game-status").textContent = matched === cards.length ? "You matched every pair! 🎉" : "Nice match! Keep going.";
    } else {
      const second=card;
      setTimeout(function () { if (first.isConnected && second.isConnected && !first.disabled && !second.disabled) { first.textContent="?"; second.textContent="?"; } }, 650);
    }
    game.dataset.open="";
  }
});
