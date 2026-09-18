/* ================================================================
   Thalia's Traiteur — mail router
   One send() used by every form. Picks the provider from TT_CONFIG
   (formspree | emailjs | mailto | auto) and loads the EmailJS SDK
   locally, on demand, only when it's actually needed.
   send(params, opts) -> Promise. Resolves on success, rejects on
   failure OR when the resolved provider is "mailto" (so the caller
   performs its own mailto fallback).
   ================================================================ */
(function () {
  function cfg(k, d) {
    var v = window.TT_CONFIG ? window.TT_CONFIG[k] : undefined;
    return (v === undefined || v === null || v === "") ? d : v;
  }

  function provider() {
    var p = ("" + cfg("MAIL_PROVIDER", "auto")).toLowerCase();
    if (p === "auto") {
      if (cfg("EMAILJS_PUBLIC_KEY", "") && cfg("EMAILJS_SERVICE_ID", "")) return "emailjs";
      if (cfg("FORM_ENDPOINT", "")) return "formspree";
      return "mailto";
    }
    return p;
  }

  var ejsLoad = null;
  function loadEmailJs() {
    if (window.emailjs) return Promise.resolve(window.emailjs);
    if (ejsLoad) return ejsLoad;
    ejsLoad = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "js/emailjs.min.js";
      s.onload = function () {
        try { window.emailjs.init({ publicKey: cfg("EMAILJS_PUBLIC_KEY", "") }); } catch (e) {}
        resolve(window.emailjs);
      };
      s.onerror = function () { reject(new Error("emailjs SDK failed to load")); };
      document.head.appendChild(s);
    });
    return ejsLoad;
  }

  function sendFormspree(params) {
    var ep = cfg("FORM_ENDPOINT", "");
    if (!ep) return Promise.reject(new Error("formspree endpoint missing"));
    return fetch(ep, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(params)
    }).then(function (r) { if (!r.ok) throw new Error("formspree HTTP " + r.status); return r; });
  }

  function sendEmailJs(params, opts) {
    var svc = cfg("EMAILJS_SERVICE_ID", "");
    var tpl = (opts && opts.template) || cfg("EMAILJS_TEMPLATE_ID", "");
    var key = cfg("EMAILJS_PUBLIC_KEY", "");
    if (!svc || !tpl || !key) return Promise.reject(new Error("emailjs not fully configured"));
    return loadEmailJs().then(function (ej) { return ej.send(svc, tpl, params, key); });
  }

  window.ttMail = {
    provider: provider,
    /* opts.template -> EmailJS template id override (contact vs order) */
    send: function (params, opts) {
      var pv = provider();
      if (pv === "emailjs") return sendEmailJs(params, opts);
      if (pv === "formspree") return sendFormspree(params);
      return Promise.reject(new Error("mailto")); // caller does its mailto fallback
    }
  };
})();
