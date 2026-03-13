<script setup lang="ts">
import type { CustomContent } from './lib/message-types'
import { ArrowUpRight } from 'lucide-vue-next'

interface Props {
  customContent: CustomContent
  apiUrl: string
  threadId: string | null
}

const props = defineProps<Props>()

// 只处理 generated_files 类型
const files = props.customContent?.type === 'generated_files'
  ? props.customContent.content
  : null
</script>

<template>
  <div v-if="files && Array.isArray(files)" class="generated-files">
    <a
      v-for="(file, index) in files"
      :key="index"
      class="file-item"
      :href="`${props.apiUrl}/webapp/download/${props.threadId}?path=${encodeURIComponent(file)}`"
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{{ file }}</span>
      <ArrowUpRight class="file-icon" />
    </a>
  </div>
</template>

<style scoped>
.generated-files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.file-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 13px;
  color: #374151;
  background: #f3f4f6;
  border-radius: 9999px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.file-item:hover {
  background: #e5e7eb;
}

.file-item .file-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
</style>
