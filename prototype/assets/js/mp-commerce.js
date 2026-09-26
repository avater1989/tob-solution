/* C 端试看 / 购买 / 权益层（原型，无真实支付）
 *
 * v2（内容 / 商品 / 上架 三层解耦）：
 *   - 价格不再来自内容，而是来自「上架位的默认成交商品」（ListingStore + GoodsStore）
 *   - 支持两种下单方式：jump_goods（跳商品详情页）/ inline（内容页直接按商品金额下单）
 *   - 权益主键由 content_id 改为 goods_id；contentIndex 供内容页反查是否已购买
 */
(function (global) {
  var RIGHTS_KEY = "mp_rights_v2";
  var LEGACY_KEY = "mp_course_rights_v1";

  var TYPE_LABEL = {
    online_course: "线上课",
    offline: "线下门票",
    article: "文章",
    plan: "定制化计划",
    live: "直播门票"
  };

  /* 权益说明文案（按内容类型兜底；价格与成交商品从上架位实时取） */
  var COPY = {
    online_course: {
      validity: "长期有效",
      validityStart: "支付成功即日起算",
      startHow: "支付成功后立即开通，可在「我的」进入学习",
      include: "本内容全部章节视频",
      service: "可在「我的 → 账号与帮助」联系商家；售后按商家说明处理"
    },
    offline: {
      validity: "本场有效",
      validityStart: "支付成功即获得本场报名资格",
      startHow: "支付成功后可在详情页查看报名状态；请按课程时间到场",
      include: "本场线下课报名资格（按线下课 ID 隔离，不含其他场次）",
      service: "未开课可退以商家说明为准；可在「我的 → 账号与帮助」联系商家"
    },
    article: {
      validity: "长期有效",
      validityStart: "支付成功即日起算",
      startHow: "支付成功后立即解锁全文阅读",
      include: "本文全部正文内容（不含课程与直播权益）",
      service: "可在「我的 → 账号与帮助」联系商家；售后按商家说明处理"
    },
    plan: {
      validity: "按计划周期",
      validityStart: "支付成功即日起算",
      startHow: "支付成功后由顾问对接开通计划",
      include: "本计划全部关卡与任务",
      service: "可在「我的 → 账号与帮助」联系商家"
    },
    live: {
      validity: "本场有效",
      validityStart: "开播时生效，含结束后 48 小时回放（示意）",
      startHow: "支付成功后可进入直播间观看",
      include: "本场直播观看权",
      service: "直播门票售后以商家说明为准"
    }
  };

  function copyOf(type) { return COPY[type] || COPY.online_course; }
  function typeLabel(type) { return TYPE_LABEL[type] || "内容"; }

  function LS() { return global.ListingStore; }
  function GD() { return global.GoodsStore; }

  /* ---------- 权益存储 ---------- */

  function readRights() {
    try {
      var raw = localStorage.getItem(RIGHTS_KEY);
      if (raw) {
        var d = JSON.parse(raw);
        return { byGoods: d.byGoods || {}, contentIndex: d.contentIndex || {} };
      }
    } catch (e) {}
    /* 旧数据迁移：按 content_id 存 → 视为内容级权益 */
    try {
      var old = JSON.parse(localStorage.getItem(LEGACY_KEY) || "{}") || {};
      var migrated = { byGoods: {}, contentIndex: {} };
      Object.keys(old).forEach(function (cid) {
        if (old[cid] && old[cid].valid) {
          migrated.contentIndex[cid] = cid;
          migrated.byGoods[cid] = Object.assign({ content_id: cid, legacy: true }, old[cid]);
        }
      });
      return migrated;
    } catch (e2) {
      return { byGoods: {}, contentIndex: {} };
    }
  }

  function writeRights(m) {
    try { localStorage.setItem(RIGHTS_KEY, JSON.stringify(m)); } catch (e) {}
  }

  /** 是否持有某商品的权益 */
  function hasGoodsRights(goodsId) {
    var m = readRights();
    return !!(goodsId && m.byGoods[goodsId] && m.byGoods[goodsId].valid);
  }

  /** 内容是否已购：内容下任一成交商品持有权益即视为已购 */
  function hasRights(contentId) {
    if (!contentId) return false;
    var m = readRights();
    var hit = m.contentIndex[contentId];
    if (hit && m.byGoods[hit] && m.byGoods[hit].valid) return true;
    /* 兜底：内容下任一商品有权益 */
    var gs = GD() ? GD().listByContent(contentId) : [];
    return gs.some(function (g) { return hasGoodsRights(g.goods_id); });
  }

  /** 授予权益（主键 goods_id；组合商品一次解锁其交付的全部内容） */
  function grantRights(goodsId, meta) {
    meta = meta || {};
    var m = readRights();
    m.byGoods[goodsId] = Object.assign({
      valid: true,
      grantedAt: new Date().toISOString(),
      source: "pay"
    }, meta);

    var G = GD();
    var g = G && G.get ? G.get(goodsId) : null;
    var ids = (g && G.contentIdsOf) ? G.contentIdsOf(g) : [];
    if (meta.content_id && ids.indexOf(meta.content_id) < 0) ids.push(meta.content_id);
    ids.forEach(function (cid) { m.contentIndex[cid] = goodsId; });

    writeRights(m);
  }

  function revokeRights(goodsId) {
    var m = readRights();
    if (!goodsId || !m.byGoods[goodsId]) return;
    m.byGoods[goodsId].valid = false;
    m.byGoods[goodsId].revokedAt = new Date().toISOString();
    Object.keys(m.contentIndex).forEach(function (cid) {
      if (m.contentIndex[cid] === goodsId) delete m.contentIndex[cid];
    });
    writeRights(m);
  }

  /* ---------- 上架位取数 ---------- */

  /**
   * 取某内容在 C 端的售卖上下文
   * @returns { listing, goods, payMode, price, orderMode, owned, trialScope, free }
   */
  function context(contentId, slot) {
    var L = LS();
    var G = GD();
    var listing = L ? (L.findEffective(contentId, slot) || L.listByContent(contentId).filter(function (r) { return r.visible; })[0]) : null;
    var goods = null;
    if (listing && listing.default_goods_id && G) goods = G.get(listing.default_goods_id);

    /* 无上架位时降级：取该内容下已上架商品的最低售价 */
    if (!listing && G) {
      var onSale = G.listOnSaleByContent(contentId);
      if (onSale.length) {
        goods = onSale.slice().sort(function (a, b) { return a.price - b.price; })[0];
      }
    }

    var free = listing ? listing.pay_mode === "free" : !goods || goods.price <= 0;
    var price = (!free && goods) ? goods.price : 0;

    return {
      listing: listing,
      listing_id: listing ? listing.listing_id : "",
      goods: goods,
      goods_id: goods ? goods.goods_id : "",
      goods_name: goods ? goods.name : "",
      payMode: free ? "free" : "paid",
      free: free,
      price: price,
      orderMode: listing ? listing.order_mode : "jump_goods",
      trialScope: listing ? listing.trial_scope : { mode: "none", count: 0 },
      contentType: listing ? listing.content_type : "",
      owned: hasRights(contentId) || free
    };
  }

  /** 未购用户可见的试看章节下标集合 */
  function trialVisible(ctx, chapters) {
    chapters = chapters || [];
    if (ctx.owned) return chapters.map(function (_, i) { return i; });
    var scope = ctx.trialScope || { mode: "none", count: 0 };
    var allow = chapters.map(function (ch, i) { return ch.free ? i : -1; }).filter(function (i) { return i >= 0; });
    if (scope.mode === "none") return [];
    if (scope.mode === "min3") return allow;
    /* first_n：只能落在已声明「允许试看」的章节里 */
    return allow.slice(0, Math.max(0, scope.count));
  }

  /* ---------- 弹层 ---------- */

  function ensureMask() {
    var mask = document.getElementById("mp-sheet-mask");
    if (!mask) {
      mask = document.createElement("div");
      mask.id = "mp-sheet-mask";
      mask.className = "mp-sheet-mask";
      document.body.appendChild(mask);
      mask.addEventListener("click", closeSheets);
    }
    return mask;
  }

  function closeSheets() {
    var mask = document.getElementById("mp-sheet-mask");
    if (mask) mask.classList.remove("open");
    document.querySelectorAll(".mp-sheet.open").forEach(function (el) {
      el.classList.remove("open");
    });
  }

  function sheetFor(id) {
    var sheet = document.getElementById(id);
    if (!sheet) {
      sheet = document.createElement("div");
      sheet.id = id;
      sheet.className = "mp-sheet";
      document.body.appendChild(sheet);
    }
    return sheet;
  }

  function noticeLines(item) {
    return [
      { k: "权益类型", v: item.typeLabel },
      { k: "包含内容", v: item.include },
      { k: "开课方式", v: item.startHow },
      { k: "有效期", v: item.validity + "（" + item.validityStart + "）" },
      { k: "获取方式", v: item.access },
      { k: "客服 / 售后", v: item.service }
    ];
  }

  /**
   * 购买 / 领取须知
   * opts: { contentId, contentType, slot, title, listingId, goodsId, orderMode, returnUrl, onConfirm, onCancel }
   */
  function openBuyNotice(opts) {
    opts = opts || {};
    var ctx = opts.contentId
      ? context(opts.contentId, opts.slot)
      : { payMode: "paid", price: Number(opts.price) || 0, orderMode: "jump_goods", goods_id: opts.goodsId || "", contentType: opts.contentType || "" };

    if (opts.listingId) ctx.listing_id = opts.listingId;
    if (opts.goodsId) ctx.goods_id = opts.goodsId;
    if (opts.orderMode) ctx.orderMode = opts.orderMode;

    var type = opts.contentType || ctx.contentType || "online_course";
    var c = copyOf(type);
    var isClaim = ctx.payMode === "free" && type !== "online_course";
    var priceTxt = Number(ctx.price || 0).toFixed(2).replace(/\.00$/, "");

    var item = {
      id: type,
      title: opts.title || ctx.goods_name || "内容",
      typeLabel: opts.typeLabel || typeLabel(type),
      price: priceTxt,
      access: isClaim
        ? "免费领取"
        : ("付费购买 · 成交商品 " + (ctx.goods_name || "—") + " ¥" + priceTxt),
      validity: c.validity,
      validityStart: c.validityStart,
      startHow: c.startHow,
      include: opts.include || c.include,
      service: c.service
    };

    var sheet = sheetFor("mp-buy-notice");
    var title = isClaim ? "领取须知" : "购买须知";
    var cta = isClaim ? "确认领取" : ("确认购买 ¥" + priceTxt);

    sheet.innerHTML =
      '<div class="mp-sheet-hd">' +
      "<div>" +
      '<div class="mp-sheet-title">' + title + "</div>" +
      '<div class="mp-sheet-sub">' + item.typeLabel + " · " + item.title + "</div>" +
      "</div>" +
      '<button type="button" class="mp-sheet-x" data-close-sheet aria-label="关闭">×</button>' +
      "</div>" +
      '<div class="mp-sheet-bd">' +
      '<div class="mp-notice-box">' +
      noticeLines(item).map(function (row) {
        return '<div class="mp-notice-row"><span class="k">' + row.k + '</span><span class="v">' + row.v + "</span></div>";
      }).join("") +
      "</div>" +
      '<p class="mp-notice-tip">原型示意：不接入真实支付，确认后进入支付结果演示。</p>' +
      "</div>" +
      '<div class="mp-sheet-ft">' +
      '<button type="button" class="mp-btn mp-btn-outline" data-close-sheet style="flex:1">取消</button>' +
      '<button type="button" class="mp-btn" id="mp-buy-confirm" style="flex:1.4">' + cta + "</button>" +
      "</div>";

    ensureMask().classList.add("open");
    sheet.classList.add("open");

    sheet.querySelectorAll("[data-close-sheet]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        closeSheets();
        if (typeof opts.onCancel === "function") opts.onCancel();
      });
    });

    document.getElementById("mp-buy-confirm").addEventListener("click", function () {
      closeSheets();
      if (typeof opts.onConfirm === "function") { opts.onConfirm(item); return; }
      var q = new URLSearchParams();
      q.set("status", "success");
      q.set("from", type);
      q.set("order_mode", ctx.orderMode || "jump_goods");
      q.set("price", priceTxt);
      if (ctx.goods_id) q.set("goods_id", ctx.goods_id);
      if (opts.contentId) q.set("content_id", opts.contentId);
      if (ctx.listing_id) q.set("listing_id", ctx.listing_id);
      if (opts.returnUrl) q.set("return", opts.returnUrl);
      location.href = "pay-result.html?" + q.toString();
    });
  }

  /**
   * 试看结束拦截
   * opts: { contentId, contentType, slot, returnUrl, onBuyCancel }
   */
  function openTrialEndPrompt(opts) {
    opts = opts || {};
    var ctx = context(opts.contentId, opts.slot);
    var type = opts.contentType || ctx.contentType || "online_course";
    var scope = ctx.trialScope || { mode: "none", count: 0 };
    var rule = scope.mode === "min3"
      ? "每节前 3 分钟可试看"
      : (scope.mode === "first_n" ? "前 " + scope.count + " 节可试看" : "本内容不提供试看");
    var priceTxt = Number(ctx.price || 0).toFixed(2).replace(/\.00$/, "");

    var sheet = sheetFor("mp-trial-end");
    sheet.innerHTML =
      '<div class="mp-sheet-hd">' +
      "<div>" +
      '<div class="mp-sheet-title">试看已结束</div>' +
      '<div class="mp-sheet-sub">解锁全部内容，继续系统学习</div>' +
      "</div>" +
      '<button type="button" class="mp-sheet-x" data-close-sheet aria-label="关闭">×</button>' +
      "</div>" +
      '<div class="mp-sheet-bd">' +
      '<div class="mp-notice-box">' +
      '<div class="mp-notice-row"><span class="k">试看规则</span><span class="v">' + rule + "</span></div>" +
      '<div class="mp-notice-row"><span class="k">下单商品</span><span class="v">' + (ctx.goods_name || "—") + " ¥" + priceTxt + "</span></div>" +
      "</div>" +
      "</div>" +
      '<div class="mp-sheet-ft">' +
      '<button type="button" class="mp-btn mp-btn-outline" id="mp-trial-stay" style="flex:1">继续试看</button>' +
      '<button type="button" class="mp-btn" id="mp-trial-buy" style="flex:1.4">' +
      (ctx.orderMode === "jump_goods" ? "去购买" : "立即购买 ¥" + priceTxt) +
      "</button>" +
      "</div>";

    ensureMask().classList.add("open");
    sheet.classList.add("open");

    sheet.querySelectorAll("[data-close-sheet]").forEach(function (btn) {
      btn.addEventListener("click", closeSheets);
    });
    document.getElementById("mp-trial-stay").addEventListener("click", closeSheets);
    document.getElementById("mp-trial-buy").addEventListener("click", function () {
      closeSheets();
      if (ctx.orderMode === "jump_goods" && ctx.goods_id) {
        openGoodsDetail(ctx.goods_id, { listingId: ctx.listing_id, returnUrl: opts.returnUrl });
        return;
      }
      openBuyNotice({
        contentId: opts.contentId,
        contentType: type,
        slot: opts.slot,
        orderMode: ctx.orderMode,
        goodsId: ctx.goods_id,
        returnUrl: opts.returnUrl,
        onCancel: function () {
          if (typeof opts.onBuyCancel === "function") opts.onBuyCancel();
        }
      });
    });
  }

  /** 跳商品详情页（order_mode=jump_goods） */
  function openGoodsDetail(goodsId, opts) {
    opts = opts || {};
    var q = new URLSearchParams();
    q.set("goods_id", goodsId);
    if (opts.listingId) q.set("listing_id", opts.listingId);
    if (opts.contentId) q.set("content_id", opts.contentId);
    if (opts.returnUrl) q.set("return", opts.returnUrl);
    location.href = "goods-detail.html?" + q.toString();
  }

  /**
   * 统一下单入口：按上架位的 order_mode 决定跳商品详情页还是原地下单
   */
  function buy(contentId, opts) {
    opts = opts || {};
    var ctx = context(contentId, opts.slot);
    if (ctx.payMode === "free") {
      grantRights(ctx.goods_id || contentId, { source: "free", content_id: contentId });
      if (typeof opts.onFree === "function") opts.onFree(ctx);
      return ctx;
    }
    if (ctx.orderMode === "jump_goods" && ctx.goods_id) {
      openGoodsDetail(ctx.goods_id, {
        listingId: ctx.listing_id,
        contentId: contentId,
        returnUrl: opts.returnUrl
      });
      return ctx;
    }
    openBuyNotice({
      contentId: contentId,
      contentType: ctx.contentType,
      slot: opts.slot,
      title: opts.title,
      returnUrl: opts.returnUrl,
      onConfirm: opts.onConfirm
    });
    return ctx;
  }

  /**
   * 列表页价格文案：免费 / ¥x / 查看商品（跳商品模式不展示价格）
   * 同时返回是否已购，便于列表打标
   */
  function priceLabel(contentId, slot) {
    var ctx = context(contentId, slot);
    var txt;
    if (ctx.owned && !ctx.free) txt = "已解锁";
    else if (ctx.free) txt = "免费";
    else if (ctx.orderMode === "inline") txt = "¥" + Number(ctx.price || 0).toFixed(2).replace(/\.00$/, "");
    else txt = "查看商品";
    return { text: txt, ctx: ctx };
  }

  global.MpCommerce = {
    RIGHTS_KEY: RIGHTS_KEY,
    hasRights: hasRights,
    hasGoodsRights: hasGoodsRights,
    grantRights: grantRights,
    revokeRights: revokeRights,
    readRights: readRights,
    context: context,
    trialVisible: trialVisible,
    typeLabel: typeLabel,
    copyOf: copyOf,
    priceLabel: priceLabel,
    buy: buy,
    openBuyNotice: openBuyNotice,
    openTrialEndPrompt: openTrialEndPrompt,
    openGoodsDetail: openGoodsDetail,
    closeSheets: closeSheets,
    qs: function () { return new URLSearchParams(location.search); }
  };
})(window);
