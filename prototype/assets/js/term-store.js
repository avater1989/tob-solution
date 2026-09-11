/**
 * 期次管理 — 招生/推广经营周期（非课程、非班级、非单场直播）
 * 依赖：可选 BoardData（同步看板期次选项）
 */
(function (global) {
  var KEY = "merchant_term_store_v1";
  var STAFF = ["赵老师", "阮荣均", "王助教", "李管理", "刘助教", "陈奕均"];
  var GOAL_FIELDS = [
    { key: "poolLeads", label: "入池人数目标", hint: "人" },
    { key: "wecomRate", label: "加微率目标", hint: "%" },
    { key: "attendRate", label: "到场率目标", hint: "%" },
    { key: "payUsers", label: "支付人数目标", hint: "人" },
    { key: "payRate", label: "到场后支付率目标", hint: "%" },
    { key: "gmv", label: "可归因成交 GMV 目标", hint: "元" }
  ];

  function todayStr() {
    var d = new Date();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" : "") + m + "-" + (day < 10 ? "0" : "") + day;
  }

  function seedFromBoard() {
    var catalog = (global.BoardData && global.BoardData.termCatalog) || [];
    return catalog.map(function (t) {
      return normalize({
        id: t.id,
        name: t.name,
        startDate: t.startDate,
        endDate: t.endDate,
        owner: t.owner || "",
        remark: t.remark || "",
        goals: t.goals ? Object.assign({}, t.goals) : {},
        boardStatus: t.status,
        boardStatusLabel: t.statusLabel,
        compareTermId: t.compareTermId || null,
        compareTermLabel: t.compareTermLabel || null,
        conversionDeadline: t.conversionDeadline || t.endDate,
        currentStage: t.currentStage || "",
        enabledChannels: (t.enabledChannels || []).slice(),
        relatedLiveIds: (t.relatedLiveIds || []).slice(),
        liveRoles: t.liveRoles ? Object.assign({}, t.liveRoles) : {},
        demoOnly: !!t.demoOnly,
        endedEarly: t.status === "ended" && t.endDate && t.endDate > todayStr() ? true : !!t.endedEarly,
        referenced: !!(t.relatedLiveIds && t.relatedLiveIds.length) || !!t.demoOnly || t.id === "trial"
      });
    });
  }

  function loadRaw() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.terms) && parsed.terms.length) {
          return parsed.terms.map(normalize);
        }
      }
    } catch (e) {}
    return seedFromBoard();
  }

  function saveRaw(terms) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ terms: terms, updatedAt: Date.now() }));
    } catch (e) {}
  }

  function hasAnyGoal(goals) {
    if (!goals) return false;
    return GOAL_FIELDS.some(function (f) {
      var v = goals[f.key];
      return v != null && v !== "" && !isNaN(Number(v));
    });
  }

  function normalizeGoals(g) {
    var out = {};
    if (!g) return out;
    GOAL_FIELDS.forEach(function (f) {
      var v = g[f.key];
      if (v === "" || v == null) return;
      var n = Number(v);
      if (!isNaN(n)) out[f.key] = n;
    });
    return out;
  }

  function computeLifecycle(term, asOf) {
    asOf = asOf || todayStr();
    if (term.endedEarly || term.forceEnded) return "ended";
    if (term.endDate && term.endDate < asOf) return "ended";
    if (term.startDate && term.startDate > asOf) return "upcoming";
    return "active";
  }

  function lifecycleLabel(lc) {
    if (lc === "upcoming") return "未开始";
    if (lc === "ended") return "已结束";
    return "进行中";
  }

  function boardStatusFor(term, lc) {
    if (lc === "ended") return { status: "ended", statusLabel: "已结束", currentStage: "已结束" };
    if (lc === "upcoming") return { status: "prep", statusLabel: "未开始", currentStage: "筹备" };
    if (term.boardStatus && term.boardStatus !== "ended" && term.boardStatus !== "prep") {
      return {
        status: term.boardStatus,
        statusLabel: term.boardStatusLabel || "进行中",
        currentStage: term.currentStage || "进行中"
      };
    }
    return { status: "acquiring", statusLabel: "进行中", currentStage: "获客与承接" };
  }

  function normalize(t) {
    t = t || {};
    var goals = normalizeGoals(t.goals);
    var term = {
      id: t.id || ("term_" + Date.now()),
      name: String(t.name || "").trim(),
      startDate: t.startDate || "",
      endDate: t.endDate || "",
      owner: t.owner || "",
      remark: t.remark || "",
      goals: goals,
      boardStatus: t.boardStatus || t.status || "",
      boardStatusLabel: t.boardStatusLabel || t.statusLabel || "",
      compareTermId: t.compareTermId || null,
      compareTermLabel: t.compareTermLabel || null,
      conversionDeadline: t.conversionDeadline || t.endDate || "",
      currentStage: t.currentStage || "",
      enabledChannels: (t.enabledChannels || []).slice(),
      relatedLiveIds: (t.relatedLiveIds || []).slice(),
      liveRoles: t.liveRoles ? Object.assign({}, t.liveRoles) : {},
      demoOnly: !!t.demoOnly,
      endedEarly: !!t.endedEarly || !!t.forceEnded,
      forceEnded: !!t.forceEnded || !!t.endedEarly,
      referenced: !!t.referenced || !!(t.relatedLiveIds && t.relatedLiveIds.length) || !!t.demoOnly
    };
    var lc = computeLifecycle(term);
    term.lifecycle = lc;
    term.lifecycleLabel = lifecycleLabel(lc);
    var bs = boardStatusFor(term, lc);
    term.status = bs.status;
    term.statusLabel = bs.statusLabel;
    if (!term.currentStage) term.currentStage = bs.currentStage;
    term.hasGoals = hasAnyGoal(term.goals);
    return term;
  }

  var cache = null;
  function all() {
    if (!cache) cache = loadRaw();
    return cache;
  }
  function persist() {
    saveRaw(all());
    syncBoardData();
  }

  function list(opts) {
    opts = opts || {};
    return all().filter(function (t) {
      if (opts.includeDemo) return true;
      return !t.demoOnly;
    }).map(function (t) { return normalize(t); });
  }

  function get(id) {
    if (!id) return null;
    var hit = all().filter(function (t) { return t.id === id; })[0];
    return hit ? normalize(hit) : null;
  }

  function getByName(name) {
    if (!name) return null;
    var hit = all().filter(function (t) { return t.name === name; })[0];
    return hit ? normalize(hit) : null;
  }

  function isNameTaken(name, exceptId) {
    name = String(name || "").trim();
    return all().some(function (t) {
      return t.name === name && t.id !== exceptId;
    });
  }

  function upsert(payload) {
    var terms = all();
    var id = payload.id;
    var idx = -1;
    if (id) {
      for (var i = 0; i < terms.length; i++) if (terms[i].id === id) { idx = i; break; }
    }
    var base = idx >= 0 ? terms[idx] : {};
    var next = normalize(Object.assign({}, base, payload, {
      id: id || ("term_" + Date.now()),
      goals: payload.goals != null ? payload.goals : base.goals
    }));
    if (idx >= 0) terms[idx] = next;
    else terms.push(next);
    cache = terms;
    persist();
    return next;
  }

  function endTerm(id) {
    var t = get(id);
    if (!t) return null;
    return upsert({
      id: id,
      endedEarly: true,
      forceEnded: true,
      boardStatus: "ended",
      boardStatusLabel: "已结束",
      currentStage: "已结束"
    });
  }

  function remove(id) {
    var t = get(id);
    if (!t) return { ok: false, reason: "未找到期次" };
    if (t.referenced) return { ok: false, reason: "该期次已有业务引用，不可删除" };
    cache = all().filter(function (x) { return x.id !== id; });
    persist();
    return { ok: true };
  }

  function syncBoardData() {
    if (!global.BoardData) return;
    var terms = all().map(function (t) { return normalize(t); });
    global.BoardData.termCatalog = terms.map(function (t) {
      return {
        id: t.id,
        name: t.name,
        status: t.status,
        statusLabel: t.statusLabel,
        owner: t.owner,
        startDate: t.startDate,
        endDate: t.endDate,
        conversionDeadline: t.conversionDeadline || t.endDate,
        currentStage: t.currentStage,
        compareTermId: t.compareTermId,
        compareTermLabel: t.compareTermLabel,
        goals: t.hasGoals ? Object.assign({}, t.goals) : {},
        enabledChannels: (t.enabledChannels || []).slice(),
        relatedLiveIds: (t.relatedLiveIds || []).slice(),
        liveRoles: t.liveRoles ? Object.assign({}, t.liveRoles) : {},
        demoOnly: t.demoOnly,
        remark: t.remark,
        endedEarly: t.endedEarly,
        lifecycle: t.lifecycle,
        lifecycleLabel: t.lifecycleLabel
      };
    });
    var opts = [{ value: "", label: "全部期次" }];
    terms.filter(function (t) { return !t.demoOnly; }).forEach(function (t) {
      opts.push({ value: t.id, label: t.name });
    });
    global.BoardData.termOptions = opts;
  }

  /**
   * mode:
   *  - create: 仅未结束（新业务默认）
   *  - edit: 未结束 + 当前已选值（可含已结束）
   *  - filter: 全部（含已结束），可带全部期次
   * valueMode: id | name
   */
  function options(opts) {
    opts = opts || {};
    var mode = opts.mode || "filter";
    var valueMode = opts.valueMode || "id";
    var includeValue = opts.includeValue || "";
    var terms = list({ includeDemo: !!opts.includeDemo });
    var out = [];
    if (opts.allLabel != null) {
      out.push({ value: "", label: opts.allLabel });
    } else if (mode === "filter") {
      out.push({ value: "", label: "全部期次" });
    } else if (mode === "create" || mode === "edit") {
      out.push({ value: "", label: opts.placeholder || "请选择" });
    }
    terms.forEach(function (t) {
      var lc = t.lifecycle;
      var val = valueMode === "name" ? t.name : t.id;
      var allow = true;
      if (mode === "create") allow = lc !== "ended";
      else if (mode === "edit") {
        allow = lc !== "ended" || val === includeValue || t.name === includeValue || t.id === includeValue;
      }
      if (!allow) return;
      var label = t.name;
      if (lc === "ended") label += "（已结束）";
      else if (lc === "upcoming") label += "（未开始）";
      out.push({ value: val, label: label, lifecycle: lc, id: t.id, name: t.name });
    });
    return out;
  }

  function fillSelect(el, opts) {
    if (!el) return;
    opts = opts || {};
    var cur = opts.value != null ? opts.value : el.value;
    var listOpts = options(Object.assign({}, opts, { includeValue: cur }));
    el.innerHTML = "";
    listOpts.forEach(function (o) {
      var opt = document.createElement("option");
      opt.value = o.value;
      opt.textContent = o.label;
      el.appendChild(opt);
    });
    if (cur) {
      var exists = listOpts.some(function (o) { return o.value === cur; });
      if (!exists) {
        var opt = document.createElement("option");
        opt.value = cur;
        opt.textContent = cur + "（已结束）";
        el.appendChild(opt);
      }
      el.value = cur;
    } else {
      el.value = "";
    }
  }

  /* ---- 共享编辑弹窗 ---- */
  var editorState = { mode: "create", termId: null, onSaved: null, draft: null };

  function ensureEditorDom() {
    if (document.getElementById("modal-term-edit")) return;
    if (!document.getElementById("mask") && !document.querySelector(".proto-mask")) {
      var m = document.createElement("div");
      m.className = "proto-mask";
      m.id = "mask";
      document.body.appendChild(m);
    }
    var html =
      '<div class="proto-modal" id="modal-term-edit" style="width:560px">' +
      '<div class="proto-modal-hd"><h3 id="tm-title" style="font-size:16px;font-weight:600">新建期次</h3>' +
      '<button class="btn btn-sm btn-ghost" type="button" data-term-close>×</button></div>' +
      '<div class="proto-modal-bd">' +
      '<div class="form-grid" style="grid-template-columns:1fr 1fr">' +
      '<div class="field" style="grid-column:1/-1"><label>期次名称 *</label><input id="tm-name" placeholder="如：春启 05 期" /></div>' +
      '<div class="field"><label>开始日期 *</label><input id="tm-start" type="date" /></div>' +
      '<div class="field"><label>结束日期 *</label><input id="tm-end" type="date" /></div>' +
      '<div class="field" style="grid-column:1/-1"><label>负责人 *</label>' +
      '<select id="tm-owner"><option value="">请选择员工</option></select></div>' +
      '<div class="field" style="grid-column:1/-1"><label>备注</label>' +
      '<textarea id="tm-remark" rows="2" style="width:100%;padding:8px;border:1px solid var(--color-border);border-radius:6px" placeholder="选填"></textarea></div>' +
      '</div>' +
      '<details id="tm-goals-box" style="margin-top:12px">' +
      '<summary style="cursor:pointer;font-size:13px;font-weight:600;color:var(--color-text-secondary)">经营目标（选填，默认折叠）</summary>' +
      '<p class="muted" style="font-size:12px;margin:8px 0">复用期次复盘已展示的目标项；未填写时复盘显示「未设置」，不生成虚假完成率。</p>' +
      '<div class="form-grid" id="tm-goals-grid" style="grid-template-columns:1fr 1fr;margin-top:8px"></div>' +
      '</details>' +
      '</div>' +
      '<div class="proto-modal-ft">' +
      '<button class="btn" type="button" data-term-close>取消</button>' +
      '<button class="btn btn-primary" type="button" id="tm-submit">保存</button>' +
      '</div></div>';
    document.body.insertAdjacentHTML("beforeend", html);
    var owner = document.getElementById("tm-owner");
    STAFF.forEach(function (n) {
      var o = document.createElement("option");
      o.value = n;
      o.textContent = n;
      owner.appendChild(o);
    });
    var grid = document.getElementById("tm-goals-grid");
    GOAL_FIELDS.forEach(function (f) {
      var wrap = document.createElement("div");
      wrap.className = "field";
      wrap.innerHTML = "<label>" + f.label + "</label>" +
        '<input type="number" min="0" step="any" data-goal="' + f.key + '" placeholder="' + f.hint + '" />';
      grid.appendChild(wrap);
    });
    function closeEditor() {
      editorState.draft = null;
      var mask = document.getElementById("mask") || document.querySelector(".proto-mask");
      if (mask) mask.classList.remove("open");
      var modal = document.getElementById("modal-term-edit");
      if (modal) modal.classList.remove("open");
    }
    document.querySelectorAll("[data-term-close]").forEach(function (n) {
      n.addEventListener("click", function (e) {
        e.preventDefault();
        closeEditor();
      });
    });
    var mask = document.getElementById("mask") || document.querySelector(".proto-mask");
    if (mask && !mask.__termBound) {
      mask.__termBound = true;
      mask.addEventListener("click", function () {
        var modal = document.getElementById("modal-term-edit");
        if (modal && modal.classList.contains("open")) closeEditor();
      });
    }
    document.getElementById("tm-submit").addEventListener("click", function () {
      var name = document.getElementById("tm-name").value.trim();
      var start = document.getElementById("tm-start").value;
      var end = document.getElementById("tm-end").value;
      var ownerVal = document.getElementById("tm-owner").value;
      if (!name) { toast("请填写期次名称"); return; }
      if (isNameTaken(name, editorState.termId)) { toast("同一商户内期次名称不可重复"); return; }
      if (!start || !end) { toast("请填写开始与结束日期"); return; }
      if (end < start) { toast("结束日期不得早于开始日期"); return; }
      if (!ownerVal) { toast("请选择负责人"); return; }
      var goals = {};
      document.querySelectorAll("#tm-goals-grid [data-goal]").forEach(function (inp) {
        if (inp.value !== "") goals[inp.getAttribute("data-goal")] = inp.value;
      });
      var saved = upsert({
        id: editorState.termId || undefined,
        name: name,
        startDate: start,
        endDate: end,
        owner: ownerVal,
        remark: document.getElementById("tm-remark").value.trim(),
        goals: goals,
        conversionDeadline: end
      });
      closeEditor();
      toast(editorState.mode === "create" ? "已新建期次" : "已保存期次");
      if (typeof editorState.onSaved === "function") editorState.onSaved(saved);
    });
  }

  function toast(msg) {
    if (global.Proto && Proto.toast) Proto.toast(msg);
    else alert(msg);
  }

  function fillEditorForm(term) {
    document.getElementById("tm-name").value = term ? term.name : "";
    document.getElementById("tm-start").value = term ? term.startDate : "";
    document.getElementById("tm-end").value = term ? term.endDate : "";
    document.getElementById("tm-owner").value = term ? (term.owner || "") : "";
    document.getElementById("tm-remark").value = term ? (term.remark || "") : "";
    var goals = (term && term.goals) || {};
    document.querySelectorAll("#tm-goals-grid [data-goal]").forEach(function (inp) {
      var k = inp.getAttribute("data-goal");
      inp.value = goals[k] != null ? goals[k] : "";
    });
    var box = document.getElementById("tm-goals-box");
    if (box) box.open = !!(term && term.hasGoals);
  }

  function openEditor(opts) {
    opts = opts || {};
    ensureEditorDom();
    editorState.mode = opts.mode || (opts.termId ? "edit" : "create");
    editorState.termId = opts.termId || null;
    editorState.onSaved = opts.onSaved || null;
    var term = opts.termId ? get(opts.termId) : null;
    document.getElementById("tm-title").textContent =
      editorState.mode === "create" ? "新建期次" : ("编辑期次 · " + (term ? term.name : ""));
    fillEditorForm(term);
    var mask = document.getElementById("mask") || document.querySelector(".proto-mask");
    var modal = document.getElementById("modal-term-edit");
    if (mask) mask.classList.add("open");
    document.querySelectorAll(".proto-modal").forEach(function (n) { n.classList.remove("open"); });
    modal.classList.add("open");
  }

  // init
  cache = loadRaw();
  syncBoardData();

  global.TermStore = {
    KEY: KEY,
    STAFF: STAFF,
    GOAL_FIELDS: GOAL_FIELDS,
    list: list,
    get: get,
    getByName: getByName,
    isNameTaken: isNameTaken,
    upsert: upsert,
    endTerm: endTerm,
    remove: remove,
    computeLifecycle: computeLifecycle,
    lifecycleLabel: lifecycleLabel,
    options: options,
    fillSelect: fillSelect,
    syncBoardData: syncBoardData,
    openEditor: openEditor,
    ensureEditorDom: ensureEditorDom,
    todayStr: todayStr,
    hasAnyGoal: hasAnyGoal
  };
})(window);
