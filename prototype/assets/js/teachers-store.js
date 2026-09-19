/* 讲师管理 Store */
(function (global) {
  var KEY = "tob_teachers_v2";
  var SEQ_KEY = "tob_teachers_seq_v1";
  var DEFAULT_AVATAR = "../assets/img/mp-home/av-1.png";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function seed() {
    return [
      { id: "TCH01", name: "张老师", avatar: "../assets/img/mp-home/av-1.png", title: "资深阅读启蒙导师", intro: "十年小学语文教学经验，专注儿童阅读兴趣培养。", enabled: true },
      { id: "TCH02", name: "李老师", avatar: "../assets/img/mp-home/av-2.png", title: "家庭教育咨询师", intro: "国家二级心理咨询师，擅长家长情绪管理与亲子沟通。", enabled: true },
      { id: "TCH03", name: "王博士", avatar: "../assets/img/mp-home/av-3.png", title: "学习科学研究者", intro: "关注 AI 与学习规划结合，服务过上百个家庭。", enabled: true },
      { id: "TCH04", name: "平台教研", avatar: "../assets/img/covers/live-host.jpg", title: "平台标准课教研组", intro: "平台统一教研产出。", enabled: true }
    ];
  }

  function normalize(t) {
    t = t || {};
    return {
      id: t.id,
      name: t.name || "",
      avatar: t.avatar || DEFAULT_AVATAR,
      title: t.title || "",
      intro: t.intro || "",
      enabled: t.enabled !== false
    };
  }

  function readAll() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) {
        var s = seed();
        writeAll(s);
        return s;
      }
      var list = JSON.parse(raw);
      if (!Array.isArray(list) || !list.length) {
        var s2 = seed();
        writeAll(s2);
        return s2;
      }
      return list.map(normalize);
    } catch (e) {
      var s3 = seed();
      writeAll(s3);
      return s3;
    }
  }

  function writeAll(list) {
    localStorage.setItem(KEY, JSON.stringify((list || []).map(normalize)));
  }

  function nextId() {
    var n = 100;
    try {
      n = parseInt(localStorage.getItem(SEQ_KEY) || "100", 10) || 100;
    } catch (e) {}
    n += 1;
    localStorage.setItem(SEQ_KEY, String(n));
    return "TCH" + n;
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function list(opts) {
    opts = opts || {};
    return readAll().filter(function (t) {
      if (opts.enabledOnly && !t.enabled) return false;
      if (opts.keyword) {
        var kw = String(opts.keyword).toLowerCase();
        var blob = (t.name + " " + (t.title || "") + " " + (t.intro || "")).toLowerCase();
        if (blob.indexOf(kw) === -1) return false;
      }
      return true;
    }).map(clone);
  }

  function get(id) {
    var hit = readAll().find(function (t) { return t.id === id; });
    return hit ? clone(hit) : null;
  }

  function nameOf(id) {
    var t = get(id);
    return t ? t.name : (id || "—");
  }

  function avatarOf(id) {
    var t = get(id);
    return t ? (t.avatar || DEFAULT_AVATAR) : DEFAULT_AVATAR;
  }

  /** 圆形头像 HTML */
  function avatarHtml(tOrId, opts) {
    opts = opts || {};
    var size = opts.size || 36;
    var t = typeof tOrId === "string" ? get(tOrId) : tOrId;
    var src = (t && t.avatar) || DEFAULT_AVATAR;
    var name = (t && t.name) || "";
    var cls = opts.className || "";
    return '<img class="tch-avatar ' + esc(cls) + '" src="' + esc(src) + '" alt="' + esc(name) +
      '" width="' + size + '" height="' + size + '" style="width:' + size + "px;height:" + size +
      'px;border-radius:50%;object-fit:cover;display:inline-block;vertical-align:middle;background:#f2f3f5" />';
  }

  function save(row) {
    if (!row) throw new Error("teacher required");
    var list0 = readAll();
    if (!row.id) row.id = nextId();
    var next = normalize(row);
    next.name = (next.name || "").trim();
    if (!next.name) throw new Error("name required");
    var idx = list0.findIndex(function (t) { return t.id === next.id; });
    if (idx >= 0) list0[idx] = next;
    else list0.unshift(next);
    writeAll(list0);
    return clone(next);
  }

  function remove(id) {
    writeAll(readAll().filter(function (t) { return t.id !== id; }));
  }

  function setEnabled(id, enabled) {
    var t = get(id);
    if (!t) return null;
    t.enabled = !!enabled;
    return save(t);
  }

  function optionsHtml(opts) {
    opts = opts || {};
    var html = "";
    if (opts.emptyLabel) html += '<option value="">' + esc(opts.emptyLabel) + "</option>";
    list({ enabledOnly: true }).forEach(function (t) {
      html += '<option value="' + esc(t.id) + '">' + esc(t.name) + (t.title ? " · " + esc(t.title) : "") + "</option>";
    });
    return html;
  }

  function resetSeed() {
    localStorage.removeItem(KEY);
    return list();
  }

  global.Teachers = {
    KEY: KEY,
    DEFAULT_AVATAR: DEFAULT_AVATAR,
    list: list,
    get: get,
    nameOf: nameOf,
    avatarOf: avatarOf,
    avatarHtml: avatarHtml,
    save: save,
    remove: remove,
    setEnabled: setEnabled,
    optionsHtml: optionsHtml,
    nextId: nextId,
    resetSeed: resetSeed,
    esc: esc
  };
})(window);
