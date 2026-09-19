/* 兼容层：内容分类已由「内容标签」替代；保留 ContentCats API 以免旧页报错 */
(function () {
  function ensureTags() {
    if (window.ContentTags) return;
    try {
      var cur = document.currentScript;
      var src = (cur && cur.src)
        ? cur.src.replace(/content-cats\.js[^/]*$/, "content-tags.js")
        : "../assets/js/content-tags.js";
      var xhr = new XMLHttpRequest();
      xhr.open("GET", src, false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
        (0, eval)(xhr.responseText);
      }
    } catch (e) {}
  }
  ensureTags();
  var Tags = window.ContentTags;
  window.ContentCats = {
    list: function () {
      return (Tags ? Tags.treeFlat() : []).map(function (t) {
        return { id: t.id, name: t.pathLabel || t.name, count: 0, enabled: t.enabled };
      });
    },
    names: function () {
      return (Tags ? Tags.treeFlat({ enabledOnly: true }) : []).map(function (t) { return t.name; });
    },
    optionsHtml: function (opts) {
      opts = opts || {};
      if (!Tags) return opts.allLabel ? '<option value="">' + opts.allLabel + "</option>" : "";
      /* 旧 API 用 name 作 value；新标签用 id。过渡期同时输出 pathLabel 为展示、id 为 value */
      var html = "";
      if (opts.allLabel) html += '<option value="">' + Tags.esc(opts.allLabel) + "</option>";
      else if (opts.emptyLabel) html += '<option value="">' + Tags.esc(opts.emptyLabel) + "</option>";
      Tags.treeFlat({ enabledOnly: true }).forEach(function (t) {
        var prefix = t.depth ? new Array(t.depth + 1).join("—") + " " : "";
        html += '<option value="' + Tags.esc(t.id) + '">' + Tags.esc(prefix + t.name) + "</option>";
      });
      return html;
    }
  };
})();
