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
    '<a href="../admin/dashboard.html">原型切换·管理端</a><span class="sep">·</span>' +
    '<a href="../index.html">导航</a>' +
    "</div>";

  document.body.insertAdjacentHTML("afterbegin", review);

  if (!showTab) return;
  var frame = document.querySelector(".mp-frame");
  if (!frame) return;

  function icon(name, active) {
    var c = active ? "#165dff" : "#9aa3b2";
    if (name === "home") {
      return (
        '<svg viewBox="0 0 24 24" fill="' +
        (active ? "#165dff" : "none") +
        '" stroke="' +
        c +
        '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" fill-opacity="' +
        (active ? "0.15" : "0") +
        '"/></svg>'
      );
    }
    if (name === "live") {
      return (
        '<svg viewBox="0 0 24 24" fill="none" stroke="' +
        c +
        '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="2.2"/><path d="m16 10.2 5-2.8v9.2l-5-2.8v-3.6z"/><circle cx="9.5" cy="12" r="1.5" fill="' +
        (active ? "#165dff" : "none") +
        '" stroke="none"/></svg>'
      );
    }
    return (
      '<svg viewBox="0 0 24 24" fill="none" stroke="' +
      c +
      '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.3"/><path d="M5.2 19.4c1.3-3.3 3.7-5 6.8-5s5.5 1.7 6.8 5"/></svg>'
    );
  }

  var bar = document.createElement("div");
  bar.className = "mp-tabbar";
  bar.innerHTML =
    '<a class="' +
    (tab === "home" ? "active" : "") +
    '" href="home.html"><span class="ico">' +
    icon("home", tab === "home") +
    "</span>首页</a>" +
    '<a class="' +
    (tab === "live" ? "active" : "") +
    '" href="lives.html"><span class="ico">' +
    icon("live", tab === "live") +
    "</span>直播</a>" +
    '<a class="' +
    (tab === "mine" ? "active" : "") +
    '" href="mine.html"><span class="ico">' +
    icon("mine", tab === "mine") +
    "</span>我的</a>";
  frame.appendChild(bar);
})();
