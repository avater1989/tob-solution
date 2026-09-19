/* 商品类目（两级）+ 商品标签（扁平）— 店铺商品 / 微信小店商品共用 */
(function (global) {
  var CAT_KEY = "tob_goods_category_v1";
  var CAT_SEQ = "tob_goods_category_seq_v1";
  var TAG_KEY = "tob_goods_tags_v1";
  var TAG_SEQ = "tob_goods_tags_seq_v1";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  /* ---------- 类目 ---------- */
  function catSeed() {
    return [
      { id: "GC01", name: "教育服务", parentId: "", sort: 1, enabled: true },
      { id: "GC02", name: "线上咨询", parentId: "GC01", sort: 1, enabled: true },
      { id: "GC03", name: "1v1 辅导", parentId: "GC01", sort: 2, enabled: true },
      { id: "GC04", name: "直播互动", parentId: "GC01", sort: 3, enabled: true },
      { id: "GC05", name: "学习陪伴", parentId: "GC01", sort: 4, enabled: true },
      { id: "GC06", name: "家长课堂", parentId: "", sort: 2, enabled: true },
      { id: "GC07", name: "亲子沟通", parentId: "GC06", sort: 1, enabled: true },
      { id: "GC08", name: "学科提分", parentId: "", sort: 3, enabled: true }
    ];
  }

  function readCats() {
    try {
      var raw = localStorage.getItem(CAT_KEY);
      if (!raw) {
        var s = catSeed();
        writeCats(s);
        return s;
      }
      var list = JSON.parse(raw);
      if (!Array.isArray(list) || !list.length) {
        var s2 = catSeed();
        writeCats(s2);
        return s2;
      }
      return list;
    } catch (e) {
      var s3 = catSeed();
      writeCats(s3);
      return s3;
    }
  }

  function writeCats(list) {
    localStorage.setItem(CAT_KEY, JSON.stringify(list || []));
  }

  function nextCatId() {
    var n = 100;
    try {
      n = parseInt(localStorage.getItem(CAT_SEQ) || "100", 10) || 100;
    } catch (e) {}
    n += 1;
    localStorage.setItem(CAT_SEQ, String(n));
    return "GC" + n;
  }

  function listCats(opts) {
    opts = opts || {};
    return readCats().filter(function (t) {
      if (opts.enabledOnly && !t.enabled) return false;
      if (opts.parentId != null && String(t.parentId || "") !== String(opts.parentId || "")) return false;
      return true;
    }).map(clone).sort(function (a, b) {
      return (a.sort || 0) - (b.sort || 0) || String(a.name).localeCompare(String(b.name), "zh");
    });
  }

  function getCat(id) {
    var hit = readCats().find(function (t) { return t.id === id; });
    return hit ? clone(hit) : null;
  }

  function saveCat(cat) {
    if (!cat) throw new Error("cat required");
    var list0 = readCats();
    if (!cat.id) cat.id = nextCatId();
    var next = clone(cat);
    next.parentId = next.parentId || "";
    next.sort = typeof next.sort === "number" ? next.sort : 99;
    next.enabled = next.enabled !== false;
    var idx = list0.findIndex(function (t) { return t.id === next.id; });
    if (idx >= 0) list0[idx] = next;
    else list0.push(next);
    writeCats(list0);
    return clone(next);
  }

  function removeCat(id) {
    var kids = readCats().filter(function (t) { return t.parentId === id; });
    if (kids.length) return { ok: false, msg: "请先删除或移走子类目" };
    writeCats(readCats().filter(function (t) { return t.id !== id; }));
    return { ok: true };
  }

  function catTreeFlat() {
    var all = listCats();
    var byParent = {};
    all.forEach(function (t) {
      var p = t.parentId || "";
      if (!byParent[p]) byParent[p] = [];
      byParent[p].push(t);
    });
    var out = [];
    function walk(pid, depth) {
      (byParent[pid] || []).forEach(function (t) {
        var row = clone(t);
        row.depth = depth;
        out.push(row);
        walk(t.id, depth + 1);
      });
    }
    walk("", 0);
    return out;
  }

  function catPathLabel(id) {
    var c = getCat(id);
    if (!c) return "";
    if (!c.parentId) return c.name;
    var p = getCat(c.parentId);
    return (p ? p.name + " / " : "") + c.name;
  }

  function catOptionsHtml(selectedId) {
    return catTreeFlat().filter(function (t) { return t.enabled !== false; }).map(function (t) {
      var indent = t.depth ? new Array(t.depth + 1).join("— ") : "";
      var sel = selectedId && t.id === selectedId ? " selected" : "";
      return '<option value="' + esc(t.id) + '"' + sel + ">" + indent + esc(t.name) + "</option>";
    }).join("");
  }

  function catParentOptionsHtml(excludeId, selected) {
    var html = '<option value="">无（一级类目）</option>';
    listCats().forEach(function (t) {
      if (excludeId && t.id === excludeId) return;
      if (t.parentId) return;
      var sel = selected && t.id === selected ? " selected" : "";
      html += '<option value="' + esc(t.id) + '"' + sel + ">" + esc(t.name) + "</option>";
    });
    return html;
  }

  /* ---------- 标签 ---------- */
  function tagSeed() {
    return [
      { id: "GT01", name: "热卖", sort: 1, enabled: true },
      { id: "GT02", name: "新课", sort: 2, enabled: true },
      { id: "GT03", name: "限量", sort: 3, enabled: true },
      { id: "GT04", name: "精品", sort: 4, enabled: true },
      { id: "GT05", name: "入门", sort: 5, enabled: true }
    ];
  }

  function readTags() {
    try {
      var raw = localStorage.getItem(TAG_KEY);
      if (!raw) {
        var s = tagSeed();
        writeTags(s);
        return s;
      }
      var list = JSON.parse(raw);
      if (!Array.isArray(list) || !list.length) {
        var s2 = tagSeed();
        writeTags(s2);
        return s2;
      }
      return list;
    } catch (e) {
      var s3 = tagSeed();
      writeTags(s3);
      return s3;
    }
  }

  function writeTags(list) {
    localStorage.setItem(TAG_KEY, JSON.stringify(list || []));
  }

  function nextTagId() {
    var n = 100;
    try {
      n = parseInt(localStorage.getItem(TAG_SEQ) || "100", 10) || 100;
    } catch (e) {}
    n += 1;
    localStorage.setItem(TAG_SEQ, String(n));
    return "GT" + n;
  }

  function listTags(opts) {
    opts = opts || {};
    return readTags().filter(function (t) {
      if (opts.enabledOnly && !t.enabled) return false;
      return true;
    }).map(clone).sort(function (a, b) {
      return (a.sort || 0) - (b.sort || 0) || String(a.name).localeCompare(String(b.name), "zh");
    });
  }

  function getTag(id) {
    var hit = readTags().find(function (t) { return t.id === id; });
    return hit ? clone(hit) : null;
  }

  function saveTag(tag) {
    if (!tag) throw new Error("tag required");
    var list0 = readTags();
    if (!tag.id) tag.id = nextTagId();
    var next = clone(tag);
    next.sort = typeof next.sort === "number" ? next.sort : 99;
    next.enabled = next.enabled !== false;
    var idx = list0.findIndex(function (t) { return t.id === next.id; });
    if (idx >= 0) list0[idx] = next;
    else list0.push(next);
    writeTags(list0);
    return clone(next);
  }

  function removeTag(id) {
    writeTags(readTags().filter(function (t) { return t.id !== id; }));
    return { ok: true };
  }

  function tagNames(ids) {
    if (!Array.isArray(ids) || !ids.length) return [];
    var map = {};
    readTags().forEach(function (t) { map[t.id] = t.name; });
    return ids.map(function (id) { return map[id] || id; }).filter(Boolean);
  }

  function CONTENT_TYPES() {
    return [
      { key: "online_course", label: "线上课" },
      { key: "offline", label: "线下课" },
      { key: "article", label: "文章" },
      { key: "plan", label: "定制化计划" },
      { key: "live", label: "直播" },
      { key: "offline_ticket", label: "线下门票" }
    ];
  }

  function contentTypeLabel(key) {
    var hit = CONTENT_TYPES().find(function (t) { return t.key === key; });
    return hit ? hit.label : (key || "—");
  }

  global.GoodsTaxonomy = {
    esc: esc,
    listCats: listCats,
    getCat: getCat,
    saveCat: saveCat,
    removeCat: removeCat,
    catTreeFlat: catTreeFlat,
    catPathLabel: catPathLabel,
    catOptionsHtml: catOptionsHtml,
    catParentOptionsHtml: catParentOptionsHtml,
    listTags: listTags,
    getTag: getTag,
    saveTag: saveTag,
    removeTag: removeTag,
    tagNames: tagNames,
    CONTENT_TYPES: CONTENT_TYPES,
    contentTypeLabel: contentTypeLabel
  };
})(typeof window !== "undefined" ? window : this);
