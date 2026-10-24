/* ==========================================================================
   Nexus OS — Home layout (v50)
   Lets the home screen be rearranged: long-press any app icon to pick it up,
   then tap another icon to swap the two. The order is saved per device, and
   the "More" button still shows the rest.
   ========================================================================== */
(function () {
  "use strict";
  var KEY = "nexus-app-order";
  var grid = null;
  var selected = null;

  function readOrder() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (_) { return null; }
  }
  function saveOrder(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (_) {}
  }

  function applyOrder() {
    grid = document.querySelector(".app-grid");
    if (!grid) return;
    var order = readOrder();
    if (!Array.isArray(order) || !order.length) return;
    var buttons = Array.prototype.slice.call(grid.querySelectorAll(".app"));
    var byKey = {};
    buttons.forEach(function (b) {
      var key = b.dataset.app || ("action:" + (b.dataset.action || b.textContent.trim()));
      byKey[key] = b;
    });
    order.forEach(function (key) {
      var b = byKey[key];
      if (b) grid.appendChild(b);
    });
    /* Anything new stays at the end, before the "More" button. */
    var more = grid.querySelector('[data-action="show-all-apps"]');
    if (more) grid.appendChild(more);
  }

  function currentOrder() {
    var g = document.querySelector(".app-grid");
    if (!g) return [];
    return Array.prototype.slice.call(g.querySelectorAll(".app")).map(function (b) {
      return b.dataset.app || ("action:" + (b.dataset.action || b.textContent.trim()));
    });
  }

  function mark(el, on) {
    el.classList.toggle("nx-picked", !!on);
  }

  function startPick(btn) {
    if (selected === btn) {
      mark(btn, false);
      selected = null;
      return;
    }
    if (!selected) {
      selected = btn;
      mark(btn, true);
      if (window.NexusCore && window.NexusCore.tone) window.NexusCore.tone(880, 60);
      if (navigator.vibrate) { try { navigator.vibrate(15); } catch (_) {} }
      return;
    }
    /* Second tap: swap the two icons. */
    var g = btn.parentNode;
    var a = selected, b = btn;
    var aNext = a.nextSibling;
    if (b.nextSibling === a) {
      g.insertBefore(a, b);
    } else {
      g.insertBefore(b, a);
      g.insertBefore(a, aNext);
    }
    mark(a, false);
    mark(b, false);
    selected = null;
    saveOrder(currentOrder());
    if (window.NexusCore && window.NexusCore.tone) window.NexusCore.tone(1040, 70);
  }

  function init() {
    var g = document.querySelector(".app-grid");
    if (!g || g.dataset.nxSortable) return;
    g.dataset.nxSortable = "1";
    applyOrder();

    var hold = null;
    g.addEventListener("pointerdown", function (e) {
      var btn = e.target.closest(".app");
      if (!btn) return;
      if (selected) return;              /* a tap now means "swap here" */
      hold = setTimeout(function () { hold = null; startPick(btn); }, 550);
    });
    ["pointerup", "pointercancel", "pointermove", "pointerleave"].forEach(function (ev) {
      g.addEventListener(ev, function () {
        if (hold) { clearTimeout(hold); hold = null; }
      }, { passive: true });
    });
    g.addEventListener("click", function (e) {
      if (!selected) return;
      var btn = e.target.closest(".app");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      startPick(btn);
    }, true);

    /* Escape / tapping the empty grid cancels the pick. */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && selected) { mark(selected, false); selected = null; }
    });
    document.addEventListener("click", function (e) {
      if (selected && !e.target.closest(".app")) { mark(selected, false); selected = null; }
    }, true);
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch (_) {}
    location.reload();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.NexusLayout = { init: init, reset: reset, get order() { return currentOrder(); } };
})();
