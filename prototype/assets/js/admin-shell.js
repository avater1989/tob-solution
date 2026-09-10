/* Mix shell per docs/DESIGN.md: Top modules + Side + Main + Assist */
/* v4 (2026-09-04): 精简侧栏，移除公客池/工单中心/系统管理/加群/组织角色权限；提升"主播促到"为顶级模块 */
/* v5 (2026-09-05): 增强容错 - 缺失 page-content 时显示重试提示而非静默失败 */
/* v7: 去掉商家内部复核；工作台 / 直播列表走平台审核 */
(function () {
  if (!window.ProtoBiz) {
    try {
      var cur = document.currentScript;
      var src = (cur && cur.src)
        ? cur.src.replace(/admin-shell\.js[^/]*$/, "prototype-business-store.js")
        : "../assets/js/prototype-business-store.js";
      var xhr = new XMLHttpRequest();
      xhr.open("GET", src, false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
        (0, eval)(xhr.responseText);
      }
    } catch (eLoad) {}
  }

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
  var showAssist = false; // 操作助手已隐藏（原 data-assist="1" 开关）
  var showNotice = document.body.getAttribute("data-notice") !== "0";
  var showReview = document.body.getAttribute("data-review") !== "0"; // data-review="0" 可隐藏评审路径

  var modules = [
    { id: "workbench", label: "工作台", href: "dashboard.html" },
    { id: "scrm", label: "SCRM", href: "leads.html" },
    { id: "live", label: "直播", href: "lives.html" },
    { id: "content", label: "内容", href: "content-series.html" },
    { id: "trade", label: "交易", href: "orders.html" },
    { id: "user", label: "用户", href: "users.html" },
    { id: "data", label: "经营分析", href: "board-overview.html" },
    { id: "sys", label: "系统管理", href: "sys-users.html" },
  ];

  var sidebars = {
    workbench: [
      { group: "概览", links: [{ id: "dashboard", href: "dashboard.html", label: "工作台" }] },
    ],
    scrm: [
      {
        group: "全域获客",
        links: [
          { id: "videos", href: "videos.html", label: "视频号" },
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
          { id: "invite", href: "live-invite.html", label: "直播促到SOP" },
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
          { id: "live-booking", href: "live-booking.html", label: "预约管理" },
          { id: "live-replay", href: "live-replay.html", label: "直播回放" },
          { id: "live-stats", href: "live-stats.html", label: "直播数据" },
        ],
      },
    ],
    content: [
      {
        group: "内容管理",
        links: [
          { id: "content-series",   href: "content-series.html",   label: "系列课" },
          { id: "content-video",    href: "content-video.html",    label: "视频" },
          { id: "content-article",  href: "content-article.html",  label: "图文" },
          { id: "content-category", href: "content-category.html", label: "商品分组" },
        ],
      },
    ],
    trade: [
      {
        group: "订单管理",
        links: [
          { id: "orders", href: "orders.html", label: "订单列表" },
          { id: "ship", href: "ship.html", label: "发货管理", badge: 3 },
          { id: "refunds", href: "refunds.html", label: "订单退款" },
        ],
      },
      {
        group: "商品管理",
        links: [
          { id: "goods", href: "goods.html", label: "我的商品" },
          { id: "goods-edit", href: "goods-edit.html", label: "新建商品" },
        ],
      },
      {
        group: "售后管理",
        links: [
          { id: "aftersales", href: "aftersales.html", label: "售后维权", badge: 4 },
        ],
      },
      {
        group: "资产管理",
        links: [
          { id: "assets", href: "assets.html", label: "资产总览" },
          { id: "bills", href: "bills.html", label: "交易账单" },
          { id: "withdraw", href: "withdraw.html", label: "提现管理" },
          { id: "recon", href: "recon.html", label: "对账管理", badge: 2 },
          { id: "settlement", href: "settlement.html", label: "结算单", badge: 2 },
        ],
      },
      {
        group: "交易设置",
        links: [
          { id: "freight", href: "freight.html", label: "运费模板" },
          { id: "payment", href: "payment.html", label: "收款账户" },
          { id: "invoice", href: "invoice.html", label: "开票设置" },
          { id: "trade-opts", href: "trade-settings.html", label: "交易选项" },
        ],
      },
    ],
    user: [
      {
        group: "用户管理",
        links: [
          { id: "users", href: "users.html", label: "用户列表" },
          { id: "user-tags", href: "user-tags.html", label: "标签管理" },
        ],
      },
    ],
    sys: [
      {
        group: "系统用户管理",
        links: [
          { id: "sys-users", href: "sys-users.html", label: "用户列表" },
          { id: "depts", href: "depts.html", label: "部门管理" },
          { id: "user-roles", href: "user-roles.html", label: "用户角色" },
          { id: "permissions", href: "permissions.html", label: "权限配置" },
        ],
      },
    ],
    data: [
      {
        group: "经营分析",
        links: [
          { id: "board-o", href: "board-overview.html", label: "总览" },
          { id: "board-t", href: "board-term-review.html", label: "期次经营复盘" },
          { id: "board-a", href: "board-acquire.html", label: "获客" },
          { id: "board-p", href: "board-private.html", label: "私域转化" },
          { id: "board-l", href: "board-live.html", label: "直播" },
          { id: "board-c", href: "board-convert.html", label: "交易" },
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
      "<li><a href='content-series.html'>① 内容售卖</a></li>" +
      "<li><a href='lives.html'>② 直播转化</a></li>" +
      "<li><a href='orders.html'>③ 订单管理</a></li>" +
      "<li><a href='leads.html'>④ 私域运营</a></li></ul></div>",
    "live-invite":
      "<div class='assist-block'><h3>直播促到SOP</h3><ul>" +
      "<li>面向私域人群配置直播前邀约、预约后催到、开播中召回、回放触达和会后跟进</li>" +
      "<li>支持按标签 / 期次 / 阶段筛选并排除已购等</li>" +
      "<li>与预约管理中的系统提醒职责分离</li></ul></div>",
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
      "<li>支付成功开通权益，退款成功回收权益</li>" +
      "<li>资金：备付金分账示意（服务费 1% + 商户 99%）</li>" +
      "<li>T+1 自动对账，差异处理后才可结算</li></ul></div>" +
      "<div class='assist-block'><h3>交易路径</h3><ul>" +
      "<li><a href='orders.html'>① 订单列表</a></li>" +
      "<li><a href='goods.html'>② 商品管理</a></li>" +
      "<li><a href='aftersales.html'>③ 售后维权</a></li>" +
      "<li><a href='assets.html'>④ 资产管理</a></li>" +
      "<li><a href='trade-settings.html'>⑤ 交易设置</a></li></ul></div>",
    user:
      "<div class='assist-block'><h3>用户提示</h3><ul>" +
      "<li>MVP 支持手动打标与标签管理</li>" +
      "<li>批量打标读取「标签管理」中启用的标签</li>" +
      "<li>公域订单用户进入同一视图</li></ul></div>" +
      "<div class='assist-block'><h3>用户路径</h3><ul>" +
      "<li><a href='users.html'>① 用户列表</a></li>" +
      "<li><a href='user-tags.html'>② 标签管理</a></li>" +
      "<li><a href='user-roles.html'>③ 用户角色</a></li>" +
      "<li><a href='permissions.html'>④ 权限配置</a></li></ul></div>",
    data:
      "<div class='assist-block'><h3>链路看板</h3><ul>" +
      "<li>业务主链：获客→承接→跟进→直播→转化</li>" +
      "<li>主漏斗：入池→分配→加微→支付</li>" +
      "<li>到课/跟进为旁路，详见口径文档</li></ul></div>",
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
    var pendingAs = 0;
    try {
      if (window.ProtoBiz) {
        pendingAs = ProtoBiz.load().aftersales.filter(function (a) {
          return a.status === "pending_merchant";
        }).length;
      }
    } catch (e) {}
    var html = '<div class="sidebar-module-label">当前模块</div>';
    groups.forEach(function (g) {
      html += '<div class="nav-group"><div class="nav-label">' + g.group + "</div>";
      g.links.forEach(function (l) {
        var cls = "nav-item" + (l.id === active ? " active" : "");
        var badgeVal = l.badge;
        if (l.id === "aftersales" && window.ProtoBiz) badgeVal = pendingAs || 0;
        var badge = badgeVal ? '<span class="nav-badge">' + badgeVal + "</span>" : "";
        var href = l.href;
        if (window.BoardMetrics && /^board-/.test(href)) {
          href = BoardMetrics.buildDrilldownUrl(href);
        }
        html += '<a class="' + cls + '" href="' + href + '"><span class="nav-text">' + l.label + "</span>" + badge + "</a>";
      });
      html += "</div>";
    });
    return html;
  }

  var review =
    '<div class="review-bar">' +
    "<strong>评审路径</strong>" +
    '<a href="content-series.html">①内容售卖</a><span class="sep">·</span>' +
    '<a href="lives.html">②直播转化</a><span class="sep">·</span>' +
    '<a href="orders.html">③订单管理</a><span class="sep">·</span>' +
    '<a href="leads.html">④私域运营</a><span class="sep">|</span>' +
    '<a href="../ops/dashboard.html">切运营后台</a><span class="sep">·</span>' +
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
    '<a class="admin-brand" href="dashboard.html"><div class="logo">艺</div>商家管理后台</a>' +
    '<div class="admin-tenant">商户 <b>星启家庭教育</b></div>' +
    '<nav class="admin-modules">' +
    modulesHtml() +
    "</nav>" +
    '<div class="admin-top-actions">' +
    '<button type="button" class="icon-btn" data-toast="全局搜索（后续）" title="搜索">⌕</button>' +
    '<button type="button" class="icon-btn" data-toast="通知中心（示意）" title="通知">◉</button>' +
    '<div class="admin-user-wrap" id="admin-user-wrap">' +
    '<button type="button" class="admin-user" id="admin-user-btn">赵老师 <i class="caret">▾</i></button>' +
    '<div class="user-dropdown" id="user-dropdown">' +
    '<div class="udd-hd"><b>赵老师</b><br><span>商户管理员 · 星启家庭教育</span></div>' +
    '<button type="button" class="udd-item" id="udd-profile">个人信息</button>' +
    '<button type="button" class="udd-item" id="udd-password">修改密码</button>' +
    '<div class="udd-sep"></div>' +
    '<button type="button" class="udd-item udd-logout" id="udd-logout">退出登录</button>' +
    "</div></div>" +
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
  if (showReview) document.body.insertAdjacentHTML("afterbegin", review);
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

  // 整页跳转后侧栏 scrollTop 会归零；把当前选中项滚入可视区
  (function scrollActiveNavIntoView() {
    var activeNav = document.querySelector(".sidebar .nav-item.active");
    if (!activeNav) return;
    if (typeof activeNav.scrollIntoView === "function") {
      activeNav.scrollIntoView({ block: "center", inline: "nearest" });
    }
  })();

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

  // ===== 顶栏用户下拉：修改密码 / 退出登录 =====
  var userBtn = document.getElementById("admin-user-btn");
  var userMenu = document.getElementById("user-dropdown");
  if (userBtn && userMenu) {
    userBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      userMenu.classList.toggle("open");
    });
    document.addEventListener("click", function () {
      userMenu.classList.remove("open");
    });
    userMenu.addEventListener("click", function (e) { e.stopPropagation(); });

    // 修改密码弹窗（注入一次）
    var pwdMask = document.createElement("div");
    pwdMask.className = "proto-mask";
    pwdMask.id = "pwd-mask";
    pwdMask.innerHTML =
      '<div class="proto-modal" id="pwd-modal" style="width:440px">' +
      '<div class="proto-modal-hd"><h3 style="font-size:16px;font-weight:600">修改密码</h3>' +
      '<button type="button" class="btn btn-sm btn-ghost" id="pwd-close">×</button></div>' +
      '<div class="proto-modal-bd"><div class="field" style="margin-bottom:10px"><label>原密码 *</label>' +
      '<input type="password" id="pwd-old" placeholder="请输入原密码" style="width:100%" /></div>' +
      '<div class="field" style="margin-bottom:10px"><label>新密码 *</label>' +
      '<input type="password" id="pwd-new" placeholder="8-20 位，含字母与数字" style="width:100%" /></div>' +
      '<div class="field" style="margin-bottom:4px"><label>确认新密码 *</label>' +
      '<input type="password" id="pwd-new2" placeholder="再次输入新密码" style="width:100%" /></div>' +
      '<p class="muted" style="font-size:12px">修改成功后将自动退出登录，需使用新密码重新登录。</p></div>' +
      '<div class="proto-modal-ft" style="padding:12px 20px;display:flex;gap:8px;justify-content:flex-end;border-top:1px solid var(--color-border)">' +
      '<button type="button" class="btn" id="pwd-cancel">取消</button>' +
      '<button type="button" class="btn btn-primary" id="pwd-submit">确认修改</button></div></div>';
    document.body.appendChild(pwdMask);

    function closePwd() {
      pwdMask.classList.remove("open");
      document.getElementById("pwd-modal").classList.remove("open");
    }
    function openPwd() {
      ["pwd-old", "pwd-new", "pwd-new2"].forEach(function (id) { document.getElementById(id).value = ""; });
      pwdMask.classList.add("open");
      document.getElementById("pwd-modal").classList.add("open");
    }
    pwdMask.addEventListener("click", closePwd);
    document.getElementById("pwd-close").addEventListener("click", closePwd);
    document.getElementById("pwd-cancel").addEventListener("click", closePwd);
    document.getElementById("pwd-submit").addEventListener("click", function () {
      var oldV = document.getElementById("pwd-old").value;
      var newV = document.getElementById("pwd-new").value;
      var new2 = document.getElementById("pwd-new2").value;
      if (!oldV || !newV || !new2) { Proto.toast("请填写完整密码信息"); return; }
      if (newV !== new2) { Proto.toast("两次输入的新密码不一致"); return; }
      if (newV.length < 8 || !/[a-zA-Z]/.test(newV) || !/\d/.test(newV)) {
        Proto.toast("新密码需 8-20 位且包含字母与数字");
        return;
      }
      closePwd();
      Proto.toast("密码修改成功，即将退出登录（原型）");
      setTimeout(function () { location.href = "../login.html"; }, 1200);
    });

    document.getElementById("udd-profile").addEventListener("click", function () {
      userMenu.classList.remove("open");
      Proto.toast("个人信息（原型）");
    });
    document.getElementById("udd-password").addEventListener("click", function () {
      userMenu.classList.remove("open");
      openPwd();
    });
    document.getElementById("udd-logout").addEventListener("click", function () {
      userMenu.classList.remove("open");
      location.href = "../login.html";
    });
  }
  // 标记加载成功，供外部 watchdog 检测
  document.documentElement.setAttribute("data-shell-ready", "1");
})();
