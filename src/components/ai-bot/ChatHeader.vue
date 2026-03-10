<script setup lang="ts">
import { Maximize2Icon, Minimize2Icon, XIcon } from 'lucide-vue-next'

interface Props {
  title: string
  isMaximized: boolean
  showHeaderActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showHeaderActions: true
})

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
    <div v-if="props.showHeaderActions" class="header-actions">
      <button class="action-btn" @click="emit('toggleMaximize')" type="button" :title="isMaximized ? '还原' : '最大化'">
        <Minimize2Icon v-if="isMaximized" class="size-4" />
        <Maximize2Icon v-else class="size-4" />
      </button>
      <button class="action-btn" @click="emit('close')" type="button" title="关闭">
        <XIcon class="size-4" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  background: #f9fafb;
  color: #1f2937;
  flex-shrink: 0;
  border-bottom: 1px solid #e5e7eb;
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
  padding: 6px;
  cursor: pointer;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.action-btn:hover {
  color: #374151;
  background: #f3f4f6;
}
</style>
