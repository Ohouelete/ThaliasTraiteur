(function () {
  var slides = document.querySelectorAll(".hero-media .hs-slide");
  if (slides.length < 2) return;

  var current = 0;
  setInterval(function () {
    slides[current].classList.remove("active");
    current = (current + 1) % slides.length;
    slides[current].classList.add("active");
  }, 4500);
})();
