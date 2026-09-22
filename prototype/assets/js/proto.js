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
    /* 上架 / 审核状态标签（全局统一配色）：
       已上架 · 上架中 · 已通过 = 绿；未上架 · 已下架 · 草稿 = 灰；
       待审核 = 橙；已驳回 · 不通过 = 红。
       入参可传展示文案（如「已上架」）或存储枚举（如 enabled / on_sale / off）。
       内容列表与商品列表统一调用本方法，勿再各页自行拼 span（R-UI-010）。 */
    shelfTag: function (status) {
      var LABEL = {
        enabled: "已上架", disabled: "已下架",
        on_sale: "上架中", off: "已下架",
        draft: "草稿",
        pending_audit: "待审核", pending: "待平台审核",
        approved: "已通过", rejected: "已驳回"
      };
      var raw = String(status == null ? "" : status);
      var text = LABEL[raw] || raw;
      var cls = "off";
      if (/已上架|上架中|已发布|已通过/.test(text)) cls = "on";
      else if (/待审|审核中/.test(text)) cls = "pending";
      else if (/不通过|已驳回|驳回/.test(text)) cls = "rejected";
      return '<span class="shelf-tag shelf-tag-' + cls + '">' + text + "</span>";
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

/* 评审标注层：加载 prototype/assets 下本仓库自有的 annotate.js / annotate.css。
   数据落盘到 _review/annotations.json，服务为 _review/serve.py。
   隐藏方式：localStorage.setItem('proto:review', 'off') */
(function () {
  try {
    if (localStorage.getItem("proto:review") === "off") return;
  } catch (e) {}
  if (window.__PROTO_REVIEW_LOADED__ || document.getElementById("__ann_js")) return;

  /* 页面可能在 prototype/ 或 prototype/{admin,ops,miniprogram}/ 下，
     按当前深度取相对路径，保证 file:// 直开也能加载。 */
  var base = /\/(admin|ops|miniprogram)\//.test(location.pathname) ? "../assets/" : "assets/";

  var l = document.createElement("link");
  l.id = "__ann_css";
  l.rel = "stylesheet";
  l.href = base + "css/annotate.css?v=2";
  document.head.appendChild(l);

  var s = document.createElement("script");
  s.id = "__ann_js";
  s.src = base + "js/annotate.js?v=2";
  s.defer = true;
  document.head.appendChild(s);
})();
