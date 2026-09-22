/* 上架位 Listing Store（商家端 / 运营端 / C 端）
 * 内容（无价）上架到小程序模块时承载的售卖策略：免费/付费 → 试看范围 → 下单方式 → 默认成交商品
 * 同一内容可多次上架（listing_id 唯一），每次可指定不同成交商品
 *
 * 概念分工（消除试看双源）：
 *   chapter.free      = 内容结构属性，作者声明「哪几节允许被试看」
 *   listing.trial_scope = 售卖策略，本次上架实际开放多少试看，不得超出 chapter.free 范围
 */
(function (global) {
  var KEY = "tob_listing_v1";
  var SCHEMA = 1;

  var PAY_MODE_LABEL = { free: "免费", paid: "付费" };
  var ORDER_MODE_LABEL = { jump_goods: "跳转商品详情页", inline: "不跳转 · 按商品金额直接下单" };
  var TRIAL_MODE_LABEL = { none: "不提供试看", first_n: "前 N 节免费试看", min3: "每节前 3 分钟试看" };
  var STATUS_LABEL = { draft: "草稿", active: "已上架", offline: "已下架" };
  var SLOT_LABEL = { banner: "Banner", live: "直播", online: "线上课", offline: "线下课", article: "精选文章" };

  /* 非线上课类内容的兜底登记表（线上课以 CourseStore 为准） */
  var CONTENT_FALLBACK = {
    O001: { type: "offline", name: "卓越家族培养计划 · 线下工作坊", status: "enabled" },
    O002: { type: "offline", name: "亲子沟通实战 · 线下沙龙", status: "enabled" },
    O003: { type: "offline", name: "学习习惯养成 · 线下营（筹备中）", status: "draft" },
    A001: { type: "article", name: "9 月新学期家长指南", status: "enabled" },
    A002: { type: "article", name: "孩子注意力训练方法论", status: "enabled" },
    A004: { type: "article", name: "亲子沟通的三个黄金句式", status: "enabled" },
    A005: { type: "article", name: "青春期边界：爱与规则怎么并存", status: "enabled" },
    PL001: { type: "plan", name: "亲子沟通 21 天定制化计划 · 第 4 期", status: "enabled" },
    PL002: { type: "plan", name: "开学季学习习惯养成计划", status: "enabled" },
    L001: { type: "live", name: "春启 03 期家长公开课", status: "enabled" },
    L002: { type: "live", name: "午间答疑 · 付费直播", status: "enabled" },
    L003: { type: "live", name: "写作业不吼不叫 · 方法拆解", status: "enabled" },
    L004: { type: "live", name: "亲子沟通 21 天训练营 · 第 4 期", status: "enabled" }
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  var SEQ = 0;
  function nextId() {
    SEQ += 1;
    return "L" + Date.now().toString(36).toUpperCase() + "-" + SEQ;
  }

  function nowStr() {
    var d = new Date();
    var p = function (n) { return n < 10 ? "0" + n : String(n); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
      " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  /* ---------- 内容解析 ---------- */

  function resolveContent(contentType, contentId) {
    if (!contentId) return null;
    if (contentType === "online_course" && global.CourseStore) {
      var c = global.CourseStore.get(contentId);
      if (c) {
        return {
          id: c.id,
          type: "online_course",
          name: c.name,
          status: c.status,
          source: c.source,
          chapters: (c.chapters || []).map(function (ch) {
            return { id: ch.id, title: ch.title, free: ch.free === true };
          })
        };
      }
    }
    var f = CONTENT_FALLBACK[contentId];
    if (f) {
      return { id: contentId, type: f.type, name: f.name, status: f.status, source: "self", chapters: [] };
    }
    return null;
  }

  /** 内容中被声明为「允许试看」的节数 */
  function trialableCount(contentType, contentId) {
    var c = resolveContent(contentType, contentId);
    if (!c || !c.chapters) return 0;
    return c.chapters.filter(function (ch) { return ch.free; }).length;
  }

  /** 某内容类型下的可选内容（线上课读 CourseStore，其余读兜底登记表） */
  function contentOptions(contentType) {
    if (contentType === "online_course" && global.CourseStore) {
      return global.CourseStore.list().map(function (c) {
        return { id: c.id, name: c.name, status: c.status, source: c.source, type: "online_course" };
      });
    }
    return Object.keys(CONTENT_FALLBACK)
      .filter(function (k) { return CONTENT_FALLBACK[k].type === contentType; })
      .map(function (k) {
        var f = CONTENT_FALLBACK[k];
        return { id: k, name: f.name, status: f.status, source: f.source || "self", type: f.type };
      });
  }

  /* ---------- 默认模板（原 mp-course 全局试看策略降级为此） ---------- */

  var DEFAULTS = {
    online_course: { pay_mode: "paid", trial_scope: { mode: "min3", count: 1 }, order_mode: "inline" },
    offline: { pay_mode: "paid", trial_scope: { mode: "none", count: 0 }, order_mode: "inline" },
    article: { pay_mode: "paid", trial_scope: { mode: "first_n", count: 1 }, order_mode: "inline" },
    plan: { pay_mode: "paid", trial_scope: { mode: "none", count: 0 }, order_mode: "inline" },
    live: { pay_mode: "free", trial_scope: { mode: "none", count: 0 }, order_mode: "jump_goods" }
  };

  function defaultsFor(contentType) {
    return clone(DEFAULTS[contentType] || DEFAULTS.online_course);
  }

  /* ---------- normalize ---------- */

  function normalize(row) {
    row = clone(row || {});
    var d = defaultsFor(row.content_type);
    row.listing_id = row.listing_id || nextId();
    row.scene = row.scene || "mp_home";
    row.slot = row.slot || "online";
    row.content_type = row.content_type || "online_course";
    row.content_id = row.content_id || "";
    row.sort = typeof row.sort === "number" ? row.sort : 99;
    row.visible = row.visible !== false;
    row.pay_mode = row.pay_mode === "free" ? "free" : (row.pay_mode === "paid" ? "paid" : d.pay_mode);

    var ts = row.trial_scope || d.trial_scope;
    var mode = ["none", "first_n", "min3"].indexOf(ts.mode) >= 0 ? ts.mode : "none";
    row.trial_scope = {
      mode: mode,
      count: mode === "first_n" ? Math.max(1, parseInt(ts.count, 10) || 1) : 0
    };
    if (row.pay_mode === "free") row.trial_scope = { mode: "none", count: 0 };

    row.order_mode = row.order_mode === "jump_goods" ? "jump_goods" : "inline";
    if (row.pay_mode === "free") row.order_mode = "jump_goods";
    row.default_goods_id = row.default_goods_id || "";
    if (row.pay_mode === "free") row.default_goods_id = "";

    row.status = row.status || "active";
    row.effective_at = row.effective_at || "";
    row.created_at = row.created_at || nowStr();
    row.updated_at = nowStr();
    return row;
  }

  /* ---------- 校验（R-MP-070 / 080 / 090） ---------- */

  /** 返回 { level: "ok"|"warn"|"error", msg } —— error 阻止保存，warn 阻止生效 */
  function validate(row) {
    row = normalize(row);
    var content = resolveContent(row.content_type, row.content_id);
    if (!content) return { level: "error", msg: "内容不存在或未登记" };
    if (row.pay_mode === "free") {
      if (content.status !== "enabled") return { level: "warn", msg: "内容未上架，免费上架位暂不生效" };
      return { level: "ok", msg: "免费上架，无需商品" };
    }
    if (row.order_mode === "inline") {
      if (!row.default_goods_id) return { level: "error", msg: "「不跳转直接下单」必须指定默认成交商品" };
      var g = global.GoodsStore ? global.GoodsStore.get(row.default_goods_id) : null;
      if (!g) return { level: "error", msg: "默认成交商品不存在" };
      /* 组合商品：商品可交付多个内容，只要包含本上架位的内容即可（R-MP-080） */
      var covers = global.GoodsStore && global.GoodsStore.delivers
        ? global.GoodsStore.delivers(g, row.content_id)
        : g.content_id === row.content_id;
      if (!covers) return { level: "error", msg: "默认成交商品未包含本内容" };
      if (g.audit_status !== "approved") return { level: "error", msg: "成交商品须通过平台审核方可上架" };
      if (g.status !== "on_sale") return { level: "warn", msg: "成交商品未上架，C 端将无法下单" };
      if (content.status !== "enabled") return { level: "warn", msg: "内容未上架，上架位暂不生效" };
      return { level: "ok", msg: "付费 · 直接按「" + g.name + "」金额下单" };
    }
    /* jump_goods */
    var approved = global.GoodsStore ? global.GoodsStore.listApprovedByContent(row.content_id) : [];
    if (!approved.length) return { level: "warn", msg: "尚无已审核通过的商品，C 端「去购买」暂无落点" };
    if (content.status !== "enabled") return { level: "warn", msg: "内容未上架，上架位暂不生效" };
    return { level: "ok", msg: "付费 · 跳转商品详情页（" + approved.length + " 个可选）" };
  }

  /** 试看范围不得超出 chapter.free 声明的节数（R-CNT-080） */
  function trialOverflow(row) {
    row = normalize(row);
    if (row.pay_mode !== "paid" || row.trial_scope.mode !== "first_n") return 0;
    var allow = trialableCount(row.content_type, row.content_id);
    return row.trial_scope.count > allow ? row.trial_scope.count - allow : 0;
  }

  /* ---------- 持久化 ---------- */

  function readAll() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || data.schema !== SCHEMA || !Array.isArray(data.rows)) return null;
      return data.rows.map(normalize);
    } catch (e) {
      return null;
    }
  }

  function writeAll(rows) {
    localStorage.setItem(KEY, JSON.stringify({ schema: SCHEMA, rows: (rows || []).map(normalize) }));
  }

  function seed() {
    if (global.GoodsStore && global.GoodsStore.ensureDemoGoods) global.GoodsStore.ensureDemoGoods();
    var base = [
      { scene: "mp_home", slot: "online", content_type: "online_course", content_id: "C001", sort: 1, pay_mode: "paid", trial_scope: { mode: "min3", count: 0 }, order_mode: "inline", default_goods_id: "G002" },
      { scene: "mp_home", slot: "online", content_type: "online_course", content_id: "C003", sort: 2, pay_mode: "paid", trial_scope: { mode: "first_n", count: 1 }, order_mode: "jump_goods", default_goods_id: "G001" },
      { scene: "mp_home", slot: "online", content_type: "online_course", content_id: "CP001", sort: 3, pay_mode: "free", trial_scope: { mode: "none", count: 0 }, order_mode: "jump_goods", default_goods_id: "" },
      { scene: "mp_home", slot: "offline", content_type: "offline", content_id: "O001", sort: 1, pay_mode: "paid", trial_scope: { mode: "none", count: 0 }, order_mode: "inline", default_goods_id: "G-O001" },
      { scene: "mp_home", slot: "offline", content_type: "offline", content_id: "O002", sort: 2, pay_mode: "free", trial_scope: { mode: "none", count: 0 }, order_mode: "jump_goods", default_goods_id: "" },
      { scene: "mp_home", slot: "article", content_type: "article", content_id: "A001", sort: 1, pay_mode: "paid", trial_scope: { mode: "first_n", count: 1 }, order_mode: "inline", default_goods_id: "G-A001" },
      { scene: "mp_home", slot: "article", content_type: "article", content_id: "A002", sort: 2, pay_mode: "paid", trial_scope: { mode: "first_n", count: 1 }, order_mode: "inline", default_goods_id: "G-A002" },
      { scene: "mp_home", slot: "article", content_type: "article", content_id: "A004", sort: 3, pay_mode: "free", trial_scope: { mode: "none", count: 0 }, order_mode: "jump_goods", default_goods_id: "" },
      { scene: "mp_home", slot: "article", content_type: "article", content_id: "A005", sort: 4, pay_mode: "paid", trial_scope: { mode: "first_n", count: 1 }, order_mode: "inline", default_goods_id: "G-A005" },
      { scene: "mp_home", slot: "live", content_type: "live", content_id: "L001", sort: 1, pay_mode: "paid", trial_scope: { mode: "none", count: 0 }, order_mode: "inline", default_goods_id: "G-L001" },
      { scene: "mp_home", slot: "live", content_type: "live", content_id: "L002", sort: 2, pay_mode: "free", trial_scope: { mode: "none", count: 0 }, order_mode: "jump_goods", default_goods_id: "" },
      { scene: "mp_home", slot: "live", content_type: "live", content_id: "L003", sort: 3, pay_mode: "free", trial_scope: { mode: "none", count: 0 }, order_mode: "jump_goods", default_goods_id: "", visible: false },
      { scene: "mp_home", slot: "live", content_type: "live", content_id: "L004", sort: 4, pay_mode: "paid", trial_scope: { mode: "none", count: 0 }, order_mode: "inline", default_goods_id: "G-L004" }
    ];
    return base.map(function (r) {
      var row = normalize(r);
      var v = validate(row);
      row.status = v.level === "ok" ? "active" : (v.level === "error" ? "draft" : "draft");
      return row;
    });
  }

  function ensureLoaded() {
    var rows = readAll();
    if (rows) return rows;
    var s = seed();
    writeAll(s);
    return s;
  }

  /* ---------- 查询 ---------- */

  function list(opts) {
    opts = opts || {};
    return ensureLoaded().filter(function (r) {
      if (opts.scene && r.scene !== opts.scene) return false;
      if (opts.slot && r.slot !== opts.slot) return false;
      if (opts.content_type && r.content_type !== opts.content_type) return false;
      if (opts.content_id && r.content_id !== opts.content_id) return false;
      if (opts.status && r.status !== opts.status) return false;
      if (opts.visibleOnly && !r.visible) return false;
      return true;
    }).sort(function (a, b) { return a.sort - b.sort; });
  }

  function listByScene(scene) { return list({ scene: scene }); }
  function listByContent(contentId) { return list({ content_id: contentId }); }
  function listBySlot(slot) { return list({ slot: slot }); }

  function get(listingId) {
    return ensureLoaded().find(function (r) { return r.listing_id === listingId; }) || null;
  }

  /** C 端取数：内容在指定模块的生效上架位 */
  function findEffective(contentId, slot) {
    return ensureLoaded().find(function (r) {
      if (r.content_id !== contentId) return false;
      if (slot && r.slot !== slot) return false;
      if (!r.visible || r.status !== "active") return false;
      return validate(r).level !== "error";
    }) || null;
  }

  function save(row) {
    var next = normalize(row);
    var rows = ensureLoaded();
    var i = rows.findIndex(function (r) { return r.listing_id === next.listing_id; });
    if (i >= 0) rows[i] = Object.assign({}, rows[i], next);
    else rows.push(next);
    writeAll(rows);
    return clone(next);
  }

  function saveAll(newRows) {
    writeAll((newRows || []).map(normalize));
    return list();
  }

  function remove(listingId) {
    writeAll(ensureLoaded().filter(function (r) { return r.listing_id !== listingId; }));
  }

  function moveUp(listingId) {
    var rows = ensureLoaded();
    var row = rows.find(function (r) { return r.listing_id === listingId; });
    if (!row) return rows;
    var sibs = rows.filter(function (r) { return r.scene === row.scene && r.slot === row.slot; })
      .sort(function (a, b) { return a.sort - b.sort; });
    var idx = sibs.findIndex(function (r) { return r.listing_id === listingId; });
    if (idx <= 0) return rows;
    var prev = sibs[idx - 1];
    var t = row.sort; row.sort = prev.sort; prev.sort = t;
    writeAll(rows);
    return list();
  }

  function resetSeed() {
    localStorage.removeItem(KEY);
    return ensureLoaded();
  }

  /** 统计某内容已上架的模块数（列表页展示用） */
  function activeSlotsOf(contentId) {
    return listByContent(contentId)
      .filter(function (r) { return r.visible && r.status === "active"; })
      .map(function (r) { return SLOT_LABEL[r.slot] || r.slot; });
  }

  global.ListingStore = {
    KEY: KEY,
    SCHEMA: SCHEMA,
    PAY_MODE_LABEL: PAY_MODE_LABEL,
    ORDER_MODE_LABEL: ORDER_MODE_LABEL,
    TRIAL_MODE_LABEL: TRIAL_MODE_LABEL,
    STATUS_LABEL: STATUS_LABEL,
    SLOT_LABEL: SLOT_LABEL,
    list: list,
    listByScene: listByScene,
    listByContent: listByContent,
    listBySlot: listBySlot,
    get: get,
    findEffective: findEffective,
    save: save,
    saveAll: saveAll,
    remove: remove,
    moveUp: moveUp,
    normalize: normalize,
    validate: validate,
    trialOverflow: trialOverflow,
    defaultsFor: defaultsFor,
    resolveContent: resolveContent,
    contentOptions: contentOptions,
    trialableCount: trialableCount,
    activeSlotsOf: activeSlotsOf,
    resetSeed: resetSeed,
    nowStr: nowStr
  };
})(window);
