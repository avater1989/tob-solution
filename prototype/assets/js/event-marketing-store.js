/**
 * 用户事件营销 — 数据源（二期）
 * 「事件 → 流程」：用户发生某个事件时，自动执行一条营销流程。
 * 演示数据落 localStorage（KEY mk_event_marketing_v1）；流程节点落 LogicFlow 图数据。
 */
(function (global) {
  var KEY = "mk_event_marketing_v1";

  /* 触发事件目录：按当前商家后台的业务域划分（微信生态口径） */
  var EVENT_CATALOG = [
    {
      group: "用户关系事件",
      events: [
        { id: "EV-MP-VISIT", name: "访问小程序" },
        { id: "EV-GOODS-VIEW", name: "浏览商品" },
        { id: "EV-GOODS-FAV", name: "收藏商品" },
        { id: "EV-GOODS-CART", name: "加购商品" },
        { id: "EV-CH-FOLLOW", name: "关注视频号" }
      ]
    },
    {
      group: "交易相关事件",
      events: [
        { id: "EV-ORDER", name: "下单购买" },
        { id: "EV-PAID", name: "支付成功" },
        { id: "EV-REFUND-APPLY", name: "申请退款" },
        { id: "EV-REFUND-OK", name: "退款成功" },
        { id: "EV-ORDER-DONE", name: "订单完成" }
      ]
    },
    {
      group: "内容学习事件",
      events: [
        { id: "EV-CLAIM-COURSE", name: "领取课程" },
        { id: "EV-LEARN-START", name: "开始学习" },
        { id: "EV-COURSE-DONE", name: "完成课程" },
        { id: "EV-LIVE-WATCH", name: "观看直播" },
        { id: "EV-OFFLINE-SIGN", name: "报名线下课" }
      ]
    },
    {
      group: "用户权益事件",
      events: [
        { id: "EV-WECOM-ADD", name: "添加企微" },
        { id: "EV-PACK-CLAIM", name: "领取资料" },
        { id: "EV-TAG-CHANGE", name: "用户标签变更" },
        { id: "EV-POINT-CHANGE", name: "积分变更" }
      ]
    },
    {
      group: "营销触达事件",
      events: [
        { id: "EV-SMS-TOUCH", name: "短信触达" },
        { id: "EV-WECOM-TOUCH", name: "企微触达" },
        { id: "EV-INBOX-TOUCH", name: "站内信触达" },
        { id: "EV-COUPON-GET", name: "优惠券领取" }
      ]
    }
  ];

  var TRIGGER_TYPES = ["主动触发", "特殊日期触发"];

  var STATUS = { designing: "设计中", running: "运行中", ended: "已结束" };

  /* 节点定义：type → 面板/画布/文案。shape 取 LogicFlow 内置节点（形状决定配色） */
  var NODE_DEFS = [
    { type: "start", label: "开始", shape: "circle", dot: "c-start", group: "流程控制" },
    { type: "end", label: "结束", shape: "circle", dot: "c-end", group: "流程控制" },
    { type: "wait", label: "流程等待", shape: "ellipse", dot: "c-wait", group: "流程控制" },
    { type: "sms", label: "发送短信", shape: "rect", dot: "c-touch", group: "触达方式" },
    { type: "wecom", label: "企微消息", shape: "rect", dot: "c-touch", group: "触达方式" },
    { type: "profile", label: "变更用户属性", shape: "rect", dot: "c-action", group: "用户运营" },
    { type: "tag", label: "打标签", shape: "rect", dot: "c-action", group: "用户运营" },
    { type: "cond-user", label: "用户属性判断", shape: "diamond", dot: "c-cond", group: "条件判断" },
    { type: "cond-trade", label: "交易属性判断", shape: "diamond", dot: "c-cond", group: "条件判断" },
    { type: "cond-social", label: "社交属性判断", shape: "diamond", dot: "c-cond", group: "条件判断" },
    { type: "cond-prefer", label: "偏好属性判断", shape: "diamond", dot: "c-cond", group: "条件判断" }
  ];

  function defOf(type) {
    return NODE_DEFS.filter(function (d) { return d.type === type; })[0] || null;
  }
  function isCondition(type) {
    return /^cond-/.test(type);
  }
  function eventName(id) {
    var out = id;
    EVENT_CATALOG.forEach(function (g) {
      g.events.forEach(function (e) { if (e.id === id) out = e.name; });
    });
    return out;
  }

  /* ---------------- 节点文案 ---------------- */
  function nodeText(type, p) {
    p = p || {};
    switch (type) {
      case "start": return "开始" + (p.eventName ? "：" + p.eventName : "");
      case "end": return "结束";
      case "wait": return "等待 " + (p.waitLabel || "24 小时");
      case "sms": return "发送短信" + (p.summary ? "：" + p.summary : "");
      case "wecom": return "企微消息" + (p.summary ? "：" + p.summary : "");
      case "profile": return "变更用户属性" + (p.summary ? "：" + p.summary : "");
      case "tag": return "打标签" + (p.tags && p.tags.length ? "：" + p.tags.join("/") : "");
      default:
        if (isCondition(type)) return "判断：" + (p.summary || "未配置条件");
        return defOf(type) ? defOf(type).label : type;
    }
  }

  /* ---------------- 演示数据 ---------------- */
  var SEED_EVENTS = [
    { id: "200101", name: "添加企微 7 天未购买课程", type: "主动触发", createdAt: "2026-09-20 12:20", status: "running" },
    { id: "200102", name: "用户生日自动营销事件", type: "特殊日期触发", createdAt: "2026-09-20 12:20", status: "running" },
    { id: "200103", name: "观看直播未下单跟进", type: "主动触发", createdAt: "2026-09-20 12:20", status: "designing" },
    { id: "200104", name: "领取资料 3 天未加企微", type: "主动触发", createdAt: "2026-09-20 12:20", status: "running" },
    { id: "200105", name: "完课后 30 天未复购", type: "主动触发", createdAt: "2026-09-20 12:20", status: "ended" }
  ];

  /* 演示流程：与参考原型同构（开始 → 判断 → 触达 / 打标签 → 结束） */
  var SEED_FLOWS = {
    "200101": {
      nodes: [
        { id: "n1", type: "start", x: 120, y: 221, props: { eventId: "EV-WECOM-ADD", eventName: "添加企微" } },
        { id: "n2", type: "cond-trade", x: 269, y: 221, props: { summary: "是否已购课", yes: "Y", no: "N" } },
        { id: "n3", type: "end", x: 442, y: 134, props: {} },
        { id: "n4", type: "wait", x: 442, y: 264, props: { waitLabel: "7 天" } },
        { id: "n5", type: "cond-trade", x: 591, y: 264, props: { summary: "是否仍无下单行为", yes: "Y", no: "N" } },
        { id: "n6", type: "sms", x: 740, y: 192, props: { summary: "满 200 减 50 优惠券", couponId: "CP02" } },
        { id: "n7", type: "tag", x: 740, y: 350, props: { tags: ["高价值客户"] } },
        { id: "n8", type: "end", x: 901, y: 264, props: {} },
        { id: "n9", type: "wecom", x: 591, y: 408, props: { summary: "推送入门课试听" } }
      ],
      edges: [
        { id: "e1", source: "n1", target: "n2", text: "" },
        { id: "e2", source: "n2", target: "n3", text: "Y" },
        { id: "e3", source: "n2", target: "n4", text: "N" },
        { id: "e4", source: "n4", target: "n5", text: "" },
        { id: "e5", source: "n5", target: "n6", text: "Y" },
        { id: "e6", source: "n5", target: "n7", text: "N" },
        { id: "e7", source: "n6", target: "n8", text: "" },
        { id: "e8", source: "n7", target: "n8", text: "" },
        { id: "e9", source: "n5", target: "n9", text: "N2" }
      ]
    },
    "200102": {
      nodes: [
        { id: "m1", type: "start", x: 132, y: 192, props: { eventId: "SPECIAL-BIRTHDAY", eventName: "用户生日" } },
        { id: "m2", type: "tag", x: 281, y: 192, props: { tags: ["复购意向"] } },
        { id: "m3", type: "sms", x: 430, y: 192, props: { summary: "生日祝福 + 满 199 减 10 券", couponId: "CP02" } },
        { id: "m4", type: "end", x: 579, y: 192, props: {} }
      ],
      edges: [
        { id: "me1", source: "m1", target: "m2", text: "" },
        { id: "me2", source: "m2", target: "m3", text: "" },
        { id: "me3", source: "m3", target: "m4", text: "" }
      ]
    },
    "200103": {
      nodes: [
        { id: "l1", type: "start", x: 132, y: 192, props: { eventId: "EV-LIVE-WATCH", eventName: "观看直播" } },
        { id: "l2", type: "cond-trade", x: 294, y: 192, props: { summary: "是否已下单", yes: "Y", no: "N" } },
        { id: "l3", type: "end", x: 455, y: 120, props: {} },
        { id: "l4", type: "wecom", x: 455, y: 271, props: { summary: "推送直播回放 + 老师 1v1" } }
      ],
      edges: [
        { id: "le1", source: "l1", target: "l2", text: "" },
        { id: "le2", source: "l2", target: "l3", text: "Y" },
        { id: "le3", source: "l2", target: "l4", text: "N" }
      ]
    },
    "200104": {
      nodes: [
        { id: "p1", type: "start", x: 132, y: 206, props: { eventId: "EV-PACK-CLAIM", eventName: "领取资料" } },
        { id: "p2", type: "wait", x: 281, y: 206, props: { waitLabel: "3 天" } },
        { id: "p3", type: "cond-social", x: 430, y: 206, props: { summary: "是否已添加企微", yes: "Y", no: "N" } },
        { id: "p4", type: "end", x: 591, y: 134, props: {} },
        { id: "p5", type: "wecom", x: 591, y: 286, props: { summary: "老师名片 + 引导加微" } }
      ],
      edges: [
        { id: "pe1", source: "p1", target: "p2", text: "" },
        { id: "pe2", source: "p2", target: "p3", text: "" },
        { id: "pe3", source: "p3", target: "p4", text: "Y" },
        { id: "pe4", source: "p3", target: "p5", text: "N" }
      ]
    },
    "200105": {
      nodes: [
        { id: "f1", type: "start", x: 132, y: 192, props: { eventId: "EV-COURSE-DONE", eventName: "完成课程" } },
        { id: "f2", type: "wait", x: 281, y: 192, props: { waitLabel: "30 天" } },
        { id: "f3", type: "profile", x: 430, y: 192, props: { summary: "标记「待复购」" } },
        { id: "f4", type: "end", x: 579, y: 192, props: {} }
      ],
      edges: [
        { id: "fe1", source: "f1", target: "f2", text: "" },
        { id: "fe2", source: "f2", target: "f3", text: "" },
        { id: "fe3", source: "f3", target: "f4", text: "" }
      ]
    }
  };

  /* ---------------- 读写 ---------------- */
  var cache = null;
  function defaultDb() {
    return { events: JSON.parse(JSON.stringify(SEED_EVENTS)), flows: JSON.parse(JSON.stringify(SEED_FLOWS)) };
  }
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && Array.isArray(d.events)) return d;
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
    return all().events.filter(function (e) {
      if (opts.status && e.status !== opts.status) return false;
      if (opts.type && e.type !== opts.type) return false;
      if (opts.keyword && e.name.indexOf(opts.keyword) < 0 && String(e.id).indexOf(opts.keyword) < 0) return false;
      return true;
    }).slice();
  }
  function get(id) {
    return all().events.filter(function (e) { return e.id === id; })[0] || null;
  }
  function nextId() {
    var max = 200100;
    all().events.forEach(function (e) {
      var n = parseInt(e.id, 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return String(max + 1);
  }
  function save(payload) {
    var events = all().events;
    var idx = -1;
    events.forEach(function (e, i) { if (e.id === payload.id) idx = i; });
    if (idx >= 0) events[idx] = Object.assign({}, events[idx], payload);
    else events.push(Object.assign({ id: payload.id || nextId(), createdAt: global.MarketingCommon.nowText() }, payload));
    write();
    return get(payload.id);
  }
  function remove(id) {
    var db = all();
    db.events = db.events.filter(function (e) { return e.id !== id; });
    delete db.flows[id];
    write();
  }
  function duplicate(id) {
    var src = get(id);
    if (!src) return null;
    var nid = nextId();
    save({ id: nid, name: src.name + "（副本）", type: src.type, status: "designing" });
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
  function nodeCount(id) {
    return (getFlow(id).nodes || []).length;
  }

  /* ---------------- LogicFlow 互转 ---------------- */
  function toLogicFlowData(flow) {
    flow = flow || { nodes: [], edges: [] };
    return {
      nodes: (flow.nodes || []).map(function (n) {
        var d = defOf(n.type);
        return {
          id: n.id,
          type: d ? d.shape : "rect",
          x: n.x, y: n.y,
          text: nodeText(n.type, n.props),
          properties: { bizType: n.type, props: n.props || {} }
        };
      }),
      edges: (flow.edges || []).map(function (e) {
        return {
          id: e.id, type: "polyline",
          sourceNodeId: e.source, targetNodeId: e.target,
          text: e.text || ""
        };
      })
    };
  }
  function fromLogicFlowData(flow, raw) {
    var out = { nodes: [], edges: [] };
    (raw.nodes || []).forEach(function (n) {
      var p = n.properties || {};
      var type = p.bizType || "rect";
      out.nodes.push({ id: n.id, type: type, x: Math.round(n.x), y: Math.round(n.y), props: p.props || {} });
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
    if (!nodes.some(function (n) { return n.type === "start"; })) issues.push("缺少「开始」节点");
    if (!nodes.some(function (n) { return n.type === "end"; })) issues.push("缺少「结束」节点");
    nodes.forEach(function (n) {
      if (isCondition(n.type) && !(n.props && n.props.summary)) issues.push("存在未配置条件的判断节点");
      if ((n.type === "sms" || n.type === "wecom") && !(n.props && n.props.summary)) issues.push("存在未配置内容的触达节点");
    });
    return issues;
  }

  global.EventMarketingStore = {
    KEY: KEY,
    EVENT_CATALOG: EVENT_CATALOG,
    TRIGGER_TYPES: TRIGGER_TYPES,
    STATUS: STATUS,
    NODE_DEFS: NODE_DEFS,
    defOf: defOf,
    isCondition: isCondition,
    eventName: eventName,
    nodeText: nodeText,
    list: list,
    get: get,
    nextId: nextId,
    save: save,
    remove: remove,
    duplicate: duplicate,
    getFlow: getFlow,
    saveFlow: saveFlow,
    nodeCount: nodeCount,
    toLogicFlowData: toLogicFlowData,
    fromLogicFlowData: fromLogicFlowData,
    validateFlow: validateFlow,
    reset: reset
  };
})(window);
