/* 测评报告模板 + 演示生成结果 */
(function (global) {
  var KEY = "tob_assess_report_v1";

  var AGENTS = [
    { id: "AG01", name: "亲子沟通解读助手", capability: "报告生成", status: "上架" },
    { id: "AG02", name: "家庭教育顾问", capability: "报告生成", status: "上架" },
    { id: "AG05", name: "测评报告解读引擎", capability: "报告生成", status: "上架" },
    { id: "AG03", name: "情绪识别助手", capability: "情绪分析", status: "上架" }
  ];

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function uid(prefix) {
    return (prefix || "RT") + Date.now().toString(36).slice(-6);
  }

  function defaultHtml() {
    return [
      '<section class="rpt">',
      '  <header class="rpt-hd">',
      '    <h1>{{user_name}} 的测评报告</h1>',
      '    <p class="meta">{{assess_name}} · {{finish_time}}</p>',
      '  </header>',
      '  <div class="rpt-score">总分 <b>{{total_score}}</b> · {{segment_label}}</div>',
      '  <h2>智能体解读</h2>',
      '  <div class="rpt-ai">{{ai_summary}}</div>',
      '  <h2>行动建议</h2>',
      '  <div class="rpt-advice">{{advice}}</div>',
      '</section>'
    ].join("\n");
  }

  function seedTemplates() {
    return [
      {
        id: "RT01",
        name: "亲子沟通标准报告",
        ver: "v1.2",
        agentId: "AG01",
        dataVars: "{{user_name}}, {{assess_name}}, {{total_score}}, {{segment_label}}, {{finish_time}}",
        copyVars: "{{ai_summary}}, {{advice}}",
        style: "theme: family-soft",
        html: defaultHtml(),
        status: "上架",
        updated: "2026-09-12"
      },
      {
        id: "RT02",
        name: "家庭教育风格报告",
        ver: "v1.0",
        agentId: "AG02",
        dataVars: "{{user_name}}, {{assess_name}}, {{total_score}}, {{segment_label}}, {{finish_time}}",
        copyVars: "{{ai_summary}}, {{advice}}",
        style: "theme: warm",
        html: defaultHtml(),
        status: "上架",
        updated: "2026-09-01"
      },
      {
        id: "RT03",
        name: "情绪健康干预报告",
        ver: "v1.1",
        agentId: "AG05",
        dataVars: "{{user_name}}, {{assess_name}}, {{total_score}}, {{segment_label}}, {{finish_time}}",
        copyVars: "{{ai_summary}}, {{advice}}",
        style: "theme: calm",
        html: defaultHtml(),
        status: "上架",
        updated: "2026-09-10"
      }
    ];
  }

  function defaultDb() {
    return { templates: seedTemplates() };
  }

  function normalizeStatus(s) {
    if (s === "启用" || s === "已启用" || s === "已上架" || s === "上架") return "上架";
    if (s === "停用" || s === "已停用" || s === "已下架" || s === "下架" || s === "草稿") return "下架";
    return s || "下架";
  }

  function migrateTemplates(list) {
    var changed = false;
    (list || []).forEach(function (t) {
      var next = normalizeStatus(t.status);
      if (t.status !== next) {
        t.status = next;
        changed = true;
      }
    });
    return changed;
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
      if (!db.templates) {
        var d2 = defaultDb();
        writeDb(d2);
        return d2;
      }
      if (migrateTemplates(db.templates)) writeDb(db);
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

  function listAgentsForReport() {
    return AGENTS.filter(function (a) {
      return a.capability === "报告生成" && a.status === "上架";
    }).map(clone);
  }

  function agentById(id) {
    return AGENTS.find(function (a) { return a.id === id; }) || null;
  }

  function listTemplates() {
    return clone(readDb().templates || []);
  }

  function getTemplate(id) {
    var t = (readDb().templates || []).find(function (x) { return x.id === id; });
    return t ? clone(t) : null;
  }

  function saveTemplate(tpl) {
    if (!tpl || !tpl.name) throw new Error("name required");
    var db = readDb();
    var list = db.templates || [];
    if (!tpl.id) tpl.id = uid("RT");
    tpl.status = normalizeStatus(tpl.status);
    tpl.updated = new Date().toISOString().slice(0, 10);
    var i = list.findIndex(function (x) { return x.id === tpl.id; });
    if (i >= 0) list[i] = clone(tpl);
    else list.unshift(clone(tpl));
    db.templates = list;
    writeDb(db);
    return clone(tpl);
  }

  function setTemplateStatus(id, status) {
    var db = readDb();
    var t = (db.templates || []).find(function (x) { return x.id === id; });
    if (!t) return null;
    t.status = normalizeStatus(status);
    t.updated = new Date().toISOString().slice(0, 10);
    writeDb(db);
    return clone(t);
  }

  function mockAiContent(agentId, ctx) {
    var ag = agentById(agentId);
    var name = (ag && ag.name) || "报告智能体";
    var user = (ctx && ctx.user_name) || "学员";
    var seg = (ctx && ctx.segment_label) || "中等水平";
    return {
      ai_summary:
        "【" + name + "】基于作答结果，" + user + "整体表现为「" + seg +
        "」。亲子互动中倾听与表达尚有提升空间，建议关注冲突后的修复对话质量。",
      advice:
        "1. 本周练习「先复述感受再讲规则」至少 3 次；\n" +
        "2. 冲突降温后 24 小时内主动发起一次修复对话；\n" +
        "3. 两周后复测，观察倾听维度变化。"
    };
  }

  function demoContext(overrides) {
    return Object.assign({
      user_name: "李女士",
      assess_name: "亲子沟通能力测评",
      total_score: "72",
      segment_label: "良好",
      finish_time: "2026-09-06 14:22"
    }, overrides || {});
  }

  function renderTemplate(tpl, ctx) {
    tpl = tpl || {};
    ctx = demoContext(ctx);
    var ai = mockAiContent(tpl.agentId, ctx);
    var map = Object.assign({}, ctx, ai);
    var html = tpl.html || defaultHtml();
    Object.keys(map).forEach(function (k) {
      html = html.split("{{" + k + "}}").join(String(map[k]));
    });
    return {
      html: html,
      agentId: tpl.agentId || "",
      agentName: (agentById(tpl.agentId) || {}).name || "—",
      context: map
    };
  }

  function templateOptionsHtml(selectedId) {
    return '<option value="">请选择报告模板</option>' + listTemplates().filter(function (t) {
      return t.status === "上架";
    }).map(function (t) {
      var ag = agentById(t.agentId);
      var label = t.name + " · " + t.ver + (ag ? " · " + ag.name : "");
      return '<option value="' + t.id + '"' + (t.id === selectedId ? " selected" : "") + ">" + label + "</option>";
    }).join("");
  }

  function templateLabel(id) {
    var t = getTemplate(id);
    if (!t) return "未关联";
    return t.name + "（" + t.ver + "）";
  }

  global.AssessReportStore = {
    listAgentsForReport: listAgentsForReport,
    agentById: agentById,
    listTemplates: listTemplates,
    getTemplate: getTemplate,
    saveTemplate: saveTemplate,
    setTemplateStatus: setTemplateStatus,
    normalizeStatus: normalizeStatus,
    mockAiContent: mockAiContent,
    demoContext: demoContext,
    renderTemplate: renderTemplate,
    templateOptionsHtml: templateOptionsHtml,
    templateLabel: templateLabel,
    defaultHtml: defaultHtml,
    reset: function () { writeDb(defaultDb()); }
  };
})(window);
