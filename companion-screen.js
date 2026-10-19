/* Local screen context only: never inspect embedded pages or private message fields. */
(function () {
  "use strict";
  function short(value) { return String(value || "").replace(/\s+/g, " ").trim().slice(0, 140); }
  function read(root, selector) {
    var node = root.querySelector(selector);
    if (!node || node.closest("[hidden]")) return "";
    return short(node.value || node.textContent);
  }
  function context(doc) {
    var win = doc.querySelector("#app-layer .app-window");
    if (!win) return { app: "home", title: "Nexus OS", detail: "", section: "" };
    var app = win.getAttribute("data-app-name") || "app";
    var detail = "";
    if (app === "calculator") detail = read(win, "[data-calc-main]") || read(win, "#calc-output");
    if (app === "notes") detail = read(win, "[data-nt-t]") || read(win, "#note-title");
    if (app === "weather") detail = read(win, "#weather-result");
    if (app === "music") detail = read(doc, "#music-status");
    if (app === "youtube") detail = read(win, "#youtube-player-message");
    if (app === "terminal") detail = read(win, "#terminal-output");
    if (app === "files") detail = read(win, "#files-list");
    if (app === "calendar" || app === "planner") detail = read(win, "#task-output");
    if (app === "browser") {
      var frame = win.querySelector("#browser-frame");
      detail = frame && !frame.hidden ? "embedded-page" : "";
    }
    return { app: app, title: win.getAttribute("aria-label") || read(win, ".window-head h2") || app,
      detail: detail, section: read(win, "[data-nx-tab].is-active") || read(win, "[data-nx-nav].is-active") || read(win, ".reference-tab.active") };
  }
  function describe(c) {
    if (c.app === "home") return "You're on the Nexus OS home screen. What shall we open next?";
    if (c.app === "notes") return c.detail ? "You're working on a note titled " + c.detail + ". Looking forward to your ideas!" : "You're in Notes. Ready to capture your next idea?";
    if (c.app === "calculator" && c.detail && c.detail !== "Ready") return "Your calculator shows " + c.detail + ".";
    if (c.app === "music" && c.detail && c.detail !== "Nothing playing") return "Your music player shows " + c.detail + ". Enjoy the music!";
    if (c.app === "weather" && c.detail) return "The weather panel says: " + c.detail;
    if (c.app === "youtube" && c.detail) return "On YouTube: " + c.detail;
    if (c.app === "terminal" && c.detail) return "The terminal output says: " + c.detail;
    if (c.app === "files" && c.detail) return "Your file list shows: " + c.detail;
    if (c.app === "browser" && c.detail) return "You're browsing a website. I can see Nexus controls, but not the page inside that website.";
    return "You're in " + c.title + (c.section ? ", on " + c.section : "") + ".";
  }
  window.NexusCompanionScreen = { context: context, describe: describe };
})();
