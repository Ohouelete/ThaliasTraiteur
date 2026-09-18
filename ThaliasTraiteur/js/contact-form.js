/* Contact page — real submit (Formspree if configured, else mailto) + confirmation. */
(function () {
  function cfg(k, d) { return (window.TT_CONFIG && window.TT_CONFIG[k]) || d; }
  function v(id) { var e = document.getElementById(id); return e ? (e.value || "").trim() : ""; }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("contactBtn");
    if (!btn) return;

    // Clean keys: readable in Formspree AND usable as EmailJS template vars.
    function payload() {
      var nom = v("cNom") || "Client";
      var subject = (v("cSujet") || "Nouveau message") + " — " + nom;
      var preheader = nom + " attend ta réponse";
      var details = ["Nom : " + v("cNom"), "Courriel : " + v("cMail"), "Téléphone : " + v("cTel"),
        "Sujet : " + v("cSujet"), "", v("cMsg")].join("\n");
      // Recap block: only filled lines (Gmail-safe, no empty rows)
      var R = [];
      if (v("cSujet")) R.push("Objet : " + v("cSujet"));
      R.push("");
      R.push("Message :");
      R.push(v("cMsg"));
      var recap = R.join("\n");
      return {
        "_subject": subject, "subject": subject, "preheader": preheader,
        "name": v("cNom"), "email": v("cMail"), "_replyto": v("cMail"), "reply_to": v("cMail"),
        "phone": v("cTel") || "—", "topic": v("cSujet"),
        "recap": recap,
        "message": v("cMsg"), "details": details
      };
    }
    function done() {
      if (window.ttTrack) window.ttTrack("contact_submit", {});
      var card = document.querySelector("#contact-section .fcard") || btn.closest(".fcard");
      if (card) {
        card.innerHTML = '<div class="order-done"><i class="fas fa-circle-check"></i>' +
          '<h3>Merci ' + (v("cNom") ? v("cNom").split(" ")[0] : "") + ' !</h3>' +
          "<p>Votre message a bien été envoyé. Nous vous répondons sous <strong>" +
          cfg("REPLY_TIME", "24 h") + "</strong>.</p></div>";
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (window.ttAlert) window.ttAlert.toast("Message envoyé !");
    }
    function mailtoFallback() {
      var p = payload();
      window.location.href = "mailto:" + cfg("CONTACT_EMAIL", "contact@thaliastraiteur.ca") +
        "?subject=" + encodeURIComponent(p["_subject"]) + "&body=" + encodeURIComponent(p["details"] + "\n\nMerci !");
      done();
    }

    btn.addEventListener("click", function () {
      var rules = [
        { id: "cNom", msg: "Indiquez votre nom." },
        { id: "cMail", test: function (x) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x); }, msg: "Adresse courriel invalide." },
        { id: "cMsg", msg: "Écrivez votre message." }
      ];
      if (window.ttForm && !window.ttForm.check(rules)) return;
      if (!window.ttMail || window.ttMail.provider() === "mailto") { mailtoFallback(); return; }
      var old = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi…'; btn.disabled = true;
      window.ttMail.send(payload(), { template: cfg("EMAILJS_TEMPLATE_ID_CONTACT", "") })
        .then(function () { done(); })
        .catch(function () { btn.innerHTML = old; btn.disabled = false; mailtoFallback(); });
    });
  });
})();
