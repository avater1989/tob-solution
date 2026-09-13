# 快速入门

本文档帮助你快速上手 PyCore 框架。

## 目录

- [安装](#安装)
- [五分钟教程](#五分钟教程)
- [项目结构](#项目结构)
- [下一步](#下一步)

---

## 安装

### 从 V4 项目安装

```bash
# 在用户确认的 Python 3.11+ 环境中，从 V4 根目录执行
python3.11 -m pip install -e .

# API 支持（FastAPI + uvicorn）
python3.11 -m pip install -e ".[api]"

# LLM 集成（OpenAI + tiktoken）
python3.11 -m pip install -e ".[llm]"

# 全部功能
python3.11 -m pip install -e ".[all]"

# 开发依赖（pytest、black、mypy 等）
python3.11 -m pip install -e ".[dev]"
```

### 开发模式安装

```bash
cd 开发规范包_WorkBuddy_V4
python3.11 -m pip install -e ".[dev]"
```

### 依赖说明

| 安装选项 | 包含的依赖 |
|----------|-----------|
| 核心 | pydantic>=2.0, loguru>=0.7 |
| `[api]` | fastapi>=0.100, uvicorn>=0.20 |
| `[llm]` | openai>=1.0, tiktoken>=0.5 |
| `[dev]` | pytest, pytest-asyncio, mypy, ruff |

---

## 五分钟教程

### 1. 配置日志

```python
from pycore.core import Logger, LoggerConfig, LogLevel

# 配置日志系统
logger = Logger.configure(LoggerConfig(
    level=LogLevel.DEBUG,
    app_name="myapp",
    json_logs=False,  # 开发环境用彩色输出
))

logger.info("Application started")
logger.debug("Debug info", key="value")
```

### 2. 创建插件

```python
from pycore.plugins import BasePlugin, PluginResult, PluginRegistry

class GreetPlugin(BasePlugin):
    """问候插件"""
    name: str = "greet"
    description: str = "Say hello to someone"

    async def execute(self, name: str, **kwargs) -> PluginResult:
        return self.ok(f"Hello, {name}!")

# 注册插件
registry = PluginRegistry()
registry.register(GreetPlugin())
```

### 3. 执行插件

```python
import asyncio

async def main():
    result = await registry.execute("greet", name="World")

    if result:
        print(result.data)  # "Hello, World!"
    else:
        print(f"Error: {result.error}")

asyncio.run(main())
```

### 4. 完整示例

```python
"""完整的 PyCore 入门示例"""

import asyncio
from pycore.core import Logger, LoggerConfig, LogLevel
from pycore.plugins import BasePlugin, PluginResult, PluginRegistry

# 配置日志
logger = Logger.configure(LoggerConfig(
    level=LogLevel.INFO,
    app_name="quickstart",
))

# 定义插件
class CalculatorPlugin(BasePlugin):
    name: str = "calculator"
    description: str = "Simple calculator"

    async def execute(self, a: int, b: int, op: str = "add", **kwargs) -> PluginResult:
        if op == "add":
            return self.ok(a + b)
        elif op == "sub":
            return self.ok(a - b)
        elif op == "mul":
            return self.ok(a * b)
        elif op == "div":
            if b == 0:
                return self.fail("Division by zero")
            return self.ok(a / b)
        else:
            return self.fail(f"Unknown operation: {op}")

async def main():
    # 创建注册表
    registry = PluginRegistry()
    registry.register(CalculatorPlugin())

    logger.info("Calculator plugin registered")

    # 执行计算
    result = await registry.execute("calculator", a=10, b=5, op="add")
    logger.info(f"10 + 5 = {result.data}")

    result = await registry.execute("calculator", a=10, b=5, op="mul")
    logger.info(f"10 * 5 = {result.data}")

    result = await registry.execute("calculator", a=10, b=0, op="div")
    if not result:
        logger.warning(f"Error: {result.error}")

if __name__ == "__main__":
    asyncio.run(main())
```

运行：
```bash
python quickstart.py
```

输出：
```
2024-01-01 12:00:00 | INFO | Calculator plugin registered
2024-01-01 12:00:00 | INFO | 10 + 5 = 15
2024-01-01 12:00:00 | INFO | 10 * 5 = 50
2024-01-01 12:00:00 | WARNING | Error: Division by zero
```

---

## 项目结构

### 典型项目布局

```
myproject/
├── .env                     # 应用配置，不提交真实凭据
├── src/
│   ├── __init__.py
│   ├── plugins/             # 自定义插件
│   │   ├── __init__.py
│   │   └── my_plugin.py
│   ├── services/            # 自定义服务
│   │   ├── __init__.py
│   │   └── my_service.py
│   └── main.py              # 入口文件
├── tests/
│   └── test_plugins.py
├── pyproject.toml
└── README.md
```

### 入口文件示例

```python
# src/main.py
import asyncio
from pycore.core import ConfigManager, BaseSettings, Logger, LoggerConfig, LogLevel

class AppSettings(BaseSettings):
    debug: bool = False
    log_level: str = "INFO"

async def main():
    # 从明确的配置文件加载，不隐式读取系统环境变量
    config = ConfigManager()
    config.load(AppSettings, ".env")

    # 配置日志
    level = LogLevel[config.settings.log_level]
    logger = Logger.configure(LoggerConfig(
        level=level,
        app_name="myapp",
        json_logs=not config.settings.debug,
    ))

    logger.info("Starting application")

    # 应用逻辑...

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 下一步

根据你的需求，继续阅读相关文档：

| 需求 | 文档 |
|------|------|
| 深入了解配置、日志 | [核心模块](core.md) |
| 创建可扩展的工具 | [插件系统](plugins.md) |
| 构建有状态服务 | [服务层](services.md) |
| 流程编排和上下文 | [执行层](execution.md) |
| 构建 REST API | [API 层](api.md) |
| 集成 LLM（GPT/DeepSeek） | [LLM 集成](llm.md) |
| 查看完整示例 | [示例应用](examples.md) |
