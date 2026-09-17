/* review-kit 配置样例
 * ------------------------------------------------------------------
 * 在【加载 annotate.js 之前】执行本段即可。全部字段可省，省了用默认值。
 * 三条铁律：
 *   1) serverBase 必须与 `serve.py --prefix` 一致；
 *   2) storeKey 换项目一定换一个，否则同一浏览器下多个项目的标注会串；
 *   3) roots / shells 按你自己的 DOM 结构调整，这是定位准不准的关键。
 * ------------------------------------------------------------------ */

/* ---------- 极简版：只想先跑起来 ---------- */
window.REVIEW_KIT = {
  storeKey: "myproj:review:v1"
};
/* 对应页面引入： <script src="/review-kit/annotate.js" defer></script> */


/* ---------- 完整版：有主体容器 + 布局脚本的项目 ---------- */
window.REVIEW_KIT = {
  // ---- 通讯 & 存储 ----
  serverBase: "/__review",             // 与 serve.py --prefix 一致
  storeKey: "myproj:review:v1",        // localStorage 键

  // ---- 页面标识（看板分组键 / 标注归属）----
  pageRoot: "/app/",                   // 从 URL 里截这一段：/app/orders/list.html → orders/list.html
  // pageStrip: /^\/site\//,           // 二选一：只想去掉前缀时用
  // pageKey: function (loc) { ... },  // 都不合适就自己算

  // ---- 内容根：决定 region + 选择器从哪算起 ----
  roots: [
    { sel: "#app-content",   region: "content" },         // 页面主体
    { sel: "#page-actions",  region: "header-actions" },  // 页面级操作区
    { sel: "#app-header",    region: "header" }
  ],
  cssStopIds: ["app-content", "page-actions"],            // 不做 id 锚点（由 root 指代）

  // ---- 外壳脚本：命中则标 region=shell 并指出该改哪个脚本 ----
  // hints 匹配元素或其父元素的 class（词边界匹配），container 是外壳容器 class
  shells: [
    { name: "layout.js",   hints: ["app-sidebar", "app-topbar"], container: "app-shell" },
    { name: "mobile-nav.js", hints: ["tabbar"],                  container: "mobile-frame" }
  ],

  // ---- 其它 ----
  defaultType: "copy",
  defaultPriority: "P1",
  onToast: function (msg) { console.log("[review]", msg); }
};


/* ---------- 本仓库（tob-solution-main）实际使用的取值 ----------
 * 该仓库把这段放在 prototype/assets/js/proto.js 末尾，并动态插入 annotate.js/css；
 * 页面位于 prototype/{admin,ops,miniprogram}/，所以 kit 路径写作 ../../review-kit/。
 *
 * window.REVIEW_KIT = {
 *   serverBase: "/__review",
 *   storeKey: "proto:review:v1",
 *   pageRoot: "/prototype/",
 *   roots: [
 *     { sel: "#page-content",        region: "content" },
 *     { sel: "#page-header-actions", region: "header-actions" },
 *     { sel: "#header-actions",      region: "header-actions" },
 *     { sel: ".mp-body",             region: "mp" },
 *     { sel: ".mp-frame",            region: "mp" },
 *     { sel: ".hub-inner",           region: "hub" }
 *   ],
 *   shells: [
 *     { name: "admin-shell.js", hints: ["admin-topbar","admin-brand","admin-modules","sidebar"], container: "admin-app" },
 *     { name: "ops-shell.js",   hints: ["ops-topbar","ops-sidebar"],                              container: "ops-app" },
 *     { name: "mp-shell.js",    hints: ["mp-tabbar","review-bar"],                                container: "mp-frame" }
 *   ]
 * };
 *
 * 看板侧（review-kit/board.html 顶部那段）：
 * window.REVIEW_KIT_BOARD = {
 *   serverBase: "/__review",
 *   pageBase: "/prototype/",                 // 「打开页面 →」拼接用
 *   entryUrl: "/prototype/index.html",       // 右上角入口，留空则隐藏
 *   title: "原型评审标注看板"
 * };
 */
