/* ================================================================
   Menu page — category filter + dish detail popup.
   Standalone (does not depend on main.js, which binds homepage-only
   elements). Mirrors the popup/filter behaviour of the home page.
   ================================================================ */
(function () {
  // Navbar shadow on scroll
  var nav = document.getElementById("nav");
  window.addEventListener("scroll", function () {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 30);
  });

  // ---- Category filter + search ----
  var curCat = "all";
  var curQuery = "";
  function norm(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function applyFilters() {
    var q = norm(curQuery.trim());
    var visible = 0;
    document.querySelectorAll(".mwrap").forEach(function (w) {
      var card = w.querySelector(".mcard");
      var okCat = curCat === "all" || w.getAttribute("data-c") === curCat;
      var okQ = !q || norm(card ? card.getAttribute("data-title") : "").indexOf(q) > -1;
      var show = okCat && okQ;
      w.style.display = show ? "" : "none";
      if (show) visible++;
    });
    var empty = document.getElementById("mNoResult");
    if (empty) empty.style.display = visible === 0 ? "" : "none";
  }
  function filterMenu(cat) {
    curCat = cat;
    document.querySelectorAll(".filtbtn").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-f") === cat);
    });
    applyFilters();
  }
  document.querySelectorAll(".filtbtn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      filterMenu(this.getAttribute("data-f"));
    });
  });

  var searchInput = document.getElementById("mSearch");
  var searchClear = document.getElementById("mSearchClear");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      curQuery = this.value;
      if (searchClear) searchClear.hidden = !curQuery;
      applyFilters();
    });
  }
  if (searchClear) {
    searchClear.addEventListener("click", function () {
      curQuery = "";
      searchInput.value = "";
      this.hidden = true;
      searchInput.focus();
      applyFilters();
    });
  }

  // ---- Dish detail popup ----
  var menuPop = document.getElementById("menuPop");
  var qty = 1;
  var qInput = document.getElementById("mpQnum");
  function setQty(n) {
    qty = Math.max(1, Math.floor(n) || 1);
    if (qInput) qInput.value = qty;
  }
  if (qInput) {
    qInput.addEventListener("input", function () {
      var n = parseInt(this.value, 10);
      qty = (n && n > 0) ? n : 1; // keep raw while typing; clamp on blur
    });
    qInput.addEventListener("blur", function () { setQty(qty); });
  }

  function g(card, k) {
    return card.getAttribute(k);
  }

  function openPop(card) {
    window.__ttDish = { name: g(card, "data-title"), price: g(card, "data-price") };
    if (window.TTCarousel) window.TTCarousel.load(g(card, "data-imgs") || g(card, "data-img"), g(card, "data-title"));
    document.getElementById("mpCat").textContent = g(card, "data-cat");
    document.getElementById("mpTitle").textContent = g(card, "data-title");

    var rating = parseFloat(g(card, "data-rating"));
    var full = Math.round(rating);
    document.getElementById("mpStars").innerHTML =
      '<i class="fas fa-star"></i>'.repeat(full) +
      "☆".repeat(5 - full) +
      ' <span style="color:#bbb;font-size:.78rem;">' +
      rating +
      " (" +
      g(card, "data-reviews") +
      " avis)</span>";

    document.getElementById("mpDesc").textContent = g(card, "data-desc");
    document.getElementById("mpPrice").innerHTML = g(card, "data-price");

    document.getElementById("mpMeta").innerHTML =
      '<div class="mpm"><div class="mpmv">' +
      g(card, "data-cal") +
      '</div><div class="mpml">Portion</div></div>' +
      '<div class="mpm"><div class="mpmv">' +
      g(card, "data-time") +
      '</div><div class="mpml">Délai</div></div>' +
      '<div class="mpm"><div class="mpmv">' +
      rating +
      '/5</div><div class="mpml">Note</div></div>';

    document.getElementById("mpTags").innerHTML = (g(card, "data-tags") || "")
      .split(",")
      .filter(Boolean)
      .map(function (t) {
        return '<span class="mptag">' + t.trim() + "</span>";
      })
      .join("");

    setQty(1);
    document.getElementById("mpAddCart").innerHTML =
      '<i class="fas fa-shopping-cart"></i> Ajouter à ma commande';
    document.getElementById("mpAddCart").style.background = "";

    menuPop.classList.add("open");
    document.body.style.overflow = "hidden";
    if (window.TTOrder) window.TTOrder.ensureView();
  }

  function closePop() {
    menuPop.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.querySelectorAll(".mcard").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (e.target.closest(".mhrt")) return; // heart handled separately
      openPop(card);
    });
  });

  document.getElementById("mpClose").addEventListener("click", closePop);
  menuPop.addEventListener("click", function (e) {
    if (e.target === menuPop) closePop();
  });
  document.getElementById("mpMinus").addEventListener("click", function () {
    setQty(qty - 1);
  });
  document.getElementById("mpPlus").addEventListener("click", function () {
    setQty(qty + 1);
  });
  document.getElementById("mpAddCart").addEventListener("click", function () {
    setQty(qty);
    if (window.TTCart && window.__ttDish) window.TTCart.add(window.__ttDish.name, window.__ttDish.price, qty);
    this.innerHTML = '<i class="fas fa-check"></i> Ajouté !';
    this.style.background = "linear-gradient(135deg,var(--green),var(--green-dark))";
    var self = this;
    setTimeout(function () {
      closePop();
      self.innerHTML = '<i class="fas fa-shopping-cart"></i> Ajouter à ma commande';
      self.style.background = "";
    }, 1000);
  });

  // ---- Heart toggle ----
  document.querySelectorAll(".mhrt").forEach(function (h) {
    h.addEventListener("click", function (e) {
      e.stopPropagation();
      var ic = this.querySelector("i");
      if (ic) {
        ic.classList.toggle("far");
        ic.classList.toggle("fas");
      }
    });
  });
})();
