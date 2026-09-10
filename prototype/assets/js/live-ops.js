/**
 * 直播业务主链路 — 统一对象、多维状态、操作矩阵与 URL 上下文
 * 依赖：prototype-business-store.js（ProtoBiz）
 */
(function (global) {
  var OPS_KEY = "live_ops_overlay_v2";
  var CTX_KEY = "live_ops_list_ctx_v1";

  var EXTRA_ALIASES = {
    LV20260905001: "L001",
    LV20260905002: "L005",
    LV20260904001: "L005",
    L004: "L004",
    L005: "L005",
    L006: "L006"
  };

  var PLATFORM_LABEL = {
    not_submitted: "未提交",
    pending: "平台审核中",
    passed: "平台审核通过",
    rejected: "平台审核驳回",
    withdrawn: "已撤回"
  };
  var SHELF_LABEL = {
    unpublished: "未上架",
    scheduled: "定时上架",
    published: "已上架",
    offline: "已下架"
  };
  var RUNTIME_LABEL = {
    not_started: "未开始",
    living: "直播中",
    ended: "已结束",
    cancelled: "已取消"
  };

  function PB() { return global.ProtoBiz; }

  function loadOverlay() {
    try {
      var raw = localStorage.getItem(OPS_KEY);
      return raw ? JSON.parse(raw) : { version: 1, byId: {} };
    } catch (e) {
      return { version: 1, byId: {} };
    }
  }

  function saveOverlay(o) {
    localStorage.setItem(OPS_KEY, JSON.stringify(o));
  }

  function resolveId(raw) {
    if (!raw) return "";
    var s = String(raw);
    if (EXTRA_ALIASES[s]) s = EXTRA_ALIASES[s];
    if (PB() && PB().resolveLiveId) return PB().resolveLiveId(s) || s;
    return s;
  }

  function idFromSearch() {
    try {
      var q = new URLSearchParams(location.search);
      return resolveId(q.get("live_id") || q.get("liveId") || q.get("id") || "");
    } catch (e) {
      return "";
    }
  }

  function deriveFromLegacy(live) {
    var a = live.auditStatus || "draft";
    var platform = "not_submitted";
    if (a === "pending_platform_review") platform = "pending";
    else if (a === "platform_rejected" || a === "internal_rejected") platform = "rejected";
    else if (a === "approved") platform = "passed";
    else if (
      a === "draft" ||
      a === "pending_internal_review" ||
      a === "pending_platform_submit"
    ) platform = "not_submitted";

    var shelf = live.shelf ? "published" : "unpublished";
    if (live.execStatus === "cancelled") shelf = live.shelf ? "offline" : "unpublished";

    var runtime = "not_started";
    if (live.execStatus === "live" || live.liveStatus === "live") runtime = "living";
    else if (live.execStatus === "ended" || live.liveStatus === "ended") runtime = "ended";
    else if (live.execStatus === "cancelled") runtime = "cancelled";

    return {
      platformReviewStatus: live.platformReviewStatus || platform,
      shelfStatus: live.shelfStatus || shelf,
      runtimeStatus: live.runtimeStatus || runtime
    };
  }

  function ensureDemoLives() {
    if (!PB()) return;
    var data = PB().load();
    var changed = false;
    var extras = [
      {
        id: "L004",
        name: "春启 04 期试听 · 草稿",
        merchantId: "M001",
        merchantName: "星启家庭教育",
        courseName: "春启 04 期家长必修课",
        termId: "spring04",
        termName: "春启 04 期",
        liveMode: "视频直播",
        roomType: "传统直播间",
        startAt: "2026-09-15 20:00",
        endAt: "2026-09-15 22:00",
        creator: "阮荣均",
        owner: "阮荣均",
        teacher: "阮荣均",
        assistants: ["王助教"],
        description: "草稿直播，尚未提交平台审核。",
        products: [{ name: "9.9 引流课", price: 9.9 }],
        saleMode: "免费",
        execStatus: "preparing",
        execStatusLabel: "准备中",
        auditStatus: "draft",
        auditStatusLabel: "草稿",
        shelf: false,
        bookedUsers: 0,
        subscribedUsers: 0,
        remindStatus: "none",
        reminderEnabled: false,
        createdAt: "2026-09-09 11:00",
        currentVersion: 1,
        liveStatus: "draft",
        liveStatusLabel: "草稿"
      },
      {
        id: "L005",
        name: "午间答疑 · 直播中",
        merchantId: "M001",
        merchantName: "星启家庭教育",
        courseName: "春启 03 期家长必修课",
        termId: "spring03",
        termName: "春启 03 期",
        liveMode: "视频直播",
        roomType: "传统直播间",
        startAt: "2026-09-09 12:00",
        endAt: "2026-09-09 13:30",
        creator: "赵老师",
        owner: "赵老师",
        teacher: "赵老师",
        assistants: ["刘助教"],
        description: "正在直播的答疑场。",
        products: [{ name: "正式课", price: 1999 }],
        saleMode: "付费",
        execStatus: "live",
        execStatusLabel: "直播中",
        auditStatus: "approved",
        auditStatusLabel: "审核通过",
        shelf: true,
        bookedUsers: 220,
        subscribedUsers: 200,
        remindStatus: "sent",
        reminderEnabled: true,
        attendedUsers: 96,
        payUsers: 8,
        gmv: 3200,
        createdAt: "2026-09-07 09:00",
        currentVersion: 2,
        liveStatus: "live",
        liveStatusLabel: "直播中"
      },
      {
        id: "L006",
        name: "周末公开课 · 已驳回",
        merchantId: "M001",
        merchantName: "星启家庭教育",
        courseName: "试听公开课",
        termId: "trial",
        termName: "试听公开课",
        liveMode: "视频直播",
        roomType: "沉浸直播间",
        startAt: "2026-09-13 20:00",
        endAt: "2026-09-13 22:00",
        creator: "阮荣均",
        owner: "阮荣均",
        teacher: "阮荣均",
        assistants: [],
        description: "平台审核驳回，需修改封面后重新提交。",
        products: [{ name: "试听课", price: 0 }],
        saleMode: "免费",
        execStatus: "preparing",
        execStatusLabel: "准备中",
        auditStatus: "platform_rejected",
        auditStatusLabel: "平台审核驳回",
        shelf: false,
        bookedUsers: 0,
        subscribedUsers: 0,
        remindStatus: "none",
        reminderEnabled: true,
        rejectReason: "封面包含第三方水印，请更换后重新提交。",
        rejectItems: [{ id: "cover", label: "封面与暖场", reason: "封面包含第三方水印，请更换后重新提交。" }],
        coverConfigured: false,
        agreedOpsRules: true,
        createdAt: "2026-09-08 16:00",
        submittedPlatformAt: "2026-09-08 17:00",
        currentVersion: 1,
        liveStatus: "draft",
        liveStatusLabel: "平台审核驳回"
      }
    ];
    extras.forEach(function (ex) {
      if (!data.lives.some(function (l) { return l.id === ex.id; })) {
        data.lives.push(ex);
        changed = true;
      }
    });
    /* enrich base lives with config fields */
    data.lives.forEach(function (l) {
      if (!l.courseName) {
        if (l.id === "L001") { l.courseName = "春启 03 期家长必修课"; l.termId = "spring03"; l.termName = "春启 03 期"; }
        if (l.id === "L002") { l.courseName = "春启 03 期家长必修课"; l.termId = "spring03"; l.termName = "春启 03 期"; }
        if (l.id === "L003") { l.courseName = "春启 04 期家长必修课"; l.termId = "spring04"; l.termName = "春启 04 期"; }
        changed = true;
      }
      if (!l.liveMode) { l.liveMode = "视频直播"; changed = true; }
      if (!l.roomType) { l.roomType = "传统直播间"; changed = true; }
      if (!l.teacher) { l.teacher = l.id === "L002" ? "赵老师" : "阮荣均"; changed = true; }
      if (!l.creator) { l.creator = l.teacher; changed = true; }
      if (!l.owner) { l.owner = l.creator; changed = true; }
      if (l.currentVersion == null) { l.currentVersion = 1; changed = true; }
      if (!l.description) {
        l.description = l.name + " · 面向家长的直播课程。";
        changed = true;
      }
      if (l.coverConfigured == null) {
        l.coverConfigured = l.id !== "L006";
        changed = true;
      }
      if (l.agreedOpsRules == null) {
        l.agreedOpsRules = l.auditStatus === "approved" || l.auditStatus === "pending_platform_review";
        changed = true;
      }
      if (!l.saleMode) { l.saleMode = "免费"; changed = true; }
    });
    /* migrate legacy internal-review statuses */
    data.lives.forEach(function (l) {
      if (l.auditStatus === "pending_internal_review" || l.auditStatus === "pending_platform_submit") {
        l.auditStatus = "draft";
        l.auditStatusLabel = "草稿";
        l.liveStatus = "draft";
        l.liveStatusLabel = "草稿";
        changed = true;
      }
      if (l.auditStatus === "internal_rejected") {
        l.auditStatus = "platform_rejected";
        l.auditStatusLabel = "平台审核驳回";
        l.liveStatusLabel = "平台审核驳回";
        changed = true;
      }
    });
    if (changed) PB().save(data);
  }

  function mergeOverlay(live) {
    if (!live) return null;
    var o = loadOverlay().byId[live.id] || {};
    var d = deriveFromLegacy(live);
    return Object.assign({}, live, d, o, {
      liveId: live.id,
      liveName: live.name,
      platformReviewStatusLabel: PLATFORM_LABEL[o.platformReviewStatus || d.platformReviewStatus] || "",
      shelfStatusLabel: SHELF_LABEL[o.shelfStatus || d.shelfStatus] || "",
      runtimeStatusLabel: RUNTIME_LABEL[o.runtimeStatus || d.runtimeStatus] || ""
    });
  }

  function patchLive(liveId, patch) {
    liveId = resolveId(liveId);
    if (!PB()) return null;
    var live = PB().getLive(liveId);
    if (!live) return null;
    Object.assign(live, patch || {});
    /* sync legacy auditStatus from platform dimension only */
    var platform = live.platformReviewStatus;
    if (platform === "not_submitted" || platform === "withdrawn") live.auditStatus = "draft";
    else if (platform === "pending") live.auditStatus = "pending_platform_review";
    else if (platform === "rejected") live.auditStatus = "platform_rejected";
    else if (platform === "passed") live.auditStatus = "approved";
    live.auditStatusLabel = (PB().AUDIT_LABEL && PB().AUDIT_LABEL[live.auditStatus]) || live.auditStatus;
    if (live.shelfStatus === "published") live.shelf = true;
    if (live.shelfStatus === "unpublished" || live.shelfStatus === "offline") live.shelf = false;
    if (live.runtimeStatus === "living") { live.execStatus = "live"; live.execStatusLabel = "直播中"; }
    if (live.runtimeStatus === "ended") { live.execStatus = "ended"; live.execStatusLabel = "已结束"; }
    if (live.runtimeStatus === "cancelled") { live.execStatus = "cancelled"; live.execStatusLabel = "已取消"; }
    if (live.runtimeStatus === "not_started" && live.shelf) {
      live.execStatus = "scheduled";
      live.execStatusLabel = "待开播";
    }
    PB().saveLive(live);
    var ov = loadOverlay();
    ov.byId[liveId] = Object.assign({}, ov.byId[liveId] || {}, {
      platformReviewStatus: live.platformReviewStatus,
      shelfStatus: live.shelfStatus,
      runtimeStatus: live.runtimeStatus,
      rejectItems: live.rejectItems,
      nextActionHint: live.nextActionHint
    });
    saveOverlay(ov);
    return getLive(liveId);
  }

  function getLive(id) {
    ensureDemoLives();
    id = resolveId(id);
    if (!PB()) return null;
    var live = PB().getLive(id);
    return mergeOverlay(live);
  }

  function getLives() {
    ensureDemoLives();
    if (!PB()) return [];
    return PB().getLives().map(function (l) { return mergeOverlay(l); });
  }

  function scenarioKey(v) {
    var p = v.platformReviewStatus;
    var s = v.shelfStatus;
    var r = v.runtimeStatus;
    if (r === "cancelled") return "cancelled";
    if (r === "ended") return "ended";
    if (r === "living") return "living";
    if (p === "pending") return "platform_pending";
    if (p === "rejected") return "platform_rejected";
    if (p === "passed" && s !== "published") return "ready_shelf";
    if (p === "passed" && s === "published" && r === "not_started") return "upcoming";
    /* not_submitted / withdrawn → draft */
    return "draft";
  }

  function buildActions(v, role) {
    role = role || "creator";
    var key = scenarioKey(v);
    var id = v.liveId || v.id;
    var detail = buildUrl("live-edit.html", { live_id: id, mode: "view" });
    var edit = buildUrl("live-edit.html", { live_id: id });
    var editRejected = buildUrl("live-edit.html", { live_id: id, from: "platform_rejected", focus: "cover" });
    var progress = buildUrl("live-edit.html", { live_id: id, mode: "view", focus: "platform" });
    var booking = buildUrl("live-booking.html", { live_id: id, from: "detail" });
    var sop = buildUrl("live-invite.html", { live_id: id, from: "detail" });
    var control = buildUrl("live-control.html", { live_id: id });
    var screen = buildUrl("live-screen.html", { live_id: id });
    var stats = buildUrl("live-stats.html", { live_id: id });
    var replay = buildUrl("live-replay.html", { live_id: id });
    var postLive = buildUrl("leads.html", { scene: "post_live", live_id: id });

    var map = {
      draft: {
        primary: { label: "继续编辑", href: edit },
        secondary: [
          { label: "提交平台审核", action: "submit_platform" },
          { label: "查看详情", href: detail },
          { label: "复制", action: "copy" },
          { label: "删除", action: "delete" }
        ]
      },
      platform_pending: {
        primary: { label: "查看审核状态", href: progress },
        secondary: [
          { label: "撤回并编辑", action: "withdraw_edit" },
          { label: "查看详情", href: detail },
          { label: "复制", action: "copy" }
        ]
      },
      platform_rejected: {
        primary: { label: "修改并重新提交", href: editRejected },
        secondary: [
          { label: "查看驳回原因", href: progress },
          { label: "查看详情", href: detail },
          { label: "复制直播", action: "copy" }
        ]
      },
      ready_shelf: {
        primary: { label: "上架", action: "publish" },
        secondary: [
          { label: "查看详情", href: detail },
          { label: "预约管理", href: booking },
          { label: "直播促到SOP", href: sop },
          { label: "分享", action: "share" },
          { label: "编辑", href: edit }
        ]
      },
      upcoming: {
        primary: { label: "查看详情", href: detail },
        secondary: [
          { label: "预约管理", href: booking },
          { label: "直播促到SOP", href: sop },
          { label: "分享", action: "share" },
          { label: "进入中控台", href: control },
          { label: "编辑", href: edit },
          { label: "取消上架", action: "unpublish" }
        ]
      },
      living: {
        primary: { label: "进入中控台", href: control },
        secondary: [
          { label: "直播大屏", href: screen },
          { label: "实时数据", href: stats },
          { label: "分享", action: "share" },
          { label: "查看详情", href: detail },
          { label: "强制下架", action: "force_offline" }
        ]
      },
      ended: {
        primary: { label: "查看直播数据", href: stats },
        secondary: [
          { label: "查看回放", href: replay },
          { label: "后续转化", href: postLive },
          { label: "查看详情", href: detail },
          { label: "复制直播", action: "copy" }
        ]
      },
      cancelled: {
        primary: { label: "查看详情", href: detail },
        secondary: [
          { label: "复制直播", action: "copy" },
          { label: "删除", action: "delete" }
        ]
      }
    };
    var pack = map[key] || map.draft;
    return {
      scenario: key,
      primary: pack.primary,
      secondary: pack.secondary,
      nextLabel: pack.primary.label
    };
  }

  function buildUrl(path, params) {
    params = params || {};
    var q = new URLSearchParams();
    Object.keys(params).forEach(function (k) {
      if (params[k] != null && params[k] !== "") q.set(k, params[k]);
    });
    var s = q.toString();
    return path + (s ? "?" + s : "");
  }

  function saveListContext(ctx) {
    try { sessionStorage.setItem(CTX_KEY, JSON.stringify(ctx || {})); } catch (e) {}
  }

  function loadListContext() {
    try {
      return JSON.parse(sessionStorage.getItem(CTX_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function nextHint(v) {
    var a = buildActions(v);
    var lines = {
      draft: "完善配置后，在列表提交平台审核",
      platform_pending: "等待平台审核结果",
      platform_rejected: "按平台驳回原因修改后重新提交",
      ready_shelf: "上架后可进行开播准备",
      upcoming: "完成预约提醒与直播促到SOP",
      living: "进入中控台管理直播",
      ended: "查看数据与回放",
      cancelled: "可复制后重新创建"
    };
    return lines[a.scenario] || a.nextLabel;
  }

  function canBatch(action, lives) {
    if (!lives || !lives.length) return { ok: false, reason: "未选择直播" };
    var ok = [];
    var fail = [];
    lives.forEach(function (v) {
      var allow = false;
      if (action === "publish") {
        allow = v.platformReviewStatus === "passed" && v.shelfStatus !== "published" &&
          v.runtimeStatus !== "living" && v.runtimeStatus !== "ended";
      } else if (action === "unpublish") {
        allow = v.shelfStatus === "published" && v.runtimeStatus !== "ended" && v.runtimeStatus !== "living";
      } else if (action === "delete") {
        allow = v.platformReviewStatus === "not_submitted" || v.runtimeStatus === "cancelled" ||
          v.auditStatus === "draft";
      }
      if (allow) ok.push(v);
      else fail.push(v);
    });
    return {
      ok: ok.length > 0 && fail.length === 0,
      partial: ok.length > 0 && fail.length > 0,
      okList: ok,
      failList: fail,
      reason: fail.length ? ("有 " + fail.length + " 场状态不支持该操作") : ""
    };
  }

  function parseTime(s) {
    if (!s) return NaN;
    return new Date(String(s).replace(/-/g, "/").replace("T", " ")).getTime();
  }

  function validateForPlatformReview(live, opts) {
    opts = opts || {};
    var form = opts.form || null;
    var blockers = [];
    var warnings = [];
    var name = form && form.name != null ? form.name : (live && (live.liveName || live.name)) || "";
    var liveMode = form && form.liveMode != null ? form.liveMode : (live && live.liveMode) || "";
    var courseName = form && form.courseName != null ? form.courseName : (live && live.courseName) || "";
    var startAt = form && form.startAt != null ? form.startAt : (live && live.startAt) || "";
    var endAt = form && form.endAt != null ? form.endAt : (live && live.endAt) || "";
    var teacher = form && form.teacher != null ? form.teacher : (live && live.teacher) || "";
    var description = form && form.description != null ? form.description : (live && live.description) || "";
    var saleMode = form && form.saleMode != null ? form.saleMode : (live && live.saleMode) || "免费";
    var products = form && form.products != null ? form.products : (live && live.products) || [];
    var coverOk = form && form.coverConfigured != null
      ? !!form.coverConfigured
      : live && live.coverConfigured !== false;
    var agreed = form && form.agreedOpsRules != null
      ? !!form.agreedOpsRules
      : !!(live && live.agreedOpsRules);
    var content = form && form.content != null ? form.content : (live && live.content) || "";
    var runtime = (live && live.runtimeStatus) || "not_started";
    var platform = (live && live.platformReviewStatus) || "not_submitted";

    function addBlock(id, label, field, fixHref) {
      blockers.push({ id: id, label: label, field: field || "", fixHref: fixHref || "" });
    }

    if (runtime === "living" || runtime === "ended") {
      addBlock("runtime", "直播中或已结束的场次不可提交平台审核", "runtime");
    }
    if (platform === "pending") {
      addBlock("pending", "已在平台审核中，请勿重复提交", "platform");
    }
    if (!String(name).trim()) addBlock("name", "直播名称已填写", "name", "live-edit.html?live_id=" + (live && live.liveId) + "#sec-basic");
    if (!String(liveMode).trim()) addBlock("mode", "直播模式已选择", "mode", "live-edit.html?live_id=" + (live && live.liveId) + "#sec-basic");
    if (!String(courseName).trim() || courseName === "请选择") {
      addBlock("course", "关联课程已选择", "course", "live-edit.html?live_id=" + (live && live.liveId) + "#sec-basic");
    }
    if (!String(startAt).trim() || !String(endAt).trim()) {
      addBlock("time", "开始时间和结束时间已填写", "time", "live-edit.html?live_id=" + (live && live.liveId) + "#sec-basic");
    } else if (!(parseTime(endAt) > parseTime(startAt))) {
      addBlock("time_order", "结束时间晚于开始时间", "time", "live-edit.html?live_id=" + (live && live.liveId) + "#sec-basic");
    }
    if (!String(teacher).trim()) {
      addBlock("teacher", "主讲老师已选择", "teacher", "live-edit.html?live_id=" + (live && live.liveId) + "#sec-basic");
    }
    if (!coverOk) {
      addBlock("cover", "详情封面已配置", "cover", "live-edit.html?live_id=" + (live && live.liveId) + "&focus=cover#sec-cover");
    }
    if (!String(description).trim() && !String(content).trim()) {
      addBlock("intro", "直播介绍或直播详情已填写", "intro", "live-edit.html?live_id=" + (live && live.liveId) + "#sec-basic");
    }
    if (!String(saleMode).trim()) {
      addBlock("sale", "售卖方式已配置", "sale", "live-edit.html?live_id=" + (live && live.liveId) + "#sec-sale");
    } else if ((saleMode === "付费" || saleMode === "单独售卖") && (!products || !products.length)) {
      addBlock("goods", "开启商品售卖时至少挂载一个有效商品", "goods", "live-edit.html?live_id=" + (live && live.liveId) + "#sec-goods");
    }
    if (!agreed) {
      addBlock("agree", "已阅读并同意直播运营规范", "agree", "live-edit.html?live_id=" + (live && live.liveId) + "#sec-agree");
    }

    var remindOk = live && live.remindStatus && live.remindStatus !== "none";
    var hasSop = false;
    try {
      if (PB() && PB().getSops) {
        hasSop = (PB().getSops(live.liveId || live.id) || []).some(function (s) {
          return s.status && s.status !== "draft";
        });
      }
    } catch (e) {}
    if (!remindOk) {
      warnings.push({
        id: "booking",
        label: "预约提醒尚未配置完成（不阻断提交）",
        field: "booking"
      });
    }
    if (!hasSop) {
      warnings.push({
        id: "sop",
        label: "直播促到SOP尚未配置（不阻断提交）",
        field: "sop"
      });
    }

    return {
      ok: blockers.length === 0,
      blockers: blockers,
      warnings: warnings,
      snapshot: {
        name: name,
        liveMode: liveMode,
        courseName: courseName,
        startAt: startAt,
        endAt: endAt,
        teacher: teacher,
        description: description,
        saleMode: saleMode,
        products: products,
        coverConfigured: coverOk,
        agreedOpsRules: agreed
      }
    };
  }

  function ensureSubmitModalDom() {
    if (document.getElementById("live-submit-mask")) return;
    var style = document.createElement("style");
    style.id = "live-submit-modal-style";
    style.textContent =
      "#live-submit-mask{position:fixed;inset:0;background:rgba(29,33,41,.45);z-index:1200;display:none}" +
      "#live-submit-mask.open{display:block}" +
      "#live-submit-modal{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:min(560px,94vw);max-height:86vh;overflow:auto;background:#fff;border-radius:10px;z-index:1201;display:none;box-shadow:0 12px 40px rgba(0,0,0,.18)}" +
      "#live-submit-modal.open{display:block}" +
      "#live-submit-modal .ls-hd{padding:16px 20px;border-bottom:1px solid #e5e6eb;display:flex;justify-content:space-between;align-items:center}" +
      "#live-submit-modal .ls-bd{padding:16px 20px}" +
      "#live-submit-modal .ls-ft{padding:12px 20px;border-top:1px solid #e5e6eb;display:flex;justify-content:flex-end;gap:8px}" +
      "#live-submit-modal .ls-item{display:flex;gap:8px;align-items:flex-start;padding:8px 0;border-bottom:1px solid #f2f3f5;font-size:13px}" +
      "#live-submit-modal .ls-item:last-child{border-bottom:0}" +
      "#live-submit-modal .ok{color:#00b42a}" +
      "#live-submit-modal .bad{color:#f53f3f}" +
      "#live-submit-modal .warn{color:#d48806}";
    document.head.appendChild(style);
    var mask = document.createElement("div");
    mask.id = "live-submit-mask";
    var modal = document.createElement("div");
    modal.id = "live-submit-modal";
    modal.innerHTML =
      '<div class="ls-hd"><b>提交平台审核检查</b><button type="button" class="btn" id="ls-close">关闭</button></div>' +
      '<div class="ls-bd" id="ls-body"></div>' +
      '<div class="ls-ft">' +
      '<button type="button" class="btn" id="ls-cancel">取消</button>' +
      '<button type="button" class="btn btn-primary" id="ls-confirm" disabled>确认提交</button>' +
      "</div>";
    document.body.appendChild(mask);
    document.body.appendChild(modal);
    function close() {
      mask.classList.remove("open");
      modal.classList.remove("open");
    }
    mask.addEventListener("click", close);
    document.getElementById("ls-close").addEventListener("click", close);
    document.getElementById("ls-cancel").addEventListener("click", close);
  }

  function openSubmitPlatformModal(liveIdOrLive, opts) {
    opts = opts || {};
    var live = typeof liveIdOrLive === "object" && liveIdOrLive
      ? liveIdOrLive
      : getLive(liveIdOrLive);
    if (!live) {
      if (global.Proto && Proto.toast) Proto.toast("未找到直播");
      return;
    }
    ensureSubmitModalDom();
    var result = validateForPlatformReview(live, { form: opts.form });
    var body = document.getElementById("ls-body");
    var confirmBtn = document.getElementById("ls-confirm");
    var id = live.liveId || live.id;
    var html = "";
    html += '<p style="margin:0 0 12px;font-size:13px"><b>' + (live.liveName || live.name) +
      "</b> · ID " + id + "</p>";
    html += '<p class="muted" style="margin:0 0 12px;font-size:12px">提交后平台审核状态将变为「平台审核中」，期间不可编辑；可通过「撤回并编辑」撤回。</p>';

    if (result.blockers.length) {
      html += "<h4 style=\"margin:12px 0 6px;font-size:13px\">阻断项（须全部通过）</h4>";
      result.blockers.forEach(function (b) {
        var fix = b.fixHref
          ? ' <a class="link-blue" href="' + b.fixHref.replace("live_id=undefined", "live_id=" + id).replace("live_id=null", "live_id=" + id) + '">去修改</a>'
          : "";
        if (b.id === "agree" && opts.allowAgreeInModal !== false) {
          fix = ' <label style="margin-left:8px"><input type="checkbox" id="ls-agree" /> 我已阅读并同意</label>';
        }
        html += '<div class="ls-item"><span class="bad">✕</span><div>' + b.label + fix + "</div></div>";
      });
    } else {
      html += '<div class="ls-item"><span class="ok">✓</span><div>必填项检查已通过</div></div>';
    }

    if (result.warnings.length) {
      html += "<h4 style=\"margin:12px 0 6px;font-size:13px\">风险提醒（不阻断）</h4>";
      result.warnings.forEach(function (w) {
        html += '<div class="ls-item"><span class="warn">!</span><div>' + w.label + "</div></div>";
      });
    }

    body.innerHTML = html;
    confirmBtn.disabled = !result.ok;

    var agreeEl = document.getElementById("ls-agree");
    if (agreeEl) {
      agreeEl.addEventListener("change", function () {
        if (!agreeEl.checked) {
          confirmBtn.disabled = true;
          return;
        }
        var form = Object.assign({}, opts.form || {}, { agreedOpsRules: true });
        var again = validateForPlatformReview(live, { form: form });
        confirmBtn.disabled = !again.ok;
        confirmBtn._pendingForm = form;
      });
    }

    confirmBtn.onclick = function () {
      if (confirmBtn.disabled) return;
      var form = confirmBtn._pendingForm || opts.form || {};
      if (form.agreedOpsRules || (document.getElementById("ls-agree") && document.getElementById("ls-agree").checked)) {
        patchLive(id, { agreedOpsRules: true });
      }
      if (opts.beforeSubmit) {
        var cont = opts.beforeSubmit();
        if (cont === false) return;
      }
      submitPlatform(id);
      document.getElementById("live-submit-mask").classList.remove("open");
      document.getElementById("live-submit-modal").classList.remove("open");
      if (global.Proto && Proto.toast) Proto.toast("已提交平台审核");
      if (typeof opts.onSuccess === "function") opts.onSuccess(getLive(id));
      else if (opts.reload !== false) location.reload();
    };

    document.getElementById("live-submit-mask").classList.add("open");
    document.getElementById("live-submit-modal").classList.add("open");
    return result;
  }

  function listReturnUrl(extra) {
    var ctx = loadListContext();
    var params = Object.assign({}, (ctx && ctx.filters) || {}, extra || {});
    params._restore = "1";
    return buildUrl("lives.html", params);
  }

  function canEditLive(v) {
    if (!v) return false;
    var key = scenarioKey(v);
    if (key === "living" || key === "ended" || key === "cancelled") return false;
    return true;
  }

  function editGateMessage(v) {
    var key = scenarioKey(v);
    if (key === "living") return { allow: false, message: "直播进行中，禁止编辑基础配置。请使用中控台进行应急操作。" };
    if (key === "ended") return { allow: false, message: "直播已结束，不可编辑原直播。可查看数据、回放或复制直播。" };
    if (key === "cancelled") return { allow: false, message: "直播已取消，仅可查看或复制。" };
    if (key === "platform_pending") {
      return {
        allow: true,
        needWithdraw: true,
        message: "当前直播正在平台审核中，编辑前需要撤回审核。撤回后直播将变为草稿，需要修改并重新提交。"
      };
    }
    if (key === "upcoming" || key === "ready_shelf") {
      return {
        allow: true,
        warnOnSave: true,
        message: "修改已审核直播后，原平台审核结果将失效，直播将退回草稿并取消上架，需要重新提交平台审核。"
      };
    }
    return { allow: true };
  }

  function submitPlatform(liveId) {
    return patchLive(liveId, {
      platformReviewStatus: "pending",
      submittedPlatformAt: (PB() && PB().DEMO_NOW) || "",
      rejectReason: "",
      nextActionHint: "等待平台审核"
    });
  }

  function withdrawPlatform(liveId) {
    return patchLive(liveId, {
      platformReviewStatus: "withdrawn",
      nextActionHint: "完善后可重新提交平台审核"
    });
  }

  function withdrawAndEdit(liveId) {
    withdrawPlatform(liveId);
    patchLive(liveId, { platformReviewStatus: "not_submitted" });
    return getLive(liveId);
  }

  function revertApprovedOnSave(liveId) {
    return patchLive(liveId, {
      platformReviewStatus: "not_submitted",
      shelfStatus: "unpublished",
      runtimeStatus: "not_started",
      nextActionHint: "完善后，在列表或编辑页提交平台审核"
    });
  }

  function publish(liveId) {
    return patchLive(liveId, {
      shelfStatus: "published",
      runtimeStatus: "not_started",
      shelvedAt: (PB() && PB().DEMO_NOW) || "",
      nextActionHint: "配置预约与直播促到SOP"
    });
  }

  function unpublish(liveId) {
    return patchLive(liveId, {
      shelfStatus: "offline",
      nextActionHint: "已下架"
    });
  }

  function forceOffline(liveId) {
    return patchLive(liveId, {
      shelfStatus: "offline",
      runtimeStatus: "cancelled",
      nextActionHint: "已强制下架"
    });
  }

  function copyLive(liveId) {
    var src = getLive(liveId);
    if (!src || !PB()) return null;
    var data = PB().load();
    var nid = "L" + String(100 + data.lives.length + 1).padStart(3, "0");
    var copy = Object.assign({}, src, {
      id: nid,
      name: (src.name || "") + "（副本）",
      auditStatus: "draft",
      auditStatusLabel: "草稿",
      platformReviewStatus: "not_submitted",
      shelfStatus: "unpublished",
      runtimeStatus: "not_started",
      shelf: false,
      execStatus: "preparing",
      execStatusLabel: "准备中",
      createdAt: PB().DEMO_NOW,
      submittedInternalAt: null,
      internalApprovedAt: null,
      submittedPlatformAt: null,
      platformApprovedAt: null,
      shelvedAt: null,
      rejectReason: "",
      rejectItems: [],
      currentVersion: 1,
      liveStatus: "draft",
      liveStatusLabel: "草稿"
    });
    delete copy.liveId;
    data.lives.push(copy);
    PB().save(data);
    return getLive(nid);
  }

  function deleteLive(liveId) {
    liveId = resolveId(liveId);
    if (!PB()) return false;
    var data = PB().load();
    var live = data.lives.find(function (l) { return l.id === liveId; });
    if (!live) return false;
    var v = mergeOverlay(live);
    var gate = canBatch("delete", [v]);
    if (!gate.ok && !gate.partial) return false;
    data.lives = data.lives.filter(function (l) { return l.id !== liveId; });
    PB().save(data);
    var ov = loadOverlay();
    delete ov.byId[liveId];
    saveOverlay(ov);
    return true;
  }

  function createLive(fields) {
    if (!PB()) return null;
    var data = PB().load();
    var nid = "L" + String(100 + data.lives.length + 1).padStart(3, "0");
    var live = Object.assign({
      id: nid,
      merchantId: "M001",
      merchantName: "星启家庭教育",
      liveMode: "视频直播",
      roomType: "传统直播间",
      creator: "阮荣均",
      owner: "阮荣均",
      teacher: "阮荣均",
      assistants: [],
      products: [],
      saleMode: "免费",
      bookedUsers: 0,
      subscribedUsers: 0,
      remindStatus: "none",
      reminderEnabled: true,
      preRemindOffset: "1h",
      remindOnStart: true,
      remindReplay: true,
      attendedUsers: 0,
      payUsers: 0,
      gmv: 0,
      currentVersion: 1,
      createdAt: PB().DEMO_NOW
    }, fields || {}, {
      auditStatus: "draft",
      auditStatusLabel: "草稿",
      platformReviewStatus: "not_submitted",
      shelfStatus: "unpublished",
      runtimeStatus: "not_started",
      shelf: false,
      execStatus: "preparing",
      execStatusLabel: "准备中",
      liveStatus: "draft",
      liveStatusLabel: "草稿"
    });
    data.lives.push(live);
    PB().save(data);
    return getLive(nid);
  }

  function renderContextBanner(opts) {
    opts = opts || {};
    var live = opts.live || (opts.liveId ? getLive(opts.liveId) : getLive(idFromSearch()));
    var host = opts.host || document.getElementById("page-content");
    if (!host) return null;
    var existing = document.getElementById("live-ops-banner");
    if (!live) {
      if (existing) existing.remove();
      if (opts.showEmpty) {
        var empty = document.createElement("div");
        empty.id = "live-ops-banner";
        empty.className = "board-tip";
        empty.style.cssText = "margin-bottom:12px;background:#fff7e8;border-color:#ffcf8b";
        empty.innerHTML = "<b>未选择直播</b> · 请从直播列表或直播详情进入，避免无上下文操作。" +
          ' <a href="lives.html">返回直播列表</a>';
        host.insertBefore(empty, host.firstChild);
      }
      return null;
    }
    if (!existing) {
      existing = document.createElement("div");
      existing.id = "live-ops-banner";
      existing.className = "board-tip";
      existing.style.cssText = "margin-bottom:12px;background:#f0f5ff;border-color:#adc6ff";
      host.insertBefore(existing, host.firstChild);
    }
    var back = opts.backHref || buildUrl("live-edit.html", { live_id: live.liveId, mode: "view" });
    existing.innerHTML = "<b>当前直播：</b>" + live.liveName + "（" + live.liveId + "） · " +
      live.platformReviewStatusLabel + " / " +
      live.shelfStatusLabel + " / " + live.runtimeStatusLabel +
      ' · <a href="' + back + '">返回直播详情</a>' +
      ' · <a href="lives.html">直播列表</a>';
    return existing;
  }

  function viewLiveUrl(liveId, extra) {
    return buildUrl("live-edit.html", Object.assign({ live_id: resolveId(liveId), mode: "view" }, extra || {}));
  }

  function editLiveUrl(liveId, extra) {
    return buildUrl("live-edit.html", Object.assign({ live_id: resolveId(liveId) }, extra || {}));
  }

  function escHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function shortLinkFor(live) {
    var id = (live && (live.liveId || live.id)) || "L000";
    return "https://x.yibo.cn/s/" + id.replace(/^L/, "") + "a7";
  }

  function shareCopyText(live) {
    var shop = (live && live.merchantName) || "艺博学堂";
    var name = (live && (live.liveName || live.name)) || "直播";
    return shop + " 发现一场好直播\n" + name + "\n点击进入：" + shortLinkFor(live);
  }

  function mpCodeSvg() {
    /* circular mini-program code style placeholder */
    return '<svg viewBox="0 0 120 120" width="160" height="160" aria-hidden="true">' +
      '<circle cx="60" cy="60" r="58" fill="#fff" stroke="#e5e6eb"/>' +
      '<circle cx="60" cy="60" r="48" fill="none" stroke="#1a1a1a" stroke-width="6"/>' +
      '<circle cx="60" cy="60" r="36" fill="none" stroke="#07c160" stroke-width="5"/>' +
      '<circle cx="60" cy="60" r="22" fill="#07c160"/>' +
      '<path d="M48 60c0-8 6-14 12-14s12 6 12 14-6 14-12 14" fill="none" stroke="#fff" stroke-width="3"/>' +
      '<circle cx="60" cy="60" r="5" fill="#fff"/>' +
      "</svg>";
  }

  function ensureShareModalDom() {
    if (document.getElementById("live-share-mask")) return;
    var style = document.createElement("style");
    style.id = "live-share-modal-style";
    style.textContent =
      "#live-share-modal{width:min(720px,94vw);max-height:90vh}" +
      "#live-share-modal .ls-tabs{display:flex;gap:24px;border-bottom:1px solid #e5e6eb;margin:0 0 16px;padding:0 4px}" +
      "#live-share-modal .ls-tab{padding:10px 2px;font-size:14px;color:#4e5969;cursor:pointer;border:0;background:none;position:relative}" +
      "#live-share-modal .ls-tab.active{color:#165dff;font-weight:500}" +
      "#live-share-modal .ls-tab.active:after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2px;background:#165dff}" +
      "#live-share-modal .ls-pane{display:none}" +
      "#live-share-modal .ls-pane.active{display:block}" +
      "#live-share-modal .ls-poster-row{display:flex;gap:20px;align-items:flex-start}" +
      "#live-share-modal .ls-poster{width:220px;flex-shrink:0;border:1px solid #e5e6eb;border-radius:8px;overflow:hidden;background:#f7f8fa}" +
      "#live-share-modal .ls-poster-hd{padding:10px 12px;font-size:12px;color:#86909c}" +
      "#live-share-modal .ls-poster-body{padding:16px 12px 12px;text-align:center;background:linear-gradient(160deg,#3b82f6,#6366f1);color:#fff;min-height:120px}" +
      "#live-share-modal .ls-poster-title{font-size:15px;font-weight:600;line-height:1.4}" +
      "#live-share-modal .ls-poster-ft{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#fff;gap:8px}" +
      "#live-share-modal .ls-poster-ft .mp{width:48px;height:48px;flex-shrink:0}" +
      "#live-share-modal .ls-poster-ft .mp svg{width:48px;height:48px}" +
      "#live-share-modal .ls-copy-box{flex:1;min-width:0;background:#f7f8fa;border-radius:8px;padding:14px 16px;font-size:13px;line-height:1.7;color:#1d2129;white-space:pre-wrap;word-break:break-all}" +
      "#live-share-modal .ls-settings{display:inline-block;margin-top:10px;font-size:13px;color:#165dff;cursor:pointer}" +
      "#live-share-modal .ls-link-label{font-size:13px;color:#4e5969;margin-bottom:8px}" +
      "#live-share-modal .ls-link-box{background:#f7f8fa;border-radius:8px;padding:14px 16px;font-size:13px;line-height:1.7;white-space:pre-wrap;margin-bottom:12px}" +
      "#live-share-modal .ls-link-row{display:flex;gap:8px;align-items:center}" +
      "#live-share-modal .ls-link-row input{flex:1;min-width:0;height:36px;border:1px solid #e5e6eb;border-radius:6px;padding:0 10px;font-size:13px}" +
      "#live-share-modal .ls-qr-wrap{text-align:center;padding:12px 0 4px}" +
      "#live-share-modal .ls-qr-card{display:inline-block;padding:20px;border:1px solid #e5e6eb;border-radius:8px;background:#fff}" +
      "#live-share-modal .ls-qr-tip{margin-top:10px;font-size:12px;color:#86909c}";
    document.head.appendChild(style);

    var mask = document.createElement("div");
    mask.className = "proto-mask";
    mask.id = "live-share-mask";
    var modal = document.createElement("div");
    modal.className = "proto-modal";
    modal.id = "live-share-modal";
    modal.innerHTML =
      '<div class="proto-modal-hd"><h3>分享</h3><button type="button" class="btn btn-sm btn-ghost" data-ls-close>×</button></div>' +
      '<div class="proto-modal-bd" id="live-share-bd"></div>' +
      '<div class="proto-modal-ft" id="live-share-ft"></div>';
    document.body.appendChild(mask);
    document.body.appendChild(modal);

    mask.addEventListener("click", closeShareModal);
    modal.querySelector("[data-ls-close]").addEventListener("click", closeShareModal);
  }

  function closeShareModal() {
    var mask = document.getElementById("live-share-mask");
    var modal = document.getElementById("live-share-modal");
    if (mask) mask.classList.remove("open");
    if (modal) modal.classList.remove("open");
  }

  function copyText(text) {
    function done() {
      if (global.Proto && Proto.toast) Proto.toast("已复制");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {
        window.prompt("复制以下内容", text);
        done();
      });
      return;
    }
    window.prompt("复制以下内容", text);
    done();
  }

  function openShareModal(liveIdOrLive, opts) {
    opts = opts || {};
    var live = typeof liveIdOrLive === "object" && liveIdOrLive
      ? liveIdOrLive
      : getLive(liveIdOrLive);
    if (!live) {
      if (global.Proto && Proto.toast) Proto.toast("未找到直播，无法分享");
      return;
    }
    ensureShareModalDom();
    var short = shortLinkFor(live);
    var copyBody = shareCopyText(live);
    var name = live.liveName || live.name || "直播";
    var shop = live.merchantName || "艺博学堂";
    var tab = opts.tab || "poster";

    var bd = document.getElementById("live-share-bd");
    var ft = document.getElementById("live-share-ft");
    bd.innerHTML =
      '<div class="ls-tabs">' +
      '<button type="button" class="ls-tab' + (tab === "poster" ? " active" : "") + '" data-ls-tab="poster">海报</button>' +
      '<button type="button" class="ls-tab' + (tab === "link" ? " active" : "") + '" data-ls-tab="link">链接</button>' +
      '<button type="button" class="ls-tab' + (tab === "qr" ? " active" : "") + '" data-ls-tab="qr">小程序码</button>' +
      "</div>" +
      '<div class="ls-pane' + (tab === "poster" ? " active" : "") + '" data-ls-pane="poster">' +
      '<div class="ls-poster-row">' +
      '<div><div class="ls-poster">' +
      '<div class="ls-poster-hd">' + escHtml(shop) + "</div>" +
      '<div class="ls-poster-body"><div class="ls-poster-title">' + escHtml(name) + "</div>" +
      '<div style="margin-top:10px;font-size:12px;opacity:.9">' + escHtml(live.startAt || "") + "</div></div>" +
      '<div class="ls-poster-ft"><div style="font-size:11px;color:#86909c;text-align:left;line-height:1.4">长按识别小程序码<br/>进入直播</div>' +
      '<div class="mp">' + mpCodeSvg() + "</div></div></div>" +
      '<a class="ls-settings" data-ls-settings>海报和分享语设置</a></div>' +
      '<div class="ls-copy-box"><div class="muted" style="margin-bottom:6px;font-size:12px">给用户分享这场直播：</div>' +
      escHtml(copyBody) + "</div></div></div>" +
      '<div class="ls-pane' + (tab === "link" ? " active" : "") + '" data-ls-pane="link">' +
      '<div class="ls-link-label">给用户分享这场直播：</div>' +
      '<div class="ls-link-box">' + escHtml(copyBody) + "</div>" +
      '<div class="ls-link-row">' +
      '<input type="text" readonly value="' + escHtml(short) + '" id="ls-short-input" />' +
      '<button type="button" class="btn" data-ls-copy-short>复制短链</button>' +
      "</div>" +
      '<p class="muted" style="font-size:12px;margin:10px 0 0">小程序短链，适用于微信内分享与外链唤起小程序。</p></div>' +
      '<div class="ls-pane' + (tab === "qr" ? " active" : "") + '" data-ls-pane="qr">' +
      '<div class="ls-qr-wrap"><div class="ls-qr-card">' + mpCodeSvg() +
      '<div class="ls-qr-tip">小程序码 · 扫码进入本场直播</div></div>' +
      '<div style="margin-top:16px"><button type="button" class="btn btn-primary" data-ls-dl-code>下载小程序码</button></div></div></div>';

    function setTab(next) {
      bd.querySelectorAll(".ls-tab").forEach(function (t) {
        t.classList.toggle("active", t.getAttribute("data-ls-tab") === next);
      });
      bd.querySelectorAll(".ls-pane").forEach(function (p) {
        p.classList.toggle("active", p.getAttribute("data-ls-pane") === next);
      });
      if (next === "poster") {
        ft.innerHTML =
          '<button type="button" class="btn" data-ls-copy-poster>复制海报</button>' +
          '<button type="button" class="btn btn-primary" data-ls-copy-content>复制内容</button>';
      } else if (next === "link") {
        ft.innerHTML =
          '<button type="button" class="btn" data-ls-copy-short2>复制短链</button>' +
          '<button type="button" class="btn btn-primary" data-ls-copy-content>复制内容</button>';
      } else {
        ft.innerHTML =
          '<button type="button" class="btn btn-primary" data-ls-dl-code2>下载小程序码</button>';
      }
      bindFt();
    }

    function bindFt() {
      var cp = ft.querySelector("[data-ls-copy-poster]");
      if (cp) cp.onclick = function () {
        if (global.Proto && Proto.toast) Proto.toast("海报已复制到剪贴板（原型）");
      };
      var cc = ft.querySelector("[data-ls-copy-content]");
      if (cc) cc.onclick = function () { copyText(copyBody); };
      var cs = ft.querySelector("[data-ls-copy-short2]");
      if (cs) cs.onclick = function () { copyText(short); };
      var dl = ft.querySelector("[data-ls-dl-code2]");
      if (dl) dl.onclick = function () {
        if (global.Proto && Proto.toast) Proto.toast("已下载小程序码（原型）");
      };
    }

    bd.querySelectorAll("[data-ls-tab]").forEach(function (btn) {
      btn.onclick = function () { setTab(btn.getAttribute("data-ls-tab")); };
    });
    var settings = bd.querySelector("[data-ls-settings]");
    if (settings) settings.onclick = function () {
      if (global.Proto && Proto.toast) Proto.toast("打开海报和分享语设置（原型）");
    };
    var copyShort = bd.querySelector("[data-ls-copy-short]");
    if (copyShort) copyShort.onclick = function () { copyText(short); };
    var dlCode = bd.querySelector("[data-ls-dl-code]");
    if (dlCode) dlCode.onclick = function () {
      if (global.Proto && Proto.toast) Proto.toast("已下载小程序码（原型）");
    };

    setTab(tab);
    document.getElementById("live-share-mask").classList.add("open");
    document.getElementById("live-share-modal").classList.add("open");
  }

  function renderEmptyLive(host, msg) {
    host = host || document.getElementById("page-content");
    if (!host) return;
    host.innerHTML =
      '<div class="card"><div class="card-bd" style="padding:48px;text-align:center">' +
      '<p style="font-size:15px;margin:0 0 16px">' + (msg || "未找到对应直播，请返回列表重新选择。") + "</p>" +
      '<a class="btn btn-primary" href="lives.html">返回直播列表</a></div></div>';
  }

  function statusChipsHtml(v) {
    return '<span class="audit-badge">' + v.platformReviewStatusLabel + "</span><br/>" +
      '<span class="muted">上架：' + v.shelfStatusLabel + " · 直播：" + v.runtimeStatusLabel + "</span>";
  }

  /* init once */
  try { ensureDemoLives(); } catch (e) {}

  global.LiveOps = {
    PLATFORM_LABEL: PLATFORM_LABEL,
    SHELF_LABEL: SHELF_LABEL,
    RUNTIME_LABEL: RUNTIME_LABEL,
    resolveId: resolveId,
    idFromSearch: idFromSearch,
    getLive: getLive,
    getLives: getLives,
    patchLive: patchLive,
    scenarioKey: scenarioKey,
    buildActions: buildActions,
    buildUrl: buildUrl,
    nextHint: nextHint,
    canBatch: canBatch,
    validateForPlatformReview: validateForPlatformReview,
    openSubmitPlatformModal: openSubmitPlatformModal,
    submitPlatform: submitPlatform,
    withdrawPlatform: withdrawPlatform,
    withdrawAndEdit: withdrawAndEdit,
    revertApprovedOnSave: revertApprovedOnSave,
    canEditLive: canEditLive,
    editGateMessage: editGateMessage,
    listReturnUrl: listReturnUrl,
    publish: publish,
    unpublish: unpublish,
    forceOffline: forceOffline,
    copyLive: copyLive,
    deleteLive: deleteLive,
    createLive: createLive,
    saveListContext: saveListContext,
    loadListContext: loadListContext,
    renderContextBanner: renderContextBanner,
    renderEmptyLive: renderEmptyLive,
    statusChipsHtml: statusChipsHtml,
    openShareModal: openShareModal,
    closeShareModal: closeShareModal,
    shortLinkFor: shortLinkFor,
    viewLiveUrl: viewLiveUrl,
    editLiveUrl: editLiveUrl
  };
})(window);
