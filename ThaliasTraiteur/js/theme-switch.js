/* ================================================================
   Theme switcher — cycles the site palette via <html data-theme="…">
   Themes are defined in css/style.css (:root[data-theme="…"]).
   Choice is persisted in localStorage under "tt-theme".
   To lock a single theme: remove the #themeToggle button + this
   script from index.html, and (optionally) hard-set data-theme
   on the <html> tag.
   ================================================================ */
(function () {
  var KEY = "tt-theme";
  var THEMES = ["ivoire", "classic", "dark"];
  var LABELS = {
    ivoire: "Ivoire (drapeau)",
    classic: "Classic (Sarab)",
    dark: "Dark (shadcn)",
  };
  // icon shown = the NEXT theme (what a click switches to)
  var ICONS = { ivoire: "fa-sun", classic: "fa-utensils", dark: "fa-moon" };
  var root = document.documentElement;

  function current() {
    return root.getAttribute("data-theme") || "ivoire";
  }
  function nextOf(theme) {
    return THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  }

  function refreshBtn(btn, theme) {
    if (!btn) return;
    var nxt = nextOf(theme);
    btn.title = "Passer au thème : " + (LABELS[nxt] || nxt);
    var ic = btn.querySelector("i");
    if (ic) ic.className = "fas " + ICONS[nxt];
  }

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(KEY, theme);
    } catch (e) {}
    refreshBtn(document.getElementById("themeToggle"), theme);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("themeToggle");
    refreshBtn(btn, current());
    if (!btn) return;
    btn.addEventListener("click", function () {
      var i = THEMES.indexOf(current());
      apply(THEMES[(i + 1) % THEMES.length]);
    });
  });
})();
