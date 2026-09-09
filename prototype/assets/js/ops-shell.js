/* 运营后台 Shell：复用商家管理后台（admin-shell.js）的版式与交互
 * 差异点：品牌「运营后台」、平台标识（非商户）、面向平台侧的模块与侧栏、三端互跳导航
 */
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
  var title = document.body.getAttribute("data-title") || "运营后台";
  var crumb = document.body.getAttribute("data-crumb") || "";
  var showAssist = false; // 操作助手已隐藏（原 data-assist="1" 开关）
  var showNotice = document.body.getAttribute("data-notice") !== "0";

  // 兼容旧页 data-module="audit" → 归入「内容」
  if (moduleId === "audit") moduleId = "content";

  var modules = [
    { id: "workbench", label: "工作台", href: "dashboard.html" },
    { id: "tenant", label: "租户管理", href: "tenants.html" },
    { id: "content", label: "内容", href: "content-series.html" },
    { id: "sys", label: "系统管理", href: "sys-users.html" },
    { id: "data", label: "全局数据", href: "data.html" },
  ];

  var sidebars = {
    workbench: [
      { group: "概览", links: [{ id: "dashboard", href: "dashboard.html", label: "运营工作台" }] },
    ],
    tenant: [
      {
        group: "租户管理",
        links: [
          { id: "tenants", href: "tenants.html", label: "租户列表" },
          { id: "users", href: "users.html", label: "租户用户" },
          { id: "tenant-depts", href: "tenant-depts.html", label: "租户部门" },
          { id: "tenant-roles", href: "tenant-roles.html", label: "租户角色" },
        ],
      },
      {
        group: "角色与权限",
        links: [
          { id: "template-roles", href: "template-roles.html", label: "模板角色" },
        ],
      },
      {
        group: "应用与资源",
        links: [
          { id: "apps", href: "apps.html", label: "应用管理" },
          { id: "resources", href: "resources.html", label: "功能资源配置" },
        ],
      },
      {
        group: "套餐管理",
        links: [
          { id: "plans", href: "plans.html", label: "套餐管理" },
        ],
      },
    ],
    content: [
      {
        group: "内容管理",
        links: [
          { id: "content-series", href: "content-series.html", label: "系列课管理" },
          { id: "content-video", href: "content-video.html", label: "视频管理" },
          { id: "content-article", href: "content-article.html", label: "图文管理" },
          { id: "content-category", href: "content-category.html", label: "商品分组" },
        ],
      },
      {
        group: "测评管理",
        links: [
          { id: "assess-projects", href: "assess-projects.html", label: "测试项目管理" },
          { id: "assess-series", href: "assess-series.html", label: "系列测评管理" },
          { id: "assess-results", href: "assess-results.html", label: "测评结果" },
        ],
      },
      {
        group: "计划管理",
        links: [
          { id: "assess-plans", href: "assess-plans.html", label: "定制化计划" },
        ],
      },
      {
        group: "内容审核",
        links: [
          { id: "audit", href: "audit.html", label: "审核工作台", badge: 12 },
          { id: "audit-records", href: "audit-records.html", label: "审核记录" },
        ],
      },
    ],
    data: [
      {
        group: "全局看板",
        links: [{ id: "data", href: "data.html", label: "经营总览" }],
      },
      {
        group: "全局交易",
        links: [{ id: "orders", href: "orders.html", label: "全局订单" }],
      },
    ],
    sys: [
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
          { id: "sys-resources", href: "sys-resources.html", label: "资源管理" },
          { id: "sys-dict", href: "sys-dict.html", label: "数据字典" },
        ],
      },
    ],
  };

  var assistCopy = {
    workbench:
      "<div class='assist-block'><h3>运营职责</h3><ol>" +
      "<li>审核商家入驻开通申请</li><li>审核商家发布到 C 端的内容</li>" +
      "<li>全局查看各租户经营数据</li><li>处理结算与风控异常</li></ol></div>" +
      "<div class='assist-block'><h3>评审路径</h3><ul>" +
      "<li><a href='tenants.html'>① 租户开通</a></li>" +
      "<li><a href='content-series.html'>② 内容中台</a></li>" +
      "<li><a href='data.html'>③ 全局数据</a></li>" +
      "<li><a href='orders.html'>④ 全局订单</a></li></ul></div>",
    tenant:
      "<div class='assist-block'><h3>租户与用户</h3><ul>" +
      "<li>商家在注册页留资后成为开通线索</li>" +
      "<li>开通即创建租户并分配商户管理员账号</li>" +
      "<li>租户用户维护各租户的后台登录账号</li>" +
      "<li>支持新增用户、锁定解锁、停用删除</li>" +
      "<li>停用后商家后台只读，C 端内容下架</li></ul></div>" +
      "<div class='assist-block'><h3>角色与资源</h3><ul>" +
      "<li>模板角色随租户开通下发为内置角色</li>" +
      "<li>商家也可在后台自建角色（此处可见）</li>" +
      "<li>功能资源配置维护权限勾选的资源树</li>" +
      "<li>应用按套餐授权，可对租户单独覆盖</li></ul></div>",
    content:
      "<div class='assist-block'><h3>内容中台</h3><ul>" +
      "<li>内容管理：平台标准系列课 / 视频 / 图文 / 商品分组</li>" +
      "<li>测评与计划：测试项目、系列测评、结果与定制化计划（后续迭代）</li>" +
      "<li>内容审核：商家提交上架的内容进入审核队列</li>" +
      "<li>与商家后台「内容」双轨：此处为平台侧，商家侧为租户售卖</li></ul></div>" +
      "<div class='assist-block'><h3>审核规则</h3><ul>" +
      "<li>审核通过后内容才会发布到 C 端小程序</li>" +
      "<li>驳回需填写原因，商家可在后台查看并修改重提</li></ul></div>",
    data:
      "<div class='assist-block'><h3>数据口径</h3><ul>" +
      "<li>数据来自各租户商家后台上报</li>" +
      "<li>GMV 为已支付口径（含退款冲减）</li>" +
      "<li>租户排行支持按交易/内容/直播切换</li></ul></div>",
    sys:
      "<div class='assist-block'><h3>系统用户</h3><ul>" +
      "<li>管理运营后台自身的登录账号</li>" +
      "<li>部门为三级结构：中心 / 部门 / 小组</li>" +
      "<li>角色权限基于资源树勾选配置</li>" +
      "<li>数据字典统一维护下拉枚举项</li>" +
      "<li>超级管理员不可停用与删除</li></ul></div>",
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
    '<a href="tenants.html">①租户开通</a><span class="sep">·</span>' +
    '<a href="content-series.html">②内容</a><span class="sep">·</span>' +
    '<a href="data.html">③全局数据</a><span class="sep">·</span>' +
    '<a href="orders.html">④全局订单</a><span class="sep">|</span>' +
    '<a href="../admin/dashboard.html">切商家后台</a><span class="sep">·</span>' +
    '<a href="../miniprogram/home.html">切 C 端</a><span class="sep">·</span>' +
    '<a href="../index.html">导航</a>' +
    "</div>";

  var notice = showNotice
    ? '<div class="notice-bar" id="notice-bar">' +
      "<span>运营后台 · 平台侧演示原型（v1.1）· 租户开通、内容中台（管理+审核）与全局数据</span>" +
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
