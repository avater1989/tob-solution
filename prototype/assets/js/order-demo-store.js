/* B 端订单演示数据（商家管理后台 / 运营后台共用）
   范围：交易 · 订单管理 · 订单列表 与 订单详情 的**同一份**演示数据源。
   覆盖状态：已支付 / 待付款 / 已完成 / 已退款 / 退款中；商品类型：课程商品 / 直播商品。
   MVP：仅商家自建商品（服务费）；平台商品订单已从列表下线。
   订单号与 admin/orders.html、ops/trade-orders.html 列表演示行对应，避免列表与详情口径分叉。 */
(function (global) {
  var NOTE_KEY = "b_end_order_notes_v1";

  var SEED = {
    /* ① 商家自建 · 服务费 0.6% · 已支付 · 课程商品（视频号） */
    YB20260907000331: {
      order: {
        id: "YB20260907000331", type: "消费",
        product: "春启 03 期家长必修课", spec: "12 节 · 课程商品 · 1 个 SKU",
        goodsType: "课程商品", orderType: "普通订单",
        amount: 9.9, discount: 0,
        time: "2026-09-07 14:22", payTime: "2026-09-07 14:22",
        payStatus: "已支付", refundStatus: "无", refundId: "",
        rightId: "R2026090700331", rightStatus: "有效", owner: "李女士",
        channel: "视频号", contentSource: "self", settleMode: "service_fee", serviceFeeRate: 0.6,
        contentOwner: "星启家庭教育（商家自建）", tenant: "星启家庭教育",
        deliverType: "支付后自动开通", payChannel: "通联支付（微信小程序内）",
        channelTxn: "WX20260907140221", payTxn: "TL20260907000331XX",
        promoter: "—", consultant: "—",
        settlementId: "JS202609001", reconBatch: "T20260908", reconMatched: true
      },
      user: {
        id: "U0001", name: "李女士", phone: "13800002610", wecom: true, owner: "赵老师",
        source: "视频号", registeredAt: "2026-08-30",
        tags: [{ name: "高意向", color: "blue" }, { name: "公域已购", color: "green" }]
      },
      right: {
        id: "R2026090700331", course: "春启 03 期家长必修课", product: "春启 03 期家长必修课",
        chapters: 12, rightType: "正式课", acquire: "订单购买", acquireMethod: "订单购买",
        sourceRef: "YB20260907000331", courseId: "S101",
        orderId: "YB20260907000331", orderStatus: "已支付",
        startAt: "2026-09-07", endAt: "2027-09-07",
        status: "有效", learnStatus: "学习中", access: "可访问", courseStatus: "上架",
        lastChange: "2026-09-07 支付成功后自动开通", acquireAt: "2026-09-07 14:23"
      },
      refund: null,
      aftersales: [],
      notes: [
        { at: "2026-09-07 14:35", by: "赵老师", text: "视频号直播间转化下单，已加企微，关注后续训练营复购。" }
      ]
    },

    /* ② 商家自建 · 服务费 0.6% · 已完成 · 直播商品（免费场次） */
    YB20260329100456: {
      order: {
        id: "YB20260329100456", type: "消费",
        product: "今晚直播·家长公开课", spec: "1 场次 · 直播商品 · 免费",
        goodsType: "直播商品", orderType: "直播订单",
        amount: 0, discount: 0,
        time: "2026-03-28 20:18", payTime: "2026-03-28 20:18",
        payStatus: "已完成", refundStatus: "无", refundId: "",
        rightId: "R2026032910456", rightStatus: "有效", owner: "陈先生",
        channel: "直播间", contentSource: "self", settleMode: "service_fee", serviceFeeRate: 0.6,
        contentOwner: "晨光少儿成长（商家自建）", tenant: "晨光少儿成长",
        deliverType: "支付后自动开通", payChannel: "通联支付（微信小程序内）",
        channelTxn: "—", payTxn: "—",
        liveId: "L005", liveName: "秋季训练营转化专场",
        promoter: "阮荣均", consultant: "—",
        settlementId: "—", reconBatch: "—", reconMatched: null
      },
      user: {
        id: "U0010", name: "陈先生", phone: "18600004411", wecom: false, owner: "阮荣均",
        source: "直播间", registeredAt: "2026-03-20",
        tags: [{ name: "直播高活跃", color: "orange" }]
      },
      right: {
        id: "R2026032910456", course: "今晚直播·家长公开课", product: "今晚直播·家长公开课",
        chapters: 1, rightType: "直播观看资格", acquire: "订单购买", acquireMethod: "订单购买",
        sourceRef: "YB20260329100456", courseId: "L005",
        orderId: "YB20260329100456", orderStatus: "已完成",
        startAt: "2026-03-28", endAt: "2026-03-29",
        status: "有效", learnStatus: "已学完", access: "可访问", courseStatus: "上架",
        lastChange: "2026-03-28 支付成功后自动开通", acquireAt: "2026-03-28 20:18"
      },
      refund: null,
      aftersales: [],
      notes: []
    },

    /* ③ 商家自建 · 服务费 0.6% · 待付款 · 课程商品 */
    YB20260327100789: {
      order: {
        id: "YB20260327100789", type: "消费",
        product: "9.9 引流课·亲子沟通", spec: "3 节 · 课程商品 · 限时 ¥9.9",
        goodsType: "课程商品", orderType: "普通订单",
        amount: 9.9, discount: 0,
        time: "2026-03-27 15:30", payTime: "",
        payStatus: "待付款", refundStatus: "无", refundId: "",
        rightId: "", rightStatus: "未开通", owner: "刘女士",
        channel: "小程序", contentSource: "self", settleMode: "service_fee", serviceFeeRate: 0.6,
        contentOwner: "青藤家长学堂（商家自建）", tenant: "晨光少儿成长",
        deliverType: "支付后自动开通", payChannel: "—",
        channelTxn: "—", payTxn: "—",
        promoter: "王助教", consultant: "—",
        settlementId: "—", reconBatch: "—", reconMatched: null
      },
      user: {
        id: "U0004", name: "刘女士", phone: "13700000012", wecom: false, owner: "王助教",
        source: "小程序", registeredAt: "2026-03-25",
        tags: [{ name: "已领体验课", color: "green" }]
      },
      right: null,
      refund: null,
      aftersales: [],
      notes: []
    },

    /* ④ 商家自建 · 服务费 0.6% · 已退款（权益已回收）· 课程商品 */
    YB20260325000666: {
      order: {
        id: "YB20260325000666", type: "消费",
        product: "9.9 引流课·亲子沟通", spec: "3 节 · 课程商品 · 限时 ¥9.9",
        goodsType: "课程商品", orderType: "普通订单",
        amount: 9.9, discount: 0,
        time: "2026-03-25 14:22", payTime: "2026-03-25 14:22",
        payStatus: "已退款", refundStatus: "已退款", refundId: "RF202603300002",
        rightId: "R2026032500666", rightStatus: "已退款回收", owner: "赵女士",
        channel: "小程序", contentSource: "self", settleMode: "service_fee", serviceFeeRate: 0.6,
        contentOwner: "星启家庭教育（商家自建）", tenant: "星启家庭教育",
        deliverType: "支付后自动开通", payChannel: "通联支付（微信小程序内）",
        channelTxn: "WX20260325140222", payTxn: "TL20260325140066XX",
        promoter: "赵老师", consultant: "—",
        settlementId: "—", reconBatch: "T20260326", reconMatched: true
      },
      user: {
        id: "U0008", name: "赵女士", phone: "18600002099", wecom: true, owner: "赵老师",
        source: "小程序", registeredAt: "2026-03-24",
        tags: [{ name: "已退款", color: "red" }]
      },
      right: {
        id: "R2026032500666", course: "9.9 引流课·亲子沟通", product: "9.9 引流课·亲子沟通",
        chapters: 3, rightType: "试听权益", acquire: "订单购买", acquireMethod: "订单购买",
        sourceRef: "YB20260325000666", courseId: "S103",
        orderId: "YB20260325000666", orderStatus: "已退款", refundId: "RF202603300002",
        startAt: "2026-03-25", endAt: "2026-06-25",
        status: "已退款回收", learnStatus: "不可学习", access: "不可访问", courseStatus: "上架",
        lastChange: "2026-03-30 退款完成后回收权益", acquireAt: "2026-03-25 14:23"
      },
      refund: {
        id: "RF202603300002", orderId: "YB20260325000666", amount: 9.9,
        type: "退款并回收权益", reason: "用户主动申请",
        status: "done", statusLabel: "已退款",
        createdAt: "2026-03-30 11:08",
        rightsRecycled: true, rightsStatus: "已退款回收", courseAccess: "不可访问",
        splitRollback: "已冲正 · 退款金额不计入结算", handler: "客服中心"
      },
      aftersales: [
        {
          id: "RF202603300002", kind: "退款单", type: "退款并回收权益",
          amount: 9.9, status: "已退款", statusClass: "badge-success",
          rights: "已回收（R2026032500666）", createdAt: "2026-03-30 11:08",
          href: "refunds.html"
        }
      ],
      notes: [
        { at: "2026-03-30 11:15", by: "客服中心", text: "买家主动申请退款，已原路退回并回收课程权益。" }
      ]
    },

    /* ⑤ 商家自建 · 服务费 0.6% · 已支付（视频号）· 课程商品 */
    YB20260325000901: {
      order: {
        id: "YB20260325000901", type: "消费",
        product: "视频号·春启 03 期家长课", spec: "12 节 · 课程商品 · 公域同步",
        goodsType: "课程商品", orderType: "普通订单",
        amount: 99, discount: 0,
        time: "2026-03-25 11:05", payTime: "2026-03-25 11:05",
        payStatus: "已支付", refundStatus: "无", refundId: "",
        rightId: "R2026032500901", rightStatus: "有效", owner: "张女士",
        channel: "视频号", contentSource: "self", settleMode: "service_fee", serviceFeeRate: 0.6,
        contentOwner: "星启家庭教育（商家自建）", tenant: "星启家庭教育",
        deliverType: "支付后自动开通", payChannel: "通联支付（微信小程序内）",
        channelTxn: "WX20260325110503", payTxn: "TL20260325110001XX",
        promoter: "—", consultant: "—",
        settlementId: "JS202609001", reconBatch: "T20260326", reconMatched: true
      },
      user: {
        id: "U0011", name: "张女士", phone: "15900008832", wecom: false, owner: "—",
        source: "视频号", registeredAt: "2026-03-25",
        tags: [{ name: "公域新客", color: "blue" }]
      },
      right: {
        id: "R2026032500901", course: "视频号·春启 03 期家长课", product: "视频号·春启 03 期家长课",
        chapters: 12, rightType: "正式课", acquire: "订单购买", acquireMethod: "订单购买",
        sourceRef: "YB20260325000901", courseId: "S101",
        orderId: "YB20260325000901", orderStatus: "已支付",
        startAt: "2026-03-25", endAt: "2027-03-25",
        status: "有效", learnStatus: "未学习", access: "可访问", courseStatus: "上架",
        lastChange: "2026-03-25 支付成功后自动开通", acquireAt: "2026-03-25 11:06"
      },
      refund: null,
      aftersales: [],
      notes: []
    },

    /* ⑥ 商家自建 · 服务费 0.6% · 已支付 + 退款中 · 课程商品 */
    YB20260324100231: {
      order: {
        id: "YB20260324100231", type: "消费",
        product: "青春期沟通训练营", spec: "8 节 · 课程商品 · ¥299",
        goodsType: "课程商品", orderType: "普通订单",
        amount: 299, discount: 0,
        time: "2026-03-24 18:47", payTime: "2026-03-24 18:47",
        payStatus: "已支付", refundStatus: "退款中", refundId: "RF202604020001",
        rightId: "R2026032410231", rightStatus: "有效", owner: "周女士",
        channel: "小程序", contentSource: "self", settleMode: "service_fee", serviceFeeRate: 0.6,
        contentOwner: "星启家庭教育（商家自建）", tenant: "星启家庭教育",
        deliverType: "支付后自动开通", payChannel: "通联支付（微信小程序内）",
        channelTxn: "WX20260324184706", payTxn: "TL20260324180031XX",
        promoter: "赵老师", consultant: "—",
        settlementId: "—", reconBatch: "T20260325", reconMatched: true
      },
      user: {
        id: "U0006", name: "周女士", phone: "13300007788", wecom: true, owner: "赵老师",
        source: "小程序", registeredAt: "2026-03-24",
        tags: [{ name: "训练营学员", color: "green" }, { name: "退款处理中", color: "orange" }]
      },
      right: {
        id: "R2026032410231", course: "青春期沟通训练营", product: "青春期沟通训练营",
        chapters: 8, rightType: "正式课", acquire: "订单购买", acquireMethod: "订单购买",
        sourceRef: "YB20260324100231", courseId: "S104",
        orderId: "YB20260324100231", orderStatus: "已支付", refundId: "RF202604020001",
        startAt: "2026-03-24", endAt: "2027-03-24",
        status: "有效", learnStatus: "学习中", access: "可访问", courseStatus: "上架",
        lastChange: "2026-03-24 支付成功后自动开通", acquireAt: "2026-03-24 18:48"
      },
      refund: {
        id: "RF202604020001", orderId: "YB20260324100231", amount: 299,
        type: "退款并回收权益", reason: "商品/服务问题",
        status: "pending", statusLabel: "待审核",
        createdAt: "2026-04-02 10:15",
        rightsRecycled: false, rightsStatus: "待回收", courseAccess: "可访问（退款完成前）",
        splitRollback: "待退款完成后冲正", handler: "平台客服 · 李"
      },
      aftersales: [
        {
          id: "RF202604020001", kind: "退款单", type: "退款并回收权益",
          amount: 299, status: "待审核", statusClass: "badge-warn",
          rights: "退款成功后回收", createdAt: "2026-04-02 10:15",
          href: "refunds.html"
        }
      ],
      notes: [
        { at: "2026-04-02 10:20", by: "赵老师", text: "买家反馈服务未达预期，已提交退款申请，待平台审核。" }
      ]
    }
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function loadExtraNotes() {
    try {
      var raw = localStorage.getItem(NOTE_KEY);
      if (raw) {
        var m = JSON.parse(raw);
        if (m && typeof m === "object") return m;
      }
    } catch (e) {}
    return {};
  }

  function saveExtraNotes(m) {
    try { localStorage.setItem(NOTE_KEY, JSON.stringify(m)); } catch (e) {}
  }

  function nowText() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
      " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }

  /** 取单条订单的完整演示数据：{ order, user, right, refund, aftersales, notes } */
  function find(no) {
    var key = String(no || "").trim();
    if (!key || !SEED[key]) return null;
    var rec = clone(SEED[key]);
    var extra = loadExtraNotes()[key] || [];
    rec.notes = extra.concat(rec.notes || []);
    return rec;
  }

  function all() {
    return Object.keys(SEED).map(function (k) { return find(k); });
  }

  /** 新增商家备注（localStorage 持久化，仅原型演示） */
  function addNote(no, text, by) {
    var key = String(no || "").trim();
    var t = String(text || "").trim();
    if (!key || !SEED[key] || !t) return null;
    var m = loadExtraNotes();
    m[key] = m[key] || [];
    var note = { at: nowText(), by: by || "商家管理员", text: t };
    m[key].unshift(note);
    saveExtraNotes(m);
    return note;
  }

  global.OrderDemoStore = { find: find, all: all, addNote: addNote, nowText: nowText };
})(window);
