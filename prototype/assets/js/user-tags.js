/* 用户标签目录 — 与用户列表批量打标共用（localStorage） */
(function (global) {
  var KEY = "merchant_user_tags_v1";

  var DEFAULTS = [
    { id: "t_high", name: "高意向", group: "意向", color: "blue", enabled: true, users: 128, desc: "销售标记的高转化意向" },
    { id: "t_trial", name: "已购引流课", group: "成交", color: "green", enabled: true, users: 286, desc: "已购买引流/体验课" },
    { id: "t_camp", name: "训练营学员", group: "成交", color: "green", enabled: true, users: 96, desc: "正式训练营在读或结营" },
    { id: "t_live", name: "直播高活跃", group: "行为", color: "orange", enabled: true, users: 64, desc: "近 30 日到课或互动偏高" },
    { id: "t_churn", name: "流失预警", group: "风险", color: "red", enabled: true, users: 42, desc: "企微互动下降或即将流失" },
    { id: "t_vip", name: "老客复购", group: "成交", color: "purple", enabled: true, users: 31, desc: "二次及以上付费" },
    { id: "t_sms", name: "短信可达", group: "触达", color: "teal", enabled: false, users: 0, desc: "已停用示例标签" }
  ];

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
    var map = {};
    load().forEach(function (t) {
      var g = t.group || "未分组";
      map[g] = (map[g] || 0) + 1;
    });
    return Object.keys(map).map(function (k) { return { name: k, count: map[k] }; });
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
    colorClass: colorClass,
    renderPick: renderPick,
    selectedFromPick: selectedFromPick,
    resetDefaults: function () { save(DEFAULTS.map(function (t) { return Object.assign({}, t); })); }
  };
})(window);
