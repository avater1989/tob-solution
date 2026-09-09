/* 商家端经营分析 — 统一筛选 / 计算 / 渲染引擎（依赖 board-data.js） v5 */
(function (global) {
  var FILTER_KEY = "merchant_board_filters";
  var ATTR =
    "增长主漏斗：入池 → 分配 → 加微 → 可归因支付。" +
    "私域跟进、直播运营和退款为经营专题。" +
    "视频号获客首单为前端获客辅指标，不计入后链路。";

  function BD() {
    return global.BoardData;
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

  function rangeLabel(range) {
    var map = { today: "今日", yesterday: "昨日", "7d": "近7日", "30d": "近30日" };
    return map[range] || range || "—";
  }

  function readUrlFilters() {
    var q = new URLSearchParams(location.search);
    var f = {};
    if (q.get("range")) f.range = q.get("range");
    if (q.get("channel") != null && q.has("channel")) f.channel = q.get("channel");
    if (q.get("term") != null && q.has("term")) f.term = q.get("term");
    if (q.get("src") != null && q.has("src")) f.src = q.get("src");
    if (q.get("tab") != null && q.has("tab")) f.tab = q.get("tab");
    return f;
  }

  function writeUrlFilters(f) {
    try {
      var q = new URLSearchParams(location.search);
      var onPrivate = /board-private\.html/.test(location.pathname || "");
      ["range", "channel", "term", "src", "tab"].forEach(function (k) {
        if (k === "tab") {
          if (onPrivate && f.tab) q.set("tab", f.tab);
          else q.delete("tab");
          return;
        }
        if (k === "src" && !/board-convert\.html/.test(location.pathname || "")) {
          /* src 仅交易页写入 URL；其他页不展示隐藏成交类型 */
          if (!f.src) q.delete("src");
          return;
        }
        if (f[k]) q.set(k, f[k]);
        else q.delete(k);
      });
      var qs = q.toString();
      var next = location.pathname + (qs ? "?" + qs : "") + location.hash;
      if (next !== location.pathname + location.search + location.hash) {
        history.replaceState(null, "", next);
      }
    } catch (e) {}
  }

  function getFilters() {
    var base = { range: "7d", channel: "", term: "", src: "", tab: "" };
    try {
      var raw = sessionStorage.getItem(FILTER_KEY);
      if (raw) Object.assign(base, JSON.parse(raw));
    } catch (e) {}
    if (!getFilters._booted) {
      Object.assign(base, readUrlFilters());
      getFilters._booted = true;
      sessionStorage.setItem(FILTER_KEY, JSON.stringify({
        range: base.range,
        channel: base.channel || "",
        term: base.term || "",
        src: base.src || "",
        tab: base.tab || ""
      }));
    }
    if (!BD().ranges[base.range]) base.range = "7d";
    return base;
  }

  function setFilters(partial) {
    var cur = getFilters();
    Object.assign(cur, partial || {});
    if (!BD().ranges[cur.range]) cur.range = "7d";
    var saved = {
      range: cur.range,
      channel: cur.channel || "",
      term: cur.term || "",
      src: cur.src || "",
      tab: cur.tab || ""
    };
    sessionStorage.setItem(FILTER_KEY, JSON.stringify(saved));
    writeUrlFilters(saved);
    return Object.assign({}, saved);
  }

  function resetFilters(keepRange) {
    var range = keepRange ? getFilters().range : "7d";
    var tab = getFilters().tab || "";
    return setFilters({ range: range, channel: "", term: "", src: "", tab: tab });
  }

  function sumSlices(filters) {
    var list = BD().leadSlices.filter(function (s) {
      if (s.range !== filters.range) return false;
      if (filters.channel && s.channel !== filters.channel) return false;
      if (filters.term && s.term !== filters.term) return false;
      return true;
    });
    var acc = {
      poolLeads: 0, assignedLeads: 0, wecomLeads: 0, attributedPayUsers: 0,
      videoOrders: 0, videoLeads: 0, videoClaims: 0, videoSmsFailed: 0,
      noFollow: 0, churn: 0, attendUsers: 0, payWithAttend: 0
    };
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
    });
    return { list: list, sum: acc, filtered: !!(filters.channel || filters.term) };
  }

  function getProductRows(filters) {
    filters = filters || getFilters();
    return BD().productRows.filter(function (r) {
      if (r.range !== filters.range) return false;
      if (filters.src && r.src !== filters.src) return false;
      if (filters.term) {
        if (r.isOther) return false;
        if (r.term !== filters.term) return false;
      }
      if (filters.channel) {
        if (r.isOther) return false;
        if (filters.channel === "video") return r.channel === "video" || r.src === "视频号";
        /* 其他获客渠道无交易商品映射 → 空 */
        if (filters.channel === "livecode" || filters.channel === "link" ||
            filters.channel === "redbook" || filters.channel === "import") {
          return false;
        }
        return r.channel === filters.channel;
      }
      return true;
    });
  }

  function getLiveRows(filters) {
    filters = filters || getFilters();
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
    rows.forEach(function (r) {
      if (r.status === "upcoming" || r.dataInsufficient || r.attend == null) {
        pending.push(r);
      } else if (r.inviteSent) {
        sent.push(r);
      } else {
        miss.push(r);
      }
    });
    var sentAvg = avgAttendRate(sent);
    var missAvg = avgAttendRate(miss);
    var sampleOk = sent.length > 0 && miss.length > 0 && sentAvg && missAvg;
    var lift = "—";
    if (sampleOk) {
      var diff = parseInt(sentAvg, 10) - parseInt(missAvg, 10);
      lift = (diff >= 0 ? "+" : "") + diff + "pt";
    }
    var allEnded = sent.concat(miss);
    return {
      sessions: rows.length,
      sent: sent.length,
      sentAvg: sentAvg || "—",
      miss: miss.length,
      missAvg: missAvg || "—",
      pending: pending.length,
      inviteLift: lift,
      liveAttendAvg: avgAttendRate(allEnded) || "—",
      sampleOk: sampleOk
    };
  }

  function getLiveSummary(filters) {
    filters = filters || getFilters();
    var rows = getLiveRows(filters);
    /* 有场次明细时一律由行聚合，保证场次数 = 明细行数 = 分组合计 */
    if (rows.length) return summarizeLiveRows(rows);
    var map = BD().liveSummaries || {};
    var key = filters.term ? filters.range + ":" + filters.term : filters.range;
    return map[key] || map[filters.range] || {
      sessions: 0, sent: 0, sentAvg: "—", miss: 0, missAvg: "—", pending: 0,
      inviteLift: "—", liveAttendAvg: "—", sampleOk: false
    };
  }

  function getStaffRows(filters) {
    filters = filters || getFilters();
    var raw = BD().staffRows.filter(function (r) {
      if (r.range !== filters.range) return false;
      if (filters.channel && r.channel !== filters.channel) return false;
      if (filters.term) {
        if (r.isOther && !r.term) return true;
        if (r.term && r.term !== filters.term) return false;
      }
      return true;
    });
    /* 同名合并（多期次切片时） */
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

  function aggregateLeadMetrics(filters) {
    filters = filters || getFilters();
    var base = BD().ranges[filters.range] || BD().ranges["7d"];
    var sliced = sumSlices(filters);
    var productFilters = Object.assign({}, filters);
    if (!filters.applySrc) productFilters.src = "";
    var tradeFiltered = !!(filters.channel || filters.term || (filters.applySrc && filters.src));
    var products = getProductRows(productFilters);
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

    /* 直播场次：只看 range/term 汇总，不因获客渠道缩减 */
    d.liveSessions = liveSum.sessions || 0;
    d.liveAttendAvg = liveSum.liveAttendAvg || "—";
    d.inviteLift = liveSum.sampleOk ? (liveSum.inviteLift || "—") : "—";
    d.inviteGroups = {
      sent: liveSum.sent || 0,
      sentAvg: liveSum.sentAvg || "—",
      miss: liveSum.miss || 0,
      missAvg: liveSum.missAvg || "—",
      pending: liveSum.pending || 0,
      sampleOk: !!liveSum.sampleOk,
      inviteLift: d.inviteLift
    };

    if (products.length) {
      var po = 0, pg = 0, ra = 0, ru = 0;
      products.forEach(function (p) {
        po += p.orders || 0;
        pg += p.gmv || 0;
        ra += p.refundAmount || 0;
        ru += p.refundUsers || 0;
      });
      d.totalPaidOrders = po;
      d.totalGmv = pg;
      d.refundAmount = ra;
      d.refundUsers = ru;
      d.refundRate = pg ? pct1(ra, pg) : "—";
      if (tradeFiltered) {
        d.totalPayUsers = d.attributedPayUsers;
      }
    } else if (tradeFiltered || filters.channel || filters.term || (filters.applySrc && filters.src)) {
      d.totalPaidOrders = 0;
      d.totalGmv = 0;
      d.totalPayUsers = 0;
      d.refundAmount = 0;
      d.refundUsers = 0;
      d.refundRate = "—";
    } else {
      d.refundRate = base.refundRate;
    }

    var staff = sumStaff(filters);
    if (filters.channel || filters.term) {
      /* 人员聚合优先用于校验；无跟进/流失以切片为准（已写入） */
      if (staff.wecom && !sliced.filtered) {
        d.noFollow = staff.noFollow;
        d.churn = staff.churn;
      }
    }
    d.coverRate = d.wecomLeads ? pct(staff.followedPeople || (d.wecomLeads - d.noFollow), d.wecomLeads) : "—";
    if (staff.followedPeople) {
      d.coverRate = pct(staff.followedPeople, staff.wecom || d.wecomLeads);
    }

    var timing = getTimingBuckets(filters.range);
    var timely = 0;
    timing.slice(0, 2).forEach(function (b) { timely += b.pct || 0; });
    d.timelyAssignRate = timely + "%";

    d.pool = d.poolLeads;
    d.assign = d.assignedLeads;
    d.wecom = d.wecomLeads;
    d.pay = d.attributedPayUsers;
    d.orders = d.totalPaidOrders;
    d.gmv = money(d.totalGmv || 0);
    d.vxOrders = d.videoOrders;
    d.vxLeads = d.videoLeads;
    d.vxClaim = d.videoClaims;
    d.vxSmsFail = d.videoSmsFailed;
    d.lives = d.liveSessions;
    d.attend = d.attendUsers;
    d.backlog = Math.max(0, d.poolLeads - d.assignedLeads);
    d.backlogLate = Math.round(d.backlog * 0.35);
    d.stepAssign = pct(d.assignedLeads, d.poolLeads);
    d.stepWecom = pct(d.wecomLeads, d.assignedLeads);
    d.stepPay = pct(d.attributedPayUsers, d.wecomLeads);
    d.endRate = pct(d.attributedPayUsers, d.poolLeads);
    d.aov = d.totalPaidOrders ? money(Math.round(d.totalGmv / d.totalPaidOrders)) : "—";
    d.label = base.label;
    d.compareLabel = base.compareLabel;
    d.deltas = base.deltas;
    d.empty = d.poolLeads === 0 && d.totalPaidOrders === 0;
    d.tradeEmpty = tradeFiltered && !products.length;
    /* 无交易商品映射：展示空态，避免假 ¥0 / 0 单误导 */
    if (d.tradeEmpty) {
      d.gmv = "—";
      d.orders = "—";
      d.aov = "—";
      d.refundRate = "—";
      d.refundUsers = "—";
      d.refundAmount = "—";
    }
    return d;
  }

  function getTimingBuckets(range) {
    var r = range || getFilters().range;
    return (BD().timingBuckets[r] || BD().timingBuckets["7d"]).slice();
  }

  function getRangeData(range) {
    var f = getFilters();
    if (range) f.range = range;
    return aggregateLeadMetrics(f);
  }

  function applyRange(key, root) {
    var f = setFilters({ range: key || getFilters().range });
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
  }

  function bindRange(segId, onChange) {
    var seg = document.getElementById(segId || "range-seg");
    if (!seg) return;
    syncRangeUI(segId);
    seg.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-range]");
      if (!b) return;
      var key = b.getAttribute("data-range");
      setFilters({ range: key });
      syncRangeUI(segId);
      var d = applyRange(key);
      if (typeof onChange === "function") onChange(key, d, getFilters());
    });
    var d = applyRange(getFilters().range);
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

  function renderActiveFilters(opts) {
    opts = opts || {};
    var el = document.getElementById(opts.id || "active-filters");
    if (!el) return;
    var f = getFilters();
    var chips = [];
    chips.push({ key: "range", label: rangeLabel(f.range), clearable: false });
    if (f.channel) chips.push({ key: "channel", label: channelLabel(f.channel), clearable: true });
    else chips.push({ key: "channel", label: "全部渠道", clearable: false });
    if (f.term) chips.push({ key: "term", label: termLabel(f.term), clearable: true });
    else chips.push({ key: "term", label: "全部期次", clearable: false });
    if (document.getElementById("f-src")) {
      if (f.src) chips.push({ key: "src", label: srcLabel(f.src), clearable: true });
      else chips.push({ key: "src", label: "全部成交类型", clearable: false });
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
    if (f.channel) params.set("channel", f.channel);
    else params.delete("channel");
    if (f.term) params.set("term", f.term);
    else params.delete("term");
    if (f.src && /board-convert/.test(pathname)) params.set("src", f.src);
    else if (!/board-convert/.test(pathname)) params.delete("src");

    Object.keys(extra).forEach(function (k) {
      var v = extra[k];
      if (v == null || v === "" || v === undefined) params.delete(k);
      else params.set(k, String(v));
    });

    /* 禁止残留 undefined */
    ["range", "channel", "term", "src", "tab", "transactionType"].forEach(function (k) {
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
      var tab = a.getAttribute("data-board-tab");
      if (tab) extra.tab = tab;
      a.setAttribute("href", buildDrilldownUrl(path, extra));
    });
  }

  function formatCutoff(d) {
    d = d || new Date();
    function p(n) { return n < 10 ? "0" + n : "" + n; }
    return "数据截止 " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }

  function setUpdatedNow() {
    var el = document.getElementById("board-updated");
    if (el) el.textContent = formatCutoff(new Date());
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
      "<p><b>交易指标口径</b><br/>交易指标按筛选时间范围内发生的支付或退款事件统计。当前筛选无商品映射时展示「—」，表示暂无可归因交易，而非成交为 0。</p>" +
      '<p class="today-note" id="board-caliber-today" hidden>今日线索仍在持续转化，当前转化率不是最终结果。</p>' +
      "</div>";
    var filter = document.querySelector(".board-filter");
    if (filter) filter.appendChild(wrap);
    else host.insertBefore(wrap, host.firstChild);

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

    function run(msg) {
      var next = {
        channel: ch ? ch.value : getFilters().channel,
        term: term ? term.value : getFilters().term,
        src: src ? src.value : getFilters().src
      };
      setFilters(next);
      var d = applyRange(getFilters().range);
      wireBoardLinks();
      renderActiveFilters();
      setUpdatedNow();
      if (typeof opts.onApply === "function") opts.onApply(getFilters().range, d, getFilters());
      if (msg) Proto.toast(msg);
    }

    renderActiveFilters._onClear = opts.onApply;
    renderActiveFilters();

    if (queryBtn) queryBtn.onclick = function () { run("已按筛选条件更新整页"); };
    if (resetBtn) {
      resetBtn.onclick = function () {
        if (ch) ch.value = "";
        if (term) term.value = "";
        if (src) src.value = "";
        resetFilters(true);
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
          setUpdatedNow();
          run("数据已更新");
        }, 650);
      };
    }
  }

  function exportCsv(filename, headers, rows) {
    var lines = [headers.join(",")];
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
    var day = d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
    var parts = [page, f.range || "7d"];
    if (f.term) parts.push(f.term);
    if (f.channel) parts.push(f.channel);
    parts.push(day);
    return parts.join("-") + ".csv";
  }

  function renderEmpty(tbody, cols, text) {
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="' + cols + '" class="muted" style="text-align:center;padding:28px">' + (text || "当前筛选条件下暂无数据") + "</td></tr>";
  }

  var RANGES = BD() ? BD().ranges : {};

  global.BoardMetrics = {
    ATTR: ATTR,
    RANGES: RANGES,
    FILTER_KEY: FILTER_KEY,
    fmt: fmt,
    money: money,
    pct: pct,
    pct1: pct1,
    rangeLabel: rangeLabel,
    getFilters: getFilters,
    setFilters: setFilters,
    resetFilters: resetFilters,
    getRangeData: getRangeData,
    aggregateLeadMetrics: aggregateLeadMetrics,
    getProductRows: getProductRows,
    getLiveRows: getLiveRows,
    getLiveSummary: getLiveSummary,
    getStaffRows: getStaffRows,
    sumStaff: sumStaff,
    applyRange: applyRange,
    bindRange: bindRange,
    bindFilterBar: bindFilterBar,
    fillAttr: fillAttr,
    fillFilterOptions: fillFilterOptions,
    renderActiveFilters: renderActiveFilters,
    buildDrilldownUrl: buildDrilldownUrl,
    wireBoardLinks: wireBoardLinks,
    setUpdatedNow: setUpdatedNow,
    formatCutoff: formatCutoff,
    ensureCaliberUI: ensureCaliberUI,
    exportCsv: exportCsv,
    exportFileName: exportFileName,
    renderEmpty: renderEmpty,
    syncRangeUI: syncRangeUI,
    getTimingBuckets: getTimingBuckets,
    getLeadSlices: function (filters) {
      return sumSlices(filters || getFilters()).list;
    }
  };
})(window);
