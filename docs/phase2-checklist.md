# 一期/二期 对比与待确认清单

> 基准：协作者一期原型 `https://tob-solution-minimmvp.vercel.app/`（已逐端抓取 `modules` + `sidebars` + C 端导航/页面内容核对，非目测）
> 口径：本地菜单里「一期链接没有的项」→ 标「二期」，受**评审路径条**右侧的「二期」开关控制（默认隐藏）
> 状态：**已落地**部分无需确认；**第 1.2 / 1.3 / 2.2 / 2.3 / 三**为需你逐项确认的差异
> 更新：2026-09-30 已按原型评审标注（`_review/annotations.json`）处理第六轮 32 条（含**商品审核下线**、商品列表列改造），见下方「零·续」第 10 条

---

## 〇、已落地（无需确认）

| 项 | 内容 |
|---|---|
| admin 二期黑名单 | 13 项，写入 `prototype/assets/js/phase2-config.js` |
| ops 二期黑名单 | 23 项，同上（2026-09-27 第二轮标注后 +1，见「零·续」第 5 条） |
| 二期页面拦截 | 36 个二期页面 body 加 `data-phase2="1"`（admin 15 / ops 21），一期视图下直接访问会显示提示横幅 |
| 二期开关 | 位于**评审路径条最右侧**（蓝色 `#0e42d2` 那条，就是页面最上方那条）、「导航」按钮之后；`localStorage` 记忆，默认关。admin / ops 的**浅色顶栏已不再放**开关 |
| 菜单渲染 | 二期项打黄色「二期」徽标；组内全二期则整组隐藏；模块内全二期则顶部模块隐藏 |
| ops 评审路径条 | 「平台内容 / 内容审核」两步随开关显隐（一期视图下自动隐藏并重新编号） |
| C 端对齐 | `learning.html` 改为艺博士 AI 会话页、`ai.html` 改为跳转桩、`mine.html`「学习中心」→「全部课程」、`plan.html` 返回改为首页 |
| 缓存版本号 | 按项目约定统一 bump（改共享脚本不 bump 会让用户普通刷新跑到旧 JS）：`proto.css?v=15`（214 处）、`mp.css?v=21`（20）、`admin-shell.js?v=25`（121）、`ops-shell.js?v=23`（66）、`mp-shell.js?v=1`（19，此前完全没有版本号）、`phase2-config.js?v=2`（shell 内部 XHR 加载） |

**验证结果**（真实 Chromium 冒烟，59 项断言全过、0 控制台错误；另有 Node DOM 桩校验）：

- 一期视图 admin 侧栏可达 **62 项**（与一期链接 62 项一致）；ops **21 项**
- 一期视图 ops「内容与审核」模块整体隐藏（配置 7 个模块 → 实际显示 6 个）；admin「内容」模块只剩「内容资产」5 项；ops「财务」模块的「收款与进件」分组整体隐藏
- ops「租户管理」独立模块：3 组 3 项，6 个租户类页面均归入该模块并正确高亮
- 二期视图开启后，全部 36 个二期项带徽标出现，开关状态正确
- 开关位置断言：存在 `.review-bar #phase2-toggle`、位于评审条「导航」之后、`.admin-top-actions` 内不再有开关

---

## 〇·续、按评审标注 / 口头决定调整

### 1. 原型标注（2026-09-27 13:30 标注 / 13:33 处理）

原型里的 3 条标注（均在 `admin/orders.html` · 交易 → 资产管理）意见为「取消二期标识」，已处理并回写状态：

| 标注元素 | 原状态 | 现状态 |
|---|---|---|
| 对账管理 | 二期 | **一期**（`phase2-config.js` 移除 `recon`，`admin/recon.html` 去掉 `data-phase2`） |
| 结算单 | 二期 | **一期**（移除 `settlement` + 去掉 `data-phase2`） |
| 提现管理 | 二期 | **一期**（移除 `withdraw` + 去掉 `data-phase2`） |

标注状态已由 `open` → `resolved`，`_review/annotations.md` 显示「待处理 0 / 已修改 3」。

### 2. ops 端同名三项放开一期（G2，2026-09-27 13:50 决定）✅ 已落地

ops 端 `recon` / `settlements` / `payouts` 从二期黑名单移除，三个页面去掉 `data-phase2`；ops 评审路径条的「④对账结算」同步改为一期步骤。

### 3. 二期开关位置调整（2026-09-27 13:50 决定）✅ 已落地

原实现放在 `.admin-topbar`（浅色底），已改为放在**评审路径条**内、「导航」之后——该条背景 `#0e42d2`，是页面上最上方的蓝色横条，与 C 端 `mp-shell` 的开关位置一致。

### 4. ops 新增「租户管理」顶级模块（2026-09-27 13:57 决定）✅ 已落地

「租户管理 / 应用管理 / 套餐管理」三组从「系统管理」迁出，成为独立顶级模块，位置排在「工作台」之后（与一期链接的模块顺序一致）。

| 改动 | 说明 |
|---|---|
| `ops-shell.js` `modules` | 新增 `{ id: "tenant", label: "租户管理", href: "tenants.html" }`，置于「工作台」后 → 顶部模块 6 → 7 |
| `ops-shell.js` `sidebars` | 新增 `tenant`（3 组 3 项）；`sys` 只剩「系统用户管理 / 系统管理」2 组 |
| 归属映射 | 删除 `moduleId === "tenant" \|\| "merchant" → "sys"` 的旧映射（`merchant` 无页面使用，一并去掉） |
| 页面归属 | `ops/tenant-profile.html` 的 `data-module` 由 `sys` 改为 `tenant`（其余 6 个租户页本来就是 `tenant`） |
| 面包屑 | 该类页面统一为「运营后台 / 租户管理 / …」；顺带修正 `apps.html`、`app-config.html` 漏掉的「租户管理」层级，以及 `tenant-profile.html` 残留的「系统管理」 |
| 公告条文案 | 「…系统管理（含租户管理）」→「租户管理 / 内容与审核 / 交易 / 财务 / 数据 / 系统管理」 |

**✅ 连带点已收口（2026-09-27 14:16 用户确认）：**

| # | 事项 | 说明 | 结论 |
|---|---|---|---|
| G1 | **资产总览**（admin 交易 → 资产管理） | 标注只点了 3 项，`资产总览` 未标。当时担心「对账/结算/提现都改一期后，汇总入口留二期逻辑不顺」 | **保持二期** —— 用户明确「不用，逻辑是完整的了」。`phase2-config.js` admin 名单里的 `assets` 不动 |

### 5. ops「收款与进件」整组二期（2026-09-27 14:02 标注 / 14:09 处理）✅ 已落地

标注锚点在 `ops/settlements.html` 侧栏分组标签「收款与进件」，意见「标记为二期」；口头确认范围为**整组**。

| 改动 | 说明 |
|---|---|
| `phase2-config.js` ops 名单 | 新增 `onboard-audit`（`pay-channels` 原本已是二期）→ 该分组两条链接均二期，一期视图下整组自动隐藏 |
| `ops/onboard-audit.html` | `<body>` 加 `data-phase2="1"` |
| `ops/pay-members.html` | 同为该分组下的详情页（进件审核 → 查看会员），一并加 `data-phase2="1"`，保持一期视图无二期入口 |
| 缓存版本号 | `phase2-config.js?v=3`（三个 shell 内 XHR 引用）、`admin-shell.js?v=26`（121 处）、`ops-shell.js?v=24`（66 处）、`mp-shell.js?v=2`（19 处） |

> 口径变化：ops 财务模块的 `收款与进件` 由「收款与清分二期 / 进件审核一期」变为**整组二期**；一期视图下 ops 侧栏可达项 22 → 21。
> 这与此前注释里写的「一期保留进件审核」相反，以本次标注为准。若后续想恢复进件审核为一期，只需从 `phase2-config.js` ops 名单删掉 `onboard-audit` 并去掉该页 `data-phase2`。

### 6. 第三轮原型标注（2026-09-29 23:16 标注 / 23:5x 处理）✅ 已落地

本轮共 24 条，全部处理完毕，`annotations.json` 状态 `open` → `resolved`（待处理 0 / 已修改 24）。

| # | 标注 | 处理 |
|---|---|---|
| 1 | `admin/message-push.html` 去掉「站内信」 | 发送渠道表格删行；场景模板下拉删「站内信 / 短信 + 站内信」；`SCENES` 中权益开通改「小程序服务通知」、退款结果改「短信」；发送记录同步 |
| 2-6 | `miniprogram/home.html`：搜索栏改店铺名、去掉通知与扫一扫、定制化计划入口与「测评」金刚区标记二期 | 搜索栏替换为「租户店铺名称」（星启家庭教育）；两处入口删除；两处加 `data-phase2-only` |
| 7-11 | `ops/content-video.html`：内容资产 5 项去掉二期标识 | `phase2-config.js` ops 名单删除 `content-video/offline/article/tags/teachers`；5 个页面去掉 `data-phase2`；评审路径「平台内容」改为**一期步骤** |
| 12 | `ops/content-video.html`：公告条标记二期 | `ops-shell.js` 公告条改为 **仅二期视图显示** |
| 13-19 | `ops/dashboard.html`：7 处标记二期 | 开通申请 / 内容审核 / 直播审核 / 商品审核 / 售后积压 / 进件异常 / 待审内容 加 `data-phase2-only` |
| 20 | `ops/data.html`：对照商家后台数据板块重构 | 侧栏「数据分析」重构为 经营总览 / 获客与转化 / 内容经营 / 商品与交易 / 客户经营 / 期次复盘 + 商家经营 / 商家健康度；`data.html` 按 `?view=` 渲染 8 个视角 |
| 21 | `ops/settlements.html`：支付流水移到「资金」组、置于对账管理之上 | `ops-shell.js` 财务模块「资金」组新增 `pay-flows` 置首，「财务」组只留服务费台账 |
| 22 | `ops/tenants.html`：「应用管理」放到系统管理下 | 租户管理模块删「应用管理」组；系统管理模块「系统管理」组新增 `apps`；`apps.html` / `app-config.html` 的 `data-module` → `sys`，面包屑改「运营后台 / 系统管理 / 应用管理」 |
| 23-24 | `ops/trade-orders.html`：平台商品 / 新建商品去掉二期标识 | `phase2-config.js` ops 名单删除 `platform-goods` / `goods-edit`；两页去掉 `data-phase2` |

**机制新增**：内容区「二期」标记统一用 `data-phase2-only` 属性，由 `ops-shell.js` / `mp-shell.js` 注入 `html:not(.phase2-on) [data-phase2-only]{display:none!important}` 实现「一期视图隐藏、开启二期显示」。

**口径变化**：

- ops 二期项 23 → **16**（去内容资产 5 + 平台商品 2）；ops 二期页面 21 → **14**
- 一期视图下 ops「内容与审核」模块不再整体隐藏，「内容资产」5 项进入一期侧栏
- 「财务」模块一期视图下只剩「资金」组（支付流水 / 对账管理 / 结算管理 / 提现审核），「财务」「风控与规则」两组（服务费台账 / 结算规则配置）为二期、整组隐藏
- 缓存版本号：`ops-shell.js?v=25`（66 处）、`mp-shell.js?v=3`（19 处）、`admin-shell.js?v=27`（121 处，内部 `phase2-config.js` 引用升级）、`phase2-config.js?v=4`

### 7. 第三轮·续（2026-09-29 23:42 标注 / 23:47 处理）✅ 已落地

清空上一批后新提 2 条，均为「标记为二期」，沿用「随二期开关显隐」口径：

| # | 标注 | 处理 |
|---|---|---|
| 1 | `admin/dashboard.html` · 我的待办「待审核内容」 | 该卡加 `data-phase2-only="1"`；**`admin-shell.js` 补齐 `data-phase2-only` 显隐机制**（此前只有 ops / mp 两个 shell 有） |
| 2 | `ops/data.html` · 侧栏「商家健康度」 | `phase2-config.js` ops 名单新增 `data-health`（导航徽标 + 一期视图隐藏）；`ops/data.html` 的「商家健康度」切换项加 `data-phase2-only`，并新增**二期视角一期拦截**：一期视图下直接访问 `?view=health` 显示「二期能力 · 一期视图下已隐藏」提示 + 开启二期按钮（复用 `proto.css` 的 `.phase2-guard`） |

**口径变化**：ops 二期项 16 → **17**（+`data-health`）；「数据分析」分组不会整组隐藏（其余 7 项为一期），一期视图下该分组 7 项、二期视图下 8 项。

**连带处理（2026-09-29 23:49 口头确认「标记为二期」）**：`ops/dashboard.html`「异常提醒 · 商家健康度告警」卡片（`href="data.html?view=health"`）补 `data-phase2-only="1"`，与侧栏「商家健康度」口径一致；一期视图下该卡隐藏，异常提醒只剩对账异常 / 权益异常 / 申诉处理 3 项。

**缓存版本号**（本轮再次 bump）：`admin-shell.js?v=28`（121 处）、`ops-shell.js?v=26`（66 处）、`mp-shell.js?v=4`（19 处）、`phase2-config.js?v=5`（3 处 shell 内部引用）

### 8. 第四轮原型标注（2026-09-30 11:23 标注 / 12:52 处理）✅ 已落地

本轮 20 条，以文案 / 结构清理为主，另含 3 条二期标记、1 处功能拆分。`annotations.json` 状态 `open` → `resolved`（待处理 0 / 已修改 20）。

| # | 标注 | 处理 |
|---|---|---|
| 1 | `admin/board-overview.html`：优化总览，增加按不同时间对比五个维度，并汇总各下钻页总览数据 | **整页重构**：新增时间区间切换（今日 / 昨日 / 近7日 / 近30日）、五维度总览卡（获客与转化 / 内容经营 / 商品与交易 / 期次数据 / 客户经营）、「不同时间对比」表（同口径四列对照）、「下钻专题总览汇总」表；数据全部取 `BoardMetrics.RANGES` / `getRangeData` / `BoardTerm.getTermBundle`，不硬编码 |
| 2-3 | 同上：去掉「异常下钻示例」卡、页头「期次复盘」按钮 | 已删（侧栏仍有「期次复盘」入口） |
| 4-12 | 三个内容编辑页（article / video / offline）：去掉 tab 与快速定位、去掉 `← 返回…列表`、article 另去掉页标题与说明段、页头「用户端预览」 | 已删；**video / offline 的 tab 是真切换面板**，去掉 tab 后撤销 `.tab-panel` 让全部分区平铺；同步清理会抛错的 anchors JS 与 `e-title` 赋值；article 页头按钮与底部 sticky footer 重复，删的是页头那个 |
| 13-14 | `content-tags` / `content-teachers`：「上下架」改「启禁用」 | 复选框标签、状态徽标、行内按钮、toast 四处全改（各页 4 处） |
| 15 | `admin/entitlement.html`：导出记录 → 二期 | 按钮加 `data-phase2-only="1"` |
| 16 | `admin/live-control.html`：优惠券营销卡 → 二期 | `.ctrl-mk-card`（优惠券）加 `data-phase2-only="1"` |
| 17 | `admin/live-edit.html`：保存并提交平台审核 → 保存并确认创建 | 按钮文案已改（**注**：页面内其余「提交平台审核」语义的提示未动，见下） |
| 18 | `admin/orders.html`：去掉手工补单 | 按钮与 JS 绑定一并删除 |
| 19 | `admin/orders.html`：导出订单 → 二期 | 按钮加 `data-phase2-only="1"` |
| 20 | `admin/message-push.html`：此处仅查看发送记录，模板统一在运营后台配置，运营后台需增加消息配置 | admin 页**降级为只读记录视图**（删发送渠道 / 场景模板 / 保存设置 / 测试发送，改为筛选 + 发送概览 + 发送记录）；**新增 `ops/message-config.html`**（渠道 + 短信签名与模板审核 + 场景模板编辑），侧栏挂在运营后台「系统管理」模块的「系统管理」组 |

**结构变化**：ops「系统管理 → 系统管理」组由 3 项（数据字典 / 渠道管理 / 应用管理）→ **4 项**（中间插入「消息配置」）。

**待确认（本轮未扩大范围，已按标注字面处理）**：

- `admin/live-edit.html` 只改了按钮文案，页面内仍有「提交平台审核」语义的提示与流程（审核横幅 / toast / `nextActionHint`）；若直播创建不再走平台审核，需整页改口径
- 「手工补单」在 `ops/trade-orders.html` 也有（平台侧），未动
- `admin/message-push.html` 菜单名仍为「消息推送」，页面已是只读记录视图；是否改名「消息记录」待定

**缓存版本号**：`ops-shell.js?v=27`（67 处，新增页面 + 侧栏变更）

### 9. 第五轮原型标注（2026-09-30 13:50 标注 / 14:44 处理）✅ 已落地

本轮 18 条，聚焦「内容资产」板块的编辑页与列表页清理，另含 2 条小程序、1 条二期标记。`annotations.json` 状态 `open` → `resolved`（待处理 0 / 已修改 18）。

**口径确认（用户三点答复）**：① 「返回列表」按钮全扫（admin + ops 内容资产板块，统一放到 header-actions 左数第一个）；② 列表页待补建商品提示改为指向「商品列表」；③ admin 另两个编辑页（article / offline）的「关联商品」页签一并去掉。

| 分组 | 处理 |
|---|---|
| `content-article-edit` | 去底部 sticky 操作条、去「预览分享卡片」按钮（含 JS），JS 绑定改为只绑页头按钮 |
| `content-video-edit` | 去「关联商品」整节 + `renderGoods` / `goods-store` / `listing-store` / `Goods` / `Listing` 全部关联代码 |
| `content-offline-edit` | 同上；`#access-hint` 改为静态说明（原由商品数据动态生成） |
| `content-article-edit` / `content-offline-edit`（admin 另两页） | 按③同步去掉「关联商品」整节及关联 JS |
| `content-video-outline` | 去返回条、`完成并提交审核` → `完成并提交`（**含 JS 里运行期覆写的文案**）、返回列表移首位、章节弹窗删「内容标签 / 上传思维导图 / 上传课件 PPT」三字段（payload 改为编辑时保留原值，避免保存即抹数据） |
| `content-article` | 去「批量删除」「复制」按钮及处理器 |
| `content-video` | 「关联商品 N」移到「观看」之后并可点击：0 视为「还没有商品」toast，否则跳 `goods.html?content_id=`；待补建提示改为指向「商品列表」 |
| `goods.html` | 新增 `?content_id=` 筛选（含「已按内容筛选 / 清除筛选」提示条） |
| `content-video-detail` | 返回列表移首位、去 `cm-back` |
| `content-offline-signups` | 返回列表移首位（导出之后 → 之前） |
| `goods-edit` | 「定制化计划」类型按钮标 `data-phase2-only`；`提交审核` → `提交`（含 JS 动态文案） |
| `miniprogram/course.html` | 课程详情去「评论」Tab 及其面板 |
| `miniprogram/lives.html` | `.mp-nav` 增加返回按钮 → `home.html` |
| ops 同步 | `content-article-edit` / `content-video-edit` / `content-offline-edit`（去 tab / 去返回条 / 面板平铺；**运营视角的「关联商品」节保留**）、`content-video-outline`（同 admin 全套）、`content-video-detail`、`content-article`、`goods-edit`（仅二期标记）、`content-tags` / `content-teachers`（上下架 → 启禁用）、`trade-orders`（去手工补单、导出订单标二期）、`content-offline-signups`（返回列表移首位） |

**待确认（本轮未动）**：

- **ops 内容编辑页的「关联商品」节保留**：ops 侧该节是运营视角（看哪些商家基于该内容建了商品，无「新建商品」入口），与 admin 侧「商家自管商品」不是同一个问题；如需一并去掉请告知
- `ops/content-video.html` 的「关联商品 N」未做跳转：ops 商品列表 `trade-goods.html` 是静态表、无内容关联数据模型，做不了「按当前内容筛选」
- ops 编辑页的 `#btn-submit` 文案是「保存并上架下发」（平台语义），与 admin 的「提交审核 → 提交」不是同一问题，未改
- `admin/goods-edit.html` 的类型页签「定制化计划」标二期后，若某商品恰好关联计划类内容，页签会选不中（原型层面无影响）
- ops/content-video.html 的商品跳转、`content-article.html` 的评论数展示等边角，均按「只改标注所指」处理

**缓存版本号**：本轮未改共享脚本（只改页面 HTML/内联 JS），**未 bump**

---

### 10. 第六轮原型标注（2026-09-30 16:14 标注 / 16:45 处理）✅ 已落地

32 条，集中在商品管理与内容资产；本轮口径由用户确认两处：

| 口径 | 结论 |
|---|---|
| `content-article` / `content-offline` 列表的「删除」 | **所有行都去掉**（连带删除弹窗与逻辑） |
| **商品是否还需要审核** | **不需要** —— 商品不参与平台审核，也没有「已驳回」状态；按「商品列表 + 编辑页 + 运营后台审核队列」一并清理 |

**商品审核下线（跨 3 处）**

- `admin/goods.html`：去掉「待平台审核」统计卡与全部卡片 hint、「草稿 / 已驳回」→「草稿」（口径只算 `draft`）；去掉「审核」列与「审核状态」筛选；行内去掉 提审 / 撤回提审 / 重新提审 / 驳回原因；删除驳回原因弹窗与 `reject_target` / `openReject` / `closeReject`；上架不再校验审核
- `admin/goods-edit.html`：「提审与上架」→「上架设置」，选项改「保存并上架 / 定时上架 / 仅存草稿」；平台商品路径价格与划线价只读（提示「平台商品价格由平台定义，不可修改」）；「平台商品」select → **弹窗单选**（列表口径同商品列表）；提交写 `status/audit_status` 不再是 `pending`
- `ops/audit.html`：审核队列移除「商品」类型（统计 hint / 类型筛选 / 审核范围说明），删除 `pendingGoods` / `contentCellOf` / `listingRowsOf` 与商品数据源拼接

**其余 32 条落点**

- `admin/goods.html`：「商品」列拆为「商品编号 + 商品名称」并去缩略图；「内容类型」列显示组合（去重后全列）；去掉「成交于模块」列与「批量操作」按钮
- `admin/goods-edit.html` 见上
- `admin/content-offline.html`：已上架行去掉「编辑」（上架中不可编辑）、删除按钮全去、去掉说明 p、关联商品可点跳筛选
- `admin/content-article.html`：去掉蓝色提示条、去掉删除按钮、`查看图文`→`查看`、`分享设置` 标 `data-phase2-only`
- `admin/content-video.html`：去掉说明 p、关联商品演示数补到 2（`goods-store.js` 新增 `G-S001-01/02`，兼容旧版残留课程 id）
- `admin/content-tags.html` / `content-teachers.html`：删除按钮标红 + 引用校验（标签：子标签优先提示「当前标签有子标签，不能删除」，其次「当前标签已有关联内容不能删除」；讲师：「当前讲师已有关联内容不能删除」）——`content-tags.js` 新增 `hasChildren` / `usedByContent`，`teachers-store.js` 新增 `usedByContent`，两页各引入 `course-store.js` 做真实引用检查
- `admin/orders.html`：去掉「推广人」列与筛选，同步 `rowData` td 索引与下钻 `cols`
- `admin/order-detail.html`：去掉 `#od-goods-tag` 徽标
- `admin/content-video-outline.html`：章节 meta 只留时长（去观看 / 导图 / PPT / 标签）
- **ops 同步**：`content-article` / `content-offline` / `content-video` / `content-video-outline` / `content-tags` / `content-teachers` / `trade-orders`（去推广人列与筛选）/ `audit`（去商品审核）；ops 商品列表 `trade-goods.html` 为静态表、无内容关联数据模型，**关联商品点击未同步**；`ops/order-detail.html` 详情里的「推广人」字段本轮未动（待确认）

**缓存版本号**：`goods-store.js?v=2`（29 处）、`content-tags.js?v=3`（27 处）、`teachers-store.js?v=3`（21 处）

---

## 一、admin 端（商家管理后台）

### 1.1 已标二期（13 项，判定依据明确）

| 模块 | 分组 | 菜单（全部标二期） | 依据 |
|---|---|---|---|
| SCRM | 用户运营 | 用户事件营销、智能营销、用户分群、定向运营计划 | 一期链接已无「用户运营」分组 |
| 内容 | 测评中心 | 测评、测评包、题库、测评报告、报告模板 | 一期链接 content 模块只有「内容资产」5 项 |
| 内容 | 学习服务 | 智能体、任务、定制化计划 | 同上 |
| 交易 | 资产管理 | 资产总览（G1 已确认保持二期；对账管理 / 结算单 / 提现管理 已按评审标注改回一期，见「零·续」） | 一期链接对应位置只剩「支付流水」 |

### 1.2 结构差异：同一能力，但**位置/命名不同** —— 需确认是否对齐

| # | 本地 | 一期链接 | 影响 | 确认 |
|---|---|---|---|---|
| S1 | SCRM 有独立「**用户运营**」分组，内含 用户列表、标签管理、个人SOP、群SOP | 无「用户运营」分组：**用户列表/标签管理** 归入「客户中心」，**个人SOP/群SOP** 归入「营销管理」 | 一期视图下本地会多出一个 4 项的「用户运营」分组 | ☐ 保持 / ☐ 对齐一期 |
| S2 | SCRM「业务设置」= 期次管理、侧边栏管理 | 多一项 **渠道管理** | 本地少 1 项（见 1.3） | ☐ 保持 / ☐ 补 |
| S3 | 交易「资产管理」分组名 | 一期为「**资金流水**」（只含支付流水） | 一期视图下本地分组名仍是「资产管理」 | ☐ 保持 / ☐ 改名 |
| S4 | 交易 · 商品管理首项 label「商品列表」 | 「**店铺商品**」（id/href 相同） | 仅文案 | ✅ **保持**（项目既有决策：「店铺商品」已全端改名「商品列表」，一期链接是旧版） |
| S5 | 数据「数据分析」分组；label「经营总览」「期次复盘」 | 分组「**数据**」；label「总览」「期次经营复盘」，且期次复盘排第 2 位 | 仅文案 + 排序 | ☐ 保持 / ☐ 对齐 |

### 1.3 反向差异：一期链接有、本地没有 —— 需确认是否补齐

| # | 一期菜单 | 本地情况 | 确认 |
|---|---|---|---|
| B1 | 工作台 · **我的待办**（`dashboard.html#todo`） | 本地侧栏只有「工作台」1 项（锚点 `#today/#todo/#alert` 都在） | ✅ **不补**（项目既有决策：工作台分组就是「概览 → 工作台」，故意不要待办/异常提醒两项） |
| B2 | 工作台 · **异常提醒**（`dashboard.html#alert`） | 同上 | ✅ **不补**（同 B1） |
| B3 | 工作台首项 label「**今日经营**」 | 本地为「工作台」 | ✅ **保持**（同 B1 的既有决策） |
| B4 | SCRM「业务设置」· **渠道管理**（`channel-mgmt.html`） | 本地 admin 无该页面、无菜单（ops 端有 `channel-mgmt.html`） | ☐ 补页面+菜单 / ☐ 不补 |

### 1.4 孤儿分组（不影响可见性）

`admin-shell.js` 里 `sidebars.mp` 分组（首页装修/店铺设置/课程与学习页/订单页/支付结果页/直播展示/小程序数据）挂在 `mp` 键下，但 `modules` 数组里没有 `mp` 模块，**本来就不渲染**；一期链接同样未挂载（仅 trade 侧栏重复了 mp-home / mp-settings）。
☐ 保持不动（推荐） / ☐ 清理该分组配置

---

## 二、ops 端（运营后台）

### 2.1 已标二期（23 项）

| 模块 | 分组 | 菜单（全部标二期） |
|---|---|---|
| 内容与审核 | 内容资产 | 线上课、线下课、文章、内容标签、讲师管理 ⚠️ |
| 内容与审核 | 测评中心 | 测评、测评包、题库、测评报告、报告模板 |
| 内容与审核 | 学习服务 | 智能体、任务、定制化计划 |
| 内容与审核 | 审核 | 内容审核、直播审核、商品审核、申诉处理 |
| 财务 | 收款与进件 | 收款与清分、进件审核（2026-09-27 按标注整组二期） |
| 财务 | 财务 / 风控与规则 | 服务费台账、结算规则配置（**对账管理 / 结算管理 / 提现审核已按 G2 放开为一期**） |
| 交易 | 商品管理 | 平台商品、新建商品 |

### 2.2 结构差异 —— 需确认是否对齐

| # | 本地 ops | 一期链接 ops | 确认 |
|---|---|---|---|
| T1 | 顶部模块 7 个（含「**内容与审核**」） | 7 个：工作台 / 租户管理 / 交易 / 财务 / **用户** / 数据 / 系统管理，**无「内容与审核」** | 剩余差异只剩「内容与审核 vs 用户」（见 T3、2.3） |
| T2 | ~~租户管理 / 应用管理 / 套餐管理 挂在「系统管理」下~~ | 「租户管理」是**独立顶级模块** | ✅ **已对齐**（2026-09-27 13:57 决定并落地，见「零·续」第 4 条） |
| T3 | **无「用户」模块**；`ops/users.html` 是「页面已迁移」跳转桩（→ `tenant-config.html?tab=user`） | 「用户」独立顶级模块 → `platform-users.html`（跨租户 C 端用户聚合，一期为只读核查） | ☐ 补 platform-users 页面+模块 / ☐ 不补 |
| T4 | 财务分组名「收款与进件」「财务」 | 「**进件**」「**资金流水**」 | ☐ 改名 / ☐ 保持 |
| T5 | 评审路径「全局订单」→ `orders.html`（页面标题「全局订单」） | → `trade-orders.html`；本地 `orders.html` 仅评审条可达，属重复页 | ☐ 对齐 / ☐ 保持 |

### 2.3 ⚠️ 需你拍板的判断点：ops「内容资产」5 项

- **机械口径（当前已按此执行）**：一期链接的 ops 端**没有「内容与审核」模块**，因此 17 项全部标二期 → 一期视图下该模块整体消失。
  （补充事实：远程站点上 `ops/content-video.html` 等**页面是存在的**，只是菜单没挂——说明是刻意裁掉菜单。）
- **对齐 admin 口径**：内容资产在 admin 端是一期能力，若认为 ops 也应保留，则只保留这 5 项为一期，改法是把 `phase2-config.js` 里 ops 数组前 5 个 id 删掉。

☐ 维持机械口径（整模块二期） / ☐ 改为保留「内容资产」5 项为一期

---

## 三、C 端小程序

### 3.1 已按一期链接对齐（无需确认）

| 项 | 结果 |
|---|---|
| 底部 Tab | 首页 / **艺博士** / 我的（第 2 项由「学习」改「艺博士」，图标 IP 脸） |
| 评审导航条 | 首页 / 艺博士 / 测评 / 直播 / 定制化计划 / 订单 / 我的 —— 顺序与一期链接一致 |
| 首页金刚区 | 艺博士 / 线上课 / 线下课 / 精选文章 / 测评 |
| 首页大卡 | 「艺博士」欢迎卡 → `learning.html` |
| `learning.html` | **内容替换为艺博士 AI 会话页**（与一期链接一致） |
| `ai.html` | 改为跳转桩 → `learning.html`（一期链接同样如此） |
| `mine.html` | 「学习中心 ›」→「全部课程 ›」→ `courses.html`（一期链接无「学习中心」） |
| `plan.html` | 返回箭头与页脚 → `home.html`（一期链接一致） |

### 3.2 需确认

| # | 事项 | 现状 | 确认 |
|---|---|---|---|
| E1 | **原「学习中心」页（已购内容 + 游戏化）** | 一期链接里没有这个页面（其 Tab 位被艺博士替换）。本地内容未删，已另存为 `miniprogram/learn-center.html`，**不在任何导航露出**，仅 `learning.html` 页脚留了一个入口便于评审回看 | ☐ 保留为 learn-center.html / ☐ 恢复为导航可见 / ☐ 删除 |
| E2 | **C 端「二期」开关**（评审导航条右侧） | 当前 C 端无二期菜单项（`mp` 黑名单为空），开关为**占位**：点了不会有可见变化 | ☐ 保留占位 / ☐ 从 C 端移除 |
| E3 | Tab 高亮键名 | 本地 `data-tab="learn"`，一期链接为 `"yibo"`。显示效果一致，仅内部键名不同 | ☐ 保持 learn / ☐ 改为 yibo |
| E4 | 艺博士 Tab 图标 | 一期链接用 `class="mp-tab-yibo"` + `span.ico-yibo`（其 `mp.css` 有配套样式），本地 `mp.css` 无这两个类，故沿用当前写法 | ☐ 保持 / ☐ 补齐样式类 |

---

## 四、确认方式

直接回编号 + 结论即可，例如：

> （G1 已于 2026-09-27 14:16 确认为「保持二期」，不再在示例里）例：S1 对齐一期；S2 补渠道管理；S3/S5 保持；B4 不补；1.4 保持；T1/T3 不补用户模块；T4/T5 保持；2.3 维持机械口径；E1 保留 learn-center、E2 移除、E3 改 yibo、E4 补齐

确认后我会：回填 `phase2-config.js` → 同步调整 shell 菜单结构与命名 → 复跑浏览器冒烟自检 → 回传结果。

也可以像前两轮一样直接在原型里标注、或口头一句话指定：改完我会把标注状态置为「已修改」并同步更新本文档。

---

## 附：改动文件清单

- `prototype/assets/js/phase2-config.js`（黑名单单一事实源）
  - 2026-09-27 移除 admin 的 `recon`/`settlement`/`withdraw`（按评审标注）
  - 2026-09-27 移除 ops 的 `recon`/`settlements`/`payouts`（按 G2 决定）
  - 2026-09-27 新增 ops 的 `onboard-audit`（按第二轮标注：「收款与进件」整组二期）
- `prototype/assets/js/admin-shell.js`、`ops-shell.js`（二期开关、徽标、显隐、拦截、评审路径条）
  - 开关已从浅色顶栏移到**评审路径条**内、「导航」之后
  - ops 评审路径条「④对账结算」改为一期步骤
  - ops 新增「租户管理」顶级模块（3 组从 `sys` 迁出），删除 `tenant/merchant → sys` 旧映射
- `prototype/assets/js/mp-shell.js`（C 端导航 + 开关，开关同样在评审条「导航」之后）
- 36 个二期页面 `<body data-phase2="1">`（admin 15 / ops 21）
  - 已移除：`admin/recon.html`、`admin/settlement.html`、`admin/withdraw.html`（标注）、`ops/recon.html`、`ops/settlements.html`、`ops/payouts.html`（G2）
  - 已新增：`ops/onboard-audit.html`、`ops/pay-members.html`（第二轮标注：收款与进件整组二期）
- `prototype/miniprogram/learning.html`（→ 艺博士会话页）、`ai.html`（→ 跳转桩）、`learn-center.html`（新增，保留原学习中心）、`mine.html`、`plan.html`
- `_review/annotations.json` / `annotations.md`（第一轮 3 条 + 第二轮 2 条，状态均 `open` → `resolved`，自动留了备份）
- ops 租户模块相关页面：`ops/tenants.html`、`apps.html`、`plans.html`、`app-config.html`、`plan-edit.html`、`tenant-config.html`、`tenant-profile.html`、`user-detail.html`（`tenant-profile.html` 的 `data-module` 由 `sys` 改 `tenant`；面包屑统一为「运营后台 / 租户管理 / …」）
- **第三轮标注（2026-09-29）改动文件**：
  - `prototype/assets/js/phase2-config.js`（ops 名单 -7：内容资产 5 + platform-goods / goods-edit）
  - `prototype/assets/js/ops-shell.js`（`data-phase2-only` 显隐机制、公告条仅二期显示、评审路径「平台内容」改一期、侧栏：资金组置入支付流水 / 应用管理归入系统管理 / 数据分析分组重构）
  - `prototype/assets/js/mp-shell.js`（`data-phase2-only` 显隐机制）
  - 页面：`ops/content-video.html`、`content-offline.html`、`content-article.html`、`content-tags.html`、`content-teachers.html`、`platform-goods.html`、`goods-edit.html`（去 `data-phase2`）；`ops/dashboard.html`（7 处二期标记）；`ops/data.html`（重写为 8 视角）；`ops/apps.html`、`app-config.html`（归属改系统管理）；`admin/message-push.html`（清理站内信）；`miniprogram/home.html`（店铺名 / 去入口 / 二期标记）
- **缓存版本号同步（2026-09-27 收尾）**：`proto.css?v=15`、`mp.css?v=21`、`admin-shell.js?v=26`、`ops-shell.js?v=24`、`mp-shell.js?v=2`、`board-term.js?v=3`，以及三个 shell 内 `phase2-config.js?v=3`；已复核无残留无版本号引用

## 附 2：本轮原型新增报表（2026-09-27 第二轮标注）

| 报表 | 落点 | 说明 |
|---|---|---|
| 成单间隔分析 | `admin/board-term-review.html` 期次复盘页 | 加微 → 成单的转化时长分布：分档柱状图（当日 / 1 / 2 / 3 / 4–7 / 8–14 / 15 天以上）+ 分档明细表（人数 / 占比 / 累计占比 / 上一期同期 / 人数差），KPI 含样本量、加微→成单转化率、中位与平均间隔、3 日与 7 日内成单占比。装配逻辑在 `board-term.js` 的 `getConvertInterval` / `renderIntervalChart` |

> 标注原文另提到「直播大屏和直播数据分析中增加时段转化漏斗（每 10 分钟一柱，三指标：点击商品 / 加购 / 成交）」——按口头答复**本轮跳过**，未改 `admin/live-screen.html` / `admin/board-live.html` / `admin/live-stats.html`。需要时再补。

