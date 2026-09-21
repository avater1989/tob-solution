/**
 * SCRM 渠道管理 — 视频号商品 ↔ 获客二级渠道
 * 供经营分析「获客与转化 · 渠道质量」在「视频号」下拆分二级渠道
 */
(function (global) {
  var KEY = "merchant_channel_store_v2";

  function vxCatalog() {
    if (global.TermStore && global.TermStore.VX_GOODS) {
      return global.TermStore.VX_GOODS.slice();
    }
    return [
      { id: "P2026030101", name: "春启 03 期家长必修课" },
      { id: "P2026090701", name: "视频号·春启 03 期家长课" },
      { id: "P2026080201", name: "家庭教育入门体验课（视频号）" },
      { id: "P2026090105", name: "青春期沟通专题课" },
      { id: "P2026070120", name: "亲子沟通 21 天定制化计划 · 第 4 期" }
    ];
  }

  function seed() {
    return [
      {
        id: "ch_short",
        name: "短视频",
        parent: "video",
        goodsIds: ["P2026030101", "P2026090701", "P2026080201"],
        remark: ""
      },
      {
        id: "ch_live",
        name: "直播",
        parent: "video",
        goodsIds: ["P2026090105", "P2026070120"],
        remark: ""
      }
    ];
  }

  function normalize(c) {
    return {
      id: c.id || ("ch_" + Date.now()),
      name: String(c.name || "").trim(),
      parent: c.parent || "video",
      goodsIds: Array.isArray(c.goodsIds) ? c.goodsIds.slice() : [],
      remark: c.remark || ""
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed.map(normalize);
      }
    } catch (e) { /* ignore */ }
    var s = seed().map(normalize);
    save(s);
    return s;
  }

  function save(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  }

  function list(filter) {
    var all = load();
    filter = filter || {};
    return all.filter(function (c) {
      if (filter.q) {
        var q = String(filter.q).toLowerCase();
        var goodsHit = (c.goodsIds || []).some(function (id) {
          return String(id).toLowerCase().indexOf(q) >= 0;
        });
        var nameHit = (c.name || "").toLowerCase().indexOf(q) >= 0;
        var remarkHit = (c.remark || "").toLowerCase().indexOf(q) >= 0;
        if (!nameHit && !remarkHit && !goodsHit) return false;
      }
      return true;
    });
  }

  function listActiveVideo() {
    return list({}).filter(function (c) {
      return (c.parent || "video") === "video";
    });
  }

  function get(id) {
    return load().filter(function (c) { return c.id === id; })[0] || null;
  }

  function usedGoods(excludeId) {
    var map = {};
    load().forEach(function (c) {
      if (excludeId && c.id === excludeId) return;
      (c.goodsIds || []).forEach(function (gid) {
        map[gid] = c.id;
      });
    });
    return map;
  }

  function goodsLabel(id) {
    var hit = vxCatalog().filter(function (g) { return g.id === id; })[0];
    return hit ? hit.name : id;
  }

  function upsert(data) {
    var n = normalize(data || {});
    if (!n.name) return { ok: false, reason: "请填写渠道名称" };
    var used = usedGoods(data && data.id ? data.id : n.id);
    for (var i = 0; i < n.goodsIds.length; i++) {
      var gid = n.goodsIds[i];
      if (used[gid]) {
        var owner = get(used[gid]);
        return {
          ok: false,
          reason: "商品「" + goodsLabel(gid) + "」已映射到渠道「" + (owner ? owner.name : used[gid]) + "」"
        };
      }
    }
    var all = load();
    var idx = -1;
    for (var j = 0; j < all.length; j++) {
      if (all[j].id === n.id) { idx = j; break; }
    }
    if (idx >= 0) {
      all[idx] = n;
    } else {
      if (!(data && data.id)) n.id = "ch_" + Date.now();
      all.push(n);
    }
    save(all);
    return { ok: true, item: n };
  }

  function remove(id) {
    save(load().filter(function (c) { return c.id !== id; }));
    return { ok: true };
  }

  function rateNum(num, den) {
    if (den == null || den === 0 || num == null) return null;
    return Math.round((num / den) * 1000) / 10;
  }

  function scaleRow(parent, ch, ratio) {
    function sc(n) { return Math.round((n || 0) * ratio); }
    var pool = sc(parent.pool);
    var wecom = sc(parent.wecom);
    var attend = sc(parent.attend);
    var pay = sc(parent.pay);
    var valid = sc(parent.valid);
    var gmv = parent.gmv == null ? null : Math.round(parent.gmv * ratio);
    return {
      id: "video:" + ch.id,
      parentId: "video",
      label: ch.name,
      isChild: true,
      channelId: ch.id,
      pool: pool,
      valid: valid,
      validRate: rateNum(pool, valid),
      wecom: wecom,
      wecomRate: rateNum(wecom, pool),
      attend: attend,
      attendRate: rateNum(attend, wecom),
      pay: pay,
      payRate: rateNum(pay, wecom),
      gmv: gmv,
      wecomDiff: parent.wecomDiff,
      attendDiff: parent.attendDiff,
      payDiff: parent.payDiff,
      trendPay: parent.trendPay,
      dropLabel: parent.dropLabel || "—",
      dropId: parent.dropId || ""
    };
  }

  /** 按映射商品数量占比拆分；未映射商品单独一行 */
  function splitVideoQuality(videoRow) {
    if (!videoRow) return [];
    var channels = listActiveVideo();
    if (!channels.length) return [];
    var catalog = vxCatalog();
    var mapped = usedGoods(null);
    var mappedCount = 0;
    channels.forEach(function (c) {
      mappedCount += (c.goodsIds && c.goodsIds.length) ? c.goodsIds.length : 0;
    });
    var unmappedCount = catalog.filter(function (g) { return !mapped[g.id]; }).length;
    var total = mappedCount + unmappedCount;
    if (total <= 0) {
      var eq = 1 / channels.length;
      return channels.map(function (c) { return scaleRow(videoRow, c, eq); });
    }
    var rows = [];
    channels.forEach(function (c) {
      var n = (c.goodsIds && c.goodsIds.length) ? c.goodsIds.length : 0;
      if (n <= 0) return;
      rows.push(scaleRow(videoRow, c, n / total));
    });
    if (unmappedCount > 0) {
      rows.push(scaleRow(videoRow, { id: "_unmapped", name: "未映射商品" }, unmappedCount / total));
    }
    return rows;
  }

  function expandVideoL2(rows) {
    var out = [];
    (rows || []).forEach(function (r) {
      if (r.id !== "video") {
        out.push(r);
        return;
      }
      var children = splitVideoQuality(r);
      if (!children.length) {
        out.push(r);
        return;
      }
      out.push(Object.assign({}, r, { isParent: true }));
      children.forEach(function (c) { out.push(c); });
    });
    return out;
  }

  global.ChannelStore = {
    KEY: KEY,
    vxCatalog: vxCatalog,
    goodsLabel: goodsLabel,
    list: list,
    listActiveVideo: listActiveVideo,
    get: get,
    usedGoods: usedGoods,
    upsert: upsert,
    remove: remove,
    splitVideoQuality: splitVideoQuality,
    expandVideoL2: expandVideoL2,
    resetSeed: function () {
      var s = seed().map(normalize);
      save(s);
      return s;
    }
  };
})(window);
