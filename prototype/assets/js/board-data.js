/**
 * 商家端数据板块 — 统一模拟数据源
 *
 * ========== 指标口径（必须遵守）==========
 * 1. 入池线索 poolLeads
 *    统计期内首次进入线索池的去重人数。
 * 2. 已分配 assignedLeads
 *    上述入池线索中已经分配跟进人的人数。
 * 3. 已加微 wecomLeads
 *    上述入池线索中完成企业微信添加的人数。
 * 4. 可归因支付用户 attributedPayUsers
 *    上述线索后续完成目标商品支付的去重人数。
 * 5. 支付用户 totalPayUsers
 *    统计期内全部支付用户，不要求一定来源于线索池。
 * 6. 支付订单 totalPaidOrders
 *    统计期内全部支付成功订单。
 * 7. 总GMV totalGmv
 *    统计期内全部订单实收金额（元，数值）。
 * 8. 视频号获客首单 acquisitionOrders / videoOrders
 *    发生在线索进入系统之前的前端获客订单，只能作为获客辅助指标，
 *    不能直接计入「入池→支付」后链路转化。
 * 9. 退款率 refundRate
 *    退款金额 ÷ 支付金额（展示用百分比字符串）。
 *
 * 主漏斗固定：入池线索 → 已分配 → 已加微 → 可归因支付用户
 * 跟进、直播到课、退款不是主漏斗台阶。
 */
(function (global) {
  function money(n) {
    return "¥" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function withDerived(r) {
    var o = Object.assign({}, r);
    o.gmv = money(o.totalGmv);
    o.pool = o.poolLeads;
    o.assign = o.assignedLeads;
    o.wecom = o.wecomLeads;
    o.pay = o.attributedPayUsers;
    o.orders = o.totalPaidOrders;
    o.vxOrders = o.videoOrders;
    o.vxLeads = o.videoLeads;
    o.vxClaim = o.videoClaims;
    o.vxSmsFail = o.videoSmsFailed;
    o.lives = o.liveSessions;
    o.stepAssign = o.poolLeads ? Math.round((o.assignedLeads / o.poolLeads) * 100) + "%" : "—";
    o.stepWecom = o.assignedLeads ? Math.round((o.wecomLeads / o.assignedLeads) * 100) + "%" : "—";
    o.stepPay = o.wecomLeads ? Math.round((o.attributedPayUsers / o.wecomLeads) * 100) + "%" : "—";
    o.endRate = o.poolLeads ? Math.round((o.attributedPayUsers / o.poolLeads) * 100) + "%" : "—";
    o.aov = o.totalPaidOrders ? money(Math.round(o.totalGmv / o.totalPaidOrders)) : "—";
    o.backlog = Math.max(0, o.poolLeads - o.assignedLeads);
    o.attend = o.attendUsers != null ? o.attendUsers : 0;
    o.payWithAttend = o.payWithAttend != null ? o.payWithAttend : 0;
    o.payNoAttend = o.payNoAttend != null ? o.payNoAttend : Math.max(0, o.attributedPayUsers - o.payWithAttend);
    o.coverRate = o.coverRate || "—";
    o.liveAttendAvg = o.liveAttendAvg || "—";
    o.inviteLift = o.inviteLift || "—";
    o.validLeadIn = o.validLeadIn || o.poolLeads;
    o.refundRate = o.refundRate || "—";
    o.backlogLate = o.backlogLate != null ? o.backlogLate : Math.round(o.backlog * 0.35);
    return o;
  }

  var rangesRaw = {
    today: {
      label: "今日",
      poolLeads: 86,
      assignedLeads: 72,
      wecomLeads: 41,
      attributedPayUsers: 9,
      totalPayUsers: 18,
      totalPaidOrders: 42,
      totalGmv: 18620,
      acquisitionOrders: 36,
      acquisitionGmv: 4320,
      refundUsers: 1,
      refundAmount: 391,
      refundRate: "2.1%",
      videoOrders: 36,
      videoLeads: 29,
      videoClaims: 22,
      videoSmsFailed: 4,
      noFollow: 12,
      churn: 2,
      liveSessions: 2,
      attendUsers: 12,
      payWithAttend: 5,
      payNoAttend: 4,
      validLeadIn: 110,
      coverRate: "71%",
      liveAttendAvg: "44%",
      inviteLift: "+9pt",
      timelyAssignRate: "82%",
      compareLabel: "较昨日",
      deltas: { leads: "+12%", orders: "+8%", gmv: "+15%", refund: "-0.3pp" }
    },
    yesterday: {
      label: "昨日",
      poolLeads: 74,
      assignedLeads: 68,
      wecomLeads: 39,
      attributedPayUsers: 8,
      totalPayUsers: 16,
      totalPaidOrders: 38,
      totalGmv: 17240,
      acquisitionOrders: 30,
      acquisitionGmv: 3600,
      refundUsers: 1,
      refundAmount: 448,
      refundRate: "2.6%",
      videoOrders: 30,
      videoLeads: 24,
      videoClaims: 19,
      videoSmsFailed: 3,
      noFollow: 10,
      churn: 3,
      liveSessions: 2,
      attendUsers: 14,
      payWithAttend: 5,
      payNoAttend: 3,
      validLeadIn: 98,
      coverRate: "74%",
      liveAttendAvg: "42%",
      inviteLift: "+8pt",
      timelyAssignRate: "84%",
      compareLabel: "较前日",
      deltas: { leads: "+5%", orders: "-3%", gmv: "-2%", refund: "+0.2pp" }
    },
    "7d": {
      label: "近7日",
      poolLeads: 612,
      assignedLeads: 589,
      wecomLeads: 392,
      attributedPayUsers: 128,
      totalPayUsers: 286,
      totalPaidOrders: 428,
      totalGmv: 96430,
      acquisitionOrders: 286,
      acquisitionGmv: 34400,
      refundUsers: 14,
      refundAmount: 3086,
      refundRate: "3.2%",
      videoOrders: 286,
      videoLeads: 241,
      videoClaims: 198,
      videoSmsFailed: 18,
      noFollow: 86,
      churn: 36,
      liveSessions: 18,
      attendUsers: 186,
      payWithAttend: 82,
      payNoAttend: 46,
      validLeadIn: 812,
      coverRate: "78%",
      liveAttendAvg: "41%",
      inviteLift: "+9pt",
      timelyAssignRate: "86%",
      compareLabel: "较上周期",
      deltas: { leads: "+18%", orders: "+11%", gmv: "+12%", refund: "+0.4pp" },
      inviteGroups: { sent: 11, sentAvg: "46%", miss: 3, missAvg: "37%", pending: 4 }
    },
    "30d": {
      label: "近30日",
      poolLeads: 2184,
      assignedLeads: 2090,
      wecomLeads: 1360,
      attributedPayUsers: 410,
      totalPayUsers: 920,
      totalPaidOrders: 1380,
      totalGmv: 312800,
      acquisitionOrders: 980,
      acquisitionGmv: 117600,
      refundUsers: 48,
      refundAmount: 10948,
      refundRate: "3.5%",
      videoOrders: 980,
      videoLeads: 820,
      videoClaims: 670,
      videoSmsFailed: 52,
      noFollow: 310,
      churn: 98,
      liveSessions: 52,
      attendUsers: 620,
      payWithAttend: 268,
      payNoAttend: 142,
      validLeadIn: 2900,
      coverRate: "74%",
      liveAttendAvg: "39%",
      inviteLift: "+8pt",
      timelyAssignRate: "85%",
      compareLabel: "较上周期",
      deltas: { leads: "+15%", orders: "+9%", gmv: "+10%", refund: "+0.2pp" },
      inviteGroups: { sent: 32, sentAvg: "44%", miss: 8, missAvg: "36%", pending: 12 }
    }
  };

  var ranges = {};
  Object.keys(rangesRaw).forEach(function (k) {
    ranges[k] = withDerived(rangesRaw[k]);
  });

  /* 渠道×期次切片：同 range 合计应等于 ranges[range] 主指标；noFollow/churn/attend 可按渠道聚合 */
  var leadSlices = [
    /* —— 近7日 · 合计入池 612 / 无跟进 86 / 流失 36 —— */
    { range: "7d", channel: "video", term: "spring03", channelLabel: "视频号", termLabel: "春启 03 期", pool: 240, assigned: 232, wecom: 158, attributedPay: 52, videoOrders: 180, videoLeads: 152, videoClaims: 126, videoSmsFailed: 10, noFollow: 32, churn: 13, attend: 120, payWithAttend: 35 },
    { range: "7d", channel: "video", term: "spring04", channelLabel: "视频号", termLabel: "春启 04 期", pool: 54, assigned: 50, wecom: 32, attributedPay: 10, videoOrders: 106, videoLeads: 89, videoClaims: 72, videoSmsFailed: 8, noFollow: 9, churn: 4, attend: 25, payWithAttend: 8 },
    { range: "7d", channel: "livecode", term: "spring03", channelLabel: "渠道活码", termLabel: "春启 03 期", pool: 128, assigned: 124, wecom: 82, attributedPay: 28, noFollow: 18, churn: 8, attend: 20, payWithAttend: 18 },
    { range: "7d", channel: "link", term: "trial", channelLabel: "获客链接", termLabel: "试听公开课", pool: 96, assigned: 92, wecom: 58, attributedPay: 18, noFollow: 12, churn: 5, attend: 12, payWithAttend: 12 },
    { range: "7d", channel: "redbook", term: "spring04", channelLabel: "小红书", termLabel: "春启 04 期", pool: 54, assigned: 52, wecom: 34, attributedPay: 12, noFollow: 8, churn: 3, attend: 6, payWithAttend: 6 },
    { range: "7d", channel: "import", term: "", channelLabel: "手动导入", termLabel: "多期次", pool: 40, assigned: 39, wecom: 28, attributedPay: 8, noFollow: 7, churn: 3, attend: 3, payWithAttend: 3 },
    /* —— 今日 · 合计 86 / 无跟进 12 / 流失 2 —— */
    { range: "today", channel: "video", term: "spring03", channelLabel: "视频号", termLabel: "春启 03 期", pool: 36, assigned: 30, wecom: 18, attributedPay: 4, videoOrders: 28, videoLeads: 22, videoClaims: 17, videoSmsFailed: 3, noFollow: 5, churn: 1, attend: 6, payWithAttend: 2 },
    { range: "today", channel: "video", term: "spring04", channelLabel: "视频号", termLabel: "春启 04 期", pool: 8, assigned: 6, wecom: 3, attributedPay: 1, videoOrders: 8, videoLeads: 7, videoClaims: 5, videoSmsFailed: 1, noFollow: 1, churn: 0, attend: 1, payWithAttend: 1 },
    { range: "today", channel: "livecode", term: "spring03", channelLabel: "渠道活码", termLabel: "春启 03 期", pool: 18, assigned: 16, wecom: 9, attributedPay: 2, noFollow: 3, churn: 0, attend: 2, payWithAttend: 1 },
    { range: "today", channel: "link", term: "trial", channelLabel: "获客链接", termLabel: "试听公开课", pool: 12, assigned: 10, wecom: 6, attributedPay: 1, noFollow: 2, churn: 1, attend: 2, payWithAttend: 1 },
    { range: "today", channel: "redbook", term: "spring04", channelLabel: "小红书", termLabel: "春启 04 期", pool: 7, assigned: 6, wecom: 3, attributedPay: 1, noFollow: 1, churn: 0, attend: 1, payWithAttend: 0 },
    { range: "today", channel: "import", term: "", channelLabel: "手动导入", termLabel: "多期次", pool: 5, assigned: 4, wecom: 2, attributedPay: 0, noFollow: 0, churn: 0, attend: 0, payWithAttend: 0 },
    /* —— 昨日 · 合计 74 —— */
    { range: "yesterday", channel: "video", term: "spring03", channelLabel: "视频号", termLabel: "春启 03 期", pool: 30, assigned: 28, wecom: 16, attributedPay: 3, videoOrders: 24, videoLeads: 19, videoClaims: 15, videoSmsFailed: 2, noFollow: 4, churn: 1, attend: 6, payWithAttend: 2 },
    { range: "yesterday", channel: "livecode", term: "spring03", channelLabel: "渠道活码", termLabel: "春启 03 期", pool: 18, assigned: 16, wecom: 10, attributedPay: 2, noFollow: 2, churn: 1, attend: 4, payWithAttend: 1 },
    { range: "yesterday", channel: "link", term: "trial", channelLabel: "获客链接", termLabel: "试听公开课", pool: 12, assigned: 11, wecom: 6, attributedPay: 1, noFollow: 2, churn: 0, attend: 2, payWithAttend: 1 },
    { range: "yesterday", channel: "redbook", term: "spring04", channelLabel: "小红书", termLabel: "春启 04 期", pool: 8, assigned: 7, wecom: 4, attributedPay: 1, noFollow: 1, churn: 1, attend: 1, payWithAttend: 1 },
    { range: "yesterday", channel: "import", term: "", channelLabel: "手动导入", termLabel: "多期次", pool: 6, assigned: 6, wecom: 3, attributedPay: 1, noFollow: 1, churn: 0, attend: 1, payWithAttend: 0 },
    /* —— 近30日 · 合计 2184 —— */
    { range: "30d", channel: "video", term: "spring03", channelLabel: "视频号", termLabel: "春启 03 期", pool: 820, assigned: 790, wecom: 520, attributedPay: 160, videoOrders: 620, videoLeads: 520, videoClaims: 430, videoSmsFailed: 30, noFollow: 120, churn: 40, attend: 280, payWithAttend: 110 },
    { range: "30d", channel: "video", term: "spring04", channelLabel: "视频号", termLabel: "春启 04 期", pool: 280, assigned: 265, wecom: 170, attributedPay: 50, videoOrders: 360, videoLeads: 300, videoClaims: 240, videoSmsFailed: 22, noFollow: 40, churn: 15, attend: 90, payWithAttend: 40 },
    { range: "30d", channel: "livecode", term: "spring03", channelLabel: "渠道活码", termLabel: "春启 03 期", pool: 420, assigned: 405, wecom: 260, attributedPay: 80, noFollow: 60, churn: 18, attend: 100, payWithAttend: 50 },
    { range: "30d", channel: "link", term: "trial", channelLabel: "获客链接", termLabel: "试听公开课", pool: 320, assigned: 305, wecom: 200, attributedPay: 55, noFollow: 45, churn: 12, attend: 80, payWithAttend: 35 },
    { range: "30d", channel: "redbook", term: "spring04", channelLabel: "小红书", termLabel: "春启 04 期", pool: 210, assigned: 200, wecom: 130, attributedPay: 40, noFollow: 28, churn: 8, attend: 40, payWithAttend: 20 },
    { range: "30d", channel: "import", term: "", channelLabel: "手动导入", termLabel: "多期次", pool: 134, assigned: 125, wecom: 80, attributedPay: 25, noFollow: 17, churn: 5, attend: 30, payWithAttend: 13 }
  ];

  /* 商品行：同 range 订单/GMV/退款金额合计 = ranges 对应字段 */
  var productRows = [
    { range: "7d", name: "边界感训练营", type: "内容课", src: "内容课", channel: "content", term: "spring03", orders: 86, gmv: 42280, refundAmount: 888, refundUsers: 3, refundRate: "2.1%" },
    { range: "7d", name: "春启公开课直播带货", type: "直播", src: "直播带货", channel: "live", term: "spring03", orders: 124, gmv: 28640, refundAmount: 1146, refundUsers: 4, refundRate: "4.0%" },
    { range: "7d", name: "视频号体验课券", type: "视频号", src: "视频号", channel: "video", term: "spring03", orders: 96, gmv: 11560, refundAmount: 439, refundUsers: 4, refundRate: "3.8%" },
    { range: "7d", name: "亲子沟通精讲", type: "内容课", src: "内容课", channel: "content", term: "trial", orders: 52, gmv: 8950, refundAmount: 170, refundUsers: 1, refundRate: "1.9%" },
    { range: "7d", name: "其他商品", type: "其他", src: "其他", channel: "", term: "", orders: 70, gmv: 5000, refundAmount: 443, refundUsers: 2, refundRate: "8.9%", isOther: true },

    { range: "today", name: "边界感训练营", type: "内容课", src: "内容课", channel: "content", term: "spring03", orders: 10, gmv: 8800, refundAmount: 132, refundUsers: 0, refundRate: "1.5%" },
    { range: "today", name: "春启公开课直播带货", type: "直播", src: "直播带货", channel: "live", term: "spring03", orders: 12, gmv: 5760, refundAmount: 184, refundUsers: 0, refundRate: "3.2%" },
    { range: "today", name: "视频号体验课券", type: "视频号", src: "视频号", channel: "video", term: "spring03", orders: 15, gmv: 1810, refundAmount: 51, refundUsers: 1, refundRate: "2.8%" },
    { range: "today", name: "亲子沟通精讲", type: "内容课", src: "内容课", channel: "content", term: "trial", orders: 3, gmv: 1250, refundAmount: 0, refundUsers: 0, refundRate: "0%" },
    { range: "today", name: "其他商品", type: "其他", src: "其他", channel: "", term: "", orders: 2, gmv: 1000, refundAmount: 24, refundUsers: 0, refundRate: "2.4%", isOther: true },

    { range: "yesterday", name: "边界感训练营", type: "内容课", src: "内容课", channel: "content", term: "spring03", orders: 9, gmv: 7920, refundAmount: 158, refundUsers: 0, refundRate: "2.0%" },
    { range: "yesterday", name: "春启公开课直播带货", type: "直播", src: "直播带货", channel: "live", term: "spring03", orders: 11, gmv: 5280, refundAmount: 185, refundUsers: 0, refundRate: "3.5%" },
    { range: "yesterday", name: "视频号体验课券", type: "视频号", src: "视频号", channel: "video", term: "spring03", orders: 12, gmv: 1440, refundAmount: 43, refundUsers: 1, refundRate: "3.0%" },
    { range: "yesterday", name: "亲子沟通精讲", type: "内容课", src: "内容课", channel: "content", term: "trial", orders: 4, gmv: 1600, refundAmount: 16, refundUsers: 0, refundRate: "1.0%" },
    { range: "yesterday", name: "其他商品", type: "其他", src: "其他", channel: "", term: "", orders: 2, gmv: 1000, refundAmount: 46, refundUsers: 0, refundRate: "4.6%", isOther: true },

    { range: "30d", name: "边界感训练营", type: "内容课", src: "内容课", channel: "content", term: "spring03", orders: 280, gmv: 137200, refundAmount: 3156, refundUsers: 12, refundRate: "2.3%" },
    { range: "30d", name: "春启公开课直播带货", type: "直播", src: "直播带货", channel: "live", term: "spring03", orders: 400, gmv: 92400, refundAmount: 3788, refundUsers: 16, refundRate: "4.1%" },
    { range: "30d", name: "视频号体验课券", type: "视频号", src: "视频号", channel: "video", term: "spring03", orders: 310, gmv: 37200, refundAmount: 1339, refundUsers: 12, refundRate: "3.6%" },
    { range: "30d", name: "亲子沟通精讲", type: "内容课", src: "内容课", channel: "content", term: "trial", orders: 170, gmv: 29200, refundAmount: 584, refundUsers: 4, refundRate: "2.0%" },
    { range: "30d", name: "其他商品", type: "其他", src: "其他", channel: "", term: "", orders: 220, gmv: 16800, refundAmount: 2081, refundUsers: 4, refundRate: "12.4%", isOther: true }
  ];

  /* 直播场次明细：近7日共 18 场（已促到11 / 未促到3 / 未开播或不足4），与 ranges.liveSessions 一致 */
  var liveRows = [
    /* —— 近7日 · 已发送私域促到 11 场 —— */
    { range: "7d", id: "L01", name: "春启 03 期家长公开课", startAt: "09-03 20:00", term: "spring03", status: "ended", booked: 980, remindStatus: "已送达", remindReached: 860, inviteTarget: 980, inviteReached: 900, attend: 372, attendRate: "38%", payUsers: 42, gmv: 12600, inviteSent: true },
    { range: "7d", id: "L02", name: "今晚直播 · 复盘", startAt: "09-04 20:00", term: "spring03", status: "ended", booked: 1102, remindStatus: "已送达", remindReached: 980, inviteTarget: 1102, inviteReached: 1020, attend: 486, attendRate: "44%", payUsers: 38, gmv: 9800, inviteSent: true },
    { range: "7d", id: "L03", name: "边界感体验课", startAt: "09-02 14:30", term: "spring03", status: "ended", booked: 420, remindStatus: "已送达", remindReached: 380, inviteTarget: 420, inviteReached: 390, attend: 168, attendRate: "40%", payUsers: 22, gmv: 6400, inviteSent: true },
    { range: "7d", id: "L04", name: "亲子沟通精讲 · 晚场", startAt: "09-01 20:00", term: "spring03", status: "ended", booked: 560, remindStatus: "已送达", remindReached: 500, inviteTarget: 560, inviteReached: 520, attend: 252, attendRate: "45%", payUsers: 20, gmv: 5600, inviteSent: true },
    { range: "7d", id: "L05", name: "春启答疑专场", startAt: "09-05 20:00", term: "spring03", status: "ended", booked: 640, remindStatus: "已送达", remindReached: 580, inviteTarget: 640, inviteReached: 600, attend: 301, attendRate: "47%", payUsers: 24, gmv: 7200, inviteSent: true },
    { range: "7d", id: "L06", name: "早间家长课 · 复盘", startAt: "09-06 09:30", term: "spring03", status: "ended", booked: 310, remindStatus: "已送达", remindReached: 280, inviteTarget: 310, inviteReached: 295, attend: 155, attendRate: "50%", payUsers: 12, gmv: 3600, inviteSent: true },
    { range: "7d", id: "L07", name: "春启 04 期预热课", startAt: "09-04 15:00", term: "spring04", status: "ended", booked: 380, remindStatus: "已送达", remindReached: 340, inviteTarget: 380, inviteReached: 350, attend: 171, attendRate: "45%", payUsers: 16, gmv: 4800, inviteSent: true },
    { range: "7d", id: "L08", name: "试听公开课 · 沟通（促到）", startAt: "08-31 19:30", term: "trial", status: "ended", booked: 520, remindStatus: "已送达", remindReached: 460, inviteTarget: 520, inviteReached: 480, attend: 239, attendRate: "46%", payUsers: 15, gmv: 3900, inviteSent: true },
    { range: "7d", id: "L09", name: "边界感进阶答疑", startAt: "09-07 20:00", term: "spring03", status: "ended", booked: 290, remindStatus: "已送达", remindReached: 260, inviteTarget: 290, inviteReached: 270, attend: 145, attendRate: "50%", payUsers: 14, gmv: 4200, inviteSent: true },
    { range: "7d", id: "L10", name: "周末家长沙龙", startAt: "09-06 15:00", term: "spring03", status: "ended", booked: 450, remindStatus: "已送达", remindReached: 400, inviteTarget: 450, inviteReached: 420, attend: 216, attendRate: "48%", payUsers: 18, gmv: 5400, inviteSent: true },
    { range: "7d", id: "L11", name: "春启转化冲刺场", startAt: "09-08 20:00", term: "spring03", status: "ended", booked: 720, remindStatus: "已送达", remindReached: 650, inviteTarget: 720, inviteReached: 680, attend: 367, attendRate: "51%", payUsers: 30, gmv: 9000, inviteSent: true },
    /* —— 近7日 · 未发送/漏发 3 场 —— */
    { range: "7d", id: "L12", name: "试听公开课 · 沟通", startAt: "09-01 19:30", term: "trial", status: "ended", booked: 640, remindStatus: "已送达", remindReached: 520, inviteTarget: 0, inviteReached: 0, attend: 210, attendRate: "33%", payUsers: 18, gmv: 4200, inviteSent: false },
    { range: "7d", id: "L13", name: "午间答疑 · 未促到", startAt: "09-03 12:00", term: "spring03", status: "ended", booked: 180, remindStatus: "已送达", remindReached: 150, inviteTarget: 0, inviteReached: 0, attend: 68, attendRate: "38%", payUsers: 6, gmv: 1800, inviteSent: false },
    { range: "7d", id: "L14", name: "春启 04 引流场 · 漏发", startAt: "09-05 14:00", term: "spring04", status: "ended", booked: 260, remindStatus: "已送达", remindReached: 200, inviteTarget: 0, inviteReached: 0, attend: 104, attendRate: "40%", payUsers: 8, gmv: 2400, inviteSent: false },
    /* —— 近7日 · 未开播或数据不足 4 场 —— */
    { range: "7d", id: "L15", name: "明日直播 · 春启04 招生", startAt: "09-10 19:00", term: "spring04", status: "upcoming", booked: 420, remindStatus: "待执行", remindReached: 0, inviteTarget: 420, inviteReached: 0, attend: null, attendRate: "—", payUsers: 0, gmv: 0, inviteSent: false },
    { range: "7d", id: "L16", name: "周末公开课 · 待开播", startAt: "09-12 20:00", term: "spring03", status: "upcoming", booked: 360, remindStatus: "待执行", remindReached: 0, inviteTarget: 360, inviteReached: 0, attend: null, attendRate: "—", payUsers: 0, gmv: 0, inviteSent: false },
    { range: "7d", id: "L17", name: "试听专场 · 待开播", startAt: "09-11 19:30", term: "trial", status: "upcoming", booked: 280, remindStatus: "待执行", remindReached: 0, inviteTarget: 280, inviteReached: 0, attend: null, attendRate: "—", payUsers: 0, gmv: 0, inviteSent: false },
    { range: "7d", id: "L18", name: "数据不足场 · 中控异常", startAt: "09-02 21:00", term: "spring03", status: "ended", booked: 90, remindStatus: "已送达", remindReached: 60, inviteTarget: 90, inviteReached: 0, attend: null, attendRate: "—", payUsers: 0, gmv: 0, inviteSent: false, dataInsufficient: true },

    { range: "today", id: "L-t1", name: "春启 03 期家长公开课", startAt: "今天 20:00", time: "20:00", term: "spring03", status: "upcoming", audit: "pending", auditLabel: "待审核", wbState: "pending_audit", booked: 486, remindStatus: "待执行", remindReached: 0, inviteTarget: 1284, inviteReached: 0, attend: null, attendRate: "—", payUsers: 0, gmv: 0, inviteSent: false },
    { range: "today", id: "L-t2", name: "早间家长课 · 复盘", startAt: "今天 09:30", time: "09:30", term: "spring03", status: "ended", audit: "passed", auditLabel: "已结束", wbState: "ended", booked: 152, remindStatus: "已送达", remindReached: 140, inviteTarget: 152, inviteReached: 148, attend: 68, attendRate: "45%", payUsers: 6, gmv: 2100, inviteSent: true },
    { range: "yesterday", id: "L-y1", name: "边界感训练营 · 体验课", startAt: "昨天 14:30", term: "spring03", status: "ended", booked: 210, remindStatus: "已送达", remindReached: 190, inviteTarget: 210, inviteReached: 200, attend: 88, attendRate: "42%", payUsers: 8, gmv: 3200, inviteSent: true },
    { range: "yesterday", id: "L-y2", name: "午间答疑", startAt: "昨天 12:00", term: "trial", status: "ended", booked: 96, remindStatus: "已送达", remindReached: 80, inviteTarget: 0, inviteReached: 0, attend: 40, attendRate: "42%", payUsers: 3, gmv: 900, inviteSent: false },
    { range: "30d", id: "L-m1", name: "春启公开课合集（代表场）", startAt: "08-20~09-08", term: "spring03", status: "ended", booked: 4200, remindStatus: "已送达", remindReached: 3800, inviteTarget: 4000, inviteReached: 3600, attend: 1680, attendRate: "40%", payUsers: 180, gmv: 52000, inviteSent: true }
  ];

  /* liveSummaries 仅作 30d 等明细不全时的兜底；近7日/今日优先由 liveRows 聚合 */
  var liveSummaries = {
    "30d": { sessions: 52, sent: 32, sentAvg: "44%", miss: 8, missAvg: "36%", pending: 12, inviteLift: "+8pt", liveAttendAvg: "39%", sampleOk: true },
    "30d:spring03": { sessions: 36, sent: 24, sentAvg: "43%", miss: 5, missAvg: "35%", pending: 7, inviteLift: "+8pt", liveAttendAvg: "40%", sampleOk: true }
  };

  /* 人员切片：必须带 channel，筛选后合计与漏斗一致 */
  var staffRows = [
    /* 7d · video · 分配282 / 加微190 / 无跟进41 / 流失17 */
    { range: "7d", channel: "video", term: "spring03", name: "阮荣均", assigned: 110, wecom: 78, wecomDone: 78, followed: 96, followedPeople: 70, noFollow: 8, churn: 3 },
    { range: "7d", channel: "video", term: "spring03", name: "赵老师", assigned: 70, wecom: 48, wecomDone: 48, followed: 72, followedPeople: 38, noFollow: 10, churn: 4 },
    { range: "7d", channel: "video", term: "spring04", name: "王助教", assigned: 40, wecom: 25, wecomDone: 25, followed: 40, followedPeople: 17, noFollow: 8, churn: 4 },
    { range: "7d", channel: "video", term: "spring03", name: "李管理", assigned: 30, wecom: 20, wecomDone: 20, followed: 36, followedPeople: 15, noFollow: 5, churn: 2 },
    { range: "7d", channel: "video", term: "", name: "其他人员", assigned: 32, wecom: 19, wecomDone: 19, followed: 40, followedPeople: 9, noFollow: 10, churn: 4, isOther: true },
    /* 7d · livecode */
    { range: "7d", channel: "livecode", term: "spring03", name: "阮荣均", assigned: 40, wecom: 28, wecomDone: 28, followed: 48, followedPeople: 24, noFollow: 4, churn: 2 },
    { range: "7d", channel: "livecode", term: "spring03", name: "赵老师", assigned: 36, wecom: 22, wecomDone: 22, followed: 40, followedPeople: 18, noFollow: 4, churn: 2 },
    { range: "7d", channel: "livecode", term: "spring03", name: "其他人员", assigned: 48, wecom: 32, wecomDone: 32, followed: 50, followedPeople: 22, noFollow: 10, churn: 4, isOther: true },
    /* 7d · link */
    { range: "7d", channel: "link", term: "trial", name: "阮荣均", assigned: 30, wecom: 20, wecomDone: 20, followed: 36, followedPeople: 16, noFollow: 4, churn: 1 },
    { range: "7d", channel: "link", term: "trial", name: "其他人员", assigned: 62, wecom: 38, wecomDone: 38, followed: 55, followedPeople: 26, noFollow: 8, churn: 4, isOther: true },
    /* 7d · redbook */
    { range: "7d", channel: "redbook", term: "spring04", name: "王助教", assigned: 28, wecom: 18, wecomDone: 18, followed: 28, followedPeople: 12, noFollow: 4, churn: 2 },
    { range: "7d", channel: "redbook", term: "spring04", name: "其他人员", assigned: 24, wecom: 16, wecomDone: 16, followed: 24, followedPeople: 10, noFollow: 4, churn: 1, isOther: true },
    /* 7d · import */
    { range: "7d", channel: "import", term: "", name: "李管理", assigned: 22, wecom: 16, wecomDone: 16, followed: 28, followedPeople: 12, noFollow: 3, churn: 1 },
    { range: "7d", channel: "import", term: "", name: "其他人员", assigned: 17, wecom: 12, wecomDone: 12, followed: 20, followedPeople: 8, noFollow: 4, churn: 2, isOther: true },

    /* today · video */
    { range: "today", channel: "video", term: "spring03", name: "阮荣均", assigned: 14, wecom: 10, wecomDone: 10, followed: 12, followedPeople: 8, noFollow: 2, churn: 0 },
    { range: "today", channel: "video", term: "spring03", name: "赵老师", assigned: 10, wecom: 6, wecomDone: 6, followed: 8, followedPeople: 4, noFollow: 2, churn: 1 },
    { range: "today", channel: "video", term: "spring04", name: "其他人员", assigned: 12, wecom: 5, wecomDone: 5, followed: 6, followedPeople: 3, noFollow: 2, churn: 0, isOther: true },
    { range: "today", channel: "livecode", term: "spring03", name: "阮荣均", assigned: 8, wecom: 5, wecomDone: 5, followed: 6, followedPeople: 4, noFollow: 1, churn: 0 },
    { range: "today", channel: "livecode", term: "spring03", name: "其他人员", assigned: 8, wecom: 4, wecomDone: 4, followed: 5, followedPeople: 3, noFollow: 2, churn: 0, isOther: true },
    { range: "today", channel: "link", term: "trial", name: "赵老师", assigned: 6, wecom: 4, wecomDone: 4, followed: 5, followedPeople: 3, noFollow: 1, churn: 0 },
    { range: "today", channel: "link", term: "trial", name: "其他人员", assigned: 4, wecom: 2, wecomDone: 2, followed: 3, followedPeople: 1, noFollow: 1, churn: 1, isOther: true },
    { range: "today", channel: "redbook", term: "spring04", name: "其他人员", assigned: 6, wecom: 3, wecomDone: 3, followed: 3, followedPeople: 2, noFollow: 1, churn: 0, isOther: true },
    { range: "today", channel: "import", term: "", name: "其他人员", assigned: 4, wecom: 2, wecomDone: 2, followed: 2, followedPeople: 2, noFollow: 0, churn: 0, isOther: true },

    /* yesterday */
    { range: "yesterday", channel: "video", term: "spring03", name: "阮荣均", assigned: 16, wecom: 10, wecomDone: 10, followed: 12, followedPeople: 8, noFollow: 2, churn: 1 },
    { range: "yesterday", channel: "video", term: "spring03", name: "其他人员", assigned: 12, wecom: 6, wecomDone: 6, followed: 8, followedPeople: 4, noFollow: 2, churn: 0, isOther: true },
    { range: "yesterday", channel: "livecode", term: "spring03", name: "赵老师", assigned: 16, wecom: 10, wecomDone: 10, followed: 12, followedPeople: 8, noFollow: 2, churn: 1 },
    { range: "yesterday", channel: "link", term: "trial", name: "其他人员", assigned: 11, wecom: 6, wecomDone: 6, followed: 8, followedPeople: 4, noFollow: 2, churn: 0, isOther: true },
    { range: "yesterday", channel: "redbook", term: "spring04", name: "其他人员", assigned: 7, wecom: 4, wecomDone: 4, followed: 5, followedPeople: 3, noFollow: 1, churn: 1, isOther: true },
    { range: "yesterday", channel: "import", term: "", name: "其他人员", assigned: 6, wecom: 3, wecomDone: 3, followed: 4, followedPeople: 2, noFollow: 1, churn: 0, isOther: true },

    /* 30d */
    { range: "30d", channel: "video", term: "spring03", name: "阮荣均", assigned: 320, wecom: 210, wecomDone: 210, followed: 380, followedPeople: 180, noFollow: 30, churn: 12 },
    { range: "30d", channel: "video", term: "spring03", name: "赵老师", assigned: 280, wecom: 180, wecomDone: 180, followed: 320, followedPeople: 150, noFollow: 40, churn: 15 },
    { range: "30d", channel: "video", term: "spring04", name: "王助教", assigned: 200, wecom: 130, wecomDone: 130, followed: 220, followedPeople: 100, noFollow: 40, churn: 12 },
    { range: "30d", channel: "video", term: "", name: "其他人员", assigned: 255, wecom: 170, wecomDone: 170, followed: 280, followedPeople: 120, noFollow: 50, churn: 16, isOther: true },
    { range: "30d", channel: "livecode", term: "spring03", name: "阮荣均", assigned: 150, wecom: 100, wecomDone: 100, followed: 160, followedPeople: 80, noFollow: 20, churn: 6 },
    { range: "30d", channel: "livecode", term: "spring03", name: "其他人员", assigned: 255, wecom: 160, wecomDone: 160, followed: 240, followedPeople: 110, noFollow: 40, churn: 12, isOther: true },
    { range: "30d", channel: "link", term: "trial", name: "其他人员", assigned: 305, wecom: 200, wecomDone: 200, followed: 300, followedPeople: 140, noFollow: 45, churn: 12, isOther: true },
    { range: "30d", channel: "redbook", term: "spring04", name: "其他人员", assigned: 200, wecom: 130, wecomDone: 130, followed: 180, followedPeople: 90, noFollow: 28, churn: 8, isOther: true },
    { range: "30d", channel: "import", term: "", name: "其他人员", assigned: 125, wecom: 80, wecomDone: 80, followed: 120, followedPeople: 55, noFollow: 17, churn: 5, isOther: true }
  ];

  /* 承接时效桶：4h 内及时率 = lt1 + h1to4，需与 timelyAssignRate 一致 */
  var timingBuckets = {
    "7d": [
      { label: "< 1 小时", pct: 54, note: "健康", tone: "ok" },
      { label: "1–4 小时", pct: 32, note: "可接受", tone: "" },
      { label: "4–24 小时", pct: 9, note: "偏慢", tone: "warn" },
      { label: "> 24h / 未分", pct: 5, note: "去清理", tone: "danger" }
    ],
    today: [
      { label: "< 1 小时", pct: 50, note: "健康", tone: "ok" },
      { label: "1–4 小时", pct: 32, note: "可接受", tone: "" },
      { label: "4–24 小时", pct: 12, note: "偏慢", tone: "warn" },
      { label: "> 24h / 未分", pct: 6, note: "去清理", tone: "danger" }
    ],
    yesterday: [
      { label: "< 1 小时", pct: 52, note: "健康", tone: "ok" },
      { label: "1–4 小时", pct: 32, note: "可接受", tone: "" },
      { label: "4–24 小时", pct: 10, note: "偏慢", tone: "warn" },
      { label: "> 24h / 未分", pct: 6, note: "去清理", tone: "danger" }
    ],
    "30d": [
      { label: "< 1 小时", pct: 53, note: "健康", tone: "ok" },
      { label: "1–4 小时", pct: 32, note: "可接受", tone: "" },
      { label: "4–24 小时", pct: 10, note: "偏慢", tone: "warn" },
      { label: "> 24h / 未分", pct: 5, note: "去清理", tone: "danger" }
    ]
  };

  global.BoardData = {
    money: money,
    ranges: ranges,
    leadSlices: leadSlices,
    productRows: productRows,
    liveRows: liveRows,
    liveSummaries: liveSummaries,
    staffRows: staffRows,
    timingBuckets: timingBuckets,
    channelOptions: [
      { value: "", label: "全部渠道" },
      { value: "video", label: "视频号" },
      { value: "redbook", label: "小红书" },
      { value: "link", label: "获客链接" },
      { value: "livecode", label: "渠道活码" },
      { value: "import", label: "手动导入" }
    ],
    termOptions: [
      { value: "", label: "全部期次" },
      { value: "spring03", label: "春启 03 期" },
      { value: "spring04", label: "春启 04 期" },
      { value: "trial", label: "试听公开课" }
    ],
    srcOptions: [
      { value: "", label: "全部成交类型" },
      { value: "内容课", label: "内容课" },
      { value: "直播带货", label: "直播带货" },
      { value: "视频号", label: "视频号" },
      { value: "其他", label: "其他" }
    ]
  };
})(window);
