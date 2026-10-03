/* C 端小程序：评审导航条 + 底部 3 Tab（首页 / 艺博士 / 我的） */
(function () {
  if (!window.ProtoPhase2) {
    try {
      var curPhase = document.currentScript;
      var phaseSrc = (curPhase && curPhase.src)
        ? curPhase.src.replace(/mp-shell\.js[^/]*$/, "phase2-config.js?v=7")
        : "../assets/js/phase2-config.js";
      var xhrPhase = new XMLHttpRequest();
      xhrPhase.open("GET", phaseSrc, false);
      xhrPhase.send(null);
      if (xhrPhase.status >= 200 && xhrPhase.status < 300 && xhrPhase.responseText) {
        (0, eval)(xhrPhase.responseText);
      }
    } catch (ePhase) {}
  }
  var PH2 = window.ProtoPhase2 || {
    enabled: function () { return false; },
    setEnabled: function () {},
    isPhase2: function () { return false; },
  };
  var phase2On = PH2.enabled();

  // ===== 内容区「二期」标记：带 data-phase2-only 的元素随二期开关显隐 =====
  (function applyPhase2Marks() {
    if (!document.getElementById("phase2-mark-css")) {
      var st = document.createElement("style");
      st.id = "phase2-mark-css";
      st.textContent = "html:not(.phase2-on) [data-phase2-only]{display:none!important}";
      document.head.appendChild(st);
    }
    document.documentElement.classList.toggle("phase2-on", phase2On);
  })();

  var tab = document.body.getAttribute("data-tab") || "";
  var showTab = document.body.getAttribute("data-tabbar") !== "0";

  var review =
    '<div class="review-bar" style="width:100%;border-radius:0">' +
    "<strong>C 端小程序</strong>" +
    '<a href="home.html">首页</a><span class="sep">·</span>' +
    '<a href="learning.html">艺博士</a><span class="sep">·</span>' +
    '<a href="assess.html">测评</a><span class="sep">·</span>' +
    '<a href="lives.html">直播</a><span class="sep">·</span>' +
    '<a href="plan.html">定制化计划</a><span class="sep">·</span>' +
    '<a href="orders.html">订单</a><span class="sep">·</span>' +
    '<a href="mine.html">我的</a><span class="sep">|</span>' +
    '<a href="../admin/dashboard.html">切管理端</a><span class="sep">·</span>' +
    '<a href="../index.html">导航</a><span class="sep">|</span>' +
    '<button type="button" class="phase2-toggle' + (phase2On ? " on" : "") + '" id="phase2-toggle" aria-pressed="' + (phase2On ? "true" : "false") + '" title="显示/隐藏二期能力（当前：' + (phase2On ? "显示" : "隐藏") + '）">二期</button>' +
    "</div>";

  document.body.insertAdjacentHTML("afterbegin", review);

  var phase2ToggleBtn = document.getElementById("phase2-toggle");
  if (phase2ToggleBtn) {
    phase2ToggleBtn.addEventListener("click", function () {
      PH2.setEnabled(!PH2.enabled());
      location.reload();
    });
  }

  if (!showTab) return;
  var frame = document.querySelector(".mp-frame");
  if (!frame) return;

  var ico = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-5.5h5V20"/></svg>',
    yibo: '<img src="../assets/img/ip/yibo-face.svg" alt="" />',
    mine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.5" r="3.5"/><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/></svg>'
  };

  var bar = document.createElement("div");
  bar.className = "mp-tabbar";
  bar.innerHTML =
    '<a class="' + (tab === "home" ? "active" : "") + '" href="home.html"><span class="ico">' + ico.home + "</span>首页</a>" +
    '<a class="' + (tab === "learn" ? "active" : "") + '" href="learning.html"><span class="ico">' + ico.yibo + "</span>艺博士</a>" +
    '<a class="' + (tab === "mine" ? "active" : "") + '" href="mine.html"><span class="ico">' + ico.mine + "</span>我的</a>";
  frame.appendChild(bar);
})();
