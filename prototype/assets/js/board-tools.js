/**
 * 经营分析工具栏（P2）
 * 自定义日期 / 常用视图 / 导出 / 分享 / 数据口径
 * 依赖：board-metrics、board-dictionary、proto；可选 board-insights
 */
(function (global) {
  var VIEWS_KEY = "tob_board_saved_views_v1";
  var VIEWS_VERSION = 1;
  var ACTIVE_VIEW_KEY = "tob_board_active_view_v1";
  var _cfg = null;
  var _lastFocus = null;

  function BM() { return global.BoardMetrics; }
  function BI() { return global.BoardInsights; }
  function Dict() { return global.BoardDictionary; }
  function toast(msg) {
    if (global.Proto && Proto.toast) Proto.toast(msg);
  }

  function pageFile() {
    try {
      return (location.pathname || "").split("/").pop() || "board-overview.html";
    } catch (e) {
      return "board-overview.html";
    }
  }

  function pageKey() {
    var p = pageFile();
    if (/acquire/.test(p)) return "acquire";
    if (/private/.test(p)) return "private";
    if (/live/.test(p)) return "live";
    if (/convert/.test(p)) return "convert";
    return "overview";
  }

  function uid() {
    return "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  /* ---------- saved views ---------- */
  function loadViewsStore() {
    try {
      var raw = localStorage.getItem(VIEWS_KEY);
      if (!raw) return { version: VIEWS_VERSION, views: [] };
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.views)) return { version: VIEWS_VERSION, views: [] };
      return { version: parsed.version || VIEWS_VERSION, views: parsed.views };
    } catch (e) {
      return { version: VIEWS_VERSION, views: [] };
    }
  }

  function saveViewsStore(store) {
    localStorage.setItem(VIEWS_KEY, JSON.stringify({
      version: VIEWS_VERSION,
      views: store.views || []
    }));
  }

  function listViews(forPage) {
    var all = loadViewsStore().views;
    if (!forPage) return all.slice();
    return all.filter(function (v) { return v.page === forPage || v.pageKey === pageKey(); });
  }

  function collectState() {
    var f = BM().getFilters();
    var st = (BI() && BI().getAnalyticsState) ? BI().getAnalyticsState() : {};
    var q = new URLSearchParams(location.search);
    var state = {
      range: f.range,
      start_date: f.start_date || "",
      end_date: f.end_date || "",
      channel: f.channel || "",
      term: f.term || "",
      src: f.src || "",
      tab: f.tab || "",
      owner: q.get("owner") || st.selectedOwner || st.owner || "",
      live_id: q.get("selected_live") || q.get("live_id") || st.selectedLive || st.liveId || "",
      selected_live: q.get("selected_live") || q.get("live_id") || st.selectedLive || st.liveId || "",
      selected_channel: q.get("selected_channel") || st.selectedChannel || "",
      selected_term: q.get("selected_term") || st.selectedTerm || "",
      selected_owner: q.get("selected_owner") || st.selectedOwner || "",
      selected_product: q.get("selected_product") || st.selectedProduct || "",
      bottleneck_id: q.get("bottleneck_id") || st.bottleneckId || "",
      funnel_step: q.get("funnel_step") || st.funnelStep || "",
      funnel_dim: q.get("funnel_dim") || st.funnelDim || "",
      dimension: q.get("dimension") || st.dimension || "",
      sort: q.get("sort") || st.channelSort || st.staffSort || "",
      live_tab: q.get("live_tab") || st.liveTab || "",
      live_sort: q.get("live_sort") || st.liveSort || "",
      section: q.get("section") || st.section || "",
      cross_filter: st.crossFilter || null,
      analytics: st
    };
    if (_cfg && typeof _cfg.collectExtra === "function") {
      Object.assign(state, _cfg.collectExtra() || {});
    }
    return state;
  }

  function applyState(state, opts) {
    opts = opts || {};
    if (!state) return;
    BM().setFilters({
      range: state.range || "7d",
      start_date: state.start_date || "",
      end_date: state.end_date || "",
      channel: state.channel || "",
      term: state.term || "",
      src: state.src || "",
      tab: state.tab || ""
    }, { push: !!opts.push });

    if (BI() && BI().setAnalyticsState) {
      BI().setAnalyticsState(Object.assign({}, state.analytics || {}, {
        funnelStep: state.funnel_step || "",
        funnelDim: state.funnel_dim || "",
        liveId: state.selected_live || state.live_id || "",
        selectedLive: state.selected_live || state.live_id || "",
        selectedChannel: state.selected_channel || "",
        selectedTerm: state.selected_term || "",
        selectedOwner: state.selected_owner || state.owner || "",
        selectedProduct: state.selected_product || "",
        bottleneckId: state.bottleneck_id || "",
        channelSort: state.sort || "",
        staffSort: state.sort || "",
        dimension: state.dimension || "",
        section: state.section || "",
        liveTab: state.live_tab || "",
        liveSort: state.live_sort || "",
        crossFilter: state.cross_filter || null
      }), { syncUrl: true, push: false });
    }

    var params = new URLSearchParams(location.search);
    [
      "owner", "live_id", "selected_live", "selected_channel", "selected_term", "selected_owner",
      "selected_product", "bottleneck_id", "funnel_step", "funnel_dim", "dimension", "sort",
      "section", "live_tab", "live_sort"
    ].forEach(function (k) {
      var v = state[k];
      if (v) params.set(k, v);
      else params.delete(k);
    });
    var qs = params.toString();
    var next = location.pathname + (qs ? "?" + qs : "") + location.hash;
    history.replaceState({ boardTools: true }, "", next);

    var ch = document.getElementById("f-channel");
    var term = document.getElementById("f-term");
    var src = document.getElementById("f-src");
    var owner = document.getElementById("f-owner");
    if (ch) ch.value = state.channel || "";
    if (term) term.value = state.term || "";
    if (src) src.value = state.src || "";
    if (owner && (state.owner || state.selected_owner)) owner.value = state.owner || state.selected_owner;

    BM().syncRangeUI();
    BM().applyRange(BM().getFilters().range, document, { skipSet: true });
    if (_cfg && typeof _cfg.onApply === "function") {
      _cfg.onApply(BM().getFilters().range, BM().aggregateLeadMetrics(), BM().getFilters());
    }
  }

  function getActiveViewId() {
    try {
      var raw = sessionStorage.getItem(ACTIVE_VIEW_KEY);
      if (!raw) return "";
      var o = JSON.parse(raw);
      return (o && o.page === pageFile()) ? (o.id || "") : "";
    } catch (e) { return ""; }
  }

  function setActiveViewId(id) {
    try {
      sessionStorage.setItem(ACTIVE_VIEW_KEY, JSON.stringify({ page: pageFile(), id: id || "" }));
    } catch (e) {}
  }

  function viewMatchesCurrent(view) {
    if (!view || !view.state) return false;
    var cur = collectState();
    var s = view.state;
    var keys = ["range", "start_date", "end_date", "channel", "term", "src", "tab", "owner", "live_id", "funnel_step", "funnel_dim", "dimension", "sort", "section"];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (String(s[k] || "") !== String(cur[k] || "")) return false;
    }
    return true;
  }

  function createView(name) {
    name = String(name || "").trim();
    if (!name) return { ok: false, error: "请输入视图名称" };
    var store = loadViewsStore();
    var page = pageFile();
    if (store.views.some(function (v) { return v.page === page && v.name === name; })) {
      return { ok: false, error: "同名视图已存在，请换名或选择更新" };
    }
    var view = {
      id: uid(),
      version: VIEWS_VERSION,
      name: name,
      page: page,
      pageKey: pageKey(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      state: collectState()
    };
    store.views.unshift(view);
    saveViewsStore(store);
    setActiveViewId(view.id);
    return { ok: true, view: view };
  }

  function updateView(id) {
    var store = loadViewsStore();
    var idx = store.views.findIndex(function (v) { return v.id === id; });
    if (idx < 0) return { ok: false, error: "视图不存在" };
    store.views[idx].state = collectState();
    store.views[idx].updatedAt = new Date().toISOString();
    saveViewsStore(store);
    setActiveViewId(id);
    return { ok: true, view: store.views[idx] };
  }

  function renameView(id, name) {
    name = String(name || "").trim();
    if (!name) return { ok: false, error: "名称不能为空" };
    var store = loadViewsStore();
    var view = store.views.find(function (v) { return v.id === id; });
    if (!view) return { ok: false, error: "视图不存在" };
    if (store.views.some(function (v) { return v.id !== id && v.page === view.page && v.name === name; })) {
      return { ok: false, error: "同名视图已存在" };
    }
    view.name = name;
    view.updatedAt = new Date().toISOString();
    saveViewsStore(store);
    return { ok: true, view: view };
  }

  function deleteView(id) {
    var store = loadViewsStore();
    store.views = store.views.filter(function (v) { return v.id !== id; });
    saveViewsStore(store);
    if (getActiveViewId() === id) setActiveViewId("");
    return { ok: true };
  }

  function seedDemoViewsIfEmpty() {
    var store = loadViewsStore();
    if (store.views.length) return;
    var demos = [
      { name: "视频号近7天", page: "board-acquire.html", pageKey: "acquire", state: { range: "7d", channel: "video", term: "", sort: "pool" } },
      { name: "春季03期复盘", page: "board-overview.html", pageKey: "overview", state: { range: "7d", channel: "", term: "spring03", funnel_step: "wecom_attend", funnel_dim: "channel" } },
      { name: "团队执行异常", page: "board-private.html", pageKey: "private", state: { range: "7d", tab: "handoff", sort: "noFollow" } },
      { name: "已结束直播场次", page: "board-live.html", pageKey: "live", state: { range: "7d", live_id: "L03" } },
      { name: "到场未支付分析", page: "board-convert.html", pageKey: "convert", state: { range: "7d", dimension: "nopay", section: "attributed" } }
    ];
    demos.forEach(function (d) {
      store.views.push({
        id: uid(),
        version: VIEWS_VERSION,
        name: d.name,
        page: d.page,
        pageKey: d.pageKey,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        state: d.state,
        isDemo: true
      });
    });
    saveViewsStore(store);
  }

  /* ---------- share ---------- */
  function buildShareUrl() {
    var state = collectState();
    var params = new URLSearchParams();
    Object.keys(state).forEach(function (k) {
      if (k === "analytics" || k === "cross_filter") return;
      var v = state[k];
      if (v == null || v === "") return;
      params.set(k, String(v));
    });
    if (state.cross_filter && typeof state.cross_filter === "object") {
      try { params.set("cross_filter", JSON.stringify(state.cross_filter)); } catch (e) {}
    }
    var url = location.origin + location.pathname + "?" + params.toString();
    return url;
  }

  function shareSummary() {
    var f = BM().getFilters();
    var parts = [BM().rangeLabel(f)];
    if (f.channel) parts.push(BM().channelLabel(f.channel));
    if (f.term) parts.push(BM().termLabel(f.term));
    var q = new URLSearchParams(location.search);
    if (q.get("funnel_step")) parts.push(q.get("funnel_step"));
    if (q.get("dimension")) parts.push(q.get("dimension"));
    if (q.get("live_id")) parts.push(q.get("live_id"));
    return parts.join(" · ");
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }).catch(function () {
        return fallbackCopy(text);
      });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  /* ---------- custom date ---------- */
  function openCustomDate(onApplied) {
    _lastFocus = document.activeElement;
    var existing = document.getElementById("board-custom-date-modal");
    if (existing) existing.remove();
    var f = BM().getFilters();
    var max = BM().formatYmd(BM().businessToday());
    var modal = document.createElement("div");
    modal.id = "board-custom-date-modal";
    modal.className = "board-modal-overlay";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "自定义日期");
    modal.innerHTML =
      '<div class="board-modal">' +
      '<div class="board-modal-hd"><h3>自定义日期</h3><button type="button" class="btn btn-sm" data-close>×</button></div>' +
      '<div class="board-modal-bd">' +
      '<label class="board-field">开始日期<input type="date" id="cd-start" max="' + max + '" value="' + (f.start_date || "") + '" /></label>' +
      '<label class="board-field">结束日期<input type="date" id="cd-end" max="' + max + '" value="' + (f.end_date || "") + '" /></label>' +
      '<p class="board-field-error" id="cd-error" hidden></p>' +
      '<p class="muted" style="font-size:12px;margin:8px 0 0">业务日期上限：' + max + ' · 应用后环比说明为「与上一等长周期比较」</p>' +
      '</div>' +
      '<div class="board-modal-ft">' +
      '<button type="button" class="btn" data-clear>清空并恢复近7日</button>' +
      '<button type="button" class="btn" data-cancel>取消</button>' +
      '<button type="button" class="btn btn-primary" data-apply>确认应用</button>' +
      '</div></div>';
    document.body.appendChild(modal);
    var startEl = document.getElementById("cd-start");
    var endEl = document.getElementById("cd-end");
    var errEl = document.getElementById("cd-error");
    function close() {
      modal.remove();
      if (_lastFocus && _lastFocus.focus) _lastFocus.focus();
    }
    function showErr(msg) {
      errEl.hidden = !msg;
      errEl.textContent = msg || "";
    }
    modal.querySelector("[data-close]").onclick = close;
    modal.querySelector("[data-cancel]").onclick = close;
    modal.addEventListener("click", function (e) { if (e.target === modal) close(); });
    modal.querySelector("[data-clear]").onclick = function () {
      BM().setFilters({ range: "7d", start_date: "", end_date: "" }, { push: true });
      BM().syncRangeUI();
      BM().applyRange("7d", document, { skipSet: true });
      if (typeof onApplied === "function") onApplied();
      if (_cfg && _cfg.onApply) _cfg.onApply("7d", BM().aggregateLeadMetrics(), BM().getFilters());
      toast("已恢复近7日");
      close();
    };
    modal.querySelector("[data-apply]").onclick = function () {
      var s = startEl.value;
      var e = endEl.value;
      var chk = BM().isValidCustomRange(s, e);
      if (!chk.ok) { showErr(chk.error); return; }
      showErr("");
      BM().setFilters({ range: "custom", start_date: s, end_date: e }, { push: true });
      BM().syncRangeUI();
      BM().applyRange("custom", document, { skipSet: true });
      if (typeof onApplied === "function") onApplied();
      if (_cfg && _cfg.onApply) _cfg.onApply("custom", BM().aggregateLeadMetrics(), BM().getFilters());
      toast("已应用自定义日期");
      close();
    };
    document.addEventListener("keydown", function onEsc(ev) {
      if (ev.key === "Escape") {
        document.removeEventListener("keydown", onEsc);
        close();
      }
    });
    startEl.focus();
  }

  /* ---------- glossary ---------- */
  function openGlossary(focusId) {
    _lastFocus = document.activeElement;
    var existing = document.getElementById("board-glossary-drawer");
    if (existing) existing.remove();
    var drawer = document.createElement("div");
    drawer.id = "board-glossary-drawer";
    drawer.className = "board-drawer-overlay";
    drawer.innerHTML =
      '<div class="board-drawer" role="dialog" aria-modal="true" aria-label="数据口径">' +
      '<div class="board-drawer-hd"><h3>数据口径</h3><button type="button" class="btn btn-sm" data-close>×</button></div>' +
      '<div class="board-drawer-bd">' +
      '<p class="muted" style="font-size:12px;margin:0 0 8px">当前筛选：' + BM().rangeLabel(BM().getFilters()) +
      (BM().getFilters().channel ? " · " + BM().channelLabel(BM().getFilters().channel) : "") +
      (BM().getFilters().term ? " · " + BM().termLabel(BM().getFilters().term) : "") + "</p>" +
      '<input type="search" id="gl-search" class="board-search" placeholder="搜索指标，如退款率" />' +
      '<div class="board-gl-cats" id="gl-cats"></div>' +
      '<div id="gl-list"></div>' +
      '<div class="board-gl-note">' +
      "<p><b>全量 vs 归因</b>：全量按支付事件；归因须能关联线索/渠道/期次。缺映射显示「—」。</p>" +
      "<p><b>去重</b>：人数类指标默认按用户去重；订单/金额按单据汇总。</p>" +
      "<p><b>更新</b>：" + ((BM().getSnapshot() && BM().getSnapshot().snapshotAt) || "—") + "</p>" +
      "</div></div></div>";
    document.body.appendChild(drawer);
    var cat = "";
    var listEl = document.getElementById("gl-list");
    var catsEl = document.getElementById("gl-cats");
    function renderList() {
      var q = (document.getElementById("gl-search").value || "");
      var rows = Dict().search(q);
      if (cat) rows = rows.filter(function (m) { return m.category === cat; });
      listEl.innerHTML = rows.map(function (m) {
        return '<article class="board-gl-item" id="gl-item-' + m.id + '" tabindex="-1">' +
          "<h4>" + m.name + ' <span class="muted">' + m.category + "</span></h4>" +
          "<p>" + m.short + "</p>" +
          '<p class="muted">公式：' + m.formula + "</p>" +
          '<p class="muted">分子：' + m.numerator + " · 分母：" + m.denominator + "</p>" +
          '<p class="muted">范围：' + m.scope + " · " + m.caliber + " · " + m.dedupe + "</p>" +
          (m.note ? "<p>" + m.note + "</p>" : "") +
          "</article>";
      }).join("") || '<p class="muted">无匹配指标</p>';
      if (focusId) {
        var el = document.getElementById("gl-item-" + focusId);
        if (el) {
          el.scrollIntoView({ block: "center" });
          el.style.outline = "2px solid var(--color-primary)";
        }
      }
    }
    catsEl.innerHTML = '<button type="button" class="btn btn-sm active" data-cat="">全部</button>' +
      Dict().categories().map(function (c) {
        return '<button type="button" class="btn btn-sm" data-cat="' + c + '">' + c + "</button>";
      }).join("");
    catsEl.querySelectorAll("[data-cat]").forEach(function (b) {
      b.onclick = function () {
        cat = b.getAttribute("data-cat");
        catsEl.querySelectorAll("button").forEach(function (x) { x.classList.toggle("active", x === b); });
        renderList();
      };
    });
    document.getElementById("gl-search").oninput = renderList;
    function close() {
      drawer.remove();
      if (_lastFocus && _lastFocus.focus) _lastFocus.focus();
    }
    drawer.querySelector("[data-close]").onclick = close;
    drawer.addEventListener("click", function (e) { if (e.target === drawer) close(); });
    document.addEventListener("keydown", function onEsc(ev) {
      if (ev.key === "Escape") {
        document.removeEventListener("keydown", onEsc);
        close();
      }
    });
    renderList();
    document.getElementById("gl-search").focus();
  }

  function bindMetricTips(root) {
    root = root || document;
    root.querySelectorAll("[data-metric]").forEach(function (el) {
      if (el.getAttribute("data-metric-bound")) return;
      el.setAttribute("data-metric-bound", "1");
      var id = el.getAttribute("data-metric");
      var m = Dict().getById(id);
      if (!m) return;
      if (!el.querySelector(".metric-help")) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "metric-help";
        btn.setAttribute("aria-label", m.name + "说明");
        btn.textContent = "?";
        el.appendChild(btn);
        btn.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          showMetricPop(btn, m);
        });
        btn.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            showMetricPop(btn, m);
          }
        });
      }
    });
  }

  function showMetricPop(anchor, m) {
    var old = document.getElementById("metric-pop");
    if (old) old.remove();
    _lastFocus = anchor;
    var pop = document.createElement("div");
    pop.id = "metric-pop";
    pop.className = "metric-pop";
    pop.setAttribute("role", "dialog");
    pop.innerHTML = "<b>" + m.name + "</b><p>" + m.short + "</p><p class='muted'>公式：" + m.formula +
      "</p><p class='muted'>范围：" + m.scope + "</p>" +
      '<button type="button" class="btn btn-sm" data-more>查看完整口径</button>' +
      '<button type="button" class="btn btn-sm" data-close>关闭</button>';
    document.body.appendChild(pop);
    var r = anchor.getBoundingClientRect();
    pop.style.left = Math.min(r.left, window.innerWidth - 320) + "px";
    pop.style.top = (r.bottom + 6 + window.scrollY) + "px";
    pop.querySelector("[data-close]").onclick = function () {
      pop.remove();
      anchor.focus();
    };
    pop.querySelector("[data-more]").onclick = function () {
      pop.remove();
      openGlossary(m.id);
    };
    document.addEventListener("keydown", function onEsc(ev) {
      if (ev.key === "Escape") {
        document.removeEventListener("keydown", onEsc);
        pop.remove();
        anchor.focus();
      }
    }, { once: true });
    pop.querySelector("[data-close]").focus();
  }

  /* ---------- export / print ---------- */
  function exportCurrentCsv() {
    if (!_cfg || typeof _cfg.getExportTable !== "function") {
      toast("当前页面暂无可导出表格");
      return;
    }
    var table = _cfg.getExportTable();
    if (!table || !table.headers || !table.rows || !table.rows.length) {
      toast(table && table.reason ? table.reason : "当前筛选下无可导出数据");
      return;
    }
    var name = table.filename || BM().exportFileName(table.name || pageKey());
    var summary = "导出范围：" + BM().rangeLabel(BM().getFilters()) +
      (BM().getFilters().channel ? " · " + BM().channelLabel(BM().getFilters().channel) : "") +
      (BM().getFilters().term ? " · " + BM().termLabel(BM().getFilters().term) : "") +
      " · " + table.rows.length + " 行";
    toast(summary);
    setTimeout(function () {
      BM().exportCsv(name, table.headers, table.rows);
      toast("CSV 已导出");
    }, 200);
  }

  function printReport() {
    document.body.classList.add("board-printing");
    var bar = document.getElementById("board-print-banner");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "board-print-banner";
      bar.className = "board-print-banner";
      document.getElementById("page-content").insertBefore(bar, document.getElementById("page-content").firstChild);
    }
    var f = BM().getFilters();
    bar.innerHTML = "<h1>" + (document.body.getAttribute("data-title") || "经营分析") + "</h1>" +
      "<p>筛选：" + BM().rangeLabel(f) +
      (f.channel ? " · " + BM().channelLabel(f.channel) : " · 全部渠道") +
      (f.term ? " · " + BM().termLabel(f.term) : " · 全部期次") + "</p>" +
      "<p>生成时间：" + new Date().toLocaleString("zh-CN") +
      " · 数据截止：" + ((BM().getSnapshot() && BM().getSnapshot().snapshotAt) || "—") + "</p>" +
      "<p class='muted'>口径摘要：全量成交按支付事件；可归因成交须关联线索/渠道/期次。</p>";
    window.print();
    setTimeout(function () {
      document.body.classList.remove("board-printing");
    }, 300);
  }

  function copySummary() {
    var f = BM().getFilters();
    var d = BM().aggregateLeadMetrics(f);
    var text = [
      document.body.getAttribute("data-title") || "经营分析",
      shareSummary(),
      "私域池 " + (d.poolLeads != null ? d.poolLeads : "—"),
      "加微 " + (d.wecomLeads != null ? d.wecomLeads : "—"),
      "可归因支付 " + (d.attributedPayUsers != null ? d.attributedPayUsers : "—"),
      "链接 " + buildShareUrl()
    ].join("\n");
    copyText(text).then(function (ok) {
      toast(ok ? "数据摘要已复制" : "复制失败，请手动选择");
    });
  }

  /* ---------- toolbar UI ---------- */
  function closeMenus() {
    document.querySelectorAll(".board-toolbar-menu").forEach(function (m) { m.hidden = true; });
  }

  function ensureToolbar() {
    if (document.getElementById("board-toolbar")) return;
    var host = document.getElementById("page-header-actions") || document.getElementById("header-actions");
    if (!host) return;
    seedDemoViewsIfEmpty();
    var wrap = document.createElement("div");
    wrap.id = "board-toolbar";
    wrap.className = "board-toolbar";
    wrap.innerHTML =
      '<div class="board-toolbar-group">' +
      '<button type="button" class="btn btn-sm" id="btn-views">常用视图</button>' +
      '<div class="board-toolbar-menu" id="menu-views" hidden></div>' +
      '</div>' +
      '<button type="button" class="btn btn-sm" id="btn-save-view">保存当前视图</button>' +
      '<button type="button" class="btn btn-sm" id="btn-glossary">数据口径</button>' +
      '<div class="board-toolbar-group">' +
      '<button type="button" class="btn btn-sm" id="btn-export-menu">导出</button>' +
      '<div class="board-toolbar-menu" id="menu-export" hidden>' +
      '<button type="button" data-exp="csv">导出当前表格CSV</button>' +
      '<button type="button" data-exp="print">打印当前报表</button>' +
      '<button type="button" data-exp="summary">复制当前数据摘要</button>' +
      '</div></div>' +
      '<button type="button" class="btn btn-sm" id="btn-share">分享</button>' +
      '<span class="board-view-status muted" id="board-view-status"></span>';
    host.appendChild(wrap);

    document.getElementById("btn-glossary").onclick = function () { openGlossary(); };
    document.getElementById("btn-share").onclick = function () {
      var url = buildShareUrl();
      copyText(url).then(function (ok) {
        toast(ok ? ("链接已复制 · " + shareSummary()) : "复制失败，请手动复制地址栏");
        if (!ok) {
          window.prompt("复制分享链接", url);
        }
      });
    };
    document.getElementById("btn-save-view").onclick = function () { openSaveViewDialog(); };
    document.getElementById("btn-views").onclick = function (e) {
      e.stopPropagation();
      var menu = document.getElementById("menu-views");
      var show = menu.hidden;
      closeMenus();
      if (show) {
        renderViewsMenu();
        menu.hidden = false;
      }
    };
    document.getElementById("btn-export-menu").onclick = function (e) {
      e.stopPropagation();
      var menu = document.getElementById("menu-export");
      var show = menu.hidden;
      closeMenus();
      menu.hidden = !show;
      var csvBtn = menu.querySelector('[data-exp="csv"]');
      var canCsv = _cfg && typeof _cfg.getExportTable === "function";
      var table = canCsv ? _cfg.getExportTable() : null;
      var ok = table && table.rows && table.rows.length;
      csvBtn.disabled = !ok;
      csvBtn.title = ok ? "" : ((table && table.reason) || "当前无可导出表格");
    };
    document.getElementById("menu-export").onclick = function (e) {
      var b = e.target.closest("[data-exp]");
      if (!b || b.disabled) return;
      closeMenus();
      var t = b.getAttribute("data-exp");
      if (t === "csv") exportCurrentCsv();
      else if (t === "print") printReport();
      else if (t === "summary") copySummary();
    };
    document.addEventListener("click", closeMenus);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenus();
    });
    updateViewStatus();
    BM().onFilterChange(function () { updateViewStatus(); });
  }

  function renderViewsMenu() {
    var menu = document.getElementById("menu-views");
    var views = listViews().filter(function (v) { return v.page === pageFile() || v.pageKey === pageKey(); });
    var active = getActiveViewId();
    menu.innerHTML = '<p class="muted" style="padding:6px 10px;margin:0;font-size:11px">当前原型仅保存在本浏览器</p>' +
      (views.length ? views.map(function (v) {
        return '<div class="board-view-row' + (v.id === active ? " is-active" : "") + '">' +
          '<button type="button" data-apply-view="' + v.id + '">' + v.name + (v.id === active ? " · 使用中" : "") + "</button>" +
          '<button type="button" class="linkish" data-rename-view="' + v.id + '">改名</button>' +
          '<button type="button" class="linkish danger" data-del-view="' + v.id + '">删除</button>' +
          "</div>";
      }).join("") : '<p class="muted" style="padding:10px">暂无常用视图</p>');
    menu.querySelectorAll("[data-apply-view]").forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        var id = b.getAttribute("data-apply-view");
        var view = loadViewsStore().views.find(function (v) { return v.id === id; });
        if (!view) return;
        if (view.page && view.page !== pageFile()) {
          var qs = new URLSearchParams();
          Object.keys(view.state || {}).forEach(function (k) {
            if (k === "analytics" || k === "cross_filter") return;
            if (view.state[k]) qs.set(k, view.state[k]);
          });
          setActiveViewId(id);
          location.href = view.page + (qs.toString() ? "?" + qs.toString() : "");
          return;
        }
        applyState(view.state, { push: true });
        setActiveViewId(id);
        closeMenus();
        toast("已应用视图「" + view.name + "」");
        updateViewStatus();
      };
    });
    menu.querySelectorAll("[data-rename-view]").forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        var id = b.getAttribute("data-rename-view");
        var view = loadViewsStore().views.find(function (v) { return v.id === id; });
        var name = window.prompt("重命名视图", view ? view.name : "");
        if (name == null) return;
        var r = renameView(id, name);
        toast(r.ok ? "已重命名" : r.error);
        renderViewsMenu();
      };
    });
    menu.querySelectorAll("[data-del-view]").forEach(function (b) {
      b.onclick = function (e) {
        e.stopPropagation();
        var id = b.getAttribute("data-del-view");
        var view = loadViewsStore().views.find(function (v) { return v.id === id; });
        if (!window.confirm("删除视图「" + (view && view.name) + "」？")) return;
        deleteView(id);
        toast("已删除视图");
        renderViewsMenu();
        updateViewStatus();
      };
    });
  }

  function openSaveViewDialog() {
    _lastFocus = document.activeElement;
    var activeId = getActiveViewId();
    var active = loadViewsStore().views.find(function (v) { return v.id === activeId; });
    var dirty = active && !viewMatchesCurrent(active);
    var name = (active && !dirty) ? active.name : "";
    var modal = document.createElement("div");
    modal.className = "board-modal-overlay";
    modal.id = "board-save-view-modal";
    modal.innerHTML =
      '<div class="board-modal" role="dialog" aria-modal="true">' +
      '<div class="board-modal-hd"><h3>保存当前视图</h3><button type="button" class="btn btn-sm" data-close>×</button></div>' +
      '<div class="board-modal-bd">' +
      '<p class="muted" style="font-size:12px">仅保存在本浏览器 · ' + shareSummary() + "</p>" +
      (dirty ? '<p class="board-field-error" style="display:block">当前视图已发生变化</p>' : "") +
      '<label class="board-field">视图名称<input id="sv-name" value="' + (name || "") + '" placeholder="例如：视频号春季03期" /></label>' +
      '<p class="board-field-error" id="sv-error" hidden></p>' +
      '</div><div class="board-modal-ft">' +
      (dirty && active ? '<button type="button" class="btn btn-primary" data-update>更新原视图</button>' : "") +
      '<button type="button" class="btn btn-primary" data-save>另存为新视图</button>' +
      '<button type="button" class="btn" data-close2>取消</button>' +
      "</div></div>";
    document.body.appendChild(modal);
    function close() {
      modal.remove();
      if (_lastFocus && _lastFocus.focus) _lastFocus.focus();
    }
    modal.querySelectorAll("[data-close],[data-close2]").forEach(function (b) { b.onclick = close; });
    var err = document.getElementById("sv-error");
    modal.querySelector("[data-save]").onclick = function () {
      var r = createView(document.getElementById("sv-name").value);
      if (!r.ok) { err.hidden = false; err.textContent = r.error; return; }
      toast("视图已保存");
      close();
      updateViewStatus();
    };
    var upd = modal.querySelector("[data-update]");
    if (upd) {
      upd.onclick = function () {
        var r = updateView(active.id);
        toast(r.ok ? "视图已更新" : r.error);
        if (r.ok) { close(); updateViewStatus(); }
      };
    }
    document.getElementById("sv-name").focus();
  }

  function updateViewStatus() {
    var el = document.getElementById("board-view-status");
    if (!el) return;
    var id = getActiveViewId();
    var view = loadViewsStore().views.find(function (v) { return v.id === id; });
    if (!view || view.page !== pageFile()) {
      el.textContent = "";
      return;
    }
    if (viewMatchesCurrent(view)) el.textContent = "视图：" + view.name;
    else el.textContent = "视图「" + view.name + "」已变化";
  }

  function init(cfg) {
    _cfg = cfg || {};
    ensureToolbar();
    bindMetricTips(document);
    /* restore analytics URL bits */
    var q = new URLSearchParams(location.search);
    if (BI() && BI().setAnalyticsState) {
      var patch = {};
      if (q.get("funnel_step")) patch.funnelStep = q.get("funnel_step");
      if (q.get("funnel_dim")) patch.funnelDim = q.get("funnel_dim");
      if (q.get("live_id")) patch.liveId = q.get("live_id");
      if (q.get("sort")) patch.channelSort = q.get("sort");
      if (q.get("dimension")) patch.dimension = q.get("dimension");
      if (q.get("cross_filter")) {
        try { patch.crossFilter = JSON.parse(q.get("cross_filter")); } catch (e) {}
      }
      if (Object.keys(patch).length) BI().setAnalyticsState(patch);
    }
    if (q.get("view_id")) setActiveViewId(q.get("view_id"));
    /* restore selected_* / bottleneck from URL */
    if (BI() && BI().setAnalyticsState) {
      var patch2 = {};
      if (q.get("bottleneck_id")) patch2.bottleneckId = q.get("bottleneck_id");
      if (q.get("selected_channel")) patch2.selectedChannel = q.get("selected_channel");
      if (q.get("selected_term")) patch2.selectedTerm = q.get("selected_term");
      if (q.get("selected_owner")) patch2.selectedOwner = q.get("selected_owner");
      if (q.get("selected_live") || q.get("live_id")) patch2.selectedLive = q.get("selected_live") || q.get("live_id");
      if (q.get("selected_product")) patch2.selectedProduct = q.get("selected_product");
      if (q.get("live_tab")) patch2.liveTab = q.get("live_tab");
      if (q.get("live_sort")) patch2.liveSort = q.get("live_sort");
      if (Object.keys(patch2).length) BI().setAnalyticsState(patch2, { syncUrl: false });
    }
    updateViewStatus();
    BM().syncRangeUI();
  }

  global.BoardTools = {
    VIEWS_KEY: VIEWS_KEY,
    init: init,
    openCustomDate: openCustomDate,
    openGlossary: openGlossary,
    bindMetricTips: bindMetricTips,
    collectState: collectState,
    applyState: applyState,
    buildShareUrl: buildShareUrl,
    shareSummary: shareSummary,
    listViews: listViews,
    createView: createView,
    updateView: updateView,
    deleteView: deleteView,
    exportCurrentCsv: exportCurrentCsv,
    printReport: printReport,
    updateViewStatus: updateViewStatus
  };
})(window);
