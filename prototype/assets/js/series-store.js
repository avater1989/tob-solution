/* 系列课共享 Store（商家端 / 运营端原型）
 * 扁平目录：一章 = 一视频引用；状态机打通建课→审核→启用→商品绑定
 */
(function (global) {
  var KEY = "tob_series_v1";
  var SEQ_KEY = "tob_series_seq_v1";

  var STATUS = {
    draft: "draft",
    pending_audit: "pending_audit",
    enabled: "enabled",
    rejected: "rejected",
    disabled: "disabled"
  };

  var STATUS_LABEL = {
    draft: "草稿",
    pending_audit: "待平台审核",
    enabled: "已启用",
    rejected: "已驳回",
    disabled: "已停用"
  };

  var STATUS_BADGE = {
    draft: "audit-cancelled",
    pending_audit: "audit-pending",
    enabled: "audit-approved",
    rejected: "audit-rejected",
    disabled: "audit-cancelled"
  };

  var VIDEO_LIBRARY = [
    { id: "V001", name: "如何让孩子爱上阅读", duration: "8分钟" },
    { id: "V002", name: "亲子共读示范", duration: "12分钟" },
    { id: "V003", name: "从绘本到章节书", duration: "15分钟" },
    { id: "V004", name: "每日阅读打卡法", duration: "10分钟" },
    { id: "V005", name: "目标拆解方法", duration: "8分钟" },
    { id: "V006", name: "认识常用 AI 工具", duration: "18分钟" },
    { id: "V007", name: "亲子沟通的 5 个关键", duration: "14分钟" },
    { id: "V008", name: "情绪先于道理", duration: "16分钟" }
  ];

  function nowStr() {
    var d = new Date();
    var p = function (n) { return n < 10 ? "0" + n : String(n); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
      " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function seed() {
    return [
      {
        id: "S001",
        name: "小学语文阅读启蒙系列",
        cover: "../assets/img/covers/reading.jpg",
        teacher: "张老师",
        cat: "K12 教育",
        intro: "针对 6-12 岁儿童阅读兴趣培养，从绘本到章节书的进阶路径。",
        detail: "",
        source: "self",
        status: STATUS.enabled,
        storeVisible: true,
        shareTitle: "",
        shareDesc: "",
        students: 1287,
        goodsId: "",
        updatedAt: "2026-09-01 10:00",
        submittedAt: "2026-08-28 09:00",
        rejectReason: "",
        merchantName: "星启家庭教育",
        chapters: [
          { id: "S001-C1", title: "第一章 认识绘本", videoId: "V001", videoName: "如何让孩子爱上阅读", duration: "8分钟", required: true, trial: true },
          { id: "S001-C2", title: "第二章 亲子共读", videoId: "V002", videoName: "亲子共读示范", duration: "12分钟", required: true, trial: false },
          { id: "S001-C3", title: "第三章 章节书进阶", videoId: "V003", videoName: "从绘本到章节书", duration: "15分钟", required: true, trial: false },
          { id: "S001-C4", title: "第四章 阅读习惯", videoId: "V004", videoName: "每日阅读打卡法", duration: "10分钟", required: false, trial: false }
        ]
      },
      {
        id: "S002",
        name: "家长情绪管理训练营",
        cover: "../assets/img/covers/emotion.jpg",
        teacher: "李老师",
        cat: "家庭教育",
        intro: "8 周系统训练，帮助家长识别情绪、管理情绪、与孩子正向沟通。",
        detail: "",
        source: "self",
        status: STATUS.disabled,
        storeVisible: true,
        shareTitle: "",
        shareDesc: "",
        students: 0,
        goodsId: "",
        updatedAt: "2026-08-20 14:00",
        submittedAt: "",
        rejectReason: "",
        merchantName: "星启家庭教育",
        chapters: [
          { id: "S002-C1", title: "第一章 制定学习目标", videoId: "V005", videoName: "目标拆解方法", duration: "8分钟", required: true, trial: true }
        ]
      },
      {
        id: "S003",
        name: "AI 学习规划入门",
        cover: "../assets/img/covers/ai.jpg",
        teacher: "王博士",
        cat: "学习能力",
        intro: "AI 助力学习规划，10 节实操课让孩子学会用 AI 工具提升学习效率。",
        detail: "",
        source: "self",
        status: STATUS.enabled,
        storeVisible: true,
        shareTitle: "",
        shareDesc: "",
        students: 856,
        goodsId: "",
        updatedAt: "2026-09-04 11:20",
        submittedAt: "2026-09-01 16:00",
        rejectReason: "",
        merchantName: "晨光少儿成长",
        chapters: [
          { id: "S003-C1", title: "第一章 AI 工具入门", videoId: "V006", videoName: "认识常用 AI 工具", duration: "18分钟", required: true, trial: true }
        ]
      },
      {
        id: "SP001",
        name: "平台标准课 · 亲子沟通基础",
        cover: "../assets/img/covers/series.jpg",
        teacher: "平台教研",
        cat: "家庭教育",
        intro: "平台下发的标准系列课，商家侧只读，可启停用于店铺售卖。",
        detail: "",
        source: "platform",
        status: STATUS.enabled,
        storeVisible: true,
        shareTitle: "",
        shareDesc: "",
        students: 3200,
        goodsId: "",
        updatedAt: "2026-09-05 09:00",
        submittedAt: "2026-09-05 09:00",
        rejectReason: "",
        merchantName: "平台",
        chapters: [
          { id: "SP001-C1", title: "第一章 为什么孩子不听你说话", videoId: "V007", videoName: "亲子沟通的 5 个关键", duration: "14分钟", required: true, trial: true },
          { id: "SP001-C2", title: "第二章 情绪先于道理", videoId: "V008", videoName: "情绪先于道理", duration: "16分钟", required: true, trial: false }
        ]
      }
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

  function nextId(prefix) {
    prefix = prefix || "S";
    var n = 100;
    try {
      n = parseInt(localStorage.getItem(SEQ_KEY) || "100", 10) || 100;
    } catch (e) {}
    n += 1;
    localStorage.setItem(SEQ_KEY, String(n));
    return prefix + n;
  }

  function chapterCount(c) {
    return (c.chapters && c.chapters.length) || 0;
  }

  function durationSummary(c) {
    var ch = c.chapters || [];
    if (!ch.length) return "—";
    var mins = 0;
    ch.forEach(function (x) {
      var m = String(x.duration || "").match(/(\d+)/);
      if (m) mins += parseInt(m[1], 10);
    });
    if (mins >= 60) {
      var h = Math.floor(mins / 60);
      var r = mins % 60;
      return r ? h + "." + Math.round(r / 6) + "h" : h + "h";
    }
    return mins ? mins + "分钟" : "—";
  }

  function list(opts) {
    opts = opts || {};
    return readAll().filter(function (c) {
      if (opts.source && c.source !== opts.source) return false;
      if (opts.status && c.status !== opts.status) return false;
      if (opts.keyword) {
        var kw = String(opts.keyword).toLowerCase();
        var blob = (c.name + " " + (c.teacher || "") + " " + c.id + " " + (c.intro || "")).toLowerCase();
        if (blob.indexOf(kw) === -1) return false;
      }
      if (opts.cat && c.cat !== opts.cat) return false;
      return true;
    }).map(clone);
  }

  function get(id) {
    if (!id) return null;
    var hit = readAll().find(function (c) { return c.id === id; });
    return hit ? clone(hit) : null;
  }

  function save(course) {
    if (!course || !course.id) throw new Error("course.id required");
    var list0 = readAll();
    var idx = list0.findIndex(function (c) { return c.id === course.id; });
    var next = clone(course);
    next.updatedAt = nowStr();
    if (!next.chapters) next.chapters = [];
    if (idx >= 0) list0[idx] = next;
    else list0.unshift(next);
    writeAll(list0);
    return clone(next);
  }

  function remove(id) {
    writeAll(readAll().filter(function (c) { return c.id !== id; }));
  }

  function setStatus(id, status, meta) {
    meta = meta || {};
    var c = get(id);
    if (!c) return null;
    c.status = status;
    if (status === STATUS.pending_audit) {
      c.submittedAt = nowStr();
      c.rejectReason = "";
    }
    if (status === STATUS.rejected) {
      c.rejectReason = meta.reason || "";
    }
    if (status === STATUS.enabled) {
      c.rejectReason = "";
    }
    return save(c);
  }

  function createBlank(opts) {
    opts = opts || {};
    var source = opts.source || "self";
    return {
      id: nextId(source === "platform" ? "SP" : "S"),
      name: "",
      cover: "../assets/img/covers/reading.jpg",
      teacher: opts.teacher || (source === "platform" ? "平台教研" : "未指定"),
      cat: "未分类",
      intro: "",
      detail: "",
      source: source,
      status: STATUS.draft,
      storeVisible: true,
      shareTitle: "",
      shareDesc: "",
      students: 0,
      goodsId: "",
      updatedAt: nowStr(),
      submittedAt: "",
      rejectReason: "",
      merchantName: source === "platform" ? "平台" : (opts.merchantName || "星启家庭教育"),
      chapters: []
    };
  }

  function upsertChapter(courseId, chapter, index) {
    var c = get(courseId);
    if (!c) return null;
    var ch = clone(chapter || {});
    if (!ch.id) ch.id = courseId + "-C" + Date.now();
    if (typeof index === "number" && index >= 0 && index < c.chapters.length) {
      c.chapters[index] = ch;
    } else {
      c.chapters.push(ch);
    }
    return save(c);
  }

  function removeChapter(courseId, index) {
    var c = get(courseId);
    if (!c) return null;
    c.chapters.splice(index, 1);
    return save(c);
  }

  function reorderChapter(courseId, from, dir) {
    var c = get(courseId);
    if (!c) return null;
    var to = from + dir;
    if (to < 0 || to >= c.chapters.length) return c;
    var tmp = c.chapters[from];
    c.chapters[from] = c.chapters[to];
    c.chapters[to] = tmp;
    return save(c);
  }

  function isOpsSide() {
    return /\/ops\//.test(location.pathname || "");
  }

  /** 目录是否可编辑 */
  function canEditOutline(course) {
    if (!course) return false;
    if (course.source === "platform" && !isOpsSide()) return false;
    if (course.status === STATUS.enabled || course.status === STATUS.pending_audit) return false;
    return true;
  }

  /** 商家能否编辑内容信息 */
  function canEditContent(course) {
    if (!course) return true;
    if (course.source === "platform" && !isOpsSide()) return false;
    if (course.status === STATUS.enabled || course.status === STATUS.pending_audit) return false;
    return true;
  }

  function canCreateGoods(course) {
    return !!(course && course.status === STATUS.enabled);
  }

  function canSubmitAudit(course) {
    return !!(course && course.source === "self" && chapterCount(course) > 0 &&
      (course.status === STATUS.draft || course.status === STATUS.rejected || course.status === STATUS.disabled));
  }

  function submitAudit(id) {
    var c = get(id);
    if (!c) return { ok: false, msg: "课程不存在" };
    if (c.source === "platform") {
      return { ok: false, msg: "平台内容无需提交商家审核队列" };
    }
    if (!chapterCount(c)) {
      return { ok: false, msg: "请先配置至少 1 个章节再提交审核" };
    }
    setStatus(id, STATUS.pending_audit);
    return { ok: true, course: get(id) };
  }

  /** 运营端平台内容直接启用 */
  function enableDirect(id) {
    var c = get(id);
    if (!c) return { ok: false, msg: "课程不存在" };
    if (!chapterCount(c)) {
      return { ok: false, msg: "请先配置至少 1 个章节再启用" };
    }
    setStatus(id, STATUS.enabled);
    return { ok: true, course: get(id) };
  }

  function approveAudit(id) {
    var c = get(id);
    if (!c || c.status !== STATUS.pending_audit) return { ok: false, msg: "不在待审状态" };
    setStatus(id, STATUS.enabled);
    return { ok: true, course: get(id) };
  }

  function rejectAudit(id, reason) {
    var c = get(id);
    if (!c || c.status !== STATUS.pending_audit) return { ok: false, msg: "不在待审状态" };
    setStatus(id, STATUS.rejected, { reason: reason || "" });
    return { ok: true, course: get(id) };
  }

  function listPendingAudit() {
    return list({ status: STATUS.pending_audit });
  }

  function setGoodsId(id, goodsId) {
    var c = get(id);
    if (!c) return null;
    c.goodsId = goodsId || "";
    return save(c);
  }

  function videoOptionsHtml(selectedId) {
    return VIDEO_LIBRARY.map(function (v) {
      var sel = v.id === selectedId ? " selected" : "";
      return '<option value="' + v.id + '"' + sel + ">" + v.name + "（" + v.duration + "）</option>";
    }).join("");
  }

  function findVideo(id) {
    return VIDEO_LIBRARY.find(function (v) { return v.id === id; }) || null;
  }

  function resetSeed() {
    localStorage.removeItem(KEY);
    return list();
  }

  global.SeriesStore = {
    KEY: KEY,
    STATUS: STATUS,
    STATUS_LABEL: STATUS_LABEL,
    STATUS_BADGE: STATUS_BADGE,
    VIDEO_LIBRARY: VIDEO_LIBRARY,
    list: list,
    get: get,
    save: save,
    remove: remove,
    setStatus: setStatus,
    createBlank: createBlank,
    nextId: nextId,
    upsertChapter: upsertChapter,
    removeChapter: removeChapter,
    reorderChapter: reorderChapter,
    canEditOutline: canEditOutline,
    canEditContent: canEditContent,
    canCreateGoods: canCreateGoods,
    canSubmitAudit: canSubmitAudit,
    submitAudit: submitAudit,
    enableDirect: enableDirect,
    approveAudit: approveAudit,
    rejectAudit: rejectAudit,
    listPendingAudit: listPendingAudit,
    setGoodsId: setGoodsId,
    chapterCount: chapterCount,
    durationSummary: durationSummary,
    videoOptionsHtml: videoOptionsHtml,
    findVideo: findVideo,
    isOpsSide: isOpsSide,
    resetSeed: resetSeed,
    nowStr: nowStr
  };
})(window);
