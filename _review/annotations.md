# 原型评审标注

生成时间 2026-09-30 16:41:18 · 共 32 条（待处理 0 / 已修改 32 / 不修改 0）

> 本文件由标注层自动生成，请勿手工改动结构；修改意见请在原型页面里标注。

## admin/content-article.html（5 条）

### 1. [P1][文案] 已修改
- 锚点：`#ca-list > div:nth-of-type(1) > div:nth-of-type(3) > button:nth-of-type(3)`（根 #page-content）
- 元素文本：删除
- 元素片段：`<button class="btn" style="color:#f53f3f;border-color:#ffa39e" data-del="A001">删除</button>`
- 意见：去掉

### 2. [P1][文案] 已修改
- 锚点：`#ca-list > div:nth-of-type(1) > div:nth-of-type(3) > a`（根 #page-content）
- 元素文本：查看图文
- 元素片段：`<a class="btn" href="content-article-detail.html?id=A001">查看图文</a>`
- 意见：文案改成「查看」

### 3. [P1][文案] 已修改
- 锚点：`#ca-list > div:nth-of-type(1) > div:nth-of-type(3) > button:nth-of-type(1)`（根 #page-content）
- 元素文本：分享设置
- 元素片段：`<button class="btn" data-share="A001">分享设置</button>`
- 意见：标记为二期

### 4. [P1][文案] 已修改
- 锚点：`#ca-list > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > span:nth-of-type(6)`（根 #page-content）
- 元素文本：关联商品: 2
- 元素片段：`<span><b>关联商品:</b> 2</span>`
- 意见：点击可以跳转至商品列表，并且筛选出当前内容的商品

### 5. [P1][文案] 已修改
- 锚点：`div:nth-of-type(1)`（根 #page-content）
- 元素文本：内容负责交付 · 商品负责售卖。下一步：提交审核 → 审核通过 → 创建商品 → 上架。
- 元素片段：`<div style="background:#f0f5ff;border:1px solid #bedaff;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px">内容负责交付 · 商品负责售卖。下一步：提交审核 → 审核通过 → <a href="goods-edit.html?create_mode=fr`
- 意见：去掉

## admin/content-offline.html（4 条）

### 1. [P1][文案] 已修改
- 锚点：`#list > div:nth-of-type(1) > div:nth-of-type(3) > a:nth-of-type(2)`（根 #page-content）
- 元素文本：编辑
- 元素片段：`<a class="btn" href="content-offline-edit.html?id=O001">编辑</a>`
- 意见：去掉，上架状态下不能编辑

### 2. [P1][文案] 已修改
- 锚点：`#list > div:nth-of-type(1) > div:nth-of-type(3) > button:nth-of-type(2)`（根 #page-content）
- 元素文本：删除
- 元素片段：`<button class="btn" style="color:#f53f3f;border-color:#ffa39e" data-del="O001">删除</button>`
- 意见：去掉

### 3. [P1][文案] 已修改
- 锚点：`#list > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(3) > span:nth-of-type(3)`（根 #page-content）
- 元素文本：关联商品 1
- 元素片段：`<span>关联商品 <b>1</b></span>`
- 意见：点击可以跳转至商品列表，并且筛选出当前内容的商品

### 4. [P1][文案] 已修改
- 锚点：`p`（根 #page-content）
- 元素文本：线下课字段与线上课对齐，无章节；额外维护报名 / 课程 / 签到时间、预计人数、名额与上课地址。
- 元素片段：`<p style="font-size:12px;color:#8c8c8c;margin:0 0 12px">线下课字段与线上课对齐，无章节；额外维护报名 / 课程 / 签到时间、预计人数、名额与上课地址。</p>`
- 意见：去掉

## admin/content-tags.html（1 条）

### 1. [P1][交互] 已修改
- 锚点：`#tbody > tr:nth-of-type(1) > td:nth-of-type(5) > button:nth-of-type(4)`（根 #page-content）
- 元素文本：删除
- 元素片段：`<button class="btn btn-sm" data-act="del" data-id="TG01">删除</button>`
- 意见：标红，点击时校验是否有关联内容，有的话提示：当前标签已有关联内容不能删除；如果是父标签，且有子标签，点击时提示：当前标签有子标签，不能删除

## admin/content-teachers.html（1 条）

### 1. [P1][文案] 已修改
- 锚点：`#tbody > tr:nth-of-type(1) > td:nth-of-type(5) > button:nth-of-type(3)`（根 #page-content）
- 元素文本：删除
- 元素片段：`<button class="btn btn-sm" data-act="del" data-id="TCH01">删除</button>`
- 意见：标红，点击时校验是否有关联内容，有的话提示：当前讲师已有关联内容不能删除；

## admin/content-video-outline.html（2 条）

### 1. [P1][文案] 已修改
- 锚点：`#o-chapters > div:nth-of-type(1) > div:nth-of-type(2) > div > div:nth-of-type(2)`（根 #page-content）
- 元素文本：8分钟 · 观看 0 · 导图 无 · PPT 无 · 标签
- 元素片段：`<div class="cm-lesson-meta">8分钟 · 观看 <b>0</b> · 导图 无 · PPT 无 · 标签 </div>`
- 意见：仅显示时长这个字段，其他字段，均不显示

### 2. [P1][文案] 已修改
- 锚点：`#o-chapters > div:nth-of-type(2) > div:nth-of-type(2) > div > div:nth-of-type(2)`（根 #page-content）
- 元素文本：10分钟 · 观看 0 · 导图 思维导图_1790746656392.png · PPT 课件_1790746657249.pptx · 标签
- 元素片段：`<div class="cm-lesson-meta">10分钟 · 观看 <b>0</b> · 导图 思维导图_1790746656392.png · PPT 课件_1790746657249.pptx · 标签 </div>`
- 意见：仅显示时长这个字段，其他字段，均不显示

## admin/content-video.html（2 条）

### 1. [P1][文案] 已修改
- 锚点：`#list > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(3) > a`（根 #page-content）
- 元素文本：关联商品 0
- 元素片段：`<a class="cs-goods" href="#" data-goods-of="S001">关联商品 <b>0</b></a>`
- 意见：改商品数为2，点击可以跳转至商品列表，并且筛选出当前内容的商品

### 2. [P1][文案] 已修改
- 锚点：`p`（根 #page-content）
- 元素文本：系列课已并入线上课。内容不承载价格，价格只在「商品列表」维护；同一内容可建多个商品。已上架时章节锁定，须先下架再改。
- 元素片段：`<p style="font-size:12px;color:#8c8c8c;margin:0 0 12px">系列课已并入线上课。<b>内容不承载价格</b>，价格只在「商品列表」维护；同一内容可建多个商品。已上架时章节锁定，须先下架再改。</p>`
- 意见：去掉

## admin/goods-edit.html（2 条）

### 1. [P1][文案] 已修改
- 锚点：`#form-body > div:nth-of-type(2) > table > thead > tr > th:nth-of-type(3)`（根 #page-content）
- 元素文本：价格
- 元素片段：`<th>价格</th>`
- 意见：平台商品时，不能填写价格，包括划线价

### 2. [P1][文案] 已修改
- 锚点：`#f-platform`（根 #page-content）
- 元素文本：平台精选 · 家庭教育入门课（PG001）平台精选 · 亲子沟通 21 天计划（PG002）平台精选 · 午间答疑直播（PG003）
- 元素片段：`<select id="f-platform" style="width:100%;padding:7px 8px;border:1px solid var(--color-border);border-radius:6px"><option value="PG001">平台精选 · 家庭教育入门课（PG001）</option><option value="PG002">平台精选 · 亲子沟通 `
- 意见：这里改成弹窗选择，弹窗的内容类似「商品列表」，单选

## admin/goods.html（12 条）

### 1. [P1][文案] 已修改
- 锚点：`div:nth-of-type(1) > div:nth-of-type(2)`（根 #page-content）
- 元素文本：待平台审核1已提审 · 等待运营审批
- 元素片段：`<div class="stat"><div class="label">待平台审核</div><div class="value" id="st-pending">1</div><div class="hint">已提审 · 等待运营审批</div></div>`
- 意见：去掉

### 2. [P1][文案] 已修改
- 锚点：`div:nth-of-type(1) > div:nth-of-type(3) > div:nth-of-type(1)`（根 #page-content）
- 元素文本：草稿 / 已驳回
- 元素片段：`<div class="label">草稿 / 已驳回</div>`
- 意见：只保留草稿

### 3. [P1][文案] 已修改
- 锚点：`div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(3)`（根 #page-content）
- 元素文本：已通过审核且上架
- 元素片段：`<div class="hint">已通过审核且上架</div>`
- 意见：去掉

### 4. [P1][文案] 已修改
- 锚点：`div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(3)`（根 #page-content）
- 元素文本：已提审 · 等待运营审批
- 元素片段：`<div class="hint">已提审 · 等待运营审批</div>`
- 意见：去掉

### 5. [P1][文案] 已修改
- 锚点：`div:nth-of-type(1) > div:nth-of-type(3) > div:nth-of-type(3)`（根 #page-content）
- 元素文本：可编辑后重新提审
- 元素片段：`<div class="hint">可编辑后重新提审</div>`
- 意见：去掉

### 6. [P1][文案] 已修改
- 锚点：`div:nth-of-type(1) > div:nth-of-type(4) > div:nth-of-type(3)`（根 #page-content）
- 元素文本：免审 · 仅上下架
- 元素片段：`<div class="hint">免审 · 仅上下架</div>`
- 意见：去掉

### 7. [P1][文案] 已修改
- 锚点：`#btn-batch`（根 #page-header-actions）
- 元素文本：批量操作
- 元素片段：`<button class="btn" id="btn-batch">批量操作</button>`
- 意见：去掉

### 8. [P1][文案] 已修改
- 锚点：`div:nth-of-type(3) > div > table > thead > tr > th:nth-of-type(3)`（根 #page-content）
- 元素文本：内容类型
- 元素片段：`<th>内容类型</th>`
- 意见：如果内容类型有多个，显示组合

### 9. [P1][文案] 已修改
- 锚点：`div:nth-of-type(3) > div > table > thead > tr > th:nth-of-type(8)`（根 #page-content）
- 元素文本：成交于模块
- 元素片段：`<th>成交于模块</th>`
- 意见：去掉

### 10. [P1][文案] 已修改
- 锚点：`div:nth-of-type(3) > div > table > thead > tr > th:nth-of-type(9)`（根 #page-content）
- 元素文本：审核
- 元素片段：`<th>审核</th>`
- 意见：去掉

### 11. [P1][文案] 已修改
- 锚点：`#gd-tbody > tr:nth-of-type(1) > td:nth-of-type(2) > div > span`（根 #page-content）
- 元素文本：文
- 元素片段：`<span class="thumb t-green">文</span>`
- 意见：去掉

### 12. [P1][文案] 已修改
- 锚点：`div:nth-of-type(3) > div > table > thead > tr > th:nth-of-type(2)`（根 #page-content）
- 元素文本：商品
- 元素片段：`<th>商品</th>`
- 意见：拆成两列：商品编号，商品名称

## admin/order-detail.html（1 条）

### 1. [P1][文案] 已修改
- 锚点：`#od-goods-tag`（根 #page-content）
- 元素文本：课程商品
- 元素片段：`<span class="tag tag-blue" id="od-goods-tag">课程商品</span>`
- 意见：去掉

## admin/orders.html（2 条）

### 1. [P1][文案] 已修改
- 锚点：`div:nth-of-type(4) > div > table > thead > tr > th:nth-of-type(8)`（根 #page-content）
- 元素文本：推广人
- 元素片段：`<th>推广人</th>`
- 意见：去掉

### 2. [P1][文案] 已修改
- 锚点：`#f-promoter`（根 #page-content）
- 元素文本：推广人 赵老师阮荣均王助教无
- 元素片段：`<select id="f-promoter"> <option value="">推广人</option> <option>赵老师</option><option>阮荣均</option><option>王助教</option><option>无</option> </select>`
- 意见：去掉
