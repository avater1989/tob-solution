/* 内容分类共享数据源
 * 「内容分类」页（content-category.html）为唯一维护入口，
 * 系列课 / 视频 / 图文 等内容列表筛选与编辑页的「内容分类」取值均来源于此。
 * 原型阶段为内存数据，各页面刷新后回到初始值。
 */
(function () {
  var CATS = [
    { id: "C1", name: "默认分类", count: 2, enabled: true },
    { id: "C2", name: "K12 教育", count: 2, enabled: true },
    { id: "C3", name: "家庭教育", count: 0, enabled: true },
    { id: "C4", name: "学习能力", count: 0, enabled: true }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  window.ContentCats = {
    list: function () { return CATS; },
    /* 启用中的分类名称数组 */
    names: function () {
      return CATS.filter(function (c) { return c.enabled; }).map(function (c) { return c.name; });
    },
    /* 生成 <option> 片段
     * opts.allLabel  ：首位「全部xx」筛选项（value=""）
     * opts.emptyLabel：首位「请选择/未分类」占位项（value=""）
     */
    optionsHtml: function (opts) {
      opts = opts || {};
      var html = "";
      if (opts.allLabel) html += '<option value="">' + esc(opts.allLabel) + "</option>";
      else if (opts.emptyLabel) html += '<option value="">' + esc(opts.emptyLabel) + "</option>";
      CATS.filter(function (c) { return c.enabled; }).forEach(function (c) {
        html += '<option value="' + esc(c.name) + '">' + esc(c.name) + "</option>";
      });
      return html;
    }
  };
})();
