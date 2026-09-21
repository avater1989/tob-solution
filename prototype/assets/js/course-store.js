/* 线上课共享 Store（商家端 / 运营端）
 * 统一原系列课 + 单视频课：基础字段 + 章节（一章一视频）+ 观看/评论/收藏统计
 * 兼容：window.SeriesStore 指向同一实现，便于旧页重定向前过渡
 */
(function (global) {
  var KEY = "tob_course_v2";
  var SEQ_KEY = "tob_course_seq_v1";
  var OLD_KEY = "tob_series_v1";

  var STATUS = {
    draft: "draft",
    pending_audit: "pending_audit",
    enabled: "enabled",
    rejected: "rejected",
    disabled: "disabled"
  };

  var STATUS_LABEL = {
    draft: "草稿",
    pending_audit: "已上架", /* 最简版免审：历史待审态归一为已上架 */
    enabled: "已上架",
    rejected: "草稿", /* 历史驳回态归一为草稿 */
    disabled: "已下架"
  };

  var STATUS_BADGE = {
    draft: "audit-cancelled",
    pending_audit: "audit-pending",
    enabled: "audit-approved",
    rejected: "audit-rejected",
    disabled: "audit-cancelled"
  };

  var BADGE_LABEL = { hot: "热门课", premium: "精品课", "": "—" };

  function nowStr() {
    var d = new Date();
    var p = function (n) { return n < 10 ? "0" + n : String(n); };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
      " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function normalizeChapter(ch, courseId) {
    ch = ch || {};
    return {
      id: ch.id || (courseId + "-C" + Date.now()),
      title: ch.title || "",
      free: ch.free === true || ch.trial === true,
      tagIds: Array.isArray(ch.tagIds) ? ch.tagIds : [],
      videoName: ch.videoName || "",
      videoUrl: ch.videoUrl || "",
      duration: ch.duration || "",
      mindmapName: ch.mindmapName || "",
      pptName: ch.pptName || "",
      required: ch.required !== false,
      views: typeof ch.views === "number" ? ch.views : 0
    };
  }

  function normalizeCourse(c) {
    c = clone(c || {});
    c.term = c.term || "";
    c.teacherId = c.teacherId || "";
    if (!c.teacherId && c.teacher) {
      /* 旧数据：按姓名尝试映射，否则保留 teacher 文案 */
      if (global.Teachers) {
        var hit = global.Teachers.list().find(function (t) { return t.name === c.teacher; });
        if (hit) c.teacherId = hit.id;
      }
    }
    c.tagIds = Array.isArray(c.tagIds) ? c.tagIds : [];
    if (!c.tagIds.length && c.cat) {
      /* 旧分类名 → 尝试匹配标签名 */
      if (global.ContentTags) {
        var tg = global.ContentTags.list().find(function (t) { return t.name === c.cat; });
        if (tg) c.tagIds = [tg.id];
      }
    }
    c.badge = c.badge || "";
    c.price = typeof c.price === "number" ? c.price : (parseFloat(c.price) || 0);
    c.outlineText = c.outlineText || "";
    c.purchaseNotes = c.purchaseNotes || "";
    c.views = typeof c.views === "number" ? c.views : (c.students || 0);
    c.comments = typeof c.comments === "number" ? c.comments : 0;
    c.favorites = typeof c.favorites === "number" ? c.favorites : 0;
    c.commentList = Array.isArray(c.commentList) ? c.commentList : [];
    c.chapters = (c.chapters || []).map(function (ch) { return normalizeChapter(ch, c.id); });
    /* 内容 ↔ 商品 1:N：兼容旧字段 goodsId */
    if (Array.isArray(c.goodsIds)) {
      c.goodsIds = c.goodsIds.filter(Boolean);
    } else if (c.goodsId) {
      c.goodsIds = [c.goodsId];
    } else {
      c.goodsIds = [];
    }
    c.goodsId = c.goodsIds[0] || "";
    /* 最简版：取消内容事前审核，历史待审/驳回态归一 */
    if (c.status === STATUS.pending_audit) c.status = STATUS.enabled;
    if (c.status === STATUS.rejected) c.status = STATUS.draft;
    return c;
  }

  function seed() {
    return [
      normalizeCourse({
        id: "C001",
        name: "小学语文阅读启蒙",
        term: "春启 03 期",
        teacherId: "TCH01",
        teacher: "张老师",
        tagIds: ["TG05", "TG04"],
        badge: "hot",
        price: 199,
        cover: "../assets/img/covers/reading.jpg",
        intro: "针对 6-12 岁儿童阅读兴趣培养，从绘本到章节书的进阶路径。",
        outlineText: "共 4 章：认识绘本 → 亲子共读 → 章节书进阶 → 阅读习惯",
        detail: "<p>系统讲解儿童阅读启蒙方法，配套思维导图与课件。</p>",
        purchaseNotes: "购买后永久观看；支持手机端学习；不支持转让。",
        source: "self",
        status: STATUS.enabled,
        storeVisible: true,
        shareTitle: "",
        shareDesc: "",
        views: 1287,
        comments: 86,
        favorites: 214,
        commentList: [
          { user: "家长小王", text: "孩子开始主动找绘本了，很实用。", at: "2026-09-10" },
          { user: "晨晨妈", text: "章节安排清晰，免费试看很友好。", at: "2026-09-12" }
        ],
        goodsIds: ["G002"],
        updatedAt: "2026-09-01 10:00",
        submittedAt: "2026-08-28 09:00",
        rejectReason: "",
        merchantName: "星启家庭教育",
        chapters: [
          { id: "C001-C1", title: "第一章 认识绘本", free: true, tagIds: ["TG05"], videoName: "如何让孩子爱上阅读.mp4", duration: "8分钟", mindmapName: "绘本导图.png", pptName: "第1章.pptx", views: 1180 },
          { id: "C001-C2", title: "第二章 亲子共读", free: false, tagIds: ["TG02"], videoName: "亲子共读示范.mp4", duration: "12分钟", mindmapName: "", pptName: "第2章.pptx", views: 942 },
          { id: "C001-C3", title: "第三章 章节书进阶", free: false, tagIds: ["TG05"], videoName: "从绘本到章节书.mp4", duration: "15分钟", mindmapName: "进阶导图.png", pptName: "", views: 801 },
          { id: "C001-C4", title: "第四章 阅读习惯", free: false, tagIds: ["TG06"], videoName: "每日阅读打卡法.mp4", duration: "10分钟", mindmapName: "", pptName: "第4章.pptx", views: 726 }
        ]
      }),
      normalizeCourse({
        id: "C002",
        name: "家长情绪管理训练营",
        term: "秋启 01 期",
        teacherId: "TCH02",
        teacher: "李老师",
        tagIds: ["TG03", "TG01"],
        badge: "premium",
        price: 299,
        cover: "../assets/img/covers/emotion.jpg",
        intro: "8 周系统训练，帮助家长识别情绪、管理情绪、与孩子正向沟通。",
        outlineText: "第 1 周：目标与觉察",
        detail: "",
        purchaseNotes: "含社群答疑；开营后不退费。",
        source: "self",
        status: STATUS.disabled,
        storeVisible: true,
        views: 0,
        comments: 0,
        favorites: 12,
        goodsId: "",
        updatedAt: "2026-08-20 14:00",
        submittedAt: "",
        rejectReason: "",
        merchantName: "星启家庭教育",
        chapters: [
          { id: "C002-C1", title: "第一章 制定学习目标", free: true, tagIds: ["TG03"], videoName: "目标拆解方法.mp4", duration: "8分钟", mindmapName: "", pptName: "目标拆解.pptx", views: 0 }
        ]
      }),
      normalizeCourse({
        id: "C003",
        name: "AI 学习规划入门",
        term: "暑期特训",
        teacherId: "TCH03",
        teacher: "王博士",
        tagIds: ["TG07", "TG06"],
        badge: "",
        price: 99,
        cover: "../assets/img/covers/ai.jpg",
        intro: "AI 助力学习规划，实操课让孩子学会用 AI 工具提升学习效率。",
        outlineText: "AI 工具入门",
        detail: "",
        purchaseNotes: "需自备可上网设备。",
        source: "self",
        status: STATUS.enabled,
        storeVisible: true,
        views: 856,
        comments: 41,
        favorites: 98,
        commentList: [
          { user: "乐乐爸", text: "孩子学会了用 AI 列周计划。", at: "2026-09-08" }
        ],
        goodsId: "",
        updatedAt: "2026-09-04 11:20",
        submittedAt: "2026-09-01 16:00",
        rejectReason: "",
        merchantName: "晨光少儿成长",
        chapters: [
          { id: "C003-C1", title: "第一章 AI 工具入门", free: true, tagIds: ["TG07"], videoName: "认识常用 AI 工具.mp4", duration: "18分钟", mindmapName: "AI工具.xmind", pptName: "AI入门.pptx", views: 790 }
        ]
      }),
      normalizeCourse({
        id: "CP001",
        name: "平台标准课 · 亲子沟通基础",
        term: "平台常设",
        teacherId: "TCH04",
        teacher: "平台教研",
        tagIds: ["TG02", "TG01"],
        badge: "premium",
        price: 0,
        cover: "../assets/img/covers/series.jpg",
        intro: "平台下发的标准线上课，商家侧只读，可上下架用于店铺售卖。",
        outlineText: "沟通关键 + 情绪优先",
        detail: "",
        purchaseNotes: "平台统一定价与售后规则。",
        source: "platform",
        status: STATUS.enabled,
        storeVisible: true,
        views: 3200,
        comments: 210,
        favorites: 560,
        goodsId: "",
        updatedAt: "2026-09-05 09:00",
        submittedAt: "2026-09-05 09:00",
        rejectReason: "",
        merchantName: "平台",
        chapters: [
          { id: "CP001-C1", title: "第一章 为什么孩子不听你说话", free: true, tagIds: ["TG02"], videoName: "亲子沟通的5个关键.mp4", duration: "14分钟", mindmapName: "", pptName: "沟通关键.pptx", views: 2980 },
          { id: "CP001-C2", title: "第二章 情绪先于道理", free: false, tagIds: ["TG03"], videoName: "情绪先于道理.mp4", duration: "16分钟", mindmapName: "", pptName: "", views: 2510 }
        ]
      })
    ];
  }

  function migrateFromSeriesIfNeeded() {
    try {
      if (localStorage.getItem(KEY)) return;
      /* v1 → v2 直接走新 seed（补齐章节观看人数）；仅从更早的系列课 key 迁移 */
      var raw = localStorage.getItem(OLD_KEY);
      if (!raw) return;
      var list = JSON.parse(raw);
      if (!Array.isArray(list) || !list.length) return;
      writeAll(list.map(normalizeCourse));
    } catch (e) {}
  }

  function readAll() {
    migrateFromSeriesIfNeeded();
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
      return list.map(normalizeCourse);
    } catch (e) {
      var s3 = seed();
      writeAll(s3);
      return s3;
    }
  }

  function writeAll(list) {
    localStorage.setItem(KEY, JSON.stringify((list || []).map(normalizeCourse)));
  }

  function nextId(prefix) {
    prefix = prefix || "C";
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

  function teacherName(c) {
    if (c.teacherId && global.Teachers) return global.Teachers.nameOf(c.teacherId);
    return c.teacher || "—";
  }

  function badgeLabel(b) {
    return BADGE_LABEL[b || ""] || "—";
  }

  function list(opts) {
    opts = opts || {};
    return readAll().filter(function (c) {
      if (opts.source && c.source !== opts.source) return false;
      if (opts.status && c.status !== opts.status) return false;
      if (opts.badge && (c.badge || "") !== opts.badge) return false;
      if (opts.teacherId && c.teacherId !== opts.teacherId) return false;
      if (opts.tagId && (c.tagIds || []).indexOf(opts.tagId) === -1) return false;
      if (opts.tagIds && opts.tagIds.length) {
        var hit = opts.tagIds.some(function (tid) {
          return (c.tagIds || []).indexOf(tid) >= 0;
        });
        if (!hit) return false;
      }
      if (opts.keyword) {
        var kw = String(opts.keyword).toLowerCase();
        var blob = (c.name + " " + teacherName(c) + " " + c.id + " " + (c.intro || "") + " " + (c.term || "")).toLowerCase();
        if (blob.indexOf(kw) === -1) return false;
      }
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
    var next = normalizeCourse(course);
    next.updatedAt = nowStr();
    if (next.teacherId && global.Teachers) next.teacher = global.Teachers.nameOf(next.teacherId);
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
    if (status === STATUS.rejected) c.rejectReason = meta.reason || "";
    if (status === STATUS.enabled) c.rejectReason = "";
    return save(c);
  }

  function createBlank(opts) {
    opts = opts || {};
    var source = opts.source || "self";
    return normalizeCourse({
      id: nextId(source === "platform" ? "CP" : "C"),
      name: "",
      term: "",
      teacherId: opts.teacherId || "",
      teacher: "",
      tagIds: [],
      badge: "",
      price: 0,
      cover: "../assets/img/covers/reading.jpg",
      intro: "",
      outlineText: "",
      detail: "",
      purchaseNotes: "",
      source: source,
      status: STATUS.draft,
      storeVisible: true,
      shareTitle: "",
      shareDesc: "",
      views: 0,
      comments: 0,
      favorites: 0,
      commentList: [],
      goodsIds: [],
      updatedAt: nowStr(),
      submittedAt: "",
      rejectReason: "",
      merchantName: source === "platform" ? "平台" : (opts.merchantName || "星启家庭教育"),
      chapters: []
    });
  }

  function upsertChapter(courseId, chapter, index) {
    var c = get(courseId);
    if (!c) return null;
    var ch = normalizeChapter(chapter, courseId);
    if (typeof index === "number" && index >= 0 && index < c.chapters.length) c.chapters[index] = ch;
    else c.chapters.push(ch);
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

  function canEditOutline(course) {
    if (!course) return false;
    if (course.source === "platform" && !isOpsSide()) return false;
    if (course.status === STATUS.enabled) return false;
    return true;
  }

  function canEditContent(course) {
    if (!course) return true;
    if (course.source === "platform" && !isOpsSide()) return false;
    if (course.status === STATUS.enabled) return false;
    return true;
  }

  function canCreateGoods(course) {
    return !!(course && course.status === STATUS.enabled);
  }

  function canSubmitAudit(course) {
    /* 兼容旧名：现为「可上架」条件 */
    return !!(course && chapterCount(course) > 0 &&
      (course.status === STATUS.draft || course.status === STATUS.disabled || course.status === STATUS.rejected));
  }

  function submitAudit(id) {
    /* 最简版免审：提交审核 = 直接上架 */
    return enableDirect(id);
  }

  function enableDirect(id) {
    var c = get(id);
    if (!c) return { ok: false, msg: "课程不存在" };
    if (c.source === "platform" && !isOpsSide()) {
      return { ok: false, msg: "平台标准内容由运营下发，商家侧不可提审上架" };
    }
    if (!chapterCount(c)) return { ok: false, msg: "请先配置至少 1 个章节再上架" };
    setStatus(id, STATUS.enabled);
    return { ok: true, course: get(id) };
  }

  function forceOffline(id) {
    var c = get(id);
    if (!c) return { ok: false, msg: "课程不存在" };
    if (c.status !== STATUS.enabled) return { ok: false, msg: "仅已上架内容可强制下架" };
    setStatus(id, STATUS.disabled);
    return { ok: true, course: get(id) };
  }

  function approveAudit(id) {
    return enableDirect(id);
  }

  function rejectAudit(id, reason) {
    var c = get(id);
    if (!c) return { ok: false, msg: "课程不存在" };
    setStatus(id, STATUS.draft, { reason: reason || "" });
    return { ok: true, course: get(id) };
  }

  function listPendingAudit() {
    return []; /* 最简版无待审队列 */
  }

  function setGoodsId(id, goodsId) {
    return addGoodsId(id, goodsId);
  }

  function addGoodsId(id, goodsId) {
    var c = get(id);
    if (!c || !goodsId) return null;
    if (c.goodsIds.indexOf(goodsId) < 0) c.goodsIds.push(goodsId);
    c.goodsId = c.goodsIds[0] || "";
    return save(c);
  }

  function listGoodsIds(id) {
    var c = get(id);
    return c ? (c.goodsIds || []).slice() : [];
  }

  function resetSeed() {
    localStorage.removeItem(KEY);
    return list();
  }

  var api = {
    KEY: KEY,
    STATUS: STATUS,
    STATUS_LABEL: STATUS_LABEL,
    STATUS_BADGE: STATUS_BADGE,
    BADGE_LABEL: BADGE_LABEL,
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
    forceOffline: forceOffline,
    approveAudit: approveAudit,
    rejectAudit: rejectAudit,
    listPendingAudit: listPendingAudit,
    setGoodsId: setGoodsId,
    addGoodsId: addGoodsId,
    listGoodsIds: listGoodsIds,
    chapterCount: chapterCount,
    durationSummary: durationSummary,
    teacherName: teacherName,
    badgeLabel: badgeLabel,
    isOpsSide: isOpsSide,
    resetSeed: resetSeed,
    nowStr: nowStr,
    normalizeChapter: normalizeChapter
  };

  global.CourseStore = api;
  global.SeriesStore = api;
})(window);
