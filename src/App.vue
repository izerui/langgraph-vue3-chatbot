<script setup lang="ts">
import AskAIBot from './components/AskAIBot.vue'
import ChatBotExample from './components/ai-elements/examples/chatbot.vue'
</script>

<template>
  <div class="app-container">
    <header>
      <h1>AI Chat</h1>
      <p>Vue 3 + LangGraph 聊天组件示例</p>
    </header>

    <main>
      <section class="intro">
        <h2>组件介绍</h2>
        <p>本项目展示如何使用 <strong>AI 元素组件库</strong> 构建 AI 聊天应用：</p>
        <ul>
          <li>基于 <code>@langchain/langgraph-sdk</code> 流式响应</li>
          <li>模块化组件设计</li>
          <li>支持工具调用、推理过程、来源引用</li>
        </ul>
      </section>

      <div class="divider">
        <span class="divider-text">组件示例</span>
      </div>

      <div class="demo-container">
        <ChatBotExample />
      </div>
    </main>

    <AskAIBot
      assistant-id="research"
      assistant-name="我的助手"
      :default-expanded="false"
    />
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
}

.app-container {
  min-height: 100vh;
  padding-bottom: 80px;
}

header {
  background: #333;
  color: white;
  padding: 24px;
  text-align: center;
}

header h1 {
  margin: 0 0 8px;
}

header p {
  margin: 0;
  opacity: 0.8;
}

main {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

section h2 {
  margin-top: 0;
  color: #333;
}

section p {
  color: #666;
  line-height: 1.6;
}

section ul {
  color: #666;
  line-height: 1.8;
}

code {
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
  color: #e65100;
}

pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}

pre code {
  background: none;
  padding: 0;
  color: inherit;
}

.divider {
  display: flex;
  align-items: center;
  margin: 30px 0;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #ddd;
}

.divider-text {
  padding: 0 20px;
  color: #666;
  font-size: 14px;
}

.demo-container {
  height: 600px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
</style>
