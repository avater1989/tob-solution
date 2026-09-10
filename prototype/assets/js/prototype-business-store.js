/**
 * 统一模拟业务数据源（Phase 4）
 * - 规范 ID：直播 L001/L002/L003；SOP SOP001–SOP003；售后 AS…；订单 CO…
 * - localStorage 持久化；版本升级可重置
 * - 兼容旧参数：liveId / spring03 / live-spring-03 等
 */
(function (global) {
  var STORE_KEY = "proto_biz_store_v5";
  var VERSION = 5;
  var DEMO_NOW = "2026-09-09 16:00:00";

  var LIVE_ALIASES = {
    spring03: "L001",
    "live-spring-03": "L001",
    "live_spring_03": "L001",
    "L-t1": "L001",
    L01: "L001",
    "L-t2": "L002",
    L02: "L002",
    "weekend-qa": "L003",
    "L-t3": "L003",
    L03: "L003"
  };

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  function seed() {
    return {
      version: VERSION,
      demoNow: DEMO_NOW,
      merchant: { id: "M001", name: "星启家庭教育" },
      lives: [
        {
          id: "L001",
          name: "春启 03 期家长公开课",
          merchantId: "M001",
          merchantName: "星启家庭教育",
          startAt: "2026-09-09 20:00",
          endAt: "2026-09-09 22:00",
          execStatus: "scheduled",
          execStatusLabel: "待开播",
          auditStatus: "approved",
          auditStatusLabel: "审核通过",
          bookedUsers: 486,
          subscribedUsers: 420,
          remindStatus: "pending",
          remindStatusLabel: "待执行",
          remindReached: 0,
          shelf: true,
          attendedUsers: 0,
          orderedUsers: 0,
          payUsers: 0,
          gmv: 0,
          reminderEnabled: true,
          preRemindOffset: "1h",
          remindOnStart: true,
          remindReplay: true,
          createdAt: "2026-09-05 10:20",
          submittedInternalAt: "2026-09-05 14:30",
          internalApprovedAt: "2026-09-05 15:10",
          submittedPlatformAt: "2026-09-05 15:20",
          platformApprovedAt: "2026-09-05 16:10",
          shelvedAt: "2026-09-05 16:20",
          /* LiveReach compat */
          liveStatus: "upcoming",
          liveStatusLabel: "待开播"
        },
        {
          id: "L002",
          name: "早间家长课 · 复盘",
          merchantId: "M001",
          merchantName: "星启家庭教育",
          startAt: "2026-09-09 09:30",
          endAt: "2026-09-09 11:00",
          execStatus: "ended",
          execStatusLabel: "已结束",
          auditStatus: "approved",
          auditStatusLabel: "审核通过",
          bookedUsers: 152,
          subscribedUsers: 140,
          remindStatus: "sent",
          remindStatusLabel: "已送达",
          remindReached: 140,
          shelf: true,
          attendedUsers: 68,
          orderedUsers: 6,
          payUsers: 6,
          gmv: 2100,
          reminderEnabled: true,
          preRemindOffset: "1h",
          remindOnStart: true,
          remindReplay: true,
          createdAt: "2026-09-04 09:00",
          submittedInternalAt: "2026-09-04 11:00",
          internalApprovedAt: "2026-09-04 12:00",
          submittedPlatformAt: "2026-09-04 12:10",
          platformApprovedAt: "2026-09-04 14:00",
          shelvedAt: "2026-09-04 14:10",
          liveStatus: "ended",
          liveStatusLabel: "已结束"
        },
        {
          id: "L003",
          name: "明日直播 · 春启 04 招生",
          merchantId: "M001",
          merchantName: "星启家庭教育",
          startAt: "2026-09-10 19:00",
          endAt: "2026-09-10 21:00",
          execStatus: "preparing",
          execStatusLabel: "准备中",
          auditStatus: "pending_internal_review",
          auditStatusLabel: "待内部复核",
          bookedUsers: 0,
          subscribedUsers: 0,
          remindStatus: "none",
          remindStatusLabel: "—",
          remindReached: 0,
          shelf: false,
          attendedUsers: 0,
          orderedUsers: 0,
          payUsers: 0,
          gmv: 0,
          reminderEnabled: true,
          preRemindOffset: "1h",
          remindOnStart: true,
          remindReplay: true,
          createdAt: "2026-09-09 09:30",
          submittedInternalAt: "2026-09-09 10:05",
          internalApprovedAt: null,
          submittedPlatformAt: null,
          platformApprovedAt: null,
          shelvedAt: null,
          liveStatus: "draft_pending",
          liveStatusLabel: "待内部复核"
        }
      ],
      sops: [
        {
          id: "SOP001",
          sopName: "春启03直播前邀约与催到SOP",
          name: "春启03直播前邀约与催到SOP",
          liveId: "L001",
          owner: "赵老师",
          status: "scheduled",
          targetAudience: "私域高意向未预约 + 已预约待催到",
          excludeRules: ["已购买", "已退订营销"],
          targetCount: 1284,
          targetUsers: 1284,
          reachedCount: 0,
          reachedUsers: 0,
          bookedCount: 0,
          newBookings: 0,
          attendedCount: 0,
          attendedUsers: 0,
          orderedCount: 0,
          orderUsers: 0,
          gmv: 0,
          period: "春启 03 期",
          channel: "企微+短信",
          category: "scrm_campaign",
          createdAt: "2026-09-08 11:00",
          updatedAt: "2026-09-08 11:00",
          startedAt: null,
          executionLogs: [],
          steps: [
            { id: "ST1", name: "直播前邀约", timing: "直播前 24 小时", audience: "高意向未预约", channels: ["企微", "短信"], goal: "完成预约", auto: true, status: "pending", target: 800, reached: 0, converted: 0 },
            { id: "ST2", name: "预约后催到", timing: "预约成功后 2 小时", audience: "新预约用户", channels: ["企微"], goal: "确认到课意向", auto: true, status: "pending", target: 400, reached: 0, converted: 0 },
            { id: "ST3", name: "开播前提醒", timing: "关联预约管理", audience: "已预约用户", channels: ["系统提醒"], goal: "到课", auto: true, status: "linked_booking", target: 486, reached: 0, converted: 0, linkBooking: true },
            { id: "ST4", name: "开播中未到场召回", timing: "开播后 10 分钟", audience: "已预约未进入", channels: ["企微"], goal: "到课", auto: true, status: "pending", target: 200, reached: 0, converted: 0 },
            { id: "ST5", name: "回放触达", timing: "回放生成后", audience: "未到课用户", channels: ["短信"], goal: "观看回放", auto: true, status: "pending", target: 300, reached: 0, converted: 0 },
            { id: "ST6", name: "会后跟进", timing: "结束后 30 分钟", audience: "高意向未下单", channels: ["助教任务"], goal: "成交", auto: false, status: "pending", target: 80, reached: 0, converted: 0 }
          ]
        },
        {
          id: "SOP002",
          sopName: "早间家长课回放触达SOP",
          name: "早间家长课回放触达SOP",
          liveId: "L002",
          owner: "赵老师",
          status: "completed",
          targetAudience: "已预约 + 未到课",
          excludeRules: ["已购买"],
          targetCount: 152,
          targetUsers: 152,
          reachedCount: 148,
          reachedUsers: 148,
          bookedCount: 152,
          newBookings: 0,
          attendedCount: 68,
          attendedUsers: 68,
          orderedCount: 6,
          orderUsers: 6,
          gmv: 2100,
          period: "春启 03 期",
          channel: "企微+短信",
          category: "scrm_campaign",
          createdAt: "2026-09-08 18:00",
          updatedAt: "2026-09-09 12:00",
          startedAt: "2026-09-09 08:00",
          executionLogs: [{ at: "2026-09-09 08:00", action: "启动", by: "赵老师" }, { at: "2026-09-09 11:30", action: "完成", by: "系统" }],
          steps: [
            { id: "ST1", name: "开播前提醒", timing: "关联预约管理", audience: "已预约", channels: ["系统提醒"], goal: "到课", auto: true, status: "completed", target: 152, reached: 140, converted: 68, linkBooking: true },
            { id: "ST2", name: "开播中未到场召回", timing: "开播后 10 分钟", audience: "未进入", channels: ["企微"], goal: "到课", auto: true, status: "completed", target: 80, reached: 72, converted: 18 },
            { id: "ST3", name: "回放触达", timing: "回放生成后", audience: "未到课", channels: ["短信"], goal: "观看", auto: true, status: "completed", target: 84, reached: 76, converted: 21 },
            { id: "ST4", name: "会后跟进", timing: "结束后", audience: "高意向", channels: ["助教任务"], goal: "成交", auto: false, status: "completed", target: 30, reached: 28, converted: 6 }
          ]
        },
        {
          id: "SOP003",
          sopName: "春启04招生预热SOP",
          name: "春启04招生预热SOP",
          liveId: "L003",
          owner: "赵老师",
          status: "draft",
          targetAudience: "春启04 意向线索",
          excludeRules: ["已购买", "黑名单"],
          targetCount: 260,
          targetUsers: 260,
          reachedCount: 0,
          reachedUsers: 0,
          bookedCount: 0,
          newBookings: 0,
          attendedCount: 0,
          attendedUsers: 0,
          orderedCount: 0,
          orderUsers: 0,
          gmv: 0,
          period: "春启 04 期",
          channel: "视频号+企微",
          category: "scrm_campaign",
          createdAt: "2026-09-09 11:20",
          updatedAt: "2026-09-09 11:20",
          startedAt: null,
          executionLogs: [],
          steps: [
            { id: "ST1", name: "直播前邀约", timing: "直播前 24 小时", audience: "高意向未预约", channels: ["短信"], goal: "预约", auto: true, status: "draft", target: 260, reached: 0, converted: 0 },
            { id: "ST2", name: "预约后催到", timing: "预约后", audience: "新预约", channels: ["企微"], goal: "确认", auto: true, status: "draft", target: 0, reached: 0, converted: 0 },
            { id: "ST3", name: "开播前提醒", timing: "关联预约管理", audience: "已预约", channels: ["系统提醒"], goal: "到课", auto: true, status: "linked_booking", target: 0, reached: 0, converted: 0, linkBooking: true },
            { id: "ST4", name: "回放触达", timing: "回放后", audience: "未到课", channels: ["短信"], goal: "观看", auto: true, status: "draft", target: 0, reached: 0, converted: 0 }
          ]
        }
      ],
      aftersales: [
        {
          id: "AS202609080001",
          orderId: "YB20260907000331",
          buyer: "陈妈妈",
          phone: "138****6521",
          amount: 1990,
          type: "退货退款",
          reason: "课程内容与预期不符",
          status: "pending_merchant",
          statusLabel: "待商家处理",
          createdAt: "2026-09-08 10:12:36",
          product: "边界感训练营",
          logs: [
            { at: "2026-09-08 10:12:36", text: "系统生成售后单，进入「待商家处理」", by: "系统" }
          ]
        },
        {
          id: "AS202609070002",
          orderId: "YB20260906001122",
          buyer: "李先生",
          phone: "159****8832",
          amount: 99,
          type: "仅退款",
          reason: "重复购买",
          status: "done",
          statusLabel: "已完成",
          createdAt: "2026-09-07 15:20:00",
          product: "视频号体验课券",
          logs: []
        }
      ],
      channelOrders: [
        { id: "CO001", title: "视频号体验课券", buyer: "王女士", phone: "186****2290", amount: 1, smsStatus: "failed", smsStatusLabel: "发送失败", paidAt: "2026-09-09 11:20", claimStatus: "未领课" },
        { id: "CO002", title: "视频号体验课券", buyer: "周爸爸", phone: "150****7781", amount: 1, smsStatus: "failed", smsStatusLabel: "发送失败", paidAt: "2026-09-09 10:05", claimStatus: "未领课" },
        { id: "CO003", title: "视频号体验课券", buyer: "赵同学", phone: "137****4412", amount: 1, smsStatus: "failed", smsStatusLabel: "发送失败", paidAt: "2026-09-09 09:40", claimStatus: "未领课" },
        { id: "CO004", title: "视频号体验课券", buyer: "陈妈妈", phone: "138****6521", amount: 1, smsStatus: "success", smsStatusLabel: "发送成功", paidAt: "2026-09-08 20:10", claimStatus: "已领课" },
        { id: "CO005", title: "春启公开课直播券", buyer: "钱女士", phone: "133****9900", amount: 1, smsStatus: "pending", smsStatusLabel: "待发送", paidAt: "2026-09-09 14:00", claimStatus: "未领课" }
      ],
      reviewLogs: [],
      manualTodos: [
        {
          id: "TODO_FOLLOW_001",
          type: "follow",
          typeLabel: "建议",
          completeMode: "manual",
          kind: "suggestion",
          title: "企微流失提醒 6 人 · 建议挽回",
          owner: "赵老师",
          mine: true,
          dueLabel: "明天 12:00",
          dueSort: 5,
          sla: "ok",
          slaLabel: "正常",
          status: "pending",
          statusLabel: "建议",
          href: "wecom-churn.html?focus=today",
          roles: ["admin", "sales"]
        }
      ],
      todoDone: {},
      todoBiz: {},
      /* LiveReach booking/reminder seed kept lighter — booking page may still use LiveReach for bookings */
      bookings: [],
      reminders: [],
      sendRecords: [],
      editDraft: null
    };
  }

  /* ---------- persistence ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && data.version === VERSION) return data;
      }
    } catch (e) {}
    /* migrate / clear old session store */
    try { sessionStorage.removeItem("live_reach_store_v1"); } catch (e2) {}
    var data = seed();
    save(data);
    return data;
  }

  function save(data) {
    data.version = VERSION;
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
    /* mirror for LiveReach consumers still on session key */
    try {
      sessionStorage.setItem("live_reach_store_v1", JSON.stringify(toLiveReachShape(data)));
    } catch (e) {}
  }

  function toLiveReachShape(data) {
    return {
      lives: (data.lives || []).map(function (l) {
        return Object.assign({}, l, {
          bookedUsers: l.bookedUsers,
          liveStatus: l.liveStatus || (l.execStatus === "ended" ? "ended" : l.execStatus === "scheduled" ? "upcoming" : "draft_pending"),
          liveStatusLabel: l.liveStatusLabel || l.execStatusLabel,
          auditStatus: mapAuditForReach(l.auditStatus),
          auditStatusLabel: l.auditStatusLabel
        });
      }),
      bookings: data.bookings || [],
      reminders: data.reminders || [],
      sendRecords: data.sendRecords || [],
      sops: data.sops || [],
      editDraft: data.editDraft || null
    };
  }

  function mapAuditForReach(s) {
    if (s === "approved") return "approved";
    if (s === "pending_internal_review" || s === "pending_platform_review" || s === "pending_platform_submit") return "pending";
    if (s === "internal_rejected" || s === "platform_rejected") return "rejected";
    return s || "pending";
  }

  function reset() {
    var data = seed();
    save(data);
    return data;
  }

  /* ---------- ID resolve ---------- */
  function resolveLiveId(raw) {
    if (!raw) return "";
    var id = String(raw).trim();
    if (LIVE_ALIASES[id]) return LIVE_ALIASES[id];
    var lower = id.toLowerCase();
    if (LIVE_ALIASES[lower]) return LIVE_ALIASES[lower];
    return id;
  }

  function liveIdFromSearch(search) {
    try {
      var q = new URLSearchParams(search || location.search);
      var raw = q.get("live_id") || q.get("liveId") || q.get("live-id") || q.get("id") || "";
      return resolveLiveId(raw);
    } catch (e) {
      return "";
    }
  }

  function normalizeLiveUrl(extra) {
    extra = extra || {};
    try {
      var u = new URL(location.href);
      var liveId = resolveLiveId(extra.live_id || u.searchParams.get("live_id") || u.searchParams.get("liveId") || "");
      ["liveId", "live-id"].forEach(function (k) { u.searchParams.delete(k); });
      if (liveId) u.searchParams.set("live_id", liveId);
      Object.keys(extra).forEach(function (k) {
        if (k === "live_id") return;
        if (extra[k] == null || extra[k] === "") u.searchParams.delete(k);
        else u.searchParams.set(k, String(extra[k]));
      });
      var next = u.pathname + u.search + u.hash;
      if (next !== location.pathname + location.search + location.hash) {
        history.replaceState(null, "", next);
      }
      return liveId;
    } catch (e) {
      return resolveLiveId(extra.live_id || "");
    }
  }

  /* ---------- CRUD helpers ---------- */
  function getLive(id) {
    id = resolveLiveId(id);
    return load().lives.find(function (l) { return l.id === id; }) || null;
  }

  function saveLive(live) {
    var data = load();
    var i = data.lives.findIndex(function (l) { return l.id === live.id; });
    if (i >= 0) data.lives[i] = Object.assign({}, data.lives[i], live);
    else data.lives.push(live);
    syncLiveCompat(data.lives[i >= 0 ? i : data.lives.length - 1]);
    save(data);
  }

  function syncLiveCompat(live) {
    if (!live) return;
    var mapExec = {
      preparing: ["draft_pending", "准备中"],
      scheduled: ["upcoming", "待开播"],
      live: ["live", "直播中"],
      ended: ["ended", "已结束"],
      cancelled: ["cancelled", "已取消"]
    };
    var e = mapExec[live.execStatus] || ["upcoming", live.execStatusLabel || ""];
    live.liveStatus = e[0];
    live.liveStatusLabel = live.execStatusLabel || e[1];
  }

  function getSop(id) {
    return load().sops.find(function (s) { return s.id === id; }) || null;
  }

  function saveSop(sop) {
    var data = load();
    var i = data.sops.findIndex(function (s) { return s.id === sop.id; });
    sop.updatedAt = DEMO_NOW.replace(":00", ":00"); /* keep simple */
    if (i >= 0) data.sops[i] = Object.assign({}, data.sops[i], sop);
    else data.sops.push(sop);
    save(data);
  }

  function setSopStatus(id, status, by) {
    var sop = getSop(id);
    if (!sop) return null;
    sop.status = status;
    sop.executionLogs = sop.executionLogs || [];
    sop.executionLogs.push({ at: DEMO_NOW, action: status, by: by || "赵老师" });
    if (status === "running") sop.startedAt = DEMO_NOW;
    saveSop(sop);
    return sop;
  }

  var AUDIT_LABEL = {
    draft: "草稿",
    pending_internal_review: "待内部复核",
    internal_rejected: "内部复核驳回",
    pending_platform_submit: "待提交平台审核",
    pending_platform_review: "待平台审核",
    platform_rejected: "平台审核驳回",
    approved: "审核通过"
  };

  function setAuditStatus(liveId, status, meta) {
    var live = getLive(liveId);
    if (!live) return null;
    live.auditStatus = status;
    live.auditStatusLabel = AUDIT_LABEL[status] || status;
    meta = meta || {};
    if (status === "pending_platform_submit") {
      live.internalApprovedAt = DEMO_NOW;
      live.execStatus = "preparing";
      live.execStatusLabel = "准备中";
    }
    if (status === "pending_platform_review") {
      live.submittedPlatformAt = DEMO_NOW;
    }
    if (status === "approved") {
      live.platformApprovedAt = DEMO_NOW;
      live.execStatus = "scheduled";
      live.execStatusLabel = "待开播";
      live.shelf = true;
      live.shelvedAt = DEMO_NOW;
    }
    if (status === "internal_rejected" || status === "platform_rejected") {
      live.rejectReason = meta.reason || "";
    }
    syncLiveCompat(live);
    saveLive(live);
    var data = load();
    data.reviewLogs = data.reviewLogs || [];
    data.reviewLogs.push({
      at: DEMO_NOW,
      liveId: liveId,
      status: status,
      by: meta.by || "赵老师",
      reason: meta.reason || "",
      side: meta.side || "merchant"
    });
    save(data);
    return live;
  }

  function getAftersale(id) {
    /* alias old RO id */
    if (id === "RO20260904012") id = "AS202609080001";
    return load().aftersales.find(function (a) { return a.id === id; }) || null;
  }

  function saveAftersale(row) {
    var data = load();
    var i = data.aftersales.findIndex(function (a) { return a.id === row.id; });
    if (i >= 0) data.aftersales[i] = row;
    save(data);
  }

  function resolveAftersale(row, decision, reason) {
    if (!row) return null;
    row.status = decision === "agree" ? "returning" : "rejected";
    row.statusLabel = decision === "agree" ? "待买家退货" : "已拒绝";
    row.logs = row.logs || [];
    row.logs.push({
      at: DEMO_NOW,
      text: decision === "agree" ? "商家同意并发放退货地址" : ("商家拒绝：" + (reason || "")),
      by: "赵老师"
    });
    if (decision !== "agree") row.rejectReason = reason || "";
    saveAftersale(row);
    return row;
  }

  function getChannelOrders(filter) {
    var list = load().channelOrders || [];
    if (filter === "failed" || filter === "sms_failed") {
      return list.filter(function (o) { return o.smsStatus === "failed"; });
    }
    return list;
  }

  /** 当前待重发短信条数（业务状态），与看板期间失败事件数 smsFailureEvents 区分 */
  function smsFailedPending() {
    return getChannelOrders("failed").length;
  }

  function resendSms(ids) {
    var data = load();
    var set = {};
    (ids || []).forEach(function (id) { set[id] = true; });
    data.channelOrders.forEach(function (o) {
      if (set[o.id] && o.smsStatus === "failed") {
        o.smsStatus = "success";
        o.smsStatusLabel = "发送成功";
      }
    });
    save(data);
  }

  /* ---------- todos derived ---------- */
  function buildTodos() {
    var data = load();
    var todos = [];

    data.lives.forEach(function (l) {
      if (l.auditStatus === "pending_internal_review") {
        todos.push({
          id: "TODO_AUDIT_" + l.id,
          type: "audit",
          typeLabel: "内部复核",
          completeMode: "business",
          title: l.name + " 待内部复核",
          owner: "阮荣均",
          mine: false,
          dueLabel: l.startAt,
          dueSort: 1,
          sla: "near",
          slaLabel: "临近开播",
          status: "pending",
          statusLabel: "待处理",
          href: "live-audit-detail.html?live_id=" + l.id,
          roles: ["admin", "auditor", "content"],
          liveId: l.id
        });
      }
    });

    /* 已排期的直播促到SOP / 预约提醒：由系统调度执行，不进入待办中心。
       仅在「未配置」时生成人工待办（草稿 SOP、未配置提醒）。 */
    data.sops.forEach(function (s) {
      if (s.status !== "draft") return;
      var live = getLive(s.liveId);
      if (!live || live.auditStatus !== "approved") return;
      if (live.execStatus === "ended" || live.liveStatus === "ended") return;
      todos.push({
        id: "TODO_SOP_CFG_" + s.id,
        type: "urge",
        typeLabel: "直播促到SOP",
        completeMode: "business",
        title: (live.name || s.liveId) + " · 直播促到SOP未配置完成",
        owner: s.owner || "赵老师",
        mine: true,
        dueLabel: live.startAt || "待定",
        dueSort: 2,
        sla: "near",
        slaLabel: "临近开播",
        status: "pending",
        statusLabel: "待处理",
        href: "live-invite.html?live_id=" + s.liveId,
        roles: ["admin", "sales"],
        liveId: s.liveId,
        sopId: s.id
      });
    });

    data.lives.forEach(function (l) {
      if (l.remindStatus !== "none") return;
      if (l.auditStatus !== "approved") return;
      if (l.execStatus === "ended" || l.liveStatus === "ended") return;
      todos.push({
        id: "TODO_REMIND_CFG_" + l.id,
        type: "remind",
        typeLabel: "预约提醒",
        completeMode: "business",
        title: l.name + " · 预约提醒未配置",
        owner: "赵老师",
        mine: true,
        dueLabel: l.startAt || "待定",
        dueSort: 2,
        sla: "near",
        slaLabel: "临近开播",
        status: "pending",
        statusLabel: "待处理",
        href: "live-booking.html?live_id=" + l.id + "&tab=reminders",
        roles: ["admin", "sales"],
        liveId: l.id
      });
    });

    var failed = getChannelOrders("failed");
    if (failed.length) {
      todos.push({
        id: "TODO_SMS_001",
        type: "sms",
        typeLabel: "短信",
        completeMode: "business",
        title: "领课短信失败 " + failed.length + " 条 · 需重发",
        owner: "赵老师",
        mine: true,
        dueLabel: "今天 19:00",
        dueSort: 3,
        sla: "near",
        slaLabel: "临近超时",
        status: "pending",
        statusLabel: "待处理",
        href: "orders.html?focus=sms_failed",
        roles: ["admin", "sales"]
      });
    }

    data.aftersales.forEach(function (a) {
      if (a.status === "pending_merchant") {
        todos.push({
          id: "TODO_REFUND_" + a.id,
          type: "aftersale",
          typeLabel: "售后",
          completeMode: "business",
          title: "退款单 " + a.id + " 待处理",
          owner: "财务小陈",
          mine: false,
          dueLabel: "昨天 15:00",
          dueSort: 0,
          sla: "over",
          slaLabel: "已超时",
          status: "pending",
          statusLabel: "待处理",
          href: "aftersale-detail.html?id=" + a.id + "&todo_id=TODO_REFUND_" + a.id,
          roles: ["admin"]
        });
      }
    });

    (data.manualTodos || []).forEach(function (t) {
      if (!data.todoDone[t.id]) todos.push(t);
    });

    return todos.filter(function (t) {
      return !data.todoDone[t.id];
    });
  }

  function realtimeCounts() {
    var todos = buildTodos();
    function count(type) {
      return todos.filter(function (t) { return t.type === type; }).length;
    }
    var failed = getChannelOrders("failed").length;
    var pendingAs = load().aftersales.filter(function (a) { return a.status === "pending_merchant"; }).length;
    var pendingAudit = load().lives.filter(function (l) { return l.auditStatus === "pending_internal_review"; }).length;
    var pendingSop = load().sops.filter(function (s) { return s.status === "scheduled"; }).length;
    var sopTarget = 0;
    load().sops.forEach(function (s) {
      if (s.status === "scheduled") sopTarget += (s.targetCount || s.targetUsers || 0);
    });
    return {
      unassigned: 36,
      audit: pendingAudit,
      urgeTasks: pendingSop,
      urgePeople: sopTarget || 1284,
      aftersale: pendingAs,
      smsFailed: failed,
      todos: todos.length
    };
  }

  function markTodoDone(id) {
    var data = load();
    data.todoDone[id] = true;
    save(data);
  }

  function waitHours(fromAt) {
    try {
      var a = new Date(String(fromAt).replace(/-/g, "/"));
      var b = new Date(String(DEMO_NOW).replace(/-/g, "/"));
      var h = Math.max(0, Math.round((b - a) / 3600000));
      return h;
    } catch (e) {
      return 0;
    }
  }

  global.ProtoBiz = {
    VERSION: VERSION,
    DEMO_NOW: DEMO_NOW,
    STORE_KEY: STORE_KEY,
    AUDIT_LABEL: AUDIT_LABEL,
    load: load,
    save: save,
    reset: reset,
    resolveLiveId: resolveLiveId,
    liveIdFromSearch: liveIdFromSearch,
    normalizeLiveUrl: normalizeLiveUrl,
    getLives: function () { return load().lives; },
    getLive: getLive,
    saveLive: saveLive,
    getSops: function (liveId) {
      liveId = resolveLiveId(liveId);
      return load().sops.filter(function (s) { return !liveId || s.liveId === liveId; });
    },
    getSop: getSop,
    saveSop: saveSop,
    setSopStatus: setSopStatus,
    setAuditStatus: setAuditStatus,
    getAftersale: getAftersale,
    saveAftersale: saveAftersale,
    resolveAftersale: resolveAftersale,
    getChannelOrders: getChannelOrders,
    smsFailedPending: smsFailedPending,
    resendSms: resendSms,
    buildTodos: buildTodos,
    realtimeCounts: realtimeCounts,
    markTodoDone: markTodoDone,
    waitHours: waitHours,
    getReviewLogs: function (liveId) {
      return (load().reviewLogs || []).filter(function (r) { return !liveId || r.liveId === liveId; });
    }
  };

  /* boot once so LiveReach session mirror exists */
  load();
})(window);
