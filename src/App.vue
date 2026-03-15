<script setup lang="ts">
import { ref } from 'vue'
import { PlusIcon } from 'lucide-vue-next'
import { AskAiBot, ChatBot, GeneratedFiles } from '@/components/ai-bot'
import type { AiBotTheme, PromptInputAttachment } from '@/components/ai-bot'
import { KNOWLEDGE_GRAPH_PROMPT } from './prompts'

const apiUrl = import.meta.env.VITE_LANGGRAPH_API_URL || 'http://localhost:2024'
const apiKey = import.meta.env.VITE_LANGGRAPH_API_KEY
const attachmentDialogOpen = ref(false)
const pendingAddAttachments = ref<((attachments: PromptInputAttachment[]) => void) | null>(null)
const currentTheme = ref<AiBotTheme>('light')

const themeOptions: Array<{ value: AiBotTheme, label: string, description: string }> = [
  { value: 'light', label: '浅色', description: '默认主题' },
  { value: 'dark', label: '深色', description: '暗黑主题' }
]

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

function closeAttachmentDialog() {
  attachmentDialogOpen.value = false
  pendingAddAttachments.value = null
}

function confirmAttachmentSelection() {
  if (!pendingAddAttachments.value) {
    closeAttachmentDialog()
    return
  }

  pendingAddAttachments.value([demoAttachment])
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
  <div class="app-container">
    <header>
      <h1>AI ChatBot</h1>
      <p>Vue 3 + LangGraph 聊天组件示例，支持浅色 / 深色主题切换、流式响应、工具调用与推理过程展示</p>
    </header>

    <main>
      <div class="layout-shell">
        <aside class="theme-sidebar">
          <div class="theme-toolbar__content">
            <div>
              <h2>风格</h2>
            </div>

            <div class="theme-switcher" role="tablist" aria-label="切换主题">
              <button
                v-for="theme in themeOptions"
                :key="theme.value"
                type="button"
                class="theme-switcher__item"
                :class="{ 'is-active': currentTheme === theme.value }"
                @click="currentTheme = theme.value"
              >
                <span class="theme-switcher__label">{{ theme.label }}</span>
                <span class="theme-switcher__desc">{{ theme.description }}</span>
              </button>
            </div>
          </div>
        </aside>

        <section class="content-panel">
          <div class="divider">
            <span class="divider-text">组件示例</span>
          </div>

          <div class="demo-container">
            <ChatBot
              :theme="currentTheme"
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

              <template #empty>
                <div class="welcome-card">
                  <div class="ai-logo">AI</div>
                  <h2 class="welcome-title">您好，我是知识建模AI助手</h2>
                  <hr class="welcome-divider">
                  <p class="welcome-desc">
                    可以帮助您生成知识点、语义关系，并自动构建知识建模图。请切换左侧主题，观察整体视觉、输入框和消息区域表现。
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
                  <div class="custom-type-badge">{{ customContent?.type || 'custom' }}</div>
                  <div v-if="threadId" class="custom-thread-id">thread: {{ threadId }}</div>
                  <pre class="custom-content">{{ formatCustomContent(customContent?.content) }}</pre>
                </div>
              </template>
            </ChatBot>
          </div>
        </section>
      </div>
    </main>

    <AskAiBot
      :theme="currentTheme"
      :api-url="apiUrl"
      :api-key="apiKey"
      assistant-id="research"
      thread-id="9f31354d-b2f8-4472-8ab7-fd49cd52e558"
      assistant-name="我的助手"
      :system-prompt="KNOWLEDGE_GRAPH_PROMPT"
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
            可以帮助您生成知识点、语义关系，并自动构建知识建模图。请切换左侧主题，观察浮动按钮、展开面板与浮层是否同步。
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
          <div class="custom-type-badge">{{ customContent?.type || 'custom' }}</div>
          <div v-if="threadId" class="custom-thread-id">thread: {{ threadId }}</div>
          <pre class="custom-content">{{ formatCustomContent(customContent?.content) }}</pre>
        </div>
      </template>
    </AskAiBot>

    <div v-if="attachmentDialogOpen" class="dialog-mask" @click.self="closeAttachmentDialog">
      <div class="dialog-card" role="dialog" aria-modal="true" aria-labelledby="attachment-dialog-title">
        <div class="dialog-header">
          <h3 id="attachment-dialog-title">添加 URL 附件</h3>
          <p>
            这是最小化的 file_url 示例。点击确认后，会把一个远程 PDF 链接通过 addAttachments 回填到当前聊天输入框。
          </p>
        </div>

        <div class="dialog-options">
          <div class="dialog-option selected">
            <span class="dialog-option-title">知识建模操作手册.pdf</span>
            <span class="dialog-option-desc">https://example.com/files/knowledge-modeling-manual.pdf</span>
          </div>
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

<style>
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f6f8fb;
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.layout-shell {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.theme-sidebar {
  position: sticky;
  top: 20px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
}

.theme-toolbar__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.theme-toolbar__content h2 {
  margin: 0 0 4px;
  font-size: 17px;
  color: #0f172a;
}

.theme-toolbar__content p {
  margin: 0;
  color: #64748b;
  line-height: 1.4;
  font-size: 12px;
}

.theme-switcher {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.theme-switcher__item {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 46px;
  padding: 8px 10px;
  border: 1px solid #dbe2ea;
  border-radius: 10px;
  background: #fff;
  color: #1f2937;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.theme-switcher__item:hover {
  border-color: #b9c7d8;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
  transform: translateY(-1px);
}

.theme-switcher__item.is-active {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.theme-switcher__label {
  flex: 0 0 auto;
  font-size: 13px;
  font-weight: 700;
}

.theme-switcher__desc {
  flex: 1;
  font-size: 11px;
  line-height: 1.3;
  color: #64748b;
  text-align: right;
}

.content-panel {
  min-width: 0;
}

.divider {
  display: flex;
  align-items: center;
  margin: 0 0 20px;
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
  height: calc(100vh - 180px);
  min-height: 620px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

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

.custom-thread-id {
  margin-bottom: 8px;
  font-size: 12px;
  color: #6b7280;
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
  color: #64748b;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.custom-attachment-trigger:hover {
  background: rgba(99, 102, 241, 0.12);
  color: #4338ca;
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

.dialog-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
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

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
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

@media (max-width: 960px) {
  .layout-shell {
    grid-template-columns: 1fr;
  }

  .theme-sidebar {
    position: static;
  }

  .theme-switcher {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .demo-container {
    height: 70vh;
    min-height: 580px;
  }
}

@media (max-width: 640px) {
  main {
    padding: 16px;
  }

  .theme-switcher {
    grid-template-columns: 1fr;
  }

  .demo-container {
    min-height: 540px;
  }
}
</style>
