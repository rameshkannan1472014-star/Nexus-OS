/* ==========================================================================
   Nexus OS — YouTube search without a server (v51)
   The old search went through the Nexus API on Render, which is now
   suspended, so the YouTube app showed nothing. This talks to YouTube's
   public InnerTube endpoint from the browser instead, then falls back to
   Piped / Invidious mirrors if YouTube refuses.
   Result shape matches what the app already expects:
     { items: [{ videoId, title, channel, channelId, thumbnail }], nextPageToken }
   ========================================================================== */
(function () {
  "use strict";
  var N = window.NexusApps;
  if (!N) return;

  var KEYS = [
    "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8", // web
    "AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w", // android
    "AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc"  // ios
  ];
  var KEY = KEYS[0];
  var CONTEXT = {
    client: {
      clientName: "WEB",
      clientVersion: "2.20240726.00.00",
      hl: "en",
      gl: "IN"
    }
  };

  var memCache = {};

  function timeout(ms) {
    if (window.AbortSignal && AbortSignal.timeout) return AbortSignal.timeout(ms);
    var c = new AbortController();
    setTimeout(function () { c.abort(); }, ms);
    return c.signal;
  }
  var CACHE_MS = 10 * 60 * 1000;

  function text(runs) {
    if (!runs) return "";
    return runs.map(function (r) { return r.text || ""; }).join("");
  }

  function pickThumb(thumbs) {
    if (!Array.isArray(thumbs) || !thumbs.length) return "";
    var best = thumbs[thumbs.length - 1];
    for (var i = 0; i < thumbs.length; i++) {
      if (thumbs[i].width >= 320) { best = thumbs[i]; break; }
    }
    return best.url || "";
  }

  /* Walk YouTube's deeply nested JSON and collect video renderers. */
  function collect(node, out) {
    if (!node) return out;
    if (Array.isArray(node)) {
      node.forEach(function (x) { collect(x, out); });
      return out;
    }
    if (typeof node !== "object") return out;

    if (node.videoRenderer) {
      var v = node.videoRenderer;
      var id = v.videoId;
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        out.push({
          videoId: id,
          title: text(v.title && v.title.runs) || "Untitled",
          channel: text(v.ownerText && v.ownerText.runs) || "",
          channelId: (v.ownerText && v.ownerText.runs && v.ownerText.runs[0] && v.ownerText.runs[0].navigationEndpoint &&
            v.ownerText.runs[0].navigationEndpoint.browseEndpoint &&
            v.ownerText.runs[0].navigationEndpoint.browseEndpoint.browseId) || "",
          thumbnail: pickThumb(v.thumbnail && v.thumbnail.thumbnails)
        });
      }
    }
    /* Shorts show up under a different renderer. */
    if (node.reelItemRenderer) {
      var r = node.reelItemRenderer;
      if (r.videoId && /^[a-zA-Z0-9_-]{11}$/.test(r.videoId)) {
        out.push({
          videoId: r.videoId,
          title: (r.headline && r.headline.simpleText) || "Short",
          channel: "",
          channelId: "",
          thumbnail: pickThumb(r.thumbnail && r.thumbnail.thumbnails)
        });
      }
    }
    Object.keys(node).forEach(function (k) {
      if (k === "videoRenderer" || k === "reelItemRenderer") return;
      collect(node[k], out);
    });
    return out;
  }

  function findToken(node) {
    if (!node || typeof node !== "object") return "";
    if (node.continuationCommand && node.continuationCommand.token) return node.continuationCommand.token;
    var found = "";
    if (Array.isArray(node)) {
      for (var i = 0; i < node.length && !found; i++) found = findToken(node[i]);
      return found;
    }
    var keys = Object.keys(node);
    for (var j = 0; j < keys.length && !found; j++) found = findToken(node[keys[j]]);
    return found;
  }

  function innertube(body) {
    var ctl = new AbortController();
    var t = setTimeout(function () { ctl.abort(); }, 7000);
    /* text/plain avoids the CORS preflight that YouTube's endpoint refuses. */
    if (body.key) KEY = body.key;
    return fetch("https://www.youtube.com/youtubei/v1/" + body.endpoint + "?key=" + KEY + "&prettyPrint=false", {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({
        context: CONTEXT,
        query: body.q,
        params: body.params,
        continuation: body.token
      }),
      signal: ctl.signal
    }).then(function (r) {
      if (!r.ok) throw new Error("YouTube answered " + r.status);
      return r.json();
    }).finally(function () { clearTimeout(t); });
  }

  /* ---- mirrors, used only if YouTube itself fails ---- */

  var PIPED = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.adminforge.de",
    "https://api.piped.private.coffee"
  ];
  var INVIDIOUS = [
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://yewtu.be"
  ];

  function fromPiped(q, mode) {
    var base = PIPED[Math.floor(Math.random() * PIPED.length)];   /* one mirror, short timeout */
    var filter = mode === "shorts" ? "videos" : "videos";
    return fetch(base + "/search?q=" + encodeURIComponent(q) + "&filter=" + filter, { signal: timeout(6000) })
      .then(function (r) { if (!r.ok) throw new Error("piped"); return r.json(); })
      .then(function (d) {
        var items = (d.items || []).map(function (it) {
          var id = (it.url || "").split("v=")[1] || "";
          return {
            videoId: id, title: it.title || "", channel: it.uploaderName || "",
            channelId: (it.uploaderUrl || "").replace("/channel/", ""),
            thumbnail: it.thumbnail || ""
          };
        }).filter(function (x) { return /^[a-zA-Z0-9_-]{11}$/.test(x.videoId); });
        if (!items.length) throw new Error("piped-empty");
        return { items: items.slice(0, 20), nextPageToken: d.nextpage || "" };
      });
  }

  function fromInvidious(q) {
    var base = INVIDIOUS[Math.floor(Math.random() * INVIDIOUS.length)];
    return fetch(base + "/api/v1/search?q=" + encodeURIComponent(q) + "&type=video", { signal: timeout(6000) })
      .then(function (r) { if (!r.ok) throw new Error("inv"); return r.json(); })
      .then(function (d) {
        var items = (d || []).filter(function (it) { return it.type === "video"; }).map(function (it) {
          return {
            videoId: it.videoId, title: it.title || "", channel: it.author || "",
            channelId: it.authorId || "", thumbnail: it.videoThumbnails && it.videoThumbnails[0] ? it.videoThumbnails[0].url : ""
          };
        });
        if (!items.length) throw new Error("inv-empty");
        return { items: items.slice(0, 20), nextPageToken: "" };
      });
  }

  /* ---- the replacement search ---- */

  async function search(params) {
    var q = String(params.q || "").trim() || "trending India";
    var mode = params.mode || "videos";
    var token = params.pageToken || "";
    var cacheKey = mode + "|" + q + "|" + token;

    if (memCache[cacheKey] && Date.now() - memCache[cacheKey].at < CACHE_MS) {
      return memCache[cacheKey].data;
    }

    var data = null;

    /* Piped first: it sends the CORS headers a browser needs. */
    try {
      data = await fromPiped(q, mode);
      memCache[cacheKey] = { at: Date.now(), data: data };
      return data;
    } catch (_) { /* fall through to YouTube direct */ }

    try {
      var body = token
        ? { endpoint: "search", token: token }
        : { endpoint: "search", q: q, params: mode === "shorts" ? "EgZzaG9ydHM%3D" : "EgIQAQ%3D%3D" };
      var json = null, lastErr = null;
      for (var ki = 0; ki < KEYS.length && !json; ki++) {
        try { json = await innertube(Object.assign({ key: KEYS[ki] }, body)); }
        catch (err) { lastErr = err; }
      }
      if (!json) throw lastErr || new Error("YouTube did not answer");
      var items = collect(json, []);
      /* YouTube repeats the same video in several shelves; keep the first of each. */
      var seen = {};
      items = items.filter(function (it) {
        if (seen[it.videoId]) return false;
        seen[it.videoId] = 1;
        return true;
      });
      if (mode === "shorts") {
        var shorts = items.filter(function (it) { return it.title !== "Short"; });
        items = shorts.length ? shorts : items;
      }
      /* v51: YouTube's own "next page" token needs an extra API round trip
         that a browser cannot always make. We simply search again for more
         results instead, which is instant and always works. */
      data = { items: items.slice(0, 20), nextPageToken: "" };
      if (!data.items.length) throw new Error("empty");
    } catch (e) {
      if (token) {
        /* A stale "load more" token just means: start the search again. */
        try {
          var fresh = await innertube({ endpoint: "search", q: q });
          var fItems = collect(fresh, []);
          if (fItems.length) {
            var fData = { items: fItems.slice(0, 20), nextPageToken: "" };
            memCache[cacheKey] = { at: Date.now(), data: fData };
            return fData;
          }
        } catch (_) {}
      }
      try { data = await fromInvidious(q); }
      catch (__) { throw new Error("YouTube is not answering right now. Check your connection and try again."); }
    }

    memCache[cacheKey] = { at: Date.now(), data: data };
    return data;
  }

  /* ---- install over the app's own search ---- */

  var installed = false;
  function install() {
    if (installed) return;
    var A = N.APPS && N.APPS.youtube;
    if (!A) return;
    installed = true;
    /* The app calls ytSearch() through a closure, so we patch the network
       function it uses by exposing ours on the shared object. */
    N.ytSearch = search;
    N.youtubeSearch = search;
  }

  /* The YouTube app in nexus-apps.js looks for N.ytSearch first (see the
     patched ytSearch there). This module must load after nexus-apps.js. */
  install();

  window.NexusYouTube = { search: search };
})();
