/* 店铺商品共享 Store（商家端 / 运营端 / C 端）
 * 商品是唯一价格载体；内容 ↔ 商品为 M:N：
 *   - 1 内容 : N 商品 —— 同一内容可建多个不同价的商品
 *   - 1 商品 : N 内容 —— 组合商品（如「1 门课 + 1 篇文章」礼包）
 * 关系权威源 = 商品的 contents[]（2026-09-21 由单一 content_id 扩展为数组）；
 * content_id / content_type 保留为「主内容」（contents[0]）以兼容既有字段与订单快照。
 * 数据落盘复用 ProtoBiz（proto_biz_store_v12）的 goodsDemo，避免双源
 */
(function (global) {
  var CHANNEL = "store";

  function biz() {
    return global.ProtoBiz || null;
  }

  function nowStr() {
    var d = new Date();
    var p = function (n) { return n < 10 ? "0" + n : String(n); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
      " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  /* 演示用补充商品：让「线下课 / 文章」的上架配置也有可指派的成交商品 */
  var DEMO_EXTRA = [
    {
      goods_id: "G-O001",
      channel: "store",
      create_mode: "from_content",
      content_source: "self",
      content_type: "offline",
      content_id: "O001",
      category_id: "GC05",
      tag_ids: [],
      name: "卓越家族培养计划 · 线下工作坊门票",
      status: "on_sale",
      audit_status: "approved",
      reject_reason: "",
      submitted_at: "2026-09-02 10:00",
      price: 299,
      list_price: 399
    },
    {
      goods_id: "G-L001",
      channel: "store",
      create_mode: "from_content",
      content_source: "self",
      content_type: "live",
      content_id: "L001",
      category_id: "GC04",
      tag_ids: [],
      name: "春启 03 期家长公开课 · 门票",
      status: "on_sale",
      audit_status: "approved",
      reject_reason: "",
      submitted_at: "2026-09-04 10:00",
      price: 19.9,
      list_price: 39.9
    },
    {
      goods_id: "G-L004",
      channel: "store",
      create_mode: "from_content",
      content_source: "self",
      content_type: "live",
      content_id: "L004",
      category_id: "GC04",
      tag_ids: [],
      name: "亲子沟通 21 天训练营 · 第 4 期 门票",
      status: "on_sale",
      audit_status: "approved",
      reject_reason: "",
      submitted_at: "2026-09-04 10:10",
      price: 9.9,
      list_price: 0
    },
    {
      goods_id: "G-A001",
      channel: "store",
      create_mode: "from_content",
      content_source: "self",
      content_type: "article",
      content_id: "A001",
      category_id: "GC07",
      tag_ids: [],
      name: "9 月新学期家长指南 · 全文解锁",
      status: "on_sale",
      audit_status: "approved",
      reject_reason: "",
      submitted_at: "2026-09-03 09:00",
      price: 6.9,
      list_price: 0
    },
    {
      goods_id: "G-A002",
      channel: "store",
      create_mode: "from_content",
      content_source: "self",
      content_type: "article",
      content_id: "A002",
      category_id: "GC07",
      tag_ids: [],
      name: "孩子注意力训练方法论 · 全文解锁",
      status: "on_sale",
      audit_status: "approved",
      reject_reason: "",
      submitted_at: "2026-09-03 09:10",
      price: 9.9,
      list_price: 19.9
    },
    {
      goods_id: "G-A005",
      channel: "store",
      create_mode: "from_content",
      content_source: "self",
      content_type: "article",
      content_id: "A005",
      category_id: "GC07",
      tag_ids: [],
      name: "青春期边界：爱与规则怎么并存 · 全文解锁",
      status: "on_sale",
      audit_status: "approved",
      reject_reason: "",
      submitted_at: "2026-09-03 09:20",
      price: 6.9,
      list_price: 0
    },
    {
      /* 组合商品演示：一个商品交付多个内容（1 商品 : N 内容） */
      goods_id: "G-B001",
      channel: "store",
      create_mode: "from_content",
      content_source: "self",
      contents: [
        { content_type: "online_course", content_id: "C001" },
        { content_type: "article", content_id: "A001" }
      ],
      category_id: "GC07",
      tag_ids: [],
      name: "新学期阅读成长礼包（1 门线上课 + 1 篇文章）",
      status: "on_sale",
      audit_status: "approved",
      reject_reason: "",
      submitted_at: "2026-09-05 09:00",
      price: 199,
      list_price: 299
    }
  ];

  /* 交付内容归一化：把 contents[] 与旧单字段 content_id / content_type 收敛成同一份。
     组合商品（多个内容）以 contents[] 为准，content_id 取第一个作为「主内容」。 */
  function normalizeContents(g) {
    var list = [];
    if (Array.isArray(g.contents)) {
      g.contents.forEach(function (c) {
        if (!c) return;
        var id = c.content_id || c.id || "";
        var type = c.content_type || c.type || "";
        if (!id) return;
        if (list.some(function (x) { return x.content_id === id; })) return;
        list.push({ content_type: type, content_id: id });
      });
    }
    if (!list.length && g.content_id) {
      list.push({ content_type: g.content_type || "", content_id: g.content_id });
    }
    return list;
  }

  function normalize(g) {
    g = clone(g || {});
    g.channel = g.channel || CHANNEL;
    g.create_mode = g.create_mode || "from_content";
    g.content_source = g.content_source || "self";
    g.tag_ids = Array.isArray(g.tag_ids) ? g.tag_ids : [];
    g.audit_status = g.audit_status || (g.status === "on_sale" ? "approved" : "draft");
    g.price = typeof g.price === "number" ? g.price : (parseFloat(g.price) || 0);
    g.list_price = typeof g.list_price === "number" ? g.list_price : (parseFloat(g.list_price) || 0);
    g.reject_reason = g.reject_reason || "";
    g.submitted_at = g.submitted_at || "";
    g.contents = normalizeContents(g);
    g.content_id = g.contents.length ? g.contents[0].content_id : "";
    g.content_type = g.contents.length ? g.contents[0].content_type : "";
    return g;
  }

  /** 商品交付的全部内容（组合商品返回多条） */
  function contentsOf(g) {
    if (!g) return [];
    return normalizeContents(g);
  }

  /** 商品交付的内容 ID 列表 */
  function contentIdsOf(g) {
    return contentsOf(g).map(function (c) { return c.content_id; });
  }

  /** 是否包含某内容 */
  function delivers(g, contentId) {
    if (!g || !contentId) return false;
    return contentIdsOf(g).indexOf(contentId) >= 0;
  }

  function readRaw() {
    var B = biz();
    if (B && typeof B.load === "function") {
      var data = B.load();
      data.goodsDemo = (data.goodsDemo || []).map(normalize);
      return data;
    }
    return null;
  }

  function writeRaw(data) {
    var B = biz();
    if (B && typeof B.save === "function") B.save(data);
  }

  /** 店铺商品（channel=store）全量 */
  function all() {
    var data = readRaw();
    var rows = data ? data.goodsDemo : [];
    return rows.filter(function (g) { return !g.channel || g.channel === CHANNEL; }).map(clone);
  }

  function list(opts) {
    opts = opts || {};
    return all().filter(function (g) {
      if (opts.content_id && !delivers(g, opts.content_id)) return false;
      if (opts.content_type && (g.contents || []).every(function (c) { return c.content_type !== opts.content_type; })) return false;
      if (opts.create_mode && g.create_mode !== opts.create_mode) return false;
      if (opts.category_id && g.category_id !== opts.category_id) return false;
      if (opts.audit_status && (g.audit_status || "draft") !== opts.audit_status) return false;
      if (opts.status && g.status !== opts.status) return false;
      if (opts.keyword) {
        var kw = String(opts.keyword).toLowerCase();
        var blob = (g.name + " " + g.goods_id).toLowerCase();
        if (blob.indexOf(kw) < 0) return false;
      }
      return true;
    });
  }

  function get(goodsId) {
    if (!goodsId) return null;
    var hit = all().find(function (g) { return g.goods_id === goodsId; });
    return hit || null;
  }

  /** 内容 ↔ 商品 关系反查（权威源 = 商品的 contents[]，组合商品也命中） */
  function listByContent(contentId) {
    if (!contentId) return [];
    return all().filter(function (g) { return delivers(g, contentId); });
  }

  /** 可用于作为成交商品的商品：已通过审核 */
  function listApprovedByContent(contentId) {
    return listByContent(contentId).filter(function (g) { return g.audit_status === "approved"; });
  }

  /** 已通过审核且上架：上架配置生效的必要条件之一 */
  function listOnSaleByContent(contentId) {
    return listByContent(contentId).filter(function (g) {
      return g.audit_status === "approved" && g.status === "on_sale";
    });
  }

  function save(goods) {
    if (!goods || !goods.goods_id) throw new Error("goods.goods_id required");
    var data = readRaw();
    if (!data) return null;
    var next = normalize(goods);
    next.updated_at = nowStr();
    var i = data.goodsDemo.findIndex(function (g) { return g.goods_id === next.goods_id; });
    if (i >= 0) data.goodsDemo[i] = Object.assign({}, data.goodsDemo[i], next);
    else data.goodsDemo.unshift(next);
    writeRaw(data);
    return clone(next);
  }

  function remove(goodsId) {
    var data = readRaw();
    if (!data) return;
    data.goodsDemo = data.goodsDemo.filter(function (g) { return g.goods_id !== goodsId; });
    writeRaw(data);
  }

  /** 补齐演示商品，保证「线下课 / 文章」的上架配置有可指派商品 */
  function ensureDemoGoods() {
    var data = readRaw();
    if (!data) return [];
    var added = [];
    DEMO_EXTRA.forEach(function (g) {
      var exists = data.goodsDemo.some(function (x) { return x.goods_id === g.goods_id; });
      if (!exists) {
        data.goodsDemo.unshift(normalize(g));
        added.push(g.goods_id);
      }
    });
    if (added.length) writeRaw(data);
    return added;
  }

  function catLabel(categoryId) {
    if (global.GoodsTaxonomy && global.GoodsTaxonomy.catPathLabel) {
      return global.GoodsTaxonomy.catPathLabel(categoryId) || "";
    }
    return "";
  }

  global.GoodsStore = {
    CHANNEL: CHANNEL,
    all: all,
    list: list,
    get: get,
    save: save,
    remove: remove,
    normalize: normalize,
    contentsOf: contentsOf,
    contentIdsOf: contentIdsOf,
    delivers: delivers,
    listByContent: listByContent,
    listApprovedByContent: listApprovedByContent,
    listOnSaleByContent: listOnSaleByContent,
    ensureDemoGoods: ensureDemoGoods,
    catLabel: catLabel,
    nowStr: nowStr
  };
})(window);
