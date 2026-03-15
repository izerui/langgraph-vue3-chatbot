<script setup lang="ts">
import { computed, ref } from 'vue'
import { AskAiBot, ChatBot } from 'langgraph-vue3-chatbot'
import type { PromptInputAttachment } from 'langgraph-vue3-chatbot'

const fallbackApiUrl = 'http://localhost:2024'
const fallbackAssistantId = 'research'
const fallbackAssistantName = 'LangGraph Demo Assistant'

const apiUrl = import.meta.env.VITE_LANGGRAPH_API_URL?.trim() || fallbackApiUrl
const apiKey = import.meta.env.VITE_LANGGRAPH_API_KEY?.trim() || undefined
const assistantId = import.meta.env.VITE_LANGGRAPH_ASSISTANT_ID?.trim() || fallbackAssistantId
const assistantName = import.meta.env.VITE_LANGGRAPH_ASSISTANT_NAME?.trim() || fallbackAssistantName

const isPlaceholderConfig = computed(() => {
  return apiUrl === fallbackApiUrl || assistantId === fallbackAssistantId
})

const suggestions = [
  '这个 demo 怎么接入真实服务？',
  'ChatBot 和 AskAiBot 分别适合什么场景？',
  '如何通过插槽自定义空状态和附件按钮？',
]

const attachmentDialogOpen = ref(false)
const pendingAddAttachments = ref<((attachments: PromptInputAttachment[]) => void) | null>(null)

const demoAttachment: PromptInputAttachment = {
  type: 'file_url',
  url: 'https://example.com/files/langgraph-demo-guide.pdf',
  filename: 'langgraph-demo-guide.pdf',
  mediaType: 'application/pdf',
}

function openAttachmentDialog(addAttachments: (attachments: PromptInputAttachment[]) => void) {
  pendingAddAttachments.value = addAttachments
  attachmentDialogOpen.value = true
}

function closeAttachmentDialog() {
  attachmentDialogOpen.value = false
  pendingAddAttachments.value = null
}

function confirmAttachmentSelection() {
  if (pendingAddAttachments.value) {
    pendingAddAttachments.value([demoAttachment])
  }

  closeAttachmentDialog()
}

function formatCustomContent(content: unknown) {
  if (content == null) {
    return '无内容'
  }

  if (typeof content === 'string') {
    return content
  }

  try {
    return JSON.stringify(content, null, 2)
  }
  catch {
    return String(content)
  }
}
</script>

<template>
  <div class="page">
    <section class="section-header compact-header">
      <h2>ChatBot 示例</h2>
    </section>

    <section class="chat-panel">
      <ChatBot
        :api-url="apiUrl"
        :api-key="apiKey"
        :assistant-id="assistantId"
        system-prompt="你是一个有用的AI助手"
        :assistant-name="assistantName"
        :suggestions="suggestions"
        :show-header-actions="false"
      >
        <template #attachment-trigger="{ addAttachments }">
          <button
            type="button"
            class="attachment-trigger"
            title="添加示例附件"
            @click="openAttachmentDialog(addAttachments)"
          >
            <span class="attachment-trigger-icon">+</span>
            <span class="sr-only">添加附件</span>
          </button>
        </template>

        <template #empty="{ sendMessage }">
          <div class="empty-state">
            <div class="empty-badge">AI</div>
            <h3>欢迎体验 ChatBot</h3>
            <p>
              这里演示的是自定义空状态插槽。你可以在这里放品牌介绍、操作说明，
              或者引导用户点击快捷问题开始对话。
            </p>
            <div class="quick-actions">
              <button type="button" class="quick-action-btn" @click="sendMessage('介绍一下这个组件库')">
                介绍组件库
              </button>
              <button type="button" class="quick-action-btn" @click="sendMessage('如何接入 LangGraph 服务？')">
                接入 LangGraph
              </button>
              <button type="button" class="quick-action-btn" @click="sendMessage('展示一个插槽自定义示例')">
                查看插槽示例
              </button>
            </div>
          </div>
        </template>

        <template #custom="{ customContent, threadId }">
          <div class="custom-card">
            <div class="custom-card-header">
              <span class="custom-tag">custom</span>
              <span class="thread-id">thread: {{ threadId || '未创建' }}</span>
            </div>
            <div class="custom-card-body">
              <p class="custom-type">type: {{ customContent?.type || 'unknown' }}</p>
              <pre class="custom-pre">{{ formatCustomContent(customContent?.content) }}</pre>
            </div>
          </div>
        </template>
      </ChatBot>
    </section>

    <section class="section-header floating-header">
      <div>
        <h2>AskAiBot 示例</h2>
        <p>右下角悬浮按钮同样复用了基础 HTML/CSS 插槽演示。</p>
      </div>
    </section>

    <AskAiBot
      :api-url="apiUrl"
      :api-key="apiKey"
      :assistant-id="assistantId"
      :assistant-name="assistantName"
      system-prompt="你是一个有用的AI助手"
      :suggestions="suggestions"
    >
      <template #attachment-trigger="{ addAttachments }">
        <button
          type="button"
          class="attachment-trigger"
          title="添加示例附件"
          @click="openAttachmentDialog(addAttachments)"
        >
          <span class="attachment-trigger-icon">+</span>
          <span class="sr-only">添加附件</span>
        </button>
      </template>

      <template #empty="{ sendMessage }">
        <div class="empty-state compact">
          <div class="empty-badge">AI</div>
          <h3>欢迎体验 AskAiBot</h3>
          <p>
            这个空状态内容完全由业务侧控制，你可以自由替换成欢迎语、品牌内容或快捷入口。
          </p>
          <div class="quick-actions vertical">
            <button type="button" class="quick-action-btn" @click="sendMessage('这个悬浮助手适合什么场景？')">
              使用场景
            </button>
            <button type="button" class="quick-action-btn" @click="sendMessage('如何自定义附件按钮？')">
              自定义附件按钮
            </button>
          </div>
        </div>
      </template>

      <template #custom="{ customContent, threadId }">
        <div class="custom-card compact">
          <div class="custom-card-header">
            <span class="custom-tag">custom</span>
            <span class="thread-id">thread: {{ threadId || '未创建' }}</span>
          </div>
          <div class="custom-card-body">
            <p class="custom-type">type: {{ customContent?.type || 'unknown' }}</p>
            <pre class="custom-pre">{{ formatCustomContent(customContent?.content) }}</pre>
          </div>
        </div>
      </template>
    </AskAiBot>

    <div v-if="attachmentDialogOpen" class="dialog-mask" @click.self="closeAttachmentDialog">
      <div class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div class="dialog-header">
          <h3 id="dialog-title">添加 URL 附件</h3>
          <p>
            这是一个完全使用原生 HTML 构建的对话框示例。点击确认后，会调用
            <code>addAttachments</code>，把远程 PDF 作为附件回填到输入框。
          </p>
        </div>

        <div class="dialog-option selected">
          <span class="dialog-option-title">langgraph-demo-guide.pdf</span>
          <span class="dialog-option-desc">https://example.com/files/langgraph-demo-guide.pdf</span>
        </div>

        <div class="dialog-actions">
          <button type="button" class="dialog-secondary-btn" @click="closeAttachmentDialog">
            取消
          </button>
          <button type="button" class="dialog-primary-btn" @click="confirmAttachmentSelection">
            添加到输入框
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:global(body) {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f6f8fb;
  color: #1f2937;
}

:global(*) {
  box-sizing: border-box;
}

.page {
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 20px 96px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 12px 0 10px;
}

.section-header h2,
.section-header p {
  margin: 0;
}

.section-header h2 {
  font-size: 20px;
  color: #111827;
}

.compact-header {
  gap: 12px;
}

.compact-header p {
  color: #6b7280;
  line-height: 1.4;
}

.section-header p {
  margin: 0;
  color: #6b7280;
  line-height: 1.6;
}

.chat-panel {
  height: calc(100vh - 250px);
  min-height: 620px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
}

.floating-header {
  margin-top: 20px;
}

.empty-state {
  display: flex;
  min-height: 280px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 24px;
  text-align: center;
}

.empty-state.compact {
  min-height: 220px;
  padding: 28px 20px;
}

.empty-badge {
  display: grid;
  width: 60px;
  height: 60px;
  place-items: center;
  border-radius: 999px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.empty-state h3 {
  margin: 16px 0 10px;
  font-size: 24px;
  line-height: 1.3;
  color: #111827;
}

.empty-state p {
  max-width: 560px;
  margin: 0;
  color: #4b5563;
  line-height: 1.7;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 22px;
}

.quick-actions.vertical {
  flex-direction: column;
  align-items: stretch;
}

.quick-action-btn {
  border: 1px solid #c7d2fe;
  border-radius: 999px;
  background: #fff;
  padding: 10px 16px;
  color: #4338ca;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-action-btn:hover {
  border-color: #818cf8;
  background: #eef2ff;
}

.attachment-trigger {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.attachment-trigger:hover {
  border-color: #dbe2ea;
  background: #f8fafc;
  transform: translateY(-1px);
}

.attachment-trigger-icon {
  font-size: 18px;
  line-height: 1;
  color: #4b5563;
}

.custom-card {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fafafa;
  overflow: hidden;
}

.custom-card.compact {
  border-radius: 14px;
}

.custom-card-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
}

.custom-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #e0e7ff;
  color: #4338ca;
  font-size: 12px;
  font-weight: 600;
}

.thread-id {
  color: #6b7280;
  font-size: 12px;
}

.custom-card-body {
  padding: 14px;
}

.custom-type {
  margin: 0 0 10px;
  color: #374151;
  font-size: 13px;
  font-weight: 600;
}

.custom-pre {
  margin: 0;
  padding: 12px;
  border-radius: 12px;
  background: #111827;
  color: #f9fafb;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-x: auto;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.45);
}

.dialog-card {
  width: 100%;
  max-width: 520px;
  border-radius: 18px;
  background: #fff;
  padding: 20px;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.24);
}

.dialog-header h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: #111827;
}

.dialog-header p {
  margin: 0;
  color: #6b7280;
  line-height: 1.7;
}

.dialog-option {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 18px;
  padding: 16px;
  border: 1px solid #ddd6fe;
  border-radius: 14px;
  background: #f5f3ff;
}

.dialog-option-title {
  color: #1f2937;
  font-size: 14px;
  font-weight: 600;
}

.dialog-option-desc {
  color: #6b7280;
  font-size: 12px;
  line-height: 1.6;
  word-break: break-all;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.dialog-primary-btn,
.dialog-secondary-btn {
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dialog-primary-btn {
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
}

.dialog-primary-btn:hover {
  background: #1d4ed8;
}

.dialog-secondary-btn {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.dialog-secondary-btn:hover {
  background: #f9fafb;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 768px) {
  .page {
    padding: 24px 16px 88px;
  }

  .hero h1 {
    font-size: 28px;
  }

  .chat-panel {
    min-height: 560px;
    height: 70vh;
  }

  .quick-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .dialog-actions {
    flex-direction: column-reverse;
  }

  .dialog-primary-btn,
  .dialog-secondary-btn {
    width: 100%;
  }
}
</style>
