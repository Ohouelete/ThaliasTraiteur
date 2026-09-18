/* ================================================================
   Order page — two modes (livraison / événement) + dish checklist
   synced two-way with the cart. Replaces Select2. (commander.html)
   ================================================================ */
(function () {
  // name -> price map (for adding via checkbox)
  var PRICE = {
    "Tchep":32,"Riz":32,"Placali Sauce Kopé":32,"Chocouya":27,"Garba":22,"Dôkounou":27,"Abolo":27,
    "Poulet Braisé":27,"Poisson Braisé":27,"Côtelettes de Porc Braisées":29,"Brochettes de Poulet":27,
    "Brochettes de Tilapia":27,"Poulet BBQ et ses Légumes Grillés":27,"Saumon Grillé et ses Légumes":32,
    "Soupe du Chasseur":37,"Soupe du Pêcheur":37,"Escargots Sautés":37,"Gbofloto":17,
    "Beignets Jaune + Vermicelles":17,"Repas d'Ailleurs":12,"Brochettes de Filles Mignons":32,
    "Marmite de Fruits de Mer et Légumes":37,"Salade Crevettes Avocat":17,"Nems ou Rouleaux":17,
    "Salade de Thon":17,"Salade de tomates mozzarella":17,"Salade de tomates au concombre et mozzarella":17,
    "Tomate farcie aux œufs":17,"Salade de tomates aux épices grecques":17,"Salade de tomates":17,
    "Salade de fruits de saison":10,"Crème glacée au baobab":10,"Deguê":10,"Gâteau triple chocolat":10
  };
  var ORDER = Object.keys(PRICE);

  function val(id) { var e = document.getElementById(id); return e ? (e.value || "").trim() : ""; }
  function esc(s){ return (""+s).replace(/[&<>]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;"}[c];}); }
  function money(n){ return Math.round(n) + " $"; }
  function inCart(name){ return window.TTCart && window.TTCart.items().some(function(i){return i.name===name;}); }
  function peopleOf(name){ if(!window.TTCart) return 1; var it=window.TTCart.items().filter(function(i){return i.name===name;})[0]; return it?it.qty:1; }

  document.addEventListener("DOMContentLoaded", function () {

    /* ---- Mode switch ---- */
    var mode = "livraison";
    var btnSubmit = document.getElementById("orderBtn");
    var placeholder = document.getElementById("orderPlaceholder");
    var content = document.getElementById("orderContent");
    function applyMode(m, skipSet) {
      mode = m;
      if (!skipSet && window.TTOrder) window.TTOrder.set(m); // sync global type (cart re-renders)
      if (placeholder) placeholder.style.display = "none";
      if (content) content.style.display = "";
      document.querySelectorAll(".order-mode").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-mode") === m);
      });
      document.querySelectorAll(".js-evt").forEach(function (el) { el.style.display = (m === "evenement") ? "" : "none"; });
      document.querySelectorAll(".js-liv").forEach(function (el) { el.style.display = (m === "livraison") ? "" : "none"; });
      if (btnSubmit) {
        btnSubmit.innerHTML = (m === "evenement")
          ? '<i class="fas fa-file-signature"></i>Demander un devis'
          : '<i class="fas fa-truck"></i>Passer la commande';
      }
      if (m === "evenement") renderChecklist();
    }
    document.querySelectorAll(".order-mode").forEach(function (b) {
      b.addEventListener("click", function () { applyMode(this.getAttribute("data-mode")); });
    });

    /* ---- Dish checklist (event mode) ---- */
    var box = document.getElementById("dishChecklist");
    var shown = []; // names ever shown (keep struck items visible)
    var lastQty = {}; // remember qty when a dish is unchecked, restore on recheck
    function seedShown() {
      if (!window.TTCart) return;
      window.TTCart.items().forEach(function (i) { if (shown.indexOf(i.name) < 0) shown.push(i.name); });
    }
    function renderChecklist() {
      if (!box) return;
      seedShown();
      if (!shown.length) {
        box.innerHTML = '<div class="dishcheck-empty">Aucun plat sélectionné. Ajoutez des plats depuis le <a href="menu.html">menu</a>.</div>';
        return;
      }
      // order by menu order
      var ordered = ORDER.filter(function (n) { return shown.indexOf(n) > -1; });
      shown.forEach(function (n) { if (ordered.indexOf(n) < 0) ordered.push(n); });
      box.innerHTML = ordered.map(function (n) {
        var checked = inCart(n);
        var ppl = checked ? peopleOf(n) : 0;
        return '<label class="dchk' + (checked ? "" : " struck") + '" data-name="' + esc(n) + '">' +
          '<input type="checkbox"' + (checked ? " checked" : "") + ' />' +
          '<span class="box"><i class="fas fa-check"></i></span>' +
          '<span class="lbl">' + esc(n) + (checked ? ' <span style="color:var(--text-muted);font-size:.8rem;">· ' + ppl + ' pers.</span>' : '') + '</span>' +
          '<span class="pr">' + money(PRICE[n] || 0) + '</span>' +
          '</label>';
      }).join("");
    }
    if (box) {
      box.addEventListener("change", function (e) {
        var lab = e.target.closest(".dchk"); if (!lab) return;
        var name = lab.getAttribute("data-name");
        if (e.target.checked) {
          if (!inCart(name)) window.TTCart.add(name, PRICE[name] || 0, lastQty[name] || 1, true); // restore prior qty; silent
        } else {
          lastQty[name] = peopleOf(name); // remember before removing so recheck restores it
          window.TTCart.remove(name);
        }
      });
    }
    // keep checklist in sync when the cart changes elsewhere
    document.addEventListener("tt-cart-change", function () {
      seedShown();
      if (mode === "evenement") renderChecklist();
    });

    /* ---- Compose the order email ---- */
    function cartLines() {
      if (!window.TTCart) return ["   (panier vide)"];
      var items = window.TTCart.items();
      if (!items.length) return ["   (panier vide)"];
      return items.map(function (i) { return "   - " + i.name + " × " + i.qty + " pers. (" + money(i.price * i.qty) + ")"; });
    }
    function total() { return window.TTCart ? money(window.TTCart.total()) : "0 $"; }

    function body() {
      var L = [];
      if (mode === "evenement") {
        L.push("Bonjour Thalia's Traiteur,", "", "Je souhaite un DEVIS TRAITEUR pour un événement :", "");
        L.push("• Nom : " + (val("oNom") || "—"));
        L.push("• Téléphone : " + (val("oTel") || "—"));
        L.push("• Courriel : " + (val("oMail") || "—"));
        L.push("• Type d'événement : " + (val("oType") || "—"));
        L.push("• Date : " + (val("oDateE") || "—"));
        L.push("• Heure : " + (val("oHeureE") || "—"));
        L.push("• Lieu : " + (val("oLieu") || "—"));
      } else {
        L.push("Bonjour Thalia's Traiteur,", "", "Je souhaite passer une COMMANDE À LIVRER :", "");
        L.push("• Nom : " + (val("oNom") || "—"));
        L.push("• Téléphone : " + (val("oTel") || "—"));
        L.push("• Courriel : " + (val("oMail") || "—"));
        L.push("• Date de livraison : " + (val("oDate") || "—"));
        L.push("• Heure : " + (val("oHeure") || "—"));
        L.push("• Adresse de livraison : " + (val("oAdresse") || "—"));
      }
      L.push("", "Plats commandés :");
      L = L.concat(cartLines());
      L.push("", "Total estimé : " + total());
      var m = val("oMsg");
      if (m) { L.push("", "Précisions : " + m); }
      L.push("", "Merci !");
      return L.join("\n");
    }

    function cfg(k, d) { return (window.TT_CONFIG && window.TT_CONFIG[k]) || d; }

    // Clean keys: readable in Formspree AND usable as EmailJS template vars.
    function payload() {
      var items = (window.TTCart ? window.TTCart.items() : []);
      var ev = (mode === "evenement");
      var nom = val("oNom") || "Nouveau client";
      var totalStr = (window.TTCart ? Math.round(window.TTCart.total()) + " $" : "");
      // Inbox-friendly subject + preview text (no emoji)
      var subject, preheader;
      if (ev) {
        subject = "Demande de devis · " + nom + (val("oType") ? " — " + val("oType") : "");
        preheader = [(val("oType") ? "Événement " + val("oType") : "Événement"),
                     "devis à préparer"].filter(Boolean).join(" · ");
      } else {
        subject = "Nouvelle commande · " + nom + (totalStr ? " · " + totalStr : "");
        preheader = [nom, totalStr, "à confirmer sous " + cfg("REPLY_TIME", "24 h")].filter(Boolean).join(" · ");
      }
      var unit = ev ? "personne" : "portion";
      // one dish per line: "Nom — N portion(s)" (email box renders line breaks)
      var dishList = items.map(function (i) {
        return i.name + " — " + i.qty + " " + unit + (i.qty > 1 ? "s" : "");
      }).join("\n");
      // Recap block: only the FILLED lines (no empty rows) -> renders cleanly
      // in every client, incl. Gmail/Pixel which can't hide empty fields.
      var R = [];
      R.push("Type : " + (ev ? "Traiteur / Événement" : "Livraison"));
      if (ev) {
        if (val("oType")) R.push("Événement : " + val("oType"));
        if (val("oDateE")) R.push("Date : " + val("oDateE") + (val("oHeureE") ? "  ·  " + val("oHeureE") : ""));
        if (val("oLieu")) R.push("Lieu : " + val("oLieu"));
      } else {
        if (val("oDate")) R.push("Date : " + val("oDate") + (val("oHeure") ? "  ·  " + val("oHeure") : ""));
        if (val("oAdresse")) R.push("Adresse : " + val("oAdresse"));
      }
      R.push("");
      R.push("Plats :");
      items.forEach(function (i) { R.push("   • " + i.name + " — " + i.qty + " " + unit + (i.qty > 1 ? "s" : "")); });
      R.push("");
      R.push("Total" + (ev ? "" : " estimé") + " : " + (ev ? "Sur devis" : (window.TTCart ? Math.round(window.TTCart.total()) + " $" : "")));
      if (val("oMsg")) { R.push(""); R.push("Précisions : " + val("oMsg")); }
      var recap = R.join("\n");
      return {
        "_subject": subject,          // Formspree subject
        "subject": subject,
        "preheader": preheader,       // inbox preview text
        "order_type": ev ? "Traiteur / Événement" : "Livraison",
        "name": val("oNom"),
        "phone": val("oTel"),
        "email": val("oMail"),        // reply-to
        "_replyto": val("oMail"),
        "reply_to": val("oMail"),
        "event_type": ev ? val("oType") : "",
        "guests": "",
        "date": ev ? val("oDateE") : val("oDate"),
        "time": ev ? val("oHeureE") : val("oHeure"),
        "address": ev ? "" : val("oAdresse"),
        "place": ev ? val("oLieu") : "",
        "topic": "",                  // used by the contact form only
        "dishes": dishList,
        "total": ev ? "Sur devis" : (window.TTCart ? Math.round(window.TTCart.total()) + " $" : ""),
        "message": val("oMsg"),
        "recap": recap,               // clean, filled-only block for the email
        "details": body()
      };
    }

    function confirmDone() {
      if (window.ttTrack) window.ttTrack(mode === "evenement" ? "generate_lead" : "order_submit",
        { value: (window.TTCart ? window.TTCart.total() : 0), currency: "CAD" });
      var content = document.getElementById("orderContent");
      var card = document.querySelector("#reservation .fcard");
      if (card) {
        card.innerHTML =
          '<div class="order-done"><i class="fas fa-circle-check"></i>' +
          '<h3>Merci ' + (val("oNom") ? val("oNom").split(" ")[0] : "") + ' !</h3>' +
          '<p>Votre ' + (mode === "evenement" ? "demande de devis" : "commande") +
          " a bien été envoyée. Notre équipe vous recontacte sous <strong>" + cfg("REPLY_TIME", "24 h") +
          "</strong> pour confirmer les détails" + (mode === "evenement" ? " et votre devis personnalisé." : " et la livraison.") + "</p>" +
          '<a href="menu.html" class="btn-ed--ghost">Retour au menu <i class="fas fa-arrow-right"></i></a></div>';
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      if (window.TTCart) window.TTCart.clear();
      if (window.ttAlert) window.ttAlert.toast(mode === "evenement" ? "Demande de devis envoyée !" : "Commande envoyée !");
    }

    function mailtoFallback() {
      var subject = payload()["_subject"];
      window.location.href = "mailto:" + cfg("CONTACT_EMAIL", "contact@thaliastraiteur.ca") +
        "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body());
      confirmDone();
    }

    var emailOk = function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); };
    var telOk = function (v) { return v.replace(/\D/g, "").length >= 8; };
    function todayStr() {
      var d = new Date();
      return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
    }
    var dateFutureOk = function (v) { return !!v && v >= todayStr(); };
    // block past dates in the native pickers
    ["oDate", "oDateE"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute("min", todayStr());
    });
    function validateForm() {
      var rules = [
        { id: "oNom", msg: "Indiquez votre nom." },
        { id: "oTel", test: telOk, msg: "Numéro de téléphone invalide." },
        { id: "oMail", test: emailOk, msg: "Adresse courriel invalide." }
      ];
      if (mode === "evenement") {
        rules.push({ id: "oDateE", test: dateFutureOk, msg: "Choisissez une date à venir." });
        rules.push({ id: "oHeureE", msg: "Indiquez l'heure de l'événement." });
      } else {
        rules.push({ id: "oDate", test: dateFutureOk, msg: "Choisissez une date à venir." });
        rules.push({ id: "oHeure", msg: "Indiquez l'heure de livraison." });
        rules.push({ id: "oAdresse", msg: "Indiquez l'adresse de livraison." });
      }
      if (window.ttForm) {
        if (!window.ttForm.check(rules)) return false;
      }
      if (!(window.TTCart && window.TTCart.count() > 0)) {
        if (window.ttAlert) window.ttAlert.toast("Ajoutez au moins un plat depuis le menu.", "error");
        return false;
      }
      return true;
    }

    if (btnSubmit) {
      btnSubmit.addEventListener("click", function () {
        if (!validateForm()) return;
        // No configured provider -> mailto right away.
        if (!window.ttMail || window.ttMail.provider() === "mailto") { mailtoFallback(); return; }
        var self = this; var old = self.innerHTML;
        self.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi…'; self.disabled = true;
        window.ttMail.send(payload(), { template: cfg("EMAILJS_TEMPLATE_ID", "") })
          .then(function () { confirmDone(); })
          .catch(function () { self.innerHTML = old; self.disabled = false; mailtoFallback(); });
      });
    }

    // Show the form only if a type was already chosen (nav buttons / dish popup);
    // otherwise keep the indicative placeholder until the user picks a mode.
    var t = window.TTOrder && window.TTOrder.type();
    if (t) applyMode(t, true);
    // react if the type changes elsewhere while on this page
    document.addEventListener("tt-order-change", function () {
      var nt = window.TTOrder && window.TTOrder.type();
      if (nt && nt !== mode) applyMode(nt, true);
    });
  });
})();

