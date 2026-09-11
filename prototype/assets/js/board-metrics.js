/* 商家端经营分析 — 统一筛选 / 计算 / 渲染引擎（依赖 board-data.js） v8 Phase5 */
(function (global) {
  var FILTER_KEY = "merchant_board_filters";
  var SNAPSHOT_KEY = "board_snapshot_v1";
  var ATTR =
    "增长主漏斗：入池 → 分配 → 加微 → 可归因支付。" +
    "私域跟进、直播运营和退款为经营专题。" +
    "视频号获客首单为前端获客辅指标，不计入后链路。";

  var FILTER_SCOPE_HELP =
    "筛选作用范围：" +
    "日期 range → 全部指标；" +
    "获客渠道 channel → 漏斗/可归因交易/关联到课与短信事件，不影响全量商品与直播场次库存；" +
    "期次 term → 漏斗/可归因/人员/该期直播与SOP；" +
    "成交类型 src/transactionType → 仅全量交易（商品排行、全量GMV/订单/退款）。" +
    "可归因交易与全量交易分区展示；缺映射显示「—」，不回退更宽范围。";

  var STAGE_LABELS = ["新加微/待首跟", "跟进中", "高意向", "已转化", "无效/战败"];

  var DRILL_EXTRA_KEYS = [
    "lead_status", "owner", "stage", "follow_stage", "focus",
    "live_id", "selected_live", "selected_channel", "selected_term", "selected_owner", "selected_product",
    "bottleneck_id", "live_tab", "live_sort",
    "attribution", "product_id", "section", "transaction_type", "tab", "order_id",
    "funnel_step", "funnel_dim", "from_board", "from", "metric", "anchor",
    "start_date", "end_date", "dimension", "sort", "cross_filter", "view_id"
  ];

  var BUSINESS_TODAY = "2026-09-10";
  var _urlWriteMode = "replace"; /* replace | push */
  var _popstateBound = false;
  var _filterChangeHandlers = [];

  function BD() {
    return global.BoardData;
  }

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  function parseYmd(s) {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    var p = s.split("-").map(Number);
    var d = new Date(p[0], p[1] - 1, p[2]);
    if (d.getFullYear() !== p[0] || d.getMonth() !== p[1] - 1 || d.getDate() !== p[2]) return null;
    return d;
  }

  function formatYmd(d) {
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function businessToday() {
    return parseYmd(BUSINESS_TODAY) || new Date();
  }

  function daySpanInclusive(start, end) {
    var a = parseYmd(start);
    var b = parseYmd(end);
    if (!a || !b) return null;
    return Math.round((b - a) / 86400000) + 1;
  }

  function formatDateRangeFriendly(start, end) {
    var a = parseYmd(start);
    var b = parseYmd(end);
    if (!a || !b) return "自定义日期";
    var sameYear = a.getFullYear() === b.getFullYear();
    var sameMonth = sameYear && a.getMonth() === b.getMonth();
    var left = a.getFullYear() + "年" + (a.getMonth() + 1) + "月" + a.getDate() + "日";
    var right = sameMonth
      ? (b.getDate() + "日")
      : (sameYear
        ? ((b.getMonth() + 1) + "月" + b.getDate() + "日")
        : (b.getFullYear() + "年" + (b.getMonth() + 1) + "月" + b.getDate() + "日"));
    return left + "—" + right;
  }

  function resolveCustomProxy(start, end) {
    var days = daySpanInclusive(start, end);
    if (days == null) return "7d";
    if (days <= 1) return "today";
    if (days <= 2) return "yesterday";
    if (days <= 10) return "7d";
    return "30d";
  }

  function isValidCustomRange(start, end) {
    var a = parseYmd(start);
    var b = parseYmd(end);
    if (!a || !b) return { ok: false, error: "请填写有效的开始与结束日期" };
    if (a > b) return { ok: false, error: "开始日期不能晚于结束日期" };
    var max = businessToday();
    if (b > max) return { ok: false, error: "结束日期不能晚于当前业务日期（" + formatYmd(max) + "）" };
    if (daySpanInclusive(start, end) > 366) return { ok: false, error: "日期范围过长，请选择一年以内" };
    return { ok: true, error: "" };
  }

  function getDataFilters(filters) {
    var f = Object.assign({}, filters || getFilters());
    if (f.range === "custom") {
      var check = isValidCustomRange(f.start_date, f.end_date);
      f.range = check.ok ? resolveCustomProxy(f.start_date, f.end_date) : "7d";
    } else if (!BD().ranges[f.range]) {
      f.range = "7d";
    }
    return f;
  }

  function fmt(n) {
    if (n == null || n === "") return "—";
    if (typeof n === "string") return n;
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function money(n) {
    if (n == null || isNaN(n)) return "—";
    return BD().money(Math.round(n));
  }

  function pct(a, b) {
    if (b == null || !b) return "—";
    return Math.round((a / b) * 100) + "%";
  }

  function pct1(a, b) {
    if (b == null || !b) return "—";
    return (Math.round((a / b) * 1000) / 10) + "%";
  }

  function rangeLabel(rangeOrFilters) {
    var f = null;
    var range = rangeOrFilters;
    if (rangeOrFilters && typeof rangeOrFilters === "object") {
      f = rangeOrFilters;
      range = f.range;
    }
    if (range === "custom") {
      var start = (f && f.start_date) || (getFilters().start_date);
      var end = (f && f.end_date) || (getFilters().end_date);
      if (start && end) return formatDateRangeFriendly(start, end);
      return "自定义日期";
    }
    var map = { today: "今日", yesterday: "昨日", "7d": "近7日", "30d": "近30日" };
    return map[range] || range || "—";
  }

  function comparePeriodHint(filters) {
    filters = filters || getFilters();
    if (filters.range === "custom") return "与上一等长周期比较";
    var m = { today: "较昨日", yesterday: "较前日", "7d": "较上一周期", "30d": "较上一周期" };
    return m[filters.range] || "较上一周期";
  }

  function normalizeFocus(v) {
    if (v == null || v === "") return v;
    if (String(v) === "sms_fail") return "sms_failed";
    return String(v);
  }

  function resolveSrc(filters) {
    filters = filters || {};
    return filters.src || filters.transactionType || "";
  }

  function readUrlFilters() {
    var q = new URLSearchParams(location.search);
    var f = {};
    if (q.get("range")) f.range = q.get("range");
    if (q.get("channel") != null && q.has("channel")) f.channel = q.get("channel");
    if (q.get("term") != null && q.has("term")) f.term = q.get("term");
    if (q.get("src") != null && q.has("src")) f.src = q.get("src");
    if (q.get("transaction_type") != null && q.has("transaction_type") && !f.src) {
      f.src = q.get("transaction_type");
    }
    if (q.get("transactionType") != null && q.has("transactionType") && !f.src) {
      f.src = q.get("transactionType");
    }
    if (q.get("tab") != null && q.has("tab")) f.tab = q.get("tab");
    if (q.get("start_date")) f.start_date = q.get("start_date");
    if (q.get("end_date")) f.end_date = q.get("end_date");
    if (f.range === "custom") {
      var chk = isValidCustomRange(f.start_date, f.end_date);
      if (!chk.ok) {
        f.range = "7d";
        delete f.start_date;
        delete f.end_date;
      }
    }
    return f;
  }

  function writeUrlFilters(f, mode) {
    try {
      var q = new URLSearchParams(location.search);
      var onPrivate = /board-private\.html/.test(location.pathname || "");
      ["range", "channel", "term", "src", "tab", "start_date", "end_date"].forEach(function (k) {
        if (k === "tab") {
          if (onPrivate && f.tab) q.set("tab", f.tab);
          else q.delete("tab");
          return;
        }
        if (k === "start_date" || k === "end_date") {
          if (f.range === "custom" && f[k]) q.set(k, f[k]);
          else q.delete(k);
          return;
        }
        if (k === "src" && !/board-convert\.html/.test(location.pathname || "")) {
          if (!f.src) q.delete("src");
          q.delete("transaction_type");
          return;
        }
        if (f[k]) q.set(k, f[k]);
        else q.delete(k);
      });
      if (/board-convert\.html/.test(location.pathname || "") && f.src) {
        q.set("transaction_type", f.src);
      }
      var qs = q.toString();
      var next = location.pathname + (qs ? "?" + qs : "") + location.hash;
      var cur = location.pathname + location.search + location.hash;
      if (next === cur) return;
      var writeMode = mode || _urlWriteMode || "replace";
      if (writeMode === "push") history.pushState({ boardFilters: true }, "", next);
      else history.replaceState({ boardFilters: true }, "", next);
    } catch (e) {}
  }

  function getFilters() {
    var base = { range: "7d", channel: "", term: "", src: "", tab: "", start_date: "", end_date: "" };
    try {
      var raw = sessionStorage.getItem(FILTER_KEY);
      if (raw) Object.assign(base, JSON.parse(raw));
    } catch (e) {}
    if (!getFilters._booted) {
      var q = new URLSearchParams(location.search);
      var urlF = readUrlFilters();
      if (q.has("range") || q.has("channel") || q.has("term") || q.has("src") || q.has("tab") ||
          q.has("transaction_type") || q.has("transactionType") ||
          q.has("start_date") || q.has("end_date")) {
        base = { range: "7d", channel: "", term: "", src: "", tab: "", start_date: "", end_date: "" };
        Object.assign(base, urlF);
        if (!base.range) base.range = "7d";
      } else {
        Object.assign(base, urlF);
      }
      getFilters._booted = true;
      persistFilters(base, "replace");
      ensurePopstate();
    }
    if (base.range === "custom") {
      var chk = isValidCustomRange(base.start_date, base.end_date);
      if (!chk.ok) {
        base.range = "7d";
        base.start_date = "";
        base.end_date = "";
      }
    } else if (!BD().ranges[base.range]) {
      base.range = "7d";
    }
    return base;
  }

  function persistFilters(saved, mode) {
    sessionStorage.setItem(FILTER_KEY, JSON.stringify(saved));
    writeUrlFilters(saved, mode);
  }

  function setFilters(partial, opts) {
    opts = opts || {};
    var cur = getFilters();
    Object.assign(cur, partial || {});
    if (partial && partial.transactionType != null && partial.src == null) {
      cur.src = partial.transactionType;
    }
    if (cur.range === "custom") {
      var chk = isValidCustomRange(cur.start_date, cur.end_date);
      if (!chk.ok) {
        cur.range = "7d";
        cur.start_date = "";
        cur.end_date = "";
      }
    } else {
      if (!BD().ranges[cur.range]) cur.range = "7d";
      cur.start_date = "";
      cur.end_date = "";
    }
    var saved = {
      range: cur.range,
      channel: cur.channel || "",
      term: cur.term || "",
      src: cur.src || "",
      tab: cur.tab || "",
      start_date: cur.start_date || "",
      end_date: cur.end_date || ""
    };
    var mode = opts.urlMode || _urlWriteMode || "replace";
    if (opts.push) mode = "push";
    persistFilters(saved, mode);
    _filterChangeHandlers.forEach(function (fn) {
      try { fn(Object.assign({}, saved)); } catch (e) {}
    });
    return Object.assign({}, saved);
  }

  function resetFilters(keepRange) {
    var range = keepRange ? getFilters().range : "7d";
    var tab = getFilters().tab || "";
    var start = keepRange && range === "custom" ? getFilters().start_date : "";
    var end = keepRange && range === "custom" ? getFilters().end_date : "";
    if (!keepRange) range = "7d";
    return setFilters({
      range: range, channel: "", term: "", src: "", tab: tab,
      start_date: start, end_date: end
    }, { push: true });
  }

  function onFilterChange(fn) {
    if (typeof fn === "function") _filterChangeHandlers.push(fn);
  }

  function setUrlWriteMode(mode) {
    _urlWriteMode = mode === "push" ? "push" : "replace";
  }

  function ensurePopstate() {
    if (_popstateBound) return;
    _popstateBound = true;
    window.addEventListener("popstate", function () {
      getFilters._booted = false;
      var f = getFilters();
      syncRangeUI();
      fillFilterOptions({});
      try {
        var q = new URLSearchParams(location.search);
        if (global.BoardInsights && BoardInsights.setAnalyticsState) {
          var patch = {
            funnelStep: q.get("funnel_step") || "pool_wecom",
            funnelDim: q.get("funnel_dim") || "channel"
          };
          if (q.get("live_id")) patch.liveId = q.get("live_id");
          if (q.get("sort")) {
            patch.channelSort = q.get("sort");
            patch.staffSort = q.get("sort");
          }
          if (q.get("dimension")) patch.dimension = q.get("dimension");
          if (q.get("cross_filter")) {
            try { patch.crossFilter = JSON.parse(q.get("cross_filter")); } catch (e) { patch.crossFilter = null; }
          } else {
            patch.crossFilter = null;
          }
          BoardInsights.setAnalyticsState(patch, { syncUrl: false });
        }
      } catch (e) {}
      var d = applyRange(f.range, document, { skipSet: true });
      _filterChangeHandlers.forEach(function (fn) {
        try { fn(f, d, { fromPopstate: true }); } catch (e) {}
      });
    });
  }

  /* ---------- snapshot ---------- */
  function formatSnapshotAt(d) {
    d = d instanceof Date ? d : new Date(d);
    if (isNaN(d.getTime())) d = new Date();
    function p(n) { return n < 10 ? "0" + n : "" + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
      " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }

  function refreshSnapshot() {
    var now = new Date();
    var snap = {
      snapshotId: "snap_" + now.getTime(),
      snapshotAt: formatSnapshotAt(now)
    };
    try {
      sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
    } catch (e) {}
    return snap;
  }

  function getSnapshot() {
    try {
      var raw = sessionStorage.getItem(SNAPSHOT_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.snapshotAt) return parsed;
      }
    } catch (e) {}
    return refreshSnapshot();
  }

  function sumSlices(filters) {
    filters = getDataFilters(filters);
    var list = BD().leadSlices.filter(function (s) {
      if (s.range !== filters.range) return false;
      if (filters.channel && s.channel !== filters.channel) return false;
      if (filters.term && s.term !== filters.term) return false;
      return true;
    });
    var acc = {
      poolLeads: 0, assignedLeads: 0, wecomLeads: 0, attributedPayUsers: 0,
      videoOrders: 0, videoLeads: 0, videoClaims: 0, videoSmsFailed: 0,
      noFollow: 0, churn: 0, attendUsers: 0, payWithAttend: 0,
      attributedOrders: 0, attributedGmv: 0,
      attributedRefundUsers: 0, attributedRefundAmount: 0
    };
    var attrMapped = list.length > 0;
    list.forEach(function (s) {
      acc.poolLeads += s.pool || 0;
      acc.assignedLeads += s.assigned || 0;
      acc.wecomLeads += s.wecom || 0;
      acc.attributedPayUsers += s.attributedPay || 0;
      acc.videoOrders += s.videoOrders || 0;
      acc.videoLeads += s.videoLeads || 0;
      acc.videoClaims += s.videoClaims || 0;
      acc.videoSmsFailed += s.videoSmsFailed || 0;
      acc.noFollow += s.noFollow || 0;
      acc.churn += s.churn || 0;
      acc.attendUsers += s.attend || 0;
      acc.payWithAttend += s.payWithAttend || 0;
      if (typeof s.attributedOrders !== "number" || typeof s.attributedGmv !== "number") {
        attrMapped = false;
      } else {
        acc.attributedOrders += s.attributedOrders;
        acc.attributedGmv += s.attributedGmv;
        acc.attributedRefundUsers += s.attributedRefundUsers || 0;
        acc.attributedRefundAmount += s.attributedRefundAmount || 0;
      }
    });
    return {
      list: list,
      sum: acc,
      filtered: !!(filters.channel || filters.term),
      attrMapped: attrMapped
    };
  }

  /** 全量商品：仅 range + src/transactionType，忽略 channel/term */
  function getFullProductRows(filters) {
    filters = getDataFilters(filters || getFilters());
    var src = resolveSrc(filters);
    return BD().productRows.filter(function (r) {
      if (r.range !== filters.range) return false;
      if (src && r.src !== src) return false;
      return true;
    });
  }

  /** 兼容旧调用：等同全量商品口径（不再按渠道/期次缩减商品） */
  function getProductRows(filters) {
    return getFullProductRows(filters);
  }

  function getLiveRows(filters) {
    filters = getDataFilters(filters || getFilters());
    /* 场次只受日期、期次影响，不受获客渠道影响 */
    return BD().liveRows.filter(function (r) {
      if (r.range !== filters.range) return false;
      if (filters.term && r.term !== filters.term) return false;
      return true;
    });
  }

  function parseAttendRate(r) {
    if (!r || r.attendRate == null || r.attendRate === "—") return null;
    var n = parseFloat(String(r.attendRate).replace("%", ""));
    return isNaN(n) ? null : n;
  }

  function hasValidAttend(r) {
    return r && r.status === "ended" && r.attend != null && parseAttendRate(r) != null;
  }

  function avgAttendRate(list) {
    var rates = [];
    list.forEach(function (r) {
      var n = parseAttendRate(r);
      if (n != null) rates.push(n);
    });
    if (!rates.length) return null;
    return Math.round(rates.reduce(function (a, b) { return a + b; }, 0) / rates.length) + "%";
  }

  function summarizeLiveRows(rows) {
    var sent = [];
    var miss = [];
    var pending = [];
    var ended = [];
    var attendSample = [];
    var sentWithAttend = [];
    var missWithAttend = [];

    rows.forEach(function (r) {
      if (r.status === "ended") ended.push(r);
      if (hasValidAttend(r)) attendSample.push(r);

      if (r.status === "upcoming" || r.dataInsufficient || r.attend == null) {
        pending.push(r);
      } else if (r.inviteSent) {
        sent.push(r);
        if (hasValidAttend(r)) sentWithAttend.push(r);
      } else {
        miss.push(r);
        if (hasValidAttend(r)) missWithAttend.push(r);
      }
    });

    var sentAvg = avgAttendRate(sentWithAttend);
    var missAvg = avgAttendRate(missWithAttend);
    var sampleOk = sentWithAttend.length >= 2 && missWithAttend.length >= 2 && sentAvg && missAvg;
    var lift = "—";
    if (sampleOk) {
      var diff = parseInt(sentAvg, 10) - parseInt(missAvg, 10);
      lift = (diff >= 0 ? "+" : "") + diff + "pt";
    }

    var liveAttendAvg = avgAttendRate(attendSample);
    var liveAttendAvgHint = "—";
    if (liveAttendAvg && attendSample.length) {
      liveAttendAvgHint = liveAttendAvg + " · 基于" + attendSample.length + "场已结束直播";
    }

    return {
      sessions: rows.length,
      endedSessions: ended.length,
      attendSampleSessions: attendSample.length,
      sent: sent.length,
      sentAvg: sentAvg || "—",
      miss: miss.length,
      missAvg: missAvg || "—",
      pending: pending.length,
      inviteLift: lift,
      liveAttendAvg: liveAttendAvg || "—",
      liveAttendAvgHint: liveAttendAvgHint,
      sampleOk: sampleOk,
      sentWithAttend: sentWithAttend.length,
      missWithAttend: missWithAttend.length
    };
  }

  function getLiveSummary(filters) {
    filters = getDataFilters(filters || getFilters());
    var rows = getLiveRows(filters);
    if (rows.length) return summarizeLiveRows(rows);
    var map = BD().liveSummaries || {};
    var key = filters.term ? filters.range + ":" + filters.term : filters.range;
    var fallback = map[key] || map[filters.range];
    if (fallback) {
      return Object.assign({
        endedSessions: fallback.endedSessions != null ? fallback.endedSessions : 0,
        attendSampleSessions: fallback.attendSampleSessions != null ? fallback.attendSampleSessions : 0,
        liveAttendAvgHint: fallback.liveAttendAvgHint ||
          (fallback.liveAttendAvg && fallback.liveAttendAvg !== "—"
            ? fallback.liveAttendAvg + " · 基于汇总"
            : "—")
      }, fallback);
    }
    return {
      sessions: 0, endedSessions: 0, attendSampleSessions: 0,
      sent: 0, sentAvg: "—", miss: 0, missAvg: "—", pending: 0,
      inviteLift: "—", liveAttendAvg: "—", liveAttendAvgHint: "—", sampleOk: false
    };
  }

  function getStaffRows(filters) {
    filters = getDataFilters(filters || getFilters());
    var raw = BD().staffRows.filter(function (r) {
      if (r.range !== filters.range) return false;
      if (filters.channel && r.channel !== filters.channel) return false;
      if (filters.term && r.term !== filters.term) return false;
      return true;
    });
    var map = {};
    var order = [];
    raw.forEach(function (r) {
      var key = (r.isOther ? "__other__" : r.name);
      if (!map[key]) {
        map[key] = {
          name: r.name,
          isOther: !!r.isOther,
          assigned: 0, wecom: 0, wecomDone: 0, followed: 0, followedPeople: 0,
          noFollow: 0, churn: 0, term: r.term || ""
        };
        order.push(key);
      }
      var m = map[key];
      m.assigned += r.assigned || 0;
      m.wecom += r.wecom || 0;
      m.wecomDone += r.wecomDone != null ? r.wecomDone : (r.wecom || 0);
      m.followed += r.followed || 0;
      m.followedPeople += r.followedPeople || 0;
      m.noFollow += r.noFollow || 0;
      m.churn += r.churn || 0;
    });
    return order.map(function (k) {
      var m = map[k];
      m.cover = m.wecom ? pct(m.followedPeople, m.wecom) : "—";
      return m;
    });
  }

  function sumStaff(filters) {
    var rows = getStaffRows(filters);
    var acc = { assigned: 0, wecom: 0, noFollow: 0, churn: 0, followedPeople: 0 };
    rows.forEach(function (r) {
      acc.assigned += r.assigned || 0;
      acc.wecom += r.wecom || 0;
      acc.noFollow += r.noFollow || 0;
      acc.churn += r.churn || 0;
      acc.followedPeople += r.followedPeople || 0;
    });
    return acc;
  }

  function stageSeedKey(filters) {
    return [filters.range || "", filters.channel || "", filters.term || ""].join("|");
  }

  function hashStr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0);
  }

  function deriveStageCounts(wecom, key) {
    if (!wecom) return [0, 0, 0, 0, 0];
    var h = hashStr(key || "default");
    var weights = [12, 43, 24, 13, 8];
    for (var i = 0; i < 5; i++) {
      weights[i] = Math.max(1, weights[i] + ((h >> (i * 4)) % 9) - 4);
    }
    var wsum = weights[0] + weights[1] + weights[2] + weights[3] + weights[4];
    var counts = [];
    var used = 0;
    for (var j = 0; j < 4; j++) {
      counts[j] = Math.floor((wecom * weights[j]) / wsum);
      used += counts[j];
    }
    counts[4] = Math.max(0, wecom - used);
    var drift = counts.reduce(function (a, b) { return a + b; }, 0) - wecom;
    if (drift !== 0) counts[4] = Math.max(0, counts[4] - drift);
    return counts;
  }

  function getSmsFailedPending() {
    try {
      if (global.ProtoBiz && typeof global.ProtoBiz.smsFailedPending === "function") {
        return global.ProtoBiz.smsFailedPending();
      }
      if (global.ProtoBiz && typeof global.ProtoBiz.getChannelOrders === "function") {
        return global.ProtoBiz.getChannelOrders("failed").length;
      }
    } catch (e) {}
    return null;
  }

  function sumProducts(products) {
    var po = 0, pg = 0, ra = 0, ru = 0;
    products.forEach(function (p) {
      po += p.orders || 0;
      pg += p.gmv || 0;
      ra += p.refundAmount || 0;
      ru += p.refundUsers || 0;
    });
    return { orders: po, gmv: pg, refundAmount: ra, refundUsers: ru };
  }

  function aggregateLeadMetrics(filters) {
    var display = filters || getFilters();
    filters = getDataFilters(display);
    var base = BD().ranges[filters.range] || BD().ranges["7d"];
    var sliced = sumSlices(filters);
    var attrScope = !!(display.channel || display.term);
    var src = resolveSrc(display);
    var applySrc = !!(display.applySrc || src);

    var fullProducts = getFullProductRows(Object.assign({}, filters, { src: applySrc ? src : "" }));
    var liveSum = getLiveSummary(filters);
    var d = Object.assign({}, base);

    if (sliced.filtered) {
      var s = sliced.sum;
      d.poolLeads = s.poolLeads;
      d.assignedLeads = s.assignedLeads;
      d.wecomLeads = s.wecomLeads;
      d.attributedPayUsers = s.attributedPayUsers;
      d.videoOrders = s.videoOrders;
      d.videoLeads = s.videoLeads;
      d.videoClaims = s.videoClaims;
      d.videoSmsFailed = s.videoSmsFailed;
      d.noFollow = s.noFollow;
      d.churn = s.churn;
      d.attendUsers = s.attendUsers;
      d.payWithAttend = s.payWithAttend;
      d.payNoAttend = Math.max(0, d.attributedPayUsers - d.payWithAttend);
      d.acquisitionOrders = d.videoOrders;
      d.validLeadIn = s.poolLeads ? Math.round(s.poolLeads / 0.75) : 0;
    }

    d.attrScope = attrScope;

    /* —— 全量交易：仅 range + src —— */
    var fullPayUsers = base.totalPayUsers;
    var fullOrders = base.totalPaidOrders;
    var fullGmv = base.totalGmv;
    var fullRefundAmount = base.refundAmount;
    var fullRefundUsers = base.refundUsers;
    var fullRefundRate = base.refundRate;

    if (fullProducts.length) {
      var fp = sumProducts(fullProducts);
      fullOrders = fp.orders;
      fullGmv = fp.gmv;
      fullRefundAmount = fp.refundAmount;
      fullRefundUsers = fp.refundUsers;
      fullRefundRate = fullGmv ? pct1(fullRefundAmount, fullGmv) : "—";
      if (applySrc && src) {
        /* 成交类型筛选时：支付人数按订单占比同切，避免人货比失真 */
        var baseOrders = base.totalPaidOrders || 0;
        var baseUsers = base.totalPayUsers || 0;
        fullPayUsers = baseOrders
          ? Math.max(0, Math.round(baseUsers * (fullOrders / baseOrders)))
          : 0;
      }
    } else if (applySrc && src) {
      fullOrders = 0;
      fullGmv = 0;
      fullPayUsers = 0;
      fullRefundAmount = 0;
      fullRefundUsers = 0;
      fullRefundRate = "—";
    }

    d.fullProducts = fullProducts;
    d.fullOrders = fullOrders;
    d.fullGmv = fullGmv;
    d.fullAov = fullOrders ? money(Math.round(fullGmv / fullOrders)) : "—";
    d.fullRefundAmount = fullRefundAmount;
    d.fullRefundUsers = fullRefundUsers;
    d.fullRefundRate = fullRefundRate;
    d.fullPayUsers = fullPayUsers;
    d.fullGmvDisplay = money(fullGmv);
    d.fullOrdersDisplay = fullOrders;

    /* —— 可归因交易：channel/term 切片映射 —— */
    var attrTradeEmpty = false;
    var attrOrders = null;
    var attrGmv = null;
    var attrRefundUsers = null;
    var attrRefundAmount = null;
    var attrPayUsers = d.attributedPayUsers;

    if (attrScope) {
      if (!sliced.attrMapped) {
        attrTradeEmpty = true;
      } else {
        attrOrders = sliced.sum.attributedOrders;
        attrGmv = sliced.sum.attributedGmv;
        attrRefundUsers = sliced.sum.attributedRefundUsers;
        attrRefundAmount = sliced.sum.attributedRefundAmount;
      }
    } else {
      /* 无渠道/期次时：可归因支付用户仍来自漏斗；订单/GMV/退款均不把全量冒充可归因 */
      attrOrders = null;
      attrGmv = null;
      attrRefundUsers = null;
      attrRefundAmount = null;
    }

    d.attrTradeEmpty = !!attrTradeEmpty;
    d.attrPayUsers = attrPayUsers;
    d.attrOrders = attrTradeEmpty ? "—" : (attrOrders == null ? "—" : attrOrders);
    d.attrGmv = attrTradeEmpty || attrGmv == null ? "—" : money(attrGmv);
    d.attrGmvRaw = attrTradeEmpty ? null : attrGmv;
    d.attrOrdersRaw = attrTradeEmpty ? null : attrOrders;
    d.attrAov = (!attrTradeEmpty && attrOrders && attrGmv != null)
      ? money(Math.round(attrGmv / attrOrders))
      : "—";
    d.attrRefundUsers = attrTradeEmpty ? "—" : (attrRefundUsers == null ? "—" : attrRefundUsers);
    d.attrRefundAmount = attrTradeEmpty || attrRefundAmount == null ? "—" : money(attrRefundAmount);
    d.attrRefundAmountRaw = attrTradeEmpty ? null : attrRefundAmount;
    d.attrRefundRate = (!attrTradeEmpty && attrGmv)
      ? pct1(attrRefundAmount || 0, attrGmv)
      : "—";

    /* 兼容旧字段：total* / gmv / orders 指向「当前页激活交易区」 */
    if (attrScope) {
      d.totalPaidOrders = attrTradeEmpty ? null : attrOrders;
      d.totalGmv = attrTradeEmpty ? null : attrGmv;
      d.refundAmount = attrTradeEmpty ? null : attrRefundAmount;
      d.refundUsers = attrTradeEmpty ? null : attrRefundUsers;
      d.refundRate = d.attrRefundRate;
      d.totalPayUsers = attrPayUsers;
      d.gmv = d.attrGmv;
      d.orders = d.attrOrders;
      d.aov = d.attrAov;
      d.tradeEmpty = attrTradeEmpty;
    } else {
      d.totalPaidOrders = fullOrders;
      d.totalGmv = fullGmv;
      d.refundAmount = fullRefundAmount;
      d.refundUsers = fullRefundUsers;
      d.refundRate = fullRefundRate;
      d.totalPayUsers = fullPayUsers;
      d.gmv = money(fullGmv);
      d.orders = fullOrders;
      d.aov = d.fullAov;
      d.tradeEmpty = false;
    }

    /* 直播场次：只看 range/term */
    d.liveSessions = liveSum.sessions || 0;
    d.endedSessions = liveSum.endedSessions || 0;
    d.attendSampleSessions = liveSum.attendSampleSessions || 0;
    d.liveAttendAvg = liveSum.liveAttendAvg || "—";
    d.liveAttendAvgHint = liveSum.liveAttendAvgHint || "—";
    d.inviteLift = liveSum.sampleOk ? (liveSum.inviteLift || "—") : "—";
    d.inviteGroups = {
      sent: liveSum.sent || 0,
      sentAvg: liveSum.sentAvg || "—",
      miss: liveSum.miss || 0,
      missAvg: liveSum.missAvg || "—",
      pending: liveSum.pending || 0,
      sampleOk: !!liveSum.sampleOk,
      inviteLift: d.inviteLift,
      endedSessions: d.endedSessions,
      attendSampleSessions: d.attendSampleSessions
    };

    var staff = sumStaff(filters);
    d.coverRate = d.wecomLeads ? pct(staff.followedPeople || (d.wecomLeads - d.noFollow), d.wecomLeads) : "—";
    if (staff.followedPeople) {
      d.coverRate = pct(staff.followedPeople, staff.wecom || d.wecomLeads);
    }

    var timing = getTimingBuckets(filters.range);
    var timely = 0;
    timing.slice(0, 2).forEach(function (b) { timely += b.pct || 0; });
    d.timelyAssignRate = timely + "%";

    /* SMS 双口径 */
    d.smsFailureEvents = d.videoSmsFailed || 0;
    var pendingSms = getSmsFailedPending();
    d.smsFailedPending = pendingSms != null ? pendingSms : d.smsFailureEvents;
    d.vxSmsFail = d.smsFailureEvents;

    d.pool = d.poolLeads;
    d.assign = d.assignedLeads;
    d.wecom = d.wecomLeads;
    d.pay = d.attributedPayUsers;
    d.vxOrders = d.videoOrders;
    d.vxLeads = d.videoLeads;
    d.vxClaim = d.videoClaims;
    d.lives = d.liveSessions;
    d.attend = d.attendUsers;
    d.backlog = Math.max(0, d.poolLeads - d.assignedLeads);
    d.backlogLate = Math.round(d.backlog * 0.35);
    d.stepAssign = pct(d.assignedLeads, d.poolLeads);
    d.stepWecom = pct(d.wecomLeads, d.assignedLeads);
    d.stepPay = pct(d.attributedPayUsers, d.wecomLeads);
    d.endRate = pct(d.attributedPayUsers, d.poolLeads);
    d.label = rangeLabel(display);
    d.compareHint = comparePeriodHint(display);
    d.isCustomRange = display.range === "custom";
    d.dataRange = filters.range;
    d.start_date = display.start_date || "";
    d.end_date = display.end_date || "";
    d.compareLabel = base.compareLabel;
    d.deltas = base.deltas;
    d.empty = d.poolLeads === 0 && (attrScope ? attrTradeEmpty : fullOrders === 0);
    d.caliberNote = attrScope
      ? "当前交易区：可归因交易（渠道/期次筛选生效）"
      : "当前交易区：全量交易（支付事件口径）";
    if (display.range === "custom") {
      d.caliberNote += "；自定义日期数字为演示映射（按跨度映射至" + rangeLabel(filters.range) + "样本）";
    }
    d.filterScopeHelp = FILTER_SCOPE_HELP;

    validateConsistency(d, filters);
    return d;
  }

  function getTimingBuckets(range) {
    var r = range;
    if (r && typeof r === "object") r = getDataFilters(r).range;
    else if (!r) r = getDataFilters().range;
    else if (r === "custom") r = getDataFilters().range;
    return (BD().timingBuckets[r] || BD().timingBuckets["7d"]).slice();
  }

  function getRangeData(range) {
    var f = getFilters();
    if (range) f.range = range;
    return aggregateLeadMetrics(f);
  }

  function nearlyEqual(a, b, tol) {
    tol = tol == null ? 0 : tol;
    return Math.abs((a || 0) - (b || 0)) <= tol;
  }

  function validateConsistency(d, filters) {
    filters = filters || getFilters();
    var errors = [];
    function fail(msg) { errors.push(msg); }

    if (!(d.poolLeads >= d.assignedLeads && d.assignedLeads >= d.wecomLeads && d.wecomLeads >= d.attributedPayUsers)) {
      fail("漏斗不等式失败: pool>=assign>=wecom>=attrPay (" +
        [d.poolLeads, d.assignedLeads, d.wecomLeads, d.attributedPayUsers].join("/") + ")");
    }

    var staffRows = getStaffRows(filters);
    if (staffRows.length) {
      var staff = sumStaff(filters);
      if (!nearlyEqual(staff.assigned, d.assignedLeads, 0)) {
        fail("人员分配合计 " + staff.assigned + " ≠ 已分配 " + d.assignedLeads);
      }
      if (!nearlyEqual(staff.wecom, d.wecomLeads, 0)) {
        fail("人员加微合计 " + staff.wecom + " ≠ 已加微 " + d.wecomLeads);
      }
      if (!nearlyEqual(staff.noFollow, d.noFollow, 0)) {
        fail("人员无跟进合计 " + staff.noFollow + " ≠ 顶部无跟进 " + d.noFollow);
      }
      if (!nearlyEqual(staff.churn, d.churn, 0)) {
        fail("人员流失合计 " + staff.churn + " ≠ 顶部流失 " + d.churn);
      }
    }

    var stageList = buildStageRows(d.wecomLeads || 0, stageSeedKey(filters));
    if (stageList.length) {
      var stageSum = stageList.reduce(function (a, b) { return a + b.count; }, 0);
      if (!nearlyEqual(stageSum, d.wecomLeads, 0)) {
        fail("阶段人数合计 " + stageSum + " ≠ 已加微 " + d.wecomLeads);
      }
      var pctSum = stageList.reduce(function (a, b) { return a + b.pctNum; }, 0);
      if (!nearlyEqual(pctSum, 100, 0)) {
        fail("阶段占比合计 " + pctSum + "% ≠ 100%");
      }
    }

    if (!d.attrScope && d.fullProducts && d.fullProducts.length) {
      var fp = sumProducts(d.fullProducts);
      if (!nearlyEqual(fp.orders, d.fullOrders, 0)) {
        fail("商品订单合计 " + fp.orders + " ≠ 全量订单 " + d.fullOrders);
      }
      if (!nearlyEqual(fp.gmv, d.fullGmv, 0)) {
        fail("商品GMV合计 " + fp.gmv + " ≠ 全量GMV " + d.fullGmv);
      }
    }

    if (!nearlyEqual((d.payWithAttend || 0) + (d.payNoAttend || 0), d.attributedPayUsers, 0)) {
      fail("到课+未到课成交 ≠ 可归因支付用户");
    }

    var ig = d.inviteGroups || {};
    if (!nearlyEqual((ig.sent || 0) + (ig.miss || 0) + (ig.pending || 0), d.liveSessions || 0, 0)) {
      fail("促到分组场次合计 ≠ 直播场次");
    }

    /* 退款率金额口径：展示值应与 amount/gmv 一致（全量区） */
    if (!d.attrScope && d.fullGmv && typeof d.fullRefundAmount === "number") {
      var expect = pct1(d.fullRefundAmount, d.fullGmv);
      if (d.fullRefundRate !== expect && d.fullRefundRate !== baseRefundSafe(d)) {
        /* soft: only fail if both numeric-like and diverge > 0.2pp */
        var a = parseFloat(String(d.fullRefundRate));
        var b = parseFloat(String(expect));
        if (!isNaN(a) && !isNaN(b) && Math.abs(a - b) > 0.2) {
          fail("退款率与金额口径不一致: " + d.fullRefundRate + " vs " + expect);
        }
      }
    }

    d.caliberErrors = errors;
    if (errors.length) {
      d.caliberError = "数据口径异常：" + errors[0];
      try {
        console.error("[BoardMetrics.validateConsistency]", filters, errors);
      } catch (e) {}
    } else {
      d.caliberError = "";
    }
    return errors;
  }

  function baseRefundSafe(d) {
    return d.refundRate;
  }

  function buildStageRows(wecom, key) {
    if (!wecom) return [];
    var seeds = (BD().stageSeeds || {})[key];
    var counts = seeds && seeds.length === 5 ? seeds.slice() : deriveStageCounts(wecom, key);
    var sum = counts.reduce(function (a, b) { return a + b; }, 0);
    if (sum !== wecom && sum > 0) {
      var scaled = [];
      var used = 0;
      for (var i = 0; i < 4; i++) {
        scaled[i] = Math.round((counts[i] * wecom) / sum);
        used += scaled[i];
      }
      scaled[4] = Math.max(0, wecom - used);
      counts = scaled;
    } else if (sum !== wecom) {
      counts = deriveStageCounts(wecom, key);
    }
    var pcts = [];
    var pctUsed = 0;
    for (var p = 0; p < 4; p++) {
      pcts[p] = wecom ? Math.round((counts[p] / wecom) * 100) : 0;
      pctUsed += pcts[p];
    }
    pcts[4] = Math.max(0, 100 - pctUsed);
    return STAGE_LABELS.map(function (label, idx) {
      return {
        stage: label,
        label: label,
        count: counts[idx] || 0,
        pct: (pcts[idx] || 0) + "%",
        pctNum: pcts[idx] || 0
      };
    });
  }

  function getStageDistribution(filters) {
    filters = filters || getFilters();
    var dataF = getDataFilters(filters);
    var base = BD().ranges[dataF.range] || BD().ranges["7d"];
    var sliced = sumSlices(Object.assign({}, dataF, { channel: filters.channel, term: filters.term }));
    var wecom = sliced.filtered ? sliced.sum.wecomLeads : base.wecomLeads;
    return buildStageRows(wecom || 0, stageSeedKey(dataF));
  }

  function applyRange(key, root, opts) {
    opts = opts || {};
    var f;
    if (opts.skipSet) {
      f = getFilters();
    } else if (key === "custom") {
      f = getFilters();
    } else if (key) {
      f = setFilters({ range: key, start_date: "", end_date: "" }, { push: !!opts.push });
    } else {
      f = getFilters();
    }
    var d = aggregateLeadMetrics(f);
    root = root || document;
    root.querySelectorAll("[data-m]").forEach(function (el) {
      var k = el.getAttribute("data-m");
      if (d[k] == null) return;
      el.textContent = fmt(d[k]);
    });
    root.querySelectorAll("[data-range-label]").forEach(function (el) {
      el.textContent = d.label || "—";
    });
    var pool = d.poolLeads || 1;
    root.querySelectorAll(".board-funnel.slope .step[data-m-h]").forEach(function (el) {
      var hk = el.getAttribute("data-m-h");
      var v = d[hk] || 0;
      var baseH = hk.indexOf("vx") === 0 ? (d.vxOrders || d.videoOrders || 1) : pool;
      var pctH = Math.max(28, Math.round((v / baseH) * 100));
      el.style.setProperty("--h", pctH + "%");
    });
    var errEl = document.getElementById("board-caliber-error");
    if (errEl) {
      if (d.caliberError) {
        errEl.textContent = d.caliberError;
        errEl.hidden = false;
      } else {
        errEl.textContent = "";
        errEl.hidden = true;
      }
    }
    renderActiveFilters();
    return d;
  }

  function syncRangeUI(segId) {
    var f = getFilters();
    var seg = document.getElementById(segId || "range-seg");
    if (!seg) return;
    seg.querySelectorAll("button[data-range]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-range") === f.range);
    });
    var customBtn = seg.querySelector("[data-range='custom']");
    if (customBtn && f.range === "custom") {
      customBtn.classList.add("active");
      customBtn.textContent = "自定义";
    } else if (customBtn) {
      customBtn.textContent = "自定义";
    }
    var label = document.getElementById("custom-range-label");
    if (label) {
      if (f.range === "custom" && f.start_date && f.end_date) {
        label.hidden = false;
        label.textContent = rangeLabel(f);
      } else {
        label.hidden = true;
        label.textContent = "";
      }
    }
  }

  function bindRange(segId, onChange) {
    var seg = document.getElementById(segId || "range-seg");
    if (!seg) return;
    if (!seg.querySelector("[data-range='custom']")) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-range", "custom");
      btn.textContent = "自定义";
      seg.appendChild(btn);
    }
    if (!document.getElementById("custom-range-label")) {
      var span = document.createElement("span");
      span.id = "custom-range-label";
      span.className = "board-custom-range-label muted";
      span.hidden = true;
      span.style.cssText = "font-size:12px;margin-left:6px";
      if (seg.parentNode) seg.parentNode.insertBefore(span, seg.nextSibling);
    }
    syncRangeUI(segId);
    ensurePopstate();
    onFilterChange(function (payload, dMaybe, meta) {
      if (!(meta && meta.fromPopstate)) return;
      var f = (payload && payload.range != null) ? payload : getFilters();
      syncRangeUI(segId);
      var d = dMaybe || applyRange(f.range, document, { skipSet: true });
      if (typeof onChange === "function") onChange(f.range, d, f);
    });
    seg.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-range]");
      if (!b) return;
      var key = b.getAttribute("data-range");
      if (key === "custom") {
        if (global.BoardTools && BoardTools.openCustomDate) {
          BoardTools.openCustomDate(function () {
            syncRangeUI(segId);
            var d = applyRange("custom", document, { skipSet: true });
            if (typeof onChange === "function") onChange("custom", d, getFilters());
          });
        }
        return;
      }
      setFilters({ range: key, start_date: "", end_date: "" }, { push: true });
      syncRangeUI(segId);
      var d = applyRange(key, document, { skipSet: true });
      if (typeof onChange === "function") onChange(key, d, getFilters());
    });
    var d = applyRange(getFilters().range, document, { skipSet: true });
    if (typeof onChange === "function") onChange(getFilters().range, d, getFilters());
  }

  function fillAttr(sel) {
    var el = document.querySelector(sel || "[data-board-attr]");
    if (el) el.textContent = ATTR;
  }

  function fillSelect(el, options, value) {
    if (!el || !options) return;
    el.innerHTML = "";
    options.forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o.value;
      opt.textContent = o.label;
      el.appendChild(opt);
    });
    el.value = value || "";
  }

  function fillFilterOptions(opts) {
    if (global.TermStore) global.TermStore.syncBoardData();
    opts = opts || {};
    var f = getFilters();
    var ch = document.getElementById(opts.channelId || "f-channel");
    var term = document.getElementById(opts.termId || "f-term");
    var src = document.getElementById(opts.srcId || "f-src");
    if (ch) fillSelect(ch, BD().channelOptions, f.channel);
    if (term) fillSelect(term, BD().termOptions, f.term);
    if (src) fillSelect(src, BD().srcOptions, f.src);
  }

  function channelLabel(v) {
    var o = (BD().channelOptions || []).find(function (x) { return x.value === v; });
    return o ? o.label : v;
  }
  function termLabel(v) {
    var o = (BD().termOptions || []).find(function (x) { return x.value === v; });
    return o ? o.label : v;
  }
  function srcLabel(v) {
    var o = (BD().srcOptions || []).find(function (x) { return x.value === v; });
    return o ? o.label : v;
  }

  function ensureActiveFiltersHost(opts) {
    opts = opts || {};
    var id = opts.id || "active-filters";
    var el = document.getElementById(id);
    if (el) return el;
    var filter = document.querySelector(".board-filter");
    var host = filter || document.getElementById("page-content");
    if (!host) return null;
    el = document.createElement("div");
    el.id = id;
    el.style.cssText = "margin:0 0 12px;font-size:12px";
    if (filter && filter.parentNode) {
      filter.parentNode.insertBefore(el, filter.nextSibling);
    } else {
      host.insertBefore(el, host.firstChild);
    }
    return el;
  }

  function renderActiveFilters(opts) {
    opts = opts || {};
    ensureActiveFiltersHost(opts);
    var el = document.getElementById(opts.id || "active-filters");
    if (!el) return;
    var f = getFilters();
    var chips = [];
    chips.push({ key: "range", label: rangeLabel(f), clearable: false });
    if (f.range === "custom" && f.compareHint !== false) {
      chips.push({ key: "mom", label: "与上一等长周期比较", clearable: false });
    }
    if (f.channel) chips.push({ key: "channel", label: channelLabel(f.channel), clearable: true });
    else chips.push({ key: "channel", label: "全部渠道", clearable: false });
    if (f.term) chips.push({ key: "term", label: termLabel(f.term), clearable: true });
    else chips.push({ key: "term", label: "全部期次", clearable: false });
    if (document.getElementById("f-src") || opts.showSrc || f.src) {
      if (f.src) chips.push({ key: "src", label: srcLabel(f.src), clearable: true });
      else chips.push({ key: "src", label: "全部成交类型", clearable: false });
    }
    if (opts.zone === "attributed" || opts.zone === "attr") {
      chips.push({ key: "zone", label: "可归因交易", clearable: false });
    } else if (opts.zone === "full") {
      chips.push({ key: "zone", label: "全量交易", clearable: false });
    } else if (opts.zone) {
      chips.push({ key: "zone", label: String(opts.zone), clearable: false });
    }
    el.innerHTML = '<span class="muted" style="margin-right:6px">当前筛选：</span>' + chips.map(function (c) {
      if (c.clearable) {
        return '<button type="button" class="btn btn-sm" data-clear-filter="' + c.key + '" style="margin:0 4px 4px 0">' + c.label + " ×</button>";
      }
      return '<span class="badge" style="margin:0 4px 4px 0;font-weight:500">' + c.label + "</span>";
    }).join("");
    el.querySelectorAll("[data-clear-filter]").forEach(function (btn) {
      btn.onclick = function () {
        var k = btn.getAttribute("data-clear-filter");
        var patch = {};
        patch[k] = "";
        setFilters(patch);
        var ch = document.getElementById("f-channel");
        var term = document.getElementById("f-term");
        var src = document.getElementById("f-src");
        if (ch && k === "channel") ch.value = "";
        if (term && k === "term") term.value = "";
        if (src && k === "src") src.value = "";
        var d = applyRange(getFilters().range);
        wireBoardLinks();
        if (typeof renderActiveFilters._onClear === "function") {
          renderActiveFilters._onClear(getFilters().range, d, getFilters());
        }
      };
    });
  }

  function buildDrilldownUrl(path, extra) {
    path = path || "";
    extra = extra || {};
    var hash = "";
    var hashIdx = path.indexOf("#");
    if (hashIdx >= 0) {
      hash = path.slice(hashIdx);
      path = path.slice(0, hashIdx);
    }
    var qIdx = path.indexOf("?");
    var pathname = qIdx >= 0 ? path.slice(0, qIdx) : path;
    var params = new URLSearchParams(qIdx >= 0 ? path.slice(qIdx + 1) : "");

    var f = getFilters();
    if (f.range) params.set("range", f.range);
    else params.delete("range");
    if (f.range === "custom" && f.start_date) params.set("start_date", f.start_date);
    else params.delete("start_date");
    if (f.range === "custom" && f.end_date) params.set("end_date", f.end_date);
    else params.delete("end_date");
    if (f.channel) params.set("channel", f.channel);
    else params.delete("channel");
    if (f.term) params.set("term", f.term);
    else params.delete("term");
    if (f.src && (/board-convert/.test(pathname) || extra.transaction_type || extra.keepSrc)) {
      params.set("src", f.src);
      params.set("transaction_type", f.src);
    } else if (!/board-convert/.test(pathname) && !extra.transaction_type) {
      params.delete("src");
    }

    Object.keys(extra).forEach(function (k) {
      var v = extra[k];
      if (k === "focus") v = normalizeFocus(v);
      if (v == null || v === "" || v === undefined) params.delete(k);
      else params.set(k, String(v));
    });

    if (global.BoardInsights && typeof BoardInsights.getAnalyticsState === "function") {
      var onOverview = /board-overview\.html/.test(location.pathname || "");
      if (onOverview || extra.from_board === "overview") {
        var st = BoardInsights.getAnalyticsState();
        if (st.funnelStep && !params.has("funnel_step")) params.set("funnel_step", st.funnelStep);
        if (st.funnelDim && !params.has("funnel_dim")) params.set("funnel_dim", st.funnelDim);
      }
    }

    if (params.has("focus")) {
      params.set("focus", normalizeFocus(params.get("focus")));
    }

    ["range", "channel", "term", "src", "tab", "transaction_type", "transactionType", "start_date", "end_date"]
      .concat(DRILL_EXTRA_KEYS)
      .forEach(function (k) {
        if (params.get(k) === "undefined" || params.get(k) === "null") params.delete(k);
      });

    var qs = params.toString();
    return pathname + (qs ? "?" + qs : "") + hash;
  }

  function wireBoardLinks(root) {
    root = root || document;
    root.querySelectorAll("a[data-board-link]").forEach(function (a) {
      var path = a.getAttribute("data-board-link");
      if (!path) return;
      var extra = {};
      DRILL_EXTRA_KEYS.forEach(function (k) {
        var attr = a.getAttribute("data-board-" + k.replace(/_/g, "-"));
        if (attr == null) attr = a.getAttribute("data-board-" + k);
        if (attr != null && attr !== "") extra[k] = attr;
      });
      /* 常见短别名 */
      var tab = a.getAttribute("data-board-tab");
      if (tab) extra.tab = tab;
      var focus = a.getAttribute("data-board-focus");
      if (focus) extra.focus = normalizeFocus(focus);
      var owner = a.getAttribute("data-board-owner");
      if (owner) extra.owner = owner;
      var liveId = a.getAttribute("data-board-live-id");
      if (liveId) extra.live_id = liveId;
      var stage = a.getAttribute("data-board-stage");
      if (stage) extra.stage = stage;
      var section = a.getAttribute("data-board-section");
      if (section) extra.section = section;
      var attribution = a.getAttribute("data-board-attribution");
      if (attribution) extra.attribution = attribution;
      var productId = a.getAttribute("data-board-product-id");
      if (productId) extra.product_id = productId;
      var tx = a.getAttribute("data-board-transaction-type");
      if (tx) extra.transaction_type = tx;
      a.setAttribute("href", buildDrilldownUrl(path, extra));
      if (global.BoardInsights && /board-overview\.html/.test(location.pathname || "")) {
        a.addEventListener("click", function () {
          BoardInsights.saveReturnState();
          BoardInsights.setAnalyticsState({ scrollAnchor: "funnel-section" });
        });
      }
    });
  }

  function formatCutoff(d) {
    d = d || new Date();
    function p(n) { return n < 10 ? "0" + n : "" + n; }
    return "数据截止 " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }

  function setUpdatedNow() {
    var el = document.getElementById("board-updated");
    if (!el) return;
    var snap = getSnapshot();
    var at = snap.snapshotAt || "";
    /* snapshotAt 已是 YYYY-MM-DD HH:mm:ss；展示时取时分秒 */
    var timePart = at.length >= 19 ? at.slice(11) : at;
    el.textContent = timePart ? ("数据截止 " + timePart) : formatCutoff();
  }

  function ensureCaliberUI() {
    if (document.getElementById("board-caliber-btn")) return;
    var host = document.querySelector(".board-filter") || document.getElementById("page-content");
    if (!host) return;
    var wrap = document.createElement("div");
    wrap.className = "board-caliber-wrap";
    wrap.innerHTML =
      '<button type="button" class="btn btn-sm" id="board-caliber-btn">统计口径</button>' +
      '<div class="board-caliber-pop" id="board-caliber-pop" hidden>' +
      "<p><b>主漏斗口径</b><br/>主漏斗以筛选时间范围内首次入池的线索为统计对象，观察其截至数据更新时间是否完成分配、加微和可归因支付。</p>" +
      "<p><b>交易指标口径</b><br/>全量交易按支付事件统计；可归因交易须能关联到筛选范围内线索/渠道/期次。缺映射时展示「—」，而非成交为 0。</p>" +
      "<p><b>筛选作用范围</b><br/>" + FILTER_SCOPE_HELP + "</p>" +
      '<p class="today-note" id="board-caliber-today" hidden>今日线索仍在持续转化，当前转化率不是最终结果。</p>' +
      "</div>";
    var filter = document.querySelector(".board-filter");
    if (filter) filter.appendChild(wrap);
    else host.insertBefore(wrap, host.firstChild);

    if (!document.getElementById("board-caliber-error")) {
      var err = document.createElement("div");
      err.id = "board-caliber-error";
      err.className = "board-tip";
      err.hidden = true;
      err.style.cssText = "display:none;background:#fff1f0;border-color:#ffa39e;margin-bottom:12px";
      var page = document.getElementById("page-content");
      if (page) page.insertBefore(err, page.firstChild);
    }

    var btn = document.getElementById("board-caliber-btn");
    var pop = document.getElementById("board-caliber-pop");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var show = pop.hasAttribute("hidden");
      if (show) pop.removeAttribute("hidden");
      else pop.setAttribute("hidden", "");
      var todayNote = document.getElementById("board-caliber-today");
      if (todayNote) {
        if (getFilters().range === "today") todayNote.removeAttribute("hidden");
        else todayNote.setAttribute("hidden", "");
      }
    });
    document.addEventListener("click", function () {
      pop.setAttribute("hidden", "");
    });
    pop.addEventListener("click", function (e) { e.stopPropagation(); });
  }

  function bindFilterBar(opts) {
    opts = opts || {};
    fillFilterOptions(opts);
    ensureCaliberUI();
    ensureActiveFiltersHost(opts);
    getSnapshot();
    setUpdatedNow();
    var f = getFilters();
    var ch = document.getElementById(opts.channelId || "f-channel");
    var term = document.getElementById(opts.termId || "f-term");
    var src = document.getElementById(opts.srcId || "f-src");
    if (ch) ch.value = f.channel || "";
    if (term) term.value = f.term || "";
    if (src) src.value = f.src || "";

    var queryBtn = document.getElementById(opts.queryId || "btn-query");
    var resetBtn = document.getElementById(opts.resetId || "btn-reset");
    var refreshBtn = document.getElementById(opts.refreshId || "btn-refresh");

    function run(msg, push) {
      var next = {
        channel: ch ? ch.value : getFilters().channel,
        term: term ? term.value : getFilters().term,
        src: src ? src.value : getFilters().src
      };
      setFilters(next, { push: push !== false });
      var d = applyRange(getFilters().range, document, { skipSet: true });
      wireBoardLinks();
      renderActiveFilters(opts);
      setUpdatedNow();
      if (typeof opts.onApply === "function") opts.onApply(getFilters().range, d, getFilters());
      if (msg) Proto.toast(msg);
    }

    renderActiveFilters._onClear = opts.onApply;
    renderActiveFilters(opts);

    if (queryBtn) queryBtn.onclick = function () { run("已按筛选条件更新整页"); };
    if (opts.autoApply !== false) {
      if (ch) ch.addEventListener("change", function () { run(); });
      if (term) term.addEventListener("change", function () { run(); });
      if (src) src.addEventListener("change", function () { run(); });
      if (queryBtn) queryBtn.style.display = "none";
    }
    if (resetBtn) {
      resetBtn.onclick = function () {
        if (ch) ch.value = "";
        if (term) term.value = "";
        if (src) src.value = "";
        resetFilters(true);
        if (global.BoardInsights && BoardInsights.setAnalyticsState) {
          BoardInsights.setAnalyticsState({ crossFilter: null });
        }
        run("已重置筛选条件");
      };
    }
    if (refreshBtn) {
      refreshBtn.onclick = function () {
        if (refreshBtn.getAttribute("data-loading") === "1") return;
        refreshBtn.setAttribute("data-loading", "1");
        var old = refreshBtn.textContent;
        refreshBtn.textContent = "刷新中…";
        refreshBtn.disabled = true;
        setTimeout(function () {
          refreshBtn.setAttribute("data-loading", "0");
          refreshBtn.textContent = old;
          refreshBtn.disabled = false;
          /* 仅刷新数据快照，不重置 ProtoBiz 业务状态 */
          refreshSnapshot();
          setUpdatedNow();
          run("数据已更新");
        }, 650);
      };
    }

    onFilterChange(function (payload, dMaybe, meta) {
      if (!(meta && meta.fromPopstate)) return;
      var f = (payload && payload.range != null) ? payload : getFilters();
      if (ch) ch.value = f.channel || "";
      if (term) term.value = f.term || "";
      if (src) src.value = f.src || "";
      renderActiveFilters(opts);
      var d = dMaybe || applyRange(f.range, document, { skipSet: true });
      if (typeof opts.onApply === "function") opts.onApply(f.range, d, f);
    });
  }

  function exportCsv(filename, headers, rows) {
    var f = getFilters();
    var snap = getSnapshot();
    var d = aggregateLeadMetrics(f);
    var meta = [
      ["# snapshotAt", snap.snapshotAt || ""],
      ["# range", f.range || ""],
      ["# start_date", f.start_date || ""],
      ["# end_date", f.end_date || ""],
      ["# rangeLabel", rangeLabel(f)],
      ["# channel", f.channel || ""],
      ["# term", f.term || ""],
      ["# src", f.src || ""],
      ["# transactionType", f.src || ""],
      ["# caliber", d.caliberNote || ATTR]
    ];
    var lines = [];
    meta.forEach(function (r) {
      lines.push(r.map(function (c) {
        var s = String(c == null ? "" : c).replace(/"/g, '""');
        return /[",\n]/.test(s) ? '"' + s + '"' : s;
      }).join(","));
    });
    lines.push(headers.join(","));
    rows.forEach(function (r) {
      lines.push(r.map(function (c) {
        var s = String(c == null ? "" : c).replace(/"/g, '""');
        return /[",\n]/.test(s) ? '"' + s + '"' : s;
      }).join(","));
    });
    var blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportFileName(page) {
    var f = getFilters();
    var d = new Date();
    function p(n) { return n < 10 ? "0" + n : "" + n; }
    var day = d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
    var rangePart = f.range === "custom" && f.start_date && f.end_date
      ? (f.start_date + "_" + f.end_date)
      : (rangeLabel(f).replace(/[\\/:*?"<>|]/g, "") || f.range || "7d");
    var parts = [page, rangePart];
    if (f.term) parts.push(termLabel(f.term) || f.term);
    if (f.channel) parts.push(channelLabel(f.channel) || f.channel);
    parts.push(day);
    return parts.join("_") + ".csv";
  }

  function renderEmpty(tbody, cols, text) {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="' + cols + '" class="muted" style="text-align:center;padding:28px">' + (text || "当前筛选条件下暂无数据") + "</td></tr>";
  }

  function slugifyOwner(name) {
    if (!name) return "";
    var s = String(name).replace(/\s+/g, "").trim();
    if (!s || s === "—" || s === "-" || s === "无") return "";
    if (s === "其他人员") return "other";
    return s.replace(/[^\w\u4e00-\u9fff_-]/g, "") || "other";
  }

  function ensureDrillBanner(host, text, visible, total) {
    var id = "board-drill-banner";
    var el = document.getElementById(id);
    if (!text) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement("div");
      el.id = id;
      el.className = "board-tip";
      el.style.cssText = "margin-bottom:12px;background:#f0f5ff;border-color:#adc6ff";
      host = host || document.getElementById("page-content");
      if (host) host.insertBefore(el, host.firstChild);
      else return;
    }
    var ctx = (global.BoardInsights && BoardInsights.describeAnalyticsContext)
      ? BoardInsights.describeAnalyticsContext()
      : "";
    var backHref = (global.BoardInsights && BoardInsights.buildReturnBoardUrl)
      ? BoardInsights.buildReturnBoardUrl()
      : ((global.BoardInsights && BoardInsights.buildReturnOverviewUrl)
        ? BoardInsights.buildReturnOverviewUrl()
        : "board-overview.html");
    var fromQ = "";
    try { fromQ = new URLSearchParams(location.search).get("from_board") || ""; } catch (e) {}
    var fromLabel = (fromQ === "term_review" || fromQ === "term-review") ? "来自期次经营看板" : "来自经营分析";
    var backLabel = (fromQ === "term_review" || fromQ === "term-review") ? "返回期次经营看板" : "返回经营分析";
    el.innerHTML = "<b>" + fromLabel + "</b> · " + (ctx || text) +
      (visible >= 0 ? " · 匹配 <b>" + visible + "</b> / " + total + " 行（演示样本）" : "") +
      ' · <a href="' + backHref + '" style="color:var(--color-primary);margin-right:8px">' + backLabel + "</a>" +
      '<a href="' + location.pathname.split("/").pop() + '" style="color:var(--color-primary)">清除筛选</a>';
  }

  /**
   * 消费看板下钻 URL：按 owner/focus/status/stage/attribution/product_id 等过滤表格行并高亮。
   * options.cols: { owner, stage, product, channel, payStatus, refundStatus, lastFu, promoter }
   */
  function applyDrilldownToList(options) {
    options = options || {};
    var tbody = typeof options.tbody === "string"
      ? document.getElementById(options.tbody)
      : options.tbody;
    if (!tbody) return null;
    var q;
    try { q = new URLSearchParams(location.search); } catch (e) { return null; }

    var owner = q.get("owner") || "";
    var focus = normalizeFocus(q.get("focus") || "");
    var status = q.get("status") || q.get("lead_status") || "";
    var stage = q.get("stage") || q.get("follow_stage") || "";
    var attribution = q.get("attribution") || "";
    var productId = q.get("product_id") || "";
    var tx = q.get("transaction_type") || q.get("src") || "";
    var channel = q.get("channel") || "";
    var cols = options.cols || {};
    var labels = [];

    function cell(tds, idx) {
      if (idx == null || !tds[idx]) return "";
      return String(tds[idx].textContent || "").replace(/\s+/g, " ").trim();
    }
    function ownerMatch(text, want) {
      var a = slugifyOwner(text);
      var b = slugifyOwner(want);
      if (!b) return true;
      if (b === "other") return !a;
      return a === b || text === want;
    }
    function productMatch(text, pid) {
      if (!pid) return true;
      var head = String(text || "").split(/[\n·]/)[0].trim();
      var slug = head.replace(/\s+/g, "_").slice(0, 40);
      var soft = decodeURIComponent(pid).replace(/_/g, " ");
      return slug === pid || head.indexOf(soft) >= 0 || text.indexOf(soft) >= 0 ||
        head.replace(/\s+/g, "_").indexOf(pid) >= 0;
    }

    var channelMap = { video: "视频号", xhs: "小红书", link: "获客链接", code: "活码", manual: "手动", content: "内容", live: "直播" };
    var stageHints = {
      new: "新", following: "跟进", follow: "跟进", converted: "转化", invalid: "无效",
      high: "高意向", "新加微": "新", "待首跟": "新", "跟进中": "跟进", "高意向": "高意向",
      "已转化": "转化", "无效": "无效", "战败": "战败"
    };

    if (owner) labels.push("归属人=" + owner);
    if (focus === "unassigned") labels.push("未分配");
    if (focus === "no_follow") labels.push("无跟进");
    if (focus === "attend_no_pay") labels.push("到场未支付");
    if (focus === "sms_failed") labels.push("短信失败");
    if (status) labels.push("状态=" + status);
    if (stage) labels.push("阶段=" + stage);
    if (attribution) labels.push("归因=" + (attribution === "attributed" ? "可归因" : attribution === "full" ? "全量" : attribution));
    if (productId) labels.push("商品=" + productId);
    if (tx) labels.push("成交类型=" + tx);
    if (channel) labels.push("渠道=" + (channelMap[channel] || channel));

    if (!labels.length) {
      ensureDrillBanner(options.bannerHost, "", 0, 0);
      return { visible: -1, filters: [] };
    }

    var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
    var total = rows.length;
    var visible = 0;
    rows.forEach(function (tr) {
      if (tr.getAttribute("data-drill-empty")) {
        tr.remove();
        return;
      }
      var tds = tr.querySelectorAll("td");
      var ok = true;
      if (owner && cols.owner != null && !ownerMatch(cell(tds, cols.owner), owner)) ok = false;
      if (focus === "unassigned" && cols.owner != null) {
        if (slugifyOwner(cell(tds, cols.owner))) ok = false;
      }
      if (focus === "no_follow") {
        if (cols.lastFu != null) {
          var lf = cell(tds, cols.lastFu);
          if (lf && lf !== "—" && lf !== "-") ok = false;
        } else if (cols.stage != null) {
          var st0 = cell(tds, cols.stage);
          if (st0.indexOf("新") < 0 && st0.indexOf("无跟进") < 0) ok = false;
        }
      }
      if (focus === "attend_no_pay") {
        if (cols.stage != null) {
          var st1 = cell(tds, cols.stage);
          if (st1.indexOf("跟进") < 0 && st1.indexOf("高意向") < 0) ok = false;
        }
        if (cols.lastFu != null && cell(tds, cols.lastFu) === "—") ok = false;
      }
      if (status === "assigned" && cols.owner != null && !slugifyOwner(cell(tds, cols.owner))) ok = false;
      if (status === "wecom" && cols.owner != null && !slugifyOwner(cell(tds, cols.owner))) ok = false;
      if ((status === "paid" || status === "done") && cols.payStatus != null) {
        var ps = cell(tds, cols.payStatus);
        if (ps.indexOf("已支付") < 0 && ps.indexOf("已完成") < 0) ok = false;
      }
      if (status === "refund") {
        var rf = cell(tds, cols.payStatus) + " " + cell(tds, cols.refundStatus);
        if (rf.replace(/\s+/g, "") && rf.indexOf("退") < 0 && rf.indexOf("审核") < 0 && rf.indexOf("驳回") < 0) ok = false;
      }
      if (stage && cols.stage != null) {
        var st = cell(tds, cols.stage);
        var hint = stageHints[stage] || stage;
        if (st.indexOf(hint) < 0 && st.indexOf(stage) < 0) ok = false;
      }
      if (productId && cols.product != null && !productMatch(cell(tds, cols.product), productId)) ok = false;
      if (attribution === "attributed" && cols.channel != null) {
        var ch = cell(tds, cols.channel);
        if (ch.indexOf("视频号") < 0 && ch.indexOf("直播") < 0) ok = false;
      }
      if (tx && (cols.product != null || cols.channel != null)) {
        var blob = cell(tds, cols.product) + " " + cell(tds, cols.channel);
        var txOk = true;
        if (tx === "内容课" || tx === "content") txOk = /课|训练营|精讲/.test(blob) && blob.indexOf("视频号") < 0 && blob.indexOf("直播") < 0;
        else if (tx === "直播带货" || tx === "live") txOk = blob.indexOf("直播") >= 0;
        else if (tx === "视频号" || tx === "video") txOk = blob.indexOf("视频号") >= 0;
        else if (tx === "其他" || tx === "other") txOk = blob.indexOf("其他") >= 0;
        if (!txOk) ok = false;
      }
      if (channel && cols.channel != null) {
        var wantCh = channelMap[channel] || channel;
        if (cell(tds, cols.channel).indexOf(wantCh) < 0) ok = false;
      }

      tr.style.display = ok ? "" : "none";
      tr.style.background = ok ? "rgba(22,93,255,0.06)" : "";
      if (ok) visible += 1;
    });

    if (visible === 0 && rows.length) {
      var empty = document.createElement("tr");
      empty.setAttribute("data-drill-empty", "1");
      var colCount = (rows[0] && rows[0].children.length) || 8;
      empty.innerHTML = '<td colspan="' + colCount + '" class="muted" style="text-align:center;padding:28px">当前下钻条件下暂无匹配行（原型示意）</td>';
      tbody.appendChild(empty);
    }

    ensureDrillBanner(options.bannerHost, labels.join(" · "), visible, total);
    return { visible: visible, filters: labels, total: total };
  }

  var RANGES = BD() ? BD().ranges : {};

  global.BoardMetrics = {
    ATTR: ATTR,
    FILTER_SCOPE_HELP: FILTER_SCOPE_HELP,
    RANGES: RANGES,
    FILTER_KEY: FILTER_KEY,
    SNAPSHOT_KEY: SNAPSHOT_KEY,
    fmt: fmt,
    money: money,
    pct: pct,
    pct1: pct1,
    rangeLabel: rangeLabel,
    comparePeriodHint: comparePeriodHint,
    getFilters: getFilters,
    setFilters: setFilters,
    resetFilters: resetFilters,
    getDataFilters: getDataFilters,
    onFilterChange: onFilterChange,
    setUrlWriteMode: setUrlWriteMode,
    isValidCustomRange: isValidCustomRange,
    formatDateRangeFriendly: formatDateRangeFriendly,
    businessToday: businessToday,
    BUSINESS_TODAY: BUSINESS_TODAY,
    formatYmd: formatYmd,
    parseYmd: parseYmd,
    channelLabel: channelLabel,
    termLabel: termLabel,
    srcLabel: srcLabel,
    getRangeData: getRangeData,
    aggregateLeadMetrics: aggregateLeadMetrics,
    getProductRows: getProductRows,
    getFullProductRows: getFullProductRows,
    getLiveRows: getLiveRows,
    getLiveSummary: getLiveSummary,
    getStaffRows: getStaffRows,
    sumStaff: sumStaff,
    getStageDistribution: getStageDistribution,
    getSnapshot: getSnapshot,
    refreshSnapshot: refreshSnapshot,
    validateConsistency: validateConsistency,
    applyRange: applyRange,
    bindRange: bindRange,
    bindFilterBar: bindFilterBar,
    fillAttr: fillAttr,
    fillFilterOptions: fillFilterOptions,
    renderActiveFilters: renderActiveFilters,
    ensureActiveFiltersHost: ensureActiveFiltersHost,
    buildDrilldownUrl: buildDrilldownUrl,
    wireBoardLinks: wireBoardLinks,
    setUpdatedNow: setUpdatedNow,
    formatCutoff: formatCutoff,
    ensureCaliberUI: ensureCaliberUI,
    exportCsv: exportCsv,
    exportFileName: exportFileName,
    renderEmpty: renderEmpty,
    applyDrilldownToList: applyDrilldownToList,
    slugifyOwner: slugifyOwner,
    syncRangeUI: syncRangeUI,
    getTimingBuckets: getTimingBuckets,
    getLeadSlices: function (filters) {
      return sumSlices(filters || getFilters()).list;
    }
  };
})(window);
