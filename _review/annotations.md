# 原型评审标注

生成时间 2026-09-14 23:25:04 · 共 26 条（待处理 23 / 已修改 3）

> 本文件由标注层自动生成，请勿手工改动结构；修改意见请在原型页面里标注。

## admin/assets.html（2 条）

### 1. [P1][文案] 待处理
- 锚点：`div:nth-of-type(2) > div:nth-of-type(2) > table > tbody > tr:nth-of-type(1) > td:nth-of-type(1)`（根 #page-content）
- 元素文本：通联支付（平台商户）艺博教育科技 · 收单 + 分账
- 元素片段：`<td><b>通联支付（平台商户）</b><br><span class="muted" style="font-size:12px">艺博教育科技 · 收单 + 分账</span></td>`
- 意见：作为小B 商户端 是不是不应该看到艺博通联支付？

### 2. [P1][文案] 待处理
- 锚点：`div:nth-of-type(2) > div:nth-of-type(2) > table > tbody > tr:nth-of-type(2) > td:nth-of-type(7) > a:nth-of-type(2)`（根 #page-content）
- 元素文本：分账规则
- 元素片段：`<a href="split-rules.html">分账规则</a>`
- 意见：这里给去掉吧

## admin/dashboard.html（2 条）

### 1. [P1][文案] 待处理
- 锚点：`#role-select`（根 #page-header-actions）
- 元素文本：商户管理员 助教/销售 审核员 内容运营
- 元素片段：`<select class="wb-role-select" id="role-select" title="原型角色切换" aria-label="原型角色切换"> <option value="admin">商户管理员</option> <option value="sales">助教/销售</option> <option value="auditor">审核员</option> <opti`
- 意见：这里去掉审核员

### 2. [P1][文案] 待处理
- 锚点：`#quick-links`（根 #page-content）
- 元素文本：查看全部直播 查看全部线索
- 元素片段：`<div class="wb-quick-links" id="quick-links"> <a href="lives.html" id="link-all-lives">查看全部直播</a> <a href="leads.html" id="link-all-leads" class="wb-hidden">查看全部线索</a> </div>`
- 意见：这里去掉

## admin/live-booking.html（3 条）

### 1. [P1][文案] 待处理
- 锚点：`#btn-invite`（根 #page-header-actions）
- 元素文本：新建直播促到SOP
- 元素片段：`<a class="btn" id="btn-invite" href="live-invite.html">新建直播促到SOP</a>`
- 意见：同样的 去掉直播促到SOP

### 2. [P1][文案] 待处理
- 锚点：`#modal-reminder > div:nth-of-type(2) > div > div:nth-of-type(6) > div > label:nth-of-type(2)`
- 元素文本：站内信
- 元素片段：`<label><input type="checkbox" name="rm-ch" value="站内信" checked=""> 站内信</label>`
- 意见：渠道去掉站内信和企微 增加外呼 提醒文案变为选择模板

### 3. [P1][文案] 待处理
- 锚点：`#rm-type`
- 元素文本：开播前提醒 开播提醒 回放生成提醒 直播时间变更通知 直播取消通知
- 元素片段：`<select id="rm-type"> <option value="pre_live">开播前提醒</option> <option value="live_start">开播提醒</option> <option value="replay_ready">回放生成提醒</option> <option value="live_changed">直播时间变更通知</option> <opti`
- 意见：提醒场景中应该有直播中提醒

## admin/live-edit.html（7 条）

### 1. [P1][文案] 待处理
- 锚点：`#le-assist`（根 #page-content）
- 元素文本：王助教刘助教
- 元素片段：`<select id="le-assist" multiple="" style="height:60px;padding:8px"> <option>王助教</option><option>刘助教</option> </select>`
- 意见：助教应该做改成添加和编辑交互

### 2. [P1][文案] 待处理
- 锚点：`#le-teacher`（根 #page-content）
- 元素文本：阮荣均赵老师王助教
- 元素片段：`<select id="le-teacher"><option>阮荣均</option><option>赵老师</option><option>王助教</option></select>`
- 意见：主讲老师还没有增加字段在用户部分维护

### 3. [P1][文案] 待处理
- 锚点：`div:nth-of-type(6) > div > div > div:nth-of-type(6) > span:nth-of-type(1)`（根 #page-content）
- 元素文本：专业版
- 元素片段：`<span class="pro-badge">专业版</span>`
- 意见：这个专业版有效期之类的去掉

### 4. [P1][文案] 待处理
- 锚点：`div:nth-of-type(7) > div > table > thead > tr > th:nth-of-type(4)`（根 #page-content）
- 元素文本：讲解话术
- 元素片段：`<th>讲解话术</th>`
- 意见：讲解话术去掉

### 5. [P1][文案] 待处理
- 锚点：`#btn-add-goods`（根 #page-content）
- 元素文本：+ 添加商品
- 元素片段：`<button class="btn btn-primary" id="btn-add-goods">+ 添加商品</button>`
- 意见：添加商品交互要加上

### 6. [P1][文案] 待处理
- 锚点：`h2:nth-of-type(7)`（根 #page-content）
- 元素文本：角色设置
- 元素片段：`<h2 class="page-section-title">角色设置</h2>`
- 意见：角色设置去掉

### 7. [P1][文案] 待处理
- 锚点：`h2:nth-of-type(8)`（根 #page-content）
- 元素文本：预约提醒
- 元素片段：`<h2 class="page-section-title">预约提醒</h2>`
- 意见：这里改一下 不要仅针对预约人员 MA功能肯定是二期的功能 这个直播预约提醒应该是要先上的 所以还是针对该直播场景做整体的促到 另外漏了一个场景是针对应到未到人群在直播中的促到 另外直播促到SOP去掉

## admin/live-invite.html（1 条）

### 1. [P1][文案] 待处理
- 锚点：`body > div:nth-of-type(7) > div:nth-of-type(2) > aside > div:nth-of-type(4) > a:nth-of-type(9)`
- 区域：外壳（admin-shell.js），需改脚本而非页面
- 元素文本：直播促到SOP
- 元素片段：`<a class="nav-item active" href="live-invite.html"><span class="nav-text">直播促到SOP</span></a>`
- 意见：直播提醒部分 我们应该就不要直播促到SOP功能了 用户直接在直播创建部分做创建提醒

## admin/live-replay.html（1 条）

### 1. [P1][文案] 待处理
- 锚点：`div:nth-of-type(3) > div > table > thead > tr > th:nth-of-type(13)`（根 #page-content）
- 元素文本：完播率
- 元素片段：`<th>完播率</th>`
- 意见：完播率先删掉吧 统计起来复杂了

## admin/lives.html（2 条）

### 1. [P1][文案] 待处理
- 锚点：`#btn-tutorial`（根 #page-header-actions）
- 元素文本：使用教程
- 元素片段：`<button type="button" class="btn" id="btn-tutorial">使用教程</button>`
- 意见：去掉使用教程

### 2. [P1][文案] 待处理
- 锚点：`#lv-tbody > tr:nth-of-type(1) > td:nth-of-type(10) > span > a`（根 #page-content）
- 元素文本：更多
- 元素片段：`<a href="javascript:;" class="row-more" data-more-toggle="">更多</a>`
- 意见：更多选项中去掉直播促到SOP

## admin/ops-plans.html（1 条）

### 1. [P1][文案] 待处理
- 锚点：`body > div:nth-of-type(6) > div:nth-of-type(2) > aside > div:nth-of-type(3) > a:nth-of-type(12) > span`
- 区域：外壳（admin-shell.js），需改脚本而非页面
- 元素文本：定向运营计划
- 元素片段：`<span class="nav-text">定向运营计划</span>`
- 意见：文案上直接提示为二期功能

## admin/platform-goods.html（1 条）

### 1. [P1][文案] 已修改
- 锚点：`div:nth-of-type(4) > div > table > thead > tr > th:nth-of-type(3)`（根 #page-content）
- 元素文本：价格
- 元素片段：`<th>价格</th>`
- 意见：右侧增加「佣金」字段，显示为金额，是价格的20%

## admin/sys-users.html（1 条）

### 1. [P1][文案] 待处理
- 锚点：`div:nth-of-type(3) > div > table > tbody > tr:nth-of-type(3) > td:nth-of-type(6) > span`（根 #page-content）
- 元素文本：销售
- 元素片段：`<span class="tag tag-blue">销售</span>`
- 意见：这里改成助教

## admin/term-mgmt.html（1 条）

### 1. [P1][文案] 待处理
- 锚点：`#tm-goals-box > summary`
- 元素文本：经营目标（选填，默认折叠）
- 元素片段：`<summary style="cursor:pointer;font-size:13px;font-weight:600;color:var(--color-text-secondary)">经营目标（选填，默认折叠）</summary>`
- 意见：去掉期次管理的经营目标

## admin/user-segments.html（1 条）

### 1. [P1][文案] 待处理
- 锚点：`body > div:nth-of-type(4) > div:nth-of-type(2) > aside > div:nth-of-type(3) > a:nth-of-type(11) > span`
- 区域：外壳（admin-shell.js），需改脚本而非页面
- 元素文本：用户分群
- 元素片段：`<span class="nav-text">用户分群</span>`
- 意见：用户分群和定向运营计划都直接标注二期功能

## admin/videos.html（1 条）

### 1. [P1][文案] 待处理
- 锚点：`#panel-auth > div > div:nth-of-type(2) > table > thead > tr > th:nth-of-type(4)`（根 #page-content）
- 元素文本：橱窗状态
- 元素片段：`<th>橱窗状态</th>`
- 意见：橱窗状态和绑定橱窗去掉

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
