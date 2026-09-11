# 艺博教育 To-B · 商家端 SCRM · 研发支撑文档

| 项 | 内容 |
|----|------|
| 文档编号 | ToB-PRD-01-SCRM-ENG |
| 所属 | 商家端 SCRM 分册附录 / 研发支撑 |
| 版本 | **v0.4-draft**（从产品文档 v0.3 深度样板提炼） |
| 状态 | 支撑层（字段 / 状态机 / 接口）；**不替代**产品主文 |
| 日期 | 2026-09-11 |
| 产品主文 | `ToB-PRD-01-商家端-SCRM.md`（v0.4-draft 产品文档校准稿） |
| 真源顺序 | 决策 > 产品主文 > 冻结表 > 本支撑 > 原型 |

> 本文承接产品主文不便展开的工程深度：完整状态迁移、字段字典、接口契约。  
> 产品规则编号 **R-SCRM-xxx** 与接口清单以本文为完整真源；产品主文仅摘要并链到本节。

---

## 变更记录

| 版本 | 日期 | 变更摘要 | 作者 |
|------|------|----------|------|
| v0.3（原合册 §5/§7/§13） | 2026-09-11 | 深度样板写入 SCRM 合册 | 深度校准 |
| v0.4-draft | 2026-09-11 | 从合册拆出为研发支撑；精简表述，保留 R-SCRM 与完整接口清单 | 产品文档校准 |

---

## 1. 文档用途与阅读指引

| 读者 | 读什么 |
|------|--------|
| 产品 / 设计 / 测试 | 优先读产品主文；联调/用例细节回本文 |
| 研发 | 状态机 + 字段字典 + §4 接口契约 |
| 估点会 | 产品主文功能清单 + 本文接口一览 |

同步行约定同写作约定：`原型：… ｜ 状态：对齐中 / 已对齐 / 原型超前 / 文档超前`

---

## 2. 状态机（完整枚举 + 迁移表）

> 约定：列表「主状态」用本节枚举；原型「线索阶段」文案（新线索/跟进中/已转化/无效）映射见 §2.1.3。加微/领课为并行字段，不替代主状态（开放问题 S-3）。

### 2.1 线索状态机（Lead · P0）

#### 2.1.1 枚举

| 状态码 | 展示名 | 含义 |
|--------|--------|------|
| `new` | 新建 | 已入库未分配（待分配池） |
| `assigned` | 已分配 | 已有归属人，尚未写有效跟进 |
| `following` | 跟进中 | 至少一次有效跟进 |
| `wecom_added` | 已加微 | 企微好友关系确认（可作主状态或标签，见 S-3） |
| `lesson_claimed` | 已领课 | 领课兑换成功 |
| `converted` | 已转化 | 产生有效成交（口径见 S-2） |
| `churned` | 已流失 | 删微/长期无响应等 |
| `merged` | 已合并关闭 | 作为从线索被合并，不可再分配 |
| `invalid` | 无效 | 手动/审批标无效（与流失区分） |

> `wecom_added` / `lesson_claimed` 若按「并行标签」实现：主状态可停留在 `following`，详情与列表同时展示 `wecom_status` / `lesson_status`。

#### 2.1.2 迁移表

| From | To | 触发角色 | 前置条件 | 系统副作用 |
|------|-----|----------|----------|------------|
| — | `new` | 系统 | 订单同步/导入/活码/手工新建成功 | 写 `lead_created`；尝试匹配分配规则（R-SCRM-004） |
| `new` | `assigned` | 系统/管理员/助教（有分配权） | 规则匹配成功或手动/批量指定归属人 | 写归属人、分配时间；审计；`lead_assigned` |
| `new` | `merged` | 管理员 | 重复合并确认主从 | 从线索关闭；记录挂主线索（R-SCRM-011） |
| `assigned` | `following` | 助教/销售 | 提交有效跟进（内容非空） | 更新最近跟进时间、跟进计数 |
| `assigned` | `assigned` | 管理员/有权助教 | 改分配 | 审计原/新归属人（R-SCRM-006） |
| `following` | `wecom_added` | 系统回调/手动确认 | 好友关系成立 | 回写线索+关联订单加微状态（R-SCRM-010） |
| `following` | `lesson_claimed` | 系统（领课回调） | 兑换成功且幂等 | 回写领课状态；`lesson_claimed` 事件 |
| `following` / `wecom_added` / `lesson_claimed` | `converted` | 系统/手动（有权） | 满足 S-2 成交口径 | 主状态终态倾向；跟进可只读追加 |
| `*`（非 `merged`） | `churned` | 系统规则/手动 | 删微或规则命中/手动确认 | 可再激活 |
| `churned` | `following` | 管理员（需权限） | 再激活确认 | 清除流失标记；记审计 |
| `*`（非终态合并） | `invalid` | 助教申请→管理员 / 管理员直接 | 填写无效原因（规则配置「场景原因」） | 不可再自动分配 |
| `following` 等 | `merged` | 管理员 | 合并流程 | 同 R-SCRM-011 |

#### 2.1.3 与原型「线索阶段」映射

| 原型文案（`来源:原型`） | 本 PRD 主状态 / 字段 | 说明 |
|------------------------|----------------------|------|
| 新线索 | `new` 或 `assigned` | 有归属人则已分配 |
| 跟进中 | `following` | — |
| 已转化 | `converted` | — |
| 无效 | `invalid` | 原型选项 |
| （无「已流失」阶段选项） | `churned` | **来源:产品补全** |

并行字段：

| 字段 | 枚举 | 来源 |
|------|------|------|
| 加微状态 `wecom_status` | 未添加 / 已添加 / 已流失 | 产品补全 |
| 领课状态 `lesson_status` | 未领 / 已领 | 产品补全 |

### 2.2 视频号订单衍生状态（ChannelsVideoOrder · P0）

| 维度 | 字段 | 枚举 | 来源 |
|------|------|------|------|
| 支付状态 | `pay_status` | 待支付 / 已支付 / 已退款 / 其他（透传） | 同步 |
| 短信发送状态 | `sms_status` | 未发 / 发送中 / 成功 / 失败 | 系统 |
| 领课状态 | `lesson_status` | 未领 / 已领 | 系统+C端 |
| 加微状态 | `wecom_status` | 未添加 / 已添加 / 已流失 | 回调/手动 |
| 领课链接 | `claim_link_status` | 有效 / 过期 | 系统（依赖 S-1） |

| 动作 | 触发 | 前置 | 副作用 |
|------|------|------|--------|
| 同步入库 | 外部/部署同步 | 商户已部署授权（E3，无配置页） | 创建/更新订单；可触发自动短信（需商品配置，R-SCRM-007） |
| 自动/手动发短信 | 系统/管理员 | 已关联商品+模板；支付成功 | `sms_status` 更新；`sms_sent` |
| 重发短信 | 管理员 | 未发或失败；幂等键见 §4 | 新发送记录；更新状态 |
| 领课成功 | C 端 | 链接有效；未领或幂等 | 订单+线索领课=已领 |
| 加微回写 | 企微回调/手动 | — | 订单+线索加微更新 |

### 2.3 促到计划状态（InvitePlan · P0）

| 状态码 | 展示名 | 来源 |
|--------|--------|------|
| `draft` | 草稿 | 原型 |
| `scheduled` | 待启动 / 待执行 | 原型 |
| `running` | 执行中 | 原型 |
| `paused` | 已暂停 | 原型 |
| `completed` | 已完成 | 原型 |
| `cancelled` | 已取消 | 原型 |

| From | To | 触发角色 | 前置条件 | 系统副作用 |
|------|-----|----------|----------|------------|
| — | `draft` | 管理员 | 名称+关联直播必填 | 可保存步骤 |
| `draft` | `scheduled` | 管理员 | ≥1 短信步骤；人群合法；直播审核通过（执行前再校验 R-SCRM-012） | 锁定配置快照（建议） |
| `scheduled` | `running` | 管理员/系统到点 | 审核已通过；短信通道可用（E5） | 生成触达任务 |
| `running` | `paused` | 管理员 | — | 停止后续步骤 |
| `paused` | `running` | 管理员 | 同启动前置 | 继续未执行步骤 |
| `running` / `paused` / `scheduled` | `cancelled` | 管理员 | 确认 | 取消未发任务 |
| `running` | `completed` | 系统 | 全部步骤终态 | 汇总指标 |

单用户触达 `InviteTouch`：`pending → sending → success / failed`（失败可重试，须幂等）。  
步骤状态（原型）：`draft` / `pending` / `running` / `completed`。

### 2.4 跟进相关状态

跟进**记录**创建即生效。线索「跟进业务态」原型：

| 原型状态（`来源:原型` follow-ups） | 本期处理 |
|----------------------------------|----------|
| 跟进中 | 映射 `following` |
| 已无效 / 无效申请中 | `invalid`；申请流 **P1**，P0 管理员可直接标无效 |
| 已战败 / 战败申请中 | 映射 `churned` 或「战败」标签；申请流 P1 |
| 转移申请中 | 改分配申请 P1；P0 支持有权直接改分配 |

### 2.5 分配规则 / 期次启停

| 对象 | 状态 | 迁移 |
|------|------|------|
| PromotionTerm | `enabled` / `disabled` | 管理员启停；停用后新线索不再匹配 |
| AssignRule | `enabled` / `disabled` | 仅 `enabled` 参与匹配 |

### 2.6 客户群发（MassTask · P0 基础）

`draft → pending → running → completed / cancelled`；单用户 `pending → success / failed`。  
禁止无筛选全库发送（R-SCRM-014）。

---

## 3. 字段字典

> 列说明：`字段名 | 类型 | 必填 | 默认 | 校验 | 来源 | 列表展示 | 权限`；标签 `来源:原型` / `来源:产品补全`。

### 3.1 线索池 Lead（`leads.html`）

#### Tab（`来源:原型`）

| Tab | 本期验收 |
|-----|----------|
| 待分配线索 | **P0** |
| 分配规则 | **P0**（含推广期次入口） |
| 导入历史 | **P0**（基础） |
| 渠道对接 / 数据迁移 / 三方调试 | **P1** 示意 |

#### 筛选项

| 筛选项 | 类型 | 来源标签 | 验收 |
|--------|------|----------|------|
| 姓名 / 手机号 | 文本 | 原型 | P0 |
| 订单号 / 关键词 | 文本 | 原型 | P0 |
| 达人 / 推荐人 | 文本 | 原型 | P1（可展示） |
| 线索等级 | 枚举 A/B/D/H | 原型 | P0 |
| 线索阶段 | 枚举 | 原型 | P0（映射 §2.1.3） |
| 意向等级 | 枚举 | 原型 | P0 |
| 来源渠道 | 枚举/引用 | **产品补全** | P0 |
| 推广期次 | 引用 | **产品补全** | P0 |
| 归属人/跟进人 | 成员 | 原型 | P0 |
| 加微状态 | 枚举 | **产品补全** | P0 |
| 领课状态 | 枚举 | **产品补全** | P0 |
| 时间范围（留资/分配/跟进） | 时间 | 产品补全 | P0 |

#### 列表字段字典

| 字段名 | 类型 | 必填 | 默认 | 校验 | 来源 | 列表展示 | 权限 | 标签来源 |
|--------|------|------|------|------|------|----------|------|----------|
| id | string | 系统 | — | 租户内唯一 | 系统 | 可选 | — | 原型 |
| name | string | 是* | — | 1–64 字 | 用户/同步 | 是（固定） | 可选脱敏 | 原型 |
| mobile | string | 是* | — | 11 位（可配） | 用户/同步 | 是（固定） | **默认脱敏**；`lead.phone.unmask` | 原型 |
| external_order_no | string | 否 | — | — | 同步 | 默认是 | — | 原型 |
| lead_level | enum | 否 | 字典默认 | 启用字典内 | 用户/规则 | 默认是 | — | 原型 |
| lead_stage / status | enum | 是 | `new` | 见状态机 | 系统/用户 | 默认是 | — | 原型+映射 |
| intent_level | enum | 否 | — | 字典内 | 用户 | 默认是 | — | 原型 |
| tags | string[] | 否 | [] | 长度限制 | 用户 | 默认是 | — | 原型 |
| owner_id | memberRef | 分配后是 | — | 本租户成员 | 系统/用户 | 默认是 | 助教仅见名下（可配） | 原型 |
| owner_dept_id | deptRef | 否 | — | — | 系统/用户 | 默认是 | — | 原型 |
| last_follow_at | datetime | 否 | — | — | 系统 | 默认是 | — | 原型 |
| follow_count | int | 否 | 0 | ≥0 | 系统 | 默认是 | — | 原型 |
| assigned_at | datetime | 否 | — | — | 系统 | 默认是 | — | 原型 |
| channel_id / channel_source | ref/enum | 建议是 | — | 渠道管理内 | 同步/用户 | 可选 | — | 原型 |
| inflow_type | enum | 否 | — | 手工/视频号/直播小程序/OpenAPI/导入… | 系统 | 可选 | — | 原型 |
| region | string | 否 | — | — | 同步/用户 | 可选 | — | 原型 |
| gender | enum | 否 | 未知 | 未知/男/女 | 用户 | 可选 | — | 原型 |
| influencer | string | 否 | — | — | 同步 | 可选 | — | 原型 |
| wecom_status | enum | 是 | 未添加 | 未添加/已添加/已流失 | 同步/系统 | 建议默认列 | — | 原型+产品 |
| lesson_status | enum | 是 | 未领 | 未领/已领 | 系统 | **建议默认列** | — | **产品补全** |
| promotion_term_id | ref | 否 | 规则写入 | 本租户期次 | 系统 | **建议默认列** | — | **产品补全** |
| product_info / sku_name | string | 否 | — | — | 同步 | 可选 | — | 原型 |
| refunded | bool | 否 | false | — | 同步 | 可选 | — | 原型 |
| lead_at | datetime | 否 | 创建时间 | — | 系统/同步 | 可选 | — | 原型 |
| referrer | string | 否 | — | — | 用户/同步 | 可选 | — | 原型 |

\*视频号同步：手机号宜有；缺失进待分配并标数据质量问题（不阻断同步）。

#### 新建/编辑表单（`来源:原型`）

姓名*、手机号*、线索等级/阶段/意向、渠道来源、归属人/部门、号码归属/性别/备注。

#### 批量 / 导入

- P0 操作：批量分配、导出、新建、导入、详情、改分配。  
- 导入：xlsx/csv；须含姓名、手机号；按手机号去重；导入历史：批次编码、原文件名、类型、目标、总行/成功/失败/跳过、状态、操作人、时间、下载失败明细。

#### 分配规则 Tab 列表列（`来源:原型`）

规则名称、状态、更新人、更新时间、操作（编辑/启停）。

### 3.2 推广期次 PromotionTerm + 分配规则 AssignRule

#### PromotionTerm（**来源:产品补全**）

| 字段名 | 类型 | 必填 | 默认 | 校验 | 来源 | 列表展示 | 权限 |
|--------|------|------|------|------|------|----------|------|
| id | string | 系统 | — | — | 系统 | 否 | — |
| name | string | 是 | — | 商户内唯一建议 1–64 | 用户 | 是 | 管理员写 |
| start_at / end_at | datetime | 是 | — | start ≤ end | 用户 | 是 | — |
| product_ids | ref[] | 是 | — | ≥1 | 用户 | 是 | — |
| channel_ids | ref[] | 否 | 全部 | 渠道管理内 | 用户 | 可选 | — |
| status | enum | 是 | enabled | enabled/disabled | 用户 | 是 | — |
| remark | string | 否 | — | ≤500 | 用户 | 否 | — |

#### AssignRule

| 字段名 | 类型 | 必填 | 默认 | 校验 | 来源 | 列表展示 | 权限 | 标签来源 |
|--------|------|------|------|------|------|----------|------|----------|
| name | string | 是 | — | 1–64 | 用户 | 是 | 管理员 | 原型 |
| channel_ids | ref[] | 是 | — | 非空 | 用户 | 详情 | 管理员 | **产品补全** |
| product_ids | ref[] | 是 | — | 非空 | 用户 | 详情 | 管理员 | **产品补全** |
| promotion_term_id | ref | 是 | — | 有效期次 | 用户 | 详情 | 管理员 | **产品补全** |
| assignee_type | enum | 是 | member | member/group | 用户 | 详情 | — | **产品补全** |
| assignee_ids | ref[] | 是 | — | ≥1 | 用户 | 详情 | — | **产品补全** |
| strategy | enum | 是 | round_robin | **P0**：`round_robin` / `cap`；权重 P1 | 用户 | 详情 | — | **产品补全** |
| cap_per_member | int | 策略=cap 时是 | — | ≥1 | 用户 | 详情 | — | **产品补全** |
| priority | int | 是 | 100 | 越大优先 | 用户 | 可选 | — | **产品补全** |
| status | enum | 是 | enabled | enabled/disabled | 用户 | 是 | — | 原型 |
| updated_by / updated_at | — | 系统 | — | — | 系统 | 是 | — | 原型 |

匹配逻辑（R-SCRM-004/005）：新线索 → 启用规则 → 渠×品×期次命中 → priority → 策略；无人可分 → 待分配。

### 3.3 视频号商品 / 领课配置（`videos.html` · **来源:产品补全**）

> 原型当前仅「店铺授权」——对应 E3 **不做**配置页。下列为路径③验收所需产品补全。

| 字段名 | 类型 | 必填 | 默认 | 校验 | 来源 | 列表展示 | 权限 |
|--------|------|------|------|------|------|----------|------|
| channels_product_id | string | 是 | — | 外部商品标识 | 同步/用户 | 是 | 管理员 |
| channels_product_name | string | 否 | — | — | 同步 | 是 | — |
| platform_product_id | ref | 是 | — | 课程或直播商品 | 用户 | 是 | 管理员 |
| sms_template | text | 是 | — | 含领课链接占位符 | 用户 | 详情 | 管理员 |
| guide_wecom | bool | 是 | true | — | 用户 | 是 | — |
| wecom_livecode_id | ref | guide=true 建议是 | — | 渠道活码 | 用户 | 详情 | — |
| auto_send_sms | bool | 是 | true | 未配模板强制 false（R-SCRM-007） | 用户 | 是 | — |
| status | enum | 是 | enabled | enabled/disabled | 用户 | 是 | — |

### 3.4 视频号订单（同页订单视图 · **来源:产品补全**）

| 字段名 | 类型 | 必填 | 默认 | 校验 | 来源 | 列表展示 | 权限 |
|--------|------|------|------|------|------|----------|------|
| channels_order_no | string | 是 | — | 外部唯一 | 同步 | 是 | — |
| mobile | string | 宜有 | — | — | 同步 | 是 | 默认脱敏 |
| product_id / name | ref/string | 是 | — | — | 同步 | 是 | — |
| pay_status | enum | 是 | — | 透传映射 | 同步 | 是 | — |
| pay_amount | number | 否 | — | ≥0 | 同步 | 可选 | — |
| sms_status | enum | 是 | 未发 | — | 系统 | 是 | — |
| sms_fail_reason | string | 否 | — | — | 系统 | 失败时 | — |
| claim_clicked | bool | 否 | false | — | 系统 | 是 | — |
| lesson_status | enum | 是 | 未领 | — | 系统 | 是 | — |
| wecom_status | enum | 是 | 未添加 | — | 回调 | 是 | — |
| lead_id | ref | 否 | — | — | 系统 | 是（跳转） | — |
| platform_order_id | ref | 否 | — | — | 系统 | 可选跳转 | — |
| claim_link | string | 否 | — | 有权复制 | 系统 | 操作 | — |

P0 操作：重发领课短信、复制领课链接、跳转线索/平台订单。

### 3.5 直播促到 SOP InvitePlan（`live-invite.html`）

筛选项（原型）：关联直播、推广期次、来源渠道、客户阶段、是否加微、是否预约、是否到场、是否下单、状态。  
列表列（原型）：计划名称、关联直播、步骤数、目标客户、实际触达、新增预约、到课人数、下单人数、成交金额、状态、操作。

| 字段名 | 类型 | 必填 | 默认 | 校验 | 来源 | 列表展示 | 标签来源 |
|--------|------|------|------|------|------|----------|----------|
| name | string | 是 | — | 1–64 | 用户 | 是 | 原型 |
| live_id | ref | 是 | — | 直播存在 | 用户 | 是 | 原型 |
| promotion_term_id | ref | 否 | — | — | 用户 | 筛选/详情 | 原型 |
| channel_ids | ref/enum | 否 | — | — | 用户 | 筛选 | 原型 |
| audience_filters | object | 是 | — | 至少一种条件或「不限」+二次确认 | 用户 | 否 | 原型 |
| exclude_flags | string[] | 否 | 已购买,已退订,近期已触达 | 枚举内 | 用户 | 详情 | 原型 |
| owner_id | memberRef | 是 | 创建人 | — | 系统/用户 | 详情 | 原型 |
| status | enum | 是 | draft | §2.3 | 系统/用户 | 是 | 原型 |
| steps | InviteStep[] | 启动前≥1 | [] | 见下 | 用户 | 步骤数 | 原型 |
| metrics_* | number | 否 | 0 | 系统汇总 | 系统 | 是 | 原型 |

InviteStep：`name*`、`trigger_timing`、`audience`、`channels*`（**P0=短信**）、`goal`、`auto_execute*`、`sms_template`（短信时必填）、`status`、`execute_at`（产品补全）。

### 3.6 跟进管理 FollowUpRecord（`follow-ups.html`）

- 业务分组 Tab：原型「培育/K线/卓培/卓越」违反 R-SCRM-015 → 改为可配置**归属组**字典。  
- 跟进视图 Tab P0：全部 / 我的线索 / 今日待跟进 / 逾期。

| 字段名 | 类型 | 必填 | 校验 | 来源 | 标签来源 |
|--------|------|------|------|------|----------|
| lead_id | ref | 是 | 本租户线索 | 用户/上下文 | 原型 |
| method | enum | 是 | 电话/企微/短信/面谈/其他 | 用户 | 原型 |
| content | text | 是 | 1–2000 | 用户 | 原型 |
| intent_level / lead_stage | enum | 否 | 字典/合法迁移 | 用户 | 原型 |
| next_follow_at | datetime | 否 | 建议≥当前 | 用户 | 原型 |
| material_id | ref | 否 | 素材库 | 用户 | 原型 |
| result | enum | 否 | 跟进事件字典 | 用户 | **产品补全** |
| operator_id / created_at | — | 是 | — | 系统 | 系统 |

副作用：更新 `last_follow_at`、`follow_count`；`assigned` → `following`。

### 3.7 渠道 Channel

| 字段名 | 类型 | 必填 | 默认 | 校验 | 权限 |
|--------|------|------|------|------|------|
| name | string | 是 | — | 商户内唯一 | 管理员 |
| type | enum | 是 | — | 视频号/企微活码/手动导入/直播小程序/OpenAPI/其他 | — |
| status | enum | 是 | enabled | enabled/disabled | — |
| remark | string | 否 | — | — | — |

### 3.8 规则配置（`rules-config.html`）

Tab：意向等级、线索等级、线索阶段设置、跟进事件定义、去重规则配置、场景原因。  
字典项：编码*、名称*、排序、状态、说明；意向含颜色。  
去重：规则名、匹配字段（默认手机号）、优先级、合并策略、状态。  
场景原因：场景（无效/战败/转移等）、原因、排序、状态。

### 3.9 欢迎语 / 客户群发（产品补全 · P0 基础）

WelcomeMsg：`name*`、`content*`、`channel_ids?`、`status*`。  
MassTask：`name*`、`audience_filter*`（禁止空筛）、`content*`、`schedule_type*`、`status*`。

### 3.10 P1 页面字段

P1 **不展开**字段表；接口仅 §4.12 stub。

---

## 4. 接口契约（P0）

> **产品级契约**，非最终后端设计。  
> Base path 建议：`/api/v1/scrm`（示例）。  
> 默认：租户+登录态 Header；`{ code, message, data }`；列表 `{ items, total, page, page_size }`。  
> 通用错误：`400` / `401` / `403` / `404` / `409` / `429`。

### 4.0 实体与路径一览

| 实体 | 资源前缀 | 优先级 |
|------|----------|--------|
| Lead | `/leads` | P0 |
| PromotionTerm | `/promotion-terms` | P0 |
| AssignRule | `/assign-rules` | P0 |
| ChannelsVideoGoods | `/channels/goods` | P0 |
| ChannelsVideoOrder | `/channels/orders` | P0 |
| InvitePlan | `/invite-plans` | P0 |
| FollowUpRecord | `/follow-ups` | P0 |
| Channel | `/channels` | P0 |
| WelcomeMsg | `/welcome-msgs` | P0 |
| MassTask | `/mass-tasks` | P0 |
| （字典/规则配置） | `/meta/*` | P0 简化 |
| P1 资源 | §4.12 | P1 stub |

### 4.1 Lead

| Method | Path | 说明 |
|--------|------|------|
| GET | `/leads` | 列表/筛选（待分配：`status=new` 或 `unassigned=true`） |
| POST | `/leads` | 新建 |
| GET | `/leads/{id}` | 详情 |
| PATCH | `/leads/{id}` | 编辑 |
| POST | `/leads/batch-assign` | 批量分配 |
| POST | `/leads/{id}/assign` | 单条改分配 |
| POST | `/leads/import` | 导入（异步） |
| GET | `/leads/import-batches` | 导入历史 |
| GET | `/leads/import-batches/{batchId}` | 批次/失败明细 |
| POST | `/leads/export` | 导出（异步；明文需权限） |
| POST | `/leads/merge` | 重复合并 |
| POST | `/leads/{id}/unmask-phone` | 明文查看（鉴权+审计） |

**列表 Query**：`keyword`, `order_no`, `lead_level`, `lead_stage`/`status`, `intent_level`, `channel_id`, `promotion_term_id`, `owner_id`, `wecom_status`, `lesson_status`, `time_from`, `time_to`, `page`, `page_size`, `tab`  
**新建**：`name`, `mobile`, `lead_level?`, `lead_stage?`, `intent_level?`, `channel_source?`, `owner_id?`, `owner_dept_id?`, `gender?`, `region?`, `remark?`  
**batch-assign**：`lead_ids[]`, `owner_id`, `owner_dept_id?`  
**merge**：`primary_lead_id`, `secondary_lead_ids[]`, `keep_owner_from`=`primary|secondary|manual`, `owner_id?`  
**错误码**：`LEAD_NOT_FOUND`, `LEAD_MERGED_READONLY`, `ASSIGN_NO_CANDIDATE`, `ASSIGN_CAP_EXCEEDED`, `IMPORT_FORMAT_INVALID`, `PHONE_UNMASK_DENIED`, `MERGE_OWNER_CONFLICT`  
**幂等/异步**：导入/导出返回 `task_id`；合并建议 `Idempotency-Key`。

### 4.2 PromotionTerm

| Method | Path | 说明 |
|--------|------|------|
| GET/POST | `/promotion-terms` | 列表 / 创建 |
| GET/PATCH | `/promotion-terms/{id}` | 详情 / 更新 |
| POST | `/promotion-terms/{id}/enable` \| `/disable` | 启停 |

Request：`name`, `start_at`, `end_at`, `product_ids[]`, `channel_ids[]?`, `remark?`  
错误码：`TERM_TIME_INVALID`, `TERM_NAME_DUPLICATE`, `TERM_IN_USE`

### 4.3 AssignRule

| Method | Path | 说明 |
|--------|------|------|
| GET/POST | `/assign-rules` | 列表 / 创建 |
| GET/PATCH | `/assign-rules/{id}` | 详情 / 更新 |
| POST | `/assign-rules/{id}/enable` \| `/disable` | 启停 |
| POST | `/assign-rules/preview` | 可选预览命中 |

错误码：`RULE_STRATEGY_UNSUPPORTED`, `RULE_PRIORITY_CONFLICT`（可告警）  
副作用：规则变更仅作用于新入库（除非提供「手工运行分配」P1）。

### 4.4 ChannelsVideoGoods

| Method | Path | 说明 |
|--------|------|------|
| GET/POST | `/channels/goods` | 列表 / 创建关联+领课配置 |
| PATCH | `/channels/goods/{id}` | 更新 |
| POST | `/channels/goods/{id}/disable` | 停用 |
| GET | `/channels/goods/external` | 可选拉取外部商品（依赖 E3） |

Request：`channels_product_id`, `platform_product_id`, `sms_template`, `guide_wecom`, `wecom_livecode_id?`, `auto_send_sms`  
错误码：`GOODS_TEMPLATE_REQUIRED`, `GOODS_PLATFORM_NOT_FOUND`  
**无**授权配置 API（R-SCRM-020）。

### 4.5 ChannelsVideoOrder

| Method | Path | 说明 |
|--------|------|------|
| GET | `/channels/orders` | 列表 |
| GET | `/channels/orders/{id}` | 详情 |
| POST | `/channels/orders/{id}/resend-sms` | 重发领课短信 |
| POST | `/channels/orders/{id}/claim-link` | 获取/刷新领课链接 |
| POST | `/channels/orders/sync` | 可选按单号同步 |

resend-sms：建议必填 `Idempotency-Key`；Resp：`sms_status`, `sms_fail_reason?`, `request_id`  
claim-link Resp：`url`, `expires_at?`  
错误码：`ORDER_NOT_FOUND`, `SMS_TEMPLATE_MISSING`, `SMS_PROVIDER_FAILED`, `SMS_BALANCE_INSUFFICIENT`, `CLAIM_ALREADY_DONE`, `CLAIM_LINK_EXPIRED`  
幂等：同一 Key 24h 内不重复计费；投递可异步 `sending`→success/failed。

### 4.6 InvitePlan

| Method | Path | 说明 |
|--------|------|------|
| GET/POST | `/invite-plans` | 列表 / 创建 |
| GET/PATCH | `/invite-plans/{id}` | 详情 / 编辑 |
| POST | `.../start` \| `/pause` \| `/resume` \| `/cancel` | 生命周期 |
| GET | `.../touches` | 触达明细 |
| POST | `.../touches/{touchId}/retry` | 单条重试 |
| GET | `.../no-show` | 未到课名单示意 |

错误码：`LIVE_NOT_APPROVED`, `INVITE_NO_STEPS`, `INVITE_AUDIENCE_EMPTY`, `SMS_PROVIDER_FAILED`, `INVITE_STATE_INVALID`

### 4.7 FollowUpRecord

| Method | Path | 说明 |
|--------|------|------|
| GET | `/follow-ups` | 工作台（tab：all/mine/today/overdue） |
| POST | `/follow-ups` | 写跟进 |
| GET | `/follow-ups/{id}` | 单条 |
| GET | `/leads/{leadId}/follow-ups` | 线索时间线 |

Request：`lead_id`, `method`, `content`, `intent_level?`, `lead_stage?`, `next_follow_at?`, `material_id?`, `result?`  
错误码：`FOLLOW_LEAD_NOT_OWNED`, `FOLLOW_CONTENT_REQUIRED`, `FOLLOW_STAGE_INVALID`

### 4.8 Channel

GET/POST `/channels`；PATCH `/channels/{id}`；enable/disable。  
错误码：`CHANNEL_NAME_DUPLICATE`

### 4.9 WelcomeMsg

GET/POST `/welcome-msgs`；PATCH；enable/disable。  
错误码：`WELCOME_CONTENT_REQUIRED`  
实际下发依赖 E2；接口先落配置 CRUD。

### 4.10 MassTask

GET/POST `/mass-tasks`；POST `.../submit`（二次确认）；GET 详情；POST `.../cancel`。  
错误码：`MASS_AUDIENCE_EMPTY`, `MASS_CONFIRM_REQUIRED`, `MASS_STATE_INVALID`

### 4.11 Meta / 规则配置字典

| Method | Path | 说明 |
|--------|------|------|
| GET/POST/PATCH | `/meta/intent-levels` | 意向等级 |
| GET/POST/PATCH | `/meta/lead-levels` | 线索等级 |
| GET/POST/PATCH | `/meta/lead-stages` | 线索阶段 |
| GET/POST/PATCH | `/meta/follow-events` | 跟进事件 |
| GET/POST/PATCH | `/meta/dedup-rules` | 去重规则 |
| GET/POST/PATCH | `/meta/scene-reasons` | 场景原因 |

错误码：`META_CODE_DUPLICATE`, `META_IN_USE`

### 4.12 P1 接口 stub

| 资源 | stub |
|------|------|
| 企微群跟进 | `GET/POST /api/v1/scrm/group-follows`（P1） |
| 审批 | `/api/v1/scrm/approvals/*`（P1） |
| 客户继承 | `/api/v1/scrm/wecom/inherit/*`（P1） |
| 流失提醒 | `/api/v1/scrm/wecom/churn-alerts/*`（P1） |
| 群活码/拉群模板 | `/group-livecodes/*`, `/group-templates/*`（P1） |
| 群群发/朋友圈 | `/mass-group-tasks/*`, `/mass-moment-tasks/*`（P1） |
| 个人/群 SOP / 待办日历 | `/sop/personal/*`, `/sop/group/*`, `/todo-calendar/*`（P1） |
| 侧边栏 | `/sidebar-apps/*`（P1） |
| 自定义表单深页 | `/forms/*`（P1） |
| 外呼额度 | `/outbound/credits/*`（P1） |
| 小店授权配置 | **不做**（无 API） |

### 4.13 内部回调 / 同步

| 事件 | 方向 | 说明 |
|------|------|------|
| 视频号订单同步 | 外部→本系统 | 写入订单；尝试建/更 Lead |
| 领课兑换 | C 端→本系统 | 幂等 `lesson_claimed` |
| 企微好友变更 | 企微→本系统 | E2 边界内回写加微 |
| 短信回执 | 供应商→本系统 | 更新短信/触达状态 |

---

## 5. 业务规则全文（R-SCRM-xxx）

| 编号 | 规则 |
|------|------|
| R-SCRM-001 | 企微服务商身份未落实前，SCRM 以**企业内部应用**提供；系统**不提供**小店/企微授权配置页。 |
| R-SCRM-002 | 禁止 RPA 全自动拉群或等价灰产；拉群类仅人工/企微合规且本期群活码等为 P1。 |
| R-SCRM-003 | 线索数据按商户隔离；列表/导出不得串租户。 |
| R-SCRM-004 | 新线索入库后按启用规则优先级匹配渠×品×期次；成功则按策略分配，否则**待分配**。 |
| R-SCRM-005 | 分配策略 P0 仅**轮询**与**人均上限**；权重/定量深配不验收。 |
| R-SCRM-006 | 改分配必须留操作者、时间、原/新跟进人审计。 |
| R-SCRM-007 | 未关联平台商品或未配领课模板时仍可同步订单，但**不得自动发短信**，需提示配置。 |
| R-SCRM-008 | 短信失败须记原因；支持对失败/未发**重发**；成功后更新状态。 |
| R-SCRM-009 | 领课兑换**幂等**：已领重复兑换提示已领取，不重复开通冲突权益。 |
| R-SCRM-010 | 领课成功、加微变更须回写订单视图与线索字段。 |
| R-SCRM-011 | 重复合并：保留主线索；从线索跟进挂主；合并后从线索不可再分配。 |
| R-SCRM-012 | 促到关联直播审核未通过：允许草稿，**禁止执行发送**。 |
| R-SCRM-013 | 促到 P0 通道为短信；外呼开关可展示，额度充值闭环不验收。 |
| R-SCRM-014 | 客户群发须选可识别人群；禁止无筛选全库误发（至少二次确认）。 |
| R-SCRM-015 | 规则配置不得写死艺博单一业务名；通用可配置字典。 |
| R-SCRM-016 | 手机号默认脱敏；导出明文需权限并记日志。 |
| R-SCRM-017 | 验收以总册路径③④及产品主文 P0 为准；侧栏 P1≠P0。 |
| R-SCRM-018 | 快捷任务≠工单中心：不验收预警工单、进度看板等。 |
| R-SCRM-019 | 短信重发与促到重试须业务幂等键；客户端重试不得重复计费。 |
| R-SCRM-020 | `videos.html`「授权微信小店」不进 P0；订单/商品以产品补全为准（E3）。 |

---

## 6. 异常与提示（工程对照）

| 场景 | 系统行为 |
|------|----------|
| 无权限明文手机号 | 保持脱敏；提示无权限 |
| 无匹配分配规则 | 进待分配；可提示配置规则 |
| 分配对象达上限 | 进待分配或提示达上限 |
| 短信失败/余额不足 | 状态=失败；原因可见；可重发 |
| 领课链接过期 | C 端提示；后台可重发新链（S-1） |
| 重复合并跟进人冲突 | 强制选主线索跟进人 |
| 促到执行时直播未审过 | 拦截并提示 |
| 企微 API 受限 | 降级提示；不引导授权配置页 |
| 导入格式错误 | 指出行号/原因；部分成功明确 |
| 幂等冲突 | 提示已处理，无重复副作用 |

---

## 7. 数据与埋点摘要

实体：`Lead`、`PromotionTerm`、`AssignRule`、`ChannelsVideoGoods`、`ChannelsVideoOrder`、`InvitePlan`、`FollowUpRecord`、`Channel`、`WelcomeMsg`、`MassTask`。  
同步：视频号订单/加微 **外部→本系统**；领课 **C端→本系统**；分配跟进 **本系统内**。  
事件：`lead_created`、`lead_assigned`、`sms_sent`、`lesson_claimed`、`wecom_friend_updated`、`invite_plan_executed`、`lead_merged`。

---

## 8. P1 能力速查

| 能力 | 原型 | 备注 |
|------|------|------|
| 企微群跟进 | `group-follow.html` | 不验收 |
| 审批 / 继承 / 流失 | `approval.html` 等 | 不验收 |
| 群活码 / 拉群模板 | `group-livecode.html` 等 | 不验收 |
| 群群发 / 朋友圈 | `mass-group.html` 等 | 不验收 |
| 个人/群 SOP / 待办日历 | `sop-*.html` 等 | 不验收 |
| 侧边栏 / 自定义表单深页 | `sidebar-mgmt.html` / `form-*` | 不验收 |
| 外呼额度 / 分配权重深配 | 促到页示意 | 不验收 |
| 视频号授权配置 UI | `videos.html` 授权 | **不做** |

---

**文档结束（SCRM 研发支撑 v0.4-draft）** · 与产品主文 `ToB-PRD-01-商家端-SCRM.md` 配套使用。
