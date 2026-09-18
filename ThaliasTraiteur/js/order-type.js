/* ================================================================
   Order type — global choice that drives the whole ordering UX.
     "livraison"  -> portions + prices shown
     "evenement"  -> number of people, prices hidden (devis)
   Chosen at the first add (popup chooser) or via the nav buttons.
   Persisted in localStorage["tt-ordertype"].
   Must load BEFORE cart.js and the popup scripts.
   ================================================================ */
(function () {
  var KEY = "tt-ordertype";

  var TTOrder = {
    type: function () { try { return localStorage.getItem(KEY) || null; } catch (e) { return null; } },
    set: function (t) {
      try { localStorage.setItem(KEY, t); } catch (e) {}
      try { document.dispatchEvent(new CustomEvent("tt-order-change")); } catch (e) {}
    },
    clear: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      try { document.dispatchEvent(new CustomEvent("tt-order-change")); } catch (e) {}
    },
    needsChoice: function () { return !this.type(); },
    isEvent: function () { return this.type() === "evenement"; },
    unitWord: function (n) { return this.isEvent() ? (n > 1 ? "personnes" : "personne") : (n > 1 ? "portions" : "portion"); },

    /* Reflect the current type on the dish popup */
    applyPopup: function (t) {
      t = t || this.type() || "livraison";
      var ev = (t === "evenement");
      var price = document.getElementById("mpPrice");
      var meta = document.getElementById("mpMeta");
      var stars = document.getElementById("mpStars");
      var qlab = document.getElementById("mpQtyLabel");
      var add = document.getElementById("mpAddCart");
      if (price) price.style.display = ev ? "none" : "";
      if (meta) meta.style.display = ev ? "none" : "";
      if (stars) stars.style.display = ev ? "none" : "";
      if (qlab) qlab.textContent = ev ? "personnes" : "portion(s)";
      if (add) add.innerHTML = ev
        ? '<i class="fas fa-plus"></i> Ajouter à ma sélection'
        : '<i class="fas fa-shopping-cart"></i> Ajouter à ma commande';
    },

    /* Decide chooser vs product view when a dish popup opens */
    ensureView: function (onReady) {
      var pop = document.getElementById("menuPop");
      var chooser = pop && pop.querySelector(".mpchooser");
      var view = pop && pop.querySelector(".mpview");
      var self = this;
      function reveal() {
        if (chooser) chooser.style.display = "none";
        if (view) view.style.display = "";
        self.applyPopup();
        if (onReady) onReady();
      }
      if (this.needsChoice() && chooser && view) {
        view.style.display = "none";
        chooser.style.display = "";
        chooser.querySelectorAll("[data-choose]").forEach(function (b) {
          b.onclick = function () { self.set(b.getAttribute("data-choose")); reveal(); };
        });
      } else {
        reveal();
      }
    }
  };
  /* Reflect the current type on any segmented toggles (popup + cart) */
  function refreshToggles() {
    var t = TTOrder.type();
    document.querySelectorAll("[data-ordtoggle]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-ordtoggle") === t);
    });
  }
  TTOrder.refreshToggles = refreshToggles;

  // Reflect the type on <html> so CSS can hide unit prices in event mode
  function syncRoot() {
    document.documentElement.setAttribute("data-ordtype", TTOrder.type() || "");
  }
  TTOrder.syncRoot = syncRoot;

  function popupOpen() {
    var p = document.getElementById("menuPop");
    return p && p.classList.contains("open");
  }

  window.TTOrder = TTOrder;

  document.addEventListener("click", function (e) {
    // Nav buttons: set the type (then the link navigates)
    var nav = e.target.closest("[data-set-order]");
    if (nav) { TTOrder.set(nav.getAttribute("data-set-order")); return; }
    // In-place toggle (popup / cart): change type and update live
    var tog = e.target.closest("[data-ordtoggle]");
    if (tog) {
      TTOrder.set(tog.getAttribute("data-ordtoggle"));
      if (popupOpen()) TTOrder.applyPopup();
    }
  });

  // Keep toggles + open popup in sync whenever the type changes
  document.addEventListener("tt-order-change", function () {
    refreshToggles();
    syncRoot();
    if (popupOpen()) TTOrder.applyPopup();
  });
  document.addEventListener("DOMContentLoaded", function () { refreshToggles(); syncRoot(); });
  syncRoot(); // set as early as possible
})();
