/**
 * 直播触达统一数据层（系统提醒 system_reminder + 私域促到 scrm_campaign）
 * 使用 sessionStorage 在页面间共享原型状态。
 */
(function (global) {
  var STORE_KEY = "live_reach_store_v1";

  function deepClone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function seed() {
    return {
      lives: [
        {
          id: "L001",
          name: "春启 03 期家长公开课",
          liveStatus: "upcoming",
          liveStatusLabel: "待开播",
          auditStatus: "approved",
          auditStatusLabel: "已通过",
          startAt: "2026-09-09 20:00",
          endAt: "2026-09-09 22:00",
          shelf: true,
          bookedUsers: 234,
          subscribedUsers: 198,
          reachedUsers: 220,
          messageCount: 1280,
          attendedUsers: 146,
          orderedUsers: 68,
          reminderEnabled: true,
          preRemindOffset: "1h",
          remindOnStart: true,
          remindReplay: true,
          createdAt: "2026-09-05 10:20",
          submittedAt: "2026-09-05 14:30",
          approvedAt: "2026-09-05 16:10",
          shelvedAt: "2026-09-05 16:20"
        },
        {
          id: "L002",
          name: "边界感训练营 · 体验课",
          liveStatus: "ended",
          liveStatusLabel: "已结束",
          auditStatus: "approved",
          auditStatusLabel: "已通过",
          startAt: "2026-09-08 14:30",
          endAt: "2026-09-08 16:00",
          shelf: true,
          bookedUsers: 186,
          subscribedUsers: 160,
          reachedUsers: 178,
          messageCount: 920,
          attendedUsers: 112,
          orderedUsers: 41,
          reminderEnabled: true,
          preRemindOffset: "1h",
          remindOnStart: true,
          remindReplay: true,
          createdAt: "2026-09-03 09:00",
          submittedAt: "2026-09-03 11:00",
          approvedAt: "2026-09-03 15:00",
          shelvedAt: "2026-09-03 15:10",
          replayReadyAt: "2026-09-08 16:20"
        },
        {
          id: "L003",
          name: "明日直播 · 春启 04 招生",
          liveStatus: "draft_pending",
          liveStatusLabel: "待审核",
          auditStatus: "pending",
          auditStatusLabel: "审核中",
          startAt: "2026-09-10 19:00",
          endAt: "2026-09-10 21:00",
          shelf: false,
          bookedUsers: 0,
          subscribedUsers: 0,
          reachedUsers: 0,
          messageCount: 0,
          attendedUsers: 0,
          orderedUsers: 0,
          reminderEnabled: true,
          preRemindOffset: "1h",
          remindOnStart: true,
          remindReplay: true,
          createdAt: "2026-09-09 09:30",
          submittedAt: "2026-09-09 10:05",
          approvedAt: null,
          shelvedAt: null
        }
      ],
      bookings: [
        {
          id: "B001", liveId: "L001", name: "陈妈妈", phone: "138****6521",
          channel: "直播预告页", bookedAt: "2026-09-07 21:18",
          subscribed: true, status: "booked", watched: false,
          firstEnterAt: "", watchMinutes: 0, ordered: false, orderAmount: 0,
          touchLogs: [
            { at: "2026-09-09 19:00", type: "开播前提醒", channel: "短信", result: "送达" }
          ]
        },
        {
          id: "B002", liveId: "L001", name: "李先生", phone: "159****8832",
          channel: "课程详情页", bookedAt: "2026-09-06 14:02",
          subscribed: true, status: "watched", watched: true,
          firstEnterAt: "2026-09-09 20:05", watchMinutes: 42, ordered: false, orderAmount: 0,
          touchLogs: [
            { at: "2026-09-09 19:00", type: "开播前提醒", channel: "短信", result: "送达" },
            { at: "2026-09-09 20:00", type: "开播提醒", channel: "站内信", result: "已点击" }
          ]
        },
        {
          id: "B003", liveId: "L001", name: "王女士", phone: "186****2290",
          channel: "助教分享", bookedAt: "2026-09-08 10:40",
          subscribed: true, status: "ordered", watched: true,
          firstEnterAt: "2026-09-09 20:01", watchMinutes: 88, ordered: true, orderAmount: 1990,
          touchLogs: [
            { at: "2026-09-09 19:00", type: "开播前提醒", channel: "企微", result: "送达" }
          ]
        },
        {
          id: "B004", liveId: "L001", name: "赵同学", phone: "137****4412",
          channel: "视频号领课", bookedAt: "2026-09-08 16:22",
          subscribed: false, status: "cancelled", watched: false,
          firstEnterAt: "", watchMinutes: 0, ordered: false, orderAmount: 0,
          touchLogs: []
        },
        {
          id: "B005", liveId: "L001", name: "周爸爸", phone: "150****7781",
          channel: "直播预告页", bookedAt: "2026-09-07 09:15",
          subscribed: true, status: "fail", watched: false,
          firstEnterAt: "", watchMinutes: 0, ordered: false, orderAmount: 0,
          touchLogs: [
            { at: "2026-09-09 19:00", type: "开播前提醒", channel: "短信", result: "失败：空号" }
          ]
        },
        {
          id: "B006", liveId: "L002", name: "孙妈妈", phone: "133****9901",
          channel: "直播预告页", bookedAt: "2026-09-06 20:11",
          subscribed: true, status: "watched", watched: true,
          firstEnterAt: "2026-09-08 14:35", watchMinutes: 55, ordered: true, orderAmount: 990,
          touchLogs: [
            { at: "2026-09-08 13:30", type: "开播前提醒", channel: "短信", result: "送达" },
            { at: "2026-09-08 16:25", type: "回放生成提醒", channel: "站内信", result: "送达" }
          ]
        }
      ],
      reminders: [
        {
          id: "R001", liveId: "L001", name: "开播前 1 小时提醒",
          category: "system_reminder", remindType: "pre_live",
          triggerType: "relative_to_live", triggerLabel: "开播前 1 小时",
          triggerTime: "2026-09-09 19:00",
          audienceType: "booked", audienceLabel: "已预约用户",
          channels: ["短信", "站内信"],
          template: "您预约的《春启 03 期家长公开课》将于 1 小时后开播，点击进入。",
          owner: "系统", status: "completed",
          estimatedUsers: 234, reachedUsers: 220, messageCount: 440,
          deliveredUsers: 218, clickedUsers: 96, enteredLiveUsers: 72,
          bookedUsers: 0, orderedUsers: 0, gmv: 0,
          enabled: true, createdAt: "2026-09-05 16:25", executedAt: "2026-09-09 19:00"
        },
        {
          id: "R002", liveId: "L001", name: "正式开播提醒",
          category: "system_reminder", remindType: "live_start",
          triggerType: "live_started", triggerLabel: "正式开播时",
          triggerTime: "2026-09-09 20:00",
          audienceType: "subscribed", audienceLabel: "已订阅开播提醒用户",
          channels: ["站内信", "企微"],
          template: "《春启 03 期家长公开课》已开播，点击立即进入直播间。",
          owner: "系统", status: "pending",
          estimatedUsers: 198, reachedUsers: 0, messageCount: 0,
          deliveredUsers: 0, clickedUsers: 0, enteredLiveUsers: 0,
          bookedUsers: 0, orderedUsers: 0, gmv: 0,
          enabled: true, createdAt: "2026-09-05 16:25", executedAt: null
        },
        {
          id: "R003", liveId: "L001", name: "回放生成提醒",
          category: "system_reminder", remindType: "replay_ready",
          triggerType: "replay_ready", triggerLabel: "回放生成时",
          triggerTime: "直播结束后自动",
          audienceType: "not_attended", audienceLabel: "已预约但未观看用户",
          channels: ["站内信"],
          template: "您预约的直播已生成回放，点击补看精彩内容。",
          owner: "系统", status: "pending",
          estimatedUsers: 88, reachedUsers: 0, messageCount: 0,
          deliveredUsers: 0, clickedUsers: 0, enteredLiveUsers: 0,
          bookedUsers: 0, orderedUsers: 0, gmv: 0,
          enabled: true, createdAt: "2026-09-05 16:25", executedAt: null
        },
        {
          id: "R004", liveId: "L002", name: "开播前 1 小时提醒",
          category: "system_reminder", remindType: "pre_live",
          triggerType: "relative_to_live", triggerLabel: "开播前 1 小时",
          triggerTime: "2026-09-08 13:30",
          audienceType: "booked", audienceLabel: "已预约用户",
          channels: ["短信"],
          template: "您预约的体验课将于 1 小时后开始。",
          owner: "系统", status: "completed",
          estimatedUsers: 186, reachedUsers: 178, messageCount: 178,
          deliveredUsers: 176, clickedUsers: 90, enteredLiveUsers: 68,
          bookedUsers: 0, orderedUsers: 0, gmv: 0,
          enabled: true, createdAt: "2026-09-03 15:15", executedAt: "2026-09-08 13:30"
        },
        {
          id: "R005", liveId: "L002", name: "回放生成提醒",
          category: "system_reminder", remindType: "replay_ready",
          triggerType: "replay_ready", triggerLabel: "回放生成时",
          triggerTime: "2026-09-08 16:25",
          audienceType: "not_attended", audienceLabel: "已预约但未观看用户",
          channels: ["站内信", "短信"],
          template: "回放已生成，点击补看。",
          owner: "系统", status: "completed",
          estimatedUsers: 74, reachedUsers: 70, messageCount: 140,
          deliveredUsers: 68, clickedUsers: 32, enteredLiveUsers: 21,
          bookedUsers: 0, orderedUsers: 0, gmv: 0,
          enabled: true, createdAt: "2026-09-03 15:15", executedAt: "2026-09-08 16:25"
        },
        {
          id: "R006", liveId: "L003", name: "开播前 1 小时提醒",
          category: "system_reminder", remindType: "pre_live",
          triggerType: "relative_to_live", triggerLabel: "开播前 1 小时",
          triggerTime: "2026-09-10 18:00",
          audienceType: "booked", audienceLabel: "已预约用户",
          channels: ["短信", "站内信"],
          template: "您预约的直播将于 1 小时后开播。",
          owner: "系统", status: "paused",
          estimatedUsers: 0, reachedUsers: 0, messageCount: 0,
          deliveredUsers: 0, clickedUsers: 0, enteredLiveUsers: 0,
          bookedUsers: 0, orderedUsers: 0, gmv: 0,
          enabled: false, createdAt: "2026-09-09 10:05", executedAt: null,
          pauseReason: "直播审核中，提醒任务暂停"
        }
      ],
      sendRecords: [
        {
          id: "S001", reminderId: "R001", liveId: "L001",
          name: "开播前 1 小时提醒", remindType: "pre_live",
          liveName: "春启 03 期家长公开课", channel: "短信+站内信",
          targetUsers: 234, reachedUsers: 220, messageCount: 440,
          deliveryRate: "93.2%", clickRate: "43.6%", enteredLiveUsers: 72,
          failedUsers: 14, executedAt: "2026-09-09 19:00", status: "partial_fail",
          failReasons: ["空号 8", "拒收 6"], category: "system_reminder"
        },
        {
          id: "S002", reminderId: "R004", liveId: "L002",
          name: "开播前 1 小时提醒", remindType: "pre_live",
          liveName: "边界感训练营 · 体验课", channel: "短信",
          targetUsers: 186, reachedUsers: 178, messageCount: 178,
          deliveryRate: "95.7%", clickRate: "50.6%", enteredLiveUsers: 68,
          failedUsers: 8, executedAt: "2026-09-08 13:30", status: "completed",
          failReasons: [], category: "system_reminder"
        },
        {
          id: "S003", reminderId: "R005", liveId: "L002",
          name: "回放生成提醒", remindType: "replay_ready",
          liveName: "边界感训练营 · 体验课", channel: "站内信+短信",
          targetUsers: 74, reachedUsers: 70, messageCount: 140,
          deliveryRate: "94.6%", clickRate: "45.7%", enteredLiveUsers: 21,
          failedUsers: 4, executedAt: "2026-09-08 16:25", status: "completed",
          failReasons: [], category: "system_reminder"
        }
      ],
      sops: [
        {
          id: "SOP001", liveId: "L001", name: "春启03 私域预约+催到 SOP",
          category: "scrm_campaign", status: "running",
          period: "春启 03 期", channel: "视频号+企微",
          owner: "赵老师",
          filters: { stage: "跟进中", wecom: true, booked: false, intent: "高" },
          excludes: ["已购买", "已退订营销", "近期已触达"],
          targetUsers: 420, reachedUsers: 386, newBookings: 96,
          attendedUsers: 128, orderUsers: 38, gmv: 75620, costPerTouch: 0.32,
          createdAt: "2026-09-06 11:00", startedAt: "2026-09-07 09:00",
          steps: [
            {
              id: "ST1", name: "直播预约邀请", timing: "直播前 24 小时",
              audience: "高意向但未预约线索", channels: ["企微", "短信"],
              goal: "完成预约", auto: true, status: "completed",
              target: 420, reached: 386, converted: 96
            },
            {
              id: "ST2", name: "开播前催到", timing: "直播前 1 小时",
              audience: "已预约用户", channels: ["短信"],
              goal: "进入直播间", auto: true, status: "completed",
              target: 280, reached: 268, converted: 146
            },
            {
              id: "ST3", name: "直播中未到场提醒", timing: "开播后 10 分钟",
              audience: "已预约但未进入直播间", channels: ["企微"],
              goal: "到课", auto: true, status: "pending",
              target: 134, reached: 0, converted: 0
            },
            {
              id: "ST4", name: "直播后高意向跟进", timing: "结束后 30 分钟",
              audience: "观看超 15 分钟未下单", channels: ["助教任务"],
              goal: "完成购买", auto: false, status: "pending",
              target: 80, reached: 0, converted: 0
            }
          ]
        },
        {
          id: "SOP002", liveId: "L003", name: "春启04 招生邀约 SOP",
          category: "scrm_campaign", status: "draft",
          period: "春启 04 期", channel: "视频号",
          owner: "赵老师",
          filters: { stage: "新线索", wecom: false, booked: false, intent: "中高" },
          excludes: ["已购买", "黑名单"],
          targetUsers: 260, reachedUsers: 0, newBookings: 0,
          attendedUsers: 0, orderUsers: 0, gmv: 0, costPerTouch: 0,
          createdAt: "2026-09-09 11:20", startedAt: null,
          steps: [
            {
              id: "ST1", name: "直播预约邀请", timing: "直播前 24 小时",
              audience: "高意向但未预约线索", channels: ["短信"],
              goal: "完成预约", auto: true, status: "draft",
              target: 260, reached: 0, converted: 0
            },
            {
              id: "ST2", name: "开播前催到", timing: "直播前 1 小时",
              audience: "已预约用户", channels: ["短信", "企微"],
              goal: "进入直播间", auto: true, status: "draft",
              target: 0, reached: 0, converted: 0
            },
            {
              id: "ST3", name: "直播中未到场提醒", timing: "开播后 10 分钟",
              audience: "已预约但未进入", channels: ["企微"],
              goal: "到课", auto: true, status: "draft",
              target: 0, reached: 0, converted: 0
            },
            {
              id: "ST4", name: "直播后高意向跟进", timing: "结束后 30 分钟",
              audience: "观看未下单", channels: ["助教任务"],
              goal: "完成购买", auto: false, status: "draft",
              target: 0, reached: 0, converted: 0
            }
          ]
        }
      ],
      editDraft: null
    };
  }

  function load() {
    try {
      var raw = sessionStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    var data = seed();
    save(data);
    return data;
  }

  function save(data) {
    sessionStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  function uid(prefix) {
    return prefix + Date.now().toString(36) + Math.floor(Math.random() * 1000);
  }

  var OFFSET_LABEL = {
    "24h": "开播前 24 小时",
    "1h": "开播前 1 小时",
    "30m": "开播前 30 分钟",
    "10m": "开播前 10 分钟"
  };

  function calcPreTime(startAt, offset) {
    var d = new Date(String(startAt).replace(/-/g, "/"));
    if (isNaN(d.getTime())) return startAt;
    var mins = { "24h": 24 * 60, "1h": 60, "30m": 30, "10m": 10 }[offset] || 60;
    d.setMinutes(d.getMinutes() - mins);
    function p(n) { return n < 10 ? "0" + n : "" + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  function statusBadge(status) {
    var map = {
      pending: "badge",
      paused: "badge-warn",
      running: "badge-info",
      completed: "badge-success",
      partial_fail: "badge-warn",
      failed: "badge-danger",
      cancelled: "badge",
      draft: "badge",
      enabled: "badge-success"
    };
    return map[status] || "badge";
  }

  function statusLabel(status) {
    var map = {
      pending: "待执行", paused: "已暂停", running: "执行中",
      completed: "已完成", partial_fail: "部分失败", failed: "已失败",
      cancelled: "已取消", draft: "草稿", enabled: "已启用"
    };
    return map[status] || status;
  }

  var api = {
    OFFSET_LABEL: OFFSET_LABEL,
    statusBadge: statusBadge,
    statusLabel: statusLabel,
    calcPreTime: calcPreTime,
    reset: function () {
      var data = seed();
      save(data);
      return data;
    },
    getStore: function () { return load(); },
    getLives: function () { return load().lives; },
    getLive: function (id) {
      return load().lives.find(function (l) { return l.id === id; }) || null;
    },
    saveLive: function (live) {
      var data = load();
      var i = data.lives.findIndex(function (l) { return l.id === live.id; });
      if (i >= 0) data.lives[i] = live;
      else data.lives.push(live);
      save(data);
      return live;
    },
    getBookings: function (liveId) {
      return load().bookings.filter(function (b) { return !liveId || b.liveId === liveId; });
    },
    getReminders: function (liveId) {
      return load().reminders.filter(function (r) {
        return r.category === "system_reminder" && (!liveId || r.liveId === liveId);
      });
    },
    getReminder: function (id) {
      return load().reminders.find(function (r) { return r.id === id; }) || null;
    },
    saveReminder: function (rem) {
      var data = load();
      var i = data.reminders.findIndex(function (r) { return r.id === rem.id; });
      if (i >= 0) data.reminders[i] = rem;
      else data.reminders.push(rem);
      save(data);
      return rem;
    },
    toggleReminder: function (id, enabled) {
      var rem = api.getReminder(id);
      if (!rem) return null;
      rem.enabled = enabled;
      if (rem.status === "pending" || rem.status === "paused") {
        rem.status = enabled ? "pending" : "paused";
      }
      return api.saveReminder(rem);
    },
    cancelReminder: function (id) {
      var rem = api.getReminder(id);
      if (!rem || rem.status === "completed") return null;
      rem.status = "cancelled";
      rem.enabled = false;
      return api.saveReminder(rem);
    },
    getSendRecords: function (liveId) {
      return load().sendRecords.filter(function (s) {
        return s.category === "system_reminder" && (!liveId || s.liveId === liveId);
      });
    },
    createDefaultReminders: function (live, force) {
      var data = load();
      var existing = data.reminders.filter(function (r) {
        return r.liveId === live.id && r.category === "system_reminder";
      });
      if (existing.length && !force) return existing;

      var canRun = live.auditStatus === "approved" && live.shelf;
      var baseStatus = canRun ? "pending" : "paused";
      var pauseReason = canRun ? "" : (live.auditStatus === "pending" ? "直播审核中，提醒任务暂停" : "直播未上架，提醒任务暂停");

      var defs = [];
      if (live.reminderEnabled !== false) {
        defs.push({
          id: uid("R"), liveId: live.id, name: OFFSET_LABEL[live.preRemindOffset || "1h"] || "开播前提醒",
          category: "system_reminder", remindType: "pre_live",
          triggerType: "relative_to_live",
          triggerLabel: OFFSET_LABEL[live.preRemindOffset || "1h"] || "开播前 1 小时",
          triggerTime: calcPreTime(live.startAt, live.preRemindOffset || "1h"),
          audienceType: "booked", audienceLabel: "已预约用户",
          channels: ["短信", "站内信"],
          template: "您预约的《" + live.name + "》即将开播，点击进入直播间。",
          owner: "系统", status: baseStatus, pauseReason: pauseReason,
          estimatedUsers: live.bookedUsers || 0, reachedUsers: 0, messageCount: 0,
          deliveredUsers: 0, clickedUsers: 0, enteredLiveUsers: 0,
          bookedUsers: 0, orderedUsers: 0, gmv: 0,
          enabled: !!canRun && live.reminderEnabled !== false,
          createdAt: live.shelvedAt || live.submittedAt || live.createdAt, executedAt: null
        });
      }
      if (live.remindOnStart !== false) {
        defs.push({
          id: uid("R"), liveId: live.id, name: "正式开播提醒",
          category: "system_reminder", remindType: "live_start",
          triggerType: "live_started", triggerLabel: "正式开播时",
          triggerTime: live.startAt,
          audienceType: "subscribed", audienceLabel: "已订阅开播提醒用户",
          channels: ["站内信", "企微"],
          template: "《" + live.name + "》已开播，点击立即进入。",
          owner: "系统", status: baseStatus, pauseReason: pauseReason,
          estimatedUsers: live.subscribedUsers || 0, reachedUsers: 0, messageCount: 0,
          deliveredUsers: 0, clickedUsers: 0, enteredLiveUsers: 0,
          bookedUsers: 0, orderedUsers: 0, gmv: 0,
          enabled: !!canRun, createdAt: live.shelvedAt || live.createdAt, executedAt: null
        });
      }
      if (live.remindReplay !== false) {
        defs.push({
          id: uid("R"), liveId: live.id, name: "回放生成提醒",
          category: "system_reminder", remindType: "replay_ready",
          triggerType: "replay_ready", triggerLabel: "回放生成时",
          triggerTime: "直播结束后自动",
          audienceType: "not_attended", audienceLabel: "已预约但未观看用户",
          channels: ["站内信"],
          template: "您预约的《" + live.name + "》已生成回放，点击补看。",
          owner: "系统", status: baseStatus, pauseReason: pauseReason,
          estimatedUsers: Math.max(0, (live.bookedUsers || 0) - (live.attendedUsers || 0)),
          reachedUsers: 0, messageCount: 0,
          deliveredUsers: 0, clickedUsers: 0, enteredLiveUsers: 0,
          bookedUsers: 0, orderedUsers: 0, gmv: 0,
          enabled: !!canRun, createdAt: live.shelvedAt || live.createdAt, executedAt: null
        });
      }
      if (force) {
        data.reminders = data.reminders.filter(function (r) {
          return !(r.liveId === live.id && r.category === "system_reminder" && r.status !== "completed");
        });
      }
      data.reminders = data.reminders.concat(defs);
      save(data);
      return defs;
    },
    rescheduleReminders: function (liveId, newStartAt) {
      var data = load();
      var live = data.lives.find(function (l) { return l.id === liveId; });
      if (!live) return [];
      live.startAt = newStartAt;
      var changed = [];
      data.reminders.forEach(function (r) {
        if (r.liveId !== liveId || r.category !== "system_reminder") return;
        if (r.status === "completed" || r.status === "cancelled") return;
        if (r.remindType === "pre_live") {
          var offset = "1h";
          if (r.triggerLabel.indexOf("24") >= 0) offset = "24h";
          else if (r.triggerLabel.indexOf("30") >= 0) offset = "30m";
          else if (r.triggerLabel.indexOf("10") >= 0) offset = "10m";
          r.triggerTime = calcPreTime(newStartAt, offset);
          changed.push(r);
        } else if (r.remindType === "live_start") {
          r.triggerTime = newStartAt;
          changed.push(r);
        }
      });
      save(data);
      return changed;
    },
    cancelLiveTasks: function (liveId) {
      var data = load();
      data.reminders.forEach(function (r) {
        if (r.liveId === liveId && r.category === "system_reminder" && r.status !== "completed") {
          r.status = "cancelled";
          r.enabled = false;
        }
      });
      data.sops.forEach(function (s) {
        if (s.liveId === liveId && s.status !== "completed") {
          s.status = "paused";
          s.pauseReason = "直播已取消";
        }
      });
      var live = data.lives.find(function (l) { return l.id === liveId; });
      if (live) {
        live.liveStatus = "cancelled";
        live.liveStatusLabel = "已取消";
        // 生成取消通知
        data.reminders.push({
          id: uid("R"), liveId: liveId, name: "直播取消通知",
          category: "system_reminder", remindType: "live_cancelled",
          triggerType: "live_cancelled", triggerLabel: "直播取消时",
          triggerTime: "立即",
          audienceType: "booked", audienceLabel: "已预约用户",
          channels: ["短信", "站内信"],
          template: "您预约的《" + live.name + "》已取消，给您带来不便敬请谅解。",
          owner: "系统", status: "pending",
          estimatedUsers: live.bookedUsers || 0, reachedUsers: 0, messageCount: 0,
          deliveredUsers: 0, clickedUsers: 0, enteredLiveUsers: 0,
          bookedUsers: 0, orderedUsers: 0, gmv: 0,
          enabled: true, createdAt: new Date().toISOString().slice(0, 16).replace("T", " "), executedAt: null
        });
      }
      save(data);
    },
    approveAndShelf: function (liveId) {
      var data = load();
      var live = data.lives.find(function (l) { return l.id === liveId; });
      if (!live) return null;
      live.auditStatus = "approved";
      live.auditStatusLabel = "已通过";
      live.shelf = true;
      live.liveStatus = "upcoming";
      live.liveStatusLabel = "待开播";
      live.approvedAt = "2026-09-09 15:00";
      live.shelvedAt = "2026-09-09 15:05";
      save(data);
      api.createDefaultReminders(live, true);
      return live;
    },
    getSops: function (liveId) {
      return load().sops.filter(function (s) { return !liveId || s.liveId === liveId; });
    },
    getSop: function (id) {
      return load().sops.find(function (s) { return s.id === id; }) || null;
    },
    saveSop: function (sop) {
      var data = load();
      var i = data.sops.findIndex(function (s) { return s.id === sop.id; });
      if (i >= 0) data.sops[i] = sop;
      else data.sops.push(sop);
      save(data);
      return sop;
    },
    defaultSopSteps: function () {
      return [
        { id: uid("ST"), name: "直播预约邀请", timing: "直播前 24 小时", audience: "高意向但未预约线索", channels: ["企微", "短信"], goal: "完成预约", auto: true, status: "draft", target: 0, reached: 0, converted: 0 },
        { id: uid("ST"), name: "开播前催到", timing: "直播前 1 小时", audience: "已预约用户", channels: ["短信"], goal: "进入直播间", auto: true, status: "draft", target: 0, reached: 0, converted: 0 },
        { id: uid("ST"), name: "直播中未到场提醒", timing: "开播后 10 分钟", audience: "已预约但未进入直播间", channels: ["企微"], goal: "到课", auto: true, status: "draft", target: 0, reached: 0, converted: 0 },
        { id: uid("ST"), name: "直播后高意向跟进", timing: "结束后 30 分钟", audience: "观看超 15 分钟未下单", channels: ["助教任务"], goal: "完成购买", auto: false, status: "draft", target: 0, reached: 0, converted: 0 }
      ];
    },
    createSop: function (payload) {
      var live = api.getLive(payload.liveId);
      var sop = {
        id: uid("SOP"),
        liveId: payload.liveId,
        name: payload.name || ((live ? live.name : "直播") + " 私域促到 SOP"),
        category: "scrm_campaign",
        status: "draft",
        period: payload.period || "",
        channel: payload.channel || "",
        owner: payload.owner || "赵老师",
        filters: payload.filters || {},
        excludes: payload.excludes || ["已购买", "已退订营销", "近期已触达"],
        targetUsers: payload.targetUsers || 0,
        reachedUsers: 0, newBookings: 0, attendedUsers: 0, orderUsers: 0, gmv: 0, costPerTouch: 0,
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        startedAt: null,
        steps: payload.steps || api.defaultSopSteps()
      };
      return api.saveSop(sop);
    },
    setSopStatus: function (id, status) {
      var sop = api.getSop(id);
      if (!sop) return null;
      var live = api.getLive(sop.liveId);
      if (status === "running") {
        if (!live || live.auditStatus !== "approved" || !live.shelf) {
          return { error: "直播未通过审核并上架，无法启动促到 SOP" };
        }
        sop.startedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
      }
      sop.status = status;
      return api.saveSop(sop);
    },
    saveEditDraft: function (draft) {
      var data = load();
      data.editDraft = draft;
      save(data);
    },
    consumeEditDraft: function () {
      var data = load();
      var d = data.editDraft;
      data.editDraft = null;
      save(data);
      return d;
    },
    createLiveFromEdit: function (form) {
      var live = {
        id: uid("L").replace("L", "L").slice(0, 8).toUpperCase().replace(/[^A-Z0-9]/g, "") || "L" + Date.now().toString().slice(-3),
        name: form.name,
        liveStatus: "draft_pending",
        liveStatusLabel: "待审核",
        auditStatus: "pending",
        auditStatusLabel: "审核中",
        startAt: form.startAt,
        endAt: form.endAt,
        shelf: false,
        bookedUsers: 0, subscribedUsers: 0, reachedUsers: 0, messageCount: 0,
        attendedUsers: 0, orderedUsers: 0,
        reminderEnabled: form.reminderEnabled !== false,
        preRemindOffset: form.preRemindOffset || "1h",
        remindOnStart: form.remindOnStart !== false,
        remindReplay: form.remindReplay !== false,
        createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        submittedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        approvedAt: null, shelvedAt: null
      };
      // nicer id
      live.id = "L" + String(100 + load().lives.length + 1);
      api.saveLive(live);
      api.createDefaultReminders(live, false);
      return live;
    }
  };

  // ensure seed once
  load();
  global.LiveReach = api;
})(window);
