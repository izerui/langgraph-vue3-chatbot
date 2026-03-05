# LangGraph Vue3 Chatbot

基于 Vue 3 + LangGraph 的 AI 聊天应用示例。

## 功能特性

- 基于 `@langchain/langgraph-sdk` 实现流式响应
- 模块化组件设计
- 支持工具调用、推理过程展示
- AI Elements 组件库集成

## 技术栈

- **前端框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **AI SDK**: @langchain/langgraph-sdk, ai
- **UI 组件**: ai-elements-vue, reka-ui

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

### 预览构建结果

```bash
pnpm preview
```

## 项目结构

```
src/
├── components/
│   ├── AskAIBot.vue        # AI 聊天组件
│   └── ai-elements/        # AI 元素组件库
├── lib/
│   └── utils.ts           # 工具函数
└── App.vue                 # 应用入口
```

## 使用示例

### AskAIBot 组件

```vue
<AskAIBot
  assistant-id="your-assistant-id"
  assistant-name="AI 助手"
  :default-expanded="true"
/>
```

## 配置

在 `AskAIBot.vue` 中配置 LangGraph 后端地址：

```typescript
const langgraph = new LangGraph({
  baseUrl: 'http://localhost:20200'
})
```

## 许可证

MIT
