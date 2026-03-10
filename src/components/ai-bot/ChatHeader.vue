<script setup lang="ts">
import { Maximize2Icon, Minimize2Icon } from 'lucide-vue-next'

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
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
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
  padding: 6px 12px;
  background: linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%);
  color: #333;
  flex-shrink: 0;
  border-bottom: 1px solid #e5e7eb;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.title-text {
  font-size: 13px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1px;
}

.action-btn {
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 4px 6px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background-color 0.15s;
}

.action-btn:hover {
  color: #333;
  background: rgba(0, 0, 0, 0.05);
}
</style>
