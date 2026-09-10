/**
 * 直播中控台：单画布布局 + 右侧现场操作区
 */
(function (global) {
  function toast(msg) {
    if (global.Proto && Proto.toast) Proto.toast(msg);
  }

  var CATALOG = [
    { id: "P1", name: "春启 03 期正式课", price: 1999, stock: "库存充足" },
    { id: "P2", name: "答疑加餐包", price: 99, stock: "库存 86" },
    { id: "P3", name: "试听课券", price: 9.9, stock: "库存充足" },
    { id: "P4", name: "亲子沟通精讲", price: 199, stock: "库存 12" }
  ];
  var QUICK_REPLIES = [
    "欢迎进入直播间",
    "课程链接已放在购物车",
    "支持直播结束后观看回放",
    "具体问题稍后统一解答"
  ];
  var LAYOUT_LABEL = { single: "单画面", pip: "画中画", dual: "双画面" };

  function nowLabel() {
    var d = new Date();
    function p(n) { return n < 10 ? "0" + n : "" + n; }
    return p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
  }

  function cloneCanvas(c) {
    return {
      layout: c.layout,
      a: c.a,
      b: c.b,
      text: c.text
    };
  }

  function sameCanvas(x, y) {
    return x.layout === y.layout && x.a === y.a && x.b === y.b && x.text === y.text;
  }

  function boot(opts) {
    var live = opts.live;
    var controlMode = opts.mode;
    var sim = opts.sim || {};
    var page = opts.page;
    var currentLiveId = live.liveId;
    var living = controlMode === "living";
    var demoMode = !!opts.demo;
    try {
      if (!demoMode) demoMode = new URLSearchParams(location.search).get("demo") === "1";
    } catch (e) {}
    if (demoMode) document.body.classList.add("demo-on");

    var published = living
      ? { layout: "single", a: "摄像头", b: null, text: null }
      : { layout: "single", a: null, b: null, text: null };
    var preview = cloneCanvas(published);

    var state = {
      preview: preview,
      published: published,
      pendingPublish: false,
      pendingReplace: null,
      micConnected: living,
      micMuted: false,
      micLevel: living ? 62 : 0,
      camConnected: living,
      camOn: living,
      netOk: true,
      videoOk: true,
      audioOk: living,
      imOk: true,
      healthLevel: "ok",
      alerts: [],
      explainingId: null,
      products: [],
      comments: [],
      pendingAudit: [],
      filter: "all",
      qaSubFilter: "unanswered",
      auditMode: false,
      pinnedId: null,
      nextCommentId: 1,
      coupon: { status: "idle", name: "" },
      announce: { status: "idle", text: "" },
      marquee: { status: "idle", text: "" },
      pendingAction: null,
      replyToId: null,
      simIndex: 0,
      unreadCount: 0,
      stickToBottom: true,
      interactScrollTop: 0,
      productScrollTop: 0,
      toolsScrollTop: 0,
      pendingMarkAnswerId: null,
      activeTab: "interact",
      updating: false
    };

    var mountedCatalog = {};
    if (sim.products && sim.products.length) {
      state.products = sim.products.map(function (p, i) {
        var cid = "P" + (i + 1);
        mountedCatalog[cid] = true;
        return {
          id: "M" + (i + 1),
          catalogId: cid,
          name: p.name || ("商品" + (i + 1)),
          price: p.price || 0,
          stock: CATALOG[i] ? CATALOG[i].stock : "库存充足",
          mounted: true,
          order: i
        };
      });
      if (living && state.products.length) state.explainingId = state.products[0].id;
    }
    CATALOG.forEach(function (c, i) {
      if (mountedCatalog[c.id]) return;
      state.products.push({
        id: "U" + c.id,
        catalogId: c.id,
        name: c.name,
        price: c.price,
        stock: c.stock,
        mounted: false,
        order: 100 + i
      });
    });

    if (living) {
      seedRichComments(live, sim);
    }

    function seedRichComments(live, sim) {
      var teacher = live.teacher || "阮荣均";
      var base = (sim.messages || []).map(function (m, i) {
        var isQA = /吗|怎么|多少|？|\?/.test(m.text || "");
        return {
          id: i + 1,
          name: m.name,
          role: "user",
          kind: "chat",
          color: m.color || "#165dff",
          time: i === 0 ? "刚刚" : (i + " 分钟前"),
          text: m.text,
          isQA: isQA,
          answered: isQA && i === 0,
          pupil: /妈妈|爸爸|学员/.test(m.name || "") && i % 2 === 0,
          hidden: false,
          muted: false,
          blocked: false,
          replyTo: null,
          isNew: false
        };
      });
      /* enrich with teacher replies, system/order events for fuller demo */
      var extra = [
        {
          id: 1001, name: "系统", role: "system", kind: "join", color: "#86909c",
          time: "8 分钟前", text: "李爸爸 进入了直播间", joinNames: ["李爸爸"], isQA: false, pupil: false,
          hidden: false, muted: false, blocked: false, replyTo: null, answered: false
        },
        {
          id: 1008, name: "系统", role: "system", kind: "join", color: "#86909c",
          time: "8 分钟前", text: "周妈妈 进入了直播间", joinNames: ["周妈妈"], isQA: false, pupil: false,
          hidden: false, muted: false, blocked: false, replyTo: null, answered: false
        },
        {
          id: 1009, name: "系统", role: "system", kind: "join", color: "#86909c",
          time: "7 分钟前", text: "钱爸爸 进入了直播间", joinNames: ["钱爸爸"], isQA: false, pupil: false,
          hidden: false, muted: false, blocked: false, replyTo: null, answered: false
        },
        {
          id: 1002, name: teacher, role: "teacher", kind: "chat", color: "#165dff",
          time: "6 分钟前", text: "家长们好，今天重点解答入学准备和选课问题，有疑问可以直接发问答。",
          isQA: false, pupil: false, hidden: false, muted: false, blocked: false, replyTo: null, answered: false
        },
        {
          id: 1003, name: teacher, role: "teacher", kind: "chat", color: "#165dff",
          time: "4 分钟前", text: "@张妈妈 今天主要讲春启课程安排和报名方式，稍后购物车会挂正式课。",
          isQA: false, pupil: false, hidden: false, muted: false, blocked: false, answered: false,
          replyTo: { name: "张妈妈", text: "老师今天讲什么？" }
        },
        {
          id: 1004, name: "系统", role: "system", kind: "order", color: "#fa8c16",
          time: "3 分钟前", text: "周妈妈 下单了「正式课」· ¥1999", isQA: false, pupil: false,
          hidden: false, muted: false, blocked: false, replyTo: null, answered: false
        },
        {
          id: 1005, name: teacher, role: "teacher", kind: "chat", color: "#165dff",
          time: "2 分钟前", text: "支持回放。直播结束后可在「直播回放」查看完整内容。",
          isQA: false, pupil: false, hidden: false, muted: false, blocked: false, answered: false,
          replyTo: { name: "刘爸爸", text: "支持回放吗？" }
        },
        {
          id: 1006, name: "赵助教", role: "teacher", kind: "chat", color: "#722ed1",
          time: "1 分钟前", text: "8 岁可以听懂。正式课会按年龄分班，试听课也能先体验。",
          isQA: false, pupil: false, hidden: false, muted: false, blocked: false, answered: false,
          replyTo: { name: "陈妈妈", text: "孩子 8 岁，能听懂吗？" }
        }
      ];
      state.comments = base.concat(extra).sort(function (a, b) { return b.id - a.id; });
      /* mark related QA as answered when teacher already replied in seed */
      state.comments.forEach(function (c) {
        if (c.isQA && (c.text === "老师今天讲什么？" || c.text === "支持回放吗？" || c.text === "孩子 8 岁，能听懂吗？")) {
          c.answered = true;
        }
      });
      state.comments.push({
        id: 1007, name: "路过用户", role: "user", kind: "chat", color: "#86909c",
        time: "5 分钟前", text: "（已隐藏样例）这条广告评论已被隐藏，可点恢复。",
        isQA: false, pupil: false, hidden: true, muted: false, blocked: false, replyTo: null, answered: false
      });
      state.pendingAudit = [
        {
          id: 2001, name: "新进家长", role: "user", kind: "chat", color: "#00b42a",
          time: "刚刚", text: "老师，今晚优惠券还能领吗？领了怎么用？",
          isQA: true, answered: false, pupil: false, hidden: false, muted: false, blocked: false, replyTo: null
        },
        {
          id: 2002, name: "试听用户", role: "user", kind: "chat", color: "#fa8c16",
          time: "刚刚", text: "能不能再便宜一点？有没有团购价？",
          isQA: true, answered: false, pupil: false, hidden: false, muted: false, blocked: false, replyTo: null
        }
      ];
      state.nextCommentId = 3000;
      state.pinnedId = 1002;
    }

    var mask = document.getElementById("mask");
    function closeAll() {
      if (mask) mask.classList.remove("open");
      document.querySelectorAll(".proto-modal").forEach(function (n) { n.classList.remove("open"); });
      state.pendingAction = null;
      state.pendingReplace = null;
    }
    function openModal(id) {
      if (mask) mask.classList.add("open");
      var n = document.getElementById(id);
      if (n) n.classList.add("open");
    }
    if (mask) mask.addEventListener("click", closeAll);
    document.querySelectorAll("[data-close]").forEach(function (n) {
      n.addEventListener("click", closeAll);
    });

    function requireLiving(label) {
      if (living) return true;
      toast((label || "该操作") + "仅直播中可用");
      return false;
    }

    /* chrome */
    var liveIdEl = document.getElementById("ctrl-live-id");
    if (liveIdEl) liveIdEl.textContent = "ID " + live.liveId;
    var updateLabel = document.getElementById("btn-update-label");
    if (updateLabel) updateLabel.textContent = living ? "更新直播画面" : "应用到预览";
    var durationPill = document.getElementById("ctrl-duration-pill");
    if (durationPill && living) {
      durationPill.style.display = "inline-flex";
      var elapsed = sim.elapsedSec || 54 * 60 + 22;
      setInterval(function () {
        elapsed++;
        var h = Math.floor(elapsed / 3600);
        var m = Math.floor((elapsed % 3600) / 60);
        var s = elapsed % 60;
        function p(n) { return n < 10 ? "0" + n : "" + n; }
        var el = document.getElementById("ctrl-duration");
        if (el) el.textContent = p(h) + ":" + p(m) + ":" + p(s);
      }, 1000);
    }
    if (living) {
      var set = function (id, v) {
        var el = document.getElementById(id);
        if (el) el.textContent = v;
      };
      set("m-online", sim.viewers || 0);
      set("m-enter", (sim.viewers || 0) + 42);
      set("m-buyers", sim.buyers || 0);
      set("m-gmv", "¥" + (sim.gmv || 0));
    }

    function layoutIncomplete(c) {
      c = c || state.preview;
      if (c.layout === "pip" && c.a && !c.b) return "请添加小窗媒体源";
      if (c.layout === "dual" && c.a && !c.b) return "请添加第二个媒体源";
      if ((c.layout === "pip" || c.layout === "dual") && !c.a && c.b) return "请添加主内容媒体源";
      return "";
    }

    function hasPreviewMedia(c) {
      c = c || state.preview;
      return !!(c.a || c.b || c.text);
    }

    function updateActionButtons() {
      var btnUpdate = document.getElementById("btn-update");
      var btnClear = document.getElementById("btn-clear-canvas");
      var btnAbandon = document.getElementById("btn-abandon");
      var incomplete = layoutIncomplete();
      var hasMedia = hasPreviewMedia();

      if (btnClear) btnClear.disabled = !hasMedia;

      if (btnAbandon) {
        btnAbandon.style.display = (living && state.pendingPublish) ? "inline-flex" : "none";
      }

      if (btnUpdate) {
        if (state.updating) {
          btnUpdate.disabled = true;
        } else if (living) {
          btnUpdate.disabled = !state.pendingPublish || !!incomplete || (!state.preview.a && !state.preview.text);
        } else {
          btnUpdate.disabled = !hasMedia;
        }
      }
      refreshStartGate();
    }

    function startUnmetList() {
      var list = [];
      if (!state.preview.a && !state.preview.text) list.push("未添加直播画面");
      var incomplete = layoutIncomplete();
      if (incomplete) list.push(incomplete);
      if (!state.micConnected || state.micMuted || !state.audioOk) list.push("麦克风未连接");
      if (!state.netOk || state.healthLevel === "error") list.push("网络或推流状态异常");
      if (!state.imOk) list.push("互动服务未就绪");
      return list;
    }

    function refreshStartGate() {
      if (living) return;
      var btn = document.getElementById("btn-start-live");
      var hint = document.getElementById("ctrl-start-hint");
      var unmet = startUnmetList();
      if (btn) btn.disabled = unmet.length > 0;
      if (hint) {
        if (unmet.length) {
          hint.style.display = "inline";
          hint.textContent = unmet.length + "项开播条件未满足";
          hint.title = unmet.join("；");
        } else {
          hint.style.display = "none";
          hint.textContent = "";
        }
      }
    }

    function paintLiveOverlays() {
      var ann = document.getElementById("lf-announce");
      var coupon = document.getElementById("lf-coupon");
      var prod = document.getElementById("lf-product");
      var mq = document.getElementById("lf-marquee");
      if (ann) {
        if (living && state.announce.status === "active" && state.announce.text) {
          ann.style.display = "block";
          ann.textContent = state.announce.text;
        } else {
          ann.style.display = "none";
        }
      }
      if (coupon) {
        if (living && state.coupon.status === "active") {
          coupon.style.display = "block";
          coupon.innerHTML = "<b>优惠券</b>" + (state.coupon.name || "直播间领取");
        } else {
          coupon.style.display = "none";
        }
      }
      if (prod) {
        var p = null;
        if (living && state.explainingId) {
          state.products.forEach(function (x) { if (x.id === state.explainingId) p = x; });
        }
        if (p) {
          prod.style.display = "block";
          prod.innerHTML = '<span class="tag">讲解中</span>正在讲解：' + p.name + "　¥" + p.price;
        } else {
          prod.style.display = "none";
        }
      }
      if (mq) {
        if (living && (state.marquee.status === "active" || state.marquee.status === "paused") && state.marquee.text) {
          mq.style.display = "block";
          mq.className = "lf-marquee" + (state.marquee.status === "paused" ? " is-paused" : "");
          mq.textContent = (state.marquee.status === "paused" ? "已暂停 · " : "") + state.marquee.text;
        } else {
          mq.style.display = "none";
        }
      }
    }

    function markDirty() {
      if (living) {
        state.pendingPublish = !sameCanvas(state.preview, state.published);
      } else {
        state.pendingPublish = false;
      }
      paintCanvas();
    }

    function paneHtml(name, role) {
      if (!name) {
        return '<div class="lf-placeholder">' +
          (role === "pip" ? "请添加小窗媒体源" :
            role === "right" ? "请添加第二个媒体源" :
              role === "left" ? "请添加左侧媒体源" : "请添加媒体源") +
          "</div>";
      }
      return '<div class="lf-pane"><b>' + name + "</b><div class=\"sub\">" +
        (role === "pip" ? "小窗" : role === "left" ? "左画面" : role === "right" ? "右画面" : "主内容") +
        "</div></div>";
    }

    function paintCanvas() {
      var c = state.preview;
      var frame = document.getElementById("ctrl-live-frame");
      var body = document.getElementById("ctrl-frame-body");
      var mode = document.getElementById("ctrl-canvas-mode");
      var sub = document.getElementById("ctrl-canvas-sub");
      var layoutChip = document.getElementById("ctrl-layout-chip");
      var foot = document.getElementById("ctrl-foot-info");
      var swapBtn = document.getElementById("btn-swap-slots");
      var incomplete = layoutIncomplete(c);

      if (frame) {
        frame.className = "ctrl-live-frame lf-layout-" + c.layout;
      }
      if (body) {
        var html = "";
        if (c.layout === "single") {
          html = c.a
            ? '<div class="lf-main">' + paneHtml(c.a, "main") + "</div>"
            : '<div class="lf-empty">直播画面<br/><span class="sub">请从左侧添加媒体源</span></div>';
        } else if (c.layout === "pip") {
          html = '<div class="lf-main">' + paneHtml(c.a || null, "main") + "</div>" +
            '<div class="lf-pip">' + paneHtml(c.b || null, "pip") + "</div>";
        } else {
          html = '<div class="lf-left">' + paneHtml(c.a || null, "left") + "</div>" +
            '<div class="lf-right">' + paneHtml(c.b || null, "right") + "</div>";
        }
        if (c.text) {
          html += '<div class="lf-text-overlay">' + c.text + "</div>";
        }
        body.innerHTML = html;
      }
      paintLiveOverlays();

      if (mode && sub) {
        if (!living) {
          mode.textContent = "预览模式";
          sub.textContent = incomplete || (hasPreviewMedia(c) ? "预览可应用到开播准备" : "当前画面尚未直播");
          sub.className = "ctrl-canvas-chip" + (incomplete ? " is-warn" : "");
        } else if (state.pendingPublish) {
          mode.textContent = "预览有更新";
          sub.textContent = incomplete || "尚未更新到直播间";
          sub.className = "ctrl-canvas-chip is-warn";
        } else {
          mode.textContent = "直播中";
          sub.textContent = "画面已同步";
          sub.className = "ctrl-canvas-chip";
        }
      }
      if (layoutChip) layoutChip.textContent = "布局：" + (LAYOUT_LABEL[c.layout] || c.layout);
      if (foot) {
        if (incomplete) {
          foot.textContent = incomplete;
        } else {
          var parts = [];
          if (c.a) parts.push(c.a);
          if (c.b) parts.push(c.b);
          if (c.text) parts.push("文字覆盖");
          foot.textContent = parts.length ? ("当前：" + parts.join(" · ")) : "未添加媒体源";
        }
      }
      if (swapBtn) {
        swapBtn.style.display = (c.layout !== "single" && c.a && c.b) ? "inline-flex" : "none";
      }
      renderSlotList();
      updateActionButtons();
    }

    function renderSlotList() {
      var list = document.getElementById("ctrl-slot-list");
      if (!list) return;
      var c = state.preview;
      var rows = [];
      if (c.a) {
        rows.push({ key: "a", label: c.layout === "dual" ? "左画面" : "主内容", name: c.a });
      }
      if (c.b) {
        rows.push({ key: "b", label: c.layout === "pip" ? "小窗" : "右画面", name: c.b });
      }
      if (c.text) {
        rows.push({ key: "text", label: "文字覆盖", name: c.text.slice(0, 12) });
      }
      if (!rows.length) {
        list.innerHTML = '<div class="muted" style="font-size:12px">暂无</div>';
        return;
      }
      list.innerHTML = rows.map(function (r) {
        return '<div class="ctrl-slot-row"><span>' + r.label + " · " + r.name +
          '</span><button type="button" data-rm="' + r.key + '">移除</button></div>';
      }).join("");
      list.querySelectorAll("[data-rm]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var key = btn.getAttribute("data-rm");
          if (key === "text") state.preview.text = null;
          else if (key === "a") {
            state.preview.a = state.preview.b;
            state.preview.b = null;
            if (state.preview.layout !== "single" && !state.preview.a) {
              /* keep layout */
            }
          } else if (key === "b") {
            state.preview.b = null;
          }
          if (state.preview.layout === "pip" && !state.preview.b && state.preview.a) {
            toast("小窗已移除");
          }
          markDirty();
          toast("已移除媒体源");
        });
      });
    }

    function addMediaSource(name) {
      if (name === "文字") {
        state.preview.text = "欢迎进入直播间 · 课程优惠今晚有效";
        if (name.indexOf) { /* noop */ }
        markDirty();
        toast("已添加文字覆盖");
        return;
      }
      if (name === "摄像头" || name === "屏幕共享") {
        state.camConnected = true;
        state.camOn = true;
        syncDeviceUI();
      }
      var c = state.preview;
      if (c.layout === "single") {
        if (c.a && c.a !== name) {
          state.pendingReplace = name;
          var nm = document.getElementById("replace-source-name");
          if (nm) nm.textContent = name;
          var tx = document.getElementById("replace-source-text");
          if (tx) {
            tx.textContent = "是否使用「" + name + "」替换当前「" + c.a + "」画面？";
          }
          openModal("modal-replace-source");
          return;
        }
        c.a = name;
        c.b = null;
        markDirty();
        toast("已添加到直播画面");
        return;
      }
      if (!c.a) {
        c.a = name;
        markDirty();
        toast(c.layout === "pip" ? "已设为主内容" : "已添加到左画面");
        return;
      }
      if (!c.b) {
        if (c.a === name) { toast("该媒体源已在画面中"); return; }
        c.b = name;
        markDirty();
        toast(c.layout === "pip" ? "已设为小窗" : "已添加到右画面");
        return;
      }
      toast("两个画面位已满，请先移除其中一个或切换布局");
    }

    document.querySelectorAll("[data-source]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        addMediaSource(btn.getAttribute("data-source"));
      });
    });

    document.querySelectorAll(".ctrl-layout-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".ctrl-layout-btn").forEach(function (x) { x.classList.remove("active"); });
        btn.classList.add("active");
        var next = btn.getAttribute("data-layout");
        var prev = state.preview.layout;
        state.preview.layout = next;
        if (next === "single") {
          if (!state.preview.a && state.preview.b) {
            state.preview.a = state.preview.b;
          }
          state.preview.b = null;
        }
        markDirty();
        toast("已切换为" + LAYOUT_LABEL[next] + (prev !== next ? "（已尽量保留媒体源）" : ""));
      });
    });

    var swapBtn = document.getElementById("btn-swap-slots");
    if (swapBtn) {
      swapBtn.addEventListener("click", function () {
        var t = state.preview.a;
        state.preview.a = state.preview.b;
        state.preview.b = t;
        markDirty();
        toast("已交换画面");
      });
    }

    var confirmReplace = document.getElementById("btn-confirm-replace");
    if (confirmReplace) {
      confirmReplace.addEventListener("click", function () {
        if (!state.pendingReplace) return;
        state.preview.a = state.pendingReplace;
        state.preview.b = null;
        closeAll();
        markDirty();
        toast("已替换当前画面");
      });
    }

    var btnUpdate = document.getElementById("btn-update");
    if (btnUpdate) {
      btnUpdate.addEventListener("click", function () {
        if (btnUpdate.disabled) return;
        if (living) {
          var incomplete = layoutIncomplete();
          if (incomplete) { toast(incomplete); return; }
          if (!state.preview.a && !state.preview.text) {
            toast("操作失败：请先添加媒体源");
            return;
          }
          if (!state.pendingPublish) {
            toast("当前预览与直播画面一致，无需更新");
            return;
          }
          if (state.healthLevel === "error" && !state.videoOk) {
            toast("操作失败：画面源异常，已保留原直播画面。请先恢复后再更新。");
            return;
          }
          state.updating = true;
          var label = document.getElementById("btn-update-label");
          if (label) label.textContent = "正在更新…";
          updateActionButtons();
          setTimeout(function () {
            state.published = cloneCanvas(state.preview);
            state.pendingPublish = false;
            state.updating = false;
            if (label) label.textContent = "更新直播画面";
            paintCanvas();
            toast("直播画面已更新");
          }, 280);
          return;
        }
        if (!state.preview.a && !state.preview.text) {
          toast("操作失败：请先添加媒体源到预览");
          return;
        }
        toast("已应用到预览");
        paintCanvas();
      });
    }

    var btnAbandon = document.getElementById("btn-abandon");
    if (btnAbandon) {
      btnAbandon.addEventListener("click", function () {
        if (!living || !state.pendingPublish) return;
        state.preview = cloneCanvas(state.published);
        state.pendingPublish = false;
        document.querySelectorAll(".ctrl-layout-btn").forEach(function (x) {
          x.classList.toggle("active", x.getAttribute("data-layout") === state.preview.layout);
        });
        paintCanvas();
        toast("已放弃未发布修改");
      });
    }

    var btnClear = document.getElementById("btn-clear-canvas");
    if (btnClear) {
      btnClear.addEventListener("click", function () {
        if (btnClear.disabled) return;
        openModal("modal-clear-canvas");
      });
    }
    var confirmClear = document.getElementById("btn-confirm-clear-canvas");
    if (confirmClear) {
      confirmClear.addEventListener("click", function () {
        state.preview = { layout: state.preview.layout, a: null, b: null, text: null };
        if (!living) {
          state.published = cloneCanvas(state.preview);
          state.pendingPublish = false;
        } else {
          state.pendingPublish = true;
        }
        closeAll();
        paintCanvas();
        toast("画布已清空（评论、商品与直播状态未受影响）");
      });
    }

    /* health / device */
    function recomputeHealth() {
      state.alerts = [];
      var level = "ok";
      if (!state.netOk) {
        level = "error";
        state.alerts.push({
          level: "error", title: "推流中断风险", detail: "网络异常",
          time: nowLabel(), tip: "检查上行带宽或切换备用网络，直播不会自动结束。"
        });
      } else if (state.healthLevel === "warn") {
        level = "warn";
        state.alerts.push({
          level: "warn", title: "网络波动", detail: "码率偏低",
          time: nowLabel(), tip: "建议降低分辨率或检查 Wi-Fi。"
        });
        if (state.micConnected && state.micLevel < 20) {
          state.alerts.push({
            level: "warn", title: "麦克风音量过低", detail: "音量 " + state.micLevel + "%",
            time: nowLabel(), tip: "靠近麦克风或提高输入增益。"
          });
        }
      }
      if (!state.micConnected || (!state.audioOk && living)) {
        if (level !== "error") level = living ? "error" : "warn";
        state.alerts.push({
          level: living ? "error" : "warn", title: "未检测到音频",
          detail: "麦克风未连接或静音", time: nowLabel(),
          tip: "检查麦克风连接，并确认未静音。"
        });
      }
      if (living && !state.published.a && !state.published.text) {
        level = "error";
        state.alerts.push({
          level: "error", title: "画面源丢失", detail: "当前无有效直播画面",
          time: nowLabel(), tip: "添加媒体源并更新直播画面。"
        });
      }
      if (!state.imOk) {
        level = "error";
        state.alerts.push({
          level: "error", title: "互动服务断开", detail: "评论通道不可用",
          time: nowLabel(), tip: "刷新互动服务；直播不会自动结束。"
        });
      }
      state.healthLevel = state.alerts.length ? level : "ok";
      renderHealthUI();
      refreshStartGate();
    }

    function renderHealthUI() {
      var pill = document.getElementById("ctrl-net-pill");
      if (pill) {
        pill.classList.remove("ctrl-pill-ok", "ctrl-pill-warn", "ctrl-pill-err");
        if (state.healthLevel === "ok") {
          pill.classList.add("ctrl-pill-ok");
          pill.innerHTML = "<span class='net-dot'></span><span class='net-label'>网络良好</span>";
        } else if (state.healthLevel === "warn") {
          pill.classList.add("ctrl-pill-warn");
          pill.innerHTML = "<span class='net-dot' style='background:#ff7d00'></span><span class='net-label'>网络警告</span>";
        } else {
          pill.classList.add("ctrl-pill-err");
          pill.innerHTML = "<span class='net-dot' style='background:#f53f3f'></span><span class='net-label'>推流异常</span>";
        }
      }
      var imPill = document.getElementById("ctrl-im-pill");
      if (imPill) {
        imPill.textContent = state.imOk ? "互动服务正常" : "互动服务断开";
        imPill.classList.toggle("ctrl-pill-err", !state.imOk);
      }

      var crit = document.getElementById("ctrl-crit-banner");
      if (crit) {
        var errors = state.alerts.filter(function (a) { return a.level === "error"; });
        if (errors.length) {
          crit.classList.add("open");
          crit.textContent = "关键异常：" + errors.map(function (a) { return a.title; }).join("；") +
            " · " + errors[0].tip;
        } else {
          crit.classList.remove("open");
          crit.textContent = "";
        }
      }

      var drawerAlerts = document.getElementById("drawer-alerts");
      if (drawerAlerts) {
        if (!state.alerts.length) {
          drawerAlerts.innerHTML = '<div class="muted" style="font-size:12px">暂无异常</div>';
        } else {
          drawerAlerts.innerHTML = state.alerts.map(function (a) {
            return '<div class="ctrl-alert-card is-' + a.level + '"><div class="ctrl-alert-title">' +
              a.title + '</div><div class="ctrl-alert-meta">' + a.detail + " · " + a.time +
              '</div><div class="ctrl-alert-tip">' + a.tip + "</div></div>";
          }).join("");
        }
      }

      var panel = document.getElementById("health-detail-body");
      if (panel) {
        panel.innerHTML =
          "<div class='health-row'><span>网络</span><b>" + (state.netOk ? "正常" : "异常") + "</b></div>" +
          "<div class='health-row'><span>视频</span><b>" + (state.videoOk ? "正常" : "异常") + "</b></div>" +
          "<div class='health-row'><span>音频</span><b>" + (state.audioOk && state.micConnected && !state.micMuted ? "正常" : "异常") + "</b></div>" +
          "<div class='health-row'><span>互动服务</span><b>" + (state.imOk ? "正常" : "断开") + "</b></div>" +
          (state.alerts.length
            ? "<div class='health-sep'>当前问题</div>" + state.alerts.map(function (a) {
                return "<div class='health-issue'><b>" + a.title + "</b><div>" + a.detail + " · " + a.time +
                  "</div><div class='muted'>" + a.tip + "</div></div>";
              }).join("")
            : "<div class='health-sep'>一切正常</div>") +
          (living ? "<div class='muted' style='margin-top:10px'>直播中出现异常时不会自动结束直播。</div>" : "");
      }
      syncDeviceUI();
    }

    function syncDeviceUI() {
      state.audioOk = state.micConnected && !state.micMuted;
      var set = function (id, v) {
        var el = document.getElementById(id);
        if (el) el.textContent = v;
      };
      set("d-mic-status", state.micConnected ? (state.micMuted ? "已连接 · 静音" : "已连接 · 开启") : "未连接");
      set("d-mic-mute", state.micConnected ? (state.micMuted ? "是" : "否") : "—");
      set("d-cam-status", state.camConnected ? (state.camOn ? "已连接 · 开启" : "已连接 · 关闭") : "未连接");
      set("d-net-status", state.netOk ? "正常" : "异常");
      set("d-stream-status", state.healthLevel === "ok" ? "正常" : (state.healthLevel === "warn" ? "警告" : "异常"));
      var vol = document.getElementById("d-mic-vol");
      if (vol) vol.style.width = (state.micConnected && !state.micMuted ? state.micLevel : 0) + "%";
    }

    function openDeviceDrawer() {
      document.getElementById("device-mask").classList.add("open");
      document.getElementById("device-drawer").classList.add("open");
      renderHealthUI();
    }
    function closeDeviceDrawer() {
      document.getElementById("device-mask").classList.remove("open");
      document.getElementById("device-drawer").classList.remove("open");
    }
    var btnDevice = document.getElementById("btn-open-device");
    if (btnDevice) btnDevice.addEventListener("click", openDeviceDrawer);
    var btnCloseDevice = document.getElementById("btn-close-device");
    if (btnCloseDevice) btnCloseDevice.addEventListener("click", closeDeviceDrawer);
    var deviceMask = document.getElementById("device-mask");
    if (deviceMask) deviceMask.addEventListener("click", closeDeviceDrawer);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDeviceDrawer();
    });

    var startHint = document.getElementById("ctrl-start-hint");
    if (startHint) {
      startHint.addEventListener("click", function () {
        var unmet = startUnmetList();
        if (unmet.length) toast(unmet.join("；"));
      });
    }

    var netPill = document.getElementById("ctrl-net-pill");
    if (netPill) {
      netPill.addEventListener("click", function () { openModal("modal-health"); });
    }

    function bindSim(id, fn) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("click", fn);
    }
    bindSim("btn-sim-health-ok", function () {
      state.netOk = true; state.videoOk = true; state.imOk = true;
      state.healthLevel = "ok"; state.micLevel = state.micConnected ? 62 : 0;
      recomputeHealth(); toast("推流健康已恢复正常");
    });
    bindSim("btn-sim-health-warn", function () {
      state.netOk = true; state.healthLevel = "warn"; state.micLevel = 12; state.videoOk = true;
      recomputeHealth(); toast("已模拟网络警告（直播不会自动结束）");
    });
    bindSim("btn-sim-health-err", function () {
      state.netOk = false; state.videoOk = false; state.healthLevel = "error";
      recomputeHealth();
      toast(living ? "已模拟推流异常（直播不会自动结束）" : "已模拟关键异常，待开播将无法开始");
    });
    bindSim("btn-toggle-mic", function () {
      if (!state.micConnected) {
        state.micConnected = true; state.micMuted = false; state.micLevel = 58;
        toast("麦克风已连接");
      } else {
        state.micMuted = !state.micMuted;
        toast(state.micMuted ? "麦克风已静音" : "麦克风已开启");
      }
      recomputeHealth();
    });
    bindSim("btn-toggle-cam", function () {
      if (!state.camConnected) {
        state.camConnected = true; state.camOn = true; toast("摄像头已连接");
      } else {
        state.camOn = !state.camOn; toast(state.camOn ? "摄像头已开启" : "摄像头已关闭");
      }
      recomputeHealth();
    });

    /* start / end */
    function criticalBlockForStart() {
      var unmet = startUnmetList();
      if (!unmet.length) return "";
      return "暂时无法开始直播：" + unmet.join("；");
    }

    var btnStart = document.getElementById("btn-start-live");
    var btnEnd = document.getElementById("btn-end-live");
    if (!living && btnStart) {
      btnStart.addEventListener("click", function () {
        if (btnStart.disabled) {
          var unmet = startUnmetList();
          toast(unmet.length ? (unmet.length + "项开播条件未满足：" + unmet.join("；")) : "暂时无法开始直播");
          return;
        }
        var reason = criticalBlockForStart();
        if (reason) { toast(reason); return; }
        var g = LiveOps.canStartLive(live);
        if (!g.ok) { toast(g.reason); return; }
        openModal("modal-start");
      });
    }
    if (living) {
      var endBtn = btnEnd || btnStart;
      if (endBtn) {
        endBtn.addEventListener("click", function () {
          var g = LiveOps.canEndLive(LiveOps.getLive(currentLiveId));
          if (!g.ok) { toast(g.reason); return; }
          openModal("modal-end");
        });
      }
    }
    var confirmStart = document.getElementById("btn-confirm-start");
    if (confirmStart) {
      confirmStart.addEventListener("click", function () {
        var reason = criticalBlockForStart();
        if (reason) { toast(reason); return; }
        var res = LiveOps.startLive(currentLiveId);
        if (!res.ok) { toast(res.reason || "无法开始直播"); return; }
        toast("直播已开始，即将跳转大屏...");
        closeAll();
        setTimeout(function () {
          location.href = LiveOps.buildUrl("live-screen.html", { live_id: currentLiveId, from: "control" });
        }, 700);
      });
    }
    var confirmEnd = document.getElementById("btn-confirm-end");
    if (confirmEnd) {
      confirmEnd.addEventListener("click", function () {
        var res = LiveOps.endLive(currentLiveId);
        if (!res.ok) { toast(res.reason || "无法结束直播"); return; }
        closeAll();
        toast("直播已结束");
        setTimeout(function () {
          LiveOps.renderStateGate(page, {
            title: "本场直播已结束",
            reason: "状态已同步。可查看场次数据或回放。",
            live: res.live,
            actions: LiveOps.gateActionsFor(res.live, "ended")
          });
        }, 250);
      });
    }

    /* right tabs */
    document.querySelectorAll(".ctrl-rtab").forEach(function (t) {
      t.addEventListener("click", function () {
        var prev = state.activeTab;
        if (prev === "interact") {
          var cl = document.getElementById("ctrl-comment-list");
          if (cl) state.interactScrollTop = cl.scrollTop;
        } else if (prev === "product") {
          var pl = document.querySelector("#rpane-product .ctrl-prod-pane");
          if (pl) state.productScrollTop = pl.scrollTop;
        } else if (prev === "tools") {
          var tl = document.querySelector("#rpane-tools .ctrl-mk-pane");
          if (tl) state.toolsScrollTop = tl.scrollTop;
        }
        document.querySelectorAll(".ctrl-rtab").forEach(function (x) { x.classList.remove("active"); });
        t.classList.add("active");
        var tab = t.getAttribute("data-rtab");
        state.activeTab = tab;
        document.querySelectorAll(".ctrl-rpane").forEach(function (p) { p.classList.remove("active"); });
        var node = document.getElementById("rpane-" + tab);
        if (node) node.classList.add("active");
        setTimeout(function () {
          if (tab === "interact") {
            var list = document.getElementById("ctrl-comment-list");
            if (list) list.scrollTop = state.interactScrollTop;
          } else if (tab === "product") {
            var p2 = document.querySelector("#rpane-product .ctrl-prod-pane");
            if (p2) p2.scrollTop = state.productScrollTop;
          } else if (tab === "tools") {
            var t2 = document.querySelector("#rpane-tools .ctrl-mk-pane");
            if (t2) t2.scrollTop = state.toolsScrollTop;
          }
        }, 0);
      });
    });

    /* comments — enriched interaction demo */
    var SIM_INCOMING = [
      { kind: "join", name: "系统", role: "system", text: "王妈妈 进入了直播间", color: "#86909c" },
      { kind: "chat", name: "林妈妈", role: "user", text: "正式课和试听课有什么区别？", color: "#00b42a", isQA: true, pupil: true },
      { kind: "order", name: "系统", role: "system", text: "钱爸爸 下单了「试听课」· ¥99", color: "#fa8c16" },
      { kind: "chat", name: "孙爸爸", role: "user", text: "今晚优惠券什么时候发？", color: "#722ed1", isQA: true },
      { kind: "chat", name: "黄妈妈", role: "user", text: "孩子刚上一年级，适合跟吗？", color: "#f53f3f", isQA: true, pupil: false },
      { kind: "chat", name: "路过广告", role: "user", text: "加微信领资料（模拟待审/可隐藏）", color: "#86909c", isQA: false }
    ];

    function renderAuditBar() {
      var bar = document.getElementById("ctrl-audit-actions");
      var countEl = document.getElementById("ctrl-audit-count");
      if (bar) bar.style.display = state.auditMode ? "flex" : "none";
      if (countEl) countEl.textContent = String(state.pendingAudit.length);
    }

    function updateFilterCounts() {
      var visible = state.comments.filter(function (c) { return !c.blocked && !c.hidden; });
      var set = function (id, n) {
        var el = document.getElementById(id);
        if (el) el.textContent = String(n);
      };
      set("cnt-all", visible.filter(function (c) { return c.kind !== "join"; }).length +
        (visible.some(function (c) { return c.kind === "join"; }) ? 1 : 0));
      set("cnt-qa", visible.filter(function (c) { return c.isQA; }).length);
      set("cnt-teacher", visible.filter(function (c) { return c.role === "teacher"; }).length);
      set("cnt-hidden", state.comments.filter(function (c) { return !c.blocked && c.hidden; }).length);
      var qaSub = document.getElementById("ctrl-qa-subfilters");
      if (qaSub) qaSub.classList.toggle("open", state.filter === "qa" && !state.auditMode);
    }

    function updateUnreadUI() {
      var bar = document.getElementById("ctrl-new-msg-bar");
      var badge = document.getElementById("tab-interact-badge");
      if (bar) {
        if (state.unreadCount > 0) {
          bar.classList.add("show");
          bar.textContent = state.unreadCount + "条新消息";
        } else {
          bar.classList.remove("show");
        }
      }
      if (badge) {
        if (state.unreadCount > 0 && state.activeTab !== "interact") {
          badge.style.display = "inline-block";
          badge.textContent = String(state.unreadCount);
        } else if (state.unreadCount > 0) {
          badge.style.display = "inline-block";
          badge.textContent = String(state.unreadCount);
        } else {
          badge.style.display = "none";
        }
      }
    }

    function scrollCommentsToBottom() {
      var list = document.getElementById("ctrl-comment-list");
      if (!list) return;
      list.scrollTop = list.scrollHeight;
      state.stickToBottom = true;
      state.unreadCount = 0;
      updateUnreadUI();
    }

    function notifyNewMessages(n) {
      n = n || 1;
      if (state.stickToBottom && state.activeTab === "interact" && !state.auditMode) {
        setTimeout(scrollCommentsToBottom, 0);
      } else {
        state.unreadCount += n;
        updateUnreadUI();
      }
    }

    function aggregateComments(list) {
      var out = [];
      var i = 0;
      while (i < list.length) {
        var c = list[i];
        if (c.kind === "join") {
          var names = [];
          var j = i;
          while (j < list.length && list[j].kind === "join") {
            var nm = (list[j].joinNames && list[j].joinNames[0]) ||
              (list[j].text || "").replace(/\s*进入了直播间$/, "");
            if (nm) names.push(nm);
            j++;
          }
          if (names.length === 1) {
            out.push({
              id: "join-" + c.id, kind: "join", role: "system",
              text: names[0] + " 进入了直播间", isAggregate: true
            });
          } else if (names.length > 1) {
            out.push({
              id: "join-" + c.id, kind: "join", role: "system",
              text: names[0] + "等" + names.length + "人进入直播间", isAggregate: true
            });
          }
          i = j;
        } else {
          out.push(c);
          i++;
        }
      }
      return out;
    }

    function renderPinBar() {
      var bar = document.getElementById("ctrl-pin-bar");
      if (!bar) return;
      if (!living || state.auditMode || !state.pinnedId) {
        bar.style.display = "none";
        bar.innerHTML = "";
        return;
      }
      var pinned = findComment(state.pinnedId);
      if (!pinned || pinned.blocked) {
        bar.style.display = "none";
        bar.innerHTML = "";
        return;
      }
      bar.style.display = "flex";
      bar.innerHTML = '<span class="pin-label">置顶</span><span class="pin-text"><b>' +
        pinned.name + "：</b>" + pinned.text +
        '</span><button type="button" class="ctrl-comment-act" data-act="pin" data-id="' +
        pinned.id + '">取消</button>';
      bindCommentActs(bar);
    }

    function renderReplyBanner() {
      var banner = document.getElementById("ctrl-reply-banner");
      var textEl = document.getElementById("ctrl-reply-banner-text");
      if (!banner) return;
      if (!state.replyToId) {
        banner.style.display = "none";
        return;
      }
      var target = findComment(state.replyToId);
      if (!target) {
        state.replyToId = null;
        banner.style.display = "none";
        return;
      }
      banner.style.display = "flex";
      if (textEl) textEl.textContent = "回复 @" + target.name + "：" + (target.text || "").slice(0, 28) +
        ((target.text || "").length > 28 ? "…" : "");
    }

    function clearReplyTarget() {
      state.replyToId = null;
      renderReplyBanner();
    }

    function renderComments() {
      var list = document.getElementById("ctrl-comment-list");
      if (!list) return;
      var prevScroll = list.scrollTop;
      updateFilterCounts();
      renderPinBar();
      renderReplyBanner();
      updateUnreadUI();
      if (!living) {
        list.innerHTML = '<div class="ctrl-interact-empty">直播尚未开始，暂无实时消息。待开播不可发送互动。</div>';
        return;
      }
      if (state.auditMode) {
        list.innerHTML = state.pendingAudit.length
          ? state.pendingAudit.map(function (c) { return commentHtml(c, true); }).join("")
          : '<div class="ctrl-interact-empty">暂无待审核评论' +
            (demoMode ? "。可点「模拟新消息」生成待审内容。" : "。") + "</div>";
        bindCommentActs(list);
        return;
      }
      var filtered = state.comments.filter(function (c) {
        if (c.blocked) return false;
        if (state.filter === "hidden") return !!c.hidden;
        if (c.hidden) return false;
        if (state.filter === "qa") {
          if (!c.isQA) return false;
          if (state.qaSubFilter === "unanswered") return !c.answered;
          if (state.qaSubFilter === "answered") return !!c.answered;
          return true;
        }
        if (state.filter === "teacher") return c.role === "teacher";
        return true;
      });
      filtered.sort(function (a, b) {
        if (state.filter === "qa") {
          if (!!a.answered !== !!b.answered) return a.answered ? 1 : -1;
        }
        if (a.id === state.pinnedId) return -1;
        if (b.id === state.pinnedId) return 1;
        return b.id - a.id;
      });
      var display = state.filter === "all" ? aggregateComments(filtered) : filtered;
      if (!display.length) {
        list.innerHTML = '<div class="ctrl-interact-empty">' +
          (state.filter === "hidden" ? "暂无已隐藏消息" :
            state.filter === "qa" ? "暂无符合条件的问题" : "暂无消息") + "</div>";
        return;
      }
      list.innerHTML = display.map(function (c) { return commentHtml(c, false); }).join("");
      bindCommentActs(list);
      filtered.forEach(function (c) { c.isNew = false; });
      if (state.stickToBottom) {
        list.scrollTop = list.scrollHeight;
      } else {
        list.scrollTop = prevScroll;
      }
    }

    function commentHtml(c, pending) {
      if (c.kind === "join" || (c.role === "system" && c.kind !== "order")) {
        return '<div class="ctrl-comment is-system' + (c.isNew ? " flash-in" : "") + '">' +
          c.text + "</div>";
      }
      if (c.kind === "order") {
        return '<div class="ctrl-comment is-order' + (c.isNew ? " flash-in" : "") + '">🛒 ' +
          c.text + "</div>";
      }
      var tags = "";
      if (c.role === "teacher") tags += '<span class="ctrl-comment-tag role-teacher">讲师</span>';
      if (c.pupil) tags += '<span class="ctrl-comment-tag role-pupil">已购学员</span>';
      if (c.isQA) {
        tags += '<span class="ctrl-comment-tag tag-qa">问答</span>';
        tags += c.answered
          ? '<span class="ctrl-comment-tag tag-answered">已回答</span>'
          : '<span class="ctrl-comment-tag tag-unanswered">未回答</span>';
      }
      if (c.id === state.pinnedId) tags += '<span class="ctrl-comment-tag tag-pinned">已置顶</span>';
      if (c.hidden) tags += '<span class="ctrl-comment-tag tag-hidden">已隐藏</span>';
      if (c.muted) tags += '<span class="ctrl-comment-tag tag-muted">已禁言</span>';
      if (c.isNew) tags += '<span class="ctrl-comment-tag tag-new">新</span>';
      var quote = "";
      if (c.replyTo) {
        quote = '<div class="ctrl-comment-quote">回复 @' + c.replyTo.name + "：" + c.replyTo.text + "</div>";
      }
      var actions = "";
      if (pending) {
        actions = '<div class="ctrl-comment-actions">' +
          '<button type="button" class="ctrl-comment-act" data-act="approve" data-id="' + c.id + '">通过</button>' +
          '<button type="button" class="ctrl-comment-act" data-act="reject" data-id="' + c.id + '">隐藏</button></div>';
      } else if (c.role === "teacher") {
        actions = '<div class="ctrl-comment-actions">' +
          '<button type="button" class="ctrl-comment-act" data-act="reply" data-id="' + c.id + '">回复</button>' +
          '<button type="button" class="ctrl-comment-act" data-act="pin" data-id="' + c.id + '">' +
          (c.id === state.pinnedId ? "取消置顶" : "置顶") + "</button>" +
          '<button type="button" class="ctrl-comment-act" data-act="recall" data-id="' + c.id + '">撤回</button></div>';
      } else {
        actions = '<div class="ctrl-comment-actions">' +
          '<button type="button" class="ctrl-comment-act" data-act="reply" data-id="' + c.id + '">回复</button>' +
          '<button type="button" class="ctrl-comment-act" data-act="pin" data-id="' + c.id + '">' +
          (c.id === state.pinnedId ? "取消置顶" : "置顶") + "</button>" +
          '<button type="button" class="ctrl-comment-act" data-act="' + (c.hidden ? "show" : "hide") + '" data-id="' + c.id + '">' +
          (c.hidden ? "恢复" : "隐藏") + "</button>";
        if (c.isQA) {
          actions += '<button type="button" class="ctrl-comment-act" data-act="' +
            (c.answered ? "unanswer" : "answer") + '" data-id="' + c.id + '">' +
            (c.answered ? "取消已回答" : "标记已回答") + "</button>";
        }
        actions += '<span class="ctrl-more-wrap"><button type="button" class="ctrl-comment-act" data-act="more" data-id="' + c.id + '">更多</button>' +
          '<span class="ctrl-more-menu" id="more-' + c.id + '" style="display:none">' +
          '<button type="button" data-act="mute" data-id="' + c.id + '">禁言</button>' +
          '<button type="button" data-act="block" data-id="' + c.id + '">拉黑</button></span></span></div>';
      }
      return '<div class="ctrl-comment' + (c.role === "teacher" ? " is-self" : "") +
        (c.id === state.pinnedId ? " is-pinned" : "") + (c.hidden ? " is-hidden" : "") +
        (c.isNew ? " flash-in" : "") + '">' +
        '<div class="ctrl-comment-avatar" style="background:' + c.color + '">' + c.name.charAt(0) + "</div>" +
        '<div class="ctrl-comment-body"><div class="ctrl-comment-meta"><span class="ctrl-comment-name">' +
        c.name + "</span>" + tags + '<span class="ctrl-comment-time">' + c.time +
        "</span></div>" + quote + '<div class="ctrl-comment-text">' + c.text + "</div>" +
        actions + "</div></div>";
    }

    function findComment(id, pool) {
      var list = pool || state.comments;
      for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
      return null;
    }

    function bindCommentActs(root) {
      root.querySelectorAll("[data-act]").forEach(function (btn) {
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          onCommentAct(btn.getAttribute("data-act"), Number(btn.getAttribute("data-id")));
        });
      });
    }

    function onCommentAct(act, id) {
      if (!requireLiving("互动操作")) return;
      var c = findComment(id) || findComment(id, state.pendingAudit);
      if (!c && act !== "pin") return;
      if (act === "more") {
        var menu = document.getElementById("more-" + id);
        if (menu) menu.style.display = menu.style.display === "none" ? "block" : "none";
        return;
      }
      if (act === "reply") {
        state.replyToId = id;
        var input = document.getElementById("ctrl-quick-input");
        if (input) { input.value = ""; input.focus(); input.placeholder = "回复 @" + c.name + "…"; }
        renderReplyBanner();
        toast("已选择回复对象，发送后会带引用");
        return;
      }
      if (act === "pin") {
        state.pinnedId = state.pinnedId === id ? null : id;
        toast(state.pinnedId ? "消息已置顶（同时仅保留一条）" : "已取消置顶");
        renderComments();
        return;
      }
      if (act === "hide") { c.hidden = true; if (state.pinnedId === id) state.pinnedId = null; toast("评论已隐藏"); renderComments(); return; }
      if (act === "show") { c.hidden = false; toast("评论已恢复展示"); renderComments(); return; }
      if (act === "answer") { c.answered = true; toast("已标记为已回答"); renderComments(); return; }
      if (act === "unanswer") { c.answered = false; toast("已取消已回答标记"); renderComments(); return; }
      if (act === "recall") {
        state.comments = state.comments.filter(function (x) { return x.id !== id; });
        if (state.pinnedId === id) state.pinnedId = null;
        if (state.replyToId === id) clearReplyTarget();
        toast("讲师消息已撤回"); renderComments(); return;
      }
      if (act === "mute") {
        state.pendingAction = { type: "mute", id: id };
        var muteName = document.getElementById("mute-user-name");
        if (muteName) muteName.textContent = c.name;
        openModal("modal-mute");
        return;
      }
      if (act === "block") {
        state.pendingAction = { type: "block", id: id };
        var blockName = document.getElementById("block-user-name");
        if (blockName) blockName.textContent = c.name;
        openModal("modal-block");
        return;
      }
      if (act === "approve") {
        state.pendingAudit = state.pendingAudit.filter(function (x) { return x.id !== id; });
        c.hidden = false;
        c.isNew = true;
        state.comments.unshift(c);
        toast("评论已通过"); renderAuditBar(); renderComments(); return;
      }
      if (act === "reject") {
        state.pendingAudit = state.pendingAudit.filter(function (x) { return x.id !== id; });
        c.hidden = true;
        state.comments.unshift(c);
        toast("评论已隐藏"); renderAuditBar(); renderComments();
      }
    }

    var auditToggle = document.getElementById("ctrl-audit-toggle");
    if (auditToggle) {
      auditToggle.addEventListener("change", function () {
        state.auditMode = this.checked;
        if (state.auditMode && living && !state.pendingAudit.length) {
          state.pendingAudit.push({
            id: state.nextCommentId++, name: "待审用户", role: "user", kind: "chat", color: "#86909c",
            time: "刚刚", text: "老师，优惠还能再便宜一点吗？", isQA: true, pupil: false,
            hidden: false, muted: false, blocked: false, replyTo: null
          });
        }
        renderAuditBar(); renderComments();
        toast(state.auditMode ? "已开启先审后发 · 列表切换为待审核" : "已关闭先审后发 · 回到公屏消息");
      });
    }
    var btnApproveAll = document.getElementById("btn-audit-approve-all");
    if (btnApproveAll) {
      btnApproveAll.addEventListener("click", function () {
        if (!state.pendingAudit.length) { toast("暂无待审核评论"); return; }
        var n = state.pendingAudit.length;
        state.pendingAudit.forEach(function (c) {
          c.hidden = false; c.isNew = true; state.comments.unshift(c);
        });
        state.pendingAudit = [];
        renderAuditBar(); renderComments();
        toast("已全部通过（" + n + " 条）");
      });
    }
    var btnRejectAll = document.getElementById("btn-audit-reject-all");
    if (btnRejectAll) {
      btnRejectAll.addEventListener("click", function () {
        if (!state.pendingAudit.length) { toast("暂无待审核评论"); return; }
        var n = state.pendingAudit.length;
        state.pendingAudit.forEach(function (c) {
          c.hidden = true; state.comments.unshift(c);
        });
        state.pendingAudit = [];
        renderAuditBar(); renderComments();
        toast("已全部隐藏（" + n + " 条），可在「已隐藏」查看");
      });
    }
    document.querySelectorAll(".ctrl-comment-filter").forEach(function (b) {
      b.addEventListener("click", function () {
        if (b.getAttribute("data-qa-sub")) return;
        document.querySelectorAll(".ctrl-comment-filters .ctrl-comment-filter").forEach(function (x) {
          x.classList.remove("active");
        });
        b.classList.add("active");
        state.filter = b.getAttribute("data-filter");
        if (state.filter === "qa" && !state.qaSubFilter) state.qaSubFilter = "unanswered";
        if (state.auditMode) {
          state.auditMode = false;
          if (auditToggle) auditToggle.checked = false;
          renderAuditBar();
        }
        renderComments();
      });
    });
    document.querySelectorAll("[data-qa-sub]").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll("[data-qa-sub]").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        state.qaSubFilter = b.getAttribute("data-qa-sub");
        renderComments();
      });
    });

    var commentListEl = document.getElementById("ctrl-comment-list");
    if (commentListEl) {
      commentListEl.addEventListener("scroll", function () {
        var nearBottom = commentListEl.scrollHeight - commentListEl.scrollTop - commentListEl.clientHeight < 40;
        state.stickToBottom = nearBottom;
        if (nearBottom && state.unreadCount) {
          state.unreadCount = 0;
          updateUnreadUI();
        }
      });
    }
    var newMsgBar = document.getElementById("ctrl-new-msg-bar");
    if (newMsgBar) {
      newMsgBar.addEventListener("click", function () {
        scrollCommentsToBottom();
        renderComments();
      });
    }

    var confirmMarkAnswered = document.getElementById("btn-confirm-mark-answered");
    if (confirmMarkAnswered) {
      confirmMarkAnswered.addEventListener("click", function () {
        var id = state.pendingMarkAnswerId;
        var c = id ? findComment(id) : null;
        if (c) { c.answered = true; toast("问题已标记为已回答"); }
        state.pendingMarkAnswerId = null;
        closeAll();
        renderComments();
      });
    }

    var btnCancelReply = document.getElementById("btn-cancel-reply");
    if (btnCancelReply) {
      btnCancelReply.addEventListener("click", function () {
        clearReplyTarget();
        var input = document.getElementById("ctrl-quick-input");
        if (input && living) input.placeholder = "输入消息或选择快捷回复...";
        toast("已取消回复");
      });
    }

    var btnSimIncoming = document.getElementById("btn-sim-incoming");
    if (btnSimIncoming) {
      btnSimIncoming.addEventListener("click", function () {
        if (!living) { toast("待开播不可模拟互动流入"); return; }
        if (!state.imOk) { toast("操作失败：互动服务断开"); return; }
        var sample = SIM_INCOMING[state.simIndex % SIM_INCOMING.length];
        state.simIndex += 1;
        var msg = {
          id: state.nextCommentId++,
          name: sample.name,
          role: sample.role || "user",
          kind: sample.kind || "chat",
          color: sample.color || "#165dff",
          time: "刚刚",
          text: sample.text,
          isQA: !!sample.isQA,
          answered: false,
          pupil: !!sample.pupil,
          hidden: false,
          muted: false,
          blocked: false,
          replyTo: null,
          isNew: true,
          joinNames: sample.kind === "join" ? [(sample.text || "").replace(/\s*进入了直播间$/, "")] : null
        };
        if (state.auditMode && msg.kind === "chat" && msg.role === "user") {
          state.pendingAudit.unshift(msg);
          renderAuditBar();
          renderComments();
          toast("新评论已进入待审核（先审后发）");
          return;
        }
        state.comments.unshift(msg);
        renderComments();
        notifyNewMessages(1);
        toast(msg.kind === "order" ? "模拟订单消息已流入" :
          msg.kind === "join" ? "模拟进房消息已流入" : "模拟新消息已流入公屏");
      });
    }

    var confirmMute = document.getElementById("btn-confirm-mute");
    if (confirmMute) {
      confirmMute.addEventListener("click", function () {
        var p = state.pendingAction;
        if (!p || p.type !== "mute") return;
        var c = findComment(p.id);
        var dur = (document.getElementById("mute-duration") || {}).value || "30 分钟";
        if (c) c.muted = true;
        closeAll(); renderComments();
        toast("用户已禁言（" + dur + "）");
      });
    }
    var confirmBlock = document.getElementById("btn-confirm-block");
    if (confirmBlock) {
      confirmBlock.addEventListener("click", function () {
        var p = state.pendingAction;
        if (!p || p.type !== "block") return;
        var c = findComment(p.id);
        if (c) c.blocked = true;
        if (state.pinnedId === p.id) state.pinnedId = null;
        if (state.replyToId === p.id) clearReplyTarget();
        closeAll(); renderComments();
        toast("用户已拉黑，其消息不再展示");
      });
    }

    var quickBar = document.getElementById("ctrl-quick-replies");
    if (quickBar) {
      quickBar.innerHTML = QUICK_REPLIES.map(function (t, i) {
        return '<button type="button" class="ctrl-chip" data-qr="' + i + '">' + t + "</button>";
      }).join("");
      quickBar.querySelectorAll("[data-qr]").forEach(function (b) {
        b.addEventListener("click", function () {
          if (!living) { toast("待开播不可发送实时互动"); return; }
          var input = document.getElementById("ctrl-quick-input");
          if (input) { input.value = QUICK_REPLIES[Number(b.getAttribute("data-qr"))]; input.focus(); }
          toast("已填入快捷回复，可修改后发送");
        });
      });
    }

    function sendMsg() {
      if (!living) { toast("待开播状态不可发送实时互动"); return; }
      if (!state.imOk) { toast("操作失败：互动服务断开"); return; }
      var input = document.getElementById("ctrl-quick-input");
      var text = (input && input.value || "").trim();
      if (!text) { toast("请输入消息"); return; }
      var replyTo = null;
      var replyTarget = null;
      if (state.replyToId) {
        replyTarget = findComment(state.replyToId);
        if (replyTarget) replyTo = { name: replyTarget.name, text: replyTarget.text };
      }
      state.comments.unshift({
        id: state.nextCommentId++,
        name: live.teacher || "阮荣均",
        role: "teacher",
        kind: "chat",
        color: "#165dff",
        time: "刚刚",
        text: text,
        isQA: false,
        pupil: false,
        hidden: false,
        muted: false,
        blocked: false,
        replyTo: replyTo,
        answered: false,
        isNew: true
      });
      if (input) {
        input.value = "";
        input.placeholder = "输入消息或选择快捷回复...";
      }
      var markId = (replyTarget && replyTarget.isQA && !replyTarget.answered) ? replyTarget.id : null;
      clearReplyTarget();
      toast(replyTo ? "已回复 @" + replyTo.name : "消息发送成功");
      renderComments();
      notifyNewMessages(1);
      if (markId) {
        state.pendingMarkAnswerId = markId;
        var preview = document.getElementById("mark-answered-preview");
        if (preview) preview.textContent = "问题：" + (replyTarget.text || "");
        openModal("modal-mark-answered");
      }
    }
    var sendBtn = document.getElementById("btn-send-msg");
    if (sendBtn) sendBtn.addEventListener("click", sendMsg);
    var quickInput = document.getElementById("ctrl-quick-input");
    if (quickInput) {
      quickInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") { e.preventDefault(); sendMsg(); }
      });
      if (!living) {
        quickInput.disabled = true;
        quickInput.placeholder = "待开播不可发送实时互动";
        if (sendBtn) sendBtn.disabled = true;
        if (btnSimIncoming) btnSimIncoming.disabled = true;
      }
    }

    /* products */
    function mountedList() {
      return state.products.filter(function (p) { return p.mounted; })
        .sort(function (a, b) { return a.order - b.order; });
    }
    function renderProducts() {
      var list = document.getElementById("ctrl-product-list");
      var badge = document.getElementById("tab-product-count");
      if (!list) return;
      var mounted = mountedList();
      if (badge) badge.textContent = String(mounted.length);
      var explaining = mounted.filter(function (p) { return p.id === state.explainingId; });
      var others = mounted.filter(function (p) { return p.id !== state.explainingId; });
      var unmounted = state.products.filter(function (p) { return !p.mounted; });
      function section(title, body) {
        return '<div class="ctrl-prod-sec"><div class="ctrl-prod-sec-hd">' + title + "</div>" + body + "</div>";
      }
      function row(p, kind) {
        var status = kind === "explaining" ? "讲解中" : kind === "mounted" ? "已挂载" : "未挂载";
        var badgeHtml = kind === "explaining" ? '<span class="ctrl-prod-badge">讲解中</span>' : "";
        var acts = "";
        if (kind === "unmounted") {
          acts = '<button type="button" class="btn btn-sm btn-primary" data-pact="mount" data-id="' + p.id + '">添加到直播间</button>';
        } else if (kind === "explaining") {
          acts = '<button type="button" class="btn btn-sm" data-pact="end" data-id="' + p.id + '">结束讲解</button>' +
            '<button type="button" class="btn btn-sm" data-pact="remove" data-id="' + p.id + '">移除</button>';
        } else {
          acts = '<button type="button" class="btn btn-sm btn-primary" data-pact="explain" data-id="' + p.id + '">设为讲解中</button>' +
            '<button type="button" class="btn btn-sm" data-pact="up" data-id="' + p.id + '">上移</button>' +
            '<button type="button" class="btn btn-sm" data-pact="down" data-id="' + p.id + '">下移</button>' +
            '<button type="button" class="btn btn-sm" data-pact="remove" data-id="' + p.id + '">移除</button>';
        }
        return '<div class="ctrl-prod-row' + (kind === "explaining" ? " is-explaining" : "") + '">' +
          "<div><div class=\"ctrl-prod-name\">" + p.name + " " + badgeHtml + "</div>" +
          '<div class="ctrl-prod-meta">¥' + p.price + " · " + p.stock + " · " + status + "</div></div>" +
          '<div class="ctrl-prod-actions">' + acts + "</div></div>";
      }
      list.innerHTML =
        section("当前讲解", explaining.length ? explaining.map(function (p) { return row(p, "explaining"); }).join("") :
          '<div class="muted" style="font-size:12px">暂无讲解中商品</div>') +
        section("已挂载", others.length ? others.map(function (p) { return row(p, "mounted"); }).join("") :
          '<div class="muted" style="font-size:12px">暂无其他已挂载商品</div>') +
        section("未挂载", unmounted.length ? unmounted.map(function (p) { return row(p, "unmounted"); }).join("") :
          '<div class="muted" style="font-size:12px">没有更多可选商品</div>');
      list.querySelectorAll("[data-pact]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          onProductAct(btn.getAttribute("data-pact"), btn.getAttribute("data-id"));
        });
      });
    }

    function onProductAct(act, id) {
      var p = null;
      state.products.forEach(function (x) { if (x.id === id) p = x; });
      if (!p) return;
      if (act === "mount") { p.mounted = true; p.order = mountedList().length; toast("商品已挂载"); renderProducts(); return; }
      if (act === "explain") {
        var switched = !!state.explainingId && state.explainingId !== p.id;
        state.explainingId = p.id;
        toast(switched ? "已切换讲解商品" : "已设为讲解中");
        renderProducts();
        paintLiveOverlays();
        return;
      }
      if (act === "end") {
        state.explainingId = null;
        toast("已结束讲解");
        renderProducts();
        paintLiveOverlays();
        return;
      }
      if (act === "remove") {
        if (p.id === state.explainingId) {
          state.pendingAction = { type: "remove-explain", id: p.id };
          var nm = document.getElementById("remove-prod-name");
          if (nm) nm.textContent = p.name;
          openModal("modal-remove-product");
          return;
        }
        p.mounted = false; toast("商品已移除"); renderProducts(); return;
      }
      if (act === "up" || act === "down") {
        var list = mountedList().filter(function (x) { return x.id !== state.explainingId; });
        var idx = -1;
        list.forEach(function (x, i) { if (x.id === id) idx = i; });
        var swap = act === "up" ? idx - 1 : idx + 1;
        if (idx < 0 || swap < 0 || swap >= list.length) { toast("已到边界"); return; }
        var tmp = list[idx].order; list[idx].order = list[swap].order; list[swap].order = tmp;
        toast("商品顺序已调整"); renderProducts();
      }
    }
    var confirmRemoveProd = document.getElementById("btn-confirm-remove-prod");
    if (confirmRemoveProd) {
      confirmRemoveProd.addEventListener("click", function () {
        var pAct = state.pendingAction;
        if (!pAct || pAct.type !== "remove-explain") return;
        state.products.forEach(function (x) { if (x.id === pAct.id) x.mounted = false; });
        state.explainingId = null;
        closeAll(); toast("讲解商品已移除"); renderProducts(); paintLiveOverlays();
      });
    }

    /* marketing */
    function statusLabel(s) {
      if (s === "active") return "投放中";
      if (s === "ended") return "已结束";
      if (s === "paused") return "已暂停";
      return "未投放";
    }
    function renderMarketing() {
      function setStat(id, status, extra) {
        var el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = '<span class="mk-status is-' + status + '">' + statusLabel(status) + "</span>" +
          (extra ? (" · " + extra) : "");
      }
      setStat("mk-coupon-status", state.coupon.status, state.coupon.name || "");
      setStat("mk-announce-status", state.announce.status, state.announce.text ? state.announce.text.slice(0, 16) : "");
      setStat("mk-marquee-status", state.marquee.status, state.marquee.text ? state.marquee.text.slice(0, 16) : "");

      var couponActs = document.getElementById("mk-coupon-acts");
      if (couponActs) {
        couponActs.innerHTML = state.coupon.status === "active"
          ? '<button type="button" class="btn btn-sm" id="btn-end-coupon">结束投放</button>'
          : '<button type="button" class="btn btn-sm btn-primary" id="btn-open-coupon">投放到直播间</button>';
        var openC = document.getElementById("btn-open-coupon");
        if (openC) openC.addEventListener("click", function () {
          if (!requireLiving("优惠券投放")) return;
          updateCouponPreview();
          openModal("modal-coupon");
        });
        var endC = document.getElementById("btn-end-coupon");
        if (endC) endC.addEventListener("click", function () { openModal("modal-end-coupon"); });
      }

      var annActs = document.getElementById("mk-announce-acts");
      if (annActs) {
        if (state.announce.status === "active") {
          annActs.innerHTML =
            '<button type="button" class="btn btn-sm btn-primary" id="btn-update-announce">更新公告</button>' +
            '<button type="button" class="btn btn-sm" id="btn-withdraw-announce">撤下公告</button>';
        } else {
          annActs.innerHTML = '<button type="button" class="btn btn-sm btn-primary" id="btn-open-announce">发布公告</button>';
        }
        var openA = document.getElementById("btn-open-announce");
        if (openA) openA.addEventListener("click", function () {
          if (!requireLiving("直播公告")) return;
          var conf = document.getElementById("btn-announce-confirm");
          if (conf) conf.textContent = "发布公告";
          openModal("modal-announce");
        });
        var updA = document.getElementById("btn-update-announce");
        if (updA) updA.addEventListener("click", function () {
          if (!requireLiving("直播公告")) return;
          var conf = document.getElementById("btn-announce-confirm");
          if (conf) conf.textContent = "更新公告";
          openModal("modal-announce");
        });
        var wdA = document.getElementById("btn-withdraw-announce");
        if (wdA) wdA.addEventListener("click", function () { openModal("modal-withdraw-announce"); });
      }

      var mqActs = document.getElementById("mk-marquee-acts");
      if (mqActs) {
        if (state.marquee.status === "idle" || state.marquee.status === "ended") {
          mqActs.innerHTML = '<button type="button" class="btn btn-sm btn-primary" id="btn-open-marquee">开始展示</button>';
        } else if (state.marquee.status === "active") {
          mqActs.innerHTML =
            '<button type="button" class="btn btn-sm" id="btn-pause-marquee">暂停展示</button>' +
            '<button type="button" class="btn btn-sm" id="btn-stop-marquee">结束展示</button>';
        } else {
          mqActs.innerHTML =
            '<button type="button" class="btn btn-sm btn-primary" id="btn-resume-marquee">继续展示</button>' +
            '<button type="button" class="btn btn-sm" id="btn-stop-marquee">结束展示</button>';
        }
        var openM = document.getElementById("btn-open-marquee");
        if (openM) openM.addEventListener("click", function () {
          if (!requireLiving("跑马灯")) return;
          openModal("modal-marquee");
        });
        var pauseM = document.getElementById("btn-pause-marquee");
        if (pauseM) pauseM.addEventListener("click", function () {
          state.marquee.status = "paused"; renderMarketing(); paintLiveOverlays(); toast("跑马灯已暂停");
        });
        var resumeM = document.getElementById("btn-resume-marquee");
        if (resumeM) resumeM.addEventListener("click", function () {
          state.marquee.status = "active"; renderMarketing(); paintLiveOverlays(); toast("跑马灯已开始");
        });
        var stopM = document.getElementById("btn-stop-marquee");
        if (stopM) stopM.addEventListener("click", function () {
          state.marquee.status = "ended"; renderMarketing(); paintLiveOverlays(); toast("跑马灯已结束展示");
        });
      }

      var currentAnn = document.getElementById("mk-announce-current");
      if (currentAnn) {
        currentAnn.style.display = state.announce.status === "active" ? "block" : "none";
        currentAnn.textContent = "当前展示：" + (state.announce.text || "");
      }
      paintLiveOverlays();
    }

    function updateCouponPreview() {
      var sel = document.getElementById("coupon-tpl");
      var dur = document.getElementById("coupon-duration");
      var box = document.getElementById("coupon-preview");
      if (!box || !sel) return;
      var name = sel.options[sel.selectedIndex].text;
      var expire = dur ? dur.options[dur.selectedIndex].text : "1 小时";
      box.innerHTML = "优惠券：<b>" + name + "</b><br/>优惠说明见券名 · 有效期 <b>" + expire +
        "</b><br/>渠道：直播间浮窗";
    }
    ["coupon-tpl", "coupon-duration"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("change", updateCouponPreview);
        el.addEventListener("input", updateCouponPreview);
      }
    });

    var couponOk = document.getElementById("btn-coupon-confirm");
    if (couponOk) {
      couponOk.addEventListener("click", function () {
        if (!requireLiving("优惠券投放")) return;
        var sel = document.getElementById("coupon-tpl");
        state.coupon = { status: "active", name: sel ? sel.options[sel.selectedIndex].text : "优惠券" };
        closeAll(); renderMarketing(); toast("优惠券已投放");
      });
    }
    var endCouponOk = document.getElementById("btn-confirm-end-coupon");
    if (endCouponOk) {
      endCouponOk.addEventListener("click", function () {
        state.coupon.status = "ended"; closeAll(); renderMarketing(); toast("优惠券投放已结束");
      });
    }
    var annOk = document.getElementById("btn-announce-confirm");
    if (annOk) {
      annOk.addEventListener("click", function () {
        if (!requireLiving("直播公告")) return;
        var text = ((document.getElementById("announce-text") || {}).value || "").trim();
        if (!text) { toast("请输入公告内容"); return; }
        var was = state.announce.status === "active";
        state.announce = { status: "active", text: text };
        closeAll(); renderMarketing(); toast(was ? "公告已更新" : "公告已发布");
      });
    }
    var wdAnnOk = document.getElementById("btn-confirm-withdraw-announce");
    if (wdAnnOk) {
      wdAnnOk.addEventListener("click", function () {
        state.announce.status = "ended"; closeAll(); renderMarketing(); toast("公告已撤下");
      });
    }
    var mqrOk = document.getElementById("btn-mqr-confirm");
    if (mqrOk) {
      mqrOk.addEventListener("click", function () {
        if (!requireLiving("跑马灯")) return;
        var text = (document.getElementById("mqr-text") || {}).value || "";
        state.marquee = { status: "active", text: text };
        closeAll(); renderMarketing(); toast("跑马灯已开始");
      });
    }

    paintCanvas();
    recomputeHealth();
    renderAuditBar();
    renderComments();
    renderProducts();
    renderMarketing();
    updateCouponPreview();
    refreshStartGate();
  }

  global.LiveControlCore = { boot: boot };
})(window);
