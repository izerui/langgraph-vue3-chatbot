# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LangGraph Vue3 Chatbot 是一个基于 Vue 3 + LangGraph 的 AI 聊天应用前端，使用 `@langchain/langgraph-sdk` 实现与 AI 后端的流式通信。

## Commands

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

## Architecture

### 技术栈
- **前端框架**: Vue 3 (Composition API + `<script setup>`)
- **构建工具**: Vite
- **样式**: Tailwind CSS v4
- **AI SDK**: @langchain/langgraph-sdk, ai
- **UI 组件库**: ai-elements-vue, reka-ui (基于 shadcn-vue)

### 组件层级

```
App.vue
├── ChatBot (直接嵌入页面的聊天组件)
└── AskAiBtn (悬浮按钮组件)
    ├── FloatButton (悬浮按钮)
    └── ChatBot (展开的聊天窗口)
```

### 核心组件

| 组件 | 说明 |
|------|------|
| `AskAiBtn.vue` | 悬浮聊天组件，管理展开/收起状态 |
| `ChatBot.vue` | 核心聊天组件，处理消息发送、流式响应、工具调用 |
| `ChatMessages.vue` | 消息列表渲染 |
| `ChatInput.vue` | 输入框组件 |
| `ChatHeader.vue` | 头部组件 |
| `ChatSuggestions.vue` | 建议提示组件 |
| `ToolCall.vue` | 工具调用展示 |

### 类型定义

统一在 `src/components/ai-bot/lib/types.ts`:
- `ChatStatus`: `'ready' | 'streaming'`
- `MessageType`: `'ai' | 'human' | 'system' | 'tool'`
- `ToolCall`: 工具调用数据结构
- `ChatMessage`: 聊天消息结构

### API 集成

使用 `Client` from `@langchain/langgraph-sdk` 连接后端:
```typescript
const client = new Client({
  apiUrl: import.meta.env.VITE_LANGGRAPH_API_URL || 'http://localhost:2024',
  apiKey: import.meta.env.VITE_LANGGRAPH_API_KEY
})
```

流式响应处理:
```typescript
const streamResponse = client.runs.stream(
  threadId,
  assistantId,
  { input: { messages: [...] }, streamMode: ['messages-tuple', 'custom'] }
)

for await (const chunk of streamResponse) {
  // chunk.event: 'metadata' | 'messages' | 'messages/partial'
  // chunk.data: 消息数据
}
```

### 状态管理

ChatBot 使用统一的 `handleSubmit` 作为唯一消息发送入口:
- `status = 'streaming'`: 忙碌中，不允许发送新消息
- `status = 'ready'`: 空闲，可发送消息

### 环境配置

- `VITE_LANGGRAPH_API_URL`: LangGraph 后端地址
- `VITE_LANGGRAPH_API_KEY`: API 密钥

### 路径别名
- `@` 指向 `src/`
