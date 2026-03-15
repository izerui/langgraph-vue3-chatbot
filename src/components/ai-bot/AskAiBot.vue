<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { AiBotPublicApi, AskAiBotPublicApi, AttachmentTriggerSlotProps } from './lib/input-types'
import type { ChatFile, CustomContent } from './lib/message-types'
import type { AiBotTheme } from './lib/theme'
import ChatBot from './ChatBot.vue'
import FloatButton from './FloatButton.vue'

const chatBotRef = ref<AiBotPublicApi | null>(null)

interface Props {
  assistantId?: string
  assistantName?: string
  defaultExpanded?: boolean
  systemPrompt?: string
  threadId?: string
  userId?: string
  suggestions?: string[]
  apiUrl?: string
  apiKey?: string
  width?: number | string
  height?: number | string
  theme?: AiBotTheme
}

const props = withDefaults(defineProps<Props>(), {
  assistantId: 'research',
  assistantName: 'Chat',
  defaultExpanded: false,
  systemPrompt: '用中文回答',
  userId: 'user001',
  suggestions: () => [],
  apiUrl: 'http://localhost:2024',
  apiKey: undefined,
  width: 400,
  height: 'calc(100vh - 90px)',
  theme: 'light'
})

defineSlots<{
  empty?: (props: { sendMessage: (message: string, files?: ChatFile[]) => void }) => any
  custom?: (props: { customContent: CustomContent, threadId: string | null }) => any
  'attachment-trigger'?: (props: AttachmentTriggerSlotProps) => any
}>()

const isExpanded = ref(props.defaultExpanded)
const isMaximized = ref(false)
const chatWidth = ref(typeof props.width === 'number' ? props.width : 500)
const isResizing = ref(false)

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
  if (!isExpanded.value) {
    isMaximized.value = false
  }
}

function handleMaximizeChange(value: boolean) {
  isMaximized.value = value
}

// 拖拽调整宽度
function startResize(e: MouseEvent) {
  e.preventDefault()
  isResizing.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

function handleResize(e: MouseEvent) {
  if (!isResizing.value) return
  const newWidth = window.innerWidth - e.clientX - 20
  chatWidth.value = Math.max(300, Math.min(1400, newWidth))
}

function stopResize() {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

async function ensureExpanded() {
  if (isExpanded.value) {
    return
  }
  isExpanded.value = true
  await nextTick()
}

const setTextInput: AskAiBotPublicApi['setTextInput'] = (text) => {
  chatBotRef.value?.setTextInput(text)
}

const addAttachments: AskAiBotPublicApi['addAttachments'] = (attachments) => {
  chatBotRef.value?.addAttachments(attachments)
}

const sendMessage: AskAiBotPublicApi['sendMessage'] = async () => {
  await ensureExpanded()
  await chatBotRef.value?.sendMessage()
}

defineExpose<AskAiBotPublicApi>({
  setTextInput,
  addAttachments,
  sendMessage,
})
</script>

<template>
  <div class="ask-ai-bot" :data-ai-theme="props.theme">
    <!-- 聊天窗口 -->
    <Transition name="slide-up">
      <div
        v-show="isExpanded"
        class="chat-window-container"
        :class="{ maximized: isMaximized }"
        :style="!isMaximized ? {
          width: typeof props.width === 'number' ? `${chatWidth}px` : props.width,
          height: typeof props.height === 'number' ? `${props.height}px` : props.height
        } : {}"
      >
        <ChatBot
          ref="chatBotRef"
          :api-url="apiUrl"
          :api-key="apiKey"
          :assistant-id="assistantId"
          :assistant-name="assistantName"
          :system-prompt="systemPrompt"
          :thread-id="threadId"
          :user-id="userId"
          :suggestions="suggestions"
          :theme="props.theme"
          @close="toggleExpanded"
          @update:is-maximized="handleMaximizeChange"
        >
          <!-- 透传插槽 -->
          <template #empty="slotProps">
            <slot name="empty" v-bind="slotProps" />
          </template>
          <template #custom="slotProps">
            <slot name="custom" v-bind="slotProps" />
          </template>
          <template #attachment-trigger="slotProps">
            <slot name="attachment-trigger" v-bind="slotProps" />
          </template>
        </ChatBot>
        <!-- 拖拽手柄 -->
        <div
          v-if="!isMaximized"
          class="resize-handle"
          @mousedown="startResize"
        />
      </div>
    </Transition>

    <FloatButton
      :is-expanded="isExpanded"
      @toggle="toggleExpanded"
    />
  </div>
</template>

<style scoped>
.ask-ai-bot {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 99;
}

.chat-window-container {
  position: fixed;
  top: 20px;
  right: 20px;
  transition: height 0.3s ease;
}

.chat-window-container.maximized {
  top: 20px;
  right: 20px;
  left: 20px;
  width: auto;
  height: calc(100vh - 40px);
}

/* 拖拽手柄 */
.resize-handle {
  position: absolute;
  top: 0;
  left: 0;
  width: 6px;
  height: 100%;
  cursor: ew-resize;
  background: transparent;
}

@media (max-width: 480px) {
  .chat-window-container {
    width: calc(100vw - 40px);
    height: 80vh;
    right: -10px;
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}
</style>
