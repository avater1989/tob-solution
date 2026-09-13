# 原型评审标注

生成时间 2026-09-13 13:57:08 · 共 7 条（待处理 7 / 已修改 0）

> 本文件由标注层自动生成，请勿手工改动结构；修改意见请在原型页面里标注。

## admin/content-article.html（1 条）

### 1. [P1][新增] 待处理
- 锚点：`#ca-list > div:nth-of-type(3) > div:nth-of-type(3) > button:nth-of-type(3)`（根 #page-content）
- 元素文本：复制
- 元素片段：`<button class="btn" data-copy="A003">复制</button>`
- 意见：左侧增加「删除」按钮，需要二次确认

## admin/content-category.html（1 条）

### 1. [P1][删除] 待处理
- 锚点：`#cc-body > tr:nth-of-type(1) > td:nth-of-type(5) > div > button:nth-of-type(5)`（根 #page-content）
- 元素文本：删除
- 元素片段：`<button class="btn" style="color:#f53f3f;border-color:#ffa39e" data-del="C1">删除</button>`
- 意见：有关联内容，不能删除分类

## admin/content-series.html（2 条）

### 1. [P1][文案] 待处理
- 锚点：`#cs-list > div:nth-of-type(2) > div:nth-of-type(3) > a:nth-of-type(1)`（根 #page-content）
- 元素文本：编辑
- 元素片段：`<a class="btn btn-primary" href="content-series-edit.html?id=S002">编辑</a>`
- 意见：编辑系列课

### 2. [P1][删除] 待处理
- 锚点：`button`（根 #page-header-actions）
- 元素文本：导出
- 元素片段：`<button class="btn">导出</button>`
- 意见：去掉

## admin/content-video-edit.html（3 条）

### 1. [P1][布局] 待处理
- 锚点：`#sec-status > div:nth-of-type(2) > div > label:nth-of-type(2)`（根 #page-content）
- 元素文本：定时上架
- 元素片段：`<label><input type="radio" name="shelf"> 定时上架 <input type="datetime-local" class="input" style="width:200px;margin-left:8px"></label>`
- 意见：左对齐

### 2. [P1][布局] 待处理
- 锚点：`#sec-status > div:nth-of-type(2) > div > label:nth-of-type(1)`（根 #page-content）
- 元素文本：立即上架（保存后提交内容审核队列）
- 元素片段：`<label><input type="radio" name="shelf" checked=""> 立即上架（保存后提交内容审核队列）</label>`
- 意见：左对齐

### 3. [P1][布局] 待处理
- 锚点：`#sec-status > div:nth-of-type(2) > div > label:nth-of-type(3)`（根 #page-content）
- 元素文本：暂存草稿
- 元素片段：`<label><input type="radio" name="shelf"> 暂存草稿</label>`
- 意见：左对齐
