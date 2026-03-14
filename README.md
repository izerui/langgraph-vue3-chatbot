# langgraph-vue3-chatbot

基于 Vue 3 的 AI 聊天组件库，当前提供两个组件：

- `AskAiBot`：悬浮按钮 + 展开聊天窗
- `ChatBot`：可直接嵌入页面的聊天面板

组件内部已集成与 LangGraph 后端通信、流式消息、工具调用展示、附件能力、建议问题、模型选择等现有能力。

## 安装

宿主项目需自行提供 Vue 3。

```bash
pnpm add langgraph-vue3-chatbot
```

## 使用

### AskAiBot

```vue
<script setup lang="ts">
import { AskAiBot } from 'langgraph-vue3-chatbot'
</script>

<template>
  <AskAiBot
    assistant-id="research"
    assistant-name="AI 助手"
    api-url="http://localhost:2024"
  />
</template>
```

主入口会自动带出组件样式。

### ChatBot

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
      :show-header-actions="false"
    />
  </div>
</template>
```

## Props

### AskAiBot

| prop | 用途 | 默认值 |
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

### ChatBot

| prop | 用途 | 默认值 |
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

## Slots

### AskAiBot

| slot | 用途 | slot props |
| --- | --- | --- |
| `empty` | 自定义空状态内容 | `{ sendMessage }` |
| `custom` | 自定义 custom 消息渲染 | `{ customContent, threadId }` |
| `attachment-trigger` | 自定义附件触发器 | `{ addAttachments }` |

### ChatBot

| slot | 用途 | slot props |
| --- | --- | --- |
| `empty` | 自定义空状态内容 | `{ sendMessage }` |
| `custom` | 自定义 custom 消息渲染 | `{ customContent, threadId }` |
| `attachment-trigger` | 自定义附件触发器 | `{ addAttachments }` |

## 类型

可直接从主入口引入类型：

```ts
import type {
  ChatMessage,
  ChatFile,
  AttachmentTriggerSlotProps,
  PromptInputAttachment,
} from 'langgraph-vue3-chatbot'
```

## 本地开发

```bash
pnpm dev
```

## 构建 demo

```bash
pnpm build
```

## 构建组件库

```bash
pnpm build:lib
```

## 检查组件库产物

```bash
pnpm check:lib
```

## 说明

- 组件面向 Vue 3 使用，宿主项目需提供 `vue@^3.4.0`
- 组件通过主入口导出
- 主入口自动带样式
