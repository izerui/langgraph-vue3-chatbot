# langgraph-vue3-chatbot

[![npm version](https://img.shields.io/npm/v/langgraph-vue3-chatbot)](https://www.npmjs.com/package/langgraph-vue3-chatbot)
[![npm downloads](https://img.shields.io/npm/dw/langgraph-vue3-chatbot)](https://www.npmjs.com/package/langgraph-vue3-chatbot)
[![npm types](https://img.shields.io/npm/types/langgraph-vue3-chatbot)](https://www.npmjs.com/package/langgraph-vue3-chatbot)
[![license](https://img.shields.io/npm/l/langgraph-vue3-chatbot)](https://github.com/izerui/langgraph-vue3-chatbot/blob/main/LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/izerui/langgraph-vue3-chatbot?style=social)](https://github.com/izerui/langgraph-vue3-chatbot)
[![GitHub last commit](https://img.shields.io/github/last-commit/izerui/langgraph-vue3-chatbot)](https://github.com/izerui/langgraph-vue3-chatbot/commits/main)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/izerui/langgraph-vue3-chatbot/pulls)
[![Vue](https://img.shields.io/badge/Vue-3.4%2B-42b883?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646cff?logo=vite&logoColor=white)](https://vite.dev/)
[![LangGraph](https://img.shields.io/badge/LangGraph-SDK-blue)](https://www.npmjs.com/package/@langchain/langgraph-sdk)

一个面向 Vue 3 的 AI 聊天组件库，基于 `@langchain/langgraph-sdk` 实现与 LangGraph 后端的流式通信。

当前提供两个核心组件：

- `AskAiBot`：悬浮按钮 + 展开聊天窗，适合挂在页面右下角快速唤起
- `ChatBot`：可直接嵌入页面的聊天面板，适合详情页、工作台、后台系统等场景

组件内部已集成：流式消息渲染、工具调用展示、附件能力、建议问题、模型选择、浅色/深色主题切换等常见 AI 聊天能力。

## 预览

<p align="center">
  <img src="https://raw.githubusercontent.com/izerui/langgraph-vue3-chatbot/main/docs/img.png" alt="langgraph-vue3-chatbot preview 1" width="48%" />
  <img src="https://raw.githubusercontent.com/izerui/langgraph-vue3-chatbot/main/docs/img_1.png" alt="langgraph-vue3-chatbot preview 2" width="48%" />
</p>

## 特性

- 开箱即用的 Vue 3 AI 聊天组件
- 基于 LangGraph 的流式消息通信
- 同时支持嵌入式面板和悬浮聊天窗
- 内置工具调用展示
- 支持附件上传入口插槽
- 支持建议问题、空状态、自定义消息内容插槽
- 自动引入组件样式，接入成本低
- 使用 TypeScript 编写，提供类型声明

## 安装

宿主项目需自行提供 `vue`，其余运行时依赖会随 `langgraph-vue3-chatbot` 自动安装，无需额外手动安装 `markstream-vue`、`mermaid`、`shiki` 等依赖。

```bash
pnpm add langgraph-vue3-chatbot
```

## 快速开始

### 1. 准备 LangGraph 服务

组件默认通过以下参数连接 LangGraph 后端：

- `apiUrl`：LangGraph 服务地址
- `apiKey`：LangGraph 服务访问凭证（可选）
- `assistantId`：目标 assistant 标识

本地开发时，常见配置类似：

```env
VITE_LANGGRAPH_API_URL=http://localhost:2024
VITE_LANGGRAPH_ASSISTANT_ID=demo-assistant
VITE_LANGGRAPH_ASSISTANT_NAME=AI 助手
```

### 2. 使用 `AskAiBot`

适合在现有页面中增加一个可随时唤起的 AI 助手入口。

```vue
<script setup lang="ts">
import { AskAiBot } from 'langgraph-vue3-chatbot'
</script>

<template>
  <AskAiBot
    assistant-id="research"
    assistant-name="AI 助手"
    api-url="http://localhost:2024"
    theme="light"
    :width="400"
    height="calc(100vh - 120px)"
  />
</template>
```

### 3. 使用 `ChatBot`

适合直接嵌入业务页面，作为主要聊天区域。

```vue
<script setup lang="ts">
import { ChatBot } from 'langgraph-vue3-chatbot'
</script>

<template>
  <div style="height: 600px;">
    <ChatBot
      assistant-id="research"
      assistant-name="AI 助手"
      api-url="http://localhost:2024"
      theme="dark"
      :show-header-actions="false"
    />
  </div>
</template>
```

## 推荐接入方式

如果你希望接入方式更贴近本仓库 demo，可以结合环境变量来传入配置：

```vue
<script setup lang="ts">
import { AskAiBot, ChatBot } from 'langgraph-vue3-chatbot'

const apiUrl = import.meta.env.VITE_LANGGRAPH_API_URL || 'http://localhost:2024'
const assistantId = import.meta.env.VITE_LANGGRAPH_ASSISTANT_ID || 'demo-assistant'
const assistantName = import.meta.env.VITE_LANGGRAPH_ASSISTANT_NAME || 'AI 助手'

const suggestions = [
  '这个 demo 怎么接入真实服务？',
  'ChatBot 和 AskAiBot 分别适合什么场景？',
]
</script>

<template>
  <ChatBot
    :api-url="apiUrl"
    :assistant-id="assistantId"
    :assistant-name="assistantName"
    theme="light"
  />

  <AskAiBot
    :api-url="apiUrl"
    :assistant-id="assistantId"
    :assistant-name="assistantName"
    :suggestions="suggestions"
    theme="dark"
  />
</template>
```

## Props

### AskAiBot

| Prop | 用途 | 默认值 |
| --- | --- | --- |
| `assistantId` | 指定 LangGraph 侧的 assistant 标识 | `'research'` |
| `assistantName` | 设置组件头部展示的助手名称 | `'Chat'` |
| `defaultExpanded` | 控制悬浮聊天窗首次渲染时是否默认展开 | `false` |
| `systemPrompt` | 设置发送给模型的系统提示词 | `'用中文回答'` |
| `threadId` | 指定已有会话线程 id；不传时由组件内部创建线程 | `undefined` |
| `userId` | 标识当前用户，用于请求上下文区分 | `'user001'` |
| `suggestions` | 配置输入区上方的建议问题列表 | `[]` |
| `apiUrl` | 指定 LangGraph 服务地址 | `'http://localhost:2024'` |
| `apiKey` | 指定 LangGraph 服务访问凭证 | `undefined` |
| `theme` | 设置组件主题，可选 `light` / `dark` | `'light'` |
| `width` | 设置悬浮聊天窗打开后的宽度，支持 `number` 或 CSS 尺寸字符串 | `400` |
| `height` | 设置悬浮聊天窗打开后的高度，支持 `number` 或 CSS 尺寸字符串 | `'calc(100vh - 90px)'` |

### ChatBot

| Prop | 用途 | 默认值 |
| --- | --- | --- |
| `assistantId` | 指定 LangGraph 侧的 assistant 标识 | `'research'` |
| `assistantName` | 设置聊天面板头部展示的助手名称 | `'Chat'` |
| `systemPrompt` | 设置发送给模型的系统提示词 | `'你是一个有用的助手，帮用户解决各种问题。'` |
| `threadId` | 指定已有会话线程 id；不传时由组件内部创建线程 | `undefined` |
| `userId` | 标识当前用户，用于请求上下文区分 | `'user001'` |
| `showHeaderActions` | 控制是否显示头部操作区，例如模型选择、工具开关等 | `true` |
| `suggestions` | 配置输入区上方的建议问题列表 | `[]` |
| `apiUrl` | 指定 LangGraph 服务地址 | `'http://localhost:2024'` |
| `apiKey` | 指定 LangGraph 服务访问凭证 | `undefined` |
| `theme` | 设置组件主题，可选 `light` / `dark` | `'light'` |

## Slots

### AskAiBot

| Slot | 用途 | Slot Props |
| --- | --- | --- |
| `empty` | 自定义空状态内容 | `{ sendMessage }` |
| `custom` | 自定义 custom 消息渲染 | `{ customContent, threadId }` |
| `attachment-trigger` | 自定义附件触发器 | `{ addAttachments }` |

### ChatBot

| Slot | 用途 | Slot Props |
| --- | --- | --- |
| `empty` | 自定义空状态内容 | `{ sendMessage }` |
| `custom` | 自定义 custom 消息渲染 | `{ customContent, threadId }` |
| `attachment-trigger` | 自定义附件触发器 | `{ addAttachments }` |

## 样式说明

- 组件通过主入口导出
- 主入口会自动带出组件样式
- 使用时无需额外单独引入样式文件
- 当前内置两套主题：`light`（浅色，默认）与 `dark`（深色）
- `AskAiBot` 的 `theme` 会同时作用于外层悬浮按钮、内部 `ChatBot` 与 portal 浮层
- 内部 markdown 渲染基于 `markstream-vue`，代码高亮会随主题自动切换：
  - `light` -> `vitesse-light`
  - `dark` -> `vitesse-dark`

## 使用建议

- 页面内主聊天区域优先使用 `ChatBot`
- 作为全局 AI 助手入口优先使用 `AskAiBot`
- 如果你已经有 thread id，可通过 `threadId` 复用已有会话
- 如果需要区分用户上下文，可传入 `userId`

## 本地开发

```bash
pnpm install
pnpm dev
```

构建生产版本：

```bash
pnpm build
```

预览构建结果：

```bash
pnpm preview
```

## 相关链接

- npm: https://www.npmjs.com/package/langgraph-vue3-chatbot
- Repository: https://github.com/izerui/langgraph-vue3-chatbot

## License

MIT
