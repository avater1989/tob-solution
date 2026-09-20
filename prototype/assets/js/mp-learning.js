/* C 端学习中心：已购权益统一模型 + 今日任务推荐 + 游戏化进度（原型）
   仅编排 owned / claimed 内容，不混入未购商品 */
(function (global) {
  var STATE_KEY = "mp_learning_state_v1";
  var DEMO_KEY = "mp_learning_demo_v1";

  var TYPE_LABEL = {
    online_course: "线上课",
    offline_course: "线下课",
    article: "文章",
    assessment: "测评",
    plan: "定制化计划"
  };

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function readState() {
    try {
      var raw = JSON.parse(localStorage.getItem(STATE_KEY) || "{}") || {};
      return Object.assign(
        {
          streak: 2,
          lastStudyDay: "",
          stars: 18,
          weekDone: 3,
          weekGoal: 5,
          completedTaskIds: {},
          progress: {}
        },
        raw
      );
    } catch (e) {
      return {
        streak: 2,
        lastStudyDay: "",
        stars: 18,
        weekDone: 3,
        weekGoal: 5,
        completedTaskIds: {},
        progress: {}
      };
    }
  }

  function writeState(state) {
    localStorage.setItem(STATE_KEY, JSON.stringify(state || {}));
  }

  function demoMode() {
    var qs = new URLSearchParams(location.search);
    var q = qs.get("learn");
    if (q) {
      localStorage.setItem(DEMO_KEY, q);
      return q;
    }
    try {
      return localStorage.getItem(DEMO_KEY) || "full";
    } catch (e) {
      return "full";
    }
  }

  /** Seed owned items for prototype demos */
  function seedItems(mode) {
    var m = mode || demoMode();
    if (m === "empty") return [];
    if (m === "one") {
      return [
        {
          id: "C001",
          type: "online_course",
          title: "小学语文阅读启蒙",
          cover: "../assets/img/covers/read.jpg",
          status: "in_progress",
          progress: 25,
          nextLesson: 2,
          totalLessons: 8,
          durationMin: 18,
          href: "learn.html?id=C001",
          reason: "上次学到第 2 节",
          urgency: 30,
          owned: true
        }
      ];
    }

    var items = [
      {
        id: "MPL1",
        type: "plan",
        title: "亲子沟通 21 天训练营计划",
        cover: "",
        status: "in_progress",
        progress: 50,
        currentTask: "情绪调节问卷",
        stageLabel: "关卡 2 / 4",
        durationMin: 8,
        deadline: "今天截止",
        href: "plan.html",
        reason: "计划当前已解锁任务",
        urgency: 95,
        owned: true
      },
      {
        id: "O002",
        type: "offline_course",
        title: "亲子沟通实战 · 线下沙龙",
        cover: "../assets/img/covers/offline.jpg",
        status: "upcoming",
        progress: 0,
        when: "10-12 14:00",
        city: "深圳",
        durationMin: 120,
        href: "offline-detail.html?id=O002&signed=1",
        reason: "临近开课 · 查看行程",
        urgency: 90,
        owned: true
      },
      {
        id: "C001",
        type: "online_course",
        title: "小学语文阅读启蒙",
        cover: "../assets/img/covers/read.jpg",
        status: "in_progress",
        progress: 25,
        nextLesson: 2,
        totalLessons: 8,
        durationMin: 18,
        href: "learn.html?id=C001",
        reason: "上次学到第 2 节",
        urgency: 70,
        owned: true
      },
      {
        id: "A002",
        type: "article",
        title: "孩子注意力训练方法论",
        cover: "../assets/img/covers/focus.jpg",
        status: "in_progress",
        progress: 40,
        durationMin: 6,
        href: "article-detail.html?id=A002",
        reason: "未读完 · 约 6 分钟",
        urgency: 55,
        owned: true
      },
      {
        id: "MP01",
        type: "assessment",
        title: "亲子沟通能力测评",
        cover: "",
        status: "not_started",
        progress: 0,
        durationMin: 5,
        href: "assess-take.html?type=assessment&id=MP01",
        reason: "已开通尚未开始",
        urgency: 45,
        owned: true
      },
      {
        id: "CP001",
        type: "online_course",
        title: "平台标准课 · 亲子沟通基础",
        cover: "../assets/img/covers/comm.jpg",
        status: "not_started",
        progress: 0,
        nextLesson: 1,
        totalLessons: 8,
        durationMin: 15,
        href: "course.html?id=CP001",
        reason: "已开通尚未开始",
        urgency: 35,
        owned: true
      }
    ];

    if (m === "done") {
      return items.map(function (it) {
        var x = clone(it);
        x.status = "done";
        x.progress = 100;
        x.urgency = 5;
        x.reason = "已完成 · 可复习巩固";
        if (x.type === "online_course") {
          x.href = "learn.html?id=" + encodeURIComponent(x.id);
          x.nextLesson = x.totalLessons;
        }
        if (x.type === "assessment") {
          x.href = "assess.html";
          x.reason = "已完成 · 查看报告";
        }
        if (x.type === "plan") {
          x.currentTask = "全部关卡已完成";
          x.stageLabel = "关卡 4 / 4";
        }
        if (x.type === "offline_course") {
          x.status = "done";
          x.reason = "已参加 · 回顾资料";
        }
        return x;
      });
    }

    return items;
  }

  function actionLabel(item) {
    if (!item) return "去学习";
    if (item.status === "done") {
      if (item.type === "assessment") return "查看报告";
      if (item.type === "offline_course") return "回顾资料";
      return "复习";
    }
    switch (item.type) {
      case "online_course":
        return item.status === "not_started"
          ? "开始第 1 节"
          : "继续第 " + (item.nextLesson || 1) + " 节";
      case "offline_course":
        return "查看行程";
      case "article":
        return item.status === "not_started" ? "开始阅读" : "继续阅读";
      case "assessment":
        return item.status === "not_started" ? "去完成" : "继续作答";
      case "plan":
        return "完成当前关卡";
      default:
        return "去学习";
    }
  }

  function applyProgress(items, state) {
    return items.map(function (raw) {
      var it = clone(raw);
      var p = (state.progress || {})[it.id];
      if (p) {
        if (typeof p.progress === "number") it.progress = p.progress;
        if (p.status) it.status = p.status;
        if (p.nextLesson) it.nextLesson = p.nextLesson;
      }
      if ((state.completedTaskIds || {})[it.id]) {
        it.todayDone = true;
      }
      it.typeLabel = TYPE_LABEL[it.type] || it.type;
      it.action = actionLabel(it);
      return it;
    });
  }

  function listOwned(mode) {
    var state = readState();
    return applyProgress(seedItems(mode), state);
  }

  /**
   * 今日任务推荐：最多 3 个
   * 1 时效紧急 2 计划当前任务 3 学习中 4 未开始 5 复习
   */
  function pickTodayTasks(items) {
    var scored = (items || []).map(function (it) {
      var score = it.urgency || 0;
      if (it.type === "plan" && it.status !== "done") score += 20;
      if (it.status === "in_progress") score += 10;
      if (it.status === "upcoming") score += 15;
      if (it.status === "not_started") score += 5;
      if (it.status === "done") score -= 40;
      if (it.todayDone) score -= 100;
      return { item: it, score: score };
    });
    scored.sort(function (a, b) {
      return b.score - a.score;
    });
    return scored
      .filter(function (x) {
        return x.score > 0;
      })
      .slice(0, 3)
      .map(function (x) {
        return x.item;
      });
  }

  function groupByType(items) {
    var order = ["plan", "online_course", "offline_course", "article", "assessment"];
    var map = {};
    order.forEach(function (t) {
      map[t] = [];
    });
    (items || []).forEach(function (it) {
      if (!map[it.type]) map[it.type] = [];
      map[it.type].push(it);
    });
    return order
      .filter(function (t) {
        return map[t] && map[t].length;
      })
      .map(function (t) {
        return { type: t, label: TYPE_LABEL[t], items: map[t] };
      });
  }

  function continueItem(items) {
    var list = (items || []).filter(function (it) {
      return it.status === "in_progress" || it.status === "upcoming";
    });
    if (!list.length) return null;
    list.sort(function (a, b) {
      return (b.urgency || 0) - (a.urgency || 0);
    });
    return list[0];
  }

  function growthSummary(state) {
    var s = state || readState();
    return {
      streak: s.streak || 0,
      stars: s.stars || 0,
      weekDone: s.weekDone || 0,
      weekGoal: s.weekGoal || 5
    };
  }

  function bumpStreak(state) {
    var today = todayStr();
    if (state.lastStudyDay === today) return state;
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var y =
      yesterday.getFullYear() +
      "-" +
      pad(yesterday.getMonth() + 1) +
      "-" +
      pad(yesterday.getDate());
    if (state.lastStudyDay === y) state.streak = (state.streak || 0) + 1;
    else state.streak = 1;
    state.lastStudyDay = today;
    return state;
  }

  function completeTask(itemId, opts) {
    var state = readState();
    var items = listOwned();
    var item = items.filter(function (x) {
      return x.id === itemId;
    })[0];
    if (!item) return { ok: false, reason: "missing" };
    if ((state.completedTaskIds || {})[itemId]) {
      return { ok: true, already: true, state: growthSummary(state), item: item };
    }

    state.completedTaskIds = state.completedTaskIds || {};
    state.completedTaskIds[itemId] = todayStr();
    state.stars = (state.stars || 0) + (opts && opts.stars ? opts.stars : 3);
    state.weekDone = Math.min((state.weekDone || 0) + 1, state.weekGoal || 5);
    bumpStreak(state);

    state.progress = state.progress || {};
    var p = state.progress[itemId] || {};
    if (item.type === "online_course") {
      p.progress = Math.min(100, (item.progress || 0) + 25);
      p.nextLesson = (item.nextLesson || 1) + 1;
      p.status = p.progress >= 100 ? "done" : "in_progress";
    } else if (item.type === "article") {
      p.progress = 100;
      p.status = "done";
    } else if (item.type === "assessment") {
      p.progress = 100;
      p.status = "done";
    } else if (item.type === "plan") {
      p.progress = Math.min(100, (item.progress || 0) + 25);
      p.status = p.progress >= 100 ? "done" : "in_progress";
    } else if (item.type === "offline_course") {
      p.status = "done";
      p.progress = 100;
    }
    state.progress[itemId] = p;
    writeState(state);

    var refreshed = applyProgress(seedItems(), state).filter(function (x) {
      return x.id === itemId;
    })[0];
    return {
      ok: true,
      starsGain: opts && opts.stars ? opts.stars : 3,
      state: growthSummary(state),
      item: refreshed,
      nextTasks: pickTodayTasks(applyProgress(seedItems(), state))
    };
  }

  function resetDemo(mode) {
    if (mode) localStorage.setItem(DEMO_KEY, mode);
    localStorage.removeItem(STATE_KEY);
    return listOwned(mode);
  }

  global.MpLearning = {
    TYPE_LABEL: TYPE_LABEL,
    demoMode: demoMode,
    listOwned: listOwned,
    pickTodayTasks: pickTodayTasks,
    groupByType: groupByType,
    continueItem: continueItem,
    growthSummary: growthSummary,
    completeTask: completeTask,
    actionLabel: actionLabel,
    readState: readState,
    resetDemo: resetDemo
  };
})(window);
