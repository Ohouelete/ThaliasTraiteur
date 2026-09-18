/* ================================================================
   Widgets de conversion — bouton WhatsApp flottant + tracking des
   contacts (WhatsApp, téléphone). Piloté par js/config.js.
   Aucune dépendance FontAwesome (logo WhatsApp en SVG inline).
   ================================================================ */
(function () {
  function cfg(k, d) { return (window.TT_CONFIG && window.TT_CONFIG[k]) || d; }
  function track(name, params) {
    // ttTrack route déjà vers GA4 + Meta (mapping standard dans analytics.js)
    try { if (window.ttTrack) window.ttTrack(name, params || {}); } catch (e) {}
  }

  var WA = cfg("WHATSAPP", "");            // ex "15145493405" (sans +)
  var MSG = cfg("WHATSAPP_MSG", "Bonjour Thalia's Traiteur !");

  /* Aligné et proportionné comme le bouton #btt (haut de page) :
     même colonne (right:28px), mêmes dimensions (44x44, radius 11px). */
  var CSS = [
    ".tt-fab{position:fixed;right:28px;bottom:28px;z-index:9990;display:flex;flex-direction:column;align-items:center}",
    ".tt-wa{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:11px;",
    "background:#25D366;box-shadow:0 6px 18px rgba(0,0,0,.28);transition:transform .3s ease,box-shadow .3s ease;cursor:pointer}",
    ".tt-wa:hover{transform:translateY(-4px)}",
    ".tt-wa svg{width:24px;height:24px;fill:#fff;display:block}",
    ".tt-wa-lbl{position:absolute;right:54px;top:50%;transform:translateY(-50%) translateX(6px);background:#111;color:#fff;",
    "font:600 13px/1 system-ui,sans-serif;padding:9px 12px;border-radius:8px;white-space:nowrap;opacity:0;pointer-events:none;transition:.18s}",
    ".tt-wa-wrap{position:relative;display:inline-flex}",
    ".tt-wa-wrap:hover .tt-wa-lbl{opacity:1;transform:translateY(-50%) translateX(0)}",
    /* le bouton \"haut de page\" s'empile juste au-dessus du WhatsApp, même colonne */
    "#btt{right:28px!important;bottom:84px!important}",
    "@media(max-width:600px){.tt-fab{right:18px;bottom:18px}#btt{right:18px!important;bottom:74px!important}}"
  ].join("");

  var WA_SVG = '<svg viewBox="0 0 32 32" role="img" aria-hidden="true"><path d="M16.01 3.2c-7.06 0-12.8 5.73-12.8 12.79 0 2.25.59 4.45 1.71 6.39L3.2 28.8l6.6-1.73a12.76 12.76 0 0 0 6.2 1.58h.01c7.05 0 12.79-5.74 12.79-12.8 0-3.42-1.33-6.63-3.75-9.05A12.7 12.7 0 0 0 16.01 3.2Zm0 23.02h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-3.92 1.03 1.05-3.82-.25-.4a10.6 10.6 0 0 1-1.62-5.65c0-5.86 4.77-10.62 10.63-10.62 2.84 0 5.5 1.11 7.51 3.12a10.55 10.55 0 0 1 3.11 7.51c0 5.86-4.77 10.63-10.62 10.63Zm5.83-7.96c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.18-.32-.02-.49.14-.65.15-.14.32-.37.48-.55.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.35-.26-.62-.52-.54-.71-.55l-.61-.01c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.23 3.4 5.4 4.77.75.32 1.34.52 1.8.66.76.24 1.44.21 1.99.13.61-.09 1.89-.77 2.16-1.52.27-.75.27-1.38.19-1.52-.08-.13-.29-.21-.61-.37Z"/></svg>';

  function build() {
    if (!WA) return; // pas de numéro -> pas de bouton
    var href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(MSG);
    var fab = document.createElement("div");
    fab.className = "tt-fab";
    fab.innerHTML =
      '<span class="tt-wa-wrap">' +
      '  <span class="tt-wa-lbl">Écrivez-nous sur WhatsApp</span>' +
      '  <a class="tt-wa" href="' + href + '" target="_blank" rel="noopener" aria-label="Contacter sur WhatsApp">' + WA_SVG + '</a>' +
      '</span>';
    document.body.appendChild(fab);
    fab.querySelector(".tt-wa").addEventListener("click", function () {
      track("whatsapp_click", { channel: "whatsapp" });
    });
  }

  function trackTel() {
    document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
      a.addEventListener("click", function () { track("call_click", { channel: "phone" }); });
    });
  }

  function fillTrust() {
    var mapaq = cfg("MAPAQ_NUMBER", "");
    if (mapaq) {
      document.querySelectorAll("[data-mapaq]").forEach(function (el) {
        el.innerHTML = "Cuisine conforme aux normes d'hygiène du Québec — <b>permis MAPAQ n° "
          + mapaq + "</b>.";
      });
    }
    var zone = cfg("ZONE", "");
    if (zone) {
      document.querySelectorAll("[data-zone]").forEach(function (el) {
        el.innerHTML = "Traiteur assuré et ponctuel, dressage soigné. Service dans <b>" + zone + "</b>.";
      });
    }
  }

  function injectSeo() {
    if (document.querySelector('script[type="application/ld+json"]')) return;
    var origin = (location.origin && location.origin.indexOf("http") === 0) ? location.origin : "";
    var sameAs = [cfg("FACEBOOK_URL", ""), cfg("INSTAGRAM_URL", ""), cfg("TIKTOK_URL", "")]
      .filter(function (u) { return !!u; });
    var data = {
      "@context": "https://schema.org", "@type": "Caterer",
      "name": "Thalia's Traiteur",
      "description": "Traiteur cuisine ivoirienne & du monde au Québec : mariages, réceptions, entreprises. Fait maison.",
      "servesCuisine": ["Ivoirienne", "Africaine", "Cuisine du monde"],
      "telephone": cfg("PHONE_E164", ""),
      "email": cfg("CONTACT_EMAIL", ""),
      "priceRange": "$$",
      "areaServed": cfg("ZONE", "Québec"),
      "address": { "@type": "PostalAddress", "addressRegion": "QC", "addressCountry": "CA" }
    };
    if (origin) { data.url = origin + "/"; data.image = origin + "/img/banner-img.webp"; data.logo = origin + "/img/logo.webp"; }
    if (sameAs.length) data.sameAs = sameAs;
    var wa = cfg("WHATSAPP", ""); if (wa) data.contactPoint = { "@type": "ContactPoint", "contactType": "customer service", "telephone": "+" + wa };
    var s = document.createElement("script"); s.type = "application/ld+json";
    s.textContent = JSON.stringify(data); document.head.appendChild(s);
  }

  function init() {
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    build(); trackTel(); fillTrust(); injectSeo();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
