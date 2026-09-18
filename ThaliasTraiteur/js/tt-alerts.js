/* Themed SweetAlert2 helpers (fallback to native alert if Swal missing). */
(function () {
  function has() { return typeof window.Swal !== "undefined"; }
  window.ttAlert = {
    error: function (text, title) {
      if (!has()) { alert(text); return Promise.resolve(); }
      return Swal.fire({ icon: "error", title: title || "Oups…", html: text, confirmButtonText: "OK" });
    },
    success: function (html, title) {
      if (!has()) { alert((title ? title + "\n" : "") + (html || "").replace(/<[^>]+>/g, "")); return Promise.resolve(); }
      return Swal.fire({ icon: "success", title: title || "Merci !", html: html, confirmButtonText: "Parfait" });
    },
    toast: function (text, icon) {
      if (!has()) return Promise.resolve();
      return Swal.fire({ toast: true, position: "top-end", icon: icon || "success", title: text, showConfirmButton: false, timer: 2400, timerProgressBar: true });
    },
    confirm: function (text, title) {
      if (!has()) return Promise.resolve(window.confirm(text));
      return Swal.fire({ icon: "warning", title: title || "Confirmer ?", text: text, showCancelButton: true, confirmButtonText: "Oui", cancelButtonText: "Annuler" }).then(function (r) { return r.isConfirmed; });
    }
  };

  /* Live inline form validation: red outline + message under the field,
     and a discreet top-right toast. No blocking modal. */
  function clearField(el) {
    if (!el) return;
    el.classList.remove("tt-invalid");
    var next = el.nextElementSibling;
    if (next && next.classList.contains("tt-field-err")) next.remove();
  }
  function failField(el, msg) {
    if (!el) return;
    el.classList.add("tt-invalid");
    var next = el.nextElementSibling;
    if (!(next && next.classList.contains("tt-field-err"))) {
      var s = document.createElement("div");
      s.className = "tt-field-err";
      s.innerHTML = '<i class="fas fa-circle-exclamation"></i> ' + msg;
      el.insertAdjacentElement("afterend", s);
    }
    if (!el._ttBound) {
      el._ttBound = true;
      var clr = function () { if (("" + el.value).trim()) clearField(el); };
      el.addEventListener("input", clr);
      el.addEventListener("change", clr);
    }
  }
  window.ttForm = {
    clearField: clearField,
    failField: failField,
    clearAll: function (scope) {
      (scope || document).querySelectorAll(".tt-invalid").forEach(clearField);
    },
    // rules: [{ id, test?(value)->bool, msg }]. Missing test => required (non-empty).
    check: function (rules) {
      window.ttForm.clearAll();
      var first = null;
      rules.forEach(function (r) {
        var el = document.getElementById(r.id);
        if (!el) return;
        var v = ("" + (el.value || "")).trim();
        var ok = r.test ? r.test(v) : !!v;
        if (!ok) { failField(el, r.msg); if (!first) first = el; }
      });
      if (first) {
        if (first.focus) first.focus();
        if (window.ttAlert) window.ttAlert.toast("Veuillez corriger les champs en rouge.", "error");
        return false;
      }
      return true;
    }
  };
})();
