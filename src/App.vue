<script setup lang="ts">
import AskAi from './components/ai-bot/AskAi.vue'
import ChatBotExample from './components/ai-elements/examples/chatbot.vue'
import ChatBot from "@/components/ai-bot/ChatBot.vue";
import GeneratedFiles from './components/ai-bot/GeneratedFiles.vue'
import { KNOWLEDGE_GRAPH_PROMPT } from './prompts'

const apiUrl = import.meta.env.VITE_LANGGRAPH_API_URL || 'http://localhost:2024'
const apiKey = import.meta.env.VITE_LANGGRAPH_API_KEY
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
          :api-url="apiUrl"
          :api-key="apiKey"
          assistant-id="research"
          thread-id="9f31354d-b2f8-4472-8ab7-fd49cd52e376"
          assistant-name="我的助手"
          :system-prompt="KNOWLEDGE_GRAPH_PROMPT"
          :show-header-actions="false"
          :suggestions="[
            '生成建模图',
            '你能做什么？',
            '演示几个工具调用,针对每个工具演示要进行说明.',
            '今天天气怎么样？'
          ]"
        >
          <!-- 空状态：欢迎卡片 -->
          <template #empty="{ sendMessage }">
            <div class="welcome-card">
              <div class="ai-logo">AI</div>
              <h2 class="welcome-title">您好，我是知识建模AI助手</h2>
              <hr class="welcome-divider">
              <p class="welcome-desc">
                可以帮助您生成知识点、语义关系，并自动构建知识建模图。请点击下方的"生成知识点"按钮，我将引导您提供关键信息，为您逐步生成知识建模内容。
              </p>
<!--              <div class="welcome-actions">-->
<!--                <button class="action-btn" @click="sendMessage('生成知识点')">第一步：生成知识点</button>-->
<!--                <button class="action-btn" @click="sendMessage('生成语义关系')">第二步：生成语义关系</button>-->
<!--                <button class="action-btn" @click="sendMessage('生成教学设计')">第三步：生成教学设计</button>-->
<!--              </div>-->
            </div>
          </template>
          <!-- 覆盖默认的自定义消息 --->
          <template #custom="{ customContent, threadId }">
            <GeneratedFiles
              v-if="customContent?.type === 'generated_files'"
              :custom-content="customContent"
              :api-url="apiUrl"
              :thread-id="threadId"
            />
            <div v-else class="custom-message">
              <div class="custom-type-badge">{{ customContent?.type }}</div>
              <pre class="custom-content">{{ JSON.stringify(customContent?.content, null, 2) }}</pre>
            </div>
          </template>
        </ChatBot>
      </div>
    </main>

    <AskAi
      :api-url="apiUrl"
      :api-key="apiKey"
      assistant-id="research"
      thread-id="9f31354d-b2f8-4472-8ab7-fd49cd52e555"
      assistant-name="我的助手"
      :system-prompt="KNOWLEDGE_GRAPH_PROMPT"
      :show-header-actions="false"
      :suggestions="[
        '生成建模图',
        '你能做什么？',
        '演示几个工具调用,针对每个工具演示要进行说明.',
        '今天天气怎么样？'
      ]"
    >
      <!-- 空状态：欢迎卡片 -->
      <template #empty="{ sendMessage }">
        <div class="welcome-card">
          <div class="ai-logo">AI</div>
          <h2 class="welcome-title">您好，我是知识建模AI助手</h2>
          <hr class="welcome-divider">
          <p class="welcome-desc">
            可以帮助您生成知识点、语义关系，并自动构建知识建模图。请点击下方的"生成知识点"按钮，我将引导您提供关键信息，为您逐步生成知识建模内容。
          </p>
<!--              <div class="welcome-actions">-->
<!--                <button class="action-btn" @click="sendMessage('生成知识点')">第一步：生成知识点</button>-->
<!--                <button class="action-btn" @click="sendMessage('生成语义关系')">第二步：生成语义关系</button>-->
<!--                <button class="action-btn" @click="sendMessage('生成教学设计')">第三步：生成教学设计</button>-->
<!--              </div>-->
        </div>
      </template>
      <!-- 覆盖默认的自定义消息 --->
      <template #custom="{ customContent, threadId }">
        <GeneratedFiles
          v-if="customContent?.type === 'generated_files'"
          :custom-content="customContent"
          :api-url="apiUrl"
          :thread-id="threadId"
        />
        <div v-else class="custom-message">
          <div class="custom-type-badge">{{ customContent?.type }}</div>
          <pre class="custom-content">{{ JSON.stringify(customContent?.content, null, 2) }}</pre>
        </div>
      </template>
    </AskAi>
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

/* 欢迎卡片样式 */
.welcome-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
}

.ai-logo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a18cd1, #fbc2eb);
  color: white;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.welcome-title {
  font-size: 20px;
  color: #4A69BD;
  margin: 0 0 12px 0;
  font-weight: 600;
}

.welcome-divider {
  width: 60px;
  height: 2px;
  background: linear-gradient(to right, #a18cd1, #fbc2eb);
  border: none;
  margin: 0 0 16px 0;
}

.welcome-desc {
  max-width: 320px;
  font-size: 14px;
  line-height: 1.6;
  color: #666;
  margin: 0 0 24px 0;
}

.welcome-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  padding: 8px 16px;
  font-size: 13px;
  color: #7c3aed;
  background: #f3e8ff;
  border: 1px solid #ddd;
  border-radius: 9999px;
  cursor: pointer;
  transition: background 0.2s;
}

.action-btn:hover {
  background: #e9d5ff;
}

/* custom 消息样式 */
.custom-message {
  padding: 8px 0;
}

.custom-type-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #6366f1;
  background: #e0e7ff;
  border-radius: 4px;
  margin-bottom: 8px;
}

.custom-content {
  margin: 0;
  padding: 8px;
  font-size: 13px;
  background: #f8fafc;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
