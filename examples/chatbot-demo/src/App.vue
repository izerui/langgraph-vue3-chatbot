<script setup lang="ts">
import { computed } from 'vue'
import { AskAiBot, ChatBot } from 'langgraph-vue3-chatbot'

const fallbackApiUrl = 'http://localhost:2024'
const fallbackAssistantId = 'demo-assistant'
const fallbackAssistantName = 'LangGraph Demo Assistant'

const apiUrl = import.meta.env.VITE_LANGGRAPH_API_URL?.trim() || fallbackApiUrl
const assistantId = import.meta.env.VITE_LANGGRAPH_ASSISTANT_ID?.trim() || fallbackAssistantId
const assistantName = import.meta.env.VITE_LANGGRAPH_ASSISTANT_NAME?.trim() || fallbackAssistantName

const isPlaceholderConfig = computed(() => {
  return apiUrl === fallbackApiUrl || assistantId === fallbackAssistantId
})

const suggestions = [
  '这个 demo 怎么接入真实服务？',
  'ChatBot 和 AskAiBot 分别适合什么场景？',
]
</script>

<template>
  <div class="page">
    <section class="intro">
      <p class="eyebrow">Vue 3 Demo</p>
      <h1>langgraph-vue3-chatbot 最小接入示例</h1>
      <p class="description">
        这个页面只保留组件引入、环境变量读取和基础挂载，方便直接验证
        <code>ChatBot</code> 是否接入成功。
      </p>

      <div class="config">
        <p><strong>apiUrl:</strong> {{ apiUrl }}</p>
        <p><strong>assistantId:</strong> {{ assistantId }}</p>
        <p><strong>assistantName:</strong> {{ assistantName }}</p>
      </div>

      <p v-if="isPlaceholderConfig" class="notice">
        当前使用占位配置。可在 <code>.env.local</code> 中设置
        <code>VITE_LANGGRAPH_API_URL</code>、<code>VITE_LANGGRAPH_ASSISTANT_ID</code>、
        <code>VITE_LANGGRAPH_ASSISTANT_NAME</code>。
      </p>
    </section>

      <ChatBot
        :api-url="apiUrl"
        :assistant-id="assistantId"
        :assistant-name="assistantName"
      >
      </ChatBot>

    <AskAiBot
      :api-url="apiUrl"
      :assistant-id="assistantId"
      :assistant-name="assistantName"
      :suggestions="suggestions"
    />
  </div>
</template>

<style scoped>
.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 20px 48px;
  color: #1f2937;
}

.intro {
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #2563eb;
}

h1 {
  margin: 0 0 12px;
  font-size: 32px;
  line-height: 1.2;
}

.description {
  margin: 0 0 16px;
  line-height: 1.6;
}

.config {
  padding: 16px;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: #f8fbff;
}

.config p,
.notice {
  margin: 0;
  line-height: 1.6;
}

.config p + p {
  margin-top: 8px;
}

.notice {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #fff7ed;
  color: #9a3412;
}

.demo {
  min-height: 640px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
}

.empty-state {
  display: flex;
  min-height: 260px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  text-align: center;
  color: #4b5563;
}

.empty-badge {
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 18px;
  font-weight: 700;
}

.empty-state h2 {
  margin: 16px 0 8px;
  font-size: 28px;
  line-height: 1.2;
  color: #111827;
}

.empty-state p {
  max-width: 520px;
  margin: 0;
  line-height: 1.6;
}

.empty-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.empty-actions button {
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #fff;
  padding: 10px 16px;
  color: #1d4ed8;
  cursor: pointer;
}
</style>
