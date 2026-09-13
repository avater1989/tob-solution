# WorkBuddy SDD V4

WorkBuddy SDD V4 是一套面向产品经理和全栈交付的规格驱动开发包。它固定使用 Vue 3、TypeScript、Pinia、Vue Router、Python 3.11+、FastAPI 和 PyCore，并要求产品、设计、接口、前端、后端、验证和交接都有明确产物与门禁。

## 直接开始

1. 用 WorkBuddy 打开本目录，或将本包内容放到新项目根目录。
2. 在第一次对话中引用 `WORKBUDDY_START.md`。
3. 描述产品愿景，或直接上传会议纪要、访谈记录和需求讨论材料。

WorkBuddy 首次回复应报告：

- SDD 版本。
- 当前项目和阶段。
- 当前功能。
- 关键门禁状态。
- 本轮 Router 选择的 Skill 和下一步。

如果没有出现这些信息，请发送：

```text
请读取 .workbuddy/memory/MEMORY.md、sdd-router、skills-manifest.yaml 和 .output/STATUS.yaml，启用 WorkBuddy SDD V4 后再处理我的需求。
```

## 主流程

```text
S0 启用与分类
→ R 调研或会议纪要转需求
→ A 产品规格
→ B1 低保真
→ B2 高保真
→ C 详细接口设计与计划
→ D1 完整前端 Mock 和产品验收
→ D2 后端按依赖实现并逐项切换 Mock
→ V 验证
→ H 交付
→ O 可选产品教程与 Wiki 发布
```

产品经理在 D1 可以先看到并验收完整产品界面。D1 未通过时，不开始业务后端；D2 每完成一个后端能力，立即将对应前端 Mock 切换为真实接口。

## 核心机制

- `.workbuddy/memory/MEMORY.md`：常驻短规则。
- `sdd-router`：唯一流程入口。
- `.workbuddy/skills-manifest.yaml`：Skill 触发、前置和后继关系。
- `.output/STATUS.yaml`：项目阶段和门禁。
- `.output/features/`：单功能状态、证据和交接。
- `wiki-publish`：交付后按明确授权将已验证 Markdown 发布到 zyplayer-doc Wiki，并执行冲突检查与双重回读验证。
- `scripts/check-sdd.sh`：包、状态和项目结构检查。

## 初始化项目产物

从模板开始：

```bash
cp -R templates/.output .output
bash scripts/check-sdd.sh status .output/STATUS.yaml
```

这只复制规范模板，不安装依赖或启动服务。

## 发布 Markdown 到 zyplayer-doc Wiki

产品完成验证后，可直接提出“把 `.output/PRD.md` 发布到 Wiki”。Router 会进入 `wiki-publish`，检查 `zy-cli`、引导设备绑定、定位空间和目录、检查同名冲突，并在获得本次外部写入的明确授权后创建或更新文档。发布后必须回读文档详情和目标目录；本地 `~/.zy-cli/config.enc`、设备码和密钥不会进入项目或压缩包。

## PyCore

PyCore 随包提供，应用代码从项目根目录导入。依赖安装必须在用户确认的 Python 3.11+ 和虚拟环境中执行：

```bash
python3.11 -m pip install -e ".[api]"
```

应用配置默认从明确的 `.env` 文件加载，不会默认使用系统环境变量覆盖。API 序列化契约统一为：

```json
{"code": 200, "message": "success", "data": {"status": "ok"}}
```

## 检查

```bash
bash scripts/check-sdd.sh package .
bash tests/test-package.sh
bash tests/test-pycore-contracts.sh
```

完整流程见 [工作流](docs/workflow.md)，Skill 调度见 [路由说明](docs/skill-routing.md)，文件归属见 [产物参考](docs/output-reference.md)。

## 权限边界

SDD 不扩大 WorkBuddy 权限。提交、推送、发布、生产修改、凭据变更和付费操作仍需用户明确授权。自动化测试可由 Agent 执行，最终产品验收由用户确认。
