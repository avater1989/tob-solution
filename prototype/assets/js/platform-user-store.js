/**
 * 运营后台 · 跨租户 C 端用户聚合（演示）
 * 聚合主键：手机号优先，其次微信 UnionID
 * 与租户员工账号（tenant-config?tab=user）无关
 */
(function (global) {
  var TENANTS = [
    { id: "10001", name: "星启家庭教育" },
    { id: "10002", name: "晨光少儿成长" },
    { id: "10005", name: "青藤家长学堂" },
    { id: "10008", name: "慧心教育" }
  ];

  var USERS = [
    {
      id: "PU20260907001",
      name: "李女士",
      nick: "李妈",
      phone: "13800002610",
      phoneMask: "138****2610",
      unionId: "uid_wx_li_001",
      mergeKey: "phone",
      mergeStatus: "merged",
      source: "视频号",
      marketing: "normal",
      registeredAt: "2026-08-30",
      lastActiveAt: "2026-09-18 21:06",
      lastActiveTenantId: "10001",
      memberships: [
        {
          tenantId: "10001", tenantName: "星启家庭教育", localUserId: "U0001",
          wecom: true, owner: "赵老师", tags: ["高意向", "公域已购"],
          joinedAt: "2026-08-30", source: "视频号"
        },
        {
          tenantId: "10005", tenantName: "青藤家长学堂", localUserId: "U1088",
          wecom: false, owner: "—", tags: ["体验课"],
          joinedAt: "2026-09-12", source: "小程序"
        }
      ],
      orders: [
        { id: "YB20260907000331", tenantId: "10001", tenantName: "星启家庭教育", product: "春启 03 期家长必修课", amount: 9.9, status: "已支付", time: "2026-09-07 14:22" },
        { id: "YB20260912000801", tenantId: "10005", tenantName: "青藤家长学堂", product: "家庭教育入门体验课", amount: 9.9, status: "已完成", time: "2026-09-12 16:40" }
      ],
      rights: [
        { id: "R2026090700331", tenantId: "10001", tenantName: "星启家庭教育", course: "春启 03 期家长必修课", status: "有效", learn: "学习中", endAt: "2027-09-07" },
        { id: "R2026091200801", tenantId: "10005", tenantName: "青藤家长学堂", course: "家庭教育入门体验课", status: "有效", learn: "未学习", endAt: "2026-12-12" }
      ],
      leads: [
        { tenantId: "10001", tenantName: "星启家庭教育", stage: "已加微", owner: "赵老师", updatedAt: "2026-09-07 14:40" },
        { tenantId: "10005", tenantName: "青藤家长学堂", stage: "待加微", owner: "—", updatedAt: "2026-09-12 16:45" }
      ]
    },
    {
      id: "PU20260325011",
      name: "张女士",
      nick: "",
      phone: "15900008832",
      phoneMask: "159****8832",
      unionId: "uid_wx_zhang_011",
      mergeKey: "phone",
      mergeStatus: "merged",
      source: "视频号",
      marketing: "normal",
      registeredAt: "2026-03-25",
      lastActiveAt: "2026-09-10 11:20",
      lastActiveTenantId: "10001",
      memberships: [
        {
          tenantId: "10001", tenantName: "星启家庭教育", localUserId: "U0011",
          wecom: false, owner: "—", tags: ["公域新客"],
          joinedAt: "2026-03-25", source: "视频号"
        },
        {
          tenantId: "10002", tenantName: "晨光少儿成长", localUserId: "U2201",
          wecom: true, owner: "阮荣均", tags: ["直播高活跃"],
          joinedAt: "2026-06-08", source: "直播间"
        },
        {
          tenantId: "10008", tenantName: "慧心教育", localUserId: "U3302",
          wecom: true, owner: "王助教", tags: ["复购"],
          joinedAt: "2026-08-01", source: "小程序"
        }
      ],
      orders: [
        { id: "YB20260325000901", tenantId: "10001", tenantName: "星启家庭教育", product: "视频号·春启 03 期家长课", amount: 99, status: "已支付", time: "2026-03-25 11:05" },
        { id: "YB20260608100200", tenantId: "10002", tenantName: "晨光少儿成长", product: "今晚直播·家长公开课", amount: 0, status: "已完成", time: "2026-06-08 20:18" },
        { id: "YB20260801100400", tenantId: "10008", tenantName: "慧心教育", product: "青春期沟通训练营", amount: 299, status: "已支付", time: "2026-08-01 19:30" }
      ],
      rights: [
        { id: "R2026032500901", tenantId: "10001", tenantName: "星启家庭教育", course: "视频号·春启 03 期家长课", status: "有效", learn: "未学习", endAt: "2027-03-25" },
        { id: "R2026060810200", tenantId: "10002", tenantName: "晨光少儿成长", course: "今晚直播·家长公开课", status: "有效", learn: "已学完", endAt: "2026-06-09" },
        { id: "R2026080110400", tenantId: "10008", tenantName: "慧心教育", course: "青春期沟通训练营", status: "有效", learn: "学习中", endAt: "2027-08-01" }
      ],
      leads: [
        { tenantId: "10001", tenantName: "星启家庭教育", stage: "已成交", owner: "—", updatedAt: "2026-03-25 11:10" },
        { tenantId: "10002", tenantName: "晨光少儿成长", stage: "跟进中", owner: "阮荣均", updatedAt: "2026-09-10 11:20" },
        { tenantId: "10008", tenantName: "慧心教育", stage: "已成交", owner: "王助教", updatedAt: "2026-08-01 19:35" }
      ]
    },
    {
      id: "PU20260327104",
      name: "刘女士",
      nick: "刘妈",
      phone: "13700000012",
      phoneMask: "137****0012",
      unionId: "uid_wx_liu_104",
      mergeKey: "phone",
      mergeStatus: "single",
      source: "小程序",
      marketing: "normal",
      registeredAt: "2026-03-25",
      lastActiveAt: "2026-03-27 15:30",
      lastActiveTenantId: "10002",
      memberships: [
        {
          tenantId: "10002", tenantName: "晨光少儿成长", localUserId: "U0004",
          wecom: false, owner: "王助教", tags: [],
          joinedAt: "2026-03-25", source: "小程序"
        }
      ],
      orders: [
        { id: "YB20260327100789", tenantId: "10002", tenantName: "晨光少儿成长", product: "9.9 引流课·亲子沟通", amount: 9.9, status: "待付款", time: "2026-03-27 15:30" }
      ],
      rights: [],
      leads: [
        { tenantId: "10002", tenantName: "晨光少儿成长", stage: "待付款", owner: "王助教", updatedAt: "2026-03-27 15:32" }
      ]
    },
    {
      id: "PU20260325008",
      name: "赵女士",
      nick: "",
      phone: "18600002099",
      phoneMask: "186****2099",
      unionId: "uid_wx_zhao_008",
      mergeKey: "phone",
      mergeStatus: "single",
      source: "小程序",
      marketing: "stopped",
      registeredAt: "2026-03-24",
      lastActiveAt: "2026-03-30 11:15",
      lastActiveTenantId: "10001",
      memberships: [
        {
          tenantId: "10001", tenantName: "星启家庭教育", localUserId: "U0008",
          wecom: true, owner: "赵老师", tags: ["已退款"],
          joinedAt: "2026-03-24", source: "小程序"
        }
      ],
      orders: [
        { id: "YB20260325000666", tenantId: "10001", tenantName: "星启家庭教育", product: "9.9 引流课·亲子沟通", amount: 9.9, status: "已退款", time: "2026-03-25 14:22" }
      ],
      rights: [
        { id: "R2026032500666", tenantId: "10001", tenantName: "星启家庭教育", course: "9.9 引流课·亲子沟通", status: "已回收", learn: "—", endAt: "—" }
      ],
      leads: [
        { tenantId: "10001", tenantName: "星启家庭教育", stage: "已退款", owner: "赵老师", updatedAt: "2026-03-30 11:15" }
      ]
    },
    {
      id: "PU20260324106",
      name: "周女士",
      nick: "周妈",
      phone: "13300007788",
      phoneMask: "133****7788",
      unionId: "uid_wx_zhou_106",
      mergeKey: "phone",
      mergeStatus: "single",
      source: "小程序",
      marketing: "normal",
      registeredAt: "2026-03-24",
      lastActiveAt: "2026-04-02 10:15",
      lastActiveTenantId: "10001",
      memberships: [
        {
          tenantId: "10001", tenantName: "星启家庭教育", localUserId: "U0006",
          wecom: true, owner: "赵老师", tags: ["训练营学员", "退款处理中"],
          joinedAt: "2026-03-24", source: "小程序"
        }
      ],
      orders: [
        { id: "YB20260324100231", tenantId: "10001", tenantName: "星启家庭教育", product: "青春期沟通训练营", amount: 299, status: "退款中", time: "2026-03-24 18:47" }
      ],
      rights: [
        { id: "R2026032410231", tenantId: "10001", tenantName: "星启家庭教育", course: "青春期沟通训练营", status: "有效", learn: "学习中", endAt: "2027-03-24", abnormal: true }
      ],
      leads: [
        { tenantId: "10001", tenantName: "星启家庭教育", stage: "售后中", owner: "赵老师", updatedAt: "2026-04-02 10:15" }
      ]
    },
    {
      id: "PU20260901055",
      name: "陈先生",
      nick: "",
      phone: "18600004411",
      phoneMask: "186****4411",
      unionId: "uid_wx_chen_055",
      mergeKey: "phone",
      mergeStatus: "single",
      source: "直播间",
      marketing: "normal",
      registeredAt: "2026-03-20",
      lastActiveAt: "2026-03-28 20:18",
      lastActiveTenantId: "10002",
      memberships: [
        {
          tenantId: "10002", tenantName: "晨光少儿成长", localUserId: "U0010",
          wecom: false, owner: "阮荣均", tags: ["直播高活跃"],
          joinedAt: "2026-03-20", source: "直播间"
        }
      ],
      orders: [
        { id: "YB20260329100456", tenantId: "10002", tenantName: "晨光少儿成长", product: "今晚直播·家长公开课", amount: 0, status: "已完成", time: "2026-03-28 20:18" }
      ],
      rights: [
        { id: "R2026032910456", tenantId: "10002", tenantName: "晨光少儿成长", course: "今晚直播·家长公开课", status: "有效", learn: "已学完", endAt: "2026-03-29" }
      ],
      leads: [
        { tenantId: "10002", tenantName: "晨光少儿成长", stage: "已到场", owner: "阮荣均", updatedAt: "2026-03-28 20:20" }
      ]
    }
  ];

  function tenantName(id) {
    var t = TENANTS.filter(function (x) { return x.id === id; })[0];
    return t ? t.name : id;
  }

  function summarize(u) {
    var m = u.memberships || [];
    var rights = u.rights || [];
    var validRights = rights.filter(function (r) { return r.status === "有效"; }).length;
    var abnormalRights = rights.filter(function (r) {
      return r.abnormal || r.status === "已回收" || r.status === "开通失败";
    }).length;
    return {
      id: u.id,
      name: u.name,
      nick: u.nick,
      phoneMask: u.phoneMask,
      mergeStatus: u.mergeStatus,
      source: u.source,
      marketing: u.marketing,
      registeredAt: u.registeredAt,
      lastActiveAt: u.lastActiveAt,
      lastActiveTenantId: u.lastActiveTenantId,
      lastActiveTenantName: tenantName(u.lastActiveTenantId),
      tenantCount: m.length,
      tenantNames: m.map(function (x) { return x.tenantName; }),
      tenantIds: m.map(function (x) { return x.tenantId; }),
      localUserIds: m.map(function (x) { return x.localUserId; }),
      orderCount: (u.orders || []).length,
      validRights: validRights,
      abnormalRights: abnormalRights,
      wecomAny: m.some(function (x) { return x.wecom; })
    };
  }

  function list(filter) {
    filter = filter || {};
    return USERS.map(summarize).filter(function (u) {
      if (filter.qName && String(u.name).indexOf(filter.qName) < 0) return false;
      if (filter.qPhone) {
        var raw = (USERS.filter(function (x) { return x.id === u.id; })[0] || {}).phone || "";
        if (String(u.phoneMask).indexOf(filter.qPhone) < 0 && String(raw).indexOf(filter.qPhone) < 0) return false;
      }
      if (filter.qPuId && String(u.id).toLowerCase().indexOf(String(filter.qPuId).toLowerCase()) < 0) return false;
      if (filter.qLocalId) {
        var hitLocal = (u.localUserIds || []).some(function (id) {
          return String(id).toLowerCase().indexOf(String(filter.qLocalId).toLowerCase()) >= 0;
        });
        if (!hitLocal) return false;
      }
      if (filter.tenantId && (u.tenantIds || []).indexOf(filter.tenantId) < 0) return false;
      if (filter.source && u.source !== filter.source) return false;
      if (filter.wecom === "1" && !u.wecomAny) return false;
      if (filter.wecom === "0" && u.wecomAny) return false;
      if (filter.rightSt === "valid" && u.validRights <= 0) return false;
      if (filter.rightSt === "abnormal" && u.abnormalRights <= 0) return false;
      if (filter.rightSt === "none" && (u.validRights > 0 || u.abnormalRights > 0)) return false;
      if (filter.mergeStatus && u.mergeStatus !== filter.mergeStatus) return false;
      return true;
    });
  }

  function get(id) {
    return USERS.filter(function (u) { return u.id === id; })[0] || null;
  }

  global.PlatformUserStore = {
    TENANTS: TENANTS,
    list: list,
    get: get,
    summarize: summarize,
    tenantName: tenantName,
    mergeStatusLabel: function (s) {
      if (s === "merged") return "已聚合";
      return "单租户";
    },
    mergeStatusBadge: function (s) {
      if (s === "merged") return "badge-info";
      return "";
    }
  };
})(window);
