<script setup lang="ts">
import AskAi from './components/ai-bot/AskAi.vue'
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
          system-prompt="你是一个专业的技术顾问，擅长回答编程问题。"
          :show-header-actions="false"
          :suggestions="[
            '你好，请介绍一下自己',
            '你能做什么？',
            '演示几个工具调用,针对每个工具演示要进行说明.',
            '今天天气怎么样？'
          ]"
        />
      </div>
    </main>

    <AskAi
      assistant-id="research"
      thread-id="9f31354d-b2f8-4472-8ab7-fd49cd52e32a"
      assistant-name="我的助手"
      :default-expanded=false
      system-prompt="你是一个专业的技术顾问，擅长回答编程问题。"
      :suggestions="[
        '你好，请介绍一下自己',
        '你能做什么？',
        '演示几个工具调用,针对每个工具演示要进行说明.',
        '今天天气怎么样？'
      ]"
    />
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

main {
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
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
  height: calc(100vh - 220px);
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
</style>
