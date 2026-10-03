/* 运营后台 Shell：复用商家管理后台（admin-shell.js）的版式与交互
 * 差异点：品牌「运营后台」、平台标识（非商户）、面向平台侧的模块与侧栏、三端互跳导航
 */
(function () {
  if (!window.ProtoBiz) {
    try {
      var curBiz = document.currentScript;
      var bizSrc = (curBiz && curBiz.src)
        ? curBiz.src.replace(/ops-shell\.js[^/]*$/, "prototype-business-store.js")
        : "../assets/js/prototype-business-store.js";
      var xhrBiz = new XMLHttpRequest();
      xhrBiz.open("GET", bizSrc, false);
      xhrBiz.send(null);
      if (xhrBiz.status >= 200 && xhrBiz.status < 300 && xhrBiz.responseText) {
        (0, eval)(xhrBiz.responseText);
      }
    } catch (eLoadBiz) {}
  }

  if (!window.ProtoPhase2) {
    try {
      var curPhase = document.currentScript;
      var phaseSrc = (curPhase && curPhase.src)
        ? curPhase.src.replace(/ops-shell\.js[^/]*$/, "phase2-config.js?v=7")
        : "../assets/js/phase2-config.js";
      var xhrPhase = new XMLHttpRequest();
      xhrPhase.open("GET", phaseSrc, false);
      xhrPhase.send(null);
      if (xhrPhase.status >= 200 && xhrPhase.status < 300 && xhrPhase.responseText) {
        (0, eval)(xhrPhase.responseText);
      }
    } catch (ePhase) {}
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
  var title = document.body.getAttribute("data-title") || "运营后台";
  var crumb = document.body.getAttribute("data-crumb") || "";
  var showAssist = false; // 操作助手已隐藏（原 data-assist="1" 开关）
  var showNotice = document.body.getAttribute("data-notice") !== "0";

  // ===== 一期/二期 开关 =====
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

  /* 二期页面直接访问拦截：一期视图（默认）下显示提示横幅 */
  if (document.body.getAttribute("data-phase2") === "1" && !phase2On) {
    document.body.insertAdjacentHTML("afterbegin",
      '<div class="phase2-guard"><h2>二期能力 · 一期视图下已隐藏</h2>' +
      "<p>当前页属于二期功能，默认不进入一期评审范围。</p>" +
      '<button type="button" class="btn btn-primary" id="phase2-enable">开启二期视图</button>' +
      '<a class="btn" href="../index.html">返回导航</a></div>');
    var phase2Enable = document.getElementById("phase2-enable");
    if (phase2Enable) {
      phase2Enable.addEventListener("click", function () {
        PH2.setEnabled(true);
        location.reload();
      });
    }
    return;
  }

  // 兼容旧页 data-module
  if (moduleId === "audit") moduleId = "content";
  // 2026-10-02：「租户管理」模块已并入「系统管理」顶级模块（旧页 data-module="tenant" 兜底映射到 sys）
  if (moduleId === "tenant") moduleId = "sys";
  // 2026-10-02：订单列表 / 全局订单已由「交易」移至「财务」，不再回落到 biz
  // 内容审核页导航高亮
  if (moduleId === "content" && /^content-/.test(active)) {
    /* keep content; platform-content highlight via crumb pages */
  }

  var modules = [
    { id: "workbench", label: "工作台", href: "dashboard.html" },
    /* 2026-10-02：原「租户管理」顶级模块已并入「系统管理」 */
    { id: "content", label: "内容与审核", href: "content-video.html" },
    { id: "biz", label: "交易", href: "trade-orders.html" },
    { id: "trade", label: "财务", href: "settlements.html" },
    { id: "data", label: "数据", href: "data.html" },
    { id: "sys", label: "系统管理", href: "sys-users.html" },
  ];

  var sidebars = {
    workbench: [
      {
        group: "概览",
        links: [
          { id: "dashboard", href: "dashboard.html#today", label: "工作台" },
        ],
      },
    ],
    content: [
      {
        group: "内容资产",
        links: [
          { id: "content-video", href: "content-video.html", label: "线上课" },
          { id: "content-offline", href: "content-offline.html", label: "线下课" },
          { id: "content-article", href: "content-article.html", label: "文章" },
          { id: "content-tags", href: "content-tags.html", label: "内容标签" },
          { id: "content-teachers", href: "content-teachers.html", label: "讲师管理" },
        ],
      },
      {
        group: "测评中心",
        links: [
          { id: "assess-projects", href: "assess-projects.html", label: "测评" },
          { id: "assess-series", href: "assess-series.html", label: "测评包" },
          { id: "assess-questions", href: "assess-questions.html", label: "题库" },
          { id: "assess-results", href: "assess-results.html", label: "测评报告" },
          { id: "assess-report-templates", href: "assess-report-templates.html", label: "报告模板" },
        ],
      },
      {
        group: "学习服务",
        links: [
          { id: "agents", href: "agents.html", label: "智能体" },
          { id: "content-tasks", href: "content-tasks.html", label: "任务" },
          { id: "assess-plans", href: "assess-plans.html", label: "定制化计划" },
        ],
      },
      {
        group: "审核",
        links: [
          { id: "audit", href: "audit.html", label: "内容审核", badge: 0 },
          { id: "audit-live", href: "audit.html?type=live", label: "直播审核" },
          { id: "audit-goods", href: "audit.html?type=goods", label: "商品审核" },
          { id: "audit-appeal", href: "audit.html?tab=appeal", label: "申诉处理" },
        ],
      },
    ],
    trade: [
      {
        /* 2026-10-02 评审标注：「订单列表」由「交易」板块移入「财务」板块（一期）
         * 2026-10-02 评审标注（本轮）：「订单列表」与「全局订单」合并，只保留订单列表
         *（trade-orders.html 已含跨租户 / 平台分账列），orders.html 降级为跳转桩 */
        group: "订单管理",
        links: [
          { id: "trade-orders", href: "trade-orders.html", label: "订单列表" },
        ],
      },
      {
        group: "收款与进件",
        links: [
          { id: "pay-channels", href: "pay-channels.html", label: "收款与清分" },
          { id: "onboard-audit", href: "onboard-audit.html", label: "进件审核", badge: 3 },
        ],
      },
      {
        group: "资金",
        links: [
          /* 2026-09-29 评审标注：「支付流水」从「财务」组移到「资金」组，置于对账管理之上 */
          { id: "pay-flows", href: "pay-flows.html", label: "支付流水" },
          { id: "recon", href: "recon.html", label: "对账管理", badge: 3 },
          { id: "settlements", href: "settlements.html", label: "结算管理", badge: 5 },
          { id: "payouts", href: "payouts.html", label: "提现审核", badge: 2 },
        ],
      },
      {
        group: "财务",
        links: [
          { id: "fee-ledger", href: "fee-ledger.html", label: "服务费台账" },
        ],
      },
      {
        group: "风控与规则",
        links: [
          { id: "settle-rules", href: "settle-rules.html", label: "结算规则配置" },
        ],
      },
    ],
    biz: [
      {
        group: "订单管理",
        links: [
          { id: "entitlement", href: "entitlement.html", label: "权益开通记录", badge: 2 },
        ],
      },
      {
        group: "商品管理",
        links: [
          { id: "platform-goods", href: "platform-goods.html", label: "平台商品" },
          { id: "goods-edit", href: "goods-edit.html", label: "新建商品" },
        ],
      },
      {
        group: "售后管理",
        links: [
          { id: "aftersales", href: "aftersales.html", label: "退款与权益回收", badge: 4 },
        ],
      },
    ],
    data: [
      {
        group: "数据分析",
        links: [
          /* 2026-09-29 评审标注：对照商家管理后台「数据」板块重构
           * （经营总览 / 获客与转化 / 内容经营 / 商品与交易 / 客户经营 / 期次复盘），
           * 平台侧另保留「商家经营」「商家健康度」两项 */
          { id: "data", href: "data.html", label: "经营总览" },
          { id: "data-acquire", href: "data.html?view=acquire", label: "获客与转化" },
          { id: "data-content", href: "data.html?view=content", label: "内容经营" },
          { id: "data-trade", href: "data.html?view=trade", label: "商品与交易" },
          { id: "data-customer", href: "data.html?view=customer", label: "客户经营" },
          { id: "data-term", href: "data.html?view=term", label: "期次复盘" },
          { id: "data-merchant", href: "data.html?view=merchant", label: "商家经营" },
          { id: "data-health", href: "data.html?view=health", label: "商家健康度" },
        ],
      },
    ],
    sys: [
      {
        /* 2026-10-02 评审标注：原「租户管理」顶级模块并入「系统管理」目录下 */
        group: "租户管理",
        links: [
          { id: "tenants", href: "tenants.html", label: "租户列表" },
          { id: "plans", href: "plans.html", label: "套餐管理" },
        ],
      },
      {
        group: "系统用户管理",
        links: [
          { id: "sys-users", href: "sys-users.html", label: "用户列表" },
          { id: "sys-depts", href: "sys-depts.html", label: "部门管理" },
          { id: "sys-roles", href: "sys-roles.html", label: "用户角色权限" },
        ],
      },
      {
        group: "系统管理",
        links: [
          { id: "sys-dict", href: "sys-dict.html", label: "数据字典" },
          { id: "channel-mgmt", href: "channel-mgmt.html", label: "渠道管理" },
          /* 2026-09-30 评审标注：C 端消息模板统一在运营后台配置，新增「消息配置」 */
          { id: "message-config", href: "message-config.html", label: "消息配置" },
          /* 2026-09-29 评审标注：「应用管理」从租户管理模块迁到系统管理下 */
          { id: "apps", href: "apps.html", label: "应用管理" },
        ],
      },
    ],
  };

  var assistCopy = {
    workbench:
      "<div class='assist-block'><h3>运营职责</h3><ol>" +
      "<li>审核商家入驻开通申请</li><li>审核商家发布到 C 端的内容</li>" +
      "<li>全局查看各租户经营数据</li><li>处理结算与风控异常</li></ol></div>",
    content:
      "<div class='assist-block'><h3>内容与审核</h3><ul>" +
      "<li>平台内容管理与商家端对齐：内容资产 / 测评中心 / 学习服务</li>" +
      "<li>审核：内容 / 直播 / 商品 + 申诉（待审→通过，或待审→驳回→重提）</li></ul></div>",
    trade:
      "<div class='assist-block'><h3>资金闭环</h3><ol>" +
      "<li>结算规则：费率 / 账期 / 门槛，按租户合同覆盖</li>" +
      "<li>对账：T+1 与渠道账单逐笔核对，差异进工单</li>" +
      "<li>结算：对账对平 → 商家确认 → 财务复核 → 打款</li>" +
      "<li>提现：额度 / 风控 / 留存审核后打款</li></ol></div>" +
      "<div class='assist-block'><h3>注意事项</h3><ul>" +
      "<li>服务费口径已统一为 0%（默认），按租户合同可覆盖</li>" +
      "<li>打款为敏感操作，需双人复核并留痕</li>" +
      "<li>风控预警统一汇入运营工作台待办</li></ul></div>",
    biz:
      "<div class='assist-block'><h3>交易提示</h3><ul>" +
      "<li>支付成功开通权益，退款成功回收权益</li>" +
      "<li>平台侧查看全局订单与商品</li></ul></div>",
    data:
      "<div class='assist-block'><h3>数据口径</h3><ul>" +
      "<li>只做分析，不含订单/售后等业务管理页</li></ul></div>",
    sys:
      "<div class='assist-block'><h3>系统用户</h3><ul>" +
      "<li>管理运营后台自身的登录账号</li>" +
      "<li>部门为三级结构：中心 / 部门 / 小组</li>" +
      "<li>角色权限基于资源树勾选配置</li>" +
      "<li>数据字典统一维护下拉枚举项</li>" +
      "<li>超级管理员不可停用与删除</li></ul></div>",
  };

  /* 模块下所有菜单均为隐藏的二期项时，隐藏该一级模块 */
  function moduleVisible(m) {
    var groups = sidebars[m.id];
    if (!groups || !groups.length) return true;
    for (var i = 0; i < groups.length; i++) {
      var links = (groups[i] && groups[i].links) || [];
      for (var j = 0; j < links.length; j++) {
        if (phase2On || !PH2.isPhase2("ops", links[j].id)) return true;
      }
    }
    return false;
  }

  function modulesHtml() {
    return modules
      .filter(moduleVisible)
      .map(function (m) {
        return '<a class="' + (m.id === moduleId ? "active" : "") + '" href="' + m.href + '">' + m.label + "</a>";
      })
      .join("");
  }

  function sideHtml() {
    var groups = sidebars[moduleId] || [];
    var pendingPlatform = 0;
    try {
      if (window.ProtoBiz) {
        pendingPlatform = ProtoBiz.getLives().filter(function (l) {
          return l.auditStatus === "pending_platform_review";
        }).length;
      }
    } catch (e) {}
    var html = '<div class="sidebar-module-label">当前模块</div>';
    groups.forEach(function (g) {
      var links = (g.links || []).filter(function (l) {
        return phase2On || !PH2.isPhase2("ops", l.id);
      });
      if (!links.length) return; // 分组整体为二期且已隐藏时跳过
      html += '<div class="nav-group"><div class="nav-label">' + g.group + "</div>";
      links.forEach(function (l) {
        var cls = "nav-item" + (l.id === active ? " active" : "");
        var badgeVal = l.badge;
        if (l.id === "audit") badgeVal = pendingPlatform || 0;
        var badge = badgeVal ? '<span class="nav-badge">' + badgeVal + '</span>' : '';
        var phaseTag = PH2.isPhase2("ops", l.id) ? '<span class="nav-phase">二期</span>' : "";
        html += '<a class="' + cls + '" href="' + l.href + '"><span class="nav-text">' + l.label + "</span>" + phaseTag + badge + "</a>";
      });
      html += "</div>";
    });
    return html;
  }

  /* 评审路径：二期步骤随二期开关显隐
   * 2026-10-02 评审标注：「内容与审核」整模块标记为二期 → 「平台内容」同步改为二期步骤 */
  var reviewSteps = [
    { href: "tenants.html", label: "租户开通", phase2: false },
    { href: "content-video.html", label: "平台内容", phase2: true },
    { href: "audit.html", label: "内容审核", phase2: true },
    { href: "settlements.html", label: "对账结算", phase2: false },
    { href: "trade-orders.html", label: "订单列表", phase2: false },
    { href: "data.html", label: "数据", phase2: false },
  ];
  var CIRCLED = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];
  var review =
    '<div class="review-bar">' +
    "<strong>评审路径</strong>" +
    reviewSteps
      .filter(function (s) { return phase2On || !s.phase2; })
      .map(function (s, i) { return '<a href="' + s.href + '">' + (CIRCLED[i] || "") + s.label + "</a>"; })
      .join('<span class="sep">·</span>') +
    '<span class="sep">|</span>' +
    '<a href="../admin/dashboard.html">切商家后台</a><span class="sep">·</span>' +
    '<a href="../miniprogram/home.html">切 C 端</a><span class="sep">·</span>' +
    '<a href="../index.html">导航</a><span class="sep">|</span>' +
    '<button type="button" class="phase2-toggle' + (phase2On ? " on" : "") + '" id="phase2-toggle" aria-pressed="' + (phase2On ? "true" : "false") + '" title="显示/隐藏二期能力（当前：' + (phase2On ? "显示" : "隐藏") + '）">二期</button>' +
    "</div>";

  /* 公告条标记为二期：一期视图下不显示（2026-09-29 评审标注） */
  var notice = showNotice && phase2On
    ? '<div class="notice-bar" id="notice-bar">' +
      "<span>运营后台 · 工作台 / 内容与审核 / 交易 / 财务 / 数据 / 系统管理（含租户管理）</span>" +
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
    '<a class="admin-brand" href="dashboard.html"><div class="logo">运</div>运营后台</a>' +
    '<div class="admin-tenant">平台 <b>艺博教育科技</b></div>' +
    '<nav class="admin-modules">' +
    modulesHtml() +
    "</nav>" +
    '<div class="admin-top-actions">' +
    '<button type="button" class="icon-btn" data-toast="全局搜索（后续）" title="搜索">⌕</button>' +
    '<button type="button" class="icon-btn" data-toast="通知中心（示意）" title="通知">◉</button>' +
    '<div class="admin-user-wrap" id="admin-user-wrap">' +
    '<button type="button" class="admin-user" id="admin-user-btn">平台运营 <i class="caret">▾</i></button>' +
    '<div class="user-dropdown" id="user-dropdown">' +
    '<div class="udd-hd"><b>平台运营</b><br><span>平台运营管理员 · 艺博教育科技</span></div>' +
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
    console.error("[ops-shell] 未找到 #page-content 节点，请检查页面是否正确加载");
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

  // 整页跳转后侧栏 scrollTop 会归零；把当前选中项滚入可视区
  (function scrollActiveNavIntoView() {
    var activeNav = document.querySelector(".sidebar .nav-item.active");
    if (!activeNav) return;
    if (typeof activeNav.scrollIntoView === "function") {
      activeNav.scrollIntoView({ block: "center", inline: "nearest" });
    }
  })();

  // ===== 评审路径条「二期」开关：切换后整页刷新重渲染 =====
  var phase2ToggleBtn = document.getElementById("phase2-toggle");
  if (phase2ToggleBtn) {
    phase2ToggleBtn.addEventListener("click", function () {
      PH2.setEnabled(!PH2.enabled());
      location.reload();
    });
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
  document.documentElement.setAttribute("data-shell-ready", "1");
})();
