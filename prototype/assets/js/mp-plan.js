/* C 端小程序 · 定制化计划（共享数据）
   首页细长条入口与定制化计划页共用；active=false 时首页不展示入口（特定条件下才出现）
   演示切换：首页 URL 加 ?plan=0 可隐藏入口 */
window.MpPlan = (function () {
  var params = new URLSearchParams(location.search);
  var active = params.get("plan") !== "0";

  var plan = {
    id: "MPL1",
    name: "亲子沟通 21 天训练营计划",
    desc: "由老师为你定制的测评 + 学习计划",
    deadline: "9 月 20 日前完成",
    current: 2,
    total: 4,
    steps: [
      { name: "亲子沟通能力测评", meta: "12 题 · 约 6 分钟", state: "done" },
      { name: "家庭教育风格测评", meta: "8 题 · 约 5 分钟", state: "done" },
      { name: "情绪调节问卷", meta: "5 题 · 约 3 分钟", state: "cur" },
      { name: "学习效果复盘测评", meta: "10 题 · 约 5 分钟", state: "todo" }
    ]
  };

  return { active: active, plan: plan };
})();
