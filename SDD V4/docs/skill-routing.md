# Skill 路由说明

## 唯一入口

MEMORY 要求所有 SDD 任务先读取 `sdd-router`。Router 读取 Manifest 与 STATUS，选择一个主执行 Skill；质量 Skill 只在固定节点叠加。

```text
MEMORY → sdd-router → Manifest + STATUS → 主 Skill → 质量 Skill → 状态更新
```

## Manifest 字段

- `name`：必须与 Skill 目录一致。
- `triggers`：Router 使用的任务语义。
- `stages`：允许执行的项目阶段。
- `requires`：必须已经满足的 Skill 或门禁。
- `outputs`：该 Skill 唯一负责的产物。
- `next`：允许的后继 Skill，不代表可绕过门禁。
- `optional`：用户可以跳过且不阻塞主交付的能力。

## 关键路由

| 输入 | 主 Skill |
| --- | --- |
| 新产品、新功能、行为变化 | brainstorming |
| 竞品调研、会议纪要、访谈材料 | sdd-research |
| PRD、字段、流程、状态、权限 | product-feature-design + sdd-product-design |
| 低保真或高保真 | 对应 UI Skill |
| 接口设计 | sdd-api-contract |
| 开发计划 | writing-plans |
| D1 前端实现 | frontend-design + TDD + sdd-frontend |
| D2 后端功能 | sdd-feature-planning + TDD + sdd-backend |
| Bug 或测试失败 | systematic-debugging |
| 完成、修复或通过声明 | verification-before-completion |
| 阶段结束或续接 | conversation-summary |
| 交付后的可选教程 | product-user-guide |
| 将已验证 Markdown 发布到 zyplayer-doc Wiki | wiki-publish |

## 维护规则

新增 Skill 时同时更新 Manifest 和包测试。禁止重复名称、未知依赖、未知后继和流程环。即使 WorkBuddy 直接语义匹配到下游 Skill，该 Skill 也必须先检查 Router 与 STATUS 前置条件。
