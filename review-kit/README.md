# review-kit · 网页评审标注工具

在**任意静态站点**上圈选元素、写评审意见，标注带三重锚点落盘成 JSON，
既给人看（看板 / Markdown），也给 AI 看（按锚点精确定位改代码）。

零构建、零依赖（纯 HTML/CSS/JS + 一个 Python 标准库脚本）。

> **第一次接入看 [`TUTORIAL.md`](./TUTORIAL.md)**（手把手，含自检与排错）；
> 本文件是参考手册（配置项 / 命令 / 接口 / 数据 / 坑）。

---

## 一、30 秒接入

把 `review-kit/` 整个目录放到**站点根目录**下，然后在每个页面引入一行：

```html
<script src="/review-kit/annotate.js" defer></script>
```

> 相对路径也行，例如页面在 `sub/` 下时写 `../review-kit/annotate.js`。
> 如果不想每个页面都加，可以在你项目的公共 JS 里动态插入（见本仓库 `prototype/assets/js/proto.js` 末尾的写法）。

启动服务：

```bash
python3 review-kit/serve.py --root . --port 8090
```

打开 `http://127.0.0.1:8090/你的页面.html`，右下角出现「标注」按钮即就绪。
看板在 `http://127.0.0.1:8090/__review/`（会自动跳到 `review-kit/board.html`）。

> 不用服务也能标（直接开 HTML 文件），但数据只留在浏览器 `localStorage` 里，不落盘。

---

## 二、怎么标

| 操作 | 说明 |
|---|---|
| `Alt+E` / 点右下角「标注」 | 进入 / 退出标注模式（鼠标变十字） |
| 在元素上点击 | 选中元素，弹出编辑卡片 |
| `Shift+点击` | 选上一层父元素（想标整个卡片而不是里面某行字时用） |
| `Esc` | 关卡片 / 退出标注模式 |
| `Alt+L` / 点序号 | 打开本页标注列表 |
| `Ctrl+Enter` | 卡片里直接保存 |

卡片里选**类型**（文案 / 布局 / 交互 / 新增 / 删除 / 疑问）、**优先级**（P0 / P1 / P2），写下意见。

保存后元素左上角出现编号角标：蓝=待处理，绿=已修改，灰=不修改，橙=锚点失效。

---

## 三、配置（可选）

项目差异都在 `window.REVIEW_KIT` 里，**在加载 `annotate.js` 之前**定义即可。全部有默认值。

```html
<script>
window.REVIEW_KIT = {
  serverBase: "/__review",         // 接口前缀，需与 serve.py --prefix 一致
  storeKey:   "proto:review:v1",   // localStorage 键；换项目换一个，避免串数据
  pageRoot:   "/prototype/",       // 从路径里截一段作为 page 标识，如 admin/lives.html
  // pageStrip: /^\/site\//,       // 或者：直接去掉某个前缀
  // pageKey:  function(loc){},    // 或者：完全自己算

  roots: [                         // 内容根：决定 region 归类 + 选择器从哪算起
    { sel: "#page-content",        region: "content" },
    { sel: "#page-header-actions", region: "header-actions" }
  ],
  cssStopIds: ["page-content"],    // 不作为 id 锚点的 id（由 root 指代，选择器更短更稳）

  shells: [                        // 看起来在外壳里的元素 → 标注上写「要改哪个脚本」
    { name: "admin-shell.js", hints: ["admin-topbar","sidebar"], container: "admin-app" }
  ],

  defaultType:     "copy",
  defaultPriority: "P1",
  onToast: function (msg) { /* 你自己的 toast */ }
};
</script>
<script src="/review-kit/annotate.js" defer></script>
```

**三段最需要按项目改的：**

1. **`roots`** —— 页面主体容器。作用有两个：把标注归类成 `content` / `header-actions` 等 region，并让选择器**从容器内部开始算**（否则会带一长串 `body > div:nth-of-type(3)…`）。没有明显主体容器时不配也行，会退化成 `region: "page"`。
2. **`shells`** —— 如果你的站有「布局脚本动态生成顶栏/侧栏」的写法，配这里。命中的元素会被标成 `region: "shell"` 并附上脚本名，AI 就知道该去改布局脚本而不是页面 HTML。
3. **`pageRoot` / `pageStrip`** —— `page` 字段是标注的归属页面键，也是看板的分组键。让它短且稳定（`admin/lives.html` 优于 `/prototype/admin/lives.html?v=3`）。

看板自身也有一个对应的配置块（`review-kit/board.html` 里 `window.REVIEW_KIT_BOARD`）：`serverBase` / `pageBase` / `entryUrl` / `title`。

---

## 四、命令

```bash
python3 review-kit/serve.py                      # 伺服当前目录，端口 8090
python3 review-kit/serve.py --root ./site        # 只伺服 ./site
python3 review-kit/serve.py --port 9000          # 换端口
python3 review-kit/serve.py --out .review        # 标注数据换个目录（默认 <root>/_review）
python3 review-kit/serve.py --prefix /_rv        # 换接口前缀（记得同步 serverBase）
python3 review-kit/serve.py --no-md              # 不生成 annotations.md
python3 review-kit/serve.py --no-cors            # 关闭跨源响应头（默认开启）
```

接口：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `<prefix>/ping` | 健康检查 |
| GET | `<prefix>/load` | 读取全部标注 |
| POST | `<prefix>/save` | 保存全部标注（body: `{"items":[…]}`） |
| OPTIONS | `<prefix>/save` | 跨源预检（已处理） |
| GET | `/review-kit/*` | 工具自身的静态文件（挂在 `/<kit目录名>/`） |

> 服务会把**工具目录**额外挂到 `/<kit目录名>/`，所以你的页面可以直接引用 `/review-kit/annotate.js`，不必把工具复制进站点。

> **页面来源两种接法**：① 直接用它当站点服务（同源，最省事）；② 页面由你自己的 dev server 提供，本服务只当标注数据后端 —— 此时 `serverBase` 写完整地址（如 `http://127.0.0.1:8090/__review`），**默认已开启的跨源响应头**能让读写直接通过。

**服务要前台常驻**（终端里跑着）。后台进程会被回收，回收后你写的标注不落盘。掉没掉：`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8090/__review/ping`，`000` 就是没了。

---

## 五、数据

```
<out>/annotations.json   机器可读（AI 和你自己写的脚本读这个）
<out>/annotations.md     人可读（按页面分组、按状态标注）
```

字段含义与消费方式见 [`ANNOTATION-SCHEMA.md`](./ANNOTATION-SCHEMA.md)；
「怎么按标注改代码」的规程见 [`AGENT-RULES.md`](./AGENT-RULES.md)（可直接贴到别的项目）。

## 六、几个坑

- **右下角没有「标注」按钮**：多半是 `annotate.js` 404（路径不对）。自检：`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8090/review-kit/annotate.js`。
- **页面由自己的 dev server 提供时**：数据接口会变成跨源。本服务默认已放行（`Access-Control-Allow-Origin: *` + OPTIONS 预检），把 `serverBase` 写成完整地址即可；别加 `--no-cors`。
- **`annotations.json` 被写成只读**：某些评审工具（含本工具的旧版工作流）会把它置成 `-r--r--r--`。要回填状态先 `chmod 644`。
- **状态被旧标签页回退**：`annotate.js` 保存时提交的是**浏览器内存里的整份** items。若某个标签页是在上次写入之前打开的，它一触发保存就会把旧状态覆盖回去。→ 改完状态后，所有原型标签页 `Cmd+Shift+R` / `Ctrl+Shift+R` 刷一遍。
- **浏览器里新标的没落盘**：启动时是「服务端 ∪ 本地」合并，且**只有服务端为空时**才把本地推上去。服务端已有数据时，本地新增的不会自动同步。手动触发一次保存即可（打开标注列表点一下任意一条的状态，或执行 `AGENT-RULES.md` 里的那行 fetch）。
- **删按钮/元素前先 grep 它的 `getElementById` 引用**，否则页面脚本抛错。（这是改代码侧的经验，顺手记在这。）

## 七、文件

| 文件 | 作用 |
|---|---|
| `annotate.js` | 标注层（唯一需要引入页面的文件） |
| `annotate.css` | 标注层样式，全 `__ann` 前缀、颜色变量全带兜底值，可与宿主设计系统共存 |
| `board.html` | 评审看板：按页面分组、按状态筛选、按优先级过滤、关键词搜索 |
| `serve.py` | 静态服务 + 标注读写接口（Python 3 标准库） |
| `TUTORIAL.md` | **手把手接入教程**（含自检清单与排错表），第一次接入看这个 |
| `ANNOTATION-SCHEMA.md` | 数据结构说明（给人和 AI 看） |
| `AGENT-RULES.md` | 「按标注改代码」的执行规程，可贴到其他项目 |
| `review.config.example.js` | 配置样例，含本仓库的实际取值 |
| `examples/minimal.html` | 最小可运行样例页（配好配置、有几处可标的元素） |
