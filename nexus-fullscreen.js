/* ==========================================================================
   Nexus OS — Fullscreen helper (v50)
   Makes the video player and the in-OS browser fill the whole screen, with a
   clear way back. Uses the real Fullscreen API when the browser allows it and
   a CSS fallback otherwise (iOS Safari only allows it on video elements).
   ========================================================================== */
(function () {
  "use strict";

  function exitButton(onExit) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "nx-fs-exit";
    b.setAttribute("aria-label", "Exit full screen");
    b.textContent = "✕";
    b.addEventListener("click", function () {
      onExit();
    });
    document.body.appendChild(b);
    return b;
  }

  function enter(el, onExit) {
    if (!el) return null;
    el.classList.add("nx-fs");
    var exit = exitButton(function () { leave(el, exit, onExit); });
    var doc = document;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(function () { /* CSS fallback already applied */ });
    }
    function onFsChange() {
      if (!doc.fullscreenElement) leave(el, exit, onExit, true);
    }
    doc.addEventListener("fullscreenchange", onFsChange);
    el._nxFsChange = onFsChange;
    return exit;
  }

  function leave(el, exit, onExit, fromEvent) {
    if (!el) return;
    el.classList.remove("nx-fs");
    if (exit && exit.parentNode) exit.parentNode.removeChild(exit);
    if (el._nxFsChange) {
      document.removeEventListener("fullscreenchange", el._nxFsChange);
      el._nxFsChange = null;
    }
    if (!fromEvent && document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
    if (onExit) onExit();
  }

  /* ---- YouTube player: fullscreen button + double tap on the video ---- */
  document.addEventListener("click", function (e) {
    var fs = e.target.closest("[data-yt-fs]");
    if (fs) {
      e.preventDefault();
      e.stopPropagation();
      var player = fs.closest(".nx-yt-player");
      if (player) enter(player);
      return;
    }
    /* Never swallow a click inside the YouTube player: the app's own
       buttons (close, subscribe) must keep working. */
  });

  /* Double-tap the video area to go fullscreen (phones). */
  document.addEventListener("dblclick", function (e) {
    var player = e.target.closest(".nx-yt-player");
    if (player && !player.classList.contains("nx-fs")) enter(player);
  });

  /* Leaving fullscreen must never break the player underneath. */
  document.addEventListener("fullscreenchange", function () {
    document.querySelectorAll(".nx-yt-player.nx-fs").forEach(function (el) {
      if (!document.fullscreenElement) {
        el.classList.remove("nx-fs");
        var x = document.querySelector(".nx-fs-exit");
        if (x && x.parentNode) x.parentNode.removeChild(x);
      }
    });
  });

  /* ---- Browser pages: a "Fill screen" control ---- */
  function addBrowserFullscreenButton() {
    document.querySelectorAll(".nx-browser-frame").forEach(function (frame) {
      var shell = frame.closest(".nx-browser, .nx-app, .nx-body");
      if (!shell || shell.querySelector("[data-nx-br-fs]")) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nx-btn sm ghost";
      btn.setAttribute("data-nx-br-fs", "1");
      btn.style.cssText = "position:absolute;right:10px;bottom:10px;z-index:5";
      btn.textContent = "⛶ Fill screen";
      btn.addEventListener("click", function () {
        enter(frame);
      });
      shell.appendChild(btn);
    });
  }
  /* Only look for a browser page when one is actually opened. */
  var mo = new MutationObserver(function () {
    if (document.querySelector(".nx-browser-frame")) addBrowserFullscreenButton();
  });
  document.addEventListener("DOMContentLoaded", function () {
    var layer = document.getElementById("app-layer");
    if (layer) mo.observe(layer, { childList: true, subtree: true });
  });

  window.NexusFullscreen = { enter: enter, leave: leave, refresh: addBrowserFullscreenButton };
})();
