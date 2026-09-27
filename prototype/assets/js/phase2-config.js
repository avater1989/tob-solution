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
      "assets"
    ],
    ops: [
      /* 内容与审核：一期链接的 ops 端无该模块（仅 admin 端保留内容资产） */
      "content-video",
      "content-offline",
      "content-article",
      "content-tags",
      "content-teachers",
      "assess-projects",
      "assess-series",
      "assess-questions",
      "assess-results",
      "assess-report-templates",
      "agents",
      "content-tasks",
      "assess-plans",
      "audit",
      "audit-live",
      "audit-goods",
      "audit-appeal",
      /* 财务：一期保留「支付流水」（对账 / 结算 / 提现 2026-09-27 G2 已放开到一期）
       * 2026-09-27 评审标注：侧栏分组「收款与进件」标记为二期 → 整组（收款与清分 / 进件审核）二期 */
      "pay-channels",
      "onboard-audit",
      "fee-ledger",
      "settle-rules",
      /* 交易 · 商品管理：一期链接的 ops 交易仅有订单/权益/售后 */
      "platform-goods",
      "goods-edit"
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
