/* 测评 / 测评包 分支流程 Store
 * scope: assessment | package
 * 项目流：题 → 题/题组/结束；包流：题 → 题|测评|结束
 */
(function (global) {
  var KEY = "tob_assess_flow_v1";
  var COMPLETE = "__complete__";

  function uid(prefix) {
    return (prefix || "N") + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function normalizeOpt(o, i) {
    o = o || {};
    return {
      id: o.id || ("O" + (i + 1) + "_" + Math.random().toString(36).slice(2, 5)),
      t: o.t || o.label || ("选项" + (i + 1)),
      s: typeof o.s === "number" ? o.s : (parseFloat(o.s) || 0)
    };
  }

  function normalizeQuestion(q, idx) {
    q = q || {};
    return {
      id: q.id || ("Q" + (idx + 1)),
      text: q.text || "",
      type: q.type || "单选题",
      req: q.req !== false,
      dim: q.dim || "",
      weight: typeof q.weight === "number" ? q.weight : 1,
      opts: (q.opts || []).map(normalizeOpt),
      parse: q.parse || "",
      status: q.status || "启用"
    };
  }

  function seedAssessmentFlows() {
    var q1 = normalizeQuestion({
      id: "Q_listen_1",
      text: "与孩子发生分歧时，你更常先讲道理还是先听感受？",
      type: "单选题", dim: "倾听表达", weight: 1,
      opts: [
        { id: "O_reason", t: "先讲道理", s: 0 },
        { id: "O_feel", t: "先听感受", s: 2 },
        { id: "O_case", t: "看情况", s: 1 }
      ]
    }, 0);
    var q2 = normalizeQuestion({
      id: "Q_listen_2",
      text: "孩子向你倾诉时，你通常会？",
      type: "单选题", dim: "倾听表达", weight: 1,
      opts: [
        { id: "O_advice", t: "边听边给建议", s: 1 },
        { id: "O_focus", t: "专注听完再回应", s: 2 },
        { id: "O_later", t: "忙时让他晚点说", s: 0 }
      ]
    }, 1);
    var q3 = normalizeQuestion({
      id: "Q_mood_1",
      text: "你最近是否感到情绪低落？",
      type: "单选题", dim: "情绪状态", weight: 1,
      opts: [
        { id: "O_never", t: "从不", s: 0 },
        { id: "O_rare", t: "偶尔", s: 1 },
        { id: "O_often", t: "经常", s: 2 },
        { id: "O_always", t: "总是", s: 3 }
      ]
    }, 2);
    var q4 = normalizeQuestion({
      id: "Q_mood_2",
      text: "情绪低落时，你更常如何应对？",
      type: "单选题", dim: "情绪调节", weight: 1,
      opts: [
        { id: "O_alone", t: "自己消化", s: 1 },
        { id: "O_talk", t: "找人倾诉", s: 2 },
        { id: "O_ignore", t: "压抑不理", s: 0 }
      ]
    }, 3);
    var q5 = normalizeQuestion({
      id: "Q_mood_3",
      text: "过去两周睡眠质量如何？",
      type: "单选题", dim: "情绪状态", weight: 1,
      opts: [
        { id: "O_good", t: "良好", s: 0 },
        { id: "O_ok", t: "一般", s: 1 },
        { id: "O_bad", t: "较差", s: 2 }
      ]
    }, 4);

    return {
      MP01: {
        scope: "assessment",
        ownerId: "MP01",
        name: "亲子沟通能力测评",
        questions: [q1, q2],
        groups: [],
        entryNodeId: "N_start",
        nodes: [
          { id: "N_start", type: "start", x: 40, y: 160 },
          { id: "N_q1", type: "question", questionId: "Q_listen_1", x: 220, y: 140 },
          { id: "N_q2", type: "question", questionId: "Q_listen_2", x: 480, y: 140 },
          { id: "N_end", type: "end", endKind: "normal", x: 740, y: 160 }
        ],
        edges: [
          { id: "E_s1", fromNodeId: "N_start", fromOptId: null, toNodeId: "N_q1", isDefault: true },
          { id: "E_q1a", fromNodeId: "N_q1", fromOptId: "O_reason", toNodeId: "N_q2" },
          { id: "E_q1b", fromNodeId: "N_q1", fromOptId: "O_feel", toNodeId: "N_q2" },
          { id: "E_q1c", fromNodeId: "N_q1", fromOptId: "O_case", toNodeId: "N_q2" },
          { id: "E_q2d", fromNodeId: "N_q2", fromOptId: null, toNodeId: "N_end", isDefault: true }
        ]
      },
      PP01: {
        scope: "assessment",
        ownerId: "PP01",
        name: "情绪健康筛查",
        questions: [q3, q4, q5],
        groups: [{ id: "G_emotion", name: "情绪深入题组", questionIds: ["Q_mood_2", "Q_mood_3"] }],
        entryNodeId: "N_start",
        nodes: [
          { id: "N_start", type: "start", x: 40, y: 180 },
          { id: "N_q1", type: "question", questionId: "Q_mood_1", x: 220, y: 160 },
          { id: "N_g1", type: "group", groupId: "G_emotion", x: 480, y: 60 },
          { id: "N_end", type: "end", endKind: "normal", x: 740, y: 100 },
          { id: "N_risk", type: "end", endKind: "high_risk", x: 740, y: 280 }
        ],
        edges: [
          { id: "E_s1", fromNodeId: "N_start", fromOptId: null, toNodeId: "N_q1", isDefault: true },
          { id: "E_always", fromNodeId: "N_q1", fromOptId: "O_always", toNodeId: "N_g1" },
          { id: "E_often", fromNodeId: "N_q1", fromOptId: "O_often", toNodeId: "N_g1" },
          { id: "E_ok", fromNodeId: "N_q1", fromOptId: "O_never", toNodeId: "N_end" },
          { id: "E_rare", fromNodeId: "N_q1", fromOptId: "O_rare", toNodeId: "N_end" },
          { id: "E_gd", fromNodeId: "N_g1", fromOptId: null, toNodeId: "N_risk", isDefault: true }
        ]
      },
      P001: null,
      MP02: {
        scope: "assessment",
        ownerId: "MP02",
        name: "家庭规则与边界测评",
        questions: [
          normalizeQuestion({
            id: "Q_rule_1",
            text: "家庭规则通常由谁决定？",
            type: "单选题", dim: "规则边界",
            opts: [
              { id: "O_parent", t: "家长说了算", s: 0 },
              { id: "O_together", t: "共同商量", s: 2 },
              { id: "O_child", t: "孩子自己定", s: 1 }
            ]
          }, 0)
        ],
        groups: [],
        entryNodeId: "N_start",
        nodes: [
          { id: "N_start", type: "start", x: 40, y: 120 },
          { id: "N_q1", type: "question", questionId: "Q_rule_1", x: 240, y: 100 },
          { id: "N_end", type: "end", endKind: "normal", x: 500, y: 120 }
        ],
        edges: [
          { id: "E_s", fromNodeId: "N_start", fromOptId: null, toNodeId: "N_q1", isDefault: true },
          { id: "E_d", fromNodeId: "N_q1", fromOptId: null, toNodeId: "N_end", isDefault: true }
        ]
      }
    };
  }

  function seedPackageFlows() {
    var pq1 = normalizeQuestion({
      id: "PQ_stage",
      text: "孩子当前所处阶段更接近？",
      type: "单选题", dim: "分流",
      opts: [
        { id: "O_child", t: "学龄前 / 小学", s: 0 },
        { id: "O_teen", t: "青春期", s: 0 },
        { id: "O_skip", t: "暂不测评", s: 0 }
      ]
    }, 0);
    var pq2 = normalizeQuestion({
      id: "PQ_focus",
      text: "青春期更想优先了解哪一块？",
      type: "单选题", dim: "分流",
      opts: [
        { id: "O_comm", t: "亲子沟通", s: 0 },
        { id: "O_bound", t: "规则边界", s: 0 }
      ]
    }, 1);

    return {
      MS1: {
        scope: "package",
        ownerId: "MS1",
        name: "家庭教育入门测评包",
        desc: "先分流再进入对应测评项目",
        enabled: true,
        shelf: "已上架",
        questions: [pq1, pq2],
        entryNodeId: "N_start",
        nodes: [
          { id: "N_start", type: "start", x: 40, y: 180 },
          { id: "N_gate", type: "question", questionId: "PQ_stage", x: 220, y: 160 },
          { id: "N_a1", type: "assessment", assessmentId: "MP01", x: 520, y: 40 },
          { id: "N_q2", type: "question", questionId: "PQ_focus", x: 520, y: 200 },
          { id: "N_a2", type: "assessment", assessmentId: "MP02", x: 780, y: 280 },
          { id: "N_end", type: "end", endKind: "normal", x: 1000, y: 160 }
        ],
        edges: [
          { id: "E_s", fromNodeId: "N_start", fromOptId: null, toNodeId: "N_gate", isDefault: true },
          { id: "E_child", fromNodeId: "N_gate", fromOptId: "O_child", toNodeId: "N_a1" },
          { id: "E_teen", fromNodeId: "N_gate", fromOptId: "O_teen", toNodeId: "N_q2" },
          { id: "E_skip", fromNodeId: "N_gate", fromOptId: "O_skip", toNodeId: "N_end" },
          { id: "E_comm", fromNodeId: "N_q2", fromOptId: "O_comm", toNodeId: "N_a1" },
          { id: "E_bound", fromNodeId: "N_q2", fromOptId: "O_bound", toNodeId: "N_a2" },
          { id: "E_a1c", fromNodeId: "N_a1", fromOptId: COMPLETE, toNodeId: "N_end" },
          { id: "E_a2c", fromNodeId: "N_a2", fromOptId: COMPLETE, toNodeId: "N_end" }
        ]
      },
      MS2: {
        scope: "package",
        ownerId: "MS2",
        name: "青春期亲子关系测评包",
        desc: "沟通 + 边界组合",
        enabled: true,
        shelf: "已下架",
        questions: [
          normalizeQuestion({
            id: "PQ2_gate",
            text: "是否已完成沟通基础测评？",
            opts: [
              { id: "O_yes", t: "是，直接测边界", s: 0 },
              { id: "O_no", t: "否，先测沟通", s: 0 }
            ]
          }, 0)
        ],
        entryNodeId: "N_start",
        nodes: [
          { id: "N_start", type: "start", x: 40, y: 140 },
          { id: "N_gate", type: "question", questionId: "PQ2_gate", x: 220, y: 120 },
          { id: "N_a1", type: "assessment", assessmentId: "MP01", x: 500, y: 40 },
          { id: "N_a2", type: "assessment", assessmentId: "MP02", x: 500, y: 220 },
          { id: "N_end", type: "end", endKind: "normal", x: 760, y: 140 }
        ],
        edges: [
          { id: "E_s", fromNodeId: "N_start", fromOptId: null, toNodeId: "N_gate", isDefault: true },
          { id: "E_no", fromNodeId: "N_gate", fromOptId: "O_no", toNodeId: "N_a1" },
          { id: "E_yes", fromNodeId: "N_gate", fromOptId: "O_yes", toNodeId: "N_a2" },
          { id: "E_a1c", fromNodeId: "N_a1", fromOptId: COMPLETE, toNodeId: "N_a2" },
          { id: "E_a2c", fromNodeId: "N_a2", fromOptId: COMPLETE, toNodeId: "N_end" }
        ]
      }
    };
  }

  function defaultDb() {
    var assessments = seedAssessmentFlows();
    assessments.P001 = clone(assessments.PP01);
    assessments.P001.ownerId = "P001";
    assessments.P001.name = "情绪健康筛查（运营）";
    return {
      assessments: assessments,
      packages: seedPackageFlows(),
      bank: [
        normalizeQuestion({
          id: "Q01", text: "与孩子发生分歧时，你更常先讲道理还是先听感受？",
          dim: "倾听表达",
          opts: [{ id: "O1", t: "先讲道理", s: 0 }, { id: "O2", t: "先听感受", s: 2 }, { id: "O3", t: "看情况", s: 1 }],
          parse: "先共情再讲道理更利于关系修复", status: "启用"
        }, 0),
        normalizeQuestion({
          id: "Q02", text: "孩子向你倾诉时，你通常会？", dim: "倾听表达",
          opts: [{ id: "O1", t: "边听边给建议", s: 1 }, { id: "O2", t: "专注听完再回应", s: 2 }, { id: "O3", t: "忙时让他晚点说", s: 0 }],
          status: "启用"
        }, 1)
      ]
    };
  }

  function readDb() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) {
        var d = defaultDb();
        writeDb(d);
        return d;
      }
      var db = JSON.parse(raw);
      if (!db.assessments || !db.packages) {
        var d2 = defaultDb();
        writeDb(d2);
        return d2;
      }
      return db;
    } catch (e) {
      var d3 = defaultDb();
      writeDb(d3);
      return d3;
    }
  }

  function writeDb(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  function getAssessmentFlow(id) {
    var db = readDb();
    return db.assessments[id] ? clone(db.assessments[id]) : null;
  }

  function saveAssessmentFlow(flow) {
    if (!flow || !flow.ownerId) throw new Error("ownerId required");
    flow.scope = "assessment";
    flow.questions = (flow.questions || []).map(normalizeQuestion);
    var db = readDb();
    db.assessments[flow.ownerId] = clone(flow);
    writeDb(db);
    return clone(flow);
  }

  function getPackageFlow(id) {
    var db = readDb();
    return db.packages[id] ? clone(db.packages[id]) : null;
  }

  function savePackageFlow(flow) {
    if (!flow || !flow.ownerId) throw new Error("ownerId required");
    flow.scope = "package";
    flow.questions = (flow.questions || []).map(normalizeQuestion);
    var db = readDb();
    db.packages[flow.ownerId] = clone(flow);
    writeDb(db);
    return clone(flow);
  }

  function listPackages() {
    var db = readDb();
    return Object.keys(db.packages).map(function (k) { return clone(db.packages[k]); });
  }

  function getBank() {
    return clone(readDb().bank || []);
  }

  function questionById(flow, qid) {
    return (flow.questions || []).find(function (q) { return q.id === qid; }) || null;
  }

  function nodeById(flow, nid) {
    return (flow.nodes || []).find(function (n) { return n.id === nid; }) || null;
  }

  function groupById(flow, gid) {
    return (flow.groups || []).find(function (g) { return g.id === gid; }) || null;
  }

  function edgesFrom(flow, nodeId, optId) {
    return (flow.edges || []).filter(function (e) {
      if (e.fromNodeId !== nodeId) return false;
      if (optId === undefined) return true;
      if (optId === null) return e.isDefault || e.fromOptId == null;
      return e.fromOptId === optId;
    });
  }

  function resolveNext(flow, fromNodeId, optId) {
    var hit = (flow.edges || []).find(function (e) {
      return e.fromNodeId === fromNodeId && e.fromOptId === optId;
    });
    if (hit) return nodeById(flow, hit.toNodeId);
    var def = (flow.edges || []).find(function (e) {
      return e.fromNodeId === fromNodeId && (e.isDefault || e.fromOptId == null);
    });
    if (def) return nodeById(flow, def.toNodeId);
    return null;
  }

  /** 项目引擎：当前位置 → 下一题 / 结束 */
  function createAssessmentSession(assessmentId) {
    var flow = getAssessmentFlow(assessmentId);
    if (!flow) return null;
    var start = nodeById(flow, flow.entryNodeId) || (flow.nodes || []).find(function (n) { return n.type === "start"; });
    var cur = start ? resolveNext(flow, start.id, null) : null;
    var groupCursor = null; // { groupId, index }

    function currentQuestion() {
      if (!cur) return null;
      if (cur.type === "question") return questionById(flow, cur.questionId);
      if (cur.type === "group") {
        var g = groupById(flow, cur.groupId);
        if (!g || !g.questionIds.length) return null;
        if (!groupCursor || groupCursor.groupId !== g.id) groupCursor = { groupId: g.id, index: 0 };
        return questionById(flow, g.questionIds[groupCursor.index]);
      }
      return null;
    }

    function answer(optId) {
      if (!cur) return { done: true, endKind: "normal" };
      if (cur.type === "end") return { done: true, endKind: cur.endKind || "normal" };

      if (cur.type === "group") {
        var g = groupById(flow, cur.groupId);
        if (g && groupCursor && groupCursor.index < g.questionIds.length - 1) {
          groupCursor.index += 1;
          return { done: false, question: currentQuestion(), node: cur };
        }
        groupCursor = null;
        var afterG = resolveNext(flow, cur.id, null);
        cur = afterG;
      } else if (cur.type === "question") {
        var next = resolveNext(flow, cur.id, optId);
        if (!next) next = resolveNext(flow, cur.id, null);
        cur = next;
        if (cur && cur.type === "group") groupCursor = null;
      }

      if (!cur) return { done: true, endKind: "normal" };
      if (cur.type === "end") return { done: true, endKind: cur.endKind || "normal", node: cur };
      return { done: false, question: currentQuestion(), node: cur };
    }

    var firstQ = currentQuestion();
    return {
      flow: flow,
      getNode: function () { return cur; },
      getQuestion: currentQuestion,
      answer: answer,
      isDone: function () { return !cur || cur.type === "end"; },
      start: function () {
        return { done: !firstQ, question: firstQ, node: cur };
      }
    };
  }

  /** 包引擎 */
  function createPackageSession(packageId) {
    var pack = getPackageFlow(packageId);
    if (!pack) return null;
    var start = nodeById(pack, pack.entryNodeId) || (pack.nodes || []).find(function (n) { return n.type === "start"; });
    var cur = start ? resolveNext(pack, start.id, null) : null;
    var nested = null;

    function packageQuestion() {
      if (!cur || cur.type !== "question") return null;
      return questionById(pack, cur.questionId);
    }

    function answerPackageOpt(optId) {
      if (nested) {
        var r = nested.answer(optId);
        if (!r.done) return { mode: "assessment", assessmentId: nested.flow.ownerId, question: r.question, done: false };
        var after = resolveNext(pack, cur.id, COMPLETE);
        cur = after;
        nested = null;
        return advanceToContent();
      }

      if (!cur) return { done: true, endKind: "normal" };
      if (cur.type === "end") return { done: true, endKind: cur.endKind || "normal" };

      if (cur.type === "question") {
        var next = resolveNext(pack, cur.id, optId) || resolveNext(pack, cur.id, null);
        cur = next;
        return advanceToContent();
      }
      return advanceToContent();
    }

    function advanceToContent() {
      while (cur) {
        if (cur.type === "end") return { done: true, endKind: cur.endKind || "normal", node: cur };
        if (cur.type === "question") {
          return { mode: "package_question", question: packageQuestion(), node: cur, done: false };
        }
        if (cur.type === "assessment") {
          nested = createAssessmentSession(cur.assessmentId);
          if (!nested) {
            cur = resolveNext(pack, cur.id, COMPLETE);
            continue;
          }
          var st = nested.start();
          if (st.done) {
            cur = resolveNext(pack, cur.id, COMPLETE);
            nested = null;
            continue;
          }
          return { mode: "assessment", assessmentId: cur.assessmentId, question: st.question, node: cur, done: false };
        }
        if (cur.type === "start") {
          cur = resolveNext(pack, cur.id, null);
          continue;
        }
        break;
      }
      return { done: true, endKind: "normal" };
    }

    return {
      pack: pack,
      answer: answerPackageOpt,
      start: function () { return advanceToContent(); },
      getNode: function () { return cur; }
    };
  }

  function validateFlow(flow) {
    var issues = [];
    if (!flow || !flow.nodes || !flow.nodes.length) {
      issues.push("流程图为空");
      return issues;
    }
    var ends = flow.nodes.filter(function (n) { return n.type === "end"; });
    if (!ends.length) issues.push("缺少结束节点");

    flow.nodes.forEach(function (n) {
      if (n.type === "question") {
        var q = questionById(flow, n.questionId);
        if (!q) {
          issues.push("节点 " + n.id + " 引用了不存在的题目");
          return;
        }
        (q.opts || []).forEach(function (o) {
          var has = (flow.edges || []).some(function (e) {
            return e.fromNodeId === n.id && e.fromOptId === o.id;
          });
          var hasDef = (flow.edges || []).some(function (e) {
            return e.fromNodeId === n.id && (e.isDefault || e.fromOptId == null);
          });
          if (!has && !hasDef) issues.push("题目「" + (q.text || n.questionId).slice(0, 12) + "」选项「" + o.t + "」无出边");
        });
      }
      if (n.type === "assessment") {
        var hasC = (flow.edges || []).some(function (e) {
          return e.fromNodeId === n.id && e.fromOptId === COMPLETE;
        });
        if (!hasC) issues.push("测评节点 " + (n.assessmentId || n.id) + " 缺少完成出口");
        if (!getAssessmentFlow(n.assessmentId)) issues.push("测评 " + n.assessmentId + " 不存在");
      }
      if (n.type !== "end") {
        var outs = (flow.edges || []).filter(function (e) { return e.fromNodeId === n.id; });
        if (!outs.length && n.type !== "start") {
          /* start always needs out */
        }
        if (n.type === "start" && !outs.length) issues.push("开始节点无出边");
      }
    });
    return issues;
  }

  function packageSummary(flow) {
    var qs = (flow.nodes || []).filter(function (n) { return n.type === "question"; }).length;
    var as = (flow.nodes || []).filter(function (n) { return n.type === "assessment"; }).length;
    return qs + " 分流题 · " + as + " 测评";
  }

  function ensureAssessment(id, meta) {
    var f = getAssessmentFlow(id);
    if (f) return f;
    var q = normalizeQuestion({
      id: "Q_" + id + "_1",
      text: (meta && meta.name ? meta.name : id) + " · 示例题",
      opts: [{ id: "O_a", t: "选项A", s: 1 }, { id: "O_b", t: "选项B", s: 0 }]
    }, 0);
    var flow = {
      scope: "assessment",
      ownerId: id,
      name: (meta && meta.name) || id,
      questions: [q],
      groups: [],
      entryNodeId: "N_start",
      nodes: [
        { id: "N_start", type: "start", x: 40, y: 120 },
        { id: "N_q1", type: "question", questionId: q.id, x: 240, y: 100 },
        { id: "N_end", type: "end", endKind: "normal", x: 500, y: 120 }
      ],
      edges: [
        { id: "E_s", fromNodeId: "N_start", fromOptId: null, toNodeId: "N_q1", isDefault: true },
        { id: "E_d", fromNodeId: "N_q1", fromOptId: null, toNodeId: "N_end", isDefault: true }
      ]
    };
    return saveAssessmentFlow(flow);
  }

  global.AssessFlowStore = {
    COMPLETE: COMPLETE,
    uid: uid,
    normalizeQuestion: normalizeQuestion,
    normalizeOpt: normalizeOpt,
    getAssessmentFlow: getAssessmentFlow,
    saveAssessmentFlow: saveAssessmentFlow,
    ensureAssessment: ensureAssessment,
    getPackageFlow: getPackageFlow,
    savePackageFlow: savePackageFlow,
    listPackages: listPackages,
    getBank: getBank,
    questionById: questionById,
    nodeById: nodeById,
    resolveNext: resolveNext,
    createAssessmentSession: createAssessmentSession,
    createPackageSession: createPackageSession,
    validateFlow: validateFlow,
    packageSummary: packageSummary,
    reset: function () { writeDb(defaultDb()); }
  };
})(window);
