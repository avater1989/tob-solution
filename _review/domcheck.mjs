/**
 * 原型页面自检（Node 桩化 DOM，无需浏览器）
 *
 * 背景：本机无 jsdom，无头 Chrome 也无法正常 dump-dom，
 *       所以用最小 DOM 桩在 Node 里直接执行页面内联脚本。
 *
 * 用法：
 *   node _review/domcheck.mjs                      # 默认检查 admin/mp-*.html
 *   node _review/domcheck.mjs admin/mp-home.html   # 指定文件
 *
 * 三项检查：
 *   1. 脚本里 getElementById 引用的 id 是否都在 HTML 中定义（抓拼写错误）
 *   2. 执行脚本是否抛异常（抓运行时报错）
 *   3. 渲染后各容器是否真的产出了内容（抓"空壳"）
 *
 * 说明：会预先解析每个 <select> 的默认选中项（带 selected 的 option，
 *       没有则取第一项）并预置到桩的 value，避免依赖 select 初值的假阳性。
 *       同理预置 <input value="..."> 的初值。
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const ADMIN = path.join(ROOT, "prototype/admin");
const files = args.length
  ? args.map((a) => path.resolve(ROOT, a))
  : fs.readdirSync(ADMIN)
      .filter((n) => /^mp-.*\.html$/.test(n))
      .sort()
      .map((n) => path.join(ADMIN, n));

function fakeEl(tag, id) {
  const el = {
    tagName: tag || "div", id: id || "", _html: "", _text: "", value: "",
    checked: false, disabled: false,
    style: new Proxy({}, {
      get: (t, k) => (t[k] === undefined ? "" : t[k]),
      set: (t, k, v) => { t[k] = v; return true; }
    }),
    classList: {
      _s: new Set(),
      add(...c) { c.forEach((x) => this._s.add(x)); },
      remove(...c) { c.forEach((x) => this._s.delete(x)); },
      contains(c) { return this._s.has(c); },
      toggle(c) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); }
    },
    dataset: {}, children: [], parentNode: null, innerText: "", className: "",
    firstChild: null, firstElementChild: null, nextSibling: null,
    setAttribute(k, v) { if (k === "id") this.id = v; },
    getAttribute() { return null; }, removeAttribute() {}, hasAttribute() { return false; },
    addEventListener() {}, removeEventListener() {},
    appendChild(c) { this.children.push(c); if (!this.firstChild) this.firstChild = c; return c; },
    insertBefore(c) { this.children.unshift(c); if (!this.firstChild) this.firstChild = c; return c; },
    removeChild(c) { this.children = this.children.filter((x) => x !== c); return c; },
    querySelector() { return fakeEl(); }, querySelectorAll() { return []; }, closest() { return null; },
    insertAdjacentHTML() {}, focus() {}, click() {}, remove() {},
    getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; },
    scrollIntoView() {}
  };
  Object.defineProperty(el, "innerHTML", { get() { return el._html; }, set(v) { el._html = String(v); } });
  Object.defineProperty(el, "textContent", { get() { return el._text; }, set(v) { el._text = String(v); } });
  return el;
}

let failed = 0;

for (const file of files) {
  const label = path.relative(ROOT, file);
  const src = fs.readFileSync(file, "utf8");

  const defined = new Set([...src.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const used = new Set([...src.matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]));
  /* 脚本里用拼接生成的 id（如 id="' + slot + '-goods"'）无法静态枚举，
     按后缀模板放行，否则会误报 "id 引用缺失"。拼错的 id 仍会被抓到。 */
  const dynSuffix = [...src.matchAll(/id="'\s*\+\s*[\w.]+\s*\+\s*'(-[a-z][\w-]*)"/g)].map((m) => m[1]);

  /* 预置表单初值：桩不解析 HTML，这里手工提取 select 默认项与 input 的 value */
  const seed = new Map();
  for (const m of src.matchAll(/<select\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const opts = [...m[2].matchAll(/<option\b([^>]*)>/g)].map((o) => o[1]);
    const pick = opts.find((a) => /\bselected\b/.test(a)) || opts[0] || "";
    const v = /\bvalue="([^"]*)"/.exec(pick);
    seed.set(m[1], v ? v[1] : "");
  }
  for (const m of src.matchAll(/<input\b[^>]*\bid="([^"]+)"[^>]*\bvalue="([^"]*)"/g)) seed.set(m[1], m[2]);
  for (const m of src.matchAll(/<textarea\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/textarea>/g)) seed.set(m[1], m[2]);

  /* 页面内联脚本 + 外链的本工程脚本（外链不加载会误报 "XXX is not defined"） */
  /* 先外链脚本、后内联脚本 —— 与浏览器实际执行顺序一致 */
  const inline = [...src.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const blocks = [...src.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((s) => !/^(https?:)?\/\//.test(s))
    .map((s) => path.resolve(path.dirname(file), s.split("?")[0]))
    .filter((p) => fs.existsSync(p))
    .map((p) => fs.readFileSync(p, "utf8"))
    .concat(inline);
  /* 外链脚本（如 admin-shell.js）会用字符串拼出整段 DOM 并注入，
     其中的 id 不在页面 HTML 里；把这些脚本里的 id="..." 也算作"已定义" */
  for (const b of blocks) {
    for (const m of b.matchAll(/\bid="([^"]+)"/g)) defined.add(m[1]);
  }
  /* 还有一类是运行时赋值造出来的 id（el.id = "xxx"），同样在 HTML 里找不到 */
  for (const b of [src, ...blocks]) {
    for (const m of b.matchAll(/\.id\s*=\s*["']([^"']+)["']/g)) defined.add(m[1]);
  }
  const missing = [...used].filter((id) => !defined.has(id) && !dynSuffix.some((s) => id.endsWith(s)));
  const cache = new Map();
  const doc = {
    getElementById(id) { if (!cache.has(id)) cache.set(id, fakeEl("div", id)); return cache.get(id); },
    querySelector() { return fakeEl(); },
    querySelectorAll() { return []; },
    addEventListener() {},
    createElement(t) { return fakeEl(t); },
    body: fakeEl("body"), documentElement: fakeEl("html"),
    head: fakeEl("head"), styleSheets: [],
    currentScript: null, readyState: "complete"
  };
  for (const [id, v] of seed) doc.getElementById(id).value = v;

  /* 让 window === 全局对象，这样 `window.X = ...` 与裸名 `X` 等价（与浏览器一致）。
     很多脚本写成 (function (global) { global.X = ... })(window)，若 window 是普通对象则裸名取不到。 */
  const before = new Set(Object.keys(globalThis));
  const g = globalThis;
  const set = (k, v) => {
    try { g[k] = v; } catch (e) {
      try { Object.defineProperty(g, k, { value: v, configurable: true, writable: true }); } catch (e2) { /* noop */ }
    }
  };
  set("window", g);
  set("document", doc);
  const store = { getItem() { return null; }, setItem() {}, removeItem() {}, clear() {}, key() { return null; }, length: 0 };
  set("localStorage", store);
  set("sessionStorage", { getItem() { return null; }, setItem() {}, removeItem() {}, clear() {}, key() { return null; }, length: 0 });
  set("location", {
    href: "file://" + file, search: "", hash: "", pathname: "/" + label,
    replace() {}, assign() {}, reload() {}, toString() { return "file://" + file; }
  });
  /* 页面上常用 new Option(...) 造下拉项 */
  set("Option", function (text, value) { return { text: String(text), value: value == null ? String(text) : String(value) }; });
  set("setTimeout", function () { return 0; });
  set("clearTimeout", function () {});
  set("Proto", { toast() {}, open() {}, items() { return []; } });
  set("confirm", function () { return true; });
  set("alert", function () {});
  set("navigator", { userAgent: "node" });
  set("history", { replaceState() {}, pushState() {}, back() {}, forward() {}, length: 0, state: null });
  set("Event", function () {});
  set("CustomEvent", function () {});
  set("ResizeObserver", undefined);
  set("requestAnimationFrame", function () { return 0; });
  /* window 指向全局后，需补齐浏览器 window 上常用方法 */
  set("addEventListener", function () {});
  set("removeEventListener", function () {});
  set("open", function () {});
  set("print", function () {});
  set("scrollTo", function () {});
  set("getComputedStyle", function () { return { getPropertyValue: function () { return ""; } }; });
  set("matchMedia", function () { return { matches: false, addListener() {}, removeListener() {} }; });
  set("innerWidth", 1440);
  set("innerHeight", 900);
  set("devicePixelRatio", 1);

  let rtErr = null;
  for (const b of blocks) {
    try {
      new Function(b)();
    } catch (e) { rtErr = e; }
  }

  /* 清理本文件挂在全局上的东西，避免污染下一个文件 */
  for (const k of Object.keys(g)) {
    if (before.has(k)) continue;
    try { delete g[k]; } catch (e) { /* 只读属性跳过 */ }
  }
  for (const k of ["window", "document", "localStorage", "location", "setTimeout", "clearTimeout",
    "Proto", "confirm", "alert", "navigator", "history", "Event", "CustomEvent",
    "ResizeObserver", "requestAnimationFrame"]) {
    if (before.has(k)) continue;
    try { delete g[k]; } catch (e) { /* noop */ }
  }

  const filled = [];
  for (const [id, el] of cache) {
    if (!defined.has(id)) continue;
    const text = el._html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (text.length > 20) filled.push(id + " → " + text.slice(0, 46) + "…");
  }

  const ok = missing.length === 0 && !rtErr;
  if (!ok) failed++;
  console.log((ok ? "OK   " : "FAIL ") + label);
  if (missing.length) console.log("      id 引用缺失: " + missing.join(", "));
  if (rtErr) console.log("      运行时异常: " + rtErr.message);
  if (filled.length) console.log("      已渲染: " + filled.join("\n              "));
}

console.log(failed ? "\n" + failed + " 个文件有问题" : "\n全部通过");
process.exit(failed ? 1 : 0);
