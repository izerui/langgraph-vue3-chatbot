<script setup lang="ts">
import { ref } from 'vue'
import ChatBot from './ChatBot.vue'
import FloatButton from './FloatButton.vue'

interface Props {
  assistantId?: string
  assistantName?: string
  defaultExpanded?: boolean
  systemPrompt?: string
  threadId?: string
  userId?: string
}

const props = withDefaults(defineProps<Props>(), {
  assistantId: 'research',
  assistantName: 'Chat',
  defaultExpanded: false,
  systemPrompt: '用中文回答',
  userId: 'user001'
})

const isExpanded = ref(props.defaultExpanded)
const isMaximized = ref(false)

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
  if (!isExpanded.value) {
    isMaximized.value = false
  }
}

function handleMaximizeChange(value: boolean) {
  isMaximized.value = value
}
</script>

<template>
  <div class="ask-ai-bot">
    <!-- 聊天窗口 -->
    <Transition name="slide-up">
      <div v-show="isExpanded" class="chat-window-container" :class="{ maximized: isMaximized }">
        <ChatBot
          :assistant-id="assistantId"
          :assistant-name="assistantName"
          :system-prompt="systemPrompt"
          :thread-id="threadId"
          :user-id="userId"
          @close="toggleExpanded"
          @update:is-maximized="handleMaximizeChange"
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
  z-index: 9999;
}

.chat-window-container {
  position: fixed;
  top: 20px;
  right: 20px;
  width: max(300px, min(500px, calc(100vw - 40px)));
  height: calc(100vh - 90px);
  transition: all 0.3s ease;
}

.chat-window-container.maximized {
  top: 20px;
  right: 20px;
  left: 20px;
  width: auto;
  height: calc(100vh - 40px);
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
