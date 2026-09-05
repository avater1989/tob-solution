/* Shared prototype helpers */
(function () {
  window.Proto = {
    toast: function (msg) {
      var el = document.getElementById("proto-toast");
      if (!el) {
        el = document.createElement("div");
        el.id = "proto-toast";
        el.className = "toast";
        document.body.appendChild(el);
      }
      el.textContent = msg;
      el.classList.add("show");
      clearTimeout(el._t);
      el._t = setTimeout(function () {
        el.classList.remove("show");
      }, 2200);
    },
    qs: function (sel) {
      return document.querySelector(sel);
    },
  };

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-toast]");
    if (t) {
      e.preventDefault();
      Proto.toast(t.getAttribute("data-toast"));
    }
  });
})();
