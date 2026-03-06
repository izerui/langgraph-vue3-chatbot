# Chatbot 组件集成架构设计

## 1. 组件概述

AskAIBot 是一个悬浮式 AI 聊天组件，基于 Vue 3 + Agent Service API 实现流式对话功能。

## 2. 核心依赖

- Vue 3 (Composition API)
- @langchain/langgraph-sdk (与 Agent Service API 通信)
- ai-elements-vue (UI 组件库)

## 3. 消息流程

用户输入 → 构建消息 → Agent Service API → 流式响应 → 解析渲染

## 4. 环境配置

| 环境变量 | 说明 | 示例 |
|---------|------|------|
| VITE_LANGGRAPH_API_URL | Agent Service 后端地址 | http://localhost:2024 |
| VITE_LANGGRAPH_API_KEY | API 认证密钥（可选） | sk-xxx |

## 5. 组件属性

```typescript
interface Props {
  assistantId?: string   // Assistant/Graph ID，默认 'research'
  assistantName?: string // 组件显示名称，默认 'Chat'
  defaultExpanded?: boolean // 默认展开状态
}
```

## 6. 核心函数

- `handleSubmit(message)` - 发送消息到后端
- `handleFormSubmit()` - 处理表单提交事件
- `handleSuggestionClick()` - 处理建议点击

## 7. 集成方式

在目标项目中引入组件并使用：

```vue
<AskAIBot
  assistant-id="your-assistant"
  assistant-name="AI 助手"
/>
```

## 8. 跨域注意

生产环境需后端配置 CORS 响应头允许前端域名访问。
