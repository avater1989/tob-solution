/**
 * 商户工作台：待办闭环交互
 * 依赖：Proto、ProtoBiz、LiveOps、BoardData、BoardMetrics
 */
(function () {
  var WB_CONFIG = {
    storageTodo: "wb_todo_done_v1",
    storageBiz: "wb_todo_biz_v1",
    storageRole: "wb_role_v1",
    storageRange: "wb_range_v1",
    storageCtx: "wb_ctx_v1",
    currentUser: "赵老师"
  };

  var ROLES = {
    admin: {
      id: "admin",
      label: "商户管理员",
      tip: "",
      tipCta: null,
      create: ["series", "live", "urge", "lead"],
      todoTypes: null,
      showLead: true,
      showAuditRealtime: true,
      showUrge: true,
      showAftersale: true,
      showLiveSchedule: true,
      showLeadsLink: true,
      canAssign: true
    },
    sales: {
      id: "sales",
      label: "助教/销售",
      tip: "",
      tipCta: null,
      create: ["urge", "lead"],
      todoTypes: ["lead", "urge", "follow", "remind", "live_exception"],
      showLead: true,
      showAuditRealtime: false,
      showUrge: true,
      showAftersale: false,
      showLiveSchedule: true,
      showLeadsLink: true,
      canAssign: false
    },
    auditor: {
      id: "auditor",
      label: "审核员",
      tip: "",
      tipCta: null,
      create: [],
      todoTypes: ["audit"],
      showLead: false,
      showAuditRealtime: true,
      showUrge: false,
      showAftersale: false,
      showLiveSchedule: true,
      showLeadsLink: false,
      canAssign: false
    },
    content: {
      id: "content",
      label: "内容运营",
      tip: "",
      tipCta: null,
      create: ["series", "live"],
      todoTypes: ["content", "audit", "live_exception"],
      showLead: false,
      showAuditRealtime: true,
      showUrge: false,
      showAftersale: false,
      showLiveSchedule: true,
      showLeadsLink: false,
      canAssign: false
    }
  };

  var TYPE_LABELS = {
    lead: "未分配线索",
    audit: "直播审核",
    urge: "直播促到SOP异常",
    aftersale: "售后",
    live_exception: "直播异常",
    follow: "运营建议",
    content: "内容建议",
    remind: "运营建议"
  };

  var CREATE_ITEMS = {
    series: { tag: "创建", title: "新建系列课", desc: "创建线上系列课并进入上架流程", href: "content-series-edit.html" },
    live: { tag: "创建", title: "新建直播", desc: "创建场次并保存草稿，列表提交平台审核", href: "live-edit.html" },
    urge: { tag: "创建", title: "新建直播促到SOP", desc: "面向私域人群配置直播前邀约、预约后催到或开播中召回", href: "live-invite.html" },
    lead: { tag: "创建", title: "新建线索", desc: "手工录入或导入线索", href: "leads.html?action=create&from=dashboard" }
  };

  var RANGE_META = {
    today: { key: "today", label: "今日", titleSuffix: "· 今日", compareLabel: "较昨日", rangeParam: "today" },
    yesterday: { key: "yesterday", label: "昨日", titleSuffix: "· 昨日", compareLabel: "较前日", rangeParam: "yesterday" },
    "7d": { key: "7d", label: "近7日", titleSuffix: "· 近7日", compareLabel: "较上周期", rangeParam: "7d" }
  };

  var state = {
    range: "today",
    role: "admin",
    todoFilter: "must",
    typeFilter: "",
    ownerFilter: "",
    doneIds: {},
    bizIds: {},
    refreshing: false,
    busy: false,
    assignLeadId: "",
    submitLiveId: "",
    smsSelectedId: "",
    sopDetailOpen: {}
  };

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function fmtNum(n) {
    return String(n == null ? 0 : n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function loadDone() {
    try {
      var arr = JSON.parse(sessionStorage.getItem(WB_CONFIG.storageTodo) || "[]");
      state.doneIds = {};
      (arr || []).forEach(function (id) { state.doneIds[id] = true; });
    } catch (e) { state.doneIds = {}; }
    try {
      state.bizIds = JSON.parse(sessionStorage.getItem(WB_CONFIG.storageBiz) || "{}") || {};
    } catch (e2) { state.bizIds = {}; }
  }
  function saveDone() {
    sessionStorage.setItem(WB_CONFIG.storageTodo, JSON.stringify(Object.keys(state.doneIds)));
  }
  function saveBiz() {
    sessionStorage.setItem(WB_CONFIG.storageBiz, JSON.stringify(state.bizIds || {}));
  }
  function loadRole() {
    var r = sessionStorage.getItem(WB_CONFIG.storageRole);
    if (r && ROLES[r]) state.role = r;
  }
  function saveRole() { sessionStorage.setItem(WB_CONFIG.storageRole, state.role); }
  function loadRange() {
    var r = sessionStorage.getItem(WB_CONFIG.storageRange);
    if (r && RANGE_META[r]) state.range = r;
  }
  function saveRange() { sessionStorage.setItem(WB_CONFIG.storageRange, state.range); }

  function saveCtx() {
    try {
      sessionStorage.setItem(WB_CONFIG.storageCtx, JSON.stringify({
        todoFilter: state.todoFilter,
        typeFilter: state.typeFilter,
        ownerFilter: state.ownerFilter,
        scrollY: window.scrollY || 0,
        role: state.role,
        range: state.range,
        flash: state._flash || ""
      }));
    } catch (e) {}
  }
  function restoreCtx() {
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("restore") !== "1" && q.get("todo_filter") == null && q.get("open") == null) return;
      var raw = sessionStorage.getItem(WB_CONFIG.storageCtx);
      var ctx = raw ? JSON.parse(raw) : {};
      if (q.get("todo_filter")) state.typeFilter = q.get("todo_filter");
      else if (ctx.typeFilter) state.typeFilter = ctx.typeFilter;
      if (ctx.todoFilter === "must" || ctx.todoFilter === "suggest") state.todoFilter = ctx.todoFilter;
      else if (ctx.todoFilter === "all" || ctx.todoFilter === "mine" || ctx.todoFilter === "overdue") state.todoFilter = "must";
      if (ctx.ownerFilter) state.ownerFilter = ctx.ownerFilter;
      if (ctx.flash) {
        setTimeout(function () { Proto.toast(ctx.flash); }, 400);
        state._flash = "";
        try {
          ctx.flash = "";
          sessionStorage.setItem(WB_CONFIG.storageCtx, JSON.stringify(ctx));
        } catch (e2) {}
      }
      var y = Number(ctx.scrollY || 0);
      if (q.get("restore") === "1" || state.typeFilter) {
        setTimeout(function () {
          if (state.typeFilter) scrollToTodo();
          else if (y > 0) window.scrollTo(0, y);
        }, 80);
      }
      if (q.get("open") === "sms") {
        setTimeout(function () { openSmsDrawer(); }, 200);
      }
    } catch (e) {}
  }

  function getTodos() {
    var list = (window.ProtoBiz && ProtoBiz.buildTodos) ? ProtoBiz.buildTodos() : [];
    /* 领课短信失败暂不展示（兜底过滤，避免旧缓存脚本仍返回 sms 待办） */
    return list.filter(function (t) {
      return t.type !== "sms" && t.filterKey !== "sms";
    });
  }
  function getRealtime() {
    if (window.ProtoBiz && ProtoBiz.realtimeCounts) return ProtoBiz.realtimeCounts();
    return { unassigned: 0, audit: 0, urgeTasks: 0, aftersale: 0, smsFailed: 0 };
  }

  function getRangeBundle(rangeKey) {
    var meta = RANGE_META[rangeKey] || RANGE_META.today;
    var base = (window.BoardData && BoardData.ranges && BoardData.ranges[rangeKey]) || {};
    var m = (window.BoardMetrics && BoardMetrics.aggregateLeadMetrics)
      ? BoardMetrics.aggregateLeadMetrics({ range: meta.rangeParam, channel: "", term: "", src: "" })
      : null;
    var deltas = base.deltas || {};
    var compareLabel = base.compareLabel || meta.compareLabel;
    var moneyFn = (window.BoardMetrics && BoardMetrics.money) ? BoardMetrics.money : function (n) {
      return "¥" + Number(n || 0).toLocaleString("zh-CN");
    };
    var dirOf = function (d) {
      if (!d || d === "—") return "up";
      return String(d).charAt(0) === "-" ? "down" : "up";
    };
    if (!m) {
      return {
        titleSuffix: meta.titleSuffix,
        compareLabel: compareLabel,
        rangeParam: meta.rangeParam,
        results: {
          leads: { value: String(base.poolLeads || 0), delta: deltas.leads || "—", deltaDir: "up", extra: "" },
          orders: { value: String(base.totalPaidOrders || 0), delta: deltas.orders || "—", deltaDir: "up", extra: "" },
          gmv: { value: moneyFn(base.totalGmv || 0), delta: deltas.gmv || "—", deltaDir: "up", extra: "" },
          refund: { value: base.refundRate || "—", delta: deltas.refund || "—", deltaDir: "up", extra: "", refundCount: base.refundUsers || 0 }
        }
      };
    }
    return {
      titleSuffix: meta.titleSuffix,
      compareLabel: compareLabel,
      rangeParam: meta.rangeParam,
      results: {
        leads: { value: String(m.poolLeads), delta: deltas.leads || "—", deltaDir: dirOf(deltas.leads), extra: "" },
        orders: { value: String(m.fullOrders), delta: deltas.orders || "—", deltaDir: dirOf(deltas.orders), extra: "实收 " + moneyFn(m.fullGmv) },
        gmv: { value: moneyFn(m.fullGmv), delta: deltas.gmv || "—", deltaDir: dirOf(deltas.gmv), extra: m.fullOrders + " 笔" },
        refund: { value: m.fullRefundRate == null ? "—" : String(m.fullRefundRate), delta: deltas.refund || "—", deltaDir: dirOf(deltas.refund), extra: "退款 " + (m.fullRefundUsers == null ? "—" : m.fullRefundUsers) + " 人", refundCount: m.fullRefundUsers || 0 }
      }
    };
  }

  function withRange(href, rangeKey) {
    var data = getRangeBundle(rangeKey || state.range);
    var rp = data && data.rangeParam;
    if (!rp) return href;
    try {
      var u = new URL(href, location.href);
      u.searchParams.set("range", rp);
      return u.pathname.split("/").pop() + u.search + u.hash;
    } catch (e) {
      return href + (href.indexOf("?") >= 0 ? "&" : "?") + "range=" + encodeURIComponent(rp);
    }
  }

  function deltaHtml(delta, dir) {
    return '<span class="' + (dir === "down" ? "down" : "up") + '">' + delta + "</span>";
  }
  function formatHint(metric, compareLabel) {
    var parts = [deltaHtml(metric.delta, metric.deltaDir) + " " + compareLabel];
    if (metric.extra) parts.push(metric.extra);
    return parts.join(" · ");
  }

  function urgencyClass(u) {
    if (u === "overdue" || u === "over") return "wb-urgency-over";
    if (u === "near" || u === "near_start" || u === "near_timeout") return "wb-urgency-near";
    return "wb-urgency-ok";
  }
  function urgencyLabelOf(t) {
    return t.urgencyLabel || (t.sla === "over" ? "已超时" : t.sla === "near" ? "即将超时" : "正常");
  }
  function statusLabelOf(t) {
    if (state.bizIds[t.id] === "waiting") return "等待系统结果";
    if (state.bizIds[t.id] === "processing") return "处理中";
    if (state.bizIds[t.id] === "retrying") return "处理中";
    return t.statusLabel || "待处理";
  }
  function actionLabelOf(t) {
    if (state.bizIds[t.id] === "retrying") return "重试中…";
    if (state.role === "auditor" && t.actionLabelAuditor) return t.actionLabelAuditor;
    if (state.role === "sales" && t.actionLabelSales) return t.actionLabelSales;
    if (state.bizIds[t.id] === "retry_fail") return "再次重试";
    return t.actionLabel || "去查看";
  }
  function actionOf(t) {
    if (state.role === "auditor" && t.actionAuditor) return t.actionAuditor;
    if (state.role === "sales" && t.actionSales) return t.actionSales;
    return t.action || "view";
  }
  function hrefOf(t) {
    if (state.role === "auditor" && t.hrefAuditor) return t.hrefAuditor;
    return t.href;
  }

  function todoBadgeClass(t) {
    if (t.badge) return t.badge;
    if (t.type === "aftersale" || t.type === "live_exception") return "badge-danger";
    if (t.type === "audit" || t.type === "urge" || t.urgency === "overdue") return "badge-warn";
    return "badge-info";
  }

  function sortTodos(list) {
    var rank = { overdue: 0, over: 0, near: 1, near_start: 1, near_timeout: 1, ok: 2 };
    return list.slice().sort(function (a, b) {
      var ua = a.urgency || a.sla || "ok";
      var ub = b.urgency || b.sla || "ok";
      var ra = rank[ua] != null ? rank[ua] : 9;
      var rb = rank[ub] != null ? rank[ub] : 9;
      if (ra !== rb) return ra - rb;
      return (a.dueSort || 99) - (b.dueSort || 99);
    });
  }

  function isSuggestion(t) {
    return t.kind === "suggestion" || t.completeMode === "manual" || t.type === "follow" || t.type === "content" || t.type === "remind";
  }

  function roleTodos() {
    var role = ROLES[state.role];
    return getTodos().filter(function (t) {
      if (state.doneIds[t.id]) return false;
      if (t.roles && t.roles.indexOf(state.role) < 0) return false;
      if (role.todoTypes && role.todoTypes.indexOf(t.type) < 0 && role.todoTypes.indexOf(t.filterKey) < 0) return false;
      /* 正常直播中不展示 */
      if (t.type === "live" && t.filterKey === "live") return false;
      return true;
    });
  }

  function visibleTodos() {
    var list = roleTodos();
    if (state.todoFilter === "must") list = list.filter(function (t) { return !isSuggestion(t); });
    if (state.todoFilter === "suggest") list = list.filter(function (t) { return isSuggestion(t); });
    /* legacy */
    if (state.todoFilter === "mine") list = list.filter(function (t) { return t.mine; });
    if (state.todoFilter === "overdue") list = list.filter(function (t) { return t.sla === "over" || t.urgency === "overdue"; });
    if (state.typeFilter) {
      list = list.filter(function (t) {
        return t.filterKey === state.typeFilter || t.type === state.typeFilter;
      });
    }
    if (state.ownerFilter) list = list.filter(function (t) { return t.owner === state.ownerFilter; });
    return sortTodos(list);
  }

  function mustCount() {
    return roleTodos().filter(function (t) { return !isSuggestion(t); }).length;
  }
  function suggestCount() {
    return roleTodos().filter(function (t) { return isSuggestion(t); }).length;
  }
  function countByFilterKey(key) {
    return roleTodos().filter(function (t) {
      return !isSuggestion(t) && (t.filterKey === key || t.type === key);
    }).length;
  }

  function scrollToTodo() {
    var el = $("block-todo");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setTypeFilter(key) {
    state.typeFilter = key || "";
    document.querySelectorAll("#realtime-stats .stat-card").forEach(function (c) {
      c.classList.toggle("is-active", c.getAttribute("data-todo-filter") === state.typeFilter);
    });
    var sel = $("todo-type-filter");
    if (sel) sel.value = state.typeFilter;
    updateFilterBar();
    /* 点实时卡片时切到必须处理 */
    if (state.typeFilter && state.todoFilter === "suggest") {
      state.todoFilter = "must";
      document.querySelectorAll("#todo-tabs button").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-filter") === "must");
      });
    }
    renderTodos();
    saveCtx();
  }

  function updateFilterBar() {
    var bar = $("todo-filter-bar");
    var text = $("todo-filter-text");
    if (state.typeFilter) {
      var n = visibleTodos().length;
      if (text) text.textContent = "已筛选「" + (TYPE_LABELS[state.typeFilter] || state.typeFilter) + "」· " + n + " 条";
      if (bar) bar.classList.remove("wb-hidden");
    } else if (bar) {
      bar.classList.add("wb-hidden");
    }
  }

  /* ---------- render ---------- */
  function renderResults() {
    var data = getRangeBundle(state.range);
    var r = data.results;
    $("range-label").textContent = data.titleSuffix;
    document.querySelector('[data-field="leads.value"]').textContent = r.leads.value;
    document.querySelector('[data-field="leads.hint"]').innerHTML = formatHint(r.leads, data.compareLabel);
    document.querySelector('[data-field="orders.value"]').textContent = r.orders.value;
    document.querySelector('[data-field="orders.hint"]').innerHTML = formatHint(r.orders, data.compareLabel);
    document.querySelector('[data-field="gmv.value"]').textContent = r.gmv.value;
    document.querySelector('[data-field="gmv.hint"]').innerHTML = formatHint(r.gmv, data.compareLabel);
    document.querySelector('[data-field="refund.value"]').textContent = r.refund.value;
    document.querySelector('[data-field="refund.hint"]').innerHTML = formatHint(r.refund, data.compareLabel);
    var rp = data.rangeParam;
    $("metric-leads").href = "leads.html?range=" + rp;
    $("metric-orders").href = "orders.html?range=" + rp + "&status=paid";
    $("metric-gmv").href = "orders.html?range=" + rp + "&status=paid";
    $("metric-refund").href = "refunds.html?range=" + rp + "&status=refund";
    var ov = $("link-board-overview");
    if (ov) ov.href = withRange("board-overview.html", state.range);
  }

  function renderRealtime() {
    var role = ROLES[state.role];
    var leadN = countByFilterKey("lead");
    var auditN = countByFilterKey("audit");
    var urgeN = countByFilterKey("urge");
    var afterN = countByFilterKey("aftersale");
    var rt = getRealtime();
    document.querySelector('[data-rt="unassigned"]').textContent = leadN;
    document.querySelector('[data-rt="audit"]').textContent = auditN;
    document.querySelector('[data-rt="urgeTasks"]').textContent = urgeN;
    document.querySelector('[data-rt="aftersale"]').textContent = afterN;
    $("rt-unassigned-hint").textContent = leadN ? (rt.unassignedHint || "有待分配线索") : "暂无未分配线索";
    $("rt-audit-hint").textContent = auditN ? ("含 " + auditN + " 场待提交/待改") : "暂无待提交场次";
    $("rt-urge-hint").textContent = urgeN ? ("异常 " + urgeN + " 条") : "暂无SOP异常";
    $("rt-aftersale-hint").textContent = afterN ? (rt.aftersaleHint || "有待处理售后") : "暂无待处理售后";
    $("rt-unassigned").classList.toggle("wb-hidden", !role.showLead);
    $("rt-audit").classList.toggle("wb-hidden", !role.showAuditRealtime);
    $("rt-urge").classList.toggle("wb-hidden", !role.showUrge);
    $("rt-aftersale").classList.toggle("wb-hidden", !role.showAftersale);
  }

  function renderTypeFilterOptions() {
    var role = ROLES[state.role];
    var sel = $("todo-type-filter");
    if (!sel) return;
    var opts = [{ v: "", t: "全部类型" }];
    if (state.todoFilter === "suggest") {
      opts.push({ v: "follow", t: "运营建议" });
      opts.push({ v: "content", t: "内容建议" });
    } else {
      if (role.showLead) opts.push({ v: "lead", t: TYPE_LABELS.lead });
      if (role.showAuditRealtime) opts.push({ v: "audit", t: TYPE_LABELS.audit });
      if (role.showUrge) opts.push({ v: "urge", t: TYPE_LABELS.urge });
      if (role.showAftersale) opts.push({ v: "aftersale", t: TYPE_LABELS.aftersale });
      if (!role.todoTypes || role.todoTypes.indexOf("live_exception") >= 0) {
        opts.push({ v: "live_exception", t: TYPE_LABELS.live_exception });
      }
    }
    if (state.typeFilter && !opts.some(function (o) { return o.v === state.typeFilter; })) {
      state.typeFilter = "";
    }
    sel.innerHTML = opts.map(function (o) {
      return '<option value="' + o.v + '"' + (o.v === state.typeFilter ? " selected" : "") + ">" + o.t + "</option>";
    }).join("");
  }

  function renderQuick() {
    var role = ROLES[state.role];
    var createEl = $("quick-create");
    createEl.innerHTML = "";
    (role.create || []).forEach(function (key) {
      var item = CREATE_ITEMS[key];
      if (!item) return;
      var a = document.createElement("a");
      a.href = item.href;
      a.innerHTML = '<span class="q-tag create">' + item.tag + "</span><div class=\"q-title\">" + item.title + "</div><div class=\"q-desc\">" + item.desc + "</div>";
      createEl.appendChild(a);
    });
    $("block-create").classList.toggle("wb-hidden", !(role.create && role.create.length));
    var links = $("quick-links");
    if (links) {
      var leadLink = $("link-all-leads");
      if (leadLink) leadLink.classList.toggle("wb-hidden", !role.showLeadsLink);
      /* 无创建时仍可展示轻量入口 */
      var showLinks = true;
      links.classList.toggle("wb-hidden", !showLinks);
      if (!(role.create && role.create.length)) {
        $("block-create").classList.remove("wb-hidden");
        createEl.innerHTML = "";
        var meta = $("block-create").querySelector(".wb-meta");
        if (meta) meta.classList.add("wb-hidden");
      } else {
        var meta2 = $("block-create").querySelector(".wb-meta");
        if (meta2) meta2.classList.remove("wb-hidden");
      }
    }
  }

  function renderOwnerFilter() {
    var sel = $("todo-owner-filter");
    if (!sel) return;
    var owners = {};
    roleTodos().forEach(function (t) { if (t.owner) owners[t.owner] = true; });
    var cur = state.ownerFilter;
    sel.innerHTML = '<option value="">全部负责人</option>' +
      Object.keys(owners).map(function (o) {
        return '<option value="' + esc(o) + '"' + (o === cur ? " selected" : "") + ">" + esc(o) + "</option>";
      }).join("");
  }

  function renderEmptyState(list) {
    var empty = $("todo-empty");
    var title = $("todo-empty-title");
    var desc = $("todo-empty-desc");
    var clearBtn = $("todo-empty-clear");
    if (list.length) {
      empty.classList.add("wb-hidden");
      return;
    }
    empty.classList.remove("wb-hidden");
    if (state.typeFilter || state.ownerFilter) {
      title.textContent = "没有符合当前筛选条件的事项";
      desc.textContent = "可调整类型或负责人筛选，或清除筛选后查看全部。";
      clearBtn.classList.remove("wb-hidden");
    } else if (state.todoFilter === "suggest") {
      title.textContent = "当前没有运营建议";
      desc.textContent = "企微流失、内容检查等建议会出现在这里。";
      clearBtn.classList.add("wb-hidden");
    } else {
      title.textContent = "当前没有需要处理的事项";
      desc.textContent = "新的审核、售后或异常任务会显示在这里。";
      clearBtn.classList.add("wb-hidden");
    }
  }

  function sopDetailHtml(t) {
    var m = t.meta || {};
    return '<div class="wb-sop-detail" data-sop-detail="' + esc(t.id) + '">' +
      '<div class="kv-row"><span>失败步骤</span><b>' + esc(m.failStep || "—") + "</b></div>" +
      '<div class="kv-row"><span>发送渠道</span><b>' + esc(m.failChannel || "—") + "</b></div>" +
      '<div class="kv-row"><span>最近执行</span><b>' + esc(m.lastExecAt || "—") + "</b></div>" +
      '<div class="kv-row"><span>失败原因</span><b>' + esc(m.failReason || t.reason || "—") + "</b></div>" +
      '<div class="kv-row"><span>已重试</span><b>' + esc(m.retryCount != null ? m.retryCount : 0) + " 次</b></div>" +
      "</div>";
  }

  function renderTodos() {
    renderTypeFilterOptions();
    var list = visibleTodos();
    var body = $("todo-body");
    var mustN = mustCount();
    var sugN = suggestCount();
    $("todo-count").textContent = String(mustN);
    var tabSug = $("tab-suggest");
    if (tabSug) tabSug.textContent = sugN ? ("运营建议 · " + sugN) : "运营建议";
    body.innerHTML = "";
    renderEmptyState(list);
    updateFilterBar();
    if (!list.length) return;
    list.forEach(function (t) {
      var tr = document.createElement("tr");
      tr.setAttribute("data-todo-id", t.id);
      var badge = todoBadgeClass(t);
      var act = actionOf(t);
      var actLabel = actionLabelOf(t);
      var busy = state.bizIds[t.id] === "retrying";
      var actions = '<button type="button" class="btn btn-sm btn-primary' + (busy ? " wb-busy" : "") + '" data-todo-act="' + esc(act) + '" data-todo-id="' + esc(t.id) + '"' + (busy ? " disabled" : "") + ">" + esc(actLabel) + "</button>";
      if (t.secondaryActionLabel && t.hrefSecondary && state.role !== "auditor") {
        actions += ' <a class="btn btn-sm" href="' + esc(t.hrefSecondary) + '" data-ctx="1">' + esc(t.secondaryActionLabel) + "</a>";
      }
      if (isSuggestion(t)) {
        actions += ' <button type="button" class="btn btn-sm btn-ghost" data-todo-act="snooze" data-todo-id="' + esc(t.id) + '">稍后提醒</button>';
        actions += ' <button type="button" class="btn btn-sm btn-ghost" data-todo-act="ignore" data-todo-id="' + esc(t.id) + '">忽略</button>';
        actions += ' <button type="button" class="btn btn-sm btn-ghost" data-todo-act="done" data-todo-id="' + esc(t.id) + '">标记完成</button>';
      }
      var reasonHtml = '<div class="wb-todo-reason">' + esc(t.reason || "—");
      if (t.type === "urge" && t.meta) {
        reasonHtml += '<button type="button" class="wb-link-detail" data-todo-act="toggle_sop_detail" data-todo-id="' + esc(t.id) + '">查看详情</button>';
      }
      reasonHtml += "</div>";
      if (state.sopDetailOpen[t.id]) reasonHtml += sopDetailHtml(t);
      tr.innerHTML =
        '<td><span class="badge ' + badge + '">' + esc(t.typeLabel) + "</span></td>" +
        "<td><b>" + esc(t.title) + "</b></td>" +
        "<td>" + reasonHtml + "</td>" +
        "<td>" + esc(t.owner || "—") + "</td>" +
        "<td>" + esc(t.dueLabel || "—") + "</td>" +
        '<td class="' + urgencyClass(t.urgency || t.sla) + '">' + esc(urgencyLabelOf(t)) + "</td>" +
        "<td>" + esc(statusLabelOf(t)) + "</td>" +
        '<td class="row-actions">' + actions + "</td>";
      body.appendChild(tr);
    });
  }

  function demoTodayPrefix() {
    var now = (window.ProtoBiz && ProtoBiz.DEMO_NOW) || "2026-09-09 16:00:00";
    return String(now).slice(0, 10);
  }
  function sopInviteForLive(liveId) {
    if (!window.ProtoBiz || !ProtoBiz.getSops) return { target: 0, reached: 0 };
    var target = 0, reached = 0;
    ProtoBiz.getSops(liveId).forEach(function (s) {
      if (s.status === "draft" && liveId === "L003") return;
      target += (s.targetCount || s.targetUsers || 0);
      reached += (s.reachedCount || s.reachedUsers || 0);
    });
    return { target: target, reached: reached };
  }

  function liveDurationLabel(l) {
    var start = String(l.startAt || "");
    if (!start) return "—";
    try {
      var a = new Date(start.replace(/-/g, "/"));
      var b = new Date(String((window.ProtoBiz && ProtoBiz.DEMO_NOW) || "").replace(/-/g, "/"));
      var mins = Math.max(0, Math.round((b - a) / 60000));
      if (mins < 60) return "已开播 " + mins + " 分钟";
      return "已开播 " + Math.floor(mins / 60) + " 小时 " + (mins % 60) + " 分";
    } catch (e) {
      return "进行中";
    }
  }

  function todayLiveSchedule() {
    if (!window.LiveOps) return [];
    var today = demoTodayPrefix();
    var lives = LiveOps.getLives().filter(function (l) {
      var key = LiveOps.scenarioKey(l);
      if (key === "upcoming" || key === "ended" || key === "cancelled") return false;
      var day = String(l.startAt || "").slice(0, 10);
      return day === today || key === "draft" || key === "platform_rejected" || key === "platform_pending" || key === "living";
    });
    var rank = { living: 0, draft: 1, platform_rejected: 1, platform_pending: 1, ready_shelf: 1 };
    lives.sort(function (a, b) {
      var ra = rank[LiveOps.scenarioKey(a)] != null ? rank[LiveOps.scenarioKey(a)] : 9;
      var rb = rank[LiveOps.scenarioKey(b)] != null ? rank[LiveOps.scenarioKey(b)] : 9;
      if (ra !== rb) return ra - rb;
      return String(a.startAt || "").localeCompare(String(b.startAt || ""));
    });
    return lives.map(function (l) {
      var key = LiveOps.scenarioKey(l);
      var id = l.liveId;
      var actions = [];
      if (key === "living") {
        actions = [
          { label: "进入中控台", href: "live-control.html?live_id=" + id + "&from=dashboard&return_url=" + encodeURIComponent("dashboard.html?restore=1") },
          { label: "打开直播大屏", href: "live-screen.html?live_id=" + id + "&from=dashboard" }
        ];
      } else if (key === "draft" || key === "platform_pending") {
        if (state.role === "auditor") {
          actions = [
            { label: "查看直播", href: "live-edit.html?live_id=" + id + "&mode=view&from=dashboard" },
            { label: "提醒负责人", action: "remind_owner", liveId: id, owner: l.owner || l.creator || "阮荣均" }
          ];
        } else {
          actions = [{ label: "继续编辑", href: "live-edit.html?live_id=" + id + "&from=dashboard&return_url=" + encodeURIComponent("dashboard.html?restore=1") }];
        }
      } else if (key === "platform_rejected") {
        if (state.role === "auditor") {
          actions = [{ label: "查看驳回原因", href: "live-edit.html?live_id=" + id + "&mode=view&from=platform_rejected&from=dashboard" }];
        } else {
          actions = [{ label: "查看原因并修改", href: "live-edit.html?live_id=" + id + "&from=platform_rejected&focus=cover&return_url=" + encodeURIComponent("dashboard.html?restore=1") }];
        }
      } else {
        actions = [{ label: "查看详情", href: LiveOps.viewLiveUrl(id) }];
      }
      var time = String(l.startAt || "");
      var timeShort = time.indexOf(" ") >= 0 ? time.split(" ")[1].slice(0, 5) : time;
      var stateKey =
        key === "living" ? "live" :
        (key === "draft" || key === "platform_rejected" || key === "platform_pending") ? "pending_audit" :
        "upcoming";
      return {
        id: id,
        name: l.liveName || l.name,
        time: timeShort,
        audit: stateKey === "pending_audit" ? "pending" : "",
        auditLabel: l.runtimeStatusLabel || l.platformReviewStatusLabel,
        state: stateKey,
        teacher: l.teacher || l.owner || "赵老师",
        duration: key === "living" ? liveDurationLabel(l) : "",
        network: key === "living" ? "网络良好" : "",
        actions: actions,
        roles: ["admin", "content", "sales", "auditor"]
      };
    });
  }

  function renderLive() {
    var role = ROLES[state.role];
    var block = $("block-live");
    if (!role.showLiveSchedule) { block.classList.add("wb-hidden"); return; }
    block.classList.remove("wb-hidden");
    var wrap = $("live-schedule");
    var empty = $("live-empty");
    var list = todayLiveSchedule().filter(function (l) {
      return !l.roles || l.roles.indexOf(state.role) >= 0;
    });
    wrap.innerHTML = "";
    if (!list.length) { empty.classList.remove("wb-hidden"); return; }
    empty.classList.add("wb-hidden");
    list.forEach(function (l) {
      var showAction = true;
      if (state.role === "sales" && l.state === "pending_audit") showAction = false;
      var actionsHtml = "";
      if (showAction) {
        actionsHtml = l.actions.map(function (a) {
          if (a.action === "remind_owner") {
            return '<button type="button" class="btn btn-sm" data-live-remind="' + esc(a.owner || "") + '">' + esc(a.label) + "</button>";
          }
          return '<a class="btn btn-sm" href="' + a.href + '" data-ctx="1">' + a.label + "</a>";
        }).join(" ");
      }
      var meta = l.state === "live"
        ? ("开播 " + esc(l.time) + " · 主播 " + esc(l.teacher) + " · " + esc(l.duration) + " · " + esc(l.network))
        : ("开播 " + esc(l.time) + " · 主播 " + esc(l.teacher));
      var div = document.createElement("div");
      div.className = "wb-live-item";
      div.innerHTML =
        "<div>" +
        '<div class="title">' + esc(l.name) +
        ' <span class="badge ' + (l.audit === "pending" ? "badge-warn" : l.state === "live" ? "badge-success" : "") + '" style="margin-left:6px;font-weight:500">' +
        esc(l.auditLabel) + "</span></div>" +
        '<div class="meta">' + meta + "</div>" +
        "</div>" +
        (actionsHtml ? '<div class="actions">' + actionsHtml + "</div>" : "");
      wrap.appendChild(div);
    });
  }

  function setUpdatedNow() {
    var d = new Date();
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
    $("last-updated").textContent = "最后更新 " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  function renderAll() {
    renderResults();
    renderRealtime();
    renderQuick();
    renderOwnerFilter();
    renderTodos();
    renderLive();
    document.querySelectorAll("#todo-tabs button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-filter") === state.todoFilter);
    });
    var tf = $("todo-type-filter");
    if (tf) tf.value = state.typeFilter || "";
  }

  /* ---------- drawers / modals ---------- */
  function closeWbOverlays() {
    var mask = $("wb-mask");
    if (mask) mask.classList.remove("open");
    document.querySelectorAll("#modal-assign-lead, #modal-submit-platform, #drawer-sms").forEach(function (n) {
      n.classList.remove("open");
    });
  }
  function openOverlay(node) {
    $("wb-mask").classList.add("open");
    node.classList.add("open");
  }

  function openAssignLead(todo) {
    var leads = (window.ProtoBiz && ProtoBiz.getLeads) ? ProtoBiz.getLeads("unassigned") : [];
    var lead = leads[0];
    if (!lead) { Proto.toast("暂无未分配线索"); return; }
    state.assignLeadId = lead.id;
    var isClaim = !ROLES[state.role].canAssign;
    $("assign-lead-info").innerHTML =
      '<div class="kv-row"><span>姓名</span><b>' + esc(lead.name) + "</b></div>" +
      '<div class="kv-row"><span>手机号</span><b>' + esc(lead.phone) + "</b></div>" +
      '<div class="kv-row"><span>来源</span><b>' + esc(lead.source) + "</b></div>" +
      '<div class="kv-row"><span>进入时间</span><b>' + esc(lead.enteredAt) + "</b></div>" +
      '<div class="kv-row"><span>意向等级</span><b>' + esc(lead.intent) + "</b></div>" +
      (leads.length > 1 ? '<div class="kv-row"><span>说明</span><b class="muted">将先处理最早进入的 1 条，共 ' + leads.length + " 条未分配</b></div>" : "");
    var sel = $("assign-owner");
    var owners = (window.ProtoBiz && ProtoBiz.getOwners) ? ProtoBiz.getOwners() : [{ id: "U001", name: "赵老师" }];
    if (isClaim) {
      sel.innerHTML = '<option value="赵老师">赵老师（本人）</option>';
      sel.disabled = true;
      $("btn-assign-confirm").textContent = "确认认领";
    } else {
      sel.disabled = false;
      sel.innerHTML = owners.map(function (o) {
        return '<option value="' + esc(o.name) + '">' + esc(o.name) + " · " + esc(o.role || "") + "</option>";
      }).join("");
      $("btn-assign-confirm").textContent = "确认分配";
    }
    openOverlay($("modal-assign-lead"));
  }

  function confirmAssignLead() {
    if (state.busy) return;
    var owner = $("assign-owner").value;
    if (!owner) { Proto.toast("请选择负责人"); return; }
    state.busy = true;
    $("btn-assign-confirm").classList.add("wb-busy");
    $("btn-assign-confirm").textContent = "正在分配…";
    setTimeout(function () {
      var res = ProtoBiz.assignLead(state.assignLeadId, owner, {
        createFollowTodo: $("assign-follow").checked,
        ownerId: ""
      });
      state.busy = false;
      $("btn-assign-confirm").classList.remove("wb-busy");
      closeWbOverlays();
      if (!res.ok) {
        if (res.error === "taken") Proto.toast("当前事项已被其他员工处理，已更新状态");
        else Proto.toast("操作失败，请重试");
        renderRealtime();
        renderTodos();
        return;
      }
      Proto.toast((ROLES[state.role].canAssign ? "已分配给" : "已认领给") + owner);
      renderRealtime();
      renderTodos();
      renderOwnerFilter();
    }, 450);
  }

  function openSubmitPlatform(todo) {
    state.submitLiveId = todo.liveId;
    var meta = todo.meta || {};
    $("submit-platform-info").innerHTML =
      '<div class="kv">' +
      '<div class="kv-row"><span>直播名称</span><b>' + esc(meta.liveName || todo.title) + "</b></div>" +
      '<div class="kv-row"><span>开播时间</span><b>' + esc(meta.startAt || todo.dueLabel) + "</b></div>" +
      '<div class="kv-row"><span>负责人</span><b>' + esc(meta.owner || todo.owner) + "</b></div>" +
      "</div>" +
      '<p class="muted" style="margin:12px 0 0;font-size:12px">提交后将进入平台审核，状态变为「等待系统结果」。</p>';
    openOverlay($("modal-submit-platform"));
  }

  function confirmSubmitPlatform() {
    if (state.busy || !state.submitLiveId) return;
    state.busy = true;
    $("btn-submit-platform-confirm").classList.add("wb-busy");
    $("btn-submit-platform-confirm").textContent = "正在提交…";
    setTimeout(function () {
      ProtoBiz.setAuditStatus(state.submitLiveId, "pending_platform_review", { by: WB_CONFIG.currentUser, side: "merchant" });
      state.bizIds["TODO_PLATFORM_" + state.submitLiveId] = "waiting";
      saveBiz();
      state.busy = false;
      $("btn-submit-platform-confirm").classList.remove("wb-busy");
      $("btn-submit-platform-confirm").textContent = "确认提交";
      closeWbOverlays();
      Proto.toast("已提交平台审核");
      renderRealtime();
      renderTodos();
      renderLive();
    }, 500);
  }

  function openSmsDrawer() {
    var list = ProtoBiz.getChannelOrders("failed");
    var body = $("sms-drawer-body");
    var ft = $("sms-drawer-ft");
    if (!list.length) {
      body.innerHTML = '<p class="muted">暂无发送失败的消息。</p>';
      ft.innerHTML = '<button type="button" class="btn" data-wb-close>关闭</button>';
      openOverlay($("drawer-sms"));
      return;
    }
    if (!state.smsSelectedId || !list.some(function (o) { return o.id === state.smsSelectedId; })) {
      state.smsSelectedId = list[0].id;
    }
    var cur = list.filter(function (o) { return o.id === state.smsSelectedId; })[0] || list[0];
    body.innerHTML =
      '<div style="margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px">' +
      list.map(function (o) {
        return '<button type="button" class="btn btn-sm' + (o.id === cur.id ? " btn-primary" : "") + '" data-sms-pick="' + o.id + '">' + esc(o.buyer) + "</button>";
      }).join("") + "</div>" +
      '<div class="kv">' +
      '<div class="kv-row"><span>关联客户</span><b>' + esc(cur.buyer) + " · " + esc(cur.phone) + "</b></div>" +
      '<div class="kv-row"><span>关联订单</span><b class="mono">' + esc(cur.orderId || cur.id) + "</b></div>" +
      '<div class="kv-row"><span>消息类型</span><b>' + esc(cur.msgType || "领课短信") + "</b></div>" +
      '<div class="kv-row"><span>内容摘要</span><b>' + esc(cur.content || cur.title) + "</b></div>" +
      '<div class="kv-row"><span>发送渠道</span><b>' + esc(cur.channel || "短信") + "</b></div>" +
      '<div class="kv-row"><span>失败原因</span><b style="color:#cb2634">' + esc(cur.failReason || "发送失败") + "</b></div>" +
      '<div class="kv-row"><span>最近发送</span><b>' + esc(cur.lastSendAt || cur.paidAt || "—") + "</b></div>" +
      '<div class="kv-row"><span>重试次数</span><b>' + esc(cur.retryCount || 0) + "</b></div>" +
      "</div>";
    ft.innerHTML =
      '<button type="button" class="btn btn-primary" id="btn-sms-resend">重新发送</button>' +
      '<button type="button" class="btn" id="btn-sms-channel">更换渠道</button>' +
      '<a class="btn" href="order-detail.html?id=' + encodeURIComponent(cur.orderId || "") + '&from=dashboard">查看关联订单</a>' +
      '<button type="button" class="btn" data-wb-close>关闭</button>';
    openOverlay($("drawer-sms"));
  }

  function handleTodoAction(act, todoId) {
    var todo = getTodos().filter(function (t) { return t.id === todoId; })[0];
    if (act === "toggle_sop_detail") {
      state.sopDetailOpen[todoId] = !state.sopDetailOpen[todoId];
      renderTodos();
      return;
    }
    if (!todo && act !== "done" && act !== "ignore" && act !== "snooze") {
      Proto.toast("当前事项已被其他员工处理，已更新状态");
      renderRealtime();
      renderTodos();
      return;
    }
    saveCtx();

    if (act === "claim") {
      if (state.busy) return;
      var leads = ProtoBiz.getLeads("unassigned");
      var lead = leads[0];
      if (!lead) { Proto.toast("暂无未分配线索"); renderRealtime(); renderTodos(); return; }
      state.busy = true;
      state.bizIds[todoId] = "processing";
      saveBiz();
      renderTodos();
      setTimeout(function () {
        var res = ProtoBiz.assignLead(lead.id, WB_CONFIG.currentUser, { createFollowTodo: true });
        state.busy = false;
        delete state.bizIds[todoId];
        saveBiz();
        if (!res.ok) {
          Proto.toast(res.error === "taken" ? "当前事项已被其他员工处理，已更新状态" : "认领失败，请重试");
        } else {
          Proto.toast("已认领给" + WB_CONFIG.currentUser);
        }
        renderRealtime();
        renderTodos();
        renderOwnerFilter();
      }, 400);
      return;
    }

    if (act === "goto_leads" || act === "assign") {
      location.href = hrefOf(todo) || "leads.html?focus=unassigned&from=dashboard";
      return;
    }
    if (act === "submit_platform") {
      if (state.role === "auditor") {
        Proto.toast("审核员不可代为提交平台审核，请提醒负责人处理");
        return;
      }
      openSubmitPlatform(todo);
      return;
    }
    if (act === "remind_owner") {
      Proto.toast("已提醒负责人「" + (todo.owner || "内容负责人") + "」尽快完善并提交");
      return;
    }
    if (act === "view_reject" || act === "view_live") {
      location.href = hrefOf(todo);
      return;
    }
    if (act === "complete_draft" || act === "fix_reject" || act === "control" || act === "aftersale" || act === "config" || act === "audience" || act === "view") {
      if (state.role === "auditor" && (act === "complete_draft" || act === "fix_reject")) {
        Proto.toast("审核员不可代为修改直播，请使用查看或提醒");
        return;
      }
      state.bizIds[todoId] = "processing";
      saveBiz();
      location.href = hrefOf(todo);
      return;
    }
    if (act === "resend") {
      openSmsDrawer();
      return;
    }
    if (act === "retry" || act === "resume" || act === "start") {
      if (!todo.sopId) { location.href = hrefOf(todo); return; }
      if (state.busy || state.bizIds[todoId] === "retrying") return;
      state.busy = true;
      state.bizIds[todoId] = "retrying";
      saveBiz();
      renderTodos();
      setTimeout(function () {
        var res = ProtoBiz.retrySop
          ? ProtoBiz.retrySop(todo.sopId, WB_CONFIG.currentUser, {})
          : { ok: !!ProtoBiz.setSopStatus(todo.sopId, "scheduled", WB_CONFIG.currentUser) };
        state.busy = false;
        if (res && res.ok) {
          delete state.bizIds[todoId];
          saveBiz();
          Proto.toast("已重试并恢复排期");
          renderRealtime();
          renderTodos();
        } else {
          state.bizIds[todoId] = "retry_fail";
          saveBiz();
          Proto.toast("重试失败：" + ((res && res.sop && res.sop.failReason) || "请稍后再试"));
          renderRealtime();
          renderTodos();
        }
      }, 700);
      return;
    }
    if (act === "done" || act === "ignore" || act === "snooze") {
      if (todo && !isSuggestion(todo)) {
        Proto.toast("该任务需通过业务操作完成，不能手动标记");
        return;
      }
      if (act === "ignore") ProtoBiz.ignoreSuggestion(todoId);
      else if (act === "snooze") ProtoBiz.snoozeSuggestion(todoId);
      else ProtoBiz.markTodoDone(todoId);
      state.doneIds[todoId] = true;
      saveDone();
      Proto.toast(act === "ignore" ? "已忽略" : act === "snooze" ? "已稍后提醒" : "已标记完成");
      renderTodos();
      renderRealtime();
      return;
    }
    if (todo && hrefOf(todo)) location.href = hrefOf(todo);
  }

  /* ---------- events ---------- */
  function bindEvents() {
    $("range-seg").addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-range]");
      if (!btn) return;
      state.range = btn.getAttribute("data-range");
      saveRange();
      document.querySelectorAll("#range-seg button").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-range") === state.range);
      });
      renderResults();
    });

    $("todo-tabs").addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-filter]");
      if (!btn) return;
      state.todoFilter = btn.getAttribute("data-filter");
      document.querySelectorAll("#todo-tabs button").forEach(function (b) {
        b.classList.toggle("active", b === btn);
      });
      /* 切换页签时清掉不适用的类型筛选 */
      if (state.typeFilter) {
        var mustKeys = { lead: 1, audit: 1, urge: 1, aftersale: 1, live_exception: 1 };
        var sugKeys = { follow: 1, content: 1, remind: 1 };
        if (state.todoFilter === "must" && !mustKeys[state.typeFilter]) state.typeFilter = "";
        if (state.todoFilter === "suggest" && !sugKeys[state.typeFilter]) state.typeFilter = "";
        document.querySelectorAll("#realtime-stats .stat-card").forEach(function (c) {
          c.classList.toggle("is-active", c.getAttribute("data-todo-filter") === state.typeFilter);
        });
      }
      renderTodos();
      saveCtx();
    });

    $("todo-type-filter").addEventListener("change", function () {
      setTypeFilter(this.value);
      if (this.value) scrollToTodo();
    });
    $("todo-owner-filter").addEventListener("change", function () {
      state.ownerFilter = this.value;
      renderTodos();
      saveCtx();
    });
    $("btn-clear-todo-filter").addEventListener("click", function () {
      state.ownerFilter = "";
      setTypeFilter("");
      renderOwnerFilter();
    });
    var emptyClear = $("todo-empty-clear");
    if (emptyClear) {
      emptyClear.addEventListener("click", function () {
        state.ownerFilter = "";
        setTypeFilter("");
        renderOwnerFilter();
      });
    }

    $("realtime-stats").addEventListener("click", function (e) {
      var card = e.target.closest("[data-todo-filter]");
      if (!card) return;
      var key = card.getAttribute("data-todo-filter");
      state.todoFilter = "must";
      document.querySelectorAll("#todo-tabs button").forEach(function (b) {
        b.classList.toggle("active", b.getAttribute("data-filter") === "must");
      });
      setTypeFilter(state.typeFilter === key ? "" : key);
      scrollToTodo();
    });

    $("todo-body").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-todo-act]");
      if (!btn) return;
      e.preventDefault();
      handleTodoAction(btn.getAttribute("data-todo-act"), btn.getAttribute("data-todo-id"));
    });

    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-ctx]")) saveCtx();
      var remind = e.target.closest("[data-live-remind]");
      if (remind) {
        Proto.toast("已提醒负责人「" + (remind.getAttribute("data-live-remind") || "内容负责人") + "」尽快完善并提交");
        return;
      }
      if (e.target.closest("[data-wb-close]")) { closeWbOverlays(); return; }
      var pick = e.target.closest("[data-sms-pick]");
      if (pick) {
        state.smsSelectedId = pick.getAttribute("data-sms-pick");
        openSmsDrawer();
        return;
      }
      if (e.target.id === "btn-sms-resend") {
        if (state.busy) return;
        state.busy = true;
        e.target.textContent = "正在发送…";
        e.target.classList.add("wb-busy");
        var id = state.smsSelectedId;
        setTimeout(function () {
          /* CO002 演示再次失败；其余成功 */
          var forceFail = id === "CO002";
          var results = ProtoBiz.resendSms([id], forceFail ? { forceFail: true, failReason: "空号/停机，建议更换渠道" } : {});
          state.busy = false;
          var ok = results[0] && results[0].ok;
          if (ok) {
            Proto.toast("消息已重新发送");
            closeWbOverlays();
          } else {
            Proto.toast("发送失败：" + ((results[0] && results[0].reason) || "请重试"));
            openSmsDrawer();
          }
          renderRealtime();
          renderTodos();
        }, 600);
        return;
      }
      if (e.target.id === "btn-sms-channel") {
        Proto.toast("已切换为企微渠道（原型），可再次重新发送");
        try {
          var data = ProtoBiz.load();
          var row = (data.channelOrders || []).find(function (o) { return o.id === state.smsSelectedId; });
          if (row) {
            row.channel = "企微";
            ProtoBiz.save(data);
          }
        } catch (err) {}
        openSmsDrawer();
      }
    });

    $("wb-mask").addEventListener("click", closeWbOverlays);
    $("btn-assign-confirm").addEventListener("click", confirmAssignLead);
    $("btn-submit-platform-confirm").addEventListener("click", confirmSubmitPlatform);

    $("role-select").addEventListener("change", function () {
      state.role = this.value;
      saveRole();
      state.typeFilter = "";
      state.ownerFilter = "";
      state.todoFilter = "must";
      document.querySelectorAll("#realtime-stats .stat-card").forEach(function (c) {
        c.classList.remove("is-active");
      });
      renderAll();
      Proto.toast("已切换为「" + ROLES[state.role].label + "」视角");
    });

    $("btn-refresh").addEventListener("click", function () {
      if (state.refreshing) return;
      state.refreshing = true;
      this.classList.add("is-loading");
      this.textContent = "刷新中…";
      setTimeout(function () {
        state.refreshing = false;
        $("btn-refresh").classList.remove("is-loading");
        $("btn-refresh").textContent = "刷新";
        setUpdatedNow();
        renderAll();
        Proto.toast("工作台已更新");
      }, 500);
    });

    $("btn-reset-demo").addEventListener("click", function () {
      if (!confirm("确认重置演示数据？将恢复 ProtoBiz 种子并刷新页面。")) return;
      try { if (window.ProtoBiz) ProtoBiz.reset(); } catch (e1) {}
      try {
        sessionStorage.removeItem(WB_CONFIG.storageTodo);
        sessionStorage.removeItem(WB_CONFIG.storageBiz);
        sessionStorage.removeItem(WB_CONFIG.storageCtx);
      } catch (e3) {}
      location.reload();
    });

    window.addEventListener("beforeunload", saveCtx);
  }

  function boot() {
    loadDone();
    loadRole();
    loadRange();
    try {
      var q = new URLSearchParams(location.search);
      var r = q.get("range");
      if (r && RANGE_META[r]) { state.range = r; saveRange(); }
    } catch (e) {}
    $("role-select").value = state.role;
    document.querySelectorAll("#range-seg button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-range") === state.range);
    });
    setUpdatedNow();
    restoreCtx();
    bindEvents();
    renderAll();
    if (state.typeFilter) setTypeFilter(state.typeFilter);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
