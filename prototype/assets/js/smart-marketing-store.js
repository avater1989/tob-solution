/**
 * 智能营销 — 数据源（二期）
 * 「人群 → 处理 → 触达 → 响应 / 分析」：按流程编排对目标人群自动执行营销，
 * 与「用户事件营销」的区别是：事件营销由用户事件触发，智能营销按计划与人群主动执行。
 * 演示数据落 localStorage（KEY mk_smart_marketing_v1）。
 */
(function (global) {
  var KEY = "mk_smart_marketing_v1";

  var STATUS = { designing: "设计中", running: "运行中", ended: "已结束" };
  var RUN_MODES = ["立即运行", "固定时段运行"];

  /* 节点定义：type → 面板/画布/文案 */
  var NODE_DEFS = [
    { type: "wait", label: "等待", shape: "ellipse", dot: "c-wait", group: "执行方式" },
    { type: "audience", label: "人群筛选", shape: "circle", dot: "c-audience", group: "目标客户" },
    { type: "numbers", label: "指定用户", shape: "circle", dot: "c-audience", group: "目标客户" },
    { type: "merge", label: "合并", shape: "rect", dot: "c-process", group: "人群处理" },
    { type: "extract", label: "抽取", shape: "rect", dot: "c-process", group: "人群处理" },
    { type: "intersect", label: "交集", shape: "rect", dot: "c-process", group: "人群处理" },
    { type: "exclude", label: "排除", shape: "rect", dot: "c-process", group: "人群处理" },
    { type: "dedup", label: "排重", shape: "rect", dot: "c-process", group: "人群处理" },
    { type: "sms", label: "短信", shape: "rect", dot: "c-touch", group: "触达方式" },
    { type: "wecom", label: "企微消息", shape: "rect", dot: "c-touch", group: "触达方式" },
    { type: "response", label: "营销响应", shape: "ellipse", dot: "c-wait", group: "响应客户" },
    { type: "analyze", label: "短信分析", shape: "ellipse", dot: "c-analyze", group: "营销分析" }
  ];

  function defOf(type) {
    return NODE_DEFS.filter(function (d) { return d.type === type; })[0] || null;
  }

  function nodeText(type, p) {
    p = p || {};
    switch (type) {
      case "wait": return "等待 " + (p.waitLabel || "24 小时");
      case "audience": return "人群筛选" + (p.segmentName ? "：" + p.segmentName : "");
      case "numbers": return "指定用户" + (p.fileName ? "：" + p.fileName : "");
      case "merge": return "合并" + (p.summary ? "：" + p.summary : "");
      case "extract": return "抽取" + (p.summary ? "：" + p.summary : "");
      case "intersect": return "交集" + (p.summary ? "：" + p.summary : "");
      case "exclude": return "排除" + (p.summary ? "：" + p.summary : "");
      case "dedup": return "排重" + (p.summary ? "：" + p.summary : "");
      case "sms": return "短信" + (p.summary ? "：" + p.summary : "");
      case "wecom": return "企微消息" + (p.summary ? "：" + p.summary : "");
      case "response": return "营销响应" + (p.summary ? "：" + p.summary : "");
      case "analyze": return "短信分析" + (p.summary ? "：" + p.summary : "");
      default: return defOf(type) ? defOf(type).label : type;
    }
  }

  /* ---------------- 效果汇总（近 7 / 15 / 30 天） ---------------- */
  var SUMMARY = {
    d7: { label: "近7天", roi: "1 : 66.66", reach: 10000, payAmount: 1000000, payOrders: 1000, payUsers: 1000, visit: 5000, fav: 4000, coupon: 4000 },
    d15: { label: "近15天", roi: "1 : 58.20", reach: 18400, payAmount: 1730000, payOrders: 1790, payUsers: 1720, visit: 9100, fav: 7300, coupon: 8100 },
    d30: { label: "近30天", roi: "1 : 51.08", reach: 32600, payAmount: 2980000, payOrders: 3120, payUsers: 2960, visit: 16200, fav: 12800, coupon: 15300 }
  };

  /* ---------------- 演示计划 ---------------- */
  var SEED_PLANS = [
    { id: "200101", name: "加微未购课用户 7 天唤醒", runMode: "立即运行", startedAt: "2026-09-20 12:20", status: "running" },
    { id: "200102", name: "直播到场未付款用户召回", runMode: "立即运行", startedAt: "2026-09-20 12:20", status: "running" },
    { id: "200103", name: "资料领取用户促加企微", runMode: "立即运行", startedAt: "2026-09-20 12:20", status: "designing" },
    { id: "200104", name: "完课用户复购计划", runMode: "固定时段运行", startedAt: "2026-09-20 12:20", status: "running" },
    { id: "200105", name: "沉睡 30 天用户召回", runMode: "固定时段运行", startedAt: "2026-09-20 12:20", status: "ended" }
  ];

  /* 演示流程：人群 → 排重 → 触达 → 分析（与参考原型同构） */
  var SEED_FLOWS = {
    "200101": {
      nodes: [
        { id: "s1", type: "audience", x: 134, y: 182, props: { segmentId: "S1", segmentName: "加微未购课用户" } },
        { id: "s2", type: "numbers", x: 134, y: 323, props: { fileName: "线下引流名单 202609.xlsx" } },
        { id: "s3", type: "merge", x: 310, y: 253, props: { summary: "合并 2 个人群" } },
        { id: "s4", type: "dedup", x: 474, y: 253, props: { summary: "按近 30 天已触达排重" } },
        { id: "s5", type: "wait", x: 637, y: 253, props: { waitLabel: "1 天" } },
        { id: "s6", type: "sms", x: 800, y: 182, props: { summary: "唤醒文案 + 满 199 减 10 券", couponId: "CP02" } },
        { id: "s7", type: "wecom", x: 800, y: 323, props: { summary: "老师 1v1 跟进" } },
        { id: "s8", type: "analyze", x: 977, y: 182, props: { summary: "营销后 3 天成交分析" } },
        { id: "s9", type: "response", x: 977, y: 323, props: { summary: "有访问 / 拍下未付款" } }
      ],
      edges: [
        { id: "se1", source: "s1", target: "s3", text: "" },
        { id: "se2", source: "s2", target: "s3", text: "" },
        { id: "se3", source: "s3", target: "s4", text: "" },
        { id: "se4", source: "s4", target: "s5", text: "" },
        { id: "se5", source: "s5", target: "s6", text: "A" },
        { id: "se6", source: "s5", target: "s7", text: "B" },
        { id: "se7", source: "s6", target: "s8", text: "" },
        { id: "se8", source: "s7", target: "s9", text: "" }
      ]
    },
    "200102": {
      nodes: [
        { id: "t1", type: "audience", x: 140, y: 198, props: { segmentId: "S3", segmentName: "直播预约未到课用户" } },
        { id: "t2", type: "exclude", x: 310, y: 198, props: { summary: "排除近 7 天已下单" } },
        { id: "t3", type: "sms", x: 480, y: 198, props: { summary: "直播回放 + 老师答疑" } },
        { id: "t4", type: "analyze", x: 650, y: 198, props: { summary: "营销后 7 天成交分析" } }
      ],
      edges: [
        { id: "te1", source: "t1", target: "t2", text: "" },
        { id: "te2", source: "t2", target: "t3", text: "" },
        { id: "te3", source: "t3", target: "t4", text: "" }
      ]
    },
    "200103": {
      nodes: [
        { id: "u1", type: "audience", x: 140, y: 198, props: { segmentId: "S5", segmentName: "沉睡用户（30 天未互动）" } },
        { id: "u2", type: "extract", x: 310, y: 198, props: { summary: "按比例抽取 30%" } },
        { id: "u3", type: "wecom", x: 480, y: 198, props: { summary: "企微 1v1 唤醒" } }
      ],
      edges: [
        { id: "ue1", source: "u1", target: "u2", text: "" },
        { id: "ue2", source: "u2", target: "u3", text: "" }
      ]
    },
    "200104": {
      nodes: [
        { id: "v1", type: "audience", x: 140, y: 182, props: { segmentId: "S6", segmentName: "20 年 618 购买电器类目人群" } },
        { id: "v2", type: "audience", x: 140, y: 323, props: { segmentId: "S7", segmentName: "19 年双十一购买电器类目人群" } },
        { id: "v3", type: "intersect", x: 324, y: 253, props: { summary: "两群交集" } },
        { id: "v4", type: "sms", x: 501, y: 253, props: { summary: "复购专享券" } },
        { id: "v5", type: "analyze", x: 678, y: 253, props: { summary: "营销后 3 天成交分析" } }
      ],
      edges: [
        { id: "ve1", source: "v1", target: "v3", text: "" },
        { id: "ve2", source: "v2", target: "v3", text: "" },
        { id: "ve3", source: "v3", target: "v4", text: "" },
        { id: "ve4", source: "v4", target: "v5", text: "" }
      ]
    },
    "200105": {
      nodes: [
        { id: "w1", type: "audience", x: 140, y: 198, props: { segmentId: "S2", segmentName: "家长必修课未购买者" } },
        { id: "w2", type: "dedup", x: 310, y: 198, props: { summary: "与本计划历史触达排重" } },
        { id: "w3", type: "response", x: 487, y: 198, props: { summary: "有访问 / 已付款" } }
      ],
      edges: [
        { id: "we1", source: "w1", target: "w2", text: "" },
        { id: "we2", source: "w2", target: "w3", text: "" }
      ]
    }
  };

  /* ---------------- 读写 ---------------- */
  var cache = null;
  function defaultDb() {
    return { plans: JSON.parse(JSON.stringify(SEED_PLANS)), flows: JSON.parse(JSON.stringify(SEED_FLOWS)) };
  }
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && Array.isArray(d.plans)) return d;
      }
    } catch (e) {}
    return defaultDb();
  }
  function all() {
    if (!cache) cache = read();
    return cache;
  }
  function write() {
    try { localStorage.setItem(KEY, JSON.stringify(all())); } catch (e) {}
  }
  function reset() {
    cache = defaultDb();
    write();
  }

  function list(opts) {
    opts = opts || {};
    return all().plans.filter(function (p) {
      if (opts.status && p.status !== opts.status) return false;
      if (opts.runMode && p.runMode !== opts.runMode) return false;
      if (opts.keyword && p.name.indexOf(opts.keyword) < 0 && String(p.id).indexOf(opts.keyword) < 0) return false;
      return true;
    }).slice();
  }
  function get(id) {
    return all().plans.filter(function (p) { return p.id === id; })[0] || null;
  }
  function nextId() {
    var max = 200100;
    all().plans.forEach(function (p) {
      var n = parseInt(p.id, 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return String(max + 1);
  }
  function save(payload) {
    var plans = all().plans;
    var idx = -1;
    plans.forEach(function (p, i) { if (p.id === payload.id) idx = i; });
    if (idx >= 0) plans[idx] = Object.assign({}, plans[idx], payload);
    else plans.push(Object.assign({ id: payload.id || nextId(), startedAt: global.MarketingCommon.nowText() }, payload));
    write();
    return get(payload.id);
  }
  function remove(id) {
    var db = all();
    db.plans = db.plans.filter(function (p) { return p.id !== id; });
    delete db.flows[id];
    write();
  }
  function duplicate(id) {
    var src = get(id);
    if (!src) return null;
    var nid = nextId();
    save({ id: nid, name: src.name + "（副本）", runMode: src.runMode, status: "designing" });
    var db = all();
    if (db.flows[id]) db.flows[nid] = JSON.parse(JSON.stringify(db.flows[id]));
    write();
    return nid;
  }

  function getFlow(id) {
    var f = all().flows[id];
    if (f) return JSON.parse(JSON.stringify(f));
    return { nodes: [], edges: [] };
  }
  function saveFlow(id, flow) {
    var db = all();
    db.flows[id] = JSON.parse(JSON.stringify(flow));
    write();
  }

  function toLogicFlowData(flow) {
    flow = flow || { nodes: [], edges: [] };
    return {
      nodes: (flow.nodes || []).map(function (n) {
        var d = defOf(n.type);
        return {
          id: n.id, type: d ? d.shape : "rect", x: n.x, y: n.y,
          text: nodeText(n.type, n.props),
          properties: { bizType: n.type, props: n.props || {} }
        };
      }),
      edges: (flow.edges || []).map(function (e) {
        return { id: e.id, type: "polyline", sourceNodeId: e.source, targetNodeId: e.target, text: e.text || "" };
      })
    };
  }
  function fromLogicFlowData(flow, raw) {
    var out = { nodes: [], edges: [] };
    (raw.nodes || []).forEach(function (n) {
      var p = n.properties || {};
      out.nodes.push({ id: n.id, type: p.bizType || "rect", x: Math.round(n.x), y: Math.round(n.y), props: p.props || {} });
    });
    (raw.edges || []).forEach(function (e) {
      var txt = "";
      if (e.text && typeof e.text === "object") txt = e.text.value || "";
      else if (typeof e.text === "string") txt = e.text;
      out.edges.push({ id: e.id, source: e.sourceNodeId, target: e.targetNodeId, text: txt });
    });
    return out;
  }

  function validateFlow(flow) {
    var issues = [];
    var nodes = (flow && flow.nodes) || [];
    if (!nodes.length) issues.push("流程为空，请先从左侧添加节点");
    if (!nodes.some(function (n) { return n.type === "audience" || n.type === "numbers"; })) {
      issues.push("缺少「人群筛选」或「指定用户」节点");
    }
    if (!nodes.some(function (n) { return n.type === "sms" || n.type === "wecom"; })) {
      issues.push("缺少触达节点");
    }
    return issues;
  }

  /* 汇总卡按时间范围取数 */
  function summary(range) {
    return SUMMARY[range] || SUMMARY.d7;
  }

  global.SmartMarketingStore = {
    KEY: KEY,
    STATUS: STATUS,
    RUN_MODES: RUN_MODES,
    NODE_DEFS: NODE_DEFS,
    SUMMARY: SUMMARY,
    defOf: defOf,
    nodeText: nodeText,
    summary: summary,
    list: list,
    get: get,
    nextId: nextId,
    save: save,
    remove: remove,
    duplicate: duplicate,
    getFlow: getFlow,
    saveFlow: saveFlow,
    toLogicFlowData: toLogicFlowData,
    fromLogicFlowData: fromLogicFlowData,
    validateFlow: validateFlow,
    reset: reset
  };
})(window);
