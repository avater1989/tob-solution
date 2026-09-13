# SDD 产物参考

| 文件 | 唯一职责 | 主要维护阶段 |
| --- | --- | --- |
| `.output/STATUS.yaml` | 项目阶段、门禁、失效记录和运营选择 | 全程 |
| `.output/research.md` | 问题、会议来源、竞品证据、可视化与调研结论 | R |
| `.output/research-assets/` | 调研图表、证据截图和交互可视化 | R |
| `.output/PRD.md` | 产品范围、页面、流程、数据、权限和验收 | A |
| `.output/ui-design-spec.md` | 低保真、高保真、组件状态与确认 | B1/B2 |
| `.output/prototypes/` | 可打开的低保真和高保真产物 | B1/B2 |
| `.output/api-contracts.md` | Mock、后端和测试共用的详细接口契约 | C |
| `.output/Plan.md` | 人类可读的开发计划和进度 | C 至 H |
| `.output/features/<feature>/STATUS.yaml` | 单功能状态和失效记录 | D2 至 H |
| `.output/features/<feature>/EVIDENCE.md` | 实际验证命令、操作和结果 | D1/D2/V |
| `.output/features/<feature>/HANDOFF.md` | 实际实现、决定、风险与下一步 | 阶段结束/H |
| `.output/startup.md` | 环境、配置、启动、停止和常见问题 | H |
| `.output/product-user-guide.md` | 使用者明确选择后生成的产品教程 | O |
| `.output/product-user-guide-assets/` | 教程截图、标注图和演示资源 | O |
| `.output/wiki-publication.md` | 可选 Wiki 发布目标、页面 ID、创建/更新行为与回读验证证据；不得含凭据 | H/O/complete |

同一事实只在一个权威文件中定义。其他文件使用需求、接口、功能或证据编号引用，不复制并独立维护另一份定义。
