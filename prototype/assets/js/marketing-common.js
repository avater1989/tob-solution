/**
 * 营销工具共用运行时（用户事件营销 / 智能营销）
 * 提供：转义与 id 工具、LogicFlow 挂载、左侧节点面板渲染、
 *      通用「选择器」弹窗（程序化生成）、通用表单弹窗（创建优惠券 / 插入短链接）、
 *      以及两个营销页共用的演示数据（店铺 / 优惠券 / 人群 / 标签 / 活动 / 权益）。
 */
(function (global) {
  var MK = {};

  /* ---------------- 基础工具 ---------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  function uid(prefix) {
    return (prefix || "N") + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }
  function nowText() {
    var d = new Date();
    function p(n) { return n < 10 ? "0" + n : "" + n; }
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
      " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  MK.esc = esc;
  MK.uid = uid;
  MK.clone = clone;
  MK.nowText = nowText;

  /* ---------------- 共用演示数据 ---------------- */
  /* 渠道：按当前商家后台的微信生态口径（视频号 / 微信小店 / 小程序） */
  MK.SHOPS = [
    { id: "video", name: "视频号", items: ["星启家庭教育", "艺博家长课堂", "星启好物"] },
    { id: "wxshop", name: "微信小店", items: ["星启家庭教育小店", "艺博图书专营店", "星启家长服务店"] },
    { id: "mp", name: "小程序", items: ["星启家庭教育（C 端小程序）"] }
  ];
  MK.COUPONS = [
    { id: "CP01", face: 5, threshold: "订单满 60 元可用", from: "2026-09-01 00:00", to: "2026-12-31 23:59", received: 19000, used: 0, total: 19000 },
    { id: "CP02", face: 10, threshold: "订单满 199 元可用", from: "2026-09-01 00:00", to: "2026-12-31 23:59", received: 8600, used: 1240, total: 20000 },
    { id: "CP03", face: 2, threshold: "无门槛", from: "2026-09-10 00:00", to: "2026-10-31 23:59", received: 4200, used: 380, total: 10000 },
    { id: "CP04", face: 30, threshold: "订单满 599 元可用", from: "2026-09-15 00:00", to: "2026-12-31 23:59", received: 610, used: 92, total: 3000 }
  ];
  MK.SEGMENTS = [
    { id: "S1", name: "加微未购课用户", count: 1284, update: "例行更新（每日）" },
    { id: "S2", name: "家长必修课未购买者", count: 324, update: "例行更新（每日）" },
    { id: "S3", name: "直播预约未到课用户", count: 512, update: "例行更新（每日）" },
    { id: "S4", name: "训练营老学员", count: 57, update: "手动更新" },
    { id: "S5", name: "沉睡用户（30 天未互动）", count: 2048, update: "例行更新（每日）" },
    { id: "S6", name: "20 年 618 购买电器类目人群", count: 902, update: "手动更新" },
    { id: "S7", name: "19 年双十一购买电器类目人群", count: 764, update: "手动更新" }
  ];
  MK.TAGS = [
    { id: "T1", name: "高价值客户" },
    { id: "T2", name: "领课未加微" },
    { id: "T3", name: "直播到场" },
    { id: "T4", name: "线下已到店" },
    { id: "T5", name: "复购意向" }
  ];
  MK.ACTIVITIES = [
    { id: "A1", name: "春启 03 期开营活动" },
    { id: "A2", name: "9 月新学期家长指南领取" },
    { id: "A3", name: "亲子沟通 21 天计划招募" }
  ];
  MK.RIGHTS = [
    { id: "R1", name: "亲子沟通实用手册（资料包）" },
    { id: "R2", name: "家长必修课 · 7 天试听" },
    { id: "R3", name: "线下工作坊体验券" },
    { id: "R4", name: "满 199 减 10 优惠券" }
  ];
  MK.SMS_SIGNS = ["【星启家庭教育】", "【艺博家长课堂】", "【星启好物】"];
  MK.SMS_TAGS = ["#家长昵称#", "#家长姓名#", "#累计消费#", "#消费笔数#", "#最近下单时间#", "#已购课程#"];
  MK.LINK_TYPES = [
    { v: "shop", t: "店铺首页" },
    { v: "goods", t: "商品链接" },
    { v: "coupon", t: "优惠券" }
  ];

  /* ---------------- 弹窗基础 ---------------- */
  function mkOpen(id) {
    var m = document.getElementById(id);
    if (!m) return;
    var mask = document.getElementById(id + "-mask");
    if (mask) mask.classList.add("open");
    m.classList.add("open");
  }
  function mkClose(id) {
    var m = document.getElementById(id);
    if (m) m.classList.remove("open");
    var mask = document.getElementById(id + "-mask");
    if (mask) mask.classList.remove("open");
  }
  function mkCloseAll() {
    document.querySelectorAll(".proto-modal.open").forEach(function (m) { m.classList.remove("open"); });
    document.querySelectorAll(".proto-mask.open").forEach(function (m) { m.classList.remove("open"); });
  }
  MK.open = mkOpen;
  MK.close = mkClose;
  MK.closeAll = mkCloseAll;

  /* ---------------- 通用「选择器」弹窗（程序化生成并复用） ---------------- */
  /* cfg = { id, title, hint, width, groups:[{name, items:[{v,t,meta}]}], multi, selected, onOk } */
  function pick(cfg) {
    var id = cfg.id;
    var maskId = id + "-mask";
    var modal = document.getElementById(id);

    function itemHtml(it, checked) {
      return '<label><input type="' + (cfg.multi ? "checkbox" : "radio") + '" name="' + id + '-opt" value="' +
        esc(it.v) + '"' + (checked ? " checked" : "") + " />" +
        "<span>" + esc(it.t) + (it.meta ? ' <span class="muted" style="font-size:12px">' + esc(it.meta) + "</span>" : "") +
        "</span></label>";
    }

    function bodyHtml(values) {
      var out = "";
      (cfg.groups || []).forEach(function (g) {
        if (g.name) out += '<div class="mk-pick-group">' + esc(g.name) + "</div>";
        out += g.items.map(function (it) { return itemHtml(it, values.indexOf(it.v) >= 0); }).join("");
      });
      return out || '<p class="muted" style="font-size:12px;margin:0">暂无可选项</p>';
    }

    if (!modal) {
      document.body.insertAdjacentHTML("beforeend",
        '<div class="proto-mask" id="' + maskId + '"></div>' +
        '<div class="proto-modal" id="' + id + '" style="width:' + (cfg.width || 560) + 'px">' +
        '<div class="proto-modal-hd"><h3 style="font-size:16px;font-weight:600">' + esc(cfg.title) + "</h3>" +
        '<button type="button" class="btn btn-sm btn-ghost" data-mk-close="' + id + '">×</button></div>' +
        '<div class="proto-modal-bd">' +
        (cfg.hint ? '<p class="muted" style="margin:0 0 10px;font-size:12px;line-height:1.7">' + cfg.hint + "</p>" : "") +
        '<div class="mk-pick-list" id="' + id + '-body"></div>' +
        '<p class="mk-note" id="' + id + '-foot"></p>' +
        "</div>" +
        '<div class="proto-modal-ft">' +
        '<button class="btn" type="button" data-mk-close="' + id + '">取消</button>' +
        '<button class="btn btn-primary" type="button" id="' + id + '-ok">' + esc(cfg.okText || "确定") + "</button>" +
        "</div></div>");
      modal = document.getElementById(id);
      document.getElementById(maskId).addEventListener("click", function () { mkClose(id); });
      modal.querySelectorAll("[data-mk-close]").forEach(function (b) {
        b.addEventListener("click", function () { mkClose(id); });
      });
    } else {
      modal.querySelector(".proto-modal-hd h3").textContent = cfg.title;
      modal.querySelector(".proto-modal-bd p.muted").innerHTML = cfg.hint || "";
    }

    var selected = (cfg.multi ? (cfg.selected || []).slice() : [cfg.selected].filter(Boolean));
    var body = document.getElementById(id + "-body");
    var foot = document.getElementById(id + "-foot");

    function refresh() {
      body.innerHTML = bodyHtml(selected);
      var footMsg = cfg.multi ? ("已选 " + selected.length + " 项") : (selected.length ? "已选 1 项" : "未选择");
      foot.textContent = (cfg.footExtra ? cfg.footExtra(selected) + " · " : "") + footMsg;
      body.querySelectorAll("input").forEach(function (inp) {
        inp.addEventListener("change", function () {
          var v = inp.value;
          if (cfg.multi) {
            if (inp.checked) { if (selected.indexOf(v) < 0) selected.push(v); }
            else selected = selected.filter(function (x) { return x !== v; });
          } else {
            selected = [v];
          }
          refresh();
        });
      });
    }
    refresh();

    document.getElementById(id + "-ok").onclick = function () {
      if (!selected.length) { if (global.Proto && Proto.toast) Proto.toast("请至少选择一项"); return; }
      mkClose(id);
      if (typeof cfg.onOk === "function") cfg.onOk(cfg.multi ? selected.slice() : selected[0]);
    };
    mkOpen(id);
  }
  MK.pick = pick;

  /* 便捷封装：按 id 取名称 */
  function nameOf(list, id, key) {
    var hit = (list || []).filter(function (x) { return x.id === id; })[0];
    return hit ? hit[key || "name"] : id;
  }
  MK.nameOf = nameOf;

  /* ---------------- 通用表单弹窗（创建优惠券 / 插入短链接） ---------------- */
  var FORM_MODALS_HTML =
    '<div class="proto-mask" id="mk-modal-coupon-new-mask"></div>' +
    '<div class="proto-modal" id="mk-modal-coupon-new" style="width:520px">' +
    '<div class="proto-modal-hd"><h3 style="font-size:16px;font-weight:600">创建优惠券</h3>' +
    '<button type="button" class="btn btn-sm btn-ghost" data-mk-close="mk-modal-coupon-new">×</button></div>' +
    '<div class="proto-modal-bd">' +
    '<p class="muted" style="margin:0 0 12px;font-size:12px">优惠券属于「营销权益」，二期与营销工具一并上线；此处配置后可在触达节点中直接引用。</p>' +
    '<div class="mk-inline" style="margin-bottom:10px"><span style="font-size:13px">面额</span>' +
    '<input class="input" id="cpn-face" type="number" value="5" style="width:80px" /><span style="font-size:13px">元</span>' +
    '<select id="cpn-th" style="width:180px"><option>无门槛</option><option selected>订单满 60 元可用</option>' +
    '<option>订单满 199 元可用</option><option>订单满 599 元可用</option></select></div>' +
    '<div class="mk-inline"><span style="font-size:13px">使用时间</span>' +
    '<input class="input" id="cpn-from" type="date" value="2026-09-22" />' +
    '<span class="muted">至</span>' +
    '<input class="input" id="cpn-to" type="date" value="2026-12-31" /></div>' +
    '<label style="display:inline-flex;align-items:center;gap:6px;font-size:13px;margin-top:10px">' +
    '<input type="checkbox" id="cpn-sync" checked />创建后同步到「优惠券领取」事件可用</label>' +
    "</div>" +
    '<div class="proto-modal-ft"><button class="btn" type="button" data-mk-close="mk-modal-coupon-new">取消</button>' +
    '<button class="btn btn-primary" type="button" id="cpn-save">确定</button></div></div>' +

    '<div class="proto-mask" id="mk-modal-link-mask"></div>' +
    '<div class="proto-modal" id="mk-modal-link" style="width:600px">' +
    '<div class="proto-modal-hd"><h3 style="font-size:16px;font-weight:600">插入短链接</h3>' +
    '<button type="button" class="btn btn-sm btn-ghost" data-mk-close="mk-modal-link">×</button></div>' +
    '<div class="proto-modal-bd">' +
    '<div class="mk-sec"><div class="sh">链接类型</div>' +
    '<div class="mk-radio-row" id="lk-type">' +
    '<label><input type="radio" name="lktype" value="shop" checked />店铺首页</label>' +
    '<label><input type="radio" name="lktype" value="goods" />商品链接</label>' +
    '<label><input type="radio" name="lktype" value="coupon" />优惠券</label>' +
    "</div>" +
    '<div style="margin-top:10px" id="lk-url-row"><div class="mk-inline"><span style="font-size:13px">URL 地址</span>' +
    '<input class="input" id="lk-url" placeholder="请输入地址" style="width:380px" /></div></div>' +
    '<div style="margin-top:10px;display:none" id="lk-goods-row"><div class="mk-inline"><span style="font-size:13px">选择商品</span>' +
    '<select id="lk-goods" style="width:320px"><option>AI 学习规划入门（G001）</option>' +
    "<option>家长必修课体验价商品（G002B）</option><option>平台精选课（G-PF01）</option></select></div></div>" +
    '<div style="margin-top:10px;display:none" id="lk-coupon-row"><div class="mk-inline"><span style="font-size:13px">优惠券地址</span>' +
    '<button class="btn" type="button" id="lk-pick-coupon">选择优惠券</button>' +
    '<span class="muted" id="lk-coupon-name" style="font-size:12px">未选择</span></div></div>' +
    "</div>" +
    '<div class="mk-sec"><div class="sh">触达形式</div>' +
    '<div class="mk-radio-row">' +
    '<label><input type="radio" name="lkform" value="mini" checked />极短链（wxaurl.cn/4 位）</label>' +
    '<label><input type="radio" name="lkform" value="smart" />智能短链（wxaurl.cn/7 位）</label>' +
    "</div>" +
    '<p class="mk-note">短链接建议实时转换生成；复制粘贴的外部链接无法统计点击转化数据。</p>' +
    "</div>" +
    '<div class="mk-sec"><div class="sh">打开行为</div>' +
    '<label style="display:block;font-size:13px;margin-bottom:6px"><input type="checkbox" class="lk-beh" value="pv" checked /> 统计点击次数（PV）</label>' +
    '<label style="display:block;font-size:13px;margin-bottom:6px"><input type="checkbox" class="lk-beh" value="again" /> 二次营销</label>' +
    '<label style="display:block;font-size:13px"><input type="checkbox" class="lk-beh" value="mini" checked /> 拉起小程序打开</label>' +
    "</div></div>" +
    '<div class="proto-modal-ft"><button class="btn" type="button" data-mk-close="mk-modal-link">取消</button>' +
    '<button class="btn btn-primary" type="button" id="lk-save">确定</button></div></div>';

  function mountForms() {
    if (document.getElementById("mk-modal-link")) return;
    document.body.insertAdjacentHTML("beforeend", FORM_MODALS_HTML);
    document.querySelectorAll("[data-mk-close]").forEach(function (b) {
      b.addEventListener("click", function () { mkClose(b.getAttribute("data-mk-close")); });
    });
    document.querySelectorAll(".proto-mask").forEach(function (m) {
      m.addEventListener("click", function () {
        if (m.id && m.id.indexOf("mk-modal-") === 0) mkClose(m.id.replace(/-mask$/, ""));
      });
    });
    var syncLinkRows = function () {
      var t = (document.querySelector('input[name=lktype]:checked') || {}).value || "shop";
      var urlRow = document.getElementById("lk-url-row");
      var goodsRow = document.getElementById("lk-goods-row");
      var couponRow = document.getElementById("lk-coupon-row");
      if (urlRow) urlRow.style.display = t === "goods" || t === "coupon" ? "none" : "";
      if (goodsRow) goodsRow.style.display = t === "goods" ? "" : "none";
      if (couponRow) couponRow.style.display = t === "coupon" ? "" : "none";
    };
    document.querySelectorAll("input[name=lktype]").forEach(function (r) {
      r.addEventListener("change", syncLinkRows);
    });
    var pickCoupon = document.getElementById("lk-pick-coupon");
    if (pickCoupon) {
      pickCoupon.addEventListener("click", function () {
        pick({
          id: "mk-pick-coupon-inline",
          title: "选择优惠券",
          hint: "仅展示已创建且未过期的优惠券。",
          multi: false,
          groups: [{ items: MK.COUPONS.map(function (c) {
            return {
              v: c.id,
              t: "减 " + c.face + " 元 · " + c.threshold,
              meta: "剩余 " + (c.total - c.received)
            };
          }) }],
          onOk: function (v) {
            var c = MK.COUPONS.filter(function (x) { return x.id === v; })[0];
            document.getElementById("lk-coupon-name").textContent = c ? ("已选 " + c.id + "（满 " + c.threshold + " 减 " + c.face + " 元）") : v;
            mkOpen("mk-modal-link");
          }
        });
      });
    }
    var saveCoupon = document.getElementById("cpn-save");
    if (saveCoupon) {
      saveCoupon.addEventListener("click", function () {
        mkClose("mk-modal-coupon-new");
        if (global.Proto && Proto.toast) Proto.toast("优惠券已创建（演示）");
      });
    }
    var saveLink = document.getElementById("lk-save");
    if (saveLink) {
      saveLink.addEventListener("click", function () {
        mkClose("mk-modal-link");
        if (global.Proto && Proto.toast) Proto.toast("短链接已插入（演示）");
      });
    }
  }
  MK.mountForms = mountForms;

  /* ---------------- 触达文案弹窗（短信 / 站内信 / 企微消息共用） ---------------- */
  function openTouch(cfg) {
    mkOpen(cfg.modalId);
  }
  MK.openTouch = openTouch;

  /* ---------------- LogicFlow 挂载 ---------------- */
  /* 形状 ↔ 语义 ↔ 配色（与参考原型一致）：
     circle 开始/结束=绿 · diamond 判断=橙 · rect 动作/触达=蓝 · ellipse 等待/分析=紫。
     注意：LogicFlow 内置节点尺寸按类型固定（rect 100×80 / diamond 60×100 /
     circle 100×100 / ellipse 60×90），主题只能改配色不能改几何，文字靠 autoWrap 折行。 */
  var FLOW_THEME = {
    rect: { radius: 8, fill: "#e8f3ff", stroke: "#165dff", strokeWidth: 1.5 },
    diamond: { fill: "#fff7e6", stroke: "#ff7d00", strokeWidth: 1.5 },
    circle: { fill: "#e8ffea", stroke: "#00b42a", strokeWidth: 1.5 },
    ellipse: { fill: "#f9f0ff", stroke: "#722ed1", strokeWidth: 1.5 },
    nodeText: { fontSize: 12, color: "#1d2129", overflowMode: "autoWrap" },
    edgeText: { fontSize: 12, color: "#4e5969" }
  };

  function mountFlow(containerId, data, handlers) {
    var LF = global.LogicFlow;
    var container = document.getElementById(containerId);
    if (!container) return null;
    if (!LF) {
      container.innerHTML = '<p style="padding:24px;color:#f53f3f">LogicFlow 加载失败，请检查 CDN 网络。</p>';
      return null;
    }
    /* 必须显式给 width/height：只靠 container 时 LogicFlow 会按构造瞬间的尺寸建画布，
       容器尚未布局完成就只渲染顶部约 150px 的内容（表现为画布大面积空白）。 */
    if (!container.clientWidth || !container.clientHeight) return null;
    var lf = new LF({
      container: container,
      width: container.clientWidth,
      height: container.clientHeight,
      grid: true,
      keyboard: { enabled: true },
      edgeType: "polyline",
      stopScrollGraph: false,
      stopZoomGraph: false,
      style: FLOW_THEME
    });
    lf.render(data || { nodes: [], edges: [] });
    handlers = handlers || {};
    lf.on("node:click", function (e) { if (handlers.onNode) handlers.onNode(e.data); });
    lf.on("edge:click", function (e) { if (handlers.onEdge) handlers.onEdge(e.data); });
    lf.on("blank:click", function () { if (handlers.onBlank) handlers.onBlank(); });
    lf.on("node:drop", function () { if (handlers.onChange) handlers.onChange(); });
    lf.on("edge:add", function () { if (handlers.onChange) handlers.onChange(); });
    return lf;
  }
  function fitFlow(lf) {
    if (!lf) return;
    try { lf.resize(); } catch (e) {}
    try {
      if (typeof lf.fitView === "function") lf.fitView(60);
      else if (lf.graphModel && typeof lf.graphModel.fitView === "function") lf.graphModel.fitView(60);
    } catch (e2) {}
  }
  MK.FLOW_THEME = FLOW_THEME;
  MK.mountFlow = mountFlow;
  MK.fitFlow = fitFlow;

  /* 挂载重试：布局未就绪时按 0 尺寸建画布会导致只渲染一小条 */
  function mountFlowWhenReady(containerId, data, handlers, onReady) {
    var tries = 0;
    function attempt() {
      tries++;
      var lf = mountFlow(containerId, data, handlers);
      if (lf) { fitFlow(lf); setTimeout(function () { fitFlow(lf); }, 120); if (onReady) onReady(lf); return; }
      if (tries < 40) setTimeout(attempt, 50);
    }
    attempt();
  }
  MK.mountFlowWhenReady = mountFlowWhenReady;

  /* ---------------- 左侧节点面板 ---------------- */
  /* groups = [{ name, items:[{ type, label, color }] }] */
  function renderPalette(sel, groups, onPick) {
    var box = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (!box) return;
    box.innerHTML = groups.map(function (g) {
      return '<div class="mk-pal-group">' +
        (g.name ? '<div class="gk"><span>' + esc(g.name) + "</span>" +
          (g.extra ? '<span class="muted" style="font-size:11px">' + esc(g.extra) + "</span>" : "") + "</div>" : "") +
        '<div class="mk-pal-grid">' +
        g.items.map(function (it) {
          return '<button type="button" class="mk-pal-item" data-pal="' + esc(it.type) + '">' +
            '<span class="mk-pal-dot ' + esc(it.color || "c-action") + '"></span>' + esc(it.label) + "</button>";
        }).join("") +
        "</div></div>";
    }).join("");
    box.querySelectorAll("[data-pal]").forEach(function (b) {
      b.addEventListener("click", function () { onPick(b.getAttribute("data-pal")); });
    });
  }
  MK.renderPalette = renderPalette;

  /* ---------------- 触达弹窗（发送短信 / 企微消息，两个设计器共用） ---------------- */
  var TOUCH_MODALS_HTML =
    '<div class="proto-mask" id="mk-sms-mask"></div>' +
    '<div class="proto-modal" id="mk-sms" style="width:640px">' +
    '<div class="proto-modal-hd"><h3 style="font-size:16px;font-weight:600">发送短信</h3>' +
    '<button class="btn btn-sm btn-ghost" data-mk-close="mk-sms">×</button></div>' +
    '<div class="proto-modal-bd">' +
    '<div class="field"><label>节点名称 *</label>' +
    '<input id="mk-sms-name" placeholder="如：发送短信提醒" maxlength="20" /></div>' +
    '<div class="mk-sec"><div class="sh">短信测试</div><div class="mk-inline">' +
    '<input class="input" id="mk-sms-test" placeholder="可输入 5 个，多个号码用「，」隔开" style="width:320px" />' +
    '<button class="btn" type="button" id="mk-sms-test-send">发送测试号码</button>' +
    '<label style="font-size:13px"><input type="checkbox" id="mk-sms-join" />加入正式发送</label>' +
    "</div></div>" +
    '<div class="mk-sec"><div class="sh">短信内容</div>' +
    '<div class="mk-inline" style="margin-bottom:8px"><span style="font-size:13px">短信签名</span>' +
    '<select id="mk-sms-sign" style="width:200px"></select></div>' +
    '<textarea id="mk-sms-content" rows="4" style="width:100%;padding:8px;border:1px solid var(--color-border);border-radius:6px" placeholder="如：亲爱的#家长昵称#，现邀你加入我们的家长课堂……"></textarea>' +
    '<div class="mk-inline" style="margin-top:8px"><span class="muted" style="font-size:12px">标签：</span>' +
    '<span id="mk-sms-tags"></span>' +
    '<button class="btn" type="button" id="mk-sms-save-tpl" style="margin-left:auto">保存为模板</button></div>' +
    '<p class="mk-note" id="mk-sms-count"></p></div>' +
    '<div class="mk-sec"><div class="sh">辅助工具</div><div class="mk-inline">' +
    '<button class="btn" type="button" id="mk-sms-link">插入短链接</button>' +
    '<button class="btn" type="button" id="mk-sms-tpl">选择短信模板</button></div>' +
    '<p class="mk-note">规则：70 个字计 1 条短信，超过 70 字按 67 字每条计费；「签名」与「回 T 退订」计入字数。输入网址前后需加空格；短链接建议实时转换生成，复制粘贴的链接无法统计点击转化。</p>' +
    "</div></div>" +
    '<div class="proto-modal-ft"><button class="btn" type="button" data-mk-close="mk-sms">取消</button>' +
    '<button class="btn btn-primary" type="button" id="mk-sms-ok">确定</button></div></div>' +

    '<div class="proto-mask" id="mk-wecom-mask"></div>' +
    '<div class="proto-modal" id="mk-wecom" style="width:600px">' +
    '<div class="proto-modal-hd"><h3 style="font-size:16px;font-weight:600">发送企微消息</h3>' +
    '<button class="btn btn-sm btn-ghost" data-mk-close="mk-wecom">×</button></div>' +
    '<div class="proto-modal-bd">' +
    '<div class="field"><label>节点名称 *</label>' +
    '<input id="mk-wc-name" placeholder="如：发送专属客服消息" maxlength="20" /></div>' +
    '<div class="mk-sec"><div class="sh">消息类型</div><div class="mk-radio-row">' +
    '<label><input type="radio" name="mk-wc-type" value="act" checked />活动 / 文案 / 券</label>' +
    '<label><input type="radio" name="mk-wc-type" value="goods" />商品 / 文案 / 券</label></div>' +
    '<div class="mk-inline" style="margin-top:10px"><span style="font-size:13px">选择活动</span>' +
    '<button class="btn" type="button" id="mk-wc-pick-act">选择活动</button>' +
    '<span class="muted" id="mk-wc-act-name" style="font-size:12px">未选择</span></div>' +
    '<div class="mk-inline" style="margin-top:10px"><span style="font-size:13px">选择商品</span>' +
    '<button class="btn" type="button" id="mk-wc-pick-goods">选择商品</button>' +
    '<span class="muted" id="mk-wc-goods-name" style="font-size:12px">未选择</span></div></div>' +
    '<div class="mk-sec"><div class="sh">发送文案</div>' +
    '<textarea id="mk-wc-content" rows="3" style="width:100%;padding:8px;border:1px solid var(--color-border);border-radius:6px" placeholder="选填"></textarea>' +
    '<p class="mk-note" id="mk-wc-count">0/2000</p>' +
    '<div class="mk-inline" style="margin-top:6px"><span style="font-size:13px">跳转链接</span>' +
    '<button class="btn" type="button" id="mk-wc-link">选择链接</button>' +
    '<span style="font-size:13px;margin-left:12px">添加权益</span>' +
    '<button class="btn" type="button" id="mk-wc-right">选择权益</button>' +
    '<span class="muted" id="mk-wc-right-name" style="font-size:12px">未选择</span></div></div>' +
    "</div>" +
    '<div class="proto-modal-ft"><button class="btn" type="button" data-mk-close="mk-wecom">取消</button>' +
    '<button class="btn btn-primary" type="button" id="mk-wc-ok">确定</button></div></div>';

  var touchOnOk = { sms: null, wecom: null };
  var wcPicked = { act: "", goods: "", right: "" };

  function smsCount() {
    var v = (document.getElementById("mk-sms-content").value || "");
    var sign = document.getElementById("mk-sms-sign").value || "";
    var total = v.length + sign.length + 5; /* +「回T退订」 */
    var n = Math.max(1, Math.ceil(total / (total > 70 ? 67 : 70)));
    document.getElementById("mk-sms-count").textContent =
      "已输入 " + total + " 个字（含签名和回 T 退订），预计消耗 " + n + " 条短信计费。";
  }
  function wcCount() {
    document.getElementById("mk-wc-count").textContent =
      (document.getElementById("mk-wc-content").value || "").length + "/2000";
  }

  function mountTouchModals() {
    if (document.getElementById("mk-sms")) return;
    document.body.insertAdjacentHTML("beforeend", TOUCH_MODALS_HTML);
    document.querySelectorAll("[data-mk-close]").forEach(function (b) {
      b.addEventListener("click", function () { mkClose(b.getAttribute("data-mk-close")); });
    });

    document.getElementById("mk-sms-sign").innerHTML = MK.SMS_SIGNS.map(function (s) {
      return "<option>" + esc(s) + "</option>";
    }).join("");
    document.getElementById("mk-sms-tags").innerHTML = MK.SMS_TAGS.map(function (t) {
      return '<span class="mk-chip" style="cursor:pointer" data-mk-sms-tag="' + esc(t) + '">' + esc(t) + "</span>";
    }).join(" ");
    document.querySelectorAll("[data-mk-sms-tag]").forEach(function (c) {
      c.addEventListener("click", function () {
        document.getElementById("mk-sms-content").value += c.getAttribute("data-mk-sms-tag");
        smsCount();
      });
    });
    document.getElementById("mk-sms-content").addEventListener("input", smsCount);
    document.getElementById("mk-sms-sign").addEventListener("change", smsCount);
    document.getElementById("mk-sms-link").addEventListener("click", function () { mkOpen("mk-modal-link"); });
    document.getElementById("mk-sms-test-send").addEventListener("click", function () {
      if (!document.getElementById("mk-sms-test").value.trim()) {
        if (global.Proto && Proto.toast) Proto.toast("请输入测试号码");
        return;
      }
      if (global.Proto && Proto.toast) Proto.toast("测试短信已发送（演示）：" + document.getElementById("mk-sms-sign").value);
    });
    document.getElementById("mk-sms-save-tpl").addEventListener("click", function () {
      if (global.Proto && Proto.toast) Proto.toast("已保存为短信模板（演示）");
    });
    document.getElementById("mk-sms-tpl").addEventListener("click", function () {
      pick({
        id: "mk-pick-sms-tpl", title: "选择短信模板", multi: false,
        groups: [{ items: [
          { v: "t1", t: "开课提醒", meta: "您报名的课程即将开课…" },
          { v: "t2", t: "直播提醒", meta: "今晚 20:00 家长公开课开播…" },
          { v: "t3", t: "优惠券到账", meta: "满 200 减 50 优惠券已到账…" }
        ] }],
        onOk: function (v) {
          var map = {
            t1: "亲爱的#家长昵称#，您报名的课程即将开课，请按时参加。",
            t2: "#家长昵称# 你好，今晚 20:00 家长公开课开播，点击链接进入直播间。",
            t3: "满 200 减 50 优惠券已到账，有效期 7 天，点击链接领取。"
          };
          document.getElementById("mk-sms-content").value = map[v] || "";
          smsCount();
          mkOpen("mk-sms");
        }
      });
    });
    document.getElementById("mk-sms-ok").addEventListener("click", function () {
      var content = document.getElementById("mk-sms-content").value.trim();
      if (!content) { if (global.Proto && Proto.toast) Proto.toast("请填写短信内容"); return; }
      var out = {
        nodeName: document.getElementById("mk-sms-name").value.trim() || "发送短信",
        sign: document.getElementById("mk-sms-sign").value,
        content: content,
        summary: content.slice(0, 14) + (content.length > 14 ? "…" : "")
      };
      mkClose("mk-sms");
      if (touchOnOk.sms) touchOnOk.sms(out);
    });

    document.getElementById("mk-wc-content").addEventListener("input", wcCount);
    document.getElementById("mk-wc-pick-act").addEventListener("click", function () {
      pick({
        id: "mk-pick-act", title: "选择活动", multi: false,
        groups: [{ items: MK.ACTIVITIES.map(function (a) { return { v: a.id, t: a.name, meta: a.id }; }) }],
        onOk: function (v) {
          wcPicked.act = nameOf(MK.ACTIVITIES, v);
          document.getElementById("mk-wc-act-name").textContent = wcPicked.act;
          mkOpen("mk-wecom");
        }
      });
    });
    document.getElementById("mk-wc-pick-goods").addEventListener("click", function () {
      pick({
        id: "mk-pick-goods", title: "选择商品", multi: false,
        hint: "取自「交易 · 商品列表」中已上架的商品。",
        groups: [{ items: [
          { v: "G001", t: "AI 学习规划入门", meta: "¥199 · 已上架" },
          { v: "G002B", t: "家长必修课体验价商品", meta: "¥9.9 · 待审核" },
          { v: "G-PF01", t: "平台精选课", meta: "¥39.9 · 已上架" }
        ] }],
        onOk: function (v) {
          wcPicked.goods = v;
          document.getElementById("mk-wc-goods-name").textContent = v;
          mkOpen("mk-wecom");
        }
      });
    });
    document.getElementById("mk-wc-right").addEventListener("click", function () {
      pick({
        id: "mk-pick-right", title: "添加权益", multi: false,
        groups: [{ items: MK.RIGHTS.map(function (r) { return { v: r.id, t: r.name }; }) }],
        onOk: function (v) {
          wcPicked.right = nameOf(MK.RIGHTS, v);
          document.getElementById("mk-wc-right-name").textContent = wcPicked.right;
          mkOpen("mk-wecom");
        }
      });
    });
    document.getElementById("mk-wc-link").addEventListener("click", function () { mkOpen("mk-modal-link"); });
    document.getElementById("mk-wc-ok").addEventListener("click", function () {
      var typeKey = (document.querySelector("input[name=mk-wc-type]:checked") || {}).value || "act";
      var picked = typeKey === "act" ? wcPicked.act : wcPicked.goods;
      if (!picked) { if (global.Proto && Proto.toast) Proto.toast(typeKey === "act" ? "请选择活动" : "请选择商品"); return; }
      var out = {
        nodeName: document.getElementById("mk-wc-name").value.trim() || "发送企微消息",
        msgTypeKey: typeKey,
        msgType: typeKey === "act" ? "活动 / 文案 / 券" : "商品 / 文案 / 券",
        actName: wcPicked.act, goodsName: wcPicked.goods, rightName: wcPicked.right,
        content: document.getElementById("mk-wc-content").value.trim(),
        summary: picked
      };
      mkClose("mk-wecom");
      if (touchOnOk.wecom) touchOnOk.wecom(out);
    });

    document.querySelectorAll(".proto-mask").forEach(function (m) {
      if (m.id && /^mk-(sms|wecom)-mask$/.test(m.id)) {
        m.addEventListener("click", function () { mkClose(m.id.replace(/-mask$/, "")); });
      }
    });
  }

  /* cfg = { props, onOk } */
  function openSms(cfg) {
    mountTouchModals();
    var p = (cfg && cfg.props) || {};
    touchOnOk.sms = cfg && cfg.onOk;
    document.getElementById("mk-sms-name").value = p.nodeName || "发送短信";
    document.getElementById("mk-sms-test").value = "";
    document.getElementById("mk-sms-content").value = p.content || "";
    if (p.sign) document.getElementById("mk-sms-sign").value = p.sign;
    smsCount();
    mkOpen("mk-sms");
  }
  function openWecom(cfg) {
    mountTouchModals();
    var p = (cfg && cfg.props) || {};
    touchOnOk.wecom = cfg && cfg.onOk;
    wcPicked = { act: p.actName || "", goods: p.goodsName || "", right: p.rightName || "" };
    document.getElementById("mk-wc-name").value = p.nodeName || "发送企微消息";
    document.querySelectorAll("input[name=mk-wc-type]").forEach(function (r) {
      r.checked = r.value === (p.msgTypeKey || "act");
    });
    document.getElementById("mk-wc-content").value = p.content || "";
    document.getElementById("mk-wc-act-name").textContent = wcPicked.act || "未选择";
    document.getElementById("mk-wc-goods-name").textContent = wcPicked.goods || "未选择";
    document.getElementById("mk-wc-right-name").textContent = wcPicked.right || "未选择";
    wcCount();
    mkOpen("mk-wecom");
  }
  MK.mountTouchModals = mountTouchModals;
  MK.openSms = openSms;
  MK.openWecom = openWecom;

  /* 通用「选择人群」（用户分群） */
  function pickSegment(multi, selected, onOk) {
    pick({
      id: "mk-pick-segment",
      title: "选择用户分群",
      hint: "人群来自「SCRM · 用户运营 · 用户分群」，按条件自动计算人数。",
      multi: !!multi,
      selected: selected || (multi ? [] : ""),
      groups: [{ items: MK.SEGMENTS.map(function (s) {
        return { v: s.id, t: s.name, meta: s.count + " 人 · " + s.update };
      }) }],
      onOk: onOk
    });
  }
  MK.pickSegment = pickSegment;

  global.MarketingCommon = MK;
})(window);
