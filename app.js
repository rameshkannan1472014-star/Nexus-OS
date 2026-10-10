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
  weather: {title:"Weather", body:'<p>🌤️ Live weather is not connected yet.</p><p>Later, we can connect a weather API and show your chosen city.</p>'},
  calendar: {title:"Day Planner", body:'<p>Add a task for your prototype dashboard.</p><input id="task-input" placeholder="e.g. Study Python for 20 minutes"><button class="window-action" data-action="save-task">Save task</button><p id="task-output" role="status"></p>'},
  gallery: {title:"Gallery", body:'<p>Gallery preview</p><p>Image importing and device photo access have not been added yet.</p>'},
  settings: {title:"Settings", body:'<p>Personalise your prototype.</p><button class="window-action" data-action="toggle-theme">Toggle light / dark mode</button><p>Screen and camera permissions are not enabled in this prototype.</p>'},
  music: {title:"Music Player", body:'<p>Music player preview</p><input id="track-input" placeholder="Track name"><button class="window-action" data-action="set-track">Set now playing</button><p id="track-output" role="status"></p><p>Audio playback is not connected yet.</p>'},
  messages: {title:"Messages", body:'<p>Messages preview</p><p>No messages are accessed or sent by this prototype.</p>'},
  store: {title:"App Store", body:'<p>Nexus App Store</p><p>A future place to discover trusted apps and mini-tools.</p>'},
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
  if (action === "ai-demo") {
    const prompt = $("#ai-prompt").value.trim();
    $("#ai-output").textContent = prompt ? "I’m only a UI demo so far. Next, we can connect a real AI model to answer: “" + prompt + "”" : "Write a question first.";
  }
});