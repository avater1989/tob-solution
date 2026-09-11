/**
 * 统一模拟业务数据源（Phase 4）
 * - 规范 ID：直播 L001/L002/L003；SOP SOP001–SOP003；售后 AS…；订单 CO…
 * - localStorage 持久化；版本升级可重置
 * - 兼容旧参数：liveId / spring03 / live-spring-03 等
 */
(function (global) {
  var STORE_KEY = "proto_biz_store_v8";
  var VERSION = 8;
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
          auditStatus: "draft",
          auditStatusLabel: "草稿",
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
          submittedInternalAt: null,
          internalApprovedAt: null,
          submittedPlatformAt: null,
          platformApprovedAt: null,
          shelvedAt: null,
          liveStatus: "draft",
          liveStatusLabel: "草稿"
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
            { id: "ST4", name: "开播中未到场召回", timing: "开播后 10 分钟", audience: "已预约未进入", channels: ["企微"], goal: "到课", auto: true, status: "pending", target: 200, reached: 0, converted: 0 }
          ]
        },
        {
          id: "SOP002",
          sopName: "早间家长课催到召回SOP",
          name: "早间家长课催到召回SOP",
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
            { id: "ST1", name: "预约后催到", timing: "预约成功后 2 小时", audience: "新预约用户", channels: ["企微"], goal: "确认到课意向", auto: true, status: "completed", target: 152, reached: 148, converted: 120 },
            { id: "ST2", name: "开播前提醒", timing: "关联预约管理", audience: "已预约", channels: ["系统提醒"], goal: "到课", auto: true, status: "completed", target: 152, reached: 140, converted: 68, linkBooking: true },
            { id: "ST3", name: "开播中未到场召回", timing: "开播后 10 分钟", audience: "未进入", channels: ["企微"], goal: "到课", auto: true, status: "completed", target: 80, reached: 72, converted: 18 }
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
            { id: "ST4", name: "开播中未到场召回", timing: "开播后 10 分钟", audience: "已预约未进入", channels: ["企微"], goal: "到课", auto: true, status: "draft", target: 0, reached: 0, converted: 0 }
          ]
        },
        {
          id: "SOP004",
          sopName: "春启03开播中召回SOP",
          name: "春启03开播中召回SOP",
          liveId: "L001",
          owner: "赵老师",
          status: "failed",
          failReason: "企微群发接口超时",
          failStep: "开播中未到场召回",
          failChannel: "企微",
          lastExecAt: "2026-09-09 15:40",
          retryCount: 1,
          targetAudience: "已预约未进入",
          excludeRules: ["已购买"],
          targetCount: 200,
          targetUsers: 200,
          reachedCount: 42,
          reachedUsers: 42,
          bookedCount: 0,
          newBookings: 0,
          attendedCount: 0,
          attendedUsers: 0,
          orderedCount: 0,
          orderUsers: 0,
          gmv: 0,
          period: "春启 03 期",
          channel: "企微",
          category: "scrm_campaign",
          createdAt: "2026-09-08 16:00",
          updatedAt: "2026-09-09 15:40",
          startedAt: "2026-09-09 15:30",
          executionLogs: [
            { at: "2026-09-09 15:30", action: "启动", by: "系统" },
            { at: "2026-09-09 15:40", action: "失败", by: "系统", detail: "企微群发接口超时" }
          ],
          steps: [
            { id: "ST1", name: "开播中未到场召回", timing: "开播后 10 分钟", audience: "已预约未进入", channels: ["企微"], goal: "到课", auto: true, status: "failed", target: 200, reached: 42, converted: 0 }
          ]
        }
      ],
      leads: [
        { id: "LD001", name: "王女士", phone: "186****2290", source: "视频号", enteredAt: "2026-09-09 10:12", intent: "高", owner: "", ownerId: "", period: "春启 03 期" },
        { id: "LD002", name: "周爸爸", phone: "150****7781", source: "视频号", enteredAt: "2026-09-09 09:40", intent: "中", owner: "", ownerId: "", period: "春启 03 期" },
        { id: "LD003", name: "赵同学", phone: "137****4412", source: "直播预约", enteredAt: "2026-09-09 08:55", intent: "高", owner: "", ownerId: "", period: "春启 03 期" },
        { id: "LD004", name: "钱女士", phone: "133****9900", source: "视频号", enteredAt: "2026-09-08 21:10", intent: "低", owner: "", ownerId: "", period: "春启 03 期" },
        { id: "LD005", name: "孙妈妈", phone: "139****2201", source: "企微裂变", enteredAt: "2026-09-08 19:30", intent: "中", owner: "", ownerId: "", period: "春启 03 期" },
        { id: "LD006", name: "李先生", phone: "158****6610", source: "视频号", enteredAt: "2026-09-08 18:05", intent: "高", owner: "赵老师", ownerId: "U001", period: "春启 03 期" }
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
          deadlineAt: "2026-09-15 10:12",
          waitFor: "商家处理",
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
        },
        {
          id: "RF20260909001",
          orderId: "YB202609090012",
          buyer: "学员0017",
          userId: "U005",
          phone: "137****0017",
          amount: 9.9,
          type: "仅退款",
          reason: "课程不适合",
          status: "done",
          statusLabel: "退款处理完成",
          createdAt: "2026-09-09 13:50:00",
          product: "引流体验课",
          rightsRecycled: true,
          rightsStatus: "已退款回收",
          courseAccess: "不可访问",
          logs: [
            { at: "2026-09-09 11:20:00", text: "买家支付成功，订单 YB202609090012 已支付", by: "系统" },
            { at: "2026-09-09 11:21:00", text: "系统开通课程权益「引流体验课」", by: "系统" },
            { at: "2026-09-09 13:50:00", text: "买家申请仅退款：课程不适合", by: "买家" },
            { at: "2026-09-09 14:10:00", text: "商家同意退款，通联支付原路退回 ¥9.90", by: "客服" },
            { at: "2026-09-09 14:28:00", text: "订单已退款 · 退款处理完成", by: "系统" },
            { at: "2026-09-09 14:28:30", text: "课程权益已回收，用户当前不可访问课程", by: "系统" }
          ]
        }
      ],
      channelOrders: [
        { id: "CO001", title: "视频号体验课券", buyer: "王女士", phone: "186****2290", amount: 1, smsStatus: "failed", smsStatusLabel: "发送失败", msgType: "领课短信", channel: "短信", content: "您已购买体验课，点击领取课程…", failReason: "运营商网关超时", retryCount: 1, lastSendAt: "2026-09-09 11:21", paidAt: "2026-09-09 11:20", claimStatus: "未领课", orderId: "YB20260909001" },
        { id: "CO002", title: "视频号体验课券", buyer: "周爸爸", phone: "150****7781", amount: 1, smsStatus: "failed", smsStatusLabel: "发送失败", msgType: "领课短信", channel: "短信", content: "您已购买体验课，点击领取课程…", failReason: "空号/停机", retryCount: 2, lastSendAt: "2026-09-09 10:08", paidAt: "2026-09-09 10:05", claimStatus: "未领课", orderId: "YB20260909002" },
        { id: "CO003", title: "视频号体验课券", buyer: "赵同学", phone: "137****4412", amount: 1, smsStatus: "failed", smsStatusLabel: "发送失败", msgType: "领课短信", channel: "短信", content: "您已购买体验课，点击领取课程…", failReason: "频控拦截", retryCount: 0, lastSendAt: "2026-09-09 09:41", paidAt: "2026-09-09 09:40", claimStatus: "未领课", orderId: "YB20260909003" },
        { id: "CO004", title: "视频号体验课券", buyer: "陈妈妈", phone: "138****6521", amount: 1, smsStatus: "success", smsStatusLabel: "发送成功", msgType: "领课短信", channel: "短信", content: "您已购买体验课，点击领取课程…", failReason: "", retryCount: 0, lastSendAt: "2026-09-08 20:10", paidAt: "2026-09-08 20:10", claimStatus: "已领课", orderId: "YB20260908011" },
        { id: "CO005", title: "春启公开课直播券", buyer: "钱女士", phone: "133****9900", amount: 1, smsStatus: "pending", smsStatusLabel: "待发送", msgType: "领课短信", channel: "短信", content: "直播券领取提醒…", failReason: "", retryCount: 0, lastSendAt: "", paidAt: "2026-09-09 14:00", claimStatus: "未领课", orderId: "YB20260909014" }
      ],
      owners: [
        { id: "U001", name: "赵老师", role: "销售顾问" },
        { id: "U002", name: "王助教", role: "助教" },
        { id: "U003", name: "周销售", role: "销售顾问" },
        { id: "U004", name: "阮荣均", role: "内容运营" }
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
          reason: "近 7 日未互动且曾高意向",
          owner: "赵老师",
          mine: true,
          dueLabel: "明天 12:00",
          dueSort: 5,
          urgency: "ok",
          urgencyLabel: "正常",
          sla: "ok",
          slaLabel: "正常",
          status: "pending",
          statusLabel: "待处理",
          action: "view",
          actionLabel: "去查看",
          href: "wecom-churn.html?focus=today&from=dashboard",
          roles: ["admin", "sales"]
        },
        {
          id: "TODO_SUGGEST_CONTENT",
          type: "content",
          typeLabel: "建议",
          completeMode: "manual",
          kind: "suggestion",
          title: "系列课《边界感训练营》草稿未上架",
          reason: "内容检查建议 · 草稿超过 3 天",
          owner: "内容小周",
          mine: false,
          dueLabel: "周五 18:00",
          dueSort: 6,
          urgency: "ok",
          urgencyLabel: "正常",
          sla: "ok",
          slaLabel: "正常",
          status: "pending",
          statusLabel: "待处理",
          action: "view",
          actionLabel: "去查看",
          href: "content-series-edit.html?id=boundary&from=dashboard",
          roles: ["admin", "content"]
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
    if (s === "pending_platform_review" || s === "pending_internal_review" || s === "pending_platform_submit") return "pending";
    if (s === "platform_rejected" || s === "internal_rejected") return "rejected";
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
    if (status === "scheduled" || status === "running") sop.failReason = "";
    saveSop(sop);
    return sop;
  }

  /** 重试异常 SOP；opts.forceFail 可模拟失败 */
  function retrySop(id, by, opts) {
    opts = opts || {};
    var sop = getSop(id);
    if (!sop) return { ok: false, error: "missing" };
    sop.retryCount = (sop.retryCount || 0) + 1;
    sop.lastRetryAt = DEMO_NOW;
    sop.lastExecAt = DEMO_NOW;
    sop.executionLogs = sop.executionLogs || [];
    if (opts.forceFail) {
      sop.status = "failed";
      sop.failReason = opts.failReason || "重试失败：通道繁忙，请稍后再试";
      sop.executionLogs.push({ at: DEMO_NOW, action: "重试失败", by: by || "赵老师", detail: sop.failReason });
      saveSop(sop);
      return { ok: false, sop: sop };
    }
    sop.status = "scheduled";
    sop.failReason = "";
    sop.executionLogs.push({ at: DEMO_NOW, action: "重试成功并恢复排期", by: by || "赵老师" });
    if (sop.steps && sop.steps.length) {
      sop.steps.forEach(function (st) {
        if (st.status === "failed") st.status = "pending";
      });
    }
    saveSop(sop);
    return { ok: true, sop: sop };
  }

  var AUDIT_LABEL = {
    draft: "草稿",
    pending_platform_review: "待平台审核",
    platform_rejected: "平台审核驳回",
    approved: "审核通过",
    /* legacy aliases kept for old logs / migration */
    pending_internal_review: "草稿",
    internal_rejected: "平台审核驳回",
    pending_platform_submit: "草稿"
  };

  function setAuditStatus(liveId, status, meta) {
    var live = getLive(liveId);
    if (!live) return null;
    /* collapse legacy internal statuses */
    if (status === "pending_internal_review" || status === "pending_platform_submit") status = "draft";
    if (status === "internal_rejected") status = "platform_rejected";
    live.auditStatus = status;
    live.auditStatusLabel = AUDIT_LABEL[status] || status;
    meta = meta || {};
    if (status === "draft") {
      live.platformReviewStatus = "not_submitted";
      live.execStatus = "preparing";
      live.execStatusLabel = "准备中";
    }
    if (status === "pending_platform_review") {
      live.platformReviewStatus = "pending";
      live.submittedPlatformAt = DEMO_NOW;
    }
    if (status === "approved") {
      live.platformReviewStatus = "passed";
      live.platformApprovedAt = DEMO_NOW;
      live.execStatus = "scheduled";
      live.execStatusLabel = "待开播";
      live.shelf = true;
      live.shelfStatus = "published";
      live.shelvedAt = DEMO_NOW;
    }
    if (status === "platform_rejected") {
      live.platformReviewStatus = "rejected";
      live.rejectReason = meta.reason || "";
    }
    syncLiveCompat(live);
    saveLive(live);
    /* keep LiveOps overlay in sync when ops platform acts */
    try {
      var ovKey = "live_ops_overlay_v2";
      var ov = JSON.parse(localStorage.getItem(ovKey) || '{"version":2,"byId":{}}');
      ov.byId = ov.byId || {};
      ov.byId[liveId] = Object.assign({}, ov.byId[liveId] || {}, {
        platformReviewStatus: live.platformReviewStatus,
        shelfStatus: live.shelf ? "published" : (live.shelfStatus || "unpublished")
      });
      localStorage.setItem(ovKey, JSON.stringify(ov));
    } catch (e) {}
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

  var RF20260909001_SEED = {
    id: "RF20260909001",
    orderId: "YB202609090012",
    buyer: "学员0017",
    userId: "U005",
    phone: "137****0017",
    amount: 9.9,
    type: "仅退款",
    reason: "课程不适合",
    status: "done",
    statusLabel: "退款处理完成",
    createdAt: "2026-09-09 13:50:00",
    product: "引流体验课",
    rightsRecycled: true,
    rightsStatus: "已退款回收",
    courseAccess: "不可访问",
    logs: [
      { at: "2026-09-09 11:20:00", text: "买家支付成功，订单 YB202609090012 已支付", by: "系统" },
      { at: "2026-09-09 11:21:00", text: "系统开通课程权益「引流体验课」", by: "系统" },
      { at: "2026-09-09 13:50:00", text: "买家申请仅退款：课程不适合", by: "买家" },
      { at: "2026-09-09 14:10:00", text: "商家同意退款，通联支付原路退回 ¥9.90", by: "客服" },
      { at: "2026-09-09 14:28:00", text: "订单已退款 · 退款处理完成", by: "系统" },
      { at: "2026-09-09 14:28:30", text: "课程权益已回收，用户当前不可访问课程", by: "系统" }
    ]
  };

  function getAftersale(id) {
    /* alias old RO id */
    if (id === "RO20260904012") id = "AS202609080001";
    var data = load();
    var row = (data.aftersales || []).find(function (a) { return a.id === id; }) || null;
    /* Upsert missing RF seed without bumping VERSION / wiping other local state */
    if (!row && id === "RF20260909001") {
      row = deepClone(RF20260909001_SEED);
      data.aftersales = data.aftersales || [];
      data.aftersales.push(row);
      save(data);
    }
    return row;
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

  function resendSms(ids, opts) {
    opts = opts || {};
    var data = load();
    var set = {};
    (ids || []).forEach(function (id) { set[id] = true; });
    var results = [];
    data.channelOrders.forEach(function (o) {
      if (!set[o.id] || o.smsStatus !== "failed") return;
      o.retryCount = (o.retryCount || 0) + 1;
      o.lastSendAt = DEMO_NOW;
      if (opts.forceFail || (opts.simulateFailId && opts.simulateFailId === o.id)) {
        o.smsStatus = "failed";
        o.smsStatusLabel = "发送失败";
        o.failReason = opts.failReason || "通道繁忙，请稍后重试";
        results.push({ id: o.id, ok: false, reason: o.failReason });
      } else {
        o.smsStatus = "success";
        o.smsStatusLabel = "发送成功";
        o.failReason = "";
        results.push({ id: o.id, ok: true });
      }
      if (opts.channel) o.channel = opts.channel;
    });
    save(data);
    return results;
  }

  function getLeads(filter) {
    var list = load().leads || [];
    if (filter === "unassigned") return list.filter(function (l) { return !l.owner; });
    return list;
  }

  function getLead(id) {
    return (load().leads || []).find(function (l) { return l.id === id; }) || null;
  }

  function assignLead(leadId, ownerName, opts) {
    opts = opts || {};
    var data = load();
    var lead = (data.leads || []).find(function (l) { return l.id === leadId; });
    if (!lead) return { ok: false, error: "not_found" };
    if (lead.owner && !opts.force) {
      return { ok: false, error: "taken", owner: lead.owner };
    }
    lead.owner = ownerName;
    lead.ownerId = opts.ownerId || "";
    lead.assignedAt = DEMO_NOW;
    if (opts.createFollowTodo !== false) {
      data.manualTodos = data.manualTodos || [];
      var fid = "TODO_FOLLOW_LEAD_" + lead.id;
      if (!data.manualTodos.some(function (t) { return t.id === fid; }) && !data.todoDone[fid]) {
        data.manualTodos.push({
          id: fid,
          type: "follow",
          typeLabel: "建议",
          completeMode: "manual",
          kind: "suggestion",
          title: "首次跟进 · " + lead.name,
          reason: "分配后建议 24 小时内完成首次触达",
          owner: ownerName,
          mine: ownerName === "赵老师",
          dueLabel: "今天 20:00",
          dueSort: 4,
          urgency: "near",
          urgencyLabel: "即将超时",
          sla: "near",
          slaLabel: "即将超时",
          status: "pending",
          statusLabel: "待处理",
          action: "view",
          actionLabel: "去查看",
          href: "leads.html?focus=" + encodeURIComponent(lead.id) + "&from=dashboard",
          roles: ["admin", "sales"]
        });
      }
    }
    save(data);
    return { ok: true, lead: lead };
  }

  function isAbnormalSop(s) {
    if (!s) return false;
    return s.status === "failed" || s.status === "paused" || s.status === "empty_audience";
  }

  function sopActionMeta(s) {
    if (s.status === "failed") {
      return {
        action: "retry",
        actionLabel: "立即重试",
        reason: s.failReason || "执行失败",
        statusLabel: "执行失败"
      };
    }
    if (s.status === "paused") {
      return { action: "resume", actionLabel: "恢复执行", reason: "SOP 已暂停", statusLabel: "已暂停" };
    }
    if (s.status === "empty_audience") {
      return { action: "audience", actionLabel: "配置目标人群", reason: "目标人群为空", statusLabel: "待处理" };
    }
    return { action: "retry", actionLabel: "立即重试", reason: s.failReason || "执行异常", statusLabel: "执行失败" };
  }

  function liveIncomplete(l) {
    if (!l) return true;
    var name = (l.name || "").trim();
    var start = (l.startAt || "").trim();
    return !name || !start || name.indexOf("草稿") >= 0;
  }

  /* ---------- todos derived ---------- */
  function buildTodos() {
    var data = load();
    var todos = [];

    var unassigned = (data.leads || []).filter(function (l) { return !l.owner; });
    if (unassigned.length) {
      var oldest = unassigned.slice().sort(function (a, b) {
        return String(a.enteredAt || "").localeCompare(String(b.enteredAt || ""));
      })[0];
      var waitH = waitHours(oldest && oldest.enteredAt);
      var srcMap = {};
      unassigned.forEach(function (l) { srcMap[l.source || "其他"] = (srcMap[l.source || "其他"] || 0) + 1; });
      var topSrc = Object.keys(srcMap).sort(function (a, b) { return srcMap[b] - srcMap[a]; })[0] || "视频号";
      todos.push({
        id: "TODO_LEAD_UNASSIGNED",
        type: "lead",
        typeLabel: "线索",
        filterKey: "lead",
        kind: "system",
        completeMode: "business",
        title: "有" + unassigned.length + "条未分配线索",
        reason: "最长等待 " + waitH + " 小时 · 主要来源 " + topSrc,
        owner: "待分配",
        mine: true,
        dueLabel: "今天 18:00",
        dueSort: 1,
        urgency: waitH >= 6 ? "overdue" : "near",
        urgencyLabel: waitH >= 6 ? "已超时" : "即将超时",
        sla: waitH >= 6 ? "over" : "near",
        slaLabel: waitH >= 6 ? "已超时" : "即将超时",
        status: "pending",
        statusLabel: "待处理",
        action: "goto_leads",
        actionLabel: "去分配",
        actionSales: "claim",
        actionLabelSales: "立即认领",
        href: "leads.html?focus=unassigned&from=dashboard&todo_id=TODO_LEAD_UNASSIGNED",
        roles: ["admin", "sales"],
        meta: { leadIds: unassigned.map(function (l) { return l.id; }), count: unassigned.length, topSource: topSrc, waitHours: waitH }
      });
    }

    data.lives.forEach(function (l) {
      var needsPlatform =
        l.auditStatus === "draft" ||
        l.auditStatus === "pending_platform_submit" ||
        l.auditStatus === "pending_internal_review";
      var needsFix = l.auditStatus === "platform_rejected" || l.auditStatus === "internal_rejected";
      var waitingPlatform = l.auditStatus === "pending_platform_review";
      if (waitingPlatform) return;
      if (!needsPlatform && !needsFix) return;
      if (l.execStatus === "ended" || l.liveStatus === "ended" || l.execStatus === "cancelled") return;
      var incomplete = needsPlatform && liveIncomplete(l);
      var action = needsFix ? "fix_reject" : (incomplete ? "complete_draft" : "submit_platform");
      var actionLabel = needsFix ? "查看原因并修改" : (incomplete ? "继续完善" : "提交平台审核");
      var platformHref = needsFix
        ? ("live-edit.html?live_id=" + l.id + "&from=platform_rejected&focus=cover&todo_id=TODO_PLATFORM_" + l.id + "&return_url=" + encodeURIComponent("dashboard.html?restore=1"))
        : ("live-edit.html?live_id=" + l.id + "&from=dashboard&todo_id=TODO_PLATFORM_" + l.id + "&focus=" + (incomplete ? "title" : "submit") + "&return_url=" + encodeURIComponent("dashboard.html?restore=1"));
      var viewHref = "live-edit.html?live_id=" + l.id + "&mode=view&from=dashboard&todo_id=TODO_PLATFORM_" + l.id + "&return_url=" + encodeURIComponent("dashboard.html?restore=1");
      todos.push({
        id: "TODO_PLATFORM_" + l.id,
        type: "audit",
        typeLabel: "直播审核",
        filterKey: "audit",
        kind: "system",
        completeMode: "business",
        title: needsFix
          ? (l.name + " · 平台驳回待修改")
          : (l.name + (incomplete ? " · 草稿信息不完整" : " · 待提交平台审核")),
        reason: needsFix
          ? (l.rejectReason || "封面不符合平台规范，请更换后重新提交")
          : (incomplete ? "缺少必填信息，需继续完善" : "草稿已满足提交条件，待提交平台审核"),
        owner: l.owner || l.creator || "阮荣均",
        mine: true,
        dueLabel: l.startAt,
        dueSort: 1,
        urgency: "near",
        urgencyLabel: "即将超时",
        sla: "near",
        slaLabel: "即将超时",
        status: "pending",
        statusLabel: "待处理",
        action: action,
        actionLabel: actionLabel,
        actionAuditor: needsFix ? "view_reject" : "remind_owner",
        actionLabelAuditor: needsFix ? "查看驳回原因" : "提醒负责人",
        href: platformHref,
        hrefAuditor: viewHref,
        roles: ["admin", "content", "auditor"],
        liveId: l.id,
        meta: { incomplete: incomplete, rejected: needsFix, liveName: l.name, startAt: l.startAt, owner: l.owner || l.creator || "阮荣均" }
      });
    });

    /* 正常「直播中」不进待办；仅异常时生成「直播异常」 */
    data.lives.forEach(function (l) {
      var living = l.execStatus === "live" || l.liveStatus === "live" || l.runtimeStatus === "living";
      var anomalies = l.anomalies || [];
      if (!living || !anomalies.length) return;
      todos.push({
        id: "TODO_LIVE_EX_" + l.id,
        type: "live_exception",
        typeLabel: "直播异常",
        filterKey: "live_exception",
        kind: "system",
        completeMode: "business",
        title: l.name + " · " + anomalies[0],
        reason: anomalies.join("、"),
        owner: l.owner || l.teacher || "赵老师",
        mine: true,
        dueLabel: "进行中",
        dueSort: 0,
        urgency: "overdue",
        urgencyLabel: "已超时",
        sla: "over",
        slaLabel: "已超时",
        status: "pending",
        statusLabel: "待处理",
        action: "control",
        actionLabel: "进入中控台处理",
        href: "live-control.html?live_id=" + l.id + "&from=dashboard&todo_id=TODO_LIVE_EX_" + l.id + "&return_url=" + encodeURIComponent("dashboard.html?restore=1"),
        roles: ["admin", "content", "sales"],
        liveId: l.id,
        meta: { anomalies: anomalies, teacher: l.teacher || l.owner || "赵老师" }
      });
    });

    data.sops.forEach(function (s) {
      if (!isAbnormalSop(s)) return;
      var live = getLive(s.liveId);
      if (!live) return;
      if (live.execStatus === "ended" || live.liveStatus === "ended") return;
      var am = sopActionMeta(s);
      todos.push({
        id: "TODO_SOP_" + s.id,
        type: "urge",
        typeLabel: "直播促到SOP异常",
        filterKey: "urge",
        kind: "system",
        completeMode: "business",
        title: (live.name || s.liveId) + " · " + (s.sopName || s.name || "SOP"),
        reason: am.reason,
        owner: s.owner || "赵老师",
        mine: s.owner === "赵老师" || !s.owner,
        dueLabel: live.startAt || "待定",
        dueSort: 2,
        urgency: s.status === "failed" ? "overdue" : "near",
        urgencyLabel: s.status === "failed" ? "已超时" : "即将超时",
        sla: s.status === "failed" ? "over" : "near",
        slaLabel: s.status === "failed" ? "已超时" : "即将超时",
        status: s.status === "failed" ? "failed" : "pending",
        statusLabel: am.statusLabel || "待处理",
        action: am.action,
        actionLabel: am.actionLabel,
        href: "live-invite.html?live_id=" + s.liveId + "&sop_id=" + s.id + "&focus=pending&from=dashboard&todo_id=TODO_SOP_" + s.id + "&return_url=" + encodeURIComponent("dashboard.html?restore=1"),
        roles: ["admin", "sales"],
        liveId: s.liveId,
        sopId: s.id,
        meta: {
          failStep: s.failStep || ((s.steps || []).filter(function (x) { return x.status === "failed"; })[0] || {}).name || "—",
          failChannel: s.failChannel || s.channel || "企微",
          lastExecAt: s.lastExecAt || s.updatedAt || "—",
          failReason: s.failReason || am.reason,
          retryCount: s.retryCount || 0
        }
      });
    });

    var failed = getChannelOrders("failed");
    /* 领课短信失败暂不进入待办中心（逻辑较复杂，后续再接） */

    data.aftersales.forEach(function (a) {
      if (a.status !== "pending_merchant") return;
      var remain = a.deadlineAt ? ("截止 " + a.deadlineAt) : "剩余处理时间不足";
      todos.push({
        id: "TODO_REFUND_" + a.id,
        type: "aftersale",
        typeLabel: "售后",
        filterKey: "aftersale",
        kind: "system",
        completeMode: "business",
        title: a.type + " · " + a.id,
        reason: "订单 " + a.orderId + " · ¥" + Number(a.amount || 0).toFixed(0) + " · " + (a.reason || "") + " · 等待" + (a.waitFor || "商家处理") + " · " + remain,
        owner: "财务小陈",
        mine: false,
        dueLabel: a.deadlineAt || "昨天 15:00",
        dueSort: 0,
        urgency: "overdue",
        urgencyLabel: "已超时",
        sla: "over",
        slaLabel: "已超时",
        status: "pending",
        statusLabel: "待处理",
        action: "aftersale",
        actionLabel: "处理售后",
        href: "aftersale-detail.html?id=" + a.id + "&todo_id=TODO_REFUND_" + a.id + "&from=dashboard&return_url=" + encodeURIComponent("dashboard.html?restore=1"),
        roles: ["admin"],
        aftersaleId: a.id,
        meta: {
          aftersaleId: a.id,
          orderId: a.orderId,
          type: a.type,
          amount: a.amount,
          reason: a.reason,
          waitFor: a.waitFor || "商家处理",
          deadlineAt: a.deadlineAt
        }
      });
    });

    (data.manualTodos || []).forEach(function (t) {
      if (data.todoDone[t.id]) return;
      var copy = Object.assign({}, t);
      if (!copy.filterKey) copy.filterKey = copy.type;
      if (!copy.kind) copy.kind = copy.completeMode === "manual" ? "suggestion" : "system";
      if (!copy.urgencyLabel) {
        copy.urgencyLabel = copy.urgency === "overdue" || copy.sla === "over" ? "已超时"
          : (copy.urgency === "near" || copy.sla === "near" ? "即将超时" : "正常");
      }
      if (!copy.actionLabel) copy.actionLabel = copy.kind === "suggestion" ? "去查看" : "去查看";
      if (!copy.action) copy.action = "view";
      if (!copy.reason) copy.reason = "建议事项";
      todos.push(copy);
    });

    return todos.filter(function (t) {
      return !data.todoDone[t.id];
    });
  }

  function realtimeCounts() {
    var data = load();
    var todos = buildTodos();
    var countBy = function (key) {
      return todos.filter(function (t) {
        return (t.filterKey === key || t.type === key) && t.kind !== "suggestion";
      }).length;
    };
    var unassigned = (data.leads || []).filter(function (l) { return !l.owner; });
    var oldest = unassigned.slice().sort(function (a, b) {
      return String(a.enteredAt || "").localeCompare(String(b.enteredAt || ""));
    })[0];
    var srcMap = {};
    unassigned.forEach(function (l) { srcMap[l.source || "其他"] = (srcMap[l.source || "其他"] || 0) + 1; });
    var topSrc = Object.keys(srcMap).sort(function (a, b) { return srcMap[b] - srcMap[a]; })[0] || "视频号";
    var urgeN = countBy("urge");
    var auditN = countBy("audit");
    var afterN = countBy("aftersale");
    var leadN = countBy("lead");
    var failed = getChannelOrders("failed");

    return {
      unassigned: leadN,
      unassignedHint: unassigned.length
        ? ("最长等待 " + waitHours(oldest && oldest.enteredAt) + " 小时 · " + topSrc)
        : "暂无未分配线索",
      audit: auditN,
      auditHint: auditN > 0 ? ("含 " + auditN + " 场待提交/待改") : "暂无待提交场次",
      urgeTasks: urgeN,
      urgeHint: urgeN ? ("异常 " + urgeN + " 条") : "暂无SOP异常",
      urgePeople: 0,
      aftersale: afterN,
      aftersaleHint: afterN
        ? ("剩余处理至 " + ((data.aftersales.filter(function (a) { return a.status === "pending_merchant"; })[0] || {}).deadlineAt || "—"))
        : "暂无待处理售后",
      smsFailed: failed.length,
      smsHint: failed.length ? ("最近失败：" + (failed[0].failReason || "发送失败")) : "暂无发送失败",
      todos: todos.filter(function (t) { return t.kind !== "suggestion"; }).length
    };
  }

  function markTodoDone(id) {
    var data = load();
    data.todoDone[id] = true;
    save(data);
  }

  function ignoreSuggestion(id) {
    markTodoDone(id);
  }

  function snoozeSuggestion(id) {
    markTodoDone(id);
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
    retrySop: retrySop,
    isAbnormalSop: isAbnormalSop,
    setAuditStatus: setAuditStatus,
    getAftersale: getAftersale,
    saveAftersale: saveAftersale,
    resolveAftersale: resolveAftersale,
    getChannelOrders: getChannelOrders,
    smsFailedPending: smsFailedPending,
    resendSms: resendSms,
    getLeads: getLeads,
    getLead: getLead,
    assignLead: assignLead,
    getOwners: function () { return load().owners || []; },
    buildTodos: buildTodos,
    realtimeCounts: realtimeCounts,
    markTodoDone: markTodoDone,
    ignoreSuggestion: ignoreSuggestion,
    snoozeSuggestion: snoozeSuggestion,
    waitHours: waitHours,
    getReviewLogs: function (liveId) {
      return (load().reviewLogs || []).filter(function (r) { return !liveId || r.liveId === liveId; });
    }
  };

  /* boot once so LiveReach session mirror exists */
  load();
})(window);
