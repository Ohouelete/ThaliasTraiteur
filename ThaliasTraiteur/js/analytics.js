/* ================================================================
   Analytics — Google Analytics 4 (loads only if TT_CONFIG.GA_ID set)
   Exposes window.ttTrack(eventName, params) used across the site.
   ================================================================ */
(function () {
  var id = (window.TT_CONFIG && window.TT_CONFIG.GA_ID) || "";
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  if (id) {
    var sc = document.createElement("script");
    sc.async = true;
    sc.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(sc);
    gtag("js", new Date());
    gtag("config", id);
  }

  /* ---- Meta (Facebook/Instagram) Pixel — loads only if META_PIXEL_ID set ---- */
  var pid = (window.TT_CONFIG && window.TT_CONFIG.META_PIXEL_ID) || "";
  if (pid) {
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", pid);
    window.fbq("track", "PageView");
  }

  // Événements de conversion -> événement standard Meta (meilleure optim. pub)
  var META_STD = {
    generate_lead: "Lead", order_submit: "Lead", contact_submit: "Lead",
    whatsapp_click: "Contact", call_click: "Contact"
  };

  /* Envoie un événement à GA4 ET au Pixel (si actifs). */
  window.ttTrack = function (name, params) {
    try { if (id) gtag("event", name, params || {}); } catch (e) {}
    try {
      if (pid && window.fbq) {
        if (META_STD[name]) window.fbq("track", META_STD[name], params || {});
        else window.fbq("trackCustom", name, params || {});
      }
    } catch (e) {}
  };
})();
