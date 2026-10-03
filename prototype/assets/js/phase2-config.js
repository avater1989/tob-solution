/* 一期/二期 开关配置：黑名单单一事实源
 * 基准：协作者一期原型 https://tob-solution-minimmvp.vercel.app/
 * 口径：本地侧栏菜单中「一期链接没有的项」→ 二期，受顶部「二期」开关控制（默认隐藏）
 * items 按端分桶（admin / ops / mp），值为各 shell sidebars 里的 link id
 * localStorage 记住用户选择，缺省隐藏二期
 * 差异与待确认项见 docs/phase2-checklist.md
 */
window.ProtoPhase2 = (function () {
  var KEY = "proto-phase2";
  var items = {
    admin: [
      /* SCRM · 用户运营（一期链接已无「用户运营」分组） */
      "event-marketing",
      "smart-marketing",
      "user-segments",
      "ops-plans",
      /* 内容 · 测评中心（一期链接的 content 模块仅有「内容资产」5 项） */
      "assess-projects",
      "assess-series",
      "assess-questions",
      "assess-results",
      "assess-report-templates",
      /* 内容 · 学习服务 */
      "agents",
      "content-tasks",
      "assess-plans",
      /* 交易 · 资产管理：仅「资产总览」为二期
       * 2026-09-27 评审标注：对账管理 / 结算单 / 提现管理 取消二期标识（改为一期） */
      "assets",
      /* 数据 · 数据分析（2026-10-02 评审标注）：除「经营总览」「期次复盘」外的 4 个视角标记为二期 */
      "board-a",
      "board-content",
      "board-c",
      "board-p"
    ],
    ops: [
      /* 2026-10-02 评审标注（本轮）：
       * 1) 「套餐管理」标记为二期
       * 2) 「内容与审核」整个模块所有页面标记为二期
       * 3) 「交易」模块：订单列表移至「财务」并保留一期，其余内容（权益开通记录 / 平台商品 /
       *    新建商品 / 退款与权益回收）全部标记为二期
       * 4) 「数据」模块：除「商家经营」外全部标记为二期 */
      /* 套餐管理 */
      "plans",
      /* 内容与审核：内容资产 */
      "content-video",
      "content-offline",
      "content-article",
      "content-tags",
      "content-teachers",
      /* 内容与审核：测评中心 */
      "assess-projects",
      "assess-series",
      "assess-questions",
      "assess-results",
      "assess-report-templates",
      /* 内容与审核：学习服务 */
      "agents",
      "content-tasks",
      "assess-plans",
      /* 内容与审核：审核 */
      "audit",
      "audit-live",
      "audit-goods",
      "audit-appeal",
      /* 交易：除「订单列表」（已移至财务）外的全部内容 */
      "entitlement",
      "platform-goods",
      "goods-edit",
      "aftersales",
      /* 数据：除「商家经营」（data-merchant）外的全部视角 */
      "data",
      "data-acquire",
      "data-content",
      "data-trade",
      "data-customer",
      "data-term",
      "data-health",
      /* 财务：一期保留「支付流水」（对账 / 结算 / 提现 2026-09-27 G2 已放开到一期）
       * 2026-09-27 评审标注：侧栏分组「收款与进件」标记为二期 → 整组（收款与清分 / 进件审核）二期 */
      "pay-channels",
      "onboard-audit",
      "fee-ledger",
      "settle-rules"
    ],
    mp: []
  };

  function enabled() {
    try {
      return localStorage.getItem(KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function setEnabled(v) {
    try {
      localStorage.setItem(KEY, v ? "1" : "0");
    } catch (e) {}
  }

  function isPhase2(scope, id) {
    var list = items[scope] || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i] === id) return true;
    }
    return false;
  }

  return { KEY: KEY, items: items, enabled: enabled, setEnabled: setEnabled, isPhase2: isPhase2 };
})();
