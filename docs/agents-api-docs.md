# Webapp Agents API 说明指南

## 概述

**Webapp Agents API** 是一个基于 LangGraph 的智能体（Agent）管理和服务 API，提供完整的 Agent 创建、运行、线程管理、定时任务等功能。

- **版本**: 0.1.0
- **OpenAPI 规范**: 3.1.0

---

## 目录

1. [Assistants（助手管理）](#1-assistants助手管理)
2. [Threads（线程管理）](#2-threads线程管理)
3. [Thread Runs（线程运行）](#3-thread-runs线程运行)
4. [Stateless Runs（无状态运行）](#4-stateless-runs无状态运行)
5. [Crons（定时任务）](#5-crons定时任务)
6. [Store（存储）](#6-store存储)
7. [A2A（Agent 到 Agent 协议）](#7-a2a-agent-到-agent-协议)
8. [MCP（模型上下文协议）](#8-mcp模型上下文协议)
9. [System（系统端点）](#9-system系统端点)
10. [Webapp（Web 应用）](#10-webapp-web-应用)
11. [Models（模型）](#11-models模型)
12. [数据模型参考](#数据模型参考)

---

## 1. Assistants（助手管理）

> An assistant is a configured instance of a graph.

助手是图的配置实例，用于运行 AI 工作流。

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/assistants` | 创建助手 |
| POST | `/assistants/search` | 搜索助手 |
| POST | `/assistants/count` | 统计助手数量 |
| GET | `/assistants/{assistant_id}` | 获取助手详情 |
| DELETE | `/assistants/{assistant_id}` | 删除助手 |
| PATCH | `/assistants/{assistant_id}` | 更新助手 |
| GET | `/assistants/{assistant_id}/graph` | 获取助手图结构 |
| GET | `/assistants/{assistant_id}/subgraphs` | 获取子图列表 |
| GET | `/assistants/{assistant_id}/subgraphs/{namespace}` | 获取命名空间子图 |
| GET | `/assistants/{assistant_id}/schemas` | 获取助手模式定义 |
| POST | `/assistants/{assistant_id}/versions` | 获取助手版本列表 |
| POST | `/assistants/{assistant_id}/latest` | 设置最新助手版本 |

### 创建助手

```bash
POST /assistants
```

**请求体 (AssistantCreate)**:
- `assistant_id` (string, optional): 助手 ID，未提供则生成随机 UUID
- `graph_id` (string, required): 助手使用的图 ID
- `config` (object, optional): 图配置
- `context` (object, optional): 静态上下文
- `metadata` (object, optional): 元数据
- `if_exists` (string, optional): 重复处理方式 `'raise'` 或 `'do_nothing'`
- `name` (string, optional): 助手名称，默认 'Untitled'
- `description` (string, optional): 助手描述

---

## 2. Threads（线程管理）

> A thread contains the accumulated outputs of a group of runs.

线程包含一组运行的累积输出，用于保存对话状态和上下文。

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/threads` | 创建线程 |
| POST | `/threads/search` | 搜索线程 |
| POST | `/threads/count` | 统计线程数量 |
| POST | `/threads/prune` | 清理线程 |
| GET | `/threads/{thread_id}/state` | 获取线程状态 |
| POST | `/threads/{thread_id}/state` | 更新线程状态 |
| GET | `/threads/{thread_id}/state/{checkpoint_id}` | 获取检查点状态 |
| POST | `/threads/{thread_id}/state/checkpoint` | 获取检查点状态 |
| GET | `/threads/{thread_id}/history` | 获取线程历史 |
| POST | `/threads/{thread_id}/history` | 获取线程历史 |
| POST | `/threads/{thread_id}/copy` | 复制线程 |
| GET | `/threads/{thread_id}` | 获取线程详情 |
| DELETE | `/threads/{thread_id}` | 删除线程 |
| PATCH | `/threads/{thread_id}` | 更新线程 |
| GET | `/threads/{thread_id}/stream` | 加入线程流 |

### 创建线程

```bash
POST /threads
```

**请求体 (ThreadCreate)**:
- `thread_id` (string, optional): 线程 ID
- `metadata` (object, optional): 线程元数据
- `if_exists` (string, optional): 重复处理方式
- `ttl` (object, optional): 线程存活时间

---

## 3. Thread Runs（线程运行）

> A run is an invocation of a graph / assistant on a thread. It updates the state of the thread.

在线程上调用图/助手并更新线程状态。

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/threads/{thread_id}/runs` | 列出运行记录 |
| POST | `/threads/{thread_id}/runs` | 创建后台运行 |
| POST | `/threads/{thread_id}/runs/stream` | 创建流式运行 |
| POST | `/threads/{thread_id}/runs/wait` | 创建等待输出运行 |
| GET | `/threads/{thread_id}/runs/{run_id}` | 获取运行详情 |
| DELETE | `/threads/{thread_id}/runs/{run_id}` | 删除运行 |
| GET | `/threads/{thread_id}/runs/{run_id}/join` | 加入运行 |
| GET | `/threads/{thread_id}/runs/{run_id}/stream` | 加入运行流 |
| POST | `/threads/{thread_id}/runs/{run_id}/cancel` | 取消运行 |
| POST | `/runs/cancel` | 批量取消运行 |

### 创建后台运行

```bash
POST /threads/{thread_id}/runs
```

**请求体 (RunCreateStateful)**:
- `assistant_id` (any, required): 助手 ID 或图名称
- `input` (any, optional): 图输入
- `metadata` (object, optional): 运行元数据
- `config` (object, optional): 助手配置
- `stream_mode` (any, optional): 流模式
- `multitask_strategy` (string, optional): 多任务策略 `'reject'`, `'interrupt'`, `'rollback'`, `'enqueue'`
- `if_not_exists` (string, optional): 线程不存在时 `'reject'` 或 `'create'`
- `durability` (string, optional): 持久级别 `'sync'`, `'async'`, `'exit'`

---

## 4. Stateless Runs（无状态运行）

> A run is an invocation of a graph / assistant, with no state or memory persistence.

无状态调用图/助手，无持久化状态或内存。

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/runs/stream` | 创建流式运行 |
| POST | `/runs/wait` | 创建等待输出运行 |
| POST | `/runs` | 创建后台运行 |
| POST | `/runs/batch` | 批量创建运行 |

### 创建无状态运行

```bash
POST /runs/wait
```

**请求体 (RunCreateStateless)**:
- `assistant_id` (any, required): 助手 ID 或图名称
- `input` (any, optional): 图输入
- `metadata` (object, optional): 运行元数据
- `stream_mode` (any, optional): 流模式
- `on_completion` (string, optional): 完成后删除或保留线程 `'delete'` 或 `'keep'`
- `durability` (string, optional): 持久级别

---

## 5. Crons（定时任务）

> A cron is a periodic run that recurs on a given schedule. The repeats can be isolated, or share state in a thread

定时任务按计划周期性运行。

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/threads/{thread_id}/runs/crons` | 创建线程定时任务 |
| POST | `/runs/crons` | 创建定时任务 |
| POST | `/runs/crons/search` | 搜索定时任务 |
| POST | `/runs/crons/count` | 统计定时任务 |
| PATCH | `/runs/crons/{cron_id}` | 更新定时任务 |
| DELETE | `/runs/crons/{cron_id}` | 删除定时任务 |

### 创建定时任务

```bash
POST /runs/crons
```

**请求体 (CronCreate)**:
- `schedule` (string, required): Cron 表达式
- `end_time` (string, optional): 结束时间
- `assistant_id` (any, required): 助手 ID
- `input` (any, optional): 图输入
- `metadata` (object, optional): 元数据
- `webhook` (string, optional): 回调 URL
- `enabled` (boolean, optional): 是否启用
- `on_run_completed` (string, optional): 完成后操作 `'delete'` 或 `'keep'`
- `durability` (string, optional): 持久级别

---

## 6. Store（存储）

> Store is an API for managing persistent key-value store (long-term memory) that is available from any thread.

存储 API 用于管理持久的键值存储（长期记忆）。

| 方法 | 端点 | 说明 |
|------|------|------|
| PUT | `/store/items` | 存储或更新项目 |
| DELETE | `/store/items` | 删除项目 |
| GET | `/store/items` | 获取单个项目 |
| POST | `/store/items/search` | 搜索项目 |
| POST | `/store/namespaces` | 列出命名空间 |

### 存储项目

```bash
PUT /store/items
```

**请求体 (StorePutRequest)**:
- `namespace` (array, required): 命名空间路径
- `key` (string, required): 键名
- `value` (object, required): 值
- `index` (any, optional): 索引控制
- `ttl` (number, optional): 存活时间（分钟）

### 搜索项目

```bash
POST /store/items/search
```

**请求体 (StoreSearchRequest)**:
- `namespace_prefix` (array, optional): 命名空间前缀
- `filter` (object, optional): 过滤条件
- `limit` (integer, optional): 返回数量限制，默认 10
- `offset` (integer, optional): 偏移量
- `query` (string, optional): 自然语言搜索查询

---

## 7. A2A（Agent 到 Agent 协议）

> Agent-to-Agent Protocol related endpoints for exposing assistants as A2A-compliant agents.

用于将助手公开为 A2A 兼容代理的端点。

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/a2a/{assistant_id}` | A2A JSON-RPC |

---

## 8. MCP（模型上下文协议）

> Model Context Protocol related endpoints for exposing an agent as an MCP server.

用于将代理公开为 MCP 服务器的端点。

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/mcp/` | MCP 发送请求 |
| GET | `/mcp/` | MCP 获取信息 |
| DELETE | `/mcp/` | 终止会话 |

---

## 9. System（系统端点）

> System endpoints for health checks, metrics, and server information.

系统健康检查、指标和服务器信息端点。

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/info` | 服务器信息 |
| GET | `/metrics` | 系统指标 |
| GET | `/docs` | API 文档 |
| GET | `/ok` | 健康检查 |

### 健康检查

```bash
GET /ok
```

返回服务器健康状态。

### 服务器信息

```bash
GET /info
```

返回服务器配置和版本信息。

---

## 10. Webapp（Web 应用）

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/webapp/download/{thread_id}` | 下载文件 |
| POST | `/webapp/extract-file-paths` | 提取文件路径 |

---

## 11. Models（模型）

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/webapp/models` | 列出可用模型 |

---

## 数据模型参考

### Assistant

| 属性 | 类型 | 描述 |
|------|------|------|
| assistant_id | string | 助手 ID |
| graph_id | string | 图 ID |
| config | object | 助手配置 |
| context | object | 静态上下文 |
| created_at | string | 创建时间 |
| updated_at | string | 更新时间 |
| metadata | object | 元数据 |
| version | integer | 版本号 |
| name | string | 名称 |
| description | string/null | 描述 |

### Thread

| 属性 | 类型 | 描述 |
|------|------|------|
| thread_id | string | 线程 ID |
| created_at | string | 创建时间 |
| updated_at | string | 更新时间 |
| state_updated_at | string | 状态更新时间 |
| metadata | object | 元数据 |
| config | object | 配置 |
| status | string | 状态 |
| values | object | 当前状态 |
| interrupts | object | 中断信息 |

### Run

| 属性 | 类型 | 描述 |
|------|------|------|
| run_id | string | 运行 ID |
| thread_id | string | 线程 ID |
| assistant_id | string | 助手 ID |
| created_at | string | 创建时间 |
| updated_at | string | 更新时间 |
| status | string | 状态: `pending`, `running`, `error`, `success`, `timeout`, `interrupted` |
| metadata | object | 元数据 |
| multitask_strategy | string | 多任务策略 |

### Cron

| 属性 | 类型 | 描述 |
|------|------|------|
| cron_id | string | 定时任务 ID |
| assistant_id | string/null | 助手 ID |
| thread_id | string | 线程 ID |
| schedule | string | Cron 表达式 |
| created_at | string | 创建时间 |
| updated_at | string | 更新时间 |
| enabled | boolean | 是否启用 |
| next_run_date | string/null | 下次运行时间 |

### Item

| 属性 | 类型 | 描述 |
|------|------|------|
| namespace | array | 命名空间 |
| key | string | 键名 |
| value | object | 值 |
| created_at | string | 创建时间 |
| updated_at | string | 更新时间 |

---

## 常用操作示例

### 1. 创建助手并运行

```bash
# 创建助手
curl -X POST http://localhost:2024/assistants \
  -H "Content-Type: application/json" \
  -d '{
    "graph_id": "my-graph",
    "name": "My Assistant"
  }'

# 创建线程
curl -X POST http://localhost:2024/threads \
  -H "Content-Type: application/json" \
  -d '{"thread_id": "my-thread"}'

# 在线程上运行助手
curl -X POST http://localhost:2024/threads/my-thread/runs \
  -H "Content-Type: application/json" \
  -d '{
    "assistant_id": "my-assistant",
    "input": {"message": "Hello"}
  }'
```

### 2. 使用 Store 存储长期记忆

```bash
# 存储项目
curl -X PUT http://localhost:2024/store/items \
  -H "Content-Type: application/json" \
  -d '{
    "namespace": ["users", "user123"],
    "key": "preferences",
    "value": {"theme": "dark", "language": "zh"}
  }'

# 搜索项目
curl -X POST http://localhost:2024/store/items/search \
  -H "Content-Type: application/json" \
  -d '{
    "namespace_prefix": ["users"],
    "limit": 10
  }'
```

### 3. 创建定时任务

```bash
curl -X POST http://localhost:2024/runs/crons \
  -H "Content-Type: application/json" \
  -d '{
    "schedule": "0 * * * *",
    "assistant_id": "my-assistant",
    "input": {"task": "daily-report"},
    "enabled": true
  }'
```

---

## 错误响应

所有 API 端点可能返回以下错误：

| 状态码 | 描述 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 409 | 资源冲突 |
| 422 | 验证错误 |
| 500 | 服务器内部错误 |

**错误响应格式 (ErrorResponse)**:
```json
{
  "detail": "Human-readable error message"
}
```
