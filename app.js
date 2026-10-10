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
  browser: {title:"Browser", body:'<p>This is the Browser app placeholder.</p><p>Choose a website to open in a new tab.</p><input id="browser-url" type="url" placeholder="https://example.com"><button class="window-action" data-action="open-url">Open website ↗</button>'},
  files: {title:"File Manager", body:'<p>Your future file manager will organise documents, downloads, photos and projects.</p><div class="terminal-box">📁 Documents<br>📁 Downloads<br>🖼️ Pictures<br>💻 Projects</div><p>This prototype does not read your device files.</p>'},
  terminal: {title:"Terminal", body:'<p>A safe demo terminal. It does not execute system commands.</p><div class="terminal-box">Nexus OS [Prototype]\nType help to see demo commands.</div><input id="terminal-input" placeholder="Type help"><button class="window-action" data-action="terminal-run">Run demo command</button><div id="terminal-output" role="status"></div>'},
  calculator: {title:"Calculator", body:'<div class="calculator"><input id="calc-input" class="calculator-display" inputmode="none" autocomplete="off" aria-label="Calculator display" placeholder="0" readonly><div class="calculator-keys" aria-label="Calculator keypad"><button class="utility" data-calc-key="AC">AC</button><button class="utility" data-calc-key="(">(</button><button class="utility" data-calc-key=")">)</button><button class="operator" data-calc-key="÷">÷</button><button data-calc-key="7">7</button><button data-calc-key="8">8</button><button data-calc-key="9">9</button><button class="operator" data-calc-key="×">×</button><button data-calc-key="4">4</button><button data-calc-key="5">5</button><button data-calc-key="6">6</button><button class="operator" data-calc-key="-">−</button><button data-calc-key="1">1</button><button data-calc-key="2">2</button><button data-calc-key="3">3</button><button class="operator" data-calc-key="+">+</button><button class="utility" data-calc-key="±">±</button><button data-calc-key="0">0</button><button data-calc-key=".">.</button><button class="equals" data-calc-key="=">=</button><button class="utility" data-calc-key="DEL" style="grid-column:span 4">⌫ Delete</button></div><p id="calc-output" class="calculator-result" role="status">Ready</p></div>'},
  weather: {title:"Live Weather", body:'<p>Current conditions and today’s forecast for a city.</p><form id="weather-form" class="inline-form"><input id="weather-city" placeholder="Enter city (e.g. Chennai)" value="Chennai" required><button class="window-action" type="submit">Get weather</button></form><div id="weather-result" class="weather-result"><p>Search a city to load weather. Internet required.</p></div><p class="attribution">Weather data: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a></p>'},
  calendar: {title:"Day Planner", body:'<p>Add a task for your prototype dashboard.</p><input id="task-input" placeholder="e.g. Study Python for 20 minutes"><button class="window-action" data-action="save-task">Save task</button><p id="task-output" role="status"></p>'},
  gallery: {title:"Gallery", body:'<p>Select photos to preview them here.</p><input id="gallery-input" type="file" accept="image/*" multiple><div id="gallery-preview" class="gallery-preview"></div>'},
  settings: {title:"Settings", body:'<p>Personalise your prototype.</p><button class="window-action" data-action="toggle-theme">Toggle light / dark mode</button><p>Screen and camera permissions are not enabled in this prototype.</p>'},
  music: {title:"Music Player", body:'<div class="music-card"><div class="album-art">♫</div><h3 id="track-title">Choose your music</h3><p id="track-subtitle">Play an audio file stored on your device</p><input id="music-file" type="file" accept="audio/*"><audio id="audio-player" controls preload="metadata"></audio><div class="music-actions"><button class="window-action" data-action="play-audio">▶ Play</button><button class="window-action secondary-action" data-action="pause-audio">Ⅱ Pause</button></div><p class="hint">Choose an audio file to play it. Nexus OS does not include music tracks.</p></div>'},
  messages: {title:"Messages", body:'<p>Messages preview</p><p>No messages are accessed or sent by this prototype.</p>'},
  store: {title:"App Store", body:'<p>Nexus App Store</p><p>A future place to discover trusted apps and mini-tools.</p>'},
  notes: {title:"Notes", body:'<p>Notes are saved on this browser.</p><input id="note-title" placeholder="Note title"><textarea id="note-content" placeholder="Start writing…"></textarea><button class="window-action" data-action="save-note">Save note</button><button class="window-action secondary-action" data-action="load-note">Load saved note</button><p id="note-status" role="status"></p>'},
  camera: {title:"Camera & Photo Import", body:'<p>Choose a photo, or use the camera option if your browser offers it.</p><input id="camera-input" type="file" accept="image/*" capture="environment"><div id="camera-preview" class="camera-preview">📷 Your selected photo appears here.</div>'},
  timer: {title:"Focus Timer", body:'<div class="timer-face" id="timer-display">05:00</div><label>Minutes <input id="timer-minutes" type="number" min="1" max="180" value="5"></label><button class="window-action" data-action="start-timer">▶ Start</button><button class="window-action secondary-action" data-action="stop-timer">Reset</button><p id="timer-status" role="status">Ready when you are.</p>'},
  paint: {title:"Nexus Paint", body:'<div class="paint-tools"><label>Color <input id="paint-color" type="color" value="#9b8cff"></label><label>Brush <input id="paint-size" type="range" min="2" max="24" value="6"></label><button class="window-action secondary-action" data-action="clear-paint">Clear</button><button class="window-action" data-action="save-paint">Save image</button></div><canvas id="paint-canvas" width="900" height="520"></canvas><p class="hint">Draw with your finger or mouse.</p>'},
  tasks: {title:"Tasks", body:'<p>Manage a checklist saved in this browser.</p><form id="quick-task-form" class="inline-form"><input id="quick-task-input" placeholder="Add a task…" required><button class="window-action" type="submit">Add</button></form><div id="quick-task-list" class="task-list"></div>'},
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
  function point(e) {
    const rect = canvas.getBoundingClientRect();
    return {x:(e.clientX-rect.left)*canvas.width/rect.width, y:(e.clientY-rect.top)*canvas.height/rect.height};
  }
  canvas.onpointerdown = function (e) { drawing = true; canvas.setPointerCapture(e.pointerId); const p=point(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); };
  canvas.onpointermove = function (e) { if (!drawing) return; const p=point(e); ctx.strokeStyle=$("#paint-color").value; ctx.lineWidth=Number($("#paint-size").value); ctx.lineTo(p.x,p.y); ctx.stroke(); };
  canvas.onpointerup = canvas.onpointercancel = function () { drawing = false; };
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
  if (event.target.id === "music-file" && event.target.files[0]) {
    const file = event.target.files[0];
    $("#audio-player").src = URL.createObjectURL(file);
    $("#track-title").textContent = file.name.replace(/\.[^.]+$/, "");
    $("#track-subtitle").textContent = "Selected from your device";
    $("#music-status").textContent = file.name.replace(/\.[^.]+$/, "");
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
