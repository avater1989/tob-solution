/**
 * 期次经营看板 — 数据装配与趋势组件（依赖 board-data / board-metrics / board-insights）
 */
(function (global) {
  function BD() { return global.BoardData; }
  function BM() { return global.BoardMetrics; }
  function BI() { return global.BoardInsights; }

  var STATUS_FOCUS = {
    prep: { title: "筹备重点", items: ["目标与人群", "直播促到SOP配置", "开播准备任务"] },
    acquiring: { title: "获客重点", items: ["渠道流量与有效率", "加微率", "分配及时率"] },
    private_handoff: { title: "承接重点", items: ["分配与加微", "跟进覆盖", "积压处理"] },
    live_running: { title: "直播重点", items: ["邀约与推送", "到场表现", "场次准备"] },
    convert_sprint: { title: "冲刺重点", items: ["到场未支付", "高意向跟进", "支付目标进度"] },
    ended: { title: "复盘重点", items: ["完整漏斗", "目标完成", "场次效果"] }
  };

  var TERM_FUNNEL = [
    { id: "pool", label: "进入私域池", key: "poolLeads", rateLabel: null },
    { id: "assign", label: "已分配", key: "assignedLeads", fromKey: "poolLeads", rateLabel: "分配率", stepId: "pool_assign" },
    { id: "wecom", label: "已加微", key: "wecomLeads", fromKey: "assignedLeads", rateLabel: "加微率", stepId: "pool_wecom", funnelStep: "pool_wecom" },
    { id: "follow", label: "已跟进", key: "followed", fromKey: "wecomLeads", rateLabel: "跟进覆盖率", stepId: "wecom_follow" },
    { id: "attend", label: "已到场", key: "attendUsers", fromKey: "wecomLeads", rateLabel: "到场率", stepId: "wecom_attend", funnelStep: "wecom_attend" },
    { id: "pay", label: "已支付", key: "attributedPayUsers", fromKey: "attendUsers", rateLabel: "支付转化率", stepId: "attend_pay", funnelStep: "attend_pay" }
  ];

  function catalog() {
    return (BD().termCatalog || []).filter(function (t) { return !t.demoOnly; });
  }

  function getTermById(id) {
    if (!id) return null;
    var all = BD().termCatalog || [];
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  }

  function defaultTermId() {
    var list = catalog();
    var sprint = list.filter(function (t) { return t.status === "convert_sprint"; })[0];
    if (sprint) return sprint.id;
    var live = list.filter(function (t) { return t.status === "live_running"; })[0];
    if (live) return live.id;
    return list[0] ? list[0].id : "";
  }

  function daysLeft(term) {
    if (!term || !term.conversionDeadline) return null;
    try {
      var end = new Date(String(term.conversionDeadline).replace(/-/g, "/") + " 23:59:59");
      var now = new Date("2026/09/10 12:00:00");
      var d = Math.ceil((end - now) / 86400000);
      return d;
    } catch (e) {
      return null;
    }
  }

  function termFilters(base, termId) {
    var f = Object.assign({}, base || BM().getFilters());
    f.term = termId || f.term || "";
    return f;
  }

  function pct(n, d) {
    if (d == null || d === 0 || n == null) return null;
    return Math.round((n / d) * 1000) / 10;
  }

  function rateGap(cur, target) {
    if (cur == null || target == null) return null;
    return Math.round((cur - target) * 10) / 10;
  }

  function compareTermMetrics(term) {
    if (!term || !term.compareTermId) return null;
    var prior = getTermById(term.compareTermId);
    if (!prior) return null;
    /* 演示：用目标与系数合成上一期结果，避免虚构 leadSlices */
    var g = prior.goals || {};
    return {
      label: prior.compareTermLabel || prior.name,
      poolLeads: Math.round((g.poolLeads || 0) * 0.92),
      wecomRate: (g.wecomRate || 0) - 1.2,
      attendRate: (g.attendRate || 0) - 2.1,
      payUsers: Math.round((g.payUsers || 0) * 0.88),
      payRate: (g.payRate || 0) - 1.5,
      gmv: Math.round((g.gmv || 0) * 0.9)
    };
  }

  function getTermBundle(termId, filters) {
    var term = getTermById(termId);
    if (!term) return null;
    filters = termFilters(filters, termId);
    var d = BM().aggregateLeadMetrics(filters);
    var goals = term.goals || {};
    var wecomRate = pct(d.wecomLeads, d.poolLeads);
    var attendRate = pct(d.attendUsers, d.wecomLeads);
    var payRate = pct(d.attributedPayUsers, d.attendUsers);
    var prior = compareTermMetrics(term);
    var followed = Math.max(0, (d.wecomLeads || 0) - (d.noFollow || 0));
    d.followed = followed;

    function kpi(id, label, value, target, kind, priorVal) {
      var done = null;
      var gap = null;
      var vsPrior = null;
      if (kind === "count" && target != null && target > 0) {
        done = Math.round((value / target) * 1000) / 10;
      }
      if (kind === "rate" && target != null && value != null) {
        gap = rateGap(value, target);
      }
      if (priorVal != null && value != null) {
        if (kind === "count" && priorVal > 0) {
          var p = Math.round(((value - priorVal) / priorVal) * 1000) / 10;
          vsPrior = { text: (p > 0 ? "+" : "") + p + "%", trend: p > 0 ? "up" : p < 0 ? "down" : "flat" };
        } else if (kind === "rate") {
          var pp = rateGap(value, priorVal);
          vsPrior = { text: (pp > 0 ? "+" : "") + pp + "pp", trend: pp > 0 ? "up" : pp < 0 ? "down" : "flat" };
        }
      } else if (term.compareTermId == null) {
        vsPrior = { text: "暂无可比期次", trend: "flat", none: true };
      }
      return {
        id: id,
        label: label,
        value: value,
        display: kind === "rate" ? (value != null ? value + "%" : "—") : BM().fmt(value),
        target: target,
        targetDisplay: kind === "rate" ? (target != null ? target + "%" : null) : (target != null ? BM().fmt(target) : null),
        doneRate: done,
        gap: gap,
        vsPrior: vsPrior,
        kind: kind
      };
    }

    var kpis = [
      kpi("pool", "入池人数", d.poolLeads, goals.poolLeads, "count", prior && prior.poolLeads),
      kpi("wecomRate", "加微率", wecomRate, goals.wecomRate, "rate", prior && prior.wecomRate),
      kpi("attendRate", "到场率", attendRate, goals.attendRate, "rate", prior && prior.attendRate),
      kpi("payUsers", "支付人数", d.attributedPayUsers, goals.payUsers, "count", prior && prior.payUsers),
      kpi("payRate", "到场后支付率", payRate, goals.payRate, "rate", prior && prior.payRate),
      kpi("gmv", "可归因成交GMV", d.attrGmv != null ? d.attrGmv : d.attributedGmv, goals.gmv, "count", prior && prior.gmv)
    ];

    var left = daysLeft(term);
    var focus = STATUS_FOCUS[term.status] || STATUS_FOCUS.convert_sprint;

    return {
      term: term,
      filters: filters,
      metrics: d,
      kpis: kpis,
      daysLeft: left,
      focus: focus,
      prior: prior,
      channelCount: (term.enabledChannels || []).length,
      liveCount: (term.relatedLiveIds || []).length
    };
  }

  function getTermFunnel(termId, filters) {
    var bundle = getTermBundle(termId, filters);
    if (!bundle) return { steps: [] };
    var d = bundle.metrics;
    var goals = bundle.term.goals || {};
    var goalRates = {
      assign: 96,
      wecom: goals.wecomRate,
      follow: 78,
      attend: goals.attendRate,
      pay: goals.payRate
    };
    return {
      steps: TERM_FUNNEL.map(function (s, idx) {
        var n = d[s.key];
        if (s.id === "follow") n = d.followed;
        var from = s.fromKey ? d[s.fromKey] : null;
        if (s.id === "follow") from = d.wecomLeads;
        if (s.id === "attend") from = d.wecomLeads;
        var rate = s.rateLabel ? pct(n, from) : null;
        var target = s.id === "pool" ? null : goalRates[s.id];
        return {
          id: s.id,
          label: s.label,
          count: n,
          rate: rate,
          rateLabel: s.rateLabel,
          targetRate: target,
          gap: rateGap(rate, target),
          funnelStep: s.funnelStep || null,
          idx: idx
        };
      })
    };
  }

  function getTermChannels(termId, filters) {
    filters = termFilters(filters, termId);
    var q = BI().getChannelQuality(filters);
    var pool = (q.rows || []).reduce(function (s, r) { return s + (r.pool || 0); }, 0) || 1;
    return (q.rows || []).map(function (r) {
      return Object.assign({}, r, {
        share: Math.round((r.pool / pool) * 1000) / 10
      });
    });
  }

  function getTermStaff(termId, filters) {
    filters = termFilters(filters, termId);
    return BI().getStaffExecution(filters).rows || [];
  }

  function getTermLives(termId, filters) {
    var term = getTermById(termId);
    if (!term) return { ended: [], upcoming: [] };
    filters = termFilters(filters, termId);
    var ids = term.relatedLiveIds || [];
    var rows = BI().getLiveRecapRows(filters, { tab: "all" }).filter(function (r) {
      return !ids.length || ids.indexOf(r.id) >= 0;
    });
    rows.forEach(function (r) {
      r.roleInTerm = (term.liveRoles && term.liveRoles[r.id]) || "关联场次";
    });
    return {
      ended: rows.filter(function (r) { return !r.upcoming; }),
      upcoming: rows.filter(function (r) { return r.upcoming; })
    };
  }

  function getTermConvert(termId, filters) {
    filters = termFilters(filters, termId);
    var d = BM().aggregateLeadMetrics(filters);
    var byCh = BI().getConvertContribution(filters, "channel");
    var byLive = BI().getConvertContribution(filters, "live");
    var products = (typeof BM().getFullProductRows === "function" ? BM().getFullProductRows(filters) : [])
      .filter(function (p) { return !p.term || p.term === termId; })
      .slice(0, 5);
    var cov = BI().getAttributionCoverage ? BI().getAttributionCoverage(filters) : null;
    return {
      payUsers: d.attributedPayUsers,
      payWithAttend: d.payWithAttend,
      payNoAttend: d.payNoAttend,
      attendNoPay: Math.max(0, (d.attendUsers || 0) - (d.payWithAttend || 0)),
      highIntentNoPay: Math.round(Math.max(0, (d.wecomLeads || 0) * 0.08)),
      attrGmv: d.attrGmv != null ? d.attrGmv : d.attributedGmv,
      attrOrders: d.attrOrders != null ? d.attrOrders : d.attributedOrders,
      fullGmv: d.fullGmv,
      fullOrders: d.fullOrders,
      byChannel: byCh,
      byLive: byLive,
      products: products,
      coverage: cov
    };
  }

  function getTermBottlenecks(termId, filters) {
    var bundle = getTermBundle(termId, filters);
    if (!bundle) return [];
    var term = bundle.term;
    var d = bundle.metrics;
    var goals = term.goals || {};
    var channels = getTermChannels(termId, filters);
    var lives = getTermLives(termId, filters).ended;
    var items = [];

    var attendRate = pct(d.attendUsers, d.wecomLeads);
    if (attendRate != null && goals.attendRate && attendRate < goals.attendRate - 1.5) {
      var weakCh = BI().sortBy(channels.filter(function (c) { return c.attendDiff != null; }), "attendDiff", "asc").slice(0, 2);
      var weakLive = BI().sortBy(lives.filter(function (l) { return l.attendDiff != null; }), "attendDiff", "asc")[0];
      var children = weakCh.map(function (c) {
        return {
          id: "child_ch_" + c.id,
          title: c.label + "到场率低于期次整体",
          detail: (c.attendRate != null ? c.attendRate + "%" : "—") + " · " + (c.attendDiffText || c.diffAttend || "")
        };
      });
      if (weakLive) {
        children.push({
          id: "child_live_" + weakLive.id,
          title: weakLive.id + "场次低于同类场次",
          detail: (weakLive.attendRateNum != null ? weakLive.attendRateNum + "%" : "—") + " · 差距 " + weakLive.attendDiff + "pp"
        });
      }
      if (d.noFollow >= 10) {
        children.push({
          id: "child_nofollow",
          title: "未跟进用户较多",
          detail: d.noFollow + " 人"
        });
      }
      items.push({
        id: "term_attend_below",
        score: (goals.attendRate - attendRate) * 5,
        title: "到场率低于目标",
        current: attendRate + "%",
        target: goals.attendRate + "%",
        gap: rateGap(attendRate, goals.attendRate) + "个百分点",
        impact: "预计影响约 " + Math.round(d.wecomLeads * (goals.attendRate - attendRate) / 100) + " 名用户",
        sources: weakCh.map(function (c) { return c.label; }).concat(weakLive ? [weakLive.id] : []).slice(0, 3).join("、") || "—",
        reason: children.map(function (c) { return c.title; }).slice(0, 3).join("；"),
        children: children.slice(0, 3),
        action: {
          label: "查看到场分析",
          type: "analysis",
          funnelStep: "wecom_attend",
          dimension: "channel"
        }
      });
    }

    var wecomRate = pct(d.wecomLeads, d.poolLeads);
    if (wecomRate != null && goals.wecomRate && wecomRate < goals.wecomRate - 1.5) {
      items.push({
        id: "term_wecom_below",
        score: (goals.wecomRate - wecomRate) * 4,
        title: "加微率低于目标",
        current: wecomRate + "%",
        target: goals.wecomRate + "%",
        gap: rateGap(wecomRate, goals.wecomRate) + "个百分点",
        impact: "预计影响约 " + Math.round(d.poolLeads * (goals.wecomRate - wecomRate) / 100) + " 名用户",
        sources: BI().sortBy(channels, "wecomRate", "asc").slice(0, 2).map(function (c) { return c.label; }).join("、") || "—",
        reason: d.backlogLate ? ("分配超时 " + d.backlogLate + " 人关联") : "建议检查分配与首跟",
        children: [],
        action: {
          label: "查看加微分析",
          type: "analysis",
          funnelStep: "pool_wecom",
          dimension: "channel"
        }
      });
    }

    var payUsers = d.attributedPayUsers || 0;
    if (goals.payUsers && payUsers < goals.payUsers * 0.85) {
      var done = Math.round((payUsers / goals.payUsers) * 1000) / 10;
      items.push({
        id: "term_pay_lag",
        score: (goals.payUsers - payUsers) * 0.2,
        title: "支付目标完成落后",
        current: String(payUsers),
        target: String(goals.payUsers),
        gap: "完成率 " + done + "%",
        impact: "距目标差 " + Math.max(0, goals.payUsers - payUsers) + " 人",
        sources: BI().sortBy(channels, "pay", "desc").slice(0, 2).map(function (c) { return c.label; }).join("、") || "—",
        reason: "到场未支付约 " + Math.max(0, (d.attendUsers || 0) - (d.payWithAttend || 0)) + " 人",
        children: [],
        action: {
          label: "查看支付分析",
          type: "analysis",
          funnelStep: "attend_pay",
          dimension: "channel"
        }
      });
    }

    var weakPay = BI().sortBy(channels.filter(function (c) {
      return c.payDiff != null && c.payDiff <= -3 && c.wecom >= 15;
    }), "payDiff", "asc")[0];
    if (weakPay && !(bundle.filters && bundle.filters.channel)) {
      items.push({
        id: "term_ch_pay_" + weakPay.id,
        score: Math.abs(weakPay.payDiff) * 2.5,
        title: weakPay.label + "支付率明显低于期次整体",
        current: (weakPay.payRate != null ? weakPay.payRate + "%" : "—"),
        target: "期次整体",
        gap: weakPay.payDiff + "个百分点",
        impact: "覆盖加微 " + weakPay.wecom + " 人",
        sources: weakPay.label,
        reason: "主要流失关联：" + (weakPay.dropLabel || "加微→到场或到场→支付"),
        children: [],
        action: {
          label: "查看渠道分析",
          type: "analysis",
          funnelStep: "attend_pay",
          dimension: "channel",
          selectedChannel: weakPay.id
        }
      });
    }

    items.sort(function (a, b) { return b.score - a.score; });
    /* 父子去重：若已有整体到场瓶颈，不再把单场次作为平级瓶颈 */
    var hasAttend = items.some(function (i) { return i.id === "term_attend_below"; });
    if (hasAttend) {
      items = items.filter(function (i) { return i.id.indexOf("term_live_") !== 0; });
    }
    return items.slice(0, 3);
  }

  function getTermTodos(termId, filters) {
    filters = termFilters(filters, termId);
    var d = BM().aggregateLeadMetrics(filters);
    var lives = getTermLives(termId, filters);
    var risks = [];

    if (d.backlog > 0) {
      risks.push({
        urgency: d.backlogLate >= 5 ? "high" : (d.backlogLate > 0 ? "medium" : "low"),
        urgencyLabel: d.backlogLate >= 5 ? "紧急" : (d.backlogLate > 0 ? "关注" : "一般"),
        type: "待分配用户",
        count: d.backlog,
        note: d.backlogLate > 0
          ? ("其中超时 " + d.backlogLate + " 人，最长超时约 " + Math.max(4, Math.round(4 + d.backlogLate * 0.6)) + " 小时")
          : "暂无超时，建议尽快完成分配",
        owner: "SCRM 分配",
        action: { label: "去分配", href: "leads.html", focus: "unassigned" }
      });
    }
    if (d.noFollow > 0) {
      risks.push({
        urgency: d.noFollow >= 40 ? "high" : "medium",
        urgencyLabel: d.noFollow >= 40 ? "紧急" : "关注",
        type: "长期未跟进",
        count: d.noFollow,
        note: "已加微无跟进记录 · 高优先约 " + Math.min(d.noFollow, Math.round(d.noFollow * 0.35)) + " 人",
        owner: "私域跟进",
        action: { label: "去跟进", href: "follow-ups.html", focus: "no_follow" }
      });
    }
    var attendNoPay = Math.max(0, (d.attendUsers || 0) - (d.payWithAttend || 0));
    if (attendNoPay > 0) {
      risks.push({
        urgency: "medium",
        urgencyLabel: "关注",
        type: "到场未支付待跟进",
        count: attendNoPay,
        note: "可继续促单跟进",
        owner: "转化跟进",
        action: { label: "去跟进", href: "board-convert.html", focus: "nopay", section: "attributed" }
      });
    }
    var sms = d.videoSmsFailed || 0;
    if (sms > 0) {
      risks.push({
        urgency: "high",
        urgencyLabel: "紧急",
        type: "推送失败待重试",
        count: Math.min(sms, 8),
        note: "领课/邀约短信发送失败",
        owner: "触达通道",
        action: { label: "去重试", href: "orders.html", focus: "sms_failed" }
      });
    }
    lives.upcoming.forEach(function (l) {
      if (l.sopDone) return;
      risks.push({
        urgency: "high",
        urgencyLabel: "紧急",
        type: "开播前未完成直播促到SOP",
        count: 1,
        note: l.id + "「" + l.name + "」· " + (l.startAt || ""),
        owner: "直播运营",
        action: { label: "去配置", href: "live-invite.html", liveId: l.id }
      });
    });

    var rank = { high: 0, medium: 1, low: 2 };
    risks.sort(function (a, b) { return rank[a.urgency] - rank[b.urgency]; });
    return risks.slice(0, 6);
  }

  /** 演示趋势序列：确定性伪随机，避免每日刷新跳动 */
  function hash(s) {
    var h = 0;
    String(s).split("").forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) | 0; });
    return Math.abs(h);
  }

  function buildTrendSeries(termId, metric, opts) {
    opts = opts || {};
    if (opts.range || opts.term || opts.channel) opts = { filters: opts };
    var term = getTermById(termId);
    if (!term) return null;
    var alias = {
      pool_cum: "pool_cum",
      pool: "pool_new",
      wecom_rate: "wecomRate",
      follow_rate: "followRate",
      cover_rate: "followRate",
      attend_users: "attend",
      attend_rate: "attend",
      pay_users: "pay",
      pay_cum: "pay_cum",
      gmv_cum: "gmv_cum"
    };
    metric = alias[metric] || metric;
    var bundle = getTermBundle(termId, opts.filters);
    var days = 14;
    var labels = [];
    var daily = [];
    var cum = [];
    var targetLine = [];
    var priorCum = [];
    var seed = hash(termId + ":" + metric);
    var baseDaily = {
      pool_new: Math.max(8, Math.round((bundle.metrics.poolLeads || 100) / days)),
      attend: Math.max(3, Math.round((bundle.metrics.attendUsers || 40) / days)),
      pay: Math.max(2, Math.round((bundle.metrics.attributedPayUsers || 20) / days)),
      wecomRate: bundle.kpis.filter(function (k) { return k.id === "wecomRate"; })[0],
      followRate: 72,
      gmv: Math.max(500, Math.round(((bundle.metrics.attrGmv || bundle.metrics.attributedGmv || 10000)) / days))
    };
    var run = 0;
    var priorRun = 0;
    var goalPay = (term.goals && term.goals.payUsers) || null;
    var goalPool = (term.goals && term.goals.poolLeads) || null;
    var goalGmv = (term.goals && term.goals.gmv) || null;

    for (var i = 0; i < days; i++) {
      var day = i + 1;
      labels.push("D" + day);
      var wobble = ((seed + i * 17) % 7) - 3;
      var v;
      var isRate = metric === "wecomRate" || metric === "followRate";
      if (metric === "pool_new" || metric === "pool_cum") v = Math.max(0, baseDaily.pool_new + wobble);
      else if (metric === "attend") v = Math.max(0, baseDaily.attend + Math.round(wobble / 2));
      else if (metric === "pay" || metric === "pay_cum") v = Math.max(0, baseDaily.pay + Math.round(wobble / 3));
      else if (metric === "gmv" || metric === "gmv_cum") v = Math.max(0, baseDaily.gmv + wobble * 80);
      else if (metric === "wecomRate") v = Math.max(40, Math.min(85, (baseDaily.wecomRate && baseDaily.wecomRate.value) || 64 + wobble * 0.4));
      else if (metric === "followRate") v = Math.max(50, Math.min(95, baseDaily.followRate + wobble * 0.5));
      else v = Math.max(0, baseDaily.pool_new + wobble);

      if (isRate) {
        daily.push(Math.round(v * 10) / 10);
        cum.push(null);
        priorCum.push(null);
        var tgt = metric === "wecomRate" ? (term.goals && term.goals.wecomRate) : 78;
        targetLine.push(tgt != null ? tgt : null);
      } else {
        daily.push(v);
        run += v;
        cum.push(run);
        priorRun += Math.round(v * 0.88);
        priorCum.push(priorRun);
        if (metric === "pay" || metric === "pay_cum") {
          targetLine.push(goalPay != null ? Math.round(goalPay * (day / days)) : null);
        } else if (metric === "pool_new" || metric === "pool_cum") {
          targetLine.push(goalPool != null ? Math.round(goalPool * (day / days)) : null);
        } else if (metric === "gmv" || metric === "gmv_cum") {
          targetLine.push(goalGmv != null ? Math.round(goalGmv * (day / days)) : null);
        } else {
          targetLine.push(null);
        }
      }
    }

    var kind = isRate ? "rate" : (metric.indexOf("cum") >= 0 || metric === "pay" || metric === "pool_new" || metric === "attend" || metric === "gmv" ? "cum" : "daily");
    return {
      termId: termId,
      metric: metric,
      labels: labels,
      daily: daily,
      cumulative: cum,
      target: targetLine,
      priorCumulative: term.compareTermId ? priorCum : null,
      priorLabel: term.compareTermLabel || null,
      kind: kind,
      avg: isRate ? Math.round(daily.reduce(function (a, b) { return a + b; }, 0) / daily.length * 10) / 10 : null
    };
  }

  function renderTrendChart(host, series) {
    if (!host) return;
    if (!series) {
      host.innerHTML = '<p class="muted" style="padding:16px">暂无趋势数据</p>';
      return;
    }
    var w = Math.max(host.clientWidth || 560, 480);
    var h = 220;
    var pad = { t: 16, r: 16, b: 28, l: 40 };
    var iw = w - pad.l - pad.r;
    var ih = h - pad.t - pad.b;
    var useCum = series.kind !== "rate";
    var primary = useCum ? series.cumulative : series.daily;
    var vals = primary.filter(function (x) { return x != null; })
      .concat((series.target || []).filter(function (x) { return x != null; }))
      .concat((series.priorCumulative || []).filter(function (x) { return x != null; }));
    if (!vals.length) {
      host.innerHTML = '<p class="muted" style="padding:16px">当前阶段暂无可用趋势</p>';
      return;
    }
    var minV = Math.min.apply(null, vals.concat([0]));
    var maxV = Math.max.apply(null, vals);
    if (maxV === minV) maxV = minV + 1;
    function x(i) { return pad.l + (i / Math.max(1, primary.length - 1)) * iw; }
    function y(v) { return pad.t + ih - ((v - minV) / (maxV - minV)) * ih; }
    function path(arr, skipNull) {
      var d = "";
      arr.forEach(function (v, i) {
        if (v == null && skipNull) return;
        d += (d ? " L " : "M ") + x(i) + " " + y(v == null ? minV : v);
      });
      return d;
    }
    var legend = '<span style="color:#165dff">当前' + (useCum ? "累计" : "") + '</span>';
    if (series.target && series.target.some(function (v) { return v != null; })) {
      legend += ' · <span style="color:#ff7d00">目标进度</span>';
    }
    if (series.priorCumulative) {
      legend += ' · <span style="color:#86909c">上一期同期</span>';
    }
    if (series.avg != null) legend += ' · 期次均值 ' + series.avg + "%";

    host.innerHTML =
      '<div class="muted" style="font-size:12px;margin-bottom:6px">' + legend + "</div>" +
      '<svg viewBox="0 0 ' + w + " " + h + '" width="100%" height="' + h + '" role="img">' +
      '<line x1="' + pad.l + '" y1="' + (pad.t + ih) + '" x2="' + (pad.l + iw) + '" y2="' + (pad.t + ih) + '" stroke="#e5e6eb"/>' +
      (series.priorCumulative ? '<path d="' + path(series.priorCumulative, true) + '" fill="none" stroke="#86909c" stroke-width="1.5" stroke-dasharray="4 3"/>' : "") +
      (series.target && series.target.some(function (v) { return v != null; })
        ? '<path d="' + path(series.target, true) + '" fill="none" stroke="#ff7d00" stroke-width="1.5" stroke-dasharray="6 4"/>'
        : "") +
      '<path d="' + path(primary, true) + '" fill="none" stroke="#165dff" stroke-width="2"/>' +
      series.labels.map(function (lb, i) {
        if (i % 2 !== 0 && i !== series.labels.length - 1) return "";
        return '<text x="' + x(i) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="10" fill="#86909c">' + lb + "</text>";
      }).join("") +
      '<text x="8" y="' + (pad.t + 4) + '" font-size="10" fill="#86909c">' + (series.kind === "rate" ? maxV + "%" : Math.round(maxV)) + "</text>" +
      "</svg>";
  }

  function termBoardUrl(termId, extra) {
    var q = new URLSearchParams();
    q.set("term", termId || "");
    var f = BM().getFilters();
    if (f.range) q.set("range", f.range);
    if (f.start_date) q.set("start_date", f.start_date);
    if (f.end_date) q.set("end_date", f.end_date);
    extra = extra || {};
    Object.keys(extra).forEach(function (k) {
      if (extra[k] != null && extra[k] !== "") q.set(k, extra[k]);
    });
    return "board-term-review.html?" + q.toString();
  }

  global.BoardTerm = {
    STATUS_FOCUS: STATUS_FOCUS,
    TERM_FUNNEL: TERM_FUNNEL,
    catalog: catalog,
    getTermById: getTermById,
    defaultTermId: defaultTermId,
    daysLeft: daysLeft,
    getTermBundle: getTermBundle,
    getTermFunnel: getTermFunnel,
    getTermChannels: getTermChannels,
    getTermStaff: getTermStaff,
    getTermLives: getTermLives,
    getTermConvert: getTermConvert,
    getTermBottlenecks: getTermBottlenecks,
    getTermTodos: getTermTodos,
    buildTrendSeries: buildTrendSeries,
    renderTrendChart: renderTrendChart,
    termBoardUrl: termBoardUrl
  };
})(window);
