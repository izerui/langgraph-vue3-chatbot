<script setup lang="ts">
import AskAiBtn from './components/ai-bot/AskAiBtn.vue'
import ChatBotExample from './components/ai-elements/examples/chatbot.vue'
import ChatBot from "@/components/ai-bot/ChatBot.vue";
</script>

<template>
  <div class="app-container">
    <header>
      <h1>AI ChatBot</h1>
      <p>Vue 3 + LangGraph 聊天组件示例 基于 `@langchain/langgraph-sdk` 流式响应、模块化组件设计、支持工具调用、推理过程</p>
    </header>

    <main>

      <div class="divider">
        <span class="divider-text">组件示例</span>
      </div>

      <div class="demo-container">
        <ChatBot
          assistant-id="research"
          thread-id="9f31354d-b2f8-4472-8ab7-fd49cd52e32a"
          assistant-name="我的助手"
          :default-expanded="false"
          system-prompt="你是一个专业的技术顾问，擅长回答编程问题。"
          :show-header-actions="false"
        />
      </div>
    </main>

    <AskAiBtn
      assistant-id="research"
      thread-id="9f31354d-b2f8-4472-8ab7-fd49cd52e32a"
      assistant-name="我的助手"
      :default-expanded=false
      system-prompt="你是一个专业的技术顾问，擅长回答编程问题。"
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
  padding: 16px 24px;
  text-align: center;
}

header h1 {
  margin: 0;
  font-size: 20px;
}

header > p {
  margin: 4px 0 0;
  font-size: 14px;
  opacity: 0.8;
}

.header-intro {
  margin-top: 12px;
  text-align: left;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 6px;
}

.header-intro p {
  margin: 0 0 4px;
  font-size: 13px;
}

.header-intro ul {
  margin: 0;
  padding-left: 18px;
  font-size: 12px;
  line-height: 1.5;
}

.header-intro code {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
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
