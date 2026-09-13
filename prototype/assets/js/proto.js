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
    /* 分享二维码（示意）：由链接确定性生成的类 QR 图形，同一链接图形一致，可离线渲染 */
    qrSvg: function (text, size) {
      size = size || 160;
      var N = 25;
      var s = String(text || "");
      var h = 2166136261;
      for (var i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = (h * 16777619) >>> 0;
      }
      function on(x, y) {
        var v = (h ^ (x * 73856093) ^ (y * 19349663)) >>> 0;
        v = (v * 2654435761) >>> 0;
        return ((v >>> 13) & 1) === 1;
      }
      function inFinder(x, y, ox, oy) {
        return x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
      }
      function finderOn(x, y, ox, oy) {
        var dx = x - ox, dy = y - oy;
        if (dx === 0 || dx === 6 || dy === 0 || dy === 6) return true;
        if (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) return true;
        return false;
      }
      var rects = "";
      for (var y = 0; y < N; y++) {
        for (var x = 0; x < N; x++) {
          var filled;
          if (inFinder(x, y, 0, 0)) filled = finderOn(x, y, 0, 0);
          else if (inFinder(x, y, N - 7, 0)) filled = finderOn(x, y, N - 7, 0);
          else if (inFinder(x, y, 0, N - 7)) filled = finderOn(x, y, 0, N - 7);
          else if (x === 6 || y === 6) filled = (x + y) % 2 === 0;
          else filled = on(x, y);
          if (filled) rects += '<rect x="' + x + '" y="' + y + '" width="1.02" height="1.02"/>';
        }
      }
      return (
        '<svg viewBox="0 0 ' + N + " " + N + '" width="' + size + '" height="' + size +
        '" role="img" aria-label="分享二维码（示意）" style="display:block">' +
        '<rect width="' + N + '" height="' + N + '" fill="#fff"/>' +
        '<g fill="#1d2129">' + rects + "</g></svg>"
      );
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

/* 评审标注层：自动加载 annotate.css / annotate.js，全站页面按 Alt+E 即可标注。
   隐藏方式：localStorage.setItem('proto:review', 'off') */
(function () {
  try {
    if (localStorage.getItem("proto:review") === "off") return;
  } catch (e) {}
  var self = document.currentScript;
  var base = "";
  if (self && self.src) {
    base = self.src.replace(/\/js\/proto\.js.*$/, "/");
  } else {
    base = /\/(admin|ops|miniprogram)\//.test(location.pathname) ? "../assets/" : "assets/";
  }
  if (document.getElementById("__ann_css")) return;
  var l = document.createElement("link");
  l.id = "__ann_css";
  l.rel = "stylesheet";
  l.href = base + "css/annotate.css?v=1";
  document.head.appendChild(l);
  var s = document.createElement("script");
  s.id = "__ann_js";
  s.src = base + "js/annotate.js?v=1";
  s.defer = true;
  document.head.appendChild(s);
})();
