/* Inject mini-program review bar + optional tabbar */
(function () {
  var tab = document.body.getAttribute("data-tab") || "";
  var showTab = document.body.getAttribute("data-tabbar") !== "0";

  var review =
    '<div class="review-bar" style="width:100%;border-radius:0">' +
    "<strong>C 端小程序</strong>" +
    '<a href="home.html">首页</a><span class="sep">·</span>' +
    '<a href="lives.html">直播</a><span class="sep">·</span>' +
    '<a href="claim.html">领课</a><span class="sep">·</span>' +
    '<a href="mine.html">我的</a><span class="sep">|</span>' +
    '<a href="../admin/dashboard.html">切管理端</a><span class="sep">·</span>' +
    '<a href="../index.html">导航</a>' +
    "</div>";

  document.body.insertAdjacentHTML("afterbegin", review);

  if (!showTab) return;
  var frame = document.querySelector(".mp-frame");
  if (!frame) return;
  var bar = document.createElement("div");
  bar.className = "mp-tabbar";
  bar.innerHTML =
    '<a class="' + (tab === "home" ? "active" : "") + '" href="home.html"><span class="ico">⌂</span>首页</a>' +
    '<a class="' + (tab === "live" ? "active" : "") + '" href="lives.html"><span class="ico">◉</span>直播</a>' +
    '<a class="' + (tab === "mine" ? "active" : "") + '" href="mine.html"><span class="ico">☺</span>我的</a>';
  frame.appendChild(bar);
})();
