# 原型评审标注

生成时间 2026-09-13 23:15:01 · 共 3 条（待处理 3 / 已修改 0）

> 本文件由标注层自动生成，请勿手工改动结构；修改意见请在原型页面里标注。

## admin/platform-goods.html（1 条）

### 1. [P1][文案] 已修改
- 锚点：`div:nth-of-type(4) > div > table > thead > tr > th:nth-of-type(3)`（根 #page-content）
- 元素文本：价格
- 元素片段：`<th>价格</th>`
- 意见：右侧增加「佣金」字段，显示为金额，是价格的20%

## ops/pay-members.html（1 条）

### 1. [P1][文案] 已修改
- 锚点：`body > div:nth-of-type(4) > div:nth-of-type(2) > aside > div:nth-of-type(2) > a:nth-of-type(2)`
- 区域：外壳（admin-shell.js），需改脚本而非页面
- 元素文本：会员管理
- 元素片段：`<a class="nav-item active" href="pay-members.html">会员管理</a>`
- 意见：将内容合并到 租户列表 里去

## ops/tenant-detail.html（1 条）

### 1. [P1][文案] 已修改
- 锚点：`#btn-renew`（根 #page-content）
- 元素文本：续费
- 元素片段：`<button class="btn" id="btn-renew">续费</button>`
- 意见：右侧增加续费记录，记录着每次续费的时间金额等信息
