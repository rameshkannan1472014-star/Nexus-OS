const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function updateClock() {
  const now = new Date();
  $("#clock").textContent = now.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  $("#date").textContent = now.toLocaleDateString([], {weekday:"long", month:"long", day:"numeric"});
  const heroClock = $("#hero-clock"); if (heroClock) heroClock.textContent = now.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});
  const heroDate = $("#hero-date"); if (heroDate) heroDate.textContent = now.toLocaleDateString([], {weekday:"short", day:"numeric", month:"short", year:"numeric"});
  const hour = now.getHours();
  const greeting = $("#greeting");
  if (greeting) greeting.textContent = hour < 12 ? "Good morning ☀️" : hour < 18 ? "Good afternoon 👋" : "Good evening 🌙";
}
updateClock();
setInterval(updateClock, 30000);

// Restore and save appearance preferences between visits on this device.
function restoreNexusAppearance() {
  try {
    const saved = JSON.parse(localStorage.getItem("nexus-appearance") || "{}");
    if (saved.bg) document.documentElement.style.setProperty("--bg", saved.bg);
    if (saved.accent) document.documentElement.style.setProperty("--accent", saved.accent);
    if (saved.light) document.body.classList.add("light-mode");
  } catch (_) {}
}
function saveNexusAppearance() {
  try {
    localStorage.setItem("nexus-appearance", JSON.stringify({
      bg: getComputedStyle(document.documentElement).getPropertyValue("--bg").trim(),
      accent: getComputedStyle(document.documentElement).getPropertyValue("--accent").trim(),
      light: document.body.classList.contains("light-mode")
    }));
  } catch (_) {}
}
restoreNexusAppearance();

const appInfo = {
  browser: {title:"Nexus Browser", body:'<div class="browser-shell"><form id="browser-form" class="browser-toolbar"><button class="browser-nav" type="button" data-action="browser-back">‹</button><button class="browser-nav" type="button" data-action="browser-forward">›</button><button class="browser-nav" type="button" data-action="browser-reload">↻</button><input id="browser-url" type="text" placeholder="Search or enter a website address" required><button type="submit">Go</button></form><div class="browser-home" id="browser-home"><h3>Browse inside Nexus OS</h3><p>Enter a website or choose a shortcut. Pages that allow embedding will appear here.</p><div class="browser-shortcuts"><button type="button" data-browser-url="https://www.wikipedia.org/">Wikipedia</button><button type="button" data-browser-url="https://www.google.com/">Google</button><button type="button" data-browser-url="https://github.com/">GitHub</button><button type="button" data-browser-url="https://www.youtube.com/">YouTube</button></div></div><div id="browser-message" class="browser-message" role="status">Your page will load here. If a site blocks embedding, use Open full site.</div><button id="browser-external" class="window-action secondary-action" type="button" data-action="browser-external" hidden>Open full site in browser</button><iframe id="browser-frame" title="Web page inside Nexus Browser" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen; autoplay; encrypted-media; picture-in-picture" sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads" hidden></iframe></div>'},
  files: {title:"File Manager", body:'<p>Choose files to view their names. Your phone will ask you which files to share with Nexus OS.</p><input id="files-picker" type="file" multiple><div id="files-list" class="file-list"><p class="hint">No files selected.</p></div><p class="hint">For safety, this app only sees files you choose.</p>'},
  terminal: {title:"Terminal", body:'<p>A safe demo terminal. It does not execute system commands.</p><div class="terminal-box">Nexus OS [Prototype]\nType help to see demo commands.</div><input id="terminal-input" placeholder="Type help"><button class="window-action" data-action="terminal-run">Run demo command</button><div id="terminal-output" role="status"></div>'},
  calculator: {title:"Calculator", body:'<div class="calculator"><input id="calc-input" class="calculator-display" inputmode="none" autocomplete="off" aria-label="Calculator display" placeholder="0" readonly><div class="calculator-keys" aria-label="Calculator keypad"><button class="utility" data-calc-key="AC">AC</button><button class="utility" data-calc-key="(">(</button><button class="utility" data-calc-key=")">)</button><button class="operator" data-calc-key="÷">÷</button><button data-calc-key="7">7</button><button data-calc-key="8">8</button><button data-calc-key="9">9</button><button class="operator" data-calc-key="×">×</button><button data-calc-key="4">4</button><button data-calc-key="5">5</button><button data-calc-key="6">6</button><button class="operator" data-calc-key="-">−</button><button data-calc-key="1">1</button><button data-calc-key="2">2</button><button data-calc-key="3">3</button><button class="operator" data-calc-key="+">+</button><button class="utility" data-calc-key="±">±</button><button data-calc-key="0">0</button><button data-calc-key=".">.</button><button class="equals" data-calc-key="=">=</button><button class="utility" data-calc-key="DEL" style="grid-column:span 4">⌫ Delete</button></div><p id="calc-output" class="calculator-result" role="status">Ready</p></div>'},
  weather: {title:"Live Weather", body:'<p>Current conditions and today’s forecast for a city.</p><form id="weather-form" class="inline-form"><input id="weather-city" placeholder="Enter city (e.g. Chennai)" value="Chennai" required><button class="window-action" type="submit">Get weather</button></form><div id="weather-result" class="weather-result"><p>Search a city to load weather. Internet required.</p></div><p class="attribution">Weather data: <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a></p>'},
  calendar: {title:"Day Planner", body:'<p>Add a task for your prototype dashboard.</p><input id="task-input" placeholder="e.g. Study Python for 20 minutes"><button class="window-action" data-action="save-task">Save task</button><p id="task-output" role="status"></p>'},
  gallery: {title:"Gallery", body:'<p>Select photos to preview them here.</p><input id="gallery-input" type="file" accept="image/*" multiple><div id="gallery-preview" class="gallery-preview"></div>'},
  settings: {title:"Settings", body:'<p>Personalise Nexus OS and review what this web prototype can access.</p><button class="window-action" data-action="toggle-theme">Toggle light / dark mode</button><div class="file-list"><div>🎨 Appearance <span>Saved on this device</span></div><div>📷 Camera and microphone <span>Browser permission required</span></div><div>📞 Calls and SMS <span>Phone app confirmation required</span></div><div>📡 Wi-Fi and Bluetooth <span>Visual demo only</span></div><div>🛡️ Device-wide security scan <span>Not available to websites</span></div></div><p class="hint">Nexus OS is a web-based prototype. Real Android system controls require a native Android app and appropriate permissions.</p>'},
  music: {title:"Online Music", body:'<div class="music-card"><div class="album-art">♫</div><h3>Listen on the internet</h3><p>Search music online and play it through a music service.</p><form id="music-search-form" class="inline-form"><input id="music-search-query" placeholder="Song, artist or genre" required><button class="window-action" type="submit">Search</button></form><div class="online-music-links"><button type="button" data-music-service="youtube">Search YouTube</button><button type="button" data-music-service="soundcloud">Open SoundCloud</button><button type="button" data-music-service="spotify">Open Spotify</button></div><div id="music-results" class="music-results" role="status"><p class="hint">Search to find tracks with playable previews. Full catalogs and some tracks require the music service itself.</p></div><p class="hint">Track previews are provided by the iTunes Search service. Full songs may require opening the original service.</p><details><summary>Play an audio URL</summary><p>Use a direct audio stream URL you have permission to play.</p><input id="online-audio-url" type="url" placeholder="https://example.com/audio.mp3"><button class="window-action" data-action="play-online-audio">Play stream</button><audio id="audio-player" controls preload="none"></audio></details></div>'},
  messages: {title:"Message Drafts", body:'<p>Write a message, add a recipient, then open your phone’s SMS app to review and send it.</p><label for="message-recipient">Recipient phone number</label><input id="message-recipient" type="tel" inputmode="tel" placeholder="+91…" autocomplete="tel"><textarea id="message-draft" placeholder="Write your draft…"></textarea><button class="window-action" data-action="save-message">Save draft</button><button class="window-action secondary-action" data-action="load-message">Load draft</button><button class="window-action" data-action="send-message">Open SMS app to send</button><p id="message-status" role="status"></p>'},
  store: {title:"Nexus Mini Apps", body:'<p>Launch the tools included in this prototype.</p><div class="file-list"><div>🧮 Calculator <button data-launch="calculator">Open</button></div><div>📝 Notes <button data-launch="notes">Open</button></div><div>⏱️ Timer <button data-launch="timer">Open</button></div><div>🎨 Paint <button data-launch="paint">Open</button></div><div>🌦️ Weather <button data-launch="weather">Open</button></div><div>🎵 Music <button data-launch="music">Open</button></div></div>'},
  call: {title:"Phone Dialer Demo", body:'<p>Dial a number and hand off to your phone app. Your phone asks you to confirm the call.</p><input id="dial-display" aria-label="Phone number" placeholder="Enter number" readonly><div class="dial-pad"><button data-dial="1">1</button><button data-dial="2">2</button><button data-dial="3">3</button><button data-dial="4">4</button><button data-dial="5">5</button><button data-dial="6">6</button><button data-dial="7">7</button><button data-dial="8">8</button><button data-dial="9">9</button><button data-dial="*">*</button><button data-dial="0">0</button><button data-dial="#">#</button></div><button class="window-action secondary-action" data-action="dial-clear">Clear</button><button class="window-action" data-action="dial-call">📞 Call using phone app</button><button class="window-action secondary-action" data-action="dial-sms">💬 Send message</button><p id="dial-status" class="hint">Enter a number, then choose Call or Send message. Your phone handles the action.</p>'},
  security: {title:"Security Center", body:'<div class="feature-card"><span class="big-emoji">🛡️</span><h3>Nexus safety check</h3><p>Review basic browser-app settings.</p></div><button class="window-action" data-action="security-scan">Run safety check</button><div id="security-results" class="file-list"></div><p class="hint">This checks only the Nexus OS demo, not your whole phone.</p>'},
  cleaner: {title:"Storage Cleaner", body:'<div class="feature-card"><span class="big-emoji">🧹</span><h3>Browser session helper</h3><p>Clear temporary previews and reset this app window. Your saved notes and tasks will be kept.</p></div><button class="window-action" data-action="clean-session">Clear temporary previews</button><p id="cleaner-status" role="status"></p>'},
  games: {title:"Mini Match", body:'<p>Find matching pairs. Tap two cards to reveal them.</p><div id="match-game" class="match-game"><button data-match="🌟">?</button><button data-match="🚀">?</button><button data-match="🌈">?</button><button data-match="🎧">?</button><button data-match="🎧">?</button><button data-match="🌈">?</button><button data-match="🚀">?</button><button data-match="🌟">?</button></div><button class="window-action secondary-action" data-action="reset-game">Restart game</button><p id="game-status" class="hint">Match all four pairs.</p>'},
  notes: {title:"Notes", body:'<p>Notes are saved on this browser.</p><input id="note-title" placeholder="Note title"><textarea id="note-content" placeholder="Start writing…"></textarea><button class="window-action" data-action="save-note">Save note</button><button class="window-action secondary-action" data-action="load-note">Load saved note</button><p id="note-status" role="status"></p>'},
  camera: {title:"Camera", body:'<p>Allow camera access when your browser asks. Camera access requires HTTPS and permission.</p><div class="camera-actions"><button class="window-action" data-action="start-camera">Start camera</button><button class="window-action secondary-action" data-action="stop-camera">Stop</button><button class="window-action" data-action="capture-photo">Take photo</button></div><video id="camera-video" class="camera-video" autoplay playsinline muted></video><canvas id="camera-snapshot" hidden></canvas><div id="camera-preview" class="camera-preview">Camera preview will appear here.</div><p id="camera-status" class="hint" role="status">Tap Start camera and allow permission.</p><details><summary>Choose an existing photo instead</summary><input id="camera-input" type="file" accept="image/*" capture="environment"></details>'},
  timer: {title:"Focus Timer", body:'<div class="timer-face" id="timer-display">05:00</div><label>Minutes <input id="timer-minutes" type="number" min="1" max="180" value="5"></label><button class="window-action" data-action="start-timer">▶ Start</button><button class="window-action secondary-action" data-action="stop-timer">Reset</button><p id="timer-status" role="status">Ready when you are.</p>'},
  paint: {title:"Paint", body:'<div class="paint-ribbon"><div class="paint-tools"><label>Tool <select id="paint-tool"><option value="pen">Pencil</option><option value="marker">Marker</option><option value="eraser">Eraser</option></select></label><label>Color <input id="paint-color" type="color" value="#202020"></label><label>Size <input id="paint-size" type="range" min="1" max="48" value="5"></label><output id="paint-size-value">5 px</output><button class="window-action secondary-action" data-action="undo-paint">Undo</button><button class="window-action secondary-action" data-action="clear-paint">Clear</button><button class="window-action" data-action="save-paint">Save image</button></div><div class="paint-swatches"><button data-paint-color="#202020" style="--swatch:#202020" aria-label="Black"></button><button data-paint-color="#ffffff" style="--swatch:#ffffff" aria-label="White"></button><button data-paint-color="#e5484d" style="--swatch:#e5484d" aria-label="Red"></button><button data-paint-color="#2f9e44" style="--swatch:#2f9e44" aria-label="Green"></button><button data-paint-color="#1c7ed6" style="--swatch:#1c7ed6" aria-label="Blue"></button><button data-paint-color="#f08c00" style="--swatch:#f08c00" aria-label="Orange"></button><button data-paint-color="#7950f2" style="--swatch:#7950f2" aria-label="Purple"></button></div></div><canvas id="paint-canvas" width="1200" height="720"></canvas><p class="hint">Paint with touch or mouse, then save your drawing as a PNG.</p>'},
  tasks: {title:"Tasks", body:'<p>Manage a checklist saved in this browser.</p><form id="quick-task-form" class="inline-form"><input id="quick-task-input" placeholder="Add a task…" required><button class="window-action" type="submit">Add</button></form><div id="quick-task-list" class="task-list"></div>'},
  youtube: {title:"YouTube", body:'<div class="youtube-shell"><div class="youtube-brand"><span class="youtube-mark">▶</span><div><h3>YouTube inside Nexus OS</h3><p>Search videos and play them here.</p></div></div><form id="youtube-form" class="youtube-form"><input id="youtube-url" type="text" placeholder="Search videos or paste a YouTube link" required><button class="window-action" type="submit">Search / Play</button></form><div class="youtube-presets"><button type="button" data-youtube-search="science experiments">Science</button><button type="button" data-youtube-search="coding tutorials">Coding</button><button type="button" data-youtube-search="space documentaries">Space</button></div><div class="youtube-mode-tabs"><button type="button" data-youtube-mode="videos" class="active">Videos</button><button type="button" data-youtube-mode="shorts">Shorts</button></div><div id="youtube-player-message" class="browser-message" role="status">Search for a video or paste a YouTube link.</div><div id="youtube-results" class="youtube-results"></div><button type="button" id="youtube-load-more" class="window-action secondary-action" hidden>Load more videos</button><button type="button" id="youtube-fullscreen" class="window-action secondary-action" hidden>⛶ Full screen video</button><iframe id="youtube-player" title="YouTube video player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" sandbox="allow-scripts allow-same-origin allow-presentation" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen hidden></iframe><p class="hint">Some videos have embedding disabled by their owner and may need to open on YouTube.</p></div>'},
  recorder: {title:"Voice Recorder", body:'<p>Record audio after granting microphone permission.</p><button class="window-action" data-action="start-recording">Start recording</button><button class="window-action secondary-action" data-action="stop-recording">Stop recording</button><audio id="recording-playback" controls></audio><p id="recorder-status" class="hint">Recording stays in this browser session.</p>'},
  ai: {title:"Nexus AI Companion", body:'<p>Hi! I’m the Nexus AI character 🤖</p><p>This is a UI prototype, so I am not connected to an AI model yet.</p><textarea id="ai-prompt" placeholder="What would you like help with?"></textarea><button class="window-action" data-action="ai-demo">Ask Nexus AI</button><p id="ai-output" role="status"></p>'},

  reminder: {title:"Smart Reminder", body:'<p>Create a reminder in this browser. Notifications depend on browser permission and may not work while the app is closed.</p><form id="reminder-form" class="inline-form"><input id="reminder-text" placeholder="What should I remember?" required><input id="reminder-time" type="datetime-local" required><button class="window-action" type="submit">Save reminder</button></form><div id="reminder-list" class="file-list"></div><p id="reminder-status" class="hint" role="status"></p>'},
  clock: {title:"Clock & Alarms", body:'<div class="feature-card"><span class="big-emoji">🕒</span><h3 id="clock-live">--:--:--</h3><p id="clock-live-date">Local time</p></div><h3>Set a focus alarm</h3><form id="alarm-form" class="inline-form"><input id="alarm-minutes" type="number" min="1" max="240" value="10" required><button class="window-action" type="submit">Start countdown</button></form><p id="alarm-status" role="status">Alarm is off.</p>'},
  news: {title:"News Reader", body:'<p>Search headlines using a web news search. Results open in the Nexus Browser.</p><form id="news-form" class="inline-form"><input id="news-query" placeholder="Technology, science, world…" value="technology news" required><button class="window-action" type="submit">Find headlines</button></form><div class="file-list"><button data-open-url="https://news.google.com/" class="window-action">Google News</button><button data-open-url="https://www.bbc.com/news" class="window-action secondary-action">BBC News</button><button data-open-url="https://www.thehindu.com/" class="window-action secondary-action">The Hindu</button></div>'},
  themes: {title:"Themes & Appearance", body:'<p>Personalise Nexus OS colours. Changes apply to this browser session.</p><div class="theme-options"><button class="window-action" data-theme-preset="violet">Violet</button><button class="window-action" data-theme-preset="ocean">Ocean</button><button class="window-action" data-theme-preset="sunset">Sunset</button><button class="window-action secondary-action" data-theme-preset="default">Default</button></div><button class="window-action secondary-action" data-action="toggle-theme">Toggle light / dark mode</button><p class="hint">Themes change the web interface only, not Android system appearance.</p>'},
  widgets: {title:"Widget Studio", body:'<p>Choose which dashboard cards to show.</p><label><input type="checkbox" data-widget-toggle="weather" checked> Weather card</label><br><label><input type="checkbox" data-widget-toggle="tasks" checked> Day planner card</label><br><label><input type="checkbox" data-widget-toggle="music" checked> Music card</label><p class="hint">Changes affect the Nexus OS home dashboard.</p>'},
  pdf: {title:"PDF Viewer", body:'<p>Select a PDF from your device to view it here. The file stays in this browser tab.</p><input id="pdf-file" type="file" accept="application/pdf,.pdf"><p id="pdf-status" class="hint" role="status">Choose a PDF file.</p><iframe id="pdf-frame" title="PDF document viewer" class="pdf-frame" hidden></iframe>'},
  maps: {title:"Maps & Directions", body:'<p>Search for a place or get directions. Map results open inside Nexus Browser when possible.</p><form id="maps-form" class="inline-form"><input id="maps-query" placeholder="Place, address or destination" required><button class="window-action" type="submit">Search map</button></form><button class="window-action secondary-action" data-action="maps-location">Use my location</button><div id="maps-status" class="hint" role="status">Location is only requested if you tap the button.</div>'},
  generator: {title:"Photo & Video Studio", body:'<p>Create a simple poster image locally, or open a video editor. This prototype does not generate AI photos or videos.</p><input id="studio-title" placeholder="Poster headline" value="MY NEXT BIG IDEA"><input id="studio-subtitle" placeholder="Subtitle" value="Create something amazing"><label>Background <input id="studio-color" type="color" value="#6757d9"></label><button class="window-action" data-action="make-poster">Create poster</button><a id="studio-download" hidden download="nexus-poster.png">Save poster PNG</a><canvas id="studio-canvas" width="900" height="1200" class="studio-canvas"></canvas><button class="window-action secondary-action" data-open-url="https://www.canva.com/">Open online design editor</button>'},
  books: {title:"Book Reader", body:'<p>Open a text or EPUB-compatible file. Plain text files can be read directly here; EPUB support depends on your browser.</p><input id="book-file" type="file" accept=".txt,.md,.epub,text/plain,text/markdown"><article id="book-content" class="book-content">Choose a text book file to begin reading.</article><label>Text size <input id="book-size" type="range" min="14" max="30" value="18"></label>'},
  casting: {title:"Screen Share & Casting", body:'<p>Share a screen preview with explicit browser permission. This does not automatically mirror to a TV.</p><button class="window-action" data-action="start-screen-share">Choose screen to share</button><button class="window-action secondary-action" data-action="stop-screen-share">Stop sharing</button><video id="screen-preview" class="camera-video" autoplay playsinline muted></video><p id="casting-status" class="hint" role="status">Your browser will show a screen-sharing permission prompt.</p><p class="hint">TV casting depends on browser and receiver support.</p>'},
  shop: {title:"Shop Finder", body:'<p>Find nearby shops using a map search. Nexus OS does not collect or store your location.</p><input id="shop-query" placeholder="Bookshops, electronics, stationery…" value="electronics shops"><button class="window-action" data-action="find-shops">Find nearby shops</button><p id="shop-status" class="hint" role="status">Tap Find to open a location search.</p>'},
  sos: {title:"SOS & Emergency Help", body:'<div class="feature-card"><span class="big-emoji">🆘</span><h3>Emergency help</h3><p>If you are in immediate danger, contact local emergency services or a trusted adult.</p></div><label>Trusted contact number <input id="sos-number" type="tel" placeholder="Enter a trusted contact"></label><button class="window-action" data-action="save-sos">Save trusted contact on this device</button><button class="window-action secondary-action" data-action="sos-call">Call saved contact</button><button class="window-action secondary-action" data-open-url="https://112.gov.in/">India emergency information</button><p id="sos-status" class="hint" role="status">No call is made unless you press the call button.</p>'},
  planner: {title:"Day Planner", body:'<p>Plan your day with tasks and priorities. Saved in this browser.</p><form id="planner-form" class="inline-form"><input id="planner-task" placeholder="What do you want to do?" required><select id="planner-priority"><option>Normal</option><option>High</option><option>Low</option></select><button class="window-action" type="submit">Add plan</button></form><div id="planner-list" class="task-list"></div>'},
  feedback: {title:"Feedback", body:'<p>Tell us what works and what should improve. Your feedback is saved locally in this browser.</p><form id="feedback-form"><label>Topic <select id="feedback-topic"><option>Bug report</option><option>Feature request</option><option>Design feedback</option><option>Other</option></select></label><textarea id="feedback-text" placeholder="Write your feedback…" required></textarea><button class="window-action" type="submit">Save feedback</button></form><p id="feedback-status" role="status"></p><div id="feedback-list" class="file-list"></div>'},
  radio: {title:"FM & Internet Radio", body:'<p>Online radio stations require an internet connection. FM tuner access is not available to a normal browser app.</p><div class="file-list"><button class="window-action" data-radio-url="https://www.radioindia.in/">India Radio</button><button class="window-action secondary-action" data-radio-url="https://onlineradiobox.com/in/">Online Radio Box India</button><button class="window-action secondary-action" data-radio-url="https://www.bbc.co.uk/sounds">BBC Sounds</button></div><p class="hint">Choose a station directory to listen on its official website.</p>'}
};

function closeWindow() {
  const layer = $("#app-layer");
  const win = layer?.querySelector(".app-window");
  if (!layer || !win) return;
  win.classList.add("is-closing");
  const finishClose = () => {
    if (win.parentNode === layer) layer.replaceChildren();
    document.body.classList.remove("app-is-open");
  };
  win.addEventListener("transitionend", (event) => {
    if (event.target === win && event.propertyName === "opacity") finishClose();
  }, { once: true });
  // Fallback for reduced-motion or browsers that skip transition events.
  setTimeout(finishClose, 260);
}
function getCameraPhotos(){try{return JSON.parse(localStorage.getItem("nexus-camera-photos")||"[]")}catch(_){return []}}
function renderCameraGallery(){
 const target=$("#gallery-preview");if(!target)return;target.replaceChildren();
 const photos=getCameraPhotos();
 if(!photos.length){const note=document.createElement("p");note.className="hint";note.textContent="Photos you take with Nexus Camera will appear here.";target.append(note);return;}
 photos.slice().reverse().forEach((photo,index)=>{
  const card=document.createElement("article");card.className="camera-gallery-item";
  const img=document.createElement("img");img.src=photo.data;img.alt=photo.name||"Nexus photo";img.className="preview-image";
  const caption=document.createElement("p");caption.textContent=photo.name||"Nexus photo";
  const save=document.createElement("a");save.href=photo.data;save.download=(photo.name||"nexus-photo.jpg");save.textContent="Save to device";
  const remove=document.createElement("button");remove.type="button";remove.className="window-action secondary-action";remove.textContent="Delete";
  remove.addEventListener("click",()=>{const all=getCameraPhotos();const actual=all.findIndex(p=>p.id===photo.id);if(actual>=0)all.splice(actual,1);localStorage.setItem("nexus-camera-photos",JSON.stringify(all));renderCameraGallery();});
  card.append(img,caption,save,remove);target.append(card);
 });
}
function saveCameraPhoto(data){
 const photos=getCameraPhotos();
 photos.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),name:"Nexus-"+new Date().toISOString().replace(/[:.]/g,"-")+".jpg",data});
 try{localStorage.setItem("nexus-camera-photos",JSON.stringify(photos));return true;}
 catch(_){photos.shift();try{localStorage.setItem("nexus-camera-photos",JSON.stringify(photos));return false}catch(__){return false}}
}
function openApp(name) {
  // YouTube is an in-OS app window; never redirect its app icon to the native YouTube app.
  const app = appInfo[name];
  if (!app) return;
  const layer = $("#app-layer");
  const win = document.createElement("section");
  win.className = "app-window";
  win.setAttribute("role", "dialog");
  win.setAttribute("aria-modal", "true");
  win.setAttribute("aria-label", app.title);
  win.dataset.appName = name;
  const appGlyphs = {youtube:"▶",browser:"🌐",files:"📁",terminal:"⌨",calculator:"▦",weather:"🌤",calendar:"🗓",gallery:"✿",settings:"⚙",music:"♫",messages:"💬",store:"▣",call:"☎",security:"⬡",cleaner:"✦",games:"🧩",notes:"▤",camera:"📷",timer:"◷",paint:"🎨",tasks:"✓",recorder:"🎙",ai:"✦",reminder:"🔔",clock:"◷",news:"📰",themes:"🎨",widgets:"▦",pdf:"📄",maps:"📍",generator:"✨",books:"📚",casting:"▣",shop:"🛍",sos:"🆘",planner:"🗓",feedback:"✉",radio:"♫"};
  const head = document.createElement("header");
  head.className = "window-head";
  const appIdentity = document.createElement("div");
  appIdentity.className = "window-app-identity";
  const appIcon = document.createElement("span");
  appIcon.className = "window-app-icon";
  appIcon.setAttribute("aria-hidden", "true");
  appIcon.textContent = appGlyphs[name] || "✦";
  const titleStack = document.createElement("div");
  titleStack.className = "window-title-stack";
  const brand = document.createElement("span");
  brand.className = "window-brand";
  brand.textContent = "CUSTOM OS  •  APP";
  const title = document.createElement("h2");
  title.textContent = app.title;
  titleStack.append(brand, title);
  appIdentity.append(appIcon, titleStack);
  const headActions = document.createElement("div");
  headActions.className = "window-head-actions";
  const ready = document.createElement("span");
  ready.className = "window-ready";
  ready.innerHTML = '<i></i> ACTIVE';
  const close = document.createElement("button");
  close.className = "close-window";
  close.type = "button";
  close.setAttribute("aria-label", "Close app");
  close.textContent = "×";
  close.addEventListener("click", closeWindow);
  headActions.append(ready, close);
  head.append(appIdentity, headActions);
  const body = document.createElement("div");
  body.className = "window-body";
  body.innerHTML = '<div class="app-content app-content-' + name + '">' + app.body + '</div>';
  win.append(head, body);
  const bottomNav = document.createElement("nav");
  bottomNav.className = "app-bottom-nav";
  bottomNav.setAttribute("aria-label", "App navigation");
  bottomNav.innerHTML = '<button type="button" data-system-nav="back" aria-label="Back"><span>‹</span><small>Back</small></button><button type="button" data-system-nav="home" aria-label="Home"><span>⌂</span><small>Home</small></button><button type="button" data-system-nav="recent" aria-label="Recent apps"><span>▢</span><small>Recent</small></button>';
  win.append(bottomNav);
  layer.replaceChildren(win);
  document.body.classList.add("app-is-open");
  requestAnimationFrame(() => win.classList.add("is-open"));
  if (name === "gallery") renderCameraGallery();
  if (name === "reminder") renderReminders();
  if (name === "planner") renderPlanner();
  if (name === "feedback") renderFeedback();
  if (name === "clock") { const now=new Date(); if($("#clock-live"))$("#clock-live").textContent=now.toLocaleTimeString(); if($("#clock-live-date"))$("#clock-live-date").textContent=now.toLocaleDateString([], {weekday:"long",year:"numeric",month:"long",day:"numeric"}); }
  close.focus();
  if (name === "paint") initPaint();
  if (name === "youtube") { const input=$("#youtube-url"); if(input) input.setAttribute("autocomplete","off"); }
  if (name === "tasks" || name === "calendar") {
    renderSavedTasks($("#quick-task-list"));
    renderSavedTasks($("#task-list"));
  }
}
$$("[data-app]").forEach(button => button.addEventListener("click", () => openApp(button.dataset.app)));

$("#ai-companion").addEventListener("click", () => openApp("ai"));
function openExternal(url) { return loadBrowserUrl(url); }
function openFullSite(url){const safe=String(url||"");if(/^https?:\/\//i.test(safe))window.open(safe,"_blank","noopener,noreferrer");}
async function searchMusic(query){
 const box=$("#music-results");if(!box)return;
 box.innerHTML="<p>Searching tracks…</p>";
 try{
  const response=await fetch("https://itunes.apple.com/search?term="+encodeURIComponent(query)+"&entity=song&limit=15");
  if(!response.ok)throw new Error("Music search service unavailable");
  const data=await response.json();
  if(!data.results||!data.results.length){box.innerHTML="<p>No tracks found. Try another song or artist.</p>";return;}
  box.replaceChildren();
  data.results.forEach(track=>{
   const card=document.createElement("article");card.className="music-result";
   const img=document.createElement("img");img.alt="";img.loading="lazy";img.src=track.artworkUrl100||"";
   const info=document.createElement("div");info.className="music-result-info";
   const title=document.createElement("strong");title.textContent=track.trackName||"Untitled track";
   const artist=document.createElement("span");artist.textContent=(track.artistName||"Unknown artist")+" · "+(track.collectionName||"");
   info.append(title,artist);
   const audio=document.createElement("audio");audio.controls=true;audio.preload="none";audio.src=track.previewUrl||"";audio.setAttribute("aria-label","Preview "+(track.trackName||"track"));
   const link=document.createElement("a");link.href=track.trackViewUrl||"#";link.target="_blank";link.rel="noopener noreferrer";link.textContent="Open track";
   card.append(img,info);if(track.previewUrl)card.append(audio);else{const no=document.createElement("span");no.className="hint";no.textContent="No preview";card.append(no)}card.append(link);box.append(card);
  });
 }catch(error){box.innerHTML="<p>Music search could not connect. Check your internet and try again.</p>";}
}
const browserHistory=[]; let browserHistoryIndex=-1;

const NEXUS_API_BASE = "https://nexus-os-api-qffq.onrender.com";
let youtubeMode="videos", youtubeQuery="", youtubeNextPageToken="", youtubeChannelId="";
async function searchYouTube(query, append=false){
 const box=$("#youtube-results"),message=$("#youtube-player-message"),player=$("#youtube-player");
 if(!box||!message)return;
 if(!append){box.replaceChildren();youtubeNextPageToken="";}if(player)player.hidden=true;
 message.hidden=false;message.textContent=append?"Loading more videos…":"Searching YouTube inside Nexus OS…";
 try{
  const endpoint=NEXUS_API_BASE+"/api/youtube/search?q="+encodeURIComponent(query.trim())+"&mode="+encodeURIComponent(youtubeMode)+(youtubeChannelId?"&channelId="+encodeURIComponent(youtubeChannelId):"")+(append&&youtubeNextPageToken?"&pageToken="+encodeURIComponent(youtubeNextPageToken):"");
  const response=await fetch(endpoint);
  const data=await response.json();
  if(!response.ok)throw new Error(data.detail||"YouTube search is unavailable.");
  if(!Array.isArray(data.items)||!data.items.length){message.textContent="No videos found. Try another search.";return;}
  youtubeNextPageToken=data.nextPageToken||"";const more=$("#youtube-load-more");if(more){more.hidden=!youtubeNextPageToken;more.textContent=youtubeMode==="shorts"?"Load more Shorts":"Load more videos";}
  message.textContent=youtubeMode==="shorts"?"Shorts · swipe up/down to browse. Tap a video to use its player controls; it will not force full screen.":"Videos · scroll for more, or tap a channel name to browse its videos.";
  data.items.forEach(item=>{
   const isShort=youtubeMode==="shorts";
   const card=document.createElement("article");card.className=isShort?"youtube-short-card":"youtube-result";
   const details=document.createElement("div");details.className="youtube-result-info";
   const title=document.createElement("strong");title.textContent=item.title||"Untitled video";
   const channelLink=document.createElement("button");channelLink.type="button";channelLink.className="youtube-channel-link";channelLink.textContent="👤 "+(item.channel||"YouTube channel")+" · View channel";channelLink.addEventListener("click",()=>{if(!item.channelId)return;youtubeChannelId=item.channelId;youtubeQuery="";const input=$("#youtube-url");if(input)input.value="";message.textContent="Loading videos from "+(item.channel||"this channel")+"…";const tabs=$(".youtube-mode-tabs button");tabs.forEach(b=>b.classList.toggle("active",b.dataset.youtubeMode==="videos"));youtubeMode="videos";searchYouTube("",false);});
   if(isShort){
    const frame=document.createElement("iframe");frame.className="youtube-short-player";frame.title=item.title||"YouTube Short";frame.loading="lazy";frame.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(item.videoId)+"?playsinline=1&rel=0";frame.allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";frame.setAttribute("sandbox","allow-scripts allow-same-origin allow-presentation");frame.allowFullscreen=true;
    const caption=document.createElement("div");caption.className="youtube-short-caption";caption.append(title,channelLink);card.append(frame,caption);
   }else{
    const image=document.createElement("img");image.className="youtube-thumb";image.loading="lazy";image.alt="";image.src=item.thumbnail||"";
    const play=document.createElement("button");play.type="button";play.className="window-action";play.textContent="▶ Play here";
    play.addEventListener("click",()=>{const id=String(item.videoId||"");if(!/^[a-zA-Z0-9_-]{11}$/.test(id))return;player.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(id)+"?playsinline=1&rel=0";player.hidden=false;message.hidden=false;message.textContent="Loading video…";player.scrollIntoView({behavior:"smooth",block:"nearest"});});
    details.append(title,channelLink,play);card.append(image,details);
   }
   box.append(card);
  });
 }catch(error){
  message.hidden=false;
  message.textContent=error.message==="Failed to fetch"?"Could not reach Nexus OS API. Check your internet and that the Render service is awake.":error.message;
 }
}

function extractYouTubeId(value){
 const raw=String(value||"").trim();if(/^[a-zA-Z0-9_-]{11}$/.test(raw))return raw;
 try{const u=new URL(/^https?:\/\//i.test(raw)?raw:"https://"+raw);
 if(u.hostname.endsWith("youtu.be"))return u.pathname.split("/").filter(Boolean)[0]||"";
 if(u.hostname.includes("youtube.com")||u.hostname.includes("youtube-nocookie.com")){if(u.pathname==="/watch")return u.searchParams.get("v")||"";const p=u.pathname.split("/").filter(Boolean);if(["embed","shorts","live"].includes(p[0]))return p[1]||"";}}
 catch(_){}return "";
}
function loadBrowserUrl(raw,push=true){
 const input=String(raw||"").trim();if(!input)return;let url=input;
 if(!/^https?:\/\//i.test(url))url=url.includes(".")&&!/\s/.test(url)?"https://"+url:"https://www.google.com/search?q="+encodeURIComponent(url);
 let parsed;try{parsed=new URL(url)}catch(_){const m=$("#browser-message");if(m){m.hidden=false;m.textContent="Invalid address. Try a website URL or search words."}return}
 if(!["https:","http:"].includes(parsed.protocol))return;
 const id=extractYouTubeId(url);if(id)url="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(id);
 const frame=$("#browser-frame");if(!frame)return;frame.src=url;frame.hidden=false;
 const home=$("#browser-home");if(home)home.hidden=true;
 const msg=$("#browser-message");if(msg){msg.hidden=false;msg.textContent="Loading inside Nexus OS. If this site stays blank, it blocks embedding; use Open full site in browser."}const external=$("#browser-external");if(external)external.hidden=false;
 const address=$("#browser-url");if(address)address.value=input;
 if(push){browserHistory.splice(browserHistoryIndex+1);browserHistory.push(url);browserHistoryIndex=browserHistory.length-1}
}
function browserGo(delta){const n=browserHistoryIndex+delta;if(n<0||n>=browserHistory.length)return;browserHistoryIndex=n;const frame=$("#browser-frame");if(frame)frame.src=browserHistory[n]}
document.addEventListener("click", function(event) {
  const showAll = event.target.closest('[data-action="show-all-apps"]');
  if (showAll) { const grid = $(".app-grid"); grid?.classList.toggle("show-all"); if (grid?.classList.contains("show-all")) document.querySelector(".app-section-heading")?.scrollIntoView({behavior:"smooth",block:"start"}); return; }
  const nav = event.target.closest("[data-system-nav]");
  if (nav) {
    const action = nav.dataset.systemNav;
    if (action === "home") { closeWindow(); $("#control-center").hidden = true; window.scrollTo({top:0,behavior:"smooth"}); }
    if (action === "back") { if (!$("#app-layer").innerHTML.trim()) $("#control-center").hidden = true; else closeWindow(); }
    if (action === "recent") { const names = [...document.querySelectorAll(".app-grid .app")].map(b=>b.querySelector("span:last-child")?.textContent).filter(Boolean); alert("Nexus OS apps: " + names.join(", ")); }
    return;
  }
  const webShortcut=event.target.closest("[data-web-url]");
  if(webShortcut){loadBrowserUrl(webShortcut.dataset.webUrl);return;}
  const browserShortcut=event.target.closest("[data-browser-url]");if(browserShortcut){loadBrowserUrl(browserShortcut.dataset.browserUrl);return;}
  const ytMode=event.target.closest("[data-youtube-mode]");if(ytMode){youtubeChannelId="";youtubeMode=ytMode.dataset.youtubeMode;$("[data-youtube-mode]").forEach(b=>b.classList.toggle("active",b===ytMode));const input=$("#youtube-url");youtubeQuery=input?.value.trim()|| (youtubeMode==="shorts"?"trending shorts":"science experiments");if(youtubeMode==="shorts"&&!/shorts/i.test(youtubeQuery))youtubeQuery+=" #shorts";searchYouTube(youtubeQuery);return;}const ytMore=event.target.closest("#youtube-load-more");if(ytMore){searchYouTube(youtubeQuery,true);return;}const ytSearch=event.target.closest("[data-youtube-search]");if(ytSearch){youtubeChannelId="";youtubeMode="videos";youtubeQuery=ytSearch.dataset.youtubeSearch;$("[data-youtube-mode]").forEach(b=>b.classList.toggle("active",b.dataset.youtubeMode==="videos"));searchYouTube(youtubeQuery);return;}const fullscreen=event.target.closest("#youtube-fullscreen");if(fullscreen){const player=$("#youtube-player");if(player?.requestFullscreen)player.requestFullscreen().catch(()=>{});else if(player)player.style.height="80vh";return;}
  const external=event.target.closest('[data-action="browser-external"]');if(external){openFullSite($("#browser-frame")?.src||$("#browser-url")?.value);return;}
  const service=event.target.closest("[data-music-service]");
  if(service){const q=$("#music-search-query")?.value.trim()||"";const urls={youtube:"https://music.youtube.com/search?q="+encodeURIComponent(q),soundcloud:"https://soundcloud.com/search?q="+encodeURIComponent(q),spotify:"https://open.spotify.com/search/"+encodeURIComponent(q)};openFullSite(urls[service.dataset.musicService]);return;}
  if(event.target.closest('[data-action="dial-call"]')){const number=$("#dial-display")?.value||"";if(!/^[+0-9*#]{3,20}$/.test(number)){const s=$("#dial-status");if(s)s.textContent="Enter a valid phone number first.";return;}window.location.href="tel:"+number;return;}
   if(event.target.closest('[data-action="dial-sms"]')){const number=$("#dial-display")?.value||"";if(!/^[+0-9*#]{3,20}$/.test(number)){const s=$("#dial-status");if(s)s.textContent="Enter a valid phone number first.";return;}window.location.href="sms:"+number;return;}
   if(event.target.closest('[data-action="send-message"]')){const draft=$("#message-draft")?.value||"",recipient=$("#message-recipient")?.value.trim()||"";try{localStorage.setItem("nexus-message-draft",draft)}catch(_){}if(!recipient){const s=$("#message-status");if(s)s.textContent="Add the recipient’s phone number first.";return;}window.location.href="sms:"+recipient.replace(/[^+0-9]/g,"")+"?body="+encodeURIComponent(draft);const s=$("#message-status");if(s)s.textContent="Opening your phone’s SMS app. Review the message and send it there.";return;}
   if(event.target.closest('[data-action="browser-back"]')){browserGo(-1);return;}if(event.target.closest('[data-action="browser-forward"]')){browserGo(1);return;}if(event.target.closest('[data-action="browser-reload"]')){const f=$("#browser-frame");if(f&&f.src)f.src=f.src;return;}const paintColor=event.target.closest("[data-paint-color]");
  if(paintColor && $("#paint-color")){$("#paint-color").value=paintColor.dataset.paintColor;return;}
});
document.addEventListener("submit",function(event){
 if(event.target.id==="browser-form"){event.preventDefault();loadBrowserUrl($("#browser-url").value);}
 if(event.target.id==="youtube-form"){event.preventDefault();const value=$("#youtube-url").value.trim(),id=extractYouTubeId(value),p=$("#youtube-player"),m=$("#youtube-player-message");youtubeQuery=value;youtubeChannelId="";if(id){p.src="https://www.youtube-nocookie.com/embed/"+encodeURIComponent(id);p.hidden=false;const fs=$("#youtube-fullscreen");if(fs)fs.hidden=false;if(m){m.hidden=false;m.textContent="Loading video…"}const results=$("#youtube-results");if(results)results.replaceChildren();}else{if(youtubeMode==="shorts"&&!/shorts/i.test(value))youtubeQuery=value+" #shorts";searchYouTube(youtubeQuery);}}
 if(event.target.id==="music-search-form"){event.preventDefault();searchMusic($("#music-search-query").value.trim());}
  if(event.target.id==="youtube-form"){ /* handled by the main YouTube submit listener below */ }
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
  const appGrid = $(".app-grid");
  if (appGrid) appGrid.classList.toggle("show-all", Boolean(query));
  $(".app-grid .app").forEach(button => {
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
  if (!query && empty) empty.remove();
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
  if (action === "open-youtube") openApp("youtube");
  if (action === "open-youtube-music") openApp("music");
  if (action === "play-online-audio") { const url=$("#online-audio-url").value.trim(); const audio=$("#audio-player"); if(/^https:\/\//i.test(url)&&audio){audio.src=url;audio.play().catch(()=>{});} }
  if (action === "start-camera") {
    const video=$("#camera-video"), status=$("#camera-status");
    if(!navigator.mediaDevices?.getUserMedia){status.textContent="Camera API is unavailable. Open Nexus OS in an up-to-date browser over HTTPS."; }
    else navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false}).then(stream=>{window.nexusCameraStream=stream;video.srcObject=stream;video.hidden=false;status.textContent="Camera is on. Tap Take photo to capture.";}).catch(err=>{status.textContent="Camera could not start: "+(err.name==="NotAllowedError"?"permission denied":err.message||"check camera permission");});
  }
  if (action === "stop-camera") { if(window.nexusCameraStream) window.nexusCameraStream.getTracks().forEach(t=>t.stop());window.nexusCameraStream=null;if($("#camera-video"))$("#camera-video").srcObject=null;if($("#camera-status"))$("#camera-status").textContent="Camera stopped."; }
  if (action === "capture-photo") { const video=$("#camera-video"), canvas=$("#camera-snapshot"), preview=$("#camera-preview"), status=$("#camera-status");if(video?.videoWidth&&canvas){const scale=Math.min(1,1280/video.videoWidth);canvas.width=Math.round(video.videoWidth*scale);canvas.height=Math.round(video.videoHeight*scale);canvas.getContext("2d").drawImage(video,0,0,canvas.width,canvas.height);const data=canvas.toDataURL("image/jpeg",0.78);const img=document.createElement("img");img.src=data;img.alt="Captured photo";img.className="preview-image";preview.replaceChildren(img);const saved=saveCameraPhoto(data);status.textContent=saved?"Photo captured and saved to Nexus Gallery ✓":"Photo captured, but browser storage is full. Delete some Gallery photos and try again."; }else if(status)status.textContent="Start the camera first and allow permission."; }
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
    saveNexusAppearance();
  }

  if (action === "open-url") {
    let raw = $("#browser-url").value.trim();
    if (!raw) return;
    if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
    try {
      const url = new URL(raw);
      if (url.protocol === "https:" || url.protocol === "http:") loadBrowserUrl(url.href);
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
  if (event.target.id === "camera-input" && event.target.files[0]) {
    const file=event.target.files[0],reader=new FileReader();
    reader.onload=()=>{const data=String(reader.result||"");const img=document.createElement("img");img.src=data;img.alt=file.name;img.className="preview-image";$("#camera-preview")?.replaceChildren(img);if(saveCameraPhoto(data)){const s=$("#camera-status");if(s)s.textContent="Photo saved to Nexus Gallery ✓";}};
    reader.readAsDataURL(file);
  }
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


// --- Expanded 33-app workspace features (web-prototype capabilities) ---
let nexusAlarmInterval = null;
let nexusScreenStream = null;
function renderReminders() {
  const box = $("#reminder-list"); if (!box) return;
  let items=[]; try { items=JSON.parse(localStorage.getItem("nexus-reminders")||"[]"); } catch(_){}
  box.replaceChildren();
  if (!items.length) { box.innerHTML='<p class="hint">No reminders saved yet.</p>'; return; }
  items.forEach((item,index)=>{
    const row=document.createElement("div"); row.className="reminder-row";
    const label=document.createElement("span"); label.textContent=item.text+" · "+new Date(item.time).toLocaleString();
    const remove=document.createElement("button"); remove.className="window-action secondary-action"; remove.textContent="Delete";
    remove.addEventListener("click",()=>{const current=JSON.parse(localStorage.getItem("nexus-reminders")||"[]");current.splice(index,1);localStorage.setItem("nexus-reminders",JSON.stringify(current));renderReminders();});
    row.append(label,remove);box.append(row);
  });
}
function renderPlanner() {
  const box=$("#planner-list"); if(!box)return;
  let items=[];try{items=JSON.parse(localStorage.getItem("nexus-planner")||"[]")}catch(_){}
  box.replaceChildren();
  if(!items.length){box.innerHTML='<p class="hint">Your plan is empty. Add a task above.</p>';return;}
  items.forEach((item,index)=>{
    const row=document.createElement("label");row.className="planner-row";
    const check=document.createElement("input");check.type="checkbox";check.checked=!!item.done;
    check.addEventListener("change",()=>{const all=JSON.parse(localStorage.getItem("nexus-planner")||"[]");all[index].done=check.checked;localStorage.setItem("nexus-planner",JSON.stringify(all));renderPlanner();});
    const text=document.createElement("span");text.textContent=item.task+" · "+item.priority+(item.done?" · Done":"");
    row.append(check,text);box.append(row);
  });
}
function renderFeedback() {
  const box=$("#feedback-list");if(!box)return;
  let items=[];try{items=JSON.parse(localStorage.getItem("nexus-feedback")||"[]")}catch(_){}
  box.replaceChildren();
  items.slice().reverse().forEach(item=>{const row=document.createElement("div");row.className="feedback-item";const title=document.createElement("strong");title.textContent=item.topic;const body=document.createElement("p");body.textContent=item.text;row.append(title,body);box.append(row);});
}
function openInNexusBrowser(url) {
  closeWindow();openApp("browser");
  setTimeout(()=>loadBrowserUrl(url),50);
}
document.addEventListener("click", async function(event) {
  const openUrl=event.target.closest("[data-open-url]");
  if(openUrl){openInNexusBrowser(openUrl.dataset.openUrl);return;}
  const radio=event.target.closest("[data-radio-url]");
  if(radio){openInNexusBrowser(radio.dataset.radioUrl);return;}
  const preset=event.target.closest("[data-theme-preset]");
  if(preset){
    const themes={violet:["#0c0e16","#9b8cff"],ocean:["#071722","#54c7ec"],sunset:["#1b1018","#ff9b72"],default:["#0c0e16","#9b8cff"]};
    const [bg,accent]=themes[preset.dataset.themePreset]||themes.default;
    document.documentElement.style.setProperty("--bg",bg);document.documentElement.style.setProperty("--accent",accent);
    saveNexusAppearance();
    let status=preset.parentElement.querySelector(".theme-status");if(!status){status=document.createElement("p");status.className="hint theme-status";preset.parentElement.append(status);}status.textContent="Theme saved on this device ✓";return;
  }
  if(event.target.closest('[data-action="make-poster"]')){
    const canvas=$("#studio-canvas");if(!canvas)return;const ctx=canvas.getContext("2d"),color=$("#studio-color")?.value||"#6757d9";
    ctx.fillStyle=color;ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="rgba(255,255,255,.14)";ctx.beginPath();ctx.arc(720,220,250,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#fff";ctx.textAlign="center";ctx.font="bold 64px system-ui";ctx.fillText(($("#studio-title")?.value||"MY IDEA").slice(0,24),450,530,780);
    ctx.font="32px system-ui";ctx.fillText(($("#studio-subtitle")?.value||"").slice(0,50),450,600,780);
    const link=$("#studio-download");if(link){link.href=canvas.toDataURL("image/png");link.hidden=false;}return;
  }
  if(event.target.closest('[data-action="start-screen-share"]')){
    const status=$("#casting-status");try{if(!navigator.mediaDevices?.getDisplayMedia)throw new Error("Screen sharing is not supported in this browser.");nexusScreenStream=await navigator.mediaDevices.getDisplayMedia({video:true,audio:false});const video=$("#screen-preview");video.srcObject=nexusScreenStream;video.hidden=false;status.textContent="Screen preview is active. Stop sharing whenever you are done.";nexusScreenStream.getVideoTracks()[0].addEventListener("ended",()=>{status.textContent="Screen sharing stopped.";nexusScreenStream=null;});}catch(error){if(status)status.textContent=error.message||"Screen sharing was cancelled or blocked.";}return;
  }
  if(event.target.closest('[data-action="stop-screen-share"]')){if(nexusScreenStream)nexusScreenStream.getTracks().forEach(t=>t.stop());nexusScreenStream=null;if($("#screen-preview"))$("#screen-preview").srcObject=null;if($("#casting-status"))$("#casting-status").textContent="Screen sharing stopped.";return;}
  if(event.target.closest('[data-action="maps-location"]')){const status=$("#maps-status");if(!navigator.geolocation){status.textContent="Location is not supported in this browser.";return;}status.textContent="Requesting location permission…";navigator.geolocation.getCurrentPosition(pos=>{const {latitude,longitude}=pos.coords;openInNexusBrowser("https://www.google.com/maps/search/?api=1&query="+latitude+","+longitude);},()=>{status.textContent="Location was unavailable or permission was denied. You can search a place manually."},{enableHighAccuracy:false,timeout:10000});return;}
  if(event.target.closest('[data-action="find-shops"]')){const q=$("#shop-query")?.value.trim()||"shops";openInNexusBrowser("https://www.google.com/maps/search/"+encodeURIComponent(q+" near me"));return;}
  if(event.target.closest('[data-action="save-sos"]')){const number=$("#sos-number")?.value.trim()||"";if(!/^[+0-9 ()-]{5,24}$/.test(number)){if($("#sos-status"))$("#sos-status").textContent="Enter a valid trusted contact number.";return;}localStorage.setItem("nexus-sos-contact",number);$("#sos-status").textContent="Trusted contact saved on this browser.";return;}
  if(event.target.closest('[data-action="sos-call"]')){const number=localStorage.getItem("nexus-sos-contact");if(!number){$("#sos-status").textContent="Save a trusted contact first.";return;}if(confirm("Open your phone app to call your saved trusted contact?"))window.location.href="tel:"+number.replace(/[^+0-9]/g,"");return;}
});
document.addEventListener("change", function(event) {
  if(event.target.matches("[data-widget-toggle]")){const key=event.target.dataset.widgetToggle;const card=document.querySelector(".widgets .widget:nth-child("+(key==="weather"?1:key==="tasks"?2:3)+")");if(card)card.hidden=!event.target.checked;}
  if(event.target.id==="pdf-file"){
    const file=event.target.files?.[0],frame=$("#pdf-frame"),status=$("#pdf-status");if(!file||!frame)return;
    if(file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf")){status.textContent="Please choose a PDF file.";return;}
    if(frame.dataset.objectUrl)URL.revokeObjectURL(frame.dataset.objectUrl);
    const url=URL.createObjectURL(file);frame.dataset.objectUrl=url;frame.src=url;frame.hidden=false;status.textContent="Opened "+file.name;
  }
  if(event.target.id==="book-file"){
    const file=event.target.files?.[0],box=$("#book-content");if(!file||!box)return;
    if(file.name.toLowerCase().endsWith(".epub")){box.textContent="EPUB preview is not built into this lightweight prototype. Choose a .txt or .md book file.";return;}
    const reader=new FileReader();reader.onload=()=>{box.textContent=String(reader.result||"");};reader.onerror=()=>{box.textContent="Could not read this file.";};reader.readAsText(file);
  }
  if(event.target.id==="book-size"){$("#book-content")?.style.setProperty("font-size",event.target.value+"px");}
});
document.addEventListener("submit",function(event){
  if(event.target.id==="reminder-form"){
    event.preventDefault();const text=$("#reminder-text").value.trim(),time=$("#reminder-time").value;if(!text||!time)return;
    const items=JSON.parse(localStorage.getItem("nexus-reminders")||"[]");items.push({text,time});localStorage.setItem("nexus-reminders",JSON.stringify(items));renderReminders();$("#reminder-status").textContent="Reminder saved in this browser. Keep Nexus OS open for any in-session reminder behaviour.";event.target.reset();
  }
  if(event.target.id==="alarm-form"){
    event.preventDefault();if(nexusAlarmInterval)clearInterval(nexusAlarmInterval);
    let seconds=Math.max(1,Math.min(240,Number($("#alarm-minutes").value)||1))*60;const status=$("#alarm-status");
    const tick=()=>{seconds--;status.textContent="Time remaining: "+Math.floor(seconds/60)+":"+String(seconds%60).padStart(2,"0");if(seconds<=0){clearInterval(nexusAlarmInterval);nexusAlarmInterval=null;status.textContent="⏰ Countdown complete!";if("Notification"in window&&Notification.permission==="granted")new Notification("Nexus Clock",{body:"Your countdown is complete."});}};
    status.textContent="Countdown started.";nexusAlarmInterval=setInterval(tick,1000);
  }
  if(event.target.id==="news-form"){event.preventDefault();openInNexusBrowser("https://news.google.com/search?q="+encodeURIComponent($("#news-query").value.trim()));}
  if(event.target.id==="maps-form"){event.preventDefault();openInNexusBrowser("https://www.google.com/maps/search/"+encodeURIComponent($("#maps-query").value.trim()));}
  if(event.target.id==="planner-form"){
    event.preventDefault();const task=$("#planner-task").value.trim();if(!task)return;const items=JSON.parse(localStorage.getItem("nexus-planner")||"[]");items.push({task,priority:$("#planner-priority").value,done:false});localStorage.setItem("nexus-planner",JSON.stringify(items));renderPlanner();event.target.reset();
  }
  if(event.target.id==="feedback-form"){
    event.preventDefault();const text=$("#feedback-text").value.trim();if(!text)return;const items=JSON.parse(localStorage.getItem("nexus-feedback")||"[]");items.push({topic:$("#feedback-topic").value,text,created:Date.now()});localStorage.setItem("nexus-feedback",JSON.stringify(items));$("#feedback-status").textContent="Thanks! Your feedback is saved locally on this device.";renderFeedback();$("#feedback-text").value="";
  }
});
const liveClockTimer=setInterval(()=>{const target=$("#clock-live");if(target){const now=new Date();target.textContent=now.toLocaleTimeString();const date=$("#clock-live-date");if(date)date.textContent=now.toLocaleDateString([], {weekday:"long",year:"numeric",month:"long",day:"numeric"});}},1000);
const previousOpenApp=window.openApp;
