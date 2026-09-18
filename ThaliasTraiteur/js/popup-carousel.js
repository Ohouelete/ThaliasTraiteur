/* ================================================================
   Dish popup carousel — cycles through a dish's accompaniment photos
   Usage: TTCarousel.load("img/a.jpg,img/b.jpg", "alt")  (or an array)
   ================================================================ */
(function () {
  var track, dots, prev, next, imgs = [], idx = 0, timer = null;

  function els() {
    track = document.getElementById("mpCarTrack");
    dots = document.getElementById("mpCarDots");
    prev = document.getElementById("mpCarPrev");
    next = document.getElementById("mpCarNext");
  }
  function go(i) {
    if (!imgs.length) return;
    idx = (i + imgs.length) % imgs.length;
    if (track) track.style.transform = "translateX(" + (-idx * 100) + "%)";
    if (dots) Array.prototype.forEach.call(dots.children, function (d, k) {
      d.classList.toggle("active", k === idx);
    });
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function start() { stop(); if (imgs.length > 1) timer = setInterval(function () { go(idx + 1); }, 2800); }

  function load(src, alt) {
    els();
    if (!track) return;
    imgs = Array.isArray(src) ? src : ("" + (src || "")).split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    track.innerHTML = imgs.map(function (u) {
      return '<div class="mpcar-slide"><img src="' + u + '" alt="' + (alt || "") + '" /></div>';
    }).join("");
    if (dots) dots.innerHTML = imgs.map(function (_, k) { return '<button type="button" class="mpcar-dot" data-i="' + k + '"></button>'; }).join("");
    var multi = imgs.length > 1;
    if (prev) prev.style.display = multi ? "" : "none";
    if (next) next.style.display = multi ? "" : "none";
    if (dots) dots.style.display = multi ? "" : "none";
    idx = 0; go(0); start();
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("#mpCarPrev")) { stop(); go(idx - 1); }
    else if (e.target.closest("#mpCarNext")) { stop(); go(idx + 1); }
    else {
      var d = e.target.closest(".mpcar-dot");
      if (d) { stop(); go(parseInt(d.getAttribute("data-i"), 10)); }
    }
  });

  window.TTCarousel = { load: load, stop: stop };
})();
