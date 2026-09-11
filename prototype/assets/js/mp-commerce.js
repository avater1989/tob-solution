/* C 端试看 / 购买须知 / 权益示意（原型，无真实支付） */
(function () {
  var RIGHTS_KEY = "mp_course_rights_v1";

  var CATALOG = {
    comm: {
      id: "comm",
      title: "亲子沟通基础",
      type: "series",
      typeLabel: "系列课",
      price: "199",
      lessons: 8,
      trialLesson: 1,
      trialRule: "整节试看",
      access: "付费购买",
      validity: "长期有效",
      validityStart: "支付成功即日起算",
      startHow: "支付成功后立即开通，可在「我的」进入学习",
      include: "系列课全部 8 节视频课",
      service: "可在「我的 → 账号与帮助」联系商家；售后按商家说明处理",
      cover: "../assets/img/covers/comm.jpg",
      outline: [
        { n: 1, title: "为什么孩子不听你说话", duration: "15:20", trial: true },
        { n: 2, title: "情绪先于道理", duration: "18:40" },
        { n: 3, title: "边界与规则", duration: "18:20" },
        { n: 4, title: "家庭会议怎么开", duration: "16:05" },
        { n: 5, title: "冲突后的修复对话", duration: "21:10" },
        { n: 6, title: "倾听的三种练习", duration: "14:30" },
        { n: 7, title: "表扬与鼓励怎么说", duration: "17:00" },
        { n: 8, title: "家校沟通要点", duration: "19:15" }
      ]
    },
    ticket: {
      id: "ticket",
      title: "亲子沟通 90 分钟 · 本场门票",
      type: "live",
      typeLabel: "单场直播",
      price: "19.9",
      access: "付费购买",
      validity: "本场有效",
      validityStart: "开播时生效，含结束后 48 小时回放（示意）",
      startHow: "支付成功后可进入直播间观看",
      include: "本场直播观看权（不含系列课正式课权益）",
      service: "可在「我的 → 账号与帮助」联系商家；直播门票售后以商家说明为准"
    },
    liveGoods: {
      id: "liveGoods",
      title: "亲子沟通基础",
      type: "series",
      typeLabel: "系列课",
      price: "199",
      access: "付费购买",
      validity: "长期有效",
      validityStart: "支付成功即日起算",
      startHow: "支付成功后立即开通，可返回直播间或前往学习",
      include: "系列课全部 8 节视频课",
      service: "可在「我的 → 账号与帮助」联系商家；售后按商家说明处理"
    },
    trialClaim: {
      id: "trialClaim",
      title: "家庭教育入门 9.9",
      type: "trial",
      typeLabel: "试听权益",
      price: "0",
      access: "领取开通",
      validity: "领取后 30 天",
      validityStart: "领取成功即日起算",
      startHow: "领取成功后立即开通试听权益，可前往学习",
      include: "引流体验课试听内容（非整套正式课）",
      service: "领课异常可在「我的 → 账号与帮助」联系商家"
    }
  };

  function readRights() {
    try {
      return JSON.parse(localStorage.getItem(RIGHTS_KEY) || "{}") || {};
    } catch (e) {
      return {};
    }
  }

  function writeRights(map) {
    localStorage.setItem(RIGHTS_KEY, JSON.stringify(map || {}));
  }

  function hasRights(courseId) {
    var map = readRights();
    return !!(map[courseId] && map[courseId].valid);
  }

  function grantRights(courseId, meta) {
    var map = readRights();
    map[courseId] = Object.assign(
      {
        valid: true,
        grantedAt: new Date().toISOString(),
        source: "pay"
      },
      meta || {}
    );
    writeRights(map);
  }

  function ensureMask() {
    var mask = document.getElementById("mp-sheet-mask");
    if (!mask) {
      mask = document.createElement("div");
      mask.id = "mp-sheet-mask";
      mask.className = "mp-sheet-mask";
      document.body.appendChild(mask);
      mask.addEventListener("click", function () {
        closeSheets();
      });
    }
    return mask;
  }

  function closeSheets() {
    var mask = document.getElementById("mp-sheet-mask");
    if (mask) mask.classList.remove("open");
    document.querySelectorAll(".mp-sheet.open").forEach(function (el) {
      el.classList.remove("open");
    });
  }

  function noticeLines(item) {
    return [
      { k: "权益类型", v: item.typeLabel },
      { k: "包含内容", v: item.include },
      { k: "开课方式", v: item.startHow },
      { k: "有效期", v: item.validity + "（" + item.validityStart + "）" },
      { k: "获取方式", v: item.access },
      { k: "客服 / 售后", v: item.service }
    ];
  }

  function openBuyNotice(opts) {
    opts = opts || {};
    var item = CATALOG[opts.catalogId] || CATALOG.comm;
    var isClaim = item.type === "trial";
    var title = isClaim ? "领取须知" : "购买须知";
    var cta = isClaim
      ? "确认领取"
      : "确认购买 ¥" + (opts.price || item.price);
    var sheetId = "mp-buy-notice";
    var sheet = document.getElementById(sheetId);
    if (!sheet) {
      sheet = document.createElement("div");
      sheet.id = sheetId;
      sheet.className = "mp-sheet";
      document.body.appendChild(sheet);
    }

    var lines = noticeLines(item)
      .map(function (row) {
        return (
          '<div class="mp-notice-row"><span class="k">' +
          row.k +
          "</span><span class=\"v\">" +
          row.v +
          "</span></div>"
        );
      })
      .join("");

    sheet.innerHTML =
      '<div class="mp-sheet-hd">' +
      "<div>" +
      '<div class="mp-sheet-title">' +
      title +
      "</div>" +
      '<div class="mp-sheet-sub">' +
      item.typeLabel +
      " · " +
      item.title +
      "</div>" +
      "</div>" +
      '<button type="button" class="mp-sheet-x" data-close-sheet aria-label="关闭">×</button>' +
      "</div>" +
      '<div class="mp-sheet-bd">' +
      '<div class="mp-notice-box">' +
      lines +
      "</div>" +
      '<p class="mp-notice-tip">原型示意：不接入真实支付，确认后进入支付结果演示。</p>' +
      "</div>" +
      '<div class="mp-sheet-ft">' +
      '<button type="button" class="mp-btn mp-btn-outline" data-close-sheet style="flex:1">取消</button>' +
      '<button type="button" class="mp-btn" id="mp-buy-confirm" style="flex:1.4">' +
      cta +
      "</button>" +
      "</div>";

    ensureMask().classList.add("open");
    sheet.classList.add("open");

    sheet.querySelectorAll("[data-close-sheet]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        closeSheets();
        if (typeof opts.onCancel === "function") opts.onCancel();
      });
    });

    document.getElementById("mp-buy-confirm").addEventListener("click", function () {
      closeSheets();
      if (typeof opts.onConfirm === "function") {
        opts.onConfirm(item);
        return;
      }
      var q = new URLSearchParams();
      q.set("from", opts.from || item.type);
      q.set("catalog", item.id);
      q.set("status", "success");
      if (opts.returnUrl) q.set("return", opts.returnUrl);
      if (opts.course) q.set("course", opts.course);
      if (opts.lesson) q.set("lesson", String(opts.lesson));
      location.href = "pay-result.html?" + q.toString();
    });
  }

  function openTrialEndPrompt(opts) {
    opts = opts || {};
    var sheetId = "mp-trial-end";
    var sheet = document.getElementById(sheetId);
    if (!sheet) {
      sheet = document.createElement("div");
      sheet.id = sheetId;
      sheet.className = "mp-sheet";
      document.body.appendChild(sheet);
    }
    var course = opts.course || "comm";
    var item = CATALOG[course] || CATALOG.comm;
    sheet.innerHTML =
      '<div class="mp-sheet-hd">' +
      "<div>" +
      '<div class="mp-sheet-title">试看已结束</div>' +
      '<div class="mp-sheet-sub">解锁全部 ' +
      item.lessons +
      " 节，继续系统学习</div>" +
      "</div>" +
      '<button type="button" class="mp-sheet-x" data-close-sheet aria-label="关闭">×</button>' +
      "</div>" +
      '<div class="mp-sheet-bd">' +
      '<div class="mp-notice-box">' +
      '<div class="mp-notice-row"><span class="k">试看规则</span><span class="v">第 ' +
      item.trialLesson +
      " 节整节可试看</span></div>" +
      '<div class="mp-notice-row"><span class="k">未解锁</span><span class="v">第 2–' +
      item.lessons +
      " 节需购买后学习</span></div>" +
      "</div>" +
      "</div>" +
      '<div class="mp-sheet-ft">' +
      '<button type="button" class="mp-btn mp-btn-outline" id="mp-trial-stay" style="flex:1">继续试看</button>' +
      '<button type="button" class="mp-btn" id="mp-trial-buy" style="flex:1.4">立即购买 ¥' +
      item.price +
      "</button>" +
      "</div>";

    ensureMask().classList.add("open");
    sheet.classList.add("open");

    sheet.querySelectorAll("[data-close-sheet]").forEach(function (btn) {
      btn.addEventListener("click", closeSheets);
    });
    document.getElementById("mp-trial-stay").addEventListener("click", closeSheets);
    document.getElementById("mp-trial-buy").addEventListener("click", function () {
      closeSheets();
      openBuyNotice({
        catalogId: course,
        from: "course",
        course: course,
        lesson: opts.lesson || item.trialLesson,
        returnUrl:
          opts.returnUrl ||
          "learn.html?course=" +
            encodeURIComponent(course) +
            "&lesson=" +
            (opts.nextLesson || 2),
        onCancel: function () {
          if (typeof opts.onBuyCancel === "function") opts.onBuyCancel();
        }
      });
    });
  }

  window.MpCommerce = {
    CATALOG: CATALOG,
    hasRights: hasRights,
    grantRights: grantRights,
    readRights: readRights,
    openBuyNotice: openBuyNotice,
    openTrialEndPrompt: openTrialEndPrompt,
    closeSheets: closeSheets,
    qs: function () {
      return new URLSearchParams(location.search);
    }
  };
})();
