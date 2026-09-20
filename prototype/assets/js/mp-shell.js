/* C 端小程序：评审导航条 + 底部 3 Tab（首页 / 学习 / 我的） */
(function () {
  var tab = document.body.getAttribute("data-tab") || "";
  var showTab = document.body.getAttribute("data-tabbar") !== "0";

  var review =
    '<div class="review-bar" style="width:100%;border-radius:0">' +
    "<strong>C 端小程序</strong>" +
    '<a href="home.html">首页</a><span class="sep">·</span>' +
    '<a href="learning.html">学习</a><span class="sep">·</span>' +
    '<a href="lives.html">直播</a><span class="sep">·</span>' +
    '<a href="ai.html">艺博士</a><span class="sep">·</span>' +
    '<a href="assess.html">测评</a><span class="sep">·</span>' +
    '<a href="plan.html">定制化计划</a><span class="sep">·</span>' +
    '<a href="orders.html">订单</a><span class="sep">·</span>' +
    '<a href="mine.html">我的</a><span class="sep">|</span>' +
    '<a href="../admin/dashboard.html">切管理端</a><span class="sep">·</span>' +
    '<a href="../index.html">导航</a>' +
    "</div>";

  document.body.insertAdjacentHTML("afterbegin", review);

  if (!showTab) return;
  var frame = document.querySelector(".mp-frame");
  if (!frame) return;

  var ico = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-5.5h5V20"/></svg>',
    learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5h7.5a2.5 2.5 0 0 1 2.5 2.5v11a2 2 0 0 0-2-2H4V5.5z"/><path d="M20 5.5h-7.5a2.5 2.5 0 0 0-2.5 2.5v11a2 2 0 0 1 2-2H20V5.5z"/></svg>',
    mine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.5" r="3.5"/><path d="M4.5 20c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"/></svg>'
  };

  var bar = document.createElement("div");
  bar.className = "mp-tabbar";
  bar.innerHTML =
    '<a class="' + (tab === "home" ? "active" : "") + '" href="home.html"><span class="ico">' + ico.home + "</span>首页</a>" +
    '<a class="' + (tab === "learn" ? "active" : "") + '" href="learning.html"><span class="ico">' + ico.learn + "</span>学习</a>" +
    '<a class="' + (tab === "mine" ? "active" : "") + '" href="mine.html"><span class="ico">' + ico.mine + "</span>我的</a>";
  frame.appendChild(bar);
})();
