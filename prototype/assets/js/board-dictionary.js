/**
 * 经营分析指标字典（P2）— 集中维护，供口径说明与指标 tip 使用
 */
(function (global) {
  var METRICS = [
    {
      id: "pool",
      name: "私域池人数",
      category: "获客",
      short: "统计期内首次进入线索池的去重用户数",
      formula: "COUNT(DISTINCT 首次入池用户)",
      numerator: "首次入池用户",
      denominator: "—",
      scope: "受日期 / 渠道 / 期次筛选",
      dedupe: "按用户去重",
      refund: "不含退款逻辑",
      caliber: "漏斗主口径",
      update: "随线索入池事件更新",
      note: "是主漏斗起点，不等于全部历史私域用户。"
    },
    {
      id: "valid_leads",
      name: "有效线索人数",
      category: "获客",
      short: "满足留资/下单等有效条件后进入私域池的线索",
      formula: "有效入池线索人数",
      numerator: "有效入池",
      denominator: "—",
      scope: "受日期 / 渠道 / 期次",
      dedupe: "按用户去重",
      refund: "不含",
      caliber: "获客辅口径",
      update: "随入池更新",
      note: "原型中可由入池人数反推有效入池率。"
    },
    {
      id: "valid_rate",
      name: "有效线索率",
      category: "获客",
      short: "有效入池占留资/下单流入的比例",
      formula: "入池人数 ÷ 留资或下单流入人数",
      numerator: "入池人数",
      denominator: "留资/下单流入",
      scope: "受日期 / 渠道",
      dedupe: "分子分母均去重",
      refund: "不含",
      caliber: "获客辅口径",
      update: "随入池更新",
      note: "用于观察获客质量，不进入后链路转化。"
    },
    {
      id: "assign_timely",
      name: "分配及时率",
      category: "私域承接",
      short: "入池后在约定时限内完成分配的比例",
      formula: "及时分配人数 ÷ 应分配人数",
      numerator: "约定时限内完成分配",
      denominator: "应分配线索",
      scope: "受日期 / 渠道 / 期次 / 员工",
      dedupe: "按线索去重",
      refund: "不含",
      caliber: "执行效率",
      update: "按分配事件",
      note: "原型中及时率含演示推导，不等同真实 SLA。"
    },
    {
      id: "wecom",
      name: "加微人数",
      category: "私域承接",
      short: "入池线索中完成企业微信添加的去重人数",
      formula: "COUNT(DISTINCT 已加微用户)",
      numerator: "已加微用户",
      denominator: "—",
      scope: "受日期 / 渠道 / 期次",
      dedupe: "按用户去重",
      refund: "不含",
      caliber: "漏斗主口径",
      update: "随加微事件",
      note: "以筛选期内首次入池线索的截至状态统计。"
    },
    {
      id: "wecom_rate",
      name: "加微率",
      category: "私域承接",
      short: "已加微人数占私域池人数的比例",
      formula: "加微人数 ÷ 私域池人数",
      numerator: "加微人数",
      denominator: "私域池人数",
      scope: "受日期 / 渠道 / 期次",
      dedupe: "分子分母均去重",
      refund: "不含",
      caliber: "漏斗主口径",
      update: "随加微事件",
      note: "缺分母时展示「—」，不用 0 冒充。"
    },
    {
      id: "cover_rate",
      name: "跟进覆盖率",
      category: "私域承接",
      short: "已加微用户中有有效跟进记录的比例",
      formula: "有跟进人数 ÷ 已加微人数",
      numerator: "有跟进记录用户",
      denominator: "已加微人数",
      scope: "受日期 / 渠道 / 期次 / 员工",
      dedupe: "按用户去重",
      refund: "不含",
      caliber: "私域运营",
      update: "随跟进写入",
      note: "未跟进名单用于主管定位，不在报表内直接处理。"
    },
    {
      id: "attend",
      name: "到场人数",
      category: "直播",
      short: "有到课/到场记录的去重用户数",
      formula: "COUNT(DISTINCT 到场用户)",
      numerator: "到场用户",
      denominator: "—",
      scope: "漏斗旁路受渠道；场次报表受日期/期次",
      dedupe: "按用户去重",
      refund: "不含",
      caliber: "直播运营",
      update: "随到课事件",
      note: "场次到场与主漏斗到场口径可能不同，以当前页面说明为准。"
    },
    {
      id: "attend_rate",
      name: "到场率",
      category: "直播",
      short: "到场人数相对上游人群的比例",
      formula: "到场人数 ÷ 上游人数（加微或邀约目标）",
      numerator: "到场人数",
      denominator: "加微人数或场次目标人群",
      scope: "视页面而定",
      dedupe: "按用户去重",
      refund: "不含",
      caliber: "直播运营",
      update: "随到课事件",
      note: "获客渠道质量表用加微作分母；场次复盘用目标/邀约作分母。"
    },
    {
      id: "watch",
      name: "有效观看人数",
      category: "直播",
      short: "达到有效观看时长阈值的到场用户",
      formula: "有效观看用户数",
      numerator: "有效观看",
      denominator: "—",
      scope: "场次维度",
      dedupe: "按用户去重",
      refund: "不含",
      caliber: "直播运营",
      update: "随观看心跳/时长",
      note: "原型按到场人数估算，后续需真实观看时长接口。"
    },
    {
      id: "watch_rate",
      name: "有效观看率",
      category: "直播",
      short: "有效观看人数占到场人数的比例",
      formula: "有效观看人数 ÷ 到场人数",
      numerator: "有效观看",
      denominator: "到场人数",
      scope: "场次维度",
      dedupe: "按用户去重",
      refund: "不含",
      caliber: "直播运营",
      update: "随观看数据",
      note: "无到场样本时展示「—」。"
    },
    {
      id: "pay_users",
      name: "支付人数",
      category: "转化",
      short: "完成目标支付的去重用户数（可归因或全量视分区而定）",
      formula: "COUNT(DISTINCT 支付用户)",
      numerator: "支付用户",
      denominator: "—",
      scope: "可归因受渠道/期次；全量仅受日期与成交类型",
      dedupe: "按用户去重",
      refund: "支付人数本身不含退款冲减",
      caliber: "分区固定：可归因 / 全量",
      update: "随支付成功",
      note: "同一页面内可归因卡与全量卡含义不混用。"
    },
    {
      id: "pay_rate",
      name: "支付率",
      category: "转化",
      short: "支付人数占上游人群的比例",
      formula: "支付人数 ÷ 上游人数（通常为加微或到场）",
      numerator: "支付人数",
      denominator: "加微或到场人数",
      scope: "受当前分析维度影响",
      dedupe: "按用户去重",
      refund: "不因退款改写支付率分子",
      caliber: "可归因视角常用",
      update: "随支付成功",
      note: "缺分母或不可计算时展示「—」。"
    },
    {
      id: "full_orders",
      name: "全量订单数",
      category: "转化",
      short: "统计期内全部支付成功订单数",
      formula: "COUNT(支付成功订单)",
      numerator: "支付成功订单",
      denominator: "—",
      scope: "日期 + 成交类型；不受获客渠道",
      dedupe: "按订单",
      refund: "退款订单仍计入历史支付订单，退款单独统计",
      caliber: "全量成交",
      update: "随支付事件",
      note: "与可归因订单分区展示。"
    },
    {
      id: "full_gmv",
      name: "全量成交GMV",
      category: "转化",
      short: "统计期内全部订单实收金额合计",
      formula: "SUM(订单实收金额)",
      numerator: "实收金额",
      denominator: "—",
      scope: "日期 + 成交类型",
      dedupe: "按订单汇总",
      refund: "GMV 为支付口径；退款金额单独展示",
      caliber: "全量成交",
      update: "随支付事件",
      note: "缺映射时不把可归因金额回填为 0。"
    },
    {
      id: "attr_orders",
      name: "归因订单数",
      category: "转化",
      short: "能关联到筛选范围内线索/渠道/期次的支付订单",
      formula: "COUNT(可归因支付订单)",
      numerator: "可归因订单",
      denominator: "—",
      scope: "日期 / 渠道 / 期次",
      dedupe: "按订单",
      refund: "可归因退款单独展示",
      caliber: "归因成交",
      update: "依赖归因映射",
      note: "缺映射显示「—」，不回退全量。"
    },
    {
      id: "attr_gmv",
      name: "归因成交GMV",
      category: "转化",
      short: "可归因订单实收金额合计",
      formula: "SUM(可归因订单实收)",
      numerator: "可归因实收",
      denominator: "—",
      scope: "日期 / 渠道 / 期次",
      dedupe: "按订单汇总",
      refund: "可归因退款单独展示",
      caliber: "归因成交",
      update: "依赖归因映射",
      note: "与全量 GMV 不可混加。"
    },
    {
      id: "aov",
      name: "客单价",
      category: "转化",
      short: "成交金额 ÷ 订单数",
      formula: "GMV ÷ 订单数",
      numerator: "GMV",
      denominator: "订单数",
      scope: "随所属分区（全量或可归因）",
      dedupe: "—",
      refund: "按支付口径 GMV 计算",
      caliber: "分区跟随",
      update: "随订单",
      note: "订单数为 0 或金额缺失时展示「—」。"
    },
    {
      id: "refund_amount",
      name: "退款金额",
      category: "售后",
      short: "统计期内退款成功金额",
      formula: "SUM(退款金额)",
      numerator: "退款金额",
      denominator: "—",
      scope: "全量或可归因分区各自统计",
      dedupe: "按退款单",
      refund: "本指标即为退款",
      caliber: "售后",
      update: "随退款完成",
      note: "可归因退款缺映射时显示「—」。"
    },
    {
      id: "refund_rate",
      name: "退款率",
      category: "售后",
      short: "退款金额占对应支付金额的比例",
      formula: "退款金额 ÷ 支付金额",
      numerator: "退款金额",
      denominator: "支付金额（同口径）",
      scope: "全量或可归因各自计算",
      dedupe: "—",
      refund: "分子为退款",
      caliber: "售后",
      update: "随退款完成",
      note: "分母缺失时展示「—」。"
    },
    {
      id: "attr_cover",
      name: "归因覆盖率",
      category: "转化",
      short: "可归因订单占全量支付订单的比例",
      formula: "可归因订单数 ÷ 全量订单数",
      numerator: "可归因订单",
      denominator: "全量订单",
      scope: "日期为主；渠道/期次影响分子",
      dedupe: "按订单",
      refund: "不混入退款单",
      caliber: "归因质量",
      update: "依赖归因映射完整度",
      note: "未归因订单计入全量区，明确展示，不悄悄排除。"
    }
  ];

  var PAGE_METRIC_IDS = {
    overview: ["pool", "wecom", "wecom_rate", "attend", "pay_users", "pay_rate", "full_gmv", "refund_rate"],
    acquire: ["pool", "valid_leads", "valid_rate", "wecom", "wecom_rate", "attend_rate", "pay_rate", "attr_gmv"],
    private: ["pool", "assign_timely", "wecom", "wecom_rate", "cover_rate", "pay_users"],
    live: ["attend", "attend_rate", "watch", "watch_rate", "pay_users", "pay_rate"],
    convert: ["pay_users", "pay_rate", "full_orders", "full_gmv", "attr_orders", "attr_gmv", "aov", "refund_amount", "refund_rate", "attr_cover"]
  };

  function getAll() { return METRICS.slice(); }

  var ID_ALIASES = {
    attend: "attend_rate",
    pay: "pay_users",
    gmv: "full_gmv",
    refund: "refund_rate",
    wecom: "wecom"
  };

  function getById(id) {
    if (!id) return null;
    if (ID_ALIASES[id]) {
      var aliased = METRICS.find(function (m) { return m.id === ID_ALIASES[id]; });
      if (aliased) return aliased;
    }
    return METRICS.find(function (m) { return m.id === id; }) || null;
  }

  function search(q) {
    q = String(q || "").trim().toLowerCase();
    if (!q) return getAll();
    return METRICS.filter(function (m) {
      return [m.name, m.short, m.formula, m.category, m.note].join(" ").toLowerCase().indexOf(q) >= 0;
    });
  }

  function byCategory(cat) {
    if (!cat) return getAll();
    return METRICS.filter(function (m) { return m.category === cat; });
  }

  function forPage(pageKey) {
    var ids = PAGE_METRIC_IDS[pageKey] || [];
    return ids.map(getById).filter(Boolean);
  }

  function categories() {
    var seen = {};
    var out = [];
    METRICS.forEach(function (m) {
      if (!seen[m.category]) {
        seen[m.category] = true;
        out.push(m.category);
      }
    });
    return out;
  }

  global.BoardDictionary = {
    METRICS: METRICS,
    PAGE_METRIC_IDS: PAGE_METRIC_IDS,
    getAll: getAll,
    getById: getById,
    search: search,
    byCategory: byCategory,
    forPage: forPage,
    categories: categories
  };
})(window);
