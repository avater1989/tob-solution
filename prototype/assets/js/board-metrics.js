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
    "live_id", "attribution", "product_id", "section", "transaction_type", "tab", "order_id"
  ];

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
      var q = new URLSearchParams(location.search);
      var urlF = readUrlFilters();
      /* URL 携带任一筛选参数时，以 URL 为准（缺失的 channel/term 视为清空，避免串页残留） */
      if (q.has("range") || q.has("channel") || q.has("term") || q.has("src") || q.has("tab") ||
          q.has("transaction_type") || q.has("transactionType")) {
        base = { range: "7d", channel: "", term: "", src: "", tab: "" };
        if (!urlF.range && q.has("range") === false) {
          /* keep default range if only other params */
        }
        Object.assign(base, urlF);
        if (!base.range) base.range = "7d";
      } else {
        Object.assign(base, urlF);
      }
      getFilters._booted = true;
      sessionStorage.setItem(FILTER_KEY, JSON.stringify({
        range: base.range,
        channel: base.channel || "",
        term: base.term || "",
        src: base.src || "",
        tab: base.tab || ""
      }));
      writeUrlFilters(base);
    }
    if (!BD().ranges[base.range]) base.range = "7d";
    return base;
  }

  function setFilters(partial) {
    var cur = getFilters();
    Object.assign(cur, partial || {});
    if (partial && partial.transactionType != null && partial.src == null) {
      cur.src = partial.transactionType;
    }
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
    filters = filters || getFilters();
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
    filters = filters || getFilters();
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
    filters = filters || getFilters();
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
    filters = filters || getFilters();
    var base = BD().ranges[filters.range] || BD().ranges["7d"];
    var sliced = sumSlices(filters);
    var attrScope = !!(filters.channel || filters.term);
    var src = resolveSrc(filters);
    var applySrc = !!(filters.applySrc || src);

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
        /* 有成交类型筛选时，支付用户无独立切片，沿用金额侧订单口径提示用 attributed 不覆盖 */
        fullPayUsers = base.totalPayUsers;
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
      /* 无渠道/期次时：可归因支付用户仍来自漏斗；订单/GMV 不把全量冒充可归因金额 */
      attrOrders = null;
      attrGmv = null;
      attrRefundUsers = d.refundUsers;
      attrRefundAmount = d.refundAmount;
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
    d.label = base.label;
    d.compareLabel = base.compareLabel;
    d.deltas = base.deltas;
    d.empty = d.poolLeads === 0 && (attrScope ? attrTradeEmpty : fullOrders === 0);
    d.caliberNote = attrScope
      ? "当前交易区：可归因交易（渠道/期次筛选生效）"
      : "当前交易区：全量交易（支付事件口径）";
    d.filterScopeHelp = FILTER_SCOPE_HELP;

    validateConsistency(d, filters);
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
    var base = BD().ranges[filters.range] || BD().ranges["7d"];
    var sliced = sumSlices(filters);
    var wecom = sliced.filtered ? sliced.sum.wecomLeads : base.wecomLeads;
    return buildStageRows(wecom || 0, stageSeedKey(filters));
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
    chips.push({ key: "range", label: rangeLabel(f.range), clearable: false });
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

    if (params.has("focus")) {
      params.set("focus", normalizeFocus(params.get("focus")));
    }

    ["range", "channel", "term", "src", "tab", "transaction_type", "transactionType"]
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

    function run(msg) {
      var next = {
        channel: ch ? ch.value : getFilters().channel,
        term: term ? term.value : getFilters().term,
        src: src ? src.value : getFilters().src
      };
      setFilters(next);
      var d = applyRange(getFilters().range);
      wireBoardLinks();
      renderActiveFilters(opts);
      setUpdatedNow();
      if (typeof opts.onApply === "function") opts.onApply(getFilters().range, d, getFilters());
      if (msg) Proto.toast(msg);
    }

    renderActiveFilters._onClear = opts.onApply;
    renderActiveFilters(opts);

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
          /* 仅刷新数据快照，不重置 ProtoBiz 业务状态 */
          refreshSnapshot();
          setUpdatedNow();
          run("数据已更新");
        }, 650);
      };
    }
  }

  function exportCsv(filename, headers, rows) {
    var f = getFilters();
    var snap = getSnapshot();
    var d = aggregateLeadMetrics(f);
    var meta = [
      ["# snapshotAt", snap.snapshotAt || ""],
      ["# range", f.range || ""],
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
    FILTER_SCOPE_HELP: FILTER_SCOPE_HELP,
    RANGES: RANGES,
    FILTER_KEY: FILTER_KEY,
    SNAPSHOT_KEY: SNAPSHOT_KEY,
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
    syncRangeUI: syncRangeUI,
    getTimingBuckets: getTimingBuckets,
    getLeadSlices: function (filters) {
      return sumSlices(filters || getFilters()).list;
    }
  };
})(window);
