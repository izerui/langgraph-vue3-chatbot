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

### 项目结构
```
src/
├── main.ts                    # 应用入口
├── App.vue                    # 根组件
├── style.css                  # 全局样式
├── lib/utils.ts               # 工具函数 (cn, 等)
├── components/
│   ├── AskAIBot.vue          # 悬浮聊天组件 (核心)
│   ├── ai-elements/          # AI 元素组件库 (对话 UI)
│   │   ├── conversation/     # 对话容器
│   │   ├── message/          # 消息组件
│   │   ├── prompt-input/     # 输入框组件
│   │   ├── attachments/      # 附件组件
│   │   ├── reasoning/        # 推理过程展示
│   │   ├── sources/          # 来源引用
│   │   └── suggestion/       # 建议提示
│   └── ui/                   # 基础 UI 组件 (shadcn-vue)
```

### 核心组件: AskAIBot.vue

`src/components/AskAIBot.vue` 是核心聊天组件:
- 使用 `LangGraph.Client` 连接到后端 `/agent` API
- 支持流式响应 (stream)
- 通过 Vite 代理转发请求到后端 (`VITE_LANGGRAPH_API_URL` 或默认 `http://localhost:2024`)
- 使用 `thread` 管理对话上下文

### API 集成

后端 API 通过 Vite 代理:
- 开发环境请求 `/agent/*` → 代理到后端 (默认 `localhost:2024`)
- 生产环境需配置反向代理或环境变量 `VITE_LANGGRAPH_API_URL`

流式响应处理示例:
```typescript
const streamResponse = client.runs.stream(
  threadId,
  assistantId,
  { input: { messages: [...] }, streamMode: ['messages-tuple', 'values', 'custom'] }
)

for await (const chunk of streamResponse) {
  // 处理 chunk.event 和 chunk.data
}
```

### 路径别名
- `@` 指向 `src/`

### 配置
- 环境变量: `.env.development`, `.env.production`, `.env.test`
- 关键配置: `VITE_LANGGRAPH_API_URL` - LangGraph 后端地址

## Development Notes

- tsconfig.json 中 `exclude: ["src/components/ai-elements/**/*"]` - AI 元素组件使用 JavaScript
- AskAIBot 组件默认使用 MiniMax M2.5 模型 (可通过 `configurable` 修改)
- 消息支持多版本展示 (MessageBranch)、附件 (Attachments)、来源引用 (Sources)、推理过程 (Reasoning)
