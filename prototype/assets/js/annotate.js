/* 原型评审标注层 · annotate.js
 * 用法：Alt+E 进入/退出标注模式 → 点击元素 → 写意见 → 保存。
 * 标注会记录三重锚点（页面路径 + CSS 选择器 + 元素文本/HTML 快照），
 * 供后续按标注精确改代码。数据落盘到 _review/annotations.json 与 .md。
 *
 * 说明：本文件不修改 prototype 下任何页面的 DOM 结构，只读不改；
 * 角标与高亮全部绘制在独立的 __ann_layer 图层里。
 */
(function () {
  if (window.__PROTO_REVIEW_LOADED__) return;
  window.__PROTO_REVIEW_LOADED__ = true;

  var STORE_KEY = "proto:review:v1";
  var SERVER = "/__review";
  var TYPES = [
    { id: "copy", label: "文案" },
    { id: "layout", label: "布局" },
    { id: "interaction", label: "交互" },
    { id: "add", label: "新增" },
    { id: "remove", label: "删除" },
    { id: "question", label: "疑问" }
  ];
  var PRIS = ["P0", "P1", "P2"];
  var STATUS_TEXT = { open: "待处理", resolved: "已修改", wontfix: "不修改" };
  var TYPE_TEXT = {};
  TYPES.forEach(function (t) {
    TYPE_TEXT[t.id] = t.label;
  });

  var isFile = location.protocol === "file:";
  var serverOK = false;
  var state = {
    mode: false,
    items: [],
    editId: null,
    draft: null,
    listOpen: false,
    filter: "all",
    selEl: null,
    hoverEl: null,
    dom: {}
  };

  /* ---------------- 基础工具 ---------------- */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function collapse(s) {
    return String(s == null ? "" : s).replace(/\s+/g, " ").trim();
  }

  function uid() {
    return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function pageKey() {
    var p = decodeURIComponent(location.pathname);
    var i = p.indexOf("/prototype/");
    if (i >= 0) return p.slice(i + "/prototype/".length);
    var m = p.match(/(admin|ops|miniprogram)\/([^/]+\.html)$/);
    if (m) return m[1] + "/" + m[2];
    return p.split("/").pop() || "index.html";
  }

  function isUI(el) {
    return !!(el && el.closest && el.closest("[data-ann-ui]"));
  }

  function isPageLevel(el) {
    if (!el || el.nodeType !== 1) return true;
    var t = el.tagName.toLowerCase();
    return t === "html" || t === "body" || el.id === "__ann_layer";
  }

  function cssEscape(s) {
    if (window.CSS && CSS.escape) return CSS.escape(s);
    return String(s).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  /* 生成从 stop（不含）到 el（含）的稳定选择器：优先用 id，其余用 nth-of-type */
  function cssPath(el, stop) {
    var parts = [];
    var node = el;
    while (node && node.nodeType === 1 && node !== stop && node !== document.documentElement) {
      if (node.id && node.id.indexOf("__ann") !== 0 && node.id !== "page-content" && node.id !== "header-actions") {
        parts.unshift("#" + cssEscape(node.id));
        return parts.join(" > ");
      }
      var tag = node.tagName.toLowerCase();
      var parent = node.parentElement;
      if (parent) {
        var same = [];
        for (var i = 0; i < parent.children.length; i++) {
          if (parent.children[i].tagName === node.tagName) same.push(parent.children[i]);
        }
        if (same.length > 1) tag += ":nth-of-type(" + (same.indexOf(node) + 1) + ")";
      }
      parts.unshift(tag);
      node = parent;
    }
    return parts.join(" > ");
  }

  var ROOTS = [
    { sel: "#page-content", region: "content" },
    { sel: "#page-header-actions", region: "header-actions" },
    { sel: "#header-actions", region: "header-actions" },
    { sel: ".mp-body", region: "mp" },
    { sel: ".mp-frame", region: "mp" },
    { sel: ".hub-inner", region: "hub" }
  ];

  function anchorRoot(el) {
    for (var i = 0; i < ROOTS.length; i++) {
      var r = document.querySelector(ROOTS[i].sel);
      if (r && r.contains(el)) return { root: r, region: ROOTS[i].region, sel: ROOTS[i].sel };
    }
    /* 落在由 shell 脚本生成的顶栏/侧栏区域：需改脚本而非页面 */
    if (el.closest && el.closest(".admin-app, .ops-app")) return { root: null, region: "shell", sel: "" };
    return { root: null, region: "page", sel: "" };
  }

  function shellOwner(el) {
    var cls = (el.getAttribute("class") || "") + " " + (el.parentElement ? el.parentElement.getAttribute("class") || "" : "");
    if (/\bmp-tabbar\b|review-bar/.test(cls)) return "mp-shell.js";
    if (/admin-topbar|sidebar|admin-brand|admin-modules/.test(cls)) return "admin-shell.js";
    if (/ops-topbar|ops-sidebar/.test(cls)) return "ops-shell.js";
    var r = el.closest && el.closest(".admin-app,.mp-frame,.ops-app");
    if (r) {
      var c = r.getAttribute("class") || "";
      if (/mp-frame/.test(c)) return "mp-shell.js";
      if (/ops-app/.test(c)) return "ops-shell.js";
      if (/admin-app/.test(c)) return "admin-shell.js";
    }
    return "";
  }

  function describe(el) {
    var tag = el.tagName.toLowerCase();
    var cls = (el.getAttribute("class") || "").trim().split(/\s+/).filter(Boolean).slice(0, 3).join(".");
    return tag + (el.id ? "#" + el.id : "") + (cls ? "." + cls : "");
  }

  function makeAnchor(el) {
    var a = anchorRoot(el);
    var txt = collapse(el.textContent);
    var html = el.outerHTML || "";
    return {
      selector: cssPath(el, null),
      selectorIn: a.root ? cssPath(el, a.root) : "",
      root: a.sel,
      region: a.region,
      shell: a.region === "shell" ? shellOwner(el) : "",
      label: describe(el),
      text: txt.slice(0, 160),
      html: collapse(html).slice(0, 280)
    };
  }

  /* ---------------- 持久化 ---------------- */

  function readLocal() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return [];
      var d = JSON.parse(raw);
      return (d && d.items) || [];
    } catch (e) {
      return [];
    }
  }

  function writeLocal(items) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ v: 1, updated: new Date().toISOString(), items: items }));
    } catch (e) {}
  }

  function ping() {
    if (isFile || !window.fetch) return Promise.resolve(false);
    return fetch(SERVER + "/ping?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) {
        return r.ok;
      })
      .catch(function () {
        return false;
      });
  }

  function loadRemote() {
    if (!serverOK) return Promise.resolve([]);
    return fetch(SERVER + "/load?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        return (d && d.items) || [];
      })
      .catch(function () {
        return [];
      });
  }

  function mergeItems(remote, local) {
    var byId = {};
    var out = [];
    function push(it, prefer) {
      if (!it || !it.id) return;
      var cur = byId[it.id];
      if (!cur) {
        byId[it.id] = it;
        out.push(it);
      } else if (prefer) {
        out[out.indexOf(cur)] = it;
        byId[it.id] = it;
      }
    }
    (remote || []).forEach(function (it) {
      push(it, false);
    });
    (local || []).forEach(function (it) {
      push(it, false);
    });
    out.sort(function (a, b) {
      return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });
    return out;
  }

  function persist(quiet) {
    writeLocal(state.items);
    if (!serverOK) {
      setHint("error", "本地模式：标注只存在浏览器里，请用 _review/serve.py 启动服务后再标，否则文件不落盘");
      return Promise.resolve(false);
    }
    return fetch(SERVER + "/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pageKey(), items: state.items })
    })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (d) {
        setHint("server", "已写入 _review/annotations.json（共 " + (d.count || state.items.length) + " 条）");
        return true;
      })
      .catch(function () {
        setHint("error", "写入失败，已暂存在浏览器；请确认 _review/serve.py 正在运行");
        return false;
      });
  }

  function setHint(kind, msg) {
    if (!state.dom.hint) return;
    state.dom.hint.setAttribute("data-state", kind);
    state.dom.hint.textContent = msg || "";
  }

  /* ---------------- 图层渲染 ---------------- */

  function ensureLayer() {
    if (state.dom.layer) return state.dom.layer;
    var l = document.createElement("div");
    l.id = "__ann_layer";
    l.setAttribute("data-ann-ui", "1");
    document.body.appendChild(l);
    state.dom.layer = l;
    return l;
  }

  function pageItems() {
    var key = pageKey();
    return state.items.filter(function (it) {
      return it.page === key;
    });
  }

  /* 原型里 html/body 被设为 overflow:hidden，真正滚动的是 .main（管理端）与 .mp-body（小程序）。
     故统一用视口坐标定位，配合图层自身的 position:fixed，避免窗口滚动偏移算错。 */
  function docPos(el) {
    var r = el.getBoundingClientRect();
    return { top: r.top, left: r.left, w: r.width, h: r.height };
  }

  function scrollerOf(el) {
    var n = el.parentElement;
    while (n && n !== document.body && n !== document.documentElement) {
      var st = window.getComputedStyle(n);
      if (/auto|scroll/.test(st.overflowY + " " + st.overflowX)) return n;
      n = n.parentElement;
    }
    return null;
  }

  /* 元素滚出所在滚动容器可视区时，不再画角标，避免角标飘在无关位置 */
  function clippedOut(el, pos) {
    var sc = scrollerOf(el);
    if (!sc) return false;
    var sr = sc.getBoundingClientRect();
    if (sr.width < 2 || sr.height < 2) return true;
    return (
      pos.top + pos.h < sr.top + 2 ||
      pos.top > sr.bottom - 2 ||
      pos.left + pos.w < sr.left + 2 ||
      pos.left > sr.right - 2
    );
  }

  function render() {
    var layer = ensureLayer();
    var items = pageItems();
    layer.innerHTML = "";
    if (state.dom.fabN) {
      state.dom.fabN.textContent = items.length;
      state.dom.fabN.setAttribute("data-zero", items.length ? "0" : "1");
    }
    items.forEach(function (it, idx) {
      var el = null;
      try {
        el = document.querySelector(it.anchor.selector);
      } catch (e) {}
      it._stale = !el;
      if (!el) return;
      var p = docPos(el);
      if (clippedOut(el, p)) return;
      var region = document.createElement("div");
      region.className = "__ann_region";
      region.setAttribute("data-status", it.status || "open");
      region.style.left = p.left - 2 + "px";
      region.style.top = p.top - 2 + "px";
      region.style.width = p.w + 4 + "px";
      region.style.height = p.h + 4 + "px";
      layer.appendChild(region);

      var pin = document.createElement("button");
      pin.type = "button";
      pin.className = "__ann_pin";
      pin.setAttribute("data-ann-ui", "1");
      pin.setAttribute("data-status", it.status || "open");
      if (it._stale) pin.setAttribute("data-stale", "1");
      pin.style.left = p.left + "px";
      pin.style.top = p.top + "px";
      pin.textContent = String(idx + 1);
      pin.title = "[" + (it.priority || "P1") + "][" + (TYPE_TEXT[it.type] || "意见") + "] " + (it.comment || "");
      pin.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        openComposer(it);
      });
      layer.appendChild(pin);
    });
    if (state.listOpen) renderList();
  }

  var rafPend = false;
  function reposition() {
    if (rafPend) return;
    rafPend = true;
    requestAnimationFrame(function () {
      rafPend = false;
      render();
    });
  }

  /* ---------------- 标注模式 ---------------- */

  function hoverBox() {
    if (state.dom.hover) return state.dom.hover;
    var d = document.createElement("div");
    d.id = "__ann_hover";
    d.setAttribute("data-ann-ui", "1");
    d.style.display = "none";
    d.innerHTML = '<span class="__ann_hover_tag"></span>';
    document.body.appendChild(d);
    state.dom.hover = d;
    return d;
  }

  function showHover(el) {
    var h = hoverBox();
    h.style.display = "block";
    var p = docPos(el);
    h.style.left = p.left + "px";
    h.style.top = p.top + "px";
    h.style.width = Math.max(p.w, 2) + "px";
    h.style.height = Math.max(p.h, 2) + "px";
    var tag = h.querySelector(".__ann_hover_tag");
    var a = anchorRoot(el);
    tag.textContent = describe(el) + (a.region === "shell" ? "  ⚠ 由 " + (shellOwner(el) || "外壳脚本") + " 生成" : "");
  }

  function hideHover() {
    if (state.dom.hover) state.dom.hover.style.display = "none";
  }

  function onMove(e) {
    if (!state.mode) return;
    var el = e.target;
    if (!el || isUI(el) || isPageLevel(el)) {
      hideHover();
      state.hoverEl = null;
      return;
    }
    if (state.dom.composer && state.dom.composer.contains(el)) return;
    state.hoverEl = el;
    showHover(el);
  }

  function onClickCapture(e) {
    if (!state.mode) return;
    var el = e.target;
    if (isUI(el)) return;
    e.preventDefault();
    e.stopPropagation();
    if (!el || isPageLevel(el)) return;
    if (e.shiftKey) {
      var up = el.parentElement;
      while (up && !isPageLevel(up) && up !== document.body) {
        el = up;
        break;
      }
    }
    state.selEl = el;
    hideHover();
    openComposer(null, el);
  }

  function onKey(e) {
    if (e.key === "Escape") {
      if (state.dom.composer) {
        closeComposer();
        return;
      }
      if (state.listOpen) {
        state.listOpen = false;
        render();
        return;
      }
      if (state.mode) setMode(false);
      return;
    }
    if ((e.altKey || e.metaKey) && (e.key === "e" || e.key === "E" || e.code === "KeyE")) {
      e.preventDefault();
      setMode(!state.mode);
      return;
    }
    if ((e.altKey || e.metaKey) && (e.key === "l" || e.key === "L")) {
      e.preventDefault();
      state.listOpen = !state.listOpen;
      renderList();
    }
  }

  function setMode(on) {
    state.mode = on;
    document.body.classList.toggle("__ann_mode_on", on);
    if (state.dom.fab) state.dom.fab.classList.toggle("on", on);
    if (state.dom.mode) state.dom.mode.style.display = on ? "block" : "none";
    if (!on) {
      hideHover();
      closeComposer();
    }
    reposition();
  }

  /* ---------------- 编辑卡片 ---------------- */

  function closeComposer() {
    if (state.dom.composer) {
      state.dom.composer.remove();
      state.dom.composer = null;
    }
    state.editId = null;
    state.draft = null;
    state.selEl = null;
  }

  function openComposer(item, el) {
    closeComposer();
    var target = el || null;
    var editing = !!item;
    if (editing) {
      state.editId = item.id;
      state.draft = {
        type: item.type,
        priority: item.priority,
        comment: item.comment
      };
    } else {
      state.editId = null;
      state.draft = { type: "copy", priority: "P1", comment: "" };
    }

    var anchorHtml = "";
    if (editing) {
      var a = item.anchor;
      anchorHtml =
        '<div class="__ann_anchor"><b>' +
        esc(item.page) +
        (a.region === "shell" ? " · 外壳区域" : "") +
        "</b><code>" +
        esc(a.selectorIn || a.selector || "") +
        "</code>" +
        (a.shell ? "<br>来源：<code>" + esc(a.shell) + "</code>" : "") +
        (a.text ? "<br>元素文本：" + esc(a.text.slice(0, 90)) : "") +
        "</div>";
    } else if (target) {
      var an = makeAnchor(target);
      anchorHtml =
        '<div class="__ann_anchor"><b>' +
        esc(pageKey()) +
        (an.region === "shell" ? ' · ⚠ 外壳区域（由 ' + esc(an.shell || "外壳脚本") + " 生成）" : "") +
        "</b><code>" +
        esc(an.selectorIn || an.selector) +
        "</code>" +
        (an.text ? "<br>元素文本：" + esc(an.text.slice(0, 90)) : "") +
        "</div>";
    }

    var d = document.createElement("div");
    d.className = "__ann_card";
    d.id = "__ann_composer";
    d.setAttribute("data-ann-ui", "1");
    d.innerHTML =
      '<div class="__ann_hd"><strong>' +
      (editing ? "编辑标注 #" + (pageItems().indexOf(item) + 1) : "新建标注") +
      '</strong><button type="button" class="__ann_close" aria-label="关闭">×</button></div>' +
      '<div class="__ann_body">' +
      anchorHtml +
      '<div class="__ann_field"><label>类型</label><div class="__ann_chips" data-field="type">' +
      TYPES.map(function (t) {
        return (
          '<button type="button" class="__ann_chip" data-val="' + t.id + '" aria-pressed="' +
          (state.draft.type === t.id) + '">' + t.label + "</button>"
        );
      }).join("") +
      "</div></div>" +
      '<div class="__ann_field"><label>优先级</label><div class="__ann_chips" data-field="priority">' +
      PRIS.map(function (p) {
        return (
          '<button type="button" class="__ann_chip" data-val="' + p + '" aria-pressed="' +
          (state.draft.priority === p) + '">' + p + "</button>"
        );
      }).join("") +
      "</div></div>" +
      '<div class="__ann_field"><label>想怎么改</label><textarea placeholder="例：文案改成「立即开播」；把这一行拆成两列；点击后先弹二次确认"></textarea></div>' +
      '<div class="__ann_hint" id="__ann_form_hint"></div>' +
      "</div>" +
      '<div class="__ann_foot">' +
      (editing
        ? '<button type="button" class="__ann_btn danger" data-act="del">删除</button>' +
          '<button type="button" class="__ann_btn" data-act="resolve">标记已修改</button>' +
          '<button type="button" class="__ann_btn" data-act="reopen">重新打开</button>'
        : "") +
      '<span style="flex:1"></span>' +
      '<button type="button" class="__ann_btn" data-act="cancel">取消</button>' +
      '<button type="button" class="__ann_btn primary" data-act="save">保存标注</button>' +
      "</div>";

    document.body.appendChild(d);
    state.dom.composer = d;
    var ta = d.querySelector("textarea");
    ta.value = state.draft.comment || "";
    ta.addEventListener("input", function () {
      state.draft.comment = ta.value;
    });
    ta.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        d.querySelector('[data-act="save"]').click();
      }
    });

    d.querySelector(".__ann_close").addEventListener("click", closeComposer);
    d.addEventListener("click", function (e) {
      var chip = e.target.closest(".__ann_chip");
      if (chip) {
        var field = chip.parentElement.getAttribute("data-field");
        state.draft[field] = chip.getAttribute("data-val");
        var sibs = chip.parentElement.querySelectorAll(".__ann_chip");
        for (var i = 0; i < sibs.length; i++) sibs[i].setAttribute("aria-pressed", "false");
        chip.setAttribute("aria-pressed", "true");
        return;
      }
      var btn = e.target.closest("[data-act]");
      if (!btn) return;
      var act = btn.getAttribute("data-act");
      if (act === "cancel") {
        closeComposer();
      } else if (act === "save") {
        saveComposer(target, item);
      } else if (act === "del") {
        delItem(item.id);
      } else if (act === "resolve") {
        setStatus(item.id, "resolved");
      } else if (act === "reopen") {
        setStatus(item.id, "open");
      }
    });
    setTimeout(function () {
      ta.focus();
    }, 0);
  }

  function saveComposer(target, item) {
    var comment = collapse(state.draft.comment);
    if (!comment) {
      var h = document.getElementById("__ann_form_hint");
      if (h) {
        h.setAttribute("data-state", "error");
        h.textContent = "请先写下要改什么";
      }
      return;
    }
    if (item) {
      item.type = state.draft.type;
      item.priority = state.draft.priority;
      item.comment = comment;
      item.updatedAt = new Date().toISOString();
    } else {
      state.items.push({
        id: uid(),
        page: pageKey(),
        anchor: makeAnchor(target),
        type: state.draft.type,
        priority: state.draft.priority,
        comment: comment,
        status: "open",
        createdAt: new Date().toISOString()
      });
    }
    closeComposer();
    persist();
    render();
  }

  function delItem(id) {
    state.items = state.items.filter(function (it) {
      return it.id !== id;
    });
    closeComposer();
    persist();
    render();
  }

  /* 清空全部标注：本地与 服务端 两端一起清。
     只清一端会复活——boot() 取的是 服务端 与 localStorage 的并集，
     若 服务端 为空而本地仍有数据，会被 persist() 反向推回 服务端。 */
  function clearAll() {
    var n = state.items.length;
    if (!n) {
      window.Proto && window.Proto.toast && window.Proto.toast("当前没有标注可清空");
      return;
    }
    if (!window.confirm("确定清空全部 " + n + " 条标注？\n\n会同时清除浏览器本地缓存与 服务端 _review/annotations.json，无法撤销。建议先「导出全部 JSON」备份。")) {
      return;
    }
    state.items = [];
    closeComposer();
    persist();
    render();
    window.Proto && window.Proto.toast && window.Proto.toast("已清空全部标注（本地 + 服务端）");
  }

  function setStatus(id, status) {
    state.items.forEach(function (it) {
      if (it.id === id) {
        it.status = status;
        it.updatedAt = new Date().toISOString();
      }
    });
    closeComposer();
    persist();
    render();
  }

  /* ---------------- 列表面板 ---------------- */

  function toMarkdown(items) {
    var groups = {};
    items.forEach(function (it) {
      (groups[it.page] = groups[it.page] || []).push(it);
    });
    var open = items.filter(function (i) {
      return (i.status || "open") === "open";
    }).length;
    var lines = [
      "# 原型评审标注",
      "",
      "生成时间 " + new Date().toLocaleString("zh-CN") + " · 共 " + items.length + " 条（待处理 " + open + " / 已修改 " + (items.length - open) + "）",
      ""
    ];
    Object.keys(groups)
      .sort()
      .forEach(function (page) {
        lines.push("## " + page + "（" + groups[page].length + " 条）");
        lines.push("");
        groups[page].forEach(function (it, i) {
          var a = it.anchor || {};
          lines.push(
            "### " + (i + 1) + ". [" + (it.priority || "P1") + "][" + (TYPE_TEXT[it.type] || "意见") + "] " +
              (STATUS_TEXT[it.status || "open"] || "待处理")
          );
          lines.push("- 锚点：`" + (a.selectorIn || a.selector || "") + "`" + (a.root ? "（根 " + a.root + "）" : ""));
          if (a.region === "shell") lines.push("- 区域：外壳（" + (a.shell || "外壳脚本") + "），需改脚本而非页面");
          if (a.text) lines.push("- 元素文本：" + a.text.slice(0, 120));
          if (a.html) lines.push("- 元素片段：`" + a.html.replace(/`/g, "'").slice(0, 200) + "`");
          lines.push("- 意见：" + it.comment);
          lines.push("");
        });
      });
    return lines.join("\n");
  }

  function renderList() {
    if (!state.listOpen) {
      if (state.dom.panel) {
        state.dom.panel.remove();
        state.dom.panel = null;
      }
      return;
    }
    var items = pageItems();
    var shown = items.filter(function (it) {
      if (state.filter === "all") return true;
      return (it.status || "open") === state.filter;
    });
    var d = state.dom.panel;
    if (!d) {
      d = document.createElement("div");
      d.className = "__ann_card";
      d.id = "__ann_panel";
      d.setAttribute("data-ann-ui", "1");
      document.body.appendChild(d);
      state.dom.panel = d;
      d.addEventListener("click", onPanelClick);
    }
    var stale = items.filter(function (i) {
      return i._stale;
    }).length;

    d.innerHTML =
      '<div class="__ann_hd"><strong>本页标注 ' + items.length + " 条</strong>" +
      '<span class="__ann_sub">' + esc(pageKey()) + "</span>" +
      '<button type="button" class="__ann_close" data-act="close" aria-label="关闭">×</button></div>' +
      '<div class="__ann_body">' +
      '<div class="__ann_chips" style="margin-bottom:10px">' +
      ["all", "open", "resolved"].map(function (f) {
        return (
          '<button type="button" class="__ann_chip" data-filter="' + f + '" aria-pressed="' +
          (state.filter === f) + '">' + (f === "all" ? "全部" : STATUS_TEXT[f]) + "</button>"
        );
      }).join("") +
      "</div>" +
      (stale ? '<div class="__ann_hint" data-state="error">有 ' + stale + " 条锚点在当前页面找不到（可能元素已改），请在标注详情里核对</div>" : "") +
      (shown.length
        ? '<div class="__ann_list">' +
          shown
            .map(function (it) {
              var idx = items.indexOf(it) + 1;
              return (
                '<div class="__ann_item" data-status="' + (it.status || "open") + '"' + (it._stale ? ' data-stale="1"' : "") + ">" +
                '<div class="__ann_item_hd">' +
                '<span class="__ann_no">' + idx + "</span>" +
                '<span class="__ann_tag" data-pri="' + (it.priority || "P1") + '">' + (it.priority || "P1") + "</span>" +
                '<span class="__ann_tag">' + (TYPE_TEXT[it.type] || "意见") + "</span>" +
                '<span class="__ann_tag" data-status="' + (it.status || "open") + '">' + (STATUS_TEXT[it.status || "open"] || "待处理") + "</span>" +
                '<span class="__ann_spacer"></span>' +
                '<span>' + esc((it.createdAt || "").slice(5, 16).replace("T", " ")) + "</span>" +
                "</div>" +
                '<div class="__ann_item_text">' + esc(it.comment) + "</div>" +
                '<div class="__ann_item_ops">' +
                '<button type="button" data-act="locate" data-id="' + it.id + '">定位</button>' +
                '<button type="button" data-act="edit" data-id="' + it.id + '">编辑</button>' +
                '<button type="button" data-act="resolve" data-id="' + it.id + '">标记已修改</button>' +
                '<button type="button" class="danger" data-act="del" data-id="' + it.id + '">删除</button>' +
                "</div></div>"
              );
            })
            .join("") +
          "</div>"
        : '<div class="__ann_empty">本页暂无标注。按 Alt+E 进入标注模式，点击要改的元素。</div>') +
      '<div class="__ann_hint" id="__ann_hint"></div>' +
      "</div>" +
      '<div class="__ann_foot">' +
      '<button type="button" class="__ann_btn" data-act="copy-md">复制本页 Markdown</button>' +
      '<button type="button" class="__ann_btn" data-act="export">导出全部 JSON</button>' +
      '<button type="button" class="__ann_btn" data-act="board">打开评审看板</button>' +
      '<button type="button" class="__ann_btn danger" data-act="clear-all">清空全部标注</button>' +
      "</div>";
    state.dom.hint = d.querySelector("#__ann_hint");
    state.dom.hint.setAttribute("data-state", serverOK ? "server" : "error");
    state.dom.hint.textContent = serverOK
      ? "已连接 _review 服务，标注会实时写盘"
      : "未连接 _review 服务：标注暂存在浏览器，启动 _review/serve.py 后刷新即可写盘";
  }

  function onPanelClick(e) {
    var f = e.target.closest("[data-filter]");
    if (f) {
      state.filter = f.getAttribute("data-filter");
      renderList();
      return;
    }
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var act = btn.getAttribute("data-act");
    var id = btn.getAttribute("data-id");
    var item = null;
    state.items.forEach(function (it) {
      if (it.id === id) item = it;
    });
    if (act === "close") {
      state.listOpen = false;
      renderList();
    } else if (act === "locate" && item) {
      locate(item);
    } else if (act === "edit" && item) {
      openComposer(item);
    } else if (act === "resolve" && item) {
      setStatus(item.id, "resolved");
    } else if (act === "del" && item) {
      delItem(item.id);
    } else if (act === "copy-md") {
      copyText(toMarkdown(pageItems()), "本页标注 Markdown 已复制到剪贴板");
    } else if (act === "export") {
      exportJson();
    } else if (act === "board") {
      window.open("/_review/board.html", "_blank");
    } else if (act === "clear-all") {
      clearAll();
    }
  }

  function locate(item) {
    var el = null;
    try {
      el = document.querySelector(item.anchor.selector);
    } catch (e) {}
    if (!el) {
      window.Proto && window.Proto.toast && window.Proto.toast("锚点失效：当前页面已找不到该元素");
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    var old = el.style.outline;
    el.style.outline = "2px solid #f53f3f";
    setTimeout(function () {
      el.style.outline = old;
    }, 1400);
  }

  function copyText(text, okMsg) {
    function done() {
      window.Proto && window.Proto.toast && window.Proto.toast(okMsg || "已复制");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        fallbackCopy(text, done);
      });
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      done();
    } catch (e) {}
    ta.remove();
  }

  function exportJson() {
    var blob = new Blob([JSON.stringify({ v: 1, exportedAt: new Date().toISOString(), items: state.items }, null, 2)], {
      type: "application/json"
    });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "annotations.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  /* ---------------- 启动 ---------------- */

  function buildChrome() {
    var fab = document.createElement("div");
    fab.id = "__ann_fab";
    fab.setAttribute("data-ann-ui", "1");
    fab.setAttribute("title", "Alt+E 进入标注模式 · Alt+L 查看本页标注");
    fab.innerHTML = '<span>标注</span><span class="__ann_fab_n" data-zero="1">0</span>';
    fab.addEventListener("click", function (e) {
      if (e.altKey) return;
      if (e.offsetX > fab.clientWidth - 34) {
        state.listOpen = !state.listOpen;
        renderList();
        return;
      }
      setMode(!state.mode);
    });
    document.body.appendChild(fab);
    state.dom.fab = fab;
    state.dom.fabN = fab.querySelector(".__ann_fab_n");

    var mode = document.createElement("div");
    mode.id = "__ann_mode";
    mode.setAttribute("data-ann-ui", "1");
    mode.style.display = "none";
    mode.innerHTML = "<b>标注模式</b>：点击要改的元素写意见 · <b>Shift+点击</b>选父级 · <b>Esc</b> 退出";
    document.body.appendChild(mode);
    state.dom.mode = mode;
  }

  function bindGlobal() {
    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClickCapture, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    if (window.ResizeObserver) {
      try {
        new ResizeObserver(reposition).observe(document.body);
      } catch (e) {}
    }
    if (window.MutationObserver) {
      var t = null;
      new MutationObserver(function (muts) {
        for (var i = 0; i < muts.length; i++) {
          if (!isUI(muts[i].target)) {
            clearTimeout(t);
            t = setTimeout(reposition, 180);
            return;
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  function boot() {
    buildChrome();
    bindGlobal();
    state.items = readLocal();
    render();
    renderList();
    ping().then(function (ok) {
      serverOK = ok;
      return loadRemote();
    }).then(function (remote) {
      if (remote && remote.length) {
        state.items = mergeItems(remote, state.items);
        writeLocal(state.items);
      } else if (serverOK && state.items.length) {
        persist(true);
      }
      render();
      renderList();
      if (serverOK && window.__PROTO_REVIEW_DEBUG__) {
        window.Proto && window.Proto.toast && window.Proto.toast("评审标注层就绪（服务端已连接）");
      }
    });
  }

  window.ProtoReview = {
    open: function () {
      state.listOpen = true;
      renderList();
    },
    items: function () {
      return state.items;
    },
    markdown: function () {
      return toMarkdown(state.items);
    },
    mode: setMode
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(boot, 60);
    });
  } else {
    setTimeout(boot, 60);
  }
})();
