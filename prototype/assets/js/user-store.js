/* 用户档案 / 订单 / 课程权益 — 列表与详情共用（localStorage 持久化处理结果） */
(function (global) {
  var KEY = "merchant_user_store_v2";
  var ROLE_KEY = "merchant_proto_role";

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  var SEED = {
    U001: {
      id: "U001",
      name: "学员7576",
      nick: "学员7576",
      phone: "18919167576",
      source: "视频号",
      dept: "销售部",
      owner: "赵老师",
      wecom: true,
      activeAt: "今天 09:12",
      registeredAt: "2026-08-21",
      tags: [{ name: "高意向", color: "blue" }, { name: "已购引流课", color: "green" }, { name: "训练营学员", color: "green" }],
      marketingStopped: false,
      orders30: 2,
      gmv30: 320,
      balance: 0,
      segments: ["high_value", "S4"],
      courses: ["训练营主课", "引流体验课"],
      orders: [
        {
          id: "YB202609050003", type: "消费", product: "引流体验课", amount: 9.9,
          time: "2026-09-05 15:32", payStatus: "已支付", refundStatus: "无",
          rightId: "R001-2", rightStatus: "有效", owner: "学员7576"
        },
        {
          id: "YB202608220017", type: "消费", product: "训练营主课", amount: 299,
          time: "2026-08-22 21:08", payStatus: "已支付", refundStatus: "无",
          rightId: "R001-1", rightStatus: "有效", owner: "学员7576"
        }
      ],
      rights: [
        {
          id: "R001-1", course: "训练营主课", product: "训练营主课", chapters: 12,
          acquire: "订单购买", orderId: "YB202608220017", orderStatus: "已支付",
          owner: "学员7576", startAt: "2026-08-22", endAt: "2027-08-22",
          status: "有效", learnStatus: "学习中", access: "可访问",
          courseStatus: "上架", lastChange: "2026-08-22 开通成功",
          acquireAt: "2026-08-22 21:10",
          checks: { paid: "正常", generated: "正常", effective: "正常", valid: "正常", refund: "正常", bound: "正常", course: "正常" },
          diagnose: { ok: true, title: "当前可以正常观看", desc: "课程权益有效，当前账号具备访问权限。" }
        },
        {
          id: "R001-2", course: "引流体验课", product: "引流体验课", chapters: 3,
          acquire: "订单购买", orderId: "YB202609050003", orderStatus: "已支付",
          owner: "学员7576", startAt: "2026-09-05", endAt: "2026-12-05",
          status: "有效", learnStatus: "未学习", access: "可访问",
          courseStatus: "上架", lastChange: "2026-09-05 开通成功",
          acquireAt: "2026-09-05 15:33",
          checks: { paid: "正常", generated: "正常", effective: "正常", valid: "正常", refund: "正常", bound: "正常", course: "正常" },
          diagnose: { ok: true, title: "当前可以正常观看", desc: "课程权益有效，当前账号具备访问权限。" }
        }
      ],
      lives: [
        {
          id: "L001", name: "春启 03 期家长公开课", booked: true, attended: true,
          firstEnter: "2026-09-09 20:12", watchMin: 48, interact: 6,
          ordered: true, orderId: "YB202608220017"
        }
      ],
      follows: [
        { time: "2026-09-05 15:40", text: "后台客服 阮荣均 通过「短信」发送订单提醒，已读", type: "订单提醒" },
        { time: "2026-08-30 10:20", text: "运营自动发送「权益到期前 7 天」通知，渠道：站内信", type: "权益通知" },
        { time: "2026-08-22 21:30", text: "SCRM 销售 赵老师 跟进：确认已购买训练营，约加微", type: "SCRM跟进" },
        { time: "2026-08-21 09:00", text: "用户通过视频号渠道完成注册", type: "系统" }
      ],
      accounts: [
        { time: "2026-09-05 15:32", type: "消费", amount: -9.9, balance: 0, remark: "引流体验课" },
        { time: "2026-08-22 21:08", type: "消费", amount: -299, balance: 0, remark: "训练营主课" }
      ],
      consults: [
        { time: "2026-09-06 11:20", channel: "在线客服", summary: "咨询训练营开课时间", status: "已完结" }
      ],
      logs: []
    },
    U002: {
      id: "U002",
      name: "卂十七",
      nick: "",
      phone: "13600550017",
      source: "直播预约",
      dept: "销售部",
      owner: "周销售",
      wecom: false,
      activeAt: "昨天 18:32",
      registeredAt: "2026-09-02",
      tags: [{ name: "直播高活跃", color: "orange" }, { name: "流失预警", color: "red" }],
      marketingStopped: false,
      orders30: 1,
      gmv30: 1999,
      balance: 0,
      segments: ["S3"],
      courses: ["训练营主课"],
      orders: [
        {
          id: "YB202609100008", type: "消费", product: "训练营主课", amount: 1999,
          time: "2026-09-10 20:18", payStatus: "已支付", refundStatus: "无",
          rightId: "R002-1", rightStatus: "开通失败", owner: "卂十七"
        }
      ],
      rights: [
        {
          id: "R002-1", course: "训练营主课", product: "训练营主课", chapters: 12,
          acquire: "订单购买", orderId: "YB202609100008", orderStatus: "已支付",
          owner: "卂十七", startAt: "—", endAt: "—",
          status: "开通失败", learnStatus: "不可学习", access: "不可访问",
          courseStatus: "上架", lastChange: "2026-09-10 发放失败：权益服务超时",
          acquireAt: "2026-09-10 20:18",
          failReason: "支付成功后权益发放失败",
          checks: { paid: "正常", generated: "异常", effective: "待处理", valid: "待处理", refund: "正常", bound: "待处理", course: "正常" },
          diagnose: { ok: false, title: "当前无法观看", desc: "订单已支付，但课程权益开通失败。" }
        }
      ],
      lives: [
        {
          id: "L005", name: "秋季训练营转化专场", booked: true, attended: true,
          firstEnter: "2026-09-10 19:40", watchMin: 76, interact: 12,
          ordered: true, orderId: "YB202609100008"
        }
      ],
      follows: [
        { time: "2026-09-10 21:05", text: "SCRM 销售 周销售 跟进：用户反馈已付款但进不了课", type: "SCRM跟进" },
        { time: "2026-09-10 20:25", text: "系统发送「支付成功」短信，已送达", type: "短信" },
        { time: "2026-09-02 10:00", text: "用户通过直播预约注册", type: "系统" }
      ],
      accounts: [
        { time: "2026-09-10 20:18", type: "消费", amount: -1999, balance: 0, remark: "训练营主课" }
      ],
      consults: [
        { time: "2026-09-10 21:12", channel: "在线客服", summary: "已付款无法看课", status: "处理中" }
      ],
      logs: []
    },
    U003: {
      id: "U003",
      name: "学员1485",
      nick: "",
      phone: "18042691485",
      source: "手动导入",
      dept: "",
      owner: "未分配",
      wecom: false,
      activeAt: "15 天前",
      registeredAt: "2026-05-12",
      tags: [],
      marketingStopped: false,
      orders30: 0,
      gmv30: 0,
      balance: 0,
      segments: ["new_guest", "S1", "S2"],
      courses: [],
      orders: [],
      rights: [],
      lives: [],
      follows: [
        { time: "2026-05-12 14:20", text: "运营导入用户名单，待分配归属", type: "系统" }
      ],
      accounts: [],
      consults: [],
      logs: []
    },
    U004: {
      id: "U004",
      name: "学员7553",
      nick: "学员7553",
      phone: "18919167553",
      source: "企微裂变",
      dept: "运营部",
      owner: "王助教",
      wecom: true,
      activeAt: "3 天前",
      registeredAt: "2026-04-08",
      tags: [{ name: "老客复购", color: "purple" }, { name: "训练营学员", color: "green" }],
      marketingStopped: false,
      orders30: 3,
      gmv30: 1280,
      balance: 0,
      segments: ["high_value", "S4"],
      courses: ["训练营主课", "引流体验课"],
      orders: [
        {
          id: "YB202603150021", type: "消费", product: "训练营主课", amount: 1999,
          time: "2026-03-15 11:08", payStatus: "已支付", refundStatus: "无",
          rightId: "R004-1", rightStatus: "已到期", owner: "学员7553"
        },
        {
          id: "YB202609010044", type: "消费", product: "引流体验课", amount: 9.9,
          time: "2026-09-01 09:20", payStatus: "已支付", refundStatus: "无",
          rightId: "R004-2", rightStatus: "有效", owner: "学员7553"
        }
      ],
      rights: [
        {
          id: "R004-1", course: "训练营主课", product: "训练营主课", chapters: 12,
          acquire: "订单购买", orderId: "YB202603150021", orderStatus: "已支付",
          owner: "学员7553", startAt: "2026-03-15", endAt: "2026-06-15",
          status: "已到期", learnStatus: "已学完", access: "不可访问",
          courseStatus: "上架", lastChange: "2026-06-15 到期自动失效",
          acquireAt: "2026-03-15 11:10",
          checks: { paid: "正常", generated: "正常", effective: "正常", valid: "异常", refund: "正常", bound: "正常", course: "正常" },
          diagnose: { ok: false, title: "当前无法观看", desc: "课程权益已到期，访问权限已关闭。" }
        },
        {
          id: "R004-2", course: "引流体验课", product: "引流体验课", chapters: 3,
          acquire: "订单购买", orderId: "YB202609010044", orderStatus: "已支付",
          owner: "学员7553", startAt: "2026-09-01", endAt: "2026-12-01",
          status: "有效", learnStatus: "学习中", access: "可访问",
          courseStatus: "上架", lastChange: "2026-09-01 开通成功",
          acquireAt: "2026-09-01 09:21",
          checks: { paid: "正常", generated: "正常", effective: "正常", valid: "正常", refund: "正常", bound: "正常", course: "正常" },
          diagnose: { ok: true, title: "当前可以正常观看", desc: "课程权益有效，当前账号具备访问权限。" }
        }
      ],
      lives: [
        {
          id: "L003", name: "老客复购专场", booked: true, attended: true,
          firstEnter: "2026-08-28 20:01", watchMin: 35, interact: 3,
          ordered: false, orderId: ""
        },
        {
          id: "L002", name: "企微裂变公开课", booked: true, attended: false,
          firstEnter: "—", watchMin: 0, interact: 0,
          ordered: false, orderId: ""
        }
      ],
      follows: [
        { time: "2026-09-01 10:00", text: "SCRM 王助教 跟进：引导续费训练营", type: "SCRM跟进" },
        { time: "2026-06-15 00:05", text: "系统通知：训练营主课权益已到期", type: "权益通知" },
        { time: "2026-04-08 16:00", text: "企微裂变注册并添加企微", type: "系统" }
      ],
      accounts: [
        { time: "2026-09-01 09:20", type: "消费", amount: -9.9, balance: 0, remark: "引流体验课" },
        { time: "2026-03-15 11:08", type: "消费", amount: -1999, balance: 0, remark: "训练营主课" }
      ],
      consults: [
        { time: "2026-06-16 09:40", channel: "企微", summary: "询问续费优惠", status: "已完结" }
      ],
      logs: []
    },
    U005: {
      id: "U005",
      name: "学员0017",
      nick: "",
      phone: "13700550017",
      source: "视频号",
      dept: "运营部",
      owner: "王助教",
      wecom: true,
      activeAt: "今天 11:04",
      registeredAt: "2026-09-09",
      tags: [],
      marketingStopped: false,
      orders30: 1,
      gmv30: 9.9,
      balance: 0,
      segments: ["S1"],
      courses: ["引流体验课"],
      orders: [
        {
          id: "YB202609090012", type: "消费", product: "引流体验课", amount: 9.9,
          time: "2026-09-09 11:20", payStatus: "已退款", refundStatus: "已退款",
          refundId: "RF20260909001", rightId: "R005-1", rightStatus: "已退款回收", owner: "学员0017"
        }
      ],
      rights: [
        {
          id: "R005-1", course: "引流体验课", product: "引流体验课", chapters: 3,
          acquire: "订单购买", orderId: "YB202609090012", orderStatus: "已退款",
          owner: "学员0017", startAt: "2026-09-09", endAt: "2026-12-09",
          status: "已退款回收", learnStatus: "不可学习", access: "不可访问",
          courseStatus: "上架", lastChange: "2026-09-09 退款后回收权益",
          acquireAt: "2026-09-09 11:21",
          refundId: "RF20260909001",
          checks: { paid: "异常", generated: "正常", effective: "正常", valid: "异常", refund: "异常", bound: "正常", course: "正常" },
          diagnose: { ok: false, title: "当前无法观看", desc: "订单已退款，课程权益已回收。" }
        }
      ],
      lives: [
        {
          id: "L001", name: "春启 03 期家长公开课", booked: false, attended: true,
          firstEnter: "2026-09-09 20:05", watchMin: 12, interact: 1,
          ordered: true, orderId: "YB202609090012"
        }
      ],
      follows: [
        { time: "2026-09-09 14:30", text: "客服处理退款申请并回收权益", type: "客服处理" },
        { time: "2026-09-09 11:25", text: "系统发送支付成功短信", type: "短信" },
        { time: "2026-09-09 10:50", text: "用户通过视频号注册", type: "系统" }
      ],
      accounts: [
        { time: "2026-09-09 14:28", type: "退款", amount: 9.9, balance: 0, remark: "引流体验课退款" },
        { time: "2026-09-09 11:20", type: "消费", amount: -9.9, balance: 0, remark: "引流体验课" }
      ],
      consults: [
        { time: "2026-09-09 13:50", channel: "在线客服", summary: "申请退款：课程不适合", status: "已完结" }
      ],
      logs: []
    }
  };

  function loadAll() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var data = JSON.parse(raw);
        if (data && data.users) return data;
      }
    } catch (e) {}
    var fresh = { users: clone(SEED) };
    saveAll(fresh);
    return fresh;
  }

  function saveAll(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function byId(id) {
    var data = loadAll();
    return data.users[id] ? clone(data.users[id]) : null;
  }

  function updateUser(id, mutator) {
    var data = loadAll();
    if (!data.users[id]) return null;
    mutator(data.users[id]);
    saveAll(data);
    return clone(data.users[id]);
  }

  function maskPhone(phone) {
    var p = String(phone || "");
    if (p.length < 7) return p;
    return p.slice(0, 3) + "****" + p.slice(-4);
  }

  function rightsSummary(user) {
    if (!user || !user.rights || !user.rights.length) {
      return { text: "暂无权益", abnormal: 0, valid: 0, total: 0 };
    }
    var valid = 0, abnormal = 0;
    user.rights.forEach(function (r) {
      if (r.status === "有效") valid++;
      if (["开通失败", "已到期", "已退款回收", "已冻结", "待开通"].indexOf(r.status) >= 0) abnormal++;
    });
    var parts = [];
    if (valid) parts.push(valid + "项有效");
    if (abnormal) parts.push(abnormal + "项异常");
    if (!parts.length) parts.push(user.rights.length + "项");
    return { text: parts.join(" · "), abnormal: abnormal, valid: valid, total: user.rights.length };
  }

  function isAbnormalStatus(st) {
    return ["开通失败", "已到期", "已退款回收", "已冻结", "待开通", "未生效", "绑定到其他家庭成员"].indexOf(st) >= 0;
  }

  function role() {
    try {
      return localStorage.getItem(ROLE_KEY) || "admin";
    } catch (e) {
      return "admin";
    }
  }

  function canDecryptPhone() {
    var r = role();
    return r === "admin" || r === "finance" || r === "cs_lead";
  }

  function canReopenRight() {
    var r = role();
    return r === "admin" || r === "cs" || r === "cs_lead";
  }

  function canExtendRight() {
    return role() === "admin";
  }

  function pushLog(user, entry) {
    user.logs = user.logs || [];
    user.logs.unshift(entry);
    user.follows = user.follows || [];
    user.follows.unshift({
      time: entry.time,
      text: entry.operator + " " + entry.action + "：" + (entry.reason || "") +
        (entry.from ? "（" + entry.from + " → " + entry.to + "）" : ""),
      type: "客服处理"
    });
  }

  function reopenRight(uid, rid, remark) {
    return updateUser(uid, function (u) {
      var right = (u.rights || []).filter(function (r) { return r.id === rid; })[0];
      if (!right) return;
      var from = right.status;
      right.status = "有效";
      right.learnStatus = "未学习";
      right.access = "可访问";
      right.startAt = right.startAt === "—" ? "2026-09-11" : right.startAt;
      right.endAt = right.endAt === "—" ? "2027-09-11" : right.endAt;
      right.lastChange = "重新开通成功";
      right.checks = { paid: "正常", generated: "正常", effective: "正常", valid: "正常", refund: "正常", bound: "正常", course: "正常" };
      right.diagnose = { ok: true, title: "当前可以正常观看", desc: "课程权益有效，当前账号具备访问权限。" };
      (u.orders || []).forEach(function (o) {
        if (o.rightId === rid) o.rightStatus = "有效";
      });
      pushLog(u, {
        time: "2026-09-11 16:30",
        operator: "当前账号",
        action: "重新开通权益",
        from: from,
        to: "有效",
        reason: remark || "",
        orderId: right.orderId || "",
        rightId: rid
      });
    });
  }

  function extendRight(uid, rid, newEnd, reason, notify) {
    return updateUser(uid, function (u) {
      var right = (u.rights || []).filter(function (r) { return r.id === rid; })[0];
      if (!right) return;
      var from = right.status;
      var oldEnd = right.endAt;
      right.endAt = newEnd;
      right.status = "有效";
      right.access = "可访问";
      right.learnStatus = right.learnStatus === "不可学习" ? "未学习" : right.learnStatus;
      right.lastChange = "有效期延长至 " + newEnd;
      right.checks.valid = "正常";
      right.diagnose = { ok: true, title: "当前可以正常观看", desc: "课程权益有效，当前账号具备访问权限。" };
      (u.orders || []).forEach(function (o) {
        if (o.rightId === rid) o.rightStatus = "有效";
      });
      pushLog(u, {
        time: "2026-09-11 16:35",
        operator: "当前账号",
        action: "延长有效期",
        from: from + " / 到期 " + oldEnd,
        to: "有效 / 到期 " + newEnd,
        reason: reason || "",
        orderId: right.orderId || "",
        rightId: rid,
        notify: !!notify
      });
      if (notify) {
        u.follows.unshift({
          time: "2026-09-11 16:35",
          text: "已通知用户：课程「" + right.course + "」有效期已延长至 " + newEnd,
          type: "权益通知"
        });
      }
    });
  }

  function assignOwner(uid, dept, owner, reason, transferTasks, notify) {
    return updateUser(uid, function (u) {
      var from = (u.dept || "—") + " / " + (u.owner || "未分配");
      u.dept = dept;
      u.owner = owner;
      pushLog(u, {
        time: "2026-09-11 16:40",
        operator: "当前账号",
        action: "调整归属",
        from: from,
        to: (dept || "—") + " / " + (owner || "未分配"),
        reason: reason || "",
        orderId: "",
        rightId: ""
      });
      var tip = "归属调整为 " + (dept || "未分配部门") + " · " + (owner || "未分配");
      if (transferTasks) tip += "；已同步转移未完成跟进任务";
      if (notify) tip += "；已通知新负责人";
      u.follows.unshift({ time: "2026-09-11 16:40", text: tip + (reason ? "。原因：" + reason : ""), type: "用户归属调整" });
    });
  }

  function setMarketing(uid, stopped) {
    return updateUser(uid, function (u) {
      u.marketingStopped = !!stopped;
      u.follows.unshift({
        time: "2026-09-11 16:45",
        text: stopped
          ? "已停止本商户主动营销触达（不影响订单、课程权益与平台账号）"
          : "已重新启用本商户主动营销触达",
        type: "客服处理"
      });
    });
  }

  function saveTags(uid, tagNames) {
    return updateUser(uid, function (u) {
      u.tags = (tagNames || []).map(function (n) {
        return { name: n, color: "blue" };
      });
    });
  }

  function listBrief() {
    var data = loadAll();
    return Object.keys(data.users).map(function (id) {
      var u = data.users[id];
      var sum = rightsSummary(u);
      var statuses = {};
      (u.rights || []).forEach(function (r) { statuses[r.status] = true; });
      return {
        id: u.id,
        name: u.name,
        nick: u.nick,
        phone: u.phone,
        source: u.source,
        dept: u.dept,
        owner: u.owner,
        wecom: u.wecom,
        activeAt: u.activeAt,
        registeredAt: u.registeredAt,
        tags: u.tags,
        orders30: u.orders30,
        gmv30: u.gmv30,
        rightsText: sum.text,
        rightsAbnormal: sum.abnormal,
        rightsValid: sum.valid,
        rightsTotal: sum.total,
        rightsStatuses: Object.keys(statuses),
        marketingStopped: !!u.marketingStopped,
        orderIds: (u.orders || []).map(function (o) { return o.id; }),
        courses: u.courses || [],
        segments: u.segments || []
      };
    });
  }

  function findByOrder(orderNo) {
    var q = String(orderNo || "").trim();
    if (!q) return listBrief();
    return listBrief().filter(function (u) {
      return (u.orderIds || []).some(function (id) { return id.indexOf(q) >= 0; });
    });
  }

  function findBySegment(segId) {
    var sid = String(segId || "").trim();
    if (!sid) return listBrief();
    return listBrief().filter(function (u) {
      return (u.segments || []).indexOf(sid) >= 0;
    });
  }

  function phoneExists(phone, exceptId) {
    var p = String(phone || "").trim();
    if (!p) return null;
    var data = loadAll();
    var hit = null;
    Object.keys(data.users).forEach(function (id) {
      if (exceptId && id === exceptId) return;
      if (data.users[id].phone === p) hit = clone(data.users[id]);
    });
    return hit;
  }

  function createUser(payload) {
    var phone = String(payload.phone || "").trim();
    var name = String(payload.name || "").trim();
    if (!name) return { ok: false, error: "name" };
    if (!/^1\d{10}$/.test(phone)) return { ok: false, error: "phone" };
    var exist = phoneExists(phone);
    if (exist) return { ok: false, error: "duplicate", user: exist };
    var id = "U" + Date.now().toString().slice(-6);
    var data = loadAll();
    data.users[id] = {
      id: id,
      name: name,
      nick: payload.nick || "",
      phone: phone,
      source: payload.source || "手动导入",
      dept: payload.dept || "",
      owner: payload.owner || "未分配",
      wecom: false,
      activeAt: "刚刚",
      registeredAt: "2026-09-11",
      tags: [],
      marketingStopped: false,
      orders30: 0,
      gmv30: 0,
      balance: 0,
      segments: ["new_guest"],
      courses: [],
      orders: [],
      rights: [],
      lives: [],
      follows: [{ time: "2026-09-11 17:00", text: "后台手动新增用户", type: "系统" }],
      accounts: [],
      consults: [],
      logs: []
    };
    saveAll(data);
    return { ok: true, user: clone(data.users[id]) };
  }

  var SEGMENTS = {
    new_guest: { id: "new_guest", name: "新客（系统人群）" },
    high_value: { id: "high_value", name: "高价值用户（系统人群）" },
    silent: { id: "silent", name: "沉默用户" },
    S1: { id: "S1", name: "家长必修课未购买者" },
    S2: { id: "S2", name: "领课未加微用户" },
    S3: { id: "S3", name: "直播预约未到课" },
    S4: { id: "S4", name: "训练营老学员" }
  };

  function segmentMeta(id) {
    return SEGMENTS[id] || { id: id, name: id };
  }

  function reset() {
    localStorage.removeItem(KEY);
    return loadAll();
  }

  global.UserStore = {
    KEY: KEY,
    byId: byId,
    updateUser: updateUser,
    maskPhone: maskPhone,
    rightsSummary: rightsSummary,
    isAbnormalStatus: isAbnormalStatus,
    canDecryptPhone: canDecryptPhone,
    canReopenRight: canReopenRight,
    canExtendRight: canExtendRight,
    role: role,
    reopenRight: reopenRight,
    extendRight: extendRight,
    assignOwner: assignOwner,
    setMarketing: setMarketing,
    saveTags: saveTags,
    listBrief: listBrief,
    findByOrder: findByOrder,
    findBySegment: findBySegment,
    phoneExists: phoneExists,
    createUser: createUser,
    segmentMeta: segmentMeta,
    SEGMENTS: SEGMENTS,
    reset: reset
  };
})(window);
