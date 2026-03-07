# LangGraph Vue3 Chatbot

基于 Vue 3 + LangGraph 的 AI 悬浮对话组件，方便在业务系统中快速集成 Agent 智能体框架。

## 简介

`AskAIBot` 是一个可悬浮的 AI 对话组件，专门用于对接 LangGraph 后端 API。它不是一个完整的应用，而是一个**可集成的 Vue 3 组件**，只需几行代码即可将 AI 对话能力接入现有业务系统。

## 功能特性

- 悬浮式对话界面，可展开/收起
- 基于 `@langchain/langgraph-sdk` 实现流式响应
- 支持工具调用展示（Sandbox 组件）
- 模块化组件设计
- Markdown 渲染性能优化

## 技术栈

- **前端框架**: Vue 3 (Composition API + `<script setup>`)
- **构建工具**: Vite
- **样式**: Tailwind CSS v4
- **AI SDK**: @langchain/langgraph-sdk, ai
- **UI 组件**: ai-elements-vue, reka-ui (基于 shadcn-vue)
- **Markdown**: markstream-vue

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

## 使用示例

### 在业务系统中集成

```vue
<script setup>
import AskAIBot from './components/ai-bot/AskAIBot.vue'
</script>

<template>
  <div>
    <!-- 其他业务内容 -->
    <AskAIBot
      assistant-id="your-assistant-id"
      assistant-name="AI 助手"
      :default-expanded="false"
    />
  </div>
</template>
```

### 组件效果

![AI Chatbot](./docs/img.png)

## 项目结构

```
src/
├── components/
│   ├── ai-bot/
│   │   ├── AskAIBot.vue        # 悬浮聊天组件（核心）
│   │   ├── ChatMessages.vue    # 消息列表组件
│   │   ├── ChatInput.vue      # 输入框组件
│   │   ├── ChatHeader.vue     # 头部组件
│   │   ├── ToolCall.vue       # 工具调用组件
│   │   └── types/
│   │       └── chat.ts        # 类型定义
│   └── ai-elements/            # AI 元素组件库
│       ├── conversation/      # 对话容器
│       ├── message/           # 消息组件
│       ├── sandbox/           # 工具调用展示
│       └── ...
├── lib/
│   └── utils.ts               # 工具函数
└── App.vue                    # 应用入口
```

## 核心组件

### AskAIBot.vue

核心悬浮聊天组件，特性：

- 使用 `LangGraph.Client` 连接到后端 `/agent` API
- 支持流式响应 (stream)
- 通过 Vite 代理转发请求到后端
- 使用 `thread` 管理对话上下文

### API 集成

后端 API 通过 Vite 代理：
- 开发环境：`/agent/*` → 代理到后端（默认 `localhost:2024`）
- 生产环境：配置 `VITE_LANGGRAPH_API_URL`

## 配置

### 环境变量

在 `.env.development` 或 `.env.production` 中配置：

```
VITE_LANGGRAPH_API_URL=http://localhost:2024
```

### LangGraph 后端地址

在 `AskAIBot.vue` 中修改：

```typescript
const langgraph = new LangGraph({
  baseUrl: 'http://localhost:2024'
})
```

## 许可证

MIT
