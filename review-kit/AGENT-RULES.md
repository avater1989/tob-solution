# 「按标注改代码」执行规程 · AGENT-RULES

给 AI 助手看的操作规程。**可直接整段贴到其他项目的 `AGENTS.md` / `CLAUDE.md` 里**，
只需把路径换成该项目的 `review-kit/` 位置。

---

## 0. 触发

用户说「按标注改原型 / 按标注改代码」「按 P0 的标注改」这类话时，走本规程。

## 1. 起步三查（每次都做）

```bash
# ① 服务在不在（不在就提醒用户前台起：python3 review-kit/serve.py --root . --port 8090）
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8090/__review/ping

# ② 数据在哪、有多少、按优先级分布
python3 - <<'PY'
import json
from collections import Counter
d=json.load(open("_review/annotations.json")); items=d.get("items",[])
print("共", len(items), "条 · 按优先级", dict(Counter(i.get("priority") for i in items)),
      "· 按状态", dict(Counter(i.get("status") or "open" for i in items)))
PY

# ③ 文件是不是被写成只读了（是则先 chmod 644，否则回填会 PermissionError）
ls -l _review/annotations.json
```

**用户指定了优先级就先按优先级过滤并报数。** 如果没有该优先级的标注，直接说明「没有 P0，实际有这些」并列出，**不要擅自按别的优先级执行**。
（贴士：`priority` 缺省即 `P1`；用户以为自己标了 P0 但没标是常见情况。想确认不是「导出丢字段」，可查标注层的 `exportJson()` 是否原样带出 `priority`。）

## 2. 逐条读，读懂再动手

每条至少看四样：`page`、`anchor.selectorIn` / `anchor.text`、`type`、`priority`、`comment`。

- `type: "question"`（疑问）**不是改动指令**。这类要么向用户确认，要么先给「现状 + 建议改法」再动手。
- `anchor.region === "shell"` → 改 `anchor.shell` 指出的**脚本**，不要去改页面 HTML。
  ⚠️ `shell` 字段可能是启发式猜的，**以页面实际 `<script src>` 为准**（例如标注写 `admin-shell.js`，而该页其实加载 `ops-shell.js`）。
- `comment` 有歧义时先追问，别猜。

## 3. 定位（三重锚点，依次降级）

1. `root` 存在 → 在 `document.querySelector(root)` 内用 `selectorIn` 查；
2. 否则用 `selector` 全文档查；
3. 查不到 → 用 `anchor.text` 在页面做「完全匹配 → 去空白匹配 → 包含匹配」，优先取 `label` 同标签名的；
4. 再不行 → 用 `anchor.html` 的标签名 + class 特征找候选；
5. 都失败 → 判「锚点失效」，**不要猜着改**，去确认是被删了、改名了还是挪位置了。

细节见 [`ANNOTATION-SCHEMA.md`](./ANNOTATION-SCHEMA.md)。

## 4. 判定「到底改没改」

**不要信 `_stale`，也不要信状态字段。** 二者只反映标注创建/校验当时。
必须回到源码或渲染后的 DOM 逐条核对：

- 静态页 → 直接读源码 / `grep` 关键词；
- 由 JS 渲染的内容 → `grep` 渲染函数，或看数据源；
- 跨页面 / 外壳改动 → 先确认那个脚本是不是被目标页真的加载了。

历史标注常被整体回退成 `open`（浏览器旧标签页推回、导出文件覆盖），
**逐条核验后把确实已完成的重新标成 `resolved`** 是常规动作，不是异常。

## 5. 改代码

- 只做标注要求的改动；顺带发现的相邻问题**写进汇报**，不要顺手改。
- **删元素前 grep 它的引用**（`getElementById("目标id")`），否则脚本抛错、页面挂掉。
  一个元素被删后仍被 JS 引用，是这类项目最高频的自伤。
- 删除某个入口（按钮/导航项）后，同步检查：跨页跳转、看板口径、统计数字、帮助文案是否自相矛盾。
- 修表格时按「表头 `<th>` 数 vs 每行 `<td>` 数」校验，注意 `colspan` 空态行和分组表头会误报。
- 复制重组大段 HTML 时，**逐项核对「要删的东西」是否真的删了**——批量重建最容易漏删。

## 6. 回填状态

```bash
cp _review/annotations.json _review/annotations.backup-$(date +%Y%m%d-%H%M%S).json
chmod 644 _review/annotations.json
# 用服务接口回写，让 json 与 md 同步
python3 - <<'PY'
import json, urllib.request
p="_review/annotations.json"
d=json.load(open(p))
for it in d["items"]:
    if (it.get("status") or "open")=="open":
        it["status"]="resolved"
req=urllib.request.Request("http://127.0.0.1:8090/__review/save",
    data=json.dumps({"items": d["items"]}).encode(), headers={"Content-Type":"application/json"})
print(urllib.request.urlopen(req).read().decode())
PY
```

回填后**提醒用户把所有页面标签页强制刷新**（`Cmd/Ctrl+Shift+R`）：
标注层保存时提交的是浏览器内存里的整份数据，旧标签页一旦保存会把状态覆盖回去。

## 7. 自检（能自动化的都自动化）

| 目的 | 手段 |
|---|---|
| 语法 | `node --check <改过的 js>` |
| 页面脚本 id 引用缺失 / 运行时异常 | 项目自带自检脚本（本仓库：`node _review/domcheck.mjs <页面…>`） |
| 表格列错位 | 脚本比对表头 `th` 数与每行 `td` 数（排除 `colspan`） |
| 标注是否真的全部落地 | 对每条写一行断言（元素消失？文案到位？），跑一遍打印 PASS/FAIL |
| 残留关键词 | `grep` 关键词确认 0 残留（最容易抓出漏改） |

## 8. 汇报格式

- 一句话结论：共 N 条，全部已修改 / 有 M 条待确认。
- 按页面分组的改动清单，**说清删了什么、加了什么、改了什么口径**。
- 明确列出「需要你拍板」的点，**不要把猜测写成结论**。
- 提醒刷新标签页。
