/* 兼容层：旧页仍引用 series-store.js 时，转发到 CourseStore（并预加载标签/讲师） */
(function (global) {
  function syncLoad(name) {
    try {
      var cur = document.currentScript;
      var src = (cur && cur.src)
        ? cur.src.replace(/series-store\.js[^/]*$/, name)
        : "../assets/js/" + name;
      var xhr = new XMLHttpRequest();
      xhr.open("GET", src, false);
      xhr.send(null);
      if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
        (0, eval)(xhr.responseText);
      }
    } catch (e) {}
  }
  if (!global.ContentTags) syncLoad("content-tags.js");
  if (!global.Teachers) syncLoad("teachers-store.js");
  if (!global.CourseStore) syncLoad("course-store.js");
  if (global.CourseStore) global.SeriesStore = global.CourseStore;
})(window);
