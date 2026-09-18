/* ================================================================
   Thalia's Traiteur — Cart (e-commerce style)
   - Add dishes from the dish popup ("Ajouter à ma commande")
   - Persists in localStorage; badge + slide-in drawer
   - Feeds the devis form: pre-selects the Select2 "Plats souhaités"
   Shared by index.html and menu.html.
   ================================================================ */
(function () {
  var KEY = "tt-cart";

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
  }
  function write(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
    render();
    syncSelect();
    try { document.dispatchEvent(new CustomEvent("tt-cart-change")); } catch (e) {}
  }
  function parsePrice(p) {
    if (typeof p === "number") return p;
    var m = ("" + p).replace(",", ".").match(/[\d.]+/);
    return m ? parseFloat(m[0]) : 0;
  }

  var API = {
    items: read,
    count: function () { return read().reduce(function (s, i) { return s + i.qty; }, 0); },
    total: function () { return read().reduce(function (s, i) { return s + i.qty * i.price; }, 0); },
    add: function (name, price, qty, silent) {
      if (!name) return;
      qty = qty || 1;
      var items = read();
      var ex = items.filter(function (i) { return i.name === name; })[0];
      if (ex) ex.qty += qty;
      else items.push({ name: name, price: parsePrice(price), qty: qty });
      write(items);
      if (window.ttTrack) window.ttTrack("add_to_cart", { item_name: name, quantity: qty, value: parsePrice(price) * qty, currency: "CAD" });
      if (!silent) {
        if (window.ttAlert) window.ttAlert.toast((ex ? "Quantité mise à jour" : "Ajouté au panier") + " — " + name, "success");
        openDrawer(true); // brief peek, then auto-closes
      }
    },
    setQty: function (name, qty) {
      var items = read();
      for (var i = 0; i < items.length; i++) {
        if (items[i].name === name) { items[i].qty = qty; break; }
      }
      items = items.filter(function (it) { return it.qty > 0; });
      write(items);
    },
    remove: function (name) {
      write(read().filter(function (i) { return i.name !== name; }));
    },
    clear: function () { write([]); }
  };
  window.TTCart = API;

  /* ---------- Drawer + overlay (injected once) ---------- */
  function buildDrawer() {
    if (document.getElementById("ttCartDrawer")) return;
    var wrap = document.createElement("div");
    wrap.innerHTML =
      '<div class="tt-cart-overlay" id="ttCartOverlay"></div>' +
      '<aside class="tt-cart-drawer" id="ttCartDrawer" aria-hidden="true">' +
      '  <div class="tt-cart-head">' +
      '    <h4>Mon panier</h4>' +
      '    <button class="tt-cart-close" data-cart-close aria-label="Fermer"><i class="fas fa-times"></i></button>' +
      '  </div>' +
      '  <div class="tt-cart-typebar"><span class="lbl">Type</span>' +
      '    <div class="ordtoggle">' +
      '      <button type="button" data-ordtoggle="livraison"><i class="fas fa-truck-fast"></i>Livraison</button>' +
      '      <button type="button" data-ordtoggle="evenement"><i class="fas fa-champagne-glasses"></i>Événement</button>' +
      '    </div>' +
      '  </div>' +
      '  <div class="tt-cart-body" id="ttCartBody"></div>' +
      '  <div class="tt-cart-foot" id="ttCartFoot"></div>' +
      "</aside>";
    document.body.appendChild(wrap);
    if (window.TTOrder && window.TTOrder.refreshToggles) window.TTOrder.refreshToggles();
  }

  var autoTimer = null;
  function clearAuto() { if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; } }
  function openDrawer(auto) {
    var d = document.getElementById("ttCartDrawer");
    var o = document.getElementById("ttCartOverlay");
    if (d) { d.classList.add("open"); d.setAttribute("aria-hidden", "false"); }
    if (o) o.classList.add("open");
    document.body.style.overflow = "hidden";
    clearAuto();
    // opened after an "add to cart": auto-close unless the user interacts
    if (auto && d) {
      autoTimer = setTimeout(closeDrawer, 1900);
      // cancel ONLY on real review gestures (hover / scroll inside the drawer).
      // NOT touchstart/click: on mobile the add-tap lands on the full-width
      // drawer and would cancel the timer instantly (it stayed open).
      var cancel = function () { clearAuto(); };
      ["mouseenter", "wheel", "touchmove"].forEach(function (ev) {
        d.addEventListener(ev, cancel, { once: true, passive: true });
      });
    }
  }
  function closeDrawer() {
    clearAuto();
    var d = document.getElementById("ttCartDrawer");
    var o = document.getElementById("ttCartOverlay");
    if (d) { d.classList.remove("open"); d.setAttribute("aria-hidden", "true"); }
    if (o) o.classList.remove("open");
    document.body.style.overflow = "";
  }

  function money(n) {
    return (Math.round(n * 100) / 100).toFixed(0) + " $";
  }

  /* ---------- Mark menu cards that are already in the cart ---------- */
  function markCards() {
    var names = read().map(function (i) { return i.name; });
    document.querySelectorAll(".mcard[data-title]").forEach(function (card) {
      var inCart = names.indexOf(card.getAttribute("data-title")) > -1;
      card.classList.toggle("in-cart", inCart);
      var add = card.querySelector(".madd");
      if (add) add.innerHTML = inCart ? '<i class="fas fa-check"></i>' : '<i class="fas fa-plus"></i>';
    });
  }

  /* ---------- Render badge + drawer contents ---------- */
  function render() {
    markCards();
    var items = read();
    var count = API.count();
    var ev = window.TTOrder && window.TTOrder.isEvent();
    function unit(q) { return q + " " + (ev ? (q > 1 ? "personnes" : "personne") : (q > 1 ? "portions" : "portion")); }
    // badges
    var badges = document.querySelectorAll(".tt-cart-count");
    for (var b = 0; b < badges.length; b++) {
      badges[b].textContent = count;
      badges[b].style.display = count > 0 ? "flex" : "none";
    }
    // Inline summary (commander page)
    var sum = document.getElementById("cartSummary");
    if (sum) {
      if (!items.length) {
        sum.innerHTML = '<h3>Votre commande</h3><p class="cartsum-empty">Votre panier est vide. Ajoutez des plats depuis le <a class="editlink" href="menu.html">menu</a>.</p>';
      } else {
        var sr = items.map(function (i) {
          return '<div class="cartsum-row"><div><div class="n">' + escapeHtml(i.name) +
            '</div><div class="q">' + unit(i.qty) + '</div></div><div class="p">' +
            (ev ? "" : money(i.price * i.qty)) + "</div></div>";
        }).join("");
        var totalHtml = ev
          ? '<div class="cartsum-total"><span>Total</span><b style="font-size:1rem;">Sur devis</b></div>'
          : '<div class="cartsum-total"><span>Total estimé</span><b>' + money(API.total()) + "</b></div>";
        sum.innerHTML = "<h3>Votre commande</h3>" + sr + totalHtml +
          '<p style="margin-top:12px;margin-bottom:0;"><a class="editlink" href="#" data-cart-toggle>Modifier le panier</a></p>';
      }
    }

    var body = document.getElementById("ttCartBody");
    var foot = document.getElementById("ttCartFoot");
    if (!body || !foot) return;

    if (!items.length) {
      body.innerHTML =
        '<div class="tt-cart-empty"><i class="fas fa-basket-shopping"></i>' +
        "<p>Votre panier est vide.</p><span>Ajoutez des plats depuis le menu.</span>" +
        '<a class="tt-cart-continue" data-cart-continue href="menu.html" style="max-width:240px;margin:22px auto 0;"><i class="fas fa-arrow-left"></i>Voir le menu</a></div>';
      foot.innerHTML = "";
      return;
    }

    var rows = items.map(function (i) {
      return (
        '<div class="tt-cart-item" data-name="' + escapeAttr(i.name) + '">' +
        '  <div class="tt-ci-main">' +
        '    <div class="tt-ci-name">' + escapeHtml(i.name) + "</div>" +
        '    <div class="tt-ci-price">' + (ev ? "Sur devis" : money(i.price) + " / portion") + "</div>" +
        "  </div>" +
        '  <div class="tt-ci-qty">' +
        '    <button data-cart-dec aria-label="moins">−</button>' +
        '    <input class="tt-ci-qtyv" type="number" min="1" step="1" value="' + i.qty + '" inputmode="numeric" aria-label="Quantité" />' +
        '    <button data-cart-inc aria-label="plus">+</button>' +
        "  </div>" +
        '  <button class="tt-ci-del" data-cart-del aria-label="retirer"><i class="fas fa-trash-can"></i></button>' +
        "</div>"
      );
    }).join("");
    body.innerHTML = rows;

    foot.innerHTML =
      (ev
        ? '<div class="tt-cart-total"><span>Total</span><b style="font-size:1.1rem;">Sur devis</b></div>' +
          '<p class="tt-cart-note">Commande événement — un devis personnalisé vous sera confirmé.</p>'
        : '<div class="tt-cart-total"><span>Total estimé</span><b>' + money(API.total()) + "</b></div>" +
          '<p class="tt-cart-note">Prix indicatifs par portion — le total final vous sera confirmé.</p>') +
      '<a class="tt-cart-continue" data-cart-continue href="menu.html"><i class="fas fa-arrow-left"></i>Continuer mes choix</a>' +
      '<a class="btn-ed--solid tt-cart-checkout" data-cart-checkout>Finaliser ma commande</a>' +
      '<button class="tt-cart-clear" data-cart-clear>Vider le panier</button>';
  }

  function escapeHtml(s) {
    return ("" + s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
  }
  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;"); }

  /* ---------- Sync the devis Select2 with cart ---------- */
  function syncSelect() {
    var sel = document.getElementById("devisPlats");
    if (!sel) return;
    var names = read().map(function (i) { return i.name; });
    if (window.jQuery && window.jQuery(sel).data("select2")) {
      window.jQuery(sel).val(names).trigger("change");
    } else {
      // plain fallback
      for (var o = 0; o < sel.options.length; o++) {
        sel.options[o].selected = names.indexOf(sel.options[o].value) > -1;
      }
    }
  }
  window.TTCartSync = syncSelect;

  /* ---------- Checkout: go to the devis form ---------- */
  function checkout() {
    closeDrawer();
    // On the commander page (has #cartSummary): scroll to the form. Elsewhere: go there.
    if (document.getElementById("cartSummary")) {
      var form = document.getElementById("reservation");
      if (form) { syncSelect(); form.scrollIntoView({ behavior: "smooth", block: "start" }); }
    } else {
      window.location.href = "commander.html";
    }
  }

  /* ---------- Event delegation ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (t.closest("[data-cart-toggle]")) { e.preventDefault(); openDrawer(); }
    else if (t.closest("[data-cart-close]") || t.id === "ttCartOverlay") closeDrawer();
    else if (t.closest("[data-cart-continue]")) {
      // On the menu page: just close the drawer. Elsewhere: let the link go to menu.html.
      if (document.getElementById("mgrid")) { e.preventDefault(); closeDrawer(); }
    }
    else if (t.closest("[data-cart-checkout]")) { e.preventDefault(); checkout(); }
    else if (t.closest("[data-cart-clear]")) API.clear();
    else if (t.closest("[data-cart-inc]")) {
      var it1 = t.closest(".tt-cart-item"); adjust(it1, +1);
    } else if (t.closest("[data-cart-dec]")) {
      var it2 = t.closest(".tt-cart-item"); adjust(it2, -1);
    } else if (t.closest("[data-cart-del]")) {
      var it3 = t.closest(".tt-cart-item"); if (it3) API.remove(it3.getAttribute("data-name"));
    }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

  // Typeable qty in the drawer: commit on change/blur, clamp to >= 1
  document.addEventListener("change", function (e) {
    var inp = e.target.closest ? e.target.closest(".tt-ci-qtyv") : null;
    if (!inp) return;
    var itemEl = inp.closest(".tt-cart-item");
    if (!itemEl) return;
    var n = Math.max(1, Math.floor(parseFloat(inp.value)) || 1);
    API.setQty(itemEl.getAttribute("data-name"), n);
  });

  function adjust(itemEl, delta) {
    if (!itemEl) return;
    var name = itemEl.getAttribute("data-name");
    var cur = read().filter(function (i) { return i.name === name; })[0];
    if (cur) API.setQty(name, cur.qty + delta);
  }

  /* Re-render when the order type changes (portions/personnes, prices) */
  document.addEventListener("tt-order-change", function () { render(); });

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    buildDrawer();
    render();
    syncSelect();
  });
})();
