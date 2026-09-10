/**
 * 经营分析闭环 — 环比/目标、漏斗维度、经营瓶颈、待办风险（依赖 board-data + board-metrics）
 */
(function (global) {
  var STATE_KEY = "board_analytics_state_v1";

  var FUNNEL_STEPS = [
    {
      id: "pool_wecom",
      label: "私域池 → 加微",
      shortLabel: "加微转化",
      fromKey: "poolLeads",
      toKey: "wecomLeads",
      rateLabel: "加微率",
      dims: ["channel", "term", "staff"]
    },
    {
      id: "wecom_attend",
      label: "加微 → 到场",
      shortLabel: "到场转化",
      fromKey: "wecomLeads",
      toKey: "attendUsers",
      rateLabel: "到场率",
      dims: ["channel", "term", "staff", "live"]
    },
    {
      id: "attend_pay",
      label: "到场 → 支付",
      shortLabel: "支付转化",
      fromKey: "attendUsers",
      toKey: "attributedPayUsers",
      rateLabel: "支付转化率",
      dims: ["channel", "term", "staff", "live"]
    }
  ];

  var DIM_LABELS = {
    channel: "按渠道",
    term: "按期次",
    staff: "按员工",
    live: "按直播场次"
  };

  function BD() { return global.BoardData; }
  function BM() { return global.BoardMetrics; }

  function parsePct(s) {
    if (s == null || s === "" || s === "—") return null;
    var n = parseFloat(String(s).replace("%", "").replace("pt", "").replace("+", ""));
    return isNaN(n) ? null : n;
  }

  function comparePeriodLabel(range) {
    if (range === "custom" || (range && range.range === "custom")) return "与上一等长周期比较";
    var key = typeof range === "object" && range ? range.range : range;
    var m = { today: "较昨日", yesterday: "较前日", "7d": "较上一周期", "30d": "较上一周期" };
    return m[key] || "较上一周期";
  }

  function priorRangeKey(range) {
    if (range === "custom") return null;
    var map = (BD() && BD().priorRangeMap) || {};
    if (range === "today") return "yesterday";
    return map[range] || null;
  }

  function getPriorMetrics(filters) {
    filters = filters || BM().getFilters();
    var pk = priorRangeKey(filters.range);
    if (!pk) return null;
    if (pk === "yesterday" && BD().ranges.yesterday) {
      return BM().aggregateLeadMetrics(Object.assign({}, filters, { range: "yesterday" }));
    }
    if (BD().rangesPrior && BD().rangesPrior[pk]) {
      var base = BD().rangesPrior[pk];
      var d = Object.assign({}, base);
      d.wecomRateNum = base.poolLeads ? Math.round((base.wecomLeads / base.poolLeads) * 1000) / 10 : null;
      d.attendRateNum = base.wecomLeads ? Math.round((base.attendUsers / base.wecomLeads) * 1000) / 10 : null;
      d.payRateNum = base.wecomLeads ? Math.round((base.attributedPayUsers / base.wecomLeads) * 1000) / 10 : null;
      d.refundRateNum = parsePct(base.refundRate);
      return d;
    }
    return null;
  }

  function deltaCount(cur, prev) {
    if (prev == null || cur == null) return { text: "暂无可比数据", trend: "flat", comparable: false };
    if (prev === 0) {
      if (cur === 0) return { text: "持平", trend: "flat", comparable: true };
      return { text: "+100%", trend: "up", comparable: true };
    }
    var pct = Math.round(((cur - prev) / prev) * 1000) / 10;
    if (Math.abs(pct) < 0.05) return { text: "持平", trend: "flat", comparable: true };
    return {
      text: (pct > 0 ? "+" : "") + pct + "%",
      trend: pct > 0 ? "up" : "down",
      comparable: true
    };
  }

  function deltaPoints(cur, prev) {
    if (prev == null || cur == null) return { text: "暂无可比数据", trend: "flat", comparable: false };
    var diff = Math.round((cur - prev) * 10) / 10;
    if (Math.abs(diff) < 0.05) return { text: "持平", trend: "flat", comparable: true };
    return {
      text: (diff > 0 ? "+" : "") + diff + "个百分点",
      trend: diff > 0 ? "up" : "down",
      comparable: true
    };
  }

  function targetProgress(cur, target, higherIsBetter) {
    if (target == null || target === "") return null;
    if (cur == null) return null;
    if (higherIsBetter === false) {
      var gap = Math.round((cur - target) * 10) / 10;
      return {
        label: gap <= 0 ? "低于目标上限" : "高于目标上限",
        detail: gap <= 0
          ? "低于目标上限 " + Math.abs(gap) + "个百分点"
          : "高于目标上限 " + gap + "个百分点",
        rate: null
      };
    }
    var rate = target ? Math.round((cur / target) * 100) : null;
    return {
      label: "目标完成率",
      detail: rate != null ? "目标完成率 " + rate + "%" : "",
      rate: rate
    };
  }

  function sliceRows(filters) {
    var f = filters || BM().getFilters();
    var list = (BD().leadSlices || []).filter(function (r) {
      if (r.range !== f.range) return false;
      if (f.channel && r.channel !== f.channel) return false;
      if (f.term && r.term !== f.term) return false;
      return true;
    });
    return list;
  }

  function metricsFromSlice(r) {
    return {
      poolLeads: r.pool || 0,
      wecomLeads: r.wecom || 0,
      attendUsers: r.attend || 0,
      attributedPayUsers: r.attributedPay || 0
    };
  }

  function aggregateByChannel(filters) {
    var map = {};
    sliceRows(filters).forEach(function (r) {
      var k = r.channel || "other";
      if (!map[k]) map[k] = { id: k, label: r.channelLabel || k, pool: 0, wecom: 0, attend: 0, pay: 0 };
      map[k].pool += r.pool || 0;
      map[k].wecom += r.wecom || 0;
      map[k].attend += r.attend || 0;
      map[k].pay += r.attributedPay || 0;
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function aggregateByTerm(filters) {
    var map = {};
    sliceRows(filters).forEach(function (r) {
      var k = r.term || "mixed";
      if (!map[k]) map[k] = { id: k, label: r.termLabel || k, pool: 0, wecom: 0, attend: 0, pay: 0 };
      map[k].pool += r.pool || 0;
      map[k].wecom += r.wecom || 0;
      map[k].attend += r.attend || 0;
      map[k].pay += r.attributedPay || 0;
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function aggregateByStaff(filters) {
    return (BM().getStaffRows(filters) || []).map(function (s) {
      return {
        id: s.name,
        label: s.name,
        pool: s.assigned || 0,
        wecom: s.wecom || 0,
        attend: Math.round((s.wecom || 0) * 0.47),
        pay: Math.round((s.wecom || 0) * 0.12)
      };
    });
  }

  function aggregateByLive(filters) {
    var f = filters || BM().getFilters();
    return (BM().getLiveRows(f) || []).filter(function (r) {
      return r.status === "ended" || r.status === "upcoming";
    }).map(function (r) {
      var booked = r.booked || 1;
      var attend = r.attend != null ? r.attend : 0;
      return {
        id: r.id,
        label: r.name,
        pool: booked,
        wecom: Math.round(booked * 0.55),
        attend: attend,
        pay: r.payUsers || 0
      };
    });
  }

  function stepValues(row, step) {
    var from = 0, to = 0;
    if (step.id === "pool_wecom") {
      from = row.pool != null ? row.pool : row.poolLeads;
      to = row.wecom != null ? row.wecom : row.wecomLeads;
    } else if (step.id === "wecom_attend") {
      from = row.wecom != null ? row.wecom : row.wecomLeads;
      to = row.attend != null ? row.attend : row.attendUsers;
    } else {
      from = row.attend != null ? row.attend : row.attendUsers;
      to = row.pay != null ? row.pay : row.attributedPayUsers;
    }
    return { from: from || 0, to: to || 0 };
  }

  function getFunnelDimensionBreakdown(filters, stepId, dimension) {
    var step = FUNNEL_STEPS.find(function (s) { return s.id === stepId; });
    if (!step) return { rows: [], overallRate: null };
    var d = BM().aggregateLeadMetrics(filters);
    var overall = stepValues({
      poolLeads: d.poolLeads, wecomLeads: d.wecomLeads,
      attendUsers: d.attendUsers, attributedPayUsers: d.attributedPayUsers
    }, step);
    var overallRate = overall.from ? Math.round((overall.to / overall.from) * 1000) / 10 : null;

    var rows = [];
    if (dimension === "channel") rows = aggregateByChannel(filters);
    else if (dimension === "term") rows = aggregateByTerm(filters);
    else if (dimension === "staff") rows = aggregateByStaff(filters);
    else if (dimension === "live") rows = aggregateByLive(filters);

    var out = rows.map(function (r) {
      var v = stepValues(r, step);
      var rate = v.from ? Math.round((v.to / v.from) * 1000) / 10 : null;
      var diff = (rate != null && overallRate != null) ? Math.round((rate - overallRate) * 10) / 10 : null;
      var impact = diff != null && diff < 0 && v.from
        ? Math.round(v.from * Math.abs(diff) / 100)
        : (diff != null && diff > 0 ? Math.round(v.from * diff / 100) : 0);
      return {
        id: r.id,
        label: r.label,
        from: v.from,
        to: v.to,
        rate: rate,
        diff: diff,
        impact: impact,
        diffText: diff == null ? "—" : (diff > 0 ? "高于整体 " + diff + "个百分点" : diff < 0 ? "低于整体 " + Math.abs(diff) + "个百分点" : "与整体持平")
      };
    }).filter(function (r) { return r.from > 0; });

    out.sort(function (a, b) {
      return Math.abs(b.impact || 0) - Math.abs(a.impact || 0);
    });
    return { step: step, rows: out, overallRate: overallRate, overallFrom: overall.from, overallTo: overall.to };
  }

  function getCoreKpis(filters) {
    filters = filters || BM().getFilters();
    var d = BM().aggregateLeadMetrics(filters);
    var prior = getPriorMetrics(filters);
    var targets = (BD().kpiTargets && BD().kpiTargets[filters.range]) || {};
    var cmpLabel = comparePeriodLabel(filters);
    if (filters.range === "custom") {
      cmpLabel = "与上一等长周期比较";
    }

    var wecomRate = d.poolLeads ? Math.round((d.wecomLeads / d.poolLeads) * 1000) / 10 : null;
    var attendRate = d.wecomLeads ? Math.round((d.attendUsers / d.wecomLeads) * 1000) / 10 : null;
    var payRate = d.wecomLeads ? Math.round((d.attributedPayUsers / d.wecomLeads) * 1000) / 10 : null;
    var refundNum = parsePct(d.fullRefundRate || d.refundRate);

    var priorWecom = prior && prior.poolLeads ? Math.round((prior.wecomLeads / prior.poolLeads) * 1000) / 10 : null;
    var priorAttend = prior && prior.wecomLeads ? Math.round((prior.attendUsers / prior.wecomLeads) * 1000) / 10 : null;
    var priorPayUsers = prior ? prior.attributedPayUsers : null;
    var priorPool = prior ? prior.poolLeads : null;
    var priorGmv = prior ? prior.totalGmv || prior.fullGmv : null;
    var priorRefund = prior ? parsePct(prior.refundRate || prior.fullRefundRate) : null;

    var list = [
      {
        id: "pool",
        label: "私域池人数",
        value: BM().fmt(d.poolLeads),
        raw: d.poolLeads,
        kind: "count",
        compare: deltaCount(d.poolLeads, priorPool),
        compareLabel: cmpLabel,
        target: targets.poolLeads,
        targetInfo: targetProgress(d.poolLeads, targets.poolLeads, true)
      },
      {
        id: "wecom_rate",
        label: "加微率",
        value: wecomRate != null ? wecomRate + "%" : "—",
        sub: "加微 " + BM().fmt(d.wecomLeads) + " 人",
        raw: wecomRate,
        kind: "rate",
        compare: deltaPoints(wecomRate, priorWecom),
        compareLabel: cmpLabel,
        target: targets.wecomRate,
        targetInfo: wecomRate != null && targets.wecomRate != null ? {
          label: wecomRate >= targets.wecomRate ? "达到目标" : "低于目标",
          detail: wecomRate >= targets.wecomRate
            ? "高于目标 " + Math.round((wecomRate - targets.wecomRate) * 10) / 10 + "个百分点"
            : "低于目标 " + Math.round((targets.wecomRate - wecomRate) * 10) / 10 + "个百分点",
          rate: Math.round((wecomRate / targets.wecomRate) * 100)
        } : null
      },
      {
        id: "attend",
        label: "到场率",
        value: attendRate != null ? attendRate + "%" : "—",
        sub: "到场 " + BM().fmt(d.attendUsers) + " 人",
        raw: attendRate,
        kind: "rate",
        compare: deltaPoints(attendRate, priorAttend),
        compareLabel: cmpLabel,
        target: targets.attendRate,
        targetInfo: attendRate != null && targets.attendRate != null ? {
          label: attendRate >= targets.attendRate ? "达到目标" : "低于目标",
          detail: attendRate >= targets.attendRate
            ? "高于目标 " + Math.round((attendRate - targets.attendRate) * 10) / 10 + "个百分点"
            : "低于目标 " + Math.round((targets.attendRate - attendRate) * 10) / 10 + "个百分点",
          rate: Math.round((attendRate / targets.attendRate) * 100)
        } : null
      },
      {
        id: "pay",
        label: "可归因支付",
        value: BM().fmt(d.attributedPayUsers),
        sub: payRate != null ? "支付率 " + payRate + "%" : "",
        raw: d.attributedPayUsers,
        kind: "count",
        compare: deltaCount(d.attributedPayUsers, priorPayUsers),
        compareLabel: cmpLabel,
        target: targets.payUsers,
        targetInfo: targetProgress(d.attributedPayUsers, targets.payUsers, true)
      },
      {
        id: "gmv",
        label: "全量成交 GMV",
        value: BM().money(d.fullGmv),
        sub: BM().fmt(d.fullOrders) + " 笔订单",
        raw: d.fullGmv,
        kind: "money",
        compare: deltaCount(d.fullGmv, priorGmv),
        compareLabel: cmpLabel,
        target: targets.fullGmv,
        targetInfo: targetProgress(d.fullGmv, targets.fullGmv, true)
      },
      {
        id: "refund",
        label: "退款率",
        value: refundNum != null ? refundNum + "%" : "—",
        sub: "全量口径 · 旁路指标",
        raw: refundNum,
        kind: "rate",
        compare: deltaPoints(refundNum, priorRefund),
        compareLabel: cmpLabel,
        target: targets.refundRateMax,
        targetInfo: refundNum != null && targets.refundRateMax != null ? {
          label: refundNum <= targets.refundRateMax ? "在目标内" : "超出目标",
          detail: refundNum <= targets.refundRateMax
            ? "低于目标上限 " + Math.round((targets.refundRateMax - refundNum) * 10) / 10 + "个百分点"
            : "高于目标上限 " + Math.round((refundNum - targets.refundRateMax) * 10) / 10 + "个百分点",
          rate: null
        } : null
      }
    ];
    if (filters.range === "custom") {
      return list.map(function (k) {
        k.compareLabel = "与上一等长周期比较";
        if (!k.compare || !k.compare.comparable) {
          k.compare = { text: "与上一等长周期比较（演示映射）", trend: "flat", comparable: false };
        }
        return k;
      });
    }
    return list;
  }

  function getBottlenecks(filters) {
    filters = filters || BM().getFilters();
    var d = BM().aggregateLeadMetrics(filters);
    var prior = getPriorMetrics(filters);
    var targets = (BD().kpiTargets && BD().kpiTargets[filters.range]) || {};
    var items = [];
    var channels = aggregateByChannel(filters);
    var terms = aggregateByTerm(filters);
    var liveRows = getLiveRecapRows(filters).filter(function (r) { return !r.upcoming && r.attendRateNum != null; });

    function reasonBits() {
      var bits = [];
      if (d.noFollow >= 10) bits.push("未跟进用户较多（" + d.noFollow + " 人）");
      var noSop = liveRows.filter(function (r) { return !r.sopDone; }).length;
      if (noSop) bits.push(noSop + " 场未执行直播促到SOP");
      if (d.backlogLate >= 5) bits.push("分配超时 " + d.backlogLate + " 人");
      return bits.length ? bits.join("、") : "建议结合渠道与场次下钻核对";
    }

    var wecomRate = d.poolLeads ? (d.wecomLeads / d.poolLeads) * 100 : null;
    if (wecomRate != null && targets.wecomRate && wecomRate < targets.wecomRate - 1.5) {
      var wGap = Math.round((wecomRate - targets.wecomRate) * 10) / 10;
      var wImpact = Math.round(d.poolLeads * (targets.wecomRate - wecomRate) / 100);
      var weakCh = channels.filter(function (c) {
        return c.pool > 0 && rateNum(c.wecom, c.pool) != null;
      }).map(function (c) {
        return Object.assign({}, c, { _wecomRate: rateNum(c.wecom, c.pool) });
      });
      weakCh = sortBy(weakCh, "_wecomRate", "asc").slice(0, 2);
      items.push({
        id: "wecom_below_target",
        score: (targets.wecomRate - wecomRate) * 4 + wImpact * 0.12,
        title: "加微率低于目标",
        current: Math.round(wecomRate * 10) / 10 + "%",
        target: targets.wecomRate + "%",
        gap: wGap + "个百分点",
        impact: "预计影响约 " + wImpact + " 名用户",
        sources: (weakCh.length ? weakCh : channels.slice(0, 2)).map(function (c) { return c.label; }).join("、") || "—",
        reason: reasonBits(),
        action: {
          label: "查看加微分析",
          type: "analysis",
          funnelStep: "pool_wecom",
          dimension: "channel"
        }
      });
    }

    var attendRate = d.wecomLeads ? (d.attendUsers / d.wecomLeads) * 100 : null;
    var priorAttend = prior && prior.wecomLeads ? (prior.attendUsers / prior.wecomLeads) * 100 : null;
    if (attendRate != null && targets.attendRate && attendRate < targets.attendRate - 1.5) {
      var aGap = Math.round((attendRate - targets.attendRate) * 10) / 10;
      var aImpact = Math.round(d.wecomLeads * (targets.attendRate - attendRate) / 100);
      var topSrc = [];
      sortBy(channels, "attend", "desc").slice(0, 2).forEach(function (c) { topSrc.push(c.label); });
      sortBy(terms, "attend", "desc").slice(0, 1).forEach(function (t) { topSrc.push(t.label); });
      items.push({
        id: "attend_below_target",
        score: (targets.attendRate - attendRate) * 5 + aImpact * 0.15,
        title: "到场率低于目标",
        current: Math.round(attendRate * 10) / 10 + "%",
        target: targets.attendRate + "%",
        gap: aGap + "个百分点",
        impact: "预计影响约 " + aImpact + " 名用户",
        sources: topSrc.filter(Boolean).slice(0, 3).join("、") || "—",
        reason: reasonBits(),
        action: {
          label: "查看到场分析",
          type: "analysis",
          funnelStep: "wecom_attend",
          dimension: "channel"
        }
      });
    } else if (attendRate != null && priorAttend != null && priorAttend - attendRate >= 3) {
      var drop = Math.round((priorAttend - attendRate) * 10) / 10;
      var lowLive = sortBy(liveRows, "attendDiff", "asc")[0];
      items.push({
        id: "attend_drop",
        score: drop * 4.5 + (lowLive ? 8 : 0),
        title: "到场率较上一周期下降",
        current: Math.round(attendRate * 10) / 10 + "%",
        target: comparePeriodLabel(filters) + " " + Math.round(priorAttend * 10) / 10 + "%",
        gap: "下降 " + drop + "个百分点",
        impact: lowLive ? ("关联场次 " + lowLive.id + "「" + lowLive.name + "」") : "影响多个场次",
        sources: lowLive ? lowLive.id : "—",
        reason: reasonBits(),
        action: {
          label: "查看到场分析",
          type: "analysis",
          funnelStep: "wecom_attend",
          dimension: "live",
          selectedLive: lowLive && lowLive.id
        }
      });
    }

    var payRate = d.attendUsers ? (d.attributedPayUsers / d.attendUsers) * 100 : null;
    if (payRate != null && targets.payRate && payRate < targets.payRate - 2) {
      var pGap = Math.round((payRate - targets.payRate) * 10) / 10;
      var pImpact = Math.round(d.attendUsers * (targets.payRate - payRate) / 100);
      items.push({
        id: "pay_below_target",
        score: (targets.payRate - payRate) * 4 + pImpact * 0.2,
        title: "到场后支付率低于目标",
        current: Math.round(payRate * 10) / 10 + "%",
        target: targets.payRate + "%",
        gap: pGap + "个百分点",
        impact: "预计影响约 " + pImpact + " 名支付用户",
        sources: sortBy(channels, "pay", "desc").slice(0, 2).map(function (c) { return c.label; }).join("、") || "—",
        reason: "到场未支付约 " + Math.max(0, d.attendUsers - d.payWithAttend) + " 人，建议检查促单跟进",
        action: {
          label: "查看支付分析",
          type: "analysis",
          funnelStep: "attend_pay",
          dimension: "channel"
        }
      });
    }

    var overallPay = rateNum(d.attributedPayUsers, d.wecomLeads);
    var cqRows = getChannelQuality(filters).rows || [];
    var weakPayCh = cqRows
      .filter(function (c) { return c.payDiff != null && c.payDiff <= -3 && c.wecom >= 20; });
    weakPayCh = sortBy(weakPayCh, "payDiff", "asc");
    if (weakPayCh[0] && !filters.channel) {
      var wc = weakPayCh[0];
      items.push({
        id: "channel_pay_gap_" + wc.id,
        score: Math.abs(wc.payDiff) * 3 + wc.wecom * 0.05,
        title: wc.label + "支付率明显低于整体",
        current: (wc.payRate != null ? wc.payRate + "%" : "—"),
        target: "整体 " + overallPay + "%",
        gap: wc.payDiff + "个百分点",
        impact: "覆盖加微 " + wc.wecom + " 人",
        sources: wc.label,
        reason: "主要流失关联：" + (wc.dropLabel || "加微→到场或到场→支付"),
        action: {
          label: "查看渠道分析",
          type: "analysis",
          funnelStep: "attend_pay",
          dimension: "channel",
          selectedChannel: wc.id
        }
      });
    }

    var lowLive = sortBy(liveRows.filter(function (r) { return r.attendDiff != null && r.attendDiff <= -8; }), "attendDiff", "asc")[0];
    if (lowLive) {
      items.push({
        id: "live_attend_low_" + lowLive.id,
        score: Math.abs(lowLive.attendDiff) * 3.5,
        title: "场次到场率持续偏低",
        current: (lowLive.attendRateNum != null ? lowLive.attendRateNum + "%" : "—"),
        target: "场均水平",
        gap: (lowLive.attendDiff > 0 ? "+" : "") + lowLive.attendDiff + "个百分点",
        impact: lowLive.id + "「" + lowLive.name + "」",
        sources: lowLive.id,
        reason: lowLive.sopDone
          ? "同时到场率低于平均，建议检查邀约与目标人群"
          : (lowLive.id + "未执行直播促到SOP，同时到场率低于平均，建议检查邀约及促到执行情况"),
        action: {
          label: "查看场次复盘",
          type: "drill",
          href: "board-live.html",
          liveId: lowLive.id,
          liveTab: "ended"
        }
      });
    }

    items.sort(function (a, b) { return b.score - a.score; });
    return items.slice(0, 3);
  }

  function getTodoRisks(filters) {
    filters = filters || BM().getFilters();
    var d = BM().aggregateLeadMetrics(filters);
    var smsPending = (global.ProtoBiz && ProtoBiz.smsFailedPending) ? ProtoBiz.smsFailedPending() : d.videoSmsFailed;
    var upcoming = (BM().getLiveRows(filters) || []).filter(function (l) {
      return l.status === "upcoming" && (!l.inviteSent || (l.remindStatus || "").indexOf("待") >= 0);
    });
    var risks = [];
    var urgencyRank = { high: 0, medium: 1, low: 2 };

    if (d.backlog > 0) {
      var lateNote = d.backlogLate > 0
        ? ("其中超时 " + d.backlogLate + " 人，最长超时约 " + Math.max(4, Math.round(4 + d.backlogLate * 0.6)) + " 小时")
        : "暂无超时，建议尽快完成分配";
      risks.push({
        urgency: d.backlogLate >= 5 ? "high" : (d.backlogLate > 0 ? "medium" : "low"),
        urgencyLabel: d.backlogLate >= 5 ? "紧急" : (d.backlogLate > 0 ? "关注" : "一般"),
        type: "待分配用户",
        count: d.backlog,
        priorityCount: d.backlogLate || 0,
        note: lateNote,
        owner: "SCRM 分配",
        action: { label: "去分配", href: "leads.html", focus: "unassigned" }
      });
    }
    if (d.noFollow > 0) {
      risks.push({
        urgency: d.noFollow >= 40 ? "high" : (d.noFollow >= 15 ? "medium" : "low"),
        urgencyLabel: d.noFollow >= 40 ? "紧急" : (d.noFollow >= 15 ? "关注" : "一般"),
        type: "长期未跟进",
        count: d.noFollow,
        priorityCount: Math.round(d.noFollow * 0.35),
        note: "已加微无跟进记录 · 高优先约 " + Math.round(d.noFollow * 0.35) + " 人",
        owner: "私域跟进",
        action: { label: "去跟进", href: "follow-ups.html", focus: "no_follow" }
      });
    }
    if (smsPending > 0) {
      risks.push({
        urgency: "high",
        urgencyLabel: "紧急",
        type: "推送失败待重试",
        count: smsPending,
        priorityCount: smsPending,
        note: "领课/邀约短信发送失败",
        owner: "触达通道",
        action: { label: "去重试", href: "orders.html", focus: "sms_failed" }
      });
    }
    if (upcoming.length) {
      risks.push({
        urgency: "high",
        urgencyLabel: "紧急",
        type: "开播前未完成直播促到SOP",
        count: upcoming.length,
        priorityCount: upcoming.filter(function (l) { return !l.inviteSent; }).length,
        note: upcoming[0].name + (upcoming.length > 1 ? (" 等 " + upcoming.length + " 场") : ""),
        owner: "直播运营",
        action: { label: "去发送", href: "live-invite.html", liveId: upcoming[0].id }
      });
    }
    var attendNoPay = Math.max(0, d.attendUsers - d.payWithAttend);
    if (attendNoPay >= 3) {
      risks.push({
        urgency: attendNoPay >= 40 ? "medium" : "low",
        urgencyLabel: attendNoPay >= 40 ? "关注" : "一般",
        type: "到场未支付待跟进",
        count: attendNoPay,
        priorityCount: Math.round(attendNoPay * 0.4),
        note: "可继续促单跟进",
        owner: "转化跟进",
        action: { label: "去跟进", href: "follow-ups.html", focus: "attend_no_pay" }
      });
    }
    risks.sort(function (a, b) {
      return (urgencyRank[a.urgency] - urgencyRank[b.urgency]) || (b.count - a.count);
    });
    return risks.slice(0, 5);
  }

  function getAnalyticsState() {
    var base = {
      funnelStep: "pool_wecom",
      funnelDim: "channel",
      crossFilter: null,
      scrollAnchor: "",
      bottleneckId: "",
      selectedChannel: "",
      selectedTerm: "",
      selectedOwner: "",
      selectedLive: "",
      selectedProduct: "",
      liveTab: "ended",
      liveSort: "recent",
      dimension: "",
      section: ""
    };
    try {
      var raw = sessionStorage.getItem(STATE_KEY);
      if (raw) Object.assign(base, JSON.parse(raw));
    } catch (e) {}
    return base;
  }

  function writeAnalyticsUrl(st, mode, changedKeys) {
    try {
      var params = new URLSearchParams(location.search);
      function setOrDel(k, v) {
        if (v != null && v !== "") params.set(k, String(v));
        else params.delete(k);
      }
      var keyMap = {
        funnelStep: "funnel_step",
        funnelDim: "funnel_dim",
        liveId: "selected_live",
        selectedLive: "selected_live",
        channelSort: "sort",
        staffSort: "sort",
        dimension: "dimension",
        section: "section",
        crossFilter: "cross_filter",
        bottleneckId: "bottleneck_id",
        selectedChannel: "selected_channel",
        selectedTerm: "selected_term",
        selectedOwner: "selected_owner",
        selectedProduct: "selected_product",
        liveTab: "live_tab",
        liveSort: "live_sort"
      };
      var allow = null;
      if (changedKeys && changedKeys.length) {
        allow = {};
        changedKeys.forEach(function (k) {
          if (keyMap[k]) allow[keyMap[k]] = true;
          /* liveId and selectedLive share selected_live */
          if (k === "liveId") allow.selected_live = true;
        });
      }
      function shouldWrite(urlKey) {
        return !allow || allow[urlKey];
      }
      if (shouldWrite("funnel_step")) setOrDel("funnel_step", st.funnelStep);
      if (shouldWrite("funnel_dim")) setOrDel("funnel_dim", st.funnelDim);
      if (shouldWrite("selected_live")) setOrDel("selected_live", st.selectedLive || st.liveId || "");
      /* keep legacy live_id in sync for drill pages */
      if (shouldWrite("selected_live")) {
        var lid = st.selectedLive || st.liveId || "";
        if (lid) params.set("live_id", lid);
        else params.delete("live_id");
      }
      if (shouldWrite("sort")) setOrDel("sort", st.channelSort || st.staffSort || "");
      if (shouldWrite("dimension")) setOrDel("dimension", st.dimension);
      if (shouldWrite("section")) setOrDel("section", st.section);
      if (shouldWrite("bottleneck_id")) setOrDel("bottleneck_id", st.bottleneckId);
      if (shouldWrite("selected_channel")) setOrDel("selected_channel", st.selectedChannel);
      if (shouldWrite("selected_term")) setOrDel("selected_term", st.selectedTerm);
      if (shouldWrite("selected_owner")) setOrDel("selected_owner", st.selectedOwner);
      if (shouldWrite("selected_product")) setOrDel("selected_product", st.selectedProduct);
      if (shouldWrite("live_tab")) setOrDel("live_tab", st.liveTab);
      if (shouldWrite("live_sort")) setOrDel("live_sort", st.liveSort);
      if (shouldWrite("cross_filter")) {
        if (st.crossFilter && typeof st.crossFilter === "object") {
          try { params.set("cross_filter", JSON.stringify(st.crossFilter)); } catch (e) { params.delete("cross_filter"); }
        } else {
          params.delete("cross_filter");
        }
      }
      var qs = params.toString();
      var next = location.pathname + (qs ? "?" + qs : "") + location.hash;
      var cur = location.pathname + location.search + location.hash;
      if (next === cur) return;
      if (mode === "push") history.pushState({ boardAnalytics: true }, "", next);
      else history.replaceState({ boardAnalytics: true }, "", next);
    } catch (e) {}
  }

  function setAnalyticsState(partial, opts) {
    opts = opts || {};
    var cur = getAnalyticsState();
    Object.assign(cur, partial || {});
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(cur));
    } catch (e) {}
    if (opts.syncUrl) {
      writeAnalyticsUrl(cur, opts.push ? "push" : "replace", Object.keys(partial || {}));
    }
    return cur;
  }

  function currentBoardPath() {
    try {
      var p = (location.pathname || "").split("/").pop() || "";
      return /board-/.test(p) ? p : "board-overview.html";
    } catch (e) {
      return "board-overview.html";
    }
  }

  function saveReturnState() {
    var f = BM().getFilters();
    var st = getAnalyticsState();
    try {
      sessionStorage.setItem(STATE_KEY + "_return", JSON.stringify({
        filters: f,
        analytics: st,
        path: currentBoardPath(),
        savedAt: Date.now()
      }));
    } catch (e) {}
  }

  function describeAnalyticsContext(q) {
    q = q || new URLSearchParams(location.search);
    var from = q.get("from_board") || q.get("from");
    var parts = [];
    if (from === "term_review" || from === "term-review") {
      parts.push("期次经营看板");
      if (q.get("term")) {
        var tCat = ((BD().termCatalog) || []).find(function (o) { return o.id === q.get("term"); });
        var tOpt = (BD().termOptions || []).find(function (o) { return o.value === q.get("term"); });
        parts.push((tCat && tCat.name) || (tOpt && tOpt.label) || q.get("term"));
      }
      var focusMap = {
        unassigned: "待分配",
        no_follow: "未跟进",
        attend_no_pay: "到场未支付",
        no_show: "未到场",
        high_intent: "高意向未支付",
        sms_failed: "推送失败",
        nopay: "到场未支付"
      };
      if (q.get("focus") && focusMap[q.get("focus")]) parts.push(focusMap[q.get("focus")]);
      else if (q.get("focus")) parts.push(q.get("focus"));
      return parts.join(" / ");
    }
    parts.push("经营分析");
    if (from === "overview" || /board-overview/.test(location.pathname)) parts.push("总览");
    if (from === "acquire") parts.push("获客分析");
    if (from === "private") parts.push("私域转化");
    if (from === "live") parts.push("直播分析");
    if (from === "convert") parts.push("交易分析");
    var step = q.get("funnel_step");
    if (step) {
      var s = FUNNEL_STEPS.find(function (x) { return x.id === step; });
      if (s) parts.push(s.label);
    }
    var dim = q.get("funnel_dim");
    if (dim && DIM_LABELS[dim]) parts.push(DIM_LABELS[dim]);
    if (q.get("channel")) {
      var ch = (BD().channelOptions || []).find(function (o) { return o.value === q.get("channel"); });
      parts.push(ch ? ch.label : q.get("channel"));
    }
    if (q.get("term")) {
      var tm = (BD().termOptions || []).find(function (o) { return o.value === q.get("term"); });
      parts.push(tm ? tm.label : q.get("term"));
    }
    if (q.get("owner")) parts.push(q.get("owner"));
    if (q.get("focus")) parts.push(q.get("focus"));
    return parts.join(" / ");
  }

  function boardPathFromFrom(from) {
    var map = {
      acquire: "board-acquire.html",
      private: "board-private.html",
      live: "board-live.html",
      convert: "board-convert.html",
      overview: "board-overview.html",
      term_review: "board-term-review.html",
      "term-review": "board-term-review.html"
    };
    return map[from] || "";
  }

  function buildReturnBoardUrl(fallback) {
    try {
      var q = new URLSearchParams(location.search);
      var fromPath = boardPathFromFrom(q.get("from_board") || q.get("from") || "");
      var raw = sessionStorage.getItem(STATE_KEY + "_return");
      if (!raw) {
        if (fromPath) {
          var p = new URLSearchParams();
          if (q.get("range")) p.set("range", q.get("range"));
          if (q.get("channel")) p.set("channel", q.get("channel"));
          if (q.get("term")) p.set("term", q.get("term"));
          var qs0 = p.toString();
          return fromPath + (qs0 ? "?" + qs0 : "");
        }
        return fallback || "board-overview.html";
      }
      var saved = JSON.parse(raw);
      var path = saved.path || fromPath || fallback || "board-overview.html";
      if (!saved.filters) return path;
      BM().setFilters(saved.filters);
      if (saved.analytics) setAnalyticsState(saved.analytics);
      var params = new URLSearchParams();
      var f = saved.filters;
      if (f.range) params.set("range", f.range);
      if (f.range === "custom" && f.start_date) params.set("start_date", f.start_date);
      if (f.range === "custom" && f.end_date) params.set("end_date", f.end_date);
      if (f.channel) params.set("channel", f.channel);
      if (f.term) params.set("term", f.term);
      if (f.tab) params.set("tab", f.tab);
      if (saved.analytics && saved.analytics.funnelStep) params.set("funnel_step", saved.analytics.funnelStep);
      if (saved.analytics && saved.analytics.funnelDim) params.set("funnel_dim", saved.analytics.funnelDim);
      if (saved.analytics && saved.analytics.staffSort) params.set("staff_sort", saved.analytics.staffSort);
      if (saved.analytics && saved.analytics.channelSort) params.set("channel_sort", saved.analytics.channelSort);
      if (saved.analytics && saved.analytics.liveId) params.set("live_id", saved.analytics.liveId);
      if (saved.analytics && saved.analytics.scrollAnchor) params.set("anchor", saved.analytics.scrollAnchor);
      var qs = params.toString();
      return path + (qs ? "?" + qs : "");
    } catch (e) {
      return fallback || "board-overview.html";
    }
  }

  function buildReturnOverviewUrl() {
    return buildReturnBoardUrl("board-overview.html");
  }

  function drillExtraForAnalysis(stepId, dimension, rowId) {
    var extra = {
      from_board: currentBoardPath().replace(".html", "").replace("board-", ""),
      funnel_step: stepId,
      funnel_dim: dimension
    };
    if (dimension === "channel" && rowId) extra.channel = rowId;
    if (dimension === "term" && rowId) extra.term = rowId;
    if (dimension === "staff" && rowId) extra.owner = rowId;
    if (dimension === "live" && rowId) extra.live_id = rowId;
    return extra;
  }

  function rateNum(a, b) {
    if (b == null || !b) return null;
    if (a == null) return null;
    return Math.round((a / b) * 1000) / 10;
  }

  function sortBy(rows, key, dir) {
    dir = dir === "asc" ? 1 : -1;
    return (rows || []).slice().sort(function (a, b) {
      var av = a[key];
      var bv = b[key];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av === bv) return 0;
      return av > bv ? dir : -dir;
    });
  }

  function dropStep(row) {
    var steps = [
      { id: "pool_wecom", label: "入池→加微", from: row.pool, to: row.wecom },
      { id: "wecom_attend", label: "加微→到场", from: row.wecom, to: row.attend },
      { id: "attend_pay", label: "到场→支付", from: row.attend, to: row.pay }
    ];
    var worst = steps[0];
    var worstRate = 101;
    steps.forEach(function (s) {
      var r = rateNum(s.to, s.from);
      if (r != null && r < worstRate) {
        worstRate = r;
        worst = s;
      }
    });
    return worst;
  }

  function getChannelQuality(filters) {
    filters = filters || BM().getFilters();
    var d = BM().aggregateLeadMetrics(filters);
    var overallWecom = rateNum(d.wecomLeads, d.poolLeads);
    var overallAttend = rateNum(d.attendUsers, d.wecomLeads);
    var overallPay = rateNum(d.attributedPayUsers, d.wecomLeads);
    var prior = getPriorMetrics(filters);
    var priorMap = {};
    if (prior && filters.range === "today") {
      aggregateByChannel(Object.assign({}, filters, { range: "yesterday" })).forEach(function (r) {
        priorMap[r.id] = r;
      });
    }
    var rows = aggregateByChannel(filters).map(function (r) {
      var wecomRate = rateNum(r.wecom, r.pool);
      var attendRate = rateNum(r.attend, r.wecom);
      var payRate = rateNum(r.pay, r.wecom);
      var valid = Math.round((r.pool || 0) / 0.75);
      var gmv = 0;
      sliceRows(filters).forEach(function (s) {
        if (s.channel === r.id && s.attributedGmv != null) gmv += s.attributedGmv;
      });
      var prev = priorMap[r.id];
      var trend = prev ? (rateNum(r.pay, r.wecom) != null && rateNum(prev.pay, prev.wecom) != null
        ? Math.round((rateNum(r.pay, r.wecom) - rateNum(prev.pay, prev.wecom)) * 10) / 10
        : null) : null;
      var drop = dropStep(r);
      return {
        id: r.id,
        label: r.label,
        pool: r.pool,
        valid: valid,
        validRate: rateNum(r.pool, valid),
        wecom: r.wecom,
        wecomRate: wecomRate,
        attend: r.attend,
        attendRate: attendRate,
        pay: r.pay,
        payRate: payRate,
        gmv: gmv || null,
        wecomDiff: wecomRate != null && overallWecom != null ? Math.round((wecomRate - overallWecom) * 10) / 10 : null,
        attendDiff: attendRate != null && overallAttend != null ? Math.round((attendRate - overallAttend) * 10) / 10 : null,
        payDiff: payRate != null && overallPay != null ? Math.round((payRate - overallPay) * 10) / 10 : null,
        trendPay: trend,
        dropLabel: drop.label,
        dropId: drop.id
      };
    });
    return { rows: rows, overallWecom: overallWecom, overallAttend: overallAttend, overallPay: overallPay };
  }

  function getChannelTermBreakdown(filters, channel) {
    var f = Object.assign({}, filters || BM().getFilters(), { channel: channel || (filters && filters.channel) || "" });
    return sliceRows(f).map(function (s) {
      return {
        id: s.term || "mixed",
        label: s.termLabel || "多期次",
        channel: s.channel,
        channelLabel: s.channelLabel,
        pool: s.pool || 0,
        wecom: s.wecom || 0,
        attend: s.attend || 0,
        pay: s.attributedPay || 0,
        gmv: s.attributedGmv,
        wecomRate: rateNum(s.wecom, s.pool),
        attendRate: rateNum(s.attend, s.wecom),
        payRate: rateNum(s.attributedPay, s.wecom)
      };
    });
  }

  function getChannelConclusions(filters) {
    var q = getChannelQuality(filters);
    var lines = [];
    if (!q.rows.length) return [{ text: "当前筛选下暂无渠道质量数据。" }];
    var multi = q.rows.length > 1;
    var byPool = sortBy(q.rows, "pool", "desc");
    var byPay = sortBy(q.rows.filter(function (r) { return r.payRate != null; }), "payRate", "desc");
    var byDrop = sortBy(q.rows.filter(function (r) { return r.trendPay != null; }), "trendPay", "asc");
    if (byPool[0]) {
      if (multi) {
        lines.push({
          text: byPool[0].label + "贡献用户最多（" + byPool[0].pool + " 人入池）。",
          action: { type: "select_channel", id: byPool[0].id, label: "查看" + byPool[0].label + "质量" }
        });
      } else {
        var only = byPool[0];
        var vs = only.payDiff == null ? "" : (only.payDiff < 0
          ? "，低于全部渠道整体 " + Math.abs(only.payDiff) + " 个百分点"
          : (only.payDiff > 0 ? "，高于全部渠道整体 " + only.payDiff + " 个百分点" : "，与整体持平"));
        lines.push({
          text: only.label + "支付率 " + (only.payRate != null ? only.payRate + "%" : "—") + vs + "。",
          action: { type: "select_channel", id: only.id, label: "查看" + only.label + "质量" }
        });
      }
    }
    if (multi && byPay[0]) {
      var d = byPay[0].payDiff;
      var extra = "";
      if (d != null) {
        extra = d < 0
          ? "但支付率低于整体 " + Math.abs(d) + " 个百分点。"
          : (d > 0 ? "支付率高于整体 " + d + " 个百分点。" : "");
      }
      lines.push({
        text: byPay[0].label + "支付率居前（" + byPay[0].payRate + "%）。" + extra,
        action: { type: "select_channel", id: byPay[0].id, label: "查看" + byPay[0].label + "质量" }
      });
    }
    if (multi && byDrop[0] && byDrop[0].trendPay < 0) {
      lines.push({
        text: byDrop[0].label + "较上一周期支付率下降较明显（" + byDrop[0].trendPay + " 个百分点）。",
        action: { type: "select_channel", id: byDrop[0].id, label: "查看" + byDrop[0].label + "质量" }
      });
    }
    var low = sortBy(q.rows.filter(function (r) { return r.payDiff != null; }), "payDiff", "asc")[0];
    if (low && low.payDiff < 0) {
      lines.push({
        text: low.label + "主要流失在" + low.dropLabel + "。",
        action: {
          type: "select_channel_drop",
          id: low.id,
          dropId: low.dropId || "wecom_attend",
          label: "查看流失环节"
        }
      });
    }
    return lines.slice(0, 3);
  }

  function getStaffExecution(filters) {
    filters = filters || BM().getFilters();
    var staff = BM().getStaffRows(filters);
    var timely = 0;
    (BM().getTimingBuckets(filters.range) || []).forEach(function (b, i) { if (i < 2) timely += b.pct; });
    var avgAssigned = 0, avgWecomRate = 0, avgCover = 0, n = 0;
    staff.forEach(function (s) {
      if (s.isOther) return;
      n += 1;
      avgAssigned += s.assigned || 0;
    });
    avgAssigned = n ? Math.round(avgAssigned / n) : 0;
    var rows = staff.map(function (s, idx) {
      var wecomRate = rateNum(s.wecom, s.assigned);
      var coverNum = parsePct(s.cover);
      var late = Math.round((s.assigned || 0) * (100 - timely) / 100);
      if (s.isOther) late = Math.max(0, late - 1);
      var pay = Math.round((s.wecom || 0) * 0.32);
      var hash = ((s.name || "").length + idx * 7) % 9;
      var timelyOwn = Math.max(62, Math.min(96, timely + (hash - 4)));
      return {
        id: s.name,
        label: s.name,
        isOther: !!s.isOther,
        assigned: s.assigned || 0,
        timelyRate: timelyOwn,
        wecom: s.wecom || 0,
        wecomRate: wecomRate,
        cover: coverNum,
        late: late,
        noFollow: s.noFollow || 0,
        pay: pay,
        volumeHigh: !s.isOther && (s.assigned || 0) >= avgAssigned,
        efficiencyLow: !s.isOther && (
          (wecomRate != null && wecomRate < 58) ||
          (coverNum != null && coverNum < 68) ||
          ((s.assigned || 0) > 0 && late / s.assigned >= 0.18 && late >= 12)
        )
      };
    });
    var team = {
      timely: timely,
      assignedAvg: avgAssigned,
      wecomRateAvg: rateNum(
        rows.reduce(function (a, r) { return a + r.wecom; }, 0),
        rows.reduce(function (a, r) { return a + r.assigned; }, 0)
      ),
      coverAvg: (function () {
        var c = 0, k = 0;
        rows.forEach(function (r) { if (r.cover != null) { c += r.cover; k += 1; } });
        return k ? Math.round(c / k * 10) / 10 : null;
      })()
    };
    return { rows: rows, team: team };
  }

  function getStageOps(filters) {
    filters = filters || BM().getFilters();
    var stages = BM().getStageDistribution(filters);
    var seeds = (BD().stageOps || {});
    var d = BM().aggregateLeadMetrics(filters);
    return stages.map(function (s) {
      var meta = seeds[s.stage] || seeds[s.label] || { dwellHours: 24, timeout: 6, retrigger: 4, highIntent: false };
      return {
        stage: s.stage || s.label,
        count: s.count,
        pct: s.pct,
        dwellHours: meta.dwellHours,
        timeout: Math.min(s.count, meta.timeout),
        retrigger: Math.min(s.count, meta.retrigger),
        highIntent: !!meta.highIntent,
        noFollowShare: s.stage && s.stage.indexOf("新加微") >= 0 ? d.noFollow : 0
      };
    });
  }

  function getPrivateConclusions(filters) {
    var se = getStaffExecution(filters);
    var stages = getStageOps(filters);
    var lines = [];
    var staff = se.rows.filter(function (r) { return !r.isOther; });
    var multi = staff.length > 1;
    var top = sortBy(staff, "assigned", "desc")[0];
    if (top && multi) {
      lines.push({
        text: top.label + "承接量较高（" + top.assigned + " 人）" +
          (top.efficiencyLow ? "，分配及时率低于团队平均。" : "。"),
        action: { type: "select_owner", id: top.id, label: "查看员工分析" }
      });
    }
    var risk = staff.filter(function (r) { return r.efficiencyLow; })[0];
    if (risk) {
      lines.push({
        text: risk.label + "需主管关注：未跟进 " + risk.noFollow + "、超时 " + risk.late + "。",
        action: { type: "select_owner", id: risk.id, label: "查看员工分析" }
      });
    }
    var stage = sortBy(stages, "timeout", "desc")[0];
    if (stage && stage.timeout > 0) {
      lines.push({
        text: "用户主要停留在「" + stage.stage + "」，超时未流转 " + stage.timeout + " 人。",
        action: { type: "select_stage", id: stage.stage, label: "查看阶段运营" }
      });
    }
    if (!lines.length) lines.push({ text: "当前筛选下团队执行与阶段运营暂无明显异常。" });
    return lines.slice(0, 3);
  }

  function enrichLiveRow(r, avgAttend, avgPay) {
    var target = r.inviteTarget || r.booked || 0;
    var invite = r.inviteReached || 0;
    var pushOk = r.remindReached || 0;
    var attend = r.attend;
    var watch = attend == null ? null : Math.round(attend * 0.72);
    var pay = r.payUsers || 0;
    var attendRate = parsePct(r.attendRate);
    var payRate = attend ? rateNum(pay, attend) : (target ? rateNum(pay, target) : null);
    var pushRate = target ? rateNum(pushOk, target) : null;
    var upcoming = r.status === "upcoming";
    var sopDone = !!r.inviteSent;
    var sopMissing = [];
    if (upcoming) {
      if (!target) sopMissing.push("目标人群未配置");
      if (!invite && !sopDone) sopMissing.push("直播促到SOP未创建");
      if ((r.remindStatus || "").indexOf("待") >= 0) sopMissing.push("推送未执行");
    } else if (!sopDone) {
      sopMissing.push("未执行直播促到SOP");
    }
    return Object.assign({}, r, {
      target: target,
      invite: invite,
      pushOk: pushOk,
      watch: watch,
      attendRateNum: attendRate,
      payRateNum: payRate,
      pushRate: pushRate,
      attendDiff: attendRate != null && avgAttend != null ? Math.round((attendRate - avgAttend) * 10) / 10 : null,
      sopDone: sopDone,
      sopMissing: sopMissing,
      upcoming: upcoming,
      watchRate: attend ? rateNum(watch, attend) : null
    });
  }

  function getLiveRecapRows(filters, opts) {
    filters = filters || BM().getFilters();
    opts = opts || {};
    var tab = opts.tab || "all";
    var sortKey = opts.sort || "recent";
    var rows = BM().getLiveRows(filters) || [];
    var endedBase = rows.filter(function (r) {
      return r.status === "ended" && !r.dataInsufficient && r.attendRate && r.attendRate !== "—";
    });
    var avgAttend = 0;
    endedBase.forEach(function (r) { avgAttend += parsePct(r.attendRate) || 0; });
    avgAttend = endedBase.length ? Math.round(avgAttend / endedBase.length * 10) / 10 : null;
    var enriched = rows.map(function (r) { return enrichLiveRow(r, avgAttend, null); });
    if (tab === "ended") {
      enriched = enriched.filter(function (r) { return !r.upcoming; });
    } else if (tab === "upcoming") {
      enriched = enriched.filter(function (r) { return r.upcoming; });
    }
    function riskScore(r) {
      return (r.sopMissing ? r.sopMissing.length : 0) * 10 + (!r.inviteSent ? 5 : 0);
    }
    if (tab === "ended" || tab === "all") {
      if (sortKey === "attend_asc") enriched = sortBy(enriched.filter(function (r) { return r.attendRateNum != null; }).concat(enriched.filter(function (r) { return r.attendRateNum == null; })), "attendRateNum", "asc");
      else if (sortKey === "pay_asc") enriched = sortBy(enriched, "payRateNum", "asc");
      else if (sortKey === "gap") enriched = sortBy(enriched, "attendDiff", "asc");
      else if (sortKey === "no_sop") {
        enriched = enriched.slice().sort(function (a, b) {
          return (a.sopDone === b.sopDone) ? 0 : (a.sopDone ? 1 : -1);
        });
      }
    }
    if (tab === "upcoming") {
      if (sortKey === "risk") enriched = enriched.slice().sort(function (a, b) { return riskScore(b) - riskScore(a); });
      else if (sortKey === "no_sop") {
        enriched = enriched.slice().sort(function (a, b) {
          return (a.sopDone === b.sopDone) ? 0 : (a.sopDone ? 1 : -1);
        });
      }
      /* default: nearest broadcast — keep data order which is already near-first for demo */
    }
    return enriched;
  }

  function liveIdMatches(rowId, want) {
    if (!want) return false;
    if (rowId === want) return true;
    var a = String(rowId || "").replace(/^L0*/, "L");
    var b = String(want || "").replace(/^L0*/, "L");
    return a === b;
  }

  function getLiveSessionDetail(liveId, filters) {
    var rows = getLiveRecapRows(filters, { tab: "all" });
    var row = rows.find(function (r) { return liveIdMatches(r.id, liveId); });
    if (!row) return null;
    var channels = aggregateByChannel(filters).map(function (c) {
      var share = Math.max(0.08, 0.22 + ((c.id || "").length % 5) * 0.04);
      if (c.id === "video") share = 0.48;
      var attend = row.attend == null ? 0 : Math.round(row.attend * share);
      var pay = Math.round((row.payUsers || 0) * share);
      return { id: c.id, label: c.label, attend: attend, pay: pay, payRate: rateNum(pay, attend) };
    });
    var terms = aggregateByTerm(filters).map(function (t) {
      var share = t.id === (row.term || "") ? 0.7 : 0.3 / Math.max(1, aggregateByTerm(filters).length - 1);
      var attend = row.attend == null ? 0 : Math.round(row.attend * share);
      return { id: t.id, label: t.label, attend: attend, pay: Math.round((row.payUsers || 0) * share) };
    });
    var noShow = row.upcoming ? 0 : Math.max(0, (row.invite || row.target || 0) - (row.attend || 0));
    var attendNoPay = row.upcoming ? 0 : Math.max(0, (row.attend || 0) - (row.payUsers || 0));
    var pushFail = Math.max(0, (row.target || 0) - (row.pushOk || 0));
    return {
      row: row,
      channels: channels,
      terms: terms,
      noShow: noShow,
      attendNoPay: attendNoPay,
      pushFail: pushFail,
      followPending: Math.round(attendNoPay * 0.6)
    };
  }

  function getLiveConclusions(filters) {
    var rows = getLiveRecapRows(filters, { tab: "all" });
    var lines = [];
    var ended = rows.filter(function (r) { return !r.upcoming && r.attendRateNum != null; });
    var low = sortBy(ended, "attendDiff", "asc")[0];
    if (low && low.attendDiff != null && low.attendDiff < 0) {
      var assoc = low.sopDone
        ? "建议检查邀约与目标人群配置。"
        : (low.id + "未执行直播促到SOP，同时到场率低于平均，建议检查邀约及促到执行情况。");
      lines.push({
        text: (low.id || "") + "「" + low.name + "」到场率低于平均 " + Math.abs(low.attendDiff) + " 个百分点。" + assoc,
        action: { type: "open_live", id: low.id, label: "查看" + low.id + "场次" }
      });
    }
    var sopOn = rows.filter(function (r) { return r.sopDone && !r.upcoming; }).length;
    var sopOff = rows.filter(function (r) { return !r.sopDone && !r.upcoming; }).length;
    if (sopOn || sopOff) {
      lines.push({
        text: "已结束场次中 " + sopOn + " 场执行了直播促到SOP，" + sopOff + " 场未执行（执行组与未执行组相关表现，非因果结论）。"
      });
    }
    return lines.slice(0, 3);
  }

  function getConvertContribution(filters, dim) {
    filters = filters || BM().getFilters();
    dim = dim || "channel";
    var d = BM().aggregateLeadMetrics(filters);
    var overallPay = rateNum(d.attributedPayUsers, d.wecomLeads);
    var list = [];
    if (dim === "channel") list = aggregateByChannel(filters);
    else if (dim === "term") list = aggregateByTerm(filters);
    else if (dim === "live") {
      /* 仅已结束且可分析的历史场次进入支付贡献 */
      list = getLiveRecapRows(filters, { tab: "ended" })
        .filter(function (r) { return !r.dataInsufficient && r.attend != null; })
        .map(function (r) {
          return {
            id: r.id,
            label: r.id + " " + r.name,
            attend: r.attend || 0,
            wecom: r.attend || 0,
            pay: r.payUsers || 0,
            upcoming: false,
            dataInsufficient: !!r.dataInsufficient
          };
        });
    } else if (dim === "product") {
      return (BM().getFullProductRows(Object.assign({}, filters, { applySrc: true })) || []).map(function (p) {
        return {
          id: p.name,
          label: p.name,
          from: null,
          pay: null,
          orders: p.orders,
          gmv: p.gmv,
          aov: p.orders ? Math.round(p.gmv / p.orders) : null,
          payRate: null,
          zone: "full",
          type: p.type
        };
      });
    }
    return list.map(function (r) {
      var from = dim === "live" ? r.attend : r.wecom;
      var pay = r.pay;
      var gmv = null;
      if (dim === "channel" || dim === "term") {
        gmv = 0;
        sliceRows(filters).forEach(function (s) {
          if (dim === "channel" && s.channel !== r.id) return;
          if (dim === "term" && (s.term || "mixed") !== r.id) return;
          if (s.attributedGmv != null) gmv += s.attributedGmv;
        });
        if (!gmv) gmv = null;
      }
      var payRate = rateNum(pay, from);
      return {
        id: r.id,
        label: r.label,
        from: from,
        pay: pay,
        orders: pay,
        gmv: gmv,
        aov: pay && gmv ? Math.round(gmv / pay) : null,
        payRate: payRate,
        payDiff: payRate != null && overallPay != null ? Math.round((payRate - overallPay) * 10) / 10 : null,
        zone: "attributed",
        canViewPayUsers: dim !== "live" || (pay != null && pay > 0)
      };
    });
  }

  function getAttributionCoverage(filters) {
    var d = BM().aggregateLeadMetrics(filters);
    var fullOrders = d.fullOrders || 0;
    var attrOrders = d.attrOrdersRaw;
    var mapped = attrOrders == null || attrOrders === "—" ? 0 : attrOrders;
    var unmapped = Math.max(0, fullOrders - (mapped || 0));
    var cover = fullOrders ? rateNum(mapped, fullOrders) : null;
    return {
      fullOrders: fullOrders,
      fullGmv: d.fullGmv,
      attrOrders: mapped || null,
      attrGmv: d.attrGmvRaw,
      unmappedOrders: unmapped,
      coverRate: cover,
      empty: !!d.attrTradeEmpty
    };
  }

  function getConvertConclusions(filters) {
    var rows = getConvertContribution(filters, "channel");
    var lines = [];
    var multi = rows.length > 1;
    var topPay = sortBy(rows, "pay", "desc")[0];
    if (topPay && multi) {
      lines.push({
        text: topPay.label + "贡献可归因支付人数最多（" + topPay.pay + " 人）。",
        action: { type: "select_channel", id: topPay.id, label: "查看渠道支付" }
      });
    } else if (topPay && !multi) {
      lines.push({
        text: topPay.label + "可归因支付 " + topPay.pay + " 人，支付率 " + (topPay.payRate != null ? topPay.payRate + "%" : "—") + "。",
        action: { type: "select_channel", id: topPay.id, label: "查看渠道支付" }
      });
    }
    var cov = getAttributionCoverage(filters);
    if (cov.coverRate != null) {
      lines.push({
        text: "归因覆盖率 " + cov.coverRate + "%，未归因订单 " + cov.unmappedOrders + " 笔（计入全量区，不混入可归因）。",
        action: { type: "section", id: "full", label: "查看成交结果" }
      });
    }
    var lives = getConvertContribution(filters, "live");
    var liveTop = sortBy(lives, "pay", "desc")[0];
    if (liveTop && liveTop.pay) {
      lines.push({
        text: "直播场次「" + liveTop.label + "」带来支付 " + liveTop.pay + " 人。",
        action: { type: "open_live", id: liveTop.id, label: "查看场次复盘" }
      });
    }
    return lines.slice(0, 3);
  }

  function normalizeConclusion(item) {
    if (!item) return { text: "" };
    if (typeof item === "string") return { text: item };
    return item;
  }

  function renderConclusionHtml(items, title) {
    items = (items || []).map(normalizeConclusion);
    return "<b>" + (title || "经营结论") + "</b><ul style='margin:4px 0 0;padding-left:18px'>" +
      items.map(function (item, idx) {
        var act = item.action
          ? ' <button type="button" class="btn btn-sm" data-conclusion-idx="' + idx + '">' + (item.action.label || "查看分析") + "</button>"
          : "";
        return "<li>" + item.text + act + "</li>";
      }).join("") + "</ul>";
  }

  global.BoardInsights = {
    STATE_KEY: STATE_KEY,
    FUNNEL_STEPS: FUNNEL_STEPS,
    DIM_LABELS: DIM_LABELS,
    priorRangeKey: priorRangeKey,
    comparePeriodLabel: comparePeriodLabel,
    getPriorMetrics: getPriorMetrics,
    getCoreKpis: getCoreKpis,
    getFunnelDimensionBreakdown: getFunnelDimensionBreakdown,
    getBottlenecks: getBottlenecks,
    getTodoRisks: getTodoRisks,
    getAnalyticsState: getAnalyticsState,
    setAnalyticsState: setAnalyticsState,
    saveReturnState: saveReturnState,
    describeAnalyticsContext: describeAnalyticsContext,
    buildReturnOverviewUrl: buildReturnOverviewUrl,
    buildReturnBoardUrl: buildReturnBoardUrl,
    drillExtraForAnalysis: drillExtraForAnalysis,
    rateNum: rateNum,
    sortBy: sortBy,
    getChannelQuality: getChannelQuality,
    getChannelTermBreakdown: getChannelTermBreakdown,
    getChannelConclusions: getChannelConclusions,
    getStaffExecution: getStaffExecution,
    getStageOps: getStageOps,
    getPrivateConclusions: getPrivateConclusions,
    getLiveRecapRows: getLiveRecapRows,
    getLiveSessionDetail: getLiveSessionDetail,
    getLiveConclusions: getLiveConclusions,
    getConvertContribution: getConvertContribution,
    getAttributionCoverage: getAttributionCoverage,
    getConvertConclusions: getConvertConclusions,
    normalizeConclusion: normalizeConclusion,
    renderConclusionHtml: renderConclusionHtml,
    liveIdMatches: liveIdMatches
  };
})(window);
