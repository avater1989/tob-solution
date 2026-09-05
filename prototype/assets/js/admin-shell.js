/* Mix shell per docs/DESIGN.md: Top modules + Side + Main + Assist */
/* v4 (2026-09-04): 精简侧栏，移除公客池/工单中心/系统管理/加群/组织角色权限；提升"主播促到"为顶级模块 */
/* v5 (2026-09-05): 增强容错 - 缺失 page-content 时显示重试提示而非静默失败 */
(function () {
  // 全局错误捕获 - 避免脚本异常导致页面全裸
  window.addEventListener("error", function (e) {
    if (document.body && !document.querySelector(".admin-app")) {
      var err = document.createElement("div");
      err.style.cssText = "position:fixed;top:0;left:0;right:0;background:#fff1f0;color:#f53f3f;padding:12px 20px;border-bottom:1px solid #ffa39e;z-index:99999;font-size:13px;";
      err.innerHTML = "<b>页面初始化失败</b>：可能是浏览器缓存了旧版本。请按 <kbd style='background:#fff;padding:2px 6px;border-radius:3px;border:1px solid #ffa39e;'>Ctrl+Shift+R</kbd> 强制刷新，或 <button onclick='location.reload();' style='background:#165dff;color:#fff;border:none;padding:4px 12px;border-radius:4px;cursor:pointer;margin-left:8px;'>点击重试</button>";
      document.body.appendChild(err);
    }
  });
  var moduleId = document.body.getAttribute("data-module") || "workbench";
  var active = document.body.getAttribute("data-nav") || "";
  var title = document.body.getAttribute("data-title") || "管理端";
  var crumb = document.body.getAttribute("data-crumb") || "";
  var showAssist = document.body.getAttribute("data-assist") === "1";
  var showNotice = document.body.getAttribute("data-notice") !== "0";

  var modules = [
    { id: "workbench", label: "工作台", href: "dashboard.html" },
    { id: "scrm", label: "SCRM", href: "scrm-overview.html" },
    { id: "live", label: "直播", href: "lives.html" },
    { id: "content", label: "内容", href: "courses.html" },
    { id: "trade", label: "交易", href: "orders.html" },
    { id: "user", label: "用户", href: "users.html" },
    { id: "data", label: "数据", href: "board-acquire.html" },
  ];

  var sidebars = {
    workbench: [
      { group: "概览", links: [{ id: "dashboard", href: "dashboard.html", label: "工作台" }] },
    ],
    "live-invite": [
      { group: "直播促到", links: [{ id: "invite", href: "live-invite.html", label: "直播促到SOP" }] },
    ],
    scrm: [
      {
        group: "直播促到",
        links: [{ id: "invite", href: "live-invite.html", label: "直播促到SOP" }],
      },
      {
        group: "公域获客",
        links: [
          { id: "ch-products", href: "channels-products.html", label: "视频号商品" },
          { id: "ch-orders", href: "channels-orders.html", label: "视频号订单" },
        ],
      },
      {
        group: "客户中心",
        links: [
          { id: "leads", href: "leads.html", label: "线索池" },
          { id: "follow", href: "follow-ups.html", label: "跟进管理" },
          { id: "group-follow", href: "group-follow.html", label: "企微群跟进" },
          { id: "rules-cfg", href: "rules-config.html", label: "规则配置" },
          { id: "approval", href: "approval.html", label: "审批管理" },
          { id: "wecom-inherit", href: "wecom-inherit.html", label: "客户继承" },
          { id: "wecom-churn", href: "wecom-churn.html", label: "流失提醒" },
          { id: "leads-dup", href: "leads-dup.html", label: "重复线索" },
        ],
      },
      {
        group: "营销管理",
        links: [
          { id: "welcome", href: "welcome.html", label: "欢迎语管理" },
          { id: "acquire-link", href: "acquire-links.html", label: "获客链接" },
          { id: "channel-code", href: "channel-livecode.html", label: "渠道活码" },
          { id: "group-code", href: "group-livecode.html", label: "群活码管理" },
          { id: "group-tpl", href: "group-template.html", label: "拉群模板" },
          { id: "mass-customer", href: "mass-customer.html", label: "客户群发" },
          { id: "mass-group", href: "mass-group.html", label: "客户群群发" },
          { id: "mass-moment", href: "mass-moment.html", label: "群发朋友圈" },
          { id: "quick-task", href: "quick-tasks.html", label: "快捷任务" },
          { id: "sop-personal", href: "sop-personal.html", label: "个人SOP" },
          { id: "sop-group", href: "sop-group.html", label: "群SOP" },
          { id: "todo-cal", href: "todo-calendar.html", label: "待办日历" },
        ],
      },
      {
        group: "内容中心",
        links: [
          { id: "material", href: "material.html", label: "助销素材库" },
          { id: "phrases", href: "phrases.html", label: "快捷话术库" },
          { id: "quick-form", href: "quick-form.html", label: "自定义表单" },
        ],
      },
      {
        group: "业务设置",
        links: [
          { id: "channel-mgmt", href: "channel-mgmt.html", label: "渠道管理" },
          { id: "sidebar-mgmt", href: "sidebar-mgmt.html", label: "侧边栏管理" },
        ],
      },
    ],
    live: [
      {
        group: "直播",
        links: [
          { id: "lives", href: "lives.html", label: "直播列表" },
          { id: "live-edit", href: "live-edit.html", label: "创建直播" },
          { id: "live-booking", href: "live-booking.html", label: "预约与推送" },
          { id: "live-share", href: "live-share.html", label: "分享邀请" },
          { id: "live-replay", href: "live-replay.html", label: "直播回放" },
          { id: "live-stats", href: "live-stats.html", label: "直播数据" },
          { id: "live-control", href: "live-control.html", label: "中控台" },
          { id: "live-screen", href: "live-screen.html", label: "直播大屏" },
          { id: "live-preview", href: "live-preview.html", label: "预告页预览" },
        ],
      },
      {
        group: "直播审核",
        links: [
          { id: "live-audit", href: "live-audit.html", label: "审核工作台", badge: 12 },
          { id: "live-rejected", href: "live-rejected.html", label: "驳回记录" },
          { id: "live-audit-detail", href: "live-audit-detail.html", label: "审核详情" },
        ],
      },
    ],
    content: [
      {
        group: "课程",
        links: [
          { id: "courses", href: "courses.html", label: "课程列表" },
          { id: "course-edit", href: "course-edit.html", label: "创建课程" },
        ],
      },
    ],
    trade: [
      {
        group: "订单",
        links: [
          { id: "orders", href: "orders.html", label: "订单列表" },
          { id: "order-detail", href: "order-detail.html", label: "订单详情" },
        ],
      },
    ],
    user: [
      {
        group: "用户",
        links: [
          { id: "users", href: "users.html", label: "用户列表" },
          { id: "user-detail", href: "user-detail.html", label: "用户详情" },
        ],
      },
    ],
    data: [
      {
        group: "专题看板",
        links: [
          { id: "board-a", href: "board-acquire.html", label: "获客" },
          { id: "board-l", href: "board-live.html", label: "直播" },
          { id: "board-c", href: "board-convert.html", label: "转化" },
        ],
      },
    ],
  };

  var assistCopy = {
    workbench:
      "<div class='assist-block'><h3>快速上手</h3><ol>" +
      "<li>创建并上架线上课</li><li>创建直播并提交审核</li>" +
      "<li>关联视频号商品</li><li>配置期次与促到</li></ol></div>" +
      "<div class='assist-block'><h3>评审路径</h3><ul>" +
      "<li><a href='courses.html'>① 内容售卖</a></li>" +
      "<li><a href='lives.html'>② 直播转化</a></li>" +
      "<li><a href='channels-orders.html'>③ 视频号承接</a></li>" +
      "<li><a href='leads.html'>④ 私域运营</a></li></ul></div>",
    "live-invite":
      "<div class='assist-block'><h3>主播促到</h3><ul>" +
      "<li>视频号直播开播前短信催到</li>" +
      "<li>支持按客户标签 / 期次筛选</li>" +
      "<li>避免同一客户重复触达</li></ul></div>",
    scrm:
      "<div class='assist-block'><h3>现网对齐</h3><ol>" +
      "<li>客户中心 / 营销管理 / 内容中心</li>" +
      "<li>业务设置</li>" +
      "<li>页面归属与字段对照真路径</li></ol></div>" +
      "<div class='assist-block'><h3>评审路径</h3><ul>" +
      "<li><a href='leads.html'>线索池</a></li>" +
      "<li><a href='follow-ups.html'>跟进管理</a></li>" +
      "<li><a href='quick-tasks.html'>快捷任务</a></li></ul></div>",
    live:
      "<div class='assist-block'><h3>直播提示</h3><ul>" +
      "<li>直播可作为独立商品售卖</li>" +
      "<li>多商户场景需审核与录像留痕</li>" +
      "<li>MVP 为小程序直播方案</li></ul></div>",
    content:
      "<div class='assist-block'><h3>内容提示</h3><ul>" +
      "<li>本期仅线上课</li>" +
      "<li>固定 C 端模板：首页/直播/我的</li>" +
      "<li>不做店铺装修与艺博士</li></ul></div>",
    trade:
      "<div class='assist-block'><h3>交易提示</h3><ul>" +
      "<li>支付成功开通权益</li>" +
      "<li>退款成功回收权益</li>" +
      "<li>资金：备付金分账示意</li></ul></div>",
    user:
      "<div class='assist-block'><h3>用户提示</h3><ul>" +
      "<li>MVP 支持手动打标</li>" +
      "<li>公域订单用户进入同一视图</li></ul></div>",
    data:
      "<div class='assist-block'><h3>看板提示</h3><ul>" +
      "<li>获客 / 直播 / 转化三个专题</li>" +
      "<li>一期不做自助分析</li></ul></div>",
  };

  function modulesHtml() {
    return modules
      .map(function (m) {
        return '<a class="' + (m.id === moduleId ? "active" : "") + '" href="' + m.href + '">' + m.label + "</a>";
      })
      .join("");
  }

  function sideHtml() {
    var groups = sidebars[moduleId] || [];
    var html = '<div class="sidebar-module-label">当前模块</div>';
    groups.forEach(function (g) {
      html += '<div class="nav-group"><div class="nav-label">' + g.group + "</div>";
      g.links.forEach(function (l) {
        var cls = "nav-item" + (l.id === active ? " active" : "");
        var badge = l.badge ? '<span class="nav-badge">' + l.badge + '</span>' : '';
        html += '<a class="' + cls + '" href="' + l.href + '">' + l.label + badge + "</a>";
      });
      html += "</div>";
    });
    return html;
  }

  var review =
    '<div class="review-bar">' +
    "<strong>评审路径</strong>" +
    '<a href="courses.html">①内容售卖</a><span class="sep">·</span>' +
    '<a href="lives.html">②直播转化</a><span class="sep">·</span>' +
    '<a href="channels-orders.html">③视频号承接</a><span class="sep">·</span>' +
    '<a href="leads.html">④私域运营</a><span class="sep">|</span>' +
    '<a href="../miniprogram/home.html">切 C 端</a><span class="sep">·</span>' +
    '<a href="../index.html">导航</a>' +
    "</div>";

  var notice = showNotice
    ? '<div class="notice-bar" id="notice-bar">' +
      "<span>公告：MVP 原型 · 侧栏已精简（v4 2026-09-04）· 工作台只在顶部</span>" +
      '<button type="button" class="close-notice" id="close-notice" aria-label="关闭">×</button>' +
      "</div>"
    : "";

  var assist =
    showAssist
      ? '<aside class="assist" id="assist-panel"><div class="assist-block" style="display:flex;justify-content:space-between;align-items:center">' +
        "<h3 style='margin:0'>操作助手</h3>" +
        '<button type="button" class="btn btn-sm btn-ghost" id="hide-assist">收起</button></div>' +
        (assistCopy[moduleId] || "") +
        "</aside>"
      : "";

  var layout =
    '<div class="admin-app">' +
    '<header class="admin-topbar">' +
    '<a class="admin-brand" href="dashboard.html"><div class="logo">艺</div>艺博 To-B</a>' +
    '<div class="admin-tenant">商户 <b>星启家庭教育</b></div>' +
    '<nav class="admin-modules">' +
    modulesHtml() +
    "</nav>" +
    '<div class="admin-top-actions">' +
    '<button type="button" class="icon-btn" data-toast="全局搜索（后续）" title="搜索">⌕</button>' +
    '<button type="button" class="icon-btn" data-toast="通知中心（示意）" title="通知">◉</button>' +
    (showAssist
      ? ""
      : '<button type="button" class="icon-btn" id="show-assist-btn" title="助手">?</button>') +
    '<span class="admin-user">赵老师</span>' +
    "</div></header>" +
    notice +
    '<div class="admin-body-row">' +
    '<aside class="sidebar">' +
    sideHtml() +
    "</aside>" +
    '<div class="main">' +
    '<div class="page-header">' +
    (crumb ? '<div class="breadcrumb">' + crumb + "</div>" : "") +
    '<div class="page-header-row"><h1 id="page-title"></h1><div id="page-header-actions"></div></div>' +
    "</div>" +
    '<div class="content" id="admin-content-slot"></div>' +
    "</div>" +
    assist +
    "</div></div>";

  var content = document.getElementById("page-content");
  if (!content) {
    console.error("[admin-shell] 未找到 #page-content 节点，请检查页面是否正确加载");
    return;
  }

  var headerActions = document.getElementById("header-actions");
  document.body.insertAdjacentHTML("afterbegin", review);
  var wrap = document.createElement("div");
  wrap.innerHTML = layout;
  document.body.appendChild(wrap.firstChild);
  document.getElementById("page-title").textContent = title;
  document.getElementById("admin-content-slot").appendChild(content);
  content.style.display = "block";
  if (headerActions) {
    var slot = document.getElementById("page-header-actions");
    while (headerActions.firstChild) slot.appendChild(headerActions.firstChild);
    headerActions.remove();
  }

  var closeNotice = document.getElementById("close-notice");
  if (closeNotice) {
    closeNotice.addEventListener("click", function () {
      var bar = document.getElementById("notice-bar");
      if (bar) bar.style.display = "none";
    });
  }
  var hideAssist = document.getElementById("hide-assist");
  if (hideAssist) {
    hideAssist.addEventListener("click", function () {
      var panel = document.getElementById("assist-panel");
      if (panel) panel.style.display = "none";
    });
  }
  // 标记加载成功，供外部 watchdog 检测
  document.documentElement.setAttribute("data-shell-ready", "1");
})();
