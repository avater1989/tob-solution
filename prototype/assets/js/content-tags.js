/* 内容标签（可层级）— 替代原内容分类 ContentCats */
(function (global) {
  var KEY = "tob_content_tags_v1";
  var SEQ_KEY = "tob_content_tags_seq_v1";

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function seed() {
    return [
      { id: "TG01", name: "家庭教育", parentId: "", sort: 1, enabled: true },
      { id: "TG02", name: "亲子沟通", parentId: "TG01", sort: 1, enabled: true },
      { id: "TG03", name: "情绪管理", parentId: "TG01", sort: 2, enabled: true },
      { id: "TG04", name: "K12 学习", parentId: "", sort: 2, enabled: true },
      { id: "TG05", name: "阅读启蒙", parentId: "TG04", sort: 1, enabled: true },
      { id: "TG06", name: "学习能力", parentId: "TG04", sort: 2, enabled: true },
      { id: "TG07", name: "AI 工具", parentId: "", sort: 3, enabled: true }
    ];
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
      return list;
    } catch (e) {
      var s3 = seed();
      writeAll(s3);
      return s3;
    }
  }

  function writeAll(list) {
    localStorage.setItem(KEY, JSON.stringify(list || []));
  }

  function nextId() {
    var n = 100;
    try {
      n = parseInt(localStorage.getItem(SEQ_KEY) || "100", 10) || 100;
    } catch (e) {}
    n += 1;
    localStorage.setItem(SEQ_KEY, String(n));
    return "TG" + n;
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function list(opts) {
    opts = opts || {};
    return readAll().filter(function (t) {
      if (opts.enabledOnly && !t.enabled) return false;
      if (opts.parentId != null && String(t.parentId || "") !== String(opts.parentId || "")) return false;
      return true;
    }).map(clone).sort(function (a, b) {
      return (a.sort || 0) - (b.sort || 0) || String(a.name).localeCompare(String(b.name), "zh");
    });
  }

  function get(id) {
    var hit = readAll().find(function (t) { return t.id === id; });
    return hit ? clone(hit) : null;
  }

  function save(tag) {
    if (!tag) throw new Error("tag required");
    var list0 = readAll();
    if (!tag.id) tag.id = nextId();
    var next = clone(tag);
    next.parentId = next.parentId || "";
    next.sort = typeof next.sort === "number" ? next.sort : 99;
    next.enabled = next.enabled !== false;
    var idx = list0.findIndex(function (t) { return t.id === next.id; });
    if (idx >= 0) list0[idx] = next;
    else list0.push(next);
    writeAll(list0);
    return clone(next);
  }

  function remove(id) {
    var kids = readAll().filter(function (t) { return t.parentId === id; });
    if (kids.length) return { ok: false, msg: "请先删除或移走子标签" };
    writeAll(readAll().filter(function (t) { return t.id !== id; }));
    return { ok: true };
  }

  function setEnabled(id, enabled) {
    var t = get(id);
    if (!t) return null;
    t.enabled = !!enabled;
    return save(t);
  }

  /** 扁平树：带 depth / pathLabel */
  function treeFlat(opts) {
    opts = opts || {};
    var all = list(opts.enabledOnly ? { enabledOnly: true } : {});
    var byParent = {};
    all.forEach(function (t) {
      var p = t.parentId || "";
      if (!byParent[p]) byParent[p] = [];
      byParent[p].push(t);
    });
    var out = [];
    function walk(parentId, depth, path) {
      (byParent[parentId] || []).forEach(function (t) {
        var label = path ? path + " / " + t.name : t.name;
        out.push(Object.assign(clone(t), { depth: depth, pathLabel: label }));
        walk(t.id, depth + 1, label);
      });
    }
    walk("", 0, "");
    return out;
  }

  function namesByIds(ids) {
    ids = ids || [];
    var map = {};
    readAll().forEach(function (t) { map[t.id] = t.name; });
    return ids.map(function (id) { return map[id] || id; }).filter(Boolean);
  }

  function labelsHtml(ids) {
    var names = namesByIds(ids);
    if (!names.length) return '<span class="muted">—</span>';
    return names.map(function (n) {
      return '<span class="tag" style="margin:0 4px 4px 0;display:inline-block">' + esc(n) + "</span>";
    }).join("");
  }

  /** 多选 checkbox 组 */
  function checkboxesHtml(selectedIds, opts) {
    opts = opts || {};
    selectedIds = selectedIds || [];
    var name = opts.name || "tagIds";
    var flat = treeFlat({ enabledOnly: true });
    if (!flat.length) return '<span class="muted">暂无标签，请先在「内容标签」中维护</span>';
    return flat.map(function (t) {
      var checked = selectedIds.indexOf(t.id) >= 0 ? " checked" : "";
      var pad = t.depth ? ' style="margin-left:' + (t.depth * 16) + 'px"' : "";
      return '<label' + pad + '><input type="checkbox" name="' + esc(name) + '" value="' + esc(t.id) + '"' + checked + "> " + esc(t.name) + "</label>";
    }).join("<br>");
  }

  function optionsHtml(opts) {
    opts = opts || {};
    var html = "";
    if (opts.allLabel) html += '<option value="">' + esc(opts.allLabel) + "</option>";
    treeFlat({ enabledOnly: true }).forEach(function (t) {
      var prefix = t.depth ? new Array(t.depth + 1).join("—") + " " : "";
      html += '<option value="' + esc(t.id) + '">' + esc(prefix + t.name) + "</option>";
    });
    return html;
  }

  function parentOptionsHtml(excludeId) {
    var html = '<option value="">（无，作为一级标签）</option>';
    treeFlat().forEach(function (t) {
      if (excludeId && (t.id === excludeId || isDescendant(excludeId, t.id))) return;
      var prefix = t.depth ? new Array(t.depth + 1).join("—") + " " : "";
      html += '<option value="' + esc(t.id) + '">' + esc(prefix + t.name) + "</option>";
    });
    return html;
  }

  function isDescendant(ancestorId, nodeId) {
    var cur = get(nodeId);
    var guard = 0;
    while (cur && cur.parentId && guard++ < 20) {
      if (cur.parentId === ancestorId) return true;
      cur = get(cur.parentId);
    }
    return false;
  }

  function resetSeed() {
    localStorage.removeItem(KEY);
    return list();
  }

  /** 注入树状下拉样式（仅一次） */
  function ensureStyle() {
    if (document.getElementById("ct-tree-select-style")) return;
    var css = document.createElement("style");
    css.id = "ct-tree-select-style";
    css.textContent =
      ".ct-ts{position:relative;width:100%;font-size:13px}" +
      ".ct-ts-trigger{min-height:32px;padding:4px 28px 4px 8px;border:1px solid var(--color-border,#e8e8e8);border-radius:6px;background:#fff;cursor:pointer;display:flex;flex-wrap:wrap;gap:4px;align-items:center;box-sizing:border-box}" +
      ".ct-ts-trigger:hover{border-color:#165dff}" +
      ".ct-ts.open .ct-ts-trigger{border-color:#165dff;box-shadow:0 0 0 2px rgba(22,93,255,.12)}" +
      ".ct-ts-trigger::after{content:'▾';position:absolute;right:10px;top:50%;transform:translateY(-50%);color:#8c8c8c;pointer-events:none}" +
      ".ct-ts-ph{color:#bfbfbf}" +
      ".ct-ts-chip{display:inline-flex;align-items:center;gap:4px;padding:1px 6px;background:#e8f3ff;color:#165dff;border-radius:3px;font-size:12px;max-width:140px}" +
      ".ct-ts-chip b{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".ct-ts-chip i{font-style:normal;cursor:pointer;opacity:.7}" +
      ".ct-ts-panel{display:none;position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:40;background:#fff;border:1px solid #e8e8e8;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.08);max-height:280px;overflow:auto;padding:6px 0}" +
      ".ct-ts.open .ct-ts-panel{display:block}" +
      ".ct-ts-item{display:flex;align-items:center;gap:8px;padding:6px 12px;cursor:pointer;user-select:none}" +
      ".ct-ts-item:hover{background:#f7f8fa}" +
      ".ct-ts-item input{margin:0}" +
      ".ct-ts-empty{padding:16px;text-align:center;color:#bfbfbf;font-size:12px}" +
      ".ct-ts-foot{padding:6px 12px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;gap:8px;position:sticky;bottom:0;background:#fff}" +
      ".ct-ts-foot button{font-size:12px;padding:2px 8px}";
    document.head.appendChild(css);
  }

  /**
   * 树状下拉多选
   * @param {HTMLElement|string} el
   * @param {{selectedIds?:string[],placeholder?:string,onChange?:Function,compact?:boolean}} opts
   * @returns {{getSelected:Function,setSelected:Function,clear:Function}}
   */
  function mountTreeSelect(el, opts) {
    ensureStyle();
    opts = opts || {};
    var host = typeof el === "string" ? document.querySelector(el) : el;
    if (!host) return { getSelected: function () { return []; }, setSelected: function () {}, clear: function () {} };
    var selected = (opts.selectedIds || []).slice();
    var placeholder = opts.placeholder || "请选择内容标签";
    var onChange = opts.onChange || function () {};

    host.innerHTML = "";
    var root = document.createElement("div");
    root.className = "ct-ts";
    if (opts.compact) root.style.width = opts.width || "200px";
    var trigger = document.createElement("div");
    trigger.className = "ct-ts-trigger";
    var panel = document.createElement("div");
    panel.className = "ct-ts-panel";
    root.appendChild(trigger);
    root.appendChild(panel);
    host.appendChild(root);

    function renderTrigger() {
      if (!selected.length) {
        trigger.innerHTML = '<span class="ct-ts-ph">' + esc(placeholder) + "</span>";
        return;
      }
      trigger.innerHTML = selected.map(function (id) {
        var t = get(id);
        var name = t ? t.name : id;
        return '<span class="ct-ts-chip" data-id="' + esc(id) + '"><b>' + esc(name) + '</b><i data-rm="' + esc(id) + '">×</i></span>';
      }).join("");
    }

    function renderPanel() {
      var flat = treeFlat({ enabledOnly: true });
      if (!flat.length) {
        panel.innerHTML = '<div class="ct-ts-empty">暂无标签，请先在「内容标签」中维护</div>';
        return;
      }
      var rows = flat.map(function (t) {
        var checked = selected.indexOf(t.id) >= 0 ? " checked" : "";
        var pad = 12 + (t.depth || 0) * 16;
        return '<label class="ct-ts-item" style="padding-left:' + pad + 'px">' +
          '<input type="checkbox" value="' + esc(t.id) + '"' + checked + ">" +
          "<span>" + esc(t.name) + "</span></label>";
      }).join("");
      panel.innerHTML = rows +
        '<div class="ct-ts-foot"><button type="button" data-act="clear">清空</button><button type="button" class="btn btn-primary btn-sm" data-act="ok">确定</button></div>';
    }

    function emit() {
      onChange(selected.slice());
    }

    function open() {
      renderPanel();
      root.classList.add("open");
    }
    function close() {
      root.classList.remove("open");
    }

    trigger.addEventListener("click", function (e) {
      var rm = e.target.getAttribute("data-rm");
      if (rm) {
        e.stopPropagation();
        selected = selected.filter(function (id) { return id !== rm; });
        renderTrigger();
        emit();
        return;
      }
      if (root.classList.contains("open")) close();
      else open();
    });

    panel.addEventListener("click", function (e) {
      e.stopPropagation();
      var act = e.target.getAttribute("data-act");
      if (act === "clear") {
        selected = [];
        renderPanel();
        renderTrigger();
        emit();
        return;
      }
      if (act === "ok") {
        close();
        return;
      }
    });

    panel.addEventListener("change", function (e) {
      var input = e.target;
      if (!input || input.type !== "checkbox") return;
      var id = input.value;
      if (input.checked) {
        if (selected.indexOf(id) < 0) selected.push(id);
      } else {
        selected = selected.filter(function (x) { return x !== id; });
      }
      renderTrigger();
      emit();
    });

    document.addEventListener("click", function (e) {
      if (!root.contains(e.target)) close();
    });

    renderTrigger();

    return {
      getSelected: function () { return selected.slice(); },
      setSelected: function (ids) {
        selected = (ids || []).slice();
        renderTrigger();
        if (root.classList.contains("open")) renderPanel();
      },
      clear: function () {
        selected = [];
        renderTrigger();
        emit();
      }
    };
  }

  global.ContentTags = {
    KEY: KEY,
    list: list,
    get: get,
    save: save,
    remove: remove,
    setEnabled: setEnabled,
    treeFlat: treeFlat,
    namesByIds: namesByIds,
    labelsHtml: labelsHtml,
    checkboxesHtml: checkboxesHtml,
    optionsHtml: optionsHtml,
    parentOptionsHtml: parentOptionsHtml,
    mountTreeSelect: mountTreeSelect,
    nextId: nextId,
    resetSeed: resetSeed,
    esc: esc
  };
})(window);
