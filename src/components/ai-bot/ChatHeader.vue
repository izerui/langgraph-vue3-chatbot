<script setup lang="ts">
import { Maximize2Icon, Minimize2Icon } from 'lucide-vue-next'

interface Props {
  title: string
  isMaximized: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  toggleMaximize: []
}>()
</script>

<template>
  <div class="chat-header">
    <div class="chat-title">
      <span class="title-text">{{ title }}</span>
    </div>
    <div class="header-actions">
      <button class="action-btn" @click="emit('toggleMaximize')" type="button" :title="isMaximized ? '还原' : '最大化'">
        <Minimize2Icon v-if="isMaximized" class="h-4 w-4" />
        <Maximize2Icon v-else class="h-4 w-4" />
      </button>
      <button class="action-btn" @click="emit('close')" type="button" title="关闭">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--primary);
  color: var(--primary-foreground);
  flex-shrink: 0;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-size: 14px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 4px;
  cursor: pointer;
  color: var(--primary-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
</style>
