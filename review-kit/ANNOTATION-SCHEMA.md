# 标注数据结构 · ANNOTATION-SCHEMA

落盘文件：`annotations.json`

```json
{
  "v": 1,
  "updated": "2026-09-17T13:43:48",
  "items": [ Annotation, ... ]
}
```

> `v` 是格式版本；`updated` 由服务写入。标注层「导出全部 JSON」导出的是
> `{ "v": 1, "exportedAt": "...", "items": [...] }` —— 两种都能被服务端接受（服务只读 `items`）。

## Annotation

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 唯一 id，客户端生成（时间戳 + 随机），**不要改**，合并/回填状态都靠它 |
| `page` | string | 归属页面键。默认取站点相对路径（如 `admin/lives.html`），可用配置 `pageRoot` / `pageStrip` / `pageKey` 定制 |
| `anchor` | object | 锚点，见下 |
| `type` | string | `copy` 文案 / `layout` 布局 / `interaction` 交互 / `add` 新增 / `remove` 删除 / `question` 疑问 |
| `priority` | string | `P0` / `P1` / `P2` |
| `comment` | string | 评审意见（自然语言，通常就是一句「去掉」「改成 XX」） |
| `status` | string | `open` 待处理 / `resolved` 已修改 / `wontfix` 不修改 |
| `createdAt` | ISO string | 创建时间 |
| `updatedAt` | ISO string | 最近被改过的时间（可选） |
| `resolvedAt` | ISO string | 标记已修改的时间（可选，由执行方回填） |
| `_stale` | bool | 客户端校验过：当前页面上还找不找得到该锚点。`true` = 元素已消失（很可能已经改掉了）。**只在创建/校验当时有效，不等于现状** |

## anchor

三重锚点 —— 三层依次降级，任一层命中即可定位。

```json
{
  "selector":   "#page-content > div:nth-of-type(2) > table > thead > tr > th:nth-of-type(4)",
  "selectorIn": "div:nth-of-type(2) > table > thead > tr > th:nth-of-type(4)",
  "root":       "#page-content",
  "region":     "content",
  "shell":      "",
  "label":      "th",
  "text":       "讲解话术",
  "html":       "<th>讲解话术</th>"
}
```

| 字段 | 说明 |
|---|---|
| `selector` | 完整 CSS 选择器（从 `body` 起算） |
| `selectorIn` | **去掉 root 前缀**的选择器，定位时应在 `root` 内使用 |
| `root` | 内容根选择器（来自配置 `roots`），可能为空 |
| `region` | `content` / `header-actions` / `page` / `shell` / 自定义，用于人读与分组 |
| `shell` | 仅当 `region === "shell"`：**该改的脚本文件名**。看到它就说明不要去改页面 HTML，要去改布局脚本 |
| `label` | 元素简短签名，如 `th`、`button#btn-x.btn.btn-primary`、`span.tag.tag-blue` |
| `text` | 元素可见文本（截断）。**最可靠的兜底锚点** |
| `html` | 元素 outerHTML 片段（截断）。当选择器因 DOM 变动失效时，用它 + text 反查 |

### 定位算法（推荐顺序）

1. 若 `root` 存在，在 `document.querySelector(root)` 内用 `selectorIn` 查；
2. 否则用 `selector` 全文档查；
3. 查不到 → 用 `anchor.text` 在当前页做「文本完全匹配 → 去空白后匹配 → 包含匹配」，并优先取 `label` 标签名相同的元素；
4. 仍查不到 → 用 `anchor.html` 的结构特征（标签名 + class 组合）找候选；
5. 都失败 → 判定「锚点失效」，**不要猜**，去页面上确认该元素是被删了、改名了，还是挪地方了。

## 三条使用约定

1. **`_stale` 和锚点只代表「标注创建时」的状态。** 判断「到底改没改」必须回到源码或渲染后的 DOM 逐条核对——这是实践中最容易误判的地方。
2. **不要手工编辑 `items`。** 状态的读写走服务接口或 `annotate.js`，否则浏览器里那份会用「服务端 ∪ 本地」的并集把它覆盖回来。
3. **`id` 是唯一身份。** 回填状态时按 `id` 匹配，别按 `page` + `comment` 匹配（意见可能被编辑）。
