/* 用户标签目录 — 与用户列表批量打标共用（localStorage） */
(function (global) {
  var KEY = "merchant_user_tags_v1";
  var GROUP_KEY = "merchant_user_tag_groups_v1";

  var DEFAULTS = [
    { id: "t_high", name: "高意向", group: "意向", color: "blue", enabled: true, users: 128, desc: "销售标记的高转化意向" },
    { id: "t_trial", name: "已购引流课", group: "成交", color: "green", enabled: true, users: 286, desc: "已购买引流/体验课" },
    { id: "t_camp", name: "训练营学员", group: "成交", color: "green", enabled: true, users: 96, desc: "正式训练营在读或结营" },
    { id: "t_live", name: "直播高活跃", group: "行为", color: "orange", enabled: true, users: 64, desc: "近 30 日到课或互动偏高" },
    { id: "t_churn", name: "流失预警", group: "风险", color: "red", enabled: true, users: 42, desc: "企微互动下降或即将流失" },
    { id: "t_vip", name: "老客复购", group: "成交", color: "purple", enabled: true, users: 31, desc: "二次及以上付费" },
    { id: "t_sms", name: "短信可达", group: "触达", color: "teal", enabled: false, users: 0, desc: "已停用示例标签" }
  ];

  var DEFAULT_GROUPS = ["意向", "成交", "行为", "风险", "触达", "未分组"];

  function uid() {
    return "t_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var list = JSON.parse(raw);
        if (Array.isArray(list) && list.length) return list;
      }
    } catch (e) {}
    save(DEFAULTS);
    return DEFAULTS.map(function (t) { return Object.assign({}, t); });
  }

  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function loadGroupNames() {
    try {
      var raw = localStorage.getItem(GROUP_KEY);
      if (raw) {
        var list = JSON.parse(raw);
        if (Array.isArray(list) && list.length) {
          return list.map(function (n) { return String(n || "").trim(); }).filter(Boolean);
        }
      }
    } catch (e) {}
    var seed = DEFAULT_GROUPS.slice();
    load().forEach(function (t) {
      var g = String(t.group || "").trim() || "未分组";
      if (seed.indexOf(g) < 0) seed.push(g);
    });
    saveGroupNames(seed);
    return seed;
  }

  function saveGroupNames(names) {
    var uniq = [];
    names.forEach(function (n) {
      var s = String(n || "").trim();
      if (s && uniq.indexOf(s) < 0) uniq.push(s);
    });
    localStorage.setItem(GROUP_KEY, JSON.stringify(uniq));
    return uniq;
  }

  function ensureGroup(name) {
    var n = String(name || "").trim() || "未分组";
    var names = loadGroupNames();
    if (names.indexOf(n) < 0) {
      names.push(n);
      saveGroupNames(names);
    }
    return n;
  }

  function all() {
    return load();
  }

  function enabled() {
    return load().filter(function (t) { return t.enabled !== false; });
  }

  function byId(id) {
    return load().filter(function (t) { return t.id === id; })[0] || null;
  }

  function upsert(tag) {
    var list = load();
    tag.group = ensureGroup(tag.group);
    if (!tag.id) {
      tag.id = uid();
      tag.users = tag.users || 0;
      tag.enabled = tag.enabled !== false;
      list.push(tag);
    } else {
      var i = -1;
      list.forEach(function (t, idx) { if (t.id === tag.id) i = idx; });
      if (i >= 0) list[i] = Object.assign({}, list[i], tag);
      else list.push(tag);
    }
    save(list);
    return tag;
  }

  function setEnabled(id, on) {
    var list = load();
    list.forEach(function (t) {
      if (t.id === id) t.enabled = !!on;
    });
    save(list);
  }

  function remove(id) {
    save(load().filter(function (t) { return t.id !== id; }));
  }

  function groups() {
    var names = loadGroupNames();
    var map = {};
    names.forEach(function (n) {
      map[n] = { name: n, count: 0, users: 0 };
    });
    load().forEach(function (t) {
      var g = String(t.group || "").trim() || "未分组";
      if (!map[g]) map[g] = { name: g, count: 0, users: 0 };
      map[g].count += 1;
      map[g].users += (t.users || 0);
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  function addGroup(name) {
    var n = String(name || "").trim();
    if (!n) return { ok: false, error: "empty" };
    var names = loadGroupNames();
    if (names.indexOf(n) >= 0) return { ok: false, error: "duplicate" };
    names.push(n);
    saveGroupNames(names);
    return { ok: true };
  }

  function renameGroup(oldName, newName) {
    var o = String(oldName || "").trim();
    var n = String(newName || "").trim();
    if (!o || !n) return { ok: false, error: "empty" };
    if (o === n) return { ok: true, touched: 0 };
    var names = loadGroupNames();
    if (names.indexOf(o) < 0) return { ok: false, error: "missing" };
    if (names.indexOf(n) >= 0) return { ok: false, error: "duplicate" };
    names = names.map(function (x) { return x === o ? n : x; });
    saveGroupNames(names);
    var list = load();
    var touched = 0;
    list.forEach(function (t) {
      if ((t.group || "未分组") === o) {
        t.group = n;
        touched++;
      }
    });
    save(list);
    return { ok: true, touched: touched };
  }

  function deleteGroup(name) {
    var n = String(name || "").trim();
    if (!n) return { ok: false, error: "empty" };
    if (n === "未分组") return { ok: false, error: "protected" };
    var names = loadGroupNames().filter(function (x) { return x !== n; });
    if (names.indexOf("未分组") < 0) names.push("未分组");
    saveGroupNames(names);
    var list = load();
    var touched = 0;
    list.forEach(function (t) {
      if ((t.group || "未分组") === n) {
        t.group = "未分组";
        touched++;
      }
    });
    save(list);
    return { ok: true, touched: touched };
  }

  function colorClass(c) {
    var map = {
      blue: "tag-blue",
      green: "tag-green",
      orange: "tag-orange",
      red: "tag-red",
      purple: "tag-purple",
      teal: "tag-teal"
    };
    return map[c] || "tag-blue";
  }

  /** 渲染批量打标多选区 */
  function renderPick(container, selectedIds) {
    if (!container) return;
    selectedIds = selectedIds || [];
    var list = enabled();
    if (!list.length) {
      container.innerHTML = '<p class="muted" style="margin:0;font-size:12px">暂无可用标签，请先在 <a href="user-tags.html">标签管理</a> 中创建。</p>';
      return;
    }
    container.innerHTML = list.map(function (t) {
      var checked = selectedIds.indexOf(t.id) >= 0 || selectedIds.indexOf(t.name) >= 0 ? " checked" : "";
      return '<label class="tp-item" data-tag-id="' + t.id + '"><input type="checkbox" value="' + t.id + '"' + checked + " /> " +
        t.name + (t.group ? '<span class="muted" style="margin-left:4px;font-size:11px">· ' + t.group + "</span>" : "") +
        "</label>";
    }).join("");
  }

  function selectedFromPick(container) {
    if (!container) return [];
    return [].map.call(container.querySelectorAll("input:checked"), function (el) {
      return el.value;
    });
  }

  global.UserTags = {
    KEY: KEY,
    all: all,
    enabled: enabled,
    byId: byId,
    upsert: upsert,
    setEnabled: setEnabled,
    remove: remove,
    groups: groups,
    addGroup: addGroup,
    renameGroup: renameGroup,
    deleteGroup: deleteGroup,
    colorClass: colorClass,
    renderPick: renderPick,
    selectedFromPick: selectedFromPick,
    resetDefaults: function () {
      save(DEFAULTS.map(function (t) { return Object.assign({}, t); }));
      saveGroupNames(DEFAULT_GROUPS.slice());
    }
  };
})(window);
