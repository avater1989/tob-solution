# WorkBuddy SDD V4 启动入口

请先读取以下文件：

1. `.workbuddy/memory/MEMORY.md`
2. `.workbuddy/skills/sdd-router/SKILL.md`
3. `.workbuddy/skills-manifest.yaml`
4. `.output/STATUS.yaml`；若尚不存在，则读取 `templates/.output/STATUS.yaml` 并引导初始化

然后报告 SDD 版本、当前项目、当前阶段、当前功能、关键门禁、失效状态和下一步要加载的 Skill。所有 SDD 任务必须先经过 `sdd-router`。

如果我上传会议纪要、访谈记录或需求讨论材料，直接进入 R 阶段的会议纪要转需求模式：先生成可追溯的 `research.md` 和非空 PRD 草案，再只询问材料中缺失的最高影响问题。

D1 必须先交付完整前端 Mock 产品供我验收；未通过前不要开始业务后端。产品验证和交付完成后，提示一次是否生成完整产品使用说明和教程，由我决定是否执行。
