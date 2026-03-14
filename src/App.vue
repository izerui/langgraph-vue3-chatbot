<script setup lang="ts">
import { ref } from 'vue'
import { PlusIcon } from 'lucide-vue-next'
import ChatBot from '@/components/ai-bot/ChatBot.vue'
import AskAiBot from './components/ai-bot/AskAiBot.vue'
import GeneratedFiles from './components/ai-bot/GeneratedFiles.vue'
import type { PromptInputAttachment } from './components/ai-bot/lib/prompt-input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ai-bot/ui/dialog'
import { KNOWLEDGE_GRAPH_PROMPT } from './prompts'

const apiUrl = import.meta.env.VITE_LANGGRAPH_API_URL || 'http://localhost:2024'
const apiKey = import.meta.env.VITE_LANGGRAPH_API_KEY
const attachmentDialogOpen = ref(false)
const pendingAddAttachments = ref<((attachments: PromptInputAttachment[]) => void) | null>(null)

const demoAttachment: PromptInputAttachment = {
  type: 'file_url',
  url: 'https://example.com/files/knowledge-modeling-manual.pdf',
  filename: '知识建模操作手册.pdf',
  mediaType: 'application/pdf',
}

function openAttachmentDialog(addAttachments: (attachments: PromptInputAttachment[]) => void) {
  pendingAddAttachments.value = addAttachments
  attachmentDialogOpen.value = true
}

function confirmAttachmentSelection() {
  if (!pendingAddAttachments.value) {
    attachmentDialogOpen.value = false
    return
  }

  pendingAddAttachments.value([demoAttachment])
  attachmentDialogOpen.value = false
}
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
        >
          <template #attachment-trigger="{ addAttachments }">
            <button
              type="button"
              class="custom-attachment-trigger"
              title="通过对话框添加附件"
              @click="openAttachmentDialog(addAttachments)"
            >
              <PlusIcon class="size-4" />
            </button>
          </template>
          <!-- 空状态：欢迎卡片 -->
          <template #empty>
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

    <AskAiBot
      :api-url="apiUrl"
      :api-key="apiKey"
      assistant-id="research"
      thread-id="9f31354d-b2f8-4472-8ab7-fd49cd52e558"
      assistant-name="我的助手"
      :system-prompt="KNOWLEDGE_GRAPH_PROMPT"
      :show-header-actions="false"
    >
      <template #attachment-trigger="{ addAttachments }">
        <button
          type="button"
          class="custom-attachment-trigger"
          title="通过对话框添加附件"
          @click="openAttachmentDialog(addAttachments)"
        >
          <PlusIcon class="size-4" />
        </button>
      </template>
      <template #empty>
        <div class="welcome-card">
          <div class="ai-logo">AI</div>
          <h2 class="welcome-title">您好，我是知识建模AI助手</h2>
          <hr class="welcome-divider">
          <p class="welcome-desc">
            可以帮助您生成知识点、语义关系，并自动构建知识建模图。请点击下方的"生成知识点"按钮，我将引导您提供关键信息，为您逐步生成知识建模内容。
          </p>
        </div>
      </template>
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
    </AskAiBot>

    <Dialog v-model:open="attachmentDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加 URL 附件</DialogTitle>
          <DialogDescription>
            这是最小化的 file_url 示例。点击确认后，会把一个远程 PDF 链接通过 addAttachments 回填到当前聊天输入框。
          </DialogDescription>
        </DialogHeader>

        <div class="dialog-options">
          <div class="dialog-option selected">
            <span class="dialog-option-title">知识建模操作手册.pdf</span>
            <span class="dialog-option-desc">https://example.com/files/knowledge-modeling-manual.pdf</span>
          </div>
        </div>

        <DialogFooter>
          <button type="button" class="dialog-secondary-btn" @click="attachmentDialogOpen = false">
            取消
          </button>
          <button type="button" class="dialog-primary-btn" @click="confirmAttachmentSelection">
            添加到输入框
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

.custom-attachment-trigger {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.custom-attachment-trigger:hover {
  background: hsl(var(--accent) / 0.8);
  color: hsl(var(--foreground));
}

.dialog-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dialog-option {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  text-align: left;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.dialog-option:hover {
  border-color: #b9c7d8;
  background: #f8fbff;
}

.dialog-option.selected {
  border-color: #7c3aed;
  background: #f5f3ff;
  box-shadow: 0 0 0 1px rgba(124, 58, 237, 0.08);
}

.dialog-option-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.dialog-option-desc {
  font-size: 12px;
  line-height: 1.5;
  color: #6b7280;
}

.dialog-primary-btn,
.dialog-secondary-btn {
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.dialog-primary-btn {
  border: 1px solid #7c3aed;
  background: #7c3aed;
  color: #fff;
}

.dialog-primary-btn:hover {
  background: #6d28d9;
}

.dialog-secondary-btn {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
}

.dialog-secondary-btn:hover {
  background: #f9fafb;
}
</style>
