# review-kit 应用教程

从零把一个静态站点接上「圈选标注 → 落盘 → AI 按标注改代码」的闭环。

> 这份是**手把手教程**（按顺序做就行）。要查配置项、命令、接口、数据字段，看 [`README.md`](./README.md)；
> 要查数据结构看 [`ANNOTATION-SCHEMA.md`](./ANNOTATION-SCHEMA.md)；给 AI 的执行规程看 [`AGENT-RULES.md`](./AGENT-RULES.md)。
>
> 本仓库（`tob-solution-main`）本身就是跑通的实例，卡住时可以直接对照：
> 页面侧接入在 `prototype/assets/js/proto.js` 末尾，样板页在 `review-kit/examples/minimal.html`。

---

## 0. 先看清你接的是什么

三个动作，五分钟：

```
① 拷文件     把 review-kit/ 放进你的项目
② 引一行     页面里加 <script src="/review-kit/annotate.js" defer>
③ 起服务     python3 review-kit/serve.py --root . --port 8090
```

跑起来之后你会得到两个东西：

- **对人**：右下角一个「标注」按钮，圈选元素写意见；一个看板（`/__review/`）汇总所有标注
- **对 AI**：一份 `annotations.json`。每条标注带**三重锚点**（CSS 选择器 + 元素文本 + HTML 快照），AI 能凭它精确定位到代码改，改完回填状态

> 关键认知：这套东西的价值**不在「能标注」**，而在**「标注能被 AI 直接消费」**。所以第 8 步（让 AI 用起来）才是重点，前面都是在铺路。

---

## 1. 准备

| 需要 | 说明 |
|---|---|
| Python 3 | 起服务用，只用标准库，不用装任何包。macOS / Linux 自带；Windows 用 `python` 命令 |
| 静态站点 | 纯 HTML/CSS/JS 即可。有构建工具也没关系（见路线 C） |
| 浏览器 | Chrome / Edge / Safari 都行 |

---

## 2. 第一步：把 kit 放进项目

**只拷 4 个必需文件**就够用，文档想留就一起拷：

```bash
# 必需
annotate.js      # 标注层，唯一需要引入页面的文件
annotate.css     # 标注层样式（全 __ann 前缀，不污染你的样式）
board.html       # 评审看板
serve.py         # 静态服务 + 标注读写接口

# 可选（建议一起拷，给 AI 看）
README.md  ANNOTATION-SCHEMA.md  AGENT-RULES.md  review.config.example.js  examples/
```

放到**站点根目录**下最省事，比如 `your-project/review-kit/`：

```bash
cp -r /path/to/review-kit  your-project/review-kit
```

> **目录名可以随便改**（比如改成 `_kit/`）。服务启动时会自动把工具目录挂到 `/<目录名>/`，
> 所以只要页面里的引用路径跟着改就行。

---

## 3. 第二步：接线（三条路，选一条）

### 路线 A · 逐页加一行 —— 静态站首选

在每个需要标注的页面 `</head>` 前加：

```html
<script src="/review-kit/annotate.js" defer></script>
```

页面不在根目录时用相对路径，例如页面在 `sub/` 下：

```html
<script src="../review-kit/annotate.js" defer></script>
```

**先别急着批量加。** 建议拿一个页面跑通（第 5 步自检）再铺开。

### 路线 B · 公共 JS 里动态注入 —— 页面多（几十上百个）时

如果你的站每个页面都引了同一个公共 JS（比如 `common.js` / `app.js`），在那里插一次即可：

```js
/* 放在公共 JS 里，全站自动生效 */
(function () {
  if (window.__reviewKitLoaded) return;
  window.__reviewKitLoaded = true;

  // 按你的目录深度调整这段相对路径
  var base = /\/(sub|admin|ops)\//.test(location.pathname) ? "../../review-kit/" : "../review-kit/";

  var l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = base + "annotate.css";
  document.head.appendChild(l);

  var s = document.createElement("script");
  s.src = base + "annotate.js";
  s.defer = true;
  document.head.appendChild(s);
})();
```

> 本仓库就是这么做的：`prototype/assets/js/proto.js` 末尾。而且它顺手把 `window.REVIEW_KIT` 配置也写了，
> 所以配置和加载在同一处，好维护。

### 路线 C · 项目已有 dev server（Vite / webpack / 后端渲染）

**不用动你的 dev server**，把 `serve.py` 当成一个「标注数据后端」跑在另一个端口就行。

```bash
# 终端 A：你的项目（假设跑在 5173）
npm run dev

# 终端 B：只看数据、不伺服页面
python3 review-kit/serve.py --root . --port 8090
```

然后 `serverBase` 写成完整地址：

```html
<script>
window.REVIEW_KIT = {
  storeKey:   "myproj:review:v1",
  serverBase: "http://127.0.0.1:8090/__review"   // ★ 跨源：写全 http://host:port/前缀
};
</script>
<script src="http://127.0.0.1:8090/review-kit/annotate.js" defer></script>
<!-- 注意：这种情况下 annotate.css 也要从 8090 拿 -->
<link rel="stylesheet" href="http://127.0.0.1:8090/review-kit/annotate.css" />
```

> `serve.py` **默认已开启跨源响应头**（`Access-Control-Allow-Origin: *`，并处理了 OPTIONS 预检），
> 所以跨端口读写能直接通。如不需要可加 `--no-cors` 关掉。

---

## 4. 第三步：起服务

```bash
cd your-project
python3 review-kit/serve.py --root . --port 8090
```

正常会打印：

```
站点根目录 : /path/to/your-project
标注数据   : /path/to/your-project/_review
工具挂载   : http://127.0.0.1:8090/review-kit/
评审看板   : http://127.0.0.1:8090/review-kit/board.html
接入方式   : 页面里 <script src="/review-kit/annotate.js" defer></script>
按 Ctrl+C 停止。
```

常用变体：

```bash
python3 review-kit/serve.py --root ./dist --out .review   # 只伺服 dist，数据放 .review
python3 review-kit/serve.py --port 9000                    # 换端口（记得同步 serverBase）
python3 review-kit/serve.py --prefix /_rv                  # 换接口前缀（记得同步 serverBase）
python3 review-kit/serve.py --no-md                        # 不生成人可读的 md
```

> **服务必须前台常驻**（终端里跑着）。后台进程会被系统回收，回收后标注不落盘。
> 掉没掉：`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8090/__review/ping` —— 返回 `000` 就是没了。

---

## 5. 第四步：自检（30 秒，别跳）

按顺序跑，哪一步不对就停在那儿看第 10 节排错表：

```bash
# ① 服务活着吗
curl -s http://127.0.0.1:8090/__review/ping
# 期望：{"ok": true, "root": "...", "out": "..."}

# ② 工具文件能拿到吗（200 + JS 类型）
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://127.0.0.1:8090/review-kit/annotate.js
# 期望：200 application/javascript; charset=utf-8

# ③ 你的页面能打开吗
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8090/你的页面.html
# 期望：200
```

然后浏览器打开 `http://127.0.0.1:8090/你的页面.html`，检查：

- [ ] 右下角出现「**标注**」按钮
- [ ] 按 `Alt+E`，页面顶部出现「标注模式」提示条，鼠标变十字
- [ ] 点一下某个按钮，弹出编辑卡片
- [ ] 写一句话保存，元素左上角出现蓝色编号角标
- [ ] **刷新页面，角标还在** ← 这条最关键，说明落盘成功

如果第 5 条失败（刷新就没了），说明数据只进了 `localStorage`。看排错表第 2 条。

> 想先试个现成的：`http://127.0.0.1:8090/review-kit/examples/minimal.html` —— kit 自带的最小样例页。

---

## 6. 第五步：怎么标

| 操作 | 效果 |
|---|---|
| `Alt+E`（Mac 也可 `⌥+E`）/ 点右下角「标注」 | 进入 / 退出标注模式 |
| 点击元素 | 选中它，弹出编辑卡片 |
| `Shift+点击` | 选**上一层父元素**（想标整个卡片而不是里面某行字时用） |
| `Alt+L` / 点右下角数字 | 打开本页标注列表（可改状态 / 删除 / 看详情） |
| `Esc` | 关卡片 / 退出标注模式 |
| `Ctrl+Enter`（Mac `⌘+Enter`） | 卡片里直接保存 |

卡片里要选两个东西：

**类型** —— 决定 AI 怎么处理

| 类型 | 含义 | AI 的动作 |
|---|---|---|
| 文案 | 改字 | 直接改文字 |
| 布局 | 位置/间距/顺序 | 调结构或样式 |
| 交互 | 点击后的行为 | 改事件逻辑 |
| 新增 | 这里要加东西 | 加元素/字段 |
| 删除 | 这里不要了 | 删元素**并清理引用** |
| 疑问 | 拿不准，要讨论 | **不改**，单独列出来等人确认 |

> **「疑问」是好东西**：评审时拿不准的点标成疑问，最后一起拿去和研发/设计确认，
> 不会污染「该改的」清单。本仓库历史上就有一批纯疑问标注，AI 的处理是列出来等人拍板，而不是硬改。

**优先级** —— P0 / P1 / P2，看板能按它筛。指令里说「只改 P0」，AI 就只动 P0。

**角标颜色**：蓝 = 待处理，绿 = 已修改，灰 = 不修改，**橙 = 锚点失效**（页面变了，找不到原元素）。

---

## 7. 第六步：看板

浏览器打开 `http://127.0.0.1:8090/__review/`（会自动跳到看板）。

能做的：按页面分组、按状态筛选、按优先级过滤、关键词搜索、点「打开页面 →」跳回原页面。

看板自己的配置在 `review-kit/board.html` 顶部的 `window.REVIEW_KIT_BOARD`：

```js
window.REVIEW_KIT_BOARD = {
  serverBase: "/__review",           // 与 serve.py --prefix 一致
  pageBase:   "/prototype/",         // 「打开页面 →」拼接用
  entryUrl:   "/prototype/index.html", // 右上角入口；留空则隐藏该按钮
  title:      "原型评审标注看板"
};
```

---

## 8. 第七步：让 AI 按标注改代码（闭环的关键）

到这一步只有「标注」没用上。**这一步才是这套工具的目的。**

### 8.1 先给 AI 立规矩（一次性）

把 [`AGENT-RULES.md`](./AGENT-RULES.md) 的内容贴进你项目的 `AGENTS.md` / `CLAUDE.md` / `.cursorrules`，
或者放进项目里（如 `docs/REVIEW-RULES.md`）再在 `AGENTS.md` 里指过去。

这份规程告诉 AI：怎么读 `annotations.json`、三重锚点怎么用、`region: shell` 要去改脚本、
删元素前必须 grep 引用、改完怎么回填状态、怎么验收。

### 8.2 然后每次就一句话

```
按 annotations.json 里的标注改代码，只做 P0。
```

或者带筛选：

```
按标注改代码，只看 admin/orders.html 这个页面。
```

```
按标注改代码，跳过 type=question 的（那些我要先确认）。
```

AI 会做的事（规程里写死了）：

1. `chmod 644` 解除只读 → 读取标注
2. 按 `page` 定位文件，按 `anchor.selectorIn` / `text` / `html` 三重锚点定位元素
3. `region: shell` 的改**外壳脚本**而不是页面 HTML
4. 逐条改，`type=question` 的**不改**，列出来问你
5. 改完把 `status` 置 `resolved` + 写 `resolvedAt`，重生成 `annotations.md`
6. 跑页面自检（DOM 校验之类）并报结果

### 8.3 想省事，可以让 AI 直接动手

如果你把 repo 交给 AI（像本仓库一直以来的用法），只要一句：

```
按项目里的标注修改原型
```

就够了 —— 前提是 `AGENT-RULES.md` 已经贴进项目。

### 8.4 一个真实例子

本仓库的实践流程：

```
用户在页面上圈选 → 标「删除：这个按钮不要了」（P0）
   ↓
AI 读标注 → 定位到 ops/pay-channels.html 的 <button id="btn-guide">
   ↓
改之前先 grep 'btn-guide' 确认还有没有别处引用（避免删了导致 JS 报错）
   ↓
删按钮 + 删对应的 addEventListener
   ↓
把该条标为 resolved，跑页面自检，报告改了什么
```

---

## 9. 配置：什么时候必须改

全部配置项见 [`README.md` 第三节](./README.md) 与 [`review.config.example.js`](./review.config.example.js)。
以下 5 项是**大多数项目都该动**的：

| 配置 | 默认值 | 什么时候必须改 |
|---|---|---|
| `storeKey` | `proto:review:v1` | **一定改**。否则同一浏览器下多个项目的标注会串在一起 |
| `serverBase` | `/__review` | 换了 `--prefix`，或走路线 C（跨源要写完整 `http://host:port/前缀`） |
| `pageRoot` | 无 | **建议配**。`page` 字段是看板分组键，短且稳定最好（`orders/list.html` 优于 `/dist/orders/list.html?v=3`） |
| `roots` | `#page-content` 等 | **建议配**。填你的页面主体容器 id。不配的话选择器会变成 `body > div:nth-of-type(3) > ...` 这种一长串，页面一改就失效 |
| `shells` | `admin-shell.js` 等 | 如果你的顶栏/侧栏是**布局脚本动态生成**的，配上，AI 才知道该改脚本而不是页面 |

最小可用配置（只有一个页面、结构简单）：

```html
<script>
window.REVIEW_KIT = { storeKey: "myproj:review:v1" };
</script>
<script src="/review-kit/annotate.js" defer></script>
```

完整配置样例（含注释）：

```html
<script>
window.REVIEW_KIT = {
  serverBase: "/__review",
  storeKey:   "myproj:review:v1",
  pageRoot:   "/app/",
  roots: [
    { sel: "#app-content",  region: "content" },
    { sel: "#page-actions", region: "header-actions" }
  ],
  cssStopIds: ["app-content", "page-actions"],
  shells: [
    { name: "layout.js", hints: ["app-sidebar", "app-topbar"], container: "app-shell" }
  ],
  defaultType:     "copy",
  defaultPriority: "P1",
  onToast: function (msg) { console.log("[review]", msg); }
};
</script>
<script src="/review-kit/annotate.js" defer></script>
```

---

## 10. 排错表：现象 → 原因 → 解法

| 现象 | 原因 | 解法 |
|---|---|---|
| 右下角**没有**「标注」按钮 | ① `annotate.js` 404 ② JS 报错 ③ 页面还没加载完就返回了 | ① 自检第 ② 条 ② 看控制台报错 ③ 确认 `defer` 且路径对 |
| 标了，**刷新就没了** | 没经 `serve.py` 访问页面（用了 `file://` 或你自己的 dev server），数据只在 `localStorage` | 用 `http://127.0.0.1:8090/...` 打开；或走路线 C 配 `serverBase` 跨源 |
| 标了、在浏览器里有，但**服务端读不到** | 服务端已有数据时，本地新增**不会自动推上去**（只在服务端为空时推） | 手动触发一次保存：打开标注列表点一下任意一条的状态；或控制台执行 `AGENT-RULES.md` 里那段 fetch |
| 角标是**橙色**（锚点失效） | 页面结构变了，原选择器找不到元素 | 正常现象。去标注详情核对，或删掉重标 |
| 选择器是 `body > div:nth-of-type(3) > ...` 一长串 | 没配 `roots`，选择器从 `body` 开始算 | 配 `roots` 指向页面主体容器 |
| 标了**侧栏/顶栏**，改页面 HTML 没效果 | 那是布局脚本动态渲染的 | 配 `shells`，标注会带上「要改哪个脚本」 |
| **看板打不开** / 一直转 | 服务没跑，或 `serverBase` 与 `--prefix` 不一致 | `curl .../__review/ping` 确认；两处前缀必须一致 |
| 不同项目的标注**串在一起** | `storeKey` 用了默认值 | 每个项目换一个 `storeKey` |
| 改完状态，**过一会儿又变回去了** | 某个更早打开的标签页保存时把内存里的旧状态整份覆盖了 | 改完状态后所有原型标签页 `Cmd/Ctrl+Shift+R` 刷一遍 |
| `annotations.json` 写入失败 | 文件被置成只读（`-r--r--r--`） | `chmod 644 _review/annotations.json` |
| `save` 报 500 | body 不是 `{"items":[...]}` | 检查 POST 格式 |
| 跨源 `save` 被浏览器拦 | 用了 `--no-cors`，或 `serverBase` 没写完整地址 | 去掉 `--no-cors`；`serverBase` 写成 `http://127.0.0.1:8090/__review` |

---

## 11. 迁移清单

给新项目照着勾：

**接线**
- [ ] `review-kit/` 已放进站点根（目录名可改）
- [ ] 页面引入 `annotate.js`（路线 A / B / C 选一条）
- [ ] `window.REVIEW_KIT` 已配，且**在加载 `annotate.js` 之前**
- [ ] `storeKey` 换成了本项目专属的
- [ ] `roots` 指向页面主体容器
- [ ] `serverBase` 与启动命令的 `--prefix` 一致

**验证**
- [ ] `/__review/ping` 返回 `{"ok": true}`
- [ ] `/review-kit/annotate.js` 返回 200
- [ ] 页面右下角有「标注」按钮，`Alt+E` 能进标注模式
- [ ] 保存一条标注，**刷新后角标还在**（证明落盘）
- [ ] 看板 `/__review/` 能看到这条

**给 AI 用起来**
- [ ] `AGENT-RULES.md` 已贴进项目的 `AGENTS.md` / `CLAUDE.md`
- [ ] 跑一次「按标注改代码」的小闭环，确认 AI 能正确定位到文件

**长期**
- [ ] 知道服务要前台常驻，掉线怎么查（`ping` 返回 `000`）
- [ ] `.gitignore` 里决定 `annotations.json` 是否入库（建议入库，评审记录有价值；`localStorage` 那侧不用管）

---

## 12. 想更进一步

| 想做 | 怎么做 |
|---|---|
| 标注加自定义字段 | 改 `annotate.js` 里 `TYPES` / 卡片渲染；数据是自由 JSON，加字段不影响已有数据 |
| 只留一个 md 给人看 | 启动加 `--no-md` 反向操作：用 `serve.py` 的 `write_markdown()` 单独生成 |
| 换成别的端口/路径 | `--port` / `--prefix` / `--out`，记得同步前端 `serverBase` |
| 标注在线上环境 | 本地站用本 kit；线上站需浏览器插件形态（可复用同一份 JSON schema） |
| 多环境/多评审人 | 不同人各自 `--out` 到不同目录；或把 `annotations.json` 入库走分支隔离 |
| 用别的 AI 工具 | 数据格式与人/AI 无关，`ANNOTATION-SCHEMA.md` 是通用说明书，任何 AI 都能读 |

---

## 附：本仓库的现成参照

| 想看什么 | 去哪看 |
|---|---|
| 页面侧最简接入（带配置） | `review-kit/examples/minimal.html` |
| 公共 JS 动态注入的写法 | `prototype/assets/js/proto.js` 末尾 |
| 全站页面的配置（多外壳、多根） | `prototype/assets/js/proto.js` 里的 `window.REVIEW_KIT` |
| 一个页面单独接入 | `prototype/index.html` |
| 数据结构长什么样 | `_review/annotations.json` 与 `.md` |
| 给 AI 的规程 | `review-kit/AGENT-RULES.md` |
